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
    'fill-opacity': 0.9,
  },
};
