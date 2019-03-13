# 数据模型`Model`
数据模型`Model`是一类数据的集合，包含有2个要素：数据状态`state` 和 数据行为`action`, 以下是一个简单的示例代码

```javascript
  const model = {
    state: {
      name: 'a'
    },
    actions: {
      setName(name) {
        return {
          name: name
        };
      }
    }
  }
  // 注册数据模型
  app.model('test', model);
  // 获取数据模型实例
  const model = app.model('test');
  // 打印a
  console.log(model.state.name);
  // 调用数据行为方法
  model.actions.setName('b');
  // 打印b
  console.log(model.state.name);
```

描述一个完整Model对象，需要具备以下数据结构：

| **属性** | **描述** | **默认值** |
| :--- | :--- | :--- |
| `displayName` | 实例名 | N/A |
| `state` | 数据基础结构, 或者`store` | {} |
| `actions` | 改变数据的行为方法 | N/A |
| `subscriptions` | 跨数据模型的行为监听，或者`externalReducers` | N/A |

```javascript
  // 以React的propTypes概念来描述属性类型，方便我们来描述每个属性的类型
  const propTypes = React.PropTypes;
  const modelShape = {
    displayName: propTypes.string,
    state: propTypes.object,
    actions: propTypes.object,
    reducers: propTypes.object,
    subscriptions: propTypes.object
  }
```

+ `subscriptions`, 跨model监听

```javascript
  /* 跨model监听，当指定`${modelName}`的数据模型中，其`${actionName}`触发并且执行`${status}`回调时，会触发当前数据模型的监听时间
  const subscriptions = {
    `${modelName}.${actionName}.${status}: (nextStore, playload) => {
    }
  }
  */
  app.model({
    displayName: 'model1',
    actions: {
      test: () => {
        console.log(1);
      }
    }
  });
  app.model('model2', {
    subscriptions: {
      'model1.test': () => {
        console.log(2);
      }
    }
  });
  const model1 = app.model('model1');
  app.actions.test();
  // 打印：1 2
```

符合以上数据结构的Model可以通过`app.model(Model)` 或者 `app.model(name, Model)`注册到应用中。

### action的3个概念，也是action的3个取值类型
1. `reducer < Function >`数据变更，返回的数据作为model最新的数据状态
2. `actionProcessor < Function >`行为计算逻辑，此时action只做计算，不会触发数据变更，但是函数参数中包含了 数据变更的回调函数，比如`put`
3. `actionDescriptor < Object >`行为描述对象，一般来说是`actionProcessor`和`reducer`的组合。

#### `reducer < Function >`

当action取值为普通函数时，会被定义为`reducer`，如下action调用，model的state值将更新为`{a: 2}`

```javascript
  app.model('test', {
    state: {
      a: 1
    },
    actions: {
      test: () => {
        return {
          a: 2
        }
      }
    }
  });
```

在model.reducers中也可以进行reducer，但是不能直接通过 `model.reducers.xxx()`来触发。

在reducers中定义的reducer格式为`function(state, payload){...}`，实时上`actionDescriptor`中的`reducer`也事遵从这个定义规范。
* state表示model的最新数据状态
* payload是action触发成功后的装载数据对象

```javascript
  app.model('test', {
    reducers: {
      // reducer，数据变更直接接收返回值
      set: (state, payload) => {
        return payload.data
      }
    },
    actions: {
      // reducer，数据变更直接接收返回值（定义在action中）
      reset() {
        return {a: 0}
      },
      // reducer，可直接改变state，从而达到更新数据状态效果
      add: (state, payload) => {
        state.test.a = state.test.a + 2;
      },
      // actionProcessor，只做计算，最后通过put发起数据变更（通过type找到reducer，从而通过reducer变更）。
      trigger({put}) {
        put({
          type: 'set',
          payload: {
            data: {
              a: 1
            }
          }
        })
      }
    }
  });
  // state = {a: 1}
  app.model('test').actions.trigger();
  // state = {a: 0}
  app.model('test').actions.reset();
  // state = {a: 2}
  app.model('test').actions.add();
