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
  searchValue: string = '';

  sortField = 'perc_aff_medhigh';
  sortDirection = 'descending';

  currentPage = 1;
  itemsPerPage = 10;
  totalDataCount = 0;

  errorMsg: boolean = false;
  noResult: boolean = false;
  showSort: boolean = false;

  redLevel = 60;
  orangeLevel = 35;

  columns = [
    { key: 'brgy', header: 'Barangay', widthClass: 'w-[15%]' },
    { key: 'muni', header: 'Municipality', widthClass: 'w-[15%]' },
    { key: 'prov', header: 'Provincial', widthClass: 'w-[15%]' },
    { key: 'total_pop', header: 'Population', widthClass: 'w-[12.5%]' },
    { key: 'total_aff_pop', header: 'Affected Pop.', widthClass: 'w-[12.5%]' },
    {
      key: 'exposed_medhigh',
      header: 'Med-High Exposed',
      widthClass: 'w-[15%]',
    },
    { key: 'perc_aff_medhigh', header: 'Med-High %', widthClass: 'w-[15%]' },
  ];

  get lastPage(): number {
    return Math.ceil(this.totalDataCount / this.itemsPerPage);
  }

  get currentPageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalDataCount);
  }

  constructor(private riskAssessment: RiskAssessmentService) {}

  ngOnInit(): void {
    this.loadData(1);
  }

  async loadData(page: number, searchTerm?: string) {
    if (searchTerm !== undefined) {
      this.searchValue = searchTerm;
    }

    try {
      const response: any = await this.riskAssessment
        .getAffectedPopulations(
          page,
          this.searchValue,
          this.sortField,
          this.sortDirection
        )
        .pipe(first())
        .toPromise();

      if (this.searchValue && response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = false;
        this.noResult = true;
        this.totalDataCount = 0;
      } else if (response.results.length === 0) {
        this.affectedData = [];
        this.errorMsg = true;
        this.noResult = false;
        this.totalDataCount = 0;
      } else {
        this.affectedData = response.results.map((a: any) => ({
          brgy: a.brgy,
          muni: a.muni,
          prov: a.prov,
          region: a.region,
          total_pop: a.total_pop,
          total_aff_pop: a.total_aff_pop,
          exposed_medhigh: a.exposed_medhigh,
          perc_aff_medhigh: a.perc_aff_medhigh,
        }));

        this.currentPage = page;
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

  asterisk(province: string): string {
    return province.replace(/ \(Not a Province\)$/, '*');
  }

  onHeaderColumnClick(field: string) {
    if (this.sortField === field) {
      this.sortDirection =
        this.sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      this.sortField = field;
      this.sortDirection = ['brgy', 'muni', 'prov'].includes(field)
        ? 'ascending'
        : 'descending';
    }
    this.loadData(1);
  }

  showSortDropdown() {
    this.showSort = !this.showSort;
  }
}
