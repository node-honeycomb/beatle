import React, {Component} from 'react';
import marked from 'marked';
import renderDemo from './demo';

export default class Demo extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><polyline points="5.89 5.97 15.87 26.03 26.11 5.97" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><circle cx="5.72" cy="6.13" r="2" fill="#ff3a49"></circle><circle cx="16" cy="26.57" r="2" fill="#00b4f0"></circle><circle cx="26.11" cy="5.97" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '插件与数据通信',
    summary: '插件调用接口数据做更新',
    layout: ['consoleLayout', 'demoLayout'],
    value: 2
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}

