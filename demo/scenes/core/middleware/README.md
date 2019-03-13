# 中间件`Middleware`
中间件作用域`Beatle`中的数据作用域`seed`实例，数据模型是通过`seed`管理起来的，数据变更一般来说通过`model.actions.func`来触发`action`，其他方式还有通过`seed.dispatch`来触发action调用。

```javascript
  const app = new Beatle();
  app.model('test', {
    set: v => v
  })
  // 等同于app.model('test').actions.set(10);
  app.seed.dispatch({
    name: 'test.set',
    payload: {
      arguments: [10]
    }
  });
```
+ `app.use(middleware)`注册中间件，`middleware`支持3个参数：`action`、`next` 和 `dispatch`

中间件作用于每次action调用时数据变更的过程。`action`时数据变更发起的action，`next`是通知下个中间件继续处理，`dispatch`时action的发射器，可以发起新的action。

```javascript
  app.use((action, next, dispatch) => {
    // 根据action的属性，重新发起对的action调用
    if(action.operate === 'set') {
      dispatch({
        name: 'test.set',
        payload: {
          arguments: [10]
        }
      });
    } else {
      next(action);
    }
  });
  // 触发一次action，实际上这个action并不存在
  app.seed.dispatch({
    operate: 'set'
  });
```

中间件的应用场景，可以用作数据变更过程中的跟踪，比如收集数据变更的loading状态，展现为页面的loadingBar效果。

```javascript
  app.use((action, next) => {
    if (action.type && !action.suppressGlobalProgress) {
      if (action.type.match(/\/start$/)) {
        // loading计数+1
        showLoading();
      } else if (action.type.match(/\/success$/) || action.type.match(/\/error$/)) {
        // loading计数-1
        hideLoading();
      }
    }
    next(action);
  });
```