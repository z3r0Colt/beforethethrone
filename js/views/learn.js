// Learn: the Westminster Standards on prayer and short studies drawn from
// them. One module serves every Learn page:
//   #/learn                 index of the Standards and the studies
//   #/learn/wsc             the Shorter Catechism, searchable (?search=)
//   #/learn/wsc/:n          one question, with a practice mode
//   #/learn/wcf             Confession chapter 21 (?s=3 jumps to a section)
//   #/learn/wlc             Larger Catechism 178-196 (?q=180 jumps to a question)
//   #/learn/topic/:id       a study in prayer
// Confessional text is public domain and quoted verbatim from the data modules.
// Scripture is quoted only through getVerse() and renderScripture(). Every
// other passage is a link to esv.org.

import {
  h, icon, renderScripture, esvLink, pageTitle, backLink, emptyState, ornament, setTitle,
} from '../dom.js';
import * as scripture from '../data/scripture.js';
import * as catechism from '../data/catechism.js';
import * as standards from '../data/standards.js';
import * as guides from '../data/guides.js';

const PRACTICE_KEY = 'btt:practice';
const WSC_TOTAL = 107;
const PRAYER_FROM = 98;
const PRAYER_TO = 107;

// The traditional divisions of the Shorter Catechism (see Q. 3).
const WSC_GROUPS = [
  { id: 'believe', from: 1, to: 38, title: 'What we are to believe concerning God' },
  { id: 'duty', from: 39, to: 84, title: 'The duty God requires of us' },
  { id: 'means', from: 85, to: 97, title: 'Faith, repentance, and the means of grace' },
  { id: 'prayer', from: PRAYER_FROM, to: PRAYER_TO, title: 'Prayer', prayer: true },
];

const WLC_GROUPS = [
  { id: 'prayer', from: 178, to: 185, title: 'What prayer is' },
  { id: 'lords-prayer', from: 186, to: 196, title: 'The Lord’s Prayer' },
];

// Shorter Catechism questions on prayer and the fuller Larger Catechism answers
// that treat the same heads.
const WSC_TO_WLC = {
  98: [178], 99: [186, 187], 100: [189], 101: [190], 102: [191],
  103: [192], 104: [193], 105: [194], 106: [195], 107: [196],
};
const WLC_TO_WSC = {};
for (const [wsc, list] of Object.entries(WSC_TO_WLC)) {
  for (const n of list) WLC_TO_WSC[n] = Number(wsc);
}

const FALLBACK_NOTE = 'The Westminster Standards (1640s) are in the public domain.';

let idSeq = 0;
const nextId = (prefix) => `learn-${prefix}-${++idSeq}`;

// ---------- data access (defensive, since data modules are shared) ----------

function wscList() {
  return Array.isArray(catechism.WSC) ? catechism.WSC : [];
}

function getWSC(n) {
  const num = Number(n);
  if (!Number.isInteger(num)) return null;
  return wscList().find((q) => q && q.n === num) || null;
}

function wlcList() {
  return Array.isArray(standards.WLC_PRAYER) ? standards.WLC_PRAYER : [];
}

function getWLC(n) {
  const num = Number(n);
  return wlcList().find((q) => q && q.n === num) || null;
}

