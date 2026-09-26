// The guided time of prayer, shown in focus mode with no header or tab bar.
// One step at a time, from "Draw near" to "Amen". Requests due today are
// placed in the step where they belong, and progress is kept in
// sessionStorage so a stray reload or a quick trip elsewhere loses nothing.

import {
  h, icon, renderScripture, esvLink, pageTitle, emptyState, toast, openSheet,
  confirmDialog, field, setTitle,
} from '../dom.js';
import {
  getState, markPrayed, markAnswered, recordSession, addJournal, todaysRotation,
} from '../store.js';
import { dueToday, groupByCategory, sortRequests } from '../schedule.js';
import { dayKey, dayOfYear, isLordsDay, formatShort } from '../dates.js';
import { getVerse } from '../data/scripture.js';
import * as catechism from '../data/catechism.js';
import * as guides from '../data/guides.js';

const SESSION_KEY = 'beforethethrone:pray-session';

let idSeq = 0;
const nextId = (prefix) => `pray-${prefix}-${++idSeq}`;

// ---------- saved progress (sessionStorage) ----------

function readSaved() {
  try {
    const raw = globalThis.sessionStorage && sessionStorage.getItem(SESSION_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function writeSaved(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* storage blocked */ }
}

function clearSaved() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ }
}

function validIso(v) {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ---------- content helpers ----------

function promptsOf(step) {
  if (Array.isArray(step.prompts)) return step.prompts.filter(Boolean);
  if (step.prompt) return [step.prompt];
  return [];
}

// Quotes a verse when it is in scripture.js; any other passage is linked only.
function verseBlock(ref, className = 'pray-scripture') {
  const verse = getVerse(ref);
  if (verse) return renderScripture(verse, { className });
  return h('p', { class: 'pray-readlink' }, 'Read ', esvLink(ref), ' on esv.org');
}

function versesBlock(refs, className) {
  const list = (refs || []).filter(Boolean);
  if (!list.length) return null;
  return h('div', { class: 'pray-verses' }, list.map((ref) => verseBlock(ref, className)));
}

function findWSC(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  if (typeof catechism.getWSC === 'function') {
    const found = catechism.getWSC(num);
    if (found && found.n === num) return found;
  }
  return (catechism.WSC || []).find((q) => q.n === num) || null;
}

function qaBlock(n) {
  const qa = findWSC(n);
  if (!qa) return null;
  return h('div', { class: 'qa pray-qa' },
    h('span', { class: 'qa-num' }, `Shorter Catechism Q. ${qa.n}`),
    h('p', { class: 'qa-q' }, qa.q),
    h('p', { class: 'qa-a' }, qa.a));
}

// Longer passages worth reading, linked to esv.org and never quoted.
function seeAlsoBlock(refs) {
  const list = (refs || []).filter(Boolean);
  if (!list.length) return null;
  const headId = nextId('seealso');
  return h('div', { class: 'pray-seealso' },
    h('p', { class: 'pray-seealso-label', id: headId }, 'Read also'),
    h('ul', { class: 'pray-seealso-list', 'aria-labelledby': headId },
      list.map((ref) => h('li', null, esvLink(ref, { className: 'chip pray-seealso-link' })))));
}

// The day's benediction, so the closing blessing changes from day to day.
function pickBenediction(now) {
  if (typeof guides.benedictionForDay === 'function') {
    const ref = guides.benedictionForDay(now);
    if (ref && getVerse(ref)) return ref;
  }
  const list = Array.isArray(guides.BENEDICTIONS) ? guides.BENEDICTIONS.filter((ref) => getVerse(ref)) : [];
  if (!list.length) return null;
  return list[(dayOfYear(now) - 1) % list.length];
}

// OPENING, the method's own steps, then CLOSING.
function buildSteps(method, now) {
  const opening = guides.OPENING || { title: 'Draw near', verses: ['Hebrews 4:16'] };
  const closing = guides.CLOSING || { title: 'Amen', verses: [] };
  const benediction = pickBenediction(now);
  return [
    { ...opening, key: 'opening', kind: 'opening', source: opening },
    ...(method.steps || []).map((s, i) => ({ ...s, key: s.id || `step-${i}`, kind: 'method', source: s })),
    { ...closing, key: 'closing', kind: 'closing', source: closing, verses: benediction ? [benediction] : (closing.verses || []) },
  ];
}

// Places each of today's requests in exactly one step. assignRequestsToStep
// decides; anything it leaves out is gathered into the last step that takes
// requests, so nothing due today is ever lost.
function assignRequests(method, steps, requests, categories) {
  const placed = new Set();
  const byStep = steps.map((step) => {
    if (step.kind !== 'method' || !step.source.requests) return [];
    let list = [];
    try {
      list = guides.assignRequestsToStep(step.source, requests, categories, method) || [];
    } catch (error) {
      console.error(error);
    }
    const mine = [];
    for (const r of list) {
      if (r && !placed.has(r.id)) {
        placed.add(r.id);
        mine.push(r);
      }
    }
    return mine;
  });
  const leftovers = requests.filter((r) => !placed.has(r.id));
  if (leftovers.length) {
    let target = -1;
    steps.forEach((s, i) => { if (s.kind === 'method' && s.source.requests) target = i; });
    if (target < 0) steps.forEach((s, i) => { if (s.kind === 'method') target = i; });
    if (target < 0) target = 0;
    byStep[target] = sortRequests([...byStep[target], ...leftovers], categories);
  }
  return byStep;
}

function recentAnswered(state, limit = 5) {
  return state.requests
    .filter((r) => r.status === 'answered')
    .sort((a, b) => String(b.answeredAt || '').localeCompare(String(a.answeredAt || '')))
    .slice(0, limit);
}

// ---------- the view ----------

export function render(main, { query = {}, navigate } = {}) {
  const now = new Date();
  const today = dayKey(now);
  const state = getState();
  const method = guides.getMethod(query.method || state.settings.method);
  const steps = buildSteps(method, now);
  const categories = state.categories;

  let requests = [];
  try {
    requests = dueToday(state, now, todaysRotation(now)).all;
  } catch (error) {
    console.error(error);
  }
  const stepRequests = assignRequests(method, steps, requests, categories);
  const knownIds = new Set(state.requests.map((r) => r.id));

  // Restore progress only for the same method on the same day.
  const saved = readSaved();
  const resume = saved && saved.method === method.id && saved.dayKey === today;
  let index = resume ? Math.min(Math.max(0, Math.floor(Number(saved.step) || 0)), steps.length - 1) : 0;
  const checked = new Set(resume && Array.isArray(saved.checked)
    ? saved.checked.filter((id) => typeof id === 'string' && knownIds.has(id)) : []);
  let note = resume && typeof saved.note === 'string' ? saved.note : '';
  const startedAt = (resume && validIso(saved.startedAt)) || now.toISOString();
  const sessionDay = today;
  const answeredHere = new Set();

  let alive = true;
  let done = false;
  let openSheetHandle = null;

  const hasProgress = () => checked.size > 0 || note.trim().length > 0;
  const worthKeeping = () => hasProgress() || index > 0;

  function save() {
    if (done) return;
    writeSaved({ method: method.id, dayKey: sessionDay, step: index, checked: [...checked], note, startedAt });
  }

  setTitle('Pray');

  // ----- top bar -----
  const countEl = h('span', { class: 'pray-count' });
  const fill = h('div', { class: 'pray-progress-fill' });
  const progress = h('div', {
    class: 'pray-progress',
    role: 'progressbar',
    'aria-label': 'Progress through this time of prayer',
    'aria-valuemin': '1',
    'aria-valuemax': String(steps.length),
  }, fill);
  const top = h('div', { class: 'pray-top' },
    h('div', { class: 'pray-top-inner' },
      h('button', {
        type: 'button',
        class: 'icon-btn pray-close',
        'aria-label': 'Close and end this time of prayer',
        onClick: () => onClose(),
      }, icon('close')),
      h('div', { class: 'pray-top-center' },
        h('span', { class: 'pray-method' }, method.name),
        countEl),
      h('span', { class: 'pray-top-balance', 'aria-hidden': 'true' })),
    progress);

  // ----- step host and bottom bar -----
  const host = h('div', { class: 'pray-host' });
  const backBtn = h('button', { type: 'button', class: 'btn btn-lg pray-back', onClick: () => goTo(index - 1) },
    icon('back'), h('span', null, 'Back'));
  const nextLabel = h('span', null, 'Next');
  const nextIcon = icon('next');
  const nextBtn = h('button', { type: 'button', class: 'btn btn-primary btn-lg pray-next', onClick: () => onNext() },
    nextLabel, nextIcon);
  const bottom = h('div', { class: 'pray-bottom' },
    h('div', { class: 'pray-bottom-inner' }, backBtn, nextBtn));

  const root = h('div', { class: 'view-pray' }, top, host, bottom);
  main.append(root);

  // ----- requests -----
  function renderPromise(text, describedIds) {
    const id = nextId('promise');
    describedIds.push(id);
    const verse = getVerse(text.trim());
    return h('div', { class: 'pray-req-promise', id },
      h('span', { class: 'pray-req-label' }, 'Pleading'),
      verse
        ? renderScripture(verse, { className: 'pray-promise-verse' })
        : h('p', { class: 'pray-promise-text' }, text));
  }

  function setRowState(li, btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    li.classList.toggle('is-prayed', on);
  }

  function renderRequest(r) {
    const li = h('li', { class: 'pray-req' });
    const describedIds = [];
    const body = [];
    if (r.details && r.details.trim()) {
      const id = nextId('details');
      describedIds.push(id);
      body.push(h('p', { class: 'pray-req-details', id }, r.details.trim()));
    }
    if (r.promise && r.promise.trim()) body.push(renderPromise(r.promise, describedIds));

    const btn = h('button', {
      type: 'button',
      class: 'pray-req-toggle',
      'aria-pressed': String(checked.has(r.id)),
      'aria-describedby': describedIds.length ? describedIds.join(' ') : null,
      onClick: () => {
        const on = !checked.has(r.id);
        if (on) checked.add(r.id); else checked.delete(r.id);
        setRowState(li, btn, on);
        save();
      },
    },
    h('span', { class: 'pray-check', 'aria-hidden': 'true' }, icon('check')),
    h('span', { class: 'pray-req-title' }, h('span', { class: 'visually-hidden' }, 'Prayed for '), r.title));

    const stateTag = h('span', { class: 'pray-req-state', 'aria-hidden': 'true' }, 'Prayed');
    const isAnswered = r.status === 'answered' || answeredHere.has(r.id);
    const foot = h('div', { class: 'pray-req-foot' },
      stateTag,
      isAnswered
        ? h('span', { class: 'badge badge-gold pray-req-answered' }, 'Answered')
        : h('button', {
          type: 'button',
          class: 'pray-req-answer',
          'aria-label': `Mark “${r.title}” answered`,
          onClick: () => openAnswered(r, li),
        }, 'Mark answered'));

    li.append(btn);
    if (body.length) li.append(h('div', { class: 'pray-req-body' }, body));
    li.append(foot);
    setRowState(li, btn, checked.has(r.id));
    return li;
  }

  function openAnswered(r, li) {
    const ta = h('textarea', { class: 'textarea', rows: '4', maxlength: '5000' });
    openSheetHandle = openSheet({
      title: 'The Lord has answered',
      className: 'pray-sheet',
      body: (el) => {
        el.append(
          h('p', { class: 'pray-sheet-req' }, r.title),
          field('How did the Lord answer?', ta, { hint: 'This will be kept on your Ebenezer page, a stone of remembrance of his help.' }),
        );
      },
      onClose: () => { openSheetHandle = null; },
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: (close) => close() },
        {
          label: 'Save',
          variant: 'primary',
          onClick: (close) => {
            markAnswered(r.id, ta.value);
            answeredHere.add(r.id);
            checked.add(r.id);
            save();
            close();
            if (!alive) return;
            const fresh = renderRequest({ ...r, status: 'answered' });
            li.replaceWith(fresh);
            const toggle = fresh.querySelector('.pray-req-toggle');
            if (toggle) toggle.focus();
            toast('Thanks be to God. This answer is now kept on your Ebenezer.');
          },
        },
      ],
    });
    setTimeout(() => { if (ta.isConnected) ta.focus(); }, 50);
  }

  function requestsBlock(list) {
    if (!list.length) return null;
    const headId = nextId('req-head');
    const warrants = guides.CATEGORY_WARRANTS || {};
    const groups = groupByCategory(list, categories);
    return h('section', { class: 'pray-requests', 'aria-labelledby': headId },
      h('h2', { class: 'section-title', id: headId }, list.length === 1 ? 'Your request' : 'Your requests'),
      h('p', { class: 'pray-hint' }, 'Tap each one when you have prayed for it.'),
      groups.map((g) => h('div', { class: 'pray-group' },
        h('h3', { class: 'pray-group-title' },
          h('span', null, g.category.name),
          warrants[g.category.id] ? esvLink(warrants[g.category.id], { className: 'pray-warrant' }) : null),
        h('ul', { class: 'pray-req-list' }, g.requests.map(renderRequest)))));
  }

  function answeredBlock() {
    const list = recentAnswered(getState());
    if (!list.length) return null;
    const headId = nextId('ans-head');
    return h('section', { class: 'pray-answered', 'aria-labelledby': headId },
      h('h2', { class: 'section-title', id: headId }, 'Remember how the Lord has helped'),
      h('ul', { class: 'pray-answered-list' }, list.map((r) => h('li', { class: 'pray-answered-item' },
        icon('ebenezer', { className: 'pray-answered-icon' }),
        h('div', { class: 'pray-answered-body' },
          h('p', { class: 'pray-answered-title' }, r.title),
          r.answeredAt ? h('p', { class: 'pray-answered-meta' }, `Answered ${formatShort(r.answeredAt)}`) : null,
          r.answerNote ? h('p', { class: 'pray-answered-note' }, r.answerNote) : null)))));
  }

  function noRequestsLine() {
    return h('p', { class: 'pray-none' },
      'There are no requests on your list for today. ',
      h('a', { href: '#/requests/new' }, 'Add a request'));
  }

  function lordsDayBlock() {
    const ld = guides.LORDS_DAY;
    if (!ld || !isLordsDay(now)) return null;
    const headId = nextId('lordsday');
    return h('section', { class: 'pray-lordsday', 'aria-labelledby': headId },
      h('h2', { class: 'pray-lordsday-title', id: headId }, ld.title || 'The Lord’s Day'),
      versesBlock(ld.verses, 'pray-scripture pray-scripture-sm'),
      promptsOf(ld).map((p) => h('p', { class: 'pray-lordsday-prompt' }, p)));
  }

  function aboutBlock() {
    if (!method.description) return null;
    return h('details', { class: 'pray-about' },
      h('summary', null, h('span', null, `About ${method.name}`), icon('down', { className: 'pray-about-chev' })),
      h('p', null, method.description));
  }

  function closingNote() {
    const ta = h('textarea', {
      class: 'textarea pray-note',
      rows: '4',
      maxlength: '5000',
      value: note,
      onInput: (e) => { note = e.target.value; save(); },
    });
    return field('Anything to remember from this time?', ta, { hint: 'If you write something, it will be kept in your journal.' });
  }

  function summaryLine() {
    const n = checked.size;
    if (!n) return null;
    return h('p', { class: 'pray-summary' },
      n === 1
        ? 'You brought one request before the throne of grace today.'
        : `You brought ${n} requests before the throne of grace today.`);
  }

  // ----- a single step -----
  function renderStep(i) {
    const step = steps[i];
    const list = stepRequests[i] || [];
    const prompts = promptsOf(step);
    const parts = [pageTitle(step.title, { subtitle: step.subtitle })];

    parts.push(
      versesBlock(step.verses),
      step.wsc ? qaBlock(step.wsc) : null,
      prompts.length ? h('div', { class: 'pray-prompts' }, prompts.map((p) => h('p', null, p))) : null,
      seeAlsoBlock(step.seeAlso),
    );
    if (step.kind === 'opening') parts.push(lordsDayBlock());

    if (step.kind === 'opening') {
      if (requests.length) {
        parts.push(h('p', { class: 'pray-orient' },
          requests.length === 1
            ? 'You have one request for today. It will appear in its place as you pray.'
            : `You have ${requests.length} requests for today. Each will appear in its place as you pray.`));
      } else if (method.id !== 'list') {
        parts.push(noRequestsLine());
      }
      parts.push(aboutBlock());
    }

    if (step.kind === 'method') {
      if (list.length) {
        parts.push(requestsBlock(list));
      } else if (method.id === 'list' && step.source.requests && !requests.length) {
        parts.push(emptyState({
          iconName: 'requests',
          title: 'No requests for today',
          text: 'When you add prayer requests, they will be gathered here so you can pray through them one by one.',
          action: h('a', { class: 'btn btn-primary', href: '#/requests/new' }, icon('plus'), h('span', null, 'Add a request')),
        }));
      }
      if (step.showAnswered) parts.push(answeredBlock());
    }

    if (step.kind === 'closing') {
      parts.push(summaryLine(), h('div', { class: 'pray-closing-note' }, closingNote()));
    }
    return h('div', { class: ['pray-step', `pray-step-${step.kind}`] }, parts);
  }

  function updateChrome() {
    const n = index + 1;
    const total = steps.length;
    countEl.textContent = `Step ${n} of ${total}`;
    progress.setAttribute('aria-valuenow', String(n));
    progress.setAttribute('aria-valuetext', `Step ${n} of ${total}`);
    fill.style.width = `${(n / total) * 100}%`;
    backBtn.disabled = index === 0;
    const last = index === total - 1;
    nextLabel.textContent = last ? 'Amen' : 'Next';
    nextIcon.hidden = last;
    nextBtn.classList.toggle('is-amen', last);
  }

  function show({ focus = false } = {}) {
    const el = renderStep(index);
    host.replaceChildren(el);
    updateChrome();
    if (focus) {
      window.scrollTo(0, 0);
      const heading = el.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function goTo(i) {
    if (done) return;
    const target = Math.min(Math.max(0, i), steps.length - 1);
    if (target === index) return;
    index = target;
    save();
    show({ focus: true });
  }

  function onNext() {
    if (index >= steps.length - 1) finish();
    else goTo(index + 1);
  }

  // ----- finishing and leaving -----
  function prayedIds() {
    const live = new Set(getState().requests.map((r) => r.id));
    return [...checked].filter((id) => live.has(id));
  }

  function record() {
    const end = new Date();
    const ids = prayedIds();
    if (ids.length) markPrayed(ids, end);
    recordSession({ method: method.id, startedAt, finishedAt: end.toISOString(), prayedIds: ids, date: sessionDay });
    const text = note.trim();
    if (text) addJournal({ kind: 'session', title: method.name, text, date: sessionDay });
  }

  function finish() {
    if (done) return;
    record();
    done = true;
    clearSaved();
    nextBtn.disabled = true;
    toast('Amen');
    navigate('/today');
  }

  async function onClose() {
    if (done) return;
    if (!hasProgress()) {
      done = true;
      clearSaved();
      navigate('/today');
      return;
    }
    const parts = [];
    if (checked.size) parts.push('The requests you marked will still count as prayed.');
    if (note.trim()) parts.push('Your note will be kept in your journal.');
    const yes = await confirmDialog({
      title: 'End this time of prayer?',
      message: parts.join(' '),
      confirmLabel: 'End prayer',
      cancelLabel: 'Keep praying',
    });
    if (!yes || done || !alive) return;
    record();
    done = true;
    clearSaved();
    toast('Amen');
    navigate('/today');
  }

  // ----- keyboard -----
  function onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    goTo(index + (e.key === 'ArrowRight' ? 1 : -1));
  }
  document.addEventListener('keydown', onKey);

  // ----- screen wake lock -----
  let lock = null;
  async function requestLock() {
    if (!alive || lock || document.visibilityState !== 'visible') return;
    const wl = navigator.wakeLock;
    if (!wl || typeof wl.request !== 'function') return;
    try {
      const sentinel = await wl.request('screen');
      if (!alive) {
        sentinel.release().catch(() => {});
        return;
      }
      lock = sentinel;
      sentinel.addEventListener('release', () => { if (lock === sentinel) lock = null; });
    } catch {
      /* not allowed here (battery saver, iframe, or no user gesture yet) */
    }
  }
  function onVisibility() {
    if (document.visibilityState === 'visible') requestLock();
  }
  document.addEventListener('visibilitychange', onVisibility);
  requestLock();

  // ----- first paint -----
  show();
  if (resume && worthKeeping()) {
    toast('Picking up where you left off.');
  }
  save();

  return () => {
    alive = false;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    if (lock) {
      lock.release().catch(() => {});
      lock = null;
    }
    if (openSheetHandle) openSheetHandle.close();
    // A confirm dialog left open by the back button would otherwise linger.
    document.querySelectorAll('dialog.sheet[open]').forEach((d) => d.dispatchEvent(new Event('cancel')));
    if (!done && !worthKeeping()) clearSaved();
  };
}
