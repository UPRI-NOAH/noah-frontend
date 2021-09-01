import { SensorType } from '@features/noah-playground/services/sensor.service';

export const NOAH_COLORS = {
  'noah-red': {
    low: '#F2C94C',
    medium: '#F2994A',
    high: '#EB5757',
  },
  'noah-pink': {
    low: '#FDACB2',
    medium: '#FA5F96',
    high: '#C21D7D',
  },
  'noah-violet': {
    low: '#A9C6DE',
    medium: '#818ABC',
    high: '#804B9B',
  },
  'noah-blue': {
    low: '#B4D1E2',
    medium: '#5FA3CE',
    high: '#2B75B2',
  },
  'noah-green': {
    low: '#B7E392',
    medium: '#66BF71',
    high: '#1A994E',
  },
  'noah-black': {
    low: '#DADBDB',
    medium: '#8B8B8B',
    high: '#333333',
  },
};

export const NOAH_COLORS_ARRAY: NoahColor[] = [
  ...Object.keys(NOAH_COLORS).map((c) => c as NoahColor),
];
// To investigate why this works and direct `as const` doesn't
// const constNoahColors = [...NOAH_COLORS_ARRAY] as const;
// export type NoahColor = typeof constNoahColors[];

export type NoahColor =
  | 'noah-red'
  | 'noah-pink'
  | 'noah-violet'
  | 'noah-blue'
  | 'noah-green'
  | 'noah-black';

// SENSOR COLORS
export const SENSOR_COLORS: Record<SensorType, string> = {
  arg: '#3498DB',
  wlms: '#F64747',
  aws: '#00B16A',
  wlmsarg: '#e9d460',
};
