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
  errorMsg: string = '';
  mobileDisclaimer: boolean = false;
  btnReadMore: boolean = true;

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
    {
      key: 'muni',
      header: 'Municipality',
    },
    {
      key: 'prov',
      header: 'Provincial',
    },
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

  async loadData(page: number, searchTerm?: string) {
    try {
      const response: any = await this.riskAssessment
        .getAffectedPopulations(page, searchTerm)
        .pipe(first())
        .toPromise();

      if (response.results.length === 0) {
        this.affectedData = [];
      } else {
        const raData = response.results.map((a) => {
          return {
            brgy: a.brgy,
            muni: a.muni,
            prov: a.prov,
            total_pop: a.total_pop,
            total_aff_pop: a.total_aff_pop,
            exposed_medhigh: a.exposed_medhigh,
            perc_aff_medhigh: a.perc_aff_medhigh,
          };
        });
        this.currentPage = page;
        this.affectedData = raData;
        this.totalDataCount = response.count;
      }
    } catch (error) {
      console.error('An error occurred:', error);
      this.affectedData = [];
      this.errorMsg = 'An error occurred while fetching data';
    }
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
