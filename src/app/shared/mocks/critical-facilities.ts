import { LngLatLike, SymbolLayer, VectorSource } from 'mapbox-gl';

export const CRITICAL_FACILITIES_ARR = [
  'police-station',
  'fire-station',
  'hospital',
  'school',
] as const;

export type CriticalFacility = typeof CRITICAL_FACILITIES_ARR[number];

export type SampleMarker = {
  coords: LngLatLike;
  name: string;
  type: 'police-station' | 'fire-station' | 'hospital' | 'school';
  address: string;
};

export const LEYTE_SCHOOLS: SymbolLayer = {
  id: 'leyte_schools',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7u49zi010o20nrjlynz9jo-5cez5',
  },
  'source-layer': 'leyte_schools',
  layout: {
    'icon-image': 'icon-school',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_HOSPITALS: SymbolLayer = {
  id: 'leyte_hospitals',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7ua4aq1yh328qncf078jpv-9xhtt',
  },
  'source-layer': 'leyte_hospitals',
  layout: {
    'icon-image': 'icon-hospital',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_FIRESTATIONS: SymbolLayer = {
  id: 'leyte_firestation',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7u97310bbw28lg0yxolcv2-1gmiz',
  },
  'source-layer': 'leyte_firestation',
  layout: {
    'icon-image': 'icon-firestation',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_POLICESTATIONS: SymbolLayer = {
  id: 'leyte_police',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7uatvk04kq21pqtks7rj3m-0n4tz',
  },
  'source-layer': 'leyte_police',
  layout: {
    'icon-image': 'icon-policestation',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const CF_TILESET_NAMES = [
  LEYTE_SCHOOLS,
  LEYTE_HOSPITALS,
  LEYTE_FIRESTATIONS,
  LEYTE_FIRESTATIONS,
]
  .map((symbolLayer: SymbolLayer) => (symbolLayer.source as VectorSource).url)
  .join(',')
  .replace(/mapbox:\/\//g, '');

export type CriticalFacilityLayer =
  | 'leyte_schools'
  | 'leyte_hospitals'
  | 'leyte_firestation'
  | 'leyte_police';

export const getSymbolLayer = (id: string): SymbolLayer => ({
  id,
  type: 'symbol',
  source: {
    type: 'vector',
    url: MAPBOX_CRIT_FAC[id].url,
  },
  'source-layer': MAPBOX_CRIT_FAC[id].sourceLayer,
  paint: {
    'icon-opacity': 1,
    'text-opacity': 1,
  },
  layout: {
    'icon-image': id,
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
});

export const getCriticalFacility = () => {};

export const MAPBOX_CRIT_FAC = {
  school: {
    url: 'mapbox://jadurani.ckq7u49zi010o20nrjlynz9jo-5cez5',
    sourceLayer: 'leyte_schools',
  },
  hospital: {
    url: 'mapbox://jadurani.ckq7ua4aq1yh328qncf078jpv-9xhtt',
    sourceLayer: 'leyte_hospitals',
  },
  'fire-station': {
    url: 'mapbox://jadurani.ckq7u97310bbw28lg0yxolcv2-1gmiz',
    sourceLayer: 'leyte_firestation',
  },
  'police-station': {
    url: 'mapbox://jadurani.ckq7uatvk04kq21pqtks7rj3m-0n4tz',
    sourceLayer: 'leyte_police',
  },
};