```

#### `actionProcessor < Function >`

action行为计算逻辑，不会直接变更数据状态，上一个示例中的trigger方法就是`actionProcessor`，除此之外，对于action值为`GeneratorFunction` 和 `AsyncFunction`时，都是属于`actionProcessor`

```javascript
  // 延续上一个示例
  app.model({
    ...
    actions: {
      // 可以发现，action为函数时，最后一个参数从能拿到put回调，用于变更数据，此时`reducer`也可以作为`actionProcessor`使用
      trigger(...args, {put}) {
        put({
          type: 'set',
          payload: {
            data: {
              a: 1
            }
          }
        })
      },
      // GeneratorFunction，配置yield，异步转同步
      * set(...args, {put}) {
        yield put({
          type: 'set',
          payload: {
            data: {
              a: 1
            }
          }
        })
      },
      // AsyncFunction，配置await，异步转同步
      async reset(...args, {put}) {
        await put({
          type: 'set',
          payload: {
            data: {
              a: 0
            }
          }
        })
      },
    }
  })
```


#### `actionDescriptor < Object >`

有2个属性，分别是`exec`和`reducer`，分别有2种值类型
  1. 常用类型的`actionDescriptor`
    * exec值为`actionProcessor`类型，用于行为计算，返回的值会走到，`actionDescriptor.reducer`
    * callback（可命名为reducer）, 同`reducer`概念，用于变更数据状态。
  2. 特殊类型的`actionDescriptor`
    * exec值为`ajaxOption`类型，Beatle内部会通过`ajax`来发起请求，获取的数据会走到`actionDescriptor.reducer`
    * callback（可命名为reducer）, 有2种值类型
      1. `Function`类型，同`reducer`概念，在ajax接口请求成功后会进入
      2. `Object`，值类型为：`{start, success, error}`，属性值均为`reducer`概念，会分别在ajax发请求之前、请求成功 和 请求失败 时进入。

```javascript
  app.model('test', {
    state: {
      profile: {},
      repos: []
    },
    actions: {
      getProfile: {
        exec: () => app.ajax.get('https://api.github.com/users/baqian'),
        callback: (state, payload) => {
          // exec返回的数据，总能通过payload.data获取到
          state.profile = paylaod.data;
        }
      },
      getRepos: {
        exec: {
          url: 'https://api.github.com/users/baqian/repos',
          method: 'get'
        },
        callback: {
            // 接口请求之前触发
          start: (state, payload) => {
            state.repos = [];
          },
          success: (state, payload) => {
            // 接口resolve的数据，能通过payload.data获取到
            state.profile = paylaod.data;
          },
          error: (state, payload) => {
            // 接口reject
            state.repos = [];
          }
        }
      }
    }
  });
```

> playload的数据结构为`{data, arguments, message}`，data是`actionDescriptor`返回的数据（如果返回是promise，则为resolve的数据），arguments是`actionDescriptor`调用时传入的参数，message则是接口请求reject的错误信息

### 结合resource

resource是接口配置对象，用于描述一类接口的调用配置

> 通过swagger-editor导出的JS接口调用，会生成多个resource

```javascript
  // 第一种形式
  const resource = {
    getRepos: {
      url: 'https://api.github.com/users/baqian/repos',
      method: 'get'
    }
  }

  // 第二种形式
  const resource = {
    getRepos() {
      return app.ajax.get('https://api.github.com/users/baqian/repos');
    }
  }
