// 작업 순서 체크리스트

import { workSteps } from '../core/selectors.js';
import { byId, each, setHTML } from './dom.js';

const stepItem = (text, index) => `
    <li>
      <label for="st${index}">
        <input type="checkbox" id="st${index}" data-i="${index}">
        <span>${text}</span>
      </label>
    </li>`;

export const renderSteps = (state) => {
  const steps = workSteps(state);
  setHTML('steps', each(steps, stepItem));
  steps.forEach((_, index) => {
    byId(`st${index}`).checked = state.done.includes(index);
  });
};
