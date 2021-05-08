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
    'fill-opacity': 0.9,
  },
};
