import { test, expect, Page } from '../support/test';
import { expectMapReady } from '../support/helpers';
import {
  GROUPS,
  expandGroup,
  groupToggle,
  sidebar,
  studioMap,
} from '../support/studio';

/**
 * NOAH Studio "Weather Updates" group: Himawari satellite imagery, typhoon
 * tracks from seven agencies, rainfall contours and the animated wind forecast.
 */

const TYPHOON_AGENCIES = [
  'DOST-PAGASA (Philippines)',
  'HKO (Hong Kong Observatory)',
  'JTWC (Joint Typhoon Warning Center)',
  'JMA (Japan Meteorological Agency)',
  'NMC (National Meteorological Center China)',
  'CWA (Central Weather Administration Taiwan)',
  'KMA (Korea Meteorological Administration)',
];

const weatherUpdatesToggle = (page: Page) =>
  GROUPS.weatherUpdates.root(page).getByRole('checkbox').first();

test.beforeEach(async ({ page }) => {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
});

test('the Weather Updates master switch can be turned on and off', async ({
  page,
}) => {
  await expect(weatherUpdatesToggle(page)).not.toBeChecked();
  await weatherUpdatesToggle(page).click();
  await expect(weatherUpdatesToggle(page)).toBeChecked();
  await weatherUpdatesToggle(page).click();
  await expect(weatherUpdatesToggle(page)).not.toBeChecked();
});

test.describe('Weather satellite', () => {
  test('offers Himawari and Himawari + GSMaP loops', async ({ page }) => {
    const group = GROUPS.weatherSatellite;
    const himawari = group
      .root(page)
      .locator('#selected-weather-satellite-himawari');
    const gsmap = group
      .root(page)
      .locator('#selected-weather-satellite-himawari-GSMAP');
    await expandGroup(page, group, himawari);

    await expect(himawari).toBeChecked();
    await expect(
      group
        .root(page)
        .locator('label[for="selected-weather-satellite-himawari-GSMAP"]')
    ).toHaveText(/himawari \+ GSMAP/i);
    await expect(
      group
        .root(page)
        .getByRole('link', { name: 'JAXA Himawari Monitor P-Tree System' })
        .first()
    ).toHaveAttribute('href', 'https://www.eorc.jaxa.jp/ptree/');
    await gsmap.click();
    await expect(gsmap).toBeChecked();
    await expect(himawari).not.toBeChecked();
  });
});

test.describe('On-demand downloads', () => {
  test('satellite loops and wind data load only once Weather Updates is on', async ({
    page,
    api,
  }) => {
    await expectMapReady(studioMap(page));
    await page.waitForTimeout(1_500);
    // Off by default, so nothing heavy is downloaded at start-up.
    expect(api.callsTo('staticVideo')).toHaveLength(0);
    expect(api.callsTo('staticData').map((c) => c.url.pathname)).not.toContain(
      '/api/wind/wind_grid.json'
    );

    await weatherUpdatesToggle(page).click();
    await expect
      .poll(() => api.callsTo('staticVideo').map((c) => c.url.pathname))
      .toEqual(expect.arrayContaining(['/api/sat_webm/ph_himawari.webm']));
    await expect
      .poll(() => api.callsTo('staticData').map((c) => c.url.pathname))
      .toContain('/api/wind/wind_grid.json');
  });
});

test.describe('Typhoon track', () => {
  test('lists every agency and reports when no typhoon is active', async ({
    page,
    api,
  }) => {
    const group = GROUPS.typhoonTrack;
    const solos = group.root(page).locator('noah-typhoon-track-solo');
    await expandGroup(page, group, solos.first());

    await expect(solos).toHaveCount(TYPHOON_AGENCIES.length);
    for (const [index, agency] of TYPHOON_AGENCIES.entries()) {
      await expect(solos.nth(index)).toContainText(agency);
      // The mock publishes empty track feeds.
      await expect(solos.nth(index)).toContainText(
        '(No Active/Incoming Typhoon)'
      );
    }

    await expect(
      group.root(page).getByRole('link', { name: 'PANaHON (DOST-PAGASA)' })
    ).toHaveAttribute('href', 'https://www.panahon.gov.ph/');
    await expect(
      group.root(page).getByRole('link', { name: 'Typhoon 2000' })
    ).toHaveAttribute('href', 'https://typhoon2000.ph/');
    await expect(
      group.root(page).getByAltText('Typhoon Track Legend')
    ).toBeVisible();

    expect(api.callsTo('staticData').map((c) => c.url.pathname)).toEqual(
      expect.arrayContaining([
        '/api/typhoon_track/pagasa_typhoon.geojson',
        '/api/typhoon_track/multi_typhoon.geojson',
      ])
    );
  });
});

