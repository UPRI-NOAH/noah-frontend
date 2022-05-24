import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QuezonCitySensorType } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const QC_SENSOR_NAMES: Record<QuezonCitySensorType, string> = {
  sensor1: 'Automated Factory Systems',
  sensor2: 'Water Level Measurement',
  sensor3: 'Flood Monitoring',
  sensor4: 'Proximity Zone Detection',
};

@Component({
  selector: 'noah-qc-sensor-solo',
  templateUrl: './qc-sensor-solo.component.html',
  styleUrls: ['./qc-sensor-solo.component.scss'],
})
export class QcSensorSoloComponent implements OnInit, OnDestroy {
  @Input() qcSensorType: QuezonCitySensorType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;

  private _unsub = new Subject();

  get qcSensorName(): string {
    return QC_SENSOR_NAMES[this.qcSensorType];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getQuezonCitySensorTypeShown$(
      this.qcSensorType
    );
    this.pgService
      .getQuezonCitySensorTypeFetched$(this.qcSensorType)
      .pipe(takeUntil(this._unsub))
      .subscribe((fetched) => {
        this.fetchFailed = !fetched;
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    if (this.fetchFailed) return;
    this.pgService.setQuezonCitySensorTypeShown(this.qcSensorType);
  }
}
