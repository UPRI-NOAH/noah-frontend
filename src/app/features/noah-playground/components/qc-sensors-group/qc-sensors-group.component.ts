import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  QCSENSORS,
  QcSensorService,
} from '@features/noah-playground/services/qc-sensor.service';
import {
  QuezonCityCriticalFacilities,
  QuezonCityCriticalFacilitiesState,
  QuezonCitySensorType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators';
@Component({
  selector: 'noah-qc-sensors-group',
  templateUrl: './qc-sensors-group.component.html',
  styleUrls: ['./qc-sensors-group.component.scss'],
})
export class QcSensorsGroupComponent implements OnInit {
  qcWeatherTypes: QuezonCitySensorType[] = QCSENSORS;
  qcCritFac: QuezonCityCriticalFacilities[] = ['qc-critical-facilities'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  qcshown$: Observable<boolean>;
  qcexpanded$: Observable<boolean>;
  qcShown: QuezonCityCriticalFacilitiesState;
  disclaimerModal = false;

  // get qcshown(): boolean {
  //   return this.qcShown.qcshown;
  // }

  constructor(
    private pgService: NoahPlaygroundService,
    private qcSensorService: QcSensorService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
    this.qcshown$ = this.pgService.qcCriticalFacilitiesShown$;
    this.qcexpanded$ = this.pgService.qcCriticalFacilitiesExpanded$;
    this.showdata();
  }

  //storing data to localstorage
  async showdata() {
    const response: any = await this.qcSensorService
      .getQcIotSensorData()
      .pipe(first())
      .toPromise();
    localStorage.setItem('calendarDateTime', JSON.stringify(response.results));
  }

  toggleExpansion() {
    this.pgService.toggleQuezonCityIOTGroupExpanded();
  }

  toggleShown(event: Event) {
    this.showdata();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.pgService.toggleQuezonCityIOTGroupShown();
    const discStatus = localStorage.getItem('disclaimerStatus');
    if (discStatus == 'true') {
      this.disclaimerModal = true;
    }
    if (discStatus == 'false') {
      this.disclaimerModal = false;
    }
  }
}
