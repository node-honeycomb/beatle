import immutable from 'seamless-immutable';
import isPlainObject from 'lodash/isPlainObject';
import warning from 'fbjs/lib/warning';
import connect from '../base/connect';
import logMessages from '../core/messages';
import Injector from './injector';
import AsyncComponent from './asyncComponent';
import service from './service';
import BaseSelector from './baseSelector';
import BaseModel, {exec, action, observable, computed} from './baseModel';
import {EventEmitter} from 'events';
import isEqual from 'lodash/isEqual';
import {fromEvent} from 'rxjs/observable/fromEvent';
import crud from './crud';
import ReduxSeed from '../seed';

const emitter = new EventEmitter();
// #! 自增唯一标识
let increment = 0;
function guid(name) {
  return name + (++increment);
}

function getState(models, keys) {
  let state;
  let len = keys.length;
  try {
    if (len) {
      const model = models[keys[0]];
      if (model) {
        state = model.state;
        if (len === 1) {
          const newState = Object.assign(state, model._actions);
          state = {
            [keys[0]]: newState
          };
        } else {
          for (let i = 1; i < len; i++) {
            state = state[keys[i]] || model._actions[keys[i]];
          }
        }
      }
    } else {
      state = models['__pure_reducer__'].state;
    }
  } catch (e) {
    warning(false, logMessages.selectError, 'select', keys.join('.'), 'damo', 'Beatle');
    window.console.error(e);
  }
  return state;
}

const globalInjector = new Injector();

export default function enhanceBeatle(Beatle) {
  return class Damo extends Beatle {
    static crud = crud;
    static exec = exec;
    static action = action;
    static observable = observable;
    static computed = computed;
    static BaseModel = BaseModel;
    static BaseSelector = BaseSelector;
    static Injector = Injector;
    static AsyncComponent = AsyncComponent;

    constructor(opt = {}) {
      opt.injector = new Injector(opt && opt.providers);
      opt.globalInjector = globalInjector;
      super(opt);
    }

    /**
     * ### Beatle新增Api
     *
     * | 方法 | 参数类型 | 描述 |
     * |: ------ |: ------ |: ------ |
     * | serialize(obj) `Object` | obj `Object` | 序列化数据结构，此时数据为不可变 |
     * | deserialize(obj) `Object` | obj `Object` | 反序列化数据结构，以方便对数据进行更改 |
     * | observable(obj) `Observable` | obj `Object` | 把数据转变为可观察队列，通过Rxjs来做序列进行转换 |
     * | select(nestKey, isObservable) `Object` | nestKey `String`, isObservable `Boolean` | 直接从store中获取指定model下的数据, 可转为序列 |
     * | service(Selector: BaseSelector, Component: ReactComponent, Providers: Array) `Component` | N/A | 注册服务, 并绑定到组件 |
     * | view(Selector: BaseSelector, Component: ReactComponent, Providers: Array) `Component` | N/A | 封装组件，生成视图 |
     */
    serialize(obj) {
      return immutable(obj);
    }

    deserialize(obj, deep) {
      if (obj !== undefined && obj.asMutable) {
        return obj.asMutable({deep: deep});
      } else {
        return obj;
      }
    }

    observer(originData, Com) {
      if (Com) {
        return this.connect(originData, Com, isPlainObject(originData));
      }
      if (!originData) {
        originData = '';
      }
      if (typeof originData === 'function' || typeof originData === 'string') {
        // #! 这里有问题，要通过store.subscribe来实现
        const store = this.seed.get('store');
        const str = originData;
        let states = this.select(str);
        const eventName = guid('event');
        let unsubscribe;
        const trySubscribe = () => {
          unsubscribe && unsubscribe();
          unsubscribe = store.subscribe(() => {
            const _states = this.select(str);
            if (Array.isArray(states) && states.filter((state, index) => !isEqual(state, _states[index])).length || !isEqual(_states, states)) {
              // 第一次进来后，后续要判断新的变化才进来
              states = _states;
              emitter.emit(eventName, _states && _states.asMutable ? _states.asMutable({deep: true}) : _states);
              trySubscribe();
            }
          });
        };
        trySubscribe();
        originData = fromEvent(emitter, eventName);
        return AsyncComponent.observable(originData);
      } else {
        return AsyncComponent.observable(originData);
      }
    }

    select(keyStr) {
      const seed = ReduxSeed.getRedux(this._setting.seedName);
      const models = seed.models;
      let state;
      if (Array.isArray(keyStr)) {
        state = keyStr.map(str => {
          return getState(models, str.split('.'));
        });
      } else if (typeof keyStr === 'function') {
        state = keyStr(seed.store.getState());
      } else {
        state = getState(models, keyStr.split('.'));
      }
      return state;
    }

    service(providers, isGlobal) {
      let injector;

      if (typeof providers === 'string') {
        if (typeof isGlobal === 'function') {
          isGlobal.displayName = providers;
          providers = isGlobal;
          isGlobal = arguments[2];
        } else {
          // #! 获取指定服务
          injector = isGlobal ? globalInjector : this.injector;
          return injector.getService(providers);
        }
      }
      injector = isGlobal ? globalInjector : this.injector;
      if (!isPlainObject(providers)) {
        providers = [].concat(providers || []);
      }
      // #! 否则注入到全局服务中
      this.injector.setServices(providers);
    }

    view(selector, SceneComponent, providers, bindings, hookActions, props, getProps) {
      if (selector !== false) {
        if (selector && selector.prototype && selector.prototype.isReactComponent) {
          props = hookActions;
          hookActions = bindings;
          bindings = providers;
          providers = SceneComponent;
          SceneComponent = selector;
          selector = null;
        }
        // #! selector实例
        if (selector && selector.prototype instanceof BaseSelector) {
          selector.displayName = selector.displayName || guid('selector');
          selector = this.injector.instantiate(selector);
          selector.bindings = selector.bindings || bindings;
          selector.hookActions = selector.hookActions || hookActions;
        } else {
          if (Object(selector) === selector) {
            bindings = selector.bindings;
            hookActions = selector.hookActions;
          } else {
            bindings = bindings || selector;
          }
          selector = new BaseSelector();
          selector.bindings = [].concat(bindings || '');
          selector.hookActions = hookActions;
        }
        if (selector.bindings) {
          Object.assign(selector, this.toBindings(selector.bindings, selector.flattern, selector));
        }
        // #! 绑定组件, 连接到redux
        SceneComponent = connect(selector, this.dispatch.bind(this), props, getProps)(SceneComponent);
        // #! 额外注入context到组件中

        selector.getModel = (name) => {
          return this.model(name);
        };
      }

      return service(providers, SceneComponent, {
        injector: this.injector,
        globalInjector: globalInjector,
        selector: selector
      });
    }
  };
}
