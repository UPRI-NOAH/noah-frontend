import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  ExposureType,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment.service';
import { RiskModalService } from '@features/noah-playground/services/risk-modal.service';
import {
  ExposureTypes,
  RiskExposureType,
  RISK_NAME,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable, of } from 'rxjs';

export const EXPORT_TYPE_NAME: Record<ExposureTypes, string> = {
  population: 'Population',
  buildings: 'Buildings',
};

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  names: RiskExposureType[] = ['population', 'building'];

  exposureType = RISK_NAME;

  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  exposureTypes: ExposureType[] = ['population', 'buildings'];

  selectedRiskExposure$: Observable<RiskExposureType>;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  exposureShown$: Observable<boolean>;
  selectedExposureType$: Observable<ExposureType>;

  exposurePopulationShown$: Observable<boolean>;

  checkedRain = false;
  checkedExp = false;
  isRadioEnabled = false;
  isCheckedExp = false;

  shownExpo$: Observable<boolean>;
  constructor(
    private pgService: NoahPlaygroundService,
    private riskModalService: RiskModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskExposureExpanded$;
    //this.shown$ = this.pgService.riskAssessmentShown$;
  }

  toggleExpansion() {
    this.pgService.toggleRiskExposureGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleAllRiskExposureVisibility();
  }

  toggleRain(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedRain = (events.target as HTMLInputElement).checked;
    this.updateRadioEnabled();
  }

  toggleExposure(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedExp = (events.target as HTMLInputElement).checked;
    this.updateRadioEnabled();

    this.pgService.toggleRiskExposureGroupVisibility();
  }

  updateRadioEnabled() {
    this.isRadioEnabled = this.checkedRain && this.checkedExp;
  }

  openModalRisk() {
    this.riskModalService.openRiskModal();
  }
}
