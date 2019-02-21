/**
 * # Beatle是什么
 *
 * Beatle是一套基于状态管理机制构建用户界面的框架。采用自底向上增量开发的设计。Beatle 的核心库关注视图结构和视图状态。同时Beatle借助一些前端优秀设计方案，帮你在开发前端应用时节省下大量时间。
 */
import React from 'react';
import ReactDOM from 'react-dom';
import propTypes from 'prop-types';
import {Router, browserHistory, hashHistory} from 'react-router';
import useBasename from 'history/lib/useBasename';
import createMemoryHistory from 'react-router/lib/createMemoryHistory';
import useRouterHistory from 'react-router/lib/useRouterHistory';
// import createRouterHistory from 'react-router/lib/createRouterHistory';
import _get from 'lodash/get';
import warning from 'fbjs/lib/warning';
import messages from '../core/messages';

import isPlainObject from '../core/isPlainObject';
import extractModules from '../core/extractModules';
import ReduxSeed from '../seed';
import connect from './connect';
import route from './route';
import modelChecker from './model';
import getProvider from './provider';
import Ajax from '../utils/ajax';

/**
 * ### 应用初始化依赖的配置项
 *
 * | 属性 | 描述 | 默认 |
 * |: ------ |: ------ |: ------ |
 * | name `String` | 应用实例名 | `app` |
 * | store `Object` | 应用数据中心的初始化数据 | `{}` |
 * | middlewares `Array` | 应用数据处理中间件，通过中间件可以变更数据结果 | `[]` |
 * | ajax `Object` | 应用接口请求对象初始化依赖的配置项 | `{}` |
 * | root `DOM` | 应用唯一挂载的DOM树节点 | `document.body` |
 * | base `String` | 应用启动，路由访问的根路径 | N/A |
 * | query `Object` | 设置路由全局参数 | N/A |
 * | autoLoadModel `Boolean` | 是否自动加载数据模型，如果开启则加载`assets/auto_models.js`文件 | `true` |
 * | autoLoadRoute `Boolean` | 是否自动加载路由，如果开启则加载`assets/auto_routes.js`文件 | `false` |
 * | models `Object︱Function︱Context` | 需要注册的数据模型 | N/A |
 * | routes `Object︱Function︱Context` | 需要注册的路由 | N/A |
 * | routeType `Boolean` | 路由处理器类型，主要分为hash还是原生 | `browserHistory` |
 * | subApp `Boolean` | 是否为子应用 | `false` |
 */
const beatleShape = {
  name: propTypes.string,
  store: propTypes.object,
  middlewares: propTypes.array,
  ajax: propTypes.object,
  root: propTypes.object,
  base: propTypes.string,
  env: propTypes.object,
  autoLoadModel: propTypes.bool,
  autoLoadRoute: propTypes.bool,
  models: propTypes.oneOfType([propTypes.object, propTypes.func, propTypes.array]),
  routes: propTypes.oneOfType([propTypes.object, propTypes.func, propTypes.array]),
  routeType: propTypes.oneOfType([propTypes.object, propTypes.string])
};
const SEP = '/';
function createRouterHistory(createHistory) {
  let canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);
  let history = void 0;
  if (canUseDOM) {
    history = useRouterHistory(createHistory)({
      entries: [{
        pathname: window.location.pathname,
        search: window.location.search
      }]
    });
  }
  return history;
}
const historys = {
  localHistory: createRouterHistory(createMemoryHistory),
  hashHistory: hashHistory,
  browserHistory: browserHistory
};
export default class Beatle {
  // #! 静态属性不对外开放，包括未初始化时的函数列表、默认应用实例、所有实例。
  static fireCallbacks = {};
  static defaultApp = null;
  static instances = {};

