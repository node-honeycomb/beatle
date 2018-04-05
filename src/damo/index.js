import immutable from 'seamless-immutable';
import isPlainObject from 'lodash/isPlainObject';
import warning from 'fbjs/lib/warning';
import logMessages from '../core/messages';
import Injector from './injector';
import AsyncComponent from './asyncComponent';
import service from './service';
import BaseSelector from './baseSelector';
import BaseModel from './baseModel';

// #! 自增唯一标识
let increment = 0;
function guid(name) {
  return name + (++increment);
}

export default function enhanceBeatle(Beatle) {
  return class Damo extends Beatle {
    static BaseModel = BaseModel;
    static BaseSelector = BaseSelector;
    static Injector = Injector;
    static AsyncComponent = AsyncComponent;

    constructor(opt) {
      super(opt);

      // #! 初始化服务注入器，并注册全局服务
      this.injector = new Injector(opt && opt.providers);
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
      if (obj !== undefined && immutable.isImmutable(obj)) {
        return obj.asMutable({deep: deep});
      } else {
        return obj;
      }
    }

    observable(originData) {
      return AsyncComponent.observable(originData);
    }

    select(keyStr, isObservable) {
      const currentState = this.seed.get('store').getState();
      const keys = keyStr.split('.');
      let state;
      try {
        state = currentState;
        for (let i = 0, len = keys.length; i < len; i++) {
          state = state[keys[i]];
        }
      } catch (e) {
        warning(false, logMessages.selectError, 'select', keyStr, 'damo', 'Beatle-pro');
        window.console.error(e);
      }
      if (isObservable) {
        return this.observable(state);
      } else {
        return state;
      }
    }

    service(selector, BaseComponent, providers) {
      const injector = this.injector;
      // #! 获取指定服务
      if (typeof providers === 'string') {
        return injector.getService(providers);
      } else {
        if (!isPlainObject(providers)) {
          providers = [].concat(providers || []);
        }
        // #! 注入到组件的context
        if (BaseComponent) {
          // #! selector实例
          if (selector instanceof BaseSelector) {
            selector.displayName = selector.displayName || guid('selector');
            selector = injector.instantiate(selector, selector.displayName);
          }
          service(providers, BaseComponent, {
            injector: injector,
            selector: selector
          });
        } else {
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
    }

    view(selector, SceneComponent, providers) {
      // #! selector实例
      if (selector.prototype instanceof BaseSelector) {
        selector.displayName = selector.displayName || guid('selector');
        selector = this.injector.instantiate(selector, selector.displayName);
      } else {
        const models = [].concat[selector];

        selector = new BaseSelector();
        selector.dataBindings = models;
        selector.eventBindings = models;
        if (providers === true) {
          selector.flattern = true;
          providers = null;
        }
      }
      // #! 绑定组件, 连接到redux
      SceneComponent = this.connect(selector, SceneComponent, selector.flattern);
      // #! 额外注入context到组件中
      this.service(providers, SceneComponent, selector);

      return SceneComponent;
    }
  };
}
