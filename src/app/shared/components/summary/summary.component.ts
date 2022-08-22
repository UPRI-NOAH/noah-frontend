import { Component, OnInit, Input } from '@angular/core';
import {
  QcSensorService,
  SummaryItem,
} from '@features/noah-playground/services/qc-sensor.service';
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
  total: number;
  activeSensor: number;
  loading = false;
  pk: number;
  summaryData: SummaryItem[] = [];
  fetchedData: SummaryItem[] = [];
  searchValue: string;

  itemsPerPage: number = 10;
  allPages: number;

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
      header: 'CRITICAL LEVEL',
      mobileHeader: 'Critical Level',
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
      this.fetchedData = newArr;
      this.onPageChange();
      this.allPages = Math.ceil(this.fetchedData.length / this.itemsPerPage);
      this.fetchedData.sort((a, b) => (a.name > b.name ? 1 : -1));
      this.activeSensor = locationArr.length;
      this.total = totalSensor.length;
    } catch (error) {
      alert('Unable to Fetch Summary Data');
    } finally {
      this.loading = false;
    }
  }

  closeModal() {
    this.summaryModal = false;
  }

  onPageChange(page: number = 1): void {
    const startItem = (page - 1) * this.itemsPerPage;
    const endItem = page * this.itemsPerPage;
    this.summaryData = this.fetchedData.slice(startItem, endItem);
  }
}