  constructor(options = {}) {
    propTypes.checkPropTypes(beatleShape, options, 'BeatleOptions', 'Beatle');

    // #! 配置项初始化
    const name = options.name || 'app';
    this._setting = {
      basePath: options.base || '',
      query: options.env,
      appName: name,
      seedName: name + new Date().getTime(),
      rootDom: options.root || document.body,
      routes: [],
      routesMap: {},
      history: Object(options.routeType) === options.routeType ? options.routeType : historys[options.routeType] || historys.browserHistory
    };
    this._middlewares = [];
    this.seed = null;
    this.ajax = null;
    this._hasRendered = false;
    this.injector = options.injector;
    this.globalInjector = options.globalInjector;

    Beatle.instances[this._setting.appName] = this;
    if (!options.subApp) {
      Beatle.defaultApp = this;
      Beatle.fireCallbacks[this._setting.appName] = (Beatle.fireCallbacks['__anonymous__'] || []).concat(Beatle.fireCallbacks[this._setting.appName] || []);
      delete Beatle.fireCallbacks['__anonymous__'];
    }

    // #! 初始化依赖模块
    this._init(options);

    this._fireReady();
  }

  _fireReady() {
    /**
     * + 对于主应用，可以直接使用Beatle来使用应用实例的公开方法。
     *
     * ```
     *  // 设置数据模型
     *  Bealte.model(...)
     *  // 设置路由
     *  Beatle.route(...)
     *  // 以上还没有初始化应用, 而model和roue都是应用实例的方法，当应用实例不存在时会先注册到懒函数队列。
     *  const app = new Beatle({
     *    // 关键点在于设置main为true，表示当前应用是主应用
     *    main: true
     *  });
     *  app.model(...)
     *  app.run();
     * ```
     */
    // #! 触发注册的callback
    const callbacks = Beatle.fireCallbacks[this._setting.appName];
    if (callbacks) {
      for (let i = 0, len = callbacks.length; i < len; i++) {
        callbacks[i](this);
      }
    }
  }

  static autoLoad = {};
  /**
   * ### 初始化依赖模块
   *
   * 1. 自动加载数据模型
   * 2. 自动加载路由
   * 3. 初始化ajax模块
   * 4. 初始化redux模块，并装载Beatle的中间件
   */
  _init(options) {
    // #! 自动加载数据模型
    let Models;
    if (options.models) {
      Models = options.models;
    } else if (options.autoLoadModel && Beatle.autoLoad.loadModels) {
      try {
        // #! 不能用require，因为查找不到编译就报错了，无法完整编译整个应用。
        Models = Beatle.autoLoad.loadModels();
      } catch (x) {
        window.console.error(x);
      }
    }

    if (!options.ajax || isPlainObject(options.ajax)) {
      this.ajax = new Ajax(options.ajax);
    } else if (options.ajax) {
      this.ajax = options.ajax;
    }

    const middlewares = options.middlewares || [];
    middlewares.push(this._getMiddleWareFactory());
    this.seed = new ReduxSeed({name: this._setting.seedName, initialState: options.store, middlewares: middlewares, Models: Models, ajax: this.ajax});

    // #! 自动加载路由
    if (options.autoLoadRoute && Beatle.autoLoad.loadRoutes) {
      try {
        this.routesFactory(Beatle.autoLoad.loadRoutes(), options);
      } catch (x) {
        window.console.error(x);
      }
    }
    if (options.routes) {
      this.setRoutes(options.routes, false, null, options);
    }

    Object.assign(this.injector._services, {
      ajax: this.ajax,
      app: this,
      seed: this.seed
    });
  }

  get appName() {
    return this._setting.appName;
  }

  get basename() {
    return this._setting.basePath;
  }

  /**
   * ### 内部的方法，不对外开放
   *
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | _getMiddleWareFactory() `void` | N/A | 构建一个redux中间件，把所有Beatle的中间组装进去 |
   * | _withBasename(basePath) `Object` | basePath `String` | 生成带有根路径的路由处理对象 |
   * | parseRoute(routeConfig) `Object` | routeConfig `Object` | 处理路由，app转路由也在这处理，并且添加到routesMap |
   */

