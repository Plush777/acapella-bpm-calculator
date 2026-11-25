// 클립 놓을 위치

import { toMBT } from '../core/calc.js';
import { clock, earlyLate, fixed2, percent2 } from '../core/format.js';
import { checkpoints, firstSound, placement } from '../core/selectors.js';
import { each, setHidden, setHTML, setText, setValue } from './dom.js';

const beatOptions = (beatsPerBar) =>
  each(
    Array.from({ length: beatsPerBar }, (_, i) => i + 1),
    (beat) => `<option value="${beat}">${beat}박</option>`,
  );

const beforeStart = ({ beatsPerBar }, { start, startBeats, ratio, bar }) => {
  const trim = -start / ratio;
  const barsNeeded = Math.ceil(-startBeats / beatsPerBar);
  return `
    <p>클립 시작이 프로젝트 0초보다 <b class="num">${fixed2(-start)}초</b> 앞입니다.</p>
    <p class="note">원본 파일 앞부분을 <b class="num">${fixed2(trim)}초</b> 이상 잘라내거나, 기준 단어를 <b class="num">${bar + barsNeeded}마디</b> 이후에 놓으세요.</p>`;
};

const clipStart = ({ beatsPerBar }, { start, startBeats, ratio }) => `
    <p>적용 비율 <b class="num">${percent2(ratio)}%</b>일 때 클립 시작</p>
    <p class="pos">${toMBT(Math.max(0, startBeats), beatsPerBar)}</p>
    <p class="num">${clock(Math.max(0, start))}</p>`;

const firstSoundNote = ({ beatsPerBar }, sound) => {
  if (!sound) return '';
  const lead = Math.round(Math.abs(sound.leadBeats) * 100) / 100;
  const where = sound.beats >= 0 ? toMBT(sound.beats, beatsPerBar) : '프로젝트 시작 전';
  const order = lead ? `원곡에서 기준 단어보다 ${lead}박 ${sound.leadBeats > 0 ? '먼저' : '뒤에'} 들어옵니다.` : '';
  return `<p class="note">가사 첫 소리는 <b class="num">${where}</b>에 나옵니다. ${order}</p>`;
};

const checkRow = ({ beatsPerBar }) => ({ bars, gridBeats, source, early }) => `
    <tr>
      <td>${bars ? `${bars}마디 뒤` : '기준 단어'}</td>
      <td class="num">${toMBT(gridBeats, beatsPerBar)}</td>
      <td class="num">${clock(source)}</td>
      <td class="num">${earlyLate(early)}</td>
    </tr>`;

const resultHTML = (state, placed) => {
  const main = placed.start < -0.0005 ? beforeStart : clipStart;
  return main(state, placed) + firstSoundNote(state, firstSound(state, placed));
};

export const renderPlacement = (state) => {
  const placed = placement(state);
  const { error } = placed;

  setHTML('tbeat', beatOptions(state.beatsPerBar));
  ['anc', 'fst', 'tbar', 'tbeat', 'toff'].forEach((id) => setValue(id, state.fields[id]));

  setText('perr', error ?? '');
  setHidden('perr', !error);
  setHidden('pout', Boolean(error));
  setHTML('pout', error ? '' : resultHTML(state, placed));
  setHTML('chk', error ? '' : each(checkpoints(state, placed), checkRow(state)));
};
