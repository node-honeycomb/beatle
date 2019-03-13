import marked from 'marked';
import Demo from './demo';

export default class Model extends Demo {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-usb"></i>`,
    title: '中间件',
    summary: 'middleware',
    layout: ['consoleLayout', 'demoLayout'],
    value: 6
  }
}
