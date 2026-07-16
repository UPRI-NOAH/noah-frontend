import { Component, OnInit } from '@angular/core';
import { RiskAssessmentService } from '@features/noah-playground/services/risk-assessment.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'noah-risk-assessment-data-archive',
  templateUrl: './risk-assessment-data-archive.component.html',
  styleUrls: ['./risk-assessment-data-archive.component.scss'],
})
export class RiskAssessmentDataArchiveComponent implements OnInit {
  selectedDate: string = ''; // Bound to the date picker (YYYY-MM-DD)
  allResults: any[] = []; // Raw results from API
  selectedResults: any[] = []; // Filtered results for the currently selected date
  availableDates: string[] = []; // Unique dates sorted newest to oldest
  earliestDate: string = ''; // YYYY-MM-DD
  latestDate: string = ''; // YYYY-MM-DD

  constructor(private riskAssessment: RiskAssessmentService) {}

  ngOnInit(): void {
    this.archiveData();
  }

  async archiveData() {
    try {
      const response: any = await this.riskAssessment
        .archiveData()
        .pipe(first())
        .toPromise();

      if (response && response.results) {
        this.allResults = response.results;

        // Extract unique YYYY-MM-DD dates from the datetime strings
        const datesSet = new Set<string>();
        this.allResults.forEach((item) => {
          if (item.datetime) {
            datesSet.add(item.datetime.split('T')[0]);
          }
        });

        this.availableDates = Array.from(datesSet).sort((a, b) =>
          b.localeCompare(a)
        );

        if (this.availableDates.length > 0) {
          this.selectedDate = this.availableDates[0];
          this.earliestDate =
            this.availableDates[this.availableDates.length - 1];
          this.latestDate = this.availableDates[0];
        }

        this.onDateChange();
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
    }
  }

  onDateChange(): void {
    if (this.selectedDate) {
      this.selectedResults = this.allResults.filter(
        (item) => item.datetime && item.datetime.startsWith(this.selectedDate)
      );
    } else {
      this.selectedResults = [];
    }
  }

  get currentIndex(): number {
    return this.availableDates.indexOf(this.selectedDate);
  }

  get hasDate(): boolean {
    return this.currentIndex !== -1;
  }

  get isLatest(): boolean {
    return this.currentIndex === 0 || this.availableDates.length === 0;
  }

  get isEarliest(): boolean {
    return (
      this.currentIndex === this.availableDates.length - 1 ||
      this.availableDates.length === 0
    );
  }

  goToLatest(): void {
    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[0];
      this.onDateChange();
    }
  }

  goToNextDay(): void {
    const idx = this.currentIndex;
    if (idx > 0) {
      this.selectedDate = this.availableDates[idx - 1];
      this.onDateChange();
    }
  }

  goToPreviousDay(): void {
    const idx = this.currentIndex;
    if (idx !== -1 && idx < this.availableDates.length - 1) {
      this.selectedDate = this.availableDates[idx + 1];
      this.onDateChange();
    }
  }

  goToEarliest(): void {
    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[this.availableDates.length - 1];
      this.onDateChange();
    }
  }

  downloadData(result: any) {
    if (result && result.s3_link) {
      window.open(result.s3_link, '_blank');
    } else {
      console.error('Selected result is missing s3_link');
    }
  }

  downloadAll(): void {
    if (!this.selectedDate || this.selectedResults.length === 0) return;
    console.log('Downloading ZIP for date:', this.selectedDate);
    // Add logic to package/download ZIP
  }
}
