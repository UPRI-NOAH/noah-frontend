import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HighchartsChartModule } from 'highcharts-angular';

import { NoahPlaygroundRoutingModule } from './noah-playground-routing.module';
import { SharedModule } from '@shared/shared.module';

import { NoahPlaygroundComponent } from './pages/noah-playground/noah-playground.component';
import { CriticalFacilitiesPlaygroundComponent } from './components/critical-facilities-playground/critical-facilities-playground.component';
import { MapPlaygroundComponent } from './components/map-playground/map-playground.component';
import { SliderComponent } from './components/slider/slider.component';
import { HazardLegendComponent } from './components/hazard-legend/hazard-legend.component';
import { HazardLevelComponent } from './components/hazard-level/hazard-level.component';
import { HazardTypeComponent } from './components/hazard-type/hazard-type.component';
import { ExaggerationComponent } from './components/exaggeration/exaggeration.component';
import { FacilityComponent } from './components/facility/facility.component';
import { SensorsGroupComponent } from './components/sensors-group/sensors-group.component';
import { SensorSoloComponent } from './components/sensor-solo/sensor-solo.component';
import { WeatherComponent } from './components/weather/weather.component';
import { ContourMapsComponent } from './components/contour-maps/contour-maps.component';
import { WeatherSatellitePlaygroundComponent } from './components/weather-satellite-playground/weather-satellite-playground.component';
import { VolcanoGroupComponent } from './components/volcano-group/volcano-group.component';
import { VolcanoSoloComponent } from './components/volcano-solo/volcano-solo.component';
import { QcSensorsGroupComponent } from './components/qc-sensors-group/qc-sensors-group.component';
import { QcSensorSoloComponent } from './components/qc-sensor-solo/qc-sensor-solo.component';
import { QcCriticalFacilitiesComponent } from './components/qc-critical-facilities/qc-critical-facilities.component';
import { QcBoundaryComponent } from './components/qc-boundary/qc-boundary.component';

@NgModule({
  declarations: [
    NoahPlaygroundComponent,
    CriticalFacilitiesPlaygroundComponent,
    MapPlaygroundComponent,
    SliderComponent,
    HazardLegendComponent,
    HazardLevelComponent,
    HazardTypeComponent,
    ExaggerationComponent,
    FacilityComponent,
    SensorsGroupComponent,
    SensorSoloComponent,
    WeatherComponent,
    ContourMapsComponent,
    WeatherSatellitePlaygroundComponent,
    VolcanoGroupComponent,
    VolcanoSoloComponent,
    QcSensorsGroupComponent,
    QcSensorSoloComponent,
    QcCriticalFacilitiesComponent,
    QcBoundaryComponent,
  ],
  imports: [
    CommonModule,
    NoahPlaygroundRoutingModule,
    SharedModule,
    HighchartsChartModule,
  ],
})
export class NoahPlaygroundModule {}
