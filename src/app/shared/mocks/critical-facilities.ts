import { LngLatLike, SymbolLayer, VectorSource } from 'mapbox-gl';

export const CRITICAL_FACILITIES_ARR = [
  'police-station',
  'fire-station',
  'hospital',
  'school',
] as const;

export type SampleMarker = {
  coords: LngLatLike;
  name: string;
  type: 'police-station' | 'fire-station' | 'hospital' | 'school';
  address: string;
};

export const MARKERS: SampleMarker[] = [
  {
    coords: [124.936797, 10.740987],
    name: 'Javier Main Health Center',
    type: 'hospital',
    address: 'Javier, Leyte, Philippines',
  },
  {
    coords: [124.93585, 10.794783],
    name: 'Javier Rural Health Unit Birthing Home',
    type: 'hospital',
    address: 'Calzada Primary School, Leyte, Philippines',
  },
  {
    coords: [124.93628, 10.826807],
    name: 'Palale Barangay Health Station',
    type: 'hospital',
    address: 'La Paz Javier-Bito Road, MacArthur, Leyte, Philippines',
  },
  {
    coords: [124.997822, 10.834688],
    name: 'MacArthur  Rural Health Unit Birthing Home',
    type: 'hospital',
    address: 'MacArthur, Leyte, Philippines',
  },
  {
    coords: [124.998611, 10.837104],
    name: 'MacArthur Main Health Center',
    type: 'hospital',
    address: 'MacArthur, Leyte, Philippines',
  },
  {
    coords: [124.94062, 10.78755],
    name: 'Javier National High School',
    type: 'school',
    address: 'LaPaz-Javier-Bito Road, Javier,6511, Leyte, Philippines',
  },
  {
    coords: [124.99529, 10.77539],
    name: 'Batug Elementary School',
    type: 'school',
    address: 'Javier,6511, Leyte, Philippines',
  },
  {
    coords: [124.99862, 10.79262],
    name: 'Olmedo Elementary School',
    type: 'school',
    address: 'LaPaz-Javier-Bito Road, Javier,6511, Leyte, Philippines',
  },
  {
    coords: [124.93968, 10.82005],
    name: 'Palale National High School',
    type: 'school',
    address: 'MacArthur, Leyte, Philippines',
  },
  {
    coords: [124.98113, 10.80227],
    name: 'Villa Imelda Primary School',
    type: 'school',
    address: 'MacArthur, Leyte, Philippines',
  },
  {
    coords: [124.4339214, 10.8994501],
    name: 'PHILPHOS Fire Station',
    type: 'fire-station',
    address: 'Isabel, Leyte, Philippines',
  },
  {
    coords: [124.6056596, 11.012203],
    name: 'Central Fire Station',
    type: 'fire-station',
    address: 'Ormoc, Leyte, Philippines',
  },
  {
    coords: [125.0025857, 11.2502558],
    name: 'Tacloban Filipino-Chinese Volunteer Fire Brigade',
    type: 'fire-station',
    address: 'Tacloban, Leyte, Philippines',
  },
  {
    coords: [124.6856627, 11.3025933],
    name: 'Carigara Fire Station',
    type: 'fire-station',
    address: 'Carigara, Leyte, Philippines',
  },
  {
    coords: [124.7368741, 11.3260037],
    name: 'Barugo Fire Station',
    type: 'fire-station',
    address: 'Barugo, 6519 Leyte, Philippines',
  },
  {
    coords: [124.6087324, 11.0057326],
    name: 'Ormoc City Police Station 1',
    type: 'police-station',
    address: 'Ormoc, Leyte, Philippines',
  },
  {
    coords: [124.6554668, 11.0954793],
    name: '8th Regional Public Safety Battalion, Milagro Patrol Base',
    type: 'police-station',
    address: 'Ormoc, Leyte, Philippines',
  },
  {
    coords: [125.0132229, 10.7470688],
    name: 'Abuyog Police Station',
    type: 'police-station',
    address: 'Abuyog, Leyte, Philippines',
  },
  {
    coords: [124.7346851, 11.325105],
    name: 'Barugo Municipal Police Station',
    type: 'police-station',
    address: 'Barugo, Leyte, Philippines',
  },
  {
    coords: [124.3705735, 11.3075124],
    name: 'Tabango Police Station',
    type: 'police-station',
    address: 'Tabango, Leyte, Philippines',
  },
];

export const LEYTE_SCHOOLS: SymbolLayer = {
  id: 'leyte_schools',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7u49zi010o20nrjlynz9jo-5cez5',
  },
  'source-layer': 'leyte_schools',
  layout: {
    'icon-image': 'icon-school',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_HOSPITALS: SymbolLayer = {
  id: 'leyte_hospitals',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7ua4aq1yh328qncf078jpv-9xhtt',
  },
  'source-layer': 'leyte_hospitals',
  layout: {
    'icon-image': 'icon-hospital',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_FIRESTATIONS: SymbolLayer = {
  id: 'leyte_firestation',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7u97310bbw28lg0yxolcv2-1gmiz',
  },
  'source-layer': 'leyte_firestation',
  layout: {
    'icon-image': 'icon-firestation',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const LEYTE_POLICESTATIONS: SymbolLayer = {
  id: 'leyte_police',
  type: 'symbol',
  source: {
    type: 'vector',
    url: 'mapbox://jadurani.ckq7uatvk04kq21pqtks7rj3m-0n4tz',
  },
  'source-layer': 'leyte_police',
  layout: {
    'icon-image': 'icon-policestation',
    'text-anchor': 'top',
    'text-field': ['get', 'name'],
    'text-offset': [0, 2],
    'text-size': 10,
  },
};

export const CF_TILESET_NAMES = [
  LEYTE_SCHOOLS,
  LEYTE_HOSPITALS,
  LEYTE_FIRESTATIONS,
  LEYTE_FIRESTATIONS,
]
  .map((symbolLayer: SymbolLayer) => (symbolLayer.source as VectorSource).url)
  .join(',')
  .replace(/mapbox:\/\//g, '');

export type CriticalFacilityLayer =
  | 'leyte_schools'
  | 'leyte_hospitals'
  | 'leyte_firestation'
  | 'leyte_police';
