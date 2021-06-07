import { FillLayer, LineLayer } from 'mapbox-gl';

export const LEYTE_LANDSLIDE: FillLayer = {
  id: 'landslide',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.boxlw5qe',
  },
  'source-layer': 'Leyte_LandslideHazard-beq0xe',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'LH'],
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

export const LEYTE_PROVINCE_LANDSLIDE: FillLayer = {
  id: 'landslide-hazard',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.2q50d3tk',
  },
  'source-layer': 'Leyte_LandslideHazards-3fnfae',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'LH'],
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

export const LEYTE_PROVINCE_ALLUVIAL: LineLayer = {
  id: 'alluvial-fan-hazard',
  type: 'line',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.5z50jk2x',
  },
  'source-layer': 'Leyte_Merged_AFDF_1-4dfa9e',
  paint: {
    'line-color': ['interpolate', ['linear'], ['get', 'LH'], 4, '#000000'],
    'line-opacity': 1,
    'line-width': 2,
  },
};

export const LEYTE_PROVINCE_DEBRIS_FLOW: FillLayer = {
  id: 'debris-flow',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.5z50jk2x',
  },
  'source-layer': 'Leyte_Merged_AFDF_1-4dfa9e',
  paint: {
    'fill-color': ['interpolate', ['linear'], ['get', 'LH'], 3, '#eb5757'],
    'fill-opacity': 1,
  },
};

export const LEYTE_PROVINCE_UNSTABLE_SLOPES: FillLayer = {
  id: 'unstable-slopes-maps',
  type: 'fill',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.5z50jk2x', //temporary while waiting for url of unstable slopes
  },
  'source-layer': 'Leyte_Merged_AFDF_1-4dfa9e', //temporary source-layer for testing
  paint: {
    'fill-color': ['interpolate', ['linear'], ['get', 'LH'], 3, '#eb5757'],
    'fill-opacity': 1,
  },
};
