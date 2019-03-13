# 响应式组件

> 示例Demo都应该从简到繁的顺序来阅读，如果本章节不了解，请先看上一个章节的示例。

响应式编程是当下流行的开发模式，响应式编程核心是通过把同步和异步数据转变为可观察的数据序列，实现代码链式开发。

+ `app.observer(data)`生成数据序列，通过链式来消费数据
```javascript
  import {from} from 'rxjs/observable/from';
  import {delay} from 'rxjs/operators/delay';
  
  const a = 1;
  const b = new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, 1000);
  });
  const c = from(Promise.resolve(3)).pipe(delay(500));
  app.observer(a).subscribe((ret) => {
    console.log(ret);
  });
  app.observer(b).subscribe((ret) => {
    console.log(ret);
  });
  app.observer(c).subscribe((ret) => {
    console.log(ret);
  });
// 打印顺序：1, 3, 2
```
+ `app.observer(data)`延伸，创建响应式组件，没次数据序列发生变更时，组件都会自动刷新为最新值。

```javascript
  const element = app.observer(b).render(count => (<h1>{count}</h1>));
  ReactDOM.render(element, document.body);
```

> 可以发现数据序列的消费，是分别通过2个函数来实现, `subscribe`和`render`，`subscribe`用于非组件的消费，`render`用于组件的消费。