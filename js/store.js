// The app's one source of truth. State lives in memory and is saved to
// localStorage after every change. Nothing ever leaves the device.

import { DEFAULT_CATEGORIES } from './data/categories.js';
import { dayKey, parseDayKey } from './dates.js';
import { computeRotation } from './schedule.js';

export const STORAGE_KEY = 'beforethethrone:v1';
export const STATE_VERSION = 1;
export const MAX_SESSIONS = 500;

export const METHOD_IDS = ['lords-prayer', 'acts', 'henry', 'list'];
export const THEMES = ['auto', 'light', 'dark'];
export const TEXT_SIZES = ['normal', 'large', 'larger'];
export const FREQUENCIES = ['daily', 'weekdays', 'rotate'];
export const STATUSES = ['active', 'answered', 'archived'];

const LIMITS = { title: 200, details: 5000, promise: 300, note: 5000, name: 60, category: 60, journal: 50000 };

function safeLocalStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null; // some sandboxed contexts throw on access
  }
}

let storage = safeLocalStorage();
let state = null;
let persistRequested = false;
let lastPersistOk = true;
const listeners = new Set();

// ---------- small helpers ----------

export function uid() {
  const rand = globalThis.crypto && globalThis.crypto.getRandomValues
    ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join('')
    : Math.random().toString(36).slice(2, 8);
  return Date.now().toString(36) + rand;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max, fallback = '') => (typeof v === 'string' ? v.slice(0, max) : fallback);
const trimmed = (v, max) => str(v, max * 2).trim().slice(0, max);

function isoOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isoOrNow(v, now = new Date()) {
  return isoOrNull(v) || now.toISOString();
}

function validTime(v) {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

// ---------- defaults ----------

export function defaultSettings() {
  return {
    name: '',
    theme: 'auto',
    textSize: 'normal',
    method: 'lords-prayer',
    rotationCount: 5,
    showCatechism: true,
    showQuote: true,
    reminderTimes: ['06:30', '21:00'],
    lordsDayReminder: true,
    onboarded: false,
  };
}

function defaultCategories() {
  return DEFAULT_CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, order: i, builtIn: true }));
}

export function defaultState() {
  return {
    version: STATE_VERSION,
    settings: defaultSettings(),
    categories: defaultCategories(),
    requests: [],
    journal: [],
    sessions: [],
    rotation: { date: null, ids: [], count: 0 },
  };
}

// ---------- normalizers (shared by migrate and the mutators) ----------

function normalizeSettings(raw) {
  const d = defaultSettings();
  const s = isObj(raw) ? raw : {};
  const times = Array.isArray(s.reminderTimes) ? [...new Set(s.reminderTimes.filter(validTime))].sort() : d.reminderTimes;
  return {
    name: trimmed(s.name, LIMITS.name),
    theme: THEMES.includes(s.theme) ? s.theme : d.theme,
    textSize: TEXT_SIZES.includes(s.textSize) ? s.textSize : d.textSize,
    method: METHOD_IDS.includes(s.method) ? s.method : d.method,
    rotationCount: clampInt(s.rotationCount, 1, 20, d.rotationCount),
    showCatechism: typeof s.showCatechism === 'boolean' ? s.showCatechism : d.showCatechism,
    showQuote: typeof s.showQuote === 'boolean' ? s.showQuote : d.showQuote,
    reminderTimes: times.slice(0, 8),
    lordsDayReminder: typeof s.lordsDayReminder === 'boolean' ? s.lordsDayReminder : d.lordsDayReminder,
    onboarded: typeof s.onboarded === 'boolean' ? s.onboarded : d.onboarded,
  };
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw)) return defaultCategories();
  const seen = new Set();
  const list = [];
  raw.forEach((c, i) => {
    if (!isObj(c)) return;
    const id = trimmed(c.id, 40);
    const name = trimmed(c.name, LIMITS.category);
    if (!id || !name || seen.has(id)) return;
    seen.add(id);
    list.push({ id, name, order: Number.isFinite(c.order) ? c.order : i, builtIn: c.builtIn === true });
  });
  if (!list.length) return defaultCategories();
  list.sort((a, b) => a.order - b.order);
  list.forEach((c, i) => { c.order = i; });
  return list;
}

function fallbackCategoryId(categories) {
  return (categories.find((c) => c.id === 'other') || categories[categories.length - 1]).id;
}

function normalizeWeekdays(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort((a, b) => a - b);
}

