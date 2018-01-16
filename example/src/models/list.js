import {createModel} from '../../../src';

@createModel(require('../resources/list'))
export default class ListModel {
  static displayName = 'list';

  static store = {
    maintainers: []
  }

  static actions = {
    getMaintainers: {
      callback: {
        success: (nextStore, payload) => {
          nextStore.maintainers = payload.data.maintainers;
        }
      }
    }
  }
}
