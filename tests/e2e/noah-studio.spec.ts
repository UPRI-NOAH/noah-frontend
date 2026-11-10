import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  searchAndSelect,
  searchInput,
} from '../support/helpers';
import { PLACES } from '../support/mock-data';
import {
  GROUPS,
  groupToggle,
  measureButton,
  measureOnMap,
  measurementResult,
  sidebar,
  sidebarCollapseButton,
  studioMap,
} from '../support/studio';

/**
 * NOAH Studio shell (src/app/features/noah-playground): sidebar of layer
 * groups, map controls, basemap switcher, attribution and measuring tools.
 */

const PUBLIC_GROUPS = [
  GROUPS.terrain,
  GROUPS.flood,
  GROUPS.weatherUpdates,
  GROUPS.weatherSatellite,
  GROUPS.typhoonTrack,
  GROUPS.rainfallContour,
  GROUPS.wind,
  GROUPS.floodImpact,
  GROUPS.landslide,
  GROUPS.stormSurge,
  GROUPS.temperature,
  GROUPS.volcanoes,
  GROUPS.criticalFacilities,
  GROUPS.iot,
];

test.beforeEach(async ({ page }) => {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
});

test.describe('Sidebar', () => {
  test('lists every public layer group in order', async ({ page }) => {
    const text = await sidebar(page).innerText();
    let cursor = -1;
    for (const group of PUBLIC_GROUPS) {
      const index = text.indexOf(group.title, cursor + 1);
      expect(
        index,
        `"${group.title}" should follow the previous group`
      ).toBeGreaterThan(cursor);
      cursor = index;
    }
    await expect(GROUPS.floodImpact.root(page).getByText('BETA')).toBeVisible();
  });

  test('restricted layers stay hidden until an IoT partner signs in', async ({
    page,
  }) => {
    await expect(GROUPS.riverbasin.root(page)).toHaveCount(0);
    await expect(GROUPS.boundaries.root(page)).toHaveCount(0);
  });

  test('starts with the documented default layer visibility', async ({
    page,
  }) => {
    const defaults: Array<[keyof typeof GROUPS, boolean]> = [
      ['terrain', true],
      ['flood', false],
      ['weatherUpdates', false],
      ['weatherSatellite', true],
      ['typhoonTrack', true],
      ['rainfallContour', true],
      ['wind', true],
      ['floodImpact', false],
      ['landslide', false],
      ['stormSurge', false],
      ['temperature', false],
      ['volcanoes', false],
      ['criticalFacilities', false],
      ['iot', false],
    ];
    for (const [key, checked] of defaults) {
      const toggle = groupToggle(page, GROUPS[key]);
      if (checked) await expect(toggle, GROUPS[key].title).toBeChecked();
      else await expect(toggle, GROUPS[key].title).not.toBeChecked();
    }
  });

  test('the Weather Updates group starts expanded', async ({ page }) => {
    for (const nested of [
      GROUPS.weatherSatellite,
      GROUPS.typhoonTrack,
      GROUPS.rainfallContour,
      GROUPS.wind,
    ]) {
      await expect(
        nested.root(page).getByText(nested.title, { exact: true })
      ).toBeVisible();
    }
    await GROUPS.weatherUpdates
      .root(page)
      .getByText('Weather Updates', { exact: true })
      .click();
    await expect(
      GROUPS.wind.root(page).getByText('Wind', { exact: true })
    ).toBeHidden();
  });

  test('can be collapsed to give the map the full screen', async ({ page }) => {
    await sidebarCollapseButton(page).click();
    await expect(sidebar(page)).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(sidebar(page)).toBeVisible();
  });

  test('the NOAH logo returns to the landing page', async ({ page }) => {
    await sidebar(page)
      .locator('img[src="assets/icons/noah_logo.png"][routerlink="/"]')
      .click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('searching a place keeps the user in the Studio', async ({ page }) => {
    await searchAndSelect(page, PLACES.quezonCity);
    await expect(searchInput(page)).toHaveValue(PLACES.quezonCity.name);
    await expect(page).toHaveURL(/\/noah-studio$/);
  });
});

test.describe('Map', () => {
  // Toolbar, basemap switching and attribution: see map-controls.spec.ts.

  test('loads the hazard tilesets listed by the NOAH static API', async ({
    api,
  }) => {
    await expect
      .poll(() => api.callsTo('staticData').map((c) => c.url.pathname))
      .toContain('/api/hazards/ph_combined_tileset.json');
    await expect
      .poll(() => api.callsTo('mapboxTileJson').map((c) => c.url.pathname))
      .toEqual(
        expect.arrayContaining([
          '/v4/upri-noah.ph_fh_5yr_tls.json',
          '/v4/upri-noah.ph_lh_lh2_tls.json',
          '/v4/upri-noah.ph_ssh_ssa1_tls.json',
        ])
      );
  });
});

test.describe('Measuring tools', () => {
  const LINE: Array<[number, number]> = [
    [0.55, 0.45],
    [0.7, 0.55],
  ];
  const SQUARE: Array<[number, number]> = [
    [0.55, 0.4],
    [0.72, 0.4],
    [0.72, 0.6],
    [0.55, 0.6],
  ];

  test('the measure buttons toggle drawing on and off', async ({ page }) => {
    await expectMapReady(studioMap(page));
    const distance = measureButton(page, 'distance');
    await expect(distance).toHaveAttribute('aria-pressed', 'false');
    await distance.click();
    await expect(distance).toHaveAttribute('aria-pressed', 'true');
    await distance.click();
    await expect(distance).toHaveAttribute('aria-pressed', 'false');
  });

  test('measures the length of a drawn line', async ({ page }) => {
    await measureOnMap(page, 'distance', LINE, /Total Distance:\s*[\d,.]+ km/);
    // Finishing the line ends drawing mode.
    await expect(measureButton(page, 'distance')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(measurementResult(page, 'area')).toHaveText('');
  });

  test('measures the area of a drawn polygon', async ({ page }) => {
    await measureOnMap(page, 'area', SQUARE, /Total Area:?\s*[\d,.]+ sqm/);
  });

  test('"Clear measurements" removes every shape and total', async ({
    page,
  }) => {
    await measureOnMap(page, 'distance', LINE, /Total Distance/);
    await measureOnMap(page, 'area', SQUARE, /Total Area/);
    await expect(measurementResult(page, 'distance')).toContainText(
      'Total Distance'
    );

    await studioMap(page)
      .locator('noah-map-controls')
      .getByRole('button', { name: 'Clear measurements', exact: true })
      .click();
    await expect(measurementResult(page, 'distance')).toHaveText('');
    await expect(measurementResult(page, 'area')).toHaveText('');
  });
});
