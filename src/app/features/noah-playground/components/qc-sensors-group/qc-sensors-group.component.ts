import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QCSENSORS } from '@features/noah-playground/services/qc-sensor.service';
import {
  QuezonCityCriticalFacilities,
  QuezonCityCriticalFacilitiesState,
  QuezonCitySensorType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
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

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
    this.qcshown$ = this.pgService.qcCriticalFacilitiesShown$;
    this.qcexpanded$ = this.pgService.qcCriticalFacilitiesExpanded$;
  }

  toggleExpansion() {
    this.pgService.toggleQuezonCityIOTGroupExpanded();
  }

  toggleShown(event: Event) {
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