  _getMiddleWareFactory() {
    return (store) => (next) => (action) => {
      const callback = (nextAction) => {
        if (nextAction instanceof Error) {
          throw nextAction;
        }
        const middleware = this._middlewares[callback.pos++];
        if (middleware) {
          middleware(nextAction, callback, store.dispatch);
        } else {
          next(nextAction);
        }
      };
      callback.pos = 0;
      callback(action);
    };
  }

  _withBasename(basePath) {
    if (basePath) {
      if (basePath[0] !== SEP) {
        basePath = SEP + basePath;
      }
      return useBasename(() => this._setting.history)({basename: basePath});
    } else {
      return this._setting.history;
    }
  }
  _parsePath(path, name) {
    if (path) {
      path = path.replace('/:name', '/' + name);
    } else {
      path = name;
    }
    return path;
  }
  _convertAppToComponent(appComponent, basePath, routeType) {
    const self = this;
    if (!appComponent.parent) {
      appComponent.parent = self;
      const baseName = basePath[0] === '/' ? basePath : self._setting.basePath + SEP + basePath;
      appComponent._setting.history = Object(routeType) === routeType ? routeType : historys[routeType] || appComponent._setting.history;
      let key;
      let _routeCfg;
      // 相同路由下增加路径
      if (self._setting.history === appComponent._setting.history) {
        appComponent._setting.basePath = ''; // this._setting.basePath;
        appComponent.parent = self;
        for (key in appComponent._setting.routesMap) {
          _routeCfg = appComponent._setting.routesMap[key];
          // delete _routeCfg.resolvePath;
          if (_routeCfg.path && _routeCfg.path.indexOf('http') !== 0) {
            if (_routeCfg.path === SEP) {
              _routeCfg.path = basePath;
              _routeCfg.resolvePath = baseName;
            } else {
              if (_routeCfg.path[0] === SEP) {
                _routeCfg.path = basePath + _routeCfg.path;
                _routeCfg.resolvePath = baseName + _routeCfg.resolvePath;
                if (_routeCfg.path[0] !== SEP) {
                  _routeCfg.path = SEP + _routeCfg.path;
                }
              } else {
                _routeCfg.path = baseName + SEP + _routeCfg.path;
                _routeCfg.resolvePath = baseName + SEP + _routeCfg.resolvePath;
              }
            }
          }
        }
      } else {
        appComponent._activeHistory = appComponent._setting.history = appComponent._withBasename(baseName);
      }
    }
    const IProvider = getProvider(appComponent.injector, appComponent.globalInjector);
    const history = appComponent._setting.history;

    class newComponent extends React.PureComponent {
      static routeOptions = appComponent.routeOptions || {};
      render() {
        if (!appComponent._activeHistory) {
          appComponent._activeHistory = self._activeHistory;
        }
        return (<IProvider store={appComponent.getStore()}>
          <Router history={history} routes={appComponent._setting.routes} />
        </IProvider>);
      }
    }
    return newComponent;
  }
  parseRoute(routeConfig, strict) {
    // #! 如果设置路由是一个子App
    let parent = routeConfig;
    const paths = [];
    while (parent) {
      paths.unshift(parent.path);
      parent = parent.parent;
    }
    const basePath = paths.join(SEP);
    if (routeConfig.component) {
      routeConfig.component = Beatle.fromLazy(routeConfig.component, this);
      if (routeConfig.component instanceof Beatle) {
        routeConfig.path = routeConfig.path + '(/**)';
        routeConfig.component = this._convertAppToComponent(routeConfig.component, basePath, routeConfig.routeType);
      }
    } else if (routeConfig.getComponent && routeConfig.app) {
      routeConfig.path = routeConfig.path + '(/**)';
      const getComponent = routeConfig.getComponent;
      routeConfig.getComponent = (nextState, callback) => {
        const newCallback = (err, app) => {
          if (err) {
            callback(err, app);
          } else {
            callback(null, this._convertAppToComponent(app, basePath, routeConfig.routeType));
          }
        };
        getComponent(nextState, newCallback);
      };
    }  else if (strict && !routeConfig.component.routeOptions) {
      routeConfig = false;
    }

    if (routeConfig) {
      this._setting.routesMap[this.getResolvePath(routeConfig, true)] = routeConfig;
    }
    return routeConfig;
  }

