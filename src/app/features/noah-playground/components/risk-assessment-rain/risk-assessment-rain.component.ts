import { Component, Input, OnInit } from '@angular/core';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { RiskAssessmentRainType } from '@features/noah-playground/store/noah-playground.store';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-rain',
  templateUrl: './risk-assessment-rain.component.html',
  styleUrls: ['./risk-assessment-rain.component.scss'],
})
export class RiskAssessmentRainComponent implements OnInit {
  @Input() rainRiskType: RiskAssessmentRainType;
  shown = false;

  constructor(private pgService: NoahPlaygroundService) {}

  ngOnInit(): void {
    this.pgService
      .getRainRiskAssessment$(this.rainRiskType)
      .pipe(first())
      .subscribe(({ shown }) => {
        this.shown = shown;
      });
  }

  toggleShown() {
    this.shown = !this.shown;
    this.pgService.setRainRiskAssessmentSoloShown(
      this.shown,
      this.rainRiskType
    );
  }
}
