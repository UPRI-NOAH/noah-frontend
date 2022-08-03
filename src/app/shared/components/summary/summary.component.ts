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
  loading = false;
  pk: number;

  summaryData: SummaryItem[];
  searchValue: string;
  location: string;
  constructor(private qcSensorService: QcSensorService) {}

  columns = [
    'LOCATION',
    'SENSOR TYPE',
    'LATEST DATE',
    'LATEST DATA',
    'CRITICAL LEVEL',
  ];

  ngOnInit(): void {}
  closeModal() {
    this.summaryModal = false;
  }

  async viewSummary() {
    if (this.loading) {
      return;
    }

    try {
      this.summaryModal = true;
      this.loading = true;
      const response: any = await this.qcSensorService
        .getLocation()
        .pipe(first())
        .toPromise();

      const res: any = await this.qcSensorService
        .getQcSensorData(this.pk)
        .pipe(first())
        .toPromise();
      const myArr = res.results.map((a) => {
        return {
          latest_date: new Date(a.received_at).getTime(),
          latest_data: a.distance_m,
          iot_sensor: a.iot_sensor,
        };
      });

      const locationArr = response.features
        .filter((a) => a.properties.name !== null && a.properties.name !== '')
        .map((a) => {
          return {
            name: a.properties.name,
            iot_type: a.properties.iot_type,
            pk: a.properties.pk,
          };
        });
      const totalSensor = response.features.map((a) => {
        return;
      });

      const newArr = [];
      for (let i = 0; i < locationArr.length; i++) {
        for (let j = 0; j < myArr.length; j++) {
          if (locationArr[i].pk == myArr[j].iot_sensor) {
            newArr.push({ ...locationArr[i], ...myArr[j] });
            break;
          }
        }
      }
      this.summaryData = newArr; //display data
      this.activeSensor = locationArr.length;
      this.total = totalSensor.length;
    } catch (error) {
      alert('Unable to Fetch Data');
    } finally {
      this.loading = false;
    }
  }
}
