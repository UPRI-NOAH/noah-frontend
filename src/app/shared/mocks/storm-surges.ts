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
    'fill-opacity': 0.9,
  },
};
