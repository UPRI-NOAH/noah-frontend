import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type SensorType =
  | 'arg' // Automated Rain Gauge
  | 'wlms' // Water Level Monitoring System
  | 'aws' // Automated Weather Stations
  | 'wlmsarg'; // Waterlevel & Rain

export const SENSORS: SensorType[] = ['arg', 'aws', 'wlms', 'wlmsarg'];

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  private BASE_URL = 'http://202.90.159.72:8000';

  constructor(private http: HttpClient) {}

  getSensors(type: SensorType) {
    const param = type ? `?sensor_type=${type}` : '';
    return this.http.get(`${this.BASE_URL}/api/sensors/${param}`);
  }

  getSensorData(pk: number) {
    return this.http.get(`${this.BASE_URL}/api/sensor-data/?sensor=${pk}`);
  }
}