function wcf() {
  const data = standards.WCF_21 || {};
  return {
    chapter: data.chapter || 21,
    title: data.title || 'Of Religious Worship, and the Sabbath Day',
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
}

function getWCFSection(n) {
  const num = Number(n);
  return wcf().sections.find((s) => s && s.n === num) || null;
}

function topics() {
  return Array.isArray(guides.TOPICS) ? guides.TOPICS : [];
}

function getTopic(id) {
  return topics().find((t) => t && t.id === id) || null;
}

function proofRef(p) {
  return typeof catechism.formatProofRef === 'function' ? catechism.formatProofRef(p) : String(p);
}

function getVerse(ref) {
  return typeof scripture.getVerse === 'function' ? scripture.getVerse(ref) : null;
}

const note = (value, fallback = FALLBACK_NOTE) => (typeof value === 'string' && value ? value : fallback);

// ---------- small helpers ----------

function unique(list) {
  return [...new Set((list || []).filter((x) => typeof x === 'string' && x.trim()))];
}

function readPractice() {
  try { return globalThis.localStorage.getItem(PRACTICE_KEY) === '1'; } catch { return false; }
}

function writePractice(on) {
  try { globalThis.localStorage.setItem(PRACTICE_KEY, on ? '1' : '0'); } catch { /* storage blocked */ }
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function wordCount(paragraphs) {
  return (paragraphs || []).join(' ').split(/\s+/).filter(Boolean).length;
}

function readingTime(paragraphs) {
  return `${Math.max(1, Math.round(wordCount(paragraphs) / 200))} min read`;
}

function excerpt(text, max = 110) {
  const s = String(text || '');
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > 40 ? cut.slice(0, at) : cut).replace(/[,;:.\s]+$/, '')}…`;
}

function isTyping(target) {
  if (!target || !(target instanceof Element)) return false;
  return !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

function page(className, ...children) {
  return h('div', { class: ['view-learn', className] }, ...children);
}

function kicker(text, extra) {
  return h('p', { class: 'learn-kicker' }, h('span', null, text), extra || null);
}

function sourceNote(text) {
  return h('p', { class: 'source-note learn-source' }, text);
}

function sectionHead(text, { id, count } = {}) {
  return h('h2', { class: 'section-title learn-section-title', id: id || null },
    h('span', null, text), count ? h('span', { class: 'learn-section-count' }, count) : null);
}

// External links carry a shared, visually hidden description.
function extNote(id) {
  return h('span', { id, class: 'visually-hidden' }, 'Opens esv.org in a new tab');
}

function extLink(ref, describedBy, className) {
  const a = esvLink(ref, className ? { className } : undefined);
  if (describedBy) a.setAttribute('aria-describedby', describedBy);
  return a;
}

function proofsBlock(proofs, describedBy, { open = false } = {}) {
  const list = unique(proofs);
  if (!list.length) return null;
  return h('details', { class: 'learn-proofs', open },
    h('summary', null,
      h('span', { class: 'learn-proofs-label' }, 'Scripture proofs'),
      h('span', { class: 'badge' }, String(list.length)),
      icon('down', { className: 'learn-proofs-chev' })),
    h('ul', { class: 'learn-proof-list' },
      list.map((p) => h('li', null, extLink(proofRef(p), describedBy, 'learn-proof')))));
}

// Scrolls to an element, marks it, and optionally moves focus to it.
function markTarget(container, el, { focus = false, smooth = false } = {}) {
  if (!el) return;
  container.querySelectorAll('.is-target').forEach((x) => x.classList.remove('is-target'));
  el.classList.add('is-target');
  el.scrollIntoView({ block: 'start', behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
  if (focus) el.focus({ preventScroll: true });
}

// Updates the address without a re-render, so reload and share keep the spot.
function replaceHash(hash) {
  try { history.replaceState(history.state, '', hash); } catch { /* ignore */ }
}

// ---------- search ----------

// Straight and curly quotes match each other. Replacements keep string length,
// so indexes found in the normalized text point into the original text.
function norm(s) {
  return String(s || '').toLowerCase().replace(/[‘’]/g, '\'').replace(/[“”]/g, '"');
}

function termsOf(query) {
  return norm(query).split(/\s+/).map((t) => t.trim()).filter(Boolean);
}

function ranges(text, terms) {
  const hay = norm(text);
  const found = [];
  for (const term of terms) {
    let i = hay.indexOf(term);
    while (i !== -1) {
      found.push([i, i + term.length]);
      i = hay.indexOf(term, i + term.length);
    }
  }
  found.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of found) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

function highlight(text, terms) {
  if (!terms.length) return text;
  const rs = ranges(text, terms);
  if (!rs.length) return text;
  const out = [];
  let at = 0;
  for (const [s, e] of rs) {
    if (s > at) out.push(text.slice(at, s));
    out.push(h('mark', null, text.slice(s, e)));
    at = e;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

function snippet(text, terms) {
  const rs = ranges(text, terms);
  if (!rs.length) return null;
  const first = rs[0][0];
  let start = Math.max(0, first - 45);
  let end = Math.min(text.length, first + 115);
  if (start > 0) {
    const sp = text.indexOf(' ', start);
    if (sp !== -1 && sp < first) start = sp + 1;
  }
  if (end < text.length) {
    const sp = text.lastIndexOf(' ', end);
    if (sp > first) end = sp;
  }
  const piece = text.slice(start, end);
  return [start > 0 ? '…' : '', highlight(piece, terms), end < text.length ? '…' : ''];
}

function numberQuery(query) {
  const m = /^\s*(?:q(?:uestion)?\.?\s*)?(\d{1,3})\s*$/i.exec(query || '');
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= WSC_TOTAL ? n : null;
}

function matches(q, terms, num) {
  if (num !== null) return q.n === num;
  if (!terms.length) return true;
  const hay = norm(`${q.q} ${q.a}`);
  return terms.every((t) => hay.includes(t));
}

// ---------- index ----------

function card({ kickerText, title, href, text, extra, className }) {
  return h('article', { class: ['card', 'learn-card', className] },
    kickerText ? h('p', { class: 'card-subtitle' }, kickerText) : null,
    h('h3', { class: 'card-title' },
      h('a', { class: 'learn-card-link', href }, title)),
    text ? h('p', { class: 'learn-card-text' }, text) : null,
    extra || null,
    h('span', { class: 'learn-card-chev', 'aria-hidden': 'true' }, icon('next')));
}

function renderIndex() {
  setTitle('Learn');
  const standardsCards = [
    card({
      className: 'learn-card-wsc',
      kickerText: '107 questions',
      title: 'The Shorter Catechism',
      href: '#/learn/wsc',
      text: 'The Westminster Assembly’s short summary of the faith, set out in questions and answers for young and old to learn by heart.',
      extra: h('div', { class: 'learn-card-extra' },
        h('a', { class: 'learn-shortcut', href: `#/learn/wsc/${PRAYER_FROM}` },
          icon('pray'), h('span', null, 'On prayer, Q. 98–107'), icon('next', { className: 'learn-shortcut-chev' }))),
    }),
    card({
      kickerText: 'Confession, chapter 21',
      title: 'The Confession on Worship and Prayer',
      href: '#/learn/wcf',
      text: 'How God is to be worshipped and how prayer is made acceptable to him. The chapter ends with the Lord’s Day.',
    }),
    card({
      kickerText: 'Questions 178–196',
      title: 'The Larger Catechism on Prayer',
      href: '#/learn/wlc',
      text: 'A fuller teaching on prayer, with a careful walk through each petition of the Lord’s Prayer.',
    }),
  ];

  const studyCards = topics().map((t) => card({
    className: 'learn-card-topic',
    kickerText: readingTime(t.body),
    title: t.title,
    href: `#/learn/topic/${encodeURIComponent(t.id)}`,
    text: t.summary,
  }));

  return page('learn-index',
    pageTitle('Learn', { subtitle: 'Learn to pray from the Scriptures, with the Westminster Standards as your guide.' }),
    h('section', { class: 'section learn-section', 'aria-labelledby': 'learn-standards-h' },
      sectionHead('The Westminster Standards', { id: 'learn-standards-h' }),
      h('div', { class: 'stack' }, standardsCards)),
    studyCards.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': 'learn-studies-h' },
        sectionHead('Studies in prayer', { id: 'learn-studies-h' }),
        h('div', { class: 'stack' }, studyCards))
      : null,
    sourceNote(note(standards.STANDARDS_SOURCE_NOTE)));
}

