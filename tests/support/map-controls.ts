import { expect, Locator, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Locators for the shared map UI that every NOAH map renders
 * (src/app/shared/components/map-controls and map-attribution):
 *
 * - a toolbar on the right edge: "Zoom in", "Zoom out", "Reset bearing to
 *   north", "Show my location", "Map style" and – on maps that can measure –
 *   "Measure area", "Measure distance", "Clear measurements";
 * - a "Map style" panel with the Streets / Satellite / Standard basemaps and
 *   the Standard lighting presets (Auto, Dawn, Day, Dusk, Night);
 * - the attribution credits in the bottom-right corner.
 *
 * `root` is the map page's own component (e.g. `noah-map-kyh`) so that the
 * locators never pick up another map's controls.
 */

export type MapStyleName = 'Streets' | 'Satellite' | 'Standard';

export const STYLE_NAMES: MapStyleName[] = ['Streets', 'Satellite', 'Standard'];

export const LIGHTING_PRESETS = [
  'Auto',
  'Dawn',
  'Day',
  'Dusk',
  'Night',
] as const;

export const toolbar = (root: Locator) => root.locator('noah-map-controls');

export const toolbarButton = (root: Locator, name: string) =>
  toolbar(root).getByRole('button', { name, exact: true });

/** "Map style" (or "Map style — Automatic lighting enabled" in auto mode). */
export const mapStyleButton = (root: Locator) =>
  toolbar(root).getByRole('button', { name: /^Map style/ });

export const stylePanel = (root: Locator) =>
  toolbar(root).getByRole('region', { name: 'Map style' });

/** A basemap card; the Standard card is announced as "Standard (new)". */
export const styleOption = (root: Locator, name: MapStyleName) =>
  stylePanel(root).getByRole('button', {
    name: name === 'Standard' ? 'Standard (new)' : name,
    exact: true,
  });

export const lightingOption = (root: Locator, name: string) =>
  stylePanel(root).getByRole('button', { name, exact: true });

export const lightingStatus = (root: Locator) =>
  stylePanel(root).locator('.map-controls-status');

/**
 * Opens the style panel with the keyboard. A keyboard press opens the panel
 * "pinned"; a mouse click does not (see the known issue in map-controls.spec).
 */
export async function openStylePanel(page: Page, root: Locator): Promise<void> {
  if (await stylePanel(root).isVisible()) return;
  await mapStyleButton(root).focus();
  await page.keyboard.press('Enter');
  await expect(stylePanel(root)).toBeVisible();
}

export async function chooseStyle(
  page: Page,
  root: Locator,
  name: MapStyleName
) {
  await openStylePanel(page, root);
  await styleOption(root, name).click();
}

export const attribution = (root: Locator) =>
  root.locator('noah-map-attribution');

/** Mapbox's scale bar, e.g. "500 m" – it changes whenever the zoom changes. */
export const scaleBar = (root: Locator) => root.locator('.mapboxgl-ctrl-scale');

// ---------------------------------------------------------------------------
// Configured style ids (read from the environment files the app is built with)
// ---------------------------------------------------------------------------

const ENV_DIR = join(__dirname, '..', '..', 'src', 'environments');

/**
 * Style ids ("upri-noah/<id>") per basemap, from every environment file.
 * The panel's "Streets" card loads the `terrain` style.
 */
export function configuredStyleIds(): Record<MapStyleName, string[]> {
  const ids: Record<MapStyleName, string[]> = {
    Streets: [],
    Satellite: [],
    Standard: [],
  };
  const keys: Record<string, MapStyleName> = {
    terrain: 'Streets',
    satellite: 'Satellite',
    standard: 'Standard',
  };
  for (const file of ['environment.ts', 'environment.prod.ts']) {
    const source = readFileSync(join(ENV_DIR, file), 'utf8');
    for (const [, key, id] of source.matchAll(
      /(\w+):\s*'mapbox:\/\/styles\/([\w-]+\/\w+)'/g
    )) {
      if (keys[key] && !ids[keys[key]].includes(id)) ids[keys[key]].push(id);
    }
  }
  return ids;
}
