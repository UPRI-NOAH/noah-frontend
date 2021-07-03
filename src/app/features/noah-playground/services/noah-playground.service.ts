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
import {
  LEYTE_PROVINCE_LANDSLIDE,
  LEYTE_PROVINCE_ALLUVIAL,
  LEYTE_PROVINCE_UNSTABLE_SLOPES,
} from '@shared/mocks/landslide';
import { from, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import {
  FloodReturnPeriod,
  NoahPlaygroundStore,
  StormSurgeAdvisory,
  LandslideHazards,
  HazardType,
  FloodState,
  StormSurgeState,
  LandslideState,
  HazardLevel,
  ExaggerationState,
} from '../store/noah-playground.store';
import { LngLatLike } from 'mapbox-gl';
import { NoahColor } from '@shared/mocks/noah-colors';

@Injectable({
  providedIn: 'root',
})
export class NoahPlaygroundService {
  constructor(private store: NoahPlaygroundStore) {}

  getHazardColor(hazardType: HazardType, hazardLevel: HazardLevel): NoahColor {
    return this.store.state[hazardType].levels[hazardLevel].color;
  }

  getExaggeration(): ExaggerationState {
    return this.store.state.exaggeration;
  }

  getHazard(
    hazardType: HazardType
  ): FloodState | StormSurgeState | LandslideState {
    return this.store.state[hazardType];
  }

  getHazardOpacity(hazardType: HazardType, hazardLevel: HazardLevel): number {
    return this.store.state[hazardType].levels[hazardLevel].opacity;
  }

  setHazardOpacity(
    opacity: number,
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ): void {
    const hazard: FloodState | LandslideState | StormSurgeState = {
      ...this.store.state[hazardType],
    };
    hazard.levels[hazardLevel].opacity = opacity;
    this.store.patch(
      { [hazardType]: hazard },
      `opacity ${opacity}, ${hazardType}, ${hazardLevel}`
    );
  }

  setHazardColor(
    color: NoahColor,
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ): void {
    const hazard: FloodState | LandslideState | StormSurgeState = {
      ...this.store.state[hazardType],
    };
    hazard.levels[hazardLevel].color = color;
    this.store.patch(
      { [hazardType]: hazard },
      `color ${color}, ${hazardType}, ${hazardLevel}`
    );
  }

  setExaggeration(exaggeration: ExaggerationState) {
    this.store.patch(
      { exaggeration },
      'updated 3D Terrain - Exaggeration level'
    );
  }

  setHazardExpansion(
    hazardType: HazardType,
    hazardState: FloodState | LandslideState | StormSurgeState
  ) {
    this.store.patch(
      { [hazardType]: hazardState },
      `expanded ${hazardState.expanded}, ${hazardType}`
    );
  }

  setHazardShown(
    hazardType: HazardType,
    hazardState: FloodState | LandslideState | StormSurgeState
  ) {
    this.store.patch(
      { [hazardType]: hazardState },
      `shown ${hazardState.shown}, ${hazardType}`
    );
  }
}
