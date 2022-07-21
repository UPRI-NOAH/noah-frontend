import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type QcSensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  | 'distance_m';

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  'distance_m',
];

export type SummaryItem = {
  locationName: string;
  iotType: string;
};
@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'http://916c-136-158-11-9.ngrok.io';
  constructor(private http: HttpClient) {}

  url: string = '@shared/';

  getQcSensors(type: QcSensorType) {
    const param = type ? `?iot-type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getLocation() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/?format=json`);
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
  }

  getQcIotSensorData() {
    const sensor_id = JSON.parse(localStorage.getItem('pk'));
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-data/?iot_sensor=${sensor_id}`
    );
  }

  getQcCalendar() {
    const sensor_id = JSON.parse(localStorage.getItem('pk'));
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-data2/?iot_sensor=${sensor_id}`
    );
  }
}
