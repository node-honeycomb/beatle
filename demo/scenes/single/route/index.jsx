import React, {Component} from 'react';
import renderDemo from './demo';
import marked from 'marked';

export default class Route extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<svg style="width: ${size}px; height: ${size}px;" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false"><g viewBox="0 0 32 32"><ellipse cx="16" cy="15.21" rx="13.48" ry="5.26" fill="none" stroke="#2d3033" stroke-miterlimit="10"></ellipse><ellipse cx="16" cy="15.36" rx="5.26" ry="13.48" transform="translate(-5.54 10.06) rotate(-30)" fill="none" stroke="#2d3033" stroke-miterlimit="10"></ellipse><ellipse cx="15.96" cy="15.36" rx="13.48" ry="5.26" transform="translate(-5.32 21.5) rotate(-60)" fill="none" stroke="#2d3033" stroke-miterlimit="10"></ellipse><circle cx="16.08" cy="15.46" r="2" fill="#ff3a49"></circle></g></svg>`,
    title: '路由插件',
    summary: '插件多模块切换',
    layout: ['consoleLayout', 'demoLayout'],
    value: 3
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}
