// 원본을 그대로 썼을 때 어긋나는 정도

import { beatsUntilDrift } from '../core/calc.js';
import { fastSlow, fixed2, isNegligible, percent2 } from '../core/format.js';
import { driftAt, fitRatio } from '../core/selectors.js';
import { each, setHTML, setPressed, setText } from './dom.js';

const TABLE_BARS = [1, 2, 4, 8, 16, 32];

const headline = (state, { sec, beats }) =>
  (isNegligible(sec)
    ? `원본을 그대로 써도 ${state.bars}마디 끝까지 박자가 맞습니다.`
    : `원본을 그대로 쓰면 ${state.bars}마디 뒤에 아카펠라가 ${fixed2(Math.abs(sec))}초(${fixed2(Math.abs(beats))}박) ${sec > 0 ? '앞서갑니다' : '늦어집니다'}. 길이를 ${percent2(fitRatio(state))}%로 조절하면 끝까지 맞습니다.`);

const timeToDrift = ({ bpm, beatsPerBar }) => (amount) => {
  const beats = beatsUntilDrift({ instBpm: bpm.bi, vocalBpm: bpm.bv, ratio: 1, amount });
  return beats < beatsPerBar
    ? `${beats.toFixed(1)}박`
    : `${(beats / beatsPerBar).toFixed(1)}마디`;
};

const detail = (state, { sec }) => {
  if (isNegligible(sec)) return '곡의 BPM이 일정할 때의 결과입니다. 아카펠라가 들어오는 위치는 직접 맞춰 주세요.';
  const until = timeToDrift(state);
  return `${until(0.5)} 뒤에는 반 박, ${until(1)} 뒤에는 한 박이 어긋납니다. 짧은 구간은 원본을 그대로 써도 괜찮지만, 긴 구간은 처음과 중간, 끝을 모두 들어 보세요.`;
};

const tableRow = (state) => (bars) => {
  const { inst, vocal, sec, beats } = driftAt(state, bars);
  return `
    <tr class="${bars === state.bars ? 'on' : ''}">
      <td>${bars}마디</td>
      <td class="r">${fixed2(inst)}초</td>
      <td class="r">${fixed2(vocal)}초</td>
      <td class="r">${fastSlow(sec)}</td>
      <td class="r">${fixed2(Math.abs(beats))}박</td>
    </tr>`;
};

export const renderDrift = (state) => {
  const drift = driftAt(state, state.bars);

  setPressed('mode', state.mode);
  setPressed('bars', state.bars);
  setText('drift', headline(state, drift));
  setText('drift2', detail(state, drift));
  setHTML('dt', each(TABLE_BARS, tableRow(state)));
};
