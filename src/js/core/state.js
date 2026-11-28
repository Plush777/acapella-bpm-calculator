// 화면 상태의 모양과 바뀌는 규칙. 상태를 고치지 않고 항상 새 객체를 돌려준다.

const METERS = [4, 3];
const BAR_COUNTS = [4, 8, 16, 32];
const MODES = ['fit', 'raw'];

export const initialState = Object.freeze({
  bpm: { bi: 67, bv: 73 },                     // 마지막으로 올바르게 넣은 값
  fields: { bi: '67', bv: '73', olen: '10' },  // 입력칸에 적힌 글자 그대로
  beatsPerBar: 4,
  bars: 8,
  mode: 'fit',                                 // fit = 길이 조절 후, raw = 원본
});

export const isValidBpm = (n) => n >= 20 && n <= 400;

export const scaledBpm = (bpm, factor) => Math.round(bpm * factor * 1000) / 1000;

const withField = (state, id, value) => ({ ...state, fields: { ...state.fields, [id]: value } });

const setBpm = (state, id, text) => {
  const value = parseFloat(text);
  const next = withField(state, id, text);
  return isValidBpm(value) ? { ...next, bpm: { ...next.bpm, [id]: value } } : next;
};

const handlers = {
  field: (state, { id, value }) =>
    (id in state.bpm ? setBpm(state, id, value) : withField(state, id, value)),
  meter: (state, { value }) => ({ ...state, beatsPerBar: value }),
  bars: (state, { value }) => ({ ...state, bars: value }),
  mode: (state, { value }) => ({ ...state, mode: value }),
  scaleVocal: (state, { factor }) => setBpm(state, 'bv', String(scaledBpm(state.bpm.bv, factor))),
};

export const reducer = (state, action) => {
  const handle = handlers[action.type];
  return handle ? handle(state, action) : state;
};

/** 저장할 것만 추린다. */
export const dehydrate = ({ bpm, fields, beatsPerBar, bars, mode }) => ({
  bpm, beatsPerBar, bars, mode, fields: { olen: fields.olen },
});

/** 저장된 값을 검사해 쓸 수 있는 것만 처음 상태에 얹는다. */
export const hydrate = (saved) => {
  if (!saved || typeof saved !== 'object') return initialState;

  const base = initialState;
  const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
  const pickBpm = (id) => (isValidBpm(saved.bpm?.[id]) ? Number(saved.bpm[id]) : base.bpm[id]);

  const bpm = { bi: pickBpm('bi'), bv: pickBpm('bv') };
  const olen = typeof saved.fields?.olen === 'string' && saved.fields.olen !== ''
    ? saved.fields.olen
    : base.fields.olen;

  return {
    bpm,
    fields: { bi: String(bpm.bi), bv: String(bpm.bv), olen },
    beatsPerBar: pick(saved.beatsPerBar, METERS, base.beatsPerBar),
    bars: pick(saved.bars, BAR_COUNTS, base.bars),
    mode: pick(saved.mode, MODES, base.mode),
  };
};
