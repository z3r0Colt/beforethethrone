import test from 'node:test';
import assert from 'node:assert/strict';
import { isDueToday, computeRotation, dueToday, groupByCategory, frequencyLabel } from '../../js/schedule.js';

const cats = [
  { id: 'soul', name: 'My Soul', order: 0 },
  { id: 'family', name: 'Family', order: 1 },
  { id: 'other', name: 'Other', order: 2 },
];

const req = (over) => ({
  id: over.id,
  title: over.title || over.id,
  categoryId: 'other',
  frequency: 'daily',
  weekdays: [],
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastPrayedAt: null,
  ...over,
});

const saturday = new Date(2026, 8, 26, 8);
const sunday = new Date(2026, 8, 27, 8);

test('isDueToday handles each frequency and status', () => {
  assert.equal(isDueToday(req({ id: 'a' }), saturday), true);
  assert.equal(isDueToday(req({ id: 'b', frequency: 'weekdays', weekdays: [0] }), sunday), true);
  assert.equal(isDueToday(req({ id: 'b', frequency: 'weekdays', weekdays: [0] }), saturday), false);
  assert.equal(isDueToday(req({ id: 'c', frequency: 'rotate' }), saturday), false);
  assert.equal(isDueToday(req({ id: 'd', status: 'answered' }), saturday), false);
  assert.equal(isDueToday(req({ id: 'e', status: 'archived' }), saturday), false);
  assert.equal(isDueToday(null, saturday), false);
});

test('computeRotation takes the longest-waiting first', () => {
  const list = [
    req({ id: 'r1', frequency: 'rotate', lastPrayedAt: '2026-09-20T10:00:00.000Z' }),
    req({ id: 'r2', frequency: 'rotate', lastPrayedAt: null, createdAt: '2026-05-01T00:00:00.000Z' }),
    req({ id: 'r3', frequency: 'rotate', lastPrayedAt: '2026-09-10T10:00:00.000Z' }),
    req({ id: 'r4', frequency: 'rotate', lastPrayedAt: null, createdAt: '2026-02-01T00:00:00.000Z' }),
    req({ id: 'r5', frequency: 'rotate', status: 'archived' }),
    req({ id: 'd1', frequency: 'daily' }),
  ];
  assert.deepEqual(computeRotation(list, 3), ['r4', 'r2', 'r3']);
  assert.deepEqual(computeRotation(list, 10), ['r4', 'r2', 'r3', 'r1']);
  assert.deepEqual(computeRotation(list, 0), []);
  assert.deepEqual(computeRotation([], 5), []);
});

test('dueToday merges fixed and rotation, sorted by category then title', () => {
  const state = {
    categories: cats,
    requests: [
      req({ id: 'x', title: 'Zeal', categoryId: 'soul' }),
      req({ id: 'y', title: 'Anna', categoryId: 'family' }),
      req({ id: 'z', title: 'Sunday only', categoryId: 'other', frequency: 'weekdays', weekdays: [0] }),
      req({ id: 'r', title: 'Rotating', categoryId: 'soul', frequency: 'rotate' }),
      req({ id: 'gone', title: 'Archived', categoryId: 'soul', frequency: 'rotate', status: 'archived' }),
    ],
  };
  const sat = dueToday(state, saturday, ['r', 'gone', 'missing']);
  assert.deepEqual(sat.fixed.map((r) => r.id), ['x', 'y']);
  assert.deepEqual(sat.rotation.map((r) => r.id), ['r']);
  assert.deepEqual(sat.all.map((r) => r.id), ['r', 'x', 'y']);
  const sun = dueToday(state, sunday, []);
  assert.deepEqual(sun.all.map((r) => r.id), ['x', 'y', 'z']);
});

test('groupByCategory keeps order and gathers orphans', () => {
  const groups = groupByCategory([
    req({ id: 'a', categoryId: 'family' }),
    req({ id: 'b', categoryId: 'soul' }),
    req({ id: 'c', categoryId: 'deleted' }),
  ], cats);
  assert.deepEqual(groups.map((g) => g.category.id), ['soul', 'family', '_uncategorized']);
});

test('frequencyLabel reads naturally', () => {
  assert.equal(frequencyLabel(req({ id: 'a' })), 'Daily');
  assert.equal(frequencyLabel(req({ id: 'a', frequency: 'rotate' })), 'In rotation');
  assert.equal(frequencyLabel(req({ id: 'a', frequency: 'weekdays', weekdays: [0] })), 'Sundays');
  assert.equal(frequencyLabel(req({ id: 'a', frequency: 'weekdays', weekdays: [3, 0] })), 'Sundays & Wednesdays');
  assert.equal(frequencyLabel(req({ id: 'a', frequency: 'weekdays', weekdays: [1, 3, 5] })), 'Mondays, Wednesdays & Fridays');
  assert.equal(frequencyLabel(req({ id: 'a', frequency: 'weekdays', weekdays: [1, 2, 3, 4, 5] })), 'Weekdays');
});
