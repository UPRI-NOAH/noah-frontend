import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  QcCriticalFacilitiesState,
  QuezonCitySensorType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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
  qcShown: QcCriticalFacilitiesState;
  disclaimerModal: boolean;

  get shown(): boolean {
    return this.qcShown.shown;
  }
  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
    this.qcShown = this.pgService.getQcCritFac();
  }

  toggleExpansion() {
    this.pgService.toggleQuezonCitySensorsGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.disclaimerModal = true;
    this.pgService.toggleQuezonCitySensorsGroupShown();

    const shown = !this.shown;
    this.qcShown = {
      ...this.qcShown,
      shown,
    };
    this.pgService.setQcCritFac(this.qcShown);
  }
}
