import React from 'react';
import PropTypes from 'prop-types';
import enhancleBeatle from './damo/index';
import Beatle from './base/beatle';
import {Link} from 'react-router-dom';
import Ajax from './utils/ajax';
import Poller from './utils/poller';
import ReduxSeed from './seed';
import modelChecker from './base/model';
import resourceChecker from './base/resource';
import warning from 'fbjs/lib/warning';
import messages from './core/messages';
import StateObserver from './seed/stateObserver';
/**
 * ### 提供Link标签，对react-router的Link标签做了Hoc
 *
 *  * 兼容原生Link的所有特性
 *  * 带上根路径和全局参数
 *
 * ```
 *  const app = new Beatle({
 *    query: {
 *      debug: true
 *    }
 *  })
 *  // 实际上跳转到/example/message?debug=true
 *  const Message = (props) => {
 *    return (<Beatle.Link to="/message">跳转</Beatle.Link>)
 *  }
 *  // 配置了路由
 *  app.route('/message', Message);
 *  // 设置跟路由
 *  app.run('example');
 * ```
 */
class BeatleLink extends React.PureComponent {
  static contextTypes = {
    app: PropTypes.object
  }
  render() {
    const props = this.props;
    const app = this.context.app;
    const route = typeof props.to === 'string' ? app.route(props.to) : null;
    let to = route && app.getResolvePath(route, true) || props.to;
    const query = Object.assign(props.query || {}, app._setting.query);
    const basePath = app.parent ? app.parent._setting.basePath : app._setting.basePath;
    const len = basePath.length;
    if (len && to.substr(0, len) === basePath) {
      to = to.slice(len);
    }
    const newProps = {
      to: {
        pathname: to,
        query: query,
        hash: props.hash,
        state: props.state
      }
    };
    // #! inherit Link props
    ['activeStyle', 'activeClassName', 'onlyActiveOnIndex', 'onClick', 'target', 'className', 'style'].forEach((key) => newProps[key] = props[key]);

    return (
      <Link {...newProps}>{props.children}</Link>
    );
  }
}

/**
 * ### 扩展Beatle静态属性
 *
 * ```
 * const app = new Beatle();
 * // 本身Beatle实例的方法
 * app.route(...)
 * app.model(...)
 * // 可直接通过Beatle来使用
 * Beatle.route(...)
 * Beatle.model(...)
 * // 前提Beatle调用值基于主应用的实例来触发方法
 * // 比如以下就不等同
 * const subApp = new Beatle({subApp: true});
 * subApp.route(...) != Beatle.route(...)
 * ```
 */
function mixinApiToStatic(ClassObj, appName) {
  const apiMethods = [
    'getStore',
    'getRoutes',
    'use',
    'getResolvePath',
    'route',
    'mount',
    'routesFactory',
    'model',
    'connect',
    'route',
    'toBindings',
    'run',
    'observer',
    'view'
  ];
  apiMethods.forEach(method => {
    ClassObj[method] = function (...args) {
      if (docorators[method] && this === undefined) {
        return docorators[method].call(BeatlePro, args[0]);
      } else {
        let app;
        let fireName;
        if (appName) {
          app = BeatlePro.instances[appName];
          fireName = appName;
        } else {
          app = BeatlePro.defaultApp;
          fireName = app ? app._setting.appName : '__anonymous__';
        }
        if (app) {
          return app[method].apply(app, args);
        } else {
          const callback = BeatlePro.toLazy((theApp) => {
            return theApp[method].apply(theApp, args);
          });
          BeatlePro.fireCallbacks[fireName] = BeatlePro.fireCallbacks[fireName] || [];
          BeatlePro.fireCallbacks[fireName].push(callback);
          return callback;
        }
      }
    };
  });
  return ClassObj;
}

