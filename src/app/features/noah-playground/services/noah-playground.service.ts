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
  QuezonCitySensorType,
  QuezonCityCriticalFacilitiesState,
  QuezonCityCriticalFacilities,
  QuezonCityMunicipalBoundaryState,
  QuezonCityMunicipalBoundary,
  BarangayBoundary,
  BarangayBoundaryState,
  RiskAssessmentRainType,
  RiskAssessmentExposureType,
  RiskAssessmentState,
  RiskAssessmentGroupState,
  CalculateRiskButton,
  SeismicSensorState,
  SeismicSensorType,
} from '../store/noah-playground.store';
import { NoahColor } from '@shared/mocks/noah-colors';
import { Observable, pipe } from 'rxjs';
import { first, map, shareReplay } from 'rxjs/operators';
import { CriticalFacility } from '@shared/mocks/critical-facilities';
import { SENSORS, SensorService, SensorType } from './sensor.service';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { state } from '@angular/animations';

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

  get iotMunicipalitiesShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.iotMunicipalities.shown)
    );
  }

  get volcanoGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.shown));
  }

  get volcanoGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.volcanoes.expanded));
  }

  get riskAssessmentGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.riskAssessment.shown));
  }

  get riskAssessmentGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.expanded)
    );
  }

  get sensorsGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.shown));
  }

  get sensorsGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.sensors.expanded));
  }

  get qcSensorsGroupShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.qcSensors.shown));
  }

  get qcSensorsGroupExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.qcSensors.expanded));
  }

  get qcCriticalFacilitiesShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcCriticalfacilities.qcshown)
    );
  }

  get qcCriticalFacilitiesExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcCriticalfacilities.qcexpanded)
    );
  }

  get seismicSensorShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.seismicSensor.seismicshown)
    );
  }

  get qcMunicipalBoundaryShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcMunicipalboundary.qcbshown)
    );
  }

  get barangayBoundaryShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.barangayBoundary.brgyShown)
    );
  }

  get qcMunicipalBoundaryExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcMunicipalboundary.qcbexpanded)
    );
  }

  get barangayExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.barangayBoundary.brgyExpanded)
    );
  }

  get lagunaShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.lagunaCenter.shown));
  }

  get qcShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.qcZoomCenter.shown));
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

  get riskAssessmentExpoShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.exposuretypes.shown)
    );
  }

  get populationShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.populationtypes.population.shown)
    );
  }

  get rainForcastShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.raintypes['rain-forecast'].shown)
    );
  }

  get btnCalculateShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.btnCalculateRisk.shown));
  }

  getHazardData(): Promise<{ url: string; sourceLayer: string[] }[]> {
    return this.http
      .get<{ url: string; sourceLayer: string[] }[]>(
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/hazards/ph_combined_tileset.json'
      )
      .pipe(first())
      .toPromise();
  }

  getAffectedPopulationData(): Promise<
    { url: string; sourceLayer: string[] }[]
  > {
    return this.http
      .get<{ url: string; sourceLayer: string[] }[]>(
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/4As/combined_fl_bgy.json'
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

  getRainRiskAssessment$(
    riskType: RiskAssessmentRainType
  ): Observable<RiskAssessmentState> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.raintypes[riskType])
    );
  }

  getPopulationExposure$(
    riskType: RiskAssessmentExposureType
  ): Observable<RiskAssessmentState> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.exposuretypes)
    );
  }

  getExposure$(
    riskType: RiskAssessmentExposureType
  ): Observable<RiskAssessmentState> {
    return this.store.state$.pipe(
      map((state) => state.riskAssessment.exposuretypes)
    );
  }

  getHazardColor(hazardType: HazardType, hazardLevel: HazardLevel): NoahColor {
    return this.store.state[hazardType].levels[hazardLevel].color;
  }

  getExaggeration(): ExaggerationState {
    return this.store.state.exaggeration;
  }

  getQcCriticalFacilities(): QuezonCityCriticalFacilitiesState {
    return this.store.state.qcCriticalfacilities;
  }

  getSeismicSensor(): SeismicSensorState {
    return this.store.state.seismicSensor;
  }

  getQcMunicipalBoundary(): QuezonCityMunicipalBoundaryState {
    return this.store.state.qcMunicipalboundary;
  }

  getBarangayBoundary(): BarangayBoundaryState {
    return this.store.state.barangayBoundary;
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

  getQuezonCitySensorTypeShown$(
    qcSensorType: QuezonCitySensorType
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcSensors.types[qcSensorType].shown)
    );
  }

  getQuezonCitySensorTypeFetched$(
    qcSensorType: QuezonCitySensorType
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcSensors.types[qcSensorType].fetched)
    );
  }

  getQcCriticalFacilitiesShown$(
    qcCriticalFacilities: QuezonCityCriticalFacilities
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map(
        (state) => state.qcCriticalfacilities.types[qcCriticalFacilities].shown
      )
    );
  }

  getSeismicSensorShown$(
    seismicSensor: SeismicSensorType
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.seismicSensor.types[seismicSensor].shown)
    );
  }

  getQcMunicipalBoundaryShown$(
    qcMunicipalBoundary: QuezonCityMunicipalBoundary
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.qcMunicipalboundary.types[qcMunicipalBoundary].shown)
    );
  }

  getBarangayBoundaryShown$(
    barangayBoundary: BarangayBoundary
  ): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.barangayBoundary.types[barangayBoundary].shown)
    );
  }

  setBtnCalculateRiskShown(value: boolean, type: CalculateRiskButton) {
    const btnCalculateRisk: CalculateRiskButton = {
      ...this.store.state.btnCalculateRisk,
    };

    btnCalculateRisk.shown = value;

    this.store.patch(
      {
        btnCalculateRisk,
      },
      `Check Button Calculate Risk ${value}`
    );
  }

  getCalculateRiskBtn(
    calculateRisk: CalculateRiskButton
  ): Observable<CalculateRiskButton> {
    return this.store.state$.pipe(map((state) => state.btnCalculateRisk));
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

  toggleRiskAssessmentGroupProperty(
    property: 'expanded' | 'shown',
    value: boolean
  ) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };

    const currentValue = riskAssessment[property];
    //riskAssessment[property] = !currentValue; remain this if ever we have changes
    riskAssessment[property] = value;
    this.store.patch(
      { riskAssessment },
      `Risk Assessment ${property}, ${!currentValue}`
    );
  }

  setRainRiskAssessmentSoloShown(value: boolean, type: RiskAssessmentRainType) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };

    riskAssessment.raintypes[type].shown = value;
    this.store.patch(
      { riskAssessment },
      `Risk Assessment - update ${type}'s shown to ${value}`
    );
  }

  setExposureRiskAssessmentSoloShown(
    value: boolean,
    type: RiskAssessmentExposureType
  ) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };

    riskAssessment.exposuretypes[type].shown = value;
    this.store.patch(
      { riskAssessment },
      `Risk Assessment - update ${type}'s shown to ${value}`
    );
  }

  setExposureCheckShown(value: boolean, type: RiskAssessmentExposureType) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };

    riskAssessment.exposuretypes.shown = value;
    this.store.patch({ riskAssessment }, `Checkbox - update shown to ${value}`);
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

  setRainForeCastOpacity(value: number, type: RiskAssessmentRainType) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };

    riskAssessment.raintypes['rain-forecast'].opacity = value;
    this.store.patch(
      { riskAssessment },
      `Rain Forecast - update ${type}'s opacity to ${value}`
    );
  }

  setPopulationOpacity(value: number, type: RiskAssessmentExposureType) {
    const riskAssessment: RiskAssessmentGroupState = {
      ...this.store.state.riskAssessment,
    };
    riskAssessment.exposuretypes.opacity = value;
    this.store.patch(
      { riskAssessment },
      `Population Affected - update ${type}'s opacity to ${value}`
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

  setQcCenter(qcCenter: { lat: number; lng: number }) {
    this.store.patch({ qcCenter }, 'Update Quezon City Location');
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

  toggleQuezonCityIOTGroupExpanded(): void {
    const qcSensors = {
      ...this.store.state.qcSensors,
    };
    const qcCriticalfacilities = {
      ...this.store.state.qcCriticalfacilities,
    };
    const seismicSensor = {
      ...this.store.state.seismicSensor,
    };
    const qcMunicipalboundary = {
      ...this.store.state.qcMunicipalboundary,
    };
    const barangayBoundary = {
      ...this.store.state.barangayBoundary,
    };

    const { expanded } = qcSensors;
    const { qcexpanded } = qcCriticalfacilities;
    const { seismicexpanded } = seismicSensor;
    const { qcbexpanded } = qcMunicipalboundary;
    const { brgyExpanded } = barangayBoundary;

    qcSensors.expanded = !expanded;
    qcCriticalfacilities.qcexpanded = !qcexpanded;
    seismicSensor.seismicexpanded = !seismicexpanded;
    qcMunicipalboundary.qcbexpanded = !qcbexpanded;
    barangayBoundary.brgyExpanded = !brgyExpanded;

    this.store.patch(
      { qcSensors, qcCriticalfacilities, seismicSensor, qcMunicipalboundary },
      `update quezon city iot group state expanded to 
      ${!expanded} ${!seismicexpanded} ${!qcexpanded} ${!qcbexpanded} ${!brgyExpanded}`
    );
  }

  toggleQuezonCityIOTGroupShown(): void {
    const qcSensors = {
      ...this.store.state.qcSensors,
    };
    const qcCriticalfacilities = {
      ...this.store.state.qcCriticalfacilities,
    };
    const seismicSensor = {
      ...this.store.state.seismicSensor,
    };
    const qcMunicipalboundary = {
      ...this.store.state.qcMunicipalboundary,
    };
    const barangayBoundary = {
      ...this.store.state.barangayBoundary,
    };

    const { shown } = qcSensors;
    const { qcshown } = qcCriticalfacilities;
    const { seismicshown } = seismicSensor;
    const { qcbshown } = qcMunicipalboundary;
    const { brgyShown } = barangayBoundary;

    qcSensors.shown = !qcSensors.shown;
    qcCriticalfacilities.qcshown = !qcCriticalfacilities.qcshown;
    seismicSensor.seismicshown = !seismicshown;
    qcMunicipalboundary.qcbshown = !qcMunicipalboundary.qcbshown;
    barangayBoundary.brgyShown = !barangayBoundary.brgyShown;

    this.store.patch(
      {
        qcSensors,
        qcCriticalfacilities,
        seismicSensor,
        qcMunicipalboundary,
        barangayBoundary,
      },
      `update quezon city iot group state shown to 
      ${shown}, ${seismicshown}, ${qcshown}, ${qcbshown}, Barangay boundary ${brgyShown}`
    );
  }

  setQuezonCitySensorTypeShown(qcSensorType: QuezonCitySensorType): void {
    const qcSensors = {
      ...this.store.state.qcSensors,
    };

    const { shown } = qcSensors.types[qcSensorType];
    qcSensors.types[qcSensorType].shown = !shown;
    this.store.patch(
      { qcSensors },
      `change quezon city sensor ${qcSensorType}'visibility to ${!shown}`
    );
  }

  setQuezonCityCritFacTypeShown(type: QuezonCityCriticalFacilities): void {
    const qcCriticalfacilities = {
      ...this.store.state.qcCriticalfacilities,
    };

    const { shown } = qcCriticalfacilities.types[type];
    qcCriticalfacilities.types[type].shown = !shown;
    this.store.patch(
      { qcCriticalfacilities },
      `change quezon city critical facilities ${type}'visibility to ${!shown}`
    );
  }

  setSeismicSensorShown(type: SeismicSensorType): void {
    const seismicSensor = {
      ...this.store.state.seismicSensor,
    };

    const { shown } = seismicSensor.types[type];
    seismicSensor.types[type].shown = !shown;
    this.store.patch(
      { seismicSensor },
      `change seismic sensor ${type}'visibility to ${!shown}`
    );
  }

  setQuezonCityMuniBoundaryTypeShown(type: QuezonCityMunicipalBoundary): void {
    const qcMunicipalboundary = {
      ...this.store.state.qcMunicipalboundary,
    };

    const { shown } = qcMunicipalboundary.types[type];
    qcMunicipalboundary.types[type].shown = !shown;
    this.store.patch(
      { qcMunicipalboundary },
      `change quezon city municipal boundary ${type}'visibility to ${!shown}`
    );
  }

  setBarangayBoundaryShown(type: BarangayBoundary): void {
    const barangayBoundary = {
      ...this.store.state.barangayBoundary,
    };

    const { shown } = barangayBoundary.types[type];
    barangayBoundary.types[type].shown = !shown;
    this.store.patch(
      { barangayBoundary },
      `change barangay boundary ${type}'visibility to ${!shown}`
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

  toggleZoomForLaguna(): void {
    const lagunaCenter = {
      ...this.store.state.lagunaCenter,
    };

    const { shown } = lagunaCenter;
    lagunaCenter.shown = !lagunaCenter.shown;

    this.store.patch(
      {
        lagunaCenter,
      },
      `Update laguna IoT group state shown to ${shown}`
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

  toggleIotMunicipalitiesVisibility(): void {
    const iotMunicipalities = {
      ...this.store.state.iotMunicipalities,
    };
    const { shown } = iotMunicipalities;
    iotMunicipalities.shown = !shown;

    iotMunicipalities.shown = !iotMunicipalities.shown;
    this.store.patch(
      { iotMunicipalities },
      `toggle iot municipality visibility ${!shown}`
    );
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

  setQuezonCitySensorTypeFetched(
    qcSensorType: QuezonCitySensorType,
    fetched = true
  ): void {
    const qcSensors = {
      ...this.store.state.qcSensors,
    };

    qcSensors.types[qcSensorType].fetched = fetched;
    this.store.patch(
      { qcSensors },
      `change quezon city sensor's fetched status ${qcSensorType}' to ${!fetched}`
    );
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

  toggleAffectedPopulationVisibility(): void {
    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };
    riskAssessment.populationtypes.population.shown = true;
    this.store.patch({ riskAssessment }, `Show Affected Population`);
  }

  toggleAffectedPopulationVisibilityFalse(): void {
    const riskAssessment = {
      ...this.store.state.riskAssessment,
    };
    riskAssessment.populationtypes.population.shown = false;
    this.store.patch({ riskAssessment }, `Hide Affected Population`);
  }
}
