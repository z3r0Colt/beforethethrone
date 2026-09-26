// Settings and About. Every change is saved the moment it is made, so there
// is no Save button. About holds the app's purpose, notices, and thanks.

import {
  h, icon, renderScripture, pageTitle, backLink, ornament, toast, confirmDialog,
  field, segmented, toggle, downloadFile, setTitle,
} from '../dom.js';
import { getState, setSetting, replaceState, resetAll } from '../store.js';
import { formatShort } from '../dates.js';
import { buildReminderICS } from '../ics.js';
import { exportBackup, backupFilename, parseBackup, readFileAsText, MAX_BACKUP_BYTES } from '../backup.js';
import { canPromptInstall, promptInstall, onInstallableChange, isIOS, isStandalone } from '../install.js';
import { APP_VERSION } from '../version.js';
// Data modules are read through namespaces so a renamed export degrades
// gracefully instead of breaking the whole page.
import * as scripture from '../data/scripture.js';
import * as catechism from '../data/catechism.js';
import * as standards from '../data/standards.js';
import * as quotes from '../data/quotes.js';
import * as guides from '../data/guides.js';

const METHOD_OPTIONS = [
  { value: 'lords-prayer', label: 'Lord’s Prayer' },
  { value: 'acts', label: 'ACTS' },
  { value: 'henry', label: 'Henry' },
  { value: 'list', label: 'My List' },
];

const THEME_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TEXT_SIZE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'larger', label: 'Larger' },
];

const MIN_ROTATION = 1;
const MAX_ROTATION = 20;
const MAX_TIMES = 8;
// Offered in turn when the reader adds a reminder time.
const SUGGESTED_TIMES = ['06:30', '21:00', '12:00', '18:00', '07:00', '13:00', '17:30', '22:00', '05:30', '08:00'];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

let idSeq = 0;
const nextId = (prefix) => `settings-${prefix}-${++idSeq}`;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "06:30" -> "6:30 AM" in the reader's own clock style.
function formatTime(value) {
  const m = TIME_RE.exec(String(value || ''));
  if (!m) return value || '';
  const d = new Date(2000, 0, 1, Number(m[1]), Number(value.slice(3, 5)));
  try {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return value;
  }
}

// A titled group of settings. The card holds rows separated by hairlines.
function section(title, ...children) {
  const id = nextId('sec');
  return h('section', { class: 'section settings-section', 'aria-labelledby': id },
    h('h2', { class: 'section-title', id }, title),
    ...children);
}

const item = (...children) => h('div', { class: 'settings-item' }, ...children);

// A segmented control with a visible label and an optional hint. The
// group is named by the visible label rather than a duplicate aria-label.
function segField(labelText, seg, hintText) {
  const id = nextId('lbl');
  seg.removeAttribute('aria-label');
  seg.setAttribute('aria-labelledby', id);
  const hint = hintText !== undefined ? h('p', { class: 'hint', id: `${id}-hint` }, hintText) : null;
  if (hint) seg.setAttribute('aria-describedby', hint.id);
  return { el: h('div', { class: 'field settings-seg' }, h('p', { class: 'label', id }, labelText), seg, hint), hint };
}

function methodHint(id) {
  const method = typeof guides.getMethod === 'function' ? guides.getMethod(id) : null;
  const short = method && method.short ? `${method.short}. ` : '';
  return `${short}Today opens with this way of praying, and you can still choose another there.`;
}

// ====================================================================
// Settings page
// ====================================================================

