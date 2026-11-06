import { expect, Locator, Page } from '@playwright/test';
import { expectMapReady } from './helpers';

/**
 * Locators for NOAH Studio (src/app/features/noah-playground).
 *
 * Every layer group in the sidebar is its own Angular component, so groups
 * are addressed by component selector rather than by fragile CSS classes.
 */

export const sidebar = (page: Page) => page.locator('#sidebar');

export interface LayerGroup {
  /** Visible title of the group header. */
  title: string;
  /** Component element wrapping the whole group. */
  root: (page: Page) => Locator;
}

const hazardType = (title: string): LayerGroup => ({
  title,
  root: (page) =>
    sidebar(page).locator('noah-hazard-type').filter({ hasText: title }),
});

const component = (selector: string, title: string): LayerGroup => ({
  title,
  root: (page) => sidebar(page).locator(selector),
});

export const GROUPS = {
  terrain: component('noah-exaggeration', '3D Terrain'),
  flood: hazardType('Flood Hazard'),
  weatherUpdates: {
    title: 'Weather Updates',
    // Inline in noah-playground.component.html: the header row plus the
    // nested weather layer groups.
    root: (page: Page) =>
      sidebar(page)
        .locator('div')
        .filter({ has: page.locator('noah-wind-group') })
        .filter({ has: page.getByText('Weather Updates', { exact: true }) })
        .last(),
  } as LayerGroup,
  weatherSatellite: component(
    'noah-weather-satellite-playground',
    'Weather Satellite Image'
  ),
  typhoonTrack: component('noah-typhoon-track-group', 'Typhoon Track'),
  rainfallContour: component('noah-contour-maps', 'Rainfall Contour'),
  lightning: component('noah-lightning-group', 'Lightning'),
  wind: component('noah-wind-group', 'Wind'),
  floodImpact: component('noah-risk-assessment-group', 'Flood Impact Forecast'),
  landslide: hazardType('Landslide Hazard'),
  stormSurge: hazardType('Storm Surge Hazard'),
  temperature: component('noah-temperature', 'Temperature'),
  volcanoes: component('noah-volcano-group', 'Volcanoes'),
  criticalFacilities: component(
    'noah-critical-facilities-playground',
    'Critical Facilities'
  ),
  iot: component('noah-qc-sensors-group', 'IoT (Internet of Things)'),
  riverbasin: component('noah-riverbasin', 'Riverbasin Boundaries'),
  boundaries: component('noah-boundaries-group', 'Administrative Boundaries'),
};

/** The main on/off checkbox in a group's header. */
export function groupToggle(page: Page, group: LayerGroup): Locator {
  return group.root(page).getByRole('checkbox').first();
}

/** The clickable header text that expands/collapses a group. */
export function groupHeader(page: Page, group: LayerGroup): Locator {
  return group.root(page).getByText(group.title, { exact: true }).first();
}

/** Expands a group if `probe` (something inside its body) is not yet visible. */
export async function expandGroup(
  page: Page,
  group: LayerGroup,
  probe: Locator
): Promise<void> {
  if (!(await probe.isVisible())) {
    await groupHeader(page, group).click();
  }
  await expect(probe).toBeVisible();
}

/** Collapse/expand control inside the open sidebar (icon-only button). */
export function sidebarCollapseButton(page: Page): Locator {
  return sidebar(page).locator('button.md\\:left-96');
}

export const studioMap = (page: Page) => page.locator('noah-map-playground');

/** Where the measuring tools print "Total Distance" / "Total Area". */
export const measurementResult = (page: Page) => page.locator('#area');

/**
 * Draws a shape with the Studio measuring tools (Mapbox Draw) and waits for
 * the measurement. Draw only starts handling input once the map has fired
 * "load" – which can take a while on a busy CI runner – so the gesture is
 * retried until it lands or `timeout` expires.
 */
export async function measureOnMap(
  page: Page,
  tool: 'line' | 'polygon',
  points: Array<[number, number]>,
  expected: RegExp,
  timeout = 30_000
): Promise<void> {
  const canvas = studioMap(page).locator('canvas.mapboxgl-canvas');
  await expectMapReady(studioMap(page));
  await expect(async () => {
    await page.keyboard.press('Escape'); // leave any half-finished drawing
    await page.locator(`.mapbox-gl-draw_${tool}`).click();
    const box = (await canvas.boundingBox())!;
    for (const [fx, fy] of points) {
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    }
    await page.keyboard.press('Enter'); // finish the shape
    await expect(measurementResult(page)).toContainText(expected, {
      timeout: 2_000,
    });
  }).toPass({ timeout });
}
