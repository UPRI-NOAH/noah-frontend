import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BarangayBoundary,
  QuezonCityCriticalFacilities,
  QuezonCityMunicipalBoundary,
  QuezonCitySensorType,
} from '../store/noah-playground.store';
import { forkJoin } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

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

export const BARANGAYBOUNDARY: BarangayBoundary[] = ['brgy-boundary'];

interface ResponseData {
  results: any[]; // Replace 'any' with the appropriate type of the 'results' property
  next: string | null; // Adjust the type if needed
}
@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'https://iot-noah.up.edu.ph';
  loadOnceDisclaimer$ = forkJoin(this.getLoadOnceDisclaimer()).pipe(
    shareReplay(1)
  );

  private UPRI_S3_BASE_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com';
  // old link for qc 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/boundary/QC_Bound.geojson'

  constructor(private http: HttpClient) {}

  getQcSensors(type: QuezonCitySensorType) {
    const param = type ? `iot_type=${type}` : '';
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-sensors/?municity[]=laguna&municity[]=quezon_city&${param}`
    );
  }

  getQcCriticalFacilities() {
    return this.http.get(
      `${this.UPRI_S3_BASE_URL}/critical_facilities/bldgs-qc-faci.geojson`
    );
  }

  getQcMunicipalBoundary() {
    return this.http.get(
      `${this.UPRI_S3_BASE_URL}/boundary/IoT_Muni_Bounds.geojson`
    );
  }

  getBarangayBoundary() {
    return this.http.get(`${this.UPRI_S3_BASE_URL}/boundary/IoT_Brgys.geojson`);
  }

  getLocation() {
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-sensors/?municity[]=laguna&municity[]=quezon_city`
    );
  }

  getQcSensorData(pk: number) {
    const pageSize = 1000; // Adjust the page size as per your API's configuration
    const allData = [];

    const loadPage = async (page: number) => {
      const url = `${this.QCBASE_URL}/api/iot-data/?iot_sensor=${pk}&page=${page}&page_size=${pageSize}`;
      const response = await this.http.get(url).toPromise();

      const responseData = response as ResponseData; // Cast the response to ResponseData

      if (responseData && responseData.results) {
        const data = responseData.results;
        allData.push(...data);

        if (responseData.next) {
          const nextPage = page + 1;
          return loadPage(nextPage);
        }
      } else {
        throw new Error('Invalid response format');
      }

      return allData;
    };

    return loadPage(1);
  }

  getIotSummarySensorData() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data-latest/`);
  }

  getLoadOnceDisclaimer() {
    return localStorage.setItem('disclaimerStatus', 'true');
  }
}
