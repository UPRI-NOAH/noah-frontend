import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
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

  keyBoard: Subject<any> = new Subject<any>();
  sendMessage(message: any) {
    this.keyBoard.next(message);
  }
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

  get currentHazard(): HazardType {
    return this.kyhStore.state.currentHazard;
  }

  get currentHazard$(): Observable<HazardType> {
    return this.kyhStore.state$.pipe(map((state) => state.currentHazard));
  }

  get floodRiskLevel$(): Observable<RiskLevel> {
    return this.kyhStore.state$.pipe(map((state) => state.floodRiskLevel));
  }

  get stormSurgeRiskLevel$(): Observable<RiskLevel> {
    return this.kyhStore.state$.pipe(map((state) => state.stormSurgeRiskLevel));
  }

  get landslideRiskLevel$(): Observable<RiskLevel> {
    return this.kyhStore.state$.pipe(map((state) => state.landslideRiskLevel));
  }

  get hazardTypes(): HazardType[] {
    return ['flood', 'landslide', 'storm-surge'];
  }

  async assessRisk(): Promise<void> {
    this.kyhStore.patch({ isLoading: true }, 'loading risk level...');

    const payloadFlood = {
      coords: this.kyhStore.state.center,
      tilesetName: this._getTilesetName('flood'),
    };
    const payloadStormSurge = {
      coords: this.kyhStore.state.center,
      tilesetName: this._getTilesetName('storm-surge'),
    };
    const payloadLandslide = {
      coords: this.kyhStore.state.center,
      tilesetName: this._getTilesetName('landslide'),
    };

    const floodRiskLevel = await this.hazardsService
      .assess(payloadFlood)
      .toPromise();
    const stormSurgeRiskLevel = await this.hazardsService
      .assess(payloadStormSurge)
      .toPromise();
    const landslideRiskLevel = await this.hazardsService
      .assess(payloadLandslide)
      .toPromise();
    this.kyhStore.patch(
      {
        isLoading: false,
        floodRiskLevel: floodRiskLevel as RiskLevel,
        stormSurgeRiskLevel: stormSurgeRiskLevel as RiskLevel,
        landslideRiskLevel: landslideRiskLevel as RiskLevel,
      },
      `updated risk level --`
    );
  }

  init() {
    this.assessRisk();
  }

  isHazardLayer(currentHazard: HazardType): boolean {
    return this.hazardTypes.includes(currentHazard);
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

  setCurrentHazard(currentHazard: HazardType) {
    this.kyhStore.patch({ currentHazard }, 'update current hazard');
  }

  setMapCenter(coords: { lat: number; lng: number }) {
    this.kyhStore.patch({ center: coords }, 'update map center');
  }

  // Temporary
  private _getTilesetName(hazardTypes: HazardType): string {
    switch (hazardTypes) {
      case 'flood':
        return 'prince-test.ph_fh_100yr_tls';
      case 'landslide':
        return 'prince-test.ph_lh_lh1_tls';
      case 'storm-surge':
        return 'prince-test.ph_ssh_ssa4_tls';
      default:
        return '';
    }
  }
}
