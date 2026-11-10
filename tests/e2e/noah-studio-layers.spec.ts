import { test, expect, Page } from '../support/test';
import {
  GROUPS,
  LayerGroup,
  expandGroup,
  groupToggle,
  sidebar,
} from '../support/studio';

/**
 * NOAH Studio hazard and reference layers: flood / landslide / storm surge
 * hazard maps (opacity + colour palettes), 3D terrain, temperature,
 * volcanoes and critical facilities.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
});

const level = (page: Page, group: LayerGroup, name: string) =>
  group
    .root(page)
    .locator('noah-hazard-level')
    // exact match: "5-Year Return Period" is a substring of "25-Year Return Period"
    .filter({ has: page.getByText(name, { exact: true }) });

const HAZARDS = [
  {
    group: GROUPS.flood,
    levels: [
      '5-Year Return Period',
      '25-Year Return Period',
      '100-Year Return Period',
    ],
    defaultLevel: '100-Year Return Period',
  },
  {
    group: GROUPS.landslide,
    levels: ['Landslides', 'Debris Flow and Alluvial Fan'],
    defaultLevel: 'Landslides',
  },
  {
    group: GROUPS.stormSurge,
    levels: [
      'Storm Surge Advisory 1',
      'Storm Surge Advisory 2',
      'Storm Surge Advisory 3',
      'Storm Surge Advisory 4',
    ],
    defaultLevel: 'Storm Surge Advisory 4',
  },
];

test.describe('Hazard maps', () => {
  for (const { group, levels, defaultLevel } of HAZARDS) {
    test(`${group.title}: lists its levels with "${defaultLevel}" preselected`, async ({
      page,
    }) => {
      await expandGroup(page, group, level(page, group, levels[0]));
      await expect(group.root(page).locator('noah-hazard-level')).toHaveCount(
        levels.length
      );
      for (const name of levels) {
        const checkbox = level(page, group, name).getByRole('checkbox');
        if (name === defaultLevel) await expect(checkbox).toBeChecked();
        else await expect(checkbox).not.toBeChecked();
      }
    });

    test(`${group.title}: the header checkbox turns the hazard on and off`, async ({
      page,
    }) => {
      const toggle = groupToggle(page, group);
      await expect(toggle).not.toBeChecked();
      await toggle.click();
      await expect(toggle).toBeChecked();
      await toggle.click();
      await expect(toggle).not.toBeChecked();
    });
  }

  test('storm surge advisories state the expected surge height', async ({
    page,
  }) => {
    const group = GROUPS.stormSurge;
    await expandGroup(
      page,
      group,
      level(page, group, 'Storm Surge Advisory 1')
    );
    const heights = [
      ['Storm Surge Advisory 1', 'Storm Surge Height up to 2 meters'],
      ['Storm Surge Advisory 2', 'Storm Surge Height up to 3 meters'],
      ['Storm Surge Advisory 3', 'Storm Surge Height up to 4 meters'],
      ['Storm Surge Advisory 4', 'Storm Surge Height more than 4 meters'],
    ];
    for (const [advisory, height] of heights) {
      await expect(level(page, group, advisory)).toContainText(height);
    }
  });

  test('individual hazard levels can be switched on and off', async ({
    page,
  }) => {
    const group = GROUPS.flood;
    const fiveYear = level(page, group, '5-Year Return Period').getByRole(
      'checkbox'
    );
    await expandGroup(page, group, fiveYear);
    await fiveYear.click();
    await expect(fiveYear).toBeChecked();
    await fiveYear.click();
    await expect(fiveYear).not.toBeChecked();
  });

  test('each level has an opacity slider and a high/medium/low legend', async ({
    page,
  }) => {
    const group = GROUPS.flood;
    const item = level(page, group, '100-Year Return Period');
    await expandGroup(page, group, item);

    const slider = item.locator('noah-slider');
    await expect(slider).toContainText('Opacity');
    // Default flood opacity from noah-playground.store.ts
    await expect(slider.locator('input[type="range"]')).toHaveValue('85');
    await slider.locator('input[type="range"]').fill('40');
    await expect(slider).toContainText('40');

    const legend = item.locator('noah-hazard-legend');
    for (const name of ['high', 'medium', 'low']) {
      await expect(legend.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(
      legend.getByText('Color Scheme', { exact: true })
    ).toBeVisible();
    // Six NOAH palettes plus the custom colour picker.
    await expect(
      legend.locator('.hazard-legend__palette > button')
    ).toHaveCount(6);
    await expect(
      legend.locator('.hazard-legend__custom input[type="color"]')
    ).toHaveCount(1);
  });

  test('choosing a palette recolours the legend', async ({ page }) => {
    const group = GROUPS.flood;
    const legend = level(page, group, '100-Year Return Period').locator(
      'noah-hazard-legend'
    );
    await expandGroup(page, group, legend);

    // NOAH blue palette (src/app/shared/mocks/noah-colors.ts)
    const blue = legend.locator(
      '.hazard-legend__palette > button[style*="rgb(43, 117, 178)"]'
    );
    await blue.click();
    await expect(blue).toHaveClass(/selected/);
    await expect(blue).toHaveText('✓');

    const swatches = legend.locator(
      '.hazard-legend__levels .hazard-legend__swatch'
    );
    await expect(swatches.nth(0)).toHaveCSS(
      'background-color',
      'rgb(43, 117, 178)'
    ); // high
    await expect(swatches.nth(1)).toHaveCSS(
      'background-color',
      'rgb(95, 163, 206)'
    ); // medium
    await expect(swatches.nth(2)).toHaveCSS(
      'background-color',
      'rgb(180, 209, 226)'
    ); // low
  });

  test('a custom colour derives lighter medium and low shades', async ({
    page,
  }) => {
    const group = GROUPS.flood;
    const legend = level(page, group, '100-Year Return Period').locator(
      'noah-hazard-legend'
    );
    await expandGroup(page, group, legend);

    await legend.locator('input[type="color"]').fill('#0000ff');
    await expect(legend.locator('.hazard-legend__custom')).toHaveClass(
      /selected/
    );
    const swatches = legend.locator(
      '.hazard-legend__levels .hazard-legend__swatch'
    );
    await expect(swatches.nth(0)).toHaveCSS(
      'background-color',
      'rgb(0, 0, 255)'
    ); // picked colour
    await expect(swatches.nth(1)).toHaveCSS(
      'background-color',
      'rgb(89, 89, 255)'
    ); // +35% white
    await expect(swatches.nth(2)).toHaveCSS(
      'background-color',
      'rgb(166, 166, 255)'
    ); // +65% white
  });
});

test.describe('3D terrain', () => {
  test('is on by default with an exaggeration slider and usage tip', async ({
    page,
  }) => {
    const group = GROUPS.terrain;
    const slider = group.root(page).locator('noah-slider');
    await expandGroup(page, group, slider);

    await expect(groupToggle(page, group)).toBeChecked();
    await expect(slider).toContainText('Exaggeration');
    const input = slider.locator('input[type="range"]');
    await expect(input).toHaveValue('1.8');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', '10');
    await expect(input).toHaveAttribute('step', '0.1');
    await expect(
      group
        .root(page)
        .getByText(/Press\s+CTRL, then left click on the map and drag/)
    ).toBeVisible();

    await input.fill('4.5');
    await expect(slider).toContainText('4.5');
    await groupToggle(page, group).click();
    await expect(groupToggle(page, group)).not.toBeChecked();
  });
});

test.describe('Temperature', () => {
  const day = (page: Page, label: string) =>
    GROUPS.temperature
      .root(page)
      .getByRole('button', { name: label, exact: true });

  test('offers heat index and maximum temperature forecasts', async ({
    page,
    api,
  }) => {
    const group = GROUPS.temperature;
    await expandGroup(page, group, day(page, 'Latest'));

    for (const label of ['Latest', '+1D', '+2D', '+3D', '+4D']) {
      await expect(day(page, label)).toBeVisible();
    }
    await expect(day(page, 'Latest')).toHaveClass(/bg-primary/);

    const heatIndex = group
      .root(page)
      .locator('#selected-weather-satellite-heat_index');
    const maxTemp = group
      .root(page)
      .locator('#selected-weather-satellite-max_temperature');
    await expect(heatIndex).toBeChecked();
    await expect(
      group
        .root(page)
        .locator('label[for="selected-weather-satellite-heat_index"]')
    ).toHaveText(/heat index/i);
    await expect(
      group
        .root(page)
        .locator('img[src*="assets/legends/temperature/straight_"]')
    ).toHaveAttribute(
      'src',
      'assets/legends/temperature/straight_heat_index.png'
    );
    await expect(
      group.root(page).getByRole('link', { name: 'Weather Manila' })
    ).toHaveAttribute('href', 'https://www.weather-manila.com/');

    await groupToggle(page, group).click();
    await expect(groupToggle(page, group)).toBeChecked();

    await maxTemp.click();
    await expect(maxTemp).toBeChecked();
    await expect(
      group
        .root(page)
        .locator('img[src*="assets/legends/temperature/straight_"]')
    ).toHaveAttribute(
      'src',
      'assets/legends/temperature/straight_max_temperature.png'
    );

    await day(page, '+2D').click();
    await expect(day(page, '+2D')).toHaveClass(/bg-primary/);
    await expect(day(page, 'Latest')).not.toHaveClass(/bg-primary/);
    await expect
      .poll(() => api.callsTo('staticImage').map((c) => c.url.pathname))
      .toContain('/api/temperature/t2m_3.png');
  });
});

test.describe('Volcanoes', () => {
  test('lists active, potentially active and inactive volcanoes', async ({
    page,
    api,
  }) => {
    const group = GROUPS.volcanoes;
    const solos = group.root(page).locator('noah-volcano-solo');
    await expandGroup(page, group, solos.first());
    await expect(solos).toHaveCount(3);

    const expected = [
      ['Active', 'active', true],
      ['Potentially Active', 'potentially-active', false],
      ['Inactive', 'inactive', false],
    ] as const;
    for (const [label, type, checked] of expected) {
      const solo = solos.filter({ hasText: label }).first();
      const checkbox = solo.locator(`input[name="input-${type}"]`);
      if (checked) await expect(checkbox).toBeChecked();
      else await expect(checkbox).not.toBeChecked();
      await expect(
        solo.locator(`img[src="assets/map-sprites/${type}.png"]`)
      ).toBeVisible();
      await expect(solo.locator('noah-slider')).toContainText('Opacity');
    }

    await groupToggle(page, group).click();
    await expect(groupToggle(page, group)).toBeChecked();
    expect(api.callsTo('staticData').map((c) => c.url.pathname)).toEqual(
      expect.arrayContaining([
        '/api/volcanoes/active_volcano_rad.geojson',
        '/api/volcanoes/volcanoes_potentially_active.geojson',
        '/api/volcanoes/volcanoes_inactive.geojson',
      ])
    );
  });
});

test.describe('Critical facilities', () => {
  test('lists police and fire stations, hospitals and schools', async ({
    page,
  }) => {
    const group = GROUPS.criticalFacilities;
    const facilities = group.root(page).locator('noah-facility');
    await expandGroup(page, group, facilities.first());
    await expect(facilities).toHaveCount(4);

    for (const [name, slug, checked] of [
      ['police station', 'police-station', false],
      ['fire station', 'fire-station', false],
      ['hospital', 'hospital', true],
      ['school', 'school', false],
    ] as const) {
      const facility = facilities.filter({
        has: page.locator(`img[src="assets/map-sprites/${slug}.png"]`),
      });
      await expect(facility).toContainText(name);
      const checkbox = facility.getByRole('checkbox');
      if (checked) await expect(checkbox).toBeChecked();
      else await expect(checkbox).not.toBeChecked();
    }

    const schools = facilities
      .filter({ hasText: 'school' })
      .getByRole('checkbox');
    await schools.click();
    await expect(schools).toBeChecked();
  });
});
