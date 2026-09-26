// The prayer journal: a list of entries grouped by month, and the editor for
// one entry. Serves #/journal, #/journal/new and #/journal/:id.
//
// Words are never lost. While writing a new entry the text is kept as a draft
// in localStorage ('btt:journal-draft') and restored when the editor opens
// again. Unsaved edits to an existing entry are kept the same way under
// 'btt:journal-draft:<id>'. A draft is cleared on save or discard.

import {
  h, icon, pageTitle, backLink, emptyState, toast, confirmDialog, field, setTitle,
} from '../dom.js';
import { getState, addJournal, updateJournal, deleteJournal } from '../store.js';
import { dayKey, parseDayKey, formatLong, formatMonth, formatShort, weekdayName } from '../dates.js';
import { parseHash } from '../router.js';

export const DRAFT_KEY = 'btt:journal-draft';
const EDIT_DRAFT_PREFIX = `${DRAFT_KEY}:`;
const LIST_PATH = '/journal';
const PAGE_SIZE = 60;
const MAX_SEARCH = 100;
const PREVIEW_CHARS = 260;
const LIMITS = { title: 200, text: 50000 };

// ---------- drafts (browser storage, guarded) ----------

function storage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readDraft(key) {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    const draft = {
      date: parseDayKey(d.date) ? d.date : null,
      title: typeof d.title === 'string' ? d.title.slice(0, LIMITS.title) : '',
      text: typeof d.text === 'string' ? d.text.slice(0, LIMITS.text) : '',
    };
    return draft.title.trim() || draft.text.trim() || draft.date ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(key, values) {
  try {
    storage()?.setItem(key, JSON.stringify({ ...values, savedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

function removeDraft(key) {
  try { storage()?.removeItem(key); } catch { /* ignore */ }
}

// Ids of entries with unsaved edits. Drafts for entries that no longer exist
// are cleared on the way.
function editDraftIds(journal) {
  const ids = new Set();
  const store = storage();
  if (!store) return ids;
  try {
    const live = new Set(journal.map((e) => e.id));
    const keys = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(EDIT_DRAFT_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      const id = k.slice(EDIT_DRAFT_PREFIX.length);
      if (live.has(id)) ids.add(id);
      else store.removeItem(k);
    }
  } catch { /* ignore */ }
  return ids;
}

// ---------- navigation back to the list ----------

// Where history.back() would land, so Save and Cancel can step back to the
// list (keeping its search) instead of stacking a new history entry.
let lastOldPath = null;
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', (event) => {
    try { lastOldPath = parseHash(new URL(event.oldURL).hash).path; } catch { lastOldPath = null; }
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
    } catch { /* fall through */ }
  }
  return lastOldPath;
}

let lastListPath = LIST_PATH;

// ---------- dialogs opened here, closed if the page changes ----------

const openDialogs = new Set();

function confirmTracked(options) {
  const promise = confirmDialog(options);
  const dialogs = document.querySelectorAll('dialog.sheet');
  const dialog = dialogs[dialogs.length - 1];
  if (dialog) {
    openDialogs.add(dialog);
    dialog.addEventListener('close', () => openDialogs.delete(dialog), { once: true });
  }
  return promise;
}

function closeDialogs() {
  for (const dialog of openDialogs) {
    if (dialog.isConnected) dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  }
  openDialogs.clear();
}

// ---------- text helpers ----------

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function fold(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function squash(s, max = 4000) {
  return String(s || '').slice(0, max).replace(/\s+/g, ' ').trim();
}

function time(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortEntries(list) {
  return list.slice().sort((a, b) =>
    (a.date < b.date ? 1 : a.date > b.date ? -1 : 0) ||
    time(b.createdAt) - time(a.createdAt));
}

// What the list shows for an entry: a heading line and a short preview.
function summary(entry) {
  const title = (entry.title || '').trim();
  if (title) return { title, body: entry.text || '', untitled: false };
  if (entry.kind === 'session') return { title: 'Prayer time', body: entry.text || '', untitled: false };
  // An untitled entry leads with its first sentence, as a notebook would.
  const text = String(entry.text || '').slice(0, 4000).replace(/^\s+/, '');
  const nl = text.indexOf('\n');
  const line = (nl >= 0 ? text.slice(0, nl) : text).trimEnd();
  const rest = nl >= 0 ? text.slice(nl + 1) : '';
  const stop = /[.!?]["'\u201d\u2019)]?(?=\s|$)/.exec(line);
  if (stop && stop.index + stop[0].length <= 100) {
    const cut = stop.index + stop[0].length;
    return { title: line.slice(0, cut), body: `${line.slice(cut)}\n${rest}`, untitled: true };
  }
  if (line.length <= 100) return { title: line, body: rest, untitled: true };
  let cut = line.lastIndexOf(' ', 80);
  if (cut < 40) cut = 80;
  return { title: `${line.slice(0, cut).trimEnd()}…`, body: `…${line.slice(cut).trimStart()}\n${rest}`, untitled: true };
}

// Wraps each search term found in `text` in <mark>.
function highlight(text, terms) {
  const s = String(text);
  if (!terms.length) return [s];
  const lower = s.toLowerCase();
  if (lower.length !== s.length) return [s];
  const ranges = [];
  for (const t of terms) {
    if (!t) continue;
    let i = lower.indexOf(t);
    while (i >= 0 && ranges.length < 200) {
      ranges.push([i, i + t.length]);
      i = lower.indexOf(t, i + t.length);
    }
  }
  if (!ranges.length) return [s];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const out = [];
  let at = 0;
  for (const [a, b] of merged) {
    if (a > at) out.push(s.slice(at, a));
    out.push(h('mark', null, s.slice(a, b)));
    at = b;
  }
  if (at < s.length) out.push(s.slice(at));
  return out;
}

// A short preview. When searching, it starts near the first match so the
// reader can see why the entry was found.
function previewText(body, terms) {
  const flat = squash(body, terms.length ? 60000 : PREVIEW_CHARS * 4);
  if (!flat) return '';
  if (terms.length) {
    const lower = flat.toLowerCase();
    let idx = -1;
    for (const t of terms) {
      const i = lower.indexOf(t);
      if (i >= 0 && (idx < 0 || i < idx)) idx = i;
    }
    if (idx > 70) {
      let start = flat.lastIndexOf(' ', idx - 40);
      start = start < 0 ? idx - 40 : start + 1;
      return `…${flat.slice(start, start + PREVIEW_CHARS)}`;
    }
  }
  return flat.slice(0, PREVIEW_CHARS);
}

// ---------- entry point ----------

export function render(main, ctx) {
  const { path, params } = ctx;
  let result;
  if (path === LIST_PATH) result = renderList(main, ctx);
  else if (path === `${LIST_PATH}/new`) result = renderEditor(main, ctx, null);
  else result = renderEditor(main, ctx, params.id);
  return () => {
    closeDialogs();
    if (typeof result === 'function') result();
  };
}

// ---------- the list ----------

function renderList(main, { query }) {
  setTitle('Journal');
  const state = getState();
  const root = h('div', { class: 'view-journal jr-list-view' },
    pageTitle('Journal', { subtitle: 'The Lord’s dealings with your soul.' }));
  const draft = readDraft(DRAFT_KEY);
  const hasDraft = !!(draft && (draft.title.trim() || draft.text.trim()));
  if (hasDraft) root.append(draftCard(draft));

  if (!state.journal.length) {
    root.append(h('div', { class: 'card jr-empty' }, emptyState({
      iconName: 'journal',
      title: 'Nothing written yet',
      text: 'Keep a record of what the Lord teaches you in his Word and how he answers your prayers. Notes you write at the end of a prayer time are kept here too.',
      action: hasDraft ? null : h('a', { class: 'btn btn-primary', href: '#/journal/new' }, icon('edit'), 'Write your first entry'),
    })));
    main.append(root);
    lastListPath = LIST_PATH;
    return undefined;
  }

  const view = { q: typeof query.q === 'string' ? query.q.slice(0, MAX_SEARCH) : '', limit: PAGE_SIZE };
  const drafts = editDraftIds(state.journal);
  const entries = sortEntries(state.journal);

  const searchInput = h('input', {
    class: 'input',
    type: 'search',
    id: 'jr-search',
    value: view.q,
    placeholder: 'Search your journal',
    autocomplete: 'off',
    enterkeyhint: 'search',
    maxlength: String(MAX_SEARCH),
    onInput: (e) => { view.q = e.target.value; view.limit = PAGE_SIZE; sync(true); },
    onKeydown: (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        e.preventDefault();
        clearSearch();
      }
    },
  });
  const search = h('div', { class: 'search jr-search', role: 'search' },
    h('label', { class: 'visually-hidden', for: 'jr-search' }, 'Search your journal'),
    icon('search'),
    searchInput);
  const announcer = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
  const results = h('div', { class: 'jr-results' });
  const fab = h('a', { class: 'fab', href: '#/journal/new', 'aria-label': 'Write a new journal entry' },
    icon('plus'), h('span', null, 'Write'));
  root.append(search, announcer, results, fab);

  function clearSearch() {
    searchInput.value = '';
    view.q = '';
    view.limit = PAGE_SIZE;
    sync(true);
    searchInput.focus();
  }

  function writeQuery() {
    const qs = view.q.trim() ? `?${new URLSearchParams({ q: view.q })}` : '';
    lastListPath = LIST_PATH + qs;
    if (parseHash(location.hash).path === LIST_PATH && location.hash !== `#${lastListPath}`) {
      history.replaceState(history.state, '', `#${lastListPath}`);
    }
  }

  function draw(announce = false, focusFrom = -1) {
    const terms = [...new Set(view.q.toLowerCase().split(/\s+/).filter(Boolean))];
    const foldedTerms = terms.map(fold);
    const matches = foldedTerms.length
      ? entries.filter((e) => {
        const hay = fold(`${e.title}\n${e.kind === 'session' ? 'prayer time' : ''}\n${e.text}`);
        return foldedTerms.every((t) => hay.includes(t));
      })
      : entries;

    results.replaceChildren();
    if (!matches.length) {
      results.append(emptyState({
        iconName: 'search',
        title: 'No matches',
        text: `No entries match “${view.q.trim()}”.`,
        action: h('button', { type: 'button', class: 'btn', onClick: clearSearch }, 'Clear search'),
      }));
    } else {
      const shown = matches.slice(0, view.limit);
      const groups = [];
      for (const e of shown) {
        const key = e.date.slice(0, 7);
        let g = groups[groups.length - 1];
        if (!g || g.key !== key) {
          g = { key, entries: [] };
          groups.push(g);
        }
        g.entries.push(e);
      }
      // Count per month over all matches, not just the page shown.
      const monthTotals = new Map();
      for (const e of matches) monthTotals.set(e.date.slice(0, 7), (monthTotals.get(e.date.slice(0, 7)) || 0) + 1);
      let n = 0;
      for (const g of groups) {
        const headingId = `jr-m-${g.key}`;
        const total = monthTotals.get(g.key) || g.entries.length;
        results.append(h('section', { class: 'jr-month', 'aria-labelledby': headingId },
          h('h2', { class: 'section-title jr-month-title', id: headingId },
            h('span', null, formatMonth(parseDayKey(`${g.key}-01`))),
            h('span', { class: 'jr-month-count' }, h('span', { class: 'visually-hidden' }, ', '), plural(total, 'entry', 'entries'))),
          h('ul', { class: 'list' }, g.entries.map((e) => h('li', { 'data-n': String(n++) }, entryRow(e, terms, drafts.has(e.id)))))));
      }
      if (matches.length > shown.length) {
        const rest = matches.length - shown.length;
        results.append(h('button', {
          type: 'button',
          class: 'btn btn-block jr-more',
          onClick: () => {
            const from = view.limit;
            view.limit += PAGE_SIZE;
            draw(false, from);
          },
        }, `Show older entries (${rest} more)`));
      }
    }
    if (focusFrom >= 0) {
      const link = results.querySelector(`li[data-n="${focusFrom}"] a`);
      if (link) link.focus();
    }
    if (announce) {
      announcer.textContent = view.q.trim()
        ? (matches.length ? `${plural(matches.length, 'entry', 'entries')} found` : 'No entries match')
        : `${plural(matches.length, 'entry', 'entries')}`;
    }
  }

  function sync(announce) {
    writeQuery();
    draw(announce);
  }

  writeQuery();
  draw();
  main.append(root);
  return undefined;
}

function draftCard(draft) {
  const lead = squash(draft.title) || squash(draft.text, 400);
  return h('a', { class: 'card jr-draft', href: '#/journal/new' },
    h('span', { class: 'jr-draft-icon' }, icon('edit')),
    h('span', { class: 'grow' },
      h('span', { class: 'jr-draft-title' }, 'Your unfinished entry'),
      lead ? h('span', { class: 'jr-draft-preview' }, lead) : null,
      h('span', { class: 'jr-draft-go' }, 'Keep writing')),
    icon('next', { className: 'chev' }));
}

function entryRow(e, terms, hasDraft) {
  const d = parseDayKey(e.date) || new Date();
  const { title, body } = summary(e);
  const preview = previewText(body, terms);
  const session = e.kind === 'session';
  const showSessionTag = session && (e.title || '').trim();
  return h('a', { class: ['list-item', 'jr-item', session ? 'is-session' : null], href: `#/journal/${encodeURIComponent(e.id)}` },
    h('span', { class: 'jr-date', 'aria-hidden': 'true' },
      h('span', { class: 'jr-dow' }, weekdayName(d.getDay(), 'short')),
      h('span', { class: 'jr-day' }, String(d.getDate()))),
    h('span', { class: 'grow' },
      h('span', { class: 'visually-hidden' }, `${formatLong(d)}. `),
      h('span', { class: 'item-title jr-title' }, highlight(title || 'Untitled', terms)),
      preview ? h('span', { class: 'jr-preview' }, h('span', { class: 'visually-hidden' }, '. '), highlight(preview, terms)) : null,
      showSessionTag || hasDraft
        ? h('span', { class: 'jr-tags' },
          showSessionTag ? h('span', { class: 'jr-tag jr-tag-session' }, icon('pray'), h('span', { class: 'visually-hidden' }, '. '), 'Prayer time') : null,
          hasDraft ? h('span', { class: 'jr-tag jr-tag-draft' }, h('span', { class: 'visually-hidden' }, '. '), 'Unsaved changes') : null)
        : null),
    icon('next', { className: 'chev' }));
}

// ---------- the editor ----------

function renderNotFound(main) {
  setTitle('Entry not found');
  main.append(h('div', { class: 'view-journal jr-missing' },
    backLink(`#${lastListPath}`, 'Journal'),
    pageTitle('Entry not found'),
    h('div', { class: 'card' }, emptyState({
      iconName: 'journal',
      title: 'This entry is not here',
      text: 'It may have been deleted, or the link may be from another device. Your other entries are safe.',
      action: h('a', { class: 'btn btn-primary', href: `#${LIST_PATH}` }, 'Back to Journal'),
    }))));
  return undefined;
}

// Grows a textarea to fit its words without making the page jump.
function autosize(el) {
  const fit = () => {
    if (!el.isConnected) return;
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

function describe(el, id, on) {
  const ids = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  if (on) ids.add(id); else ids.delete(id);
  if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
  else el.removeAttribute('aria-describedby');
}

function showError(control, errEl, message) {
  errEl.textContent = message;
  errEl.hidden = false;
  control.setAttribute('aria-invalid', 'true');
  describe(control, errEl.id, true);
}

function clearError(control, errEl) {
  if (errEl.hidden) return;
  errEl.hidden = true;
  errEl.textContent = '';
  control.removeAttribute('aria-invalid');
  describe(control, errEl.id, false);
}

function renderEditor(main, { navigate, path }, id) {
  const isNew = id === null;
  const existing = isNew ? null : getState().journal.find((e) => e.id === id) || null;
  if (!isNew && !existing) {
    removeDraft(`${EDIT_DRAFT_PREFIX}${id}`);
    return renderNotFound(main);
  }
  const draftKey = isNew ? DRAFT_KEY : `${EDIT_DRAFT_PREFIX}${id}`;
  const base = existing
    ? { date: existing.date, title: existing.title || '', text: existing.text || '' }
    : { date: dayKey(new Date()), title: '', text: '' };

  const same = (a, b) => a.date === b.date && a.title === b.title && a.text === b.text;
  const hasWords = (v) => !!(v.title.trim() || v.text.trim());
  const stored = readDraft(draftKey);
  const restored = stored && hasWords(stored) ? { ...base, ...stored, date: stored.date || base.date } : null;
  const useRestored = !!restored && !same(restored, base);
  if (stored && !useRestored) removeDraft(draftKey);
  const start = useRestored ? restored : base;

  const previousPath = backPath();
  const fromList = previousPath === LIST_PATH;
  const cameFromApp = !!previousPath && previousPath !== path;
  const leave = () => {
    if (cameFromApp && history.length > 1) history.back();
    else navigate(LIST_PATH, { replace: true });
  };

  const heading = isNew ? 'New Entry' : 'Edit Entry';
  setTitle(heading);

  // Fields
  const dateInput = h('input', { class: 'input jr-date-input', type: 'date', value: start.date, required: true });
  const dateField = field('Date', dateInput, { className: 'jr-field-date' });
  const dateErr = h('p', { class: 'error-text', id: `${dateInput.id}-error`, hidden: true });
  dateField.append(dateErr);

  const titleInput = h('input', {
    class: 'input jr-title-input', type: 'text', value: start.title, maxlength: String(LIMITS.title),
    autocomplete: 'off', autocapitalize: 'sentences', enterkeyhint: 'next', spellcheck: 'true',
    placeholder: existing && existing.kind === 'session' ? 'Prayer time' : null,
  });
  const titleField = field(['Title', ' ', h('span', { class: 'jr-optional' }, '(optional)')], titleInput, { className: 'jr-field-title' });

  const textInput = h('textarea', {
    class: 'textarea jr-text', rows: '10', value: start.text, maxlength: String(LIMITS.text),
    autocapitalize: 'sentences', spellcheck: 'true',
    placeholder: 'Write what is on your heart.',
  });
  const textField = field('Entry', textInput, {
    className: 'jr-field-text',
    hint: 'Your words are kept on this device as you write, even if you leave before saving.',
  });
  const textErr = h('p', { class: 'error-text', id: `${textInput.id}-error`, hidden: true });
  textField.append(textErr);
  const fitText = autosize(textInput);

  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      textInput.focus();
    }
  });

  const values = () => ({ date: dateInput.value, title: titleInput.value, text: textInput.value });
  const isDirty = () => (isNew ? hasWords(values()) : !same(values(), base));

  // Autosave the draft
  let finished = false;
  let timer = null;
  function saveDraftNow() {
    clearTimeout(timer);
    timer = null;
    if (finished) return;
    if (isDirty()) writeDraft(draftKey, values());
    else removeDraft(draftKey);
  }
  function scheduleDraft() {
    clearTimeout(timer);
    timer = setTimeout(saveDraftNow, 400);
  }
  for (const el of [dateInput, titleInput, textInput]) {
    el.addEventListener('input', scheduleDraft);
    el.addEventListener('change', scheduleDraft);
  }
  const onHide = () => { if (document.visibilityState === 'hidden') saveDraftNow(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', saveDraftNow);

  dateInput.addEventListener('input', () => { if (parseDayKey(dateInput.value)) clearError(dateInput, dateErr); });
  textInput.addEventListener('input', () => { if (hasWords(values())) clearError(textInput, textErr); });
  titleInput.addEventListener('input', () => { if (hasWords(values())) clearError(textInput, textErr); });

  function validate() {
    let first = null;
    if (!parseDayKey(dateInput.value)) {
      showError(dateInput, dateErr, 'Please choose a date.');
      first = dateInput;
    }
    if (!hasWords(values())) {
      showError(textInput, textErr, 'Please write a few words before saving.');
      first = first || textInput;
    }
    if (first) first.focus();
    return !first;
  }

  function cleanText(t) {
    return t.replace(/^(?:[ \t]*\r?\n)+/, '').replace(/\s+$/, '');
  }

  function save(e) {
    if (e) e.preventDefault();
    if (!validate()) return;
    const v = values();
    const fields = { date: v.date, title: v.title.trim(), text: cleanText(v.text) };
    try {
      if (isNew) {
        addJournal({ ...fields, kind: 'entry' });
      } else {
        updateJournal(id, fields);
      }
    } catch (error) {
      toast(error.message || 'Could not save this entry.');
      return;
    }
    finished = true;
    clearTimeout(timer);
    removeDraft(draftKey);
    toast(isNew ? 'Entry saved.' : 'Changes saved.');
    leave();
  }

  async function cancel() {
    if (isDirty()) {
      const discard = await confirmTracked({
        title: isNew ? 'Discard this entry?' : 'Discard your changes?',
        message: isNew
          ? 'What you have written here will not be kept.'
          : 'Your changes to this entry will not be kept. The entry itself stays as it was.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep writing',
        danger: true,
      });
      if (!discard) return;
    }
    finished = true;
    clearTimeout(timer);
    removeDraft(draftKey);
    leave();
  }

  async function remove() {
    const ok = await confirmTracked({
      title: 'Delete this entry?',
      message: 'It will be removed from this device. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    finished = true;
    clearTimeout(timer);
    removeDraft(draftKey);
    deleteJournal(id);
    toast('Entry deleted.');
    leave();
  }

  const form = h('form', {
    class: 'card jr-form',
    novalidate: true,
    onSubmit: save,
    onKeydown: (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'Enter' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        save();
      }
    },
  },
  h('div', { class: 'jr-form-top' }, dateField, titleField),
  textField,
  h('div', { class: 'jr-form-actions' },
    h('button', { type: 'submit', class: 'btn btn-primary' }, icon('check'), 'Save'),
    h('button', { type: 'button', class: 'btn btn-ghost', onClick: cancel }, 'Cancel')));

  const back = backLink(`#${fromList ? lastListPath : LIST_PATH}`, 'Journal');
  back.addEventListener('click', (e) => {
    if (fromList && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  const root = h('div', { class: 'view-journal jr-editor' }, back, pageTitle(heading));

  if (useRestored) {
    const notice = h('div', { class: 'jr-restored', role: 'note' },
      icon('restore', { className: 'jr-restored-icon' }),
      h('p', { class: 'grow' }, isNew
        ? 'Your unfinished entry was kept, so you can pick up where you left off.'
        : 'Your unsaved changes to this entry were kept, so you can pick up where you left off.'),
      h('button', {
        type: 'button',
        class: 'btn btn-ghost jr-restored-reset',
        onClick: async () => {
          const ok = await confirmTracked({
            title: isNew ? 'Start over?' : 'Discard your changes?',
            message: isNew
              ? 'The words kept from before will be cleared.'
              : 'The entry will go back to how it was last saved.',
            confirmLabel: isNew ? 'Start over' : 'Discard',
            cancelLabel: 'Keep them',
            danger: true,
          });
          if (!ok) return;
          dateInput.value = base.date;
          titleInput.value = base.title;
          textInput.value = base.text;
          clearError(textInput, textErr);
          clearError(dateInput, dateErr);
          removeDraft(draftKey);
          notice.remove();
          fitText();
          textInput.focus();
        },
      }, isNew ? 'Start over' : 'Discard changes'));
    root.append(notice);
  }

  root.append(form);

  if (existing) {
    const created = formatShort(existing.createdAt);
    const changed = time(existing.updatedAt) - time(existing.createdAt) > 60000 ? formatShort(existing.updatedAt) : null;
    const lines = [existing.kind === 'session' ? `Written at the close of a prayer time on ${created}.` : `First written ${created}.`];
    if (changed) lines.push(`Last changed ${changed}.`);
    root.append(h('section', { class: 'section jr-about', 'aria-labelledby': 'jr-about-title' },
      h('h2', { class: 'visually-hidden', id: 'jr-about-title' }, 'About this entry'),
      h('p', { class: 'small muted jr-stamp' }, lines.join(' ')),
      h('button', { type: 'button', class: 'btn btn-danger jr-delete', onClick: remove }, icon('trash'), 'Delete entry')));
  }

  main.append(root);
  fitText();
  const onResize = () => fitText();
  window.addEventListener('resize', onResize);

  if (isNew) {
    textInput.focus({ preventScroll: true });
    const end = textInput.value.length;
    try { textInput.setSelectionRange(end, end); } catch { /* ignore */ }
  }

  return () => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', saveDraftNow);
    saveDraftNow();
  };
}
