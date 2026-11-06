import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  searchAndSelect,
  searchInput,
} from '../support/helpers';
import { PLACES, REVERSE_GEOCODE_PLACE_NAME } from '../support/mock-data';

/**
 * Weather Updates (src/app/features/weather-updates) on desktop: accumulated
 * and forecast rainfall contours, temperature forecasts and the typhoon track
 * with Himawari satellite imagery.
 */

const RAINFALL_OPTIONS = [
  { label: '1 Hour', type: '1hr' },
  { label: '3 Hours', type: '3hr' },
  { label: '6 Hours', type: '6hr' },
  { label: '12 Hours', type: '12hr' },
  { label: '24 Hours', type: '24hr' },
  { label: 'Rainfall for Tomorrow', type: 'forecast' },
] as const;

const TEMPERATURE_OPTIONS = [
  { label: 'Heat Index', type: 'heat_index', prefix: 'HI' },
  { label: 'Max Temperature', type: 'max_temperature', prefix: 't2m' },
] as const;

const FORECAST_DAYS = ['Latest', '+1D', '+2D', '+3D', '+4D'];

const panel = (page: Page) => page.locator('noah-rainfall-contour-button');

/** Desktop option buttons (the phone variants are hidden with CSS). */
const option = (page: Page, label: string) =>
  panel(page)
    .locator('button')
    .filter({ visible: true })
    .filter({
      hasText: new RegExp(`^\\s*${label.replace('+', '\\+')}\\s*$`, 'i'),
    });

const openLegend = (page: Page) =>
  panel(page).locator('.legend-expand.legend-open').filter({ visible: true });

const isActive = (button) =>
  expect(button).toHaveClass(/(^|\s)border-primary(\s|$)/);
const isInactive = (button) =>
  expect(button).toHaveClass(/(^|\s)border-transparent(\s|$)/);

const typhoonGroup = (page: Page) =>
  page.locator('noah-typhoon-track-group > div').filter({ visible: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/weather-updates');
  await expect(option(page, '1 Hour')).toBeVisible();
});

test.describe('Accumulated rainfall', () => {
  test('cites JAXA GSMaP and DOST-PAGASA as sources', async ({ page }) => {
    const sidebar = page
      .locator('noah-base')
      .locator(':scope > div')
      .filter({ visible: true });
    await expect(
      sidebar.getByText('Current Accumulated Rainfall in Your Area')
    ).toBeVisible();
    await expect(
      sidebar.getByText('You may drag the pin to change the location.')
    ).toBeVisible();
    await expect(
      sidebar.getByRole('link', { name: 'JAXA Global Rainfall Watch (GSMaP)' })
    ).toHaveAttribute(
      'href',
      'https://sharaku.eorc.jaxa.jp/GSMaP_NOW/index.htm'
    );
    await expect(
      sidebar.getByRole('link', { name: 'DOST-PAGASA' })
    ).toHaveAttribute(
      'href',
      'https://bagong.pagasa.dost.gov.ph/automated-rain-gauge'
    );
  });

  test("offers 1 to 24 hour totals and tomorrow's forecast, with 1 hour selected", async ({
    page,
  }) => {
    for (const { label } of RAINFALL_OPTIONS) {
      await expect(option(page, label)).toBeVisible();
    }
    await isActive(option(page, '1 Hour'));
    for (const { label } of RAINFALL_OPTIONS.slice(1)) {
      await isInactive(option(page, label));
    }
    await expect(openLegend(page)).toHaveCount(1);
    await expect(openLegend(page).locator('img')).toHaveAttribute(
      'src',
      'assets/legends/rainfall-contour/rainfall-contour-legend-1hr.png'
    );
  });

  for (const { label, type } of RAINFALL_OPTIONS.slice(1)) {
    test(`selecting "${label}" activates it and shows its legend`, async ({
      page,
    }) => {
      await option(page, label).click();
      await isActive(option(page, label));
      await isInactive(option(page, '1 Hour'));
      await expect(openLegend(page)).toHaveCount(1);
      await expect(openLegend(page).locator('img')).toHaveAttribute(
        'src',
        `assets/legends/rainfall-contour/rainfall-contour-legend-${type}.png`
      );
      await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
    });
  }

  test('the opacity slider starts at 80% and carries over between durations', async ({
    page,
  }) => {
    const slider = openLegend(page).locator('input[type="range"]');
    await expect(slider).toHaveValue('80');
    await expect(slider).toHaveAttribute('min', '0');
    await expect(slider).toHaveAttribute('max', '100');

    await slider.fill('35');
    await expect(openLegend(page)).toContainText('35');

    await option(page, '12 Hours').click();
    await expect(openLegend(page).locator('input[type="range"]')).toHaveValue(
      '35'
    );
  });

  test('loads every rainfall overlay published by NOAH', async ({ api }) => {
    await expect
      .poll(() => api.callsTo('staticImage').map((c) => c.url.pathname))
      .toEqual(
        expect.arrayContaining([
          '/api/contours/1hr_latest_rainfall_contour.png',
          '/api/contours/3hr_latest_rainfall_contour.png',
          '/api/contours/6hr_latest_rainfall_contour.png',
          '/api/contours/12hr_latest_rainfall_contour.png',
          '/api/contours/24hr_latest_rainfall_contour.png',
          '/api/rainfall/rainmap_gtif_day1.png',
        ])
      );
  });
});

