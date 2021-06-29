import { state } from '@angular/animations';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import {
  HazardType,
  KyhStore,
  KYHPage,
  RiskLevel,
  PH_DEFAULT_CENTER,
} from '../store/kyh.store';
import { HazardsService } from './hazards.service';

@Injectable({
  providedIn: 'root',
})
export class KyhService {
  constructor(
    private kyhStore: KyhStore,
    private hazardsService: HazardsService
  ) {}

  get center$(): Observable<{ lng: number; lat: number }> {
    return this.kyhStore.state$.pipe(map((state) => state.center));
  }

  get currentCoords$(): Observable<{ lng: number; lat: number }> {
    return this.kyhStore.state$.pipe(map((state) => state.currentCoords));
  }

  get currentCoords(): { lng: number; lat: number } {
    return this.kyhStore.state.currentCoords;
  }

  get currentLocation$(): Observable<string> {
    return this.kyhStore.state$.pipe(map((state) => state.currentLocation));
  }

  get currentPage(): KYHPage {
    return this.kyhStore.state.currentPage;
  }

  get currentPage$(): Observable<KYHPage> {
    return this.kyhStore.state$.pipe(map((state) => state.currentPage));
  }

  get riskLevel$(): Observable<RiskLevel> {
    return this.kyhStore.state$.pipe(map((state) => state.riskLevel));
  }

  get hazardTypes(): string[] {
    return ['flood', 'landslide', 'storm-surge'];
  }

  async assessRisk(hazardType: HazardType): Promise<void> {
    this.kyhStore.patch({ isLoading: true }, 'loading risk level...');

    const payload = {
      coords: this.kyhStore.state.center,
      tilesetName: this._getTilesetName(hazardType),
    };

    const riskLevel = await this.hazardsService.assess(payload).toPromise();

    this.kyhStore.patch(
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

  isHazardPage(currentPage: KYHPage): boolean {
    return this.hazardTypes.includes(currentPage);
  }

  setCenter(center: { lat: number; lng: number }) {
    this.kyhStore.patch({ center });
  }

  setCurrentCoords(currentCoords: { lat: number; lng: number }) {
    this.kyhStore.patch({ currentCoords });
  }

  setCurrentLocation(currentLocation: string): void {
    this.kyhStore.patch({ currentLocation }, 'update current location');
  }

  setCurrentPage(currentPage: KYHPage): void {
    this.kyhStore.patch({ currentPage }, 'update current page');
  }

  setMapCenter(coords: { lat: number; lng: number }) {
    this.kyhStore.patch({ center: coords }, 'update map center');
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
