import React from 'react';
import PropTypes from 'prop-types';
import Beatle from '../../../../src';

// antd组件库
// > see: https://ant.design/components
import Table from 'antd/lib/table';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

export default function renderDemo(dom) {
  /**
   * ### 定义路径为/的路由组件
   *
   * 该组件通过store来存取数据，核心要素为bindings、seed.register、seed.dispatch
   *
   * 1. 定义class类继承于React组件基类（PureComponent 或者 Component）
   * 2. 通过propTypes声明从外部获取`profile`和`getUserInfo`属性值
   * 3. 通过`app.connect`连接组件和数据作用域store，从store中注入`profile`和`getUserInfo`属性值
   */
  class DemoProfile extends React.PureComponent {
    static contextTypes = {
      app: PropTypes.object,
      // #! 注册路由后，可通过context.router获取路由器示例，请用法参考 - https://www.npmjs.com/package/react-router
      router: PropTypes.object
    }

    // #! 声明会接收组件外部传入的profile值
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
               * 1. 通过router.push跳转指定路由，并添加记录，相似的还有router.replace, router.go等
               * 2. 指定的路由需要通过router.createLocation生成、相似的还有router.createPath、router.createHref
               * 3. 路由中带有参数值，可放到search中
               */
              this.context.router.push(
                this.context.router.createLocation({
                  pathname: '/repos',
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
   * 2. 通过propTypes声明从外部获取`repos`和`getRepos`属性值，而`location`属性值则时注册路由后，自动注入，可以获取到当前路由的相关数据。
   * 3. 通过`app.connect`连接组件和数据作用域store，从store中注入`repos`和`getRepos`属性值
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
      this.props.getRepos(this.props.location.query.name || 'baqian');
    }

    render() {
      return (<div>
        <h1>
          Beatle版本：{this.context.app.version}
          <Button.Group style={{marginLeft: 20}}>
            <Button onClick={() => {
              this.context.router.replace('/');
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

  /**
   * ### 定义一个数据模型
   * 1. 建议一个class类，继承于`Beatle.BaseModel`
   * 2. 定义数据状态state和数据行为(Model类下的函数类型的属性)
   *
   * > 和文档中描述不同，model不仅可以定义成Object，也可以通过`BaseModel`继承而来，数据变更的实际逻辑通过`setState`来执行，详细使用参考Beatle核心模块[数据模型](/beatle-projects/core/model)
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
   * ### 初始化一个组件应用
   * 1. new Beatle产生一个app实例
   * 2. app.model注册一个数据模型
   * 3. app.connect连接组件到数据作用域，产生视图
   * 4. app.route注册路由
   * 5. app.run启动应用
   */
  const app = new Beatle({
    routeType: 'localHistory'
  });
  app.model('user', Model);
  // `app.connect([mapStateToProps, mapDispatchToProps], Component)`，如果了解过`redux`，`app.connect`同redux的`connect`有异曲同工之处。
  // redux的connect用法为：`connect(mapStateToProps, mapDispatchToProps)(Component)`
  const HocProfile = Beatle.connect([
    function mapStateToProps(state) {
      return {
        profile: state.user.profile
      };
    },
    function mapDispatchToProps(dispatch, props, actions) {
      return {
        getUserInfo: actions.user.getUserInfo
      };
    }
  ], DemoProfile);
  // `app.connect([mapStateToProps, mapDispatchToProps], Component, flattern)`的变种写法，`mapStateToProps`和`mapDispatchToProps`通过object来描述
  // 请注意第三个参数`flattern`，表示获取到的属性平铺到props中，如果`flattern`为false（默认为false）时，以下需要通过`const {repos, getRepos} = props.user`才可以获取到.
  const HocRepos = Beatle.connect([
    {
      repos: 'user.state.repos'
    },
    {
      getRepos: 'user.actions.getRepos'
    }
  ], DemoRepos, true);
  app.route('/', HocProfile);
  app.route('/repos', HocRepos);
  app.run(dom);
}

