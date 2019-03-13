# 简单应用

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

Spa应用基本要素包括，路由视图、接口调用 和 数据通信。
1. `app.connect(modelName, ReactComponent): routeView`，创建路由试图，`app.model`注册的数据模型，通过`app.connect`注入到组件中，通过props来访问。
2. `app.route(path, routeView): void`，注册路由, 也可以通过`app.route([routeConfig])`注册，其中`routeConfig`参考[react-router](https://react-guide.github.io/react-router-cn/docs/guides/basics/RouteConfiguration.html)动态路由配置
3. `app.ajax.[get|post|put|delete](url, data): Promise`，发起接口调用
4. `app.model(modelName, Model): void`，注册数据模型，通过数据模型管理 数据状态和数据行为。
5. `app.run(dom)`，启动应用

### 数据模型 和 路由视图的关系

+ 数据模型有2个要素：数据状态`state` 和 数据行为`action`, 以下是一个简单的model代码
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
+ 数据模型和组件结合

简单场景，我们会考虑在组件内部，通过app.model获取到数据模型实例，通过实例来改变组件的state，从而达到组件更新的目的，这样依赖数据模型和组件强绑定，组件复用性极低。

在React组件世界里，为了提高组件复用，会通过Hoc高阶组件的封装，Beatle也推崇这样的思路，这样我们把数据模型和组件封装成Hoc，在Hoc中把数据模型的state和actions都注入到组件的props中，通过组件props来访问。

```javascript
class Component extends React.PureComponent {
  static propTypes = {
    test: React.PropTypes.object
  }
  componentWillMount() {
    this.props.test.setName('b');
  }
  render() {
    return (<h1>{this.props.test.name}</h1>)
  }
}
const HocComponent = app.connect('test', Component);
```