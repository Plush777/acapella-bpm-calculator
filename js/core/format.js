// 숫자를 화면에 쓸 글자로 바꾸는 순수 함수

/** 화면에 0.00으로 보이는 차이는 없는 것으로 본다. */
export const isNegligible = (n) => Math.abs(n) < 0.005;

export const fixed2 = (n) => n.toFixed(2);

export const percent2 = (ratio) => fixed2(ratio * 100);

/** 소수 둘째 자리까지, 뒤의 0은 뺀다. */
export const trimNumber = (n) => String(Math.round(n * 100) / 100);

/** 60초가 넘으면 '3분 37.91초'처럼 쓴다. */
export const duration = (sec) => {
  const hundredths = Math.round(sec * 100);
  const minutes = Math.floor(hundredths / 6000);
  const seconds = fixed2((hundredths % 6000) / 100);
  return minutes ? `${minutes}분 ${seconds}초` : `${seconds}초`;
};

/** 차이를 '2.36초 빠름'처럼 쓴다. earlySec가 양수면 빠른 것이다. */
export const fastSlow = (earlySec) =>
  (isNegligible(earlySec)
    ? '0.00초'
    : `${fixed2(Math.abs(earlySec))}초 ${earlySec > 0 ? '빠름' : '느림'}`);
