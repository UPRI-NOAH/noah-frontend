import { CircleLayer, LngLatLike, SymbolLayer, VectorSource } from 'mapbox-gl';

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

export const getSymbolLayer = (sourceName: string): SymbolLayer => ({
  id: `${sourceName}-image`,
  type: 'symbol',
  source: sourceName,
  paint: {
    'icon-opacity': 1,
    'text-opacity': 1,
  },
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': sourceName,
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
});

export const getCircleLayer = (sourceName: string): CircleLayer => {
  const circleColors: Record<CriticalFacility, string> = {
    'fire-station': '#FEC7A5',
    hospital: '#F5C3DF',
    'police-station': '#C4CFE4',
    school: '#A7DEC7',
  };

  return {
    id: `${sourceName}-cluster`,
    type: 'circle',
    source: sourceName,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': circleColors[sourceName],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    },
  };
};

export const getClusterTextCount = (sourceName: string): SymbolLayer => {
  const facilityNames: Record<CriticalFacility, string> = {
    'fire-station': 'Fire Stations',
    hospital: 'Hospitals',
    'police-station': 'Police Stations',
    school: 'Schools',
  };

  return {
    id: `${sourceName}-cluster-text`,
    type: 'symbol',
    source: sourceName,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': `{point_count_abbreviated}\n${facilityNames[sourceName]}`,
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
  };
};

export const getCriticalFacility = () => {};

export const criticalFacilities = {
  school: {
    url: 'mapbox://upri-noah.drbtf3uh',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/schools.geojson',
  },
  hospital: {
    url: 'mapbox://upri-noah.0qj1zvhm',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/police_station.geojson',
  },
  'fire-station': {
    url: 'mapbox://upri-noah.cebidtpr',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/hospitals.geojson',
  },
  'police-station': {
    url: 'mapbox://upri-noah.ds1saq22',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/fire_station.geojson',
  },
};

export const MAPBOX_CRIT_FAC = {
  school: {
    url: 'mapbox://upri-noah.drbtf3uh',
    sourceLayer: 'schools_g-cjc0bt',
  },
  hospital: {
    url: 'mapbox://upri-noah.0qj1zvhm',
    sourceLayer: 'hospitals_g-2v0hca',
  },
  'fire-station': {
    url: 'mapbox://upri-noah.cebidtpr',
    sourceLayer: 'fire_station_g-64u931',
  },
  'police-station': {
    url: 'mapbox://upri-noah.ds1saq22',
    sourceLayer: 'police_station_g-6ekisg',
  },
};
