import React from 'react';
import Beatle from '../../../../../src';

import Table from 'antd/lib/table';
import Pagination from 'antd/lib/pagination';
import Popconfirm from 'antd/lib/popconfirm';
import Button from 'antd/lib/button';

import styles from './component.css';
import UserModal from './modal';
import UsersModel from './model';

class Users extends React.PureComponent {
  componentDidMount() {
    this.props.dispatch({
      name: 'users.fetch',
      payload: {
        page: 1
      }
    });
  }
  render() {
    const {dispatch, list: dataSource, loading, total, page: current, router} = this.props;
    function deleteHandler(id) {
      dispatch({
        name: 'users.remove',
        payload: id,
      });
    }
  
    function pageChangeHandler(page) {
      dispatch(
        router.push({
          pathname: '/users',
          query: {page},
        })
      );
    }
  
    function editHandler(id, values) {
      dispatch({
        name: 'users.patch',
        payload: {id, values},
      });
    }
  
    function createHandler(values) {
      dispatch({
        name: 'users.create',
        payload: values,
      });
    }
  
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        /* eslint-disable react/display-name */
        render: text => (<a href="">{text}</a>),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Website',
        dataIndex: 'website',
        key: 'website',
      },
      {
        title: 'Operation',
        key: 'operation',
        render: (text, record) => (
          <span className={styles.operation}>
            <UserModal record={record} onOk={editHandler.bind(null, record.id)}>
              <a>Edit</a>
            </UserModal>
            <Popconfirm
              title="Confirm to delete?"
              onConfirm={deleteHandler.bind(null, record.id)}
            >
              <a href="">Delete</a>
            </Popconfirm>
          </span>
        ),
      },
    ];
  
    return (
      <div className={styles.normal}>
        <div>
          <div className={styles.create}>
            <UserModal record={{}} onOk={createHandler}>
              <Button type="primary">Create User</Button>
            </UserModal>
          </div>
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            rowKey={record => record.id}
            pagination={false}
          />
          <Pagination
            className="ant-table-pagination"
            total={total}
            current={current}
            pageSize={30}
            onChange={pageChangeHandler}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {list, total, page} = state.users;
  return {
    list,
    total,
    page,
  };
}

const app = Beatle.getApp('dva');
app.model('users', UsersModel);
// export default connect(mapStateToProps)(Users);
export default app.view({
  bindings: [mapStateToProps],
  hookActions: [{
    name: 'fetch',
    getParams: (props) => props.location.query
  }]
}, Users);
