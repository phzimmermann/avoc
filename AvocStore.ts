export const create = (initialData, reducers) => {
  let data = initialData;
  const listeners = {};

  const update = (bucket, action, payload) => {
    const newData = reducers[bucket][action](data[bucket], payload);
    if (newData === data[bucket]) {
      return;
    }
    data[bucket] = newData;
    (listeners[bucket] || []).forEach((listener) => listener(newData));
  };
  const register = (bucket, listener) => {
    if (!listeners[bucket]) {
      listeners[bucket] = [];
    }
    listeners[bucket].push(listener);
  };
  const unRegister = (bucket, listener) => {
    listeners[bucket] = listeners[bucket].filter((l) => l !== listener);
  };
  const getState = (bucket) => data[bucket];
  return {
    update,
    register,
    unRegister,
    getState,
  };
};
