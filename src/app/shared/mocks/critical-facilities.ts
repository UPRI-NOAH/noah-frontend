import { LngLatLike } from 'mapbox-gl';

export type SampleMarker = {
  coords: LngLatLike;
  name: string;
  type: 'police-station' | 'fire-station' | 'hospital' | 'school';
  address: string;
};

export const MARKERS: SampleMarker[] = [
  // {
  //   coords: [121.07664612988394, 14.610013585323642],
  //   name: 'Eastwood City Police and Fire Station',
  //   type: 'police-station',
  //   address:
  //     'Eulogio Rodriguez Jr. Ave, Bagumbayan, Quezon City, 1110 Metro Manila',
  // },
  // {
  //   coords: [121.09744726780325, 14.632973853877834],
  //   name: 'Central Fire Station',
  //   type: 'fire-station',
  //   address: 'Quezon City, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.08302734674311, 14.631075599651368],
  //   name: 'Riverbanks Police Station',
  //   type: 'police-station',
  //   address: 'Marikina, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.0864171434955, 14.617456571847612],
  //   name: 'Santolan Fire Station',
  //   type: 'fire-station',
  //   address: 'F. Pasco Ave, Pasig, 1610 Metro Manila',
  // },
  // {
  //   coords: [121.09555485648012, 14.633571141425632],
  //   name: 'Police Station 3 (Sta. Elena)',
  //   type: 'police-station',
  //   address: '303 J. P. Rizal St, Marikina, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.09632049252338, 14.620712168243758],
  //   name: 'Salve Regina General Hospital, Inc.',
  //   type: 'hospital',
  //   address: 'Marikina-Infanta Hwy, Pasig, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.10301528595681, 14.625113843893491],
  //   name: 'St. Anthony Medical Center',
  //   type: 'hospital',
  //   address: '32 Santa Ana, Ext, Marikina, 1801 Metro Manila',
  // },
  // {
  //   coords: [121.09958205855504, 14.637653983067825],
  //   name: 'VT Maternity Hospital',
  //   type: 'hospital',
  //   address: '22 Guerilla St. Toyota Ave, Marikina, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.08610664100308, 14.633833884115665],
  //   name: 'Sta. Monica Hospital',
  //   type: 'hospital',
  //   address: '138 A A. Bonifacio Ave, Marikina, 1800 Metro Manila',
  // },
  // {
  //   coords: [121.08387504319194, 14.627688367998127],
  //   name: 'The Medical City',
  //   type: 'hospital',
  //   address: 'SM Marikina, Marikina-Infanta Hwy, Marikina, 1801 Metro Manila',
  // },
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
