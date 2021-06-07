import { Injectable } from '@angular/core';
import {
  LEYTE_FLOOD_5,
  LEYTE_FLOOD_25,
  LEYTE_FLOOD_100,
} from '@shared/mocks/flood';
import {
  LEYTE_STORM_SURGE_ADVISORY_1,
  LEYTE_STORM_SURGE_ADVISORY_2,
  LEYTE_STORM_SURGE_ADVISORY_3,
  LEYTE_STORM_SURGE_ADVISORY_4,
} from '@shared/mocks/storm-surges';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FloodReturnPeriod,
  PlaygroundStore,
  StormSurgeAdvisory,
} from '../store/playground.store';

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

  get stormsurgeLayer$(): Observable<string> {
    return this.currentStormSurgeAdvisory$.pipe(
      map((stormsurgeAdvisory: StormSurgeAdvisory) => {
        switch (stormsurgeAdvisory) {
          case 'storm-surge-advisory-1':
            return LEYTE_STORM_SURGE_ADVISORY_1['source-layer'];
          case 'storm-surge-advisory-2':
            return LEYTE_STORM_SURGE_ADVISORY_2['source-layer'];
          case 'storm-surge-advisory-3':
            return LEYTE_STORM_SURGE_ADVISORY_3['source-layer'];
          case 'storm-surge-advisory-4':
            return LEYTE_STORM_SURGE_ADVISORY_4['source-layer'];
          default:
            return LEYTE_STORM_SURGE_ADVISORY_1['source-layer'];
        }
      })
    );
  }

  get currentFloodReturnPeriod$(): Observable<FloodReturnPeriod> {
    return this.playgroundStore.state$.pipe(
      map((state) => state.currentFloodReturnPeriod)
    );
  }

  get currentStormSurgeAdvisory$(): Observable<StormSurgeAdvisory> {
    return this.playgroundStore.state$.pipe(
      map((state) => state.currentStormSurgeAdvisory)
    );
  }

  get floodReturnPeriods(): FloodReturnPeriod[] {
    return [
      'flood-return-period-5',
      'flood-return-period-25',
      'flood-return-period-100',
    ];
  }

  get stormsurgeAdvisory(): StormSurgeAdvisory[] {
    return [
      'storm-surge-advisory-1',
      'storm-surge-advisory-2',
      'storm-surge-advisory-3',
      'storm-surge-advisory-4',
    ];
  }

  setCurrentFloodReturnPeriod(currentFloodReturnPeriod: FloodReturnPeriod) {
    this.playgroundStore.patch({ currentFloodReturnPeriod });
  }

  setCurrentStormSurgeAdvisory(currentStormSurgeAdvisory: StormSurgeAdvisory) {
    this.playgroundStore.patch({ currentStormSurgeAdvisory });
  }
}
