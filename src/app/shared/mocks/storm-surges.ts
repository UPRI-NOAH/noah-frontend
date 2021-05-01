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
      'step',
      ['get', 'HAZ'],
      'hsl(50, 99%, 82%)',
      1,
      [
        'match',
        ['get', 'HAZ'],
        0,
        'hsla(0, 100%, 68%, 0.89)',
        'hsl(27, 100%, 51%)',
      ],
      3,
      ['match', ['get', 'HAZ'], [3], 'rgb(255, 0, 0)', '#000000'],
    ],
    'fill-opacity': 0.75,
  },
};
