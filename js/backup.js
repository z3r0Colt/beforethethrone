// Backups are plain JSON files the user keeps. This is the only way data
// leaves the device, and only when the user asks for it.

import { migrate } from './store.js';
import { dayKey } from './dates.js';

export const BACKUP_APP = 'beforethethrone';
export const BACKUP_FORMAT = 1;
// The largest backup text parseBackup accepts. It is compared with the text's
// length, a count of characters rather than bytes, and a backup file can be
// well over the size of the state it holds. Older backups were pretty-printed
// with indentation on every line, so the limit leaves generous room above the
// few megabytes that browser storage allows for the state itself.
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export function exportBackup(state, now = new Date()) {
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: new Date(now).toISOString(),
    state: JSON.parse(JSON.stringify(state)),
  };
}

export function backupFilename(now = new Date()) {
  return `before-the-throne-backup-${dayKey(now)}.json`;
}

export function parseBackup(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: 'That file is empty.' };
  }
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, error: 'That file is too large to be a Before the Throne backup.' };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file could not be read. Choose a backup file made by this app.' };
  }
  if (!data || typeof data !== 'object' || data.app !== BACKUP_APP || typeof data.state !== 'object' || data.state === null) {
    return { ok: false, error: 'That file is not a Before the Throne backup.' };
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    return { ok: false, error: 'That backup was made by a newer version of the app. Update the app and try again.' };
  }
  const state = migrate(data.state);
  return {
    ok: true,
    state,
    exportedAt: data.exportedAt || null,
    counts: { requests: state.requests.length, journal: state.journal.length },
  };
}

export function readFileAsText(file) {
  if (file && typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
