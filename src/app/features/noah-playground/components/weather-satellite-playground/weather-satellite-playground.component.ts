import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  WeatherSatelliteType,
  WEATHER_SATELLITE_ARR,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-weather-satellite-playground',
  templateUrl: './weather-satellite-playground.component.html',
  styleUrls: ['./weather-satellite-playground.component.scss'],
})
export class WeatherSatellitePlaygroundComponent implements OnInit {
  isOpenedList;
  weatherSatellite = WEATHER_SATELLITE_ARR;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.weatherSatellitesExpanded$;
    this.shown$ = this.pgService.weatherSatellitesShown$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleWeatherSatelliteGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleWeatherSatelliteGroupExpansion();
  }
}
