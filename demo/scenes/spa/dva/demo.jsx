import React from 'react';
import {Router, Route} from 'react-router';
import Beatle from '../../../../src';
import {LoadingBar} from 'hc-materials';

export default function renderDemo(dom) {
  /**
   * ### 初始化应用
   * 1. new Beatle产生一个app实例
   * 2. app.use添加中间件
   * 3. app.run挂载到指定dom，并执行应用。
   */
  const app = new Beatle({
    name: 'dva',
    routeType: 'hashHistory'
  });
  app.use(LoadingBar.create());

  class Container extends React.PureComponent {
    render() {
      return (<Router history={this.props.history}>
        <Route path="/" component={require('./layouts/layout')} >
          <Route path="/home" component={require('./routes/home')} />
          <Route path="/users" component={require('./routes/user')} />
        </Route>
      </Router>);
    }
  }
  app.run(dom, Container);
}
