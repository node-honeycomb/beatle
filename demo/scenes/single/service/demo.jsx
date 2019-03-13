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
   * 2. app维护了2个服务，一个全局服务 和 一个基于app的服务
   * 3. 通过app.view连接组件到服务中心，这样组件可以通过context访问到服务实例，当服务中心为空时，至少app、seed和ajax服务会被注入到组件中。
   */
  class Demo extends React.PureComponent {
    static contextTypes = {
      app: PropTypes.object,
      user: PropTypes.object
    }

    constructor(props, context) {
      super(props, context);
      this.state = {
        profile: {},
        name: 'baqian',
        repos: {}
      };
    }

    getUserInfo() {
      this.context.user.getUserInfo(this.state.name, (nextState) => {
        this.setState(nextState);
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
          dataSource={[this.state.profile]}
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

  // 通过函数形式定义一个服务
  function reposService() {
    return {
      getRepos: (name, callback) => {
        this.context.ajax.get('https://api.github.com/users/' + name + '/repos').then(res => {
          callback({repos: res});
        });
      }
    };
  }
  // 通过服务的静态函数contextTypes声明依赖的服务
  reposService.contextTypes = {
    ajax: PropTypes.object
  };

  // 通过class定义个服务
  class UserService {
    static contextTypes = {
      ajax: PropTypes.object,
      repos: PropTypes.object
    }

    getUserInfo(name, callback) {
      this.context.ajax.get('https://api.github.com/users/' + name).then(res => {
        callback({profile: res});
        this.context.repos.getRepos(name, callback);
      });
    }
  }
  /**
   * ### 初始化一个组件应用
   * 1. new Beatle产生一个app示例
   * 2. app.service注册服务
   * 4. app.run执行组件，挂载到指定dom
   */
  const app = new Beatle();
  app.service('repos', reposService);
  app.service('user', UserService);
  app.run(dom, Demo);
}