// ---------- Shorter Catechism list ----------

function renderWscList(main, { query }) {
  setTitle('The Shorter Catechism');
  const all = wscList();
  const countId = nextId('count');
  const input = h('input', {
    class: 'input',
    type: 'search',
    autocomplete: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
    placeholder: 'A word or a number',
    'aria-controls': 'learn-wsc-results',
    'aria-describedby': countId,
  });
  input.value = typeof query.search === 'string' ? query.search.slice(0, 100) : '';
  const searchId = nextId('search');
  input.id = searchId;
  const searchField = h('div', { class: 'field learn-search', role: 'search' },
    h('label', { class: 'label', for: searchId }, 'Search questions and answers'),
    h('div', { class: 'search' }, icon('search'), input));

  const count = h('p', { class: 'learn-count small muted', id: countId, role: 'status', 'aria-live': 'polite' });
  const results = h('div', { class: 'learn-results', id: 'learn-wsc-results' });

  const jump = h('button', {
    type: 'button',
    class: 'learn-shortcut learn-jump-prayer',
    onClick: () => {
      const heading = results.querySelector('[data-group="prayer"] h2');
      if (!heading) return;
      heading.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      heading.focus({ preventScroll: true });
    },
  }, icon('pray'), h('span', null, 'Jump to prayer, Q. 98–107'), icon('down', { className: 'learn-shortcut-chev' }));

  function row(q, terms, searching) {
    const inAnswer = searching && terms.length && ranges(q.a, terms).length;
    const isPrayer = q.n >= PRAYER_FROM && q.n <= PRAYER_TO;
    return h('li', null,
      h('a', { class: ['list-item', 'learn-q-row', isPrayer ? 'is-prayer' : null], href: `#/learn/wsc/${q.n}` },
        h('span', { class: 'learn-q-num', 'aria-hidden': 'true' }, String(q.n)),
        h('span', { class: 'grow' },
          h('span', { class: 'visually-hidden' }, `Question ${q.n}. `),
          h('span', { class: 'item-title learn-q-text' }, highlight(q.q, terms)),
          inAnswer ? h('span', { class: 'meta learn-snippet' }, snippet(q.a, terms)) : null),
        icon('next', { className: 'chev' })));
  }

  function draw() {
    const raw = input.value.trim();
    const num = numberQuery(raw);
    const terms = num !== null ? [] : termsOf(raw);
    const searching = raw.length > 0;
    const hits = all.filter((q) => matches(q, terms, num));
    const groups = WSC_GROUPS.map((g) => ({ ...g, items: hits.filter((q) => q.n >= g.from && q.n <= g.to) }))
      .filter((g) => g.items.length);

    jump.hidden = searching;
    if (!searching) count.textContent = `${all.length} questions`;
    else if (!hits.length) count.textContent = 'No questions match';
    else count.textContent = `${hits.length} ${hits.length === 1 ? 'question matches' : 'questions match'}`;

    if (!hits.length) {
      results.replaceChildren(emptyState({
        iconName: 'search',
        title: 'Nothing found',
        text: `No question or answer contains “${raw.slice(0, 60)}”. Try a single word, or search by number.`,
        action: h('button', {
          type: 'button',
          class: 'btn',
          onClick: () => { input.value = ''; update(); input.focus(); },
        }, 'Clear the search'),
      }));
      return;
    }

    results.replaceChildren(...groups.map((g) => {
      const headId = `learn-wsc-g-${g.id}`;
      return h('section', {
        class: ['learn-group', g.prayer ? 'learn-group-prayer' : null],
        'data-group': g.id,
        'aria-labelledby': headId,
      },
      h('h2', { class: 'learn-group-title', id: headId, tabindex: '-1' },
        g.prayer ? icon('pray', { className: 'learn-group-icon' }) : null,
        h('span', { class: 'learn-group-name' }, g.title),
        h('span', { class: 'learn-group-range' }, `Q.\u00a0${g.from}–${g.to}`),
        g.prayer ? h('span', { class: 'badge badge-gold learn-group-badge' }, 'On prayer') : null),
      h('ul', { class: 'list learn-q-list' }, g.items.map((q) => row(q, terms, searching))));
    }));
  }

  function update() {
    const v = input.value.trim();
    replaceHash(v ? `#/learn/wsc?search=${encodeURIComponent(v)}` : '#/learn/wsc');
    draw();
  }

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; update(); }
  });

  draw();

  main.append(page('learn-wsc',
    backLink('#/learn', 'Learn'),
    pageTitle('The Shorter Catechism', { subtitle: 'Agreed by the Westminster Assembly in 1647. Tap a question to read its answer.' }),
    searchField,
    h('div', { class: 'learn-list-bar' }, count, jump),
    results,
    sourceNote(note(catechism.WSC_SOURCE_NOTE))));
}

