// 상태에서 화면에 필요한 결과를 뽑아내는 순수 함수

import { driftOver, stretchRatio } from './calc.js';

export const fitRatio = ({ bpm }) => stretchRatio(bpm.bi, bpm.bv);

/** 메트로놈에서 아카펠라에 쓰는 비율 */
export const activeRatio = (state) => (state.mode === 'fit' ? fitRatio(state) : 1);

/** 원본을 그대로 썼을 때 구간 끝에서 어긋나는 정도 */
export const driftAt = ({ bpm, beatsPerBar }, bars) =>
  driftOver({ instBpm: bpm.bi, vocalBpm: bpm.bv, ratio: 1, bars, beatsPerBar });
