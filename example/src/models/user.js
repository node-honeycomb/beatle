import Beatle from '../../../src';

export default Beatle.createModel({
  displayName: 'user',
  store: {
    profile: {}
  },
  actions: {
    getUser: {
      callback: {
        success: (nextStore, payload) => {
          nextStore.profile = payload.data;
        }
      }
    }
  }
}, require('../resources/user'));
