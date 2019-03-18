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
import reducerImmediate from './reducerImmediate';
import forEach from 'lodash/forEach';
import crud from '../damo/crud';

const reduxShape = {
  ajax: propTypes.object,
  initialState: propTypes.object,
  middlewares: propTypes.array,
  name: propTypes.string,
  Models: propTypes.oneOfType([propTypes.object, propTypes.func])
};

let guid = 1;
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
    forEach(Resource, (exec, actionName) => {
      if (Model.actions[actionName]) {
        Model.actions[actionName].exec = exec;
      } else {
        Model.actions[actionName] = {
          exec: exec,
          callback: (nextStore, payload) => {
            return payload.data;
          }
        };
        if (Model.prototype instanceof BaseModel && !Model.prototype[actionName]) {
          Model.prototype[actionName] = function (...args) {
            const promise = this.execute(actionName, {exec: exec}, true, ...args);
            const feedback = exec.successMessage || exec.errorMessage ? crud.message(exec.sucMessage, exec.errMessage) : () => {};
            promise.then(ret => {
              feedback(null, ret);
            }, err => {
              feedback(err);
            });
            return this.fromPromise(promise);
          };
        }
      }
    });
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
    this._pureReducers = [];
    this._pureReducers.state = {};
    this._incrementReducerState = {
      __uuid__: guid
    };
    this._init(this._instanceName);
    const initialState = this._isImmutable && options.initialState ? options.initialState.asMutable({deep: true}) : options.initialState;
    this._initStore(initialState, options.middlewares.concat(this._saga.getMiddleware(this.getModel.bind(this))), options.Models);
  }

  increment() {
    this._incrementReducerState.__uuid__ = ++guid;
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

  _initStore(initialState = {}, middlewares, Models) {
    initialState['__pure_reducer__'] = this._pureReducers.state;
    initialState['__increment_reducer__'] = this._incrementReducerState;
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
          isImmutable: this._isImmutable,
          saga: this._saga
        });
        Model.actions = {};
      }
      Object.defineProperty(Model, 'dispatch', {
        get: () => {
          return this.getStore().dispatch;
        },
        enumerable: false
      });
      const store = Model.state = Model.state || Model.store || {};
      let initialState = this._isImmutable ? immutable(store) : store;

      redux.models[name] = Model;
      redux.actions[name] = getActions({
        modelName: name,
        model: Model,
        resource: Resource,
        initialState: initialState
      }, this);

      if (!Model.getAction) {
        Model.getAction = (name) => {
          if (name) {
            return (...args) => Model._actions[name].apply(Model, args)(this.getStore().dispatch);
          } else {
            const actions = {};
            for (let key in Model._actions) {
              actions[key] = (...args) => Model._actions[key].apply(Model, args)(this.getStore().dispatch);
            }
            return actions;
          }
        };
      }
      redux.rootReducer[name] = modelToReducer(Model, initialState, this._isImmutable);
      return store;
    }
  }

  get(name) {
    return ReduxSeed.getRedux(this._instanceName)[name];
  }

  subscribe(callback) {
    const redux = ReduxSeed.getRedux(this._instanceName);
    return redux.store.subscribe((() => callback(redux.store.getState())));
  }

  dispatch(action) {
    const redux = ReduxSeed.getRedux(this._instanceName);
    if (Object(action) === action && !action.type) {
      action.type = '__pure_reducer__';
    }
    return redux.store.dispatch(action);
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
    redux.rootReducer['__increment_reducer__'] = () => {
      return {
        __uuid__: this._incrementReducerState.__uuid__
      };
    };
    redux.rootReducer['__pure_reducer__'] = (nextStore = this._pureReducers.state, action) => {
      if (this._pureReducers.length) {
        const newStore = {};
        this._pureReducers.forEach(obj => {
          if (obj.name) {
            if (obj.name === action.name) {
              Object.assign(newStore, obj.reducer(nextStore, action.payload));
            }
          } else {
            Object.assign(newStore, obj.reducer(nextStore, action.payload));
          }
        });
        return reducerImmediate(nextStore, newStore, '');
      }
      return nextStore;
    };
    return combineReducers(redux.rootReducer);
  }

  getStore() {
    return ReduxSeed.getRedux(this._instanceName).store;
  }

  getModel(name) {
    return ReduxSeed.getRedux(this._instanceName).models[name];
  }

  register(Model, Resource) {
    const redux = ReduxSeed.getRedux(this._instanceName);
    if (typeof Model === 'object' || Model.prototype instanceof BaseModel) {
      const name = Model.displayName;
      const initialState = this._setModel(redux, name, Model, Resource);
      if (initialState) {
        const rootReducer = combineReducers(redux.rootReducer);
        redux
          .store
          .replaceReducer(rootReducer);
        const effects = this._saga.effect(name);
        if (effects) {
          redux.store.runSaga(effects);
        }
        const allState = redux
          .store
          .getState();
        allState[name] = initialState;
      }
    } else {
      if (typeof Model === 'function') {
        this._pureReducers.push({
          reducer: Model
        });
      } else if (typeof Model === 'string' && typeof Resource === 'function') {
        this._pureReducers.push({
          name: Model,
          reducer: Resource
        });
        if (arguments[2] !== undefined) {
          this._pureReducers.state[Model] = arguments[2];
        }
      }
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
