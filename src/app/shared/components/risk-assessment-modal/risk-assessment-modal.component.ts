import { Component, OnInit } from '@angular/core';
import { RiskModalService } from '@features/noah-playground/services/risk-modal.service';

@Component({
  selector: 'noah-risk-assessment-modal',
  templateUrl: './risk-assessment-modal.component.html',
  styleUrls: ['./risk-assessment-modal.component.scss'],
})
export class RiskAssessmentModalComponent implements OnInit {
  active_status = 1;
  riskModal = false;
  constructor(private riskModalService: RiskModalService) {}
  summaryModal: boolean;

  ngOnInit(): void {
    this.riskModalService.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });
  }

  closeModal() {
    this.riskModalService.closeRiskModal();
  }

  viewSummary() {
    this.summaryModal = true;
  }
}
