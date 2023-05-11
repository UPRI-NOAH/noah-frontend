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
} from '../store/noah-playground.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Observable, pipe } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { SENSORS, SensorService, SensorType } from './sensor.service';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { state } from '@angular/animations';
import {
  ExposureType,
  RiskAssessmentType,
} from './risk-assessment-services.service';

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

  get riskAssessmentShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskAssessment.shown));
  }

  get exposureShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.exposure.shown));
  }

  get riskAssessmentExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.expanded)
    );
  }

  get volcanoGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.shown));
  }

  get volcanoGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.expanded));
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

  get selectedExposureType$(): Observable<ExposureType> {
    return this.store.state$.pipe(map((state) => state.exposure.selectedType));
  }

  getHazardData(): Promise<{ url: string; sourceLayer: string[] }[]> {
    return this.http
      .get<{ url: string; sourceLayer: string[] }[]>(
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/hazards/ph_combined_tileset.json'
      )
      .pipe(first())
      .toPromise();
  }

  getRiskData(): Promise<{ url: string; sourceLayer: string[] }[]> {
    return this.http
      .get<{ url: string; sourceLayer: string[] }[]>(
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/exposure/population/PH060400000_FB_Pop.json'
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

  getRiskAssessmentTypeShown$(
    riskAssessmentType: RiskAssessment
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.types[riskAssessmentType].shown)
    );
  }

  getExposureTypeShown$(exposureType: ExposureType): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.exposure.selectedType[exposureType].shown)
    );
  }

  getRiskAssessmentTypesFetched$(
    riskAssessmentType: RiskAssessmentType
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.types[riskAssessmentType].fetched)
    );
  }

  getExposureTypesFetched$(exposureType: ExposureType): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.exposure.selectedType[exposureType].fetched)
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

  setCenter(center: { lat: number; lng: number }) {
    this.store.patch({ center });
  }

  setCurrentLocation(currentLocation: string): void {
    this.store.patch({ currentLocation }, 'update current location');
    this.gaService.event('change_location', 'noah_studio');
  }

  toggleRiskAssessmentExpanded(): void {
    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };

    const { expanded } = riskAssessment;
    riskAssessment.expanded = !expanded;

    this.store.patch(
      { riskAssessment },
      `update risk assessment group state expanded to ${!expanded}`
    );
  }

  toggleRiskAssessmentGroupShown(): void {
    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };

    const { shown } = riskAssessment;
    riskAssessment.shown = !shown;

    this.store.patch(
      { riskAssessment },
      `update risk assessment group state shown to ${!shown}`
    );
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

  setRiskAssessmentTypeShown(type: RiskAssessment): void {
    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };

    const { shown } = riskAssessment.types[type];
    riskAssessment.types[type].shown = !shown;
    this.store.patch(
      { riskAssessment },
      `change risk assessment ${type} 'visibility to ${!shown}`
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

  selectExposureType(type: ExposureType): void {
    const exposure = {
      ...this.store.state.exposure,
    };

    exposure.selectedType = type;
    this.store.patch({ exposure }, `select exposure type: ${type}`);
  }

  toggleContourMapGroupVisibility(): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.shown = !contourMaps.shown;
    this.store.patch({ contourMaps }, `toggle visibility`);
  }

  toggleRiskAssessmentVisibility(): void {
    const exposure = {
      ...this.store.state.exposure,
    };

    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };

    exposure.shown = !exposure.shown;
    riskAssessment.shown = !riskAssessment.shown;
    this.store.patch({ exposure, riskAssessment }, `toggle visibility`);
  }

  toggleContourMapGroupExpansion(): void {
    const contourMaps = {
      ...this.store.state.contourMaps,
    };

    contourMaps.expanded = !contourMaps.expanded;
    this.store.patch({ contourMaps }, `toggle expansion`);
  }
}
