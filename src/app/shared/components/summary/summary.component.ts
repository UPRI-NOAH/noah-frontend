import { Component, OnInit } from '@angular/core';
import {
  QCSENSORS,
  QcSensorService,
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
  isLoginModal: boolean;
  dropDownList;
  todayString: string = new Date().toDateString();
  summaryDataItem: SummaryItem[];
  // locationName: string;
  // iotType: string;
  sortedColumn: string;
  total: number;
  countSensors: number;

  summaryData: SummaryItem[];
  searchValue: string;

  constructor(private qcSensorService: QcSensorService) {}

  columns = ['LOCATION', 'SENSOR TYPE', 'LATEST DATA', 'CRITICAL LEVEL'];

  ngOnInit(): void {
    this.viewSummary();
  }
  closeModal() {
    this.isLoginModal = false;
  }
  getColumn(): string[] {
    return ['name', 'iot_type'];
  }

  viewSummary() {
    this.qcSensorService.getSummaryData().subscribe((result: SummaryItem[]) => {
      this.summaryData = result;
      this.columns = Object.keys(this.summaryData[0]);
      const total = 0;
      this.total = Object.keys(this.summaryData).length;
      console.log(this.total + '___total');
      console.log(this.summaryData, '___summaryData');
      console.log(this.columns, '___columns');
    });

    this.qcSensorService
      .getLocation()
      .subscribe((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
        for (let i = 0; i < data.features.length; i++) {
          const currentFeature = data.features[i];
          const locationName = currentFeature.properties.name;
          const iotType = currentFeature.properties.iot_type;
          console.log(locationName + '---' + iotType);
        }
      });
  }
}
