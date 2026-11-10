import type { Locator } from '@playwright/test';
import { test, expect, Page } from '../support/test';
import { expectMapReady, knownIssue, styleIdOf } from '../support/helpers';
import { MOCK_GEOLOCATION } from '../support/mock-data';
import type { NetworkMock } from '../support/network';
import {
  LIGHTING_PRESETS,
  MapStyleName,
  STYLE_NAMES,
  attribution,
  chooseStyle,
  configuredStyleIds,
  lightingOption,
  lightingStatus,
  mapStyleButton,
  openStylePanel,
  scaleBar,
  styleOption,
  stylePanel,
  toolbar,
  toolbarButton,
} from '../support/map-controls';

/**
 * The shared map toolbar, "Map style" panel and attribution
 * (src/app/shared/components/map-controls, map-attribution), exercised on all
 * three maps. Every map starts on the new Standard basemap with Day lighting.
 */

const MAPS = [
  {
    name: 'Know Your Hazards',
    path: '/know-your-hazards',
    root: 'noah-map-kyh',
    canMeasure: false,
  },
  {
    name: 'Weather Updates',
    path: '/weather-updates',
    root: 'noah-map-weather-updates',
    canMeasure: false,
  },
  {
    name: 'NOAH Studio',
    path: '/noah-studio',
    root: 'noah-map-playground',
    canMeasure: true,
  },
] as const;

const STYLE_IDS = configuredStyleIds();

/** Style id of the most recent style request ("upri-noah/<id>"). */
const lastStyleId = (api: NetworkMock) => {
  const calls = api.callsTo('mapboxStyle');
  return calls.length ? styleIdOf(calls[calls.length - 1].url) : '';
};

/**
 * Waits until the configured style for `name` is the last one requested.
 * (Mapbox GL v3 may fetch a style twice per switch – once for its style diff,
 * once for the rebuild – so request counts are not meaningful.)
 */
async function expectStyleRequested(api: NetworkMock, name: MapStyleName) {
  await expect
    .poll(() => STYLE_IDS[name].includes(lastStyleId(api)), {
      message: `the ${name} style is requested`,
    })
    .toBe(true);
}

/** "500 m" -> 500, "2 km" -> 2000 */
function scaleMetres(text: string): number {
  const match = text.trim().match(/^([\d.,]+)\s*(km|m)$/);
  if (!match) throw new Error(`Unexpected scale bar text "${text}"`);
  const value = Number(match[1].replace(/,/g, ''));
  return match[2] === 'km' ? value * 1000 : value;
}

/** Waits until the scale bar stops changing (load / fly-to / zoom animations). */
async function settledScale(root: Locator): Promise<string> {
  const page = root.page();
  const deadline = Date.now() + 20_000;
  let previous = await scaleBar(root).innerText();
  for (;;) {
    await page.waitForTimeout(700);
    const current = await scaleBar(root).innerText();
    if (current && current === previous) return current;
    if (Date.now() > deadline) {
      throw new Error(
        `Scale bar never settled (last "${previous}" -> "${current}")`
      );
    }
    previous = current;
  }
}

async function openMap(page: Page, path: string, rootSelector: string) {
  await page.goto(path);
  const root = page.locator(rootSelector);
  await expectMapReady(root);
  await expect(mapStyleButton(root)).toBeVisible();
  return root;
}

