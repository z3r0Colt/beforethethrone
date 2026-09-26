// The everyday flows: first run, requests and their answers, the journal,
// Learn, appearance, backups, and a picture of every screen in both themes.
import { test, expect } from '@playwright/test';

const KEY = 'beforethethrone:v1';

// Seeds storage once per page, so reloads and navigation keep what the app saved.
function seed(page, state) {
  return page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('seeded')) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      sessionStorage.setItem('seeded', '1');
    }
  }, [KEY, state === null ? null : JSON.stringify(state)]);
}

async function stored(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}

function collectProblems(page) {
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

test('first run: the welcome card takes a name and goes away', async ({ page }) => {
  const problems = collectProblems(page);
  await seed(page, null);
  await page.goto('/#/today');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/today');
  const form = page.locator('.today-welcome-form');
  await expect(form).toBeVisible();
  await form.locator('input[name="given-name"]').fill('Anna');
  await form.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('main h1')).toContainText('Anna');
  await expect(page.locator('.today-welcome-form')).toHaveCount(0);
  const state = await stored(page);
  expect(state.settings.onboarded).toBe(true);
  expect(state.settings.name).toBe('Anna');
  expect(problems).toEqual([]);
});

test('add a request, mark it answered, and find it on the Ebenezer', async ({ page }) => {
  const problems = collectProblems(page);
  await seed(page, { settings: { onboarded: true } });
  await page.goto('/#/requests/new');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/requests/new');
  await page.locator('.req-title-input').fill('Work for Tom');
  await page.locator('.req-details-input').fill('He has been looking since spring.');
  await page.locator('main form').getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('main')).toHaveAttribute('data-path', '/requests');
  const item = page.locator('.req-item', { hasText: 'Work for Tom' });
  await expect(item).toHaveCount(1);

  await item.click();
  await expect(page.locator('main')).toHaveAttribute('data-path', /^\/requests\/[^/]+$/);
  await page.locator('.req-action-answer').click();
  const sheet = page.locator('dialog.sheet[open]');
  await expect(sheet).toBeVisible();
  await sheet.getByLabel('How did the Lord answer?').fill('The Lord gave Tom work at the mill.');
  await sheet.getByRole('button', { name: 'Mark answered' }).click();

  await expect(page.locator('main')).toHaveAttribute('data-path', '/ebenezer');
  const card = page.locator('.eb-card', { hasText: 'Work for Tom' });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('The Lord gave Tom work at the mill.');
  const state = await stored(page);
  expect(state.requests[0].status).toBe('answered');
  expect(problems).toEqual([]);
});

test('write a journal entry and see it in the list', async ({ page }) => {
  const problems = collectProblems(page);
  await seed(page, { settings: { onboarded: true } });
  await page.goto('/#/journal/new');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/journal/new');
  await page.locator('.jr-title-input').fill('Morning');
  await page.getByLabel('Entry', { exact: true }).fill('The Lord is my shepherd. I lack nothing today.');
  await page.locator('main form').getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('main')).toHaveAttribute('data-path', '/journal');
  await expect(page.locator('.jr-item', { hasText: 'Morning' })).toHaveCount(1);
  const state = await stored(page);
  expect(state.journal).toHaveLength(1);
  expect(state.journal[0].text).toContain('The Lord is my shepherd.');
  expect(await page.evaluate(() => localStorage.getItem('btt:journal-draft'))).toBeNull();
  expect(problems).toEqual([]);
});

test('Learn: from Shorter Catechism Q. 98 to the next question', async ({ page }) => {
  await seed(page, { settings: { onboarded: true } });
  await page.goto('/#/learn/wsc/98');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/learn/wsc/98');
  await expect(page.locator('main')).toContainText('What is prayer?');
  await page.locator('.learn-pager-next').click();
  await expect(page.locator('main')).toHaveAttribute('data-path', '/learn/wsc/99');
  await expect(page.locator('main .qa-num').first()).toContainText('Question 99');
});

test('changing the theme applies it and keeps it', async ({ page }) => {
  await seed(page, { settings: { onboarded: true, theme: 'light' } });
  await page.goto('/#/settings');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/settings');
  await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await stored(page)).settings.theme).toBe('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Export backup downloads a file of everything', async ({ page }) => {
  await seed(page, { settings: { onboarded: true }, requests: [{ id: 'a', title: 'Our pastor', categoryId: 'church' }] });
  await page.goto('/#/settings');
  await expect(page.locator('main')).toHaveAttribute('data-path', '/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^before-the-throne-backup-\d{4}-\d{2}-\d{2}\.json$/);
});

test.describe('on a device set to dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('the Auto theme uses the dark gold for labels', async ({ page }) => {
    await seed(page, { settings: { onboarded: true, theme: 'auto' } });
    await page.goto('/#/today');
    await expect(page.locator('main')).toHaveAttribute('data-path', '/today');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
    const color = await page.locator('.card-subtitle').first().evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(214, 181, 96)');
  });
});

// ---------- screenshots ----------

const SCREENS = [
  '#/today', '#/pray', '#/pray?method=acts', '#/pray?method=henry', '#/pray?method=list',
  '#/requests', '#/requests/new', '#/requests/categories', '#/requests/wife', '#/requests/job',
  '#/ebenezer', '#/journal', '#/journal/new', '#/journal/j1',
  '#/learn', '#/learn/wsc', '#/learn/wsc/98', '#/learn/wcf', '#/learn/wlc', '#/learn/topic/kingdom',
  '#/settings', '#/settings/about',
];

const sample = {
  requests: [
    { id: 'wife', title: 'My wife', details: 'Strength and joy in caring for the little ones.', categoryId: 'family', frequency: 'daily', status: 'active', createdAt: '2026-08-01T12:00:00.000Z' },
    { id: 'pastor', title: 'Our pastor', details: 'Preparing for the Lord’s Day.', categoryId: 'church', frequency: 'weekdays', weekdays: [5, 6], status: 'active', promise: '2 Thessalonians 3:1', createdAt: '2026-08-02T12:00:00.000Z' },
    { id: 'neighbor', title: 'Neighbor John', categoryId: 'lost', frequency: 'rotate', status: 'active', createdAt: '2026-08-03T12:00:00.000Z' },
    { id: 'job', title: 'Work for Tom', categoryId: 'friends', frequency: 'daily', status: 'answered', createdAt: '2026-06-01T12:00:00.000Z', answeredAt: '2026-09-20T12:00:00.000Z', answerNote: 'The Lord gave Tom work at the mill.' },
  ],
  journal: [
    { id: 'j1', date: '2026-09-25', title: 'Evening', text: 'Thankful for a quiet evening of family worship.', createdAt: '2026-09-25T23:00:00.000Z' },
  ],
};

for (const theme of ['light', 'dark']) {
  test(`screenshots of every screen (${theme})`, async ({ page }) => {
    test.setTimeout(120_000);
    await seed(page, { settings: { onboarded: true, name: 'Anna', theme }, ...sample });
    for (const route of SCREENS) {
      await page.goto(`/${route}`);
      await expect(page.locator('main'), route).toHaveAttribute('data-path', route.replace(/^#/, '').split('?')[0]);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // Leave a pray session without saving progress for the next method.
      if (route.startsWith('#/pray')) await page.evaluate(() => sessionStorage.removeItem('beforethethrone:pray-session'));
      const slug = route.replace(/^#\//, '').replace(/[/?=]+/g, '-');
      await page.screenshot({ path: `test-results/screens/${theme}-${slug}.png`, fullPage: true, animations: 'disabled' });
    }
  });
}
