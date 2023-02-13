import { Component, OnInit } from '@angular/core';
import {
  QcSensorService,
  SummaryItem,
} from '@features/noah-playground/services/qc-sensor.service';
import { Observable, Subscription, timer } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  summaryModal: boolean;
  todayString: string = new Date().toDateString();
  sortedColumn: string;
  totalSensor: number;
  inactive: number;
  activeSensor: number;
  loading = false;
  pk: number;
  summaryData: SummaryItem[] = [];
  fetchedData: SummaryItem[] = [];

  floodSummaryData: SummaryItem[] = [];
  floodFetchedData: SummaryItem[] = [];
  activeFloodSensor: number;

  rainSummaryData: SummaryItem[] = [];
  rainFetchedData: SummaryItem[] = [];
  activeRainSensor: number;

  searchValue: string;

  itemsPerPage: number = 15;
  floodPerpage: number = 15;
  rainPerPage: number = 15;
  allPages: number;
  floodAllPages: number;
  rainAllPages: number;
  subscription!: Subscription;
  everOneMinute: Observable<number> = timer(60000); //refresh every 1 minute
  alert: boolean = false;
  alertSummary: boolean = false;

  sortField = 'latest_date';
  sortDirection = 'ascending';

  constructor(private qcSensorService: QcSensorService) {}
  columns = [
    {
      key: 'name',
      header: 'LOCATION',
      mobileHeader: 'Location',
    },
    {
      key: 'iot_type',
      header: 'SENSOR TYPE',
      mobileHeader: 'Sensor Type',
    },
    {
      key: 'latest_date',
      header: 'LATEST DATE/TIME',
      mobileHeader: 'Date/Time',
    },
    {
      key: 'latest_data',
      header: 'LATEST DATA',
      mobileHeader: 'Latest Data',
    },
    {
      key: 'critical_level',
      header: 'LEVEL',
      mobileHeader: 'Level',
    },
    {
      key: 'status',
      header: 'STATUS',
      mobileHeader: 'Status',
    },
  ];

  ngOnInit(): void {}

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

      const locationArr = response.features
        .filter((a) => a.properties.name !== null && a.properties.name !== '')
        .map((a) => {
          return {
            name: a.properties.name,
            iot_type: a.properties.iot_type,
            pk: a.properties.pk,
          };
        });

      const res: any = await this.qcSensorService
        .getIotSummarySensorData()
        .pipe(first())
        .toPromise();

      const dataArr = res.results.map((a) => {
        return {
          latest_date: a.received_at,
          latest_data: a.distance_m == undefined ? a.acc : a.distance_m,
          iot_sensor: a.iot_sensor,
          status: a.status,
        };
      });

      const totalSensor = response.features.map((a) => {
        return;
      });

      const activeSensors = response.features.map((a) => {
        return {
          status: a.properties.status,
        };
      });

      const active = []; // compute total active sensor
      for (let i = 0; i < activeSensors.length; i++) {
        if (activeSensors[i].status == 'Active') {
          active.push({ ...active[i] });
        }
      }

      const inactive = []; // compute total inactive sensor
      for (let i = 0; i < activeSensors.length; i++) {
        if (activeSensors[i].status == 'Inactive') {
          inactive.push({ ...active[i] });
        }
      }

      const newArr = []; //all summary data
      for (let i = 0; i < locationArr.length; i++) {
        for (let j = 0; j < dataArr.length; j++) {
          if (locationArr[i].pk == dataArr[j].iot_sensor) {
            newArr.push({ ...locationArr[i], ...dataArr[j] });
            break;
          }
        }
      }

      const allDataWith = []; //disply all data without null value
      for (let i = 0; i < newArr.length; i++) {
        if (newArr[i].latest_date) {
          allDataWith.push({ ...newArr[i] });
        }
      }

      //RAIN SENSOR
      const rainSensor = []; //all rain sensor data
      for (let i = 0; i < locationArr.length; i++) {
        for (let j = 0; j < dataArr.length; j++) {
          if (locationArr[i].pk == dataArr[j].iot_sensor) {
            if (locationArr[i].iot_type == 'rain') {
              rainSensor.push({ ...locationArr[i], ...dataArr[j] });
              break;
            }
          }
        }
      }

      const activeRain = []; //active rain sensor data
      for (let i = 0; i < rainSensor.length; i++) {
        if (rainSensor[i].status == 'Active') {
          activeRain.push({ ...rainSensor[i] });
        }
      }

      const rainData = []; //disply all data without null value
      for (let i = 0; i < rainSensor.length; i++) {
        if (rainSensor[i].latest_date) {
          rainData.push({ ...rainSensor[i] });
        }
      }

      const rainWithNull = []; //seperate null value
      for (let i = 0; i < rainSensor.length; i++) {
        if (rainSensor[i].latest_date == null) {
          rainWithNull.push({ ...rainSensor[i] });
        }
      }

      //FLOOD SENSOR
      const floodSensor = []; //all flood sensor data
      for (let i = 0; i < locationArr.length; i++) {
        for (let j = 0; j < dataArr.length; j++) {
          if (locationArr[i].pk == dataArr[j].iot_sensor) {
            if (locationArr[i].iot_type == 'flood') {
              floodSensor.push({ ...locationArr[i], ...dataArr[j] });
              break;
            }
          }
        }
      }

      const floodData = []; //disply all data without null value
      for (let i = 0; i < floodSensor.length; i++) {
        if (floodSensor[i].latest_date) {
          floodData.push({ ...floodSensor[i] });
        }
      }

      const floodWithNull = []; //seperate null value
      for (let i = 0; i < floodSensor.length; i++) {
        if (floodSensor[i].latest_date == null) {
          floodWithNull.push({ ...floodSensor[i] });
        }
      }

      const activeFlood = []; //active flood sensor data
      for (let i = 0; i < floodSensor.length; i++) {
        if (floodSensor[i].status == 'Active') {
          activeFlood.push({ ...floodSensor[i] });
        }
      }

      //ALL DATA NULL VALUE
      const sortDate = []; //seperate null value
      for (let i = 0; i < newArr.length; i++) {
        if (newArr[i].latest_date == null) {
          sortDate.push({ ...newArr[i] });
        }
      }

      this.subscription = this.everOneMinute.subscribe(() => {
        this.viewSummary(); //auto refresh data every 1 minute
      });

      //fetching data and display to table and item per page
      this.fetchedData = allDataWith.concat(sortDate);
      this.fetchedData.sort((a, b) => (a.latest_date > b.latest_date ? -1 : 1)); //sorting data
      this.floodFetchedData = floodData.concat(floodWithNull);
      this.floodFetchedData.sort((a, b) =>
        a.latest_date > b.latest_date ? -1 : 1
      ); //sorting data
      this.rainFetchedData = rainData.concat(rainWithNull);
      this.rainFetchedData.sort((a, b) =>
        a.latest_date > b.latest_date ? -1 : 1
      ); //sorting data
      this.onPageChange();
      this.allPages = Math.ceil(this.fetchedData.length / this.itemsPerPage);
      this.floodAllPages = Math.ceil(
        this.floodFetchedData.length / this.floodPerpage
      );
      this.rainAllPages = Math.ceil(
        this.rainFetchedData.length / this.rainPerPage
      );

      //count numbers
      this.activeSensor = active.length;
      this.inactive = inactive.length;
      this.totalSensor = totalSensor.length;
      this.activeRainSensor = activeRain.length;
      this.activeFloodSensor = activeFlood.length;
    } catch (error) {
      this.summaryModal = false;
      this.loading = !this.loading;
      this.alertSummary = true;
      setTimeout(() => {
        this.alertSummary = false;
      }, 2000);
    } finally {
      this.loading = false;
    }
  }

  closeModal() {
    this.subscription.unsubscribe(); //stop popup modal
    this.alert = !this.alert;
    this.summaryModal = !this.summaryModal;
  }

  onPageChange(page: number = 1): void {
    const startItem = (page - 1) * this.itemsPerPage;
    const endItem = page * this.itemsPerPage;
    this.summaryData = this.fetchedData.slice(startItem, endItem);

    const fstartItem = (page - 1) * this.floodPerpage;
    const fendItem = page * this.floodPerpage;
    this.floodSummaryData = this.floodFetchedData.slice(fstartItem, fendItem);

    const rstartItem = (page - 1) * this.rainPerPage;
    const rendItem = page * this.rainPerPage;
    this.rainSummaryData = this.rainFetchedData.slice(rstartItem, rendItem);
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
