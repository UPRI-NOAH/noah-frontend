import { Injectable } from '@angular/core';
import {
  NoahPlaygroundStore,
  HazardType,
  FloodState,
  StormSurgeState,
  LandslideState,
  HazardLevel,
  ExaggerationState,
} from '../store/noah-playground.store';
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

  getHazardLevelOpacity(
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ): number {
    return this.store.state[hazardType].levels[hazardLevel].opacity;
  }

  getHazardLevelShown(
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ): boolean {
    return this.store.state[hazardType].levels[hazardLevel].shown;
  }

  setHazardLevelOpacity(
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

  setHazardTypeColor(
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

  setHazardTypeShown(
    hazardType: HazardType,
    hazardState: FloodState | LandslideState | StormSurgeState
  ) {
    this.store.patch(
      { [hazardType]: hazardState },
      `shown ${hazardState.shown}, ${hazardType}`
    );
  }

  setHazardLevelShown(
    shown: boolean,
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ) {
    const hazard: FloodState | LandslideState | StormSurgeState = {
      ...this.store.state[hazardType],
    };
    hazard.levels[hazardLevel].shown = shown;
    this.store.patch(
      { [hazardType]: hazard },
      `shown ${shown}, ${hazardType}, ${hazardLevel}`
    );
  }
}
