import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  knownIssue,
  searchInput,
  styleIdOf,
} from '../support/helpers';
import { REVERSE_GEOCODE_PLACE_NAME } from '../support/mock-data';

/**
 * Know Your Hazards map (src/app/features/know-your-hazards/components/map-kyh):
 * Mapbox GL map with NOAH hazard tilesets, navigation/geolocate/scale
 * controls, legend, terrain/satellite switcher and the draggable location pin.
 */

const map = (page: Page) => page.locator('#map-kyh');
/** Selected menu entry – a bare `bg-gray-100` class (not `hover:bg-gray-100`). */
const SELECTED = /(^|\s)bg-gray-100(\s|$)/;
const legend = (page: Page) =>
  page
    .locator('noah-map-kyh')
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Hazard Level' }) })
    .filter({ visible: true })
    .last();

test.beforeEach(async ({ page }) => {
  await page.goto('/know-your-hazards');
  await expectMapReady(map(page));
});

test('loads the NOAH terrain style with the configured public token', async ({
  api,
}) => {
  const [style] = api.callsTo('mapboxStyle');
  expect(styleIdOf(style.url)).toMatch(/^upri-noah\/[a-z0-9]+$/);
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

test('provides zoom, compass, geolocate and scale controls', async ({
  page,
}) => {
  const controls = page.locator('noah-map-kyh');
  await expect(controls.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
  await expect(controls.locator('.mapboxgl-ctrl-zoom-out')).toBeVisible();
  await expect(controls.locator('.mapboxgl-ctrl-compass')).toBeVisible();
  await expect(controls.locator('.mapboxgl-ctrl-geolocate')).toBeVisible();
  await expect(controls.locator('.mapboxgl-ctrl-scale')).toBeVisible();
});

test('credits the Department of Health in the attribution', async ({
  page,
}) => {
  await expect(
    page.locator(
      'noah-map-kyh .mapboxgl-ctrl-attrib a[href="https://doh.gov.ph"]'
    )
  ).toHaveText('© Department of Health');
});

test('shows a hazard level legend that can be collapsed and restored', async ({
  page,
}) => {
  const box = legend(page);
  await expect(box.getByText('Low', { exact: true })).toBeVisible();
  await expect(box.getByText('Medium', { exact: true })).toBeVisible();
  await expect(box.getByText('High', { exact: true })).toBeVisible();

  // The "x" icon collapses the legend into a "Legend" button.
  await box.locator('svg.icon-tabler-x').locator('..').click();
  const reopen = page
    .locator('noah-map-kyh')
    .getByRole('button', { name: 'Legend' });
  await expect(reopen).toBeVisible();
  await expect(
    page.locator('noah-map-kyh').getByRole('heading', { name: 'Hazard Level' })
  ).toBeHidden();

  await reopen.click();
  await expect(
    page.locator('noah-map-kyh').getByRole('heading', { name: 'Hazard Level' })
  ).toBeVisible();
});

test.describe('Map style switcher', () => {
  const switcher = (page: Page) =>
    page.locator('noah-map-kyh noah-change-style-button');

  test('switches between terrain and satellite basemaps', async ({
    page,
    api,
  }) => {
    const initialStyle = styleIdOf(api.callsTo('mapboxStyle')[0].url);

    await switcher(page).getByRole('button').first().click();
    const terrain = switcher(page).getByRole('button', { name: 'Terrain' });
    const satellite = switcher(page).getByRole('button', { name: 'Satellite' });
    await expect(terrain).toBeVisible();
    await expect(terrain).toHaveClass(SELECTED);

    await satellite.click();
    await expect(satellite).toBeHidden(); // menu closes after a choice
    await expect.poll(() => api.callsTo('mapboxStyle').length).toBe(2);
    const satelliteStyle = styleIdOf(api.callsTo('mapboxStyle')[1].url);
    expect(satelliteStyle).toMatch(/^upri-noah\//);
    expect(satelliteStyle).not.toBe(initialStyle);

    await switcher(page).getByRole('button').first().click();
    await expect(satellite).toHaveClass(SELECTED);
    await expect(terrain).not.toHaveClass(SELECTED);

    await terrain.click();
    await expect.poll(() => api.callsTo('mapboxStyle').length).toBe(3);
    expect(styleIdOf(api.callsTo('mapboxStyle')[2].url)).toBe(initialStyle);
  });

  test('choosing the active style does not reload the map', async ({
    page,
    api,
  }) => {
    await switcher(page).getByRole('button').first().click();
    await switcher(page).getByRole('button', { name: 'Terrain' }).click();
    await page.waitForTimeout(500);
    expect(api.callsTo('mapboxStyle')).toHaveLength(1);
  });

  test('the location pin is restored after switching styles', async ({
    page,
    api,
  }) => {
    await expect(page.locator('#map-kyh .mapboxgl-marker')).toHaveCount(1);
    await switcher(page).getByRole('button').first().click();
    await switcher(page).getByRole('button', { name: 'Satellite' }).click();
    await expect.poll(() => api.callsTo('mapboxStyle').length).toBe(2);
    await expect(page.locator('#map-kyh .mapboxgl-marker')).toHaveCount(1);
  });
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
