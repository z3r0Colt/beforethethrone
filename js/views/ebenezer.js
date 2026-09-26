// Placeholder. The full ebenezer view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Ebenezer');
  main.append(h('div', { class: 'view-ebenezer' }, pageTitle('Ebenezer'), h('p', { class: 'muted' }, 'Coming soon.')));
}
