import fetch from 'isomorphic-fetch';
import propTypes from 'prop-types';
import warning from 'fbjs/lib/warning';
import qs from 'qs';
import ajaxShape from './ajaxShape';
import Poller from './poller';
import substitute from '../core/substitute';
import messages from '../core/messages';
import isPlainObject from '../core/isPlainObject';
import urllib from 'url';

const noop = (d) => d;

/**
 * # Ajax模块
 *
 * ### 静态属性
 *
 * |        名称         |          描述          |
 * |:       ------          |         ------          |
 * | headers | 全局的Header配置, 默认取值`window.ajaxHeader` |
 * | delimeter | 请求url默认支持插值替换，`delimeter`是插值变量的语法 |
 * | normalize | 请求url插值替换，是否都走data属性, 默认为`false` |
 * | stringify | post request with JSON data in application/x-www-form-urlencoded, 默认为`false` |
 * | beforeRequest(ajaxOptions) | 请求之前的钩子函数 |
 * | beforeResponse(response, ajaxOptions, xhr) | 请求成功后处理response对象的钩子函数 |
 * | afterResponse(result, ajaxOptions, xhr) | 请求成功后处理接口结果数据的钩子函数 |
 */
export default class Ajax {
  static headers = window.ajaxHeader || null;
  // #! delimeter = /\\?\{([^{}]+)\}/g;
  static delimeter = /:(\w+)/g;
  // #! 统一走data做过滤
  static normalize = false;

  static stringify = false;

  static beforeRequest = noop;
  static afterResponse = noop;
  static beforeResponse = (response, ajaxOptions) => {
    if (response.ok || response.status === 304) {
      try {
        /**
         * ### 基于Response对象，dataType取值
         *
         * | 取值 | 描述 |
         * |: ------ |: ------ |
         * | arrayBuffer | 解析为`ArrayBuffer`的promise对象 |
         * | blob | 解析为`Blob`的promise对象, `URL.createObjectURL(Blob)`转为base64 |
         * | formData | 解析为`FormData`的promise对象 |
         * | json | 解析为`Json`的promise对象 |
         * | text | 解析为`USVString`的promise对象 |
         *
         * > see: https://developer.mozilla.org/zh-CN/docs/Web/API/Response
         */
        if (ajaxOptions.dataType === undefined) {
          response = response.json();
        } else if (ajaxOptions.dataType && typeof response[ajaxOptions.dataType] === 'function') {
          response = response[ajaxOptions.dataType]();
        } else {
          response = response.text();
        }
      } catch (e) {
        response = e;
      }
    } else {
      const error = new Error(response.statusText);
      error.response = response;
      response = error;
    }

    return response;
  };

  static request = (ajaxOptions) => {
    return new Ajax().request(ajaxOptions);
  }

  constructor(options = {}) {
    if (options.origin) {
      this._uri = urllib.parse(options.origin);
      delete options.origin;
    }
    for (let key in options) {
      this.set(key, options[key]);
    }
  }

  /**
   * ### 方法
   *
   * | 方法 | 参数类型 | 描述 |
   * |: ------ |: ------ |: ------ |
   * | setHeader(headers) | headers `Object` | 设置全局的Header配置 |
   * | set(name[, value]) | name `String`, value `any` | 设置或者获取静态属性及方法, 前提是这个静态属性是存在的 |
   * | beforeRequest(fn) | fn `Function` | 请求之前的处理 |
   * | beforeResponse(fn) | fn `Function` | 接口结果预处理 |
   * | afterResponse(fn) | fn `Function` | 接口结果后处理 |
   * | request(options) | options `Object` | 接口请求处理逻辑 |
   */
  _setting = {};
  setHeader(headers) {
    if (this._setting.headers) {
      warning(false, messages.duplicateProp, 'setHeader', typeof headers, 'headers', 'Beatle.Ajax');
    }
    this._setting.headers = headers;
  }
  beforeRequest(fn) {
    if (this._setting.beforeRequest) {
      warning(false, messages.duplicateProp, 'beforeRequest', typeof fn, 'beforeRequest', 'Beatle.Ajax');
    }
    this._setting.beforeRequest = fn;
  }
  beforeResponse(fn) {
    if (this._setting.beforeResponse) {
      warning(false, messages.duplicateProp, 'beforeResponse', typeof fn, 'beforeResponse', 'Beatle.Ajax');
    }
    this._setting.beforeResponse = fn;
  }
  afterResponse(fn) {
    if (this._setting.afterResponse) {
      warning(false, messages.duplicateProp, 'afterResponse', typeof fn, 'afterResponse', 'Beatle.Ajax');
    }
    this._setting.afterResponse = fn;
  }

