// 박자 계산. 모두 순수 함수이며 시간 단위는 초, BPM은 4분음표 기준이다.

export const TICKS_PER_BEAT = 960;

/** 변경 후 길이 ÷ 원래 길이 */
export const stretchRatio = (instBpm, vocalBpm) => vocalBpm / instBpm;

export const secondsPerBeat = (bpm) => 60 / bpm;

/** 마디 구간이 걸리는 시간 */
export const spanSeconds = (bpm, bars, beatsPerBar) => bars * beatsPerBar * 60 / bpm;

/** 구간 끝에서 벌어진 정도. sec가 양수면 보컬이 먼저 도착한다. */
export const driftOver = ({ instBpm, vocalBpm, ratio, bars, beatsPerBar }) => {
  const inst = spanSeconds(instBpm, bars, beatsPerBar);
  const vocal = spanSeconds(vocalBpm, bars, beatsPerBar) * ratio;
  const sec = inst - vocal;
  return { inst, vocal, sec, beats: sec * instBpm / 60 };
};

/** 주어진 박만큼 벌어질 때까지 걸리는 반주 박 수 */
export const beatsUntilDrift = ({ instBpm, vocalBpm, ratio, amount }) => {
  const perBeat = Math.abs(1 - secondsPerBeat(vocalBpm) * ratio / secondsPerBeat(instBpm));
  return perBeat < 1e-9 ? Infinity : amount / perBeat;
};

/** 0부터 센 박 위치를 마디:박:틱으로 바꾼다. */
export const toMBT = (beats, beatsPerBar) => {
  const ticks = Math.round(beats * TICKS_PER_BEAT);
  const wholeBeats = Math.floor(ticks / TICKS_PER_BEAT);
  const bar = Math.floor(wholeBeats / beatsPerBar) + 1;
  const beat = String(wholeBeats % beatsPerBar + 1).padStart(2, '0');
  const tick = String(ticks % TICKS_PER_BEAT).padStart(3, '0');
  return `${bar}:${beat}:${tick}`;
};

/** 기준 단어가 목표 박에 오도록 하는 클립 시작 위치 */
export const placeClip = ({ instBpm, ratio, beatsPerBar, anchor, bar, beat, offset }) => {
  const targetBeats = (bar - 1) * beatsPerBar + (beat - 1) + offset;
  const targetTime = targetBeats * secondsPerBeat(instBpm);
  const start = targetTime - anchor * ratio;
  return { targetBeats, targetTime, start, startBeats: start * instBpm / 60 };
};

/** 잰 어긋남으로 비율을 고친다. earlySec가 양수면 보컬이 앞선 것이다. */
export const refineRatio = ({ ratio, instBpm, bars, beatsPerBar, earlySec }) => {
  const inst = spanSeconds(instBpm, bars, beatsPerBar);
  return inst - earlySec > 0 ? ratio * inst / (inst - earlySec) : NaN;
};

/** 절반·그대로·두 배 해석 가운데 원본 길이에 가장 가까운 것 */
export const closestReading = (instBpm, vocalBpm) =>
  [0.5, 1, 2]
    .map((factor) => ({
      factor,
      bpm: vocalBpm * factor,
      ratio: stretchRatio(instBpm, vocalBpm * factor),
    }))
    .reduce((best, next) =>
      (Math.abs(Math.log(next.ratio)) < Math.abs(Math.log(best.ratio)) ? next : best));

/** '12.5', '0:12.5', '1:02:03' 형식을 초로 바꾼다. 틀린 형식은 NaN. */
export const parseTime = (text) => {
  const parts = String(text).trim().split(':');
  const isNumber = (part) => /^(\d+(\.\d*)?|\.\d+)$/.test(part);
  return parts.length <= 3 && parts.every(isNumber)
    ? parts.reduce((total, part) => total * 60 + parseFloat(part), 0)
    : NaN;
};
