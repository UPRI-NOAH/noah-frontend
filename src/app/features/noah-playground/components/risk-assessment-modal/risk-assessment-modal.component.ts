import { Component, OnInit } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import { ModalService } from '@features/noah-playground/services/modal.service';

@Component({
  selector: 'noah-risk-assessment-modal',
  templateUrl: './risk-assessment-modal.component.html',
  styleUrls: ['./risk-assessment-modal.component.scss'],
})
export class RiskAssessmentModalComponent implements OnInit {
  affectedData: AffectedData[] = [];
  riskModal = false;
  searchValue: string;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private modalServices: ModalService
  ) {}

  ngOnInit(): void {
    this.modalServices.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });
    this.riskAssessment.getAffectedPopulation().subscribe((response) => {
      this.affectedData = response;
    });
  }

  closeModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.closeBtnRiskAssessment();
  }
  hideModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.openBtnRiskAssessment();
  }
}
