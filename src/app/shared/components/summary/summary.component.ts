import { Component, OnInit } from '@angular/core';
import {
  QCSENSORS,
  QcSensorService,
  QcSensorType,
  SummaryItem,
} from '@features/noah-playground/services/qc-sensor.service';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  summaryModal: boolean;
  dropDownList;
  todayString: string = new Date().toDateString();
  summaryDataItem: SummaryItem[];
  // locationName: string;
  // iotType: string;
  sortedColumn: string;
  total: number;
  activeSensor: number;
  countSensors: number;

  summaryData: SummaryItem[];
  searchValue: string;
  location: string;
  constructor(private qcSensorService: QcSensorService) {}

  columns = [
    'LOCATION',
    'SENSOR TYPE',
    'LATEST DATA',
    'LATEST DATE',
    'CRITICAL LEVEL',
  ];

  ngOnInit(): void {
    this.viewSummary();
  }
  closeModal() {
    this.summaryModal = false;
  }
  getColumn(): string[] {
    return ['name', 'iot_type'];
  }

  async viewSummary() {
    try {
      const response: any = await this.qcSensorService
        .getLocation()
        .pipe(first())
        .toPromise();
      const locationArr = response.features
        .filter((a) => a.properties.name !== null && a.properties.name !== '')
        .map((a) => {
          return {
            name: a.properties.name,
            iot_type: a.properties.iot_type,
          };
        });
      const totalSensor = response.features.map((a) => {
        return;
      });
      this.summaryData = locationArr;
      console.log('luh', totalSensor.length);
      this.activeSensor = locationArr.length;
      this.total = totalSensor.length;
    } catch (error) {}
  }
}
