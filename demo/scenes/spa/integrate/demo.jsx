import React from 'react';
import PropTypes from 'prop-types';
import Beatle from '../../../../src';
import {getLayout} from 'hc-materials';
// antd组件库
// > see: https://ant.design/components
import Table from 'antd/lib/table';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

/**
 * ### 定义路径为/的路由组件
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
    seed: PropTypes.object,
    ajax: PropTypes.object,
    // #! 注册路由后，可通过context.router获取路由器示例，请用法参考 - https://www.npmjs.com/package/react-router
    router: PropTypes.object
  }

  // #! 每次store变更时，都会触发bindings，处理结果会注入到组件的props中。
  static getState = store => {
    return {
      profile: store.profile
    };
  }

  // #! 声明会接收组件外部传入的profile值
  static propTypes = {
    profile: PropTypes.object
  }
  // #! 避免第一次profile没有值，默认时空对象
  static defaultProps = {
    profile: {}
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      name: 'baqian'
    };

  }

  getUserInfo() {
    // #! ajax实例调用接口数据
    this.context.ajax.get('https://api.github.com/users/' + this.state.name).then(res => {
      this.context.seed.dispatch({
        name: 'profile',
        payload: {
          data: res
        }
      });
    });
  }

  componentDidMount() {
    this.getUserInfo();
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
        addonAfter={(<Icon type="search" onClick={() => this.getUserInfo()} />)}
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
    ajax: PropTypes.object,
    router: PropTypes.object
  }

  static propTypes = {
    location: PropTypes.object
  }

  state = {
    repos: {}
  }

  getRepos() {
    /**
     * ### 获取当前路由的配置
     *
     * 1. 通过props.location获取路由
     * 2. url上带有的参数可通过location.query访问。
     */
    const location = this.props.location;
    const name = location.query.name || 'baqian';
    this.context.ajax.get('https://api.github.com/users/' + name + '/repos').then(res => {
      this.setState({
        repos: res
      });
    });
  }

  componentDidMount() {
    this.getRepos();
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
        dataSource={this.state.repos}
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

  get layoutOption() {
    const routeConfig = this.context.app.getRoutes()[0];
    return {
      routes: routeConfig.childRoutes,
      subRoutes: {},
      // Link组件
      Link: Beatle.Link,
      // Sider组件
      Sider: {
        getResolvePath: Beatle.getResolvePath,
        brand: {
          path: this.context.app.getResolvePath(routeConfig),
          title: 'Demo',
          logo: '//img.alicdn.com/tfs/TB14dINRpXXXXcyXXXXXXXXXXXX-64-64.png?t=1517212583908'
        }
      },
      // 默认面包屑
      BreadCrumb: false,
      // 不要header组件
      Header: false,
      // 不要页尾
      Footer: false
    };
  }

  render() {
    const viewContent = this.props.children;
    const route = this.props.children && this.props.children.props.route;
    const layout = getLayout({
      layoutOption: this.layoutOption,
      layout: 'ConsoleLayout',
      route: route
    }, viewContent);
    return (<div>{layout}</div>);
  }
}

/**
 * ### 初始化一个组件应用
 * 1. new Beatle产生一个app示例
 * 2. app.connect连接组件到数据作用域
 * 3. app.route注册路由
 * 4. app.run挂载到指定dom，并执行应用。
 */
const app = new Beatle();
// #! 通过seed.register注册，数据行为描述action的处理逻辑。
app.seed.register('profile', (prevStore, payload) => {
  return {
    profile: payload.data
  };
}, {});
const HocProfile = Beatle.connect(DemoProfile);
const HocRepos = Beatle.connect(DemoRepos);
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