  /**
   * ### Beatle开放api
   *
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | getStore() `Object` | N/A | 获取redux状态容器 |
   * | getRoutes() `Array` | N/A | 获取react-router的路由配置 |
   * | use(middleware) | middleware `Function` | 注册中间件，中间件是在处理处理过程中变更数据结构或者做一些必要的监控 |
   * | getResolvePath(routeConfig) `String` | routeConfig `Object` | 根据路由配置获取真实的路径 |
   * | route(path[, component]) | path `String︱Array︱Object︱Context`, component `ReactComponent` | 只有一个参数，此时为字符串则查找路由配置，否则是批量注册路由配置；2个参数未显示注册单个路由配置 |
   * | routesFactory(routes, option) | routes `Array︱Object︱Context`, option `Object` | 批量注册路由，可以传入option做更多处理 |
   * | setRoutes(routes, isAssign) `void`  | routes `Array︱Object︱Context`, isAssign `Boolean` | 批量路由注册 |
   * | model(Model) | Model `Object` | 注册数据模型 |
   * | connect(bindings, component[, flattern]) | bindings `String︱Object︱Array`, component `ReactComponent`, flattern `Boolean` | 设置视图, binding指定注入数据模型或者根据数据模型注入数据和方法 |
   * | run([rootDom, basePath]) | rootDom `Object`, basePath `String` | 启动应用 |
   */
  getStore() {
    return ReduxSeed.getRedux(this._setting.seedName).store;
  }

  getRoutes() {
    return this._setting.routes;
  }

  setRoutes(routes, isAssign, parent, opt) {
    if (Array.isArray(routes)) {
      // 路由配置为数组时，实际上是react-router的路由配置
      if (isAssign) {
        this._setting.routes = routes;
      }
      // 需要遍历所有路由配置，包括父级、子级，都映射到routesMap，方便后续查找
      routes.forEach((item) => {
        item.parent = parent;
        if (isAssign === false) {
          this._pushRoute(this._setting.routes, item, parent);
        }
        item = this.parseRoute(item);
        if (item.component && item.component.routeOptions) {
          Object.assign(item, item.component.routeOptions);
        }
        if (item.childRoutes) {
          this.setRoutes(item.childRoutes, null, item);
        }
      });
    } else {
      this.routesFactory(routes, opt);
    }
  }

  /**
   * ### 通过use方法可以注册中间件
   *
   * ```
   * // 以下中间件会添加了一个loadingBar的中间件
   * app.use((action, next, dispatch) => {
   *  // 通过action可以进行变更，生成新的nextAction
   *  if(action.type && !action.suppressGlobalProgress){
   *    if (action.type.match(/\/start$/)) {
   *      LoadingBar.showLoading()
   *    } else if (action.type.match(/\/success$/) || action.type.match(/\/error$/)) {
   *      LoadingBar.hideLoading()
   *    }
   *  }
   *  // next(nextAction) 把新的action传给侠哥中间件
   *  next(action);
   * });
   * ```
   */
  use(middleware) {
    this
      ._middlewares
      .push(middleware);
  }

