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
@Injectable({
  providedIn: 'root',
})
export class EarthquakeDataService {
  constructor(private http: HttpClient) {}
  private NOAH_S3_LINK = 'https://iot-noah.up.edu.ph';

  getEarthquakeData(pk: number) {
    return this.http.get(
      `${this.NOAH_S3_LINK}/api/seismic-test-data/?station_id=${pk}`
    );
  }

  getEarthquakeSensor(type: EarthquakeType) {
    const param = type ? `?floor_num=${type}` : '';
    return this.http.get(`${this.NOAH_S3_LINK}/api/seismic-sensors/${param}`);
  }

  getSimulatedata() {
    return this.http.get(
      `${this.NOAH_S3_LINK}/api/seismic-test-data/?format=json`
    );
  }
}
