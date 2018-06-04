# Beatle &middot; [![GitLab license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/master/LICENSE)

Beatle是一套轻量级前端框架，借助React、Redux实现应用界面构建流程。

## 特性

1. 简单化Api，快速掌握开发技巧，只需掌握React框架。
2. 轻量概念，React-like-Model 构建数据模型（state存储数据状态，setState变更数据状态）
3. MVVM实现VM模块自动化，即自动化绑定数据和视图逻辑。
4. 应用中间件，数据通信过程的设置中间件，方便应用接入外部扩展。
5. 由简入繁，多应用嵌套构建复杂应用，方便管理应用之间的通用服务通信 以及 数据通信。

## 启动和打包

```javascript
  // 启动
  honeypack start

  // 打包
  honeypack build -c webpack.build.js
```

# Beatle-API

## Class: Beatle

+ Beatle支持多应用场景，每个应用都需要通过New Beatle来生成实例。

```javascript
  const app = new Beatle(options);
  app.run(options);
```

以下出现的 `app` 皆为 `Beatle` 的实例, 在初始化传入的配置`options`:

 | 属性 | 描述 | 默认 |
 |:------ |:------ |:------ |
 | name `String` | 应用实例名 | N/A |
 | store `Object` | 应用数据中心的初始化数据 | `{}` |
 | middlewares `Array` | 应用数据处理中间件，通过中间件可以变更数据结果 | `[]` |
 | ajax `Object` | 应用接口请求对象初始化依赖的配置项 | `{}` |
 | root `DOM` | 应用唯一挂载的DOM树节点 | `document.body` |
 | base `String` | 应用启动，路由访问的根路径 | `/` |
 | query `Object` | 设置路由全局参数 | N/A |
 | autoLoadModel `Boolean` | 是否自动加载数据模型，如果开启则加载`assets/auto_models.js`文件 | `true` |
 | autoLoadRoute `Boolean` | 是否自动加载路由，如果开启则加载`assets/auto_routes.js`文件 | `false` |
 | models `Object︱Function︱Context` | 需要注册的数据模型 | N/A |
 | routes `Object︱Function︱Context` | 需要注册的路由 | N/A |
 | routeType `Boolean` | 路由处理器类型，主要分为hash还是原生 | `browserHistory`, 参考:`browserHistory` 和 `hashHistory` |
 | subApp `Boolean` | 是否为子应用 | `false` |

应用实例`app`有相应的方法来完成应用构建，包括`注册数据模型`, `注册路由`, `应用启动`等。

### Beatle.getApp(appName)
* return <`Beatle`> 返回指定的Beatle实例

多应用场景下通过选择指定应用实例，从而完成单个应用的构建。

```javascript
  class Root extends React.Component{
    render() {
      return <h5>Hello Worlld {this.props.location.query.appName}!</h5>
    }
  }
  // 创建应用A，输出Hello World A!
  const appA = new Beatle({
    name: 'appA',
    ...
  });
  appA.route('/', Root, {query: {appName: 'A'}});
  appA.run();
  // 应用B，处处Hello Wolrd B!
  const appB = new Beatle({
    name: 'appB',
    ...
  });
  appB.route('/', Root, {query: {appName: 'B'}});
  appB.run();

  // 通过指定应用名来获取应用A实例
  Beatle.getApp('appA');
```

