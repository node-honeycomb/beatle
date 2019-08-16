import React, {Component} from 'react';
import PropTypes from 'prop-types';
import LoadingBar from '../../components/loadingBar';
import Beatle, {connect, route, model, createModel} from '../../../../src';

const app = new Beatle({
  name: 'miniApp',
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
  // getUser: {
  //   method: 'get',
  //   url: '/users/baqian'
  // }
})
/* eslint-disable no-unused-vars */
class UserModel {
  static displayName = 'user1';
  static store = {
    profile: {
      login: 'Guest'
    }
  };
  static actions = {
    async getUserAsync({put, select}) {
      const data = await app.ajax.get('/users/baqian');
      await put({
        profile: data,
        tst: 2,
        profile2: 1
      });
      window.console.log(select('profile'));
      return await select('profile');
    },
    // getUser => enumerator
    // enumerator.next() -> ret;
    // ret = {'@@redux-saga/IO': true, CALL: {...}} => 处理返回真实值
    // enumerator.next(data);
    // enumerator.next(...)
    * getUser(name, {put, call}) {
      window.console.log(name);
      const a = call(() => app.ajax.get('/users/baqian'));
      const b = {
        '@@redux-saga/IO': true,
        CALL: {
          args: [],
          context: null,
          fn: () => {
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(11111);
              }, 1000);
            });
          }
        }
      };
      // window.console.log(a);
      // window.console.log(b);
      const data = yield a;
      /* eslint-disable no-unused-vars */
      const test = yield b;
      // window.console.log(data);
      // window.console.log(test);

      yield put({
        profile: data,
        name: name
      });
    },
    // getUser: {
    //   exec: {
    //     method: 'get',
    //     url: '/users/baqian'
    //   },
    //   callback: {
    //     success: (nextStore, payload) => {
    //       nextStore.profile = payload.data;
    //     }
    //   }
    // }
  }
}

@route({
  app: app,
  path: '/'
})
@connect({
  app: app,
  bindings: ['user1']
})
class Root extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
    user1: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // this.props.user1.getUserAsync().then(res => {
    //   window.window.console.log(res);
    // });
    this.props.user1.getUser('test');
    // this.props.dispatch({
    //   action: 'user1.getUser',
    //   payload: {
    //     arguments: ['test']
    //   }
    // });
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
        <h1>Welcome back: {this.props.user1.profile.login}</h1>
      </div>
    );
  }
}

app.route('/', Root);

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
