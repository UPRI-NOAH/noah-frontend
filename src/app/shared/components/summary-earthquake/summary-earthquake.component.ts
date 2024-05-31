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
  pk: number;
  rshake_station: string = '';
  intensity: string = '';

  summaryAllData: any[] = [];
  fetchedAllData: any[] = [];
  summaryRedAlertData: any[] = [];
  fetchedRedAlertData: any[] = [];
  summaryOrangeAlertData: any[] = [];
  fetchedOrangeAlertData: any[] = [];
  // summaryYellowAlertData: SummaryItem[] = [];
  // fetchedYellowAlertData: SummaryItem[] = [];
  searchValue: string;

  sortField = 'bldg_name';
  sortDirection = 'ascending';

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
    // this.viewSummary();
  }

  async viewSummary(pk: number, rshake_station: string) {
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

    const res: any = await this.earthquakeService
      .getEarthquakeData(pk)
      .pipe(first())
      .toPromise();

    const latestData = res.results
      .filter((a) => a.station_id === rshake_station)
      .reduce((latest, current) => {
        if (
          !latest ||
          new Date(current.timestamp) > new Date(latest.timestamp)
        ) {
          return current;
        } else {
          return latest;
        }
      }, null);

    const eqData = latestData
      ? [
          {
            // Assuming direction for X-axis
            displacement: latestData.displacement_x,
            acceleration: latestData.acceleration_x,
            drift: latestData.drift_x,
            alert_level: latestData.alert_level,
            axis_with_max_drift: latestData.axis_with_max_drift,
            intensity: latestData.intensity_x,
          },
          {
            // Assuming direction for Y-axis
            displacement: latestData.displacement_y,
            acceleration: latestData.acceleration_y,
            drift: latestData.drift_y,
            alert_level: latestData.alert_level,
            axis_with_max_drift: latestData.axis_with_max_drift,
            intensity: latestData.intensity_y,
          },
          {
            // Assuming direction for Z-axis
            displacement: latestData.displacement_z,
            acceleration: latestData.acceleration_z,
            drift: latestData.drift_z,
            alert_level: latestData.alert_level,
            axis_with_max_drift: latestData.axis_with_max_drift,
            intensity: latestData.intensity_z,
          },
        ]
      : [];

    // Assign eqData to earthquakeData
    this.fetchedAllData = eqData;
    if (latestData.axis_with_max_drift === 'x') {
      this.intensity = latestData.intensity_x;
    } else if (latestData.axis_with_max_drift === 'y') {
      this.intensity = latestData.intensity_y;
    } else if (latestData.axis_with_max_drift === 'z') {
      this.intensity = latestData.intensity_z;
    }

    this.totalBuildings = totalBuilding.length;
  }

  closeModal() {
    this.modalService.earthquakeSummaryModalClose();
  }

  onHeaderColumnClick(field: string) {
    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortField = field;
      this.sortDirection = 'ascending';
    }
  }
}
