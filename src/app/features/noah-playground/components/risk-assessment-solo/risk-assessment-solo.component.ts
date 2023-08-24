import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  RiskAssessmentType,
  VolcanoType,
} from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-solo',
  templateUrl: './risk-assessment-solo.component.html',
  styleUrls: ['./risk-assessment-solo.component.scss'],
})
export class RiskAssessmentSoloComponent implements OnInit {
  @Input() riskType: RiskAssessmentType;
  shown = false;

  get displayName(): string {
    return this.riskType.replace('-', ' ');
  }

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getRiskAssessment$(this.riskType)
      .pipe(first())
      .subscribe(({ shown }) => {
        this.shown = shown;
      });
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setRiskAssessmentSoloShown(this.shown, this.riskType);
  }
}
