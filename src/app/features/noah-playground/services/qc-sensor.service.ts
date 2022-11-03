import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  QuezonCityCriticalFacilities,
  QuezonCitySensorType,
} from '../store/noah-playground.store';
import { forkJoin, Observable, Subject } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

export const QCSENSORS: QuezonCitySensorType[] = ['flood', 'rain'];

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
  private QCBASE_URL = 'https://iot-noah.up.edu.ph';
  loadOnceDisclaimer$ = forkJoin(this.getLoadOnceDisclaimer()).pipe(
    shareReplay(1)
  );

  private QC_CRITFAC_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/bldgs-qc-faci.geojson';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QuezonCitySensorType) {
    const param = type ? `?iot_type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcCriticalFacilities() {
    return this.http.get(`${this.QC_CRITFAC_URL}`);
  }

  getLocation() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/?format=json`);
  }

  getQcSensorData(pk: number): Observable<any> {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?iot_sensor=${pk}`);
  }

  getIotSummarySensorData(pk: number): Observable<any> {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
  }

  getLoadOnceDisclaimer() {
    return localStorage.setItem('disclaimerStatus', 'true');
  }
}
