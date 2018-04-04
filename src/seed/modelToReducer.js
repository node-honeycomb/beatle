import immutable from 'seamless-immutable';
import {encodeActionType} from './actionType';
import cloneDeep from 'lodash/cloneDeep';

function noop() {}

// # 数据模型转Reducer
export default function modelToReducer(model, initialState, isImmutable) {
  // #! 获取配置项
  const actions = model.actions;
  const actionKeys = Object.keys(actions);
  const processorMap = model._processors;
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
  actionKeys.forEach((actionKey) => {
    if (Object.prototype.hasOwnProperty.call(actions, actionKey)) {
      let actionCfg = actions[actionKey];
      if (actionCfg.exec) {
        /**
         * ### 数据模型内的副作用
         *
         * > 数据模型内副作用中callback、reducer兼容
         * > 跨数据模型副作用中subscriptions，externalReducers兼容
         */
        let callback = actionCfg.reducer || actionCfg.callback || noop;

        if (typeof callback === 'function') {
          callback = {
            success: callback
          };
        }

        if (callback.fail) {
          callback.error = callback.fail;
        }

        for (let reducerKey in callback) {
          if (typeof callback[reducerKey] !== 'function') return;
          let type = encodeActionType(model.displayName, actionKey, reducerKey);
          processorMap[type] = callback[reducerKey];
        }
      } else {
        let reducer;
        // #! 暂不支持action为函数
        if (actionCfg.callback) {
          if (typeof actionCfg.callback === 'function') {
            reducer = actionCfg.callback;
          } else {
            reducer = actionCfg.callback.success || noop;
          }
        } else {
          reducer = actionCfg.reducer || noop;
        }

        let type = encodeActionType(model.displayName, actionKey);
        processorMap[type] = reducer;
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
          processorMap[type] = subscriptions[rk];
        } else {
          if (typeof subscriptions[rk] === 'function') {
            type = encodeActionType(moduleName, actionName, statusName);
            processorMap[type] = subscriptions[rk];
          } else if (typeof subscriptions[rk] === 'object') {
            let reducer = subscriptions[rk];
            for (let reducerKey in reducer) {
              if (typeof reducer[reducerKey] !== 'function')
                return;
              type = encodeActionType(moduleName, actionKey, reducerKey);
              processorMap[type] = reducer[reducerKey];
            }
          }
        }
      });
    }
  });

  return function (store = initialState, action) {
    const processor = processorMap[action.type] || noop;
    let prevStore = null;

    if (immutable.isImmutable(store)) {
      prevStore = store.asMutable({deep: true});
    } else if (Object(store) === store) {
      prevStore = cloneDeep(store);
    } else {
      prevStore = store;
    }
    /**
     * ### 每个action的副作用的执行
     *
     * | 参数 | 参数类型
     * |: ------ |: ------ |
     * | prevStore | 当前可变的model数据 |
     * | paylaod | 数据装载对象，当前action函数执行的结果值会存到data中 |
     *
     * 这种方式其实并不友好，因为结果没法预测，redux中的要点是可预测结果的state。
     *
     * 而目前store直接交给副作用来填充，返回结果不可预测。也没有做校验，建议后期加上结构变更的校验。
     */
    let nextStore = processor(prevStore, action.payload);
    // 当有返回值时，用返回值作为新的state, 否则使用prevStore对象。
    if (nextStore === undefined) {
      nextStore = prevStore;
    }

    return isImmutable ? immutable(nextStore) : nextStore;
  };
}
