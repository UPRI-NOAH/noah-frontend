import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * LIVE checks against the real services the frontend depends on. These are
 * NOT hermetic: run them on a schedule or before a release
 * (`npm run test:e2e:live`), not on every pull request.
 *
 * They catch what the mocked suite cannot: an expired or rotated Mapbox
 * token, a renamed static file on webgis-static, or a changed API shape.
 */

const PRODUCTION_SITE = 'https://noah.up.edu.ph';
// The NOAH Mapbox token is URL-restricted to the production site, so API
// calls identify themselves the same way the browser does there.
test.use({ extraHTTPHeaders: { Referer: `${PRODUCTION_SITE}/` } });

/** Reads the token and style ids that the production build ships with. */
function productionMapboxConfig() {
  const source = readFileSync(
    join(__dirname, '..', '..', 'src', 'environments', 'environment.prod.ts'),
    'utf8'
  );
  const token = source.match(/accessToken:\s*'([^']+)'/)?.[1];
  const styles = [...source.matchAll(/mapbox:\/\/styles\/([\w-]+\/\w+)/g)].map(
    (m) => m[1]
  );
  if (!token || styles.length === 0)
    throw new Error('Could not parse environment.prod.ts');
  return { token, styles };
}

const { token, styles } = productionMapboxConfig();
const DEFAULT_CENTER = '121.0709613,14.6577006';

test.describe('Mapbox', () => {
  for (const style of styles) {
    test(`style ${style} loads with the production token`, async ({
      request,
    }) => {
      const response = await request.get(
        `https://api.mapbox.com/styles/v1/${style}`,
        {
          params: { access_token: token },
        }
      );
      expect(response.status(), await response.text()).toBe(200);
      expect((await response.json()).version).toBe(8);
    });
  }

  test('Search Box suggest returns Philippine places', async ({ request }) => {
    const response = await request.get(
      'https://api.mapbox.com/search/searchbox/v1/suggest',
      {
        params: {
          q: 'Marikina',
          country: 'ph',
          session_token: '00000000-0000-4000-8000-000000000000',
          access_token: token,
        },
      }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.suggestions[0]).toHaveProperty('mapbox_id');
  });

  test('hazard tilequery answers for the default Know Your Hazards point', async ({
    request,
  }) => {
    const tilesets =
      'upri-noah.ph_fh_100yr_tls,upri-noah.ph_fh_nodata1_tls,upri-noah.ph_lh_lh1_tls,upri-noah.ph_lh_lh2_tls,upri-noah.ph_ssh_ssa4_tls';
    const response = await request.get(
      `https://api.mapbox.com/v4/${tilesets}/tilequery/${DEFAULT_CENTER}.json`,
      { params: { radius: '0', limit: '20', access_token: token } }
    );
    expect(response.status()).toBe(200);
    expect((await response.json()).type).toBe('FeatureCollection');
  });
});

test.describe('NOAH static data (webgis-static.up.edu.ph)', () => {
  const BASE = 'https://webgis-static.up.edu.ph/api';

  const images = [
    'contours/1hr_latest_rainfall_contour.png',
    'contours/24hr_latest_rainfall_contour.png',
    'rainfall/rainmap_gtif_day1.png',
    'temperature/HI_1.png',
    'temperature/t2m_1.png',
  ];
  for (const path of images) {
    test(`${path} is published`, async ({ request }) => {
      const response = await request.get(`${BASE}/${path}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/');
    });
  }

  const geojson = [
    'typhoon_track/pagasa_typhoon.geojson',
    'typhoon_track/multi_typhoon.geojson',
    'par/par_outline.json',
    'lightning/lightning.geojson',
    'volcanoes/active_volcano_rad.geojson',
  ];
  for (const path of geojson) {
    test(`${path} is a GeoJSON FeatureCollection`, async ({ request }) => {
      const response = await request.get(`${BASE}/${path}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.type).toBe('FeatureCollection');
      expect(Array.isArray(body.features)).toBe(true);
    });
  }

  test('hazards/ph_combined_tileset.json lists Mapbox tilesets', async ({
    request,
  }) => {
    const body = await (
      await request.get(`${BASE}/hazards/ph_combined_tileset.json`)
    ).json();
    expect(body.length).toBeGreaterThan(0);
    for (const entry of body) {
      expect(entry.url).toMatch(/^mapbox:\/\/upri-noah\./);
      expect(Array.isArray(entry.sourceLayer)).toBe(true);
    }
  });

  test('wind grids expose speed/direction points', async ({ request }) => {
    for (const path of [
      'wind/wind_grid.json',
      'wind/wind_forecast_grid.json',
    ]) {
      const body = await (await request.get(`${BASE}/${path}`)).json();
      expect(Array.isArray(body.points), path).toBe(true);
    }
  });

  test('satellite loops are published', async ({ request }) => {
    for (const path of [
      'sat_webm/ph_himawari.webm',
      'sat_webm/ph_hima_gsmap.webm',
    ]) {
      const response = await request.head(`${BASE}/${path}`);
      expect(response.status(), path).toBe(200);
    }
  });
});

test.describe('Production site', () => {
  test('noah.up.edu.ph serves the app', async ({ page }) => {
    await page.goto(PRODUCTION_SITE);
    await expect(page).toHaveTitle(
      'NOAH - Nationwide Operational Assessment of Hazards'
    );
    await expect(
      page.getByRole('heading', { name: 'Know Your Hazards', level: 1 })
    ).toBeVisible();
  });
});