function renderSettings(main, go) {
  setTitle('Settings');
  const settings = getState().settings;
  const cleanups = [];

  // ---------- You ----------

  const nameInput = h('input', {
    type: 'text',
    class: 'input',
    value: settings.name,
    maxlength: '60',
    autocomplete: 'given-name',
    autocapitalize: 'words',
    spellcheck: 'false',
    enterkeyhint: 'done',
    placeholder: 'Optional',
  });
  let nameTimer = null;
  const saveName = () => {
    clearTimeout(nameTimer);
    nameTimer = null;
    setSetting('name', nameInput.value);
  };
  nameInput.addEventListener('input', () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(saveName, 400);
  });
  nameInput.addEventListener('change', saveName);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); nameInput.blur(); }
  });
  cleanups.push(() => { if (nameTimer) saveName(); });

  const youSection = section('You',
    h('div', { class: 'card settings-card' },
      item(field('Your first name', nameInput, { hint: 'Used only to greet you on Today. It never leaves this device.' }))));

  // ---------- Prayer ----------

  const method = segField('Default way to pray', segmented({
    label: 'Default way to pray',
    options: METHOD_OPTIONS,
    value: settings.method,
    onChange: (v) => {
      setSetting('method', v);
      method.hint.textContent = methodHint(v);
    },
  }), methodHint(settings.method));
  method.el.classList.add('settings-seg-method');

  const rotationField = rotationStepper(settings.rotationCount);

  const prayerSection = section('Prayer',
    h('div', { class: 'card settings-card' },
      item(method.el),
      item(rotationField),
      item(toggle('Catechism on Today', {
        checked: settings.showCatechism,
        hint: 'A question from the Shorter Catechism each day. It serves well for family worship.',
        onChange: (v) => setSetting('showCatechism', v),
      })),
      item(toggle('A word on prayer on Today', {
        checked: settings.showQuote,
        hint: 'A short saying on prayer from an older writer, such as J. C. Ryle.',
        onChange: (v) => setSetting('showQuote', v),
      }))));

  // ---------- Appearance ----------

  const theme = segField('Theme', segmented({
    label: 'Theme',
    options: THEME_OPTIONS,
    value: settings.theme,
    onChange: (v) => setSetting('theme', v),
  }), 'Auto follows the setting on your device.');

  const textSize = segField('Text size', segmented({
    label: 'Text size',
    options: TEXT_SIZE_OPTIONS,
    value: settings.textSize,
    onChange: (v) => setSetting('textSize', v),
  }), 'Changes the size of the words across the whole app.');

  const appearanceSection = section('Appearance',
    h('div', { class: 'card settings-card' }, item(theme.el), item(textSize.el)));

  // ---------- Reminders, Install, Your data ----------

  const reminders = remindersSection();
  const install = installSection();
  cleanups.push(install.cleanup);

  const root = h('div', { class: 'view-settings' },
    pageTitle('Settings', { subtitle: 'Changes are saved as you make them.' }),
    youSection,
    prayerSection,
    appearanceSection,
    reminders,
    install.el,
    dataSection(go),
    h('nav', { class: 'section settings-section', 'aria-label': 'More' },
      h('ul', { class: 'list settings-links' },
        h('li', null,
          h('a', { class: 'list-item', href: '#/settings/about' },
            icon('info', { className: 'settings-link-icon' }),
            h('span', { class: 'grow' },
              h('span', { class: 'item-title' }, 'About Before the Throne'),
              h('span', { class: 'meta' }, `Version ${APP_VERSION} and sources`)),
            icon('next', { className: 'chev' }))))));

  main.append(root);
  return () => cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
}

// ---------- rotation count stepper ----------

