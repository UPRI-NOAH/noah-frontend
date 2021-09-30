import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  CF_TILESET_NAMES,
  CriticalFacilityLayer,
} from '@shared/mocks/critical-facilities';
import { Feature, FeatureCollection } from 'geojson';
import { LngLat, LngLatLike } from 'mapbox-gl';
import { Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { RiskLevel } from '../store/kyh.store';

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
      layer: CriticalFacilityLayer;
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

  assess(payload: AssessmentPayload): Observable<RiskLevel> {
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
      .set(
        'access_token',
        'pk.eyJ1IjoidXByaS1ub2FoIiwiYSI6ImNrcmExaDdydzRldWYyb21udmw1ejY3ZDYifQ.cs3Ahz2S6fERoI1BAwFO9g'
      );

    return this.http
      .get<FeatureCollection>(baseURL, { params })
      .pipe(catchError(this.handleError('getFeatureInfo', null)));
  }

  private _getRiskLevel(feature: FeatureCollection | null): RiskLevel {
    if (!feature) {
      return 'low';
    }

    return this._formatRiskLevel(feature);
  }

  private _getCriticalFacility(
    featureList: CriticalFacilityFeature[]
  ): MapItem[] {
    const getType = (layerName: string) => {
      switch (layerName) {
        case 'fire_station':
          return 'fire-station';
        case 'hospitals':
          return 'hospital';
        case 'police_station':
          return 'police-station';
        case 'schools':
          return 'school';
        default:
          throw new Error('critical facility layer not found!');
      }
    };

    return featureList.map((feature) => ({
      coords: feature.geometry.coordinates,
      name: feature.properties.name,
      type: getType(feature.properties.tilequery.layer),
      distance: feature.properties.tilequery.distance / 1000, // to km
    }));
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

  private _getRiskNum(feature: Feature): number {
    const { properties } = feature;
    if (!properties) {
      return 0;
    }

    if ('Var' in properties) {
      return parseInt(properties.Var);
    }

    if ('HZ' in properties) {
      return parseInt(properties.HZ);
    }

    if ('HAZ' in properties) {
      return parseFloat(properties.HAZ);
    }

    return 0;
  }

  private _computeAreaRiskNum(features: Array<Feature>): number {
    const riskNumList = features.map((feature: Feature) =>
      this._getRiskNum(feature)
    );
    return Math.max(...riskNumList);
  }

  private _formatRiskLevel(featureCollection: FeatureCollection): RiskLevel {
    const riskLevelNum = this._computeAreaRiskNum(featureCollection.features);

    switch (riskLevelNum) {
      case 0:
        return 'little';

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
