import Beatle from '../../../../src';
import './demo.less';

export default function renderDemo(dom) {
  const PageLayout = require('./layouts/layout');
  const HomeView = require('./routes/home');
  const Counter = require('./routes/couter');

  const routes = [
    {
      path: '/',
      component: PageLayout,
      indexRoute: {
        component: HomeView
      },
      childRoutes: [
        {
          path: 'counter',
          getComponent(nextState, cb) {
            const app = Beatle.getApp('starter');
            const CounterModel = require('./model');
            // 在使用的地方动态注册数据模型
            app.model('counter', CounterModel);
            // 通过`app.connect`连接数据作用域，注入整个countter到组件
            const CounterContainer = app.connect('counter', Counter, true);
            cb(null, CounterContainer);
          }
        }
      ]
    }
  ];

  /**
   * ### 初始化应用
   * 1. new Beatle产生一个app实例
   * 3. app.route注册路由
   * 4. app.run启动应用
   */
  const app = new Beatle({
    name: 'starter',
    routeType: 'hashHistory',
    routes: routes
  });
  app.run(dom);
}
