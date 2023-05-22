import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type RiskAssessmentType = 'rain';

export type ExposureType = 'population' | 'buildings';

export const RISK_ASSESSMENT: RiskAssessmentType[] = ['rain'];

export const EXPOSURE_NAMES: ExposureType[] = ['population', 'buildings'];

@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService {
  constructor(private http: HttpClient) {}

  private EXPOSURE_POPULATION =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com/example/PH060400000_FB_Pop.geojson';

  getExposurePopulation() {
    return this.http.get(`${this.EXPOSURE_POPULATION}`);
  }
}
