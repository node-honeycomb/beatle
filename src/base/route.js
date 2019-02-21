import React from 'react';

function mergeRouteOptions(routeConfig) {
  if (routeConfig.childRoutes) {
    routeConfig.childRoutes.forEach(child => {
      if (child.component && child.component.routeOptions) {
        mergeRouteOptions(Object.assign(child, child.component.routeOptions));
      }
    });
  }
}

// # 路由配置生成器
export default function route(path, RouteComponent, option = {}) {
  const routeConfig = Object.assign({
    resolvePath: path,
    path: path,
    name: option.name,
    navKey: option.navKey,
    component: RouteComponent,
    fpath: option.fpath
  }, RouteComponent.routeOptions);
  // 把子路由组件的routeOptions也合并进来
  mergeRouteOptions(routeConfig);

  if (option.callback && option.callback(routeConfig, option.strict) === false) {
    return null;
  }

  const indexRoute = routeConfig.indexRoute;
  if (indexRoute) {
    if (indexRoute.prototype && indexRoute.prototype.isReactComponent) {
      routeConfig.indexRoute = Object.assign({
        component: indexRoute
      }, indexRoute.routeOptions);
    } else if (typeof indexRoute === 'function') {
      routeConfig.indexRoute = Object.assign({
        getComponent: indexRoute
      }, indexRoute.routeOptions);
    } else {
      const IndexComponent = option.fromLazy(indexRoute.component);
      const routeOptions = IndexComponent ? IndexComponent.routeOptions : indexRoute.getComponent.routeOptions;
      routeConfig.indexRoute = Object.assign(indexRoute, routeOptions);
    }
  }

  // 重新修正component
  if (typeof routeConfig.component.then === 'function') {
    const promise = routeConfig.component;
    delete routeConfig.component;
    routeConfig.getComponent = (nextState, callback) => {
      promise.then(component => {
        callback(null, component);
      }, callback);
    };
  } else if (React.isValidElement(routeConfig.component)) {
    const element = routeConfig.component;
    routeConfig.component = () => element;
    // function component, 必须存在props作为第一个参数
  } else if (!routeConfig.component.prototype.isReactComponent && routeConfig.component.toString().split(')')[0].split('(').pop() !== 'props') {
    routeConfig.getComponent = routeConfig.component;
    delete routeConfig.component;
  }

  return routeConfig;
}
