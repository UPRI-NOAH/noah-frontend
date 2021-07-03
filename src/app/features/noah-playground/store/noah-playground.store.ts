import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';
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
  | 'debris-flow'
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

type HazardLevelState = {
  opacity: number;
  color: NoahColor;
};

type NoahPlaygroundState = {
  // terrain: {
  //   shown: boolean,
  //   expanded: boolean,
  // },
  flood: FloodState;
};

const createInitialValue = (): NoahPlaygroundState => ({
  flood: {
    shown: true,
    expanded: true,
    levels: {
      'flood-return-period-5': {
        opacity: 100,
        color: 'noah-red',
      },
      'flood-return-period-25': {
        opacity: 100,
        color: 'noah-red',
      },
      'flood-return-period-100': {
        opacity: 100,
        color: 'noah-red',
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
