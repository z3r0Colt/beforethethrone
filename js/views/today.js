// Today: the home screen. It greets the reader, calls him to prayer first,
// and then sets out the day's requests, Scripture, psalms, and catechism,
// one quiet card at a time.

import {
  h, icon, renderScripture, pageTitle, emptyState, ornament, field, segmented, setTitle,
} from '../dom.js';
import { getState, setSetting, todaysRotation } from '../store.js';
import { dueToday, groupByCategory } from '../schedule.js';
import { dayKey, formatLong, isLordsDay, timeOfDayGreeting } from '../dates.js';
import { getVerse, verseOfTheDay } from '../data/scripture.js';
import { catechismOfTheDay } from '../data/catechism.js';
import { LORDS_DAY, getMethod } from '../data/guides.js';
import { psalmsForDay, psalmUrl, PSALM_PLAN_NOTE } from '../data/psalter.js';
import { QUOTES, quoteOfTheDay } from '../data/quotes.js';

// The segmented control uses short labels; the full names live in guides.js.
const METHOD_OPTIONS = [
  { value: 'lords-prayer', label: 'Lord’s Prayer' },
  { value: 'acts', label: 'ACTS' },
  { value: 'henry', label: 'Henry' },
  { value: 'list', label: 'My List' },
];

const MAX_TITLES = 6;

let idSeq = 0;
const nextId = (prefix) => `today-${prefix}-${++idSeq}`;

const plural = (n, one, many) => (n === 1 ? one : many);

function validMethod(id) {
  return METHOD_OPTIONS.some((o) => o.value === id) ? id : 'lords-prayer';
}

function prayHref(method) {
  return `#/pray?method=${encodeURIComponent(method)}`;
}

function sameDay(iso, key) {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && dayKey(d) === key;
}

// A card is a <section> named by its own heading.
function card(className, heading, ...children) {
  const id = nextId('h');
  heading.id = id;
  return h('section', { class: ['card', className], 'aria-labelledby': id }, heading, ...children);
}