// ---------- Shorter Catechism question ----------

function notFound({ title, text, back, actions }) {
  return page('learn-notfound',
    back,
    h('div', { class: 'card learn-notfound-card' },
      icon('learn', { className: 'learn-notfound-icon' }),
      pageTitle(title),
      h('p', null, text),
      h('div', { class: 'card-actions' }, actions)));
}

function renderWscItem(main, { params, navigate }) {
  const raw = String(params.n ?? '');
  const n = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;
  const q = getWSC(n);
  if (!q) {
    setTitle('Question not found');
    main.append(notFound({
      title: 'Question not found',
      text: `The Shorter Catechism has ${WSC_TOTAL} questions, and none is numbered “${raw.slice(0, 20)}”. Choose one from the list, or begin at the first.`,
      back: backLink('#/learn/wsc', 'All questions'),
      actions: [
        h('a', { class: 'btn btn-primary', href: '#/learn/wsc' }, 'Browse all questions'),
        h('a', { class: 'btn', href: '#/learn/wsc/1' }, 'Begin at Question 1'),
      ],
    }));
    return undefined;
  }

  setTitle(`Shorter Catechism Q. ${q.n}`);
  const isPrayer = q.n >= PRAYER_FROM && q.n <= PRAYER_TO;
  const ext = nextId('ext');
  const answerId = nextId('answer');
  let practice = readPractice();

  // In practice mode the answer waits behind a large button. Once shown, a
  // quiet button under it hides it again for another try.
  const reveal = h('button', {
    type: 'button',
    class: 'learn-reveal',
    'aria-controls': answerId,
    'aria-expanded': 'false',
    onClick: () => { setShown(true); answer.focus({ preventScroll: true }); },
  },
  icon('learn', { className: 'learn-reveal-icon' }),
  h('span', { class: 'learn-reveal-text' },
    h('span', { class: 'learn-reveal-label' }, 'Show the answer'),
    h('span', { class: 'learn-reveal-hint' }, 'Say it from memory first, then tap to check.')));
  const hide = h('button', {
    type: 'button',
    class: 'btn btn-ghost learn-hide',
    'aria-controls': answerId,
    'aria-expanded': 'true',
    onClick: () => { setShown(false); reveal.focus(); },
  }, 'Hide the answer');
  const hideRow = h('div', { class: 'learn-hide-row' }, hide);
  const answer = h('div', { class: 'learn-answer', id: answerId, tabindex: '-1' },
    h('p', { class: 'qa-a' }, q.a),
    hideRow);

  function setShown(shown) {
    answer.hidden = !shown;
    reveal.hidden = !practice || shown;
    hideRow.hidden = !practice;
  }

  const practiceBtn = h('button', {
    type: 'button',
    class: 'chip learn-practice',
    'aria-pressed': String(practice),
    'aria-describedby': `${answerId}-practice-hint`,
    onClick: () => {
      practice = !practice;
      writePractice(practice);
      practiceBtn.setAttribute('aria-pressed', String(practice));
      applyPractice();
    },
  }, icon('check', { className: 'learn-practice-check' }), h('span', null, 'Practice'));

  function applyPractice() {
    setShown(!practice);
  }
  applyPractice();

  const qaHead = pageTitle(q.q);
  const h1 = qaHead.querySelector('h1');
  h1.classList.add('qa-q', 'learn-question');
  if (q.q.length > 60) h1.classList.add('is-long');

  const proofs = unique(q.proofs);
  const deeper = [];
  for (const wn of WSC_TO_WLC[q.n] || []) {
    const w = getWLC(wn);
    if (w) {
      deeper.push(h('li', null, h('a', { class: 'list-item', href: `#/learn/wlc?q=${w.n}` },
        h('span', { class: 'grow' },
          h('span', { class: 'item-title' }, `The Larger Catechism, Q.\u00a0${w.n}`),
          h('span', { class: 'meta learn-meta-serif' }, w.q)),
        icon('next', { className: 'chev' }))));
    }
  }
  for (const t of topics().filter((x) => Array.isArray(x.wsc) && x.wsc.includes(q.n))) {
    deeper.push(h('li', null, h('a', { class: 'list-item', href: `#/learn/topic/${encodeURIComponent(t.id)}` },
      h('span', { class: 'grow' },
        h('span', { class: 'item-title' }, t.title),
        h('span', { class: 'meta' }, `A study in prayer · ${readingTime(t.body)}`)),
      icon('next', { className: 'chev' }))));
  }

  const prev = getWSC(q.n - 1);
  const next = getWSC(q.n + 1);
  const pager = h('nav', { class: 'learn-pager', 'aria-label': 'Catechism questions' },
    prev
      ? h('a', { class: 'btn learn-pager-prev', href: `#/learn/wsc/${prev.n}`, rel: 'prev' },
        icon('back'), h('span', { class: 'learn-pager-text' }, h('span', null, 'Previous'), h('span', { class: 'learn-pager-sub' }, `Q.\u00a0${prev.n}`)))
      : h('span', { class: 'learn-pager-gap' }),
    next
      ? h('a', { class: 'btn learn-pager-next', href: `#/learn/wsc/${next.n}`, rel: 'next' },
        h('span', { class: 'learn-pager-text' }, h('span', null, 'Next'), h('span', { class: 'learn-pager-sub' }, `Q.\u00a0${next.n}`)), icon('next'))
      : h('a', { class: 'btn learn-pager-next', href: '#/learn/wsc' },
        h('span', { class: 'learn-pager-text' }, h('span', null, 'All questions'), h('span', { class: 'learn-pager-sub' }, 'Back to the list')), icon('next')));

  main.append(page('learn-wsc-item',
    h('div', { class: 'learn-toolbar' },
      backLink('#/learn/wsc', 'All questions'),
      practiceBtn,
      h('span', { class: 'visually-hidden', id: `${answerId}-practice-hint` }, 'Practice hides the answer until you tap to show it.')),
    h('article', { class: ['qa', 'card', 'learn-qa-card', isPrayer ? 'is-prayer' : null] },
      h('div', { class: 'learn-qa-top' },
        h('span', { class: 'qa-num' }, `Question ${q.n} of ${WSC_TOTAL}`),
        isPrayer ? h('span', { class: 'badge badge-gold' }, 'On prayer') : null),
      qaHead,
      reveal,
      answer),
    proofs.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': `${answerId}-proofs` },
        extNote(ext),
        sectionHead('Scripture proofs', { id: `${answerId}-proofs` }),
        h('ul', { class: 'learn-proof-list' }, proofs.map((p) => h('li', null, extLink(proofRef(p), ext, 'learn-proof')))))
      : null,
    deeper.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': `${answerId}-deeper` },
        sectionHead('For further study', { id: `${answerId}-deeper` }),
        h('ul', { class: 'list' }, deeper))
      : null,
    pager,
    sourceNote(note(catechism.WSC_SOURCE_NOTE))));

  // Arrow keys step through the catechism when nothing is being typed.
  const onKey = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (isTyping(e.target) || document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); navigate(`/learn/wsc/${prev.n}`); }
    if (e.key === 'ArrowRight' && next) { e.preventDefault(); navigate(`/learn/wsc/${next.n}`); }
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

