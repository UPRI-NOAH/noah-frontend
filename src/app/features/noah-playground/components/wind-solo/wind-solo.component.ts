import { Component, Input, OnInit } from '@angular/core';
import {
  WindType,
  WIND_FORECAST_DAYS,
  WindForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-wind-solo',
  templateUrl: './wind-solo.component.html',
  styleUrls: ['./wind-solo.component.scss'],
})
export class WindSoloComponent implements OnInit {
  @Input() windType: WindType;

  forecastDays = WIND_FORECAST_DAYS;
  selectedForecastDay$: Observable<WindForecastDay>;

  initialParticleCountValue: number = 1000;
  initialSpeedValue: number = 0.5;
  initialColorValue: string = '#67FF01';

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.selectedForecastDay$ = this.pgService.selectedWindForecastDay$;

    this.pgService
      .getWind$(this.windType)
      .pipe(first())
      .subscribe(({ particleCount, speed, color }) => {
        this.initialParticleCountValue = particleCount;
        this.initialSpeedValue = speed;
        this.initialColorValue = color;
      });

    this.initialParticleCountValue =
      this.pgService.getWindParticleCount('wind');
  }

  changeParticleCount(particleCount: number) {
    this.pgService.setWindParticleCount(particleCount, this.windType);
  }

  changeSpeed(speed: number) {
    this.pgService.setWindSpeed(speed, this.windType);
  }

  changeColor(color: string) {
    this.pgService.setWindColor(color, this.windType);
  }

  selectForecastDay(day: WindForecastDay): void {
    this.pgService.selectWindForecastDay(day);
  }
}
