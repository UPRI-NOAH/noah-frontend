import { FillLayer } from 'mapbox-gl';

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
