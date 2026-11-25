// 100% 그대로 썼을 때 벌어지는 정도

import { beatsUntilDrift } from '../core/calc.js';
import { earlyLate, fixed2, isNegligible, percent2 } from '../core/format.js';
import { driftAt, fitRatio } from '../core/selectors.js';
import { each, setHTML, setPressed, setText } from './dom.js';

const TABLE_BARS = [1, 2, 4, 8, 16, 32];

const headline = (state, { sec, beats }) =>
  (isNegligible(sec)
    ? `100% 그대로도 ${state.bars}마디 끝까지 마디선이 맞습니다.`
    : `100% 그대로 쓰면 ${state.bars}마디 끝에서 보컬이 ${fixed2(Math.abs(sec))}초(${fixed2(Math.abs(beats))}박) ${sec > 0 ? '먼저' : '늦게'} 도착합니다. ${percent2(fitRatio(state))}%로 맞추면 끝까지 맞습니다.`);

const timeToDrift = ({ bpm, beatsPerBar }) => (amount) => {
  const beats = beatsUntilDrift({ instBpm: bpm.bi, vocalBpm: bpm.bv, ratio: 1, amount });
  return beats < beatsPerBar
    ? `${beats.toFixed(1)}박 만에`
    : `${(beats / beatsPerBar).toFixed(1)}마디 만에`;
};

const detail = (state, { sec }) => {
  if (isNegligible(sec)) return 'BPM이 정확하고 일정할 때의 계산입니다. 보컬이 들어오는 박은 따로 맞춰야 합니다.';
  const until = timeToDrift(state);
  return `¼박(1/16 한 칸)은 ${until(0.25)}, 반 박은 ${until(0.5)}, 한 박은 ${until(1)} 벌어집니다. 짧은 구절이나 애드리브라면 100%도 쓸 수 있습니다. 긴 구간은 시작·중간·끝을 모두 들어 보세요.`;
};

const tableRow = (state) => (bars) => {
  const { inst, vocal, sec, beats } = driftAt(state, bars);
  return `
    <tr class="${bars === state.bars ? 'on' : ''}">
      <td>${bars}마디</td>
      <td class="num">${fixed2(inst)}초</td>
      <td class="num">${fixed2(vocal)}초</td>
      <td class="num">${earlyLate(sec)}</td>
      <td class="num">${fixed2(Math.abs(beats))}박</td>
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
