// 어긋나게 들릴 때

import { diagnosis, diagnosisRatioText } from '../core/selectors.js';
import { SYMPTOMS } from '../data/symptoms.js';
import { byId, each, setHidden, setHTML, setText, setValue } from './dom.js';

const choice = ({ id, label }) => `
    <label for="sy-${id}">
      <input type="radio" name="sym" id="sy-${id}" value="${id}">
      <span>${label}</span>
    </label>`;

export const renderDiagnosis = (state) => {
  const { id, cause, advice, fix, value, note } = diagnosis(state);

  setHTML('sym', each(SYMPTOMS, choice));
  byId(`sy-${id}`).checked = true;

  setText('fixh', `먼저 볼 곳: ${cause}`);
  setText('fixp', advice);
  setHidden('fixf', fix === 'none');
  setHidden('fdirw', fix !== 'shift');
  setHidden('fbarw', fix !== 'stretch');
  setHidden('fratw', fix !== 'stretch');

  ['fdir', 'fbar', 'fms'].forEach((field) => setValue(field, state.fields[field]));
  setValue('frat', diagnosisRatioText(state));
  setText('fixv', value);
  setText('fixn', note);
};
