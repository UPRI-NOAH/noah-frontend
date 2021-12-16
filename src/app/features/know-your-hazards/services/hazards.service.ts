import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Feature, FeatureCollection } from 'geojson';
import { LngLatLike } from 'mapbox-gl';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import {
  ExposureLevel,
  HazardExposureLevel,
  HazardType,
} from '../store/kyh.store';

type AssessmentPayload = {
  coords: { lat: number; lng: number };
  limit?: number;
  propertyName?: string;
  radius?: number;
  tilesetName: string;
};

export type CriticalFacilityFeature = Feature & {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    amenity: string;
    name: string;
    tilequery: {
      distance: number;
      geometry: string;
      layer: string;
    };
  };
};

export type MapItem = {
  coords: LngLatLike;
  name: string;
  type: string;
  address?: string;
  distance: number;
};

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class HazardsService {
  constructor(private http: HttpClient) {}

  assess(payload: AssessmentPayload): Observable<HazardExposureLevel> {
    return this.getFeatureInfo(payload).pipe(
      map((feature) => this._getRiskLevel(feature)),
      take(1)
    );
  }

  getCriticalFacilities(coords: { lat: number; lng: number }) {
    const payload = {
      coords,
      limit: 25,
      radius: 5000, // 5km
      tilesetName:
        'upri-noah.schools_tls,upri-noah.hospitals_tls,upri-noah.fire_station_tls,upri-noah.police_station_tls',
    };

    return this.getFeatureInfo(payload).pipe(take(1));
  }

  getFeatureInfo(
    payload: AssessmentPayload
  ): Observable<FeatureCollection | null> {
    const baseURL = `https://api.mapbox.com/v4/${payload.tilesetName}/tilequery/${payload.coords.lng},${payload.coords.lat}.json`;
    const params = new HttpParams()
      .set('radius', payload.radius ? String(payload.radius) : '50')
      .set('limit', payload.limit ? String(payload.limit) : '20')
      .set('access_token', environment.mapbox.accessToken);

    return this.http
      .get<FeatureCollection>(baseURL, { params })
      .pipe(catchError(this.handleError('getFeatureInfo', null)));
  }

  private _getRiskLevel(
    featureCollection: FeatureCollection | null
  ): HazardExposureLevel {
    return {
      flood: this._formatRiskLevel(featureCollection, 'flood'),
      landslide: this._formatRiskLevel(featureCollection, 'landslide'),
      'storm-surge': this._formatRiskLevel(featureCollection, 'storm-surge'),
    };
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(operation, error);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private _getFloodExposure(feature: Feature): number {
    const { properties } = feature;
    if (!properties) return 0;

    if ('Var' in properties) return parseInt(properties.Var);

    // There was no `Var` value read earlier
    // This is exclusive for Flood Data only
    if ('No_Data' in properties) return -1;

    return 0;
  }

  private _getLandslideExposure(feature: Feature): number {
    const { properties } = feature;
    if (!properties) return 0;

    if ('LH' in properties) return parseInt(properties.LH);

    return 0;
  }

  private _getStormSurgeExposure(feature: Feature): number {
    const { properties } = feature;

    if (!properties) return 0;

    if ('HAZ' in properties) return parseInt(properties.HAZ);
    return 0;
  }

  private _computeAreaRiskNum(
    features: Array<Feature>,
    hazardType: HazardType
  ): number {
    let getRiskNum: (feature: Feature) => number;
    switch (hazardType) {
      case 'flood':
        getRiskNum = this._getFloodExposure;
        break;
      case 'landslide':
        getRiskNum = this._getLandslideExposure;
        break;
      case 'storm-surge':
        getRiskNum = this._getStormSurgeExposure;
        break;
      default:
        break;
    }

    const riskNumList = features.map((feature: Feature) => getRiskNum(feature));
    return Math.max(...riskNumList);
  }

  private _formatRiskLevel(
    featureCollection: FeatureCollection,
    hazardType: HazardType
  ): ExposureLevel {
    if (!featureCollection) return 'little to none';

    const riskLevelNum = this._computeAreaRiskNum(
      featureCollection.features,
      hazardType
    );

    switch (riskLevelNum) {
      case -1:
        return 'unavailable';

      case 0:
        return 'little to none';

      case 1:
        return 'low';

      case 2:
        return 'medium';

      case 3:
        return 'high';

      default:
        return 'low';
    }
  }
}
