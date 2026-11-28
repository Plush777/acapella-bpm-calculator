// 원본을 그대로 썼을 때 어긋나는 정도

import { beatsUntilDrift } from '../core/calc.js';
import { fastSlow, fixed2, isNegligible, percent2 } from '../core/format.js';
import { driftAt, fitRatio } from '../core/selectors.js';
import { each, setHTML, setPressed, setText } from './dom.js';

const TABLE_BARS = [1, 2, 4, 8, 16, 32];

const headline = (state, { sec, beats }) =>
  (isNegligible(sec)
    ? `원본 그대로 써도 ${state.bars}마디 끝까지 박자가 맞습니다.`
    : `원본 그대로 쓰면 ${state.bars}마디 뒤에 아카펠라가 반주보다 ${fixed2(Math.abs(sec))}초 ${sec > 0 ? '먼저' : '늦게'} 나옵니다.`);

const timeToDrift = ({ bpm, beatsPerBar }) => (amount) => {
  const beats = beatsUntilDrift({ instBpm: bpm.bi, vocalBpm: bpm.bv, ratio: 1, amount });
  return beats < beatsPerBar
    ? `${beats.toFixed(1)}박`
    : `${(beats / beatsPerBar).toFixed(1)}마디`;
};

const detail = (state, { sec, beats }) => {
  if (isNegligible(sec)) return '';
  const until = timeToDrift(state);
  return `박자로는 ${fixed2(Math.abs(beats))}박 차이이고, ${until(0.5)}만 지나도 반 박이 어긋납니다. 길이를 ${percent2(fitRatio(state))}%로 조절하면 끝까지 맞습니다.`;
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
