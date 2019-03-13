import marked from 'marked';
import Demo from './demo';

export default class Ajax extends Demo {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-fork"></i>`,
    title: '接口调用',
    summary: 'ajax',
    layout: ['consoleLayout', 'demoLayout'],
    value: 1
  }
}
