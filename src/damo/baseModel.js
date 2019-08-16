/**
 * # Model基类
 * 1. 每个Model在Store中都存在modelName所对应的数据域，即通过state.modelName返回Model所对应的所有数据。
 * 2. Model的实现基于事件机制，方便绑定自定义事件
 */
import Ajax from '../utils/ajax';
import cloneDeep from 'lodash/cloneDeep';
import isPlainObject from '../core/isPlainObject';
import crud from './crud';
import {getProcessor, getProcessorByExec, getProcessorByGenerator, setReducers} from '../seed/action';

function getReducer(reducer, curdOpt) {
  let callback;
  if (isPlainObject(reducer)) {
    callback = {};
    for (let key in reducer) {
      callback[key] = function (nextStore, payload, initialState, currentState, opt) {
        return reducer[key].call(this, nextStore, payload, initialState, currentState, curdOpt || opt);
      };
    }
  } else {
    callback = function (nextStore, payload, initialState, currentState, opt) {
      return reducer.call(this, nextStore, payload, initialState, currentState, curdOpt || opt);
    };
  }
  return callback;
}
// see: https://github.com/jayphelps/core-decorators
/**
 * curdOpt = {
 *  isGenarator,
 *  exec,
 *  id,
 *  processData
 * }
 */
export const exec = (name, feedback, curdOpt) => (model, actionName, descriptor) => {
  const reducer = descriptor.initializer ? descriptor.initializer() : descriptor.value;
  descriptor.initializer = undefined;
  descriptor.value = function (...args) {
    const action = this._actions[actionName];
    if (!feedback && action && (action.exec.successMessage || action.exec.errorMessage)) {
      feedback = crud.message(action.exec.successMessage, action.exec.errorMessage);
    }
    // #! exce(String) 走model.actionName调用并且更新数据到指定name属性
    if (typeof name === 'string') {
      if (feedback) {
        args.push(feedback);
      }
      if (curdOpt && curdOpt.exec || action) {
        return this.setState({
          [name]: {
            exec: curdOpt && curdOpt.exec || actionName,
            callback: getReducer(reducer, curdOpt)
          }
        }, ...args);
      } else {
        return this.setState({
          [name]: new Promise(resolve => resolve(isPlainObject(reducer) ? reducer : getReducer(reducer, curdOpt).apply(this, args)))
        }, ...args);
      }
    } else if (name !== undefined) {
      // #! exec(null|false)
      let action = curdOpt || {};
      if (action.exec) {
        action.callback = getReducer(reducer, curdOpt);
      } else {
        action = getReducer(reducer, curdOpt);
      }
      // #! name === false 则只走model.actionName调用不更新数据，否则是根据返回结构更新数据
      const promise = this.execute(actionName, action, name === false, ...args);
      promise.then(ret => {
        if (feedback) {
          if (ret instanceof Error) {
            feedback(ret);
          } else {
            feedback(null, ret);
          }
        }
      }, err => {
        feedback && feedback(err);
      });
      return this.fromPromise(promise);
    }
  };
  return descriptor;
};

export const observable = (target, name, descriptor) => {
  target.state = target.state || {};
  target.state[name] = descriptor.initializer.call(target);
  return {
    set(v) {
      this.state[name] = v;
    },
    enumerable: false
  };
};

export const computed = (target, name, descriptor) => {
  target.state = target.state || {};
  const method = descriptor.get;
  Object.defineProperty(target.state, name, {
    get() {
      return method.call(target);
    },
    enumerable: true,
    configuration: true
  });
  return descriptor;
};


export const action = (target, name, descriptor) => {
  const method = descriptor.value;
  descriptor.value = function (...args) {
    const ret = method.apply(this, args);
    if (ret && ret.then) {
      ret.then((ret) => {
        if (!(ret instanceof Error)) {
          this.dispatch({
            type: this.ACTION_TYPE_IMMEDIATE,
            payload: this.state
          });
        }
      }, () => {
        // handler
      });
    } else {
      this.dispatch({
        type: this.ACTION_TYPE_IMMEDIATE,
        payload: this.state
      });
    }
  };
  return descriptor;
};

export default class BaseModel {
  /**
   * option = {
   *  name,
   *  ajax,
   *  isImmutable
   * }
   */
  constructor(option = {}) {
    this._name = option.name;
    this.ajax = option.ajax || new Ajax();
    this._isImmutable = option.isImmutable;
    this._actions = option.actions || {};
    this._saga = option.saga;
  }

