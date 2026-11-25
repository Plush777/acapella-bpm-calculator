// 화면 상태의 모양과 바뀌는 규칙. 상태를 고치지 않고 항상 새 객체를 돌려준다.

import { SYMPTOMS } from '../data/symptoms.js';

const BPM_FIELDS = ['bi', 'bv'];
const METERS = [4, 3];
const BAR_COUNTS = [4, 8, 16, 32];
const MODES = ['fit', 'raw'];

/** 브라우저에 저장해 두는 입력칸 */
export const SAVED_FIELDS = ['olen', 'anc', 'fst', 'tbar', 'tbeat', 'toff'];

export const initialState = Object.freeze({
  bpm: { bi: 67, bv: 73 },     // 마지막으로 올바르게 넣은 값
  fields: {                    // 입력칸에 적힌 글자 그대로
    bi: '67', bv: '73', olen: '10',
    anc: '8.00', fst: '7.59', tbar: '9', tbeat: '1', toff: '0',
    fdir: 'late', fbar: '8', fms: '120',
    frat: null,                // null이면 현재 비율을 따라간다
  },
  beatsPerBar: 4,
  bars: 8,
  mode: 'fit',                 // fit = 맞춤 비율, raw = 100%
  symptom: 'const',
  done: [],                    // 체크한 작업 순서 번호
});

export const isValidBpm = (n) => n >= 20 && n <= 400;

const withFields = (state, changes) => ({ ...state, fields: { ...state.fields, ...changes } });

const setBpm = (state, id, text) => {
  const value = parseFloat(text);
  const next = withFields(state, { [id]: text, frat: null });
  return isValidBpm(value) ? { ...next, bpm: { ...next.bpm, [id]: value } } : next;
};

const setField = (state, { id, value }) =>
  (BPM_FIELDS.includes(id) ? setBpm(state, id, value) : withFields(state, { [id]: value }));

const setMeter = (state, { value }) => {
  const beat = Number(state.fields.tbeat) <= value ? state.fields.tbeat : '1';
  return { ...withFields(state, { tbeat: beat }), beatsPerBar: value };
};

const setDone = (state, { index, checked }) => ({
  ...state,
  done: checked
    ? [...new Set([...state.done, index])]
    : state.done.filter((i) => i !== index),
});

const scaleVocalBpm = (state, { factor }) =>
  setBpm(state, 'bv', String(Math.round(state.bpm.bv * factor * 1000) / 1000));

const handlers = {
  field: setField,
  meter: setMeter,
  bars: (state, { value }) => ({ ...state, bars: value }),
  mode: (state, { value }) => ({ ...withFields(state, { frat: null }), mode: value }),
  symptom: (state, { value }) => ({ ...state, symptom: value }),
  scaleVocal: scaleVocalBpm,
  step: setDone,
  clearSteps: (state) => ({ ...state, done: [] }),
};

export const reducer = (state, action) => {
  const handle = handlers[action.type];
  return handle ? handle(state, action) : state;
};

/** 저장할 것만 추린다. */
export const dehydrate = ({ bpm, fields, beatsPerBar, bars, mode, symptom, done }) => ({
  bpm, beatsPerBar, bars, mode, symptom, done,
  fields: Object.fromEntries(SAVED_FIELDS.map((id) => [id, fields[id]])),
});

/** 저장된 값을 검사해 쓸 수 있는 것만 처음 상태에 얹는다. */
export const hydrate = (saved) => {
  if (!saved || typeof saved !== 'object') return initialState;

  const base = initialState;
  const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
  const pickBpm = (id) => (isValidBpm(saved.bpm?.[id]) ? Number(saved.bpm[id]) : base.bpm[id]);
  const isUsable = (id) => {
    const value = saved.fields?.[id];
    return typeof value === 'string' && (value !== '' || id === 'fst');
  };

  const bpm = { bi: pickBpm('bi'), bv: pickBpm('bv') };
  const fields = Object.fromEntries(
    SAVED_FIELDS.filter(isUsable).map((id) => [id, saved.fields[id]]),
  );
  const restored = withFields({
    ...base,
    bpm,
    bars: pick(saved.bars, BAR_COUNTS, base.bars),
    mode: pick(saved.mode, MODES, base.mode),
    symptom: pick(saved.symptom, SYMPTOMS.map(({ id }) => id), base.symptom),
    done: Array.isArray(saved.done) ? saved.done.filter(Number.isInteger) : base.done,
  }, { ...fields, bi: String(bpm.bi), bv: String(bpm.bv) });

  return setMeter(restored, { value: pick(saved.beatsPerBar, METERS, base.beatsPerBar) });
};