test.describe('Rainfall contour', () => {
  test('switches between 1 to 24 hour contours and their legends', async ({
    page,
  }) => {
    const group = GROUPS.rainfallContour;
    const radio = (type: string) =>
      group.root(page).locator(`#selected-contour-map-${type}`);
    const legend = group
      .root(page)
      .locator('img[src^="assets/legends/rainfall-contour-legend-"]');
    await expandGroup(page, group, radio('1hr'));

    for (const type of ['1hr', '3hr', '6hr', '12hr', '24hr']) {
      await expect(
        group.root(page).locator(`label[for="selected-contour-map-${type}"]`)
      ).toHaveText(type);
    }
    await expect(radio('1hr')).toBeChecked();
    await expect(legend).toHaveAttribute(
      'src',
      'assets/legends/rainfall-contour-legend-1hr.png'
    );

    await radio('12hr').click();
    await expect(radio('12hr')).toBeChecked();
    await expect(radio('1hr')).not.toBeChecked();
    await expect(legend).toHaveAttribute(
      'src',
      'assets/legends/rainfall-contour-legend-12hr.png'
    );
    await expect(group.root(page).locator('noah-slider')).toContainText(
      'Opacity'
    );
  });
});

test.describe('Wind', () => {
  const wind = (page: Page) => GROUPS.wind.root(page);

  test('shows a six-day forecast timeline that can be stepped and animated', async ({
    page,
  }) => {
    await expandGroup(page, GROUPS.wind, wind(page).locator('.wl-day-index'));

    await expect(wind(page).locator('.wl-eyebrow')).toHaveText(
      /FORECAST TODAY \+ 5 Days/i
    );
    await expect(wind(page).locator('.wl-day-index')).toHaveText(/1\s*\/\s*6/);
    const days = wind(page).locator('.wl-day');
    await expect(days).toHaveText(['Today', '+1D', '+2D', '+3D', '+4D', '+5D']);
    await expect(days.nth(0)).toHaveClass(/active/);

    await days.nth(2).click();
    await expect(wind(page).locator('.wl-day-index')).toHaveText(/3\s*\/\s*6/);
    await expect(days.nth(2)).toHaveClass(/active/);

    const play = wind(page).locator('.wl-play-btn');
    await expect(play).toHaveText(/Animate/);
    await play.click();
    await expect(play).toHaveText(/Pause/);
    // The animation advances one day every 1.5 s.
    await expect(wind(page).locator('.wl-day-index')).toHaveText(/4\s*\/\s*6/, {
      timeout: 5_000,
    });
    await play.click();
    await expect(play).toHaveText(/Animate/);
  });

  test('particle count, speed and colour are adjustable', async ({ page }) => {
    const particles = wind(page)
      .locator('noah-slider')
      .filter({ hasText: 'Particle Count' });
    await expandGroup(page, GROUPS.wind, particles);

    const particleInput = particles.locator('input[type="range"]');
    await expect(particleInput).toHaveAttribute('min', '100');
    await expect(particleInput).toHaveAttribute('max', '2000');
    await particleInput.fill('500');
    await expect(particles).toContainText('500');

    const speed = wind(page)
      .locator('noah-slider')
      .filter({ hasText: 'Speed' });
    await expect(speed.locator('input[type="range"]')).toHaveAttribute(
      'max',
      '2'
    );
    await speed.locator('input[type="range"]').fill('0.5');
    await expect(speed).toContainText('0.5');

    const colour = wind(page).locator('input[type="color"]');
    await colour.fill('#ff0000');
    await expect(colour).toHaveValue('#ff0000');

    await expect(
      wind(page).getByRole('link', { name: 'Open-Meteo' })
    ).toHaveAttribute('href', 'https://open-meteo.com/');
    await expect(groupToggle(page, GROUPS.wind)).toBeChecked();
  });
});
