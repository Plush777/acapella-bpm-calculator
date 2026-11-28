// 상태를 한 곳에 두고, 바뀌면 구독자에게 알린다. 바뀌는 값은 이 클로저 안에만 있다.

export const createStore = (reducer, initial) => {
  let state = initial;
  const listeners = new Set();

  const getState = () => state;

  const dispatch = (action) => {
    const prev = state;
    state = reducer(prev, action);
    if (state !== prev) listeners.forEach((listener) => listener(state, prev));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, dispatch, subscribe };
};
