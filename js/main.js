// 시작점. 상태·화면·입력을 이어 붙인다.

import { percent2 } from './core/format.js';
import { activeRatio, fitRatio, workMemo } from './core/selectors.js';
import { dehydrate, hydrate, reducer } from './core/state.js';
import { createStore } from './core/store.js';
import { createClickPlayer } from './features/click-player.js';
import { attachCopy } from './features/clipboard.js';
import { load, save } from './features/storage.js';
import { attachTapTempo } from './features/tap-tempo.js';
import { renderDiagnosis } from './views/diagnosis.js';
import { byId, on, onButton, setText } from './views/dom.js';
import { renderDrift } from './views/drift.js';
import { renderPlacement } from './views/placement.js';
import { renderSnap } from './views/snap.js';
import { renderSteps } from './views/steps.js';
import { renderRatio, renderTempo } from './views/tempo.js';
import { hidePlayhead, renderTimeline, showPlayhead } from './views/timeline.js';

const INPUTS = ['bi', 'bv', 'olen', 'anc', 'fst', 'tbar', 'tbeat', 'toff', 'fdir', 'fbar', 'frat', 'fms'];
const VIEWS = [renderTempo, renderRatio, renderDrift, renderTimeline, renderPlacement, renderSnap, renderDiagnosis, renderSteps];

const store = createStore(reducer, hydrate(load()));
const { dispatch, getState, subscribe } = store;

const render = (state) => VIEWS.forEach((view) => view(state));

/* ---------- 클릭음 ---------- */

const songOf = (state) => ({
  instBpm: state.bpm.bi,
  vocalBpm: state.bpm.bv,
  ratio: activeRatio(state),
  bars: state.bars,
  beatsPerBar: state.beatsPerBar,
});

const isSameSong = (a, b) => JSON.stringify(songOf(a)) === JSON.stringify(songOf(b));

const player = createClickPlayer({
  onStart: () => setText('play', '멈추기'),
  onStop: () => {
    setText('play', '클릭음으로 들어보기');
    hidePlayhead();
  },
  onProgress: (time) => showPlayhead(getState(), time),
  onUnsupported: () => setText('drift2', '이 브라우저에서는 소리를 낼 수 없습니다.'),
});

/* ---------- 입력 연결 ---------- */

const bindInputs = () => {
  INPUTS.forEach((id) =>
    on(id, 'input', ({ target }) => dispatch({ type: 'field', id, value: target.value })));

  onButton('meter', ({ dataset }) => dispatch({ type: 'meter', value: Number(dataset.v) }));
  onButton('bars', ({ dataset }) => dispatch({ type: 'bars', value: Number(dataset.v) }));
  onButton('mode', ({ dataset }) => dispatch({ type: 'mode', value: dataset.v }));
  onButton('cand', ({ dataset }) => dispatch({ type: 'scaleVocal', factor: Number(dataset.m) }));

  on('sym', 'change', ({ target }) => dispatch({ type: 'symptom', value: target.value }));
  on('steps', 'change', ({ target }) =>
    dispatch({ type: 'step', index: Number(target.dataset.i), checked: target.checked }));
  on('reset', 'click', () => dispatch({ type: 'clearSteps' }));
  on('play', 'click', () => player.toggle(songOf(getState())));
};

const bindFeatures = () => {
  [['tapi', 'bi'], ['tapv', 'bv']].forEach(([button, id]) =>
    attachTapTempo(byId(button), {
      onMessage: (message) => setText('tapnote', message),
      onBpm: (bpm) => dispatch({ type: 'field', id, value: String(bpm) }),
    }));

  attachCopy(byId('copyr'), byId('memo'), () => percent2(fitRatio(getState())));
  attachCopy(byId('copym'), byId('memo'), () => workMemo(getState()));

  new ResizeObserver(() => renderTimeline(getState())).observe(byId('tl'));
};

/* ---------- 시작 ---------- */

subscribe((next, prev) => {
  if (!isSameSong(next, prev)) player.stop();
  render(next);
  save(dehydrate(next));
});

bindInputs();
bindFeatures();
render(getState());
byId('boot').remove();
