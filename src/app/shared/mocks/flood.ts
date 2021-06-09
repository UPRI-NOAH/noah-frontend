import { FillLayer, SymbolLayer } from 'mapbox-gl';

export const SAMPLE_SCHOOLS: SymbolLayer = {
  id: 'leyte-schools',
  type: 'symbol',
  source: {
    type: 'vector',
    tiles: [
      'http://localhost:8080/geoserver/gwc/service/wmts?' +
        'REQUEST=GetTile' +
        '&SERVICE=WMTS' +
        '&VERSION=1.0.0' +
        '&LAYER=noah-test-may2021:leyte_schools' +
        '&STYLE=' +
        '&TILEMATRIX=EPSG:900913:{z}' +
        '&TILEMATRIXSET=EPSG:900913' +
        '&FORMAT=application/vnd.mapbox-vector-tile' +
        '&TILECOL={x}&TILEROW={y}',
    ],
  },
  'source-layer': 'leyte_schools',
  layout: {
    'icon-image': 'custom-marker',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

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
