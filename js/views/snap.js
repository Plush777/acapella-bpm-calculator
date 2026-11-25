// Snap 간격 표

import { secondsPerBeat, TICKS_PER_BEAT } from '../core/calc.js';
import { trimNumber } from '../core/format.js';
import { each, setHTML, setText } from './dom.js';

const RECOMMENDED = '1/8';

const snapGrid = (beatsPerBar) => [
  { name: 'Measure', beats: beatsPerBar, use: '마디 시작에 배치' },
  { name: '1/4', beats: 1, use: '박 단위로 위치 잡기' },
  { name: '1/8', beats: 0.5, use: '처음 배치할 때 추천' },
  { name: '1/16', beats: 0.25, use: '더 잘게 배치' },
];

const duration = (seconds, beats, beatsPerBar) =>
  (beats === beatsPerBar || seconds >= 1
    ? `${seconds.toFixed(3)}초`
    : `${Math.round(seconds * 1000)}ms`);

const snapRow = ({ bpm, beatsPerBar }) => ({ name, beats, use }) => `
    <tr class="${name === RECOMMENDED ? 'on' : ''}">
      <td class="num">${name}</td>
      <td class="num">${duration(beats * secondsPerBeat(bpm.bi), beats, beatsPerBar)}</td>
      <td class="num">${beats * TICKS_PER_BEAT}</td>
      <td>${use}</td>
    </tr>`;

const OFF_ROW = '<tr><td>끄기</td><td class="num">자유</td><td class="num">–</td><td>마지막 미세 조정</td></tr>';

export const renderSnap = (state) => {
  setText('snapn', `반주 ${trimNumber(state.bpm.bi)} BPM, ${state.beatsPerBar}/4박자 기준입니다.`);
  setHTML('snap', each(snapGrid(state.beatsPerBar), snapRow(state)) + OFF_ROW);
};
