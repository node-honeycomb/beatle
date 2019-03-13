import React, {Component} from 'react';
import marked from 'marked';
import renderDemo from './demo';

export default class Pure extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><line x1="4.99" y1="24.7" x2="26.93" y2="24.7" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><line x1="4.99" y1="15.7" x2="26.93" y2="15.7" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><line x1="4.99" y1="6.7" x2="26.93" y2="6.7" fill="none" stroke="#2d3033" stroke-linecap="round" stroke-linejoin="round"></line><circle cx="4.99" cy="6.7" r="2" fill="#00b4f0"></circle><circle cx="26.93" cy="6.7" r="2" fill="#ff3a49"></circle><circle cx="4.99" cy="15.62" r="2" fill="#00b4f0"></circle><circle cx="26.93" cy="15.62" r="2" fill="#ff3a49"></circle><circle cx="4.99" cy="24.72" r="2" fill="#00b4f0"></circle><circle cx="26.93" cy="24.72" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '简单插件',
    summary: '驱动单个应用',
    layout: ['consoleLayout', 'demoLayout'],
    value: 1
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}
