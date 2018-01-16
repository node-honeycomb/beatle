import Beatle from '../../../src';

export default Beatle.createModel({
  displayName: 'list',
  store: {
    maintainers: []
  },
  actions: {
    getMaintainers: {
      callback: {
        success: (nextStore, payload) => {
          nextStore.maintainers = payload.data.maintainers;
        }
      }
    }
  }
}, require('../resources/list'));
