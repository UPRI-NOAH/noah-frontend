/**
 * Deterministic fixture data served by the network mock (see network.ts).
 *
 * The values are deliberately fake ("Sample ... School") so nobody mistakes a
 * fixture for real hazard data. Each place is chosen so that the hazard
 * fixtures exercise a different exposure level, which lets the specs assert
 * the full colour/label mapping of the Know Your Hazards assessment.
 */

export type LngLat = [number, number];

export type ExposureLevel =
  | 'unavailable'
  | 'little to none'
  | 'low'
  | 'medium'
  | 'high';

export interface MockPlace {
  mapboxId: string;
  name: string;
  address: string;
  coordinates: LngLat;
}

/** Default KYH map centre (UPRI office) from src/app/features/know-your-hazards/store/kyh.store.ts */
export const DEFAULT_CENTER: LngLat = [121.0709613, 14.6577006];

export const PLACES: Record<
  'marikina' | 'tacloban' | 'baguio' | 'quezonCity',
  MockPlace
> = {
  marikina: {
    mapboxId: 'e2e.place.marikina',
    name: 'Marikina City',
    address: 'Marikina City, Metro Manila, Philippines',
    coordinates: [121.1029, 14.6507],
  },
  tacloban: {
    mapboxId: 'e2e.place.tacloban',
    name: 'Tacloban City',
    address: 'Tacloban City, Leyte, Philippines',
    coordinates: [125.0048, 11.2443],
  },
  baguio: {
    mapboxId: 'e2e.place.baguio',
    name: 'Baguio City',
    address: 'Baguio City, Benguet, Philippines',
    coordinates: [120.596, 16.4023],
  },
  quezonCity: {
    mapboxId: 'e2e.place.quezon-city',
    name: 'Quezon City',
    address: 'Quezon City, Metro Manila, Philippines',
    coordinates: [121.0437, 14.676],
  },
};

export const ALL_PLACES: MockPlace[] = Object.values(PLACES);

/** Address returned by the reverse-geocoding mock (used by "current location" and pin dragging). */
export const REVERSE_GEOCODE_PLACE_NAME =
  'Diliman, Quezon City, Metro Manila, Philippines';

/** Geolocation used by tests that grant the geolocation permission. */
export const MOCK_GEOLOCATION = { latitude: 14.6538, longitude: 121.0685 };

// ---------------------------------------------------------------------------
// Know Your Hazards – Mapbox Tilequery fixtures
// ---------------------------------------------------------------------------

/**
 * Raw hazard values as they appear in the NOAH vector tilesets.
 * flood:      `Var` 1..3, or `NoData` (=> "unavailable")
 * landslide:  `LH` 1..3 (or ALLUVIAL === 3)
 * stormSurge: `HAZ` 1..3
 * Omit a key to produce "little to none".
 */
export interface HazardFixture {
  flood?: 1 | 2 | 3 | 'no-data';
  landslide?: 1 | 2 | 3;
  stormSurge?: 1 | 2 | 3;
}

export interface ExpectedExposure {
  flood: ExposureLevel;
  landslide: ExposureLevel;
  'storm-surge': ExposureLevel;
}

const LEVEL_NAMES: Record<1 | 2 | 3, ExposureLevel> = {
  1: 'low',
  2: 'medium',
  3: 'high',
};

/** Mirrors HazardsService._formatRiskLevel so specs can derive the expected label. */
export function expectedExposure(fixture: HazardFixture): ExpectedExposure {
  return {
    flood:
      fixture.flood === 'no-data'
        ? 'unavailable'
        : fixture.flood
        ? LEVEL_NAMES[fixture.flood]
        : 'little to none',
    landslide: fixture.landslide
      ? LEVEL_NAMES[fixture.landslide]
      : 'little to none',
    'storm-surge': fixture.stormSurge
      ? LEVEL_NAMES[fixture.stormSurge]
      : 'little to none',
  };
}

export const DEFAULT_HAZARDS: HazardFixture = { flood: 2, landslide: 1 };

export const HAZARDS_BY_PLACE: Record<string, HazardFixture> = {
  [PLACES.marikina.mapboxId]: { flood: 3 },
  [PLACES.tacloban.mapboxId]: { flood: 'no-data', stormSurge: 3 },
  [PLACES.baguio.mapboxId]: { flood: 1, landslide: 3 },
  [PLACES.quezonCity.mapboxId]: { flood: 2, landslide: 2, stormSurge: 2 },
};

export function hazardFeatureCollection(
  fixture: HazardFixture,
  [lng, lat]: LngLat
) {
  const point = { type: 'Point', coordinates: [lng, lat] };
  const features: unknown[] = [];
  const feature = (layer: string, properties: Record<string, unknown>) => ({
    type: 'Feature',
    id: features.length + 1,
    geometry: point,
    properties: {
      ...properties,
      tilequery: { distance: 0, geometry: 'polygon', layer },
    },
  });

  if (fixture.flood === 'no-data') {
    features.push(feature('PH000000000_FH_nodata', { NoData: 1 }));
  } else if (fixture.flood) {
    features.push(feature('PH130000000_FH_100yr', { Var: fixture.flood }));
  }
  if (fixture.landslide) {
    features.push(feature('PH130000000_LH_lh1', { LH: fixture.landslide }));
  }
  if (fixture.stormSurge) {
    features.push(feature('PH130000000_SSH_ssa4', { HAZ: fixture.stormSurge }));
  }
  return { type: 'FeatureCollection', features };
}

