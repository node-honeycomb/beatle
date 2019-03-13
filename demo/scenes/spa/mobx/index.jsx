import React, {Component} from 'react';
import marked from 'marked';
import subApp from './demo';

subApp.routeOptions = {
  title: '迁移mobx应用',
  summary: 'mobx',
};
export default class Mobx extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><polyline points="5.53 20.36 5.53 5.5 20.39 5.5" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><polyline points="26.47 11.3 26.47 26.15 11.61 26.15" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><circle cx="5.53" cy="20.36" r="2" fill="#ff3a49"></circle><circle cx="11.61" cy="26.15" r="2" fill="#ff3a49"></circle><circle cx="26.47" cy="11.3" r="2" fill="#ff3a49"></circle><circle cx="26.47" cy="26.15" r="2" fill="#00b4f0"></circle><circle cx="5.53" cy="5.5" r="2" fill="#00b4f0"></circle><circle cx="20.39" cy="5.5" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '迁移mobx应用',
    summary: 'mobx',
    layout: ['consoleLayout', 'demoLayout'],
    value: 6,
    component: subApp
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}