function rotationStepper(initial) {
  const input = h('input', {
    type: 'number',
    class: 'input settings-number',
    inputmode: 'numeric',
    min: String(MIN_ROTATION),
    max: String(MAX_ROTATION),
    step: '1',
    value: String(initial),
  });
  const less = h('button', { type: 'button', class: 'icon-btn settings-step', 'aria-label': 'Fewer rotating requests' },
    h('span', { 'aria-hidden': 'true' }, '−'));
  const more = h('button', { type: 'button', class: 'icon-btn settings-step', 'aria-label': 'More rotating requests' },
    icon('plus'));

  const current = () => getState().settings.rotationCount;
  const sync = (n) => {
    less.disabled = n <= MIN_ROTATION;
    more.disabled = n >= MAX_ROTATION;
  };
  const commit = (n) => {
    const saved = setSetting('rotationCount', n);
    input.value = String(saved);
    input.removeAttribute('aria-invalid');
    sync(saved);
    return saved;
  };
  const parse = () => {
    const raw = input.value.trim();
    return /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;
  };

  // Save as soon as the typed number is sensible. Anything else waits for
  // the reader to leave the box, then snaps back into range.
  input.addEventListener('input', () => {
    const n = parse();
    if (n >= MIN_ROTATION && n <= MAX_ROTATION) {
      setSetting('rotationCount', n);
      input.removeAttribute('aria-invalid');
      sync(n);
    } else {
      input.setAttribute('aria-invalid', 'true');
    }
  });
  input.addEventListener('change', () => {
    const n = parse();
    commit(Number.isFinite(n) ? n : current());
  });
  less.addEventListener('click', () => commit(current() - 1));
  more.addEventListener('click', () => commit(current() + 1));
  sync(initial);

  const f = field('Rotating requests each day', input, {
    hint: 'Requests set to Rotation take turns, so a long list stays light. This many come up each day, beginning with the ones you prayed for least recently.',
  });
  // Put the buttons on either side of the number, keeping label and hint in place.
  const stepper = h('div', { class: 'settings-stepper' });
  input.replaceWith(stepper);
  stepper.append(less, input, more);
  return f;
}

// ---------- reminders ----------