// ---------------------------------------------------------------------------
// Know Your Hazards – critical facilities near the selected point
// ---------------------------------------------------------------------------

export interface MockFacility {
  name: string;
  layer: 'schools' | 'hospitals' | 'fire_station' | 'police_station';
  /** metres from the queried point */
  distance: number;
  /** icon slug used by the UI: assets/map-sprites/svg/<icon>.svg */
  icon: 'school' | 'hospital' | 'fire-station' | 'police-station';
  /** distance as rendered by the `number: '1.1-2'` pipe */
  distanceLabel: string;
}

export const CRITICAL_FACILITIES: MockFacility[] = [
  {
    name: 'Sample Elementary School',
    layer: 'schools',
    distance: 450,
    icon: 'school',
    distanceLabel: '0.45 km away',
  },
  {
    name: 'Sample General Hospital',
    layer: 'hospitals',
    distance: 1234,
    icon: 'hospital',
    distanceLabel: '1.23 km away',
  },
  {
    name: 'Sample Fire Station',
    layer: 'fire_station',
    distance: 2000,
    icon: 'fire-station',
    distanceLabel: '2.0 km away',
  },
  {
    name: 'Sample Police Station',
    layer: 'police_station',
    distance: 3500,
    icon: 'police-station',
    distanceLabel: '3.5 km away',
  },
];

export function criticalFacilitiesFeatureCollection(
  facilities: MockFacility[],
  [lng, lat]: LngLat
) {
  return {
    type: 'FeatureCollection',
    features: facilities.map((facility, index) => ({
      type: 'Feature',
      id: index + 1,
      geometry: {
        type: 'Point',
        coordinates: [lng + 0.001 * (index + 1), lat + 0.001 * (index + 1)],
      },
      properties: {
        name: facility.name,
        amenity: facility.layer,
        tilequery: {
          distance: facility.distance,
          geometry: 'point',
          layer: facility.layer,
        },
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// Mapbox Search Box API
// ---------------------------------------------------------------------------

export function searchSuggestions(query: string, places = ALL_PLACES) {
  const q = query.trim().toLowerCase();
  return {
    suggestions: places
      .filter(
        (place) =>
          place.name.toLowerCase().includes(q) ||
          place.address.toLowerCase().includes(q)
      )
      .map((place) => ({
        name: place.name,
        mapbox_id: place.mapboxId,
        feature_type: 'place',
        full_address: place.address,
        place_formatted: place.address.replace(`${place.name}, `, ''),
      })),
    attribution: 'e2e-mock',
  };
}

export function retrieveResponse(place: MockPlace) {
  const [longitude, latitude] = place.coordinates;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: place.coordinates },
        properties: {
          name: place.name,
          mapbox_id: place.mapboxId,
          feature_type: 'place',
          full_address: place.address,
          place_formatted: place.address.replace(`${place.name}, `, ''),
          coordinates: { latitude, longitude },
        },
      },
    ],
    attribution: 'e2e-mock',
  };
}

// ---------------------------------------------------------------------------
// Search history (localStorage) – mirrors location-search-history.service.ts
// ---------------------------------------------------------------------------

export const SEARCH_HISTORY_STORAGE_KEY = 'noah.locationSearchHistory.v1';
export const SEARCH_HISTORY_MAX_ITEMS = 5;
export const SEARCH_HISTORY_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export function historyEntry(place: MockPlace, searchedAt: number) {
  return {
    mapboxId: place.mapboxId,
    name: place.name,
    address: place.address,
    coordinates: place.coordinates,
    searchedAt,
  };
}

// ---------------------------------------------------------------------------
// IoT login (iot-noah.up.edu.ph)
// ---------------------------------------------------------------------------

/** Accounts recognised by LoginComponent.onSubmit and the name it stores. */
export const IOT_ACCOUNTS = {
  qc: { username: 'qc_admin', displayName: 'qc admin', loginStatus: '1' },
  laguna: { username: 'laguna_admin', displayName: 'Laguna', loginStatus: '2' },
  devs: { username: 'noah_dev', displayName: 'Devs', loginStatus: 'devs' },
} as const;

export const IOT_PASSWORD = 'e2e-password';

// ---------------------------------------------------------------------------
// Exposure assessment (panahon.up.edu.ph)
// ---------------------------------------------------------------------------

export const AFFECTED_BARANGAYS = [
  {
    brgy: 'Sample Barangay Uno',
    muni: 'Sample Municipality',
    prov: 'Sample Province',
    total_pop: 12500,
    total_aff_pop: 4300,
    exposed_medhigh: 2100,
    perc_aff_medhigh: 16.8,
  },
  {
    brgy: 'Sample Barangay Dos',
    muni: 'Sample Municipality',
    prov: 'Sample Province',
    total_pop: 8200,
    total_aff_pop: 1900,
    exposed_medhigh: 700,
    perc_aff_medhigh: 8.54,
  },
  {
    brgy: 'Riverside Test Barangay',
    muni: 'Another Municipality',
    prov: 'Another Province',
    total_pop: 30100,
    total_aff_pop: 15800,
    exposed_medhigh: 9900,
    perc_aff_medhigh: 32.89,
  },
];

export const RAINFALL_DATETIME_TEXT = 'November 06, 2026 08:00 AM';

export const ARCHIVE_RESULTS = {
  results: [
    {
      datetime: '2026-11-05T00:00:00Z',
      s3_link: 'https://archive.e2e.invalid/2026-11-05.csv',
    },
  ],
};

// ---------------------------------------------------------------------------
// Static map resources
// ---------------------------------------------------------------------------

/**
 * Minimal valid Mapbox GL style so maps load without contacting Mapbox.
 *
 * Each style id gets its own sprite URL – like the real NOAH styles – so that
 * `map.setStyle()` performs a full rebuild and fires `style.load` (identical
 * styles would be diffed in place and the app's re-initialisation would
 * never run).
 */
export function stubMapStyle(styleId: string) {
  return {
    version: 8,
    name: `noah-e2e-stub ${styleId}`,
    sources: {},
    sprite: `mapbox://sprites/${styleId}`,
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#dbe4ee' },
      },
    ],
  };
}

