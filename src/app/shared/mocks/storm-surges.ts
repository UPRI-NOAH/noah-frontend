import { FillLayer } from 'mapbox-gl';

export const LEYTE_STORM_SURGE: FillLayer = {
  id: 'storm-surge',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.cmmzrdab',
  },
  'source-layer': 'Leyte_StormSurge_SSA4-93raju',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'HAZ'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 0.8,
  },
};

export const LEYTE_STORM_SURGE_ADVISORY_1: FillLayer = {
  id: 'storm-surge-advisory-1',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.7jztv1ca',
  },
  'source-layer': 'Leyte_StormSurge_SSA1-98464r',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'HAZ'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 1,
  },
};

export const LEYTE_STORM_SURGE_ADVISORY_2: FillLayer = {
  id: 'storm-surge-advisory-2',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.851thu6i',
  },
  'source-layer': 'Leyte_StormSurge_SSA2-9w17a5',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'HAZ'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 1,
  },
};

export const LEYTE_STORM_SURGE_ADVISORY_3: FillLayer = {
  id: 'storm-surge-advisory-3',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.79hq7qp9',
  },
  'source-layer': 'Leyte_StormSurge_SSA3-b5acyy',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'HAZ'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 1,
  },
};

export const LEYTE_STORM_SURGE_ADVISORY_4: FillLayer = {
  id: 'storm-surge-advisory-4',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.2ojcvobn',
  },
  'source-layer': 'Leyte_StormSurge_SSA4-8nbdij',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'HAZ'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 1,
  },
};
