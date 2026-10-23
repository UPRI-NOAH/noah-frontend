import mapboxgl, { ConfigSpecification, Map } from 'mapbox-gl';

/**
 * Import id used by `mapbox://styles/mapbox/standard` for its basemap
 * configuration. Mapbox GL JS resolves config for this import via
 * `map.setConfig('basemap', ...)`.
 */
export const STANDARD_BASEMAP_IMPORT = 'basemap';

/**
 * Mapbox Standard style slot names.
 *
 * Layers added without a slot are appended to the top of the style. Slots let
 * us place NOAH data in a stable position that Mapbox maintains internally,
 * instead of depending on Standard's internal (and frequently re-generated)
 * basemap layer IDs.
 *
 * - `bottom`: below all other basemap content (beneath 3D buildings/landmarks).
 * - `middle`: above the Standard basemap surface but beneath labels.
 * - `top`: above everything, including labels.
 */
export type StandardSlot = 'bottom' | 'middle' | 'top';

/**
 * Slot used by the NOAH flood / hazard polygons.
 *
 * `middle` renders above terrain and 3D buildings (so a flooded polygon is
 * never buried under a building) while remaining below Standard's own labels,
 * which keeps place/road names readable on top of the hazard data.
 */
export const NOAH_HAZARD_SLOT: StandardSlot = 'middle';

/**
 * Slot used by NOAH line / symbol overlays that must stay readable above the
 * hazard polygons (boundaries, contour outlines, critical facility markers).
 */
export const NOAH_OVERLAY_SLOT: StandardSlot = 'top';

/**
 * The four basemap variants NOAH switches between.
 *
 * These are exactly the values Mapbox Standard accepts for `lightPreset`
 * (verified against the style schema fragment, whose `values` list is
 * `["dawn", "day", "dusk", "night"]`).
 */
export type Basemap = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Basemap selected when the app loads, before the user has picked one.
 */
export const DEFAULT_BASEMAP: Basemap = 'day';

/**
 * The selectable lighting presets, in the order they are shown to the user.
 *
 * Shared by every preset control so the labels cannot drift apart from the
 * `lightPreset` values they map to.
 */
export const BASEMAP_PRESETS: ReadonlyArray<{
  value: Basemap;
  label: string;
}> = [
  { value: 'dawn', label: 'Dawn' },
  { value: 'day', label: 'Day' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'night', label: 'Night' },
];

/**
 * The lighting selection offered by the map controls panel.
 *
 * `auto` follows the Philippine clock (see {@link getBasemapForPhilippineTime});
 * every other value pins the map to that preset until the user picks `auto`
 * again. The distinction is what lets the panel show "Follows local time" while
 * still allowing a manual override.
 */
export type LightingSelection = 'auto' | Basemap;

/**
 * Human-readable label of a lighting preset (`Dawn`, `Day`, `Dusk`, `Night`).
 *
 * Resolved from {@link BASEMAP_PRESETS} so the label shown in the controls can
 * never drift apart from the label used by the preset list itself.
 */
export function getBasemapLabel(basemap: Basemap): string {
  const preset = BASEMAP_PRESETS.find(({ value }) => value === basemap);
  return preset ? preset.label : basemap;
}

/**
 * Basemap configuration, centralised here so the four lighting definitions
 * cannot drift apart and the service has a single thing to read.
 *
 * Mapbox Standard re-lights through the `lightPreset` property of its
 * `basemap` config. That is deliberately used instead of swapping the style
 * URL, because `setConfig` patches the already-loaded style in place:
 *
 * - terrain (the DEM source and its exaggeration) survives,
 * - 3D buildings / trees / landmarks keep their `show3dObjects` state,
 * - NOAH overlays, hazard GeoJSON, raster and video layers, markers, controls
 *   and the current camera are all untouched,
 * - no style reload, so no re-fetch of sources and no `style.load` cascade.
 *
 * The legacy `terrain` / `satellite` basemaps are not Standard styles and have
 * no `basemap` import, so they are simply left alone; they keep whatever
 * lighting their style already defines.
 */
export const BASEMAP_CONFIGS: Record<Basemap, ConfigSpecification> = {
  dawn: { lightPreset: 'dawn' },
  day: { lightPreset: 'day' },
  dusk: { lightPreset: 'dusk' },
  night: { lightPreset: 'night' },
};

/**
 * The Mapbox Standard configuration for a basemap variant.
 *
 * A fresh object is returned each time so callers cannot mutate the shared
 * constants. `show3dObjects` is left at the Standard default, which keeps 3D
 * buildings and trees enabled, and no label group is turned off.
 */
export function getBasemapConfig(basemap: Basemap): ConfigSpecification {
  return { ...BASEMAP_CONFIGS[basemap] };
}

