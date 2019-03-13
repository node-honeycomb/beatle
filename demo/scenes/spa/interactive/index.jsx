import React, {Component} from 'react';
import marked from 'marked';
import subApp from './demo';

subApp.routeOptions = {
  title: '高级应用',
  summary: 'MVVM最佳方案',
};
export default class Interactive extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><rect x="7.19" y="7.19" width="17.62" height="17.62" transform="translate(16 -6.63) rotate(45)" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></rect><circle cx="16.06" cy="3.09" r="2" fill="#ff3a49"></circle><circle cx="3.77" cy="16" r="2" fill="#00b4f0"></circle><circle cx="16.06" cy="28.77" r="2" fill="#ff3a49"></circle><circle cx="28.68" cy="16" r="2" fill="#00b4f0"></circle><circle cx="16.23" cy="16" r="2" fill="#2d3033"></circle></g></svg>`,
    title: '高级应用',
    summary: 'MVVM最佳方案',
    layout: ['consoleLayout', 'demoLayout'],
    value: 3,
    component: subApp
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}