### Beatle.createModel(model, resource)
* model <[Model](#model)> 需要组合的数据模型
* resource <[Resource](#resource)> 组合需要的接口封装对象
* return <[Model](#model)> 返回组合好的Model

在Beatle中`数据模型Model`是指一类数据的集合，一个数据模型包含了`数据基础结构`, `改变数据的行为方法` 以及`跨数据模型的监听`。

resource是接口调用的封装对象，一般来说，我们会愿意把接口单独定义到业务逻辑之外的对象中。

* 来了解一下在Beatle中应用Model

```javascript
  // 1. 定义一个数据模型
  const model = {
    // 定义数据模型实例名（注意，以下通过实例名来获取到Beatle生成的model的实例
    displayName: 'test',
    // 定义数据结构
    state: {
      value: 1
    },
    // 定义数据行为
    actions: {
      // model注册后，set会变成一个方法，出入的参数，会写到paylaod.arguments属性。
      set: (nextState, payload) => {
        // nextState是state的最新版本, set定义第一个参数值，赋值给value属性
        nextState.value = payload.arguments[0];
        return nextState;
      }
    }
  }
  // 2. 初始化Beatle应用
  const app = new Beatle({name: 'main'});
  // 3. 注册model
  app.model(model);
  // 获取model实例
  const modelInst = app.model('test')
  // 打印输出 value: 1
  console.log('value :' + modelInst.state.value); 
  // 调用行为，写入数据
  modelInst.set(2);
  // 打印输出 value: 2
  console.log('value :' + modelInst.state.value);
  // 4. 定义组件，并挂在路由
  class Root extends React.Component{
    render() {
      return <span>component props value :{this.props.test.value}</span>
    }
  }
  // 5. 把组件和数据模型进行绑定
  const ConnectRoot = Beatle.connect(['test'], Root);
  // 路由响应时，组件输出 component props value :2
  app.route('/', ConnectRoot);
  // 调用行为，写入数据
  modelInst.set(3);
  // 组件自动更新，并输出 component props value :3

  // 运行应用
  app.run();
```

* 数据模型可以通过class来创建

```javascript
// 1. 定义一个数据模型
  class Model extends Beatle.BaseModel {
    static displayName: 'test';
    state = {
      value: 1
    }
    set(v) {
      // this.setState(obj, ...args), 通过底部传入参数，通过payload.argumnets获取
      return this.setState({
        value: (nextState, payload) => {
          return payload.argumens[0];
        }
      }, v);
    }
  }
```

* model的数据行为异步时

```javascript
  // 1. 通过纯对象创建
  const model = {
    displayName: 'test',
    state: {
      value: 1
    },
    actions: {
      // set: callback 改为 set: {callback}, 异步行为包括数据预处理，都需要通过exec属性来返回。
      set: {
        // 通过exec返回的数据（获取promise，其接受的数据)。通过payload.data获取
        exec: (v) => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(v)
            }, 100);
          })
        },
        callback: (nextState, payload) => {
          nextState.value = payload.data;
          return nextState;
        }
      }
    }
  }
  // 2. 通过class创建
  class Model extends Beatle.BaseModel {
    static displayName: 'test';
    state = {
      value: 1
    }
    set(v) {
      return this.setState({
        // value: callback 改为 value: {callback}
        value: {
          // exec: () => promise 可以改为exec: promise, exec返回的数据，通过payload.data获取
          exec: (v) => {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(v)
              }, 100);
            })
          },
          callback: (nextState, payload) => {
            // 单一职责，返回的数据，只会更新value值
            return payload.data;
          }
        }
      }, v);
    }
  }
```

* 数据模型的异步行为通过接口获取数据

```javascript
  class Model extends Beatle.BaseModel {
    static displayName: 'test';
    state = {
      value: 1
    }
    set(v) {
      return this.setState({
        value: {
          // !!注意，此处exec只是接口的配置，这是Beatle支持的一种特殊的exec形式，其内部会通过fetch来触发调用
          exec: {
            url: 'http://api.github.com', 
            method: 'get', 
            data: {id: v}
          }
          /**
           * 相同的方式，还有2种办法
           * 1. exec: fetch('http://api.github.com', v),
           * 2. exec: v => return fetch('http://api.github.com', {id: v});
           */
          callback: (nextState, payload) => {
            return payload.data;
          }
        }
      }, v);
    }
  }
```

* 回到主题，createModel的目的就是抽象exec，独立维护在model之外

```javascript
  const resource = {
    set: {
      url: 'http://api.github.com', 
      method: 'get', 
      data: {id: v}
    }
  }

  // 以下是装饰器用法，也可以通过 Model = Beatle.createMode(resource)(Model);
  @Beatle.createMode(resource)
  class Model extends Beatle.BaseModel {
    static displayName: 'test';
    state = {
      value: 1
    }
    set(v) {
      return this.setState({
        value: {
          // !!注意，exec为合并进来的Resource对应的属性，如果没有找到则当做exec不存在
          exec: 'set'
          callback: (nextState, payload) => {
            return payload.data;
          }
        }
      }, v);
      // 更简洁的写法, 通过value对应的函数名来指定exec
      /**
       * return this.setState({
       *  value: function set(nextState, payload){
       *    return payload.data;
       *  }
       * })
       */
    }
  }
```

> 这样下来，所有的接口都单独定义在resource对象下，对于大的应用会存在很多resource。对于resource我们可以在业务之外单独做调试，这样服务分层的管理，代码更加健壮和清晰。

> Model的使用下面API有更详细介绍

### Beatle的其他静态属性

| 属性 | 描述 |
|:------ |:------ |
| [Ajax](#class-ajax) | 接口调用Ajax类，可单独初始化ajax实例 |
| [Poller](#class-poller) | 轮询调用Poller类 |
| [Link](#class-link) | 封装了`react-router`的Link, 带上全局base和query |
| [ReduxSeed](#class-reduxseed) | 数据驱动机制可单独使用，不依赖Beatle，包含完整的数据模型以及Redux处理一整套机制 |

下面我们来看下Beatle实例`app`有哪些方法和对象可以使用。

### app.ajax

`app`是有`new Beatle`初始化的实例，在初始化同时时，内部还会初始化2个实例：`ajax` 和 `seed`, 分别为[Ajax](#class-ajax)的实例 和 [ReduxSeed](#class-reduxseed)的实例。

ajax可以设置实例级别的事件监听，分别通过以下方法来设置

| 方法 | 参数类型 | 描述 |
|:------ |:------ |:------ |
| setHeader(headers) | headers `Object` | 设置`headers`配置 |
| beforeRequest(fn) | fn `Function` | 请求之前`beforeRequest`的处理，此时可以更改接口配置或者更多 |
| beforeResponse(fn) | fn `Function` | 接口结果预处理`beforeResponse`， |
| afterResponse(fn) | fn `Function` | 接口结果后处理`afterResponse` |
| set(name[, value]) | name `String`, value `any` | 前4个方法都可以通过set方法来设置，简化操作 |

```javascript
  const app = new Beatle();

  // 在请求之前，监听事件处理
  app.ajax.beforeRequest(
    function (ajaxOptions) {
      // 场景1，更改接口请求配置
      ajaxOptions.data = {};
      // 场景2，直接返回mock数据，并中断后续接口请求（只要返回promise，就能中断请求)
      return Promise.resolve({
        // mock数据
      })
    }
  );

  app.ajax.beoreResponse(
    function(response, ajaxOptions, request){
      // 和afterResponse的区别在于，response拿到的是Response实例，还未对数据进行解析处理
      // 比如接口返回的是JSON的stringify数据，那么需要通过json方法进行解析
      // 具体以何种方法来解析数据，需要通过ajaxOptions的`dataType`属性来指定
      return response.json();
    }
  )

  // 请求成功，并解析response数据成功后进入
  app.ajax.afterResponse(
    function (result, ajaxOptions, request) {
      // 这里result是解析完成的数据
      if(result instanceof Error){
        // status不为200到299之间的报错均封装成Error实例
      }else if(result.code !== 'SUCCESS'){
        // 接口自身数据判断是否有问题
      }else{
        // 返回正确的数据
        return result.data;
      }
    }
  );
```

> 接口请求配置[dataType](#class-ajax)用于声明如何解析接口数据

### app.seed

seed实例是[ReduxSeed](#class-reduxseed)实例，`app.getStore()`实际上是通过seed实例中获取store对象。

### app实例开放API

| 方法 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| getStore() `Object` | N/A | 获取redux状态容器 |
| getRoutes() `Array` | N/A | 获取react-router的路由配置 |
| use(middleware) | middleware `Function` | 注册中间件，中间件是在处理处理过程中变更数据结构或者做一些必要的监控 |
| getResolvePath(routeConfig) `String` | routeConfig `Object` | 根据路由配置获取真实的路径 |
| route(path[, component]) | path `String︱Array︱Object︱Context`, component `ReactComponent` | 只有一个参数，此时为字符串则查找路由配置，否则是批量注册路由配置；2个参数未显示注册单个路由配置 |
| routesFactory(routes, option) | routes `Array︱Object︱Context`, option `Object` | 批量注册路由，可以传入option做更多处理 |
| model(Model) | Model `Object` | 注册数据模型 |
| connect(bindings, component[, context, flattern]) | bindings `String︱Object︱Array`, component `ReactComponent`, context `Object`, flattern `Boolean` | 设置视图, binding指定注入数据模型或者根据数据模型注入数据和方法 |
| service(providers, isGlobal) | providers `<Object|Function|Array>`, isGlobal `Boolean` | 注册全局服务（通用js对象）|
| observable(obj) | obj `<Array|Promise|Observable>` | 把数据转为观察序列 |
| view(Selector, component, providers) | Selector `Object`, component: `ReactComponent`, providers: `Array<Object|Function|Array>` | 设置视图，并注入context |
| run([rootDom, basePath]) | rootDom `Object`, basePath `String` | 启动应用 |

> 当app为Beatle的主应用时，可以通过Beatle.xxx直接调用app对应的方法。
> 所有app实例的开放api都可以通过Beatle进行访问

```javascript
  const mainApp = new Beatle({});
  const subApp = new Beatle({subApp: true});

  // Beatle.run 等同于mainApp.run, 相同的还有`use`, `model`等
```
> 在new Beatle的配置项[options](#class-beatle)中有subApp属性来声明是否为子应用，否则就是主应用。
> 在Beatle支持多应用的场景下，主应用必须只为一个，其他均为子应用，否则将会出现预想不到的问题。

### app.getStore()

在new Beatle产生实例`app`时，应用内部会创建一个单一的数据共享对象，后面统一称之为`状态容器store`, 如果你熟悉`Redux`，当前`store`也可以在`Redux`技术体系下正常工作。

```javascript
  const app = new Beatle();

  const store = app.getStore();
  store.substribe(function () {
    console.log('current state ==>', sotre.getState());
  });
```

### app.model(model)
* model <[Model](#model)>

应用中注入数据模型[Model](#model)，注册功能后，数据模型的将交给`store`进行托管。

```javascript
  // 此时user还未注册到app中，所以将没有任何内容被绑定
  app.connect('user', ReactComponent);
  app.model({
    displayName: 'user',
    ...
  });
  // 此时绑定有效，user数据模型和组件建立了绑定，后续一旦这个user发生数据变更时，组件将自动调用render来更新视图。
  app.connect('user', ReactComponent);
```

### app.connect(modelList, component, flattern)
* modelList <`String|Object|Array`> 指定需要绑定的数据模型实例名
* component <`ReactComponent`> 指定组件来绑定
* flattern <`boolean`> 是否平铺属性
* return <`ReactComponent`> 返回新的React组件

```javascript
  import React from 'react';
  import Beatle from 'beatle';

  const app = new Beatle();

  const Model = {
    displayName: 'user',
    store: {
      nickname: 'anonymous'
    },
    actions: {
      login: {
        // 同步的action，直接从arguments中取值，arguments = ['Trump']
        callback: (nextStore, payload) => {
          nextStore.nickname = payload.arguments[0];
        }
      }
    }
  }

  class SayHello extends React.Component {
    componentDidMount() {
      this.props.user.login('Trump');
    }
    render() {
      return 'hello ' + this.props.user.nickname;
    }
  };

  app.model(Model);
  const component = app.connect(['user'], SayHello);
  app.route('/', component);
  app.run();
  // 访问/, console输出为：hello Trump!
```

### app.service(providers, isGlobal)
* providers <`Function|Object|Array`> 注入的全局的服务JS类
* isGlobal <`Boolean`> 是否是全局的（跨所有应用）

```javascript
  const app = new Beatle({name: 'main'});
  function A() {
    return {
      v: 1
    }
  };
  // B依赖于A，通过数组最后一位是服务定义，其他项为依赖的服务名
  const B = ['a', function(a) {
    return {
      v: a.v + 1
    }
  }];
  // B是其中的一种依赖方式，C是另外一种依赖方式，通过contextTypes属性声明
  class C{
    static contextTypes: {
      b: React.PropTypes.object.isRequired
    }
    get v() {
      return this.context.b.v + 1;
    }
  }
  
  function D(c) {
    return c.v + 1;
  }
  // D是另外一种依赖方式，通过$inject声明，是不是很熟悉，ng 1.x中服务依赖也是如此
  D.$inject = ['c'];

  // 注册服务A，通过displayName来指定服务名
  A.displayName = 'a';
  const a = app.service('a');
  // 输出 1
  console.log(a.v);
  // 注册服务, 通过key来指定服务实例名称
  app.service({
    b: B,
    c: C,
    d: D
  });
  // 通过名称获取服务实例
  const b = app.service('b');
  // 输出2, 因为b依赖于a + 1, B的依赖会从全局服务中找
  console.log(a.v);
  const d = app.service('d');
  // 输出4, 因为d依赖于c + 1， c依赖于b + 1， b依赖于a + 1
  console.log(d.v);
```
### app.observable(obj)
* obj <`Array|Promise|Observable`> 指定需要转为序列的数据
* return <`Observable`> 返回可订阅序列

```javascript
const stream = app.observable([1, 2, 3]);
stream.subscribe(v => {
  console.log(v + ', ');
});
// 输出 1, 2, 3

const stream = app.observable(Promise.resolve('123'));
stream.subscribe(v => {
  console.log(v);
});
// 输出 123

const promise = new Promise(resolve => {
  setTimeout(() => {
    resolve({name: 123});
  }, 1000);
});
// 针对react特殊定义，可以输出异步组件
ReactDOM.render( => (<div>Hi, {app.observable(promise).render(d => d.name)}</div>), document.body);
```

> Observable序列是rxjs中的概念，适用于把异步数据按时间轴转换为有顺序的序列数据，方便操作。

### app.view(Selector, component, providers)
* Selector <`Object`> 指定需要绑定的数据选择器
* component <`ReactComponent`> 指定组件来绑定
* providers <`Array<Object|Function|Array>`> 注入其他的服务，使得组件通过this.context可以访问到。
* return <`ReactComponent`> 返回新的React组件

```javascript
  class UserModel extends Beatle.BaseModel {
    state = {
      profile: {
        name: 'Guest'
      }
    }
    login(name) {
      return this.setState({
        profile: {
          exec: fetch('https://api.github.com/users/' + name),
          // 每次都需要写callback，而很多callback的处理基本都是统一的，比如接口的CRUD的处理。
          // 以下等同于Beatlep.crud.get
          callback: (nextProps, payload) => {
            return payload.data;
          }
        }
      })
    }
  }

  class Selector extends Beatlep.BaseSelector{
    // inputs相当于connect的 stateMergeToProps, 相对应的outputs等同于connect的 actionMergeToProps
    get inputs() {
      return (state, dispatch) => {
        return {
          profile: state.user.profile
        }
      }
    }
    // 这是数据选择器的钩子函数，在组件初始化完成时自动触发。
    initialize() {
      this.getModel('user').login('baqian');
    }
  }

  class Root extends React.Component{
    static propTypes = {
      profile: React.Proptypes.object
    }

    static contextTypes = {
      test: React.Proptypes.object
    }

    render() {
      // 组件会先输出 Hello Guest!，接口调用成功后，更新为 Hello baqian
      return (<div>{this.context.test.title} {this.props.profile.login}!</div>)
    }
  }
  // 和Beatlep.connect不同，connect绑定数据模型，view绑定数据选择器
  Root = Beatlep.view(Selector, Root, {
    test: function() {
      return {
        title: 'Hello'
      }
    }
  });
```

> 数据选择器是一个新的概念，在复杂的场景，一个组件往往会调用多个model，通过数据选择器来统一管理model，提高代码可读性

* Beatlep.crud

这是action数据处理的模板，以上的UserModel通过crud重新处理如下:

```javascript
  class UserModel extends Beatle.BaseModel {
    state = {
      profile: {
        name: 'Guest'
      }
    }
    login(name) {
      return this.setState({
        profile: {
          exec: fetch('https://api.github.com/users/' + name),
          callback: Beatlep.crud.get
        }
      })
    }
  }
```

crud的全部接口

```javascript
  crud = {
    item: {},
    itemsEntry: {
      data: [],
      loading: false,
      total: 0,
      pageSize: 10,
      page: 1
    },
    get,    // 获取数据
    create, // 新增
    update, // 更新
    query,  // 分页形式
    reset   // 恢复为初始化数据
  }
```

举个例子，通过crud创建一个UserModel，能节省大量代码

```javascript
  class UserModel extends BaseModel {
    static displayName = 'user';

    state = {
      user: crud.item,
      usersEntry: crud.itemsEntry
    }
    // 必须有id属性，用来识别指定数据项，从而判断是更新还是创建
    id = 'id';

    get(id) {
      return this.setState({
        user: {
          exec, // exec是异步逻辑处理
          callback: crud.get
        }
      }, {id: id});
    }

    delete(id) {
      return this.setState({
        usersEntry: {
          exec,
          callback: crud.delete
        }
      }, {id: id});
    }

    update(user) {
      return this.setState({
        usersEntry: {
          exec,
          callback: crud.update
        }
      }, user);
    }

    create(user) {
      return this.setState({
        usersEntry: {
          exec,
          callback: crud.create
        }
      }, user);
    }

    query(params) {
      return this.setState({
        usersEntry: {
          exec,
          callback: crud.query
        }
      }, params);
    }
  }
```





### app.route([path, routes])
* path <`String`>, 当存在path时，则是配置单个路由，此时routes应该为React组件或者Beatle子应用。
* routes <`ReactComponent|Beatle|ReactRouter`>, 不存在path时基于ReactRouter的路由的配置.

+ app.route(routes)

```javascript
  // routes为标准的react-router的路由配置项
  app.routes([
    {
      path: '/',
      component: RootComponent,
      childRoues: [
        {
          path: 'profile',
          component: ProfileComponent
        }
      ]
    }, {
      path: '*',
      component: 404Component
    }
  ])
```
+ app.route(path, component)

```javascript
  app.route('/', RootComponent);
  // 这种形式，如果想要配置childRoutes
  RootComponent.routeOptions = {
    childRoues: [
      {
        path: 'profile',
        component: ProfileComponent
      }
    ]
  }
  app.route('/', RootComponent);
```

+ app.route(path, subApp)
把子应用挂在主父级应用下，子应用的路由会继承下来，但需要追加根路径来访问。

```javascript
  const subApp = new Beatle({subApp: true});
  subApp.route('/', subAppRootComponent);
  subApp.route('/profile', subAppProfileComponent);
  app.route('/subApp', subApp);
  app.run();
  // 访问/subApp/ 会触达subAppRootComponent视图
  // 访问/subApp/profile 会触达subAppProfileComponent视图
```

### app.run([root, base])
* root <`DOM`>, app最终需要挂载到真实的DOM节点下.
* base <`string`>, app访问的路由，统一加上跟路由路径.

```javascript
  const app = new Beatle();
  app.route('/', RootComponent);
  app.route('/profile', ProfileComponent);
  app.run(document.body, '/beatle');
  // 此时访问/不能匹配任何路由
  // 访问/beatle/ 会触达RootComponent视图
  // 访问/beatle/profile 会触达ProfileComponent视图
```

## Model
Model数据模型是一类数据的集合，包含了数据的初始化结构，以及改变这些数据的行为方法。

描述一个Model对象，需要具备以下数据结构：

| **属性** | **描述** | **默认值** |
| :--- | :--- | :--- |
| displayName | 实例名 | N/A |
| store | 数据基础结构 | {} |
| actions | 改变数据的行为方法 | N/A |
| subscriptions | 跨数据模型的行为监听 | N/A |

```javascript
  // 以React的propTypes概念来描述属性类型，方便我们来描述每个属性的类型
  const propTypes = React.PropTypes;
  const modelShape = {
    displayName: propTypes.string,
    store: propTypes.object.isRequired,
    actions: propTypes.object,
    subscriptions: propTypes.object
  }
  // 在actions中每个action的结构，分2种情况
  // 异步action
  const action = {
    exec: propTypes.oneOfType([propTypes.object, propTypes.func]),
    callback: propTypes.oneOfType([propTypes.object, propTypes.func]),
  }
  // 同步action
  const action = {
    callback: propTypes.func,
  }
  // subscriptions每个subscription必须为方法
  const subscriptions = {
    `${modelName}/${actionName}/${status}: (nextStore, playload) => {
    }
  }
```

符合以上数据结构的Model可以通过`app.model(Model)`注册到应用中。

> 何时使用`Beatle.createModel(model, resource)`, 当你异步的action中exec需要单独维护到model外部时，通过Bealte.createModel组合进来，生成最终的Model

### Model行为action的配置

| **属性** | **参数类型** | **描述** |
| :--- | :--- | :--- |
| exec | `Object/Function` | 异步行为的触发条件，Beatle内部通过exec来识别异步行为，当exec为接口配置，会转为一个接口调用函数，如果是函数则不用做变动 |
| callback | `Object/Function` | 行为触发成功后进入，在同步行为时，callback只能为函数，异步行为时callback一般来说是对象，有3个回调函数，`start`, `success` 和 `error` |
| reducer | `Object/Function` | 同上callback |
| subscriptions | `Object` | 跨数据模型监听行为，从而变更自身数据 |
| externalReducers | `Object` | 同上subscriptions |

+ 行为action调用成功的回调函数

行为调用的处理逻辑
1. 行为方法触发时传入的参数会放到payload.arguments中
2. 判断行为是否存在`exec`属性，则会当做异步行为进行调用
  1. 触发行为时，会先执行`start`回调，
  2. 判断exec为函数时，执行函数返回非promise值，会直接进入到`success`回调，否则在promise的接收值时进入到`success`回调，在拒绝值时进入到`error`回调
  3. 如果exec为接口配置，则通过应用内部的ajax实例来发起接口调用，在接口成功并接收值时进入到`success`回调，在拒绝值时进入到`error`回调
3. 同步行为时直接进入到callback回调

```javascript
  callback: function (nextStore, payload){
    // nextStore是当前model可变的数据，我们知道model的基础数据是在store中定义，每次更新后会存到内存中，并不会改变store属性
    // 所以每次行为调用后的回调nextStore拿到可变的数据
    // payload是数据装载对象，最常用的，arguments是行为调用时传入的参数，而data属性是异步行为调用时接收的数据。
  }
```

+ 数据装在对象payload的结构

| **属性** | **描述** |
| :--- | :--- |
| type | 当前行为处理状态，不同行为状态会进入到不同的回调中 |
| store | 当前model的基础数据 |
| arguments | 行为调用时传入的参数 |
| data | 异步行为调用后，接收的数据 |
| message | 当异步行为调用失败后，会存在错误信息 |


+ 基于异步action调用以及跨数据模型监听行为的实现举个例子：

```javascript
  const UserModel = {
    displayName: 'user',
    store: {
      profile: {
        pending: true,
        nickname: 'anonymous'
      }
    },
    actions: {
      login: {
        callback: {
          start: (nextStore, payload) => {
            // 每次请求之前都重置为初始化值，通过payload.store可以获取到初始化值
            nextStore.profile = payload.store;
          },
          success: (nextStore, payload) => {
            // 获取成功后，接口返回值通过playload.data可以获取到
            nextStore.profile = {
              pending: false,
              nickname: payload.data.nickname
            };
          }
        }
      }
    }
  };
  const UserResource = {
    login: {
      url: '/login',
      method: 'GET'
    }
  }

  const AccountModel = {
    dispayName: 'account',
    store: {
      nickname: ''
    },
    subscriptions: {
      // nextStore为当前model的可变数据对象，user_login_payload是user实例的login行为调用成功后的payload
      'user.login.success': (nextStore, user_login_payload) => {
        nextStore.nickname = user_login_payload.data.nickname;
      }
    }
  }
  // 你会发现，UserResource存在相同行为名称的属性，值为接口调用配置。通过Beatle.createModel会组装到UserModel中
  app.model(Beatle.createModel(UserModel, UserResource));
  app.model(AccountModel);
  // 当UserModel的login行为触发调用，成功后，AccountModel的监听也会被触发，从而更新AccountModel的数据
```

## Resource

Resource是接口配置对象，结合Beatle.createModel来使用

+ `Beatle.createModel(model, resource)`时其内部将做如下处理
 1. 遍历resource对象，拿到每个属性和值
 2. 在model.actions中找到对应属性的行为，把值赋给行为的exec对象，找不到行为则，则丢弃掉

```javascript
const userModel = {
  ...
  actions: {
    login: {...}
  }
};

// resource/user.js
const userResource = {
  login: {
    url: '/login',
    method: 'GET',
    params: {
      username: 'default username'
    }
  },
  getUserList: {
    url: '/user/list',
    method: 'GET',
    params: {
      pageSize: 10,
      pageNo: 1
    }
  }
};

// getUserList不会生成行为，只有login会组合到login行为中
Beatle.createModel(userModel, userResource);
```

## Class: ReduxSeed

+ 通过new ReduxSeed产生seed实例

```javascript
  import {ReduxSeed} from 'beatle';

  const seed = new ReduxSeed({...});
```
+ new ReduxSeed传入options配置项：

| 属性 | 描述 | 默认 |
|:------ |:------ |:------ |
| name `String` | ReduxSeed支持多实例，初始化一个seed实例需要指定实例名称 | `main` |
| ajax `Object` | ajax实例 | N/A |
| initialState `Object` | store的基础结构 | `{}` |
| middlewares `Array` | 应用数据处理中间件，通过中间件可以变更数据结果 | `[]` |
| Models `Object` | 注册多个数据模型 | `{}` |

### ReduxSeed静态属性

| 名称 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| createModel | model `Object`, resource `Object` | 组合resource到model中，等同于Beatle.createModel |
| getRedux | name `String` | 获取指定的seed实例 

### seed实例方法

| 名称 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| reducerBuilder | model `Object`, resource `Object` | 组合resource到model中，等同于Beatle.createModel |
| register | model `Object`, resource `Object` | 注册一个model到seed实例 |
| getActions | modelName `String` | 获取指定的seed实例下的model的行为，为空时获取所有行为 |

## Class: Ajax

+ 通过new Ajax产生ajax实例，传入的options配置项，设置实例级的全局配置：

| 名称 | 描述 |
| :------ | :------ |
| headers | 全局的Header配置, 默认取值`window.ajaxHeader` |
| delimeter | 请求url默认支持插值替换，`delimeter`是插值变量的语法 |
| normalize | 请求url插值替换，是否都走data属性, 默认为`false` |
| beforeRequest(ajaxOptions) | 请求之前的钩子函数 |
| beforeResponse(response, ajaxOptions, xhr) | 请求成功后处理response对象的钩子函数 |
| afterResponse(result, ajaxOptions, xhr) | 请求成功后处理接口结果数据的钩子函数 |
| origin | 配置请求地址前缀 |

+ Ajax的全局配置分为2种：全局（所有实例有效） 和 实例级，支持的值如上

```javascript
  import {Ajax} from 'Beatle';
  Ajax.headers = {
    csrfToken: '...'
  }
  Ajax.normalize = false;

  const ajax = new Ajax({
    normalize: true
  });
  // ajax发起请求时，normalize为`true`，而headers值为`{ csrfToken: '...' }`
  ajax.get('...');

  ajax.set('headers', {});
  // 此时再发请求，normalize为`true`，headers为`{}`
  ajax.get('...')
```

实例级设置可以参考[ajax实例设置实例级别的全局监听](#appajax)。

### Ajax.request(ajaxOptions)

Ajax静态方法，其内部会初始化一个ajax实例，并调用ajax.request来执行

### ajax实例方法

| 名称 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| request | options `Object` | 接口请求调用，所有其他方式的请求最终都会走request来执行 |
| get | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | get请求 |
| post | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | post请求 |
| put | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | put请求 |
| delete | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | delete请求 |
| patch | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | patch请求 |

### ajax.request(options)
* options <`Object`> 接口请求配置
* return <`Promise|null`> 配置中有callback则不会返回内容，否则会返回调用的promise

+ 常用接口配置

| 属性 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| url | `String` | 请求地址 |
| method | `String` | 请求方法 |
| headers | `Object` | 请求头部 |
| mode | `String` | 请求模式，参考 `cors`, `no-cors`, `same-origin`, 默认`no-cors` |
| credentials | `String` | 请求凭证, 参考`omit`, `same-origin`, `include`, 有凭证才带cookie，否则不带cookie | 
| cache | `String` | 缓存模式，参考 `default`, `reload`, `no-cache`, 默认`default` |
| callback | `Function` | 回调处理函数，当存在callback时不会返回promise实例 |
| dataType | `String` | 接口返回结果对数据解析处理基于dataType类型来决定，默认为json解析 |

+ dataType解析数据类型

| 取值 | 描述 |
| :------ | :------ |
| arrayBuffer | 解析为`ArrayBuffer`的promise对象 |
| blob | 解析为`Blob`的promise对象, `URL.createObjectURL(Blob)`转为base64 |
| formData | 解析为`FormData`的promise对象 |
| json | 解析为`Json`的promise对象 |
| text | 解析为`USVString`的promise对象 |


### ajax.get(path[, data, options, dataType])
* path <`String`> 请求地址
* data <`Object|null`>  请求参数
* options <`Object|Function`> 当为函数式，则是callback回调，否则为请求配置信息
* dataType <`String|Function`>  请求数据进行数据解析类型，默认是json解析, 当dataType为函数时，则是callback回调，此时options必须为请求配置信息
* return <`Promise|null`> 配置中有callback则不会返回内容，否则会返回调用的promise

> 其他接口方法形式一致，包括`post`、 `delete`、`put` 和 `patch`

## Class: Poller

通过new Poller产生poller实例，传入配置项options:

| 属性 | 描述 | 默认 |
|:------ |:------ |:------ |
| delay `Number` | 每次轮询需要等待是时长 | `5000` |
| smart `Boolean` | 智能识别，当某个请求超过等待时长，会等待请求结束后才会轮询下个动作 | false |
| action `Function` | 每个轮询动作触发时，调用action函数 | N/A |
| catchError `Function` | 轮询中每个动作调用失败时都会进入到错误回调 | N/A |

```javascript
  import Beatle, {Poller} from 'beatle';
  const poller = new Pooler({
    action: () => {
      // 每个5秒会轮询调用改函数
      return Beatle.Ajax.request({url: '', method: 'get'});
    }
  });
  // 当subscribe订阅或者start方法调用时，轮询开始工作。
  poller.subscribe((err, res) => {
    // 这里每次轮询调用的结果会进来这里，err是错误信息，res是结果数据
  });
```

### poller实例方法

| 方法 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| then | success `Function`, error `Function` | 注册回调队列，每次轮询产生结果时触发 |
| subscribe | watcher `Function` | 开始订阅，同上注册回调队列，并且启动轮询 |
| unsubscribe | N/A | 取消订阅，并关闭轮询 |
| remove | N/A | 同上 |
| start | N/A | 开始轮询 |
| stop | N/A | 停止轮询 |
| tick | N/A | 等当前产生结果后跳到下一个轮询 |

## Class: Link

是React组件，封装了React Router中Link组件。用法同Link组件一致，所做的事情就是当app实例中设置了路由的统一前缀以及全局的query参数, 通过Link跳转时会自动带上。

```javascript
  const app = new Beatle({
    base: '/example',     // 设置了路由前缀
    query: {debug: true}  // 设置了全局的query
  });
  // 访问/example/进来到此路由
  app.route('/', (props) => {
    // 这里的to只写了/，期望是跳转到根路径，实际上点击跳转到/example/?debug=true的路径。
    return (<Link to="/">回到首页</Link>);
  });
  app.run();
```
