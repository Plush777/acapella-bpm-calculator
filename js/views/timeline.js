// 세 레인 타임라인 (보컬 100% / 반주 / 보컬 맞춤)

import { secondsPerBeat } from '../core/calc.js';
import { fixed2, isNegligible, percent2, trimNumber } from '../core/format.js';
import { driftAt, fitRatio } from '../core/selectors.js';
import { byId, each, setHTML } from './dom.js';

const LANE = 32;
const GAP = 30;
const TOP = 26;
const MIN_WIDTH = 260;

const Y = { raw: TOP, inst: TOP + LANE + GAP, fit: TOP + (LANE + GAP) * 2 };
const HEIGHT = Y.fit + LANE + 24;

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
    isWide: width >= 420,
  };
};

const line = ({ x1, x2 = x1, y1, y2, color, width = 1, opacity = 1 }) =>
  `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}" stroke="var(--${color})" stroke-width="${width}" opacity="${opacity}"/>`;

const lane = (x, y, duration, color) =>
  `<rect x="${x(0)}" y="${y}" width="${x(duration) - x(0)}" height="${LANE}" fill="var(--${color}-soft)"/>`;

const label = ({ x, y, color, text, anchor = 'start' }) =>
  `<text class="ln" x="${x}" y="${y}" text-anchor="${anchor}" style="fill:var(--${color})">${text}</text>`;

const barNumber = (x, number) =>
  `<text x="${x + 4}" y="${Y.inst + LANE - 5}" style="fill:var(--inst);font-weight:600;paint-order:stroke;stroke:var(--inst-soft);stroke-width:4px">${number}</text>`;

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
  const number = isBar && bar < bars && bar % labelStep === 0 ? [barNumber(instX, bar + 1)] : [];

  return [...ticks, ...links, ...number].join('');
};

const driftGap = ({ drift, right, x }) => {
  if (isNegligible(drift.sec)) return '';
  const isEarly = drift.sec > 0;
  const from = x(Math.min(drift.inst, drift.vocal));
  const to = x(Math.max(drift.inst, drift.vocal));
  return `
    <rect x="${from}" y="${isEarly ? Y.raw : Y.inst}" width="${to - from}" height="${LANE}" fill="none" stroke="var(--mute)" stroke-dasharray="3 3"/>
    <text x="${right}" y="${Y.raw - 8}" text-anchor="end" style="fill:var(--ink);font-weight:600">${fixed2(Math.abs(drift.sec))}초 ${isEarly ? '먼저' : '늦게'} 끝남</text>`;
};

const timelineSVG = (state, view) => {
  const { drift, left, right, x, isWide } = view;
  const beats = Array.from({ length: state.bars * state.beatsPerBar + 1 }, (_, i) => i);

  return [
    lane(x, Y.raw, drift.vocal, 'voc'),
    lane(x, Y.inst, drift.inst, 'inst'),
    lane(x, Y.fit, drift.inst, 'voc'),
    label({ x: left, y: Y.raw - 8, color: 'voc', text: '보컬 100%' }),
    label({ x: left, y: HEIGHT - 5, color: 'voc', text: `보컬 ${percent2(fitRatio(state))}%` }),
    each(beats, beatMark(state, view)),
    label({ x: right, y: HEIGHT - 5, color: 'inst', anchor: 'end', text: `${isWide ? '가운데 레인: ' : ''}반주 ${trimNumber(state.bpm.bi)} BPM` }),
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