  getResolvePath(routeConfig, flag) {
    let resolvePath;
    if (typeof routeConfig === 'string') {
      resolvePath = routeConfig;
    } else {
      /**
       * 3种情况，目的是要把路由路径打平
       * 1. route有resolvPath，说明已经处理过了
       * 2. route有path, 并且是绝对地址，此时resolvePath应为path
       * 3. route有path，如果有parent怎直接去path值，否则需要和navKey进行拼接
       */
      if (routeConfig.resolvePath) {
        resolvePath = routeConfig.resolvePath;
      } else if (routeConfig.path && (routeConfig.path[0] === '/' || routeConfig.path.indexOf('http') === 0)) {
        resolvePath = routeConfig.resolvePath = routeConfig.path;
      } else {
        let item = routeConfig;
        let paths = [];
        let ppath;
        while (item) {
          ppath = item.path || item.name;
          if (item.parent) {
            paths.unshift(ppath);
          } else {
            paths.unshift(item.navKey ? item.navKey + '/' + ppath : ppath);
          }
          item = item.parent;
        }
        resolvePath = paths.join(SEP).replace(/\/+/g, SEP);
        routeConfig.resolvePath = resolvePath;
      }
    }
    if (flag) {
      return resolvePath;
    } else {
      if (resolvePath.indexOf('http') === 0) {
        return resolvePath;
      } else {
        if (this._setting.basePath) {
          if (resolvePath[0] === SEP) {
            return this._setting.basePath + resolvePath;
          } else {
            return this._setting.basePath + SEP + resolvePath;
          }
        } else {
          return resolvePath;
        }
      }
    }
  }

  _pushRoute(routes, childRoute, parent) {
    routes.push(childRoute);
    if (childRoute.aliasRoutes) {
      childRoute.aliasRoutes.forEach(r => {
        const path = r.path;
        r = Object.assign({parent: parent}, childRoute, r);
        delete r.resolvePath;
        if (!path) {
          r.path = this._parsePath(r.path, r.name);
        }

        const resolvePath = this.getResolvePath(r, true);
        if (!this._setting.routesMap[resolvePath]) {
          this._setting.routesMap[resolvePath] = r;
          routes.push(r);
        }
      });
      delete this._setting.routesMap[childRoute.resolvePath];
      delete childRoute.resolvePath;
      childRoute.path = this._parsePath(childRoute.path, childRoute.name);
      this._setting.routesMap[this.getResolvePath(childRoute, true)] = childRoute;
    }
  }
  /**
   * ### 设置路由
   *
   * + 设置多个路由
   *
   * ```
   *  // 场景1： 格式为react-router路由配置项
   *  const routes = [
   *    { path: '/',
   *      component: App,
   *      indexRoute: { component: Dashboard },
   *      childRoutes: [
   *        { path: 'about', component: About },
   *        { path: 'inbox',
   *          component: Inbox,
   *          childRoutes: [
   *            { path: '/messages/:id', component: Message },
   *            { path: 'messages/:id',
   *              onEnter: function (nextState, replaceState) {
   *                replaceState(null, '/messages/' + nextState.params.id)
   *              }
   *            }
   *          ]
   *        }
   *      ]
   *    }
   *  ]
   *  app.route(routes);
   *
   * // 场景2：也可以是路由注册表
   * app.route({
   *  '/': App,
   *  '/message/:id': Message
   * })
   *
   * // 场景3：可以为require.context
   * app.route(require.context('../../assets', true, /\/index\.jsx?$/));
   * ```
   * + 获取指定路由
   *
   * ```
   *  const routeConfig = app.route('/');
   * ```
   * + 注册单个路由
   *
   * ```
   *  app.route('*', (props) => {
   *    return (<h1>404</h1>);
   *  });
   * ```
   */
  route(path, RouteComponent, routeConfig) {
    // #! 返回指定路由
    if (arguments.length === 1 && typeof path === 'string') {
      return this._setting.routesMap[path];
    }
    if (RouteComponent) {
      RouteComponent = Beatle.fromLazy(RouteComponent, this);
      // #! 设置路由
      if (routeConfig) {
        RouteComponent.routeOptions = Object.assign(RouteComponent.routeOptions || {}, routeConfig);
        if (routeConfig.childRoutes) {
          this.setRoutes(routeConfig.childRoutes, null, routeConfig);
        }
      }
      const childRoute = route(path, RouteComponent, {
        callback: this.parseRoute.bind(this),
        fromLazy: (com) => Beatle.fromLazy(com, this)
      });
      if (childRoute) {
        this._pushRoute(this._setting.routes, childRoute);
      }
    } else {
      // #! 设置多个路由
      const isAssign = RouteComponent === undefined ? true : !!RouteComponent;
      this.setRoutes(path, isAssign);
    }
  }

