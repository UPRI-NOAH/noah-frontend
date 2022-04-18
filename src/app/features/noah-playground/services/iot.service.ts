import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type QcSensorType = 'humidity' | 'pressure' | 'temperature';

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'temperature',
];

@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'https://7c05-136-158-11-17.ngrok.io';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QcSensorType) {
    const param = type ? `?iot_type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
  }
}
