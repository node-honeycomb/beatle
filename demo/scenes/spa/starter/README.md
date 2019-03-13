# 迁移redux项目

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

Redux有3大原则：单一数据源、只读state 和 纯函数变更state，2和3概括起来是数据单向流动。

### Redux问题分析（优点也很多，不赘述）
1. createStore一次性动作，中间件可配置需求不明显
2. 数据状态`state`、数据行为描述`action` 和 数据行为变更逻辑`reducer`太多分散，开发维护成本高。
3. 只解决数据状态管理

```javascript
// 1. 数据状态
const counterState = {
  count: 1
}
// 2. 数据行为描述
const addCountAction = {
  type: 'counter',
  payload: {
    count: 2
  }
}
// 3. 数据行为变更调度
const addCountReducer = (state, action) => {
  return state.counter.count + action.payload.count;
}
// 从面向对象的思想，1，2，3都是为了完成counter计数器的事情
const counter = {
  state: counterState,
  actionDescriptor: addCountAction,
  actionReducer: addCountReducer
}
// 简化redux初始化逻辑，传入计数器的初始数据状态 和 计数器的 数据变更调度
const store = createStore({counter: counter.state}, {counter: counter.addCountReducer});
// 通过dispatch发布 数据行为描述
store.dispatch(addCountAction);
// 其redux内部会 根据action -> 找到reducer（通过type属性）-> 执行reducer返回结果更新state（根据type属性）
```

+ 通过Beatle来描述，体现OOP的编程思想

```javascript
  class Model extends Beatle.BaseModel {
    state = {
      count: 1
    }
    // 数据行为描述 和 数据行为变更逻辑 合为一个函数
    addCountReducer(count) {
      this.setState({
        count: this.state.counter.count + count
      })
    }
  }
  app.model('counter', Model);
  const counter = app.model('counter');
  // 等同于store.dispatch
  counter.addCountReducer(2);
```

> Redux Starter Kit
see: https://github.com/davezuko/react-redux-starter-kit/tree/master/src