export default (nextStore, state) => {
  // #! state = payload, 这是特殊处理
  if (nextStore.asMutable) {
    nextStore = nextStore.merge(state);
  } else {
    Object.keys(state).forEach((name) => {
      // 严格判断存在属性
      if (Object.prototype.hasOwnProperty.call(nextStore, name)) {
        nextStore[name] = state[name];
      }
    });
  }
  return nextStore;
};
