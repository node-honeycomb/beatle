# 迁移dva

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

Dva 同 Beatle初衷一样，集成React的最佳解决方案，帮助实现前端全流程开发。

### Dva问题分析
1. 对于数据状态管理，沿用redux编码思路，仍保留state、action、reducer的概念，而state和reducer按照目的，组合到各个对象model中。
2. 新增effect用于处理异步的逻辑，最终触发reducer来变更数据，`store.dispatch`可以跳转到，所以在同一个model 中effect和reducer不能重名。
3. dva提供多种脚手架组合类库，但没有封装为标准的API输出。

目前Beatle基本兼容Dva对于model的封装，如下举例：

```javascript
  const model = {
    namespace: 'test', // Beatle中改为displayName
    state: {
      name: 'a'
    },
    reducers: {
      save: (state, action) => {
        // 在Beatle中，第二个参数action.payload
        return action.payload.name;
      }
    },
    effects: {
      * setName({name}, {put}) {
        yield put({
          type: 'save',
          payload: {
            name: name
          }
        })
      }
    }
  }
  store.dispatch({
    type: 'test/setName', // Beatle中type为'test.setName'
    name: 'a'
  });
```

> Dva Real World Example
see: https://github.com/dvajs/dva/blob/master/examples/user-dashboard/