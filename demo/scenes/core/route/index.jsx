import marked from 'marked';
import Demo from './demo';

export default class Model extends Demo {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-bars"></i>`,
    title: '路由',
    summary: 'route',
    layout: ['consoleLayout', 'demoLayout'],
    value: 3
  }
}
