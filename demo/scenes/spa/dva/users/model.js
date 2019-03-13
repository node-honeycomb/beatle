import * as usersService from './resource';

export default {
  namespace: 'users',
  state: {
    list: [],
    total: null,
    page: null,
  },
  reducers: {
    save(state, {data: list, total, page}) {
      return {...state, list, total, page};
    },
  },
  effects: {
    * fetch({payload: {page = 1}}, {call, put}) {
      const {data} = yield call(usersService.fetch, {page});
      yield put({
        type: 'save',
        payload: {
          data,
          total: data.length,
          page: parseInt(page, 10),
        },
      });
    },
    * remove({payload: id}, {call, put}) {
      yield call(usersService.remove, id);
      yield put({name: 'reload'});
    },
    * patch({payload: {id, values}}, {call, put}) {
      yield call(usersService.patch, id, values);
      yield put({name: 'reload'});
    },
    * create({payload: values}, {call, put}) {
      yield call(usersService.create, values);
      yield put({name: 'reload'});
    },
    * reload(action, {put, select}) {
      const page = yield select(state => state.users.page);
      yield put({name: 'fetch', payload: {page}});
    },
  }
};
