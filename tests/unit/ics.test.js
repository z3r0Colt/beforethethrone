import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderICS, foldLine, escapeText, nextOccurrence } from '../../js/ics.js';

const now = new Date(2026, 8, 26, 8, 0); // Saturday 8:00 local

test('escapeText escapes RFC 5545 specials', () => {
  assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
});

test('foldLine keeps physical lines within 75 octets and never splits a character', () => {
  const long = `DESCRIPTION:${'grace ’ '.repeat(40)}`;
  const folded = foldLine(long);
  const enc = new TextEncoder();
  for (const line of folded.split('\r\n')) assert.ok(enc.encode(line).length <= 75, line);
  assert.equal(folded.split('\r\n').map((l, i) => (i ? l.slice(1) : l)).join(''), long);
  assert.equal(foldLine('SHORT:1'), 'SHORT:1');
});

test('nextOccurrence picks the next local time', () => {
  assert.equal(nextOccurrence('21:00', now).getDate(), 26);
  assert.equal(nextOccurrence('06:30', now).getDate(), 27);
  const sat = nextOccurrence('19:30', now, 6);
  assert.equal(sat.getDay(), 6);
  assert.equal(sat.getDate(), 26);
  assert.equal(nextOccurrence('bad', now), null);
});

test('buildReminderICS makes a valid calendar', () => {
  const ics = buildReminderICS({ times: ['21:00', '06:30', '06:30', 'bad'], lordsDayReminder: true, appUrl: 'https://example.org/beforethethrone/', now });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'every newline is CRLF');
  const lines = ics.split('\r\n');
  const enc = new TextEncoder();
  for (const line of lines) assert.ok(enc.encode(line).length <= 75, `too long: ${line}`);
  const unfolded = ics.replace(/\r\n /g, '');
  assert.equal((unfolded.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.equal((unfolded.match(/RRULE:FREQ=DAILY/g) || []).length, 2);
  assert.ok(unfolded.includes('RRULE:FREQ=WEEKLY;BYDAY=SA'));
  assert.ok(unfolded.includes('DTSTART:20260926T210000'));
  assert.ok(unfolded.includes('DTSTART:20260927T063000'));
  assert.ok(unfolded.includes('DTSTART:20260926T193000'));
  assert.ok(/DTSTAMP:\d{8}T\d{6}Z/.test(unfolded));
  assert.ok(unfolded.includes('SUMMARY:Time for prayer'));
  assert.ok(unfolded.includes('Hebrews 4:16 ESV'));
  assert.ok(unfolded.includes('BEGIN:VALARM'));
  const uids = unfolded.match(/UID:[^\r]+/g);
  assert.equal(new Set(uids).size, uids.length);
});

test('buildReminderICS with nothing selected is still a calendar', () => {
  const ics = buildReminderICS({ times: [], lordsDayReminder: false, now });
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(!ics.includes('BEGIN:VEVENT'));
});