function normalizeRequest(r, categories, now = new Date()) {
  if (!isObj(r)) return null;
  const title = trimmed(r.title, LIMITS.title);
  if (!title) return null;
  let frequency = FREQUENCIES.includes(r.frequency) ? r.frequency : 'daily';
  const weekdays = normalizeWeekdays(r.weekdays);
  if (frequency === 'weekdays' && !weekdays.length) frequency = 'daily';
  const status = STATUSES.includes(r.status) ? r.status : 'active';
  const createdAt = isoOrNow(r.createdAt, now);
  return {
    id: trimmed(r.id, 40) || uid(),
    title,
    details: str(r.details, LIMITS.details),
    categoryId: categories.some((c) => c.id === r.categoryId) ? r.categoryId : fallbackCategoryId(categories),
    frequency,
    weekdays: frequency === 'weekdays' ? weekdays : [],
    promise: trimmed(r.promise, LIMITS.promise),
    status,
    createdAt,
    updatedAt: isoOrNull(r.updatedAt) || createdAt,
    lastPrayedAt: isoOrNull(r.lastPrayedAt),
    prayedCount: clampInt(r.prayedCount, 0, 1e9, 0),
    answeredAt: status === 'answered' ? isoOrNow(r.answeredAt, now) : isoOrNull(r.answeredAt),
    answerNote: str(r.answerNote, LIMITS.note),
  };
}

function normalizeJournal(e, now = new Date()) {
  if (!isObj(e)) return null;
  const text = str(e.text, LIMITS.journal);
  const title = trimmed(e.title, LIMITS.title);
  if (!text.trim() && !title) return null;
  const createdAt = isoOrNow(e.createdAt, now);
  return {
    id: trimmed(e.id, 40) || uid(),
    date: parseDayKey(e.date) ? e.date : dayKey(new Date(createdAt)),
    createdAt,
    updatedAt: isoOrNull(e.updatedAt) || createdAt,
    title,
    text,
    kind: e.kind === 'session' ? 'session' : 'entry',
  };
}

function normalizeSession(s) {
  if (!isObj(s)) return null;
  const startedAt = isoOrNull(s.startedAt);
  if (!startedAt) return null;
  return {
    id: trimmed(s.id, 40) || uid(),
    date: parseDayKey(s.date) ? s.date : dayKey(new Date(startedAt)),
    startedAt,
    finishedAt: isoOrNull(s.finishedAt) || startedAt,
    method: METHOD_IDS.includes(s.method) ? s.method : 'list',
    prayedIds: Array.isArray(s.prayedIds) ? s.prayedIds.filter((x) => typeof x === 'string').slice(0, 500) : [],
  };
}

function dedupeById(list) {
  const seen = new Set();
  return list.filter((x) => {
    if (!x) return false;
    if (seen.has(x.id)) x.id = uid();
    seen.add(x.id);
    return true;
  });
}

// Accepts anything (old, partial, or corrupt data) and returns a valid current
// state. Never throws.
export function migrate(raw) {
  let input = raw;
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { input = null; }
  }
  if (!isObj(input)) return defaultState();
  const now = new Date();
  const categories = normalizeCategories(input.categories);
  const requests = dedupeById((Array.isArray(input.requests) ? input.requests : []).map((r) => normalizeRequest(r, categories, now)));
  const journal = dedupeById((Array.isArray(input.journal) ? input.journal : []).map((e) => normalizeJournal(e, now)));
  const sessions = dedupeById((Array.isArray(input.sessions) ? input.sessions : []).map(normalizeSession)).slice(-MAX_SESSIONS);
  const rot = isObj(input.rotation) ? input.rotation : {};
  return {
    version: STATE_VERSION,
    settings: normalizeSettings(input.settings),
    categories,
    requests,
    journal,
    sessions,
    rotation: {
      date: parseDayKey(rot.date) ? rot.date : null,
      ids: Array.isArray(rot.ids) ? rot.ids.filter((x) => typeof x === 'string') : [],
      count: clampInt(rot.count, 0, 20, 0),
    },
  };
}

// ---------- persistence ----------

function emitStorageError(error) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('btt:storage-error', { detail: { error } }));
  }
}

