import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the NOAH frontend end-to-end suite.
 *
 * By default the suite builds the production bundle, serves it from
 * `dist/noah-frontend` on E2E_PORT (4300, so it never collides with a local
 * `ng serve` on 4200) and runs every spec against a hermetic network mock
 * (see tests/support/network.ts).
 *
 * Environment variables:
 *   E2E_BASE_URL   Test an already running deployment instead of building
 *                  (e.g. http://localhost:4200 for `ng serve`, or staging).
 *   E2E_PORT       Port for the local static server (default 4300).
 *   E2E_SKIP_BUILD Reuse the existing dist/ build (faster local reruns).
 *   E2E_LIVE       Also run tests/live – smoke checks against the real APIs.
 *   CI             Enables retries, forbids test.only, adds CI reporters.
 *
 * See https://playwright.dev/docs/test-configuration.
 */

const isCI = !!process.env.CI;
const PORT = Number(process.env.E2E_PORT ?? 4300);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

const serveCommand = `node tests/support/static-server.mjs ${PORT} dist/noah-frontend`;
const webServerCommand = process.env.E2E_SKIP_BUILD
  ? serveCommand
  : `npm run e2e:build && ${serveCommand}`;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

/** Specs ending in .mobile.spec.ts cover the phone layouts only. */
const MOBILE_SPECS = /.*\.mobile\.spec\.ts$/;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/live/**'],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Studio pages render 3D terrain with software WebGL; more parallel tabs
  // than this exhausts memory on typical laptops and CI runners.
  workers: isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // Angular's service worker would bypass page.route(); block it so the
    // network mock sees every request.
    serviceWorkers: 'block',
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
      testIgnore: ['**/live/**', MOBILE_SPECS],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT },
      testIgnore: ['**/live/**', MOBILE_SPECS],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT },
      testIgnore: ['**/live/**', MOBILE_SPECS],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: MOBILE_SPECS,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: MOBILE_SPECS,
    },
    ...(process.env.E2E_LIVE
      ? [
          {
            name: 'live',
            testDir: './tests/live',
            testIgnore: [],
            retries: 1,
            use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
          },
        ]
      : []),
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: webServerCommand,
        url: BASE_URL,
        reuseExistingServer: !isCI,
        // Includes the Angular production build (~1-3 minutes).
        timeout: 10 * 60_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
