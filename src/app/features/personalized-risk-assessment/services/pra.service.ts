import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FeatureCollection, Feature } from 'geojson';
import { LngLatLike } from 'mapbox-gl';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HazardType, PraStore, PRAPage, RiskLevel } from '../store/pra.store';
@Injectable({
  providedIn: 'root',
})
export class PraService {
  constructor(private http: HttpClient, private praStore: PraStore) {}

  get currentCoords$(): Observable<LngLatLike> {
    return this.praStore.state$.pipe(map((state) => state.center));
  }

  get currentCoords(): LngLatLike {
    return this.praStore.state.center;
  }

  get currentPage$(): Observable<PRAPage> {
    return this.praStore.state$.pipe(map((state) => state.currentPage));
  }

  get riskLevel$(): Observable<RiskLevel> {
    return this.praStore.state$.pipe(map((state) => state.riskLevel));
  }

  async assessRisk(hazardType: HazardType): Promise<void> {
    this.praStore.patch({ isLoading: true }, 'loading risk level...');

    const response: FeatureCollection = await this.http
      .get<FeatureCollection>(
        'http://localhost:8080/geoserver/wms?INFO_FORMAT=application/json&REQUEST=GetFeatureInfo&EXCEPTIONS=application/vnd.ogc.se_xml&SERVICE=WMS&VERSION=1.1.1&WIDTH=2&HEIGHT=2&X=1&Y=1&BBOX=124.55999410001472,11.580408358654404,124.56000410001472,11.580418358654404&LAYERS=cite:Biliran_Flood_100year&QUERY_LAYERS=cite:Biliran_Flood_100year&TYPENAME=cite:Biliran_Flood_100year&BUFFER=50&propertyName=Var&feature_count=50'
      )
      .toPromise();

    const riskLevel = this._formatRiskLevel(response);
    this.praStore.patch(
      {
        isLoading: false,
        riskLevel: riskLevel as RiskLevel,
      },
      `updated risk level -- ${hazardType}`
    );
  }

  get hazardTypes(): string[] {
    return ['flood', 'landslide', 'storm-surge'];
  }

  isHazardPage(currentPage: PRAPage): boolean {
    return this.hazardTypes.includes(currentPage);
  }

  setCurrentPage(currentPage: PRAPage): void {
    this.praStore.patch({ currentPage }, 'update current page');

    if (this.isHazardPage(currentPage)) {
      this.assessRisk(currentPage as HazardType);
    }
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
        return 'unavailable';
    }
  }
}
