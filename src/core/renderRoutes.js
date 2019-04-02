import React, {Suspense} from 'react';
import {Switch, Route} from 'react-router-dom';

export default function renderRoutes(routes, extraProps, switchProps) {
  if (extraProps === void 0) {
    extraProps = {};
  }
  if (switchProps === void 0) {
    switchProps = {};
  }
  return routes ? (<Switch {...switchProps}>{routes.map(function (route, i) {
    const routeProps = {
      path: route.path || route.name,
      exact: route.exact,
      strict: route.strict
    };
    routeProps.render = function render(props) {
      const newProps = Object.assign({
        children: renderRoutes(route.routes, route.extraProps, route.switchProps)
      }, props, extraProps, {route: route});
      if (route.component) {
        return (<route.component {...newProps} />);
      } else if (route.getComponent) {
        const Component = React.lazy(() => new Promise(resolve => {
          route.getComponent(props, (RouteComponent, err) => {
            if (err) {
              resolve(err.message || 'Error by getComponent' || route.loading);
            } else {
              resolve(RouteComponent);
            }
          });
        }));
        return (<Suspense fallback={route.loading}>
          (<Component {...newProps} />)
        </Suspense>);
      } else {
        return route.loading;
      }
    };
    return (<Route key={route.key || i} {...routeProps} />);
  })}</Switch>) : null;
}
