// 시작점. 상태, 화면, 입력을 이어 붙인다.

import { percent2 } from './core/format.js';
import { activeRatio, fitRatio } from './core/selectors.js';
import { dehydrate, hydrate, reducer } from './core/state.js';
import { createStore } from './core/store.js';
import { createClickPlayer } from './features/click-player.js';
import { attachCopy } from './features/clipboard.js';
import { load, save } from './features/storage.js';
import { attachTapTempo } from './features/tap-tempo.js';
import { byId, on, onButton, setHidden, setText } from './views/dom.js';
import { renderDrift } from './views/drift.js';
import { renderPlayButton } from './views/player.js';
import { renderRatio, renderTempo } from './views/tempo.js';
import { hidePlayhead, renderTimeline, showPlayhead } from './views/timeline.js';

const INPUTS = ['bi', 'bv', 'olen'];
const VIEWS = [renderTempo, renderRatio, renderDrift, renderTimeline];

const { dispatch, getState, subscribe } = createStore(reducer, hydrate(load()));

const render = (state) => VIEWS.forEach((view) => view(state));

/* ---------- 메트로놈 ---------- */

const songOf = (state) => ({
  instBpm: state.bpm.bi,
  vocalBpm: state.bpm.bv,
  ratio: activeRatio(state),
  bars: state.bars,
  beatsPerBar: state.beatsPerBar,
});

const isSameSong = (a, b) => JSON.stringify(songOf(a)) === JSON.stringify(songOf(b));

const player = createClickPlayer({
  onStart: () => renderPlayButton(true),
  onStop: () => {
    renderPlayButton(false);
    hidePlayhead();
  },
  onProgress: (time) => showPlayhead(getState(), time),
  onUnsupported: () => setHidden('playerr', false),
});

/* ---------- 입력 연결 ---------- */

const bindInputs = () => {
  INPUTS.forEach((id) =>
    on(id, 'input', ({ target }) => dispatch({ type: 'field', id, value: target.value })));

  onButton('meter', ({ dataset }) => dispatch({ type: 'meter', value: Number(dataset.v) }));
  onButton('bars', ({ dataset }) => dispatch({ type: 'bars', value: Number(dataset.v) }));
  onButton('mode', ({ dataset }) => dispatch({ type: 'mode', value: dataset.v }));
  onButton('scale', ({ dataset }) => dispatch({ type: 'scaleVocal', factor: Number(dataset.m) }));

  on('play', 'click', () => player.toggle(songOf(getState())));
};

const bindFeatures = () => {
  [['tapi', 'bi'], ['tapv', 'bv']].forEach(([button, id]) =>
    attachTapTempo(byId(button), {
      onMessage: (message) => setText('tapnote', message),
      onBpm: (bpm) => dispatch({ type: 'field', id, value: String(bpm) }),
    }));

  attachCopy(byId('copy'), byId('copybox'), () => percent2(fitRatio(getState())));

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
