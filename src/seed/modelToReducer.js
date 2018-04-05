import immutable from 'seamless-immutable';
import cloneDeep from 'lodash/cloneDeep';

function noop() {}

// # 数据模型转Reducer
export default function modelToReducer(model, initialState, isImmutable) {
  return function modelReducer(store = initialState, action) {
    const reducer = model._reducers[action.type] || noop;
    let prevStore = null;

    if (store !== undefined && immutable.isImmutable(store)) {
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
    let nextStore = reducer(prevStore, action.payload);
    // 当有返回值时，用返回值作为新的state, 否则使用prevStore对象。
    if (nextStore === undefined) {
      nextStore = prevStore;
    }

    return isImmutable ? immutable(nextStore) : nextStore;
  };
}
