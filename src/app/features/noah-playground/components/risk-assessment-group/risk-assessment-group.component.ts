import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  ExposureType,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment.service';
import { RiskModalService } from '@features/noah-playground/services/risk-modal.service';
import {
  RiskGroupType,
  ExposureTypes,
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
  @Input() exposure: ExposureTypes;

  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  exposureTypes: ExposureType[] = ['population', 'buildings'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;
  exposureShown$: Observable<boolean>;
  selectedExposureType$: Observable<ExposureType>;

  exposurePopulationShown$: Observable<boolean>;

  selectedRisk$: Observable<RiskGroupType>;

  checkedRain = false;
  checkedExp = false;
  isRadioEnabled = false;
  isCheckedExp = false;

  shownExpo$: Observable<boolean>;

  get exposureTypesName(): string {
    return EXPORT_TYPE_NAME[this.exposure];
  }

  constructor(
    private pgService: NoahPlaygroundService,
    private riskModalService: RiskModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskAssessmentExpanded$;
    this.shown$ = this.pgService.riskAssessmentShown$;
    this.exposureShown$ = this.pgService.exposureShown$;
    this.selectedExposureType$ = this.pgService.selectedExposureType$;
    this.exposurePopulationShown$ = this.pgService.exposureTypeShown$;

    this.selectedRisk$ = this.pgService.selectRisk$;
    this.shownExpo$ = this.pgService.getExposure$(this.exposure);
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
    //this.pgService.selectRiskType(exposureType)
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
