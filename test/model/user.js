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
      callback: function (store, action) {
        const data = action.arguments[0];
        store.name = data;
      }
    },
    getList: {
      callback: {
        start: (store, action) => {
          store.pending = true;
          store.startArguments = action.arguments;
        },
        success: (store, action) => {
          store.pending = false;
          store.successArguments = action.arguments;
          store.list = action.data;
        }
      }
    },
    getListFail: {
      callback: {
        error: (store, action) => {
          store.error = 'error found.';
        }
      }
    },
    postUser: {
      callback: {
        success: (store, action) => {
          if (action.data.code === 'SUCCESS') {
            store.postUser = true;
          }
        }
      }
    },
    putUser: {
      callback: {
        success: (store, action) => {
          if (action.data.code === 'SUCCESS') {
            store.putUser = true;
          }
        }
      }
    },
    deleteUser: {
      callback: {
        success: (store, action) => {
          if (action.data.code === 'SUCCESS') {
            store.deleteUser = true;
          }
        }
      }
    }
  },
  subscriptions: {
  }
}, require('../resource/user'));
