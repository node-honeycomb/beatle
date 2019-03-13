import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Simple extends Component {
  static routeOptions = {
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><polygon points="4.56 9.18 4.56 22.24 15.87 28.77 27.17 22.24 27.17 9.18 15.87 2.65 4.56 9.18" fill="#fff" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></polygon><line x1="15.87" y1="2.65" x2="15.87" y2="28.77" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><line x1="4.56" y1="22.24" x2="27.17" y2="9.18" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><line x1="4.56" y1="9.18" x2="27.17" y2="22.24" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><circle cx="27.17" cy="9.18" r="2" fill="#00b4f0"></circle><circle cx="4.83" cy="9.18" r="2" fill="#00b4f0"></circle><circle cx="15.87" cy="28.77" r="2" fill="#00b4f0"></circle><circle cx="15.86" cy="2.65" r="2" fill="#ff3a49"></circle><circle cx="27.17" cy="21.94" r="2" fill="#ff3a49"></circle><circle cx="5.08" cy="21.94" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '多应用组合',
    summary: '子应用作为父应用的路由',
    layout: ['consoleLayout', 'demoLayout'],
    value: 1
  }

  static propTypes = {
    route: PropTypes.object
  }

  render() {
    return (<div>Hello World!</div>);
  }
}
