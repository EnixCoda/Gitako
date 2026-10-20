import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

if (process.arch === 'arm64' && process.platform === 'darwin') {
  dotenv.config()
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSION_PATH = path.resolve(__dirname, 'dist')

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The signed-in nightly (run.sh sets GITAKO_PREVIEW_TARGET per pass) drives
  // ~80 live github.com navigations per pass, so it draws the occasional
  // transient flake — a slow Turbo `load`, a tree-fetch that lands a beat late,
  // or an outright `net::ERR_CONNECTION_CLOSED` — that no test logic can
  // prevent. Give the nightly retries so those auto-recover (the report still
  // marks them "flaky", so a genuinely broken test stays visible). Local
  // single-spec runs keep 0 retries (fast, fail-loud); CI keeps its own count.
  retries: process.env.CI ? 3 : process.env.GITAKO_PREVIEW_TARGET ? 2 : 0,
  // Playwright defaults to 50% of CPU cores when `workers` is unset — 7 on a
  // 14-core machine — but every spec shares the one signed-in persistent
  // profile dir, which takes a filesystem lock: parallel workers race on it
  // and produce false `createContext` failures. The suite is serial by design
  // (the nightly forces `--workers=1`), so default to 1; override with
  // GITAKO_WORKERS.
  workers: process.env.GITAKO_WORKERS ? Number(process.env.GITAKO_WORKERS) : 1,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    // The nightly owns persistent contexts and records every attempt to video.
    // Automatic first-retry tracing can stall while Playwright finalizes a
    // manually managed persistent context, turning an otherwise completed
    // retry into a misleading timeout. Keep traces for ordinary local/CI runs;
    // the nightly uses its archived videos and error contexts instead.
    trace: process.env.GITAKO_PREVIEW_TARGET ? 'off' : 'on-first-retry',
    // NOTE: specs use a persistent context (see fixtures.ts), which ignores
    // this `video` option — recording is decided in fixtures.ts
    // (shouldRecordVideo) and written to test-results/videos/ with descriptive
    // names. This setting only affects any non-persistent-context test.
    video: process.env.GITAKO_VIDEO === '1' ? 'on' : 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Load the extension
        launchOptions: {
          args: [
            `--no-sandbox`,
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
          ],
          headless: false,
        },
      },
    },
  ],
})
