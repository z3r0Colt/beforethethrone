// Guards the devotional content: every quoted verse exists, the ESV stays
// within Crossway's quotation limit, and the catechism and guides hold together.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSES, getVerse, countVerses, verseOfTheDay, ESV_NOTICE, findVerseByTypedRef, typedRefForLink,
} from '../../js/data/scripture.js';
import { WSC, catechismOfTheDay, formatProofRef } from '../../js/data/catechism.js';
import { WCF_21, WLC_PRAYER } from '../../js/data/standards.js';
import * as guides from '../../js/data/guides.js';
import { psalmsForDay, psalmUrl } from '../../js/data/psalter.js';
import { QUOTES, quoteOfTheDay } from '../../js/data/quotes.js';
import { DEFAULT_CATEGORIES } from '../../js/data/categories.js';

// ---------- Scripture ----------

test('verses are unique, clean, and typographically consistent', () => {
  const refs = VERSES.map((v) => v.ref);
  assert.equal(new Set(refs).size, refs.length, 'duplicate refs');
  for (const v of VERSES) {
    assert.equal(typeof v.text, 'string', v.ref);
    assert.ok(v.text.length > 10, v.ref);
    assert.equal(v.text, v.text.trim(), `${v.ref} has stray whitespace`);
    assert.ok(!/ {2}/.test(v.text), `${v.ref} has a double space`);
    assert.ok(!/["']/.test(v.text), `${v.ref} has a straight quote`);
    assert.ok(!/\d/.test(v.text), `${v.ref} has a digit (verse number?)`);
    assert.ok(Array.isArray(v.tags), `${v.ref} tags`);
  }
});

test('countVerses reads references', () => {
  assert.equal(countVerses('Hebrews 4:16'), 1);
  assert.equal(countVerses('Philippians 4:6-7'), 2);
  assert.equal(countVerses('Ephesians 3:14-19'), 6);
  assert.equal(countVerses('Jude 24-25'), 2);
  assert.equal(countVerses('1 Samuel 7:12'), 1);
});

test('findVerseByTypedRef matches a promise typed by hand', () => {
  assert.equal(findVerseByTypedRef('philippians 4:19'), getVerse('Philippians 4:19'));
  assert.equal(findVerseByTypedRef('Psalms 62:8'), getVerse('Psalm 62:8'));
  assert.equal(findVerseByTypedRef('Philippians 4:6–7'), getVerse('Philippians 4:6-7'));
  assert.equal(findVerseByTypedRef('  1 john 5:14 - 15. '), getVerse('1 John 5:14-15'));
  assert.ok(VERSES.includes(findVerseByTypedRef('philippians 4:19')), 'returns the VERSES entry itself');
  // Romans 8:28 is not quoted in the app, so it is linked instead.
  assert.equal(findVerseByTypedRef('romans 8:28'), null);
  assert.equal(typedRefForLink('romans 8:28'), 'romans 8:28');
  // Plain words are neither quoted nor linked.
  for (const words of ['my son at school', 'God will provide', '', '   ', null, undefined]) {
    assert.equal(findVerseByTypedRef(words), null, String(words));
    assert.equal(typedRefForLink(words), null, String(words));
  }
});

test('every quoted ref is found when typed in lower case', () => {
  for (const v of VERSES) assert.equal(findVerseByTypedRef(v.ref.toLowerCase()), v, v.ref);
});

test('ESV quotations stay well under Crossway’s 500-verse limit', () => {
  const total = VERSES.reduce((sum, v) => sum + countVerses(v.ref), 0);
  assert.ok(total > 0);
  assert.ok(total < 500, `total ESV verses quoted: ${total}`);
  assert.match(ESV_NOTICE, /Crossway/);
  assert.match(ESV_NOTICE, /Used by permission/);
});

test('verseOfTheDay is deterministic and drawn from daily verses', () => {
  const a = verseOfTheDay(new Date(2026, 8, 26, 6));
  const b = verseOfTheDay(new Date(2026, 8, 26, 22));
  assert.equal(a.ref, b.ref);
  assert.ok(a.tags.includes('daily'));
  const week = new Set(Array.from({ length: 7 }, (_, i) => verseOfTheDay(new Date(2026, 8, 20 + i)).ref));
  assert.ok(week.size > 1, 'the verse changes from day to day');
});

// ---------- guides ----------

function collectRefs() {
  const refs = [];
  const add = (list, where) => (list || []).forEach((r) => refs.push({ ref: r, where }));
  add(guides.OPENING.verses, 'OPENING');
  add(guides.CLOSING.verses, 'CLOSING');
  add(guides.BENEDICTIONS, 'BENEDICTIONS');
  add(guides.LORDS_DAY.verses, 'LORDS_DAY');
  Object.entries(guides.CATEGORY_WARRANTS).forEach(([k, r]) => refs.push({ ref: r, where: `CATEGORY_WARRANTS.${k}` }));
  for (const m of guides.METHODS) for (const s of m.steps) add(s.verses, `${m.id}.${s.id}`);
  for (const t of guides.TOPICS) add(t.verses, `topic ${t.id}`);
  // Screens quote these directly.
  refs.push({ ref: 'Hebrews 4:16', where: 'about/ics' }, { ref: '1 Samuel 7:12', where: 'ebenezer' });
  return refs;
}

test('every quoted reference exists in scripture.js', () => {
  for (const { ref, where } of collectRefs()) {
    assert.ok(getVerse(ref), `${where} quotes ${ref}, which is not in VERSES`);
  }
});

test('every default category has a Scripture warrant', () => {
  for (const c of DEFAULT_CATEGORIES) assert.ok(guides.CATEGORY_WARRANTS[c.id], c.id);
});

test('the four prayer methods are present and well formed', () => {
  assert.deepEqual(guides.METHODS.map((m) => m.id).sort(), ['acts', 'henry', 'list', 'lords-prayer']);
  for (const m of guides.METHODS) {
    assert.ok(m.name && m.steps.length, m.id);
    const ids = m.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${m.id} step ids unique`);
    for (const s of m.steps) {
      assert.ok(s.title, `${m.id}.${s.id} title`);
      if (s.wsc !== undefined) assert.ok(Number.isInteger(s.wsc) && s.wsc >= 1 && s.wsc <= 107, `${m.id}.${s.id} wsc`);
      if (s.prompts) assert.ok(Array.isArray(s.prompts));
    }
  }
  const lp = guides.getMethod('lords-prayer');
  assert.deepEqual(lp.steps.map((s) => s.wsc).filter(Boolean), [100, 101, 102, 103, 104, 105, 106, 107]);
  assert.equal(guides.getMethod('nonsense').id, 'lords-prayer');
});

test('every request lands in some step of each method', () => {
  const categories = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }));
  const custom = { id: 'custom1', name: 'Coworkers', order: 99 };
  const all = [...categories, custom];
  const requests = all.map((c) => ({ id: `r-${c.id}`, title: c.name, categoryId: c.id, status: 'active' }));
  for (const m of guides.METHODS) {
    const seen = new Set();
    for (const s of m.steps) for (const r of guides.assignRequestsToStep(s, requests, all, m) || []) seen.add(r.id);
    assert.equal(seen.size, requests.length, `${m.id} leaves some requests out`);
  }
});

function authoredStrings() {
  const out = [];
  const push = (s, where) => { if (typeof s === 'string') out.push({ s, where }); };
  for (const m of guides.METHODS) {
    push(m.name, m.id); push(m.short, m.id); push(m.description, m.id);
    for (const s of m.steps) {
      push(s.title, `${m.id}.${s.id}`); push(s.subtitle, `${m.id}.${s.id}`);
      (s.prompts || []).forEach((p) => push(p, `${m.id}.${s.id}`));
    }
  }
  for (const k of ['OPENING', 'CLOSING', 'LORDS_DAY']) { push(guides[k].title, k); push(guides[k].prompt, k); }
  for (const t of guides.TOPICS) {
    push(t.title, t.id); push(t.summary, t.id);
    (t.body || []).forEach((p) => push(p, t.id));
  }
  return out;
}

test('app-authored guide text uses no em or en dashes', () => {
  for (const { s, where } of authoredStrings()) {
    assert.ok(!/[–—]/.test(s), `${where}: ${s.slice(0, 80)}`);
  }
});

test('topics are complete', () => {
  const ids = guides.TOPICS.map((t) => t.id);
  for (const id of ['sovereignty', 'christ-name', 'spirit', 'scripture', 'lords-day', 'family', 'unanswered', 'confession', 'kingdom', 'secret']) {
    assert.ok(ids.includes(id), id);
  }
  for (const t of guides.TOPICS) {
    assert.ok(t.body.length >= 2, t.id);
    for (const n of t.wsc || []) assert.ok(n >= 1 && n <= 107, `${t.id} wsc ${n}`);
  }
});

// ---------- Westminster Standards ----------

test('the Shorter Catechism is whole', () => {
  assert.equal(WSC.length, 107);
  WSC.forEach((e, i) => {
    assert.equal(e.n, i + 1);
    assert.ok(e.q.endsWith('?'), `Q${e.n} question`);
    assert.ok(e.a.length > 5, `Q${e.n} answer`);
  });
  assert.match(WSC[0].a, /glorify God/);
  assert.match(WSC[97].q, /What is prayer/);
});

test('catechism helpers', () => {
  assert.equal(formatProofRef('Rom.11.36'), 'Romans 11:36');
  assert.equal(formatProofRef('Exod.20.4-Exod.20.6'), 'Exodus 20:4-6');
  const a = catechismOfTheDay(new Date(2026, 8, 26)).n;
  const b = catechismOfTheDay(new Date(2026, 8, 27)).n;
  assert.ok(a >= 1 && a <= 107);
  assert.equal(b, (a % 107) + 1);
});

test('the Confession chapter 21 and Larger Catechism on prayer are present', () => {
  assert.deepEqual(WCF_21.sections.map((s) => s.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(WCF_21.sections[2].text, /^Prayer,? with thanksgiving/);
  assert.deepEqual(WLC_PRAYER.map((q) => q.n), Array.from({ length: 19 }, (_, i) => 178 + i));
});

// ---------- Psalter and quotes ----------

test('psalms of the day cover the whole Psalter each month', () => {
  assert.deepEqual(psalmsForDay(new Date(2026, 8, 1)), [1, 31, 61, 91, 121]);
  assert.deepEqual(psalmsForDay(new Date(2026, 8, 30)), [30, 60, 90, 120, 150]);
  assert.deepEqual(psalmsForDay(new Date(2026, 9, 31)), [119]);
  const seen = new Set();
  for (let d = 1; d <= 30; d++) psalmsForDay(new Date(2026, 8, d)).forEach((p) => seen.add(p));
  assert.equal(seen.size, 150);
  assert.match(psalmUrl(23), /esv\.org\/Psalm\+23/);
});

test('quotes are public domain and well formed', () => {
  for (const q of QUOTES) {
    assert.ok(q.text && q.author && q.source, JSON.stringify(q));
    assert.ok(Number.isInteger(q.year) && q.year < 1929, `${q.author} ${q.year}`);
  }
  if (QUOTES.length) {
    const q = quoteOfTheDay(new Date(2026, 8, 26, 7));
    assert.equal(q, quoteOfTheDay(new Date(2026, 8, 26, 21)));
  }
});
