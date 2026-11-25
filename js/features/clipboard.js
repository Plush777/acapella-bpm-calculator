// 글을 복사한다. 브라우저가 막으면 글상자를 펼쳐 직접 복사하게 한다.

const RESTORE_MS = 1800;

const copyFromBox = (box, text) => {
  box.hidden = false;
  box.value = text;
  box.focus();
  box.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
};

const copyText = async (text, fallbackBox) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyFromBox(fallbackBox, text);
  }
};

export const attachCopy = (button, fallbackBox, getText) => {
  const label = button.textContent;

  button.addEventListener('click', async () => {
    const copied = await copyText(getText(), fallbackBox);
    if (copied) fallbackBox.hidden = true;
    button.textContent = copied ? '복사했습니다' : '아래 글을 복사하세요';
    setTimeout(() => { button.textContent = label; }, RESTORE_MS);
  });
};
