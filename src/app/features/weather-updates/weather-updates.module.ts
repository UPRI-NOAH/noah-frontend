import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//Modules
import { WeatherUpdatesRoutingModule } from './weather-updates-routing.module';
import { SharedModule } from '@shared/shared.module';
import { SwiperModule } from 'swiper/angular';
//Pages
import { BaseComponent } from './pages/base/base.component';
import { WeatherUpdatesComponent } from './pages/weather-updates/weather-updates.component';
//Components
import { MapWeatherUpdatesComponent } from './components/map-weather-updates/map-weather-updates.component';
import { RainfallContourButtonComponent } from './components/rainfall-contour-button/rainfall-contour-button.component';
import { TyphoonTrackGroupComponent } from './components/typhoon-track-group/typhoon-track-group.component';
import { TyphoonTrackSoloComponent } from './components/typhoon-track-solo/typhoon-track-solo.component';
import { WeatherSatelliteComponent } from './components/weather-satellite/weather-satellite.component';

@NgModule({
  declarations: [
    BaseComponent,
    WeatherUpdatesComponent,
    MapWeatherUpdatesComponent,
    RainfallContourButtonComponent,
    TyphoonTrackGroupComponent,
    TyphoonTrackSoloComponent,
    WeatherSatelliteComponent,
  ],
  imports: [
    CommonModule,
    WeatherUpdatesRoutingModule,
    SharedModule,
    SwiperModule,
  ],
})
export class WeatherUpdatesModule {}
