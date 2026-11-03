import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  WindType,
  WIND_FORECAST_DAYS,
  WindForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';

/** How long the sweep takes to move from one forecast day into the next. */
const DAY_BLEND_MS = 1500;
/** How often the sweep position (and the map's blend) is updated. */
const CYCLE_TICK_MS = 60;

@Component({
  standalone: false,
  selector: 'noah-wind-solo',
  templateUrl: './wind-solo.component.html',
  styleUrls: ['./wind-solo.component.scss'],
})
export class WindSoloComponent implements OnInit, OnDestroy {
  @Input() windType: WindType;

  forecastDays = WIND_FORECAST_DAYS;
  selectedForecastDay$: Observable<WindForecastDay>;

  initialParticleCountValue: number = 2000;
  initialSpeedValue: number = 2;
  initialColorValue: string = '#ffffff';

  playing = false;
  currentDayIndex = 0;
  /** 0..1 position of the sweep between the current day and the next one. */
  private dayProgress = 0;
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
      const index = this.forecastDays.findIndex((d) => d.value === day);

      if (index === -1 || index === this.currentDayIndex) return;

      // A day change that came from outside the player (the map only ever
      // follows it) snaps the sweep to that day.
      this.currentDayIndex = index;
      this.dayProgress = 0;
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
    const span = this.forecastDays.length - 1;

    return Math.min(
      ((this.currentDayIndex + this.dayProgress) / span) * 100,
      100
    );
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
    this.cycleTimer = setInterval(() => this.tickCycle(), CYCLE_TICK_MS);
  }

  /**
   * Advances the sweep continuously instead of jumping a whole day at a
   * time. Each tick pushes the current position to the map, which
   * cross-fades the wind grid from the current day into the next one, so
   * the particle flow keeps moving straight through without ever
   * restarting.
   */
  private tickCycle(): void {
    this.dayProgress += CYCLE_TICK_MS / DAY_BLEND_MS;

    if (this.dayProgress >= 1) {
      this.dayProgress -= 1;
      this.currentDayIndex =
        (this.currentDayIndex + 1) % this.forecastDays.length;
    }

    this.pgService.setWindTimeline(
      this.forecastDays[this.currentDayIndex].value,
      this.dayProgress
    );
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
    const index = this.forecastDays.findIndex((d) => d.value === day);

    if (index !== -1) {
      this.currentDayIndex = index;
    }

    // A day picked by hand snaps the map straight to it (no sweep).
    this.dayProgress = 0;
    this.pgService.selectWindForecastDay(day);
  }
}
