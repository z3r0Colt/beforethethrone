// Small DOM toolkit. User text always goes in through textContent, never
// innerHTML. The only innerHTML in the app is for the trusted icon strings below.

const PROPS = new Set(['value', 'checked', 'selected', 'disabled', 'indeterminate', 'multiple', 'required', 'readOnly']);

function append(el, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false || child === true) continue;
    if (Array.isArray(child)) append(el, child);
    else if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  }
}

// h('button', { class: 'btn', onClick: fn, 'aria-label': 'Add' }, 'Add')
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs !== null && attrs !== undefined && (typeof attrs !== 'object' || Array.isArray(attrs) || attrs instanceof Node)) {
    children.unshift(attrs);
    attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class' || k === 'className') {
        el.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : String(v);
      } else if (k === 'text') {
        el.textContent = String(v);
      } else if (k === 'style') {
        // CSSOM writes are allowed by the Content Security Policy.
        if (typeof v === 'string') el.style.cssText = v;
        else for (const [p, val] of Object.entries(v)) {
          if (p.startsWith('--')) el.style.setProperty(p, val);
          else el.style[p] = val;
        }
      } else if (k === 'on' && typeof v === 'object') {
        for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      } else if (/^on[A-Z]/.test(k) && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'dataset' && typeof v === 'object') {
        Object.assign(el.dataset, v);
      } else if (PROPS.has(k)) {
        el[k] = v;
      } else if (v === true) {
        el.setAttribute(k, '');
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }
  append(el, children);
  return el;
}

