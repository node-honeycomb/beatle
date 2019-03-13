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
   * 2. 在Beatle环境中，组件总可以通过context获取到`app`等实例
   * 3. 通过`app.model(name)`获取到数据模型实例，从而触发数据行为变更
   * 4. 通过`app.observer(getState)`，观察getState返回的数据，转变为可观察序列，在数据发生变更时，自动更新组件。
   */
  class Demo extends React.PureComponent {
    static contextTypes = {
      app: PropTypes.object
    }

    constructor(props, context) {
      super(props, context);
      this.state = {
        name: 'baqian'
      };
    }

    componentDidMount() {
      this.context.app.model('user').getUserInfo(this.state.name);
    }

    render() {
      return (<div>
        <h1>Beatle版本：{this.context.app.version}</h1><br />
        <Input
          style={{width: '50%'}}
          value={this.state.name}
          onChange={e => this.setState({name: e.target.value})}
          prefix={(<Icon type="user" style={{color: '#999'}} />)}
          addonAfter={(<Icon type="search" onClick={() => this.context.app.model('user').getUserInfo(this.state.name)} />)}
        />
        {
          this.context.app.observer((state) => state.user.profile).render(profile => {
            // #! getState = (state) => state.user.profile, 可从数据作用域中获取具体数据状态
            return (<Table
              rowKey="id"
              columns={[
                {dataIndex: 'id', title: 'ID'},
                {dataIndex: 'name', title: '名称', render: (text, record) => (<a href={record.html_url} target="_blank">{text}</a>)},
                {dataIndex: 'created_at', title: '创建时间'},
                {dataIndex: 'updated_at', title: '更新时间'}
              ]}
              dataSource={[profile]}
            />);
          })
        }
        <h3>参与模块</h3>
        {
          this.context.app.observer('user.repos').render(repos => {
            // #! getState = 'user.repos'; 通过描述也可以获取到数据状态
            return (<List
              itemLayout="horizontal"
              dataSource={repos}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<a href={item.url} target="_blank">{item.name}</a>}
                    description={item.description}
                  />
                </List.Item>
              )}
            />);
          })
        }
      </div>);
    }
  }
  /**
   * ### 定义一个数据模型
   * 1. 建议一个class类，继承于`Beatle.BaseModel`
   * 2. 定义数据状态state和数据行为(Model类下的函数类型的属性)
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
            this.getRepos(name);
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
   * 3. app.run启动应用
   */
  const app = new Beatle();
  app.model('user', Model);
  app.run(dom, Demo);
}

