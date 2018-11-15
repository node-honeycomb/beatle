'use strict';

module.exports = {
  getList: {
    url: '/api/user/list',
    method: 'GET'
  },
  getListFail: {
    url: '/wrong_url',
    method: 'GET'
  },
  putUser: {
    url: '/api/user/:id',
    method: 'PUT'
  },
  postUser: {
    url: '/api/user',
    method: 'POST'
  },
  deleteUser: {
    url: '/api/user/:id',
    method: 'DELETE'
  }
};