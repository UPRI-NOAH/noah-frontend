import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LEYTE_FLOOD } from '@shared/mocks/flood';
import { LEYTE_LANDSLIDE } from '@shared/mocks/landslide';
import { LEYTE_STORM_SURGE } from '@shared/mocks/storm-surges';
import { FeatureCollection, Feature } from 'geojson';
import { LngLatLike } from 'mapbox-gl';
import { defer, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import {
  HazardType,
  PraStore,
  PRAPage,
  RiskLevel,
  PH_DEFAULT_CENTER,
} from '../store/pra.store';
import { RiskService } from './risk.service';

@Injectable({
  providedIn: 'root',
})
export class PraService {
  constructor(private praStore: PraStore, private riskService: RiskService) {}

  get currentCoords$(): Observable<LngLatLike> {
    return this.praStore.state$.pipe(map((state) => state.center));
  }

  get currentCoords(): LngLatLike {
    return this.praStore.state.center;
  }

  get currentLocation$(): Observable<string> {
    return this.praStore.state$.pipe(map((state) => state.currentLocation));
  }

  get currentPage$(): Observable<PRAPage> {
    return this.praStore.state$.pipe(map((state) => state.currentPage));
  }

  get riskLevel$(): Observable<RiskLevel> {
    return this.praStore.state$.pipe(map((state) => state.riskLevel));
  }

  get hazardTypes(): string[] {
    return ['flood', 'landslide', 'storm-surge'];
  }

  async assessRisk(hazardType: HazardType): Promise<void> {
    this.praStore.patch({ isLoading: true }, 'loading risk level...');

    const payload = {
      coords: this.praStore.state.center,
      tilesetName: this._getTilesetName(hazardType),
    };

    const riskLevel = await this.riskService.assess(payload).toPromise();

    this.praStore.patch(
      {
        isLoading: false,
        riskLevel: riskLevel as RiskLevel,
      },
      `updated risk level -- ${hazardType}`
    );
  }

  init() {
    this.currentPage$
      .pipe(
        distinctUntilChanged(),
        tap((page) => {
          if (this.isHazardPage(page)) {
            const hazard = page as HazardType;
            this.assessRisk(hazard);
            this.setMapCenter(PH_DEFAULT_CENTER);
          }
        })
      )
      .subscribe();
  }

  isHazardPage(currentPage: PRAPage): boolean {
    return this.hazardTypes.includes(currentPage);
  }

  setCurrentLocation(currentLocation: string): void {
    this.praStore.patch({ currentLocation }, 'update current location');
  }

  setCurrentPage(currentPage: PRAPage): void {
    this.praStore.patch({ currentPage }, 'update current page');
  }

  setMapCenter(coords: { lat: number; lng: number }) {
    this.praStore.patch({ center: coords }, 'update map center');
  }

  // Temporary
  private _getTilesetName(hazardType: HazardType): string {
    switch (hazardType) {
      case 'flood':
        return 'jadurani.3tg2ae87';
      // return LEYTE_FLOOD.source?.url || "";
      case 'landslide':
        return 'jadurani.boxlw5qe';
      // return LEYTE_LANDSLIDE.source?.url || "";
      case 'storm-surge':
        return 'jadurani.cmmzrdab';
      // return LEYTE_STORM_SURGE.source?.url || "";
      default:
        return '';
    }
  }
}
