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

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  @Input() name: RiskExposureType;

  selectedRiskExposure$: Observable<RiskExposureType>;
  opacityValue: number = 100;
  exposureShown$: Observable<boolean>;

  affectedShown$: Observable<boolean>;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  checkedRain = false;
  checkedExp = false;
  checkedShown = false;
  isRadioEnabled = false;
  isCheckedExp = false;
  isButtonEnabled = false;
  isCheckedRain = false;

  constructor(
    private pgService: NoahPlaygroundService,
    private riskModalService: RiskModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskExposureExpanded$;
    this.shown$ = this.pgService.riskAssessmentGroupShown$;
    this.exposureShown$ = this.pgService.riskExposureShown$;
    this.affectedShown$ = this.pgService.affectedExposureShown$;
    this.opacityValue = this.pgService.getRiskExposureOpacity(this.name);
  }

  changeOpacity(opacity: number) {
    this.pgService.setRiskExposureOpacity(opacity, this.name);
  }

  toggleExpansion() {
    this.pgService.toggleRiskExposureGroupExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.checkedShown = (event.target as HTMLInputElement).checked;
    this.pgService.toggleExposureGroupShown();
    this.updateButtonEnabled();
  }

  toggleRain(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedRain = (events.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
  }

  toggleExposure(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedExp = (events.target as HTMLInputElement).checked;
    this.pgService.toggleRiskExposureGroupVisibility();
    this.updateButtonEnabled();
  }

  updateButtonEnabled() {
    this.isButtonEnabled =
      this.checkedExp && this.checkedRain && this.checkedShown;
  }

  openModalRisk() {
    this.riskModalService.openRiskModal();
    this.riskModalService.closeBtnRa();
    this.pgService.toggleAffectedExposureGroupVisibility();
  }
}
