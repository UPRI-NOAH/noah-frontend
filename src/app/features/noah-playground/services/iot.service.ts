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
  private QCBASE_URL = 'https://ce7d-136-158-11-77.ngrok.io';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QcSensorType) {
    const param = type ? `?format=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?format=${pk}`);
  }
}