  // ### 设置多个路由的具体实现
  routesFactory(routesMap = {}, option = {}) {
    routesMap = extractModules(routesMap, (module, key) => key);

    if (typeof option === 'function') {
      option = {
        callback: option
      };
    }
    const routeCallback = option.callback || this.parseRoute.bind(this);
    const leave = option.leave || 1;
    if (option.strict === undefined) {
      option.strict = true;
    }

    const routes = option.append ? this._setting.routes.slice(0) : [];
    /**
     * + 先要排序，把路径短的往前排
     *
     * ```
     *  // 比如一下map
     *  Map = {
     *    '/message/info': C,
     *    '/message/error/:404': D,
     *    '/message': B,
     *    '/': A
     *  }
     * // 排序之后
     * Map = {
     *  '/': A,
     *  '/message': B,
     *  '/message/info': C,
     *  '/message/error/:404': D
     * }
     * ```
     */
    Object
      .keys(routesMap)
      .sort((a, b) => {
        const compare = a.split(/[\\/]/).length - b.split(/[\\/]/).length;
        if (compare === 0) {
          return [-1, 1][(a > b) - 0];
        } else {
          return compare;
        }
      })
      .forEach((relativePath) => {
        const keys = relativePath
          .slice(2, -10)
          .split(/[\\/]/);
        // #! 把第一位空的剔除掉
        if (keys[0] === '') {
          keys.shift();
        }

        const Comp = Beatle.fromLazy(routesMap[relativePath], this);
        let key;
        let temp;
        let name;
        let children;
        let childRoute;

        // #! 路径短于指定级别时都认为一级路由处理
        if (keys.length < leave) {
          childRoute = route(keys[0] || SEP, Comp, {
            name: keys[0] || SEP,
            strict: option.strict,
            callback: routeCallback,
            fpath: relativePath
          });
          if (childRoute) {
            this._pushRoute(routes, childRoute);
            this._pushRoute(this._setting.routes, childRoute);
          }
        } else {
          name = keys.pop();
          children = routes;
          let parentRoute;
          let navKey = keys[keys.length - 1] || '';
          // #! 查找是否注册过父级路由
          if (keys.length) {
            // 当前路由路径来决定应该在哪个子路由下
            while ((key = keys.shift()) && (temp = children.find((item) => item.name === key))) {
              parentRoute = temp;
              children = parentRoute.childRoutes || [];
            }
          }
          // #! 不存在父级路由，则直接挂在一级路由下
          if (!parentRoute) {
            parentRoute = children.find(function (item) {
              return item.name === SEP;
            });
            children = parentRoute.childRoutes || [];
          }

          if (parentRoute) {
            parentRoute.childRoutes = parentRoute.childRoutes || [];
            childRoute = route(parentRoute.path === navKey ? null : navKey + '/' + name, Comp, {
              name: name,
              navKey: navKey,
              strict: option.strict,
              callback: routeCallback,
              fpath: relativePath
            });
            if (childRoute) {
              childRoute.parent = parentRoute;
              this._pushRoute(parentRoute.childRoutes, childRoute);
            }
          } else {
            childRoute = route(null, Comp, {
              name: name,
              navKey: navKey,
              strict: option.strict,
              callback: routeCallback,
              fpath: relativePath
            });
            if (childRoute) {
              this._pushRoute(routes, childRoute);
              this._pushRoute(this._setting.routes, childRoute);
            }
          }
        }
      });
    return routes;
  }

