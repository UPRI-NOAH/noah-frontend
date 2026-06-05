import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ForecastSummaryOutput } from './ibff-summary.service';

export interface PastEventListItem {
  id: number;
  event_name: string;
  display_name: string;
  date_start: string;
  date_end: string | null;
  total_municipalities: number;
  confirmed_municipalities: number;
  has_summary: boolean;
  last_synced_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class PastEventService {
  private base = environment.pastEventsUrl;

  constructor(private http: HttpClient) {}

  listEvents(): Observable<PastEventListItem[]> {
    return this.http.get<PastEventListItem[]>(this.base);
  }

  syncEvents(): Observable<{
    synced: number;
    created: number;
    updated: number;
  }> {
    return this.http.post<{ synced: number; created: number; updated: number }>(
      `${this.base}sync/`,
      {}
    );
  }

  getSummary(id: number): Observable<ForecastSummaryOutput> {
    return this.http.get<ForecastSummaryOutput>(`${this.base}${id}/summary/`);
  }

  generateSummary(id: number): Observable<ForecastSummaryOutput> {
    return this.http.post<ForecastSummaryOutput>(
      `${this.base}${id}/generate/`,
      {}
    );
  }
}
