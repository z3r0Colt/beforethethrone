// Prayer requests: the list, the editor for one request, and the page for
// arranging categories. One module serves #/requests, #/requests/new,
// #/requests/categories and #/requests/:id.

import {
  h, icon, pageTitle, backLink, emptyState, toast, openSheet, confirmDialog,
  field, segmented, setTitle, renderScripture, esvLink, autosize,
} from '../dom.js';
import {
  getState, subscribe, getRequest, addRequest, updateRequest, deleteRequest, markAnswered,
  setStatus, addCategory, renameCategory, moveCategory, deleteCategory,
} from '../store.js';
import { groupByCategory, frequencyLabel, sortRequests } from '../schedule.js';
import { formatRelative, formatShort, weekdayName } from '../dates.js';
import { parseHash } from '../router.js';
import { getVerse, findVerseByTypedRef, typedRefForLink } from '../data/scripture.js';

const NEW_CATEGORY = '__new__';
const LIST_PATH = '/requests';
const MAX_SEARCH = 100;

// The list keeps its filters in the URL. This remembers the last one so the
// editor's back link returns to the same view.
let lastListPath = LIST_PATH;

// Where history.back() would land, so Save and Cancel can step back
// (restoring the list's filters) instead of stacking a new entry. The
// Navigation API answers exactly. Where it is missing, the last hashchange
// is a close stand-in.
let lastOldPath = null;
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', (event) => {
    try {
      lastOldPath = parseHash(new URL(event.oldURL).hash).path;
    } catch {
      lastOldPath = null;
    }
  });
}

function backPath() {
  const nav = typeof window !== 'undefined' ? window.navigation : null;
  if (nav && nav.currentEntry && typeof nav.entries === 'function') {
    try {
      const index = nav.currentEntry.index;
      const prev = index > 0 ? nav.entries()[index - 1] : null;
      if (!prev || !prev.sameDocument || !prev.url) return null;
      return parseHash(new URL(prev.url).hash).path;
    } catch {
      /* fall back below */
    }
  }
  return lastOldPath;
}

// Sheets opened by this view, closed on route change so none are left behind.
const openDialogs = new Set();

function trackDialog(dialog) {
  if (!dialog) return;
  openDialogs.add(dialog);
  const forget = () => openDialogs.delete(dialog);
  dialog.addEventListener('close', forget, { once: true });
}

function closeDialogs() {
  for (const dialog of openDialogs) {
    // openSheet listens for 'cancel', which closes it, removes it, and
    // settles any confirmDialog promise waiting on it.
    if (dialog.isConnected) dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  }
  openDialogs.clear();
}

function sheet(options) {
  const handle = openSheet(options);
  trackDialog(handle.dialog);
  return handle;
}

function confirmTracked(options) {
  const promise = confirmDialog(options);
  // confirmDialog appends its <dialog> synchronously, so it is the newest one.
  const dialogs = document.querySelectorAll('dialog.sheet');
  trackDialog(dialogs[dialogs.length - 1]);
  return promise;
}

// ---------- small helpers ----------

function sortedCategories(state = getState()) {
  return state.categories.slice().sort((a, b) => a.order - b.order);
}

function categoryName(id, state = getState()) {
  const c = state.categories.find((x) => x.id === id);
  return c ? c.name : 'Uncategorized';
}

