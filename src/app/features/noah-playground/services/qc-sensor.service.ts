import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  QuezonCityCriticalFacilities,
  QuezonCitySensorType,
} from '../store/noah-playground.store';
import { forkJoin, Observable, Subject } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

export type QcSensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  | 'distance_m';

export const QCSENSORS: QuezonCitySensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  'distance_m',
];

export type SummaryItem = {
  name: string;
  iot_type: string;
  latest_date: string;
  latest_data: string;
  critical_level: string;
};

export const QCCRITFAC: QuezonCityCriticalFacilities[] = [
  'qc-critical-facilities',
];
@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private _refresh$ = new Subject<void>();

  private QCBASE_URL = 'http://609a-136-158-11-127.ngrok.io';

  loadOnceDisclaimer$ = forkJoin(this.getLoadOnceDisclaimer()).pipe(
    shareReplay(1)
  );

  private QC_CRITFAC_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/bldgs-qc-faci.geojson';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QuezonCitySensorType) {
    const param = type ? `?iot-type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcCriticalFacilities() {
    return this.http.get(`${this.QC_CRITFAC_URL}`);
  }

  getLocation() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/?format=json`);
  }

  getQcSensorData(pk: number): Observable<any> {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`).pipe(
      tap(() => {
        this._refresh$.next();
      })
    );
  }

  getQcIotSensorData() {
    const sensor_id = JSON.parse(localStorage.getItem('pk'));
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-data/?iot_sensor=${sensor_id}`
    );
  }

  getLoadOnceDisclaimer() {
    return localStorage.setItem('disclaimerStatus', 'true');
  }

  get refresh$() {
    return this._refresh$;
  }
}
