import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type QcSensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  //| 'distance'
  | 'distance_m';
//| 'sensor_1';

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  // 'distance',
  'distance_m',
  //'sensor_1'
];

@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'https://dfe2-136-158-11-77.ngrok.io';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QcSensorType) {
    const param = type ? `?iot-type=${type}` : '';
    console.log(param);
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
  }
}
