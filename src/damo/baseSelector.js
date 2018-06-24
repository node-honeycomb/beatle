import {EventEmitter} from 'events';
import {fromEvent} from 'rxjs/observable/fromEvent';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';
import {from} from 'rxjs/observable/from';
import {expand, delay, takeWhile, catchError} from 'rxjs/operators';

import Poller from '../utils/poller';

export default class BaseSelector extends EventEmitter {
  constructor() {
    super();
    this._eventsMap = {};
    this.setMaxListeners(Number.MAX_VALUE);

    this.dataBindings = this.inputs;
    this.eventBindings = this.outputs;
  }
  /**
   * emitter = {
   *  eventName,
   *  trigger,
   *  stream,
   *  source,
   *  remove,
   *  subscription
   * }
   */
  _getEmitter(eventName) {
    let emitter = this._eventsMap[eventName];
    const emitevent = `subscribe.${eventName}`;

    if (!emitter) {
      this._eventsMap[eventName] = emitter = {
        eventName: eventName
      };
      /**
       * ### action调用逻辑
       *
       * ```
       *  const selector = new Selector();
       *  const emitter = selector.fromEvent('increment', (stream) => {
       *    return stream.flatMap(num => {
       *      return new Promise(resolve => {
       *        setTimeout(() => {
       *          resolve(num + 1);
       *        });
       *      });
       *    });
       *  });
       * // 方式1
       * emitter.trigger(1, (res) => console.log(res)) // => 2
       * // 方式2
       * emitter.once(res => console.log(res)); // => 2
       * emitter.trigger(1);
       * ```
       */
      emitter.trigger = () => {
        const onceCallback = arguments[arguments.length - 1];
        if (typeof onceCallback === 'function') {
          arguments.pop();
          // #! 轮询的处理
          if (emitter.source.polling) {
            const pollingCallback = (...args) => {
              if (onceCallback(...args) === false) {
                this.removeListener(eventName, pollingCallback);
              }
            };
            this.on(eventName, pollingCallback);
          } else {
            this.once(eventName, onceCallback);
          }
        }
        this.emit(emitevent, ...arguments);
      };
      emitter.stream = fromEvent(this, emitevent);
    } else {
      emitter.remove();
    }
    return emitter;
  }

  _subscribe(eventObj) {
    let stream = eventObj.source.pipe(
      catchError(err => {
        this.emit(eventObj.eventName, err);
        // > see:
        // https://www.bennadel.com/blog/3046-experimenting-with-the-catch-operator-and-
        // s tream-continuation-in-rxjs-and-angular-2.htm
        return stream;
      })
    );

    eventObj.subscription = stream.subscribe((...args) => {
      this.emit(eventObj.eventName, null, ...args);
    }, err => {
      this.emit(eventObj.eventName, err);
    });

    eventObj.remove = () => {
      eventObj.subscription.unsubscribe();
    };
  }

  /**
   * option = {
   *  status: {
   *    start,
   *    end
   *  },
   *  action,
   *  next,
   *  delay
   * }
   */
  _getPoller(option) {
    // poller.start => promise
    let promise = option.action(option.start);

    const source = from(promise).pipe(
      expand((res) => {
        promise = option.action(res);
        if (promise !== false) {
          if (promise instanceof Observable) {
            return promise;
          } else {
            // #! 数据必须是对象或者promise
            return from(promise).pipe(delay(option.delay));
          }
        } else {
          if (option.end && option.end.then) {
            return of(option.end);
          } else {
            return of(Promise.resolve(option.end));
          }
        }
      })
    ).pipe(
      takeWhile(res => option.hasTick(res))
    );
    // #! 标记有轮询
    source.polling = true;
    return source;
  }

  /**
   * ### BaseSelector的Api
   *
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | fromPoller(option) `Observable` | | |
   * | fromEvent(eventName, getSource) `Object` | | |
   * | unsubscribe(eventName) | | |
   */

  fromPoller(option) {
    if (option instanceof Poller) {
      const poller = option;
      poller.stop();
      option = {
        start: {},
        end: {},
        delay: poller._option.delay,
        action: (res) => {
          if (res === option.start) {
            return poller._current || poller.tick();
          } else {
            if (option.hasTick(res)) {
              return poller.tick();
            }
          }
        },
        hasTick: (res) => {
          return res !== option.end && poller.hasTick(res);
        }
      };
      return this._getPoller(option);
    } else {
      const newOption = {
        start: {},
        end: {},
        delay: option._delay,
        action: (res) => {
          if (res === option.start && res !== option.end) {
            return option.action(res);
          }
        },
        hasTick: (res) => {
          return res === option.start && res !== option.end;
        }
      };
      return this._getPoller(newOption);
    }
  }

  fromEvent(eventName, getSource) {
    const emitter = this._getEmitter(eventName);

    // + 全局都加，避免combine过程中，stream调用多次 > see: see:
    // https://www.learnrxjs.io/operators/multicasting/cache.html
    let source = getSource(emitter.stream);
    if (source) {
      // emitter.source = source.cache(1);
      this._subscribe(emitter);
    }

    return emitter;
  }

  destroy() {
    this.removeAllListeners();
    for (let key in this._eventsMap) {
      this._eventsMap[key].subscription && this
        ._eventsMap[key]
        .subscription
        .unsubscribe();
    }
  }
}
