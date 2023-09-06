import { Component, OnInit } from '@angular/core';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  RiskAssessmentExposureType,
  RiskAssessmentRainType,
} from '@features/noah-playground/store/noah-playground.store';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRainTypeList: RiskAssessmentRainType[] = ['rain-forecast'];
  riskAssessmentExposureTypeList: RiskAssessmentExposureType[] = ['population'];

  expanded$: Observable<boolean>;
  riskAssessmentPopuShown$: Observable<boolean>;
  shown$: Observable<boolean>;

  isButtonEnabled = false;
  checkedRain = false;
  checkedPopu = false;
  checkedShown = false;

  raBtnPopu: boolean;

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.raBtnPopu = false;
    this.expanded$ = this.pgService.riskAssessmentGroupExpanded$.pipe(
      shareReplay(1)
    );
    this.shown$ = this.pgService.riskAssessmentGroupShown$.pipe(shareReplay(1));
    this.pgService.riskAssessmentPopuShown$;
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.pgService.toggleRiskAssessmentGroupProperty('expanded');
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.checkedShown = (event.target as HTMLInputElement).checked;
    this.pgService.toggleRiskAssessmentGroupProperty('shown');
    this.updateButtonEnabled();
  }

  toggleRain(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedRain = (events.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
  }

  togglePopu(events: Event) {
    events.stopPropagation();
    events.stopImmediatePropagation();
    this.checkedPopu = (events.target as HTMLInputElement).checked;
    this.updateButtonEnabled();
  }

  calculateRisk() {
    this.modalService.openRiskModal();
    this.raBtnPopu = false;
  }

  updateButtonEnabled() {
    this.isButtonEnabled =
      this.checkedPopu && this.checkedRain && this.checkedShown;
  }

  closeBtnRisk() {
    this.raBtnPopu = false;
  }
}
