// Psalms of the day: the Psalter prayed through once a month.
//
// Day d of the month (1..30) gives Psalms d, d+30, d+60, d+90 and d+120, so
// the 150 psalms are covered in thirty days. On the 31st the plan gives Psalm
// 119 alone. Psalms are read by link to esv.org and never quoted here.
//
// Self-contained data module: no imports. Dates are local calendar dates.

export const PSALM_PLAN_NOTE = 'Pray through the whole Psalter each month, five psalms a day. Read them slowly and turn their words into your own prayers. On the 31st, take your time with Psalm 119.';

function dayOfMonth(date) {
  if (typeof date === 'string') {
    // Accept a local day key like '2026-09-26'.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (m) return Number(m[3]);
  }
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return d.getDate();
}

/** Psalm numbers for the local date: [d, d+30, d+60, d+90, d+120], or [119] on the 31st. */
export function psalmsForDay(date = new Date()) {
  const d = dayOfMonth(date);
  if (d >= 31) return [119];
  return [d, d + 30, d + 60, d + 90, d + 120];
}

/** 'Psalm 23' */
export function psalmRef(n) {
  return `Psalm ${Number(n)}`;
}

/** Link to the full psalm on esv.org, e.g. https://www.esv.org/Psalm+23/ */
export function psalmUrl(n) {
  return `https://www.esv.org/Psalm+${Number(n)}/`;
}
