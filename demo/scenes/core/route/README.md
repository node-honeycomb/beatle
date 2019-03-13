# 路由`Route`

Beatle封装`react-router`，保留路由配置的所有特性，通过`app.route(path, routeConfig)`注册路由，Beatle会统一管理动态路由配置，在`app.run`启动应用时使用。

### `app.route(path[, Component, routeConfig])`
* `path: < String >` 路由路径, 如果只填path，则返回注册好的路由配置项
* `Component: < ReactComponent >` 路由组件
* `routeConfig: < Function | Object >` 路由配置项

路由命中时，组件从`props`中获取3个变量
1. `route`路由完整配置
1. `params`路由变量值
2. `location`路由命名中的解析信息，结构为`{pathname, hash, query, state}`

```javascript
  app.route('/a', Component, {
    childRoutes: [...]
  });
  // 动态路由
  app.route('/b', (nextState, callback) => {
    require.ensuire(['./com'], (require) => {
      const Com = require('./com');
      // 动态加载路由组件
      callback(null, Com);
    }, 'async')
  });
  const routeConfig = app.route('/a');
```

### `app.route(routeConfig)`
* `routeConfig: < Array|Object >` 填写完成的路由配置，包括路径
 1. routeConfig为数组，填写路由配置
 2. routeConfig为对象，可以填写`路由映射关系`

```javascript
  app.route([
    {
      path: 'core/model',
      component: ModelComponent
    },
    {
      path: 'core/route',
      component: RouteComponent
    },
    {
      path: 'core/seed',
      component: SeedComponent
    },
  ]);
  // 等同于上面的路由配置，前提是ModelComponent.routeOptions不能为空（可以为true或者Object）
  app.route({
    './core/model/index.jsx': ModelComponent,
    './core/route/index.jsx': RouteComponent,
    './core/seed/index.jsx': SeedComponent
  });
  // 更特殊的，Beatle可以结合webpack的require.context特性遍历的文件，来构建路由
  app.route(require.context('./core', true, /index\.jsx$/));
```

> 路由映射关系是一个特殊命名，是Beatle支持的一种特殊格式。


### 路由路径的通配符
路由路径通过使用通配符，达到一个组件支持动态路径的效果

+ 路径变量
:paramName，匹配URL的一个部分，直到遇到下一个/、?、#为止。这个路径参数可以通过

```javascript
  app.route('/media/:id', Component);
  // 跳转到/media/:id的路由，在组件的props.params.id获取变量值123
  app.push('/media/123');
  // 这是一种特殊情况，生成的路由是/media/baqian
  app.route('/media/:name', Component, {
    name: 'baqian'
  });
```

+ 路径贪婪匹配

()，表示URL的这个部分是可选的。

```javascript
  app.route('/media(/:id)', Component);
  // 以下2种调用都能匹配路由
  app.push('/media/123');
  app.push('/media');
```

+ 路径模糊匹配
1. *，匹配任意字符，直到模式里面的下一个字符为止。匹配方式是非贪婪模式。
2. **，匹配任意字符，直到下一个/、?、#为止。匹配方式是贪婪模式。

```javascript
  app.route('/media*', Component1);
  app.route('/**/item', Component2);
  app.push('/media1');
  app.push('/media/item');
```

### `routeOptions`

前面提到过`app.route(routeConfig)`可以一次注册多个路由，`routeConfig`可以取值为路由映射关系，路由映射关系需要满足2种数据结构，Map或者`require.context`取值，同时要满足组件必须定义静态属性`routeOptions`，否则不会注册到路由中。

```javascript
  class Component extends React.Component {
    render() {
      ...
    }
  }
  // 因为Component.routeOptions为定义
  app.route({
    './index.jsx': Component
  });
  Component.routeOptions = true;
  // 注册路由成功，等同于app.route('/', Component);
  app.route({
    './index.jsx': Component
  });

  Component.routeOptions = {
    childRoutes: [...]
  }
  // 在注册路由，会把routeOptions合并到routeConfig中，所以当前路由还加入了子路有
  app.route({
    './index.jsx': Component
  });
```

### routeConfig完整配置

| **属性** | **描述** | **默认值** |
| :--- | :--- | :--- |
| `path` | 路由路径 | String |
| `indexRoute` | 重定向路由 | `{component, getComponent}` |
| `component` | 路由组件 | ReactComponent |
| `getComponent` | 动态路由组件 | Function |
| `childRoutes` | 子路有配置 | `[...routeConfig]` |
| `onEnter` | 路由命中时钩子函数 | Function |
| `onLeave` | 路由离开时钩子函数 | Function |
| `aliasRoutes` | 复制路由配置项 | `routeConfig` |

```javascript
  import {Router} from 'react-router';
  const routeConfig = [
    { path: '/',
      component: App,
      indexRoute: { component: Dashboard },
      childRoutes: [
        { path: 'about', component: About },
        { path: 'inbox',
          component: Inbox,
          childRoutes: [
            { path: '/messages/:id', component: Message },
            { path: 'messages/:id',
              onEnter: function (nextState, replaceState) {
                replaceState(null, '/messages/' + nextState.params.id)
              }
            }
          ]
        }
      ]
    }
  ]
  // 路由配置项可以在react-router中使用
  React.render(<Router routes={routeConfig} />, document.body)
  // 等同以上效果
  app.route(routeConfig);
  app.run(document.body);
```

### 初始化Beatle时批量注册路由

```javascript
  // 方式1，静态配置
  const app1 = new Beatle({
    routes: routeConfig
  });

  // 方式2，动态配置
  Beatle.autoLoad.loadRoutes = () => {
    return routeConfig
  };
  // 后续的Beatle初始化都有效
  const app2 = new Beatle({
    autoLoadRoute: true
  });
```