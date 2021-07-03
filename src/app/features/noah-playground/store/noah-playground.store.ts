import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

export const PH_DEFAULT_CENTER = {
  lat: 11.968179,
  lng: 121.918612,
};

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

type NoahPlaygroundState = {
  currentFloodReturnPeriod: FloodReturnPeriod;
  currentStormSurgeAdvisory: StormSurgeAdvisory;
  currentLandslideHazards: LandslideHazards;
  currentCriticalFacilityLayer: CriticalFacilityLayer;
  currentLocationPg: string;
  center: { lng: number; lat: number };
};

const createInitialValue = (): NoahPlaygroundState => ({
  currentFloodReturnPeriod: 'flood-return-period-5',
  currentStormSurgeAdvisory: 'storm-surge-advisory-1',
  currentLandslideHazards: 'landslide-hazard',
  currentCriticalFacilityLayer: 'leyte_schools',
  currentLocationPg: '-------',
  center: PH_DEFAULT_CENTER,
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
