// 메트로놈 재생 버튼

import { byId, setIcon, setText } from './dom.js';

export const renderPlayButton = (isPlaying) => {
  byId('play').classList.toggle('playing', isPlaying);
  setIcon(byId('playicon'), isPlaying ? 'stop' : 'play');
  setText('playlabel', isPlaying ? '정지' : '메트로놈 재생');
};
