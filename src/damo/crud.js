function getQuery(obj) {
  if (obj.data && obj.total !== undefined) {
    return obj;
  }
}
function updateQuery(obj, increment) {
  obj.total = obj.total + increment;
  obj.loading = false;
  if (increment) {
    if (obj.data.length > obj.pageSize) {
      obj.data.pop();
      while (obj.data.length > obj.pageSize) {
        obj.data.pop();
      }
      obj.page = obj.page + 1;
    }
  }
}

function append(currentState, state, action, byMerge) {
  const query = getQuery(currentState);
  if (query) {
    currentState = currentState.data;
  }

  if (Array.isArray(currentState)) {
    if (byMerge && action.cid) {
      const map = {};
      if (Array.isArray(state)) {
        state.forEach(d => map[d[action.cid]] = d);
      } else {
        map[state[action.cid]] = state;
      }
      currentState = currentState.map(d => {
        if (map[d[action.cid]]) {
          d = Object.assign(d, map[d[action.cid]]);
          delete map[d[action.cid]];
          return d;
        } else {
          return d;
        }
      });
    } else {
      if (Array.isArray(state)) {
        state.forEach(d => {
          currentState.unshift(d);
          if (query) {
            updateQuery(query, 1);
          }
        });
      } else {
        currentState.unshift(state);
        if (query) {
          updateQuery(query, 1);
        }
      }
    }
  } else {
    if (byMerge && action.cid) {
      currentState = Object.assign(currentState, state);
    }
  }
  return query || currentState;
}
function getState(payload, processData, pure) {
  const data = processData ? processData(payload.data) : payload.data;
  if (pure) {
    return data;
  } else {
    let state;
    if (Object(data) === data) {
      state = data;
    } else if (data) {
      state = payload.arguments[0];
    }
    return state;
  }
}

export default {
  item: {},
  itemsEntry: {
    data: [],
    loading: false,
    total: 0,
    pageSize: 10,
    page: 1
  },
  reset: (nextState, payload, initialState) => {
    return initialState;
  },
  create: (nextState, payload, initialState, currentState, action) => {
    const state = getState(payload, action.processData);

    if (state) {
      return append(currentState, state, action);
    } else {
      return currentState;
    }
  },
  update: (nextState, payload, initialState, currentState, action) => {
    const state = getState(payload, action.processData);

    if (state) {
      return append(currentState, state, action, true);
    } else {
      return currentState;
    }
  },
  delete: (nextState, payload, initialState, currentState, action) => {
    const state = getState(payload, action.processData);
    const query = getQuery(currentState);
    if (query) {
      currentState = currentState.data;
    }
    if (action.cid) {
      const id = state[action.cid] + '';
      if (Array.isArray(currentState)) {
        let count = 0;
        currentState = currentState.filter(d => {
          if (id.indexOf(d[action.cid]) > -1) {
            count++;
            return false;
          } else {
            return true;
          }
        });
        if (query && count) {
          query.data = currentState;
          updateQuery(query, -count);
        }
      } else {
        if (id.indexOf(currentState[action.cid]) > -1) {
          currentState = initialState;
        }
      }
    }
    return query || currentState;
  },
  get: (nextState, payload, initialState, currentState, action) => {
    return getState(payload, action.processData, true);
  },
  query: (nextState, payload, initialState, currentState, action) => {
    const data = action.processData ? action.processData(payload.data) : payload.data;
    if (Array.isArray(data)) {
      return {
        data: data,
        total: data.length,
        pageSize: 10,
        page: 1,
        loading: false
      };
    } else {
      return data;
    }
  }
};

