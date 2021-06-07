import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

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

type PlaygroundState = {
  currentFloodReturnPeriod: FloodReturnPeriod;
  currentStormSurgeAdvisory: StormSurgeAdvisory;
  currentLandslideHazards: LandslideHazards;
};

const createInitialValue = (): PlaygroundState => ({
  currentFloodReturnPeriod: 'flood-return-period-5',
  currentStormSurgeAdvisory: 'storm-surge-advisory-1',
  currentLandslideHazards: 'landslide-hazard',
});

@Injectable({
  providedIn: 'root',
})
export class PlaygroundStore extends StoreService<PlaygroundState> {
  store = 'playground-store';

  constructor() {
    super(createInitialValue());
  }
}
