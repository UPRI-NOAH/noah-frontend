import { Component, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  RISK_ASSESSMENT,
  RiskAssessmentType,
} from '@features/noah-playground/services/risk-assessment-services.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'noah-risk-assessment-group',
  templateUrl: './risk-assessment-group.component.html',
  styleUrls: ['./risk-assessment-group.component.scss'],
})
export class RiskAssessmentGroupComponent implements OnInit {
  riskAssessmentRain: RiskAssessmentType[] = ['rain'];
  riskAssessmentExp: RiskAssessmentType[] = ['exposure'];
  riskAssessmentBuildings: RiskAssessmentType[] = ['buildings'];
  riskAssessmentPopulation: RiskAssessmentType[] = ['population'];

  expanded$: Observable<boolean>;
  shown$: Observable<boolean>;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.expanded$ = this.pgService.riskAssessmentExpanded$;
    this.shown$ = this.pgService.riskAssessmentShown$;
  }

  toggleExpansion() {
    this.pgService.toggleRiskAssessmentExpanded();
  }

  toggleShown(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.pgService.toggleRiskAssessmentGroupShown();
  }
}
