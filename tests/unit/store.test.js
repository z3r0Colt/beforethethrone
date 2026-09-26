import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeStorage, brokenStorage } from './helpers.js';
import * as store from '../../js/store.js';

function fresh(initial) {
  const storage = fakeStorage(initial);
  store._setStorageForTests(storage);
  return storage;
}

test('defaultState is valid and has the built-in categories', () => {
  const s = store.defaultState();
  assert.equal(s.version, 1);
  assert.equal(s.categories.length, 9);
  assert.deepEqual(s.categories.map((c) => c.order), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(s.settings.method, 'lords-prayer');
  assert.deepEqual(store.migrate(s), s);
});

test('migrate survives garbage and fills defaults', () => {
  for (const junk of [null, undefined, 42, 'not json', '[]', [], { settings: 'x' }]) {
    const s = store.migrate(junk);
    assert.equal(s.version, 1);
    assert.ok(Array.isArray(s.requests));
    assert.equal(s.categories.length, 9);
  }
});

test('migrate cleans bad fields without losing good data', () => {
  const s = store.migrate({
    settings: { theme: 'neon', rotationCount: 999, reminderTimes: ['25:00', '07:15', '07:15', 'x'], name: '  Colt  ' },
    categories: [{ id: 'family', name: 'Family', order: 3 }, { id: 'family', name: 'Dup' }, { id: 'x', name: '' }, { id: 'other', name: 'Other', order: 1 }],
    requests: [
      { id: 'a', title: '  My wife  ', categoryId: 'family', frequency: 'weekdays', weekdays: [9, 1, 1, '3'], status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'b', title: '', categoryId: 'family' },
      { id: 'c', title: 'Orphan', categoryId: 'nope', frequency: 'weekdays', weekdays: [], status: 'weird' },
      { id: 'a', title: 'Duplicate id', categoryId: 'family' },
    ],
    journal: [{ id: 'j', text: 'Thanks be to God', date: 'bad' , createdAt: '2026-03-04T12:00:00Z' }, { id: 'k', text: '   ' }],
    sessions: [{ id: 's', startedAt: 'nope' }, { id: 't', startedAt: '2026-03-04T12:00:00Z', method: 'acts' }],
  });
  assert.equal(s.settings.theme, 'auto');
  assert.equal(s.settings.rotationCount, 20);
  assert.deepEqual(s.settings.reminderTimes, ['07:15']);
  assert.equal(s.settings.name, 'Colt');
  assert.deepEqual(s.categories.map((c) => c.id), ['other', 'family']);
  assert.equal(s.requests.length, 3);
  assert.equal(s.requests[0].title, 'My wife');
  assert.deepEqual(s.requests[0].weekdays, [1, 3]);
  assert.equal(s.requests[1].categoryId, 'other');
  assert.equal(s.requests[1].frequency, 'daily');
  assert.equal(s.requests[1].status, 'active');
  assert.notEqual(s.requests[2].id, 'a');
  assert.equal(s.journal.length, 1);
  assert.match(s.journal[0].date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(s.sessions.length, 1);
});

test('load starts fresh on corrupt JSON and keeps a copy', () => {
  const storage = fresh({ [store.STORAGE_KEY]: '{oops' });
  const s = store.load(storage);
  assert.equal(s.requests.length, 0);
  assert.equal(storage.getItem(`${store.STORAGE_KEY}:corrupt`), '{oops');
});

test('request lifecycle persists to storage', () => {
  const storage = fresh();
  const r = store.addRequest({ title: 'Pastor Smith', categoryId: 'church', frequency: 'weekdays', weekdays: [0] });
  assert.equal(r.status, 'active');
  let saved = JSON.parse(storage.getItem(store.STORAGE_KEY));
  assert.equal(saved.requests.length, 1);

  store.updateRequest(r.id, { details: 'Strength for the Lord’s Day', title: 'Pastor Smith and family' });
  assert.equal(store.getRequest(r.id).title, 'Pastor Smith and family');
  assert.throws(() => store.updateRequest(r.id, { title: '   ' }));
  assert.equal(store.getRequest(r.id).title, 'Pastor Smith and family');

  store.markPrayed([r.id], new Date('2026-09-26T12:00:00Z'));
  store.markPrayed(r.id, new Date('2026-09-27T12:00:00Z'));
  assert.equal(store.getRequest(r.id).prayedCount, 2);
  assert.equal(store.getRequest(r.id).lastPrayedAt, '2026-09-27T12:00:00.000Z');

  store.markAnswered(r.id, '  He was given rest.  ', new Date('2026-10-01T12:00:00Z'));
  assert.equal(store.getRequest(r.id).status, 'answered');
  assert.equal(store.getRequest(r.id).answerNote, 'He was given rest.');

  store.setStatus(r.id, 'active');
  assert.equal(store.getRequest(r.id).status, 'active');
  assert.equal(store.getRequest(r.id).answeredAt, null);
  assert.equal(store.getRequest(r.id).answerNote, 'He was given rest.');

  store.deleteRequest(r.id);
  saved = JSON.parse(storage.getItem(store.STORAGE_KEY));
  assert.equal(saved.requests.length, 0);
});

test('addRequest requires a title', () => {
  fresh();
  assert.throws(() => store.addRequest({ title: '  ' }));
});

test('categories can be added, renamed, moved, and deleted', () => {
  fresh();
  const c = store.addCategory('Coworkers');
  assert.equal(store.getState().categories.at(-1).id, c.id);
  store.renameCategory(c.id, 'School staff');
  assert.equal(store.getState().categories.at(-1).name, 'School staff');
  store.moveCategory(c.id, -1);
  const ids = store.getState().categories.map((x) => x.id);
  assert.equal(ids.at(-2), c.id);
  assert.deepEqual(store.getState().categories.map((x) => x.order), ids.map((_, i) => i));

  const r = store.addRequest({ title: 'Mr. Jones', categoryId: c.id });
  assert.throws(() => store.deleteCategory(c.id, c.id));
  store.deleteCategory(c.id, 'friends');
  assert.equal(store.getRequest(r.id).categoryId, 'friends');
  assert.ok(!store.getState().categories.some((x) => x.id === c.id));
});

test('cannot delete the last category', () => {
  fresh({ [store.STORAGE_KEY]: JSON.stringify({ categories: [{ id: 'only', name: 'Only' }] }) });
  store.load();
  assert.throws(() => store.deleteCategory('only', 'only'));
});

test('journal entries', () => {
  fresh();
  const e = store.addJournal({ text: 'The Lord is my shepherd.', date: '2026-09-26' });
  assert.equal(e.date, '2026-09-26');
  store.updateJournal(e.id, { title: 'Morning' });
  assert.equal(store.getState().journal[0].title, 'Morning');
  assert.throws(() => store.addJournal({ text: '   ' }));
  store.deleteJournal(e.id);
  assert.equal(store.getState().journal.length, 0);
});

test('sessions are recorded and capped', () => {
  fresh();
  for (let i = 0; i < store.MAX_SESSIONS + 5; i++) {
    store.recordSession({ method: 'acts', startedAt: new Date(2026, 0, 1, 0, i).toISOString(), prayedIds: ['a'] });
  }
  assert.equal(store.getState().sessions.length, store.MAX_SESSIONS);
});

test('todaysRotation is stable within a day and moves on the next', () => {
  fresh();
  store.setSetting('rotationCount', 2);
  const ids = ['A', 'B', 'C', 'D'].map((t, i) => store.addRequest({ title: t, frequency: 'rotate' }).id);
  // give each a distinct creation order
  store.update((s) => { s.requests.forEach((r, i) => { r.createdAt = new Date(2026, 0, i + 1).toISOString(); }); });
  const day1 = new Date(2026, 8, 26, 7);
  const first = store.todaysRotation(day1);
  assert.deepEqual(first, [ids[0], ids[1]]);
  store.markPrayed(first, new Date(2026, 8, 26, 7, 30));
  assert.deepEqual(store.todaysRotation(new Date(2026, 8, 26, 21)), first, 'same plan all day');
  const day2 = store.todaysRotation(new Date(2026, 8, 27, 7));
  assert.deepEqual(day2, [ids[2], ids[3]]);
  store.setSetting('rotationCount', 3);
  assert.equal(store.todaysRotation(new Date(2026, 8, 27, 8)).length, 3, 'count change rebuilds plan');
});

test('settings are validated', () => {
  fresh();
  assert.equal(store.setSetting('theme', 'dark'), 'dark');
  assert.equal(store.setSetting('theme', 'purple'), 'auto');
  assert.equal(store.setSetting('rotationCount', 0), 1);
  assert.deepEqual(store.setSetting('reminderTimes', ['21:00', '06:30', 'bad']), ['06:30', '21:00']);
});

test('subscribe notifies and unsubscribes', () => {
  fresh();
  let calls = 0;
  const off = store.subscribe(() => { calls++; });
  store.setSetting('name', 'Colt');
  off();
  store.setSetting('name', 'Colt W');
  assert.equal(calls, 1);
});

test('replaceState and resetAll', () => {
  const storage = fresh();
  store.addRequest({ title: 'Something' });
  store.replaceState({ requests: [{ title: 'Imported', categoryId: 'family' }] });
  assert.equal(store.getState().requests[0].title, 'Imported');
  store.resetAll();
  assert.equal(store.getState().requests.length, 0);
  assert.equal(JSON.parse(storage.getItem(store.STORAGE_KEY)).requests.length, 0);
});

test('a failing storage does not throw', () => {
  store._setStorageForTests(brokenStorage());
  assert.doesNotThrow(() => store.addRequest({ title: 'Still works in memory' }));
  assert.equal(store.getState().requests.length, 1);
});
