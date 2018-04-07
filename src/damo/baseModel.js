/**
 * # Model基类
 * 1. 每个Model在Store中都存在modelName所对应的数据域，即通过state.modelName返回Model所对应的所有数据。
 * 2. Model的实现基于事件机制，方便绑定自定义事件
 */
import Ajax from '../utils/ajax';
import cloneDeep from 'lodash/cloneDeep';
import {getProcessor, getProcessorByExec, getProcessorByGenerator, setReducers} from '../seed/action';

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
    this._ajax = option.ajax || new Ajax();
    this._isImmutable = option.isImmutable;
    this._defaultActions = option.actions;
  }

  _wrapperReducer(name, reducer, action) {
    if (typeof action.callback === 'function') {
      reducer = action.callback || reducer;
      return (nextStore, payload) => {
        nextStore[name] = reducer(nextStore, payload, this._initialState[name], nextStore[name], action);
      };
    } else {
      const map = {};
      for (let status in action.callback) {
        map[status] = (nextStore, payload) => {
          nextStore[name] = action.callback[status](nextStore, payload, this._initialState[name], nextStore[name], action);
        };
      }
      return map;
    }
  }

  setState(nextState, ...args) {
    let callback;
    if (typeof args[0] === 'function') {
      callback = args[0];
      args = undefined;
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
            callback: this._wrapperReducer(key, getData, nextState[key])
          };
          break;
        case nextState[key] instanceof Promise:
          nextState[key] = {
            exec: nextState[key],
            callback: this._wrapperReducer(key, getData, nextState[key])
          };
          break;
        default:
          if (typeof nextState[key] === 'function') {
            const _callback = nextState[key];
            if (_callback.name === key) {
              nextState[key] = {
                callback: this._wrapperReducer(key, _callback, nextState[key])
              };
            } else {
              nextState[key] = cloneDeep(this._defaultActions[_callback.name]);
              nextState[key].callback = this._wrapperReducer(key, _callback || getData, nextState[key]);
            }
          } else if (nextState[key].exec) {
            let _callback;
            if (typeof nextState[key].exec === 'string') {
              if (this._defaultActions[nextState[key].exec]) {
                nextState[key] = cloneDeep(this._defaultActions[nextState[key].exec]);
              }
              delete nextState[key].exec;
              _callback = nextState[key].callback;
            } else {
              _callback = nextState[key].callback;
            }
            nextState[key].callback = this._wrapperReducer(key, _callback || getData, nextState[key]);
          } else {
            nextState[key] = {
              data: nextState[key],
              callback: this._wrapperReducer(key, getData, nextState[key])
            };
          }
          break;
      }
      nextState[key].cid = this.id || 'id';
      args.unshift(nextState[key]);
      args.unshift(nextState[key].name || key);
      promises.push(this.execute.apply(this, args));
    }

    const promise = Promise.all(promises);
    promise.then(datas => {
      const data = {};
      let i = 0;
      for (let key in nextState) {
        data[key] = datas[i++];
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
    let processor;
    if (action.exec) {
      processor = getProcessorByExec(this, this._initialState, this._name, name, action.exec, this._ajax);
      setReducers(this, this._name, name, action, true);
    } else if (action.isGenerator) {
      processor = getProcessorByGenerator(this, this._initialState, this._name, name);
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