function remindersSection() {
  let times = [...getState().settings.reminderTimes];
  let stale = false;

  const listEl = h('ul', { class: 'settings-times' });
  const emptyEl = h('p', { class: 'muted settings-times-empty' }, 'You have no daily prayer times yet.');
  const dupError = h('p', { class: 'error-text', hidden: true }, 'Two reminders share the same time. Only one will be kept.');
  const limitHint = h('p', { class: 'hint', hidden: true }, 'Eight times a day is the most you can set.');
  const addBtn = h('button', { type: 'button', class: 'btn settings-add-time', onClick: addTime }, icon('plus'), 'Add a time');
  const staleNote = h('p', { class: 'settings-stale', hidden: true, role: 'status' },
    'Your reminders have changed. Add them to your calendar again to keep it up to date.');

  const markStale = () => {
    stale = true;
    staleNote.hidden = false;
  };

  function save() {
    setSetting('reminderTimes', times.filter((t) => TIME_RE.test(t)));
    markStale();
    checkDuplicates();
  }

  function checkDuplicates() {
    const seen = new Set();
    let dup = false;
    listEl.querySelectorAll('input[type="time"]').forEach((input) => {
      const v = input.value;
      if (v && seen.has(v)) {
        dup = true;
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
      if (v) seen.add(v);
    });
    dupError.hidden = !dup;
  }

  function syncFromStore() {
    times = [...getState().settings.reminderTimes];
  }

  function renderRows() {
    listEl.replaceChildren();
    times.forEach((t, i) => {
      const id = nextId('time');
      const input = h('input', { type: 'time', class: 'input settings-time-input', id, value: t, step: '60' });
      const removeBtn = h('button', {
        type: 'button',
        class: 'icon-btn settings-time-remove',
        'aria-label': `Remove the ${formatTime(t)} reminder`,
        onClick: () => removeAt(i),
      }, icon('close'));
      const onEdit = () => {
        if (times[i] === input.value) return;
        times[i] = input.value;
        removeBtn.setAttribute('aria-label', input.value ? `Remove the ${formatTime(input.value)} reminder` : 'Remove this reminder');
        save();
      };
      input.addEventListener('change', onEdit);
      input.addEventListener('input', onEdit);
      listEl.append(h('li', { class: 'settings-time-row' },
        h('label', { class: 'visually-hidden', for: id }, `Prayer time ${i + 1}`),
        icon('bell', { className: 'settings-time-icon' }),
        input,
        removeBtn));
    });
    listEl.hidden = times.length === 0;
    emptyEl.hidden = times.length > 0;
    addBtn.disabled = times.length >= MAX_TIMES;
    limitHint.hidden = times.length < MAX_TIMES;
    checkDuplicates();
  }

  function removeAt(i) {
    const removed = times[i];
    times.splice(i, 1);
    save();
    syncFromStore();
    renderRows();
    const buttons = listEl.querySelectorAll('.settings-time-remove');
    const next = buttons[Math.min(i, buttons.length - 1)];
    (next || addBtn).focus();
    if (TIME_RE.test(removed || '')) {
      toast(`Removed the ${formatTime(removed)} reminder.`, {
        action: {
          label: 'Undo',
          onClick: () => {
            const cur = getState().settings.reminderTimes;
            if (cur.length >= MAX_TIMES || cur.includes(removed)) return;
            setSetting('reminderTimes', [...cur, removed]);
            if (listEl.isConnected) {
              markStale();
              syncFromStore();
              renderRows();
            }
          },
        },
      });
    }
  }

  function addTime() {
    if (times.length >= MAX_TIMES) return;
    const have = new Set(times);
    const t = SUGGESTED_TIMES.find((x) => !have.has(x)) || '12:00';
    times.push(t);
    save();
    syncFromStore();
    renderRows();
    const inputs = [...listEl.querySelectorAll('input[type="time"]')];
    const added = inputs.find((el) => el.value === t) || inputs[inputs.length - 1];
    if (added) added.focus();
    if (addBtn.disabled) limitHint.hidden = false;
  }

  function downloadCalendar() {
    const s = getState().settings;
    if (!s.reminderTimes.length && !s.lordsDayReminder) {
      toast('Add a prayer time first.');
      return;
    }
    const text = buildReminderICS({
      times: s.reminderTimes,
      lordsDayReminder: s.lordsDayReminder,
      appUrl: location.href.split('#')[0],
    });
    downloadFile('prayer-reminders.ics', text, 'text/calendar');
    stale = false;
    staleNote.hidden = true;
    toast('Calendar file saved. Open it to add your reminders.');
  }

  renderRows();

  const legendId = nextId('lg');
  const calHintId = nextId('hint');
  return section('Reminders',
    h('div', { class: 'card settings-card' },
      item(
        h('fieldset', { class: 'settings-fieldset' },
          h('legend', { class: 'label', id: legendId }, 'Daily prayer times'),
          emptyEl,
          listEl,
          dupError,
          h('div', { class: 'settings-add-row' }, addBtn),
          limitHint)),
      item(toggle('Lord’s Day preparation', {
        checked: getState().settings.lordsDayReminder,
        hint: 'A reminder on Saturday evening at 7:30 to prepare your heart and your household for worship.',
        onChange: (v) => { setSetting('lordsDayReminder', v); markStale(); },
      })),
      item(
        staleNote,
        h('button', {
          type: 'button',
          class: 'btn btn-primary btn-block settings-calendar',
          'aria-describedby': calHintId,
          onClick: downloadCalendar,
        }, icon('calendar'), 'Add reminders to my calendar'),
        h('p', { class: 'hint', id: calHintId },
          'A web app cannot ring an alarm by itself when it is closed, so your phone’s calendar will remind you instead. Open the file this button saves to add the reminders. If you change your times, remove the old reminders from your calendar and import the new file again.'))));
}

// ---------- install ----------

function installSection() {
  const body = h('div', { class: 'settings-install' });

  const paint = () => {
    body.replaceChildren();
    if (isStandalone()) {
      body.append(h('p', { class: 'settings-note settings-installed' },
        icon('check', { className: 'settings-note-icon' }),
        h('span', null, 'Before the Throne is installed on this device.')));
    } else if (canPromptInstall()) {
      body.append(
        h('p', null, 'Install Before the Throne on this device. It will open from your home screen like any other app and work without an internet connection.'),
        h('button', {
          type: 'button',
          class: 'btn btn-primary settings-install-btn',
          onClick: async () => {
            const outcome = await promptInstall();
            if (outcome === 'accepted') toast('Before the Throne is being added to your device.');
            paint();
          },
        }, icon('install'), 'Install app'));
    } else if (isIOS()) {
      body.append(
        h('p', null, 'To install on iPhone or iPad, open this page in Safari. Tap the ',
          h('strong', null, 'Share'), ' button, and then choose ',
          h('strong', null, 'Add to Home Screen'), '.'),
        h('p', { class: 'hint' }, 'Once installed, it opens like any other app and works without an internet connection.'));
    } else {
      body.append(h('p', null, 'Your browser can add this app to your home screen or desktop from its menu. Once installed, it opens like any other app and works without an internet connection.'));
    }
  };

  paint();
  const off = onInstallableChange(() => { if (body.isConnected) paint(); });
  return {
    el: section('Install', h('div', { class: 'card settings-card' }, item(body))),
    cleanup: off,
  };
}

// ---------- your data ----------

function dataSection(go) {
  const state = getState();
  const fileInput = h('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'visually-hidden',
    tabindex: '-1',
    'aria-hidden': 'true',
  });

  function exportNow() {
    const text = JSON.stringify(exportBackup(getState()), null, 2);
    downloadFile(backupFilename(), text, 'application/json');
    toast('Backup saved. Keep it somewhere safe.');
  }

  async function importFile(file) {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      toast('That file is too large to be a Before the Throne backup.');
      return;
    }
    let text;
    try {
      text = await readFileAsText(file);
    } catch {
      toast('That file could not be read. Choose a backup file made by this app.');
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    const counts = result.counts || { requests: result.state.requests.length, journal: result.state.journal.length };
    const made = result.exportedAt ? new Date(result.exportedAt) : null;
    const when = made && !Number.isNaN(made.getTime()) ? ` from ${formatShort(made)}` : '';
    const ok = await confirmDialog({
      title: 'Replace everything on this device?',
      message: `This backup${when} holds ${plural(counts.requests, 'prayer request', 'prayer requests')} and ${plural(counts.journal, 'journal entry', 'journal entries')}. Restoring it will replace everything now on this device.`,
      confirmLabel: 'Replace',
      danger: true,
    });
    if (!ok) return;
    replaceState(result.state);
    toast('Your backup has been restored.');
    go('/settings');
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    // Clear the picker so choosing the same file again still fires.
    fileInput.value = '';
    importFile(file).catch((e) => {
      console.error(e);
      toast('That backup could not be restored.');
    });
  });

  async function eraseAll() {
    const first = await confirmDialog({
      title: 'Erase all data?',
      message: 'This removes all your requests and journal entries from this device, along with your settings. Unless you have a backup, they cannot be brought back.',
      confirmLabel: 'Continue',
    });
    if (!first) return;
    const second = await confirmDialog({
      title: 'Erase everything now?',
      message: 'Once erased, your prayers and notes are gone from this device for good.',
      confirmLabel: 'Erase everything',
      danger: true,
    });
    if (!second) return;
    resetAll();
    toast('All data has been erased from this device.');
    go('/today');
  }

  const summary = `This device holds ${plural(state.requests.length, 'prayer request', 'prayer requests')} and ${plural(state.journal.length, 'journal entry', 'journal entries')}.`;

  const eraseHintId = nextId('hint');
  return section('Your data',
    h('div', { class: 'card settings-card' },
      item(
        h('p', { class: 'settings-note' },
          icon('check', { className: 'settings-note-icon' }),
          h('span', null, 'Everything you keep here stays on this device. Nothing is sent anywhere.')),
        h('p', { class: 'muted small settings-summary' }, summary)),
      item(
        h('div', { class: 'settings-buttons' },
          h('button', { type: 'button', class: 'btn', onClick: exportNow }, icon('download'), 'Export backup'),
          h('button', { type: 'button', class: 'btn', onClick: () => fileInput.click() }, icon('upload'), 'Import backup'),
          fileInput),
        h('p', { class: 'hint' }, 'Export a backup now and then and keep it somewhere safe, such as your email or a cloud drive. If this phone is lost or its storage is cleared, a backup is how your prayers come back.')),
      item(
        h('button', { type: 'button', class: 'btn btn-danger', 'aria-describedby': eraseHintId, onClick: eraseAll }, icon('trash'), 'Erase all data'),
        h('p', { class: 'hint', id: eraseHintId }, 'Removes everything from this device. Export a backup first if you may want it later.'))));
}

