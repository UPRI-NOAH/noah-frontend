import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type EarthquakeType = 'seismic-sensor';

export const EARTHQUAKE: EarthquakeType[] = ['seismic-sensor'];

export type EarthquakeItem = {
  direction: string;
  displacement: number;
  acceleration: number;
  drift: number;
};
export type SummaryItem = {
  bldg_name: string;
  rshake_station: string;
  floor_num: number;
  alert_level: number;
  drift: number;
  acceleration: number;
  displacement: number;
  intensity: string;
};
@Injectable({
  providedIn: 'root',
})
export class EarthquakeDataService {
  constructor(private http: HttpClient) {}
  private NOAH_S3_LINK = 'https://iot-noah.up.edu.ph';

  getEarthquakeData(pk: number) {
    return this.http.get(
      `${this.NOAH_S3_LINK}/api/seismic-data/?station_id=${pk}`
    );
  }

  getEarthquakeSensor(type: EarthquakeType) {
    const param = type ? `?floor_num=${type}` : '';
    return this.http.get(`${this.NOAH_S3_LINK}/api/seismic-sensors/${param}`);
  }

  getLocationData() {
    return this.http.get(`${this.NOAH_S3_LINK}/api/seismic-sensors/`);
  }

  getEarthquakeSummaryData() {
    return this.http.get(
      `${this.NOAH_S3_LINK}/api/seismic-test-data/?alert_level`
    );
  }
}
