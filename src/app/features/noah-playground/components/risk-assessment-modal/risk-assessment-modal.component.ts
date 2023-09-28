import { Component, OnInit } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { first } from 'rxjs/operators';
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

  currentPage = 1;
  itemsPerPage = 20;
  totalPages: number = 0;
  totalItems = 0;
  totalDataCount = 0;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private modalServices: ModalService,
    private pgService: NoahPlaygroundService
  ) {}

  columns = [
    {
      key: 'brgy',
      header: 'Barangay',
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

    this.loadData(this.currentPage);
  }

  async loadData(page: number) {
    const response: any = await this.riskAssessment
      .getAffectedPopulations(page)
      .pipe(first())
      .toPromise();
    const raData = response.results.map((a) => {
      return {
        brgy: a.brgy,
        total_pop: a.total_pop,
        total_aff_pop: a.total_aff_pop,
        exposed_medhigh: a.exposed_medhigh,
        perc_aff_medhigh: a.perc_aff_medhigh,
      };
    });
    this.currentPage = page;
    this.totalPages = raData.total_pages;
    this.affectedData = raData; // displaying data
    this.totalDataCount = response.count; // displaying over all total data for pagination
  }

  loadNextPage() {
    // Load the next page of data
    this.riskAssessment.loadNextPage().subscribe((response) => {
      // Append the new data to the existing data
      this.affectedData = this.affectedData.concat(response.results);
    });
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
