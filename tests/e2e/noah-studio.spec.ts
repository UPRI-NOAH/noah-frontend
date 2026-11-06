import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  searchAndSelect,
  searchInput,
  styleIdOf,
} from '../support/helpers';
import { PLACES } from '../support/mock-data';
import {
  GROUPS,
  groupToggle,
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
  GROUPS.lightning,
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
      ['lightning', true],
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
      GROUPS.lightning,
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
  test('renders the NOAH basemap with navigation and geolocate controls', async ({
    page,
    api,
  }) => {
    await expectMapReady(studioMap(page));
    await expect(
      studioMap(page).locator('.mapboxgl-ctrl-zoom-in')
    ).toBeVisible();
    await expect(
      studioMap(page).locator('.mapboxgl-ctrl-compass')
    ).toBeVisible();
    await expect(
      studioMap(page).locator('.mapboxgl-ctrl-geolocate')
    ).toBeVisible();
    expect(styleIdOf(api.callsTo('mapboxStyle')[0].url)).toMatch(
      /^upri-noah\//
    );
  });

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

  test('switches between terrain and satellite basemaps', async ({
    page,
    api,
  }) => {
    await expectMapReady(studioMap(page));
    const initial = styleIdOf(api.callsTo('mapboxStyle')[0].url);
    const dropdown = studioMap(page).locator('.dropdown');

    await dropdown.hover();
    await dropdown.getByRole('button', { name: 'Satellite' }).click();
    await expect.poll(() => api.callsTo('mapboxStyle').length).toBe(2);
    const satellite = styleIdOf(api.callsTo('mapboxStyle')[1].url);
    expect(satellite).not.toBe(initial);

    await dropdown.hover();
    await dropdown.getByRole('button', { name: 'Terrain' }).click();
    await expect.poll(() => api.callsTo('mapboxStyle').length).toBe(3);
    expect(styleIdOf(api.callsTo('mapboxStyle')[2].url)).toBe(initial);
  });

  test('credits Mapbox, OpenStreetMap and the Department of Health', async ({
    page,
  }) => {
    const attribution = studioMap(page)
      .locator('.mapboxgl-ctrl-attrib')
      .filter({ visible: true });
    for (const [name, href] of [
      ['© Mapbox', 'https://www.mapbox.com/about/maps/'],
      ['© OpenStreetMap', 'http://www.openstreetmap.org/about/'],
      ['© Department of Health', 'https://doh.gov.ph/'],
      ['Improve this map', 'https://www.mapbox.com/map-feedback/'],
    ]) {
      await expect(
        attribution.getByRole('listitem').filter({ hasText: name })
      ).toHaveAttribute('href', href);
    }
  });
});

test.describe('Measuring tools', () => {
  const result = measurementResult;
  const measure = measureOnMap;

  test('offers distance and area tools', async ({ page }) => {
    await expectMapReady(studioMap(page));
    await expect(page.locator('.mapbox-gl-draw_line')).toHaveAttribute(
      'title',
      'Measure Distance'
    );
    await expect(page.locator('.mapbox-gl-draw_polygon')).toHaveAttribute(
      'title',
      'Measure Area'
    );
    await expect(page.locator('.mapbox-gl-draw_trash')).toBeVisible();
  });

  test('measures the length of a drawn line and clears it with the trash tool', async ({
    page,
  }) => {
    await measure(
      page,
      'line',
      [
        [0.55, 0.45],
        [0.7, 0.55],
      ],
      /Total Distance:\s*[\d,.]+ km/
    );

    await page.locator('.mapbox-gl-draw_trash').click();
    // Trash deletes the selected feature (the line just drawn).
    await expect(result(page)).toHaveText('');
  });

  test('measures the area of a drawn polygon', async ({ page }) => {
    await measure(
      page,
      'polygon',
      [
        [0.55, 0.4],
        [0.72, 0.4],
        [0.72, 0.6],
        [0.55, 0.6],
      ],
      /Total Area:?\s*[\d,.]+ sqm/
    );
  });
});
