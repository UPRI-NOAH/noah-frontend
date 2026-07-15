import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface TopArea {
  province: string;
  affected_barangays: number;
}

export interface TopCity {
  city: string;
  province?: string;
  affected_barangays: number;
}

export interface TopBarangayByHazard {
  barangay: string;
  municipality: string;
  province?: string;
  medhigh_percentage: number;
}

export interface ExposedFacilities {
  schools: number;
  health_facilities: number;
  warehouses: number;
}

export interface ForecastSummaryInput {
  forecast_timestamp: string;
  affected_barangays: number;
  affected_municipalities: number;
  affected_provinces: number;
  top_areas: TopArea[];
  top_cities: TopCity[];
  top_barangays_by_hazard?: TopBarangayByHazard[];
  exposed_facilities?: ExposedFacilities;
  highest_hazard_level?: string;
  notes?: string[];
}

export interface ForecastSummaryOutput {
  executive_summary: string;
  // forecast summaries return key_insights; past-event summaries return area_summary
  key_insights?: string[];
  area_summary?: string;
  caveat: string;
  _source: 'llm' | 'fallback';
  _model?: string;
  _generated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IbffSummaryService {
  private readonly apiUrl = environment.ibffSummaryUrl;

  constructor(private http: HttpClient) {}

  generateSummary(
    input: ForecastSummaryInput
  ): Observable<ForecastSummaryOutput> {
    return this.http.post<ForecastSummaryOutput>(this.apiUrl, input);
  }
}