  model(Model, Resource) {
    // #! 返回指定model
    if (typeof Model === 'string') {
      if (arguments.length === 1) {
        return this.seed.getModel(Model);
      } else {
        Resource.displayName = Model;
        Model = Resource;
        Resource = null;
      }
    }
    if (Model) {
      Model = Beatle.fromLazy(Model, this);
      // #! 不一定存在了，之前ES5和ES6混用时出现过。
      Model = Model.default || Model;
      if (!Model.displayName) {
        warning(false, messages.displayName, 'Model', 'arguments', 'beatleInstance.model');
        return;
      }

      modelChecker(Model, 'model');
      if (Resource) {
        this.seed.register(Model, Resource);
      } else {
        this.seed.register(Model);
      }
    } else {
      warning(false, messages.invalidValue, 'arguments', 'Model', Model, 'beatleInstance.model', 'ModelShape');
    }
  }

  mount() {
    // #! todo
  }

  get dispatch() {
    return ReduxSeed.getRedux(this._setting.seedName).store.dispatch;
  }

  connect(models, SceneComponent, flattern, props) {
    /**
     * ### connect模块来实现绑定
     *
     * + 场景1：支持原生的Redux#connect
     *
     * ```
     *  const mergeStateToProps = (state, ownProps) => {
     *  }
     *  const mergeDispatchToProps = (dispatch, ownProps) => {
     *  }
     *  app.connect([mergeStateToProps, mergeDispatchToProps], Component);
     * ```
     * + 场景2：注入整个数据模型
     *
     * ```
     *  app.model({
     *    displayName: 'user',
     *    store: {
     *      profile: {}
     *    },
     *    actions: {
     *      getUser
     *    }
     *  });
     *  // 在组件内部通过this.props.user获取到最新的store数据
     *  app.connect('user', Component);
     *  // 如果想通过this.props.profile拿到user#store#profile，实际上就是打平数据到组件中，而不是已this.props[modelName]来访问。
     *  app.connect('user', Component, true);
     *  // 如果注入多个数据模型
     *  app.connect(['user'], Component);
     * ```
     *
     * + 场景3：选择性通过数据模型注入数据
     *
     * ```
     *  app.connect({
     *    profile: 'user.store.profile',
     *    getUser: 'user.actions.getUser'
     *  }, Component)
     * ```
     */
    if (models.prototype && models.prototype.isReactComponent) {
      SceneComponent = models;
      if (SceneComponent.getState) {
        models = (store, props) => SceneComponent.getState(store['__pure_reducer__'], props);
        flattern = true;
      } else {
        models = [];
      }
    }
    return connect(this.toBindings([].concat(models), flattern), this.dispatch.bind(this), props)(SceneComponent);
  }

