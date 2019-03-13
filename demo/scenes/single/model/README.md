# 插件与数据通信

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

先来了解数据模型的概念，[百度百科](https://baike.baidu.com/item/%E6%95%B0%E6%8D%AE%E6%A8%A1%E5%9E%8B/1305623?fr=aladdin) 描述至少包含3个要素：`数据状态`、`数据行为` 和 `约束条件`。在Beatle中保留前者2个要素。

有了数据模型，组件和外部数据的通信，即我们理解的业务层逻辑，不在组件中写死，而是写到数据模型中。

> 业务层逻辑，除了数据逻辑 还有 计算逻辑，计算逻辑封装则会在[插件与服务](/beatle-projects/single/service)示例中介绍。

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
+ 视图，通过`app.connect`数据模型和组件连接，产生的Hoc组件。

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

> 关于数据模型的使用，参考Beatle核心模块[数据模型](/beatle-projects/core/model)