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
   * 2. 通过propTypes组件从外部获取`profile`、`repos` 和 `getUserInfo` 属性值。
   * 3. 通过`app.connect(model, Component)`连接数据模型和组件，那么组件的props都可以通过model获得。
   */
  class Demo extends React.PureComponent {
    static contextTypes = {
      app: PropTypes.object
    }

    static propTypes = {
      profile: PropTypes.object,
      repos: PropTypes.array,
      getUserInfo: PropTypes.func
    }

    constructor(props, context) {
      super(props, context);
      this.state = {
        name: 'baqian'
      };
    }

    componentDidMount() {
      // !重要，该方法来自于数据模型model，方法调用后，其逻辑是调用了接口更新model的state，同时会影响组件的props，props会接收到最新的值，从而组件重新更新。
      this.props.getUserInfo(this.state.name);
    }

    render() {
      return (<div>
        <h1>Beatle版本：{this.context.app.version}</h1><br />
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
        <h3>参与模块</h3>
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
   * 2. app.connect连接组件到数据作用域，产生视图
   * 3. app.run启动应用
   */
  const app = new Beatle();
  app.model('user', Model);
  // #! 这一步相当于...Object.assign(...model.state, ...Model.prototype)都注入到组件的props中
  const HocDemo = app.connect('user', Demo, true);
  app.run(dom, HocDemo);
}