  /**
   * ### 设置和获取静态属性或静态方法
   *
   * ```
   * // 获取全局headers
   * const headers = app.getAjax().set('headers');
   * // 设置beforeRequest
   * app.getAjax().set('beforeRequest', function(ajaxOptions){
   *  //...
   * });
   *
   * // 以上是通过Beatle实例来设置对应的ajax实例的全局配置。
   * // 以下是通过Ajax对象来设置，所有应用公用的全局配置
   * Ajax.headers = {};
   * Ajax.beforeRequest = function(ajaxOptions){
   *  //...
   * }
   *
   * // 如果只是设置Ajax实例的全局配置，比如app.getAjax().set(name, value)
   * // 我们也可以通过Ajax模块自行初始化和设置
   * // 在初始化设置
   * const ajax = new Ajax({
   *  headers: {...}
   * });
   * // 通过实例方法进行设置
   * ajax.set('beforeRequest', function(ajaxOptions){})
   * ```
   * > 目前支持的静态属性及方法为：`headers`, `delimeter`, `normalize`, `beforeRequest`, `beforeResponse`, `afterResponse`
   */
  set(name, value) {
    if (Ajax[name] === undefined) {
      warning(false, messages.invalidProp, 'set', name, 'headers, delimeter, normalize, stringify, beforeRequest, beforeResponse, afterResponse', 'Beatle.Ajax');
    } else {
      if (value === undefined || value === null) {
        return this._setting[name] || Ajax[name];
      } else {
        if (this._setting[name]) {
          warning(false, messages.duplicateProp, 'set', name, 'headers, delimeter, normalize, stringify, beforeRequest, beforeResponse, afterResponse', 'Beatle.Ajax');
        }
        this._setting[name] = value;
      }
    }
  }

  _substitute(ajaxOptions, mutable) {
    const delimeter = this.set('delimeter');
    const normalize = ajaxOptions.normalize || this.set('normalize');
    ajaxOptions.originUrl = ajaxOptions.url;
    if (mutable && normalize) {
      const data = isPlainObject(ajaxOptions.data) ? Object.assign({}, ajaxOptions.data) : ajaxOptions.data;
      ajaxOptions.url = substitute(ajaxOptions.url, data, true, delimeter);
    } else if (ajaxOptions.params) {
      ajaxOptions.url = substitute(ajaxOptions.url, ajaxOptions.params, false, delimeter);
    }
  }

  // #! 走params形式包装ajaxOptions
  _formatQuery(ajaxOptions, needMerge) {
    // 解析url，并把queryStr解析为object
    const u = urllib.parse(ajaxOptions.url, true);
    if (this._uri && !u.host) {
      ['protocol', 'hostname', 'port'].forEach((key) => u[key] = this._uri[key]);
      const pathname = this._uri.pathname === '/' ? '' : (this._uri.pathname || '');
      u.pathname = pathname + u.pathname;
    }
    if (needMerge) {
      // 合并ajaxOptions.data到query，重复的key被data中的值替换
      u.query = Object.assign(u.query || {}, ajaxOptions.data);
      // 去除search属性，在format函数中，如果存在search，那么query解析为queryStr不被接收
      const query = qs.stringify(u.query, ajaxOptions.qsOption);
      u.search = (query && ('?' + query)) || '';
      delete u.query;
    }
    // 得到最后的url
    return urllib.format(u);
  }

