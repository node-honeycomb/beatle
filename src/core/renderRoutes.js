import React from 'react';
import {Switch, Route} from 'react-router-dom';

export default function renderRoutes(childRoutes, extraProps, switchProps) {
  if (extraProps === void 0) {
    extraProps = {};
  }
  if (switchProps === void 0) {
    switchProps = {};
  }
  return childRoutes ? (<Switch {...switchProps}>{childRoutes.map(function (route, i) {
    return (<Route
      key={route.key || i}
      path={route.path}
      exact={route.exact}
      strict={route.strict}
      render={(props) => {
        const newProps = Object.assign({}, props, extraProps, {route: route});
        if (newProps.childRoutes) {
          return renderRoutes(newProps.childRoutes, newProps.extraProps, newProps.switchProps);
        } else {
          return route.render ? route.render(newProps) : (<route.component {...newProps}></route.component>);
        }
      }}
    ></Route>);
  })}</Switch>) : null;
}
