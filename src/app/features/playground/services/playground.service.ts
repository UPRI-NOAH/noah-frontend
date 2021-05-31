import { Injectable } from '@angular/core';
import {
  LEYTE_FLOOD_5,
  LEYTE_FLOOD_25,
  LEYTE_FLOOD_100,
} from '@shared/mocks/flood';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FloodReturnPeriod, PlaygroundStore } from '../store/playground.store';

@Injectable({
  providedIn: 'root',
})
export class PlaygroundService {
  constructor(private playgroundStore: PlaygroundStore) {}

  get floodLayer$(): Observable<string> {
    return this.currentFloodReturnPeriod$.pipe(
      map((returnPeriod: FloodReturnPeriod) => {
        switch (returnPeriod) {
          case 'flood-return-period-5':
            return LEYTE_FLOOD_5['source-layer'];
          case 'flood-return-period-25':
            return LEYTE_FLOOD_25['source-layer'];
          case 'flood-return-period-100':
            return LEYTE_FLOOD_100['source-layer'];
          default:
            return LEYTE_FLOOD_5['source-layer'];
        }
      })
    );
  }

  get currentFloodReturnPeriod$(): Observable<FloodReturnPeriod> {
    return this.playgroundStore.state$.pipe(
      map((state) => state.currentFloodReturnPeriod)
    );
  }

  get floodReturnPeriods(): FloodReturnPeriod[] {
    return [
      'flood-return-period-5',
      'flood-return-period-25',
      'flood-return-period-100',
    ];
  }

  setCurrentFloodReturnPeriod(currentFloodReturnPeriod: FloodReturnPeriod) {
    this.playgroundStore.patch({ currentFloodReturnPeriod });
  }
}
