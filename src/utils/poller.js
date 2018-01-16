import pollerShape from './pollerShape';
import propTypes from 'prop-types';
/**
 * # poller轮询
 *
 * 1. 轮询功能，通过subscribe订阅轮询结果。
 * 2. 提供start, stop, remove控制轮询
 *
 * > see: https://github.com/emmaguo/angular-poller/blob/master/angular-poller.js
 */
export default class Poller {
  constructor(opt) {
    propTypes.checkPropTypes(pollerShape, opt, 'pollerOptions', 'Beatle.Poller');
    /**
     * ### 私有属性
     *
     * | 属性名 | 描述 |
     * |: ------ |: ------ |
     * | _option `pollerShape` | 初始化轮询配置项 |
     * | _current `Promise` | 每次轮询产生的结果对象 |
     * | _interval `Interval` | 轮询定时器 |
     * | _stopTimestamp `number` | 当点击停止时会记录一个时间戳，此时未轮询结束的`_current`可判断是否还要接收 |
     * | _watchers `Array` | 每次轮询结果回来时，触发的回调列表 |
     */
    this._option = Object.assign({
      delay: 5000,
      smart: false,
      action: null,
      catchError: null
    }, opt);

    if (!this._option.delay) {
      this._option.delay = 5000;
    }
    this._current = null;
    this._interval = null;
    this._stopTimestamp = null;
    this._watchers = [];
  }

  /**
   * ### 公开方法
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | then | success `Function`, error `Function` | 注册回调队列，每次轮询产生结果时触发 |
   * | subscribe | watcher `Function` | 开始订阅，同上注册回调队列，并且启动轮询 |
   * | unsubscribe | N/A | 取消订阅，并关闭轮询 |
   * | remove | N/A | 同上 |
   * | start | N/A | 开始轮询 |
   * | stop | N/A | 停止轮询 |
   * | tick | N/A | 等当前产生结果后跳到下一个轮询 |
   */
  then(success, error) {
    const watcher = (err, res) => {
      if (err) {
        error && error(err);
      } else {
        success && success(res);
      }
    };
    this
      ._watchers
      .push(watcher);
  }

  subscribe(watcher) {
    this
      ._watchers
      .push(watcher);
    this.start();
  }

  tick() {
    const timestamp = new Date();
    this._current = this
      ._option
      .action();
    this
      ._current
      .then((res) => {
        this._current._resolved = true;
        if (!this._stopTimestamp || timestamp >= this._stopTimestamp) {
          this
            ._watchers
            .forEach((watcher) => {
              watcher(null, res);
            });
        }
      }, (err) => {
        if (!this._stopTimestamp || timestamp >= this._stopTimestamp) {
          this
            ._watchers
            .forEach((watcher) => {
              watcher(err);
            });
          if (this._option.catchError) {
            this
              ._option
              .catchError(err);
          }
        }
      });
  }

  start() {
    if (!this._watchers.length)
      return;
    this.stop();
    this._stopTimestamp = null;
    this.tick();
    this._interval = setInterval(() => {
      if (!this._option.smart || !this._current || this._current._resolved) {
        this.tick();
      }
    }, this._option.delay);
  }

  stop() {
    clearInterval(this._interval);
    this._stopTimestamp = new Date();
  }

  unsubscribe() {
    this.stop();
    this._watchers = [];
  }

  remove() {
    this.stop();
    this._watchers = [];
  }
}
