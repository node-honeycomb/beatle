const Beatle = require('../../src');
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
