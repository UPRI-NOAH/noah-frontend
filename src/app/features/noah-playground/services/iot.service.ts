import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type QcSensorType = 'humidity' | 'pressure' | 'temperature' | 'sensor4';

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  'sensor4',
];

@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private BASE_URL = 'https://noah-api.up.edu.ph';

  constructor(private http: HttpClient) {}

  // getQcSensors(type: QcSensorType){
  //     const param = type ? `sensor_type${type}` : '';
  //     return this.http.get(`${this.BASE_URL}/api/sensors/${param}`);
  // }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.BASE_URL}/api/sensor-data/?sensor=${pk}`);
  }
}
