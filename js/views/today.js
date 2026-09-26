// Placeholder. The full today view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Today');
  main.append(h('div', { class: 'view-today' }, pageTitle('Today'), h('p', { class: 'muted' }, 'Coming soon.')));
}
