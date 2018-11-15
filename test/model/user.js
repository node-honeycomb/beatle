'use strict';

const Beatle = require('../../src');

export default Beatle.createModel({
  displayName: 'user',
  store: {
    name: 'Donald Trump',
    list: [],
    pending: false,
    error: '',
    startArguments: [],
    successArguments: []
  },
  actions: {
    changeName: {
      callback: function (store, payload) {
        const data = payload.arguments[0];
        store.name = data;
      }
    },
    getList: {
      callback: {
        start: (store, payload) => {
          store.pending = true;
          store.startArguments = payload.arguments;
        },
        success: (store, payload) => {
          store.pending = false;
          store.successArguments = payload.arguments;
          store.list = payload.data;
        }
      }
    },
    getListFail: {
      callback: {
        error: (store, paylaod) => {
          store.error = 'error found.';
        }
      }
    },
    postUser: {
      callback: {
        success: (store, paylaod) => {
          if (paylaod.data.code === 'SUCCESS') {
            store.postUser = true;
          }
        }
      }
    },
    putUser: {
      callback: {
        success: (store, paylaod) => {
          if (paylaod.data.code === 'SUCCESS') {
            store.putUser = true;
          }
        }
      }
    },
    deleteUser: {
      callback: {
        success: (store, paylaod) => {
          if (paylaod.data.code === 'SUCCESS') {
            store.deleteUser = true;
          }
        }
      }
    }
  },
  subscriptions: {
  }
}, require('../resource/user'));
