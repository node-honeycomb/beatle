import React, {Component} from 'react';
import PropTypes from 'prop-types';
import LoadingBar from '../../components/loadingBar';
import Beatle, {model, createModel, connect, route} from '../../../../src';

const app = new Beatle({
  
  subApp: true,
  ajax: {
    origin: 'https://api.github.com'
  }
});

// warning
Beatle.createModel();
app.model();
Beatle
  .ReduxSeed
  .getRedux('miniApp1');
app
  .ajax
  .setHeader({});
app
  .ajax
  .setHeader({});
app
  .ajax
  .beforeRequest(() => {});
app
  .ajax
  .beforeRequest(() => {});
app
  .ajax
  .afterResponse(() => {});
app
  .ajax
  .afterResponse(() => {});
app
  .ajax
  .set('something');

app
  .ajax
  .get('http://www.taobao1.com', null, (err) => {
    throw err;
  });

@model({
  app: app
})
@createModel({
  getUser: {
    method: 'get',
    url: '/users/baqian'
  }
})
class UserModel {
  static displayName = 'user';
  static store = {
    profile: {
      login: 'Guest'
    }
  };
  static actions = {
    getUser: {
      callback: {
        success: (nextStore, payload) => {
          nextStore.profile = payload.data;
        }
      }
    }
  }
}

@route({
  app: app,
  path: '/'
})
@connect({
  app: app,
  bindings: ['user']
})
class Root extends Component {
  static propTypes = {
    user: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this
      .props
      .user
      .getUser();
  }

  render() {
    return (
      <div>
        <LoadingBar
          style={{height: 2, top: 1, zIndex: 999}}
          updateTime={100}
          maxProgress={95}
          progressIncrease={10}
        />
        <h1>Welcome back: {this.props.user.profile.login}</h1>
      </div>
    );
  }
}

app.use((action, next) => {
  if (action.type && !action.suppressGlobalProgress) {
    if (action.type.match(/\/start$/)) {
      LoadingBar.showLoading();
    } else if (action.type.match(/\/success$/) || action.type.match(/\/error$/)) {
      LoadingBar.hideLoading();
    }
  }
  next(action);
});

export default app;
