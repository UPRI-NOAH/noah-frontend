import { FillLayer } from 'mapbox-gl';

export const LEYTE_FLOOD: FillLayer = {
  id: 'flood',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.3tg2ae87',
  },
  'source-layer': 'Leyte_Flood_100year-15dhkm',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'Var'],
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

export const LEYTE_FLOOD_5: FillLayer = {
  id: 'flood-return-period-5',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.1b0wrydb',
  },
  'source-layer': 'Leyte_5year_Flood-atysck',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'Var'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 0.75,
  },
};

export const LEYTE_FLOOD_25: FillLayer = {
  id: 'flood-return-period-25',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.60qgk1hq',
  },
  'source-layer': 'Leyte_25year_Flood-cquuxm',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'Var'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 0.75,
  },
};

// This is a duplicate of LEYTE_FLOOD at the top of this file
// This is a workaround. We'll refactor this later on.
export const LEYTE_FLOOD_100: FillLayer = {
  id: 'flood-return-period-100',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.bqe1u0g0',
  },
  'source-layer': 'Leyte_Flood_100year-8l0x62',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'Var'],
      1,
      '#f2c94c',
      2,
      '#f2994a',
      3,
      '#eb5757',
    ],
    'fill-opacity': 0.75,
  },
};
