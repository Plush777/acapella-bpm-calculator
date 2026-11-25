// 화면을 건드리는 작은 도구들. DOM 변경은 이 함수들을 거친다.

const rendered = new WeakMap();

export const byId = (id) => document.getElementById(id);

export const setText = (id, text) => {
  byId(id).textContent = text;
};

/** 내용이 달라졌을 때만 다시 그린다. 포커스와 재생선이 유지된다. */
export const setHTML = (id, html) => {
  const el = byId(id);
  if (rendered.get(el) === html) return;
  rendered.set(el, html);
  el.innerHTML = html;
};

export const setHidden = (id, hidden) => {
  byId(id).hidden = hidden;
};

/** 입력 중인 칸의 커서가 튀지 않도록 값이 다를 때만 넣는다. */
export const setValue = (id, value) => {
  const el = byId(id);
  if (el.value !== value) el.value = value;
};

/** 버튼 묶음에서 고른 버튼을 표시한다. */
export const setPressed = (id, value) =>
  byId(id).querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.v === String(value)));
  });

export const on = (id, type, handler) => byId(id).addEventListener(type, handler);

/** 묶음 안의 버튼을 누르면 그 버튼을 넘겨준다. */
export const onButton = (id, handler) =>
  on(id, 'click', ({ target }) => {
    const button = target.closest('button');
    if (button) handler(button);
  });

/** 값 하나를 HTML로 바꾸는 함수로 목록을 그린다. */
export const each = (items, template) => items.map(template).join('');
