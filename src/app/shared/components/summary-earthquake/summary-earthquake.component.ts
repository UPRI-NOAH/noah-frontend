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
      header: 'BUILDING NAME',
      mobileHeader: 'Building Name',
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

    const locationArr = response.features
      .filter((a) => a.properties.bldg_name)
      .map((a) => {
        return {
          bldg_name: a.properties.bldg_name,
        };
      });
    // const responseData = response.features[0].properties.data;
    // const data = JSON.parse(responseData);
    // const rshake_station = data.rshake_station;
    // const floor_num = data.floor_num;

    const data = response.features
      .filter((a) => a.properties.data)
      .map((a) => {
        return {
          rshake_station: a.properties.data.rshake_station,
          floor_num: a.properties.data.floor_num,
        };
      });

    const res: any = await this.earthquakeService
      .getEarthquakeSummaryData()
      .pipe(first())
      .toPromise();

    const dataArr = res.results.map((a) => {
      return {
        acceleration: a.acceleration,
        displacement: a.displacement,
        drift: a.drift,
        intensity: a.intensity,
        station_id: a.station_id,
      };
    });

    const newArr = []; //all summary data
    for (let k = 0; k < locationArr.length; k++) {
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < dataArr.length; j++) {
          if (
            (locationArr[k].bldg_name == data[i].rshake_station) ==
            dataArr[j].station_id
          ) {
            newArr.push({ ...locationArr[k], ...data[i], ...dataArr[j] });
            break;
          }
        }
      }
    }

    const allDataWith = []; //disply all data without null value
    for (let i = 0; i < newArr.length; i++) {
      if (newArr[i].bldg_name) {
        allDataWith.push({ ...newArr[i] });
      }
    }
    const sortName = []; //seperate null value
    for (let i = 0; i < newArr.length; i++) {
      if (newArr[i].bldg_name == null) {
        sortName.push({ ...newArr[i] });
      }
    }
    this.summaryRedAlertData = allDataWith.concat(sortName);
  }

  closeModal() {
    this.modalService.earthquakeSummaryModalClose();
  }
}
