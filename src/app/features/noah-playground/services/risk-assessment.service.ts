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

  private EXPOSURE_BASE_URL =
    'https://upri-noah.s3.ap-southeast-1.amazonaws.com';

  getExposurePopulation() {
    return this.http.get(
      `${this.EXPOSURE_BASE_URL}/example/PH060400000_FB_Pop.geojson`
    );
  }

  // https://upri-noah.s3.ap-southeast-1.amazonaws.com/test/PH060400000_100yr_Bgy.geojson
  // https://upri-noah.s3.ap-southeast-1.amazonaws.com/test/PH061900000_100yr_Bgy.geojson
  // https://upri-noah.s3.ap-southeast-1.amazonaws.com/test/3_Prov_100yr_Bgy_var0_2.geojson

  getBrgy100yr() {
    return this.http.get(
      `${this.EXPOSURE_BASE_URL}/test/3_Prov_100yr_Bgy_var0_3.geojson`
    );
  }
}
