# 简单插件

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

简单插件的基本要素：接口调用、组件更新。

初始化Beatle实例app，在app环境中的所有组件，都可以通过context来访问app的核心模块，分别有app本身、seed 和 ajax。
1. `app`，访问Beatle的API方法。
2. `seed`，seed在应用外部维护一个数据作用域store，通过store可以实现app下组件之间的数据通信问题。
3. `ajax`，统一的接口调用对象，提供`get`、`post`、`patch`、`put`、`delete`等多个方法
 
+  纯组件, 通过state来管理数据状态

```javascript
  class Component extends React.Component {
    state = {
      profile: {}
    }
    componentDidMount() {
      this.setState({
        profile: {...}
      })
    }
    render () {...}
  }
```

+ Hoc组件，把数据状态通过props，传递给组件
```javascript
  class Component extends React.Component {
    static propTypes = {
      profile: React.PropTypes.object
    }
    render () {...}
  }
  // Hoc的原理
  class HocComponent extends React.Component {
    state = {
      profile: {}
    }
    componentDidMount() {
      this.setState({
        profile: {...}
      })
    }
    render () {
      // 传递state作为组件的props
      return (<Component {...this.state} />);
    }
  }
```

+ 视图, 有数据绑定的组件(后续统称为视图)，
```javascript
  // seed往store（数据作用域）中注册数据状态profile，seed.register(name, action, defaultValue);
  app.seed.register(
    'profile', 
    (prevStore, payload) => {
      return payload.data
    },
    {}
  );
  function setProfile(data) {
    // 通过seed.dispatch发起对store的更新，name为要更新的数据状态名称
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
      setProfile({...});
    }
    render () {...}
  }
```

> 从视图中看，组件并不是完全干净，多了`static getState`和`setProfile`等步骤，这些要抽象到组件外部，通过数据模型可以做到，示例请参考[插件和数据通信](/beatle-projects/single/model)

> 如果您以掌握以下示例用法，可以继续深入了解插件通过路由切换来实现局部模块刷新，请参考[路由插件](/beatle-projects/single/route)