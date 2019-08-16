// import warning from 'fbjs/lib/warning';
// import messages from '../core/messages';
// warning(!attrs.length, messages.mergeWarning, 'update', attrs.join(','), modelName, 'Beatle.ReduxSeed');
export default class StateObserver {
  constructor(storeState, modelState, callback) {
    this._store = storeState;
    for (let key in modelState) {
      if (modelState.hasOwnProperty(key)) {
        this[key] = modelState[key];
        Object.defineProperty(this, key, {
          get() {
            // if (Object(modelState[key]) === modelState[key]) {
            //   return new StateObserver(storeState[key], modelState[key]);
            // } else {
            //   return modelState[key];
            // }
            return modelState[key];
          },
          set(v) {
            if (storeState.asMutable) {
              this._store = storeState = storeState.set(key, v);
            } else {
              this._store[key] = storeState[key] = v;
            }
            callback && callback(key, v);
            modelState[key] = v;
          },
          enumerable: false
        });
      }
    }

    this.forceUpdate = callback;
  }

  getStore() {
    for (let key in this) {
      if (key !== '_store') {
        if (this._store.asMutable) {
          this._store = this._store.set(key, this[key]);
        } else {
          this._store[key] = this[key];
        }
      }
    }
    return this._store;
  }
}
