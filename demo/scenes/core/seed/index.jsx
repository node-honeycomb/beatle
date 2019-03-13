import marked from 'marked';
import Demo from './demo';

export default class Model extends Demo {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-codepen"></i>`,
    title: '数据作用域',
    summary: 'seed',
    layout: ['consoleLayout', 'demoLayout'],
    value: 4
  }
}
