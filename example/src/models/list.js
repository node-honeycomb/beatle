import {createModel, BaseModel} from '../../../src';

@createModel(require('../resources/list'))
export default class ListModel extends BaseModel {
  static displayName = 'list';

  state = {
    maintainers: []
  }

  getMaintainers() {
    return this.execQuery('getMaintainers', (nextStore, payload) => {
      nextStore.maintainers = payload.data.maintainers;
    });
  }
  // static actions = {
  //   getMaintainers: {
  //     callback: {
  //       success: (nextStore, payload) => {
  //         nextStore.maintainers = payload.data.maintainers;
  //       }
  //     }
  //   }
  // }
}
