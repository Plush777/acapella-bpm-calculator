// 브라우저 저장소. 막혀 있거나 비어 있어도 계산기는 그대로 동작한다.

const KEY = 'acapella-bpm-v2';

export const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

export const save = (data) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장하지 못하면 다음에 처음 값으로 열린다.
  }
};
