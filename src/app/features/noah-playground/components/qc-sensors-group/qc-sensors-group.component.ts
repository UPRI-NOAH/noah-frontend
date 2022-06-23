import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QcSensorService } from '@features/noah-playground/services/qc-sensor.service';
import { QuezonCitySensorType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-qc-sensors-group',
  templateUrl: './qc-sensors-group.component.html',
  styleUrls: ['./qc-sensors-group.component.scss'],
})
export class QcSensorsGroupComponent implements OnInit {
  qcSensorTypes: QuezonCitySensorType[] = [
    'humidity',
    'pressure',
    'temperature',
  ];
  qcWeatherTypes: QuezonCitySensorType[] = ['distance_m'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  isLoginModal: boolean;
  pk: any;

  constructor(
    private pgService: NoahPlaygroundService,
    private qcSensorService: QcSensorService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
    this.showdata(this.pk);
  }

  //storing data to localstorage
  async showdata(pk: number) {
    const response: any = await this.qcSensorService
      .getQcSensorData(pk)
      .pipe(first())
      .toPromise();

    const qcSensorChartOpts = {
      data: response.results,
    };
    console.log('Data data data', response.results);
    localStorage.setItem('calendarDateTime', JSON.stringify(response.results));
  }

  toggleExpansion() {
    this.pgService.toggleQuezonCitySensorsGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.isLoginModal = true;
    this.pgService.toggleQuezonCitySensorsGroupShown();
  }
}
