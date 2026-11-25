// 박자 계산. 모두 순수 함수이며 시간 단위는 초, BPM은 4분음표 기준이다.

/** 변경 후 길이를 원래 길이로 나눈 값 */
export const stretchRatio = (instBpm, vocalBpm) => vocalBpm / instBpm;

export const secondsPerBeat = (bpm) => 60 / bpm;

/** 마디 구간이 걸리는 시간 */
export const spanSeconds = (bpm, bars, beatsPerBar) => bars * beatsPerBar * 60 / bpm;

/** 구간 끝에서 어긋난 정도. sec가 양수면 아카펠라가 앞선다. */
export const driftOver = ({ instBpm, vocalBpm, ratio, bars, beatsPerBar }) => {
  const inst = spanSeconds(instBpm, bars, beatsPerBar);
  const vocal = spanSeconds(vocalBpm, bars, beatsPerBar) * ratio;
  const sec = inst - vocal;
  return { inst, vocal, sec, beats: sec * instBpm / 60 };
};

/** 주어진 박만큼 어긋날 때까지 걸리는 반주 박 수 */
export const beatsUntilDrift = ({ instBpm, vocalBpm, ratio, amount }) => {
  const perBeat = Math.abs(1 - secondsPerBeat(vocalBpm) * ratio / secondsPerBeat(instBpm));
  return perBeat < 1e-9 ? Infinity : amount / perBeat;
};

/** 절반, 그대로, 2배 가운데 원본 길이에 가장 가까워지는 BPM */
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
