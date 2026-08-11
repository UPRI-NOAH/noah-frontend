import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  NOAA_FORECAST_DAYS,
  NoaaForecastDay,
  WeatherSatelliteType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
})
export class WeatherComponent implements OnInit {
  @Input() name: WeatherSatelliteType;

  selectedWeatherSatellite$: Observable<WeatherSatelliteType>;
  selectedNoaaForecastDay$: Observable<NoaaForecastDay>;
  noaaForecastDays = NOAA_FORECAST_DAYS;

  initialOpacityValue: number = 70;

  get displayName(): string {
    if (this.name === 'NOAA') {
      return 'NOAA GFS';
    }
    return this.name.replace('-', ' + ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // The only time we get the value from the state directly is when we're
    // initializing the value
    this.selectedWeatherSatellite$ = this.pgService.selectedWeatherSatellite$;
    this.selectedNoaaForecastDay$ = this.pgService.selectedNoaaForecastDay$;
    this.initialOpacityValue = this.pgService.getWeatherSatelliteOpacity(
      this.name
    );
  }

  changeOpacity(opacity: number) {
    this.pgService.setWeatherSatelliteOpacity(opacity, this.name);
  }

  selectWeatherSatellite(weatherType: WeatherSatelliteType) {
    this.pgService.selectWeatherSatelliteType(weatherType);
  }

  selectNoaaForecastDay(day: NoaaForecastDay) {
    this.pgService.selectNoaaForecastDay(day);
  }
}
