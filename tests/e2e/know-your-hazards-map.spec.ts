import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  knownIssue,
  searchInput,
  styleIdOf,
} from '../support/helpers';
import { configuredStyleIds } from '../support/map-controls';
import { REVERSE_GEOCODE_PLACE_NAME } from '../support/mock-data';

/**
 * Know Your Hazards map (src/app/features/know-your-hazards/components/map-kyh):
 * Mapbox GL map with NOAH hazard tilesets, the hazard level legend and the
 * draggable location pin. The toolbar, style panel and attribution shared by
 * every map are covered in map-controls.spec.ts.
 */

const map = (page: Page) => page.locator('#map-kyh');
const legend = (page: Page) => page.locator('noah-map-kyh .kyh-hazard-legend');

test.beforeEach(async ({ page }) => {
  await page.goto('/know-your-hazards');
  await expectMapReady(map(page));
});

test('loads the NOAH Standard style with the configured public token', async ({
  api,
}) => {
  const [style] = api.callsTo('mapboxStyle');
  expect(configuredStyleIds().Standard).toContain(styleIdOf(style.url));
  expect(style.url.searchParams.get('access_token')).toMatch(
    /^pk\.[\w-]+\.[\w-]+$/
  );
});

test('adds the NOAH hazard tilesets to the map', async ({ api }) => {
  await expect
    .poll(() => api.callsTo('mapboxTileJson').map((c) => c.url.pathname))
    .toEqual(
      expect.arrayContaining([
        '/v4/upri-noah.ph_fh_100yr_tls.json',
        '/v4/upri-noah.ph_lh_lh1_tls.json',
        '/v4/upri-noah.ph_lh_lh2_tls.json',
        '/v4/upri-noah.ph_ssh_ssa4_tls.json',
      ])
    );
});

test('shows a hazard level legend that can be collapsed and restored', async ({
  page,
}) => {
  const box = legend(page);
  const toggle = box.getByRole('button', { name: 'Toggle hazard legend' });
  await expect(box.getByText('Hazard level', { exact: true })).toBeVisible();
  for (const level of ['Low', 'Medium', 'High']) {
    await expect(box.getByText(level, { exact: true })).toBeVisible();
  }
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(box.getByText('Low', { exact: true })).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(box.getByText('Low', { exact: true })).toBeVisible();
});

test.describe('Draggable location pin', () => {
  async function dragPin(page: Page, dx = 140, dy = 90) {
    const pin = page.locator('#map-kyh .mapboxgl-marker');
    await expect(pin).toHaveCount(1);
    const box = (await pin.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 5 });
    await page.mouse.move(x + dx, y + dy, { steps: 5 });
    await page.mouse.up();
  }

  test('dragging the pin shows its coordinates and re-assesses that point', async ({
    page,
    api,
  }) => {
    const assessmentsBefore = api.callsTo('tilequeryHazards').length;
    await dragPin(page);

    const coordinates = page.locator('#coordinates');
    await expect(coordinates).toBeVisible();
    await expect(coordinates).toHaveText(
      /^Lon: -?\d+\.\d{5}\s*Lat: -?\d+\.\d{5}$/
    );

    // The address of the new point is shown in the search box...
    await expect(searchInput(page)).toHaveValue(REVERSE_GEOCODE_PLACE_NAME);

    // ...and hazards are re-assessed for exactly the displayed coordinates.
    const [, lon, lat] = (await coordinates.innerText()).match(
      /Lon: (\S+)\s*Lat: (\S+)/
    )!;
    await expect
      .poll(() => api.callsTo('tilequeryHazards').length)
      .toBeGreaterThan(assessmentsBefore);
    const point = api
      .callsTo('tilequeryHazards')
      .at(-1)!
      .url.pathname.match(/\/tilequery\/([^,]+),([^/]+)\.json$/)!;
    expect(Number(point[1]).toFixed(5)).toBe(lon);
    expect(Number(point[2]).toFixed(5)).toBe(lat);
  });

  test('reverse geocodes a dragged point only once', async ({ page, api }) => {
    knownIssue(
      'MapKyhComponent dragend handler calls MapService.dragReverseGeocode twice for the same ' +
        'point, doubling Mapbox geocoding requests per drag.'
    );
    await dragPin(page);
    await expect(searchInput(page)).toHaveValue(REVERSE_GEOCODE_PLACE_NAME);
    await page.waitForTimeout(1_000);
    expect(api.callsTo('reverseGeocode')).toHaveLength(1);
  });
});
