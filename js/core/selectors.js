// 상태에서 화면에 필요한 결과를 뽑아내는 순수 함수

import { driftOver, parseTime, placeClip, refineRatio, spanSeconds, stretchRatio, toMBT, TICKS_PER_BEAT } from './calc.js';
import { clock, percent2, trimNumber } from './format.js';
import { SYMPTOMS } from '../data/symptoms.js';

export const fitRatio = ({ bpm }) => stretchRatio(bpm.bi, bpm.bv);

/** 클릭음과 배치에 실제로 쓰는 비율 */
export const activeRatio = (state) => (state.mode === 'fit' ? fitRatio(state) : 1);

export const driftAt = ({ bpm, beatsPerBar }, bars, ratio = 1) =>
  driftOver({ instBpm: bpm.bi, vocalBpm: bpm.bv, ratio, bars, beatsPerBar });

/* ---------- 클립 배치 ---------- */

export const placement = (state) => {
  const { bpm, beatsPerBar, fields } = state;
  const ratio = activeRatio(state);
  const anchor = parseTime(fields.anc);
  const bar = parseInt(fields.tbar, 10);

  if (Number.isNaN(anchor)) return { error: '기준 단어 시간을 12.5 또는 0:12.5처럼 넣어 주세요.' };
  if (!(bar >= 1)) return { error: '마디는 1 이상의 숫자로 넣어 주세요.' };

  const placed = placeClip({
    instBpm: bpm.bi,
    ratio,
    beatsPerBar,
    anchor,
    bar,
    beat: Number(fields.tbeat),
    offset: Number(fields.toff),
  });

  return placed.targetBeats < 0
    ? { error: '1마디보다 앞은 놓을 수 없습니다. 마디를 뒤로 옮겨 주세요.' }
    : { ...placed, ratio, anchor, bar };
};

/** 기준 단어와 4·8마디 뒤에서 확인할 위치. early가 양수면 보컬이 먼저다. */
export const checkpoints = ({ bpm, beatsPerBar }, placed) =>
  [0, 4, 8].map((bars) => {
    const source = placed.anchor + spanSeconds(bpm.bv, bars, beatsPerBar);
    const grid = placed.targetTime + spanSeconds(bpm.bi, bars, beatsPerBar);
    return {
      bars,
      source,
      gridBeats: grid * bpm.bi / 60,
      early: grid - (placed.start + source * placed.ratio),
    };
  });

/** 가사 첫 소리가 나오는 곳. 시간을 비워 두면 null. */
export const firstSound = ({ bpm, fields }, placed) => {
  const first = parseTime(fields.fst);
  if (Number.isNaN(first)) return null;
  return {
    beats: (placed.start + first * placed.ratio) * bpm.bi / 60,
    leadBeats: (placed.anchor - first) * bpm.bv / 60,
  };
};

/* ---------- 어긋남 진단 ---------- */

const shiftFix = ({ bpm, fields }, ms) => {
  const beats = ms / 1000 * bpm.bi / 60;
  const direction = fields.fdir === 'late' ? '왼쪽' : '오른쪽';
  return {
    value: ms ? `${direction}으로 ${trimNumber(ms)}ms` : '옮기지 않음',
    note: `${Math.round(beats * TICKS_PER_BEAT)}틱, ${beats.toFixed(3)}박입니다. Snap을 끄고 옮기세요.`,
  };
};

const stretchFix = ({ bpm, beatsPerBar, fields }, ms, sign, ratioText) => {
  const bars = parseInt(fields.fbar, 10);
  const ratio = parseFloat(ratioText) / 100;
  if (!(bars >= 1) || !(ratio > 0)) {
    return { value: '', note: '마디 수와 비율을 0보다 큰 숫자로 넣어 주세요.' };
  }

  const refined = refineRatio({ ratio, instBpm: bpm.bi, bars, beatsPerBar, earlySec: sign * ms / 1000 });
  return refined > 0 && Number.isFinite(refined)
    ? {
      value: `${percent2(ratio)}% → ${percent2(refined)}%`,
      note: `원본 클립에 새 비율을 적용하세요. 이 측정대로면 아카펠라의 실제 템포는 약 ${(refined * bpm.bi).toFixed(2)} BPM입니다.`,
    }
    : { value: '', note: '어긋난 시간이 구간 길이보다 깁니다. 값을 다시 확인해 주세요.' };
};

