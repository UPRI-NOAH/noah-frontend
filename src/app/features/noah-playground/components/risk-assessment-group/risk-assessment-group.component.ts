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
  shown$: Observable<boolean>;

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskAssessmentGroupExpanded$.pipe(
      shareReplay(1)
    );
    this.shown$ = this.pgService.riskAssessmentGroupShown$.pipe(shareReplay(1));
  }

  toggleExpanded(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleRiskAssessmentGroupProperty('expanded');
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleRiskAssessmentGroupProperty('shown');
  }

  openModalRisk() {
    this.modalService.openRiskModal();
  }
}
