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
import { Observable, EMPTY } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  @Input() name: RiskExposureType;

  selectedRiskExposure$: Observable<RiskExposureType>;
  exposureShown$: Observable<boolean>;

  affectedShown$: Observable<boolean>;
  riskExposureShown$: Observable<boolean>;

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  checkedRain = false;
  checkedExp = false;
  checkedShown = false;
  isRadioEnabled = false;
  isCheckedExp = false;
  isButtonEnabled = false;
  isCheckedRain = false;

  btnPopulation = true;
  btnBuildings: boolean;
  raBtnPopu: boolean;
  raBtnBldg: boolean;

  constructor(
    private pgService: NoahPlaygroundService,
    private riskModalService: RiskModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskExposureExpanded$;
    this.shown$ = this.pgService.riskAssessmentGroupShown$;
    this.exposureShown$ = this.pgService.riskExposureShown$;
    this.affectedShown$ = this.pgService.affectedExposureShown$;
    this.riskExposureShown$ = this.pgService.riskExposureShown$;
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

    if (!this.checkedExp) {
      this.pgService.toggleAffectedExposureGroupVisibilityFalse();
      this.raBtnBldg = false;
      this.raBtnPopu = false;
    }

    this.pgService.toggleRiskExposureGroupVisibility();
    this.updateButtonEnabled();
    const selectedExpoType$ = this.pgService.selectedRiskExposure$.pipe(
      shareReplay(1)
    );
    selectedExpoType$
      .pipe(
        switchMap((selectedExpoType: 'population' | 'buildings') => {
          if (selectedExpoType === 'population') {
            this.btnPopulation = true;
            this.btnBuildings = false;
            return EMPTY;
          } else if (selectedExpoType === 'buildings') {
            this.btnPopulation = false;
            this.btnBuildings = true;
            return EMPTY;
          } else {
            // Handle other cases or provide a default action if needed
            return EMPTY;
          }
        })
      )
      .subscribe();
  }

  updateButtonEnabled() {
    this.isButtonEnabled =
      this.checkedExp && this.checkedRain && this.checkedShown;
  }

  calculateRiskPopu() {
    this.riskModalService.closeBtnRa();
    this.pgService.toggleAffectedExposureGroupVisibilityTrue();
    this.riskModalService.openRiskModal();
    this.raBtnPopu = true;
    this.raBtnBldg = false;
  }

  calculateRiskBldg() {
    this.riskModalService.closeBtnRa();
    this.pgService.toggleAffectedExposureGroupVisibility();
    this.riskModalService.openAffectedBuildings();
    this.raBtnBldg = true;
    this.raBtnPopu = false;
  }

  openRaModalBldg() {
    this.riskModalService.openAffectedBuildings();
  }
  openRaModalPopu() {
    this.riskModalService.openRiskModal();
  }

  closeRiskBtn() {
    this.raBtnPopu = false;
    this.raBtnBldg = false;
    this.riskModalService.closeAffectedBuildings();
    this.riskModalService.closeBtnRa();
    this.pgService.toggleAffectedExposureGroupVisibilityFalse();
  }
}
