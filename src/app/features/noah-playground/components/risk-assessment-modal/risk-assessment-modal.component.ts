import { Component, OnInit } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';

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
    private modalServices: ModalService,
    private pgService: NoahPlaygroundService
  ) {}

  columns = [
    {
      key: 'prov',
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
      key: 'total_pop',
      header: 'Total Population',
    },
    {
      key: 'total_aff_pop',
      header: 'Total Affected Population',
    },
    {
      key: 'exposed_medhigh',
      header: 'Exposed to Med-High Hazard',
    },
    {
      key: 'perc_aff_medhigh',
      header: 'Percentage of Exposed to Med-High',
    },
  ];

  ngOnInit(): void {
    this.modalServices.riskModal$.subscribe((riskModal) => {
      this.riskModal = riskModal;
    });
    this.riskAssessment.getAffectedPopulation().subscribe((results) => {
      // Assuming response is a JSON string representing an array of AffectedData
      try {
        this.affectedData = results;
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });

    this.riskAssessment.getAffectedPopulations().subscribe(
      (data) => {
        console.log(data);
        // Handle the data as needed
      },
      (error) => {
        console.error('Error:', error);
        // Handle errors
      }
    );
  }

  closeModal() {
    this.modalServices.closeRiskModal();
    this.modalServices.closeBtnRiskAssessment();
    this.pgService.toggleAffectedPopulationVisibilityFalse();
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
