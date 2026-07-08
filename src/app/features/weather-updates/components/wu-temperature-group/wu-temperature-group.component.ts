import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  TEMPERATURE,
  TEMPERATURE_FORECAST_DAYS,
  TemperatureForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'noah-wu-temperature-group',
  templateUrl: './wu-temperature-group.component.html',
  styleUrls: ['./wu-temperature-group.component.scss'],
})
export class WuTemperatureGroupComponent implements OnInit {
  expanded = true;
  shown = false;

  isOpenedList;
  temperature = TEMPERATURE;
  forecastDays = TEMPERATURE_FORECAST_DAYS;

  selectedTempType$: Observable<string>;
  selectedForecastDay$: Observable<TemperatureForecastDay>;

  constructor(
    private wuService: WeatherUpdatesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Auto-enable typhoon track and himawari satellite if navigating directly to this page
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.autoEnableFeatures();
      });
    this.autoEnableFeatures();

    this.selectedTempType$ = this.wuService.selectedTemperature$;
    this.selectedForecastDay$ = this.wuService.selectedTemperatureForecastDay$;
  }

  private autoEnableFeatures(): void {
    if (this.router.url === '/weather-updates/temperature') {
      this.wuService.getTemperatures();
    }
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.wuService.toggleTemperatureGroupVisibility();
  }

  toggleExpanded(): void {
    this.wuService.toggleTemperatureGroupExpansion();
  }

  selectForecastDay(day: TemperatureForecastDay): void {
    this.wuService.selectTemperatureForecastDay(day);
  }
}
