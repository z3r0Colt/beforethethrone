// Date helpers. Everything here works in LOCAL time, because a day of prayer
// begins and ends where the user lives, not in UTC.

const pad = (n) => String(n).padStart(2, '0');

export function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDayKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Reject impossible dates such as 2026-02-31, which Date would roll forward.
  if (d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Whole calendar days from a to b. Uses UTC day numbers built from local
// calendar fields, so daylight saving changes never produce 0.96 of a day.
export function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ub - ua) / 86400000);
}

export function dayOfYear(date = new Date()) {
  const d = new Date(date);
  return daysBetween(new Date(d.getFullYear(), 0, 1), d) + 1;
}

export function isLordsDay(date = new Date()) {
  return new Date(date).getDay() === 0;
}

const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayName(i, style = 'long') {
  const list = style === 'short' ? WEEKDAYS_SHORT : WEEKDAYS_LONG;
  return list[((i % 7) + 7) % 7];
}

export function monthName(i, style = 'long') {
  const list = style === 'short' ? MONTHS_SHORT : MONTHS_LONG;
  return list[((i % 12) + 12) % 12];
}

// "Saturday, September 26"
export function formatLong(date = new Date()) {
  const d = new Date(date);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`;
}

// "Sep 26, 2026"
export function formatShort(date = new Date()) {
  const d = new Date(date);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// "September 2026"
export function formatMonth(date = new Date()) {
  const d = new Date(date);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

// "today", "yesterday", "3 days ago", or a short date for anything older than a week.
export function formatRelative(value, now = new Date()) {
  if (!value) return 'never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'never';
  const diff = daysBetween(d, now);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatShort(d);
}

export function timeOfDayGreeting(date = new Date()) {
  const h = new Date(date).getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Sort helper for ISO strings or Dates, oldest first. Missing values sort first.
export function compareDates(a, b) {
  const ta = a ? new Date(a).getTime() : -Infinity;
  const tb = b ? new Date(b).getTime() : -Infinity;
  return ta === tb ? 0 : ta < tb ? -1 : 1;
}
