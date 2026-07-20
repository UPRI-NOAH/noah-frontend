import { Component, OnInit } from '@angular/core';
import {
  RiskAssessmentService,
  ProvinceGroup,
} from '@features/noah-playground/services/risk-assessment.service';

@Component({
  selector: 'noah-risk-assessment-by-province',
  templateUrl: './risk-assessment-by-province.component.html',
  styleUrls: ['./risk-assessment-by-province.component.scss'],
})
export class RiskAssessmentByProvinceComponent implements OnInit {
  masterProvinceData: ProvinceGroup[] = [];
  filteredProvinceData: ProvinceGroup[] = [];

  searchValue: string = '';
  isLoading: boolean = false;
  errorMsg: boolean = false;
  noResult: boolean = false;

  redLevel = 60;
  orangeLevel = 35;

  currentPage = 1;
  itemsPerPage = 5;
  totalDataCount = 0;

  get lastPage(): number {
    return Math.ceil(this.totalDataCount / this.itemsPerPage) || 1;
  }

  get currentPageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalDataCount);
  }

  constructor(private riskAssessment: RiskAssessmentService) {}

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData() {
    this.isLoading = true;
    try {
      this.masterProvinceData =
        await this.riskAssessment.getAffectedProvinces();

      this.errorMsg = this.masterProvinceData.length === 0;
    } catch (error) {
      console.error('Failed to fetch province data:', error);
      this.errorMsg = true;
      this.masterProvinceData = [];
    } finally {
      this.isLoading = false;
      this.applyLocalFiltersAndPagination();
    }
  }

  loadData(page: number, searchTerm?: string) {
    if (searchTerm !== undefined) {
      this.searchValue = searchTerm;
      this.currentPage = 1;
    } else {
      this.currentPage = page;
    }

    this.applyLocalFiltersAndPagination();
  }

  applyLocalFiltersAndPagination() {
    if (this.errorMsg) return;

    let outputList = [...this.masterProvinceData];

    if (this.searchValue && this.searchValue.trim() !== '') {
      const term = this.searchValue.toLowerCase();
      outputList = outputList.filter((p) =>
        p.prov.toLowerCase().includes(term)
      );
    }

    this.totalDataCount = outputList.length;
    this.noResult = this.totalDataCount === 0;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredProvinceData = outputList.slice(startIndex, endIndex);
  }
}
