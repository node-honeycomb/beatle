import warning from 'fbjs/lib/warning';
import messages from '../core/messages';

export default (nextStore, state, modelName) => {
  // #! state = payload, 这是特殊处理
  const attrs = [];
  if (nextStore.asMutable) {
    nextStore = nextStore.asMutable({deep: true});
  } else {
    nextStore = Object.assign({}, nextStore);
  }
  for (let key in state) {
    if (nextStore.hasOwnProperty && !nextStore.hasOwnProperty(key)) {
      attrs.push(key);
    }
    nextStore[key] = state[key];
  }
  warning(!attrs.length, messages.mergeWarning, 'update', attrs.join(','), modelName, 'Beatle.ReduxSeed');
  return nextStore;
};