for (const map of MAPS) {
  test.describe(`${map.name} map`, () => {
    test('the toolbar offers zoom, orientation, location and style actions', async ({
      page,
    }) => {
      const root = await openMap(page, map.path, map.root);
      for (const name of [
        'Zoom in',
        'Zoom out',
        'Reset bearing to north',
        'Show my location',
      ]) {
        await expect(toolbarButton(root, name)).toBeVisible();
      }
      await expect(
        toolbar(root).getByRole('group', { name: 'Zoom and orientation' })
      ).toBeVisible();

      const measuring = toolbar(root).getByRole('group', {
        name: 'Measurements',
      });
      if (map.canMeasure) {
        await expect(measuring).toBeVisible();
        for (const name of [
          'Measure area',
          'Measure distance',
          'Clear measurements',
        ]) {
          await expect(toolbarButton(root, name)).toBeVisible();
        }
      } else {
        // Maps without a drawing tool don't show dead measuring buttons.
        await expect(measuring).toHaveCount(0);
      }
    });

    test('zoom buttons change the map scale', async ({ page }) => {
      const root = await openMap(page, map.path, map.root);
      // The scale bar shows a shorter distance after zooming in and a longer
      // one after zooming out. (Compared with each other rather than with the
      // load-time scale: a page may still be flying to its start view.)
      const before = await settledScale(root);

      await toolbarButton(root, 'Zoom in').click();
      const zoomedIn = await settledScale(root);
      expect(scaleMetres(zoomedIn)).toBeLessThan(scaleMetres(before));

      await toolbarButton(root, 'Zoom out').click();
      const zoomedOut = await settledScale(root);
      expect(scaleMetres(zoomedOut)).toBeGreaterThan(scaleMetres(zoomedIn));
    });

    test('"Show my location" puts the device position on the map', async ({
      page,
      context,
    }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation(MOCK_GEOLOCATION);
      const root = await openMap(page, map.path, map.root);

      await toolbarButton(root, 'Show my location').click();
      await expect(root.locator('.mapboxgl-user-location-dot')).toBeVisible({
        timeout: 15_000,
      });
    });

    test('the style panel switches basemaps', async ({ page, api }) => {
      const root = await openMap(page, map.path, map.root);
      expect(STYLE_IDS.Standard).toContain(lastStyleId(api));

      await chooseStyle(page, root, 'Satellite');
      await expectStyleRequested(api, 'Satellite');
      await expect(styleOption(root, 'Satellite')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(styleOption(root, 'Standard')).toHaveAttribute(
        'aria-pressed',
        'false'
      );

      await styleOption(root, 'Streets').click();
      await expectStyleRequested(api, 'Streets');

      await styleOption(root, 'Standard').click();
      await expectStyleRequested(api, 'Standard');
    });

    test('credits Mapbox, OpenStreetMap and the Department of Health', async ({
      page,
    }) => {
      const root = await openMap(page, map.path, map.root);
      const credits = attribution(root);
      for (const [name, href] of [
        ['Mapbox', 'https://www.mapbox.com/about/maps/'],
        ['OpenStreetMap', 'https://www.openstreetmap.org/about/'],
        ['Department of Health', 'https://doh.gov.ph/'],
        ['Improve this map', 'https://www.mapbox.com/map-feedback/'],
      ]) {
        const link = credits.getByRole('link', { name, exact: true });
        await expect(link).toHaveAttribute('href', href);
        await expect(link).toHaveAttribute('target', '_blank');
      }
    });
  });
}

test.describe('Map style panel (Know Your Hazards)', () => {
  let root: Locator;

  test.beforeEach(async ({ page }) => {
    root = await openMap(page, '/know-your-hazards', 'noah-map-kyh');
  });

  test('lists the three basemaps with Standard selected and marked new', async ({
    page,
  }) => {
    await openStylePanel(page, root);
    await expect(
      stylePanel(root).getByRole('heading', { name: 'Map style' })
    ).toBeVisible();
    for (const name of STYLE_NAMES) {
      await expect(styleOption(root, name)).toBeVisible();
      await expect(styleOption(root, name).locator('img')).toHaveAttribute(
        'src',
        /assets\/images\/\w+-thumb\.jpg$/
      );
    }
    await expect(styleOption(root, 'Standard')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(
      styleOption(root, 'Standard').getByText('New', { exact: true })
    ).toBeVisible();
    await expect(styleOption(root, 'Streets')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(mapStyleButton(root)).toHaveAttribute('aria-expanded', 'true');
  });

  test('can be collapsed again', async ({ page }) => {
    await openStylePanel(page, root);
    await stylePanel(root)
      .getByRole('button', { name: 'Collapse map style panel' })
      .click();
    await expect(stylePanel(root)).toHaveCount(0);
    await expect(mapStyleButton(root)).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('choosing the active basemap does not reload the map', async ({
    page,
    api,
  }) => {
    await chooseStyle(page, root, 'Standard');
    await page.waitForTimeout(500);
    // Only the initial Standard style request.
    expect(api.callsTo('mapboxStyle')).toHaveLength(1);
  });

  test('the location pin is restored after switching basemaps', async ({
    page,
    api,
  }) => {
    await expect(page.locator('#map-kyh .mapboxgl-marker')).toHaveCount(1);
    await chooseStyle(page, root, 'Satellite');
    await expectStyleRequested(api, 'Satellite');
    await expect(page.locator('#map-kyh .mapboxgl-marker')).toHaveCount(1);
  });

  test('a mouse click on "Map style" opens the panel', async ({ page }) => {
    knownIssue(
      'MapControlsComponent opens the panel on pointerenter, so a mouse click lands on an ' +
        'already-open panel and togglePanel() closes it again – hovering and clicking the ' +
        'button leaves the panel closed.'
    );
    await mapStyleButton(root).click();
    await page.waitForTimeout(400); // longer than the 150 ms hover-close delay
    await expect(stylePanel(root)).toBeVisible({ timeout: 2_000 });
  });
});

test.describe('Lighting presets', () => {
  let root: Locator;

  test.beforeEach(async ({ page }) => {
    // 20:30 Philippine Time -> the automatic schedule picks "Night".
    await page.clock.setFixedTime(new Date('2026-11-06T20:30:00+08:00'));
    root = await openMap(page, '/know-your-hazards', 'noah-map-kyh');
    await openStylePanel(page, root);
  });

  test('offers Auto plus the four Standard presets, starting on Day', async () => {
    for (const name of LIGHTING_PRESETS) {
      await expect(lightingOption(root, name)).toBeEnabled();
    }
    await expect(lightingOption(root, 'Day')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(lightingStatus(root)).toHaveText('Manual · Day');
  });

  test('a manual preset can be chosen', async () => {
    await lightingOption(root, 'Dusk').click();
    await expect(lightingOption(root, 'Dusk')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(lightingOption(root, 'Day')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(lightingStatus(root)).toHaveText('Manual · Dusk');
  });

  test('Auto follows Philippine time and is flagged on the toolbar', async () => {
    await lightingOption(root, 'Auto').click();
    await expect(lightingStatus(root)).toHaveText(
      'Follows local time · Night now'
    );
    await expect(mapStyleButton(root)).toHaveAttribute(
      'aria-label',
      'Map style — Automatic lighting enabled'
    );
    await expect(
      mapStyleButton(root).getByText('A', { exact: true })
    ).toBeVisible();
  });

  test('presets are disabled on basemaps without lighting', async ({
    page,
  }) => {
    await styleOption(root, 'Streets').click();
    for (const name of LIGHTING_PRESETS) {
      await expect(lightingOption(root, name)).toBeDisabled();
    }
  });

  test('explains which basemap supports lighting', async () => {
    knownIssue(
      'With Streets or Satellite selected the lighting status reads "Select the Light basemap", ' +
        'but no basemap is called "Light" – the card is labelled "Standard".'
    );
    await styleOption(root, 'Satellite').click();
    await expect(lightingStatus(root)).toContainText('Standard');
  });
});
