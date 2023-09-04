import { Component, OnInit } from '@angular/core';
import { RiskAssessmentService } from '@features/noah-playground/services/risk-assessment.service';

@Component({
  selector: 'noah-risk-assessment-modal',
  templateUrl: './risk-assessment-modal.component.html',
  styleUrls: ['./risk-assessment-modal.component.scss'],
})
export class RiskAssessmentModalComponent implements OnInit {
  affectedData: Array<any> = [];

  constructor(private riskAssessment: RiskAssessmentService) {
    this.riskAssessment.getAffectedPopulation().subscribe((response) => {
      console.log(response);
      this.affectedData = response;
    });
  }

  ngOnInit(): void {}
}
