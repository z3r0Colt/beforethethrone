import test from 'node:test';
import assert from 'node:assert/strict';
import { exportBackup, parseBackup, backupFilename } from '../../js/backup.js';
import { defaultState, migrate } from '../../js/store.js';

test('export then parse round-trips', () => {
  const state = migrate({ requests: [{ title: 'Church plant', categoryId: 'missions' }], journal: [{ text: 'Hitherto', date: '2026-09-26' }] });
  const text = JSON.stringify(exportBackup(state, new Date('2026-09-26T12:00:00Z')));
  const result = parseBackup(text);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, state);
  assert.deepEqual(result.counts, { requests: 1, journal: 1 });
  assert.equal(result.exportedAt, '2026-09-26T12:00:00.000Z');
});

test('parseBackup rejects bad input with friendly errors', () => {
  for (const bad of ['', '   ', '{nope', '[]', '{"app":"other","format":1,"state":{}}', '{"app":"beforethethrone","format":1}', '{"app":"beforethethrone","format":99,"state":{}}']) {
    const r = parseBackup(bad);
    assert.equal(r.ok, false, bad);
    assert.equal(typeof r.error, 'string');
  }
  assert.equal(parseBackup(null).ok, false);
});

test('parseBackup repairs a damaged state', () => {
  const r = parseBackup(JSON.stringify({ app: 'beforethethrone', format: 1, state: { requests: 'oops', settings: { theme: 'dark' } } }));
  assert.equal(r.ok, true);
  assert.equal(r.state.settings.theme, 'dark');
  assert.deepEqual(r.state.requests, []);
});

test('backupFilename uses the local date', () => {
  assert.equal(backupFilename(new Date(2026, 8, 26, 23, 30)), 'before-the-throne-backup-2026-09-26.json');
});

test('default state exports', () => {
  assert.equal(exportBackup(defaultState()).app, 'beforethethrone');
});