export function render(main, { navigate } = {}) {
  setTitle('Today');

  // The method chosen here holds for this visit only. The saved default is
  // changed in Settings.
  let method = validMethod(getState().settings.method);
  let root = null;
  let stamp = '';

  const go = (path) => {
    if (typeof navigate === 'function') navigate(path);
    else location.hash = `#${path}`;
  };

  function focusTitle() {
    const title = root && root.querySelector('h1');
    if (title) title.focus({ preventScroll: false });
  }

  // ---------- greeting ----------

  function greeting(state, now) {
    const name = state.settings.name;
    const text = name ? `${timeOfDayGreeting(now)}, ${name}` : timeOfDayGreeting(now);
    const head = pageTitle(text, { subtitle: formatLong(now) });
    head.classList.add('today-head');
    const sub = head.querySelector('.page-subtitle');
    if (sub && isLordsDay(now)) {
      sub.append(' ', h('span', { class: 'badge badge-gold today-lords-badge' }, 'The Lord’s Day'));
    }
    return head;
  }

  // ---------- first run ----------

  function welcomeCard(state) {
    const hasRequests = state.requests.length > 0;
    const input = h('input', {
      class: 'input',
      type: 'text',
      name: 'given-name',
      autocomplete: 'given-name',
      autocapitalize: 'words',
      spellcheck: 'false',
      maxlength: '60',
      value: state.settings.name || '',
    });
    const finish = () => {
      setSetting('name', input.value);
      setSetting('onboarded', true);
    };
    const form = h('form', {
      class: 'today-welcome-form',
      novalidate: true,
      onSubmit: (e) => {
        e.preventDefault();
        finish();
        draw();
        focusTitle();
      },
    },
    field('Your first name (optional)', input, { hint: 'Used only to greet you. Like everything here, it stays on this device.' }),
    h('div', { class: 'card-actions' },
      h('button', {
        type: 'button',
        class: 'btn btn-primary',
        onClick: () => {
          finish();
          go('/requests/new');
        },
      }, icon('plus'), h('span', null, hasRequests ? 'Add a request' : 'Add your first request')),
      h('button', { type: 'submit', class: 'btn btn-ghost' }, 'Done')));

    return card('today-welcome',
      h('h2', { class: 'card-title' }, 'Welcome to Before the Throne'),
      h('p', null, 'This is a quiet place to bring your requests to God each day. It will lead you through prayer by the pattern Christ gave, with Scripture and the Shorter Catechism beside you.'),
      h('p', null, 'When the Lord answers, you can mark it and remember his kindness. Nothing you write ever leaves this device.'),
      form);
  }

  // ---------- the call to prayer ----------

  function prayCard() {
    const descId = nextId('method');
    const desc = h('p', { class: 'today-method-desc', id: descId, 'aria-live': 'polite' }, getMethod(method).short || '');
    const drawNear = h('a', {
      class: 'btn btn-primary btn-lg btn-block today-draw',
      href: prayHref(method),
      'aria-describedby': descId,
    }, icon('pray'), h('span', null, 'Draw near'));
    const seg = segmented({
      label: 'Way of prayer',
      options: METHOD_OPTIONS,
      value: method,
      className: 'today-seg',
      onChange: (value) => {
        method = validMethod(value);
        desc.textContent = getMethod(method).short || '';
        drawNear.setAttribute('href', prayHref(method));
      },
    });
    return card('today-pray',
      h('h2', { class: 'card-title today-pray-title' }, 'Come to the throne of grace'),
      seg,
      desc,
      drawNear,
      h('p', { class: 'hint today-pray-hint' },
        'This choice is for now only. ',
        h('a', { href: '#/settings' }, 'Set your usual way of prayer in Settings'),
        '.'));
  }

  // ---------- the Lord's Day ----------

  function lordsDayCard() {
    const verses = (LORDS_DAY.verses || []).map((ref) => renderScripture(getVerse(ref))).filter(Boolean);
    return card('today-lordsday',
      h('h2', { class: 'card-title' }, LORDS_DAY.title || 'The Lord’s Day'),
      verses.length ? h('div', { class: 'today-verses' }, verses) : null,
      LORDS_DAY.prompt ? h('p', { class: 'today-prompt' }, LORDS_DAY.prompt) : null);
  }

  // ---------- today's requests ----------

  function requestsCard(state, now, onboarding) {
    const key = dayKey(now);
    const title = h('h2', { class: 'card-title' }, 'Today’s requests');
    const hasPrayed = state.sessions.some((s) => s.date === key);
    const prayedLine = hasPrayed
      ? h('p', { class: 'today-prayed' }, icon('check'), h('span', null, 'You have come before the throne today.'))
      : null;
    const active = state.requests.filter((r) => r.status === 'active');

    if (!active.length) {
      const action = onboarding
        ? null
        : h('a', { class: 'btn btn-primary', href: '#/requests/new' }, icon('plus'), h('span', null, 'Add your first request'));
      return card('today-requests', title, prayedLine,
        emptyState({
          iconName: 'requests',
          title: 'No requests yet',
          text: 'Write down the people and needs you want to bring to the Lord. They will be waiting for you here each day.',
          action,
        }));
    }

    const due = dueToday(state, now, todaysRotation(now)).all;
    const actions = h('div', { class: 'card-actions' },
      h('a', { class: 'btn', href: '#/requests' }, h('span', null, 'All requests'), icon('next')),
      h('a', { class: 'btn btn-ghost', href: '#/requests/new' }, icon('plus'), h('span', null, 'Add a request')));

    if (!due.length) {
      return card('today-requests', title, prayedLine,
        h('p', { class: 'muted' }, 'Nothing is set for today. Your other requests are kept in your list, and you may bring anything to the Lord at any time.'),
        actions);
    }

    const shown = due.slice(0, MAX_TITLES);
    const more = due.length - shown.length;
    const groups = groupByCategory(shown, state.categories).map(({ category, requests }) => h('div', { class: 'today-req-group' },
      h('p', { class: 'today-req-cat' }, category.name),
      h('ul', { class: 'today-req-list' }, requests.map((r) => {
        const prayed = sameDay(r.lastPrayedAt, key);
        return h('li', { class: prayed ? 'is-prayed' : null },
          prayed ? icon('check', { className: 'today-req-mark' }) : h('span', { class: 'today-req-dot', 'aria-hidden': 'true' }),
          h('span', { class: 'today-req-title' }, r.title),
          prayed ? h('span', { class: 'visually-hidden' }, ' (prayed today)') : null);
      }))));

    const count = due.length === 1
      ? 'One request to bring before the Lord today'
      : `${due.length} requests to bring before the Lord today`;

    return card('today-requests', title,
      h('p', { class: 'today-req-count muted' }, count),
      prayedLine,
      h('div', { class: 'today-req-groups' }, groups),
      more > 0 ? h('p', { class: 'today-req-more muted small' }, `And ${more} more in today’s list.`) : null,
      actions);
  }

  // ---------- Scripture and psalms ----------

  function verseCard(now) {
    const verse = verseOfTheDay(now);
    const block = verse ? renderScripture(getVerse(verse.ref) || verse) : null;
    if (!block) return null;
    return card('today-verse', h('h2', { class: 'card-subtitle' }, 'Verse for today'), block);
  }

  function psalmsCard(now) {
    const psalms = psalmsForDay(now) || [];
    if (!psalms.length) return null;
    return card('today-psalms',
      h('h2', { class: 'card-title' }, 'Psalms for today'),
      h('ul', { class: 'today-psalm-list' }, psalms.map((n) => h('li', null,
        h('a', {
          class: 'chip today-psalm',
          href: psalmUrl(n),
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': `Psalm ${n}, opens esv.org in a new tab`,
        }, `Psalm ${n}`)))),
      PSALM_PLAN_NOTE ? h('p', { class: 'today-psalm-note muted small' }, PSALM_PLAN_NOTE) : null);
  }

  // ---------- catechism ----------

  function catechismCard(now) {
    const item = catechismOfTheDay(now);
    if (!item) return null;
    const answerId = nextId('answer');
    const answer = h('div', { class: 'today-wsc-answer', id: answerId, hidden: true }, h('p', { class: 'qa-a' }, item.a));
    const label = h('span', null, 'Show answer');
    const toggleBtn = h('button', {
      type: 'button',
      class: 'btn today-wsc-toggle',
      'aria-expanded': 'false',
      'aria-controls': answerId,
      onClick: () => {
        const open = toggleBtn.getAttribute('aria-expanded') !== 'true';
        toggleBtn.setAttribute('aria-expanded', String(open));
        answer.hidden = !open;
        label.textContent = open ? 'Hide answer' : 'Show answer';
      },
    }, label);
    return card('today-wsc',
      h('h2', { class: 'card-subtitle' }, `Shorter Catechism · Question ${item.n}`),
      h('div', { class: 'qa' },
        h('p', { class: 'qa-q' }, item.q),
        answer),
      h('div', { class: 'card-actions' },
        toggleBtn,
        h('a', { class: 'btn btn-ghost', href: `#/learn/wsc/${item.n}` }, h('span', null, `Study Question ${item.n}`), icon('next'))));
  }

  // ---------- quote ----------

  function quoteCard(now) {
    if (!Array.isArray(QUOTES) || !QUOTES.length) return null;
    const q = quoteOfTheDay(now);
    if (!q || !q.text) return null;
    return card('today-quote',
      h('h2', { class: 'card-subtitle' }, 'A word on prayer'),
      h('figure', { class: 'today-quote-figure' },
        h('blockquote', { class: 'today-quote-text' }, h('p', null, q.text)),
        h('figcaption', { class: 'today-quote-cite' },
          q.author || '',
          q.source ? [', ', h('cite', null, q.source)] : null,
          q.year ? ` (${q.year})` : null)));
  }

  // ---------- Ebenezer ----------

  function ebenezerLink(state) {
    const answered = state.requests.filter((r) => r.status === 'answered').length;
    if (!answered && !state.requests.length) return null;
    const titleId = nextId('eb');
    const title = answered
      ? `${answered} answered ${plural(answered, 'prayer', 'prayers')}`
      : 'Your Ebenezer';
    const sub = answered
      ? 'Remember how the Lord has helped you.'
      : 'When the Lord answers a prayer, mark it answered and remember his help here.';
    return h('section', { class: 'today-ebenezer-wrap', 'aria-labelledby': titleId },
      h('a', { class: 'card today-ebenezer', href: '#/ebenezer' },
        h('span', { class: 'today-eb-icon' }, icon('ebenezer')),
        h('div', { class: 'today-eb-text' },
          h('h2', { class: 'today-eb-title', id: titleId }, title),
          h('span', { class: 'today-eb-sub muted' }, sub)),
        icon('next', { className: 'today-eb-chev' })));
  }

  // ---------- page ----------

  function build(now) {
    const state = getState();
    const s = state.settings;
    const onboarding = !s.onboarded;
    return h('div', { class: 'view-today' },
      greeting(state, now),
      onboarding ? welcomeCard(state) : null,
      prayCard(),
      isLordsDay(now) ? lordsDayCard() : null,
      requestsCard(state, now, onboarding),
      ornament(),
      verseCard(now),
      psalmsCard(now),
      s.showCatechism ? catechismCard(now) : null,
      s.showQuote ? quoteCard(now) : null,
      ebenezerLink(state));
  }

  function draw() {
    const now = new Date();
    stamp = `${dayKey(now)}|${timeOfDayGreeting(now)}`;
    const next = build(now);
    if (root && root.parentNode) root.replaceWith(next);
    else main.append(next);
    root = next;
  }

  draw();

  // If the app sits open past midnight, or from morning into evening, bring
  // the page up to date when the reader returns to it. Never while typing.
  const onVisible = () => {
    if (document.hidden || !root || !root.isConnected) return;
    const now = new Date();
    if (`${dayKey(now)}|${timeOfDayGreeting(now)}` === stamp) return;
    const active = document.activeElement;
    if (active && root.contains(active) && active.matches('input, textarea')) return;
    draw();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    document.removeEventListener('visibilitychange', onVisible);
  };
}
