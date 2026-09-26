// A small hash router. Hash routes work on any static host, including a
// GitHub Pages sub-path, with no server rewrites.

let routes = [];
let mainEl = null;
let cleanup = null;
let renderSeq = 0;
let onRouteHook = null;
let lastPath = null;
let prevPath = null;

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  let path = pathPart || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  const query = {};
  for (const [k, v] of new URLSearchParams(queryPart)) query[k] = v;
  return { path, query };
}

export function matchRoute(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) {
      try { params[a[i].slice(1)] = decodeURIComponent(b[i]); } catch { return null; }
    } else if (a[i] !== b[i]) {
      return null;
    }
  }
  return params;
}

export function defineRoutes(table, { main, onRoute } = {}) {
  routes = table;
  if (main) mainEl = main;
  if (onRoute) onRouteHook = onRoute;
}

// The path shown before the current one (null on first load). Lets a page
// send the user back where they came from.
export function previousPath() {
  return prevPath;
}

export function currentPath() {
  return parseHash(location.hash).path;
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path.startsWith('/') ? path : `/${path}`}`;
  if (replace) {
    history.replaceState(null, '', target);
    render();
  } else if (location.hash === target) {
    render();
  } else {
    location.hash = target;
  }
}

function find(path) {
  for (const route of routes) {
    const params = matchRoute(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}

function errorCard(error) {
  const wrap = document.createElement('div');
  wrap.className = 'card error-card';
  const h = document.createElement('h1');
  h.className = 'page-title';
  h.tabIndex = -1;
  h.textContent = 'Something went wrong';
  const p = document.createElement('p');
  p.textContent = 'This page could not be shown. Your prayers and notes are safe on this device. Try going back to Today.';
  const a = document.createElement('a');
  a.className = 'btn btn-primary';
  a.href = '#/today';
  a.textContent = 'Go to Today';
  const pre = document.createElement('p');
  pre.className = 'small muted';
  pre.textContent = String(error && error.message ? error.message : error);
  wrap.append(h, p, a, pre);
  return wrap;
}

export async function render() {
  if (!mainEl) return;
  const seq = ++renderSeq;
  const { path, query } = parseHash(location.hash);
  const found = find(path);
  if (!found) {
    history.replaceState(null, '', '#/today');
    if (path !== '/today') return render();
    return undefined;
  }
  const { route, params } = found;
  if (path !== lastPath) {
    prevPath = lastPath;
    lastPath = path;
  }
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error(e); }
  }
  cleanup = null;
  if (onRouteHook) onRouteHook({ route, path, params, query });
  let mod;
  try {
    mod = await route.view();
  } catch (error) {
    if (seq !== renderSeq) return undefined;
    mainEl.replaceChildren(errorCard(error));
    console.error(error);
    return undefined;
  }
  if (seq !== renderSeq) return undefined; // a newer navigation won
  mainEl.replaceChildren();
  mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
  try {
    const result = await mod.render(mainEl, { params, query, path, navigate });
    if (seq !== renderSeq) {
      if (typeof result === 'function') result();
      return undefined;
    }
    cleanup = typeof result === 'function' ? result : null;
  } catch (error) {
    console.error(error);
    mainEl.replaceChildren(errorCard(error));
  }
  // Marks which path finished rendering (tests wait on this).
  mainEl.dataset.path = path;
  const title = mainEl.querySelector('h1');
  if (title && document.activeElement !== title && !mainEl.contains(document.activeElement)) {
    if (!title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }
  return undefined;
}

export function start() {
  window.addEventListener('hashchange', render);
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    history.replaceState(null, '', '#/today');
  }
  return render();
}
