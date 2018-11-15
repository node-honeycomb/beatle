import React, {Component} from 'react';
import PropTypes from 'prop-types';
import LoadingBar from '../../components/loadingBar';
import Beatle, {view, route, model, createModel, BaseModel, BaseSelector, crud} from '../../../../src';

const app = new Beatle({
  name: 'damoApp',
  subApp: true,
  ajax: {
    origin: 'https://api.github.com',
    normalize: true
  }
});

@model({
  app: app
})
@createModel({
  getUser: {
    method: 'get',
    url: '/users/:name'
  }
})
/* eslint-disable no-unused-vars */
class UserModel extends BaseModel {
  static displayName = 'user';

  state = {
    profile: {
      login: 'Guest'
    },
    user: crud.item,
    usersEntry: crud.itemsEntry
  }

  id = 'id';

  getUser(name) {
    return this.setState({
      profile: function getUser(nextState, payload) {
        return payload.data;
      }
    }, {name: name});
  }

  get(id) {
    return this.setState({
      user: {
        exec: new Promise(resolve => {
          setTimeout(() => {
            const item = this.state.usersEntry.data.find(d => d.id === id);
            resolve(item);
          }, 1000);
        }),
        callback: crud.get
      }
    }, {id: id});
  }

  delete(id) {
    return this.setState({
      usersEntry: {
        exec: new Promise(resolve => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        }),
        callback: crud.delete
      }
    }, {id: id});
  }

  update(user) {
    return this.setState({
      usersEntry: {
        exec: new Promise(resolve => {
          setTimeout(() => {
            resolve(user);
          }, 1000);
        }),
        callback: crud.update
      }
    }, user);
  }

  create(user) {
    return this.setState({
      usersEntry: {
        exec: new Promise(resolve => {
          setTimeout(() => {
            resolve(user);
          }, 1000);
        }),
        callback: crud.create
      }
    }, user);
  }

  query(params) {
    return this.setState({
      usersEntry: {
        exec: new Promise(resolve => {
          setTimeout(() => {
            const list = [];
            for (let i = 0; i < 10; i++) {
              list.push({id: 100 + i, name: '张三' + i});
            }
            resolve(list);
          }, 1000);
        }),
        callback: crud.query
      }
    }, params);
  }
}

class UserSelector extends BaseSelector {
  get inputs() {
    return (state, ownProps) => {
      return {
        // profile: state.user.profile
        user: state.user.user,
        usersEntry: state.user.usersEntry
      };
    };
  }

  get outputs() {
    return (dispatch) => {
      const userModel = this.getModel('user');
      return {
        get: userModel.get.bind(userModel),
        delete: userModel.delete.bind(userModel),
        create: userModel.create.bind(userModel),
        update: userModel.update.bind(userModel)
      };
    };
  }

  initialize(ownProps) {
    const userModel = this.getModel('user');
    userModel.getUser('baqian').then(res => {
      window.window.console.log(res);
    });
    userModel.query();
  }

  test() {
    return 100;
  }
}
@route({
  app: app,
  path: '/'
})
@view({
  app: app,
  selector: UserSelector,
  providers: {
    a: () => {
      return {v: 1};
    },
    b: ['a', (a) => {
      return {
        v: a.v + 10
      };
    }],
    c: ['a', 'b', 'selector', (a, b, selector) => {
      return {
        v: a.v + b.v + selector.test()
      };
    }]
  }
})
class Root extends Component {
  static contextTypes = {
    c: PropTypes.object
  }
  static propTypes = {
    // profile: PropTypes.object
    user: PropTypes.object,
    usersEntry: PropTypes.object,
    get: PropTypes.func,
    update: PropTypes.func,
    delete: PropTypes.func,
    create: PropTypes.func
  }

  render() {
    window.console.log(this.context.c);
    // this.props.profile.login
    return (
      <div>
        <LoadingBar
          style={{height: 2, top: 1, zIndex: 999}}
          updateTime={100}
          maxProgress={95}
          progressIncrease={10}
        />
        {app.select('user.profile', true).render(profile => (<h1>Welcome back: {profile.login}</h1>))}
        <h5>List Test</h5>
        <div>当前用户：{this.props.user.name}</div>
        <ul>
          {
            this.props.usersEntry.data.map((d, index) => {
              return (<li key={index}>
                <span>用户名：{d.name}</span>
                <button onClick={() => {
                  this.props.get(d.id);
                }}>选择</button>
                <button onClick={() => {
                  this.props.update({id: d.id, name: '大兄弟'});
                }}>更新</button>
                <button onClick={() => {
                  this.props.delete(d.id);
                }}>删除</button>
              </li>);
            })
          }
        </ul>
        <button onClick={() => {
          this.props.create({id: new Date().getTime(), name: '大兄弟'});
        }}>添加</button>
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