/**
 * True when the *loaded* basemap is built on Mapbox Standard, which is the only
 * case where `slot` and `setConfig` are meaningful.
 *
 * This is resolved from the loaded style rather than from a style URL, and that
 * distinction matters:
 *
 * - Every NOAH basemap is a *derived* style (`mapbox://styles/upri-noah/...`)
 *   that imports `mapbox://styles/mapbox/standard`; the URL itself never
 *   contains `/styles/mapbox/standard`, so URL sniffing reported `false` for
 *   all of them and silently disabled both slots and the Standard config.
 * - The legacy `terrain` / `satellite` styles have no imports at all, so they
 *   correctly report `false` here.
 *
 * `getConfig` returns `null` for a missing fragment and never throws, which
 * keeps this safe to call from `style.load` handlers.
 */
export function hasStandardBasemap(map: Map): boolean {
  return map.getConfig(STANDARD_BASEMAP_IMPORT) != null;
}

/**
 * Opts a custom layer out of Mapbox Standard's `light-3d` lighting.
 *
 * Standard's day/dawn/dusk/night presets swap the ambient and directional
 * lights. In mapbox-gl v3.32 every layer that renders inside a basemap slot is
 * illuminated by those lights — `*-emissive-strength` defaults to 0, so the
 * preset's lights multiply the layer's *literal* paint colour. That is what
 * makes NOAH data (hazard fills, rainfall contours, satellite /
 * weather-satellite rasters, boundaries) visibly shift at dusk/night while the
 * basemap re-lights. Setting `*-emissive-strength: 1` marks the layer as fully
 * self-lit: it renders with exactly its declared paint in every preset (day
 * pixel output is unchanged) while the basemap keeps re-lighting around it.
 *
 * Only layer types that ship an emissive-strength paint are touched (fill,
 * line, raster, circle, hillshade; symbols already default to emissive).
 */
export function withStandardLightingNoop(
  layer: mapboxgl.AnyLayer
): mapboxgl.AnyLayer['paint'] {
  const base = (layer.paint ?? {}) as Record<string, unknown>;
  switch (layer.type) {
    case 'fill':
      return { 'fill-emissive-strength': 1, ...base } as never;
    case 'line':
      return { 'line-emissive-strength': 1, ...base } as never;
    case 'raster':
      return { 'raster-emissive-strength': 1, ...base } as never;
    case 'circle':
      return { 'circle-emissive-strength': 1, ...base } as never;
    case 'hillshade':
      return { 'hillshade-emissive-strength': 1, ...base } as never;
    default:
      return layer.paint;
  }
}

/**
 * Philippine-Time windows (24-hour clock, inclusive start / exclusive end) for
 * each lighting preset.
 *
 * The playground derives its basemap from the Philippine clock instead of
 * asking the user, so the boundaries live here, next to the preset values they
 * select. The windows are contiguous and cover the whole day, with `night`
 * wrapping past midnight:
 *
 * - `dawn`:  05:00–08:00 AM
 * - `day`:   08:00–5:00 PM
 * - `dusk`:  5:00–7:00 PM
 * - `night`: 7:00–05:00 AM
 */
export const BASEMAP_PHT_SCHEDULE: ReadonlyArray<{
  fromHour: number;
  toHour: number;
  basemap: Basemap;
}> = [
  { fromHour: 5, toHour: 8, basemap: 'dawn' },
  { fromHour: 8, toHour: 17, basemap: 'day' },
  { fromHour: 17, toHour: 19, basemap: 'dusk' },
  { fromHour: 19, toHour: 5, basemap: 'night' },
];

/**
 * The hour of day (0–23) in Philippine Standard Time for `date`.
 *
 * Resolved through `Intl` with the `Asia/Manila` zone rather than the host
 * clock's own offset, so the schedule stays correct regardless of the device
 * timezone: a browser set to UTC must still light the map as morning in the
 * Philippines.
 */
export function getPhilippineHour(date: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value;

  const parsed = hour ? parseInt(hour, 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed % 24;
}

/**
 * The lighting preset whose Philippine-Time window contains `hour` (0–23).
 *
 * Any integer is accepted; out-of-range values are normalised into a day so
 * callers never have to pre-clamp.
 */
export function getBasemapForPhilippineHour(hour: number): Basemap {
  const normalised = ((Math.floor(hour) % 24) + 24) % 24;

  const window = BASEMAP_PHT_SCHEDULE.find(({ fromHour, toHour }) =>
    fromHour < toHour
      ? normalised >= fromHour && normalised < toHour
      : normalised >= fromHour || normalised < toHour
  );

  return window ? window.basemap : DEFAULT_BASEMAP;
}

/**
 * The lighting preset for the given instant on the Philippine clock.
 *
 * This is the whole "realtime" rule: the playground calls it on load and then
 * again on a timer, so the basemap follows dawn → day → dusk → night as the
 * Philippine day progresses.
 */
export function getBasemapForPhilippineTime(date: Date = new Date()): Basemap {
  return getBasemapForPhilippineHour(getPhilippineHour(date));
}
