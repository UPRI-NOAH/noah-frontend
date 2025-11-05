import { Component, OnInit } from '@angular/core';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { WEATHER_SATELLITE_ARR } from '@features/weather-updates/store/weather-updates.store';
import { Observable } from 'rxjs';
@Component({
  selector: 'noah-typhoon-track-solo',
  templateUrl: './typhoon-track-solo.component.html',
  styleUrls: ['./typhoon-track-solo.component.scss'],
})
export class TyphoonTrackSoloComponent implements OnInit {
  isOpenedList;
  weatherSatellite = WEATHER_SATELLITE_ARR;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private wuService: WeatherUpdatesService) {}

  displayLegend = [
    {
      src: 'assets/legends/typhoon-track/LPA.png',
      name: 'low pressure area (LPA)',
    },
    {
      src: 'assets/legends/typhoon-track/TD.png',
      name: 'tropical depression (TD)',
    },
    { src: 'assets/legends/typhoon-track/TS.png', name: 'tropical storm (TS)' },
    {
      src: 'assets/legends/typhoon-track/STS.png',
      name: 'severe tropical storm (STS)',
    },
    { src: 'assets/legends/typhoon-track/TY.png', name: 'typhoon (TY)' },
    {
      src: 'assets/legends/typhoon-track/STY.png',
      name: 'super typhoon (STY)',
    },
  ];

  ngOnInit(): void {
    this.expanded$ = this.wuService.weatherSatellitesExpanded$;
    this.shown$ = this.wuService.weatherSatellitesShown$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.wuService.toggleWeatherSatelliteVisibility();
  }

  toggleExpanded() {
    this.wuService.toggleWeatherSatelliteVisibility;
  }
}
