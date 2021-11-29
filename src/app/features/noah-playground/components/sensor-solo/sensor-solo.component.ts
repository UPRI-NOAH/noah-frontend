import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { SensorType } from '@features/noah-playground/services/sensor.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const SENSOR_NAMES: Record<SensorType, string> = {
  arg: 'Automated Rain Gauge',
  wlms: 'Water Level Monitoring System',
  aws: 'Automated Weather Stations',
  wlmsarg: 'Waterlevel & Rain',
};
@Component({
  selector: 'noah-sensor-solo',
  templateUrl: './sensor-solo.component.html',
  styleUrls: ['./sensor-solo.component.scss'],
})
export class SensorSoloComponent implements OnInit, OnDestroy {
  @Input() sensorType: SensorType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;

  private _unsub = new Subject();

  get sensorName(): string {
    return SENSOR_NAMES[this.sensorType];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getSensorTypeShown$(this.sensorType);
    this.pgService
      .getSensorTypeFetched$(this.sensorType)
      .pipe(takeUntil(this._unsub))
      .subscribe((fetched) => {
        this.fetchFailed = !fetched;
        console.log(fetched);
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    if (this.fetchFailed) return;
    this.pgService.setSensorTypeShown(this.sensorType);
  }
}
