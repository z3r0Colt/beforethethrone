// Boots the app: applies appearance, wires navigation, registers the service
// worker, and keeps an eye on storage and updates.

import { defineRoutes, start, render as rerender, hasUnsavedInput } from './router.js';
import { getState, subscribe, reload, forgetLocalCopies, STORAGE_KEY } from './store.js';
import { icon, toast, closeAllSheets } from './dom.js';
import { initInstall } from './install.js';
import { APP_VERSION } from './version.js';

const views = {
  today: () => import('./views/today.js'),
  pray: () => import('./views/pray.js'),
  requests: () => import('./views/requests.js'),
  ebenezer: () => import('./views/ebenezer.js'),
  journal: () => import('./views/journal.js'),
  learn: () => import('./views/learn.js'),
  settings: () => import('./views/settings.js'),
};

// Order matters: fixed paths come before :param paths.
export const ROUTES = [
  { pattern: '/today', view: views.today, tab: 'today' },
  { pattern: '/pray', view: views.pray, focus: true },
  { pattern: '/requests', view: views.requests, tab: 'requests' },
  { pattern: '/requests/new', view: views.requests, tab: 'requests' },
  { pattern: '/requests/categories', view: views.requests, tab: 'requests' },
  { pattern: '/requests/:id', view: views.requests, tab: 'requests' },
  { pattern: '/ebenezer', view: views.ebenezer, tab: 'ebenezer' },
  { pattern: '/journal', view: views.journal, tab: 'journal' },
  { pattern: '/journal/new', view: views.journal, tab: 'journal' },
  { pattern: '/journal/:id', view: views.journal, tab: 'journal' },
  { pattern: '/learn', view: views.learn, tab: 'learn' },
  { pattern: '/learn/wsc', view: views.learn, tab: 'learn' },
  { pattern: '/learn/wsc/:n', view: views.learn, tab: 'learn' },
  { pattern: '/learn/wcf', view: views.learn, tab: 'learn' },
  { pattern: '/learn/wlc', view: views.learn, tab: 'learn' },
  { pattern: '/learn/topic/:id', view: views.learn, tab: 'learn' },
  { pattern: '/settings', view: views.settings, tab: 'settings' },
  { pattern: '/settings/about', view: views.settings, tab: 'settings' },
];

const THEME_COLORS = { light: '#f6f1e6', dark: '#0e131b' };

function effectiveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyAppearance(settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.textsize = settings.textSize;
  const color = THEME_COLORS[effectiveTheme(settings.theme)];
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    if (settings.theme === 'auto') {
      meta.setAttribute('content', meta.media && meta.media.includes('dark') ? THEME_COLORS.dark : THEME_COLORS.light);
    } else {
      meta.setAttribute('content', color);
    }
  });
}

function fillIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.replaceWith(icon(el.dataset.icon));
  });
}

function onRoute({ route }) {
  closeAllSheets();
  document.body.classList.toggle('focus-mode', !!route.focus);
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === route.tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function wireSkipLink(main) {
  const skip = document.querySelector('[data-skip]');
  if (!skip) return;
  // The hash is used for routing, so the skip link moves focus by script.
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    const target = main.querySelector('h1') || main;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  });
}

// A re-render rebuilds the page from saved state, so it waits while the user
// has words in an open sheet or unsaved changes in a form.
function safeToRerender() {
  return !document.querySelector('dialog[open]') && !hasUnsavedInput();
}

function watchStorage() {
  let stale = false;
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    reload();
    if (e.newValue === null) {
      // Everything was erased in another tab. Leave the current page (its
      // cleanup may save a draft), then remove whatever this tab still keeps.
      // Blurring first lets a field's change event fire now, before cleanup,
      // rather than when the field is removed and a late draft is written.
      stale = false;
      const active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') active.blur();
      history.replaceState(null, '', '#/today');
      const done = rerender();
      forgetLocalCopies();
      Promise.resolve(done).finally(forgetLocalCopies);
      return;
    }
    // Re-render now only if this tab is hidden, so typing is never lost.
    if (document.hidden && safeToRerender()) rerender();
    else stale = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && stale && safeToRerender()) {
      stale = false;
      rerender();
    }
  });
  let lastWarned = 0;
  window.addEventListener('btt:storage-error', () => {
    const now = Date.now();
    if (now - lastWarned < 30000) return;
    lastWarned = now;
    toast('Could not save on this device. Storage may be full or blocked. Export a backup from Settings to be safe.', { timeout: 8000 });
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  let hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  let reloadRequested = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    // The first install taking charge of this page is not an update. Any later
    // change is, and so is the one the user asked for with Reload.
    if (!hadController && !reloadRequested) {
      hadController = true;
      return;
    }
    refreshing = true;
    window.location.reload();
  });
  const promptUpdate = (worker) => {
    toast('A new version is ready.', {
      timeout: 0,
      action: {
        label: 'Reload',
        onClick: () => {
          reloadRequested = true;
          worker.postMessage({ type: 'SKIP_WAITING' });
        },
      },
    });
  };
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if (!reg) return;
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(worker);
        });
      });
      let lastCheck = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden || Date.now() - lastCheck < 60 * 60 * 1000) return;
        lastCheck = Date.now();
        reg.update().catch(() => {});
      });
    }).catch((err) => console.warn('Service worker registration failed', err));
  });
}

function boot() {
  const main = document.getElementById('main');
  document.documentElement.dataset.appVersion = APP_VERSION;
  const state = getState();
  applyAppearance(state.settings);
  subscribe((s) => applyAppearance(s.settings));
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyAppearance(getState().settings);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
  fillIcons();
  wireSkipLink(main);
  watchStorage();
  initInstall();
  defineRoutes(ROUTES, { main, onRoute });
  start();
  registerServiceWorker();
}

boot();