/**
 * TileJSON for any `mapbox://` source. `vector_layers` is intentionally
 * omitted: when present, Mapbox GL validates every `source-layer` against it
 * and logs an error per layer.
 */
export function stubTileJson(tilesetIds: string, isRaster: boolean) {
  const extension = isRaster ? 'png' : 'vector.pbf';
  return {
    tilejson: '2.2.0',
    name: tilesetIds,
    scheme: 'xyz',
    minzoom: 0,
    maxzoom: 14,
    bounds: [116.0, 4.0, 127.0, 21.5],
    tiles: [`https://api.mapbox.com/v4/${tilesetIds}/{z}/{x}/{y}.${extension}`],
  };
}

/** Compact version of webgis-static .../hazards/ph_combined_tileset.json covering every hazard level. */
export const STUDIO_HAZARD_TILESETS = [
  {
    url: 'mapbox://upri-noah.ph_fh_5yr_tls',
    sourceLayer: ['PH130000000_FH_5yr'],
  },
  {
    url: 'mapbox://upri-noah.ph_fh_25yr_tls',
    sourceLayer: ['PH130000000_FH_25yr'],
  },
  {
    url: 'mapbox://upri-noah.ph_fh_100yr_tls',
    sourceLayer: ['PH130000000_FH_100yr'],
  },
  {
    url: 'mapbox://upri-noah.ph_lh_lh1_tls',
    sourceLayer: ['PH130000000_LH_lh1'],
  },
  {
    url: 'mapbox://upri-noah.ph_lh_lh2_tls',
    sourceLayer: ['ph_lh_af', 'ph_lh_df'],
  },
  {
    url: 'mapbox://upri-noah.ph_ssh_ssa1_tls',
    sourceLayer: ['PH130000000_SSH_ssa1'],
  },
  {
    url: 'mapbox://upri-noah.ph_ssh_ssa2_tls',
    sourceLayer: ['PH130000000_SSH_ssa2'],
  },
  {
    url: 'mapbox://upri-noah.ph_ssh_ssa3_tls',
    sourceLayer: ['PH130000000_SSH_ssa3'],
  },
  {
    url: 'mapbox://upri-noah.ph_ssh_ssa4_tls',
    sourceLayer: ['PH130000000_SSH_ssa4'],
  },
];

export const STUDIO_AFFECTED_POPULATION_TILESETS = [
  {
    url: 'mapbox://upri-noah.ph_fh_fl_bgy_tls',
    sourceLayer: ['PH130000000_FL_BGY'],
  },
];

export const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
};

/**
 * Smallest valid Mapbox glyph range: a protobuf `glyphs { stacks { name: "stub"
 * range: "0-255" } }` with no glyphs. An empty body is rejected by GL JS
 * ("glyphs is not iterable").
 */
export const EMPTY_GLYPH_RANGE_PBF = Buffer.from([
  0x0a,
  0x0d, // field 1 (stacks), length 13
  0x0a,
  0x04,
  0x73,
  0x74,
  0x75,
  0x62, // name: "stub"
  0x12,
  0x05,
  0x30,
  0x2d,
  0x32,
  0x35,
  0x35, // range: "0-255"
]);

/** 1x1 transparent PNG – stands in for every raster overlay (contours, temperature, ...). */
export const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
