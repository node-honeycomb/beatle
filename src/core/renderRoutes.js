import React, {Fragment, Suspense} from 'react';
import {Switch, Route, Redirect} from 'react-router-dom';
import path from 'path';

function renderComponent(basePath, route, props) {
  Object.assign(props, {
    children: renderRoutes(basePath, route.routes, route.extraProps, route.switchProps)
  });

  if (route.component) {
    return (<route.component {...props} />);
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
    return (<Suspense fallback={route.loading} key="redirect" >
      (<Component {...props} />)
    </Suspense>);
  } else {
    return route.loading;
  }
}
export default function renderRoutes(basePath, routes, extraProps, switchProps) {
  if (extraProps === void 0) {
    extraProps = {};
  }
  if (switchProps === void 0) {
    switchProps = {};
  }
  return routes ? (<Switch key="switch" {...switchProps}>{routes.map(function (route, i) {
    const exact = route.exact || !route.routes || !route.routes.length;
    const relativePath = path.normalize('/' + (route.resolvePath || route.path || route.name));
    if (relativePath === route.resolvePath) {
      if (!route.navKey && route.resolvePath.indexOf(basePath) === -1) {
        route.resolvePath = path.normalize(basePath + relativePath);
      }
    } else {
      route.resolvePath = path.normalize(basePath + relativePath);
    }
    const routeProps = {
      path: relativePath,
      exact: exact,
      strict: route.strict,
      route: route
    };
    routeProps.render = function render(props) {
      props.route = route;
      /* eslint-disable react/prop-types */
      if (route.indexRoute && props.match.isExact && props.match.path !== route.indexRoute.path) {
        if (route.indexRoute.path) {
          return (<Fragment>
            <Redirect key="redirect" to={path.normalize(basePath, route.indexRoute.path)} />
            {renderComponent(basePath, route, props)}
          </Fragment>);
        } else {
          return renderComponent(basePath, route.indexRoute, {key: 'redirect'});
        }
      }

      return renderComponent(basePath, route, props);
    };
    return (<Route key={route.key || i} {...routeProps} />);
  })}</Switch>) : null;
}
