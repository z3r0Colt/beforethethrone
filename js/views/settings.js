// Placeholder. The full settings view replaces this file.
import { h, pageTitle, setTitle } from '../dom.js';

export function render(main) {
  setTitle('Settings');
  main.append(h('div', { class: 'view-settings' }, pageTitle('Settings'), h('p', { class: 'muted' }, 'Coming soon.')));
}
