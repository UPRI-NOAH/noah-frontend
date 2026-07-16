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
  showSelect = false;
  archieveDateTime: string;
  archieveDownload: string;
  dropdown: string[] = [];

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
    this.archiveData();
  }

  showSelectDate() {
    this.showSelect = !this.showSelect;
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
