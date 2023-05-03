import { Component, OnInit, Input } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  ExposureType,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment.service';
import { RiskExposureType } from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';

import { first } from 'rxjs/operators';
@Component({
  selector: 'noah-risk-exposure',
  templateUrl: './risk-exposure.component.html',
  styleUrls: ['./risk-exposure.component.scss'],
})
export class RiskExposureComponent implements OnInit {
  names: RiskExposureType[] = ['population', 'building'];

  selectedRiskExposure$: Observable<RiskExposureType>;
  exposureShown$: Observable<boolean>;
  isCheckedExp = false;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // for SOLO
    this.selectedRiskExposure$ = this.pgService.selectedRiskExposure$;
    this.exposureShown$ = this.pgService.riskExposureShown$;
  }

  selectExposure(exposureTypes: RiskExposureType) {
    this.pgService.selectRiskExposure(exposureTypes);
  }

  toggleExposure(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();

    this.pgService.toggleRiskExposureGroupVisibility();
  }
}
