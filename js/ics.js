// Builds an iCalendar (.ics) file of daily prayer reminders. A web app cannot
// ring an alarm on its own when it is closed, but the phone's calendar can.

import { getVerse } from './data/scripture.js';

function invitation() {
  const v = getVerse('Hebrews 4:16');
  return v ? `${v.text} (Hebrews 4:16 ESV)` : 'Draw near to the throne of grace. (Hebrews 4:16)';
}

const pad = (n) => String(n).padStart(2, '0');

export function escapeText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// Folds a content line so no physical line exceeds 75 octets (RFC 5545 3.1).
// Never splits a multi-byte UTF-8 character.
export function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) {
      out.push(current);
      current = ' ';
      bytes = 1;
      limit = 75;
    }
    current += ch;
    bytes += b;
  }
  out.push(current);
  return out.join('\r\n');
}

function floating(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function utcStamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function parseTime(t) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t || ''));
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
}

// The next local moment at hh:mm (today if still ahead, else tomorrow),
// optionally restricted to a weekday (0 = Sunday).
export function nextOccurrence(time, now = new Date(), weekday = null) {
  const t = parseTime(time);
  if (!t) return null;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.h, t.m, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  if (weekday !== null) {
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  }
  return d;
}

function event({ uid, stamp, start, rrule, summary, description, url }) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${floating(start)}`,
    'DURATION:PT15M',
    rrule,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    url ? `URL:${url}` : null,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${escapeText(summary)}`,
    'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean);
}

export function buildReminderICS({ times = [], lordsDayReminder = false, appUrl = '', now = new Date() } = {}) {
  const stamp = utcStamp(now);
  const base = now.getTime().toString(36);
  const url = appUrl ? String(appUrl).replace(/[\r\n]/g, '') : '';
  const description = url ? `${invitation()}\n\nOpen Before the Throne: ${url}` : invitation();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Before the Throne//Prayer Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Prayer',
  ];
  const valid = [...new Set(times)].filter((t) => parseTime(t)).sort();
  valid.forEach((t, i) => {
    lines.push(...event({
      uid: `${i + 1}-${base}@beforethethrone`,
      stamp,
      start: nextOccurrence(t, now),
      rrule: 'RRULE:FREQ=DAILY',
      summary: 'Time for prayer',
      description,
      url,
    }));
  });
  if (lordsDayReminder) {
    lines.push(...event({
      uid: `lordsday-${base}@beforethethrone`,
      stamp,
      start: nextOccurrence('19:30', now, 6),
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SA',
      summary: 'Prepare for the Lord’s Day',
      description: url
        ? `Set your heart and household in order for tomorrow’s worship.\n\nOpen Before the Throne: ${url}`
        : 'Set your heart and household in order for tomorrow’s worship.',
      url,
    }));
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