```

植入resource的概念，处于2个目的，第一是resource可以结合model，补充`actionDescriptor`中的`exec`属性值，第二是resource通过swagger管理，是目前接口管理的最佳方案之一，通过swagger导出的resource拿来即用。

#### `Beatle.createModel(Model, resource): < Model >`结合Model和resource
 1. 遍历resource对象，拿到每个属性和值
 2. 在model.actions中找到对应属性的行为，把值赋给行为的exec对象，找不到行为则，则丢弃掉

```javascript
  const resource = {
    getProfile: {
      url: 'https://api.github.com/users/baqian',
      method: 'get'
    },
    getRepos: {
      url: 'https://api.github.com/users/baqian/repos',
      method: 'get'
    }
  }
  const semiModel = {
    // 只要出现同名action，都会转成actionDescriptor，exec使用resource.getProfile填补
    getProfile(state, payload) => {
      state.profile = paylaod.data;
    },
    getRepos: {
      // exec会用resource.getRepos填补
      callback: {
        start: (state, payload) => {
          state.repos = [];
        },
        success: (state, payload) => {
          state.profile = paylaod.data;
        },
        error: (state, payload) => {
          state.repos = [];
        }
      }
    }
  }
  const model = Beatle.createModel(semiModel, resource);
  app.model('user', model);
```

### Model类

model可以通过类的形式来定义，需要继承于`Beatle.BaseModel`
* `state`定义数据状态
* 函数属性为`actionProcessor`行为计算，数据变更通过`setState`来实现
* `setState`有3种取值，其一是新的`state`值，其二是`reducer`，返回的值更新到最新state，其三是Map类型, key是要变更的数据状态的属性，value则是`actionDescriptor`类型值。

```javascript
  class Model extends BaseModel {
    state = {
      name: 'a'
    }
    setName(name) {
      this.setState({
        name: name
      })
    }
    reset(name) {
      this.setState(name: () => {
        return '';
      });
    }
  }
  
  // 注册数据模型
  app.model('test', Model);
  // 获取数据模型实例
  const model = app.model('test');
  // 打印a
  console.log(model.state.name);
  // 调用数据行为方法
  model.setName('b');
  // 打印b
  console.log(model.state.name);
```

> 同样的，resource是用来补充model中`actionDescriptor.exec`值

```javascript
  const resource = {
    getRepos: {
      url: 'https://api.github.com/users/baqian/repos',
      method: 'get'
    }
  }
  class SemiModel extends BaseModel {
    state = {
      profile: {},
      repos: []
    }
    getProfile() {
      this.setState({
        profile: {
          exec: {
            url: 'https://api.github.com/users/:name',
            method: 'get'
          },
          callback: (state, payload) => {
            state.profile = paylaod.data;
          }
        }
      }, 
      // setState可以有3个参数，第二个参数则是要传入到actionProcessor.exec作为参数
      {name: 'baqian'}, 
      // 第三个参数表示actionProcessor.exec执行成功后的回调
      (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('success');
        }
      })
    }
    getRepos() {
      this.setState({
        repos: {
          exec: 'getRepos',
          callback: {
            start: (state, payload) => {
              // 等同于state.repos = [];
              return [];
            },
            success: (state, payload) => {
              state.profile = paylaod.data;
            },
            error: (state, payload) => {
              state.repos = [];
            }
          }
        }
      })
    }
  }
  const Model = Beatle.createModel(SemiModel, resource);
```

#### 接口调用crud

通过Model和resource的结合，生成新的Model，极大方便了resource的统一管理（比如通过swagger导出）。同时我们发现Model中对于接口的调用，需要把数据缓存到`state`中，其更新数据到`state`的方式是可以归纳为一下5种类型reducer。
1. get获取单个记录，单个记录保存到`state.item`
2. query获取记录列表，记录列表保存到`state.list`
3. create创建新记录，新建记录插入到`state.list`
4. update更新记录，在`state.list`找到指定的记录，做merge更新
5. delete删除记录，在`state.list`找到指定记录，从list中剔除掉

大部分的数据模型都需要以上的操作，我们可以把这5种类型的`reducer`，改为通用函数，在多个model中复用。事实上，Beatle提供了一个`crud`的函数集

```javascript
  import {crud, BaseModel} from 'beatle';
  class Model extends BaseModel {
    state = {
      item: crud.item,
      list: crud.itemsEntry
    }
    get(id) {
      return this.setState({
        exec: {url: 'apiDomain/entity/:id', method: 'get'},
        callback: crud.get
      }, {id: id})
    }
    query() {
      return this.setState({
        exec: {url: 'apiDomain/entity/query/list', method: 'get'},
        callback: crud.query
      })
    }
    create(body) {
      return this.setState({
        exec: {url: 'apiDomain/entity/', method: 'post'},
        callback: crud.create
      }, body)
    }
    update(body) {
      return this.setState({
        exec: {url: 'apiDomain/entity/:id', method: 'put'},
        callback: crud.update
      }, body)
    }
    delete(id) {
      return this.setState({
        exec: {url: 'apiDomain/entity/:id', method: 'delete'},
        callback: crud.delete
      }, {id: id})
    }
  }
