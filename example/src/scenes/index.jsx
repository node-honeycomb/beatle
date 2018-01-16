import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './index.less';

export default class Root extends Component {
  static routeOptions = {};

  static propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node
  }

  static defaultProps = {
    name: 'World',
    title: 'App!!'
  }

  render() {
    return (
      <div>
        <h1>Hello {this.props.name}
          , Welcome to {this.props.title}</h1>
        {this.props.children}
      </div>
    );
  }
}
