// BPM 입력과 길이 비율 결과

import { closestReading, parseTime } from '../core/calc.js';
import { duration, fixed2, isNegligible, percent2, trimNumber } from '../core/format.js';
import { fitRatio } from '../core/selectors.js';
import { isValidBpm, scaledBpm } from '../core/state.js';
import { byId, setHidden, setPressed, setText, setValue } from './dom.js';

const BPM_NAMES = [['bi', '반주'], ['bv', '아카펠라']];

const bpmError = (fields) => {
  const wrong = BPM_NAMES.find(([id]) => !isValidBpm(parseFloat(fields[id])));
  return wrong
    ? `${wrong[1]} BPM은 20부터 400까지 입력할 수 있습니다. 지금 결과는 이전 값으로 계산했습니다.`
    : '';
};

const ratioSentence = (ratio) => {
  const change = ratio * 100 - 100;
  if (isNegligible(change)) return '두 BPM이 같아서 길이를 조절하지 않아도 됩니다.';
  const amount = fixed2(Math.abs(change));
  return change > 0
    ? `원본보다 ${amount}% 늘려 주세요. 아카펠라가 느려집니다.`
    : `원본보다 ${amount}% 줄여 주세요. 아카펠라가 빨라집니다.`;
};

const newLength = (text, ratio) => {
  const original = parseTime(text);
  return Number.isNaN(original) ? '길이를 입력해 주세요' : duration(original * ratio);
};

export const renderTempo = ({ bpm, fields, beatsPerBar }) => {
  const error = bpmError(fields);

  BPM_NAMES.forEach(([id]) => {
    setValue(id, fields[id]);
    byId(id).setAttribute('aria-invalid', String(!isValidBpm(parseFloat(fields[id]))));
  });
  setText('err', error);
  setHidden('err', !error);
  setPressed('meter', beatsPerBar);
  byId('scale').querySelectorAll('button').forEach((button) => {
    button.disabled = !isValidBpm(scaledBpm(bpm.bv, Number(button.dataset.m)));
  });
};

export const renderRatio = (state) => {
  const { bpm, fields } = state;
  const ratio = fitRatio(state);
  const closest = closestReading(bpm.bi, bpm.bv);
  const isFine = closest.factor === 1 || !isValidBpm(closest.bpm);

  setText('ratio', percent2(ratio));
  setText('say', ratioSentence(ratio));
  setText('fx', `${trimNumber(bpm.bv)} ÷ ${trimNumber(bpm.bi)} × 100`);
  setText('exact', `${(ratio * 100).toFixed(4)}%`);
  setText('speed', `${(1 / ratio).toFixed(4)}배`);
  setValue('olen', fields.olen);
  setText('nlen', newLength(fields.olen, ratio));
  setHidden('half', isFine);
  setText('half', isFine
    ? ''
    : `아카펠라의 실제 BPM이 ${trimNumber(closest.bpm)}일 수도 있습니다. 원곡을 들으며 확인해 보세요.`);
};
