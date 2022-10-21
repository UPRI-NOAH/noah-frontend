import { Component, OnInit, Input } from '@angular/core';
import {
  QcSensorService,
  SummaryItem,
} from '@features/noah-playground/services/qc-sensor.service';
import {
  Observable,
  of,
  pipe,
  Subject,
  Subscription,
  interval,
  concat,
  timer,
} from 'rxjs';
import {
  first,
  tap,
  startWith,
  switchMap,
  take,
  finalize,
} from 'rxjs/operators';

@Component({
  selector: 'noah-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  summaryModal: boolean;
  todayString: string = new Date().toDateString();
  sortedColumn: string;
  total: number;
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
  rainActiveSensor: number;

  searchValue: string;

  itemsPerPage: number = 10;
  allPages: number;
  subscription!: Subscription;
  everyFiveSeconds: Observable<number> = timer(60000); //refresh every 1 minute
  alert: boolean = false;
  alertSummary: boolean = false;

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

      const res: any = await this.qcSensorService
        .getQcSensorData(this.pk)
        .pipe(first())
        .toPromise();
      const dataArr = res.results.map((a) => {
        return {
          latest_date: a.received_at,
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
        for (let j = 0; j < dataArr.length; j++) {
          if (locationArr[i].pk == dataArr[j].iot_sensor) {
            newArr.push({ ...locationArr[i], ...dataArr[j] });
            break;
          }
        }
      }

      const rainSensor = [];
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

      const floodSensor = [];
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

      this.subscription = this.everyFiveSeconds.subscribe(() => {
        this.viewSummary(); //auto refresh data every 1 minute
      });
      newArr.sort((a, b) => (a.latest_date > b.latest_date ? -1 : 1));
      floodSensor.sort((a, b) => (a.latest_date > b.latest_date ? -1 : 1));
      rainSensor.sort((a, b) => (a.latest_date > b.latest_date ? -1 : 1));

      this.fetchedData = newArr;
      this.floodFetchedData = floodSensor;
      this.rainFetchedData = rainSensor;
      this.onPageChange();
      this.allPages = Math.ceil(this.fetchedData.length / this.itemsPerPage);

      //count numbers
      this.activeSensor = newArr.length;
      this.total = totalSensor.length;
      this.rainActiveSensor = rainSensor.length;
      this.activeFloodSensor = floodSensor.length;
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
    this.summaryModal = !this.summaryData;
  }

  onPageChange(page: number = 1): void {
    const startItem = (page - 1) * this.itemsPerPage;
    const endItem = page * this.itemsPerPage;
    this.summaryData = this.fetchedData.slice(startItem, endItem);
    this.floodSummaryData = this.floodFetchedData.slice(startItem, endItem);
    this.rainSummaryData = this.rainFetchedData.slice(startItem, endItem);
  }
}
