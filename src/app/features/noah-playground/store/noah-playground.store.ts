import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { NoahColor } from '@shared/mocks/noah-colors';

export const PH_DEFAULT_CENTER = {
  lat: 11.968179,
  lng: 121.918612,
};

export type HazardType = 'flood' | 'landslide' | 'storm-surge';

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
  | 'alluvial-fan-hazard'
  // | 'debris-flow'
  | 'unstable-slopes-maps';

export type CriticalFacilityLayer =
  | 'leyte_schools'
  | 'leyte_hospitals'
  | 'leyte_firestation'
  | 'leyte_police';

export type HazardLevel =
  | FloodReturnPeriod
  | StormSurgeAdvisory
  | LandslideHazards
  | CriticalFacilityLayer;

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

type NoahPlaygroundState = {
  exaggeration: ExaggerationState;
  flood: FloodState;
  landslide: LandslideState;
  'storm-surge': StormSurgeState;
  criticalFacilities: CriticalFacilitiesState;
};

const createInitialValue = (): NoahPlaygroundState => ({
  exaggeration: {
    shown: true,
    expanded: true,
    level: 1.8,
  },
  flood: {
    shown: true,
    expanded: true,
    levels: {
      'flood-return-period-5': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'flood-return-period-25': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'flood-return-period-100': {
        opacity: 100,
        color: 'noah-red',
        shown: true,
      },
    },
  },
  landslide: {
    shown: true,
    expanded: false,
    levels: {
      'landslide-hazard': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'alluvial-fan-hazard': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'unstable-slopes-maps': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
    },
  },
  'storm-surge': {
    shown: true,
    expanded: false,
    levels: {
      'storm-surge-advisory-1': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-2': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-3': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
      'storm-surge-advisory-4': {
        opacity: 100,
        color: 'noah-red',
        shown: false,
      },
    },
  },
  criticalFacilities: {
    shown: true,
    expanded: false,
    types: {
      'fire-station': {
        shown: true,
        opacity: 100,
      },
      'police-station': {
        shown: true,
        opacity: 100,
      },
      school: {
        shown: true,
        opacity: 100,
      },
      hospital: {
        shown: true,
        opacity: 100,
      },
    },
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
