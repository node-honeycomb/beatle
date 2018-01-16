import {encodeActionType, decodeActionType} from './actionType';
import Ajax from '../utils/ajax';
import isPlainObject from '../core/isPlainObject';
import isGenerator from './isGenerator';
import messages from '../core/messages';
import warning from 'fbjs/lib/warning';
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
export default function ({
  modelName,
  model,
  resource,
  initialState
}, seed) {
  const saga = seed._saga;
  const fetch = seed._ajax || new Ajax();

  model.ACTION_TYPE_IMMEDIATE = encodeActionType(modelName, '@@UPDATE_STATE');
  model._processors = {
    [model.ACTION_TYPE_IMMEDIATE]: (nextStore, state) => {
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

  const modelActions = {};
  const actions = model.actions;
  const actionKeys = Object.keys(actions);
  model.effects = model.effects || {};

  actionKeys.forEach((actionKey) => {
    if (Object.prototype.hasOwnProperty.call(actions, actionKey)) {
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
        actionCfg._processor = modelActions[actionKey] = (...args) => {
          return (dispatch) => {
            const actionName = {
              start: encodeActionType(modelName, actionKey, 'start'),
              success: encodeActionType(modelName, actionKey, 'success'),
              error: encodeActionType(modelName, actionKey, 'error')
            };

            dispatch({type: actionName.start, payload: {data: undefined, store: initialState, arguments: args, exec: exec}});

            return new Promise((resolve, reject) => {
              const errorCallback = function (error) {
                dispatch({type: actionName.error, error: true, payload: {data: undefined, store: initialState, arguments: args, message: error.message, exec: exec}});
                reject(error);
              };
              const successCallback = function (data) {
                dispatch({type: actionName.success, payload: {data: data, store: initialState, arguments: args, exec: exec}});
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
      } else {
        if (isGenerator(actionCfg)) {
          model.effects[actionKey] = actionCfg;

          actionCfg._processor = modelActions[actionKey] = (...args) => {
            return (dispatch) => {
              return dispatch({
                action: modelName + '.' + actionKey,
                arguments: args
              });
            };
          };
        } else {
          actionCfg._processor = modelActions[actionKey] = (...args) => {
            return (dispatch) => {
              if (typeof actionCfg === 'function') {
                const newDispatch = (action) => {
                  if (action.type) {
                    const [modelName, actionName] = decodeActionType(action.type);
                    if (!actionName || !model.actions[modelName]) {
                      action.type = encodeActionType(model.displayName, action.type);
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
                return actionCfg.apply(model, args.concat({
                  put: newDispatch,
                  select: (name, deep) => {
                    const state = seed.getStore().getState()[modelName];
                    warning(!state.hasOwnProperty || state.hasOwnProperty(name), messages.mergeWarning, 'select', name, modelName, 'Beatle.ReduxSeed');
                    return state[name] && state[name].asMutable({deep: deep});
                  }
                }));
              } else {
                // #! 同步action
                dispatch({
                  type: encodeActionType(modelName, actionKey),
                  payload: {
                    data: undefined,
                    arguments: args,
                    store: initialState
                  }
                });
                return Promise.resolve(undefined);
              }
            };
          };
        }
      }
    }
  });

  saga.effect(model);
  return modelActions;
}
