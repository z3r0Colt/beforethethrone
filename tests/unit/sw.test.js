import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_VERSION } from '../../js/version.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

function listFiles(dir) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(root, rel)).isDirectory() ? listFiles(rel) : [rel];
  });
}

function precacheList() {
  const block = sw.slice(sw.indexOf('const PRECACHE = ['), sw.indexOf('];', sw.indexOf('const PRECACHE = [')));
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test('sw.js VERSION matches APP_VERSION', () => {
  const m = /const VERSION = '([^']+)'/.exec(sw);
  assert.ok(m, 'VERSION constant in sw.js');
  assert.equal(m[1], APP_VERSION);
});

test('the precache list is exactly the app files on disk', () => {
  const listed = precacheList().filter((u) => u !== './').map((u) => u.replace(/^\.\//, ''));
  const onDisk = [
    'index.html',
    'manifest.webmanifest',
    ...listFiles('css'),
    ...listFiles('js'),
    ...listFiles('icons'),
  ].map((p) => p.split('\\').join('/'));
  assert.deepEqual([...listed].sort(), [...new Set(onDisk)].sort());
  for (const f of listed) assert.ok(existsSync(join(root, f)), `missing ${f}`);
});

test('index.html references only files that are precached', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="\.\/([^"#?]+)"/g)].map((m) => m[1]);
  const listed = new Set(precacheList().map((u) => u.replace(/^\.\//, '')));
  for (const r of refs) assert.ok(listed.has(r), `${r} is not precached`);
});

test('manifest icons exist and include a maskable icon', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const icon of manifest.icons) assert.ok(existsSync(join(root, icon.src)), icon.src);
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192'));
  assert.ok(manifest.icons.some((i) => i.sizes === '512x512'));
  // A relative id resolves against the origin, not the app's folder, so on a
  // shared github.io host it would collide with other apps.
  assert.ok(!('id' in manifest) || !['./', '/', '.', ''].includes(manifest.id), 'manifest id must not resolve to the origin root');
});

test('the service worker names its cache after its own folder', () => {
  assert.match(sw, /const PREFIX = `btt-\$\{SCOPE\}-`;/);
  assert.ok(sw.includes('k.startsWith(PREFIX) && k !== CACHE'), 'activate deletes only this app\'s old caches');
  assert.ok(!sw.includes("startsWith('btt-')"));
});

test('no source file uses a relative path that escapes a sub-path deploy', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(!/(?:href|src)="\/(?!\/)/.test(html), 'index.html must not use root-absolute paths');
  const manifest = readFileSync(join(root, 'manifest.webmanifest'), 'utf8');
  assert.ok(!/"\/(?!\/)[^"]*"/.test(manifest), 'manifest must not use root-absolute paths');
});
