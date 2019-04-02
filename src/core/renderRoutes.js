import React from 'react';
import {Switch, Route} from 'react-router-dom';

export default function renderRoutes(routes, extraProps, switchProps) {
  if (extraProps === void 0) {
    extraProps = {};
  }
  if (switchProps === void 0) {
    switchProps = {};
  }
  return routes ? (<Switch {...switchProps}>{routes.map(function (route, i) {
    return (<Route
      key={route.key || i}
      path={route.path}
      exact={route.exact}
      strict={route.strict}
      render={(props) => {
        const newProps = Object.assign({}, props, extraProps, {route: route});
        newProps.children = renderRoutes(newProps.routes, newProps.extraProps, newProps.switchProps);
        return route.render ? route.render(newProps) : (<route.component {...newProps} />);
      }}
    ></Route>);
  })}</Switch>) : null;
}
