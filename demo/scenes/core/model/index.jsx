import marked from 'marked';
import Demo from './demo';

// https://vuex.vuejs.org/zh/guide/
export default class Model extends Demo {
  static routeOptions = {
    doc: marked(require('raw-loader!!!./README.md')),
    getIcon: (size) => `<i style="font-size: ${size}px;" class="anticon anticon-api"></i>`,
    title: '数据模型',
    summary: 'model',
    layout: ['consoleLayout', 'demoLayout'],
    value: 2
  }
}
