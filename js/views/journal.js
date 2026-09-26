// Placeholder. The full journal view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Journal');
  main.append(h('div', { class: 'view-journal' }, pageTitle('Journal'), h('p', { class: 'muted' }, 'Coming soon.')));
}
