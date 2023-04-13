import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { RiskAssessmentType } from '@features/noah-playground/services/risk-assessment-services.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const RISKASSESSMENT_NAMES: Record<RiskAssessmentType, string> = {
  rain: 'Rain',
  exposure: 'Exposure',
  buildings: 'Buildings',
  population: 'Population',
};

@Component({
  selector: 'noah-risk-assessment-solo',
  templateUrl: './risk-assessment-solo.component.html',
  styleUrls: ['./risk-assessment-solo.component.scss'],
})
export class RiskAssessmentSoloComponent implements OnInit {
  @Input() riskAssessmentType: RiskAssessmentType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;

  private _unsub = new Subject();

  get riskAssessmentName(): string {
    return RISKASSESSMENT_NAMES[this.riskAssessmentType];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.shown$ = this.pgService.getRiskAssessmentTypeShown$(
      this.riskAssessmentType
    );
    this.pgService
      .getRiskAssessmentTypesFetched$(this.riskAssessmentType)
      .pipe(takeUntil(this._unsub))
      .subscribe((fetched) => {
        this.fetchFailed = !fetched;
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    if (this.fetchFailed) return;
    this.pgService.setRiskAssessmentTypeShown(this.riskAssessmentType);
  }
}
