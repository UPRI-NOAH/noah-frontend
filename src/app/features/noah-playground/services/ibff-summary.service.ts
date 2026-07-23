import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

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

  generateSummary(): Observable<ForecastSummaryOutput> {
    return this.http.get<ForecastSummaryOutput>(`${this.apiUrl}current/`);
  }
}
