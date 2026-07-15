import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import {
  RiskAssessmentService,
  AffectedData,
} from '@features/noah-playground/services/risk-assessment.service';

@Component({
  selector: 'noah-risk-assessment-affected-barangays',
  templateUrl: './risk-assessment-affected-barangays.component.html',
  styleUrls: ['./risk-assessment-affected-barangays.component.scss'],
})
export class RiskAssessmentAffectedBarangaysComponent implements OnInit {
  affectedData: AffectedData[] = [];
  searchValue: string;
  sortField = 'perc_aff_medhigh';
  sortDirection = 'ascending';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages: number = 0;
  totalItems = 0;
  totalDataCount = 0;
  errorMsg: boolean = false;
  noResult: boolean = false;
  showSort: boolean = false;
  redLevel = 60;
  orangeLevel = 35;

  columns = [
    {
      key: 'brgy',
      header: 'Barangay',
      widthClass: 'w-[15%]',
    },
    {
      key: 'muni',
      header: 'Municipality',
      widthClass: 'w-[15%]',
    },
    {
      key: 'prov',
      header: 'Provincial',
      widthClass: 'w-[15%]',
    },
    {
      key: 'total_pop',
      header: 'Population',
      widthClass: 'w-[12.5%]',
    },
    {
      key: 'total_aff_pop',
      header: 'Affected Pop.',
      widthClass: 'w-[12.5%]',
    },
    {
      key: 'exposed_medhigh',
      header: 'Med-High Exposed',
      widthClass: 'w-[15%]',
    },
    {
      key: 'perc_aff_medhigh',
      header: 'Med-High %',
      widthClass: 'w-[15%]',
    },
  ];

  get lastPage(): number {
    return Math.ceil(this.totalDataCount / this.itemsPerPage);
  }

  get currentPageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalDataCount);
  }

  async loadData(page: number, searchTerm?: string) {
    try {
      const response: any = await this.riskAssessment
        .getAffectedPopulations(
          page,
          searchTerm,
          this.sortField,
          this.sortDirection
        )
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

  showSortDropdown() {
    this.showSort = !this.showSort;
  }

  onHeaderColumnClick(field: string) {
    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortField = field;
      this.sortDirection = 'ascending';
    }
    this.loadData(1);
  }

  constructor(private riskAssessment: RiskAssessmentService) {}

  ngOnInit(): void {
    this.loadData(1);
  }
}