// ---------- Confession chapter 21 ----------

function relatedTopics(match) {
  return topics().filter(match).map((t) => h('a', { class: 'learn-related-link', href: `#/learn/topic/${encodeURIComponent(t.id)}` }, t.title));
}

// "See also" followed by links, separated by quiet dots.
function relatedLine(links) {
  const list = links.filter(Boolean);
  if (!list.length) return null;
  return h('p', { class: 'learn-related small' },
    h('span', { class: 'learn-related-label' }, 'See also '),
    list.flatMap((a, i) => (i ? [h('span', { class: 'learn-related-sep', 'aria-hidden': 'true' }, ' · '), a] : [a])));
}

function renderWcf(main, { query }) {
  const data = wcf();
  setTitle('The Confession on Worship and Prayer');
  const ext = nextId('ext');
  const container = h('div', { class: 'learn-sections' });

  const sections = data.sections.map((s) => {
    const headId = `learn-wcf-${s.n}-h`;
    return h('section', {
      class: 'learn-wcf-sec',
      id: `learn-wcf-${s.n}`,
      tabindex: '-1',
      'data-n': String(s.n),
      'aria-labelledby': headId,
    },
    h('h2', { class: 'learn-sec-head', id: headId },
      h('span', { class: 'learn-sec-num', 'aria-hidden': 'true' }, `${data.chapter}.${s.n}`),
      h('span', { class: 'learn-sec-label' }, `Section ${s.n}`)),
    h('p', { class: 'learn-confession' }, s.text),
    proofsBlock(s.proofs, ext));
  });
  container.append(...sections);

  const jumpTo = (n, opts) => {
    const el = container.querySelector(`[data-n="${n}"]`);
    if (!el) return;
    replaceHash(`#/learn/wcf?s=${n}`);
    markTarget(container, el, opts);
    jumpNav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.n === String(n))));
  };

  const jumpNav = h('nav', { class: 'learn-jump', 'aria-label': 'Sections of chapter 21' },
    h('span', { class: 'learn-jump-label', 'aria-hidden': 'true' }, 'Go to section'),
    h('div', { class: 'learn-jump-grid' }, data.sections.map((s) => h('button', {
      type: 'button',
      class: 'learn-jump-btn',
      'data-n': String(s.n),
      'aria-label': `Section ${s.n}`,
      'aria-current': 'false',
      onClick: () => jumpTo(s.n, { smooth: true, focus: true }),
    }, String(s.n)))));

  main.append(page('learn-wcf',
    backLink('#/learn', 'Learn'),
    kicker('The Westminster Confession', h('span', { class: 'learn-kicker-meta' }, `Chapter ${data.chapter}`)),
    pageTitle(data.title),
    h('p', { class: 'learn-intro' }, 'This chapter teaches how God is to be worshipped and how prayer is to be made so that he accepts it. It closes with the Lord’s Day, which God has set apart for his worship.'),
    data.sections.length ? jumpNav : null,
    extNote(ext),
    data.sections.length ? container : emptyState({ title: 'Not available', text: 'The text of this chapter could not be loaded.' }),
    ornament(),
    sourceNote(note(standards.WCF_SOURCE_NOTE, note(standards.STANDARDS_SOURCE_NOTE)))));

  return deepLink(container, query.s, jumpTo);
}

