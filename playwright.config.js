import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the pre-installed Chromium when present (the cloud dev container);
// otherwise Playwright's own download is used.
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    ...devices['Pixel 7'],
    viewport: { width: 390, height: 844 },
    launchOptions: existsSync(localChromium) ? { executablePath: localChromium } : {},
    serviceWorkers: 'allow',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'npx http-server -p 4173 -c-1 -s .',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
