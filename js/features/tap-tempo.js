// 박에 맞춰 두드린 시각들로 BPM을 잰다.

import { isValidBpm } from '../core/state.js';

const RESET_AFTER_MS = 2500;
const MIN_TAPS = 4;
const MAX_TAPS = 13;

/** 한참 쉬었다 누르면 새로 세고, 오래된 값은 버린다. */
export const addTap = (taps, time) => {
  const isNewRun = taps.length > 0 && time - taps[taps.length - 1] > RESET_AFTER_MS;
  return [...(isNewRun ? [] : taps), time].slice(-MAX_TAPS);
};

/** 아직 덜 눌렀으면 null, 아니면 소수 첫째 자리까지의 BPM */
export const bpmFromTaps = (taps) => {
  if (taps.length < MIN_TAPS) return null;
  const elapsed = taps[taps.length - 1] - taps[0];
  return Math.round(600000 * (taps.length - 1) / elapsed) / 10;
};

export const tapMessage = (taps, bpm) =>
  (bpm === null
    ? `${MIN_TAPS - taps.length}번 더 누르면 BPM이 나옵니다.`
    : `${taps.length}번 눌러 잰 값은 ${bpm}입니다. 여러 번 누를수록 정확해집니다.`);

/** 버튼에 두드리기를 단다. 마우스·터치는 누르는 순간, 키보드는 클릭으로 센다. */
export const attachTapTempo = (button, { onMessage, onBpm }) => {
  let taps = [];

  const hit = (time) => {
    taps = addTap(taps, time);
    const bpm = bpmFromTaps(taps);
    onMessage(tapMessage(taps, bpm));
    if (bpm !== null && isValidBpm(bpm)) onBpm(bpm);
  };

  button.addEventListener('pointerdown', ({ button: pressed, timeStamp }) => {
    if (pressed === 0) hit(timeStamp);
  });
  button.addEventListener('click', ({ detail, timeStamp }) => {
    if (detail === 0) hit(timeStamp);
  });
};
