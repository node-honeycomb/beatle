
const store = [
  {id: 0, name: 'baqian', email: 'st403471258@gmail.com', website: 'https://api.github.com/users/baqian'}
];
export function fetch() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({data: store});
    }, 300);
  });
}

export function remove(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      const idx = store.findIndex(item => item.id === id);
      if (idx > -1) {
        store.splice(idx - 1, 1);
      }
      resolve({data: store});
    }, 300);
  });
}

export function patch(id, values) {
  return new Promise(resolve => {
    setTimeout(() => {
      const idx = store.findIndex(item => item.id === id);
      if (idx > -1) {
        Object.assign(store[idx], values);
      }
      resolve({data: store});
    }, 300);
  });
}

export function create(values) {
  return new Promise(resolve => {
    setTimeout(() => {
      values.id = store[store.length - 1].id + 1;
      store.push(values);
      resolve({data: store});
    }, 300);
  });
}
