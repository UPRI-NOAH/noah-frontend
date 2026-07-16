import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';

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
  private S3_BASE_URL = 'https://webgis-static.up.edu.ph/api';

  // Track the search term
  private currentSearchTerm: string | null = null;

  getAffectedPopulations(
    page?: number,
    searchTerm?: string,
    sortField?: string,
    sortDirection?: string
  ): Observable<any> {
    let url = this.defaultUrl;

    if (searchTerm !== undefined) {
      this.currentSearchTerm = searchTerm;
    }

    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
      url += `&search=${this.currentSearchTerm}`;
    }

    if (page) {
      url += `&page=${page}`;
    }

    if (sortField) {
      const ordering =
        sortDirection === 'ascending' ? sortField : `-${sortField}`;
      url += `&ordering=${ordering}`;
    }

    return this.http.get(url).pipe(
      tap((response: any) => {
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
