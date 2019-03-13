import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Simple extends Component {
  static routeOptions = {
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><polyline points="13.67 24.8 21.83 10.79 24.17 14.88 18.92 24.8 24.75 24.8 30 15.46 24.75 6.13" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><polyline points="18.92 6.13 10.75 20.13 7.83 15.46 13.67 6.13 7.83 6.13 2 15.46 7.25 24.8" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><circle cx="7" cy="24.57" r="2" fill="#ff3a49"></circle><circle cx="18.92" cy="6.13" r="2" fill="#ff3a49"></circle><circle cx="13.35" cy="6.13" r="2" fill="#00b4f0"></circle><circle cx="13.67" cy="24.57" r="2" fill="#ff3a49"></circle><circle cx="18.92" cy="24.57" r="2" fill="#00b4f0"></circle><circle cx="24.67" cy="6.13" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '应用权限',
    summary: '应用授权业务服务',
    layout: ['consoleLayout', 'demoLayout'],
    value: 2
  }

  static propTypes = {
    route: PropTypes.object
  }

  render() {
    return (<div>Hello World!</div>);
  }
}