function persist() {
  if (!storage) {
    lastPersistOk = false;
    emitStorageError(new Error('Storage is not available'));
    return false;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    lastPersistOk = false;
    emitStorageError(error);
    return false;
  }
  lastPersistOk = true;
  if (!persistRequested) {
    persistRequested = true;
    try {
      const p = globalThis.navigator && globalThis.navigator.storage && globalThis.navigator.storage.persist
        ? globalThis.navigator.storage.persist() : null;
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch { /* ignore */ }
  }
  return true;
}

function notify() {
  for (const fn of listeners) {
    try { fn(state); } catch (e) { console.error(e); }
  }
}

export function load(storageArg) {
  if (storageArg !== undefined) storage = storageArg;
  let raw = null;
  try {
    raw = storage ? storage.getItem(STORAGE_KEY) : null;
  } catch {
    raw = null;
  }
  if (raw === null || raw === undefined) {
    state = defaultState();
    return state;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try { storage.setItem(`${STORAGE_KEY}:corrupt`, raw); } catch { /* ignore */ }
    state = defaultState();
    return state;
  }
  state = migrate(parsed);
  return state;
}

// Re-reads storage, for when another tab changed it.
export function reload() {
  load();
  notify();
  return state;
}

export function getState() {
  if (!state) load();
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator) {
  const s = getState();
  mutator(s);
  persist();
  notify();
  return s;
}

// Whether the most recent change reached the device's storage. A change always
// takes effect in memory, so a caller that tells the user "saved" checks this.
export function lastSaveOk() {
  return lastPersistOk;
}

// Tries once more to write the current state, as after freeing some room.
export function saveAgain() {
  return persist();
}

export function _setStorageForTests(fake) {
  storage = fake;
  state = null;
  persistRequested = true;
  lastPersistOk = true;
  listeners.clear();
}

// ---------- settings ----------

export function setSetting(key, value) {
  update((s) => {
    s.settings = normalizeSettings({ ...s.settings, [key]: value });
  });
  return getState().settings[key];
}

// ---------- requests ----------

export function getRequest(id) {
  return getState().requests.find((r) => r.id === id) || null;
}

export function addRequest(fields) {
  const now = new Date();
  const created = normalizeRequest({
    ...fields,
    id: uid(),
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastPrayedAt: null,
    prayedCount: 0,
    answeredAt: null,
    answerNote: '',
  }, getState().categories, now);
  if (!created) throw new Error('A request needs a title.');
  update((s) => { s.requests.push(created); });
  return created;
}

export function updateRequest(id, patch) {
  let result = null;
  update((s) => {
    const i = s.requests.findIndex((r) => r.id === id);
    if (i < 0) return;
    const merged = { ...s.requests[i], ...patch, id, createdAt: s.requests[i].createdAt, updatedAt: new Date().toISOString() };
    const next = normalizeRequest(merged, s.categories);
    if (!next) throw new Error('A request needs a title.');
    s.requests[i] = next;
    result = next;
  });
  return result;
}

export function deleteRequest(id) {
  update((s) => {
    s.requests = s.requests.filter((r) => r.id !== id);
    s.rotation.ids = s.rotation.ids.filter((x) => x !== id);
  });
}

export function markPrayed(ids, when = new Date()) {
  const set = new Set(Array.isArray(ids) ? ids : [ids]);
  if (!set.size) return;
  const iso = new Date(when).toISOString();
  update((s) => {
    for (const r of s.requests) {
      if (set.has(r.id)) {
        r.lastPrayedAt = iso;
        r.prayedCount += 1;
      }
    }
  });
}

export function markAnswered(id, note = '', when = new Date()) {
  update((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r) return;
    r.status = 'answered';
    r.answeredAt = new Date(when).toISOString();
    // A request prayed for again keeps its earlier answer note. Answering it
    // again adds the new words after the old, and a blank note keeps the old.
    const next = str(note, LIMITS.note).trim();
    const prev = (r.answerNote || '').trim();
    if (!next) r.answerNote = prev;
    else if (!prev || next.includes(prev)) r.answerNote = next;
    else r.answerNote = `${prev}\n\n${next}`.slice(0, LIMITS.note);
    r.updatedAt = new Date().toISOString();
  });
}

// Moves a request between active and archived, or brings an answered one back
// to active prayer. The answer note is kept for the record.
export function setStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  update((s) => {
    const r = s.requests.find((x) => x.id === id);
    if (!r) return;
    r.status = status;
    if (status !== 'answered') r.answeredAt = null;
    r.updatedAt = new Date().toISOString();
  });
}

// ---------- categories ----------

export function addCategory(name) {
  const clean = trimmed(name, LIMITS.category);
  if (!clean) throw new Error('A category needs a name.');
  const category = { id: uid(), name: clean, order: getState().categories.length, builtIn: false };
  update((s) => { s.categories.push(category); });
  return category;
}

export function renameCategory(id, name) {
  const clean = trimmed(name, LIMITS.category);
  if (!clean) throw new Error('A category needs a name.');
  update((s) => {
    const c = s.categories.find((x) => x.id === id);
    if (c) c.name = clean;
  });
}

export function moveCategory(id, delta) {
  update((s) => {
    const list = s.categories.slice().sort((a, b) => a.order - b.order);
    const i = list.findIndex((c) => c.id === id);
    const j = i + Math.sign(delta);
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((c, k) => { c.order = k; });
    s.categories = list;
  });
}

