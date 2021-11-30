import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { WeatherSatelliteType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
})
export class WeatherComponent implements OnInit {
  @Input() name: WeatherSatelliteType;

  selectedWeatherSatellite$: Observable<WeatherSatelliteType>;

  initialOpacityValue: number = 30;

  get displayName(): string {
    return this.name.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // The only time we get the value from the state directly is when we're
    // initializing the value
    this.selectedWeatherSatellite$ = this.pgService.selectedWeatherSatellite$;
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
}
