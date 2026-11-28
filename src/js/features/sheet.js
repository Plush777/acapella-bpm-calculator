// 설정 창. 좁은 화면에서만 쓰며, 넓은 화면의 설정 내용을 창 안으로 옮겨 온다.
// 브라우저의 dialog를 써서 Esc 키와 포커스 이동을 그대로 활용한다.

const NARROW = '(max-width: 899px)';

export const attachSheet = (dialog, { opener, closers, content, wideSlot, narrowSlot }) => {
  const query = window.matchMedia(NARROW);

  const close = () => dialog.close();

  /** 화면 폭에 맞는 자리로 설정 내용을 옮긴다. 넓어지면 열려 있던 창은 닫는다. */
  const place = () => {
    const slot = query.matches ? narrowSlot : wideSlot;
    if (content.parentElement !== slot) slot.append(content);
    if (!query.matches && dialog.open) close();
  };

  opener.addEventListener('click', () => {
    dialog.showModal();
    // 닫히면 연 버튼으로 포커스를 돌려준다.
    dialog.addEventListener('close', () => opener.focus(), { once: true });
  });
  closers.forEach((button) => button.addEventListener('click', close));

  // 창 바깥의 어두운 부분을 누르면 닫는다.
  dialog.addEventListener('click', ({ target }) => {
    if (target === dialog) close();
  });

  query.addEventListener('change', place);
  place();
};
