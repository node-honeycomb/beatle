# 数据作用域`Class: ReduxSeed`

在Beatle初始化产生app实例时，其内部会维护一个`ReduxSeed`实例`seed`，而数据作用域的目的时，在应用级别维护一个数据共享区`store`（前面我们也称之为`单一数据源`）

`store`基本上就是一个容器，它包含着你的应用中大部分的数据状态 (state)。
1. state的状态存储是响应式的。当组件从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件也会相应地得到高效更新。
2. 不能直接改变 store 中的状态。改变 store 中的状态的途径是触发`数据行为`，通过`数据行为`来更新state，组件通过订阅store，实时响应state的更新，从而更新组件。

+ 抛开数据模型概念，使用最基本的seed实例来实现 数据状态管理

```javascript
  import Beatle, {connect} from 'beatle';
  // 注册数据状态 以及 数据变更的实现逻辑
  app.seed.register(
    'profile',    // 数据状态属性
    (prevStore, payload) => { // 数据变更逻辑
      return payload.data
    },
    {}            // 数据状态的默认值
  );
  function setProfile(data) {
    // 通过seed.dispatch发起action，通过action来描述数据变更
    app.seed.dispatch({
      name: 'profile',
      payload: {
        data: data
      }
    })
  }

  
  // ！重要，用于连接组件和store，非装饰器方式为app.connect(View);
  @connect
  class View extends React.Component {
    // ! 同样重要，当store每次有变更的时候，通过getState获取最新数据，注入到组件props中
    static getState = state => {
      return {
        profile: state.profile
      }
    };
    static propTypes = {
      profile: React.PropTypes.object
    }
    componentDidMount() {
      // 对于seed，组件内部也可以通过this.context.seed获取。
      setProfile({
        name: 'baqian'
      });
    }
    render () {...}
  }
```

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

### seed实例方法

| 方法 | 描述 |
| :------ | :------ | :------ |
| `register(name, reducer, defaultValue)` | 注册一个数据状态 |
| `dispatch(action)` | 触发一个数据行为，用于触发指定的数据变更 |
| `subscribe(callback)` |  订阅store，每当state发生变更时触发 |
| `getActions(actionName)` | 获取指定数据行为的触发函数 |

* `reducer`在[数据模型章节](/beatle-projects/core/model)有详细介绍
* `action`的格式为`{type, name, payload}`,
  1. type是完整的action所在位置，通过type来识别action的触发函数，格式为`@@modelName/actionName`
  2. name是type的简写，最后会转成type
  3. payload是action的装载数据

```javascript
  app.model('user', {
    getProfile: () => {
      return {
        name: 'baqian';
      }
    },
    get: ({put}) => {
      // 等同于app.seed.dispatch(...)
      // 通过put等方法，可以省去写modelName，会自动拼上当前的model
      put({
        name: 'getProfile'
      });
    }
  });
  app.seed.dispatch({
    name: 'user.profile',
    payload: {
      data: data
    }
  });
  // name转成type
  app.seed.dispatch({
    type: '@@user/profile',
    payload: {
      data: data
    }
  })
```

> 单独使用seed实例的场景很少，了解seed的过程，有助于我们对数据模型的理解和应用。