import React, {Component} from 'react';
import marked from 'marked';
import renderDemo from './demo';

export default class Pure extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><polyline points="26.11 26.03 16.13 5.97 5.89 26.03" fill="none" stroke="#2d3033" stroke-miterlimit="10"></polyline><line x1="9.4" y1="19.19" x2="22.71" y2="19.19" fill="none" stroke="#2d3033" stroke-miterlimit="10"></line><circle cx="26.11" cy="26.03" r="2" fill="#ff3a49"></circle><circle cx="5.89" cy="26.03" r="2" fill="#ff3a49"></circle><circle cx="16.15" cy="5.97" r="2" fill="#00b4f0"></circle></g></svg>`,
    title: '响应式组件',
    summary: '组件异步渲染，数据序列化',
    layout: ['consoleLayout', 'demoLayout'],
    value: 5
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}

