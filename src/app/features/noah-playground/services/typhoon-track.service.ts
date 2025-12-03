import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TyphoonTrackType =
  | 'pagasa' //Philippines
  | 'hko' //Hong kong
  | 'jtwc' //USA
  | 'jma' //Japan
  | 'nmc' //Beijing
  | 'cwa' //Taiwin
  | 'kma'; //Korea

export const TYPHOON: TyphoonTrackType[] = [
  'pagasa',
  'hko',
  'jtwc',
  'jma',
  'nmc',
  'cwa',
  'kma',
];

@Injectable({
  providedIn: 'root',
})
export class TyphoonTrackService {
  private BASE_URL = 'https://upri-noah.s3.amazonaws.com';
  //https://upri-noah.s3.amazonaws.com/typhoon_track/test2/multi_typhoon.geojson

  constructor(private http: HttpClient) {}

  getTyphoonTracks(type: TyphoonTrackType) {
    return this.http.get<any>(
      `${this.BASE_URL}/typhoon_track/multi_typhoon.geojson`
    );
  }
}
