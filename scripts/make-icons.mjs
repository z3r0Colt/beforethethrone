// Draws the app icon as SVG and renders the PNG sizes with Playwright's
// Chromium. Run with: npm run icons
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLUE = '#1f3a5f';
const GOLD = '#d6b560';

// A throne with a crown above its back, set on a dais (Hebrews 4:16), drawn
// on a 512 grid. `scale` shrinks the mark about the center for maskable and
// touch icons, which need a wider safe margin.
export function iconSVG({ rounded = true, scale = 1 } = {}) {
  const t = `translate(256 272) scale(${scale}) translate(-256 -272)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="${BLUE}"/>
  <g transform="${t}" fill="${GOLD}">
    <path d="M200 150 L190 88 L228 116 L256 72 L284 116 L322 88 L312 150 Z"/>
    <path d="M180 318 V236 a76 76 0 0 1 152 0 V318 H304 V240 a48 48 0 0 0 -96 0 V318 Z"/>
    <rect x="126" y="266" width="66" height="22" rx="11"/>
    <rect x="320" y="266" width="66" height="22" rx="11"/>
    <rect x="134" y="280" width="24" height="70" rx="8"/>
    <rect x="354" y="280" width="24" height="70" rx="8"/>
    <rect x="140" y="318" width="232" height="40" rx="12"/>
    <rect x="170" y="352" width="172" height="52" rx="8"/>
    <rect x="118" y="414" width="276" height="30" rx="12"/>
  </g>
</svg>
`;
}

async function render(page, svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: join(root, 'icons', file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

async function main() {
  const any = iconSVG({ rounded: true, scale: 1 });
  writeFileSync(join(root, 'icons', 'icon.svg'), any);
  const executablePath = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});
  const page = await browser.newPage();
  await render(page, any, 192, 'icon-192.png');
  await render(page, any, 512, 'icon-512.png');
  await render(page, any, 32, 'favicon-32.png');
  await render(page, iconSVG({ rounded: false, scale: 0.74 }), 512, 'maskable-512.png');
  await render(page, iconSVG({ rounded: false, scale: 0.86 }), 180, 'apple-touch-icon.png');
  await browser.close();
  console.log('Icons written to icons/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
