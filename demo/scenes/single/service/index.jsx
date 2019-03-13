import React, {Component} from 'react';
import renderDemo from './demo';
import marked from 'marked';

export default class Route extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><path d="M2.52,21.15a13.58,13.58,0,0,1,27.16,0" fill="none" stroke="#2d3033" stroke-linejoin="round"></path><circle cx="2.42" cy="21.19" r="2.09" fill="#ff3a49"></circle><circle cx="16" cy="21.19" r="2.09" fill="#2d3033"></circle><circle cx="25.4" cy="11.79" r="2.09" fill="#2d3033"></circle><circle cx="29.58" cy="21.19" r="2.09" fill="#00b4f0"></circle><line x1="16.1" y1="21.33" x2="25.35" y2="12.07" fill="none" stroke="#2d3033" stroke-linejoin="round"></line></g></svg>`,
    title: '插件与服务',
    summary: '插件复用业务逻辑',
    layout: ['consoleLayout', 'demoLayout'],
    value: 4
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}
