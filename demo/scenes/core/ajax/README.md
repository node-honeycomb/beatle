# 接口调用`Class: Ajax`

Beatle封装了fetch模块，并提供Ajax类，在使用接口调用之前，需要初始化Ajax，再通过实例方法发起请求。

```javascript
  const ajax = new Ajax();
  ajax.get('https://api.github.com/users/baqian').then(ret => console.log(ret));
```

接口请求时需要设置`header`等信息，可以通过调用方法的参数传入，也可以设置在实例上（在new Ajax传入配置）

+ 通过`new Beatle.Ajax`产生ajax实例，传入的options配置项，设置实例级的配置：

| 名称 | 描述 |
| :------ | :------ |
| `headers` | 全局的Header配置, 默认取值`window.ajaxHeader` |
| `beforeRequest(ajaxOption)` | 请求之前的钩子函数 |
| `beforeResponse(response, ajaxOption, xhr)` | 请求成功后处理response对象的钩子函数 |
| `afterResponse(result, ajaxOption, xhr)` | 请求成功后处理接口结果数据的钩子函数 |
| `origin` | 配置请求地址前缀 |
| `delimeter` | 请求url默认支持插值替换，`delimeter`是插值变量的语法 |
| `normalize` | 请求url插值替换，是否都走data属性, 默认为`false` |

```javascript
  import {Ajax} from 'beatle';
  const ajax = new Ajax({
    origin: 'https://api.github.com',
    headers: {
      csrfToken: '...'
    },
    beforeRequest: (ajaxOption) => {
      // 发请求之前拦截，可以return promise，则会使用promise而不在发起请求。
    },
    beforeResponse: (response, ajaxOption, xhr) => {
      // 接口请求成功，接口数据未获取到，通过reponse.json等方法获取指定类型的数据
      // 一般来说这里用来处理 Ajax未能处理的数据类型，比如blob类型等。
      return response.json();
    },
    afterResponse(result, ajaxOption, xhr) => {
      // result为数据结果，可以return新的数据结果，来取代接口数据结果
    }
  });
  
  // header为{csrfToken: '...'}，请求地址和origin拼接起来：'https://api.github.com/users/baqian'
  ajax.get('/users/baqian')
  // get第二位参数作为请求的query或者body，第三位参数是ajaxOption补充，比如请求路径上的变量，需要通过ajaxOption.params属性来填充。
  // 统一上效果一致
  ajax.get('/users/:name', {}, {params: {name: 'baqian'}})
  // 通过设置normalize，可以通过query或者body来填充路径上的变量
  ajax.normalize = true;
  ajax.get('/users/:name', {name: 'baqian'})
  // 通过delimeter可以替换变量的占位命名。
  ajax.delimeter = /\{([^\}]+)\}/g
  ajax.get('/users/{name}', {name: 'baqian'})
```

以上例子中在`beforeRequest`中返回mock数据，起到数据模拟效果，参考以下示例

```javascript
  // 在ajaxOption设置mock数据，在beforeRequest直接返回Promise，将不再发请求
  const ajax1 = new Ajax({
    beforeRequest: (ajaxOption) => {
      if (ajaxOption.mock) {
        return Promise.resolve(ajaxOption.mock);
      } if (ajaxOption.mockPath) {
        return ajax1.get(ajaxOption.mockPath);
      } 
    }
  });

  app.ajax.get('/users/baqian')
```

+ Beatle初始化会产品一个内置的ajax实例，通过设置该ajax，可以在整个应用的接口请求做统一配置管理。

```javascript
  const app = new Beatle({
    ajax: {
      origin: 'https://api.github.com',
      headers: {
        csrfToken: '...'
      },
      ...
    }
  });
```

+ ajax实例提供方法来设置实例级别的配置

| 方法 | 参数类型 | 描述 |
|:------ |:------ |:------ |
| `setHeader(headers)` | headers `Object` | 设置`headers`配置 |
| `beforeRequest(fn)` | fn `Function` | 请求之前`beforeRequest`的处理，此时可以更改接口配置或者更多 |
| `beforeResponse(fn)` | fn `Function` | 接口结果预处理`beforeResponse`， |
| `afterResponse(fn)` | fn `Function` | 接口结果后处理`afterResponse` |
| `set(name[, value])` | name `String`, value `any` | 前4个方法都可以通过set方法来设置，简化操作 |

