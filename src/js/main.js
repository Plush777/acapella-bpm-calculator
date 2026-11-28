// 시작점. 상태, 화면, 입력을 이어 붙인다.

import { percent2 } from './core/format.js';
import { activeRatio, fitRatio } from './core/selectors.js';
import { dehydrate, hydrate, reducer } from './core/state.js';
import { createStore } from './core/store.js';
import { createClickPlayer } from './features/click-player.js';
import { attachCopy } from './features/clipboard.js';
import { attachSheet } from './features/sheet.js';
import { load, save } from './features/storage.js';
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
  attachSheet(byId('sheet'), {
    opener: byId('settings'),
    closers: [byId('sheet-close'), byId('sheet-done')],
    content: byId('options'),
    wideSlot: byId('options-home'),
    narrowSlot: byId('sheet-body'),
  });

  attachCopy(byId('copy'), byId('copybox'), () => percent2(fitRatio(getState())));

  new ResizeObserver(() => renderTimeline(getState())).observe(byId('tl'));
};

/* ---------- 화면 보이기 ---------- */

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** 화면에 쓰인 글자의 글꼴을 미리 받아 둔다. 글꼴이 바뀌면서 화면이 흔들리지 않게 하려는 것이다. */
const loadFonts = () => {
  if (!document.fonts) return Promise.resolve();
  const text = document.body.textContent;
  return Promise.all(['400', '700'].map((weight) =>
    document.fonts.load(`${weight} 16px "Pretendard Variable"`, text))).catch(() => {});
};

/** 내용과 글꼴이 모두 준비된 다음 한 번에 보여 준다. 늦어도 1.5초 뒤에는 보여 준다. */
const revealWhenReady = () =>
  Promise.race([loadFonts(), wait(1500)]).then(() => {
    document.documentElement.classList.remove('loading');
  });

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
revealWhenReady();