export function clear(el) {
  while (el && el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- icons (trusted, static) ----------

const svg = (body) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  today: svg('<path d="M12 3v3M5.6 7.6l2.1 2.1M18.4 7.6l-2.1 2.1M3 17h18M7 17a5 5 0 0 1 10 0M6 21h12"/>'),
  requests: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1" fill="currentColor"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor"/><circle cx="4.5" cy="18" r="1.1" fill="currentColor"/>'),
  ebenezer: svg('<ellipse cx="12" cy="18.5" rx="7.5" ry="2.8"/><ellipse cx="12" cy="12.2" rx="5.2" ry="2.5"/><ellipse cx="12" cy="6.4" rx="3" ry="2"/>'),
  journal: svg('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7.5h6M9 11h4"/>'),
  learn: svg('<path d="M2.5 5.5h6a3.5 3.5 0 0 1 3.5 3.5v11a2.5 2.5 0 0 0-2.5-2.5h-7z"/><path d="M21.5 5.5h-6A3.5 3.5 0 0 0 12 9v11a2.5 2.5 0 0 1 2.5-2.5h7z"/>'),
  settings: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  pray: svg('<path d="M12 2.8c.6 3.6 5.2 5.6 5.2 10.2a5.2 5.2 0 0 1-10.4 0c0-2.6 1.5-4.2 2.6-5.2.3 1.8 1 2.8 2.1 3.1.6-2.6-.5-5.6.5-8.1z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  next: svg('<path d="M9 6l6 6-6 6"/>'),
  down: svg('<path d="M6 9l6 6 6-6"/>'),
  up: svg('<path d="M6 15l6-6 6 6"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  archive: svg('<path d="M3 4h18v4H3z"/><path d="M5 8v12h14V8M10 12h4"/>'),
  restore: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  bell: svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  external: svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  book: svg('<path d="M4 19.5V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-1.5z"/><path d="M4 19.5A2 2 0 0 1 6 18h14"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  install: svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3M10.5 18.5h3"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
};

export function icon(name, { label, className } = {}) {
  const span = document.createElement('span');
  span.className = ['icon', className].filter(Boolean).join(' ');
  span.innerHTML = icons[name] || '';
  if (label) {
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
  } else {
    span.setAttribute('aria-hidden', 'true');
  }
  return span;
}

// ---------- Scripture ----------

export function esvUrl(ref) {
  return `https://www.esv.org/${encodeURI(String(ref).trim().replace(/\s+/g, '+'))}/`;
}

// Typographic form of a reference for display: "Philippians 4:6–7".
export function formatRef(ref) {
  return String(ref).replace(/(\d)-(\d)/g, '$1–$2');
}

// Appends text, setting LORD and GOD in small capitals as printed Bibles do.
export function appendScriptureText(el, text) {
  const parts = String(text).split(/\b(LORD|GOD)\b/);
  parts.forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      el.appendChild(h('span', { class: 'sc' }, part.charAt(0) + part.slice(1).toLowerCase()));
    } else {
      el.appendChild(document.createTextNode(part));
    }
  });
  return el;
}

// verse: { ref, text }. Returns null when the verse is missing so callers can
// pass the result straight into h() children.
export function renderScripture(verse, { showRef = true, link = true, className } = {}) {
  if (!verse || !verse.text) return null;
  const text = appendScriptureText(h('p', { class: 'scripture-text' }), verse.text);
  let ref = null;
  if (showRef) {
    const label = `${formatRef(verse.ref)} ESV`;
    ref = link
      ? h('a', { class: 'scripture-ref', href: esvUrl(verse.ref), target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${formatRef(verse.ref)}, English Standard Version, opens esv.org` }, label)
      : h('span', { class: 'scripture-ref' }, label);
  }
  return h('blockquote', { class: ['scripture', className] }, text, ref);
}

// A link to read a passage on esv.org without quoting it.
export function esvLink(ref, { className = 'ref-link' } = {}) {
  return h('a', { class: className, href: esvUrl(ref), target: '_blank', rel: 'noopener noreferrer' }, formatRef(ref));
}

// ---------- page furniture ----------

export function setTitle(text) {
  if (typeof document === 'undefined') return;
  document.title = text ? `${text} · Before the Throne` : 'Before the Throne';
}

export function pageTitle(text, { subtitle } = {}) {
  return h('header', { class: 'page-head' },
    h('h1', { class: 'page-title', tabindex: '-1' }, text),
    subtitle ? h('p', { class: 'page-subtitle muted' }, subtitle) : null);
}

export function backLink(href, label = 'Back') {
  return h('a', { class: 'back-link', href }, icon('back'), h('span', null, label));
}

export function emptyState({ iconName = 'info', title, text, action } = {}) {
  return h('div', { class: 'empty' },
    icon(iconName, { className: 'empty-icon' }),
    title ? h('p', { class: 'empty-title' }, title) : null,
    text ? h('p', { class: 'muted' }, text) : null,
    action || null);
}

export function ornament() {
  return h('div', { class: 'ornament', 'aria-hidden': 'true' }, '❦');
}

// ---------- toasts ----------

export function toast(message, { action, timeout } = {}) {
  if (typeof document === 'undefined') return () => {};
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(region);
  }
  const el = h('div', { class: 'toast' }, h('span', { class: 'toast-text' }, message));
  const ms = timeout ?? (action ? 8000 : 3500);
  let timer = null;
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => {
      // Never let focus fall to the page body when the toast goes away.
      if (el.contains(document.activeElement)) {
        const back = document.querySelector('#main .page-title[tabindex="-1"]') || document.getElementById('main');
        if (back) back.focus({ preventScroll: true });
      }
      el.remove();
    }, 200);
  };
  // The countdown waits while the pointer rests on the toast or focus is in
  // it, so there is time to reach and use its button.
  const arm = () => {
    clearTimeout(timer);
    if (removed || ms <= 0) return;
    if (el.matches(':hover') || el.contains(document.activeElement)) return;
    timer = setTimeout(remove, ms);
  };
  const pause = () => clearTimeout(timer);
  if (action) {
    el.appendChild(h('button', {
      type: 'button',
      class: 'toast-action',
      onClick: () => { remove(); action.onClick && action.onClick(); },
    }, action.label));
  }
  el.addEventListener('focusin', pause);
  el.addEventListener('pointerenter', pause);
  el.addEventListener('focusout', () => setTimeout(arm, 0));
  el.addEventListener('pointerleave', arm);
  region.appendChild(el);
  arm();
  return remove;
}

// ---------- sheets and dialogs ----------

const openSheets = new Set();

// Closes every open sheet, as when the route changes underneath them.
export function closeAllSheets() {
  for (const close of [...openSheets]) close();
}

// Opens a bottom sheet built on <dialog>. body is a Node or a function that
// receives the body element. actions: [{ label, variant, onClick(close), autofocus, type }]
export function openSheet({ title, body, actions = [], onClose, className } = {}) {
  const previouslyFocused = document.activeElement;
  const titleId = `sheet-title-${Math.random().toString(36).slice(2, 8)}`;
  const bodyEl = h('div', { class: 'sheet-body' });
  const dialog = h('dialog', { class: ['sheet', className], 'aria-labelledby': titleId });
  let closed = false;
  const close = (result) => {
    if (closed) return;
    closed = true;
    openSheets.delete(close);
    if (dialog.open) dialog.close();
    dialog.remove();
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    if (onClose) onClose(result);
  };
  const actionsEl = actions.length
    ? h('div', { class: 'sheet-actions' }, actions.map((a) => h('button', {
      type: 'button',
      class: ['btn', a.variant ? `btn-${a.variant}` : null],
      autofocus: a.autofocus || false,
      onClick: () => (a.onClick ? a.onClick(close) : close()),
    }, a.label)))
    : null;
  dialog.append(
    h('div', { class: 'sheet-header' },
      h('h2', { id: titleId, class: 'sheet-title' }, title || ''),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onClick: () => close() }, icon('close'))),
    bodyEl,
    actionsEl,
  );
  if (typeof body === 'function') body(bodyEl, close);
  else if (body) bodyEl.appendChild(typeof body === 'string' ? h('p', null, body) : body);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  document.body.appendChild(dialog);
  dialog.showModal();
  openSheets.add(close);
  return { close, dialog, body: bodyEl };
}

export function confirmDialog({ title = 'Are you sure?', message = '', confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false } = {}) {
  return new Promise((resolve) => {
    openSheet({
      title,
      body: message ? h('p', null, message) : null,
      onClose: (result) => resolve(result === true),
      actions: [
        // For destructive actions the safe choice takes focus, so a stray
        // Enter never deletes anything.
        { label: cancelLabel, variant: 'ghost', autofocus: danger, onClick: (close) => close(false) },
        { label: confirmLabel, variant: danger ? 'danger' : 'primary', autofocus: !danger, onClick: (close) => close(true) },
      ],
    });
  });
}

// ---------- files ----------

export function downloadFile(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename, class: 'visually-hidden' });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ---------- forms ----------

// Grows a textarea to fit its words without making the page jump. Returns the
// function that measures it; call it once the textarea is on the page.
export function autosize(el) {
  const fit = () => {
    if (!el.isConnected) return;
    // Hold the parent's height while measuring, so the page below stays put.
    const holder = el.parentElement;
    holder.style.minHeight = `${holder.offsetHeight}px`;
    el.style.height = 'auto';
    const border = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + border}px`;
    holder.style.minHeight = '';
  };
  el.addEventListener('input', fit);
  return fit;
}

let fieldSeq = 0;
// field('Title', h('input', {...}), { hint }) wires up the label and hint ids.
export function field(labelText, control, { hint, className } = {}) {
  const id = control.id || `f${++fieldSeq}`;
  control.id = id;
  const hintId = hint ? `${id}-hint` : null;
  if (hintId) control.setAttribute('aria-describedby', hintId);
  return h('div', { class: ['field', className] },
    h('label', { class: 'label', for: id }, labelText),
    control,
    hint ? h('p', { class: 'hint', id: hintId }, hint) : null);
}

// Segmented control. options: [{ value, label }]. Returns the element; it
// calls onChange(value) and keeps aria-pressed in step.
export function segmented({ label, options, value, onChange, className }) {
  const group = h('div', { class: ['seg', className], role: 'group', 'aria-label': label });
  const buttons = options.map((o) => h('button', {
    type: 'button',
    'aria-pressed': String(o.value === value),
    'data-value': o.value,
    onClick: () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btnFor(o.value))));
      onChange && onChange(o.value);
    },
  }, o.label));
  const btnFor = (v) => buttons.find((b) => b.dataset.value === v);
  group.append(...buttons);
  return group;
}

// A switch built on a real checkbox.
export function toggle(labelText, { checked = false, onChange, hint } = {}) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked, onChange: (e) => onChange && onChange(e.target.checked) });
  const id = `t${++fieldSeq}`;
  input.id = id;
  const hintId = hint ? `${id}-hint` : null;
  if (hintId) input.setAttribute('aria-describedby', hintId);
  return h('div', { class: 'toggle-row' },
    h('label', { class: 'toggle', for: id }, h('span', { class: 'toggle-label' }, labelText), input, h('span', { class: 'toggle-track', 'aria-hidden': 'true' })),
    hint ? h('p', { class: 'hint', id: hintId }, hint) : null);
}