// ====================================================================
// About page
// ====================================================================

function quoteWorks() {
  const list = Array.isArray(quotes.QUOTES) ? quotes.QUOTES : [];
  const seen = new Map();
  for (const q of list) {
    if (!q || !q.source) continue;
    const key = `${q.author}|${q.source}`;
    if (!seen.has(key)) seen.set(key, q);
  }
  return [...seen.values()];
}

function renderAbout(main) {
  setTitle('About');
  const verse = typeof scripture.getVerse === 'function' ? scripture.getVerse('Hebrews 4:16') : null;
  const standardsNote = standards.STANDARDS_SOURCE_NOTE || catechism.WSC_SOURCE_NOTE || '';
  const works = quoteWorks();

  const head = pageTitle('Before the Throne', { subtitle: `Version ${APP_VERSION}` });
  head.classList.add('about-hero');
  head.prepend(h('img', { class: 'about-mark', src: './icons/icon.svg', alt: '', width: '72', height: '72' }));

  const root = h('div', { class: 'view-settings view-settings-about' },
    backLink('#/settings', 'Settings'),
    head,
    verse ? h('div', { class: 'about-verse' }, renderScripture(verse)) : null,

    h('section', { class: 'section about-section', 'aria-labelledby': 'about-purpose' },
      h('h2', { class: 'about-heading', id: 'about-purpose' }, 'Why this app'),
      h('div', { class: 'about-prose' },
        h('p', null, 'Before the Throne is a quiet companion for your daily prayer. It helps you come to your Father in heaven in the name of Christ, by the help of his Spirit, and bring your requests to him in good order. It follows the pattern of the Lord’s Prayer as the Westminster Standards teach it. It also keeps a record of the prayers God has answered, so that you can remember his kindness.'),
        h('p', null, 'Prayer is one of the ordinary means God uses to bless his people. No app can make you pray, and this one does not try to measure your devotion. It only hopes to clear a path, so that on busy days and weary ones you may still draw near with confidence and find grace to help in time of need.'))),

    h('section', { class: 'section about-section', 'aria-labelledby': 'about-privacy' },
      h('h2', { class: 'about-heading', id: 'about-privacy' }, 'Your privacy'),
      h('p', null, 'Everything you enter stays in this browser on this device. The app has no accounts and sends nothing to any server. Links to esv.org open only when you tap them.'),
      h('p', null, 'Because your prayers live only here, export a backup from ',
        h('a', { href: '#/settings' }, 'Settings'), ' now and then and keep it somewhere safe.')),

    h('section', { class: 'section about-section', 'aria-labelledby': 'about-sources' },
      h('h2', { class: 'about-heading', id: 'about-sources' }, 'Sources and thanks'),
      h('div', { class: 'about-sources' },
        scripture.ESV_NOTICE ? h('p', { class: 'about-notice' }, scripture.ESV_NOTICE) : null,
        standardsNote ? h('p', null, standardsNote) : null,
        h('p', null, 'The sayings in “A word on prayer” are quoted word for word from works now in the public domain.'),
        works.length
          ? h('ul', { class: 'about-works' }, works.map((q) => h('li', null,
            h('cite', null, q.source), `, ${q.author}${q.year ? ` (${q.year})` : ''}`)))
          : null,
        h('p', null, 'Matthew Henry’s ', h('cite', null, 'A Method for Prayer'),
          ' (1710) inspired one of the ways to pray in this app. That guide follows the order of his headings in its own words and does not quote his book.'))),

    ornament(),
    h('p', { class: 'about-sdg', lang: 'la' }, 'Soli Deo Gloria'),
    h('p', { class: 'about-sdg-en muted small' }, 'To God alone be the glory.'));

  main.append(root);
}

// ====================================================================

export function render(main, { path, navigate } = {}) {
  const go = (p) => {
    if (typeof navigate === 'function') navigate(p);
    else location.hash = `#${p}`;
  };
  const current = path || (typeof location !== 'undefined' ? location.hash.replace(/^#/, '').split('?')[0] : '/settings');
  if (current === '/settings/about') {
    renderAbout(main);
    return undefined;
  }
  return renderSettings(main, go);
}
