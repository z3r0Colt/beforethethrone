// Decides which requests come before the throne on a given day.
// Pure functions only, so they can be tested in Node.

import { compareDates } from './dates.js';

export function isDueToday(request, date = new Date()) {
  if (!request || request.status !== 'active') return false;
  if (request.frequency === 'daily') return true;
  if (request.frequency === 'weekdays') {
    return Array.isArray(request.weekdays) && request.weekdays.includes(new Date(date).getDay());
  }
  return false; // 'rotate' is handled by computeRotation
}

// Picks `count` rotating requests for the day, those waiting longest first.
// Requests never prayed come first, then by oldest lastPrayedAt, then by age.
// The store caches the result per day key, so praying through part of the
// list in the morning does not reshuffle it by evening.
export function computeRotation(requests, count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (!n) return [];
  return (requests || [])
    .filter((r) => r && r.status === 'active' && r.frequency === 'rotate')
    .slice()
    .sort((a, b) =>
      compareDates(a.lastPrayedAt, b.lastPrayedAt) ||
      compareDates(a.createdAt, b.createdAt) ||
      String(a.id).localeCompare(String(b.id)))
    .slice(0, n)
    .map((r) => r.id);
}

function categoryOrder(categories) {
  const order = new Map();
  (categories || []).forEach((c, i) => order.set(c.id, Number.isFinite(c.order) ? c.order : i));
  return order;
}

export function sortRequests(requests, categories) {
  const order = categoryOrder(categories);
  const pos = (r) => (order.has(r.categoryId) ? order.get(r.categoryId) : Number.MAX_SAFE_INTEGER);
  return requests.slice().sort((a, b) =>
    pos(a) - pos(b) ||
    String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' }));
}

// Everything due on `date`. rotationIds is the day's cached rotation plan.
export function dueToday(state, date = new Date(), rotationIds = []) {
  const requests = (state && state.requests) || [];
  const categories = (state && state.categories) || [];
  const fixed = requests.filter((r) => isDueToday(r, date));
  const fixedIds = new Set(fixed.map((r) => r.id));
  const byId = new Map(requests.map((r) => [r.id, r]));
  const rotation = (rotationIds || [])
    .map((id) => byId.get(id))
    .filter((r) => r && r.status === 'active' && r.frequency === 'rotate' && !fixedIds.has(r.id));
  return {
    fixed: sortRequests(fixed, categories),
    rotation: sortRequests(rotation, categories),
    all: sortRequests([...fixed, ...rotation], categories),
  };
}

// Groups requests under their categories in category order. Requests whose
// category has gone missing are gathered under "Uncategorized" at the end.
export function groupByCategory(requests, categories) {
  const sorted = (categories || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const known = new Set(sorted.map((c) => c.id));
  const groups = sorted
    .map((category) => ({ category, requests: (requests || []).filter((r) => r.categoryId === category.id) }))
    .filter((g) => g.requests.length);
  const orphans = (requests || []).filter((r) => !known.has(r.categoryId));
  if (orphans.length) groups.push({ category: { id: '_uncategorized', name: 'Uncategorized', order: Infinity }, requests: orphans });
  return groups;
}

// "Daily", "Sundays & Wednesdays", "Weekdays", "In rotation"
export function frequencyLabel(request) {
  if (!request) return '';
  if (request.frequency === 'daily') return 'Daily';
  if (request.frequency === 'rotate') return 'In rotation';
  const days = Array.isArray(request.weekdays) ? [...new Set(request.weekdays)].sort((a, b) => a - b) : [];
  if (!days.length) return 'Certain days';
  if (days.length === 7) return 'Daily';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  const names = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const list = days.map((d) => names[d]);
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} & ${list[list.length - 1]}`;
}
