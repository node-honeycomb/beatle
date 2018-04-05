import warning from 'warning';
import * as sagaEffects from 'redux-saga/effects';
import {
  takeEveryHelper,
  takeLatestHelper,
  throttleHelper,
} from 'redux-saga/lib/internal/sagaHelpers';
import logMessages from '../core/messages';
import {encodeActionType, decodeActionType, actionToType} from './actionType';

// ### saga类
// > see: https://github.com/dvajs/dva/blob/d74d3d7ce1dafeb5e9d009aae4307b305305b288/packages/dva-core/src/index.js
export default class Saga {
  constructor() {
    this._watchersMap = {};
    this._effects = {};
  }

  _wrapped(type, fn, payload) {
    if (this._watchersMap[type]) delete this._watchersMap[type];
    fn(payload);
  }

  _watch(type, resolve, reject) {
    this._watchersMap[type] = {
      resolve: this._wrapped.bind(this, type, resolve),
      reject: this._wrapped.bind(this, type, reject),
    };
  }

  getMiddleware(getModel) {
    return () => next => action => {
      if (action.action) {
        action.type = actionToType(action.action);
      }
      const [modelName, actionName] = decodeActionType(action.type);
      const model = getModel(modelName);
      if (model && actionName && model.effects[actionName]) {
        // 得出resolve 和 reject交付给saga，不再往下走
        return new Promise(this._watch.bind(this, action.type));
      } else {
        return next(action);
      }
    };
  }

  resolve(type, payload) {
    if (this._watchersMap[type]) {
      this._watchersMap[type].resolve(payload);
    }
  }

  reject(type, payload) {
    if (this._watchersMap[type]) {
      this._watchersMap[type].reject(payload);
    }
  }

  effect(model) {
    if (!arguments.length) {
      return this._effects;
    } else if (typeof model === 'string') {
      return this._effects[model];
    } else if (model.effects) {
      const self = this;
      model._emitter = this._createEffects(model);
      const effect = function* () {
        for (const key in model.effects) {
          const watcher = self._getWatcher(model, key, model.effects[key]);
          const task = yield sagaEffects.fork(watcher);
          yield sagaEffects.fork(function* () {
            yield sagaEffects.take(encodeActionType(model.displayName, '@@CANCEL_EFFECTS'));
            yield sagaEffects.cancel(task);
          });
        }
      };

      this._effects[model.displayName] = effect;
      return effect;
    }
  }

  // > see: https://redux-saga.js.org/docs/api/index.html#takepattern
  _createEffects(model) {
    function put(action) {
      if (action.type) {
        const [modelName, actionName] = decodeActionType(action.type);
        if (!actionName && !model.actions[modelName]) {
          action.type = encodeActionType(model.displayName, action.type);
        }
      } else {
        action = {
          type: model.ACTION_TYPE_IMMEDIATE,
          payload: action
        };
      }
      return sagaEffects.put(action);
    }
    function take(type) {
      warning(!type, logMessages.dispatchType, 'take(...)', 'Beatle.saga');
      if (type) {
        const [modelName, actionName] = decodeActionType(type);
        if (!actionName && !model.actions[modelName]) {
          type = encodeActionType(model.displayName, type);
        }
      }
      return sagaEffects.take(type);
    }

    return {...sagaEffects, put, take};
  }

  _getWatcher(model, actionName, action) {
    const self = this;
    let type = 'takeEvery';
    let ms;
    if (Array.isArray(action)) {
      const opts = action[1];
      action = action[0];
      if (opts && opts.type) {
        type = opts.type;
        if (type === 'throttle') {
          ms = opts.ms;
          warning(!ms, logMessages.throttle, 'interval', 'throttle', 'Beatle.Saga');
        }
      }
    }

    const sagaWithCatch = function* (option) {
      try {
        const args = option.arguments || [];
        yield sagaEffects.put({type: encodeActionType(model.displayName, actionName, 'start')});
        const result = yield action(...args.concat(model._emitter));
        yield sagaEffects.put({type: encodeActionType(model.displayName, actionName, 'success')});
        self.resolve(actionName, result);
      } catch (e) {
        yield sagaEffects.put({type: encodeActionType(model.displayName, actionName, 'error')});
        self.reject(actionName, e);
        window.console.error(e);
      }
    };

    const prefix = encodeActionType(model.displayName, actionName);
    const sgaWorkersMap = {
      // watcher: sagaWithCatch,
      takeEvery: function* () {
        yield takeEveryHelper(prefix, sagaWithCatch);
      },
      takeLatest: function* () {
        yield takeLatestHelper(ms, prefix, sagaWithCatch);
      },
      throttle: function* () {
        yield throttleHelper(prefix, sagaWithCatch);
      }
    };

    warning(!!sgaWorkersMap[type], logMessages.worker, Object.keys(sgaWorkersMap), 'Beatle.Saga');

    return sgaWorkersMap[type];
  }
}
