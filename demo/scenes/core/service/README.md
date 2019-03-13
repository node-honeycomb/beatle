# 服务`Service`

服务的概念其实就是通过的JS代码逻辑，可以是一个函数，也可以是一个类。服务通过注册形式加入到Beatle的环境中，组件通过context来获取到服务实例，从而使用服务实例的方法或者属性。

1. `app.service(name, Service)`，注册服务到app中
2. 组件通过`contextTypes`声明需要的服务，在组件内部通过`this.context`获取服务实例

```javascript
  app.service('test', () => {
    return {
      a: 1
    }
  });
  class Component extends React.Component{
    static contextTypes = {
      test: React.PropTypes.object
    }
    render() {
      return (<div>{this.context.test.a}</div>)
    }
  }
  // 通过app来执行，或者通过app的路由注册
  app.run(document.body, Component);
```


### `app.service(name[, Service, isGlobal])` 服务注册与获取
1. `app.service(name, Service)`，注册应用级服务
2. `app.service(name, Service, true)`，注册全局服务
3. `app.service(name)`，获取应用级服务实例
4. `app.service(name, true)`，获取全局服务实例

+ 服务的作用域
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

> 组件总能注入3个内置的应用级服务：app、ajax 和 seed

+ 服务的依赖

```javascript
  const app = new Beatle();
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
      b: React.PropTypes.object
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

### `app.service(services)` 一次性注入多个应用级服务

```javascript
  // 方式1，通过map形式
  app.service({
    b: B,
    c: C,
    d: D
  });
  // 方式2，结合webpack的require.contexts
  app.service(require.context(...))
```

### `app.view(Component, services)`添加组件级服务

`Component`是组件，`services`是Map，配置多个服务。

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


### 服务注入器`Injector`
`Injector`时管理服务依赖关系和服务注入逻辑的示例。在Beatle初始化时，会产生`injector`实例，用于管理应用级的服务。

| 属性 | 描述 |
|:------ |:------ |
| `setService(Service)` | 注入服务，Service静态属性displayName来指定实例名 |
| `getService(name)` | 通过服务实例名获取实例 |
| `setServices(Services)` | 一次性注入多个服务 |
| `instantiate(Service)` | 创建临时服务，不会保存到应用级服务中 |

> `injector.getService(Services)`一次性创建多个服务，其`Services`除了Map值，还可以结合webpack的`require.context(...)`遍历结果