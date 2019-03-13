# 路由插件

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

每个路由对应一个完整的react组件。通过`app.route(path, Component)`注册成路由，路由切换可以通过npm包`history`提供的方法进行跳转，或者通过组件内部的`this.context.router`实例提供的方法来操作。

Beatle封装`react-router`，保留路由配置的所有特性，`app.route(routeConfig)`注册路由，其中`routeConfig`为动态路由的配置。

```javascript
  class Component extends React.Component {
    render() {...}
  }
  app.route({
    path: '/',
    component: Component
  });
  app.run();
```

> 关于路由的使用，参考Beatle核心模块[路由](/beatle-projects/core/route)