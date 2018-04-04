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

  if (!routeConfig.component.prototype.isReactComponent) {
    routeConfig.getComponent = routeConfig.component;
    delete routeConfig.component;
  }

  return routeConfig;
}
