import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
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
  private currentPage = 1;
  private API_BASE_URL = 'http://cf90-180-195-114-49.ngrok.io';
  private nextPageUrl: string | null = null;
  private previousPageUrl: string | null = null;

  getAffectedPopulations(page?: number, brgy?: string): Observable<any> {
    let url = `${this.API_BASE_URL}/affected_brgy/?affected=yes`;

    // Add the brgy parameter if it's provided
    if (brgy) {
      url += `&search=${brgy}`;
    }

    // Add the page parameter if it's provided
    if (page) {
      url += `&page=${page}`;
    }

    return this.http.get(url).pipe(
      tap((response: any) => {
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
      })
    );
  }
}
