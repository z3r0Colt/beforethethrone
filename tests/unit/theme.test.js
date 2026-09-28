import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = readFileSync(join(root, 'css', 'base.css'), 'utf8');

// The body of the first rule that follows `selector`.
function block(source, selector, from = 0) {
  const at = source.indexOf(selector, from);
  assert.ok(at >= 0, `${selector} is in base.css`);
  const open = source.indexOf('{', at);
  const close = source.indexOf('}', open);
  return source.slice(open + 1, close);
}

function tokens(body) {
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

test('the Auto theme on a dark device uses the same colors as the Dark theme', () => {
  const dark = tokens(block(css, ':root[data-theme="dark"]'));
  const media = css.indexOf('@media (prefers-color-scheme: dark)');
  assert.ok(media >= 0);
  const autoDark = tokens(block(css, ':root[data-theme="auto"]', media));
  assert.ok(Object.keys(dark).length > 10);
  assert.deepEqual(autoDark, dark);
});

test('the light and dark themes define the same tokens', () => {
  const light = tokens(block(css, ':root[data-theme="light"]'));
  const dark = tokens(block(css, ':root[data-theme="dark"]'));
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort());
});