```javascript
  const ajax = new Ajax();

  ajax.beoreResponse(
    function(response, ajaxOption, request){
      // 实际场景中，还需要判断reponse的status是否为200
      return response.json();
    }
  );
  // set为统一的设置方法
  app.set('origin', 'https://api.github.com');
  ajax.get('/users/baqian');
```

> Ajax实例的配置，其默认值来取之Ajax的静态属性，比如`Ajax.origin`，所以如果有必要，可以通过改变Ajax的静态属性，使其所有使用Ajax的实例配置都一致

```javascript
  Ajax.origin = 'https://api.github.com';
  const ajax = new Ajax();
  ajax.get('/users/baqian');
```

### Ajax.request(ajaxOption)

Ajax静态方法，其内部会初始化一个ajax实例，并调用ajax.request来执行

### ajax实例方法

| 名称 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| request | options `Object` | 接口请求调用，所有其他方式的请求最终都会走request来执行 |
| get | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | get请求 |
| post | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | post请求 |
| put | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | put请求 |
| delete | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | delete请求 |
| patch | path `String`, data `Object/null`, options `Object/Function`, dataType `String/Function` | patch请求 |

### ajax.request(options)
* options <`Object`> 接口请求配置
* return <`Promise|null`> 配置中有callback则不会返回内容，否则会返回调用的promise

+ 常用接口配置

| 属性 | 参数类型 | 描述 |
| :------ | :------ | :------ |
| url | `String` | 请求地址 |
| method | `String` | 请求方法 |
| headers | `Object` | 请求头部 |
| mode | `String` | 请求模式，参考 `cors`, `no-cors`, `same-origin`, 默认`no-cors` |
| credentials | `String` | 请求凭证, 参考`omit`, `same-origin`, `include`, 有凭证才带cookie，否则不带cookie | 
| cache | `String` | 缓存模式，参考 `default`, `reload`, `no-cache`, 默认`default` |
| callback | `Function` | 回调处理函数，当存在callback时不会返回promise实例 |
| dataType | `String` | 接口返回结果对数据解析处理基于dataType类型来决定，默认为json解析 |

+ 标准的dataType解析数据类型

| 取值 | 描述 |
| :------ | :------ |
| arrayBuffer | 解析为`ArrayBuffer`的promise对象 |
| blob | 解析为`Blob`的promise对象, `URL.createObjectURL(Blob)`转为base64 |
| formData | 解析为`FormData`的promise对象 |
| json | 解析为`Json`的promise对象 |
| text | 解析为`USVString`的promise对象 |

> ajax处理接口数据，是会默认判断json或者text数据，其他类型的dataType，需要自行设置`beforeResponse`来处理。

### ajax.get(path[, data, options, dataType])
* path <`String`> 请求地址
* data <`Object|null`>  请求参数
* options <`Object|Function`> 当为函数式，则是callback回调，否则为请求配置信息
* dataType <`String|Function`>  请求数据进行数据解析类型，默认是json解析, 当dataType为函数时，则是callback回调，此时options必须为请求配置信息
* return <`Promise|null`> 配置中有callback则不会返回内容，否则会返回调用的promise

```javascript
  new ajax = new Ajax();

  // 第三位参数可以是回调函数，也可以是ajaxOption
  ajax.get('https://api.github.com/users/baqian', null, (err, ret) => {
    if (err) {
      console.error(err);
    } else {
      console.log(ret);
    }
  })
  // 同上效果
  ajax.get('https://api.github.com/users/baqian', null, {
    callback: (err, ret) => {
      if (err) {
        console.error(err);
      } else {
        console.log(ret);
      }
    }
  })
  // 第四位参数仍然可以是callback回调
  ajax.get('https://api.github.com/users/baqian', null, {}， (err, ret) => {
    if (err) {
      console.error(err);
    } else {
      console.log(ret);
    }
  });
  // 标准的，第四个参数用来指定dataType，需要处理的数据类型
  ajax.get('https://api.github.com/users/baqian', null, (err, ret) => {
    if (err) {
      console.error(err);
    } else {
      console.log(ret);
    }
  }, 'json');
```

> 其他接口方法形式一致，包括`post`、 `delete`、`put` 和 `patch`
