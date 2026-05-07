import { Component, OnInit } from '@angular/core';
import {
  AffectedData,
  RiskAssessmentService,
} from '@features/noah-playground/services/risk-assessment.service';
import {
  IbffSummaryService,
  ForecastSummaryOutput,
  ForecastSummaryInput,
} from '@features/noah-playground/services/ibff-summary.service';
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
  sortField = '';
  sortDirection = 'descending';

  currentPage = 1;
  itemsPerPage = 20;
  totalPages: number = 0;
  totalItems = 0;
  totalDataCount = 0;
  errorMsg: boolean = false;
  noResult: boolean = false;
  mobileDisclaimer: boolean = false;
  btnReadMore: boolean = true;
  dateDataText: string;
  showSelect: boolean = false;
  showSort: boolean = false;

  archieveDateTime: string;
  archieveDownload: string;
  dropdown: string[] = [];

  summaryLoading: boolean = false;
  summaryResult: ForecastSummaryOutput | null = null;
  summaryError: string | null = null;
  summaryPanelOpen: boolean = false;

  constructor(
    private riskAssessment: RiskAssessmentService,
    private ibffSummary: IbffSummaryService,
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
    this.loadDateText();
    this.archiveData();
  }

  showSelectDate() {
    this.showSelect = !this.showSelect;
  }

  showSortDropdown() {
    this.showSort = !this.showSort;
  }

  async downloadData(selectedDate: string) {
    try {
      const response: any = await this.riskAssessment
        .archiveData()
        .pipe(first())
        .toPromise();
      if (response && response.results) {
        const selectedResult = response.results.find(
          (result: any) => result.datetime === selectedDate
        );

        if (selectedResult && selectedResult.s3_link) {
          window.open(selectedResult.s3_link, '_blank');
        } else {
          console.error('Selected date not found or missing s3_link');
        }
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
    }
  }

  onDateSelected(selectedDate: string) {
    if (selectedDate !== 'select-date') {
      this.downloadData(selectedDate).then(() => {
        this.showSelect = false;
      });
    }
  }

  async archiveData() {
    const response: any = await this.riskAssessment
      .archiveData()
      .pipe(first())
      .toPromise();
    if (response && response.results) {
      const datetimes = response.results.map((result: any) => result.datetime);
      this.dropdown = datetimes;
    }
  }

  loadDateText(): void {
    this.riskAssessment.getDateText().subscribe((data: string) => {
      this.dateDataText = data;
    });
  }
  async loadData(page: number, searchTerm?: string) {
    try {
      const response: any = await this.riskAssessment
        .getAffectedPopulations(page, searchTerm)
        //.getAffectedPopulations(page, searchTerm)
        .pipe(first())
        .toPromise();

      if (searchTerm && response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = false;
        this.noResult = true;
      } else if (response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = true;
        this.noResult = false;
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
        this.errorMsg = false;
        this.noResult = false;
      }
    } catch (error) {
      console.error('An error occurred:', error);
      this.affectedData = [];
      this.errorMsg = true;
      this.noResult = false;
    }
  }

  toggleSummaryPanel() {
    this.summaryPanelOpen = !this.summaryPanelOpen;
  }

  generateSummary() {
    this.summaryLoading = true;
    this.summaryError = null;
    this.summaryPanelOpen = true;

    const input = this.buildSummaryInput(
      this.affectedData,
      this.totalDataCount
    );

    this.ibffSummary
      .generateSummary(input)
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.summaryResult = result;
          this.summaryLoading = false;
        },
        error: () => {
          this.summaryError =
            'Unable to reach the summarization service. Please ensure the backend is running on http://localhost:8080.';
          this.summaryLoading = false;
        },
      });
  }

  private buildSummaryInput(
    records: AffectedData[],
    totalCount: number
  ): ForecastSummaryInput {
    const provinceMap = new Map<string, number>();
    const municipalitySet = new Set<string>();

    for (const item of records) {
      if (item.prov) {
        provinceMap.set(item.prov, (provinceMap.get(item.prov) ?? 0) + 1);
      }
      if (item.muni && item.prov) {
        municipalitySet.add(`${item.muni}||${item.prov}`);
      }
    }

    const topAreas = Array.from(provinceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([province, count]) => ({ province, affected_barangays: count }));

    return {
      forecast_timestamp: this.dateDataText || 'not available',
      model_run: this.parseModelRun(this.dateDataText),
      affected_barangays: totalCount,
      affected_municipalities: municipalitySet.size,
      affected_provinces: provinceMap.size,
      top_areas: topAreas,
      highest_hazard_level: 'High',
      notes: [
        'Counts exclude barangays tagged Little to None.',
        'Exposure is based on intersection with NOAH flood hazard layers.',
      ],
    };
  }

  private parseModelRun(dateText: string): string {
    if (!dateText) return 'Latest';
    const match = dateText.match(/(\d{2}):(\d{2})/);
    if (!match) return 'Latest';
    const hour = parseInt(match[1], 10);
    const utcHour = (hour - 8 + 24) % 24;
    return `${String(utcHour).padStart(2, '0')}Z`;
  }

  closeModal() {
    this.summaryResult = null;
    this.summaryError = null;
    this.summaryPanelOpen = false;
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
