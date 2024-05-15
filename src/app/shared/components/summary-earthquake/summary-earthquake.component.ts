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

    // const locationArr = response.features
    //   .filter((a) => a.properties.bldg_name)
    //   .map((a) => {
    //     return {
    //       bldg_name: a.properties.bldg_name,
    //     };
    //   });

    for (const feature of response.features) {
      for (const data of feature.properties.data) {
        const rowData = {
          bldg_name: feature.properties.bldg_name,
          rshake_station: data.rshake_station,
          floor_num: data.floor_num,
        };
        this.summaryData.push(rowData);
      }
    }
  }

  // const dataArr = response.features
  // .filter((a) => a.properties.data)
  // .map((a) => {
  //   return {
  //     rshake_station: a.properties.data.rshake_station,
  //     floor_num: a.properties.data.floor_num,
  //   };
  // });

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
  //   };
  // });

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
