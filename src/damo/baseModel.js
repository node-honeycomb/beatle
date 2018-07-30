/**
 * # Model基类
 * 1. 每个Model在Store中都存在modelName所对应的数据域，即通过state.modelName返回Model所对应的所有数据。
 * 2. Model的实现基于事件机制，方便绑定自定义事件
 */
import Ajax from '../utils/ajax';
import cloneDeep from 'lodash/cloneDeep';
import isPlainObject from '../core/isPlainObject';
import {getProcessor, getProcessorByExec, getProcessorByGenerator, setReducers} from '../seed/action';

// see: https://github.com/jayphelps/core-decorators
export const exec = (name, feedback) => (model, method, descriptor) => {
  const callback = descriptor.initializer ? descriptor.initializer() : descriptor.value;
  descriptor.initializer = undefined;
  descriptor.value = function (...args) {
    if (name) {
      if (feedback) {
        args.push(feedback);
      }
      return this.setState({
        [name]: {
          exec: method,
          callback: callback
        }
      }, ...args);
    } else {
      const promise = this.execute(method, callback, ...args);
      promise.then(ret => {
        if (feedback) {
          feedback(null, ret);
        }
        return ret;
      }, err => {
        feedback && feedback(err);
        return err;
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
      ret.then(() => {
        this.dispatch({
          type: this.ACTION_TYPE_IMMEDIATE,
          payload: this.state
        });
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
    this._defaultActions = option.actions || {};
    this._saga = option.saga;
  }

  _wrapperReducer(name, reducer, action) {
    if (isPlainObject(reducer)) {
      const map = {};
      for (let status in action.callback) {
        map[status] = (nextStore, payload) => {
          nextStore[name] = action.callback[status](nextStore, payload, this._initialState[name], nextStore[name], action);
        };
      }
      return map;
    } else {
      reducer = action.callback || reducer;
      return (nextStore, payload) => {
        nextStore[name] = reducer(nextStore, payload, this._initialState[name], nextStore[name], action);
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
            if (_callback.name === key) {
              nextState[key] = {
                callback: this._wrapperReducer(key, _callback, nextState[key])
              };
            } else if (this._defaultActions[_callback.name]) {
              nextState[key] = cloneDeep(this._defaultActions[_callback.name]);
              nextState[key].callback = this._wrapperReducer(key, _callback || getData, nextState[key]);
            } else {
              nextState[key] = {
                callback: _callback
              };
              nextState[key].callback = this._wrapperReducer(key, _callback, nextState[key]);
            }
          } else if (nextState[key].exec) {
            let _callback = nextState[key].callback;
            if (typeof nextState[key].exec === 'string') {
              if (this._defaultActions[nextState[key].exec]) {
                nextState[key] = cloneDeep(this._defaultActions[nextState[key].exec]);
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
        keys.forEach(key => {
          data[key] = datas[i++];
        });
      } else {
        data = datas[i];
      }

      if (callback) {
        callback(null, data);
      }
      return data;
    }, err => {
      callback && callback(err);
      return err;
    });

    return this.fromPromise(promise);
  }

  fromPromise(promise) {
    promise.subscribe = (callback) => {
      if (callback) {
        promise.then(res => {
          callback(null, res);
        }, callback);
      }
      return promise;
    };
    return promise;
  }

  execute(name, action, ...args) {
    if (!this._initialState) {
      this._initialState = cloneDeep(this.state);
    }
    if (this._defaultActions[name] && this.state[name] === undefined) {
      const _callback = action;
      action = cloneDeep(this._defaultActions[name]);
      action.callback = _callback || action.callback;
    }
    let processor;
    if (action.exec) {
      processor = getProcessorByExec(this, this._initialState, this._name, name, action.exec, this.ajax);
      setReducers(this, this._name, name, action, true);
    } else if (action.isGenerator) {
      processor = getProcessorByGenerator(this, this._initialState, this._name, name, this._saga);
      setReducers(this, this._name, name, action);
    } else {
      processor = getProcessor(this, this._initialState, this._name, name, action, () => {
        return this.state;
      });
      setReducers(this, this._name, name, action);
    }
    return processor.apply(this, args)(this.dispatch);
  }
}