// Scrolls to ?s= or ?q= once the page is in place. Returns a cleanup.
function deepLink(container, value, jumpTo) {
  if (value === undefined || value === null || value === '' || !/^\d{1,3}$/.test(String(value))) return undefined;
  const n = Number(value);
  if (!container.querySelector(`[data-n="${n}"]`)) return undefined;
  let alive = true;
  requestAnimationFrame(() => {
    if (alive && container.isConnected) jumpTo(n, { focus: true });
  });
  return () => { alive = false; };
}

// ---------- Larger Catechism on prayer ----------

function renderWlc(main, { query }) {
  setTitle('The Larger Catechism on Prayer');
  const ext = nextId('ext');
  const all = wlcList();
  const container = h('div', { class: 'learn-wlc-groups' });

  const block = (q) => {
    const headId = `learn-wlc-${q.n}-h`;
    const wsc = WLC_TO_WSC[q.n];
    const topicLinks = relatedTopics((t) => Array.isArray(t.wlc) && t.wlc.includes(q.n));
    return h('article', {
      class: 'qa learn-wlc-q',
      id: `learn-wlc-${q.n}`,
      tabindex: '-1',
      'data-n': String(q.n),
      'aria-labelledby': headId,
    },
    h('span', { class: 'qa-num' }, `Question ${q.n}`),
    h('h3', { class: 'qa-q', id: headId }, q.q),
    h('p', { class: 'qa-a' }, q.a),
    proofsBlock(q.proofs, ext),
    relatedLine([
      wsc ? h('a', { class: 'learn-related-link', href: `#/learn/wsc/${wsc}` }, `Shorter Catechism, Q.\u00a0${wsc}`) : null,
      ...topicLinks,
    ]));
  };

  const groups = WLC_GROUPS.map((g) => ({ ...g, items: all.filter((q) => q.n >= g.from && q.n <= g.to) }))
    .filter((g) => g.items.length);
  const grouped = new Set(groups.flatMap((g) => g.items.map((q) => q.n)));
  const leftovers = all.filter((q) => !grouped.has(q.n));
  container.append(...groups.map((g) => h('section', { class: 'learn-wlc-group', 'aria-labelledby': `learn-wlc-g-${g.id}` },
    h('h2', { class: 'learn-group-title', id: `learn-wlc-g-${g.id}` },
      h('span', { class: 'learn-group-name' }, g.title),
      h('span', { class: 'learn-group-range' }, `Q.\u00a0${g.from}–${g.to}`)),
    h('div', { class: 'learn-wlc-list' }, g.items.map(block)))));
  if (leftovers.length) container.append(h('div', { class: 'learn-wlc-list' }, leftovers.map(block)));

  const jumpTo = (n, opts) => {
    const el = container.querySelector(`[data-n="${n}"]`);
    if (!el) return;
    replaceHash(`#/learn/wlc?q=${n}`);
    select.value = String(n);
    markTarget(container, el, opts);
  };

  // The jump waits for Go or Enter. Arrowing through a closed select fires
  // change on every step, and moving the page then would lose the reader.
  const go = () => { if (select.value) jumpTo(Number(select.value), { smooth: true, focus: true }); };
  const select = h('select', {
    class: 'select',
    // Read the value after the key is handled, so an open list commits first.
    onKeydown: (e) => { if (e.key === 'Enter') setTimeout(go, 0); },
  },
  h('option', { value: '' }, 'Choose a question'),
  all.map((q) => h('option', { value: String(q.n) }, `${q.n}. ${q.q}`)));
  const selectId = nextId('goto');
  select.id = selectId;

  main.append(page('learn-wlc',
    backLink('#/learn', 'Learn'),
    kicker('The Westminster Larger Catechism'),
    pageTitle('The Larger Catechism on Prayer', { subtitle: 'Questions 178–196' }),
    h('p', { class: 'learn-intro' }, 'The Larger Catechism was written to help ministers teach the faith. Its answers on prayer are full and searching, and they reward slow reading. Take one question at a time.'),
    all.length
      ? h('div', { class: 'field learn-goto' },
        h('label', { class: 'label', for: selectId }, 'Go to a question'),
        h('div', { class: 'learn-goto-row' },
          select,
          h('button', { type: 'button', class: 'btn learn-goto-btn', onClick: go }, 'Go')))
      : null,
    extNote(ext),
    all.length ? container : emptyState({ title: 'Not available', text: 'The text of these questions could not be loaded.' }),
    ornament(),
    sourceNote(note(standards.WLC_SOURCE_NOTE, note(standards.STANDARDS_SOURCE_NOTE)))));

  return deepLink(container, query.q, jumpTo);
}

