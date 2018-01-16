'use strict';

import $ from 'jquery';
import UserModel from './model/user';
import assert from 'power-assert';
import Beatle from '../src';
let app = null;

describe('Beatle API测试', function () {
  it('Class: Beatle, Beatle.createModel, Beatle.connect, Beatle.Ajax', function () {
    assert(typeof Beatle.createModel === 'function');
    assert(typeof Beatle.connect === 'function');
    assert(Beatle.Ajax);
    assert(typeof Beatle.Ajax === 'function');
  });
  it('app = new Beatle();', function () {
    app = new Beatle();
    assert(typeof app.ajax === 'object');
    assert(typeof app.model === 'function');
    assert(typeof app.getStore === 'function');
    assert(typeof app.connect === 'function');
    assert(typeof app.run === 'function');
    assert(typeof app.route === 'function');
    assert(typeof app.mount === 'function');
  });
  it('app.ajax', function () {
    assert(typeof app.ajax.request === 'function');
    assert(typeof app.ajax.get === 'function');
    assert(typeof app.ajax.post === 'function');
    assert(typeof app.ajax.put === 'function');
    assert(typeof app.ajax.delete === 'function');
    assert(typeof app.ajax.patch === 'function');
    assert(typeof app.ajax.beforeRequest === 'function');
    assert(typeof app.ajax.afterResponse === 'function');
  });
  it('app.model', function () {
    app.model(UserModel);
  });
  it('app.connect & app.route', function () {
    const UserScene = require('./scene/user.jsx');
    app.route('/index.html', UserScene);
  });
  it('app.run', function () {
    app.run(document.getElementById('main'), '/test');
  });
});

describe('app 基础功能', function () {
  it('初始化渲染', function () {
    assert.equal($('.user-info-content .content-span').html(), UserModel.store.name);
  });

  it('完整数据流', function (done) {
    const store = app.getStore();

    var testValue = 'something new';
    var ev = new Event('input', { bubbles: true });
    ev.simulated = true;
    var element = $('#ipt-change-name').get(0);
    element.value = testValue;
    element.dispatchEvent(ev);

    const unsubscribe = store.subscribe(function () {
      unsubscribe();
      const state = store.getState();
      assert(state.user.name === testValue);
      done();
    });
    $('.btn-change-name').click();
  });
});

describe('app ajax', function () {
  it('get请求 成功', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      const state = store.getState();
      if (step < 2) {
        assert(state.user.pending === true);
        return step++;
      }
      unsubscribe();
      assert(state.user.pending === false);
      assert(state.user.list.length === 2);
      done();
    });
    $('#btn-get-user').click();
  });
  it('get请求 失败', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      if (step < 2) {
        return step++;
      }
      unsubscribe();
      const state = store.getState();
      assert(state.user.error === 'error found.');
      done();
    });
    $('#btn-get-user-fail').click();
  });
  it('get请求 action中带有参数', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      const state = store.getState();
      if (step < 2) {
        assert(state.user.startArguments[0].testQuery === 'test query');
        return step++;
      }
      unsubscribe();
      assert(state.user.successArguments[0].testQuery === 'test query');
      done();
    });
    $('#btn-get-user-with-param').click();
  });
  it('post请求，action中带参数', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      const state = store.getState();
      if (step < 2) {
        assert(!state.user.postUser);
        return step++;
      }
      unsubscribe();
      assert(state.user.postUser);
      done();
    });
    $('#btn-post-user-with-param').click();
  });
  it('put请求，action中带参数', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      const state = store.getState();
      if (step < 2) {
        assert(!state.user.putUser);
        return step++;
      }
      unsubscribe();
      assert(state.user.putUser);
      done();
    });
    $('#btn-put-user-with-param').click();
  });
  it('delete请求，action中带参数', function (done) {
    let step = 1;
    const store = app.getStore();
    const unsubscribe = store.subscribe(function () {
      const state = store.getState();
      if (step < 2) {
        assert(!state.user.deleteUser);
        return step++;
      }
      unsubscribe();
      assert(state.user.deleteUser);
      done();
    });
    $('#btn-delete-user-with-param').click();
  });
});
