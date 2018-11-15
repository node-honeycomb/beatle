export default (nextStore, state) => {
  // #! state = payload, 这是特殊处理
  if (nextStore.asMutable) {
    nextStore = nextStore.merge(state);
  } else {
    // #! todo 需要判断key来源
    nextStore = Object.assign({}, nextStore, state);
  }
  return nextStore;
};
