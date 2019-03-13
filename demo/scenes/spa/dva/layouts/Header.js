import React from 'react';
import Menu from 'antd/lib/menu';
import Icon from 'antd/lib/icon';
import {Link, withRouter} from 'react-router';

function Header({location}) {
  return (
    <Menu selectedKeys={[location.pathname]} mode="horizontal" theme="dark">
      <Menu.Item key="/users">
        <Link to="/users">
          <Icon type="bars" />Users
        </Link>
      </Menu.Item>
      <Menu.Item key="/home">
        <Link to="/home">
          <Icon type="home" />Home
        </Link>
      </Menu.Item>
      <Menu.Item key="/404">
        <Link to="/page-you-dont-know">
          <Icon type="frown-circle" />404
        </Link>
      </Menu.Item>
      <Menu.Item key="/antd">
        <a href="https://github.com/dvajs/dva">dva</a>
      </Menu.Item>
    </Menu>
  );
}

export default withRouter(Header);