  _wrapperReducer(name, reducer, action) {
    if (isPlainObject(reducer)) {
      const map = {};
      for (let status in reducer) {
        map[status] = (nextStore, payload) => {
          nextStore[name] = reducer[status].call(this, nextStore, payload, this._initialState[name], this.state[name], action);
        };
      }
      return map;
    } else {
      reducer = action.callback || reducer;
      return (nextStore, payload) => {
        nextStore[name] = reducer.call(this, nextStore, payload, this._initialState[name], this.state[name], action);
      };
    }
  }

  setState(nextState, ...args) {
    let callback;
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.pop();
    }
    const promises = [];
    const getData = (nextState, payload) => {
      return payload.data;
    };
    for (let key in nextState) {
      switch (true) {
        case nextState[key] !== undefined && nextState[key].asMutable:
          nextState[key] = {
            data: this._isImmutable ? nextState[key] : nextState[key].asMutable({deep: true}),
            callback: this._wrapperReducer(key, getData, {})
          };
          break;
        case !!(nextState[key] && nextState[key].then):
          nextState[key] = {
            exec: nextState[key],
            callback: this._wrapperReducer(key, getData, {})
          };
          break;
        default:
          if (typeof nextState[key] === 'function') {
            const _callback = nextState[key];
            // nextState[key] = crudOpt
            if (_callback.name === key) {
              nextState[key] = {
                callback: this._wrapperReducer(key, _callback, nextState[key])
              };
            } else if (this._actions[_callback.name]) {
              nextState[key] = cloneDeep(this._actions[_callback.name]);
              nextState[key].callback = this._wrapperReducer(key, _callback || getData, nextState[key]);
            } else {
              nextState[key] = {
                callback: _callback
              };
              nextState[key].callback = this._wrapperReducer(key, _callback, nextState[key]);
            }
            // nextState[key] = crudOpt
          } else if (nextState[key].exec) {
            let _callback = nextState[key].callback;
            if (typeof nextState[key].exec === 'string') {
              if (this._actions[nextState[key].exec]) {
                nextState[key] = cloneDeep(this._actions[nextState[key].exec]);
              }
              _callback = _callback || nextState[key].callback;
              delete nextState[key].callback;
            }
            nextState[key].callback = this._wrapperReducer(key, _callback || getData, nextState[key]);
          } else {
            nextState[key] = {
              data: nextState[key],
              callback: this._wrapperReducer(key, getData, {})
            };
          }
          break;
      }
      nextState[key].cid = this.id || 'id';
      args.unshift(false);
      args.unshift(nextState[key]);
      args.unshift(nextState[key].name || key);
      promises.push(this.execute.apply(this, args));
    }

    let promise = Promise.all(promises);
    promise = promise.then(datas => {
      const keys = Object.keys(nextState);
      let data;
      let i = 0;
      if (keys.length > 1) {
        data = {};
        for (let len = keys.length; i < len; i++) {
          if (datas[i] instanceof Error) {
            data = datas[i];
            break;
          } else {
            data[keys[i]] = datas[i];
          }
        }
      } else {
        data = datas[i];
      }

      if (callback) {
        if (data instanceof Error) {
          callback(data);
        } else {
          callback(null, data);
        }
      }
      return data;
    }, err => {
      callback && callback(err);
    });

    return this.fromPromise(promise);
  }

  fromPromise(promise) {
    promise.subscribe = (callback) => {
      if (callback) {
        promise.then(res => {
          if (res instanceof Error) {
            callback(res);
          } else {
            callback(null, res);
          }
        }, callback);
      }
      return promise;
    };
    return promise;
  }

  /**
   * action可以是function
   * action或者是对象 = {
   *  callback,
   *  exec, // 接口调用的描述，afterResponse可以对数据预处理
   *  isGenerator
   * }
   */
  execute(name, action, noDispatch, ...args) {
    if (!this._initialState) {
      this._initialState = cloneDeep(this.state);
    }
    if (this._actions[name] && this.state[name] === undefined && !action.exec) {
      const _callback = action;
      action = cloneDeep(this._actions[name]);
      action.callback = _callback || action.callback;
    }
    let processor;
    let async;
    if (action.exec) {
      processor = getProcessorByExec(this, this._initialState, this._name, name, action.exec, this.ajax, noDispatch);
      async = true;
    } else if (action.isGenerator) {
      processor = getProcessorByGenerator(this, this._initialState, this._name, name, this._saga, noDispatch);
    } else {
      processor = getProcessor(this, this._initialState, this._name, name, action, () => {
        return this.state;
      }, noDispatch);
    }
    if (!noDispatch) {
      setReducers(this, this._name, name, action, async);
    }
    return processor.apply(this, args)(this.dispatch);
  }
}
