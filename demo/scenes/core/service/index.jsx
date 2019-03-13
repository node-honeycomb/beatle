import React, {Component} from 'react';
import marked from 'marked';
import renderDemo from './demo';

export default class Service extends Component {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-customer-service"></i>`,
    title: '服务',
    summary: 'service',
    layout: ['consoleLayout', 'demoLayout'],
    value: 6
  }

  componentDidMount() {
    renderDemo(this._dom);
  }

  render() {
    return (<div ref={dom => this._dom = dom} />);
  }
}
