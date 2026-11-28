// 숫자가 이전 값에서 새 값까지 올라가거나 내려가는 애니메이션

const DURATION_MS = 700;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 화면을 가린 채 준비하는 동안에는 시작하지 않는다. */
const isPageHidden = () => document.documentElement.classList.contains('loading');

/** 엘리먼트 하나에 붙는 카운터. 마지막으로 보여 준 값은 이 클로저 안에만 있다. */
export const createCounter = (el, format) => {
  let shown = 0;
  let frame = 0;

  const show = (value) => {
    shown = value;
    el.textContent = format(value);
  };

  const countTo = (target) => {
    cancelAnimationFrame(frame);
    if (prefersReducedMotion()) {
      show(target);
      return;
    }

    const from = shown;
    let startedAt = null;

    const step = (now) => {
      if (isPageHidden()) {
        frame = requestAnimationFrame(step);
        return;
      }
      startedAt ??= now;
      const progress = Math.min((now - startedAt) / DURATION_MS, 1);
      show(from + (target - from) * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(step);
      else show(target);
    };

    frame = requestAnimationFrame(step);
  };

  return { countTo };
};
