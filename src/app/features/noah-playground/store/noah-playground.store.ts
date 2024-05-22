import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';
import { NoahColor } from '@shared/mocks/noah-colors';
import { SensorType } from '../services/sensor.service';

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
  lat: 14.676,
  lng: 121.0437,
};

export const LAGUNA_DEFAULT_CENTER = {
  lat: 14.26084,
  lng: 121.38849,
};

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

export type QuezonCitySensorType = 'rain' | 'flood';

export type QuezonCityCriticalFacilities = 'qc-critical-facilities';

export type QuezonCityMunicipalBoundary = 'qc-municipal-boundary';

export type BarangayBoundary = 'brgy-boundary';

export type RiskAssessmentRainType = 'rain-forecast';

export type RiskAssessmentExposureType = 'population';

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

export type ContourMapType = '1hr' | '3hr' | '6hr' | '12hr' | '24hr';

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

export type IotMunicipalityTypeState = {
  shown: boolean;
};

export type IotMunicipalitiesState = {
  shown: boolean;
};

export type RiskAssessmentState = {
  shown: boolean;
  opacity: number;
};

export type CalculateRiskButton = {
  shown: boolean;
};

export type RiskAssessmentGroupState = {
  shown: boolean;
  expanded: boolean;
  raintypes: Record<RiskAssessmentRainType, RiskAssessmentState>;
  exposuretypes: RiskAssessmentState;
  populationtypes: Record<RiskAssessmentExposureType, RiskAssessmentState>;
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

export type LagunaState = {
  shown: boolean;
};

export type QuezonCityZoomState = {
  shown: boolean;
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

export type QuezonCityCriticalFacilitiesTypeState = {
  shown: boolean;
};

export type QuezonCityCriticalFacilitiesTypesState = {
  'qc-critical-facilities': QuezonCityCriticalFacilitiesTypeState;
};

export type QuezonCityCriticalFacilitiesState = {
  qcshown: boolean;
  qcexpanded: boolean;
  types: QuezonCityCriticalFacilitiesTypesState;
};

export type QuezonCityMunicipalBoundaryTypeState = {
  shown: boolean;
};

export type QuezonCityMunicipalBoundaryTypesState = {
  'qc-municipal-boundary': QuezonCityMunicipalBoundaryTypeState;
};

export type QuezonCityMunicipalBoundaryState = {
  qcbshown: boolean;
  qcbexpanded: boolean;
  types: QuezonCityMunicipalBoundaryTypesState;
};

export type BarangayBoundaryTypeState = {
  shown: boolean;
};

export type BarangayBoundaryTypesState = {
  'brgy-boundary': BarangayBoundaryTypeState;
};

export type BarangayBoundaryState = {
  brgyShown: boolean;
  brgyExpanded: boolean;
  types: BarangayBoundaryTypesState;
};

export type QuezonCitySensorsState = {
  shown: boolean;
  expanded: boolean;
  types: Record<QuezonCitySensorType, QuezonCitySensorTypeState>;
};

export type BoundariesType = 'barangay' | 'municipal' | 'provincial';

export type BoundariesGroupState = {
  shown: boolean;
  expanded: boolean;
  types: Record<BoundariesType, BoundariesState>;
};

export type BoundariesState = {
  shown: boolean;
  opacity: number;
};

type NoahPlaygroundState = {
  exaggeration: ExaggerationState;
  flood: FloodState;
  landslide: LandslideState;
  'storm-surge': StormSurgeState;
  volcanoes: VolcanoGroupState;
  riskAssessment: RiskAssessmentGroupState;
  criticalFacilities: CriticalFacilitiesState;
  weatherSatellite: WeatherSatelliteState;
  center: { lng: number; lat: number };
  qcCenter: { lng: number; lat: number };
  btnCalculateRisk: CalculateRiskButton;
  qcZoom: { lng: number; lat: number };
  currentLocation: string;
  sensors: SensorsState;
  qcSensors: QuezonCitySensorsState;
  lagunaCenter: LagunaState;
  qcZoomCenter: QuezonCityZoomState;
  qcCriticalfacilities: QuezonCityCriticalFacilitiesState;
  qcMunicipalboundary: QuezonCityMunicipalBoundaryState;
  barangayBoundary: BarangayBoundaryState;
  contourMaps: {
    shown: boolean;
    expanded: boolean;
    selectedType: ContourMapType;
  };
  iotMunicipalities: IotMunicipalitiesState;
  boundaries: BoundariesGroupState;
};

const createInitialValue = (): NoahPlaygroundState => ({
  btnCalculateRisk: {
    shown: false,
  },
  exaggeration: {
    shown: true,
    expanded: false,
    level: 1.8,
  },
  qcZoom: QC_DEFAULT_CENTER,
  qcZoomCenter: {
    shown: false,
  },
  lagunaCenter: {
    shown: false,
  },
  flood: {
    shown: false,
    expanded: false,
    levels: {
      'flood-return-period-5': {
        opacity: 85,
        color: 'noah-blue',
        shown: false,
      },
      'flood-return-period-25': {
        opacity: 85,
        color: 'noah-blue',
        shown: false,
      },
      'flood-return-period-100': {
        opacity: 85,
        color: 'noah-blue',
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
        color: 'noah-green',
        shown: true,
      },
      // 'alluvial-fan-hazard': {
      //   opacity: 100,
      //   color: 'noah-red',
      //   shown: false,
      // },
      'debris-flow': {
        opacity: 85,
        color: 'noah-violet',
        shown: false,
      },
      'unstable-slopes-maps': {
        opacity: 85,
        color: 'noah-green',
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
        shown: true,
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
  riskAssessment: {
    shown: false,
    expanded: false,
    raintypes: {
      'rain-forecast': {
        shown: true,
        opacity: 80,
      },
    },
    exposuretypes: {
      shown: false,
      opacity: 80,
    },
    populationtypes: {
      population: {
        shown: false,
        opacity: 80,
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
  iotMunicipalities: {
    shown: false,
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
  boundaries: {
    shown: false,
    expanded: false,
    types: {
      barangay: {
        shown: true,
        opacity: 80,
      },
      municipal: {
        shown: false,
        opacity: 80,
      },
      provincial: {
        shown: false,
        opacity: 80,
      },
    },
  },
  center: null,
  qcCenter: QC_DEFAULT_CENTER,
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
      rain: {
        shown: true,
        fetched: false,
      },
      flood: {
        shown: true,
        fetched: false,
      },
    },
  },
  qcCriticalfacilities: {
    qcshown: false,
    qcexpanded: false,
    types: {
      'qc-critical-facilities': {
        shown: true,
      },
    },
  },
  qcMunicipalboundary: {
    qcbshown: false,
    qcbexpanded: false,
    types: {
      'qc-municipal-boundary': {
        shown: true,
      },
    },
  },
  barangayBoundary: {
    brgyShown: false,
    brgyExpanded: false,
    types: {
      'brgy-boundary': {
        shown: true,
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
