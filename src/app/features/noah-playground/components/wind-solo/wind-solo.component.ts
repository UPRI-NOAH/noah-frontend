import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  WindType,
  WIND_FORECAST_DAYS,
  WindForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';

const CYCLE_INTERVAL_MS = 1500;

@Component({
  selector: 'noah-wind-solo',
  templateUrl: './wind-solo.component.html',
  styleUrls: ['./wind-solo.component.scss'],
})
export class WindSoloComponent implements OnInit, OnDestroy {
  @Input() windType: WindType;

  forecastDays = WIND_FORECAST_DAYS;
  selectedForecastDay$: Observable<WindForecastDay>;

  initialParticleCountValue: number = 1000;
  initialSpeedValue: number = 0.5;
  initialColorValue: string = '#67FF01';

  playing = false;
  currentDayIndex = 0;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private selectedSub: Subscription | null = null;

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

    this.selectedSub = this.selectedForecastDay$.subscribe((day) => {
      this.currentDayIndex = this.forecastDays.findIndex(
        (d) => d.value === day
      );
    });
  }

  ngOnDestroy(): void {
    this.stopCycle();
    this.selectedSub?.unsubscribe();
  }

  get currentDayLabel(): string {
    return this.forecastDays[this.currentDayIndex]?.label ?? 'Today';
  }

  get timelineProgress(): number {
    return (this.currentDayIndex / (this.forecastDays.length - 1)) * 100;
  }

  togglePlay(): void {
    if (this.playing) {
      this.stopCycle();
    } else {
      this.startCycle();
    }
  }

  private startCycle(): void {
    this.playing = true;
    this.cycleTimer = setInterval(() => {
      this.currentDayIndex =
        (this.currentDayIndex + 1) % this.forecastDays.length;
      this.selectForecastDay(this.forecastDays[this.currentDayIndex].value);
    }, CYCLE_INTERVAL_MS);
  }

  private stopCycle(): void {
    this.playing = false;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
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
