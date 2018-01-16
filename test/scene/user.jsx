'use strict';

import { Avatar, Button, Input } from 'antd';
require('antd/dist/antd.css');
import React from 'react';
// import Beatle from '../../';
const Beatle = require('../../src');
const app = Beatle.getApp('app');

require('./user.less');
class UserInfo extends React.Component {
  constructor() {
    super();
    this.state = {
      name: 'anonymos'
    };
  }
  componentDidMount() {
  }
  render() {
    return <div className="user-info">
      <div className="user-info-content">
        <Avatar size="small" icon="user" />
        hello
        <span className="content-span">
          {
            this.props.user.name
          }
        </span>
        .
      </div>
      <div className="user-info-operation">
        <input type="text" onChange={this._change.bind(this)} id="ipt-change-name" />
        <Button onClick={this._click.bind(this)} className="btn-change-name">
          ChangeName
        </Button>
        <Button onClick={this._getUserList.bind(this)} id="btn-get-user">
          GetUserList
        </Button>
        <Button onClick={this._getUserListFail.bind(this)} id="btn-get-user-fail">
          GetUserListFail
        </Button>
        <Button onClick={this._getUserListWithParam.bind(this)} id="btn-get-user-with-param">
          GetUserListWithParam
        </Button>
        <Button onClick={this._putUserListWithParam.bind(this)} id="btn-put-user-with-param">
          PutUserListWithParam
        </Button>
        <Button onClick={this._postUserListWithParam.bind(this)} id="btn-post-user-with-param">
          PostUserListWithParam
        </Button>
        <Button onClick={this._deleteUserListWithParam.bind(this)} id="btn-delete-user-with-param">
          DeleteUserListWithParam
        </Button>
      </div>
    </div>;
  }
  _getUserList() {
    this.props.user.getList();
  }
  _getUserListFail() {
    this.props.user.getListFail();
  }
  _putUserListWithParam() {
    this.props.user.putUser({
      key: '1',
      name: 'Donald Trump',
      age: 60,
      address: 'White House'
    }, {
      params: {
        id: 1
      }
    });
  }
  _postUserListWithParam() {
    this.props.user.postUser({
      key: '3',
      name: 'Donald Trump',
      age: 60,
      address: 'White House',
    }, {
      params: {
        id: 3
      },
      headers: {
        headerParam: 'header param'
      }
    });
  }
  _deleteUserListWithParam() {
    this.props.user.deleteUser({}, {
      params: {
        id: 3
      }
    });
  }
  _getUserListWithParam() {
    this.props.user.getList({
      testQuery: 'test query',
      a: [1, 2, 3]
    }, {
      params: {
        urlParam: 'url param'
      },
      headers: {
        headerParam: 'header param'
      }
    });
  }
  _change(evt) {
    this.setState({
      name: evt.target.value
    });
  }
  _click() {
    this.props.user.changeName(this.state.name);
  }
};

module.exports = app.connect(['user'], UserInfo);
