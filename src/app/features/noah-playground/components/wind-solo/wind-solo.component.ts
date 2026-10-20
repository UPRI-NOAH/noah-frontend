import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import {
  WindType,
  WIND_FORECAST_DAYS,
  WindForecastDay,
} from '@features/noah-playground/store/noah-playground.store';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'noah-wind-solo',
  templateUrl: './wind-solo.component.html',
  styleUrls: ['./wind-solo.component.scss'],
})
export class WindSoloComponent implements OnInit, OnDestroy {
  @Input() windType: WindType;

  forecastDays = WIND_FORECAST_DAYS;

  initialParticleCountValue: number = 2000;
  initialSpeedValue: number = 2;
  initialColorValue: string = '#ffffff';

  /**
   * This component is only a view: the sweep itself (and whether it is
   * running) lives in the playground service, so hiding or collapsing the
   * side panel — which destroys this component — cannot stop the animation.
   */
  playing = false;
  currentDayIndex = 0;
  /** 0..1 position of the sweep between the current day and the next one. */
  private dayProgress = 0;
  private timelineSub: Subscription | null = null;
  private playingSub: Subscription | null = null;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
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

    this.timelineSub = this.pgService.windTimeline$.subscribe(
      ({ day, blend }) => {
        const index = this.forecastDays.findIndex((d) => d.value === day);

        if (index !== -1) this.currentDayIndex = index;
        this.dayProgress = blend;
      }
    );

    this.playingSub = this.pgService.windSweepPlaying$.subscribe(
      (playing) => (this.playing = playing)
    );
  }

  ngOnDestroy(): void {
    this.timelineSub?.unsubscribe();
    this.playingSub?.unsubscribe();
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
    this.pgService.toggleWindSweep();
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
    // A day picked by hand snaps the map straight to it (no sweep); the
    // service owns the sweep position, so the labels follow from there.
    this.pgService.selectWindForecastDay(day);
  }
}