/** 비율 칸을 직접 고치지 않았으면 현재 비율을 쓴다. */
export const diagnosisRatioText = (state) => state.fields.frat ?? percent2(activeRatio(state));

export const diagnosis = (state) => {
  const symptom = SYMPTOMS.find(({ id }) => id === state.symptom);
  const ms = parseFloat(state.fields.fms);

  const solve = {
    none: () => ({ value: '', note: '' }),
    shift: () => shiftFix(state, ms),
    stretch: () => stretchFix(state, ms, symptom.sign, diagnosisRatioText(state)),
  }[symptom.fix];

  const result = symptom.fix !== 'none' && !(ms >= 0)
    ? { value: '', note: '어긋난 정도를 0 이상의 숫자로 넣어 주세요.' }
    : solve();

  return { ...symptom, ...result };
};

/* ---------- 작업 순서 ---------- */

const placeStep = ({ beatsPerBar }, placed) => {
  if (placed.error) return '기준 단어가 원하는 박에 오도록 클립을 옮깁니다.';
  return placed.start < 0
    ? `기준 단어가 ${toMBT(placed.targetBeats, beatsPerBar)}에 오도록 클립을 옮깁니다.`
    : `클립 시작을 ${toMBT(placed.startBeats, beatsPerBar)} (${clock(placed.start)})에 맞춥니다.`;
};

const listenStep = ({ beatsPerBar }, placed) => {
  if (placed.error) return '시작, 4마디 뒤, 8마디 뒤에서 기준 단어와 강세가 맞는지 듣습니다.';
  const bar = Math.floor(placed.targetBeats / beatsPerBar) + 1;
  return `${bar}마디, ${bar + 4}마디, ${bar + 8}마디에서 기준 단어와 강세가 맞는지 듣습니다.`;
};

const stretchStep = (state) => {
  const fit = percent2(fitRatio(state));
  return state.mode === 'fit'
    ? `아카펠라 Stretch Amount를 ${fit}%로 넣습니다. 참고용 원곡에도 같은 값을 넣습니다.`
    : `아카펠라를 100%로 둡니다. ${fit}% 버전도 하나 만들어 비교합니다.`;
};

export const workSteps = (state) => {
  const placed = placement(state);
  return [
    `프로젝트 템포를 ${trimNumber(state.bpm.bi)}, 박자표를 ${state.beatsPerBar}/4로 맞춥니다.`,
    '반주의 마디 첫 박을 마디 시작선에 맞추고, Ctrl+F3 메트로놈으로 뒤쪽까지 맞는지 확인합니다.',
    stretchStep(state),
    'Smart Grid를 끄고 Snap 1/8로 대략 배치합니다.',
    `N 키로 Snap을 끄고 ${placeStep(state, placed)}`,
    listenStep(state, placed),
    '보컬 1~2마디 전부터 4~8마디를 이어서 듣습니다. 참고용 원곡은 음소거합니다.',
    '쉬었다 다시 듣고, 클립을 옮기기 전에 어긋난 시간과 느낌을 적습니다. 같은 지점에서 또 들리면 고칩니다.',
  ];
};

export const workMemo = (state) => [
  '아카펠라 작업 메모',
  `반주 ${trimNumber(state.bpm.bi)} BPM / 아카펠라 ${trimNumber(state.bpm.bv)} BPM / ${state.beatsPerBar}/4`,
  `길이 비율 ${percent2(fitRatio(state))}%`,
  '',
  ...workSteps(state).map((step, i) => `${i + 1}. ${step}`),
].join('\n');
