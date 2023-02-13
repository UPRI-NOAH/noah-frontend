import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  QuezonCityCriticalFacilities,
  QuezonCityMunicipalBoundary,
  QuezonCitySensorType,
} from '../store/noah-playground.store';
import { forkJoin, Observable, of } from 'rxjs';
import { shareReplay, concatMap, map } from 'rxjs/operators';

export const QCSENSORS: QuezonCitySensorType[] = ['flood', 'rain'];

export type SummaryItem = {
  name: string;
  iot_type: string;
  latest_date: string;
  latest_data: string;
  critical_level: string;
  status: string;
};

export const QCCRITFAC: QuezonCityCriticalFacilities[] = [
  'qc-critical-facilities',
];

export const QCBoundary: QuezonCityMunicipalBoundary[] = [
  'qc-municipal-boundary',
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
  private QC_MUNIBoundary_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com/boundary/QC_Bound.geojson';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QuezonCitySensorType) {
    const param = type ? `iot_type=${type}` : '';
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-sensors/?municity=quezon_city&${param}`
    );
  }

  getQcCriticalFacilities() {
    return this.http.get(`${this.QC_CRITFAC_URL}`);
  }

  getQcMunicipalBoundary() {
    return this.http.get(`${this.QC_MUNIBoundary_URL}`);
  }

  getLocation() {
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-sensors/?format=json&municity=quezon_city`
    );
  }

  getQcSensorData(
    pk: number,
    pagesToLoad: number = 1,
    page: number = 1,
    allData = []
  ): Observable<any> {
    return this.http
      .get(`${this.QCBASE_URL}/api/iot-data/?iot_sensor=${pk}&page=${page}`)
      .pipe(
        concatMap((data) => {
          allData = allData.concat(data['results']);
          if (data['next'] && pagesToLoad > 1) {
            return this.getQcSensorData(pk, pagesToLoad - 1, page + 1, allData);
          } else {
            return of(allData);
          }
        })
      );
  }

  getIotSummarySensorData() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data-latest/`);
  }

  getLoadOnceDisclaimer() {
    return localStorage.setItem('disclaimerStatus', 'true');
  }
}