Object.assign(Beatle, {
  /**
   * ### Beatle静态方法
   *
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | getApp(appName) `BeatleInstance`  | appName `String` | 传入实例名称，获取Beatle实例 |
   * | createModel(Model[, Resource]) | Model `Object`, Resource `Object`| 通过映射Resource来创建Model |
   *
   * > 其他静态方法，均为Beatle的开放Api，Api通过静态方法来调用，最终交给主应用来执行返回。
   * > 比如`Beatle.model(...)` 等同于 `Beatle.getApp(mainAppName).model(...)`
   */
  getApp(appName) {
    if (Beatle.instances[appName]) {
      return Beatle.instances[appName];
    } else {
      return mixinApiToStatic({}, appName);
    }
  },
  createModel(Model, Resource) {
    if (this !== BeatlePro) {
      // for decorator model
      // !TODO 可能有问题
      return docorators.createModel.call(Beatle, Model);
    } else {
      // #! 校验失败应该返回错误信息 see: https://github.com/facebook/prop-types/issues/142
      if (Model) {
        modelChecker(Model, 'model');
        if (Resource) {
          resourceChecker(Resource, 'resource');
          return ReduxSeed.createModel(Model, Resource);
        } else {
          return Model;
        }
      } else {
        warning(false, messages.invalidValue, 'arguments', 'Model', Model, 'Beatle.createModel', 'ModelShape');
      }
    }
  },
  toLazy(callback) {
    const fn = (theApp) => {
      return fn._result = callback(theApp);
    };
    fn._lazy = true;
    return fn;
  },
  fromLazy(fn, theApp) {
    if (fn._lazy) {
      if (fn._result) {
        return fn._result;
      } else {
        return fn(theApp);
      }
    } else {
      return fn;
    }
  },
  /**
   * ### mixin静态对象
   *
   * | 对象 | 描述 |
   * |: ------ |: ------ |
   * | Link | 路由跳转组件 |
   * | Ajax | 接口调用模块 |
   * | Poller | 轮询调用模块 |
   * | ReduxSeed | 专门处理Redux的模块 |
   *
   * > 其中`Ajax`, `Poller`, `ReduxSeed` 在你要支持多实例时将特别需要。
   */
  Ajax: Ajax,
  Poller: Poller,
  ReduxSeed: ReduxSeed,
  Link: BeatleLink,
  StateObserver: StateObserver
});

mixinApiToStatic(Beatle);

function getDecorator(fn) {
  return (option = {}) => BaseComponent => {
    let app = typeof option.app === 'string' ? Beatle.getApp(option.app) : option.app || Beatle.defaultApp;
    // if (!app) {
    //   warning(false, messages.appoint, name, 'Beatle');
    // }
    //  || Beatle
    return fn(app, option, BaseComponent);
  };
}

const docorators = {
  // decorator for connect
  connect: getDecorator((app, option, BaseComponent) => {
    if (typeof app === 'string') {
      app = Beatle.getApp(app);
    }
    return app.connect(option.bindings, BaseComponent, option.flattern);
  }),
  // docorator for model
  model: getDecorator((app, option, Model) => {
    if (typeof app === 'string') {
      app = Beatle.getApp(app);
    }
    return app.model(Model, option.Resource);
  }),
  // decorator for createModel
  createModel: (Resource) => Model => {
    return BeatlePro.createModel(Model, Resource);
  },
  // docorator for route
  route: getDecorator((app, option, BaseComponent) => {
    if (typeof app === 'string') {
      app = Beatle.getApp(app);
    }
    if (option.routeOptions) {
      BaseComponent.routeOptions = Object.assign(BaseComponent.routeOptions || {}, option.routeOptions);
    }
    return app.route(option.path, BaseComponent);
  }),
  // docorator for observer
  observer: getDecorator((app, option, BaseComponent) => {
    if (typeof app === 'string') {
      app = Beatle.getApp(app);
    }
    return app.observer(option.inject, BaseComponent);
  }),
  // decorator for view
  view: getDecorator((app, option, BaseComponent) => {
    if (typeof app === 'string') {
      app = Beatle.getApp(app);
    }
    return app.view(option.selector, BaseComponent, option.providers, option.bindings, option.hookActions, option.props, option.getProps, option.flattern);
  })
};

const BeatlePro = enhancleBeatle(Beatle);

['push', 'replace', 'go', 'goBack', 'goForward'].forEach(method => {
  BeatlePro.prototype[method] = function (path, state) {
    if (!this._activeHistory) return;
    if (typeof path === 'string') {
      const routeConfig = this.route(path);
      if (routeConfig) {
        path = this.getResolvePath(routeConfig);
      }
    }
    this._activeHistory[method](path, state);
  };
});

BeatlePro.prototype.version = '2.0.0-rc.24';
module.exports = BeatlePro;

export default BeatlePro;
