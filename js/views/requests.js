// Placeholder. The full requests view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Requests');
  main.append(h('div', { class: 'view-requests' }, pageTitle('Requests'), h('p', { class: 'muted' }, 'Coming soon.')));
}