// ---------- topic ----------

function standardsRow(href, title, meta) {
  return h('li', null, h('a', { class: 'list-item', href },
    h('span', { class: 'grow' },
      h('span', { class: 'item-title' }, title),
      meta ? h('span', { class: 'meta learn-meta-serif' }, meta) : null),
    icon('next', { className: 'chev' })));
}

function renderTopic(main, { params }) {
  const t = getTopic(params.id);
  if (!t) {
    setTitle('Study not found');
    main.append(notFound({
      title: 'Study not found',
      text: 'This study could not be found. It may have been renamed. The other studies are waiting for you on the Learn page.',
      back: backLink('#/learn', 'Learn'),
      actions: [h('a', { class: 'btn btn-primary', href: '#/learn' }, 'Back to Learn')],
    }));
    return;
  }
  setTitle(t.title);
  const ext = nextId('ext');
  const body = (Array.isArray(t.body) ? t.body : []).filter(Boolean);

  const verses = unique(t.verses).map((ref) => {
    const v = getVerse(ref);
    return v ? renderScripture(v, { className: 'learn-verse' }) : h('p', { class: 'learn-readlink' }, 'Read ', extLink(ref, ext), ' on esv.org');
  });

  const refs = [];
  for (const n of Array.isArray(t.wsc) ? t.wsc : []) {
    const q = getWSC(n);
    if (q) refs.push(standardsRow(`#/learn/wsc/${q.n}`, `Shorter Catechism, Q.\u00a0${q.n}`, q.q));
  }
  for (const key of Array.isArray(t.wcf) ? t.wcf : []) {
    const m = /^(\d+)\.(\d+)$/.exec(String(key));
    const s = m && Number(m[1]) === wcf().chapter ? getWCFSection(m[2]) : null;
    if (s) refs.push(standardsRow(`#/learn/wcf?s=${s.n}`, `Confession ${m[1]}.${s.n}`, excerpt(s.text)));
  }
  for (const n of Array.isArray(t.wlc) ? t.wlc : []) {
    const q = getWLC(n);
    if (q) refs.push(standardsRow(`#/learn/wlc?q=${q.n}`, `Larger Catechism, Q.\u00a0${q.n}`, q.q));
  }

  const seeAlso = unique(t.seeAlso);
  const list = topics();
  const at = list.indexOf(t);
  const prev = at > 0 ? list[at - 1] : null;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;

  main.append(page('learn-topic',
    backLink('#/learn', 'Learn'),
    kicker('A study in prayer', h('span', { class: 'learn-kicker-meta' }, readingTime(body))),
    pageTitle(t.title),
    t.summary ? h('p', { class: 'learn-lead' }, t.summary) : null,
    body.length ? h('div', { class: 'learn-prose' }, body.map((p) => h('p', null, p))) : null,
    ornament(),
    extNote(ext),
    verses.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': 'learn-topic-verses' },
        sectionHead('From the Scriptures', { id: 'learn-topic-verses' }),
        h('div', { class: 'learn-verses' }, verses))
      : null,
    refs.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': 'learn-topic-refs' },
        sectionHead('In the Westminster Standards', { id: 'learn-topic-refs' }),
        h('ul', { class: 'list learn-refs' }, refs))
      : null,
    seeAlso.length
      ? h('section', { class: 'section learn-section', 'aria-labelledby': 'learn-topic-more' },
        sectionHead('Read further', { id: 'learn-topic-more' }),
        h('p', { class: 'small muted learn-more-hint' }, 'These passages open on esv.org.'),
        h('ul', { class: 'learn-more-list' }, seeAlso.map((ref) => {
          const a = extLink(ref, ext, 'chip learn-more-link');
          a.append(icon('external', { className: 'learn-ext-icon' }));
          return h('li', null, a);
        })))
      : null,
    prev || next
      ? h('nav', { class: 'learn-pager learn-topic-pager', 'aria-label': 'More studies' },
        prev
          ? h('a', { class: 'btn learn-pager-prev', href: `#/learn/topic/${encodeURIComponent(prev.id)}`, rel: 'prev' },
            icon('back'), h('span', { class: 'learn-pager-text' }, h('span', { class: 'learn-pager-sub' }, 'Previous study'), h('span', null, prev.title)))
          : h('span', { class: 'learn-pager-gap' }),
        next
          ? h('a', { class: 'btn learn-pager-next', href: `#/learn/topic/${encodeURIComponent(next.id)}`, rel: 'next' },
            h('span', { class: 'learn-pager-text' }, h('span', { class: 'learn-pager-sub' }, 'Next study'), h('span', null, next.title)), icon('next'))
          : h('span', { class: 'learn-pager-gap' }))
      : null,
    refs.length ? sourceNote(note(standards.STANDARDS_SOURCE_NOTE)) : null));
}

// ---------- entry ----------

export function render(main, ctx = {}) {
  const params = ctx.params || {};
  const query = ctx.query || {};
  const path = ctx.path || '/learn';
  const navigate = ctx.navigate || ((p) => { location.hash = `#${p}`; });

  if (path === '/learn/wsc') return renderWscList(main, { query });
  if (path.startsWith('/learn/wsc/')) return renderWscItem(main, { params, navigate });
  if (path === '/learn/wcf') return renderWcf(main, { query });
  if (path === '/learn/wlc') return renderWlc(main, { query });
  if (path.startsWith('/learn/topic/')) return renderTopic(main, { params });
  main.append(renderIndex());
  return undefined;
}
