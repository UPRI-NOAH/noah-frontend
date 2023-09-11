import { Component, OnInit } from '@angular/core';
import { ModalServicesService } from '@features/noah-playground/services/modal-services.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { QCSENSORS } from '@features/noah-playground/services/qc-sensor.service';
import {
  BarangayBoundary,
  BarangayBoundaryState,
  QuezonCityCriticalFacilities,
  QuezonCityCriticalFacilitiesState,
  QuezonCityMunicipalBoundary,
  QuezonCityMunicipalBoundaryState,
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
  qcMuniBoundary: QuezonCityMunicipalBoundary[] = ['qc-municipal-boundary'];
  barangayBoundary: BarangayBoundary[] = ['brgy-boundary'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  qcshown$: Observable<boolean>;
  qcexpanded$: Observable<boolean>;
  qcShown: QuezonCityCriticalFacilitiesState;
  qcbshown$: Observable<boolean>;
  qcbexpanded$: Observable<boolean>;
  brgyShown$: Observable<boolean>;
  brgyExpanded$: Observable<boolean>;
  qcbShown: QuezonCityMunicipalBoundaryState;
  brgyShown: BarangayBoundaryState;
  disclaimerModal = false;

  constructor(
    private pgService: NoahPlaygroundService,
    private ModalService: ModalServicesService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.qcSensorsGroupExpanded$;
    this.shown$ = this.pgService.qcSensorsGroupShown$;
    this.qcshown$ = this.pgService.qcCriticalFacilitiesShown$;
    this.qcexpanded$ = this.pgService.qcCriticalFacilitiesExpanded$;
    this.qcbshown$ = this.pgService.qcMunicipalBoundaryShown$;
    this.qcbexpanded$ = this.pgService.qcMunicipalBoundaryExpanded$;
    this.brgyShown$ = this.pgService.barangayBoundaryShown$;
    this.brgyExpanded$ = this.pgService.barangayExpanded$;
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
      this.ModalService.disclaimerModalOpen();
    }
    if (discStatus == 'false') {
      this.ModalService.disclaimerModalClose();
    }
    //this.ModalService.disclaimerModalOpen();
  }
}