  /**
   * ### 配置预处理
   *
   * 1. method改大写，默认是`GET`
   * 2. data值默认为{}
   * 3. headers同全局的`headers`做合并
   * 4. 转为原生Fetch需要的配置项
   */
  _prepareOption(ajaxOptions) {
    if (ajaxOptions.method) {
      ajaxOptions.method = ajaxOptions
        .method
        .toUpperCase();
    } else {
      ajaxOptions.method = 'GET';
    }

    const iHeaders = {};
    const mutable = ajaxOptions.mutable === false ? false : (ajaxOptions.data === undefined || isPlainObject(ajaxOptions.data));
    // 替换字符串变量，只有header不填
    this._substitute(ajaxOptions, mutable);

    // headers是否存在json处理
    const isJsonHeader = iHeaders['Content-Type'] && iHeaders['Content-Type'].indexOf('application/json') > -1;
    // 如果没有指定headers，则把默认的header合并进来
    if (!ajaxOptions.headers) {
      Object.assign(iHeaders, this.set('headers'));
    }

    const credential = ajaxOptions.credential || 'same-origin';
    const extraOption = {};
    // see: https://github.com/github/fetch/issues/263
    const stringify = ajaxOptions.stringify || this.set('stringify');
    // 如果存在json处理，或者method不为GET、DELETE
    if (isJsonHeader || !(ajaxOptions.method === 'GET' || ajaxOptions.method === 'DELETE')) {
      if (mutable) {
        extraOption.body = stringify ? qs.stringify(ajaxOptions.data, ajaxOptions.qsOption) : JSON.stringify(ajaxOptions.data);
        if (!ajaxOptions.headers) {
          iHeaders['Content-Type'] =  stringify ? 'application/x-www-form-urlencoded' : 'application/json; charset=utf-8';
        }
      } else {
        extraOption.body = ajaxOptions.data;
      }
      extraOption.url = this._formatQuery(ajaxOptions);
    } else {
      extraOption.url = this._formatQuery(ajaxOptions, true);
    }
    delete ajaxOptions.data;
    delete ajaxOptions.params;
    delete ajaxOptions.stringify;
    delete ajaxOptions.normalize;
    delete ajaxOptions.mutable;
    /**
     * ### 常用配置
     *
     * | 属性 | 描述 |
     * |: ------ |: ------ |
     * | url | 请求地址 |
     * | method | 请求方法 |
     * | headers | 请求头部 |
     * | mode | 请求模式，参考 `cors`, `no-cors`, `same-origin`, 默认`no-cors` |
     * | credentials | 请求凭证, 参考`omit`, `same-origin`, `include`, 默认是`same-origin`, 有凭证才带cookie |
     * | cache | 缓存模式，参考 `default`, `reload`, `no-cache`, 默认`default` |
     *
     * > see: https://developer.mozilla.org/zh-CN/docs/Web/API/Request
     */
    return Object.assign(ajaxOptions, {
      credentials: credential,
      headers: Object.assign({}, ajaxOptions.headers, iHeaders)
    }, extraOption);
  }

