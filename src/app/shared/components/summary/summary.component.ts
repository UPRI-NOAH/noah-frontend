import { Component, OnInit } from '@angular/core';
import {
  QCSENSORS,
  QcSensorService,
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
  location: any = [];
  summaryData = [];
  constructor(private qcSensorService: QcSensorService) {}

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
    this.qcSensorService.getQcSummaryData().subscribe;
    this.qcSensorService
      .getLocation()
      .subscribe((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
        for (let i = 0; i < data.features.length; i++) {
          const currentFeature = data.features[i];
          const locationName = currentFeature.properties.name;
          const iotType = currentFeature.properties.iot_type;
          console.log(locationName + iotType + '  yesy');
          this.location = currentFeature.properties.name;
          console.log(this.location + 'location');
        }
      });

    // QCSENSORS.forEach((qcSensorType) => {
    //   this.qcSensorService.getQcSensors(qcSensorType)
    //     .pipe(first())
    //     .toPromise()
    //     .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
    //       for (let i = 0; i < data.features.length; i++) {
    //         const currentFeature = data.features[i]
    //         const locationName = currentFeature.properties.name
    //         const iotType = currentFeature.properties.iot_type
    //         console.log(locationName)
    //         this.location = locationName
    //       }
    //     })
    // })
  }
}
