# 插件与服务

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

在[插件与数据通信](/beatle-projects/single/model) 中提到业务层逻辑，为了保证组件可复用，需要把业务层逻辑剥离到组件之外，包括 数据逻辑 和 计算逻辑。Beatle中的服务就是用于定义通用的计算逻辑。

### 简单的服务定义
1. `app.service(name, Service)`，注册服务
2. `app.service(name)`，获取服务实例

```javascript
  class A {
    data = {a: 1}
  }
  const b = (a) => {
    return {
      getValue(v) {
        // a.data.a为a服务中的值
        return a.data.a + v;
      }
    }
  }
  // 声明b服务依赖于a服务
  b.contextTypes = {
    a: React.PropTypes.object
  }
  app.service('a', A);
  app.service('b', b);
  const bService = app.service('b');
  // 打印 3
  console.log(bService.getValue(2));
```

### 服务的作用域

服务的作用域分为3层，全局服务、应用级服务 和 组件级服务，通过组件的contextTypes注入服务时，优先级是 组件级 > 应用级 > 全局

1. 全局服务，跨应用可共享。
2. 应用级，只在应用内部可用。
3. 组件级，可以传递到组件内部或者子组件，组件外部不可用。

```javascript
  app.service('a', () => 1, true); // 第三个参数表示注册到全局服务
  app.service('a', () => 2);
  class Component extends React.Component {
    static contextTypes = {
      // app是应用级服务
      app: React.PropTypes.object,
      // a全局和应用级都存在，应用优先级最高。
      a: React.PropTypes.number,
      // 组件级服务，组件外部不可用。
      b: React.PropTypes.object
    }
  }
  class B {
    constructor() {
      this.b = 3;
    }
  }
  // 注入组件级的服务
  app.view(Component, {b: B});
```

> 事实上，`app.view`是`app.connect`的加强版，可以在连接数据作用域的同时，可以注入组件级服务，同样是产出视图。