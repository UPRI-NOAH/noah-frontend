import { Injectable } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import { HazardType, KyhStore, ExposureLevel } from '../store/kyh.store';
import { HazardsService } from './hazards.service';

@Injectable({
  providedIn: 'root',
})
export class KyhService {
  criticalFacilities$: Observable<FeatureCollection>;

  constructor(
    private gaService: GoogleAnalyticsService,
    private kyhStore: KyhStore,
    private hazardsService: HazardsService
  ) {}

  keyBoard: Subject<any> = new Subject<any>();
  sendMessage(message: any) {
    this.keyBoard.next(message);
  }

  get center$(): Observable<{ lng: number; lat: number }> {
    return this.kyhStore.state$.pipe(
      map((state) => state.center),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay(1)
    );
  }

  getCriticalFacilities$(): Observable<FeatureCollection> {
    return this.center$.pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap((coords) => this.hazardsService.getCriticalFacilities(coords)),
      shareReplay(1)
    );
  }

  getExposureLevel$(hazardType: HazardType): Observable<ExposureLevel> {
    return this.kyhStore.state$.pipe(
      map((state) => {
        switch (hazardType) {
          case 'flood':
            return state.exposureLevels.flood;
          case 'landslide':
            return state.exposureLevels.landslide;
          case 'storm-surge':
            return state.exposureLevels['storm-surge'];
          default:
            throw new Error(`Invalid hazard type ${hazardType}`);
        }
      })
    );
  }

  get currentCoords$(): Observable<{ lng: number; lat: number }> {
    return this.kyhStore.state$.pipe(
      map((state) => state.currentCoords),
      shareReplay(1)
    );
  }

  get currentCoords(): { lng: number; lat: number } {
    return this.kyhStore.state.currentCoords;
  }

  get currentLocation$(): Observable<string> {
    return this.kyhStore.state$.pipe(map((state) => state.currentLocation));
  }

  get isLoading$(): Observable<boolean> {
    return this.kyhStore.state$.pipe(
      map((state) => state.isLoading),
      shareReplay(1)
    );
  }

  get hazardTypes(): HazardType[] {
    return ['flood', 'landslide', 'storm-surge'];
  }

  async assessRisk(): Promise<void> {
    this.kyhStore.patch(
      {
        isLoading: true,
        exposureLevels: {
          flood: 'unavailable',
          landslide: 'unavailable',
          'storm-surge': 'unavailable',
        },
      },
      'loading exposure levels...'
    );

    const payload = {
      coords: this.kyhStore.state.center,
      tilesetName: this._getAllTilesetNames(),
    };

    const exposureLevels = await this.hazardsService
      .assess(payload)
      .toPromise();
    this.kyhStore.patch(
      {
        isLoading: false,
        exposureLevels,
      },
      `updated hazard exposure level for all`
    );
  }

  init() {
    this.assessRisk();
    this.criticalFacilities$ = this.getCriticalFacilities$();
  }

  isHazardShown$(hazardType: HazardType): Observable<boolean> {
    return this.kyhStore.state$.pipe(
      map((state) =>
        state.currentView === 'all' || state.currentView === hazardType
          ? true
          : false
      )
    );
  }

  isHazardLayer(currentHazard: HazardType): boolean {
    return this.hazardTypes.includes(currentHazard);
  }

  setCenter(center: { lat: number; lng: number }) {
    this.kyhStore.patch({ center }, 'update map center');
    this.assessRisk();
  }

  setCurrentCoords(currentCoords: { lat: number; lng: number }) {
    this.kyhStore.patch({ currentCoords });
  }

  setCurrentLocation(currentLocation: string): void {
    this.kyhStore.patch({ currentLocation }, 'update current location');
    this.gaService.event('change_location', 'know_your_hazards');
  }

  setCurrentView(viewedHazard: HazardType | 'all'): void {
    this.kyhStore.patch(
      { currentView: viewedHazard },
      `set current view to ${viewedHazard}`
    );
  }

  private _getAllTilesetNames(): string {
    const tilesetNames = {
      flood: 'upri-noah.ph_fh_100yr_tls,upri-noah.ph_fh_nodata_tls',
      landslide:
        'upri-noah.ph_lh_lh1_tls,upri-noah.ph_lh_lh2_tls,upri-noah.ph_lh_lh3_tls',
      'storm-surge': 'upri-noah.ph_ssh_ssa4_tls',
    };

    return `${tilesetNames['flood']},${tilesetNames['landslide']},${tilesetNames['storm-surge']}`;
  }
}
