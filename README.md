# Beatle &middot; [![GitLab license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/master/LICENSE)

Beatle是一套轻量级前端框架，借助React、Redux实现应用界面构建流程。

## 概念

1. 组件，组件是基于React框架的组件，组件是独立展示视图的最小单位，组件可以通过组合堆叠产生更大的组件。
2. 前端应用`app`，`app`是`new Beatle`产生，应用包含所有构建应用的方法集。
3. 状态容器`store`，`store`是`app`全局唯一的数据缓存对象，渲染应用所需的数据模型中存储的数据，都以一个对象树的形式储存在`sotre`。
4. 数据模型`model`, `model`数据模型是定义一类数据的初始结构以及变更这些数据的行为方法。注册数据模型是吧数据模型交给`store`进行托管，数据模型中行为方法触发时，有store代理合适更新`model`数据。
5. 数据绑定`connect`，`connect`是指定数据模型和组件建立绑定关系，一旦该数据模型的数据发生变更，组件的render会自动触发，达到重新更新视图的效果。

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
  // 应用A
  new Beatle({
    name: 'appA',
    ...
  });
  // 应用B
  new Beatle({
    name: 'appB',
    ...
  });
  // 获取应用A实例
  Beatle.getApp('appA');
```

### Beatle.createModel(model, resource)
* model <[Model](#model)> 需要组合的数据模型
* resource <[Resource](#resource)> 组合需要的接口封装对象
* return <[Model](#model)> 返回组合好的Model

在Beatle中`数据模型Model`是指一类数据的集合，一个数据模型包含了`数据基础结构`, `改变数据的行为方法` 以及`跨数据模型的监听`。

resource是接口调用的封装对象，一般来说，我们会愿意把接口单独定义到业务逻辑之外的对象中。

```javascript
  // 比如我们可以在actions定义一个行为方法getUser，这个行为调用时，会发起接口请求调用数据(exec有配置接口)
  model = {
    ...
    actions: {
      getUser: {
        exec: {
          url: '...',
          method: 'GET'
        },
        // 对于异步的action，有3中状态的回调
        callback: {
          // 发送请求之前，
          start: (nextStore, playload) => {

          },
          // 请求成功并接受值后
          success: (nextStore, payload) => {

          },
          // 请求失败或者拒绝值后
          error: (nextStore, payload) => {

          }
        }
      }
    }
  }
  // 实际上我们可以把exec部分抽离到model之外，比如resource中
  resource = {
    getUser: {
      url: '...',
      method: 'GET'
    }
  }
  // 原先的model做下调整
  model = {
    ...
    actions: {
      getUser: {
        callback: {
          success: (nextStore, payload) => {
            
          }
        }
      }
    }
  }
  // 然后我们通过Beatle.createModel来生成最终的Model
  Model = Beatle.createModel(model, resource);
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