```

#### 装饰器

通过装饰器，优化编码，以下将创建一个完整的Model。

```javascript
  import {crud, BaseModel, exec, createModel} from 'beatle';
  const resource = {
    get: {url: 'apiDomain/entity/:id', method: 'get'},
    query: {url: 'apiDomain/entity/query/list', method: 'get'},
    create: {url: 'apiDomain/entity/', method: 'post'},
    update: {url: 'apiDomain/entity/:id', method: 'put'}
    delete: {url: 'apiDomain/entity/:id', method: 'delete'}
  }
  @createModel(resource)
  class Model extends BaseModel {
    state = {
      item: crud.item,
      itemsEntry: crud.itemsEntry
    }

    /**
    * @exec([stateName, feedback])    stateName表示要更新state的属性, feedback表示promise回调
    * action = crud[actionProcess_temple]   actionProcess_temple是模版函数，类型为actionProccessor
    * action为要调用的行为方法，如果通过createModel和resource合并，action来自于resource的指定接口定义
    */
    @exec('item')
    get = crud.get;

    @exec('itemsEntry')
    query = crud.query;

    @exec('itemsEntry', crud.message('创建成功', '创建失败'))
    create = crud.create;

    @exec('itemsEntry')
    update = crud.update;

    @exec('itemsEntry')
    delete = crud.delete;
  }
```

### Model和组件结合

Beatle初始化成功后，会产生一个数据作用域`seed`实例，这是应用的单一数据源`store`，所有的数据模型的数据状态都会维护在`store`中，组件通过订阅方式来消费`store`中的数据状态。

```javascript
  const app = new Beatle();
  app.model({
    displayName: 'test',
    state: {
      a: 1
    },
    actions: {
      set: (v) => {
        return {
          a: v
        };
      }
    }
  });
  const model = app.model('test');
  class Component extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        a: model.state.a
      };
    }
    componentDidMount() {
      // 挂载成功后，订阅store数据
      app.seed.subscribe((state) => {
        this.setState({
          a: state.test.a
        });
      });
      // 1秒钟后变更为10
      setTimeout(() => {
        model.set(10);
      }, 1000);
    }
    render() {
      return (<div>{this.state.a}</div>)
    }
  }
  ReactDOM.render(<Component/>, document.body);
  
```

以上代码可以精简下，把数据订阅的逻辑自动化掉

```javascript
  const app = new Beatle();
  app.model(...);
  class Component extends React.Component {
    componentDidMount() {
      // 1秒钟后变更为10
      setTimeout(() => {
        // 可以发现model的action也注入进来了
        this.props.test.set(10);
      }, 1000);
    }
    render() {
      // 注意，这里不是props.a而是props.test.a
      return (<div>{this.props.test.a}</div>)
    }
  }
  // 这一步很关键，把名为test的数据模型，注入到组件的props种。
  const HocComponent = app.connect('test', Component);
  // 可以发现，我们把之前的组件拆成了2个组件，最外层组件是Hoc组件，负责订阅store，内层组件，负责数据渲染和触发数据更新，只接收传入的props。
  ReactDOM.render(<HocComponent/>, document.body);
```

> 以上示例，如果想要把数据模型注入到组件中，并且想要直接props.a访问到数据状态，可以通过`app.connect('test', Component, true)`，第三个参数为 true，表示以平铺的方式注入到props。
> 如果需要注入多个数据模型，建议使用非平铺方式注入

```javascript
  class Component extends React.Component {
    render() {
      return (<div>{this.props.a}</div>)
    }
  }
  const HocComponent = app.connect('test', Component, true);
