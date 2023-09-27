import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type AffectedData = {
  prov: string;
  municipality: string;
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
  private NGROK_BASE_URL = 'http://9def-136-158-11-8.ngrok.io';

  getAffectedPopulation(): Observable<any> {
    return this.http.get(
      'https://upri-noah.s3.ap-southeast-1.amazonaws.com/4As/prov_rankings.json'
    );
  }

  //https://e1f6-136-158-11-135.ngrok-free.app/api/affected_brgy/?affected=yes

  getAffectedPopulations(page: number): Observable<any> {
    // Add pagination parameters to the URL
    const url = `${this.NGROK_BASE_URL}/api/affected_brgy/?affected=yes&page=${page}`;

    return this.http.get(url);
  }

  loadNextPage(): Observable<any> {
    // Increment the current page and load the next page of data
    this.currentPage++;
    return this.getAffectedPopulations(this.currentPage);
  }
}
