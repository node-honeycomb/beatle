import immutable from 'seamless-immutable';
import isPlainObject from 'lodash/isPlainObject';
import warning from 'fbjs/lib/warning';
import connect from '../base/connect';
import logMessages from '../core/messages';
import Injector from './injector';
import AsyncComponent from './asyncComponent';
import service from './service';
import BaseSelector from './baseSelector';
import BaseModel from './baseModel';
import {EventEmitter} from 'events';
import {Observable} from 'rxjs/Observable';
import crud from './crud';

const emitter = new EventEmitter();
// #! 自增唯一标识
let increment = 0;
function guid(name) {
  return name + (++increment);
}

function getState(currentState, keys) {
  let state;
  try {
    state = currentState;
    for (let i = 0, len = keys.length; i < len; i++) {
      state = state[keys[i]];
    }
  } catch (e) {
    warning(false, logMessages.selectError, 'select', keys.join('.'), 'damo', 'Beatle-pro');
    window.console.error(e);
  }
  return state;
}

const globalInjector = new Injector();

export default function enhanceBeatle(Beatle) {
  return class Damo extends Beatle {
    static crud = crud;

    static BaseModel = BaseModel;
    static BaseSelector = BaseSelector;
    static Injector = Injector;
    static AsyncComponent = AsyncComponent;

    constructor(opt) {
      opt.injector = new Injector(opt && opt.providers);
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

    observable(originData) {
      return AsyncComponent.observable(originData);
    }

    select(keyStr, isObservable) {
      const store = this.seed.get('store');
      const currentstate = store.getState();
      const keys = keyStr.split('.');
      const state = getState(currentstate, keys);
      if (isObservable) {
        // #! 这里有问题，要通过store.subscribe来实现
        const eventName = guid('event');
        store.subscribe(() => {
          const _state = getState(store.getState(), keys);
          if (_state !== state) {
            emitter.emit(eventName, _state.asMutable ? _state.asMutable({deep: true}) : _state);
          }
        });
        return this.observable(Observable.fromEvent(emitter, eventName));
      } else {
        return state;
      }
    }

    service(providers, isGlobal) {
      const injector = isGlobal ? globalInjector : this.injector;
      // #! 获取指定服务
      if (typeof providers === 'string') {
        return injector.getService(providers);
      } else {
        if (!isPlainObject(providers)) {
          providers = [].concat(providers || []);
        }
        // #! 否则注入到全局服务中
        if (Array.isArray(providers)) {
          this
            .injector
            .setServices(providers);
        } else {
          this
            .injector
            .setServices(Object.keys(providers).map(key => {
              providers[key].displayName = providers[key].displayName || key;
              return providers[key];
            }));
        }
      }
    }

    view(selector, SceneComponent, providers) {
      // #! selector实例
      if (selector.prototype instanceof BaseSelector) {
        selector.displayName = selector.displayName || guid('selector');
        selector = this.injector.instantiate(selector, selector.displayName);
        if (selector.bindings) {
          Object.assign(selector, this.toBindings(selector.bindings));
        }
      } else {
        selector = new BaseSelector();

        Object.assign(selector, this.toBindings([].concat[selector]));
      }
      // #! 绑定组件, 连接到redux
      SceneComponent = connect(selector, this.dispatch.bind(this))(SceneComponent);
      // #! 额外注入context到组件中

      selector.getModel = (name) => {
        return this.model(name);
      };

      return service(providers, SceneComponent, {
        injector: this.injector,
        selector: selector
      });
    }
  };
}
