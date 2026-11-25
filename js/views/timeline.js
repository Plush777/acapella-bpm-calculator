// 세 줄 타임라인 (아카펠라 원본, 반주, 길이를 조절한 아카펠라)

import { secondsPerBeat } from '../core/calc.js';
import { fastSlow, isNegligible, percent2, trimNumber } from '../core/format.js';
import { driftAt, fitRatio } from '../core/selectors.js';
import { byId, each, setHTML } from './dom.js';

const LANE = 32;
const GAP = 32;
const TOP = 26;
const MIN_WIDTH = 260;

const Y = { raw: TOP, inst: TOP + LANE + GAP, fit: TOP + (LANE + GAP) * 2 };
const HEIGHT = Y.fit + LANE + 26;

/** 화면 폭에 맞춘 축과 간격 */
const geometry = (state, width) => {
  const drift = driftAt(state, state.bars);
  const left = 1;
  const right = width - 1;
  const longest = Math.max(drift.inst, drift.vocal);
  const x = (time) => left + (right - left) * time / longest;
  const beatWidth = x(secondsPerBeat(state.bpm.bi)) - x(0);
  const barWidth = beatWidth * state.beatsPerBar;

  return {
    drift, left, right, x,
    showBeats: beatWidth >= 5,
    labelStep: [1, 2, 4, 8].find((step) => barWidth * step >= 26) ?? 8,
  };
};

const line = ({ x1, x2 = x1, y1, y2, color, width = 1, opacity = 1 }) =>
  `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}" stroke="var(--${color})" stroke-width="${width}" opacity="${opacity}"/>`;

const lane = (x, y, duration, color) =>
  `<rect x="${x(0)}" y="${y}" width="${x(duration) - x(0)}" height="${LANE}" fill="var(--${color}-soft)"/>`;

/** halo는 글자 뒤의 선을 가리는 테두리 색 */
const label = ({ x, y, color, text, anchor = 'start', halo = 'panel' }) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" style="fill:var(--${color});paint-order:stroke;stroke:var(--${halo});stroke-width:5px">${text}</text>`;

const beatMark = ({ bpm, beatsPerBar, bars }, { x, showBeats, labelStep }) => (beat) => {
  const isBar = beat % beatsPerBar === 0;
  if (!isBar && !showBeats) return '';

  const instX = x(beat * secondsPerBeat(bpm.bi));
  const rawX = x(beat * secondsPerBeat(bpm.bv));
  const bar = beat / beatsPerBar;
  const inset = isBar ? 0 : LANE * 0.5;
  const look = { width: isBar ? 1.6 : 1, opacity: isBar ? 1 : 0.4 };

  const ticks = [
    line({ x1: rawX, y1: Y.raw + inset, y2: Y.raw + LANE, color: 'voc', ...look }),
    line({ x1: instX, y1: Y.inst, y2: Y.inst + LANE - inset, color: 'inst', ...look }),
    line({ x1: instX, y1: Y.fit, y2: Y.fit + LANE - inset, color: 'voc', ...look }),
  ];
  const links = isBar ? [
    line({ x1: rawX, x2: instX, y1: Y.raw + LANE + 2, y2: Y.inst - 2, color: 'mute' }),
    line({ x1: instX, y1: Y.inst + LANE + 2, y2: Y.fit - 2, color: 'mute', opacity: 0.5 }),
  ] : [];
  const number = isBar && bar < bars && bar % labelStep === 0
    ? [label({ x: instX + 4, y: Y.inst + LANE - 6, color: 'inst', text: bar + 1, halo: 'inst-soft' })]
    : [];

  return [...ticks, ...links, ...number].join('');
};

const driftGap = ({ drift, right, x }) => {
  if (isNegligible(drift.sec)) return '';
  const from = x(Math.min(drift.inst, drift.vocal));
  const to = x(Math.max(drift.inst, drift.vocal));
  return `<rect x="${from}" y="${drift.sec > 0 ? Y.raw : Y.inst}" width="${to - from}" height="${LANE}" fill="none" stroke="var(--mute)" stroke-dasharray="3 3"/>`
    + label({ x: right, y: Y.raw - 8, color: 'ink', anchor: 'end', text: fastSlow(drift.sec) });
};

const timelineSVG = (state, view) => {
  const { drift, left, x } = view;
  const beats = Array.from({ length: state.bars * state.beatsPerBar + 1 }, (_, i) => i);

  return [
    lane(x, Y.raw, drift.vocal, 'voc'),
    lane(x, Y.inst, drift.inst, 'inst'),
    lane(x, Y.fit, drift.inst, 'voc'),
    each(beats, beatMark(state, view)),
    label({ x: left, y: Y.raw - 8, color: 'voc', text: '아카펠라 원본' }),
    label({ x: left, y: Y.inst + LANE + 19, color: 'inst', text: `반주 ${trimNumber(state.bpm.bi)} BPM` }),
    label({ x: left, y: Y.fit + LANE + 19, color: 'voc', text: `아카펠라 ${percent2(fitRatio(state))}%` }),
    driftGap(view),
    `<line id="ph" x1="0" x2="0" y1="${Y.raw - 3}" y2="${Y.fit + LANE + 3}" stroke="var(--ink)" stroke-width="2" visibility="hidden"/>`,
  ].join('');
};

const currentWidth = () => Math.max(MIN_WIDTH, byId('tl').clientWidth);

export const renderTimeline = (state) => {
  const width = currentWidth();
  const svg = byId('tl');
  svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
  svg.setAttribute('height', HEIGHT);
  setHTML('tl', timelineSVG(state, geometry(state, width)));
};

export const showPlayhead = (state, time) => {
  const x = geometry(state, currentWidth()).x(time);
  const playhead = byId('ph');
  playhead.setAttribute('x1', x);
  playhead.setAttribute('x2', x);
  playhead.setAttribute('visibility', 'visible');
};

export const hidePlayhead = () => byId('ph').setAttribute('visibility', 'hidden');
