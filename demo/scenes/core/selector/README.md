# VM控制器`Class: Selector`

复杂的场景，页面组件会涉及到多个数据模型做数据交互，还会增加额外的业务逻辑，我们建议通过封装Selector，以和页面一对一的控制器来封装所有的组件之外的逻辑。

```javascript
  app.model('a', {
    state: {v: 0},
    set() {
      return {
        v: 1
      }
    }
  });
  app.model('b', {
    state: {v: 0},
    set() {
      return {
        v: 2
      }
    }
  });
  // 没有控制器时，我们会这么处理
  const selector = {
    plus() {
      app.model('a').set();
      app.model('b').set();
    }
  }
  class Component extends React.Component{
    componentDidMount() {
      selector.plus();
    }
    render() {
      return (<div>{this.props.a.v + this.props.b.v}</div>)
    }
  }
  app.connect(['a', 'b'], Component);
```

基于Selector控制器，更改示例代码如下：

```javascript
  class Selector extends BaseSelector {
    // bindings声明注入的数据模型
    static bindings = ['a', 'b'];
    // 这是钩子函数，会在组件初始化完成后触发
    initialize(props) {
      this.getModel('a').set();
      this.getModel('b').set();
    }
  }
  class Component extends React.Component{
    render() {
      return (<div>{this.props.a.v + this.props.b.v}</div>)
    }
  }
  // 和app.connect不同，通过app.view可以连接控制器和组件
  app.view(Selector, Component);
```

### Selector特性
+ Selector是一类特殊的服务，即可以通过组件的context可以获取到selector实例，同时如果Selector依赖了其他服务，可以通过`contextTypes`声明依赖服务后，通过`context`可以获取到服务实例。

```javascript
  app.service('a', () => {
    return {v: 1};
  })
  class Selector extends BaseSelector {
    static contextTypes = {
      selector: React.PropTypes.object
    }
    static bindings = (state) => {
      return {
        b: this.context.a.v
      };
    }
  }
  class Component extends React.Component{
    static contextTypes = {
      selector: React.PropTypes.object
    }
    render() {
      // this.props.b === this.context.selector.context.a.v;
      return (<div>{this.props.b}</div>);
    }
  }
  const HocComponent = app.view(Selector, Component);
  app.route('/', HocComponent);
```

+ 初始化钩子函数，在组件初始化时触发，解脱组件`componentDidMount`

```javascript
  class Selector extends BaseSelector {
    ...
    initialize(props) {
      // props来自于组件
      this.getModel('user').getProfile(props.name);
    }
  }
  @view({
    // 在view装饰器下hookActions配置也会在组件初始化时触发
    hookActions: [
      {model: 'user', name: 'getProfile', getParams(props) => props.name}
    ]
  })
  class Component extends React.Component{
    ...
  }
  // 非装饰器
  app.view(Selector, Component);
```

> hookAction的结构为`{model, name, getParams, params}`, 其中params为静态参数，getParams可以动态返回


### app.view([Selector, ]component, providers)
* Selector <`Object`> 指定需要绑定的控制器
* component <`ReactComponent`> 指定组件来绑定
* providers <`Array<Object|Function|Array>`> 注入组件级的服务，使得组件通过this.context可以访问到。
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

### Selector的静态属性

定义控制器Selector，需要继承于BaseSelector

| 属性 | 描述 | 默认 |
|:------ |:------ |:------ |
| bindings | 多种取值，请参考[数据模型章节](beatle-projects/core/model) | `[]` |
| flattern `Boolean` | 平铺方式注入model | `false` |
| hookActions `Array` | 钩子配置，用于组件初始化时触发的数据模型的action | 单项`{model, name, getParams, params}` |
| contextTypes `Map` | 用于声明的依赖服务 | N/A |