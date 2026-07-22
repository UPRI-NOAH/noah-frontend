import { Injectable } from '@angular/core';
import {
  RainfallContourState,
  RainfallContourTypes,
  TemperatureForecastDay,
  TemperatureState,
  TemperatureType,
  TemperatureTypesState,
  TemperatureTypeState,
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

  get temperatureShown$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.temperature.shown));
  }

  get temperatureExpanded$(): Observable<boolean> {
    return this.store.state$.pipe(map((state) => state.temperature.expanded));
  }

  get selectedTemperature$(): Observable<TemperatureType> {
    return this.store.state$.pipe(
      map((state) => state.temperature.selectedType)
    );
  }

  get selectedTemperatureForecastDay$(): Observable<TemperatureForecastDay> {
    return this.store.state$.pipe(
      map((state) => state.temperature.selectedForecastDay)
    );
  }

  get overlayOpacity$(): Observable<number> {
    return this.store.state$.pipe(
      map((state) => state.overlayOpacity),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  getOverlayOpacity(): number {
    return this.store.state.overlayOpacity;
  }

  getSelectedRainfallContourType(): RainfallContourTypes {
    return this.store.state.rainfallContourTypes.selectedType;
  }

  getTemperatureType(): TemperatureType {
    return this.store.state.temperature.selectedType;
  }

  getTemperatureShown(): boolean {
    return this.store.state.temperature.shown;
  }

  getRainfallContourShown(): boolean {
    return this.store.state.rainfallContourTypes.shown;
  }

  selectRainfallContourType(newType: RainfallContourTypes): void {
    const state = this.store.state.rainfallContourTypes;
    const prevType = state.selectedType;
    const fade = { ...state.fade };
    const temperature = {
      ...this.store.state.temperature,
      shown: false,
    };
    //sync opacity: copy from previous type to new type, fallback to 100 if undefined
    const prevOpacity = fade[prevType]?.opacity ?? 100;
    fade[newType] = { opacity: prevOpacity };
    this.store.patch(
      {
        rainfallContourTypes: {
          ...state,
          shown: true,
          selectedType: newType,
          fade,
        },
        temperature,
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

  get center$(): Observable<{ lng: number; lat: number } | null> {
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

  resetTourLocation(): void {
    this.store.patch(
      { center: null, currentLocation: '' },
      'Reset Weather Updates tour location'
    );
  }

  setRainfallContourOpacity(
    opacity: number,
    rainfallContourType: RainfallContourTypes
  ): void {
    this.setOverlayOpacity(opacity);
  }

  setOverlayOpacity(opacity: number): void {
    console.trace('setOverlayOpacity', opacity);

    this.store.patch(
      {
        overlayOpacity: opacity,
      },
      `Overlay opacity set to ${opacity}`
    );
  }

  hideWeatherOverlays(): void {
    this.setOverlayOpacity(0);
  }

  getRainfallContour$(
    rainfallContourType: RainfallContourTypes
  ): Observable<{ opacity: number }> {
    return this.overlayOpacity$.pipe(map((opacity) => ({ opacity })));
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
  activateTyphoonTrack(): void {
    this.store.patch(
      {
        typhoonTrack: {
          ...this.store.state.typhoonTrack,
          shown: true,
          expanded: true,
        },

        weatherSatellite: {
          ...this.store.state.weatherSatellite,
          shown: true,
          expanded: true,
        },
      },
      'Activate Typhoon Track and Himawari Satellite'
    );
  }

  activateRainfall(): void {
    this.store.patch(
      {
        rainfallContourTypes: {
          ...this.store.state.rainfallContourTypes,
          shown: true,
        },
        temperature: {
          ...this.store.state.temperature,
          shown: false,
        },
      },
      'Activate Rainfall'
    );
  }

  activateTemperature(): void {
    this.store.patch(
      {
        rainfallContourTypes: {
          ...this.store.state.rainfallContourTypes,
          shown: false,
        },
        temperature: {
          ...this.store.state.temperature,
          shown: true,
          expanded: true,
        },
      },
      'Activate Temperature'
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

  resetWeatherUpdates(): void {
    this.store.patch(
      {
        typhoonTrack: {
          ...this.store.state.typhoonTrack,
          shown: false,
          expanded: false,
        },

        weatherSatellite: {
          ...this.store.state.weatherSatellite,
          shown: false,
          expanded: false,
        },

        rainfallContourTypes: {
          ...this.store.state.rainfallContourTypes,
          shown: true,
        },

        temperature: {
          ...this.store.state.temperature,
          shown: false,
        },
      },
      'Reset Weather Updates'
    );
  }

  // restoreWeatherOverlays(): void {
  //   this.setOverlayOpacity(80);
  // }

  // TEMPERATURE

  getTemperatures(): TemperatureState {
    return this.store.state.temperature;
  }
  getTemperature(type: TemperatureType): TemperatureTypeState {
    return this.store.state.temperature.types[type];
  }

  getTemperature$(type: TemperatureType): Observable<TemperatureTypeState> {
    return this.overlayOpacity$.pipe(
      map((opacity) => ({
        opacity,
        fetched: this.store.state.temperature.types[type].fetched,
      }))
    );
  }

  getTemperatureOpacity(type: TemperatureType): number {
    return this.store.state.overlayOpacity;
  }

  getActiveWeatherRoute(): string {
    return this.getTemperatureShown()
      ? '/weather-updates/temperature'
      : '/weather-updates/rainfall-contour';
  }

  setTemperatureOpacity(opacity: number, type: TemperatureType): void {
    this.setOverlayOpacity(opacity);
  }

  selectTemperatureType(tempType: TemperatureType): void {
    console.log('Before patch:', this.store.state);
    this.store.patch(
      {
        temperature: {
          ...this.store.state.temperature,
          shown: true,
          expanded: true,
          selectedType: tempType,
        },
        rainfallContourTypes: {
          ...this.store.state.rainfallContourTypes,
          shown: false,
        },
      },
      `Select Temperature Type: ${tempType}`
    );
    console.log('After patch:', this.store.state);
  }

  selectTemperatureForecastDay(day: TemperatureForecastDay): void {
    const temperature = {
      ...this.store.state.temperature,
    };

    temperature.selectedForecastDay = day;
    this.store.patch(
      { temperature },
      `Select Temperature Forecast Day: ${day}`
    );
  }

  toggleTemperatureGroupExpansion(): void {
    const temperature = {
      ...this.store.state.temperature,
    };

    temperature.expanded = !temperature.expanded;
    this.store.patch({ temperature }, `toggle temperature expansion`);
  }

  toggleTemperatureGroupVisibility(): void {
    const temperature = {
      ...this.store.state.temperature,
    };
    const { shown } = temperature;
    const rainfallContourTypes = {
      ...this.store.state.rainfallContourTypes,
      shown,
    };

    temperature.shown = !shown;
    this.store.patch(
      { temperature, rainfallContourTypes },
      `toggle Temperature Visibility ${!shown}`
    );
  }
}
