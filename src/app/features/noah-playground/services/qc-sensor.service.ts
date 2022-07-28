import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feature } from 'geojson';
import { type } from 'os';

export type QcSensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  | 'distance_m';
//waterlevel

export type QCViewSummaryDisplay =
  | 'location'
  | 'sensor_type'
  | 'latest_data'
  | 'critical_level';

export type QCSummaryDataFeature = Feature & {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name: string;
    iot_type: string;
    pk: number;
  };
};

export type SummaryItem = {
  name: string;
  iot_type: string;
  pk: number;
};

export const QCSENSORS: QcSensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  'distance_m',
];
@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'http://83b6-136-158-11-9.ngrok.io';
  constructor(private http: HttpClient) {}

  getQcSensors(type: QcSensorType) {
    const param = type ? `?iot-type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getLocation() {
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/?format=json`);
  }

  getQcSummaryData() {
    const sensor_id = JSON.parse(localStorage.getItem('pk'));
    return this.http.get(
      `${this.QCBASE_URL}/api/iot-data/?iot_sensor=${sensor_id}`
    );
  }

  getQcSensorData(pk: number) {
    return this.http.get(`${this.QCBASE_URL}/api/iot-data/?id=${pk}`);
  }
}