test.describe('Forecast rainfall', () => {
  test('is sourced from Weather Manila', async ({ page }) => {
    const section = panel(page)
      .locator('section')
      .filter({ visible: true })
      .filter({ hasText: 'Forecasted Rainfall in Your Area' });
    await expect(
      section.getByRole('link', { name: 'Weather Manila' })
    ).toHaveAttribute('href', 'https://www.weather-manila.com/');
  });
});

test.describe('Temperature', () => {
  test('forecast days stay disabled until a temperature layer is chosen', async ({
    page,
  }) => {
    for (const day of FORECAST_DAYS) {
      await expect(option(page, day)).toBeDisabled();
    }
    for (const { label } of TEMPERATURE_OPTIONS) {
      await isInactive(option(page, label));
    }
  });

  for (const { label, type, prefix } of TEMPERATURE_OPTIONS) {
    test(`"${label}" switches the map to temperature`, async ({
      page,
      api,
    }) => {
      await option(page, label).click();

      await expect(page).toHaveURL(/\/weather-updates\/temperature$/);
      await isActive(option(page, label));
      for (const rainfall of RAINFALL_OPTIONS) {
        await isInactive(option(page, rainfall.label));
      }
      await expect(openLegend(page).locator('img')).toHaveAttribute(
        'src',
        `assets/legends/temperature/wu_${type}.png`
      );

      // Forecast days become available, starting with the latest run.
      for (const day of FORECAST_DAYS) {
        await expect(option(page, day)).toBeEnabled();
      }
      await expect(option(page, 'Latest')).toHaveClass(/bg-primary/);

      await option(page, '+2D').click();
      await expect(option(page, '+2D')).toHaveClass(/bg-primary/);
      await expect(option(page, 'Latest')).not.toHaveClass(/bg-primary/);
      await expect
        .poll(() => api.callsTo('staticImage').map((c) => c.url.pathname))
        .toContain(`/api/temperature/${prefix}_3.png`);
    });
  }

  test('choosing a rainfall layer again turns temperature off', async ({
    page,
  }) => {
    await option(page, 'Heat Index').click();
    await expect(page).toHaveURL(/\/weather-updates\/temperature$/);

    await option(page, '3 Hours').click();
    await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
    await isActive(option(page, '3 Hours'));
    await isInactive(option(page, 'Heat Index'));
    await expect(option(page, 'Latest')).toBeDisabled();
  });

  test('a /weather-updates/temperature deep link opens the temperature view', async ({
    page,
  }) => {
    await page.goto('/weather-updates/temperature');
    await expect(option(page, 'Latest')).toBeEnabled();
    await expect(option(page, 'Latest')).toHaveClass(/bg-primary/);
  });
});

