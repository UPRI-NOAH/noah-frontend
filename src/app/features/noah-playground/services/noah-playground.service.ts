import { Injectable } from '@angular/core';
import {
  NoahPlaygroundStore,
  HazardType,
  FloodState,
  StormSurgeState,
  LandslideState,
  HazardLevel,
  ExaggerationState,
  HazardLevelState,
  CriticalFacilitiesState,
  CriticalFacilityTypeState,
  WeatherState,
  ContourMapType,
} from '../store/noah-playground.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Observable, pipe } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { SENSORS, SensorService, SensorType } from './sensor.service';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Injectable({
  providedIn: 'root',
})
export class NoahPlaygroundService {
  get exagerration$(): Observable<ExaggerationState> {
    return this.store.state$.pipe(map((state) => state.exaggeration));
  }

  constructor(
    private gaService: GoogleAnalyticsService,
    private http: HttpClient,
    private sensorService: SensorService,
    private store: NoahPlaygroundStore
  ) {}

  get center$(): Observable<{ lng: number; lat: number }> {
    return this.store.state$.pipe(map((state) => state.center));
  }

  get currentLocation$(): Observable<string> {
    return this.store.state$.pipe(map((state) => state.currentLocation));
  }

  get criticalFacilitiesShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.criticalFacilities.shown)
    );
  }

  get sensorsGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.shown));
  }

  get sensorsGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.expanded));
  }

  get weather$(): Observable<WeatherState> {
    return this.store.state$.pipe(map((state) => state.weather));
  }

  get contourMapGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.contourMaps.expanded));
  }

  get contourMapGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.contourMaps.shown));
  }

  get selectedContourMap$(): Observable<ContourMapType> {
    return this.store.state$.pipe(
      map((state) => state.contourMaps.selectedType)
    );
  }

  getHazardData(): Promise<{ url: string; sourceLayer: string[] }[]> {
    return this.http
      .get<{ url: string; sourceLayer: string[] }[]>(
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/hazards/ph_combined_tileset.json'
      )
      .pipe(first())
      .toPromise();
  }

  getCriticalFacilities(): CriticalFacilitiesState {
    return this.store.state.criticalFacilities;
  }

  getCriticalFacility(type: CriticalFacility): CriticalFacilityTypeState {
    return this.store.state.criticalFacilities.types[type];
  }

  getCriticalFacility$(
    type: CriticalFacility
  ): Observable<CriticalFacilityTypeState> {
    return this.store.state$.pipe(
      map((state) => state.criticalFacilities.types[type])
    );
  }

  getHazardColor(hazardType: HazardType, hazardLevel: HazardLevel): NoahColor {
    return this.store.state[hazardType].levels[hazardLevel].color;
  }

  getExaggeration(): ExaggerationState {
    return this.store.state.exaggeration;
  }

  getWeather(): WeatherState {
    return this.store.state.weather;
  }

  getHazard(
    hazardType: HazardType
  ): FloodState | StormSurgeState | LandslideState {
    return this.store.state[hazardType];
  }

  getHazard$(
    hazardType: HazardType
  ): Observable<FloodState | StormSurgeState | LandslideState> {
    return this.store.state$.pipe(map((state) => state[hazardType]));
  }

  getHazardLevel$(
    hazardType: HazardType,
    hazardLevel: HazardLevel
  ): Observable<HazardLevelState> {
    return this.store.state$.pipe(
      map((state) => state[hazardType].levels[hazardLevel])
    );
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

  getSensorTypeShown$(sensorType: SensorType): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.sensors.types[sensorType].shown)
    );
  }

  getSensorTypeFetched$(sensorType: SensorType): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.sensors.types[sensorType].fetched)
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
      { [hazardType]: { ...hazardState } },
      `expanded ${hazardState.expanded}, ${hazardType}`
    );
  }

  setHazardTypeShown(
    hazardType: HazardType,
    hazardState: FloodState | LandslideState | StormSurgeState
  ) {
    this.store.patch(
      { [hazardType]: { ...hazardState } },
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

  setCriticalFacilitiesProperty(
    value: boolean,
    property: 'expanded' | 'shown'
  ) {
    const criticalFacilities: CriticalFacilitiesState = {
      ...this.store.state.criticalFacilities,
    };

    criticalFacilities[property] = value;
    this.store.patch(
      { criticalFacilities },
      `CriticalFacility ${property}, ${value}`
    );
  }

  setCriticalFacilityOpacity(value: number, type: CriticalFacility) {
    const criticalFacilities: CriticalFacilitiesState = {
      ...this.store.state.criticalFacilities,
    };

    criticalFacilities.types[type].opacity = value;
    this.store.patch(
      { criticalFacilities },
      `CriticalFacility - update ${type}'s opacity to ${value}`
    );
  }

  setCriticalFacilityShown(value: boolean, type: CriticalFacility) {
    const criticalFacilities: CriticalFacilitiesState = {
      ...this.store.state.criticalFacilities,
    };

    criticalFacilities.types[type].shown = value;
    this.store.patch(
      { criticalFacilities },
      `CriticalFacility - update ${type}'s shown to ${value}`
    );
  }

  setCenter(center: { lat: number; lng: number }) {
    this.store.patch({ center });
  }

  setCurrentLocation(currentLocation: string): void {
    this.store.patch({ currentLocation }, 'update current location');
    this.gaService.event('change_location', 'noah_studio');
  }

  toggleSensorsGroupExpanded(): void {
    const sensors = {
      ...this.store.state.sensors,
    };

    const { expanded } = sensors;
    sensors.expanded = !expanded;

    this.store.patch(
      { sensors },
      `update sensor group state expanded to ${!expanded}`
    );
  }

  toggleSensorsGroupShown(): void {
    const sensors = {
      ...this.store.state.sensors,
    };

    const { shown } = sensors;
    sensors.shown = !shown;

    this.store.patch(
      { sensors },
      `update sensor group state shown to ${!shown}`
    );
  }

  setSensorTypeShown(sensorType: SensorType): void {
    const sensors = {
      ...this.store.state.sensors,
    };

    const { shown } = sensors.types[sensorType];
    sensors.types[sensorType].shown = !shown;
    this.store.patch(
      { sensors },
      `change sensor ${sensorType}'visibility to ${!shown}`
    );
  }

  setSensorTypeFetched(sensorType: SensorType, fetched = true): void {
    const sensors = {
      ...this.store.state.sensors,
    };

    sensors.types[sensorType].fetched = fetched;
    this.store.patch(
      { sensors },
      `change sensor's fetched status ${sensorType}' to ${!fetched}`
    );
  }

  setWeather(weather: WeatherState) {
    this.store.patch({ weather }, 'updated weather state');
  }

  selectContourMapType(type: ContourMapType): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.selectedType = type;
    this.store.patch({ contourMaps }, `select contour map type: ${type}`);
  }

  toggleContourMapGroupVisibility(): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.shown = !contourMaps.shown;
    this.store.patch({ contourMaps }, `toggle visibility`);
  }

  toggleContourMapGroupExpansion(): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.expanded = !contourMaps.expanded;
    this.store.patch({ contourMaps }, `toggle expansion`);
  }
}