function defaultCategoryId(preferred, state = getState()) {
  const cats = sortedCategories(state);
  if (preferred && cats.some((c) => c.id === preferred)) return preferred;
  const other = cats.find((c) => c.id === 'other');
  return (other || cats[cats.length - 1] || cats[0]).id;
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function prayedLabel(r) {
  return r.lastPrayedAt ? `Prayed ${formatRelative(r.lastPrayedAt)}` : 'Not yet prayed';
}

function timesPrayed(n) {
  if (!n) return 'Not yet';
  if (n === 1) return 'Once';
  if (n === 2) return 'Twice';
  return `${n} times`;
}

function fold(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matches(r, terms) {
  if (!terms.length) return true;
  const hay = fold(`${r.title}\n${r.details}`);
  return terms.every((t) => hay.includes(t));
}

function describe(el, id, on) {
  const ids = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  if (on) ids.add(id);
  else ids.delete(id);
  if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
  else el.removeAttribute('aria-describedby');
}

function showError(control, errEl, message, describeTarget = control) {
  errEl.textContent = message;
  errEl.hidden = false;
  if (control) control.setAttribute('aria-invalid', 'true');
  describe(describeTarget, errEl.id, true);
}

function clearError(control, errEl, describeTarget = control) {
  if (errEl.hidden) return;
  errEl.hidden = true;
  errEl.textContent = '';
  if (control) control.removeAttribute('aria-invalid');
  describe(describeTarget, errEl.id, false);
}

// ---------- drafts (browser storage, guarded) ----------

// Typing in the editor is kept as a draft until it is saved or discarded, so
// leaving the page or closing the app does not lose it. A new request is kept
// under 'btt:request-draft' and unsaved edits under 'btt:request-draft:<id>'.
const DRAFT_KEY = 'btt:request-draft';
const EDIT_DRAFT_PREFIX = `${DRAFT_KEY}:`;
const FREQUENCIES = ['daily', 'weekdays', 'rotate'];

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function hasWords(v) {
  return !!(v.title.trim() || v.details.trim() || v.promise.trim());
}

function readDraft(key) {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
    const draft = {
      title: text(d.title, 200).replace(/\s*[\r\n]+\s*/g, ' '),
      details: text(d.details, 5000),
      promise: text(d.promise, 300),
      categoryId: typeof d.categoryId === 'string' ? d.categoryId : null,
      frequency: FREQUENCIES.includes(d.frequency) ? d.frequency : null,
      weekdays: Array.isArray(d.weekdays)
        ? [...new Set(d.weekdays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))]
        : [],
    };
    return hasWords(draft) ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(key, values) {
  try {
    storage()?.setItem(key, JSON.stringify({ ...values, savedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
}

function removeDraft(key) {
  try { storage()?.removeItem(key); } catch { /* ignore */ }
}

// Clears kept edits for requests that no longer exist.
function pruneEditDrafts(requests) {
  const store = storage();
  if (!store) return;
  try {
    const live = new Set(requests.map((r) => r.id));
    const stale = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(EDIT_DRAFT_PREFIX) && !live.has(k.slice(EDIT_DRAFT_PREFIX.length))) stale.push(k);
    }
    stale.forEach((k) => store.removeItem(k));
  } catch { /* ignore */ }
}

// The values a request is saved with, so two sets can be compared.
function cleanFields(v) {
  return {
    title: v.title.trim(),
    details: v.details.trim(),
    categoryId: v.categoryId,
    frequency: v.frequency,
    weekdays: v.frequency === 'weekdays' ? [...v.weekdays].sort((a, b) => a - b) : [],
    promise: v.promise.trim(),
  };
}

// Scripture the user names as a promise. Only verses the app already quotes
// are shown in full. Any other reference becomes a link to esv.org.
function promisePreview(text) {
  const verse = findVerseByTypedRef(text);
  if (verse) return renderScripture(verse, { className: 'req-promise-verse' });
  const ref = typedRefForLink(text);
  if (ref) {
    return h('p', { class: 'req-promise-link small' },
      'Read ', esvLink(ref), ' at esv.org', icon('external', { className: 'req-ext' }));
  }
  return null;
}

// ---------- entry point ----------

export function render(main, ctx) {
  const { path, params } = ctx;
  let result;
  if (path === LIST_PATH) result = renderList(main, ctx);
  else if (path === `${LIST_PATH}/categories`) result = renderCategories(main, ctx);
  else if (path === `${LIST_PATH}/new`) result = renderEditor(main, ctx, null);
  else result = renderEditor(main, ctx, params.id);
  const cleanup = () => {
    closeDialogs();
    if (typeof result === 'function') result();
  };
  // The router asks this before re-rendering for a change made in another
  // tab, so unsaved typing in the editor is never swept away.
  if (typeof result === 'function' && typeof result.hasUnsaved === 'function') {
    cleanup.hasUnsaved = () => result.hasUnsaved();
  }
  return cleanup;
}

// ---------- the list ----------

function renderList(main, { query }) {
  setTitle('Prayer Requests');
  const cats0 = sortedCategories();
  const view = {
    category: cats0.some((c) => c.id === query.category) ? query.category : '',
    status: query.status === 'archived' ? 'archived' : 'active',
    q: typeof query.q === 'string' ? query.q.slice(0, MAX_SEARCH) : '',
  };

  const root = h('div', { class: 'view-requests req-list-view' });
  const head = pageTitle('Prayer Requests');
  head.classList.add('req-head');
  head.append(h('a', { class: 'btn btn-ghost req-head-action', href: '#/requests/categories' },
    icon('edit'), h('span', null, 'Categories')));
  root.append(head);

  const state = getState();
  pruneEditDrafts(state.requests);
  if (!state.requests.length) {
    const verse = getVerse('Psalm 62:8');
    root.append(h('div', { class: 'card req-welcome' },
      emptyState({
        iconName: 'pray',
        title: 'Bring your requests to God',
        text: 'Write down the people and needs you want to remember in prayer. Your list stays on this device, and you can pray through it each day.',
        action: h('a', { class: 'btn btn-primary', href: '#/requests/new' }, icon('plus'), 'Add your first request'),
      }),
      verse ? renderScripture(verse, { className: 'req-welcome-verse' }) : null));
    main.append(root);
    return undefined;
  }

  // Filter chips
  const chipRefs = new Map();
  const chips = h('div', { class: 'chips req-chips', role: 'group', 'aria-label': 'Filter by category' });
  const addChip = (id, name) => {
    const count = h('span', { class: 'count' });
    const btn = h('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': 'false',
      onClick: () => {
        if (view.category === id) return;
        view.category = id;
        sync();
      },
    }, h('span', { class: 'chip-name' }, name), count);
    chipRefs.set(id, { btn, count });
    chips.append(btn);
  };
  addChip('', 'All');
  cats0.forEach((c) => addChip(c.id, c.name));

  const seg = segmented({
    label: 'Which requests',
    className: 'req-seg',
    value: view.status,
    options: [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }],
    onChange: (v) => { view.status = v; sync(); },
  });

  const searchInput = h('input', {
    class: 'input',
    type: 'search',
    id: 'req-search',
    value: view.q,
    placeholder: 'Search requests',
    autocomplete: 'off',
    enterkeyhint: 'search',
    maxlength: String(MAX_SEARCH),
    onInput: (e) => { view.q = e.target.value; sync({ announce: true }); },
    onKeydown: (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        e.preventDefault();
        searchInput.value = '';
        view.q = '';
        sync({ announce: true });
      }
    },
  });
  const search = h('div', { class: 'search req-search', role: 'search' },
    h('label', { class: 'visually-hidden', for: 'req-search' }, 'Search requests'),
    icon('search'),
    searchInput);

  const announcer = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
  const results = h('div', { class: 'req-results' });
  const fab = h('a', { class: 'fab', href: '#/requests/new', 'aria-label': 'Add a prayer request' }, icon('plus'), h('span', null, 'Add'));

  root.append(h('div', { class: 'req-controls' }, chips, seg, search), announcer, results, fab);

  function writeQuery() {
    const p = new URLSearchParams();
    if (view.category) p.set('category', view.category);
    if (view.status !== 'active') p.set('status', view.status);
    if (view.q.trim()) p.set('q', view.q);
    const qs = p.toString();
    lastListPath = LIST_PATH + (qs ? `?${qs}` : '');
    if (parseHash(location.hash).path === LIST_PATH) history.replaceState(history.state, '', `#${lastListPath}`);
  }

  function updateChips(pool) {
    for (const [id, ref] of chipRefs) {
      const n = id ? pool.filter((r) => r.categoryId === id).length : pool.length;
      ref.btn.setAttribute('aria-pressed', String(id === view.category));
      ref.count.textContent = String(n);
    }
  }

  function draw({ announce = false } = {}) {
    const s = getState();
    const cats = sortedCategories(s);
    const pool = s.requests.filter((r) => r.status === view.status);
    updateChips(pool);
    const terms = fold(view.q).split(/\s+/).filter(Boolean);
    const inCategory = view.category ? pool.filter((r) => r.categoryId === view.category) : pool;
    const shown = inCategory.filter((r) => matches(r, terms));
    const catName = view.category ? categoryName(view.category, s) : '';
    const label = view.status === 'archived' ? 'archived' : 'active';

    results.replaceChildren();
    if (!shown.length) {
      results.append(emptyFor({ pool, terms, catName, label }));
    } else {
      for (const group of groupByCategory(sortRequests(shown, cats), cats)) {
        const headingId = `req-group-${group.category.id}`;
        results.append(h('section', { class: 'req-group', 'aria-labelledby': headingId },
          h('h2', { class: 'section-title req-group-title', id: headingId },
            h('span', null, group.category.name),
            h('span', { class: 'req-group-count' }, h('span', { class: 'visually-hidden' }, ', '), plural(group.requests.length, 'request'))),
          h('ul', { class: 'list' }, group.requests.map((r) => h('li', null, requestRow(r))))));
      }
    }

    const answered = s.requests.filter((r) => r.status === 'answered').length;
    if (view.status === 'active' && answered && !terms.length && !view.category) {
      results.append(h('a', { class: 'card req-ebenezer-link', href: '#/ebenezer' },
        icon('ebenezer', { className: 'req-ebenezer-icon' }),
        h('span', { class: 'grow' },
          h('span', { class: 'req-ebenezer-title' }, plural(answered, 'answered prayer')),
          h('span', { class: 'meta' }, 'Remembered on your Ebenezer')),
        icon('next', { className: 'chev' })));
    }

    if (announce) {
      announcer.textContent = shown.length ? `${plural(shown.length, 'request')} shown` : 'No requests match';
    }
    fab.setAttribute('href', view.category ? `#/requests/new?category=${encodeURIComponent(view.category)}` : '#/requests/new');
  }

  function emptyFor({ pool, terms, catName, label }) {
    if (terms.length) {
      return emptyState({
        iconName: 'search',
        title: 'No matches',
        text: `No ${label} requests match “${view.q.trim()}”${catName ? ` in ${catName}` : ''}.`,
        action: h('button', {
          type: 'button',
          class: 'btn',
          onClick: () => {
            searchInput.value = '';
            view.q = '';
            sync({ announce: true });
            searchInput.focus();
          },
        }, 'Clear search'),
      });
    }
    if (view.category && pool.length) {
      return emptyState({
        iconName: 'requests',
        title: 'Nothing here yet',
        text: `You have no ${label} requests in ${catName}.`,
        action: view.status === 'active'
          ? h('a', { class: 'btn btn-primary', href: `#/requests/new?category=${encodeURIComponent(view.category)}` }, icon('plus'), `Add to ${catName}`)
          : null,
      });
    }
    if (view.status === 'archived') {
      return emptyState({
        iconName: 'archive',
        title: 'Nothing archived',
        text: 'When you set a request aside for a season, it rests here until you restore it.',
      });
    }
    return emptyState({
      iconName: 'requests',
      title: view.category ? 'Nothing here yet' : 'Your active list is empty',
      text: view.category
        ? `You have no active requests in ${catName}.`
        : 'Add a new request whenever the Lord lays a need on your heart.',
      action: h('a', {
        class: 'btn btn-primary',
        href: view.category ? `#/requests/new?category=${encodeURIComponent(view.category)}` : '#/requests/new',
      }, icon('plus'), view.category ? `Add to ${catName}` : 'Add a request'),
    });
  }

  function sync(opts) {
    writeQuery();
    draw(opts);
  }

  writeQuery();
  draw();
  main.append(root);

  // Bring the selected chip into view when returning to a filtered list.
  const selected = chipRefs.get(view.category);
  if (view.category && selected) {
    const cr = chips.getBoundingClientRect();
    const br = selected.btn.getBoundingClientRect();
    chips.scrollLeft += (br.left - cr.left) - (cr.width - br.width) / 2;
  }

  // Keep the list in step with changes made elsewhere, such as an Undo.
  return subscribe(() => {
    if (parseHash(location.hash).path === LIST_PATH) draw();
  });
}

function requestRow(r) {
  return h('a', { class: 'list-item req-item', href: `#/requests/${encodeURIComponent(r.id)}` },
    h('span', { class: 'grow' },
      h('span', { class: 'item-title req-item-title' }, r.title),
      r.details.trim() ? h('span', { class: 'req-preview' }, r.details.trim()) : null,
      h('span', { class: 'meta req-meta' },
        h('span', { class: 'req-meta-inner' },
          h('span', { class: 'req-meta-part' }, frequencyLabel(r)),
          h('span', { class: 'req-meta-part' }, h('span', { class: 'visually-hidden' }, ', '), prayedLabel(r))))),
    icon('next', { className: 'chev' }));
}

// ---------- the editor ----------

function renderNotFound(main, id) {
  removeDraft(`${EDIT_DRAFT_PREFIX}${id}`);
  setTitle('Request not found');
  main.append(h('div', { class: 'view-requests req-missing' },
    pageTitle('Request not found'),
    h('div', { class: 'card' },
      emptyState({
        iconName: 'requests',
        title: 'This request is not here',
        text: 'It may have been deleted, or the link may be from another device. Your other requests are safe.',
        action: h('a', { class: 'btn btn-primary', href: `#${lastListPath}` }, 'Back to Prayer Requests'),
      }))));
  return undefined;
}

function renderEditor(main, { query, navigate, path }, id) {
  const isNew = id === null;
  const existing = isNew ? null : getRequest(id);
  if (!isNew && !existing) return renderNotFound(main, id);

  // Save, Cancel and Delete step back to wherever the user came from (the
  // list with its filters, or Today). After a reload there is no such page,
  // so they go to the list instead.
  const previousPath = backPath();
  const fromList = previousPath === LIST_PATH;
  const cameFromApp = !!previousPath && previousPath !== path;
  const leave = () => {
    if (cameFromApp && history.length > 1) history.back();
    else navigate(LIST_PATH, { replace: true });
  };

  setTitle(isNew ? 'New Request' : 'Edit Request');

  // The saved request, or a blank one. A kept draft is laid over it below.
  const base = {
    title: existing ? existing.title : '',
    details: existing ? existing.details || '' : '',
    categoryId: existing ? existing.categoryId : defaultCategoryId(query.category),
    frequency: existing ? existing.frequency : 'daily',
    weekdays: existing ? existing.weekdays : [],
    promise: existing ? existing.promise || '' : '',
  };
  const draftKey = isNew ? DRAFT_KEY : `${EDIT_DRAFT_PREFIX}${id}`;
  let finished = false;
  let draftTimer = null;

  const draft = {
    categoryId: base.categoryId,
    frequency: base.frequency,
    weekdays: new Set(base.weekdays),
  };

  // Title: a one-line textarea that grows, so a long title stays in view.
  const titleInput = h('textarea', {
    class: 'input req-title-input', rows: '1', value: base.title, maxlength: '200',
    required: true, autocomplete: 'off', autocapitalize: 'sentences', enterkeyhint: 'done',
    spellcheck: 'true', placeholder: 'A person or a need',
  });
  const titleField = field('Title', titleInput);
  const titleErr = h('p', { class: 'error-text', id: `${titleInput.id}-error`, hidden: true });
  titleField.append(titleErr);
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  titleInput.addEventListener('input', () => {
    if (/[\r\n]/.test(titleInput.value)) {
      const at = titleInput.selectionStart;
      titleInput.value = titleInput.value.replace(/\s*[\r\n]+\s*/g, ' ');
      titleInput.setSelectionRange(at, at);
    }
    if (titleInput.value.trim()) clearError(titleInput, titleErr);
  });
  const fitTitle = autosize(titleInput);

  // Details
  const detailsInput = h('textarea', {
    class: 'textarea req-details-input', rows: '4', maxlength: '5000', value: base.details,
    autocapitalize: 'sentences',
  });
  const detailsField = field(['Details', ' ', h('span', { class: 'req-optional' }, '(optional)')], detailsInput, {
    hint: 'Anything that will help you pray with understanding.',
  });
  const fitDetails = autosize(detailsInput);

  // Category
  const select = h('select', { class: 'select' });
  const fillCategories = () => {
    select.replaceChildren(
      ...sortedCategories().map((c) => h('option', { value: c.id }, c.name)),
      h('option', { value: NEW_CATEGORY }, 'New category…'),
    );
    select.value = draft.categoryId;
  };
  fillCategories();
  select.addEventListener('change', () => {
    if (select.value === NEW_CATEGORY) {
      select.value = draft.categoryId;
      openNewCategorySheet();
    } else {
      draft.categoryId = select.value;
    }
  });
  const categoryField = field('Category', select);

  function openNewCategorySheet() {
    const input = h('input', { class: 'input', type: 'text', maxlength: '60', autocomplete: 'off', autocapitalize: 'words', enterkeyhint: 'done' });
    const nameField = field('Name', input, { hint: 'For example, Work or Our Neighborhood.' });
    const err = h('p', { class: 'error-text', id: `${input.id}-error`, hidden: true });
    nameField.append(err);
    let handle;
    const submit = () => {
      const name = input.value.trim();
      if (!name) {
        showError(input, err, 'Please give the category a name.');
        input.focus();
        return;
      }
      const same = getState().categories.find((c) => fold(c.name) === fold(name));
      let chosen;
      if (same) {
        chosen = same;
      } else {
        try {
          chosen = addCategory(name);
        } catch (e) {
          showError(input, err, e.message);
          return;
        }
      }
      draft.categoryId = chosen.id;
      fillCategories();
      scheduleDraft();
      handle.close();
      toast(same ? `“${chosen.name}” is already one of your categories, so it is selected.` : `Added the category “${chosen.name}”.`);
    };
    handle = sheet({
      title: 'New category',
      body: (el) => {
        el.append(h('form', { novalidate: true, onSubmit: (e) => { e.preventDefault(); submit(); } }, nameField));
      },
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        { label: 'Add category', variant: 'primary', onClick: submit },
      ],
    });
    input.addEventListener('input', () => { if (input.value.trim()) clearError(input, err); });
    input.focus();
  }

  // Frequency
  const freqLabelId = 'req-freq-label';
  const freqHint = h('p', { class: 'hint req-freq-hint', id: 'req-freq-hint' });
  const seg = segmented({
    label: 'How often',
    className: 'req-freq',
    value: draft.frequency,
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekdays', label: 'Certain days' },
      { value: 'rotate', label: 'Rotation' },
    ],
    onChange: (v) => { draft.frequency = v; updateFrequency(); scheduleDraft(); },
  });
  seg.removeAttribute('aria-label');
  seg.setAttribute('aria-labelledby', freqLabelId);
  seg.setAttribute('aria-describedby', freqHint.id);

  const daysErr = h('p', { class: 'error-text', id: 'req-days-error', hidden: true });
  const dayButtons = [0, 1, 2, 3, 4, 5, 6].map((d) => h('button', {
    type: 'button',
    'aria-pressed': String(draft.weekdays.has(d)),
    'aria-label': weekdayName(d),
    onClick: (e) => {
      if (draft.weekdays.has(d)) draft.weekdays.delete(d);
      else draft.weekdays.add(d);
      e.currentTarget.setAttribute('aria-pressed', String(draft.weekdays.has(d)));
      if (draft.weekdays.size) clearError(null, daysErr, dayPicker);
      scheduleDraft();
    },
  },
  h('span', { class: 'req-wd-long', 'aria-hidden': 'true' }, weekdayName(d, 'short')),
  h('span', { class: 'req-wd-short', 'aria-hidden': 'true' }, weekdayName(d, 'short').slice(0, 2))));
  const dayPicker = h('div', { class: 'weekday-picker', role: 'group', 'aria-label': 'Days to pray for this' }, dayButtons);
  const daysWrap = h('div', { class: 'req-days' }, dayPicker, daysErr);

  const FREQ_HINTS = {
    daily: 'This request will come before you every day.',
    weekdays: 'Choose the days this request should come before you.',
    rotate: 'A few rotating requests come up each day, those waiting longest first. You can choose how many in Settings.',
  };
  function updateFrequency() {
    freqHint.textContent = FREQ_HINTS[draft.frequency];
    daysWrap.hidden = draft.frequency !== 'weekdays';
    if (draft.frequency !== 'weekdays') clearError(null, daysErr, dayPicker);
  }
  updateFrequency();
  const freqField = h('div', { class: 'field req-freq-field' },
    h('p', { class: 'label', id: freqLabelId }, 'How often'),
    seg, freqHint, daysWrap);

  // Promise
  const promiseInput = h('input', {
    class: 'input', type: 'text', maxlength: '300', value: base.promise,
    autocomplete: 'off', enterkeyhint: 'done',
  });
  const promiseField = field(['Promise', ' ', h('span', { class: 'req-optional' }, '(optional)')], promiseInput, {
    hint: 'A Scripture promise you are pleading, like Philippians 4:19.',
  });
  const preview = h('div', { class: 'req-promise-preview', 'aria-live': 'polite' });
  const updatePreview = () => {
    const node = promisePreview(promiseInput.value);
    preview.replaceChildren(...(node ? [node] : []));
    preview.hidden = !node;
  };
  updatePreview();
  promiseInput.addEventListener('input', updatePreview);
  promiseField.append(preview);

  // Form
  const current = () => ({
    title: titleInput.value,
    details: detailsInput.value,
    categoryId: draft.categoryId,
    frequency: draft.frequency,
    weekdays: [...draft.weekdays],
    promise: promiseInput.value,
  });
  const fields = () => cleanFields(current());
  const initial = JSON.stringify(fields());
  const isDirty = () => JSON.stringify(fields()) !== initial;

  function applyValues(v) {
    titleInput.value = v.title;
    detailsInput.value = v.details;
    promiseInput.value = v.promise;
    draft.categoryId = v.categoryId;
    select.value = v.categoryId;
    draft.frequency = v.frequency;
    draft.weekdays = new Set(v.weekdays);
    for (const b of seg.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.value === v.frequency));
    dayButtons.forEach((b, d) => b.setAttribute('aria-pressed', String(draft.weekdays.has(d))));
    updateFrequency();
    updatePreview();
  }

  // Bring back what was typed here and left unsaved.
  const stored = readDraft(draftKey);
  let restored = false;
  if (stored) {
    applyValues({
      ...stored,
      categoryId: getState().categories.some((c) => c.id === stored.categoryId) ? stored.categoryId : base.categoryId,
      frequency: stored.frequency || base.frequency,
    });
    restored = isDirty();
    if (!restored) {
      applyValues(base);
      removeDraft(draftKey);
    }
  }

  function saveDraftNow() {
    clearTimeout(draftTimer);
    draftTimer = null;
    if (finished) return;
    const v = current();
    if (isDirty() && hasWords(v)) writeDraft(draftKey, v);
    else removeDraft(draftKey);
  }
  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, 400);
  }
  // Once saved, discarded, or moved elsewhere, the draft is no longer needed.
  function dropDraft() {
    finished = true;
    clearTimeout(draftTimer);
    draftTimer = null;
    removeDraft(draftKey);
  }

  function validate({ focus = true } = {}) {
    let first = null;
    if (!titleInput.value.trim()) {
      showError(titleInput, titleErr, 'Please give this request a title.');
      first = titleInput;
    }
    if (draft.frequency === 'weekdays' && !draft.weekdays.size) {
      showError(null, daysErr, 'Choose at least one day.', dayPicker);
      first = first || dayButtons[0];
    }
    if (first && focus) first.focus();
    return !first;
  }

  // Saves quietly before a status change, so edits made first are kept.
  function commitIfDirty() {
    if (isNew || !isDirty() || !validate({ focus: false })) return;
    try { updateRequest(id, fields()); } catch { /* keep going */ }
  }

  function save(e) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isNew) {
        addRequest(fields());
        toast('Added to your prayer list.');
      } else if (updateRequest(id, fields())) {
        toast('Changes saved.');
      } else {
        // The request was deleted in another window while this one was open.
        // The words stay here, and can be added as a new request instead.
        toast('This request was deleted in another window, so these changes could not be saved. Your words are still here.', {
          action: { label: 'Add as new', onClick: addAsNew },
          timeout: 10000,
        });
        return;
      }
    } catch (error) {
      toast(error.message || 'Could not save this request.');
      return;
    }
    dropDraft();
    leave();
  }

  function addAsNew() {
    if (finished) return;
    try {
      addRequest(fields());
    } catch (error) {
      toast(error.message || 'Could not save this request.');
      return;
    }
    toast('Added to your prayer list.');
    dropDraft();
    if (form.isConnected) leave();
  }

  async function cancel() {
    if (isDirty()) {
      const discard = await confirmTracked({
        title: 'Discard your changes?',
        message: 'What you typed here has not been saved.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        danger: true,
      });
      if (!discard) return;
    }
    dropDraft();
    leave();
  }

  const form = h('form', { class: 'card req-form', novalidate: true, onSubmit: save },
    titleField, detailsField, categoryField, freqField, promiseField,
    h('div', { class: 'req-form-actions' },
      h('button', { type: 'submit', class: 'btn btn-primary' }, icon('check'), 'Save'),
      h('button', { type: 'button', class: 'btn btn-ghost', onClick: cancel }, 'Cancel')));
  form.addEventListener('input', scheduleDraft);
  form.addEventListener('change', scheduleDraft);
  const onHide = () => { if (document.visibilityState === 'hidden') saveDraftNow(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', saveDraftNow);

  const back = backLink(`#${fromList ? lastListPath : LIST_PATH}`, 'Requests');
  back.addEventListener('click', (e) => {
    if (fromList && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  const root = h('div', { class: 'view-requests req-editor' }, back,
    pageTitle(isNew ? 'New Request' : 'Edit Request'));

  if (existing && existing.status === 'answered') root.append(answeredCard(existing, navigate, path));
  if (existing && existing.status === 'archived') {
    root.append(h('p', { class: 'req-status-note' }, icon('archive'),
      h('span', null, 'This request is archived. Restore it to pray for it again.')));
  }

  if (restored) {
    root.append(h('div', { class: 'req-restored', role: 'note' },
      icon('restore', { className: 'req-restored-icon' }),
      h('p', null, isNew
        ? 'Your unfinished request was kept, so you can pick up where you left off.'
        : 'Your unsaved changes to this request were kept, so you can pick up where you left off.')));
  }

  root.append(form);
  if (existing) root.append(historySection(existing));
  if (existing) root.append(actionsSection(existing));
  main.append(root);

  fitTitle();
  fitDetails();
  const onResize = () => { fitTitle(); fitDetails(); };
  window.addEventListener('resize', onResize);
  if (isNew) titleInput.focus();
  const cleanup = () => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', saveDraftNow);
    saveDraftNow();
  };
  // True while the form differs from the saved request (or from a blank one).
  cleanup.hasUnsaved = () => !finished && isDirty();
  return cleanup;

  // ----- pieces for an existing request -----

  function historySection(r) {
    const rows = [
      ['Added', formatShort(r.createdAt)],
      ['Times prayed', timesPrayed(r.prayedCount)],
      ['Last prayed', r.lastPrayedAt ? capitalize(formatRelative(r.lastPrayedAt)) : 'Not yet'],
    ];
    if (r.status === 'active' && r.answerNote) rows.push(['Earlier answer', r.answerNote, 'req-stat-block']);
    return h('section', { class: 'section req-history', 'aria-labelledby': 'req-history-title' },
      h('h2', { class: 'section-title', id: 'req-history-title' }, 'History'),
      h('dl', { class: 'card req-stats' }, rows.map(([k, v, cls]) => h('div', { class: ['req-stat', cls] }, h('dt', null, k), h('dd', null, v)))));
  }

  function actionsSection(r) {
    const row = ({ iconName, label, hint, className, onClick }) => h('li', null,
      h('button', { type: 'button', class: ['list-item', 'req-action', className], onClick },
        icon(iconName, { className: 'req-action-icon' }),
        h('span', { class: 'grow' },
          h('span', { class: 'item-title' }, label),
          hint ? h('span', { class: 'meta' }, hint) : null)));
    const rows = [];
    if (r.status !== 'answered') {
      rows.push(row({
        iconName: 'check',
        label: 'Mark answered',
        hint: 'Record how the Lord answered',
        className: 'req-action-answer',
        onClick: () => openAnswerSheet(r),
      }));
    }
    if (r.status === 'active') {
      rows.push(row({
        iconName: 'archive',
        label: 'Archive',
        hint: 'Set it aside for a season',
        onClick: () => {
          commitIfDirty();
          dropDraft();
          setStatus(r.id, 'archived');
          toast('Archived. You can restore it at any time.', {
            action: { label: 'Undo', onClick: () => setStatus(r.id, 'active') },
          });
          leave();
        },
      }));
    } else if (r.status === 'archived') {
      rows.push(row({
        iconName: 'restore',
        label: 'Restore',
        hint: 'Return it to your active list',
        onClick: () => {
          commitIfDirty();
          dropDraft();
          setStatus(r.id, 'active');
          toast('Restored to your active list.');
          leave();
        },
      }));
    }
    rows.push(row({
      iconName: 'trash',
      label: 'Delete',
      className: 'req-action-delete',
      onClick: async () => {
        const ok = await confirmTracked({
          title: 'Delete this request?',
          message: `“${r.title}” will be removed from this device. This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!ok) return;
        dropDraft();
        deleteRequest(r.id);
        toast('Request deleted.');
        leave();
      },
    }));
    return h('section', { class: 'section req-actions', 'aria-labelledby': 'req-actions-title' },
      h('h2', { class: 'section-title', id: 'req-actions-title' }, 'Actions'),
      h('ul', { class: 'list' }, rows));
  }

  function openAnswerSheet(r) {
    const note = h('textarea', { class: 'textarea', rows: '5', maxlength: '5000', autocapitalize: 'sentences' });
    const noteField = field('How did the Lord answer?', note, { hint: 'Optional. You will find this on your Ebenezer.' });
    // A request prayed for again after an earlier answer keeps that answer,
    // and markAnswered adds the new words after it.
    const earlier = getRequest(r.id)?.answerNote || r.answerNote;
    if (earlier && earlier.trim()) {
      const keptHint = h('p', { class: 'hint req-answer-kept', id: `${note.id}-kept` },
        'Your earlier answer is kept. What you write here is added to it.');
      noteField.append(keptHint);
      describe(note, keptHint.id, true);
    }
    sheet({
      title: 'Mark as answered',
      className: 'req-answer-sheet',
      body: (el) => {
        el.append(
          h('p', { class: 'muted' }, 'Write down how the Lord answered. His answer may differ from what you asked, yet it is always wise and good.'),
          noteField,
        );
      },
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Mark answered',
          variant: 'primary',
          onClick: (close) => {
            commitIfDirty();
            dropDraft();
            markAnswered(r.id, note.value);
            close();
            toast('Thanks be to God. It is set on your Ebenezer.');
            navigate('/ebenezer', { replace: true });
          },
        },
      ],
    });
    note.focus();
  }
}

function answeredCard(r, navigate, path) {
  return h('section', { class: 'card req-answered', 'aria-labelledby': 'req-answered-title' },
    h('h2', { class: 'card-subtitle', id: 'req-answered-title' }, 'Answered'),
    h('p', { class: 'req-answered-date' }, `The Lord answered this on ${formatShort(r.answeredAt)}.`),
    r.answerNote
      ? h('p', { class: 'req-answer-note' }, r.answerNote)
      : h('p', { class: 'muted small' }, 'No note was written about the answer.'),
    h('div', { class: 'card-actions' },
      h('button', {
        type: 'button',
        class: 'btn btn-primary',
        onClick: () => {
          setStatus(r.id, 'active');
          toast('Back on your prayer list.');
          navigate(path, { replace: true });
        },
      }, icon('restore'), 'Pray for this again'),
      h('a', { class: 'btn btn-ghost', href: '#/ebenezer' }, icon('ebenezer'), 'See your Ebenezer')));
}

// ---------- categories ----------

function renderCategories(main) {
  setTitle('Categories');
  const fromList = backPath() === LIST_PATH;
  const back = backLink(`#${fromList ? lastListPath : LIST_PATH}`, 'Requests');
  back.addEventListener('click', (e) => {
    if (fromList && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  const listEl = h('ul', { class: 'list req-cat-list' });
  const lastNote = h('p', { class: 'hint req-cat-last', hidden: true }, 'You need at least one category, so the last one cannot be deleted.');

  // Add a category
  const addInput = h('input', { class: 'input', type: 'text', maxlength: '60', autocomplete: 'off', autocapitalize: 'words', enterkeyhint: 'done', placeholder: 'For example, Work' });
  const addField = field('Name', addInput);
  const addErr = h('p', { class: 'error-text', id: `${addInput.id}-error`, hidden: true });
  addInput.addEventListener('input', () => { if (addInput.value.trim()) clearError(addInput, addErr); });
  const addForm = h('form', {
    class: 'req-cat-add',
    novalidate: true,
    onSubmit: (e) => {
      e.preventDefault();
      const name = addInput.value.trim();
      if (!name) {
        showError(addInput, addErr, 'Please give the category a name.');
        addInput.focus();
        return;
      }
      if (getState().categories.some((c) => fold(c.name) === fold(name))) {
        showError(addInput, addErr, 'You already have a category by that name.');
        addInput.focus();
        return;
      }
      let created;
      try {
        created = addCategory(name);
      } catch (error) {
        showError(addInput, addErr, error.message);
        return;
      }
      addInput.value = '';
      draw();
      toast(`Added the category “${created.name}”.`);
      addInput.focus();
    },
  },
  h('div', { class: 'req-cat-add-row' }, addField,
    h('button', { type: 'submit', class: 'btn btn-primary' }, icon('plus'), 'Add')),
  addErr);

  const root = h('div', { class: 'view-requests req-categories' },
    back,
    pageTitle('Categories', { subtitle: 'Arrange your categories in the order you like to pray through them.' }),
    listEl,
    lastNote,
    h('section', { class: 'section', 'aria-labelledby': 'req-cat-add-title' },
      h('h2', { class: 'section-title', id: 'req-cat-add-title' }, 'Add a category'),
      h('div', { class: 'card' }, addForm)),
    h('p', { class: 'hint req-cat-note' },
      'Renaming a category keeps its place in the guided prayers. Categories you add are included in each guided prayer as well.'));

  function focusRow(id, part) {
    const row = listEl.querySelector(`[data-cat="${CSS.escape(id)}"]`);
    if (!row) return;
    let target = row.querySelector(`[data-part="${part}"]`);
    if (target && target.disabled) {
      target = row.querySelector(`[data-part="${part === 'up' ? 'down' : 'up'}"]`);
    }
    if (target && !target.disabled) target.focus();
    else row.querySelector('[data-part="name"]')?.focus();
  }

  function draw() {
    const s = getState();
    const cats = sortedCategories(s);
    const only = cats.length <= 1;
    lastNote.hidden = !only;
    listEl.replaceChildren(...cats.map((c, i) => h('li', { 'data-cat': c.id }, categoryRow(c, i, cats, s, only))));
  }

  function categoryRow(c, i, cats, s, only) {
    const count = s.requests.filter((r) => r.categoryId === c.id).length;
    const input = h('input', {
      class: 'input', type: 'text', value: c.name, maxlength: '60', autocomplete: 'off',
      autocapitalize: 'words', enterkeyhint: 'done', 'data-part': 'name',
    });
    input.id = `req-cat-${c.id}`;
    const err = h('p', { class: 'error-text', id: `${input.id}-error`, hidden: true });
    const saveBtn = h('button', { type: 'submit', class: 'btn btn-primary req-cat-save', hidden: true, 'aria-label': `Save the new name for ${c.name}` }, 'Save');
    const dirty = () => input.value.trim() !== c.name;
    input.addEventListener('input', () => {
      saveBtn.hidden = !dirty();
      if (input.value.trim()) clearError(input, err);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dirty()) {
        e.preventDefault();
        input.value = c.name;
        saveBtn.hidden = true;
        clearError(input, err);
      }
    });
    const form = h('form', {
      class: 'req-cat-name',
      novalidate: true,
      onSubmit: (e) => {
        e.preventDefault();
        const name = input.value.trim();
        if (!name) {
          showError(input, err, 'Please give the category a name.');
          input.focus();
          return;
        }
        if (name === c.name) return;
        if (s.categories.some((x) => x.id !== c.id && fold(x.name) === fold(name))) {
          showError(input, err, 'You already have a category by that name.');
          input.focus();
          return;
        }
        renameCategory(c.id, name);
        draw();
        toast(`Renamed to “${name}”.`);
        focusRow(c.id, 'name');
      },
    },
    h('label', { class: 'visually-hidden', for: input.id }, `Name of category ${i + 1}`),
    input, saveBtn);

    const move = (delta, part) => {
      moveCategory(c.id, delta);
      draw();
      focusRow(c.id, part);
    };
    return h('div', { class: 'req-cat-row' },
      form, err,
      h('div', { class: 'req-cat-foot' },
        h('span', { class: 'meta' }, count ? plural(count, 'request') : 'No requests'),
        h('button', { type: 'button', class: 'icon-btn', 'data-part': 'up', 'aria-label': `Move ${c.name} up`, disabled: i === 0, onClick: () => move(-1, 'up') }, icon('up')),
        h('button', { type: 'button', class: 'icon-btn', 'data-part': 'down', 'aria-label': `Move ${c.name} down`, disabled: i === cats.length - 1, onClick: () => move(1, 'down') }, icon('down')),
        h('button', { type: 'button', class: 'icon-btn req-cat-delete', 'data-part': 'delete', 'aria-label': `Delete ${c.name}`, disabled: only, onClick: () => openDeleteSheet(c, count) }, icon('trash'))));
  }

  function openDeleteSheet(c, count) {
    const s = getState();
    const others = sortedCategories(s).filter((x) => x.id !== c.id);
    if (!others.length) return;
    const index = sortedCategories(s).findIndex((x) => x.id === c.id);
    const target = h('select', { class: 'select' }, others.map((o) => h('option', { value: o.id }, o.name)));
    target.value = (others.find((o) => o.id === 'other') || others[0]).id;
    sheet({
      title: `Delete “${c.name}”?`,
      body: (el) => {
        if (count) {
          el.append(
            h('p', null, `“${c.name}” holds ${plural(count, 'request')}. Choose a category to receive ${count === 1 ? 'it' : 'them'}.`),
            field(count === 1 ? 'Move its request to' : 'Move its requests to', target));
        } else {
          el.append(h('p', null, `“${c.name}” holds no requests, so nothing else will change.`));
        }
      },
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Delete category',
          variant: 'danger',
          onClick: (close) => {
            const moveTo = target.value;
            try {
              deleteCategory(c.id, moveTo);
            } catch (error) {
              toast(error.message);
              close();
              return;
            }
            close();
            draw();
            toast(count ? `Deleted “${c.name}”. Its requests are now in ${categoryName(moveTo)}.` : `Deleted “${c.name}”.`);
            const cats = sortedCategories();
            const next = cats[Math.min(index, cats.length - 1)];
            if (next) focusRow(next.id, 'delete');
          },
        },
      ],
    });
  }

  draw();
  main.append(root);
  return undefined;
}
