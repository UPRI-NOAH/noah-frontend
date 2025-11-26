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

interface TyphoonFeature {
  type: string;
  properties: {
    international_name: string;
    agency: string;
    datetime: string;
    [key: string]: any;
  };
  geometry: any;
}

interface TyphoonGeoJSON {
  type: string;
  features: TyphoonFeature[];
}

@Injectable({
  providedIn: 'root',
})
export class TyphoonTrackService {
  //https://upri-noah.s3.amazonaws.com/typhoon_track/test/multi_typhoon.geojson
  private BASE_URL = 'https://upri-noah.s3.amazonaws.com';

  constructor(private http: HttpClient) {}

  getTyphoonTracks(type: TyphoonTrackType) {
    return this.http.get<GeoJSON.FeatureCollection<GeoJSON.Geometry>>(
      `https://upri-noah.s3.amazonaws.com/typhoon_track/test2/multi_typhoon.geojson`
    );
  }

  getInternationalNames(): Observable<string | null> {
    return this.http
      .get<TyphoonGeoJSON>(
        'https://upri-noah.s3.amazonaws.com/typhoon_track/multi_typhoon.geojson'
      )
      .pipe(
        map((geojson) => {
          if (geojson.features.length > 0) {
            return geojson.features[0].properties.international_name;
          } else {
            return null;
          }
        })
      );
  }
}
