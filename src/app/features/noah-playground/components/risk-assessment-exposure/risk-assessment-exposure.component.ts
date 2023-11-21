import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { RiskAssessmentExposureType } from '@features/noah-playground/store/noah-playground.store';
import { Observable, Subject } from 'rxjs';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { first } from 'rxjs/operators';

export const EXPOSURE_NAME: Record<RiskAssessmentExposureType, string> = {
  population: 'Population',
};

@Component({
  selector: 'noah-risk-assessment-exposure',
  templateUrl: './risk-assessment-exposure.component.html',
  styleUrls: ['./risk-assessment-exposure.component.scss'],
})
export class RiskAssessmentExposureComponent implements OnInit {
  @Input() exposureRiskType: RiskAssessmentExposureType;
  riskExposureShown$: Observable<boolean>;
  shown = false;

  private _unsub = new Subject();

  get exposureName(): string {
    return EXPOSURE_NAME[this.exposureRiskType];
  }

  constructor(
    private pgService: NoahPlaygroundService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.pgService
      .getPopulationExposure$(this.exposureRiskType)
      .pipe(first())
      .subscribe(({ shown }) => {
        this.shown = shown;
      });
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setExposureRiskAssessmentSoloShown(
      this.shown,
      this.exposureRiskType
    );
  }
}
