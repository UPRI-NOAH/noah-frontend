import { Component, OnInit } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-new-modal',
  templateUrl: './risk-assessment-new-modal.component.html',
  styleUrls: ['./risk-assessment-new-modal.component.scss'],
})
export class RiskAssessmentNewModalComponent implements OnInit {
  activeTab: 'barangays' | 'province' | 'archive' | 'summary';
  riskModal = false;
  dateDataText: string;
  lastUpdatedText: string;
  mobileDisclaimer = false;
  btnReadMore = true;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private modalServices: ModalService,
    private pgService: NoahPlaygroundService
  ) {}

  ngOnInit(): void {
    this.activeTab = 'barangays';
    this.modalServices.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });

    this.loadDateText();
  }

  loadDateText(): void {
    this.riskAssessment.getDateText().subscribe((data: string) => {
      this.dateDataText = data;
      const safeDateStr = data.replace(' - ', ' ');

      const lastUpdatedDate = new Date(safeDateStr);
      const now = new Date();

      const diffInMs = now.getTime() - lastUpdatedDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        this.lastUpdatedText = `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
      } else if (diffInHours > 0) {
        this.lastUpdatedText = `${diffInHours} hr${diffInHours > 1 ? 's' : ''}`;
      } else if (diffInMinutes > 0) {
        this.lastUpdatedText = `${diffInMinutes} min`;
      } else {
        this.lastUpdatedText = `Just now`;
      }
    });
  }

  closeModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.closeBtnRiskAssessment();
    this.modalServices.hideLegend();
    this.pgService.toggleAffectedPopulationVisibilityFalse();
  }

  hideModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.openBtnRiskAssessment();
  }

  mobileDisclaimerSeemore() {
    this.mobileDisclaimer = true;
    this.btnReadMore = false;
  }
}
