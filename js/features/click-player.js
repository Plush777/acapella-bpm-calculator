// 반주(왼쪽)와 보컬(오른쪽) 박을 클릭음으로 들려준다.

import { secondsPerBeat, spanSeconds } from '../core/calc.js';

const LEAD_IN = 0.15;

const INST = { downbeat: 520, beat: 390, gain: 0.5, pan: -0.5 };
const VOCAL = { downbeat: 1480, beat: 1110, gain: 0.28, pan: 0.5 };

/** 두 트랙의 클릭 시각 목록 (순수 함수) */
export const clickSchedule = ({ instBpm, vocalBpm, ratio, bars, beatsPerBar }) =>
  Array.from({ length: bars * beatsPerBar }, (_, i) => {
    const tone = (voice) => (i % beatsPerBar === 0 ? voice.downbeat : voice.beat);
    return [
      { time: i * secondsPerBeat(instBpm), frequency: tone(INST), gain: INST.gain, pan: INST.pan },
      { time: i * secondsPerBeat(vocalBpm) * ratio, frequency: tone(VOCAL), gain: VOCAL.gain, pan: VOCAL.pan },
    ];
  }).flat();

const withPan = (context, node, pan) => {
  if (!context.createStereoPanner) return node;
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  return node.connect(panner);
};

const playClick = (context, startAt) => ({ time, frequency, gain, pan }) => {
  const at = startAt + time;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.0008, at + 0.06);

  withPan(context, oscillator.connect(envelope), pan).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + 0.07);
};

export const createClickPlayer = ({ onStart, onStop, onProgress, onUnsupported }) => {
  let context = null;
  let frame = 0;

  const stop = () => {
    if (!context) return;
    cancelAnimationFrame(frame);
    context.close().catch(() => {});
    context = null;
    onStop();
  };

  const start = (song) => {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      onUnsupported();
      return;
    }

    const current = new Context();
    const startAt = current.currentTime + LEAD_IN;
    const end = Math.max(
      spanSeconds(song.instBpm, song.bars, song.beatsPerBar),
      spanSeconds(song.vocalBpm, song.bars, song.beatsPerBar) * song.ratio,
    );

    context = current;
    if (current.state === 'suspended') current.resume();
    clickSchedule(song).forEach(playClick(current, startAt));
    onStart();

    const follow = () => {
      if (context !== current) return;
      const elapsed = current.currentTime - startAt;
      if (elapsed > end + 0.1) {
        stop();
        return;
      }
      if (elapsed >= 0) onProgress(Math.min(elapsed, end));
      frame = requestAnimationFrame(follow);
    };
    follow();
  };

  const toggle = (song) => (context ? stop() : start(song));

  return { toggle, stop };
};
