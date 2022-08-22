import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  QuezonCityCriticalFacilities,
  QuezonCitySensorType,
} from '../store/noah-playground.store';

export type QcSensorType =
  | 'humidity'
  | 'pressure'
  | 'temperature'
  | 'distance_m';

export const QCSENSORS: QuezonCitySensorType[] = [
  'humidity',
  'pressure',
  'temperature',
  'distance_m',
];

export type SummaryItem = {
  name: string;
  iot_type: string;
  latest_date: string;
  latest_data: string;
  critical_level: string;
};

export const QCCRITFAC: QuezonCityCriticalFacilities[] = [
  'qc-critical-facilities',
];
@Injectable({
  providedIn: 'root',
})
export class QcSensorService {
  private QCBASE_URL = 'http://75d3-136-158-11-9.ngrok.io';

  private QC_CRITFAC_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/bldgs-qc-faci.geojson';
  constructor(private http: HttpClient) {}

  getQcSensors(type: QuezonCitySensorType) {
    const param = type ? `?iot-type=${type}` : '';
    return this.http.get(`${this.QCBASE_URL}/api/iot-sensors/${param}`);
  }

  getQcCriticalFacilities() {
    return this.http.get(`${this.QC_CRITFAC_URL}`);
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
