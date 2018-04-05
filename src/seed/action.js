import {encodeActionType, decodeActionType, typeToAction} from './actionType';
import Ajax from '../utils/ajax';
import isPlainObject from '../core/isPlainObject';
import isGenerator from './isGenerator';
import messages from '../core/messages';
import warning from 'fbjs/lib/warning';

export function setReducers(model, modelName, actionName, actionCfg, async) {
  const callback = actionCfg.reducer || actionCfg.callback || noop;
  let type;
  if (typeof callback === 'function') {
    if (async) {
      type = encodeActionType(modelName, actionName, 'success');
      model._reducers[type] = callback;
    } else {
      type = encodeActionType(modelName, actionName);
      model._reducers[type] = callback;
    }
  } else {
    for (let status  in callback) {
      if (typeof callback[status] === 'function') {
        type = encodeActionType(modelName, actionName, status);
        model._reducers[type] = callback[status];
      }
    }
  }
}
/**
 * # action构建器
 *
 * + 参数1: option
 *  * modelName - 数据模型的实例名
 *  * model - 数据模型
 *  * resource - 要映射的接口资源
 * + 参数2: fetch
 *  * 接口调用模块，不强制依赖于ajax
 */
export function getActions({
  modelName,
  model,
  resource,
  initialState
}, seed) {
  const saga = seed._saga;
  const fetch = seed._ajax || new Ajax();

  model.ACTION_TYPE_IMMEDIATE = encodeActionType(modelName, '@@UPDATE_STATE');
  model._reducers = model._reducers || {
    [model.ACTION_TYPE_IMMEDIATE]: (nextStore, state) => {
      // #! state = payload, 这是特殊处理
      const attrs = [];
      for (let key in state) {
        if (nextStore.hasOwnProperty && !nextStore.hasOwnProperty(key)) {
          attrs.push(key);
        }
        nextStore[key] = state[key];
      }
      warning(!attrs.length, messages.mergeWarning, 'update', attrs.join(','), modelName, 'Beatle.ReduxSeed');
      return nextStore;
    }
  };
  /**
   * ### 数据模型内的副作用
   *
   * > 数据模型内副作用中callback、reducer兼容
   * > 跨数据模型副作用中subscriptions，externalReducers兼容
   */
  // 把reducers提前注入进去
  for (let actionName in model.reducers) {
    setReducers(model, modelName, actionName, {reducer: model.reducers[actionName]});
  }
  const subscriptions = model.subscriptions || model.externalReducers;
  const externalReducerKeys = Object.keys(subscriptions || {});
  /**
   * ### 跨数据模型之间的副作用
   *
   * ```
   *  const ModalA = {
   *    displayName: 'modelA',
   *    ...
   *    actions: {
   *      getUser: {
   *        exec,
   *        callback
   *      }
   *    }
   *  }
   *  const ModelB = {
   *    ...
   *    subscriptions: {
   *      'modelA.getUser.success': (modelB_nextStore, modelA_getUser_payload) => {
   *        // 返回值会更新到ModelB的store， 如果是promise那么会接受最终处理值
   *      }
   *    }
   *  }
   *  const ModelC = {
   *    ...
   *    subscriptions: {
   *      'modelA.getUser.success': (modelC_nextStore, modelA_getUser_payload) => {
   *        // 返回值会更新到ModelB的store
   *      }
   *    }
   *  }
   * ```
   */
  externalReducerKeys.forEach((rk) => {
    let names = rk.split('.');
    let moduleName = names[0];
    let actionName = names[1];
    let statusName;
    let isAsyncAction = (names.length === 3);
    if (isAsyncAction) {
      statusName = names[2];
    }
    let type = '';
    if (!isAsyncAction) {
      type = encodeActionType(moduleName, actionName);
      model._reducers[type] = subscriptions[rk];
    } else {
      if (typeof subscriptions[rk] === 'function') {
        type = encodeActionType(moduleName, actionName, statusName);
        model._reducers[type] = subscriptions[rk];
      } else if (typeof subscriptions[rk] === 'object') {
        let reducer = subscriptions[rk];
        for (let status in reducer) {
          if (typeof reducer[status] === 'function') {
            type = encodeActionType(moduleName, actionName, status);
            model._reducers[type] = reducer[status];
          }
        }
      }
    }
  });

  const actions = model.actions || {};
  model._actions = model._actions || {};
  model.effects = model.effects || {};

  Object.keys(actions).forEach((actionKey) => {
    // 严格判断存在属性
    if (Object.prototype.hasOwnProperty.call(actions, actionKey)) {
      /**
       * ### action转为reducer后的执行逻辑
       *
       * action分2种，同步和异步的，区分取决于是否存在exec函数
       *
       * ```
       *  // 异步的action，在callback由3中状态的回调
       *  action = {
       *    exec,
       *    callback: {
       *      start,
       *      success,
       *      error
       *    }
       *  }
       *  // 同步action，callback及时回调函数
       *  action = {
       *    callback
       *  }
       * ```
       *
       * + 对于action调用时传参问题如何使用，可以参考下面同步action的使用（异步action也是如此）
       *
       * ```
       *  // 在组件中使用action
       *  this.props.action(1, 2);
       *  // action定义
       *  action = {
       *    callback: (nextStore, payload) => {
       *      // arguments = [1, 2];
       *      // payload = {data, arguments, type, store, message}
       *      nextStore.data = payload.arguments[0];
       *    }
       *  }
       * ```
       *
       * > payload是数据装载器，对于同步的action，data属性不会有值，data值只会接受异步action处理的结果值。arguments永远为action被调用时的传参
       */

      // 处理processor
      const actionCfg = actions[actionKey];
      if (actionCfg._processor) {
        return actionCfg._processor;
      }

      /**
       * ### Model联合Resource生成action
       *
       * 合并action的逻辑是：变量Resource，每个属性propName对应的值prop是一个接口调用配置或者函数，这个值会到Model.actions[propName]附加到exec属性中。并且都当做为异步action来处理
       *
       * ```
       *  // 异步步action，存在exec
       *  // 场景1：exec为接口配置
       *  {
       *    exec: {
       *      url,
       *      method,
       *      callback
       *    },
       *    calback: {
       *      start(){},
       *      success(){},
       *      error(){}
       *    }
       *  }
       *  // 场景1：exec为函数
       *  {
       *    exec: (data) => {
       *      return app.ajax({
       *        url: url,
       *        data: data.
       *        method: 'GET'
       *      })
       *    }
       *  }
       *  // 场景2： exec任意非纯对象
       *  {
       *    exec: Promise.resolve(1)
       *  }
       *  // 同步action
       *  {
       *   callback: (nextStore, payload) => {
       *   }
       *  }
       * ```
       *
       * > 实际上action的配置，只要存在exec属性，就认为是移动的action
       */
      const exec = actionCfg.exec || resource && resource[actionKey];
      if (exec) {
        // #! 异步action
        setReducers(model, modelName, actionKey, actionCfg, true);
        actionCfg._processor = model._actions[actionKey] = getProcessorByExec(model, initialState, modelName, actionKey, exec, fetch);
      } else {
        setReducers(model, modelName, actionKey, actionCfg);
        if (isGenerator(actionCfg)) {
          model.effects[actionKey] = actionCfg;

          actionCfg._processor = model._actions[actionKey] = getProcessorByGenerator(model, initialState, modelName, actionKey);
        } else {
          actionCfg._processor = model._actions[actionKey] = getProcessor(model, initialState, modelName, actionKey, actionCfg, () => seed.getStore().getState()[modelName]);
        }
      }
    }
  });

  // 存在effect时走saga
  saga.effect(model);
  return model._actions;
}