  toBindings(bindings, flattern, context) {
    // #! 从redux模块中获取model实例和所有的action
    const {models, actions} = ReduxSeed.getRedux(this._setting.seedName);

    return {
      flattern: flattern,
      dataBindings: typeof bindings[0] === 'function' ? bindings[0].bind(context) : (state) => {
        const iState = {};
        bindings.forEach((binding) => {
          if (typeof binding === 'string') {
            let mState = {};
            if (models[binding]) {
              const store = models[binding].state || models[binding].store;
              for (let key in store) {
                mState[key] = state[binding][key];
              }
            }

            if (flattern) {
              Object.assign(iState, mState);
            } else {
              iState[binding] = mState;
            }
          } else {
            for (let key in binding) {
              if (Object(binding[key]) === binding[key]) {
                iState[key] = binding[key];
              } else if (typeof binding[key] === 'string') {
                let keys = binding[key].split('.');
                let mState = {};
                if (models[keys[0]] && (keys[1] === 'store' || keys[1] === 'state')) {
                  // #! see > http://lodashjs.com/docs/#_getobject-path-defaultvalue
                  mState[key] = _get(state[keys[0]], keys.slice(2));
                }
                if (flattern) {
                  Object.assign(iState, mState);
                } else {
                  iState[keys[0]] = mState;
                }
              }
            }
          }
        });
        return iState;
      },
      eventBindings: typeof bindings[1] === 'function' ? (dispatch, props) => bindings[1].call(context, dispatch, props, actions) : (dispatch) => {
        const iAction = {};
        bindings.forEach((binding) => {
          if (typeof binding === 'string' && actions[binding]) {
            let mAction = {};
            for (let key in actions[binding]) {
              mAction[key] = (...args) => {
                const result = actions[binding][key].apply(null, args);
                if (result && result.then) {
                  return result;
                } else if (typeof result === 'function') {
                  return result(dispatch);
                } else if (result !== undefined) {
                  return dispatch(result);
                }
              };
            }
            if (flattern) {
              Object.assign(iAction, mAction);
            } else {
              iAction[binding] = mAction;
            }
          } else {
            for (let key in binding) {
              if (typeof binding[key] === 'function') {
                iAction[key] = binding[key].bind(null, dispatch);
              } else if (typeof binding[key] === 'string') {
                let keys = binding[key].split('.');
                let mAction = {};
                if (actions[keys[0]] && keys[1] === 'actions') {
                  mAction[key] = (...args) => {
                    const result = actions[keys[0]][keys[2]].apply(null, args);
                    if (result && result.then) {
                      return result;
                    } else if (typeof result === 'function') {
                      return result(dispatch);
                    } else if (result !== undefined) {
                      return dispatch(result);
                    }
                  };
                }
                if (flattern) {
                  Object.assign(iAction, mAction);
                } else {
                  iAction[keys[0]] = mAction;
                }
              }
            }
          }
        });
        return iAction;
      }
    };
  }

  getActions(name) {
    const actions = this.seed.getActions(name);
    const store = this.getStore();
    const newActoins = {};
    for (let key in actions) {
      newActoins[key] = (...args) => {
        return actions[key](...args)(store.dispatch);
      };
    }
    return newActoins;
  }
  /**
   * ### 应用启动
   *
   * + 场景1：在new Beatle是已经配置了路由和挂在DOM，可直接启动应用
   *
   * ```
   *  app.run();
   * ```
   *
   * + 场景2：启动时即时配置DOM和跟路由
   *
   * ```
   *  app.run(document.body, 'example');
   * ```
   */
  run(rootDom, basePath, renderCb) {
    if (this._hasRendered) {
      return;
    }
    this._hasRendered = true;
    let IRouter = Router;
    // basePath, renderCb
    if (typeof rootDom === 'string' || !rootDom || !rootDom.nodeType) {
      renderCb = basePath;
      basePath = rootDom;
      rootDom = null;
    }
    if (typeof basePath === 'function') {
      // router, renderCb
      if (basePath.prototype && basePath.prototype.isReactComponent) {
        IRouter = basePath;
        basePath = null;
      } else {
        // renderCb
        renderCb = basePath;
        basePath = null;
      }
    }

    const routes = this._setting.routes;
    rootDom = rootDom || this._setting.rootDom;
    this._setting.basePath = basePath || this._setting.basePath;
    this._activeHistory = this._withBasename(this._setting.basePath);
    const IProvider = getProvider(this.injector, this.globalInjector);
    const appElement = (<IProvider store={this.getStore()}>
      <IRouter history={this._activeHistory} routes={routes} />
    </IProvider>);
    if (renderCb) {
      renderCb(appElement, rootDom);
    } else {
      ReactDOM.render(appElement, rootDom);
    }
  }
}
