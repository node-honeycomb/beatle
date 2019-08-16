import React from 'react';
import PropTypes from 'prop-types';
import Beatle from '../../../../src';
import {Sider} from 'hc-materials';
// antd组件库
// > see: https://ant.design/components
import Layout from 'antd/lib/layout';
import Table from 'antd/lib/table';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

/**
 * ### 定义一个数据模型
 * 1. 建议一个class类，继承于Beatle.BaseModel
 * 2. 定义数据状态state 和 数据行为（不同于对象形式，
 */
class Model extends Beatle.BaseModel {
  // #! 定义数据状态
  state = {
    profile: {},
    repos: []
  }

  // #! 定义数据行为方法
  getUserInfo(name) {
    this.setState({
      profile: {
        exec: this.ajax.get('https://api.github.com/users/' + name),
        callback: (prevState, payload) => {
          return payload.data;
        }
      }
    });
  }

  getRepos(name) {
    this.ajax.get('https://api.github.com/users/' + name + '/repos').then(res => {
      this.setState({
        repos: res
      });
    });
  }
}

/**
 * ### 定义路径为/profile的路由组件
 *
 * 该组件通过store来存取数据，核心要素为bindings、seed.register、seed.dispatch
 *
 * 1. 定义class类继承于React组件基类（PureComponent 或者 Component）
 * 2. 通过app.connect连接
 * 3. 通过app.route注册路由
 */
class DemoProfile extends React.PureComponent {
  static contextTypes = {
    app: PropTypes.object,
    router: PropTypes.object
  }

  static propTypes = {
    profile: PropTypes.object,
    getUserInfo: PropTypes.func
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      name: 'baqian'
    };
  }

  componentDidMount() {
    // !!重要，该方法来自于数据模型model，方法调用后，其逻辑是调用了接口更新model的state，同时会影响组件的props，props会接收到最新的值，从而组件重新更新。
    this.props.getUserInfo(this.state.name);
  }

  render() {
    return (<div>
      <h1>
        Beatle版本：{this.context.app.version}
        <Button.Group style={{marginLeft: 20}}>
          <Button type="primary">个人信息</Button>
          <Button onClick={() => {
            /**
             * ### 路由跳转
             *
             * 1. 通过router.push跳转指定路由，并添加记录，相似的还有router.pop、router.go等
             * 2. 指定的路由需要通过router.createLocation生成、相似的还有router.createPath、router.createHref
             * 3. 路由中带有参数值，可放到search中
             */
            const routeConfig = this.context.app.route('/repos');
            this.context.router.push(
              this.context.router.createLocation({
                pathname: this.context.app.getResolvePath(routeConfig),
                search: '?name=' + this.state.name
              })
            );
          }}>参与模块</Button>
        </Button.Group>
      </h1>
      <br />
      <Input
        style={{width: '50%'}}
        value={this.state.name}
        onChange={e => this.setState({name: e.target.value})}
        prefix={(<Icon type="user" style={{color: '#999'}} />)}
        addonAfter={(<Icon type="search" onClick={() => this.props.getUserInfo(this.state.name)} />)}
      />
      <Table
        rowKey="id"
        columns={[
          {dataIndex: 'id', title: 'ID'},
          {dataIndex: 'name', title: '名称', render: (text, record) => (<a href={record.html_url} target="_blank">{text}</a>)},
          {dataIndex: 'created_at', title: '创建时间'},
          {dataIndex: 'updated_at', title: '更新时间'}
        ]}
        dataSource={[this.props.profile]}
      />
    </div>);
  }
}

/**
 * ### 定义路径为/repos的路由组件
 *
 * 1. 定义class类继承于React组件基类（PureComponent 或者 Component）
 * 2. 通过app.connect连接
 */
class DemoRepos extends React.PureComponent {
  static contextTypes = {
    app: PropTypes.object,
    router: PropTypes.object
  }

  static propTypes = {
    location: PropTypes.object,
    repos: PropTypes.array,
    getRepos: PropTypes.func
  }

  componentDidMount() {
    const location = this.props.location;
    const name = location.query.name || 'baqian';
    this.props.getRepos(name);
  }

  render() {
    return (<div>
      <h1>
        Beatle版本：{this.context.app.version}
        <Button.Group style={{marginLeft: 20}}>
          <Button onClick={() => {
            this.context.router.replace(this.context.app.getResolvePath(this.context.app.route('/profile')));
          }}>个人信息</Button>
          <Button type="primary">参与模块</Button>
        </Button.Group>
      </h1>
      <br />
      <List
        itemLayout="horizontal"
        dataSource={this.props.repos}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={<a href={item.url} target="_blank">{item.name}</a>}
              description={item.description}
            />
          </List.Item>
        )}
      />
    </div>);
  }
}

class DemoLayout extends React.PureComponent {
  static contextTypes = {
    app: PropTypes.object
  }

  static propTypes = {
    children: PropTypes.element
  }

  render() {
    const routeConfig = this.context.app.getRoutes()[0];
    const siderProps = {
      routes: routeConfig.childRoutes,
      menusMap: {},
      Link: Beatle.Link,
      getResolvePath: Beatle.getResolvePath,
      brand: {
        path: this.context.app.getResolvePath(routeConfig),
        title: 'Demo',
        logo: '//img.alicdn.com/tfs/TB14dINRpXXXXcyXXXXXXXXXXXX-64-64.png?t=1517212583908'
      }
    };

    return (<Layout className="ant-layout-has-sider">
      <Layout.Sider width={256}><Sider {...siderProps} /></Layout.Sider>
      <Layout>
        <Layout.Content>
          {this.props.children}
        </Layout.Content>
      </Layout>
    </Layout>);
  }
}

/**
 * ### 初始化应用
 * 1. new Beatle产生一个app实例
 * 2. app.connect连接组件到数据作用域
 * 3. app.route注册路由
 * 4. app.run挂载到指定dom，并执行应用。
 */
const app = new Beatle();
app.model('user', Model);
const HocProfile = Beatle.connect('user', DemoProfile, true);
const HocRepos = Beatle.connect('user', DemoRepos, true);
app.route('/', DemoLayout, {
  childRoutes: [
    {
      title: '个人信息',
      path: '/profile',
      component: HocProfile
    }, {
      title: '参与模块',
      path: '/repos',
      component: HocRepos
    }
  ]
});

export default app;