function noop() {}

export function getProcessorByExec(model, initialState, modelName, actionName, exec, fetch) {
  return (...args) => {
    return (dispatch) => {
      const statusMap = {
        start: encodeActionType(modelName, actionName, 'start'),
        success: encodeActionType(modelName, actionName, 'success'),
        error: encodeActionType(modelName, actionName, 'error')
      };

      dispatch({type: statusMap.start, payload: {data: undefined, store: initialState, arguments: args, exec: exec}});

      return new Promise((resolve, reject) => {
        const errorCallback = function (error) {
          dispatch({type: statusMap.error, error: true, payload: {data: undefined, store: initialState, arguments: args, message: error.message, exec: exec}});
          reject(error);
        };
        const successCallback = function (data) {
          dispatch({type: statusMap.success, payload: {data: data, store: initialState, arguments: args, exec: exec}});
          resolve(data);
        };

        let result;
        if (typeof exec === 'function') {
          result = exec.apply(model, args);
        } else if (isPlainObject(exec)) {
          // #! 保留之前的逻辑，这里是否继续优化
          const option = Object.assign({
            data: exec.data ? Object.assign({}, exec.data, args[0]) : args[0]
          }, args[1]);
          for (let key in option) {
            if (option[key] === undefined) {
              delete option[key];
            }
          }
          result = fetch.request(Object.assign({}, exec, option));
        } else {
          result = exec;
        }

        // #! is promise
        if (result && result.then) {
          result.then(successCallback, errorCallback);
        } else {
          successCallback(result);
        }

        return result;
      });
    };
  };
}

export function getProcessorByGenerator(model, initialState, modelName, actionName) {
  return (...args) => {
    return (dispatch) => {
      dispatch({
        action: typeToAction(modelName, actionName),
        arguments: args,
        store: initialState
      });
      return Promise.resolve(undefined);
    };
  };
}

export function getProcessor(model, initialState, modelName, actionName, func, getState) {
  return (...args) => {
    return (dispatch) => {
      if (typeof func === 'function') {
        const newDispatch = (action) => {
          if (action.type) {
            const [modelName, name] = decodeActionType(action.type);
            if (!name || !model.actions[modelName]) {
              // #! type指向model中的action
              action.type = encodeActionType(modelName, action.type);
            }
          } else {
            action = {
              type: model.ACTION_TYPE_IMMEDIATE,
              payload: action
            };
          }
          dispatch(action);
          return Promise.resolve(action.payload);
        };
        const result = func.apply(model, args.concat({
          put: newDispatch,
          select: (name, deep) => {
            const modelState = getState();
            warning(!modelState.hasOwnProperty || modelState.hasOwnProperty(name), messages.mergeWarning, 'select', name, modelName, 'Beatle.ReduxSeed');
            return Promise.resolve(modelState[name] && modelState[name].asMutable({deep: deep}));
          }
        }));
        if (result && result.then) {
          return result;
        } else {
          return Promise.resolve(result);
        }
      } else {
        // #! 同步action
        dispatch({
          type: encodeActionType(modelName, actionName),
          payload: {
            data: func && func.data,
            arguments: args,
            store: initialState
          }
        });
        return Promise.resolve(undefined);
      }
    };
  };
}
