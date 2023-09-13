import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AffectedData = {
  province: string;
  municipality: string;
  barangay: string;
  total_population: number;
  total_affected_population: number;
  medium_high: number;
  percentage_of_affected_medium_high: number;
};
@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService {
  constructor(private http: HttpClient) {}

  getAffectedPopulation(): Observable<any> {
    return this.http.get(
      'https://upri-noah.s3.ap-southeast-1.amazonaws.com/4As/prov_rankings.json'
    );
  }
}
