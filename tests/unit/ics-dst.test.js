// Runs in its own process (node --test starts one per file), so the time zone
// can be set before any Date is made.
process.env.TZ = 'America/New_York';

const { default: test } = await import('node:test');
const { default: assert } = await import('node:assert/strict');
const { buildReminderICS } = await import('../../js/ics.js');

const unfold = (ics) => ics.replace(/\r\n /g, '');

test('a reminder in the spring-forward hour keeps the time the user chose', () => {
  // Saturday, March 13, 2027. Clocks go forward at 2:00 the next morning.
  const now = new Date(2027, 2, 13, 9);
  assert.equal(now.getTimezoneOffset(), 300, 'the test runs in US Eastern time');
  const ics = unfold(buildReminderICS({ times: ['02:30', '06:30'], now }));
  assert.ok(ics.includes('DTSTART:20270314T023000'), ics);
  assert.ok(ics.includes('DTSTART:20270314T063000'));
  assert.ok(!ics.includes('T033000'));
});

test('the same holds when the file is made just before the change', () => {
  const now = new Date(2027, 2, 14, 1);
  const ics = unfold(buildReminderICS({ times: ['02:30'], now }));
  assert.ok(ics.includes('DTSTART:20270314T023000'), ics);
});
