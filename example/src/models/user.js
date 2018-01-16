import {createModel} from '../../../src';

@createModel(require('../resources/user'))
export default class UserModel {
  static displayName = 'user';

  static store = {
    profile: {}
  };

  static actions = {
    getUser: {
      callback: {
        success: (nextStore, payload) => {
          nextStore.profile = payload.data;
        }
      }
    }
  }
}
