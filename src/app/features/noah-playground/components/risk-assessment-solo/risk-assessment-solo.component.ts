import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { ExposureType } from '@features/noah-playground/services/risk-assessment.service';
import { RiskAssessment } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const RISKASSESSMENT_NAMES: Record<RiskAssessment, string> = {
  rain: 'Rain',
};

export const EXPOSURE_NAMES: Record<ExposureType, string> = {
  population: 'Population',
  buildings: 'Buildings',
};

@Component({
  selector: 'noah-risk-assessment-solo',
  templateUrl: './risk-assessment-solo.component.html',
  styleUrls: ['./risk-assessment-solo.component.scss'],
})
export class RiskAssessmentSoloComponent implements OnInit {
  @Input() riskAssessmentType: RiskAssessment;
  @Input() exposureType: ExposureType;

  shown$: Observable<boolean>;
  fetchFailed: boolean;

  exposureShown$: Observable<boolean>;

  private _unsub = new Subject();

  get riskAssessmentName(): string {
    return RISKASSESSMENT_NAMES[this.riskAssessmentType];
  }
  get exposureName(): string {
    return EXPOSURE_NAMES[this.exposureType];
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    // this.shown$ = this.pgService.getRiskAssessmentTypeShown$(
    //   this.riskAssessmentType
    // );

    this.exposureShown$ = this.pgService.getExposureTypeShown$(
      this.exposureType
    );
    // this.pgService
    //   .getExposureTypesFetched$(this.exposureType)
    //   .pipe(takeUntil(this._unsub))
    //   .subscribe((fetched) => {
    //     this.fetchFailed = !fetched;
    //   });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  toggleShown() {
    //this.pgService.setRiskAssessmentTypeShown(this.riskAssessmentType);
    // if (this.fetchFailed) return;
  }
}
