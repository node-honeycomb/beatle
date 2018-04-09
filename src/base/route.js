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
    path: path || (option.navKey ? option.navKey + '/' + option.name : option.name),
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

  if (routeConfig.indexRoute) {
    if (routeConfig.indexRoute.prototype && routeConfig.indexRoute.prototype.isReactComponent) {
      routeConfig.indexRoute = {
        component: routeConfig.indexRoute
      };
    } else if (typeof routeConfig.indexRoute === 'function') {
      routeConfig.indexRoute = {
        getComponent: routeConfig.indexRoute
      };
    }
  }

  if (React.isValidElement(routeConfig.component)) {
    const element = routeConfig.component;
    routeConfig.component = () => element;
  } else if (!routeConfig.component.prototype.isReactComponent && routeConfig.component.toString().split(')')[0].split('(').pop() !== 'props') {
    routeConfig.getComponent = routeConfig.component;
    delete routeConfig.component;
  }

  return routeConfig;
}
