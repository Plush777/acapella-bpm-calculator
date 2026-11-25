// 템포 입력과 길이 비율 결과

import { closestReading, parseTime, stretchRatio } from '../core/calc.js';
import { clock, fixed2, isNegligible, percent2, trimNumber } from '../core/format.js';
import { fitRatio } from '../core/selectors.js';
import { isValidBpm } from '../core/state.js';
import { byId, setHidden, setHTML, setPressed, setText, setValue } from './dom.js';

const BPM_NAMES = [['bi', '반주'], ['bv', '아카펠라']];

const bpmError = (fields) => {
  const wrong = BPM_NAMES.find(([id]) => !isValidBpm(parseFloat(fields[id])));
  return wrong
    ? `${wrong[1]} BPM은 20에서 400 사이의 숫자로 넣어 주세요. 아래 결과는 마지막으로 맞게 넣은 값입니다.`
    : '';
};

const ratioSentence = (ratio) => {
  const change = ratio * 100 - 100;
  if (isNegligible(change)) return '두 템포가 같습니다. 길이는 두고 위치만 맞추세요.';
  return `원본보다 ${fixed2(Math.abs(change))}% ${change > 0
    ? '길게 늘립니다. 보컬이 느려집니다.'
    : '짧게 줄입니다. 보컬이 빨라집니다.'}`;
};

const newDuration = (text, ratio) => {
  const original = parseTime(text);
  if (Number.isNaN(original)) return '시간을 넣어 주세요';
  return original >= 60 ? clock(original * ratio) : `${fixed2(original * ratio)}초`;
};

const candidateLabel = ({ bi, bv }, factor) =>
  `<span class="num">${trimNumber(bv * factor)}</span> → <span class="num">${percent2(stretchRatio(bi, bv * factor))}%</span>`;

export const renderTempo = ({ bpm, fields, beatsPerBar }) => {
  const error = bpmError(fields);

  BPM_NAMES.forEach(([id]) => {
    setValue(id, fields[id]);
    byId(id).setAttribute('aria-invalid', String(!isValidBpm(parseFloat(fields[id]))));
  });
  setText('err', error);
  setHidden('err', !error);
  setPressed('meter', beatsPerBar);
  byId('cand').querySelectorAll('button').forEach((button) => {
    button.innerHTML = candidateLabel(bpm, Number(button.dataset.m));
  });
};

export const renderRatio = (state) => {
  const { bpm, fields } = state;
  const ratio = fitRatio(state);
  const closest = closestReading(bpm.bi, bpm.bv);

  setText('ratio', percent2(ratio));
  setText('say', ratioSentence(ratio));
  setText('fx', `${trimNumber(bpm.bv)} ÷ ${trimNumber(bpm.bi)} × 100`);
  setText('exact', `${(ratio * 100).toFixed(4)}%`);
  setText('speed', `${(1 / ratio).toFixed(4)}배`);
  setValue('olen', fields.olen);
  setText('nlen', newDuration(fields.olen, ratio));
  setHidden('half', closest.factor === 1);
  setHTML('half', closest.factor === 1
    ? ''
    : `아카펠라를 ${trimNumber(closest.bpm)} BPM으로 보면 ${percent2(closest.ratio)}%로 원본에 더 가깝습니다. 원곡 박자와 대조해 보세요.`);
};