test.describe('Typhoon track', () => {
  const toggle = (page: Page) => typhoonGroup(page).getByRole('checkbox');

  test('is listed under "More Options" and off by default', async ({
    page,
  }) => {
    await expect(
      page.getByText('More Options').filter({ visible: true })
    ).toBeVisible();
    await expect(
      typhoonGroup(page).getByText('Typhoon Track', { exact: true })
    ).toBeVisible();
    await expect(toggle(page)).not.toBeChecked();
  });

  test('turning it on shows the track legend, sources and satellite imagery', async ({
    page,
    api,
  }) => {
    await toggle(page).click();
    await expect(page).toHaveURL(/\/weather-updates\/typhoon-track$/);
    await expect(toggle(page)).toBeChecked();

    const solo = typhoonGroup(page).locator('noah-typhoon-track-solo');
    await expect(
      solo.getByRole('link', { name: 'PANaHON (DOST-PAGASA)' })
    ).toHaveAttribute('href', 'https://www.panahon.gov.ph/');
    await expect(solo.getByAltText('Typhoon Track Legend')).toBeVisible();
    const satellite = solo.locator('noah-weather-satellite');
    await expect(satellite.getByText('himawari')).toBeVisible();
    await expect(satellite.getByRole('radio')).toBeChecked();
    await expect(satellite.locator('input[type="range"]')).toHaveValue('60');

    expect(api.callsTo('staticData').map((c) => c.url.pathname)).toEqual(
      expect.arrayContaining([
        '/api/typhoon_track/pagasa_typhoon.geojson',
        '/api/par/par_outline.json',
      ])
    );
  });

  test('turning it off returns to the active weather layer', async ({
    page,
  }) => {
    await toggle(page).click();
    await expect(page).toHaveURL(/\/typhoon-track$/);
    await toggle(page).click();
    await expect(toggle(page)).not.toBeChecked();
    await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
  });

  test('a /weather-updates/typhoon-track deep link enables the track', async ({
    page,
  }) => {
    await page.goto('/weather-updates/typhoon-track');
    await expect(toggle(page)).toBeChecked();
  });
});

test.describe('Map', () => {
  test('renders with navigation, geolocate and scale controls', async ({
    page,
  }) => {
    const map = page.locator('noah-map-weather-updates');
    await expectMapReady(map);
    await expect(map.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
    await expect(map.locator('.mapboxgl-ctrl-geolocate')).toBeVisible();
    await expect(map.locator('.mapboxgl-ctrl-scale')).toBeVisible();
  });

  test('searching a place drops a draggable pin that reports its position', async ({
    page,
    api,
  }) => {
    const map = page.locator('noah-map-weather-updates');
    await expectMapReady(map);
    await expect(map.locator('.mapboxgl-marker')).toHaveCount(0);

    await searchAndSelect(page, PLACES.marikina);
    await expect(searchInput(page)).toHaveValue(PLACES.marikina.name);
    const pin = map.locator('.mapboxgl-marker');
    await expect(pin).toHaveCount(1);

    // Let the fly-to animation settle before dragging.
    await page.waitForTimeout(1_500);
    const box = (await pin.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 80, { steps: 8 });
    await page.mouse.up();

    await expect(page.locator('#coordinates')).toHaveText(
      /^Lon: -?\d+\.\d{5}\s*Lat: -?\d+\.\d{5}$/
    );
    await expect(searchInput(page)).toHaveValue(REVERSE_GEOCODE_PLACE_NAME);
    expect(api.callsTo('reverseGeocode').length).toBeGreaterThan(0);
  });

  test('the NOAH logo returns to the landing page', async ({ page }) => {
    await page
      .locator('noah-base')
      .locator(':scope > div')
      .filter({ visible: true })
      .locator('a')
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
  });
});
