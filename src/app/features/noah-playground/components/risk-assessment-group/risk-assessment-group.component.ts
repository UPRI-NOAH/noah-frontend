import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  ExposureType,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment.service';
import { RiskModalService } from '@features/noah-playground/services/risk-modal.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  exposureTypes: ExposureType[] = ['population', 'buildings'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  exposureShown$: Observable<boolean>;
  selectedExposureType$: Observable<ExposureType>;

  checkedRain = false;
  checkedExp = false;
  isRadioEnabled = false;
  isCheckedExp = false;
  constructor(
    private pgService: NoahPlaygroundService,
    private riskModalService: RiskModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskAssessmentExpanded$;
    this.shown$ = this.pgService.riskAssessmentShown$;
    this.exposureShown$ = this.pgService.exposureShown$;
    this.selectedExposureType$ = this.pgService.selectedExposureType$;
  }

  toggleExpansion() {
    this.pgService.toggleRiskAssessmentExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleRiskAssessmentGroupShown();
  }

  selectExposure(type: ExposureType) {
    this.pgService.selectExposureType(type);
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
    this.pgService.toggleExposureTypeVisibility();
    this.checkedExp = (events.target as HTMLInputElement).checked;
    this.updateRadioEnabled();
  }

  updateRadioEnabled() {
    this.isRadioEnabled = this.checkedRain && this.checkedExp;
  }

  openModalRisk() {
    this.riskModalService.openRiskModal();
  }
}
