import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type RiskAssessmentType =
  | 'rain'
  | 'exposure'
  | 'population'
  | 'buildings';

export const RISK_ASSESSMENT: RiskAssessmentType[] = [
  'rain',
  'exposure',
  'population',
  'buildings',
];

@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentServicesService {
  constructor() {}
}
