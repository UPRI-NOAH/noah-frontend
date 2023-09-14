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
  sortField = 'province';
  sortDirection = 'descending';

  constructor(
    private riskAssessment: RiskAssessmentService,
    private modalServices: ModalService
  ) {}

  columns = [
    {
      key: 'province',
      header: 'Province',
    },
    // {
    //   key: 'municipality',
    //   header: 'Municipality',
    // },
    // {
    //   key: 'barangay',
    //   header: 'Barangay',
    // },
    {
      key: 'total_population',
      header: 'Total Population',
    },
    {
      key: 'total_affected_population',
      header: 'Total Affected Population',
    },
    {
      key: 'medium_high',
      header: 'Exposed to Med-High Hazard',
    },
    {
      key: 'percentage_of_affected_medium_high',
      header: 'Percentage of Exposed to Med-High',
    },
  ];

  ngOnInit(): void {
    this.modalServices.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });
    this.riskAssessment.getAffectedPopulation().subscribe((response) => {
      // Assuming response is a JSON string representing an array of AffectedData
      try {
        this.affectedData = response;
      } catch (error) {
        console.error('Error parsing response:', error);
      }
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
  onHeaderColumnClick(field: string) {
    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortField = field;
      this.sortDirection = 'ascending';
    }
  }
}
