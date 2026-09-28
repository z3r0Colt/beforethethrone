// The heart of the app: a full guided time of prayer.
import { test, expect } from '@playwright/test';

const KEY = 'beforethethrone:v1';

function seed(page, state) {
  return page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('seeded', '1');
    }
  }, [KEY, JSON.stringify(state)]);
}

const requests = [
  { id: 'wife', title: 'My wife', categoryId: 'family', frequency: 'daily', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'pastor', title: 'Our pastor', categoryId: 'church', frequency: 'daily', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'heart', title: 'A humble heart', categoryId: 'soul', frequency: 'daily', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
];

async function stored(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}

test('a full Lord’s Prayer session marks requests prayed and keeps a note', async ({ page }) => {
  await seed(page, { settings: { onboarded: true }, requests });
  await page.goto('/#/pray?method=lords-prayer');
  await expect(page.locator('body')).toHaveClass(/focus-mode/);
  await expect(page.locator('.tabbar')).toBeHidden();

  const next = page.locator('.pray-next');
  const toggles = page.locator('.pray-req-toggle');
  let guard = 0;
  while ((await next.textContent()).trim() !== 'Amen' && guard++ < 20) {
    const count = await toggles.count();
    for (let i = 0; i < count; i++) {
      const t = toggles.nth(i);
      if ((await t.getAttribute('aria-pressed')) === 'false') await t.click();
    }
    await next.click();
  }
  expect(guard).toBeLessThan(20);
  await page.getByLabel('Anything to remember from this time?').fill('The Lord was near this morning.');
  await next.click();

  await expect(page).toHaveURL(/#\/today$/);
  const state = await stored(page);
  for (const r of state.requests) {
    expect(r.prayedCount, r.title).toBe(1);
    expect(r.lastPrayedAt, r.title).not.toBeNull();
  }
  expect(state.sessions).toHaveLength(1);
  expect(state.sessions[0].method).toBe('lords-prayer');
  expect(state.sessions[0].prayedIds.sort()).toEqual(['heart', 'pastor', 'wife']);
  expect(state.journal.some((e) => e.kind === 'session' && e.text.includes('The Lord was near'))).toBe(true);
});

test('each request appears once in every method', async ({ page }) => {
  await seed(page, { settings: { onboarded: true }, requests });
  for (const method of ['lords-prayer', 'acts', 'henry', 'list']) {
    await page.goto(`/#/pray?method=${method}`);
    const seen = [];
    const next = page.locator('.pray-next');
    let guard = 0;
    for (;;) {
      seen.push(...(await page.locator('.pray-req-title').allTextContents()));
      if ((await next.textContent()).trim() === 'Amen' || guard++ > 20) break;
      await next.click();
    }
    const titles = seen.map((t) => t.replace('Prayed for ', '').trim()).sort();
    expect(titles, method).toEqual(['A humble heart', 'My wife', 'Our pastor']);
    // leave without recording anything
    await page.evaluate(() => sessionStorage.removeItem('beforethethrone:pray-session'));
  }
});

test('arrow keys move between steps', async ({ page }) => {
  await seed(page, { settings: { onboarded: true }, requests });
  await page.goto('/#/pray?method=acts');
  const count = page.locator('.pray-count');
  await expect(count).toHaveText(/Step 1 of/);
  await page.keyboard.press('ArrowRight');
  await expect(count).toHaveText(/Step 2 of/);
  await page.keyboard.press('ArrowLeft');
  await expect(count).toHaveText(/Step 1 of/);
});
