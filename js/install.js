// Tracks whether the app can be installed, so Settings can offer it.

let deferredPrompt = null;
const listeners = new Set();

export function initInstall() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

export function canPromptInstall() {
  return !!deferredPrompt;
}

// Shows the browser's install dialog. Resolves to 'accepted', 'dismissed', or 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const event = deferredPrompt;
  deferredPrompt = null;
  event.prompt();
  try {
    const choice = await event.userChoice;
    return choice && choice.outcome ? choice.outcome : 'dismissed';
  } catch {
    return 'dismissed';
  } finally {
    listeners.forEach((fn) => fn(false));
  }
}

export function onInstallableChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
