import React from 'react';
import PropTypes from 'prop-types';
import Beatle from '../../../../src';

// antd组件库
// > see: https://ant.design/components
import Table from 'antd/lib/table';
import List from 'antd/lib/list';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';

export default function renderDemo(dom) {
  /**
   * ### 定义一个组件
   *
   * 1. 定义class类继承于React组件基类（PureComponent 或者 Component）
   * 2. 在Beatle环境下，通过context可访问app、seed 和 ajax实例
   * 3. `app.connect(Demo)`，连接组件到数据作用域，如此依赖没次数据作用域发生变更，都会驱动组件更新
   * 4. 组件需要实现`static getState`方法，表示每次组件获取最新的数据状态，通过props可访问。
   */
  class Demo extends React.PureComponent {
    static contextTypes = {
      app: PropTypes.object,
      ajax: PropTypes.object,
      seed: PropTypes.object
    }

    // #! 每次store变更时，都会触发getState，处理结果会注入到组件的props中。
    static getState = state => {
      return {
        profile: state.profile
      };
    }

    // #! 声明会接收组件外部传入的profile值
    static propTypes = {
      profile: PropTypes.object
    }

    constructor(props, context) {
      super(props, context);
      this.state = {
        name: 'baqian',
        repos: {}
      };
    }

    getUserInfo() {
      /**
       * ### ajax用法
       * 基于fetch实现，用于接口数据调用，其简单用法和jQuery的ajax用法相似，比如$.get ≈ ajax.get，复杂的用法可以参考Beatle核心模块Ajax部分。
       */
      this.context.ajax.get('https://api.github.com/users/' + this.state.name).then(res => {
        this.context.seed.dispatch({
          name: 'profile',
          payload: {
            data: res
          }
        });
        this.getRepos();
      });
    }

    getRepos() {
      this.context.ajax.get('https://api.github.com/users/' + this.state.name + '/repos').then(res => {
        this.setState({
          repos: res
        });
      });
    }

    componentDidMount() {
      this.getUserInfo();
    }

    render() {
      return (<div>
        <h1>Beatle版本：{this.context.app.version}</h1><br />
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
        <h3>参与模块</h3>
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

  /**
   * ### 初始化一个组件应用
   * 1. new Beatle产生一个app实例
   * 2. 定义数据作用域的数据行为的监听。
   * 3. app.connect连接组件到数据作用域，产生视图
   * 4. app.run把视图挂载到指定dom
   */
  const app = new Beatle();
  /**
   * ### `seed.register(name, action, defaultValue)`
   * 1. name表示数据状态名
   * 2. action表示数据行为，返回结果作为最新的数据状态值
   * 3. defaultValue为数据状态初始化值
   */
  app.seed.register(
    'profile',
    (store, payload) => {
      return {
        profile: payload.data
      };
    },
    {}
  );
  const HocDemo = app.connect(Demo);
  app.run(dom, HocDemo);
}

