import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';
import { NoahColor } from '@shared/mocks/noah-colors';
import { SensorType } from '../services/sensor.service';
import { QcSensorType } from '../services/iot.service';

/**
 * Official geographic center of the Philippines.
 * Located in the Mindoro Strait, 12 kilometers
 * NNE of Apo Island in Sablayan, Occidental Mindoro.
 */
export const PH_DEFAULT_CENTER = {
  lat: 12.768369,
  lng: 120.443461,
};

export const QC_DEFAULT_CENTER = {
  lat: 14.6492,
  lng: 121.0732,
};

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type QuezonCitySensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  | 'weather';

export type FloodReturnPeriod =
  | 'flood-return-period-5'
  | 'flood-return-period-25'
  | 'flood-return-period-100';

export type StormSurgeAdvisory =
  | 'storm-surge-advisory-1'
  | 'storm-surge-advisory-2'
  | 'storm-surge-advisory-3'
  | 'storm-surge-advisory-4';

export type LandslideHazards =
  | 'landslide-hazard'
  // | 'alluvial-fan-hazard'
  | 'debris-flow'
  | 'unstable-slopes-maps';

export type ContourMapType =
  | '1hr'
  | '3hr'
  | '6hr'
  | '12hr'
  | '24hr'
  | '24hr-lapse';

export const WEATHER_SATELLITE_ARR = ['himawari', 'himawari-GSMAP'] as const;

export type WeatherSatelliteType = typeof WEATHER_SATELLITE_ARR[number];

export type HazardLevel =
  | FloodReturnPeriod
  | StormSurgeAdvisory
  | LandslideHazards;

type HazardState = {
  shown: boolean;
  expanded: boolean;
};

export type FloodState = HazardState & {
  levels: Record<FloodReturnPeriod, HazardLevelState>;
};

export type LandslideState = HazardState & {
  levels: Record<LandslideHazards, HazardLevelState>;
};

export type StormSurgeState = HazardState & {
  levels: Record<StormSurgeAdvisory, HazardLevelState>;
};

export type ExaggerationState = {
  shown: boolean;
  expanded: boolean;
  level: number;
};

export type HazardLevelState = {
  opacity: number;
  color: NoahColor;
  shown: boolean;
};

export type CriticalFacilityTypeState = {
  shown: boolean;
  opacity: number;
};

export type CriticalFacilityTypesState = {
  'fire-station': CriticalFacilityTypeState;
  'police-station': CriticalFacilityTypeState;
  hospital: CriticalFacilityTypeState;
  school: CriticalFacilityTypeState;
};

export type CriticalFacilitiesState = {
  shown: boolean;
  expanded: boolean;
  types: CriticalFacilityTypesState;
};

export type VolcanoGroupState = {
  shown: boolean;
  expanded: boolean;
  types: Record<VolcanoType, VolcanoState>;
};

export type VolcanoType = 'active' | 'potentially-active' | 'inactive';

export type VolcanoState = {
  shown: boolean;
  opacity: number;
};

export type WeatherSatelliteState = {
  shown: boolean;
  expanded: boolean;
  selectedType: WeatherSatelliteType;
  types: WeatherSatelliteTypesState;
};

export type WeatherSatelliteTypeState = {
  opacity: number;
};

export type WeatherSatelliteTypesState = {
  himawari: WeatherSatelliteTypeState;
  'himawari-GSMAP': WeatherSatelliteTypeState;
};

export type SensorTypeState = {
  fetched: boolean;
  shown: boolean;
};

export type SensorsState = {
  shown: boolean;
  expanded: boolean;
  types: Record<SensorType, SensorTypeState>;
};

export type QuezonCitySensorTypeState = {
  fetched: boolean;
  shown: boolean;
};

export type QuezonCitySensorsState = {
  shown: boolean;
  expanded: boolean;
  types: Record<QcSensorType, QuezonCitySensorTypeState>;
};

type NoahPlaygroundState = {
  exaggeration: ExaggerationState;
  flood: FloodState;
  landslide: LandslideState;
  'storm-surge': StormSurgeState;
  volcanoes: VolcanoGroupState;
  criticalFacilities: CriticalFacilitiesState;
  weatherSatellite: WeatherSatelliteState;
  center: { lng: number; lat: number };
  currentLocation: string;
  sensors: SensorsState;
  qcSensors: QuezonCitySensorsState;
  contourMaps: {
    shown: boolean;
    expanded: boolean;
    selectedType: ContourMapType;
  };
};

const createInitialValue = (): NoahPlaygroundState => ({
  exaggeration: {
    shown: true,
    expanded: false,
    level: 1.8,
  },
  flood: {
    shown: true,
    expanded: false,
    levels: {
      'flood-return-period-5': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'flood-return-period-25': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'flood-return-period-100': {
        opacity: 85,
        color: 'noah-red',
        shown: true,
      },
    },
  },
  landslide: {
    shown: false,
    expanded: false,
    levels: {
      'landslide-hazard': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      // 'alluvial-fan-hazard': {
      //   opacity: 100,
      //   color: 'noah-red',
      //   shown: false,
      // },
      'debris-flow': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'unstable-slopes-maps': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
    },
  },
  'storm-surge': {
    shown: false,
    expanded: false,
    levels: {
      'storm-surge-advisory-1': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-2': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-3': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-4': {
        opacity: 85,
        color: 'noah-red',
        shown: false,
      },
    },
  },
  volcanoes: {
    shown: false,
    expanded: false,
    types: {
      active: {
        shown: true,
        opacity: 100,
      },
      'potentially-active': {
        shown: false,
        opacity: 100,
      },
      inactive: {
        shown: false,
        opacity: 100,
      },
    },
  },
  criticalFacilities: {
    shown: false,
    expanded: false,
    types: {
      'fire-station': {
        shown: false,
        opacity: 100,
      },
      'police-station': {
        shown: false,
        opacity: 100,
      },
      school: {
        shown: false,
        opacity: 100,
      },
      hospital: {
        shown: true,
        opacity: 100,
      },
    },
  },
  weatherSatellite: {
    shown: false,
    expanded: false,
    selectedType: 'himawari',
    types: {
      himawari: {
        opacity: 80,
      },
      'himawari-GSMAP': {
        opacity: 80,
      },
    },
  },
  center: null,
  currentLocation: '-----',
  sensors: {
    shown: false,
    expanded: false,
    types: {
      arg: {
        shown: true,
        fetched: false,
      },
      wlms: {
        shown: true,
        fetched: false,
      },
      aws: {
        shown: true,
        fetched: false,
      },
      wlmsarg: {
        shown: true,
        fetched: false,
      },
    },
  },
  qcSensors: {
    shown: false,
    expanded: false,
    types: {
      humidity: {
        shown: true,
        fetched: false,
      },
      pressure: {
        shown: true,
        fetched: false,
      },
      temperature: {
        shown: true,
        fetched: false,
      },
      weather: {
        shown: true,
        fetched: false,
      },
    },
  },
  contourMaps: {
    shown: false,
    expanded: false,
    selectedType: '1hr',
  },
});

@Injectable({
  providedIn: 'root',
})
export class NoahPlaygroundStore extends StoreService<NoahPlaygroundState> {
  store = 'noah-playground-store';

  constructor() {
    super(createInitialValue());
  }
}
