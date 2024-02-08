import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export type AffectedData = {
  prov: string;
  muni: string;
  brgy: string;
  total_pop: number;
  total_aff_pop: number;
  exposed_medhigh: number;
  perc_aff_medhigh: number;
};
@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService {
  constructor(private http: HttpClient) {}
  private API_BASE_URL = 'https://panahon.up.edu.ph';
  private nextPageUrl: string | null = null;
  private previousPageUrl: string | null = null;
  private defaultUrl: string = `${this.API_BASE_URL}/affected_brgy/?affected=yes`;
  private S3_BASE_URL = 'https://upri-noah.s3.ap-southeast-1.amazonaws.com';

  // Track the search term
  private currentSearchTerm: string | null = null;

  getAffectedPopulations(page?: number, searchTerm?: string): Observable<any> {
    let url = this.defaultUrl; // Start with the default URL

    // Update the current search term when provided
    if (searchTerm !== undefined) {
      this.currentSearchTerm = searchTerm;
    }

    // Modify the URL if there is a non-empty search term
    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      url += `&search=${this.currentSearchTerm}`;
    }

    // Add the page parameter if it's provided
    if (page) {
      url += `&page=${page}`;
    }

    return this.http.get(url).pipe(
      tap((response: any) => {
        // Update next and previous page URLs from the API response
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
      })
    );
  }

  getDateText(): Observable<string> {
    return this.http.get(`${this.S3_BASE_URL}/rainfall/datetime.txt`, {
      responseType: 'text',
    });
  }

  archiveData(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/api/latest-results/`);
  }
}
