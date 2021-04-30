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
      'step',
      ['get', 'Var'],
      'hsl(50, 99%, 82%)',
      1,
      [
        'match',
        ['get', 'Var'],
        0,
        'hsla(0, 100%, 68%, 0.89)',
        'hsl(27, 100%, 51%)',
      ],
      3,
      ['match', ['get', 'Var'], [3], 'rgb(255, 0, 0)', '#000000'],
    ],
    'fill-opacity': 0.75,
  },
};
