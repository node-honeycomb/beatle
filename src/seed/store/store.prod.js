import {createStore, applyMiddleware, compose} from 'redux';
/**
 * + redux的middleware，让dispatch支持actionCreator
 * > see: https://www.npmjs.com/package/redux-thunk
 */
import thunk from 'redux-thunk';

import createSagaMiddleware from 'redux-saga/lib/internal/middleware';

// # 构建Redux的状态容器
export default function configureStore(initialState = {}, middlewares = [], reducerFactory = () => ({}), callback) {
  const rootReducer = reducerFactory();

  const sagaMiddleware = createSagaMiddleware();

  const enhancer = compose(applyMiddleware(thunk, sagaMiddleware, ...middlewares));

  const store = createStore(rootReducer, initialState, enhancer);
  store.runSage = sagaMiddleware.run;
  callback && callback(store);

  return store;
}
