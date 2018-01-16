import getActionType from './getActionType';
import Ajax from '../utils/ajax';
import isPlainObject from '../core/isPlainObject';

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
}, fetch) {
  fetch = fetch || new Ajax();

  const modelActions = {};
  const actions = model.actions;
  const actionKeys = Object.keys(actions);

  actionKeys.forEach((actionKey) => {
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
            start: getActionType(modelName, actionKey, 'start'),
            success: getActionType(modelName, actionKey, 'success'),
            error: getActionType(modelName, actionKey, 'error')
          };

          dispatch({type: actionName.start, data: undefined, store: initialState, arguments: args, exec: exec});

          return new Promise((resolve, reject) => {
            const errorCallback = function (error) {
              dispatch({type: actionName.error, data: undefined, store: initialState, arguments: args, message: error.message, exec: exec});
              reject(error);
            };
            const successCallback = function (data) {
              dispatch({type: actionName.success, data: data, store: initialState, arguments: args, exec: exec});
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
      // #! 同步action
      actionCfg._processor = modelActions[actionKey] = (...args) => {
        return {
          type: getActionType(modelName, actionKey),
          data: undefined,
          arguments: args,
          store: initialState
        };
      };
    }
  });
  return modelActions;
}
