// Placeholder. The full learn view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Learn');
  main.append(h('div', { class: 'view-learn' }, pageTitle('Learn'), h('p', { class: 'muted' }, 'Coming soon.')));
}
