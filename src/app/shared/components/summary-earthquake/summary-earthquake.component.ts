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

  summaryData: any[] = [];
  summaryRedAlertData: SummaryItem[] = [];
  fetchedRedAlertData: SummaryItem[] = [];
  summaryOrangeAlertData: SummaryItem[] = [];
  fetchedOrangeAlertData: SummaryItem[] = [];
  summaryYellowAlertData: SummaryItem[] = [];
  fetchedYellowAlertData: SummaryItem[] = [];

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
    {
      key: 'drift',
      header: 'DRIFT',
      mobileHeader: 'Drift',
    },
    {
      key: 'acceleration',
      header: 'ACCELERATION',
      mobileHeader: 'Acceleration',
    },
    {
      key: 'displacement',
      header: 'DISPLACEMENT',
      mobileHeader: 'Displacement',
    },
    {
      key: 'intensity',
      header: 'INTENSITY',
      mobileHeader: 'Intensity',
    },
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

    // for (const feature of response.features) {
    //   for (const data of feature.properties.data) {
    //     const rowData = {
    //       bldg_name: feature.properties.bldg_name,
    //       rshake_station: data.rshake_station,
    //       floor_num: data.floor_num
    //     }
    //     this.summaryData.push(rowData);
    //   }
    // }

    const locationArr = response.features
      .filter((a) => a.properties.bldg_name)
      .map((a) => {
        return {
          bldg_name: a.properties.bldg_name,
        };
      });
    const dataRes = response.features.properties.data
      .filter((a) => a.features.properties.data.alert_level)
      .map((a) => {
        return {
          rshake_station: a.features.properties.data.rshake_station,
          floor_num: a.features.properties.data.floor_num,
          alert_level: a.features.properties.data.alert_level,
        };
      });
    const newArr = [];
    for (let i = 0; i < locationArr.length; i++) {
      for (let j = 0; j < dataRes.length; j++) {
        if (locationArr[i].bldg_name) {
          newArr.push({ ...locationArr[i], ...dataRes[j] });
          break;
        }
      }
    }
    this.summaryData.push(newArr);

    // const allDataWith = [];
    // for (let i = 0; i < newArr.length; i++) {
    //   if (newArr[i].alert_level) {
    //     allDataWith.push({ ...newArr[i] });
    //   }
    // }
    // this.summaryData.push(allDataWith);
  }

  // const res: any = await this.earthquakeService
  //   .getEarthquakeSummaryData()
  //   .pipe(first())
  //   .toPromise();

  // const dataArr = res.results.map((a) => {
  //   return {
  //     acceleration: a.acceleration,
  //     displacement: a.displacement,
  //     drift: a.drift,
  //     intensity: a.intensity,
  //     alert_level: a.alert_level,
  //   };
  // });

  // const redAlertData = response.features.properties.data
  //   .map()

  // const newArr = []; //all summary data
  // for (let i = 0; i < locationArr.length; i++) {
  //   for (let j = 0; j < dataArr.length; j++) {
  //     if (locationArr[i].bldg_name == dataArr[j].drift) {
  //       newArr.push({ ...locationArr[i], ...dataArr[j] });
  //       break;
  //     }
  //   }
  // }

  // const allDataWith = []; //disply all data without null value
  // for (let i = 0; i < newArr.length; i++) {
  //   if (newArr[i].bldg_name) {
  //     allDataWith.push({ ...newArr[i] });
  //   }
  // }
  // const sortName = []; //seperate null value
  // for (let i = 0; i < newArr.length; i++) {
  //   if (newArr[i].bldg_name == null) {
  //     sortName.push({ ...newArr[i] });
  //   }
  // }
  // this.fetchedRedAlertData = allDataWith.concat(sortName);

  closeModal() {
    this.modalService.earthquakeSummaryModalClose();
  }
}
