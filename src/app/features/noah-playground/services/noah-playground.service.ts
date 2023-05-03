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
  ContourMapType,
  WeatherSatelliteState,
  WeatherSatelliteType,
  WeatherSatelliteTypeState,
  VolcanoGroupState,
  VolcanoType,
  VolcanoState,
  RiskAssessment,
  ExposureTypes,
  RiskGroupState,
  RiskGroupType,
  RiskState,
  RiskExposureType,
  RiskExposureTypeState,
  RiskExposureState,
} from '../store/noah-playground.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Observable, pipe } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { SENSORS, SensorService, SensorType } from './sensor.service';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { state } from '@angular/animations';
import { ExposureType, RiskAssessmentType } from './risk-assessment.service';

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

  get exposureShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.exposure.shown));
  }

  get volcanoGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.shown));
  }

  get volcanoGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.expanded));
  }

  get riskGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskState.shown));
  }

  get riskGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskState.expanded));
  }

  get sensorsGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.shown));
  }

  get sensorsGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.expanded));
  }

  get weatherSatellitesShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.weatherSatellite.shown));
  }

  get exposureTypeShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.exposure.shown));
  }

  get weatherSatellitesExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.expanded)
    );
  }

  get selectedWeatherSatellite$(): Observable<WeatherSatelliteType> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.selectedType)
    );
  }

  get selectRisk$(): Observable<RiskGroupType> {
    return this.store.state$.pipe(map((state) => state.riskState.selectedType));
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

  get selectedExposureType$(): Observable<ExposureTypes> {
    return this.store.state$.pipe(map((state) => state.exposure.selectedType));
  }

  get riskExposureShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskExposure.shown));
  }

  get riskExposureExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskExposure.expanded));
  }

  get selectedRiskExposure$(): Observable<RiskExposureType> {
    return this.store.state$.pipe(
      map((state) => state.riskExposure.selectedType)
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

  getVolcano$(volcanoType: VolcanoType): Observable<VolcanoState> {
    return this.store.state$.pipe(
      map((state) => state.volcanoes.types[volcanoType])
    );
  }

  getRisk$(riskType: RiskGroupType): Observable<RiskState> {
    return this.store.state$.pipe(
      map((state) => state.riskState.types[riskType])
    );
  }

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

  getExposureTypeShown$(exposureType: ExposureType): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.exposure.selectedType[exposureType].shown)
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

  toggleVolcanoGroupProperty(property: 'expanded' | 'shown') {
    const volcanoes: VolcanoGroupState = {
      ...this.store.state.volcanoes,
    };

    const currentValue = volcanoes[property];
    volcanoes[property] = !currentValue;
    this.store.patch({ volcanoes }, `Volcanoes ${property}, ${!currentValue}`);
  }

  toggleExposureGroupProperty(property: 'expanded' | 'shown') {
    const riskState: RiskGroupState = {
      ...this.store.state.riskState,
    };

    const currentValue = riskState[property];
    riskState[property] = !currentValue;
    this.store.patch({ riskState }, `Exposure ${property}, ${!currentValue}`);
  }

  setVolcanoSoloOpacity(value: number, type: VolcanoType) {
    const volcanoes: VolcanoGroupState = {
      ...this.store.state.volcanoes,
    };

    volcanoes.types[type].opacity = value;
    this.store.patch(
      { volcanoes },
      `Volcano - update ${type}'s opacity to ${value}`
    );
  }

  setVolcanoSoloShown(value: boolean, type: VolcanoType) {
    const volcanoes: VolcanoGroupState = {
      ...this.store.state.volcanoes,
    };

    volcanoes.types[type].shown = value;
    this.store.patch(
      { volcanoes },
      `Volcano - update ${type}'s shown to ${value}`
    );
  }

  setRiskSoloShown(value: boolean, type: RiskGroupType) {
    const riskState: RiskGroupState = {
      ...this.store.state.riskState,
    };

    riskState.types[type].shown = value;
    this.store.patch(
      { riskState },
      `riskState - update ${type}'s shown to ${value}`
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

  getWeatherSatellites(): WeatherSatelliteState {
    return this.store.state.weatherSatellite;
  }

  getWeatherSatellite(type: WeatherSatelliteType): WeatherSatelliteTypeState {
    return this.store.state.weatherSatellite.types[type];
  }

  getWeatherSatellite$(
    type: WeatherSatelliteType
  ): Observable<WeatherSatelliteTypeState> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.types[type])
    );
  }

  getRisks$(type: RiskExposureType): Observable<RiskExposureTypeState> {
    return this.store.state$.pipe(
      map((state) => state.riskExposure.types[type])
    );
  }

  getWeatherSatelliteOpacity(weatherType: WeatherSatelliteType): number {
    return this.store.state.weatherSatellite.types[weatherType].opacity;
  }

  setWeatherSatelliteOpacity(
    opacity: number,
    weatherType: WeatherSatelliteType
  ) {
    const weatherSatellite: WeatherSatelliteState = {
      ...this.store.state.weatherSatellite,
    };

    weatherSatellite.types[weatherType].opacity = opacity;
    this.store.patch(
      { weatherSatellite },
      `Weather Satellite - update ${weatherType}'s opacity to ${opacity}`
    );
  }

  selectWeatherSatelliteType(weatherType: WeatherSatelliteType): void {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
    };

    weatherSatellite.selectedType = weatherType;
    this.store.patch(
      { weatherSatellite },
      `Select Weather Satellite type: ${weatherType}`
    );
  }

  selectRiskType(exposureType: RiskGroupType): void {
    const riskState = {
      ...this.store.state.riskState,
    };

    riskState.selectedType = exposureType;
    this.store.patch({ riskState }, `Select Exposure Type: ${exposureType}`);
  }

  toggleWeatherSatelliteGroupVisibility(): void {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
    };

    weatherSatellite.shown = !weatherSatellite.shown;
    this.store.patch(
      { weatherSatellite },
      `toggle weather satellite visibility`
    );
  }

  toggleExposureTypeVisibility(): void {
    const exposure = {
      ...this.store.state.exposure,
    };

    exposure.shown = !exposure.shown;
    this.store.patch({ exposure }, `toggle exposure type visibility`);
  }

  toggleWeatherSatelliteGroupExpansion(): void {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
    };

    weatherSatellite.expanded = !weatherSatellite.expanded;
    this.store.patch(
      { weatherSatellite },
      `toggle weather satellite expansion`
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

  selectContourMapType(type: ContourMapType): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.selectedType = type;
    this.store.patch({ contourMaps }, `select contour map type: ${type}`);
  }

  selectExposureType(exposureType: ExposureTypes): void {
    const exposure = {
      ...this.store.state.exposure,
    };

    exposure.selectedType = exposureType;
    this.store.patch({ exposure }, `select exposure type: ${exposureType}`);
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

  getRiskExposures(): RiskExposureState {
    return this.store.state.riskExposure;
  }

  getRiskExposure(type: RiskExposureType): RiskExposureTypeState {
    return this.store.state.riskExposure.types[type];
  }

  getRiskExposure$(type: RiskExposureType): Observable<RiskExposureTypeState> {
    return this.store.state$.pipe(
      map((state) => state.riskExposure.types[type])
    );
  }

  getRiskExposureOpacity(exposureType: RiskExposureType): number {
    return this.store.state.riskExposure.types[exposureType].opacity;
  }

  toggleRiskExposureGroupVisibility(): void {
    const riskExposure = {
      ...this.store.state.riskExposure,
    };

    riskExposure.shown = !riskExposure.shown;
    this.store.patch({ riskExposure }, `toggle exposure visibility`);
  }

  toggleRiskExposureGroupExpanded(): void {
    const riskExposure = {
      ...this.store.state.riskExposure,
    };

    riskExposure.expanded = !riskExposure.expanded;
    this.store.patch({ riskExposure }, `toggle risk exposure expansion`);
  }

  selectRiskExposure(exposureTypes: RiskExposureType): void {
    const riskExposure = {
      ...this.store.state.riskExposure,
    };

    riskExposure.selectedType = exposureTypes;
    this.store.patch(
      { riskExposure },
      `Select Risk Exposure type: ${exposureTypes}`
    );
  }

  toggleAllRiskExposureVisibility(): void {
    const riskExposure = {
      ...this.store.state.riskExposure,
    };
    riskExposure.shown = !riskExposure.shown;
    this.store.patch({ riskExposure }, `Hide All Risk Exposure`);
  }
}
