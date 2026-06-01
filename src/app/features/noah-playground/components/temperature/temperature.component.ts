import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  TEMPERATURE,
  TEMPERATURE_FORECAST_DAYS,
  TemperatureForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss'],
})
export class TemperatureComponent implements OnInit {
  isOpenedList;
  temperature = TEMPERATURE;
  forecastDays = TEMPERATURE_FORECAST_DAYS;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  selectedTempType$: Observable<string>;
  selectedForecastDay$: Observable<TemperatureForecastDay>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.temperatureExpanded$;
    this.shown$ = this.pgService.temperatureShown$;
    this.selectedTempType$ = this.pgService.selectedTemperature$;
    this.selectedForecastDay$ = this.pgService.selectedTemperatureForecastDay$;
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleTemperatureGroupVisibility();
  }

  toggleExpanded() {
    this.pgService.toggleTemperatureGroupExpansion();
  }

  selectForecastDay(day: TemperatureForecastDay): void {
    this.pgService.selectTemperatureForecastDay(day);
  }
}
