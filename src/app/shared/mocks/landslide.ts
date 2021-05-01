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
      'step',
      ['get', 'LH'],
      'hsl(50, 99%, 82%)',
      1,
      [
        'match',
        ['get', 'LH'],
        0,
        'hsla(0, 100%, 68%, 0.89)',
        'hsl(27, 100%, 51%)',
      ],
      3,
      ['match', ['get', 'LH'], [3], 'rgb(255, 0, 0)', '#000000'],
    ],
    'fill-opacity': 0.75,
  },
};
