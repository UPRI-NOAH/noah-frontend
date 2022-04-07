import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type QcSensorType = 'humidity' | 'pressure' | 'weather' | 'temperature';

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'weather',
  'temperature',
];

@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'https://0a35-136-158-11-205.ngrok.io';

  constructor(private http: HttpClient) {}

  getQcSensors(type: QcSensorType) {
    const param = type ? `?iot_type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
    //return this.http.get(`https://95c1-136-158-11-205.ngrok.io/api/iot-sensors/?iot_type=humidity`);
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
    //return this.http.get(`https://upri-noah.s3.ap-southeast-1.amazonaws.com/iot-devices/iot-data-2.json`);
  }
}
