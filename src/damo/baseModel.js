/**
 * # Model基类
 * 1. 每个Model在Store中都存在modelName所对应的数据域，即通过state.modelName返回Model所对应的所有数据。
 * 2. Model的实现基于事件机制，方便绑定自定义事件
 */
import Ajax from '../utils/ajax';
import immutable from 'seamless-immutable';
import {getProcessor, getProcessorByExec, getProcessorByGenerator, setReducers} from '../seed/action';

function isPromise(obj) {
  return !!(obj && obj.then && obj.catch);
}

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

    this._actions = {};
    this._reducers = {};
    this._initialState = Object.assign({}, this.state);
  }

  setState(nextState, callback) {
    const promises = [];
    for (let key in nextState) {
      switch (true) {
        case nextState[key] !== undefined && immutable.isImmutable(nextState[key]):
          nextState[key] = {
            data: this._isImmutable ? nextState[key] : nextState[key].asMutable({deep: true}),
            name: key,
            callback: (nextState, payload) => {
              nextState[key] = payload.data;
              return this.state = nextState;
            }
          };
          break;
        case isPromise(nextState[key]):
          nextState[key] = {
            exec: nextState[key],
            name: key,
            callback: (nextState, payload) => {
              nextState[key] = payload.data;
              return this.state = nextState;
            }
          };
          break;
        default:
          nextState[key] = {
            name: key,
            data: nextState[key],
            callback: (nextState, payload) => {
              nextState[key] = payload.data;
              return this.state = nextState;
            }
          };
          break;
      }

      promises.push(this.execQuery(nextState[key]));
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

  execQuery(name, action) {
    if (typeof action === 'function') {
      const callback = action;
      action = Object.assign({}, this._defaultActions[name]);
      action.callback = callback;
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
    this._actions[name] = processor;
    return processor.apply(this, action.arguments)(this.dispatch);
  }
}
