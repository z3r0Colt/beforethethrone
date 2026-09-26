// App-wide checks: every route renders without errors, the service worker
// installs, and the app keeps working offline.
import { test, expect } from '@playwright/test';

const ROUTES = [
  '#/today', '#/pray', '#/pray?method=acts', '#/pray?method=henry', '#/pray?method=list',
  '#/requests', '#/requests/new', '#/requests/categories', '#/requests/does-not-exist',
  '#/ebenezer', '#/journal', '#/journal/new', '#/journal/does-not-exist',
  '#/learn', '#/learn/wsc', '#/learn/wsc/1', '#/learn/wsc/98', '#/learn/wsc/107', '#/learn/wsc/999',
  '#/learn/wcf', '#/learn/wlc', '#/learn/topic/kingdom', '#/learn/topic/nope',
  '#/settings', '#/settings/about',
];

function collectProblems(page) {
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

for (const theme of ['light', 'dark']) {
  test(`every route renders with an h1 and no errors (${theme})`, async ({ page }) => {
    const problems = collectProblems(page);
    await page.addInitScript((t) => {
      if (!localStorage.getItem('beforethethrone:v1')) {
        localStorage.setItem('beforethethrone:v1', JSON.stringify({ settings: { theme: t, onboarded: true } }));
      }
    }, theme);
    for (const route of ROUTES) {
      await page.goto(`/${route}`);
      await expect(page.locator('main h1').first(), route).toBeVisible();
      await expect(page.locator('main .error-card'), `${route} fell into the error card`).toHaveCount(0);
    }
    expect(problems).toEqual([]);
  });
}

test('unknown routes go to Today', async ({ page }) => {
  await page.goto('/#/no/such/page');
  await expect(page).toHaveURL(/#\/today$/);
});

test('the service worker installs and the app works offline', async ({ page, context }) => {
  await page.goto('/#/today');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once so the page is controlled by the worker.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('main h1').first()).toBeVisible();
  for (const route of ['#/requests', '#/learn/wsc/98', '#/pray']) {
    await page.goto(`/${route}`);
    await expect(page.locator('main h1').first(), route).toBeVisible();
  }
  await context.setOffline(false);
});

test('the manifest is linked and valid', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(`/${href.replace(/^\.\//, '')}`);
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.start_url).toBe('./#/today');
  expect(manifest.display).toBe('standalone');
});