export function deleteCategory(id, moveToId) {
  const s0 = getState();
  if (s0.categories.length <= 1) throw new Error('You need at least one category.');
  if (id === moveToId || !s0.categories.some((c) => c.id === moveToId)) throw new Error('Choose another category for its requests.');
  update((s) => {
    for (const r of s.requests) if (r.categoryId === id) r.categoryId = moveToId;
    s.categories = s.categories.filter((c) => c.id !== id).sort((a, b) => a.order - b.order);
    s.categories.forEach((c, k) => { c.order = k; });
  });
}

// ---------- journal ----------

export function addJournal(fields) {
  const now = new Date();
  const entry = normalizeJournal({ ...fields, id: uid(), createdAt: now.toISOString(), updatedAt: now.toISOString(), date: fields && fields.date ? fields.date : dayKey(now) }, now);
  if (!entry) throw new Error('A journal entry needs some words.');
  update((s) => { s.journal.push(entry); });
  return entry;
}

export function updateJournal(id, patch) {
  let result = null;
  update((s) => {
    const i = s.journal.findIndex((e) => e.id === id);
    if (i < 0) return;
    const next = normalizeJournal({ ...s.journal[i], ...patch, id, createdAt: s.journal[i].createdAt, updatedAt: new Date().toISOString() });
    if (!next) throw new Error('A journal entry needs some words.');
    s.journal[i] = next;
    result = next;
  });
  return result;
}

export function deleteJournal(id) {
  update((s) => { s.journal = s.journal.filter((e) => e.id !== id); });
}

// ---------- sessions ----------

export function recordSession(session) {
  const now = new Date();
  const rec = normalizeSession({ id: uid(), ...session, startedAt: session && session.startedAt ? session.startedAt : now.toISOString(), finishedAt: session && session.finishedAt ? session.finishedAt : now.toISOString() });
  if (!rec) return null;
  update((s) => {
    s.sessions.push(rec);
    if (s.sessions.length > MAX_SESSIONS) s.sessions = s.sessions.slice(-MAX_SESSIONS);
  });
  return rec;
}

// ---------- the day's rotation ----------

// The rotating requests for today. The plan is computed once per day (and again
// if the user changes how many to pray), then cached so it holds steady. Free
// places in the day's plan are filled by rotating requests added or changed
// later that day, so a new one need not wait until tomorrow.
export function todaysRotation(date = new Date()) {
  const s = getState();
  const key = dayKey(date);
  const count = s.settings.rotationCount;
  const live = new Map(s.requests.map((r) => [r.id, r]));
  if (s.rotation.date === key && s.rotation.count === count) {
    const kept = s.rotation.ids.filter((id) => {
      const r = live.get(id);
      return r && r.status === 'active' && r.frequency === 'rotate';
    });
    if (kept.length >= count) return kept;
    const keptSet = new Set(kept);
    const extra = computeRotation(s.requests.filter((r) => !keptSet.has(r.id)), count - kept.length);
    // Nothing to add: return without writing, so re-renders (and other tabs)
    // do not trade storage writes back and forth.
    if (!extra.length) return kept;
    const ids = [...kept, ...extra];
    update((st) => { st.rotation = { date: key, ids, count }; });
    return ids;
  }
  const ids = computeRotation(s.requests, count);
  update((st) => { st.rotation = { date: key, ids, count }; });
  return ids;
}

// ---------- whole-state operations ----------

export function replaceState(next) {
  state = migrate(next);
  persist();
  notify();
  return state;
}

// Keys the app keeps besides the main state: drafts, view preferences, and
// saved prayer progress. Erasing everything removes these too.
const APP_KEY_PREFIXES = ['btt:', 'beforethethrone:'];

function removeAppKeys(store, keep = null) {
  if (!store) return;
  try {
    const keys = [];
    for (let i = 0; i < (store.length || 0); i++) keys.push(store.key(i));
    keys
      .filter((k) => k && k !== keep && APP_KEY_PREFIXES.some((p) => k.startsWith(p)))
      .forEach((k) => store.removeItem(k));
  } catch { /* ignore */ }
}

// After everything was erased in another tab: removes the drafts and saved
// prayer progress this tab still holds, keeping only the (fresh) main state.
export function forgetLocalCopies() {
  removeAppKeys(storage, STORAGE_KEY);
  try { removeAppKeys(globalThis.sessionStorage); } catch { /* ignore */ }
}

export function resetAll() {
  state = defaultState();
  try { if (storage) storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  removeAppKeys(storage);
  try { removeAppKeys(globalThis.sessionStorage); } catch { /* ignore */ }
  persist();
  notify();
  return state;
}
