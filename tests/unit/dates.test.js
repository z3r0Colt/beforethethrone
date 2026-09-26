import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayKey, parseDayKey, addDays, daysBetween, dayOfYear, isLordsDay, weekdayName,
  formatLong, formatShort, formatRelative, timeOfDayGreeting, compareDates,
} from '../../js/dates.js';

test('dayKey uses local calendar fields', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(dayKey(new Date(2026, 11, 31, 0, 1)), '2026-12-31');
});

test('parseDayKey round-trips and rejects junk', () => {
  const d = parseDayKey('2026-09-26');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8);
  assert.equal(d.getDate(), 26);
  assert.equal(d.getHours(), 0);
  assert.equal(parseDayKey('2026-02-31'), null);
  assert.equal(parseDayKey('nope'), null);
  assert.equal(parseDayKey(undefined), null);
});

test('daysBetween counts calendar days across DST changes', () => {
  // US DST starts 2026-03-08 and ends 2026-11-01. Whatever the local zone,
  // the count must be whole days.
  assert.equal(daysBetween(new Date(2026, 2, 7, 12), new Date(2026, 2, 9, 12)), 2);
  assert.equal(daysBetween(new Date(2026, 9, 31, 23), new Date(2026, 10, 2, 1)), 2);
  assert.equal(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 1, 23, 59)), 0);
  assert.equal(daysBetween(new Date(2026, 0, 2), new Date(2026, 0, 1)), -1);
});

test('dayOfYear and addDays', () => {
  assert.equal(dayOfYear(new Date(2026, 0, 1)), 1);
  assert.equal(dayOfYear(new Date(2026, 11, 31)), 365);
  assert.equal(dayOfYear(new Date(2028, 11, 31)), 366);
  assert.equal(dayKey(addDays(new Date(2026, 1, 28), 1)), '2026-03-01');
});

test('Lord’s Day and names', () => {
  assert.equal(isLordsDay(new Date(2026, 8, 27)), true); // a Sunday
  assert.equal(isLordsDay(new Date(2026, 8, 26)), false);
  assert.equal(weekdayName(0), 'Sunday');
  assert.equal(weekdayName(6, 'short'), 'Sat');
  assert.equal(formatLong(new Date(2026, 8, 26)), 'Saturday, September 26');
  assert.equal(formatShort(new Date(2026, 8, 26)), 'Sep 26, 2026');
});

test('formatRelative', () => {
  const now = new Date(2026, 8, 26, 9);
  assert.equal(formatRelative(null, now), 'never');
  assert.equal(formatRelative('garbage', now), 'never');
  assert.equal(formatRelative(new Date(2026, 8, 26, 7).toISOString(), now), 'today');
  assert.equal(formatRelative(new Date(2026, 8, 25, 22).toISOString(), now), 'yesterday');
  assert.equal(formatRelative(new Date(2026, 8, 22).toISOString(), now), '4 days ago');
  assert.equal(formatRelative(new Date(2026, 8, 1).toISOString(), now), 'Sep 1, 2026');
});

test('greeting by hour', () => {
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 6)), 'Good morning');
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 13)), 'Good afternoon');
  assert.equal(timeOfDayGreeting(new Date(2026, 0, 1, 20)), 'Good evening');
});

test('compareDates sorts missing first', () => {
  const list = ['2026-01-02T00:00:00Z', null, '2026-01-01T00:00:00Z'];
  assert.deepEqual(list.sort(compareDates), [null, '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z']);
});
