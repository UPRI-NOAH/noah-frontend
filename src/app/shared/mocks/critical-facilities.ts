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
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
});

export const getCircleLayer = (sourceName: string): CircleLayer => {
  const circleColors: Record<CriticalFacility, string> = {
    'fire-station': '#7A0177',
    hospital: '#4a1486',
    'police-station': '#8C5109',
    school: '#35978F',
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
    paint: {
      'text-color': '#ffffff',
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
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/hospitals.geojson',
  },
  'fire-station': {
    url: 'mapbox://upri-noah.cebidtpr',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/fire_station.geojson',
  },
  'police-station': {
    url: 'mapbox://upri-noah.ds1saq22',
    data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/police_station.geojson',
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
