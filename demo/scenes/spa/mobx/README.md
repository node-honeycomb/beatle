# 迁移Mobx

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

虽然Mobx和Beatle有很大区别，但从响应式的特性上2个框架都是支持的，基于这一点，Beatle实现了Mobx的核心的几个装饰器，迁移Mobx应用需要有少量代码改造，而使用Beatle将带来更多的便利。

始终需要记得，Beatle是实现`前端全流程开发`的框架。换句话说，是基于React开发的全家桶。

### 支持Mobox的装饰器
+ 响应式数据
 1. observable，转变数据状态为可观察序列
 2. computed，转变返回的数据状态的函数为可观察序列
 3. action，观察函数调用后，其可观察的数据状态是否发生了变更，变更则通知已订阅的观察者。
+ 响应式组件
 1. observer + inject，订阅观察序列，当接收到通知时，驱动组件重新渲染。

 ```javascript
  import React from 'react';
  import {BaseModel, observable, computed, action} from 'beatle';
  class Model extends BaseModel {
    static displayName = 'model';
    @observable
    name = '';
    @computed
    get time() {
      // 每次获取最新
      return new Date().getTime();
    }
    @action
    setName() {
      // 可接收promise或者同步数据
      return this.ajax.get('https://api.github.com/users/baqian').then(res => {
        this.name = res.name;
      });
    }
  }

  @observer({
    inject: ['model']
  })
  export class Component extends React.Component {
    static propTypes = {
      model: React.PropTypes.object
    }
    ...
  }
```