const mixinLoad = require('hc-honeypack-auto-module-plugin/addon');
const Beatle = require('../../src');
mixinLoad(Beatle.autoLoad);

import TodoList from './scenes/todoList';

import './app.less';

const app = new Beatle({
  name: 'main',
  routeType: 'hashHistory',
  root: document.getElementById('container'),
  autoLoadModel: true,
  autoLoadRoute: true
  // models: require.context('./models', false, /\w+\.js$/),
  // routes: require.context('./scenes', true, /index\.jsx$/)
});

window.console.log(app.getRoutes());
app.route('/list', TodoList);

app.run();
