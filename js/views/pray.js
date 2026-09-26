// Placeholder. The full pray view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Pray');
  main.append(h('div', { class: 'view-pray' }, pageTitle('Pray'), h('p', { class: 'muted' }, 'Coming soon.')));
}
