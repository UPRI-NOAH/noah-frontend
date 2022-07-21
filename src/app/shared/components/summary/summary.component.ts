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

// export type SummaryItem = {
//   locationName: string;
//   iotType: string;
// };
export class SummaryComponent implements OnInit {
  isLoginModal: boolean;
  dropDownList;
  todayString: string = new Date().toDateString();
  location: any = [];
  locationName: string;
  iotType: string;

  summaryData: any = [
    {
      name: 'Brgy. Bagumbayan (Calle Industria St.)',
      iot_type: 'flood',
      latest_data: '2',
      critical_level: 'high (1.5m +)',
    },
    {
      name: 'Brgy. Villa Maria Clara (Tomas Mascardo St.)',
      iot_type: 'flood',
      latest_data: '0.3',
      critical_level: 'low (0 - 0.5m)',
    },
    {
      name: 'Brgy. QMC (in front of Quezon City Hall)',
      iot_type: 'flood',
      latest_data: '0.8',
      critical_level: 'medium (0.5 - 1.5m)',
    },
    {
      name: 'Brgy. Sacred Heart (Tomas Morato Avenue)',
      iot_type: 'flood',
      latest_data: '1.2',
      critical_level: 'medium (0.5 - 1.5m)',
    },
    {
      name: 'Brgy. Central (East Ave Matalino St. Intersection )',
      iot_type: 'flood',
      latest_data: '1.0',
      critical_level: 'medium (0.5 - 1.5m)',
    },
    {
      name: 'Brgy. Central (BIR Rd.)',
      iot_type: 'flood',
      latest_data: '0.45',
      critical_level: 'low (0 - 0.5m)',
    },
    {
      name: 'Brgy. Fairview (Jaguar St.)',
      iot_type: 'flood',
      latest_data: '0.1',
      critical_level: 'low (0 - 0.5m)',
    },
    {
      name: 'Brgy. Fairview (Dahlia Avenue)',
      iot_type: 'flood',
      latest_data: '0.25',
      critical_level: 'low (0 - 0.5m)',
    },
  ];

  constructor(private qcSensorService: QcSensorService) {}

  columns = ['LOCATION', 'SENSOR TYPE', 'LATEST DATA', 'CRITICAL LEVEL'];
  // index = ["name", "iot_type"];

  // summary: SummaryItem[] = [];

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
    this.qcSensorService
      .getLocation()
      .subscribe((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
        for (let i = 0; i < data.features.length; i++) {
          const currentFeature = data.features[i];
          const locationName = currentFeature.properties.name;
          const iotType = currentFeature.properties.iot_type;
          // console.log(locationName +  iotType + "with type")
          //this.location = currentFeature.properties.name;
          console.log(locationName + '---' + iotType);
        }
        // return [this.locationName, this.iotType];
      });

    // viewSummary() {
    //   this.qcSensorService
    //     .getLocation()
    //     .subscribe((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
    //       for (let i = 0; i < data.features.length; i++) {
    //         const currentFeature = data.features[i];
    //         const locationName = currentFeature.properties.name;
    //         const iotType = currentFeature.properties.iot_type;
    //        // console.log(locationName +  iotType + "with type")
    //         //this.location = currentFeature.properties.name;
    //         console.log(" test location" + ", " + locationName + " " + iotType);

    //       }
    //       // return [this.locationName, this.iotType];
    //     });

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