  /**
   * ### 接口调用具体实现
   *
   * ```
   *  const ajax1 = new Ajax();
   *  // 场景1： 常规的接口调用
   *  const promise = ajax1.request({
   *    url: '/api/entity/query/list',
   *    data: {
   *      page: 1,
   *      paeSize: 10
   *    },
   *    callback: (err, res) => {
   *      // err是错误时有值，res是正确时接口的真实数据
   *    }
   *  });
   *  // 场景2：接口请求支持占位符变量
   *  ajax1.request({
   *    url: '/api/entity/:id?status=:status',
   *    data: {
   *      id: 10
   *    },
   *    params: {
   *      status: 1
   *    }
   *  });
   *  // 场景3：占位变量通通用data属性来替换
   *  ajax1.request({
   *    url: '/api/entity/:id?status=:status',
   *    data: {
   *      id: 10,
   *      status: 1
   *    },
   *    normalize: true
   *  });
   * // 这种方式变成通用设置
   *  const ajax2 = new Ajax({normalize: true});
   *  ajax2.request({
   *    url: '/api/entity/:id?status=:status',
   *    data: {
   *      id: 10,
   *      status: 1
   *    }
   *  });
   * ```
   */
  request(ajaxOptions) {
    propTypes.checkPropTypes(ajaxShape, ajaxOptions, 'request', 'Beatle.Ajax');

    ajaxOptions = this._prepareOption(ajaxOptions);
    let beforeRequest = ajaxOptions.beforeRequest;
    let beforeResponse = ajaxOptions.beforeResponse;
    let afterResponse = ajaxOptions.afterResponse;
    delete ajaxOptions.beforeRequest;
    delete ajaxOptions.beforeResponse;
    delete ajaxOptions.afterResponse;

    beforeRequest = beforeRequest || this.set('beforeRequest');
    const processorResult = beforeRequest(ajaxOptions);
    if (processorResult === false) {
      return Promise.reject(false);
    }

    let xhr;
    if (processorResult && typeof processorResult.then === 'function') {
      xhr = processorResult;
    } else {
      /**
      * ### Fetch请求
      *
      * > see: https://fetch.spec.whatwg.org/#methods
      * > see: https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch
      *
      * ### 和jQuery.ajax不同之处
      *
      * * 当接收到一个代表错误的 HTTP 状态码时，从 fetch()返回的 Promise 不会被标记为 reject， 即使该 HTTP 响应的状态码是 404 或 500。相反，它会将 Promise 状态标记为 resolve （但是会将 resolve 的返回值的 ok 属性设置为 false ），  仅当网络故障时或请求被阻止时，才会标记为 reject。
      * * 默认情况下, fetch 不会从服务端发送或接收任何 cookies, 如果站点依赖于用户 session，则会导致未经认证的请求（要发送 cookies，必须设置 credentials 选项）
      *
      * > Fetch API 的支持情况，可以通过检测 Headers、Request、Response 或 fetch() 是否在 Window 或 Worker 域中
      */
      xhr = fetch(ajaxOptions.url, ajaxOptions).then((response) => {
        beforeResponse = beforeResponse || this.set('beforeResponse');
        return beforeResponse(response, ajaxOptions, xhr);
      }).catch(err => {
        callback && callback(err, null, xhr);
      });
    }
    const callback = ajaxOptions.callback;
    xhr = xhr.then((response) => {
      afterResponse = afterResponse || this.set('afterResponse');

      let result = afterResponse(response, ajaxOptions, xhr);
      if (result instanceof Error) {
        // #! callback(result || new Error(messages.abortReponse), null, xhr);
        throw result;
      } else if (result === false) {
        return result;
      } else {
        if (result === undefined) {
          result = response;
        }
        callback && callback(null, result, xhr);
      }
      return result;
    }, (err) => {
      callback && callback(err, null, xhr);
    });
    return xhr;
  }

  poller(pollerOptions) {
    return new Poller(pollerOptions);
  }
}

/**
 * ### mixin方法
 *
 * |        方法         |          描述          |
 * |:       ------          |         ------          |
 */
const mixinMethods = ['get', 'delete', 'post', 'put', 'patch'];

mixinMethods.forEach((method) => {
  /**
   * ```
   *  ajax.get(url, data);
   *  ajax.get(url, data, callback);
   *  ajax.get(url, data, callback, dataType);
   *  ajax.get(url, data, options);
   *  ajax.get(url, data, options, callback);
   * ```
   */
  Ajax.prototype[method] = function (url, data, callback, dataType) {
    const ajaxOptions = {
      method: method,
      url: url,
      data: data
    };
    if (isPlainObject(callback)) {
      Object.assign(ajaxOptions, callback);
      if (typeof dataType === 'function') {
        callback = dataType;
        dataType = null;
      }
    } else if (callback) {
      ajaxOptions.callback = callback;
      ajaxOptions.dataType = dataType;
    }
    return this.request(ajaxOptions);
  };
});
