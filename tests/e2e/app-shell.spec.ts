import { test, expect } from '../support/test';
import { trackBrokenLocalAssets } from '../support/helpers';

/**
 * Cross-cutting checks for the Angular shell: routing table
 * (src/app/app-routing.module.ts + feature routing modules), document titles,
 * PWA metadata and general page health.
 */

const MAIN_PAGES = [
  {
    path: '/',
    title: 'NOAH - Nationwide Operational Assessment of Hazards',
    ready: (page) =>
      page.getByRole('heading', { name: 'Know Your Hazards', level: 1 }),
  },
  {
    path: '/know-your-hazards',
    title: 'NOAH - Know Your Hazards',
    ready: (page) =>
      page.getByText('Hazard Levels In Your Area').filter({ visible: true }),
  },
  {
    path: '/weather-updates',
    title: 'NOAH - Weather Updates',
    ready: (page) =>
      page
        .getByText('Current Accumulated Rainfall in Your Area')
        .filter({ visible: true }),
  },
  {
    path: '/noah-studio',
    title: 'NOAH Studio',
    ready: (page) => page.locator('#sidebar'),
  },
  {
    path: '/bibliography',
    title: 'NOAH - Nationwide Operational Assessment of Hazards',
    ready: (page) =>
      page.getByRole('heading', {
        name: 'International Publication References',
      }),
  },
] as const;

test.describe('Routing', () => {
  for (const { path, title, ready } of MAIN_PAGES) {
    test(`"${path}" renders with the title "${title}"`, async ({ page }) => {
      await page.goto(path);
      await expect(ready(page).first()).toBeVisible();
      await expect(page).toHaveTitle(title);
    });
  }

  test('the legacy /noah-playground URL redirects to /noah-studio', async ({
    page,
  }) => {
    await page.goto('/noah-playground');
    await expect(page).toHaveURL(/\/noah-studio$/);
    await expect(page).toHaveTitle('NOAH Studio');
  });

  test('/weather-updates opens the rainfall contour view by default', async ({
    page,
  }) => {
    await page.goto('/weather-updates');
    await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
  });

  for (const unknown of [
    '/does-not-exist',
    '/know-your-hazard',
    '/noah-studio/unknown/deep/link',
  ]) {
    test(`unknown route "${unknown}" falls back to the landing page`, async ({
      page,
    }) => {
      await page.goto(unknown);
      await expect(page).toHaveURL(/\/$/);
      await expect(
        page.getByRole('heading', { name: 'Know Your Hazards', level: 1 })
      ).toBeVisible();
    });
  }

  test('browser back/forward navigation works across features', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('navigation')
      .filter({ visible: true })
      .getByRole('button', { name: 'NOAH Studio' })
      .click();
    await expect(page).toHaveURL(/\/noah-studio$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Know Your Hazards', level: 1 })
    ).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/noah-studio$/);
    await expect(page.locator('#sidebar')).toBeVisible();
  });
});

test.describe('Progressive Web App metadata', () => {
  test('index.html links a valid web app manifest whose icons exist', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestHref).toBe('manifest.webmanifest');

    const response = await request.get(`/${manifestHref}`);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      short_name: 'NOAH',
      display: 'standalone',
      start_url: './',
      theme_color: expect.any(String),
      background_color: expect.any(String),
    });
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons.map((icon) => icon.purpose)).toEqual(
      expect.arrayContaining(['any', 'maskable'])
    );

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(`/${icon.src}`);
      expect(iconResponse.ok(), `${icon.src} should exist`).toBe(true);
      expect(iconResponse.headers()['content-type']).toContain('image/png');
    }
  });

  test('declares favicon, apple touch icon, theme colour and viewport', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      /^#/
    );
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    for (const selector of [
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
    ]) {
      const href = await page.locator(selector).getAttribute('href');
      const response = await request.get(`/${href}`);
      expect(response.ok(), `${selector} -> ${href}`).toBe(true);
    }
  });

  test('every iOS splash screen referenced by index.html exists', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('link[rel="apple-touch-startup-image"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const response = await request.head(`/${href}`);
      expect(response.ok(), `${href} should exist`).toBe(true);
    }
  });

  test('the production build publishes the Angular service worker', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const scripts = await page
      .locator('script[src]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src')));
    test.skip(
      scripts.some((src) => src === 'main.js'),
      'Target is a development server (`ng serve`), which does not emit the service worker.'
    );

    const ngsw = await request.get('/ngsw.json');
    expect(ngsw.ok()).toBe(true);
    const config = await ngsw.json();
    expect(config.index).toBe('/index.html');
    expect(config.assetGroups.map((group) => group.name)).toEqual(
      expect.arrayContaining(['app', 'assets'])
    );

    const worker = await request.get('/ngsw-worker.js');
    expect(worker.ok()).toBe(true);
  });
});

test.describe('Page health', () => {
  for (const { path, ready } of MAIN_PAGES) {
    test(`"${path}" has no broken local assets or images`, async ({
      page,
      baseURL,
    }) => {
      const broken = trackBrokenLocalAssets(page, new URL(baseURL!).origin);
      await page.goto(path);
      await expect(ready(page).first()).toBeVisible();

      // Wait for every <img> to settle, then look for ones that failed to decode.
      await expect
        .poll(() =>
          page.evaluate(() =>
            Array.from(document.images).every((img) => img.complete)
          )
        )
        .toBe(true);
      const brokenImages = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.currentSrc && img.naturalWidth === 0)
          .map((img) => img.getAttribute('src'))
      );

      expect(brokenImages, 'images that failed to load').toEqual([]);
      expect(broken, 'same-origin requests that failed').toEqual([]);
    });

    test(`"${path}" logs no application errors to the console`, async ({
      page,
      issues,
    }) => {
      await page.goto(path);
      await expect(ready(page).first()).toBeVisible();
      // Give lazy map/data initialisation a moment to run.
      await page.waitForTimeout(1500);

      const appErrors = issues.consoleErrors.filter(
        // Network-level failures are covered by the broken-asset test above and
        // by mocked 404s (e.g. the satellite video loop).
        (text) => !text.startsWith('Failed to load resource')
      );
      expect(appErrors).toEqual([]);
    });
  }

  test('third-party traffic is limited to known integrations', async ({
    page,
    api,
  }) => {
    for (const { path, ready } of MAIN_PAGES) {
      await page.goto(path);
      await expect(ready(page).first()).toBeVisible();
    }
    expect(
      [...new Set(api.unmocked)],
      'requests to hosts the e2e mock does not know about – add a fixture in tests/support/network.ts'
    ).toEqual([]);
  });
});
