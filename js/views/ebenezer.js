// Ebenezer: the answered prayers, kept as stones of help (1 Samuel 7:12).
// Serves #/ebenezer.

import {
  h, icon, pageTitle, emptyState, ornament, toast, openSheet, confirmDialog,
  field, setTitle, renderScripture,
} from '../dom.js';
import { getState, subscribe, setStatus, markAnswered, deleteRequest, updateRequest } from '../store.js';
import { daysBetween, formatShort } from '../dates.js';
import { parseHash } from '../router.js';
import { getVerse } from '../data/scripture.js';

const PATH = '/ebenezer';
const YEAR_FILTER_MIN = 6;   // show the year chips once there are this many stones
const LONG_NOTE = 420;       // notes longer than this start folded

// ---------- helpers ----------

function stones(n) {
  return `${n} ${n === 1 ? 'stone' : 'stones'} of help`;
}

function time(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function answeredYear(r) {
  const d = new Date(r.answeredAt || r.updatedAt || r.createdAt);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function categoryName(id, state) {
  const c = state.categories.find((x) => x.id === id);
  return c ? c.name : 'Uncategorized';
}

// How long the Lord's answer was in coming: "the same day", "after 18 days".
export function howLong(askedIso, answeredIso) {
  const a = new Date(askedIso);
  const b = new Date(answeredIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
  const days = daysBetween(a, b);
  if (days <= 0) return 'the same day';
  if (days === 1) return 'the next day';
  if (days < 60) return `after ${days} days`;
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  if (months < 2) return `after ${days} days`;
  if (months < 24) return `after ${months} months`;
  return `after ${Math.floor(months / 12)} years`;
}

function answeredList(state) {
  return state.requests
    .filter((r) => r.status === 'answered')
    .sort((a, b) => time(b.answeredAt) - time(a.answeredAt) || time(b.createdAt) - time(a.createdAt));
}

// Sheets opened here are closed if the user leaves the page with one open.
const openDialogs = new Set();

function track(dialog) {
  if (!dialog) return;
  openDialogs.add(dialog);
  dialog.addEventListener('close', () => openDialogs.delete(dialog), { once: true });
}

function closeDialogs() {
  for (const dialog of openDialogs) {
    if (dialog.isConnected) dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  }
  openDialogs.clear();
}

function confirmTracked(options) {
  const promise = confirmDialog(options);
  const dialogs = document.querySelectorAll('dialog.sheet');
  track(dialogs[dialogs.length - 1]);
  return promise;
}

// ---------- view ----------

export function render(main, { query } = {}) {
  setTitle('Ebenezer');
  const view = { year: typeof query?.year === 'string' ? query.year : '' };
  const expanded = new Set(); // ids of long notes the user unfolded

  const root = h('div', { class: 'view-ebenezer' });
  const head = pageTitle('Ebenezer');
  const verse = getVerse('1 Samuel 7:12');
  const hero = h('section', { class: 'card eb-hero', 'aria-label': 'What an Ebenezer is' },
    renderScripture(verse, { className: 'eb-hero-verse' }),
    h('p', { class: 'eb-hero-text' },
      'An Ebenezer is a stone of help, set up so God’s people would remember what the Lord had done for them. ',
      'Each answered prayer kept here is such a stone, a witness to his faithful care.'));

  const body = h('div', { class: 'eb-body' });
  const announcer = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
  root.append(head, hero, body, announcer);
  main.append(root);

  function writeQuery() {
    const target = view.year ? `#${PATH}?year=${encodeURIComponent(view.year)}` : `#${PATH}`;
    if (parseHash(location.hash).path === PATH && location.hash !== target) {
      history.replaceState(history.state, '', target);
    }
  }

  function draw() {
    const state = getState();
    const all = answeredList(state);
    body.replaceChildren();

    if (!all.length) {
      view.year = '';
      writeQuery();
      const hasRequests = state.requests.some((r) => r.status === 'active');
      body.append(h('div', { class: 'card eb-empty' }, emptyState({
        iconName: 'ebenezer',
        title: 'No stones set up yet',
        text: hasRequests
          ? 'When the Lord answers one of your requests, open it on your prayer list and mark it answered. It will be set here so you can remember his help in the days to come.'
          : 'Bring your needs to the Lord in prayer. When he answers, mark the request answered and it will be set here so you can remember his help in the days to come.',
        action: h('a', { class: 'btn btn-primary', href: '#/requests' }, icon('requests'), 'Go to Prayer Requests'),
      })));
      return;
    }

    // Years, newest first, for the optional filter.
    const years = [...new Set(all.map(answeredYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const showYears = all.length >= YEAR_FILTER_MIN && years.length > 1;
    if (!showYears || !years.includes(view.year)) view.year = '';
    writeQuery();
    const shown = view.year ? all.filter((r) => answeredYear(r) === view.year) : all;

    const countId = 'eb-count';
    body.append(ornament(),
      h('h2', { class: 'eb-count', id: countId, tabindex: '-1' },
        view.year ? `${stones(shown.length)} in ${view.year}` : stones(all.length)));

    if (showYears) {
      const chips = h('div', { class: 'chips eb-years', role: 'group', 'aria-label': 'Show answers by year' });
      const chip = (value, label, n) => h('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(view.year === value),
        onClick: () => {
          if (view.year === value) return;
          view.year = value;
          draw();
          const n = body.querySelectorAll('.eb-card').length;
          announcer.textContent = value ? `${stones(n)} shown for ${value}` : `All ${stones(n)} shown`;
          const again = body.querySelector(`.eb-years .chip[data-value="${value || 'all'}"]`);
          if (again) again.focus();
        },
        'data-value': value || 'all',
      }, h('span', null, label), h('span', { class: 'count' }, String(n)));
      chips.append(chip('', 'All years', all.length));
      for (const y of years) chips.append(chip(y, y, all.filter((r) => answeredYear(r) === y).length));
      body.append(chips);
    }

    const list = h('ol', { class: 'eb-list', 'aria-labelledby': countId });
    shown.forEach((r) => list.append(h('li', null, stoneCard(r, state))));
    body.append(list);
  }

  // Moves focus to a sensible place after a card leaves the list.
  function focusNear(index) {
    const titles = body.querySelectorAll('.eb-title');
    const target = titles[Math.min(index, titles.length - 1)]
      || body.querySelector('.eb-count')
      || body.querySelector('.empty-title')
      || root.querySelector('h1');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }

  function indexOf(id) {
    return [...body.querySelectorAll('.eb-card')].findIndex((el) => el.dataset.id === id);
  }

  let seq = 0;
  function stoneCard(r, state) {
    const n = ++seq;
    const titleId = `eb-t-${n}`;
    const note = (r.answerNote || '').trim();
    const long = note.length > LONG_NOTE;
    const isOpen = expanded.has(r.id);
    const after = howLong(r.createdAt, r.answeredAt);

    const editBtn = h('button', {
      type: 'button',
      class: 'btn btn-ghost eb-edit-note',
      'aria-describedby': titleId,
      onClick: () => editNote(r),
    }, icon('edit'), note ? 'Edit note' : 'Add a note');

    let noteEl;
    if (note) {
      const noteId = `eb-n-${n}`;
      const text = h('p', { class: ['eb-note', long && !isOpen ? 'is-folded' : null], id: noteId }, note);
      noteEl = h('div', { class: 'eb-note-wrap' },
        h('span', { class: 'visually-hidden' }, 'How the Lord answered'),
        h('div', { class: 'eb-note-box' }, text),
        h('div', { class: 'eb-note-tools' },
          long ? h('button', {
            type: 'button',
            class: 'btn btn-ghost eb-more',
            'aria-expanded': String(isOpen),
            'aria-controls': noteId,
            onClick: (e) => {
              const open = !expanded.has(r.id);
              if (open) expanded.add(r.id); else expanded.delete(r.id);
              text.classList.toggle('is-folded', !open);
              e.currentTarget.setAttribute('aria-expanded', String(open));
              e.currentTarget.textContent = open ? 'Show less' : 'Show all';
            },
          }, isOpen ? 'Show less' : 'Show all') : null,
          editBtn));
    } else {
      noteEl = h('div', { class: 'eb-note-wrap' },
        h('p', { class: 'eb-note-empty' }, 'No note was written about how the Lord answered.'),
        h('div', { class: 'eb-note-tools' }, editBtn));
    }

    return h('article', { class: 'card eb-card', 'aria-labelledby': titleId, 'data-id': r.id },
      h('h3', { class: 'eb-title', id: titleId }, r.title),
      h('p', { class: 'card-subtitle eb-cat' }, categoryName(r.categoryId, state)),
      h('p', { class: 'eb-dates' },
        h('span', { class: 'eb-dates-inner' },
          h('span', { class: 'eb-part' }, `Asked ${formatShort(r.createdAt)}`),
          h('span', { class: 'eb-part' }, h('span', { class: 'visually-hidden' }, ', '), `Answered ${formatShort(r.answeredAt)}`),
          after ? h('span', { class: 'eb-part eb-after' }, h('span', { class: 'visually-hidden' }, ', '), after) : null)),
      noteEl,
      h('div', { class: 'card-actions eb-actions' },
        h('button', {
          type: 'button',
          class: 'btn eb-again',
          'aria-describedby': titleId,
          onClick: () => prayAgain(r),
        }, icon('restore'), 'Pray for this again'),
        h('button', {
          type: 'button',
          class: 'btn btn-ghost eb-delete',
          'aria-describedby': titleId,
          onClick: () => remove(r),
        }, icon('trash'), 'Delete')));
  }

  function prayAgain(r) {
    const index = indexOf(r.id);
    const answeredAt = r.answeredAt;
    const answerNote = r.answerNote;
    setStatus(r.id, 'active');
    focusNear(index);
    toast((answerNote || '').trim() ? 'Back on your prayer list. Your note is kept with it.' : 'Back on your prayer list.', {
      action: {
        label: 'Undo',
        onClick: () => {
          const still = getState().requests.find((x) => x.id === r.id);
          if (still && still.status === 'active') markAnswered(r.id, answerNote, answeredAt);
        },
      },
    });
  }

  function editNote(r) {
    const input = h('textarea', {
      class: 'textarea eb-note-input', rows: '6', maxlength: '5000', autocapitalize: 'sentences', value: r.answerNote || '',
    });
    const handle = openSheet({
      title: r.answerNote ? 'Edit your note' : 'Add a note',
      className: 'eb-note-sheet',
      body: (el) => {
        el.append(
          h('p', { class: 'eb-sheet-for' }, r.title),
          field('How did the Lord answer?', input, { hint: 'Write it plainly, so you will remember his kindness when you read it again.' }),
        );
      },
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Save note',
          variant: 'primary',
          onClick: (close) => {
            const current = getState().requests.find((x) => x.id === r.id);
            if (!current) { close(); return; }
            try {
              updateRequest(r.id, { answerNote: input.value.trim() });
            } catch (error) {
              toast(error.message || 'Could not save the note.');
              return;
            }
            close();
            const card = [...body.querySelectorAll('.eb-card')].find((el) => el.dataset.id === r.id);
            const again = card && card.querySelector('.eb-edit-note');
            if (again) again.focus();
            toast('Note saved.');
          },
        },
      ],
    });
    track(handle.dialog);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  async function remove(r) {
    const ok = await confirmTracked({
      title: 'Delete this answered prayer?',
      message: `“${r.title}” and the note about its answer will be removed from this device. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const index = indexOf(r.id);
    deleteRequest(r.id);
    focusNear(index);
    toast('Deleted.');
  }

  draw();
  const unsubscribe = subscribe(() => {
    // Keep the page in step with changes made here, by Undo, or in another tab.
    if (parseHash(location.hash).path === PATH) draw();
  });

  return () => {
    unsubscribe();
    closeDialogs();
  };
}
