import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Table from 'antd/lib/table';
import Beatle from '../../../../src';
import 'antd/dist/antd.less';

class TodoList extends Component {
  static propTypes = {
    list: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this
      .props
      .list
      .getMaintainers();
  }

  render() {
    return (
      <div>
        <Table dataSource={this.props.list.maintainers} columns={[
          {title: '名称', dataIndex: 'name'},
          {title: '邮箱', dataIndex: 'email'}
        ]}
        />
      </div>
    );
  }
}

export default Beatle.getApp('main').connect(['list'], TodoList);
