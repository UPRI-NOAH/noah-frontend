import { Injectable } from '@angular/core';
import {
  RainfallContourState,
  RainfallContourTypes,
  TyphoonTrackState,
  WeatherSatelliteState,
  WeatherSatelliteType,
  WeatherSatelliteTypeState,
  WeatherUpdatesStore,
} from '../store/weather-updates.store';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, share, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WeatherUpdatesService {
  constructor(
    private store: WeatherUpdatesStore,
    private gaService: GoogleAnalyticsService
  ) {}

  private zoomTyphoon = new Subject<void>();
  zoomTyphoon$ = this.zoomTyphoon.asObservable().pipe(share());

  keyBoard: Subject<any> = new Subject();
  sendMessage(message: any) {
    this.keyBoard.next(message);
  }

  get currentLocation$(): Observable<string> {
    return this.store.state$.pipe(map((state) => state.currentLocation));
  }

  get currentCoords$(): Observable<{ lng: number; lat: number }> {
    return this.store.state$.pipe(
      map((state) => state.center),
      shareReplay(1)
    );
  }

  get rainfallContourTypes(): RainfallContourTypes[] {
    return ['1hr', '3hr', '6hr', '12hr', '24hr'];
  }

  get rainfallContourShown$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.rainfallContourTypes.shown)
    );
  }

  get selectedRainfallContourType$(): Observable<RainfallContourTypes> {
    return this.store.state$.pipe(
      map((state) => state.rainfallContourTypes.selectedType)
    );
  }

  getSelectedRainfallContourType(): RainfallContourTypes {
    return this.store.state.rainfallContourTypes.selectedType;
  }

  selectRainfallContourType(newType: RainfallContourTypes): void {
    const state = this.store.state.rainfallContourTypes;
    const prevType = state.selectedType;
    const fade = { ...state.fade };
    //sync opacity: copy from previous type to new type, fallback to 100 if undefined
    const prevOpacity = fade[prevType]?.opacity ?? 100;
    fade[newType] = { opacity: prevOpacity };
    this.store.patch(
      {
        rainfallContourTypes: {
          ...state,
          selectedType: newType,
          fade,
        },
      },
      `Selected Rainfall Contour Type: ${newType} (opacity synced from ${prevType})`
    );
  }

  toggleRainfallContourType(): void {
    const rainfallContourTypes = {
      ...this.store.state.rainfallContourTypes,
    };
    rainfallContourTypes.shown = !rainfallContourTypes.shown;
    this.store.patch(
      { rainfallContourTypes },
      `Toggled Rainfall Contour Type: ${rainfallContourTypes.shown}`
    );
  }

  get center$(): Observable<{ lng: number; lat: number }> {
    return this.store.state$.pipe(
      map((state) => state.center),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      shareReplay(1)
    );
  }

  getAvailableWeatherTypes(currentRainfall: RainfallContourTypes): boolean {
    return this.rainfallContourTypes.includes(currentRainfall);
  }

  setCurrentLocation(currentLocation: string): void {
    this.store.patch({ currentLocation }, 'Update Current Location');
    this.gaService.event('change_location', 'weather_updates', currentLocation);
  }

  setCenter(center: { lat: number; lng: number }) {
    this.store.patch({ center }, 'Update Center');
  }

  setCurrentCoords(currentCoords: { lat: number; lng: number }) {
    this.store.patch({ currentCoords }, 'Update Current Coords');
  }

  setRainfallContourOpacity(
    opacity: number,
    rainfallContourType: RainfallContourTypes
  ): void {
    const rainfallContourTypes: RainfallContourState = {
      ...this.store.state.rainfallContourTypes,
      fade: {
        ...this.store.state.rainfallContourTypes.fade,
        [rainfallContourType]: { opacity },
      },
    };
    this.store.patch(
      { rainfallContourTypes },
      `Rainfall Contour - update ${rainfallContourType}'s opacity to ${opacity}`
    );
  }

  getRainfallContour$(
    rainfallContourType: RainfallContourTypes
  ): Observable<{ opacity: number }> {
    return this.store.state$.pipe(
      map((state) => state.rainfallContourTypes.fade[rainfallContourType])
    );
  }

  // Getters for Typhoon Track.
  getTyphoonTrack(): TyphoonTrackState {
    return this.store.state.typhoonTrack;
  }

  get typhoonTrackShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.typhoonTrack.shown));
  }

  get typhoonTrackExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.typhoonTrack.expanded));
  }

  // Setters for Typhoon Track.
  toggleTyphoonTrackGroupVisibility(visible: boolean): void {
    const typhoonTrack = {
      ...this.store.state.typhoonTrack,
    };

    typhoonTrack.shown = visible;
    this.store.patch(
      { typhoonTrack },
      `toggle typhoon track visibility ${typhoonTrack.shown}`
    );
  }

  toggleTyphoonTrackGroupExpansion(): void {
    const typhoonTrack = {
      ...this.store.state.typhoonTrack,
    };

    typhoonTrack.expanded = !typhoonTrack.expanded;
    this.store.patch(
      { typhoonTrack },
      `toggle typhoon track expansion ${typhoonTrack.expanded}`
    );
  }

  // Getters for Weather Satellite
  get weatherSatellitesShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.weatherSatellite.shown));
  }

  get weatherSatellitesExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.expanded)
    );
  }

  get selectedWeatherSatellite$(): Observable<WeatherSatelliteType> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.selectedType)
    );
  }

  getWeatherSatellites(): WeatherSatelliteState {
    return this.store.state.weatherSatellite;
  }

  getWeatherSatellite(type: WeatherSatelliteType): WeatherSatelliteTypeState {
    return this.store.state.weatherSatellite.types[type];
  }

  getWeatherSatellite$(
    type: WeatherSatelliteType
  ): Observable<WeatherSatelliteTypeState> {
    return this.store.state$.pipe(
      map((state) => state.weatherSatellite.types[type])
    );
  }

  getWeatherSatelliteOpacity(type: WeatherSatelliteType): number {
    return this.store.state.weatherSatellite.types[type].opacity;
  }

  setWeatherSatelliteOpacity(opacity: number, type: WeatherSatelliteType) {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
      types: {
        ...this.store.state.weatherSatellite.types,
        [type]: {
          ...this.store.state.weatherSatellite.types[type],
          opacity: opacity,
        },
      },
    };
    this.store.patch({ weatherSatellite }, `Set ${type} opacity to ${opacity}`);
  }

  selectWeatherSatelliteType(weatherType: WeatherSatelliteType): void {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
    };

    weatherSatellite.selectedType = weatherType;
    this.store.patch(
      { weatherSatellite },
      `Select Weather Satellite type: ${weatherType}`
    );
  }

  // Setters for Weather Satellite.
  toggleWeatherSatelliteVisibility(visible?: boolean): void {
    const currentState = this.store.state.weatherSatellite.shown;
    this.store.patch(
      {
        weatherSatellite: {
          ...this.store.state.weatherSatellite,
          shown: !currentState,
        },
      },
      `Weather satellite visibility toggled: ${!currentState} and visible: ${visible}`
    );
  }

  // Enable both typhoon track and himawari satellite
  enableTyphoonTrackAndSatellite(): void {
    // Enable typhoon track
    const typhoonTrack = {
      ...this.store.state.typhoonTrack,
      shown: true,
      expanded: true,
    };

    // Enable weather satellite (himawari)
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
      shown: true,
      expanded: true,
      selectedType: 'himawari' as WeatherSatelliteType,
    };

    // Update both states
    this.store.patch(
      {
        typhoonTrack,
        weatherSatellite,
      },
      'Enable typhoon track and himawari satellite from landing page'
    );
  }

  //explicitly set typhoon track visibility
  setTyphoonTrackVisibility(visible: boolean): void {
    const typhoonTrack = {
      ...this.store.state.typhoonTrack,
      shown: visible,
    };
    this.store.patch(
      { typhoonTrack },
      `Set typhoon track visibility to ${visible}`
    );
  }

  //explicitly set weather satellite visibility
  setWeatherSatelliteVisibility(visible: boolean): void {
    const weatherSatellite = {
      ...this.store.state.weatherSatellite,
      shown: visible,
    };
    this.store.patch(
      { weatherSatellite },
      `Set weather satellite visibility to ${visible}`
    );
  }

  triggerZoomToTyphoon(): void {
    this.zoomTyphoon.next();
  }
}