```

+ `app.connect(bindings, Component, flattern)`连接数据模型和组件
1. `bindings` 数据绑定策略，用于声明注入到组件的数据模型
2. `Component` React组件
3. `flattern` 平铺方式注入

`bindings`有4种取值，延续上一个示例来说明
```javascript
  // bindings = [mapStateToProps, mapDispatchToProps], 此时flattern只能为true
  app.connect([
    (state) => {
      return {
        a: state.test.a
      }
    }
    (dispatch, props, actions) => {
      return {
        set: actions.test.set
      }
    }
  ], Component);
  // bindings = [stateMap, dispatchMap]
  app.connect([
    {
      // 描述模型.state|actions.属性名
      a: 'test.state.a'
    },
    {
      set: 'test.actions.set'
    }
  ], Component)
  // bindings = 'modelName'
  app.connect('test', Component, true)
  // bindings = ['modelName'], 多个model
  app.connect(['test'], Component, true)
```

### 多应用场景
主要包括数据模型注册到哪个应用，以及选择数据模型连接组件。

```javascript
  import {BaseModel, model, connect} from 'beatle';
  const app = new Beatle({
    name: 'main'
  });
  @model({
    app: 'main'
  })
  class Model extends BaseModel{
    static displayName = 'test';
    ...
  }
  @connect({
    app: 'main',
    bindgins: ['test'],
    flattern: false
  })
  class Component extends React.Component {
    ...
  }
```

### 响应式的数据模型

这里指的是数据状态的响应式，获取数据状态时，实际拿到的数据状态的序列，通过改变序列，从而达到数据更新的效果

+ 响应式数据
 1. `observable`，转变数据状态为可观察序列
 2. `computed`，转变返回的数据状态的函数为可观察序列
 3. `action`，观察函数调用后，其可观察的数据状态是否发生了变更，变更则通知已订阅的观察者。
+ 响应式组件
 1. `observer` + `inject`，订阅观察序列，当接收到通知时，驱动组件重新渲染。

```javascript
  import {BaseModel, model, observable, computed, action, observer} from 'beatle';

  // 注册Model到app
  @model()
  class Model extends BaseModel {
    static displayName = 'user';

    @observable
    profile = {}

    @observable
    repos = []

    @computed
    get reposList() {
      return this.repos;
    }

    @action
    getUserInfo(name) {
      return this.ajax.get('https://api.github.com/users/' + name).then(res => {
        // 应为profile被observable转成可观察的序列，只要在@action中变化profile，都会更新到数据状态
        this.profile = res;
      });
    }

    @action
    getRepos(name) {
      return this.ajax.get('https://api.github.com/users/' + name + '/repos').then(res => {
        this.repos = res;
        this.getUserInfo(name);
      });
    }
  }
  
  // 等同于app.connect(['user'], Component);
  @observer({
    inject: ['user'] // bindigns
  })
  class Component extends React.Component {
    static contextTypes = {
      app: React.PropTypes.object
    }
    static propTypes = {
      user: PropTypes.object
    }
    componentDidMount() {
      this.props.user.getUserInfo('baqian');
    }
    render() {
      return (<div>
        <h1>{this.props.user.profile.name}</h1>
        <ul>
          {
            app.observer('user.repos').render(ret) => {
              // app.observer可以持续观察数据状态，一旦有变化则立即更新组件
              return ret.map((item, index) => (<li key={index}>{item.name}</li>));
            }
          }
        </ul>
      </div>);
    }
  }
```

### 一次配置多个数据模型

```javascript
  // models属性配置数组
  const app1 = new Beatle({
    models: [model1, model2]
  });
  // models是Map
  const app2 = new Beatle({
    models: {
      a: model1, // a, b为数据模型的实例名
      b: model2
    }
  });
  // 结合webpack的require.context扫描
  const app3 = new Beatle({
    models: require.context(...)
  });
  // 动态配置
  Beatle.autoLoad.loadModels = () => {
    return [model1, model2]; // require.context(...)
  }
  // 后续的Beatle初始化都有效
  const app4 = new Beatle({
    autoLoadModels: true
  });
```