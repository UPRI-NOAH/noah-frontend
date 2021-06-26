import { FillLayer } from 'mapbox-gl';

export const LEYTE_FLOOD: FillLayer = {
  id: 'flood',
  type: 'fill',
  source: {
    type: 'vector',
    tiles: [
      'http://202.90.159.72:8080/geoserver/gwc/service/wmts?' +
        'REQUEST=GetTile' +
        '&SERVICE=WMTS' +
        '&VERSION=1.0.0' +
        '&LAYER=noah_postgis:leyte_100year_flood' +
        '&STYLE=' +
        '&TILEMATRIX=EPSG:900913:{z}' +
        '&TILEMATRIXSET=EPSG:900913' +
        '&FORMAT=application/vnd.mapbox-vector-tile' +
        '&TILECOL={x}&TILEROW={y}',
    ],
  },
  'source-layer': 'leyte_100year_flood',
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
    tiles: [
      'http://202.90.159.72:8080/geoserver/gwc/service/wmts?' +
        'REQUEST=GetTile' +
        '&SERVICE=WMTS' +
        '&VERSION=1.0.0' +
        '&LAYER=noah_postgis:leyte_5year_flood' +
        '&STYLE=' +
        '&TILEMATRIX=EPSG:900913:{z}' +
        '&TILEMATRIXSET=EPSG:900913' +
        '&FORMAT=application/vnd.mapbox-vector-tile' +
        '&TILECOL={x}&TILEROW={y}',
    ],
  },
  'source-layer': 'leyte_5year_flood',
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
