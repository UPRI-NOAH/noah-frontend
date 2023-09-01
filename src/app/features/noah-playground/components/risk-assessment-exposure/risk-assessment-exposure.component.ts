import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { RiskAssessmentExposureType } from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-exposure',
  templateUrl: './risk-assessment-exposure.component.html',
  styleUrls: ['./risk-assessment-exposure.component.scss'],
})
export class RiskAssessmentExposureComponent implements OnInit {
  @Input() exposureRiskType: RiskAssessmentExposureType;
  shown = false;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getExposureRiskAssessment$(this.exposureRiskType)
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
