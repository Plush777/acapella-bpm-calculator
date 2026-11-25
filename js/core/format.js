// 숫자를 화면에 쓸 글자로 바꾸는 순수 함수

/** 화면에 0.00으로 보이는 차이는 없는 것으로 본다. */
export const isNegligible = (n) => Math.abs(n) < 0.005;

export const fixed2 = (n) => n.toFixed(2);

export const percent2 = (ratio) => fixed2(ratio * 100);

/** 소수 둘째 자리까지, 뒤의 0은 뺀다. */
export const trimNumber = (n) => String(Math.round(n * 100) / 100);

/** 초를 0:19.940 형식으로 */
export const clock = (sec) => {
  const ms = Math.round(Math.abs(sec) * 1000);
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
  return `${sec < 0 && ms ? '−' : ''}${minutes}:${seconds}`;
};

/** 차이를 '2.36초 먼저'처럼. earlySec가 양수면 먼저다. */
export const earlyLate = (earlySec) =>
  (isNegligible(earlySec)
    ? '0.00초'
    : `${fixed2(Math.abs(earlySec))}초 ${earlySec > 0 ? '먼저' : '늦게'}`);
