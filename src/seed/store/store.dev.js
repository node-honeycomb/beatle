import {createStore, applyMiddleware, compose} from 'redux';
/**
 * + redux的middleware，让dispatch支持actionCreator
 * > see: https://www.npmjs.com/package/redux-thunk
 */
import thunk from 'redux-thunk';
/**
 * + redux的middleware, 支持action日志打印到console控制台
 * > see: https://www.npmjs.com/package/redux-logger
 */
import {createLogger} from 'redux-logger';

import createSagaMiddleware from 'redux-saga/lib/internal/middleware';

// # 构建Redux的状态容器
// 在开发环境时，集成chrome的redux-devtool插件
export default function configureStore(initialState = {}, middlewares = [], reducerFactory = () => ({}), callback) {
  const rootReducer = reducerFactory();

  const sagaMiddleware = createSagaMiddleware();

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const enhancer = composeEnhancers(applyMiddleware(thunk, sagaMiddleware, createLogger({level: 'info', collapsed: true}), ...middlewares));

  const store = createStore(rootReducer, initialState, enhancer);
  store.runSaga = sagaMiddleware.run;
  callback && callback(store);

  return store;
}
