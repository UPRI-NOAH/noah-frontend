import { Component, OnInit } from '@angular/core';
import {
  EarthquakeDataService,
  SummaryItem,
} from '@features/noah-playground/services/earthquake-data.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-summary-earthquake',
  templateUrl: './summary-earthquake.component.html',
  styleUrls: ['./summary-earthquake.component.scss'],
})
export class SummaryEarthquakeComponent implements OnInit {
  earthquakeSummaryModal = false;
  todayString: string = new Date().toDateString();
  loading = false;
  totalBuildings: number;
  totalStations: number;
  redAlertData: number;
  orangeAlertData: number;

  summaryAllData: any[] = [];
  fetchedAllData: any[] = [];
  summaryRedAlertData: any[] = [];
  fetchedRedAlertData: any[] = [];
  summaryOrangeAlertData: any[] = [];
  fetchedOrangeAlertData: any[] = [];
  // summaryYellowAlertData: SummaryItem[] = [];
  // fetchedYellowAlertData: SummaryItem[] = [];
  searchValue: string;

  constructor(
    private earthquakeService: EarthquakeDataService,
    private modalService: ModalService
  ) {}

  columns = [
    {
      key: 'bldg_name',
      header: 'BUILDING',
      mobileHeader: 'Building',
    },
    {
      key: 'rshake_station',
      header: 'RSHAKE STATION',
      mobileHeader: 'Rshake Station',
    },
    {
      key: 'floor_num',
      header: 'FLOOR',
      mobileHeader: 'Floor',
    },
    {
      key: 'alert_level',
      header: 'ALERT LEVEL',
      mobileHeader: 'Alert Level',
    },
    // {
    //   key: 'drift',
    //   header: 'DRIFT',
    //   mobileHeader: 'Drift',
    // },
    // {
    //   key: 'acceleration',
    //   header: 'ACCELERATION',
    //   mobileHeader: 'Acceleration',
    // },
    // {
    //   key: 'displacement',
    //   header: 'DISPLACEMENT',
    //   mobileHeader: 'Displacement',
    // },
    // {
    //   key: 'intensity',
    //   header: 'INTENSITY',
    //   mobileHeader: 'Intensity',
    // },
  ];

  ngOnInit(): void {
    this.viewSummary();
  }

  async viewSummary() {
    this.earthquakeSummaryModal = true;

    const response: any = await this.earthquakeService
      .getLocationData()
      .pipe(first())
      .toPromise();

    const totalBuilding = response.features
      .filter((a) => a.properties.bldg_name !== '')
      .map((a) => {
        return {
          bldg_name: a.properties.bldg_name,
        };
      });

    // const totalStat = response.features
    // .map((a) => {
    //   if (a.properties.data.rshake_station !== null) {
    //     return {
    //       rshake_station: a.properties.data.rshake_station,
    //       alert_level: a.properties.data.alert_level
    //     };
    //   }
    //   return null;
    // })
    // .filter((a) => a !== null);

    // const redAlert = []; //active rain sensor data
    //   for (let i = 0; i < totalStat.length; i++) {
    //     if (totalStat[i].alert_level == 2) {
    //       redAlert.push({ ...totalStat[i] });
    //     }
    // }

    // const totalStation = response.features.properties
    // .filter((a) => a.data.rshake_station !== '')
    // .map((a) => {
    //   return {
    //     rshake_station: a.data.rshake_station,
    //   };
    // });

    for (const feature of response.features) {
      for (const data of feature.properties.data) {
        const rowData = {
          bldg_name: feature.properties.bldg_name,
          rshake_station: data.rshake_station,
          floor_num: data.floor_num,
          alert_level: data.alert_level,
        };
        this.summaryAllData.push(rowData);
      }
    }

    for (const feature of response.features) {
      for (const data of feature.properties.data) {
        if (data.alert_level == 2) {
          const rowRedData = {
            bldg_name: feature.properties.bldg_name,
            rshake_station: data.rshake_station,
            floor_num: data.floor_num,
            alert_level: data.alert_level,
          };
          this.summaryRedAlertData.push(rowRedData);
        }
      }
    }

    for (const feature of response.features) {
      for (const data of feature.properties.data) {
        if (data.alert_level == 1) {
          const rowOrangeData = {
            bldg_name: feature.properties.bldg_name,
            rshake_station: data.rshake_station,
            floor_num: data.floor_num,
            alert_level: data.alert_level,
          };
          this.summaryOrangeAlertData.push(rowOrangeData);
        }
      }
    }

    // const res: any = await this.earthquakeService
    // .getEarthquakeSummaryData()
    // .pipe(first())
    // .toPromise();

    // const dataArr = res.results.map((a) => {
    //   return {
    //     acceleration: a.acceleration,
    //     displacement: a.displacement,
    //     drift: a.drift,
    //     intensity: a.intensity,
    //     station_id: a.station_id,
    //     alert_level: a.alert_level,
    //   };

    // });

    // const dataRedArray =[];
    // for (let k = 0; k < totalBuilding.length; k++) {
    //   for (let i = 0; i < totalStation.length; i++) {
    //     for (let j = 0; j < dataArr.length; j++) {
    //       if (totalStation[i].rshake_station == dataArr[j].station_id) {
    //         if (dataArr[i].alert_level == 2){
    //           dataRedArray.push({ ...totalStation[i], ...dataArr[j] });
    //           break;
    //         }
    //       }

    //     }
    //   }
    // }

    // this.summaryRedAlertData.push(dataRedArray);
    this.totalBuildings = totalBuilding.length;
    // this.totalStations = totalStation.length;
    // this.redAlertData = redAlert.length;
  }

  closeModal() {
    this.modalService.earthquakeSummaryModalClose();
  }
}
