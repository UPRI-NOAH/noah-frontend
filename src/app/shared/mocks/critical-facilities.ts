import { LngLatLike } from 'mapbox-gl';

export type SampleMarker = {
  coords: LngLatLike;
  name: string;
  type: 'police-station' | 'fire-station' | 'hospital' | 'school';
  address: string;
};

export const MARKERS: SampleMarker[] = [
  {
    coords: [121.07664612988394, 14.610013585323642],
    name: 'Eastwood City Police and Fire Station',
    type: 'police-station',
    address:
      'Eulogio Rodriguez Jr. Ave, Bagumbayan, Quezon City, 1110 Metro Manila',
  },
  {
    coords: [121.09744726780325, 14.632973853877834],
    name: 'Central Fire Station',
    type: 'fire-station',
    address: 'Quezon City, 1800 Metro Manila',
  },
  {
    coords: [121.08302734674311, 14.631075599651368],
    name: 'Riverbanks Police Station',
    type: 'police-station',
    address: 'Marikina, 1800 Metro Manila',
  },
  {
    coords: [121.0864171434955, 14.617456571847612],
    name: 'Santolan Fire Station',
    type: 'fire-station',
    address: 'F. Pasco Ave, Pasig, 1610 Metro Manila',
  },
  {
    coords: [121.09555485648012, 14.633571141425632],
    name: 'Police Station 3 (Sta. Elena)',
    type: 'police-station',
    address: '303 J. P. Rizal St, Marikina, 1800 Metro Manila',
  },
  {
    coords: [121.09632049252338, 14.620712168243758],
    name: 'Salve Regina General Hospital, Inc.',
    type: 'hospital',
    address: 'Marikina-Infanta Hwy, Pasig, 1800 Metro Manila',
  },
  {
    coords: [121.10301528595681, 14.625113843893491],
    name: 'St. Anthony Medical Center',
    type: 'hospital',
    address: '32 Santa Ana, Ext, Marikina, 1801 Metro Manila',
  },
  {
    coords: [121.09958205855504, 14.637653983067825],
    name: 'VT Maternity Hospital',
    type: 'hospital',
    address: '22 Guerilla St. Toyota Ave, Marikina, 1800 Metro Manila',
  },
  {
    coords: [121.08610664100308, 14.633833884115665],
    name: 'Sta. Monica Hospital',
    type: 'hospital',
    address: '138 A A. Bonifacio Ave, Marikina, 1800 Metro Manila',
  },
  {
    coords: [121.08387504319194, 14.627688367998127],
    name: 'The Medical City',
    type: 'hospital',
    address: 'SM Marikina, Marikina-Infanta Hwy, Marikina, 1801 Metro Manila',
  },
];
