import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import immutable from 'seamless-immutable';
import propTypes from 'prop-types';

import warning from 'fbjs/lib/warning';
import messages from '../core/messages';

import {getActions} from './action';
import modelToReducer from './modelToReducer';
import configureStore from './store';
import extractModules from '../core/extractModules';
import Saga from './saga';
import BaseModel from '../damo/baseModel';

const reduxShape = {
  ajax: propTypes.object,
  initialState: propTypes.object,
  middlewares: propTypes.array,
  name: propTypes.string,
  Models: propTypes.oneOfType([propTypes.object, propTypes.func])
};

export default class ReduxSeed {
  static defaultApp = 'main';

  static multiCfgs = {};

  /**
   * ### 静态方法
   *
   * | 名称 | 参数类型 | 描述 |
   * | :------ | :------ | :------ |
   * | createModel | model `Object`, resource `Object` | 组合resource到model中，等同于Beatle.createModel |
   * | getRedux | name `String` | 获取指定的seed实例 |
   */
  static createModel(Model, Resource) {
    Model.actions = Model.actions || {};
    for (let key in Resource) {
      if (Model.actions[key]) {
        Model.actions[key].exec = Resource[key];
      } else if (Resource[key].name) {
        Model.actions[key] = {
          exec: Resource[key],
          callback: (nextStore, payload) => {
            nextStore[Resource[key].name] = payload.data;
          }
        };
      }
    }
    return Model;
  }

  static getRedux(name) {
    if (ReduxSeed.multiCfgs[name]) {
      return ReduxSeed.multiCfgs[name];
    } else {
      warning(false, messages.invalidValue, 'arguments', 'name', name, 'Beatle.ReduxSeed.getRedux', Object.keys(ReduxSeed.multiCfgs));
    }
  }

  /**
   * 初始化配置项
   *
   * | 属性 | 描述 | 默认 |
   * |:------ |:------ |:------ |
   * | name `String` | ReduxSeed支持多实例，初始化一个seed实例需要指定实例名称 | `main` |
   * | ajax `Object` | ajax实例 | N/A |
   * | initialState `Object` | store的基础结构 | `{}` |
   * | middlewares `Array` | 应用数据处理中间件，通过中间件可以变更数据结果 | `[]` |
   * | Models `Object` | 注册多个数据模型 | `{}` |
   */
  constructor(options = {}) {
    propTypes.checkPropTypes(reduxShape, options, 'ReduxSeedOptoins', 'Beatle.ReduxSeed');

    this._instanceName = options.name || ReduxSeed.defaultApp;
    this._ajax = options.ajax;
    this._saga = new Saga();
    this._isImmutable = options.initialState === undefined || immutable.isImmutable(options.initialState);
    this._init(this._instanceName);
    const initialState = this._isImmutable && options.initialState ? options.initialState.asMutable({deep: true}) : options.initialState;
    this._initStore(initialState, options.middlewares.concat(this._saga.getMiddleware(this.getModel.bind(this))), options.Models);
  }

  _init() {
    if (ReduxSeed.multiCfgs[this._instanceName]) {
      warning(false, messages.duplicate, 'initRedux', 'Beatle.ReduxSeed');
    } else {
      ReduxSeed.multiCfgs[this._instanceName] = {
        models: {},
        resources: {},
        store: null,
        rootReducer: {
          routing: routerReducer
        },
        actions: {}
      };
    }
  }

  _initStore(initialState, middlewares, Models) {
    configureStore(initialState, middlewares, () => {
      return this.reducerBuilder(Models);
    }, (store) => {
      const effects = this._saga.effect();
      for (let key in effects) {
        store.runSaga(effects[key]);
      }
      ReduxSeed.getRedux(this._instanceName).store = store;
    });
  }

  _setModel(redux, name, Model, Resource) {
    if (!redux.models[name]) {
      if (!Model.displayName) {
        Model.displayName = name;
      }
      if (Model.prototype instanceof BaseModel) {
        Model = new Model({
          name: Model.displayName,
          ajax: this._ajax,
          actions: Model.actions,
          isImmutable: this._isImmutable
        });
        Object.defineProperty(Model, 'dispatch', {
          get: () => {
            return this.getStore().dispatch;
          },
          enumerable: true,
          configurable: true
        });
      }
      const store = Model.state || Model.store;
      let initialState = this._isImmutable ? immutable(store) : store;

      redux.models[name] = Model;
      redux.actions[name] = getActions({
        modelName: name,
        model: Model,
        resource: Resource,
        initialState: initialState
      }, this);
      redux.rootReducer[name] = modelToReducer(Model, initialState, this._isImmutable);
      return store;
    }
  }

  get(name) {
    return ReduxSeed.getRedux(this._instanceName)[name];
  }
  /**
   * ### ReduxSeed的实例方法
   *
   * | 名称 | 参数类型 | 描述 |
   * | :------ | :------ | :------ |
   * | reducerBuilder | model `Object`, resource `Object` | 组合resource到model中，等同于Beatle.createModel |
   * | register | model `Object`, resource `Object` | 注册一个model到seed实例 |
   * | getActions | modelName `String` | 获取指定的seed实例下的model的行为，为空时获取所有行为 |
   */
  reducerBuilder(Models) {
    const redux = ReduxSeed.getRedux(this._instanceName);
    Models = Models && extractModules(Models);
    for (let name in Models) {
      this._setModel(redux, name, Models[name]);
    }

    return combineReducers(redux.rootReducer);
  }

  getStore() {
    return ReduxSeed.getRedux(this._instanceName).store;
  }

  getModel(name) {
    return ReduxSeed.getRedux(this._instanceName).models[name];
  }

  register(Model, Resource) {
    const name = Model.displayName;
    const redux = ReduxSeed.getRedux(this._instanceName);

    const initialState = this._setModel(redux, name, Model, Resource);

    if (initialState) {
      const rootReducer = combineReducers(redux.rootReducer);
      redux
        .store
        .replaceReducer(rootReducer);
      redux
        .store.runSaga(this._saga.effect(name));
      const allState = redux
        .store
        .getState();
      allState[name] = initialState;
    }
  }

  getActions(name) {
    const redux = ReduxSeed.getRedux(this._instanceName);
    if (name) {
      return redux.actions[name];
    } else {
      return redux.actions;
    }
  }
}
