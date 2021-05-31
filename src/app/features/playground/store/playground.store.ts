import { Injectable } from '@angular/core';
import { StoreService } from '@core/services/store-service.service';

export type FloodReturnPeriod =
  | 'flood-return-period-5'
  | 'flood-return-period-25'
  | 'flood-return-period-100';

type PlaygroundState = {
  currentFloodReturnPeriod: FloodReturnPeriod;
};

const createInitialValue = (): PlaygroundState => ({
  currentFloodReturnPeriod: 'flood-return-period-5',
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
