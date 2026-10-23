import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MapService } from '@core/services/map.service';
import mapboxgl, {
  AnySourceData,
  GeolocateControl,
  Map,
  Marker,
} from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import turfArea from '@turf/area';
import turfLength from '@turf/length';
import { environment } from '@env/environment';
import {
  BehaviorSubject,
  combineLatest,
  from,
  fromEvent,
  Observable,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  pluck,
  shareReplay,
  skip,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { getHazardColor } from '@shared/mocks/flood';
import {
  hasStandardBasemap,
  NOAH_HAZARD_SLOT,
  NOAH_OVERLAY_SLOT,
  StandardSlot,
  withStandardLightingNoop,
} from '@core/services/standard-style';
import {
  criticalFacilities,
  CriticalFacility,
  CRITICAL_FACILITIES_ARR,
  getCircleLayer,
  getClusterTextCount,
  getSymbolLayer,
} from '@shared/mocks/critical-facilities';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import {
  SENSORS,
  SensorService,
  SensorType,
} from '@features/noah-playground/services/sensor.service';

const Highcharts = require('highcharts/highstock');
// Load Highcharts Maps as a module
require('highcharts/modules/map')(Highcharts);
declare const require: any;
import HC_exporting from 'highcharts/modules/exporting';
import HC_Data from 'highcharts/modules/export-data';
import Accessbility from 'highcharts/modules/accessibility';
import { SensorChartService } from '@features/noah-playground/services/sensor-chart.service';

import {
  QcSensorService,
  QCSENSORS,
  QCCRITFAC,
  QCBoundary,
  BARANGAYBOUNDARY,
} from '@features/noah-playground/services/qc-sensor.service';

import {
  ContourMapType,
  HazardLevel,
  HazardType,
  LandslideHazards,
  PH_DEFAULT_CENTER,
  VolcanoType,
  WeatherSatelliteState,
  WeatherSatelliteType,
  WeatherSatelliteTypeState,
  WEATHER_SATELLITE_ARR,
  QC_DEFAULT_CENTER,
  QuezonCityCriticalFacilitiesState,
  QuezonCityCriticalFacilities,
  QuezonCitySensorType,
  QuezonCityMunicipalBoundary,
  BarangayBoundary,
  LAGUNA_DEFAULT_CENTER,
  BoundariesType,
  LightningTypes,
  TemperatureType,
  TemperatureForecastDay,
  WindForecastDay,
  WIND_FORECAST_DAYS,
} from '@features/noah-playground/store/noah-playground.store';
import {
  QCSensorChartOpts,
  QcSensorChartService,
} from '@features/noah-playground/services/qc-sensor-chart.service';
import {
  NOAH_COLORS,
  IOT_SENSOR_COLORS,
  SENSOR_COLORS,
  TYPHOON_TRACK_COLORS,
} from '@shared/mocks/noah-colors';
import { QcLoginService } from '@features/noah-playground/services/qc-login.service';
import { ModalService } from '@features/noah-playground/services/modal.service';
import {
  TYPHOON,
  TyphoonTrackService,
  TyphoonTrackType,
} from '@features/noah-playground/services/typhoon-track.service';
// import { url } from 'inspector';

type MapStyle = 'terrain' | 'satellite' | 'standard';

type WindGrid = {
  uGrid: number[][];
  vGrid: number[][];
};

type WindParticle = {
  lng: number;
  lat: number;
  age: number;
};

type LayerSettingsParam = {
  layerID: string;
  sourceID: string;
  sourceLayer: string;
  hazardType: HazardType;
  hazardLevel: HazardLevel;
};

type RawHazardType = 'lh' | 'fh' | 'ssh';
type RawHazardLevel =
  | RawFloodReturnPeriod
  | RawStormSurgeAdvisory
  | RawLandslideHazards;

export type RawFloodReturnPeriod = '5yr' | '25yr' | '100yr';

export type RawStormSurgeAdvisory = 'ssa1' | 'ssa2' | 'ssa3' | 'ssa4';

export type RawWeatherSatellite = 'himawari' | 'himawari-GSMAP';

export type RawLandslideHazards =
  | 'lh1' // landslide
  | 'lh2' // alluvial fan and debris flow
  | 'lh3'; // unstable slopes

type LH2Subtype = 'af' | 'df';

/**
 * The gap between the Mapbox logo and the scale bar that sits above it.
 */
const SCALE_LOGO_GAP = 6;

/**
 * The CSS variables the playground publishes so the overlays that follow the
 * scale bar can find it.
 *
 * They are set on the host element of the playground, which holds the map (and
 * with it the scale bar) as well as the coordinate readout, so both read the
 * same numbers.
 */
const SCALE_LEFT_VARIABLE = '--noah-scale-left';
const SCALE_BOTTOM_VARIABLE = '--noah-scale-bottom';
const SCALE_HEIGHT_VARIABLE = '--noah-scale-height';

/**
 * How long the scale bar waits before it follows a change of the layout.
 *
 * The Mapbox logo moves while the drawer is dragged on a phone, so the short
 * delay turns a burst of changes into a single measurement.
 */
const SCALE_REPOSITION_DELAY = 100;

HC_exporting(Highcharts);
HC_Data(Highcharts);
Accessbility(Highcharts);

@Component({
  standalone: false,
  selector: 'noah-map-playground',
  templateUrl: './map-playground.component.html',
  styleUrls: ['./map-playground.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MapPlaygroundComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  map!: Map;

  geolocateControl!: GeolocateControl;
  centerMarker!: Marker;
  pgLocation: string = '';
  mapStyle: MapStyle = 'standard';

  /**
   * Id of the NOAH-owned DEM source backing the 3D Terrain exaggeration.
   *
   * The legacy `terrain` / `satellite` basemaps ship their own terrain with a
   * fixed exaggeration, so the source is re-declared on every `style.load` to
   * take precedence over whatever the incoming style asks for.
   */
  private readonly terrainSourceId = 'noah-terrain-dem';

  /**
   * Handle of the pending idle callback that runs the deferred (non-essential)
   * layer initialisation, and its `setTimeout` fallback for browsers without
   * `requestIdleCallback`. Tracked so a queued pass can be cancelled on destroy
   * or superseded by a newer `style.load`.
   */
  private deferredInitHandle: number | null = null;
  private deferredInitFallbackTimer: number | null = null;

  /**
   * Watches the layout for the changes that move the Mapbox logo the scale
   * bar follows. See {@link watchLogoPosition}.
   */
  private logoObserver: MutationObserver | null = null;

  /** The pending repositioning of the scale bar, if any. */
  private scaleRepositionTimer: number | null = null;

  isMapboxAttrib;
  disclaimerModal: boolean;
  showAlert: boolean = false;
  private _graphShown = false;
  private _unsub = new Subject();
  private _changeStyle = new Subject();
  LoginStatus$: Observable<boolean>;
  showAlert$ = new Subject<boolean>();
  private subscriptions: Subscription[] = [];
  isWarningAlert: boolean = true;
  municity = [];
  draw: any;
  distanceContainer: any;
  geojson: any;
  linestring: any;
  private measurementActive: boolean = false;
  screenWidth: number;
  screenHeight: number;

  /**
   * How far above the bottom edge of the map the shared attribution sits.
   *
   * The page raises the credits when the drawer covers the bottom of the map
   * on a phone.
   */
  @Input() attributionBottomOffset: number | null = null;

  /**
   * How wide the shared attribution may take.
   *
   * The page narrows the credits when the sidebar covers the map.
   */
  @Input() attributionMaxWidth: number | null = null;

  private realtimeLightningSocket: WebSocket | null = null;
  private realtimeLightningResetTimer: number | null = null;
  private realtimeLightningKeepAlive: number | null = null;
  private isRealtimeLightningRunning = false;
  private realtimeLightningFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Point> =
    {
      type: 'FeatureCollection',
      features: [],
    };
  private realtimeLightningDataAvailable$ = new BehaviorSubject<boolean>(false);

  private pruneRealtimeLightningFeatures(): void {
    const cutoff = Date.now() - 60000;
    const filteredFeatures =
      this.realtimeLightningFeatureCollection.features.filter((feature) => {
        const createdAt = feature.properties?.createdAt;
        if (typeof createdAt === 'number') {
          return createdAt >= cutoff;
        }

        const timestamp = feature.properties?.timestamp;
        if (typeof timestamp === 'number') {
          return timestamp >= cutoff;
        }
        if (typeof timestamp === 'string') {
          const parsed = Date.parse(timestamp);
          return !isNaN(parsed) ? parsed >= cutoff : true;
        }

        return true;
      });

    if (
      filteredFeatures.length ===
      this.realtimeLightningFeatureCollection.features.length
    ) {
      return;
    }

    this.realtimeLightningFeatureCollection.features = filteredFeatures;
    const source = this.map.getSource('realtime-lightning') as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (source) {
      source.setData(this.realtimeLightningFeatureCollection);
    }
    this.realtimeLightningDataAvailable$.next(filteredFeatures.length > 0);
  }

  @ViewChild('selectQc') selectQc: ElementRef;
  @ViewChild('windCanvas') windCanvas: ElementRef<HTMLCanvasElement>;

  private readonly windGridBounds = {
    west: 105,
    east: 160,
    south: -5,
    north: 30,
  };
  private readonly windGridCols = 26;
  private readonly windGridRows = 18;
  private readonly windSettings = {
    count: 1000,
    speed: 0.5,
    maxAge: 70,
    color: '#67FF01',
  };
  private windGrid: WindGrid | null = null;
  private windNextGrid: WindGrid | null = null;
  private windGridDay: WindForecastDay | null = null;
  private windNextGridDay: WindForecastDay | null = null;
  private windBlend = 0;
  private windGridCache: { [day: number]: WindGrid } = {};
  private windCacheDate = '';
  private windParticles: WindParticle[] = [];
  private windAnimationFrame: number | null = null;
  private windLastTimestamp: number | null = null;
  private windVisible = false;
  private windResizeListener: (() => void) | null = null;
  private windMapMoving = false;
  private windMoveStartListener: (() => void) | null = null;
  private windMoveEndListener: (() => void) | null = null;
  private windLiveGridPromise: Promise<WindGrid> | null = null;
  private windForecastPayload: { points: any[] } | null = null;
  private windForecastPayloadPromise: Promise<{ points: any[] }> | null = null;
  private windLoadToken = 0;

  constructor(
    private http: HttpClient,
    private mapService: MapService,
    private pgService: NoahPlaygroundService,
    private sensorChartService: SensorChartService,
    private sensorService: SensorService,
    private qcSensorService: QcSensorService,
    private qcSensorChartService: QcSensorChartService,
    private modalService: ModalService,
    private typhoonService: TyphoonTrackService,
    private elementRef: ElementRef<HTMLElement>
  ) {
    // this.getScreenSize();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();

    fromEvent(this.map, 'style.load')
      .pipe(first(), takeUntil(this._unsub))
      .subscribe(() => {
        this.map.resize();
        this.addGeolocationControls();
        this.initCenterListener();
        this.initGeolocationListener();
        this.initCalculation();
        this.getScreenSize();
        this.iniScaleControl();
      });
    // this.getScreenSize();

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        // Essential work first: the Standard basemap configuration, the 3D
        // terrain and the initial camera. These are cheap, define the first
        // frame the user sees, and must not be delayed. They add no data
        // layers, so moving them out of the previous single chain does not
        // change layer stacking.
        this.initEssentialLayers();
        // Everything else (≈20 hazard / weather layer groups, several large
        // image and video downloads, the hazard tileset) is deferred until the
        // browser is idle so it cannot delay the first basemap paint or the
        // first pan/zoom gesture. See scheduleDeferredInit().
        this.scheduleDeferredInit();
      });
  }

  /**
   * Layer groups that must exist the moment the style is ready.
   *
   * These are the pieces that define the first frame the user actually sees:
   * the Mapbox Standard basemap configuration, the 3D terrain, and the initial
   * camera (including the QC / Laguna admin camera). None of them adds a data
   * layer, so the relative stacking of the NOAH overlays is unaffected by the
   * split from {@link initDeferredLayers}.
   */
  private initEssentialLayers(): void {
    // The playground basemap is a Mapbox Standard style. Apply its
    // configuration before any custom layer is added so slots resolve
    // against a fully configured basemap.
    this.mapService.applyStandardConfig(this.map);
    this.addExaggerationControl();
    this.initQcCenterListener();
    this.initLagunaCenterListener();
    this.initWeatherUpdates();
  }

  /**
   * The remaining layer groups, run lazily once the map is interactive.
   *
   * Every layer produced here is either hidden at start-up (hazard fills,
   * boundaries, volcanoes, critical facilities, risk-assessment rainfall)
   * or gated behind the weather-updates toggle (satellite video, rainfall
   * contours, wind). Initialising them outside the first paint keeps the
   * basemap responsive while the data loads progressively behind it. The
   * order is unchanged from the original chain so overlay stacking is
   * identical.
   */
  private initDeferredLayers(): void {
    this.addCriticalFacilityLayers();
    this.initHazardLayers();
    //this.initSensors();
    this.initQuezonCitySensors();
    this.initQCCritFac();
    this.initQCMunicipalBoundary();
    this.initVolcanoes();
    this.initBoundaries();
    this.initWeatherSatelliteLayers();
    this.showContourMaps();
    this.initBarangayBoundary();
    this.initAffectedExposure();
    this.initRainForcast();
    this.initTyphoonTrack();
    this.initPar();
    //this.initLightning();
    this.initTemperature();
    this.initWind();
    this.initRiverbasin();
  }

  /**
   * Schedules {@link initDeferredLayers} for the next idle period.
   *
   * `requestIdleCallback` (Chrome / Edge / Firefox) runs the work in a gap in
   * the main thread — after the first basemap paint and while the user is not
   * interacting — with a 1500ms timeout so the layers still appear promptly on
   * a busy page. Safari has no `requestIdleCallback`; a zero-delay macrotask is
   * used there, which still runs after the current frame rather than blocking
   * it. Any pending pass is cancelled first so a second `style.load` cannot
   * queue a duplicate run.
   */
  private scheduleDeferredInit(): void {
    this.cancelDeferredInit();

    const run = () => {
      this.deferredInitHandle = null;
      this.deferredInitFallbackTimer = null;

      // The component may have been destroyed (or the map released) while the
      // callback waited for an idle gap.
      if (this._unsub.isStopped) {
        return;
      }

      this.initDeferredLayers();
    };

    const win = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      this.deferredInitHandle = win.requestIdleCallback(run, { timeout: 1500 });
    } else {
      this.deferredInitFallbackTimer = window.setTimeout(run, 0);
    }
  }

  /** Cancels a pending {@link scheduleDeferredInit} pass, if any. */
  private cancelDeferredInit(): void {
    const win = window as typeof window & {
      cancelIdleCallback?: (handle: number) => void;
    };

    if (this.deferredInitHandle !== null && win.cancelIdleCallback) {
      win.cancelIdleCallback(this.deferredInitHandle);
    }
    this.deferredInitHandle = null;

    if (this.deferredInitFallbackTimer !== null) {
      window.clearTimeout(this.deferredInitFallbackTimer);
    }
    this.deferredInitFallbackTimer = null;
  }

  /**
   * Runs `build` immediately if `shown$` already emits `true`, otherwise the
   * first time it does.
   *
   * This is how the expensive optional overlays (weather-satellite video,
   * rainfall contours, temperature / rainfall-forecast rasters, wind) avoid
   * downloading anything while they are hidden: the source, layer and their
   * subscriptions are not created until the layer is actually requested.
   *
   * The callers re-arm this on every `style.load`, and the subscription is
   * torn down by `_changeStyle` / destroy, so a basemap switch rebuilds the
   * overlay if it is still shown while a switch while it is hidden simply
   * waits for the next show.
   */
  private runWhenFirstShown(shown$: Observable<boolean>, build: () => void) {
    shown$
      .pipe(
        filter((shown) => shown === true),
        take(1),
        takeUntil(this._unsub),
        takeUntil(this._changeStyle)
      )
      .subscribe(() => build());
  }

  ngOnDestroy(): void {
    // Drop any queued deferred layer initialisation before the map is torn
    // down so it cannot run against a destroyed map.
    this.cancelDeferredInit();
    // Stop watching the layout for the Mapbox logo and drop a pending
    // repositioning of the scale bar.
    if (this.logoObserver) {
      this.logoObserver.disconnect();
      this.logoObserver = null;
    }
    if (this.scaleRepositionTimer !== null) {
      window.clearTimeout(this.scaleRepositionTimer);
      this.scaleRepositionTimer = null;
    }
    // The place of the scale bar is published to the host element, so drop it
    // again instead of leaving it behind for the next playground.
    const host = this.elementRef.nativeElement;
    host.style.removeProperty(SCALE_LEFT_VARIABLE);
    host.style.removeProperty(SCALE_BOTTOM_VARIABLE);
    host.style.removeProperty(SCALE_HEIGHT_VARIABLE);
    // Cancel the wind particle RAF loop first: it reads from `this.map` and
    // paints to the (now detached) canvas, so it must not outlive the map.
    this.stopWindAnimation();
    this.removeWindResizeListener();
    this.removeWindMoveListeners();
    // The lighting control owns the Philippine-Time clock; it stops itself on
    // destroy. Release the map reference last.
    this._unsub.next(null);
    this._unsub.complete();
    this._changeStyle.next(null);
    this._changeStyle.complete();
    this.mapService.releaseMap(this.map);
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    // The Mapbox logo the scale bar follows moves with the window.
    this.scheduleScaleReposition();
  }

  /**
   * Adds the geolocation map control
   *
   * The control's own button is hidden (`showButton: false`); the locate
   * action lives in the NOAH map controls toolbar, which triggers the control
   * programmatically.
   */
  addGeolocationControls() {
    this.geolocateControl = this.mapService.getNewGeolocateControl();
    this.map.addControl(this.geolocateControl, 'top-right');
  }

  /**
   * Listen to the changes in the page state's center
   */
  initCenterListener() {
    this.pgService.center$
      .pipe(
        distinctUntilChanged(),
        takeUntil(this._unsub),
        filter((center) => center !== null)
      )
      .subscribe((center) => {
        this.map.flyTo({
          center,
          zoom: 17,
          essential: true,
        });

        if (!this.centerMarker) {
          this.centerMarker = new mapboxgl.Marker({
            color: '#4D4C51',
            draggable: true,
          })
            .setLngLat(center)
            .addTo(this.map)
            .on('dragend', (e) => {
              // Update the center position when the marker is dragged
              const coords = document.getElementById('coordinates');
              const LngLat = this.centerMarker.getLngLat();
              coords.style.display = 'block';
              coords.innerHTML = `Lon: ${LngLat.lng.toFixed(
                5
              )}<br />Lat: ${LngLat.lat.toFixed(5)}`;
              this.mapService.dragReverseGeocode(LngLat.lat, LngLat.lng);
              this.map.flyTo({
                center: LngLat,
                zoom: 17,
                speed: 1.2,
                curve: 1,
                easing: (t) => t,
                essential: true,
              });
            });
        } else {
          this.centerMarker.setLngLat(center);
        }
      });
  }

  initQcCenterListener() {
    const centerQc = localStorage.getItem('loginStatus');
    if (centerQc == '1') {
      this.map.flyTo({
        center: QC_DEFAULT_CENTER,
        zoom: 12,
        essential: true,
        duration: 1000,
      });
    }
  }

  initLagunaCenterListener() {
    const centerLagunna = localStorage.getItem('loginStatus');
    if (centerLagunna == '2') {
      this.map.flyTo({
        center: LAGUNA_DEFAULT_CENTER,
        zoom: 12.74,
        essential: true,
        duration: 1000,
      });
    }
  }

  iniScaleControl() {
    // The playground shows its Mapbox logo in the bottom-left corner of the
    // map, so the scale bar sits right above it instead of in the right-hand
    // column of the controls toolbar.
    this.mapService.attachScaleControl(this.map, 'bottom-left');
    this.positionScaleAboveLogo();
    this.watchLogoPosition();
  }

  /**
   * Moves the scale bar directly above the Mapbox logo in the bottom-left
   * corner of the map.
   *
   * The playground draws its own Mapbox logo next to the sidebar (the logo of
   * the map itself sits behind the sidebar) and on a phone that logo moves to
   * the top of the drawer. The logo is therefore measured instead of being
   * hard-coded, so the scale bar follows it wherever it is.
   */
  private positionScaleAboveLogo(): void {
    const container = document.getElementById('custom-scale-control');
    const mapContainer = this.map?.getContainer();

    if (!container || !mapContainer) {
      return;
    }

    const logo = this.findVisibleMapboxLogo();

    if (!logo) {
      return;
    }

    const logoRect = logo.getBoundingClientRect();
    const mapRect = mapContainer.getBoundingClientRect();

    const left = Math.round(logoRect.left - mapRect.left);
    const bottom = Math.round(mapRect.bottom - logoRect.top + SCALE_LOGO_GAP);
    const height = Math.round(container.getBoundingClientRect().height);

    this.publishScalePosition(left, bottom, height);
  }

  /**
   * Publishes where the scale bar is, so the overlays that follow it can find
   * it.
   *
   * The variables go on the host element of the playground, which is the one
   * ancestor shared by the map (and with it the scale bar) and the coordinate
   * readout that sits above the scale bar.
   */
  private publishScalePosition(
    left: number,
    bottom: number,
    height: number
  ): void {
    const host = this.elementRef.nativeElement;

    host.style.setProperty(SCALE_LEFT_VARIABLE, `${left}px`);
    host.style.setProperty(SCALE_BOTTOM_VARIABLE, `${bottom}px`);
    host.style.setProperty(SCALE_HEIGHT_VARIABLE, `${height}px`);
  }

  /**
   * The Mapbox logo the reader can actually see.
   *
   * The playground has up to three logos in the page: the one of the map
   * itself, the one next to the sidebar and the one on top of the drawer on a
   * phone. Only one of them is on screen at a time, the others are hidden
   * behind the sidebar or the drawer. A logo counts as visible when the point
   * in its middle hits the logo itself and not the panel that covers it.
   */
  private findVisibleMapboxLogo(): HTMLElement | null {
    const logos = Array.from(
      document.querySelectorAll<HTMLElement>('.mapboxgl-ctrl-logo')
    );

    for (const logo of logos) {
      const rect = logo.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        continue;
      }

      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );

      if (hit && (hit === logo || logo.contains(hit) || hit.contains(logo))) {
        return logo;
      }
    }

    return null;
  }

  /**
   * Watches the layout for the changes that move the Mapbox logo: the
   * sidebar being opened or closed, the drawer being dragged on a phone and
   * the window being resized.
   */
  private watchLogoPosition(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.logoObserver = new MutationObserver(() =>
      this.scheduleScaleReposition()
    );
    this.logoObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  /**
   * Repositions the scale bar after the layout settled.
   *
   * The repositioning is delayed and only done once per burst of changes, so
   * dragging the drawer does not measure the logo on every pixel.
   */
  private scheduleScaleReposition(): void {
    if (this.scaleRepositionTimer !== null) {
      return;
    }

    this.scaleRepositionTimer = window.setTimeout(() => {
      this.scaleRepositionTimer = null;
      this.positionScaleAboveLogo();
    }, SCALE_REPOSITION_DELAY);
  }

  /**
   * Initializes reverse geocoder.
   *
   * Reverse Geocoding is the process of identifying the human-friendly format of an address
   * given a valid latitude and longitude pair.
   *
   * We always set the current location to the result of the reverse geocoder function.
   */

  initGeolocationListener() {
    const _this = this;

    fromEvent(this.geolocateControl, 'geolocate')
      .pipe(takeUntil(this._unsub), debounceTime(2500))
      .subscribe(locateUser);

    async function locateUser(e) {
      try {
        const { latitude, longitude } = e.coords;
        const myPlace = await _this.mapService.reverseGeocode(
          latitude,
          longitude
        );

        _this.pgService.setCurrentLocation(myPlace);
      } catch (error) {
        // temporary
        alert(
          'Unable to retrieve your location, please manually input your city / brgy'
        );
      }
    }
  }

  // start OF QC IOT
  initQuezonCitySensors() {
    QCSENSORS.forEach((qcSensorType) => {
      this.qcSensorService
        .getQcSensors(qcSensorType)
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          const qcTextID = `${qcSensorType}-text`;
          const minZoom = 12;
          // Both layers share one GeoJSON source. Mapbox GL JS v3 requires a
          // named source referenced by id, so declare it explicitly.
          this.addNoahSource(qcSensorType, { type: 'geojson', data });
          // add layer to map
          this.addNoahLayer({
            id: qcSensorType,
            type: 'circle',
            source: qcSensorType,
            paint: {
              'circle-color': IOT_SENSOR_COLORS[qcSensorType],
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5.5,
                10, // Minimum zoom level: circle radius of 5
                12,
                12, // Minimum zoom level: circle radius of 12
                18,
                20, // Maximum zoom level: circle radius of 20
              ],
              'circle-opacity': 0,
            },
          });
          this.addNoahLayer({
            id: qcTextID,
            type: 'symbol',
            source: qcSensorType,
            layout: {
              'text-field': [
                'case',
                ['==', ['get', 'iot_type'], 'rain'],
                ['concat', ['get', 'latest_data'], 'mm'],
                ['concat', ['get', 'latest_data'], 'm'],
              ],
              'text-allow-overlap': true,
              'text-optional': true,
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 18,
              'text-offset': [0, 1],
              'text-anchor': 'top',
              'text-letter-spacing': 0.05,
              visibility: 'none',
            },
            paint: {
              'text-color': [
                'case',
                ['==', ['get', 'iot_type'], 'rain'],
                '#06b9e6',
                '#519259',
              ],
            },
            minzoom: minZoom,
          });
          // add show/hide listeners

          combineLatest([
            this.pgService.qcSensorsGroupShown$,
            this.pgService.getQuezonCitySensorTypeShown$(qcSensorType),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              this.map.setPaintProperty(
                qcSensorType,
                'circle-opacity',
                +(groupShown && soloShown)
              );
              if (groupShown && soloShown) {
                if (this.map.getZoom() < minZoom) {
                  this.map.setLayoutProperty(qcTextID, 'visibility', 'visible');
                }
                this.map.setLayoutProperty(qcTextID, 'visibility', 'visible');
              } else {
                this.map.setLayoutProperty(qcTextID, 'visibility', 'none');
              }
            });

          this.pgService.setQuezonCitySensorTypeFetched(qcSensorType, true);
          // show mouse event listeners
          this.showQcDataPoints(qcSensorType);
        })
        .catch(() =>
          console.error(
            `Unable to fetch data from QC for sensors of type "${qcSensorType}"`
          )
        );
    });
  }

  // FUNCTIONS FOR IOT SENSOR DETAILS

  getFormattedIoTtype(item: any): string {
    switch (item) {
      case 'rain':
        return 'Rain Sensor';
      case 'flood':
        return 'Flood Sensor';
      default:
        return 'Unknown';
    }
  }

  getFormattedCategory(iotType: any, latestData: number): string {
    switch (iotType) {
      case 'rain':
        if (latestData <= 7.5) {
          return 'LIGHT';
        } else if (latestData > 7.5 && latestData <= 15) {
          return 'HEAVY';
        } else if (latestData > 15 && latestData <= 30) {
          return 'INTENSE';
        } else {
          return 'TORRENTIAL';
        }
      case 'flood':
        if (latestData <= 0.5) {
          return 'LOW';
        } else if (latestData > 0.5 && latestData <= 1.5) {
          return 'MEDIUM';
        } else {
          return 'HIGH';
        }
      default:
        return 'UNKNOWN';
    }
  }

  getStatusDynamicStyle(item: any): string {
    switch (item) {
      case 'Active':
        return 'style="color: green;"';
      case 'Inactive':
        return 'style="color: grey;"';
      default:
        return 'style="color: black;"';
    }
  }

  getCategoryDynamicStyle(latest_data: number, iot_type: string): string {
    switch (iot_type) {
      case 'rain':
        if (latest_data <= 7.5) {
          return 'style="color: #d1d5d8;"';
        } else if (latest_data > 7.5 && latest_data <= 15) {
          return 'style="color: #f2c94c;"';
        } else if (latest_data > 15 && latest_data <= 30) {
          return 'style="color: #f2994a"';
        } else {
          return 'style="color: #eb5757"';
        }
      case 'flood':
        if (latest_data <= 0.5) {
          return 'style="color: #f2c94c;"';
        } else if (latest_data > 0.5 && latest_data <= 1.5) {
          return 'style="color: #f2994a"';
        } else {
          return 'style="color: #eb5757"';
        }
      default:
        return 'style="color: red"';
    }
  }

  showQcDataPoints(qcSensorType: QuezonCitySensorType) {
    const graphDiv = document.getElementById('graph-dom');
    const qcchartMobile = document.getElementById('qc-chart-mobile');
    let chartPopUpOpen = false;

    const popUp = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: 'auto',
    });

    const popUpMobileView = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: 'auto',
    });

    const chartPopUp = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: 'auto',
    });

    const _this = this;

    combineLatest([
      this.pgService.qcSensorsGroupShown$,
      this.pgService.getQuezonCitySensorTypeShown$(qcSensorType),
    ])
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe(([groupShown, soloShown]) => {
        if (groupShown && soloShown) {
          // console.log(this.screenHeight, this.screenWidth)
          // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (this.screenWidth < 768) {
            // console.log("INSIDE screenWidth < 768");
            this.map.on('touchend', qcSensorType, (e) => {
              // console.log("entered click on screenWidth < 768");
              const coordinates = (
                e.features[0].geometry as any
              ).coordinates.slice();
              _this.map.flyTo({
                center: (e.features[0].geometry as any).coordinates.slice(),
                zoom: 13,
                offset: [0, -315],
                essential: true,
              });
              const name = e.features[0].properties.name;
              const iotType = e.features[0].properties.iot_type;
              const status = e.features[0].properties.status;
              const latestData = e.features[0].properties.latest_data;
              const batPercent = e.features[0].properties.battery_percent;
              const municity = e.features[0].properties.municity;
              this.municity = municity;
              const formattedBatPercent =
                batPercent && batPercent !== 'null'
                  ? `${batPercent}%`
                  : 'Not Available';
              const iotTypeLatestData =
                iotType && iotType == 'flood'
                  ? `${latestData}m`
                  : `${latestData}mm`;

              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }

              const popupContent = `
                <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">

                
                  <div style="font-family: Nunito; padding: 16px; width: 90vw;">
                  <div style="display: flex; justify-content: space-between">
                    <div>
                      <img src="assets/icons/noah_logo.png" alt="" style="height: 16px; display: inline-block; margin-right: 8px; vertical-align: middle;">
                      <div style="font-size: 20px; font-weight: bold; display: inline-block; vertical-align: middle;">IoT Sensor Details</div>
                    </div>
                    
                  </div>
                  
                  <hr style="height: 1px; border: none; border-top: 1px solid #ededed; margin-top: 16px; margin-bottom: 16px; width: 100%; align-items: center;">
                  
                    <div style="background-color: white; border-width: 1px; border-style: solid; border-color: #ededed; border-radius: 8px; padding: 16px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 18px; font-weight: bold; display: inline-block; padding: 0px; margin-right: 50px;">${name}</div>
                        <div style="font-size: 18px; font-weight: bold; display: inline-block; text-align: right;"><span id="category" ${this.getCategoryDynamicStyle(
                          parseFloat(iotTypeLatestData),
                          iotType
                        )}>${this.getFormattedCategory(
                iotType,
                parseFloat(iotTypeLatestData)
              )}</span><br><span id="iotTypeLatestData">${iotTypeLatestData}</span></div>
                      </div>
                    
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px; display: inline-block; padding: 0px; margin-right: 50px;" id="iotType">${this.getFormattedIoTtype(
                          iotType
                        )}</div>
                        <div style="font-size: 14px; font-weight: bold; display: inline-block; text-align: right;"><span id="status" ${this.getStatusDynamicStyle(
                          status
                        )}>${status}</span> &middot ${formattedBatPercent}</div>
                      </div>
                    </div>
                    
                    <div style="height: 16px;"></div>
                  
                  <div id="qc-chart-mobile" style="display: flex; justify-content: center; align-items: center; padding: 2px; width: 100%; border-style: solid; border-radius: 8px; border: 1px solid #ededed; z-index: auto;">
                      
                  </div>
                  
                </div>
                
                `;

              const pk = e.features[0].properties.pk;
              popUpMobileView
                .setLngLat((e.features[0].geometry as any).coordinates.slice())
                .setHTML(popupContent);
              // .setDOMContent(graphDiv);
              _this.showQcChartMobile(+pk, name, qcSensorType);
              popUpMobileView.addTo(_this.map);
            });
          } else {
            this.map.on('mouseover', qcSensorType, (e) => {
              const coordinates = (
                e.features[0].geometry as any
              ).coordinates.slice();
              const name = e.features[0].properties.name;
              const iotType = e.features[0].properties.iot_type;
              const status = e.features[0].properties.status;
              const latestData = e.features[0].properties.latest_data;
              const batPercent = e.features[0].properties.battery_percent;
              const municity = e.features[0].properties.municity;
              this.municity = municity;
              const formattedBatPercent =
                batPercent && batPercent !== 'null'
                  ? `${batPercent}%`
                  : 'Not Available';
              const iotTypeLatestData =
                iotType && iotType == 'flood'
                  ? `${latestData}m`
                  : `${latestData}mm`;

              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
              popUp.setLngLat(coordinates).setHTML(
                `
                <div style="color: #333333;font-size: 13px;padding-top: 4px;">
                  <div><b>Name:</b> ${name} </div>
                  <div><b>IoT Sensor Type:</b> ${iotType}</div>
                  <div><b>Status:</b> ${status}</div>
                  <div><b>Battery Level:</b> ${formattedBatPercent}</div>
                  <div><b>Latest Data:</b> ${iotTypeLatestData}</div>
                </div>
                `
              );
              if (!chartPopUpOpen) {
                popUp.addTo(_this.map);
              }
              _this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('click', qcSensorType, function (e) {
              graphDiv.hidden = false;
              chartPopUpOpen = false;
              _this.map.flyTo({
                center: (e.features[0].geometry as any).coordinates.slice(),
                zoom: 13,
                essential: true,
              });
              const name = e.features[0].properties.name;
              const pk = e.features[0].properties.pk;

              chartPopUp
                .setLngLat((e.features[0].geometry as any).coordinates.slice())
                .setDOMContent(graphDiv);
              chartPopUp.addTo(_this.map);
              _this.showQcChart(+pk, name, qcSensorType);
              popUp.remove();
            });
          }
        } else {
          popUp.remove();
          popUpMobileView.remove();
          chartPopUp.remove();
          this.map.on('mouseenter', qcSensorType, (e) => {
            _this._graphShown = false;
            _this.map.getCanvas().style.cursor = '';
            popUp.remove();
            popUpMobileView.remove();
            chartPopUpOpen = false;
          });
          this.map.on('mouseleave', qcSensorType, (e) => {
            _this._graphShown = false;
            _this.map.getCanvas().style.cursor = '';
            popUp.remove();
            popUpMobileView.remove();
            chartPopUpOpen = false;
          });
        }
      });
    popUp.on('close', () => (_this._graphShown = false));
    popUpMobileView.on('close', () => (_this._graphShown = false));
    this.map.on('mouseleave', qcSensorType, function () {
      if (_this._graphShown) return;
      _this.map.getCanvas().style.cursor = '';
      popUp.remove();
    });
  }

  // qc chart for mobile view
  async showQcChartMobile(
    pk: number,
    appID: string,
    qcSensorType: QuezonCitySensorType
  ) {
    localStorage.setItem('municity', JSON.stringify(this.municity));
    const _this = this;

    const options: any = {
      title: {
        text: null,
      },
      subtitle: {
        text: null,
      },
      credits: {
        enabled: false,
      },
      navigator: {
        enabled: true,
      },
      exporting: {
        fileName: 'Quezon IoT Data',
        buttons: {
          contextButton: {
            menuItems: [
              {
                text: 'Download PDF',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn === '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (
                    loggedIn === '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (devs) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Download CSV',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toLocaleString() === 'laguna'
                  ) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toLocaleString() === 'quezon_city'
                  ) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (devs) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Print Chart',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.print({
                      type: 'print',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.print({
                      type: 'print',
                    });
                  } else if (devs) {
                    this.print({
                      type: 'print',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Download JPEG',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (devs) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
                separator: false,
              },
            ],
          },
        },
      },

      ...this.qcSensorChartService.getQcChartOpts(qcSensorType),
    };
    const chart = Highcharts.stockChart('qc-chart-mobile', options);
    chart.showLoading();
    let qcSensorChartOpts; // Declare the variable outside the try block
    try {
      const data = await this.qcSensorService.getQcSensorData(pk);
      qcSensorChartOpts = {
        data: data,
        qcSensorType,
      };
      // Handle the response and chart options here
    } catch (error) {
      // Handle any errors
    }
    chart.hideLoading();
    this.qcSensorChartService.qcShowChart(chart, qcSensorChartOpts);
  }

  async showQcChart(
    pk: number,
    appID: string,
    qcSensorType: QuezonCitySensorType
  ) {
    localStorage.setItem('municity', JSON.stringify(this.municity));
    const _this = this;

    const options: any = {
      title: {
        text: `${appID}`,
        style: {
          fontSize: '23px', // set the font size to 16 pixels
        },
      },
      credits: {
        enabled: false,
      },
      navigator: {
        enabled: true,
      },
      exporting: {
        fileName: 'Quezon IoT Data',
        buttons: {
          contextButton: {
            menuItems: [
              {
                text: 'Download PDF',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn === '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (
                    loggedIn === '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (devs) {
                    this.exportChart({
                      type: 'application/pdf',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Download CSV',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toLocaleString() === 'laguna'
                  ) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toLocaleString() === 'quezon_city'
                  ) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (devs) {
                    this.downloadCSV({
                      type: 'application/csv',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Print Chart',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.print({
                      type: 'print',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.print({
                      type: 'print',
                    });
                  } else if (devs) {
                    this.print({
                      type: 'print',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
              },
              {
                text: 'Download JPEG',
                onclick: function () {
                  const loggedIn = localStorage.getItem('loginStatus');
                  const devs = localStorage.getItem('loginStatus') == 'devs';
                  const selectMunicity = _this.municity;
                  if (loggedIn === '0') {
                    _this.modalService.openLoginModal();
                  } else if (
                    loggedIn == '2' &&
                    selectMunicity.toString() === 'laguna'
                  ) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (
                    loggedIn == '1' &&
                    selectMunicity.toString() === 'quezon_city'
                  ) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (devs) {
                    this.exportChart({
                      type: 'image/jpeg',
                    });
                  } else if (loggedIn) {
                    _this.modalService.warningPopup();
                  } else {
                    _this.modalService.openLoginModal();
                  }
                },
                separator: false,
              },
            ],
          },
        },
      },

      ...this.qcSensorChartService.getQcChartOpts(qcSensorType),
    };
    const chart = Highcharts.stockChart('graph-dom', options);
    chart.showLoading();
    let qcSensorChartOpts; // Declare the variable outside the try block
    try {
      const data = await this.qcSensorService.getQcSensorData(pk);
      qcSensorChartOpts = {
        data: data,
        qcSensorType,
      };
      // Handle the response and chart options here
    } catch (error) {
      // Handle any errors
    }
    chart.hideLoading();
    this.qcSensorChartService.qcShowChart(chart, qcSensorChartOpts);
  }

  initQCCritFac() {
    QCCRITFAC.forEach((qcCriticalFacilities: QuezonCityCriticalFacilities) => {
      this.qcSensorService
        .getQcCriticalFacilities()
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          const critFacLayers = [
            {
              id: 'private_school',
              type: 'fill',
              color: '#FF87CA',
              filter: 'Private School',
            },
            {
              id: 'barangay',
              type: 'fill',
              color: '#9EA9F0',
              filter: 'Barangay',
            },
            {
              id: 'qc_hospitals',
              type: 'fill',
              color: '#CD5D7D',
              filter: 'Hospital',
            },
            {
              id: 'health_center',
              type: 'fill',
              color: '#F7D59C',
              filter: 'Health Center',
            },
            {
              id: 'university',
              type: 'fill',
              color: '#54BAB9',
              filter: 'University',
            },
            {
              id: 'elem_school',
              type: 'fill',
              color: '#B983FF',
              filter: 'Elementary School',
            },
            {
              id: 'high_school',
              type: 'fill',
              color: '#6E85B7',
              filter: 'High School',
            },
            {
              id: 'ps_outline',
              type: 'line',
              color: '#FF87CA',
              filter: 'Private School',
            },
            {
              id: 'b_outline',
              type: 'line',
              color: '#9EA9F0',
              filter: 'Barangay',
            },
            {
              id: 'h_outline',
              type: 'line',
              color: '#CD5D7D',
              filter: 'Hospital',
            },
            {
              id: 'hc_outline',
              type: 'line',
              color: '#F7D59C',
              filter: 'Health Center',
            },
            {
              id: 'u_outline',
              type: 'line',
              color: '#54BAB9',
              filter: 'University',
            },
            {
              id: 'es_outline',
              type: 'line',
              color: '#B983FF',
              filter: 'Elementary School',
            },
            {
              id: 'hs_outline',
              type: 'line',
              color: '#6E85B7',
              filter: 'High School',
            },
          ];

          // All critical-facility layers share one GeoJSON source. Mapbox GL JS v3
          // requires a named source referenced by id.
          this.addNoahSource(`${qcCriticalFacilities}-qc-critfac`, {
            type: 'geojson',
            data,
          });

          // add layers to map
          critFacLayers.forEach(({ id, type, color, filter }) => {
            const paint: any =
              type === 'fill'
                ? { 'fill-color': color, 'fill-opacity': 0.75 }
                : { 'line-color': color, 'line-width': 3, 'line-opacity': 1 };
            this.addNoahLayer({
              id,
              type: type as any,
              source: `${qcCriticalFacilities}-qc-critfac`,
              layout: { visibility: 'none' },
              paint,
              filter: ['==', 'CF Type', filter],
            });
          });

          // add show/hide listeners
          combineLatest([
            this.pgService.qcCriticalFacilitiesShown$,
            this.pgService.getQcCriticalFacilitiesShown$(qcCriticalFacilities),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              const visibility = groupShown && soloShown ? 'visible' : 'none';
              critFacLayers.forEach(({ id }) => {
                this.map.setLayoutProperty(id, 'visibility', visibility);
              });
            });
        })
        .catch(() =>
          console.error(
            `Unable to fetch qc critical facilities data "${qcCriticalFacilities}"`
          )
        );
    });
  }

  initQCMunicipalBoundary() {
    QCBoundary.forEach((qcMunicipalBoundary: QuezonCityMunicipalBoundary) => {
      this.qcSensorService
        .getQcMunicipalBoundary()
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          // Both boundary layers share one GeoJSON source. Mapbox GL JS v3
          // requires a named source referenced by id.
          this.addNoahSource(`${qcMunicipalBoundary}-qc-muni-boundary`, {
            type: 'geojson',
            data,
          });

          // add layer to map
          this.addNoahLayer({
            id: 'qc_muni_boundary',
            type: 'fill',
            source: `${qcMunicipalBoundary}-qc-muni-boundary`,
            layout: {
              visibility: 'none',
            },
            paint: {
              'fill-color': '#000000', // white fill
              'fill-opacity': 0.01,
            },
          });
          this.addNoahLayer({
            id: 'qc_muni_boudline',
            type: 'line',
            source: `${qcMunicipalBoundary}-qc-muni-boundary`,
            layout: {
              visibility: 'none',
            },
            paint: {
              'line-color': '#000', // black line
              'line-width': 3,
              'line-opacity': 0.75,
            },
          });

          // add show/hide listeners
          combineLatest([
            this.pgService.qcMunicipalBoundaryShown$,
            this.pgService.getQcMunicipalBoundaryShown$(qcMunicipalBoundary),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              const visibility = groupShown && soloShown ? 'visible' : 'none';
              this.map.setLayoutProperty(
                'qc_muni_boundary',
                'visibility',
                visibility
              );
              this.map.setLayoutProperty(
                'qc_muni_boudline',
                'visibility',
                visibility
              );
            });
        })
        .catch(() =>
          console.error(
            `Unable to fetch qc municipal boundary "${qcMunicipalBoundary}"`
          )
        );
    });
  }

  initBarangayBoundary() {
    BARANGAYBOUNDARY.forEach((barangayBoundary: BarangayBoundary) => {
      this.qcSensorService
        .getBarangayBoundary()
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          // Both boundary layers share one GeoJSON source. Mapbox GL JS v3 requires
          // a named source referenced by id.
          this.addNoahSource(`${barangayBoundary}-brgy-boundary-source`, {
            type: 'geojson',
            data,
          });

          // add layer to map
          this.addNoahLayer({
            id: 'brgy-boundary',
            type: 'fill',
            source: `${barangayBoundary}-brgy-boundary-source`,
            layout: {
              visibility: 'none',
            },
            paint: {
              'fill-color': '#000000', // white fill
              'fill-opacity': 0.01,
            },
          });
          this.addNoahLayer({
            id: 'brgy_boundline',
            type: 'line',
            source: `${barangayBoundary}-brgy-boundary-source`,
            layout: {
              visibility: 'none',
            },
            paint: {
              'line-color': '#000', // black line
              'line-width': 3,
              'line-opacity': 0.75,
              'line-dasharray': [1, 2],
            },
          });

          // add show/hide listeners
          combineLatest([
            this.pgService.barangayBoundaryShown$,
            this.pgService.getBarangayBoundaryShown$(barangayBoundary),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              const visibility = groupShown && soloShown ? 'visible' : 'none';
              this.map.setLayoutProperty(
                'brgy-boundary',
                'visibility',
                visibility
              );
              this.map.setLayoutProperty(
                'brgy_boundline',
                'visibility',
                visibility
              );
            });
        })
        .catch(() =>
          console.error(
            `Unable to fetch qc municipal boundary "${barangayBoundary}"`
          )
        );
    });
  }

  initPar() {
    this.addNoahSource('par-outline', {
      type: 'geojson',
      data: 'https://webgis-static.up.edu.ph/api/par/par_outline.json',
    });

    this.addNoahLayer({
      id: 'par-outline-layer',
      type: 'line',
      source: 'par-outline',
      layout: { visibility: 'none' },
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          '#FFFFFF', // White for PAR
          ['==', ['get', 'layer'], 'philoutline'],
          '#000000', // Black for philoutline
          '#FFFFFF', // Default to white
        ],
        'line-width': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          3, // Thicker line for PAR

          ['==', ['get', 'layer'], 'philoutline'],
          2, // Thinner line for philoutline
          2, // Default line width
        ],
        'line-opacity': 0.8,
        'line-dasharray': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          ['literal', [1, 0]], // Dashed lines for PAR only
          ['literal', [1, 0]], // Solid lines for philoutline (1px dash, 0px gap = solid)
        ],
      },
      filter: ['==', ['geometry-type'], 'LineString'], // Show only LineString geometries
    });

    combineLatest([
      this.pgService.weatherSatellitesShown$,
      this.pgService.typhoonTrackGroupShown$,
      this.pgService.weatherUpdatesGroupShown$,
    ])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([groupShown, soloShown, weatherUpdatesShown]) => {
        const visibility = groupShown || soloShown ? 'visible' : 'none';
        const visibilityForWeatherUpdates = weatherUpdatesShown
          ? 'visible'
          : 'none';

        const finalVisibility =
          visibility === 'visible' && visibilityForWeatherUpdates === 'visible'
            ? 'visible'
            : 'none';

        this.map.setLayoutProperty(
          'par-outline-layer',
          'visibility',
          finalVisibility
        );
      });
  }

  // END OF QC IOT
  // initSensors() {
  //   SENSORS.forEach((sensorType) => {
  //     this.sensorService
  //       .getSensors(sensorType)
  //       .pipe(first())
  //       .toPromise()
  //       .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
  //         // add layer to map
  //         this.addNoahLayer({
  //           id: sensorType,
  //           type: 'circle',
  //           source: {
  //             type: 'geojson',
  //             data,
  //           },
  //           paint: {
  //             'circle-color': SENSOR_COLORS[sensorType],
  //             'circle-radius': 5,
  //             'circle-opacity': 0,
  //           },
  //         });

  //         // add show/hide listeners
  //         combineLatest([
  //           this.pgService.sensorsGroupShown$,
  //           this.pgService.getSensorTypeShown$(sensorType),
  //         ])
  //           .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
  //           .subscribe(([groupShown, soloShown]) => {
  //             this.map.setPaintProperty(
  //               sensorType,
  //               'circle-opacity',
  //               +(groupShown && soloShown)
  //             );
  //           });

  //         this.pgService.setSensorTypeFetched(sensorType, true);
  //         // show mouse event listeners
  //         this.showDataPoints(sensorType);
  //       })
  //       .catch(() =>
  //         console.error(
  //           `Unable to fetch data from DOST for sensors of type "${sensorType}"`
  //         )
  //       );
  //   });
  // }

  /**
   * Risk-assessment rainfall forecast is a raster image that is hidden until
   * the risk-assessment group is turned on (`riskAssessment.shown` defaults to
   * `false`). The image is only created once both the group and the rainfall
   * layer are shown.
   */
  initRainForcast() {
    this.runWhenFirstShown(
      combineLatest([
        this.pgService.riskAssessmentGroupShown$,
        this.pgService.rainForcastShown$,
      ]).pipe(map(([groupShown, rainShown]) => groupShown && rainShown)),
      () => this.buildRainForcastLayer()
    );
  }

  private buildRainForcastLayer() {
    const rainForcastImage = {
      'rain-forecast': {
        url: 'https://webgis-static.up.edu.ph/api/rainfall/rainmap_gtif_day1.png',
        type: 'image',
      },
    };

    const getRainForcastSource = (rainForcastDetails: {
      url: string;
      type: string;
    }): AnySourceData => {
      switch (rainForcastDetails.type) {
        case 'image':
          return {
            type: 'image',
            url: rainForcastDetails.url,
            coordinates: [
              [116.855, 19.402],
              [127.055, 19.402],
              [127.055, 5.205],
              [116.855, 5.205],
            ],
          };
        default:
          throw new Error('[Map Playground] Unable to get Rain Forcast');
      }
    };
    Object.keys(rainForcastImage).forEach((rainType) => {
      const rainForcastDetails = rainForcastImage[rainType];
      this.addNoahSource(rainType, getRainForcastSource(rainForcastDetails));

      this.addNoahLayer({
        id: rainType,
        type: 'raster',
        source: rainType,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0,
        },
      });
      this._removeOverlayOnLoadError(rainType, [rainType]);

      const soloShown$ = this.pgService.rainForcastShown$.pipe(shareReplay(1));

      const allShown$ = this.pgService.riskAssessmentGroupShown$.pipe(
        shareReplay(1)
      );

      const rainForeCast$ = this.pgService
        .getRainRiskAssessment$('rain-forecast')
        .pipe(shareReplay(1));

      combineLatest([allShown$, soloShown$, rainForeCast$])
        .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
        .subscribe(([allShown, groupShown, rainForeCast]) => {
          let newOpacity = 0;
          if (allShown && groupShown) {
            newOpacity = rainForeCast.opacity / 100;
          }
          // let opacity = +(allShown && groupShown);
          if (this.map.getLayer(rainType)) {
            this.map.setPaintProperty(rainType, 'raster-opacity', newOpacity);
          }
        });
    });
  }

  async initTyphoonTrack() {
    const typhoonLayerSourceFile: string =
      'https://webgis-static.up.edu.ph/api/typhoon_track/pagasa_typhoon.geojson';

    // Legends
    const typhoonLegend = {
      LPA: 'assets/legends/typhoon-track/LPA.png',
      STS: 'assets/legends/typhoon-track/STS.png',
      STY: 'assets/legends/typhoon-track/STY.png',
      TD: 'assets/legends/typhoon-track/TD.png',
      TS: 'assets/legends/typhoon-track/TS.png',
      TY: 'assets/legends/typhoon-track/TY.png',
    };

    // Load icon images
    Object.entries(typhoonLegend).forEach(([legend, url]) => {
      this.map.loadImage(url, (err, image) => {
        if (err) return;
        if (!this.map.hasImage(`custom-marker-${legend}`)) {
          this.map.addImage(`custom-marker-${legend}`, image);
        }
      });
    });

    const typhoonMapSource = 'typhoon-track-map-source';

    // 1) LOAD MAIN TRACK (S3)
    let mainData = null;

    try {
      mainData = await fetch(typhoonLayerSourceFile)
        .then((res) => res.json())
        .catch(() => null);
    } catch {
      mainData = null;
    }

    const hasMainData = mainData?.features?.length > 0;
    const usePagasaFallback = !hasMainData;

    // 2) LOAD PAGASA ONLY IF S3 EMPTY
    if (usePagasaFallback) {
      try {
        mainData = await this.typhoonService
          .getTyphoonTracks('pagasa')
          .pipe(first())
          .toPromise();
      } catch {
        mainData = { type: 'FeatureCollection', features: [] };
      }
    }

    // 3) ADD PRIMARY SOURCE
    if (!this.map.getSource(typhoonMapSource)) {
      this.addNoahSource(typhoonMapSource, { type: 'geojson', data: mainData });
    } else {
      (this.map.getSource(typhoonMapSource) as any).setData(mainData);
    }
    // MAIN POINTS
    if (!this.map.getLayer('typhoon-track-icon')) {
      this.addNoahLayer({
        id: 'typhoon-track-icon',
        type: 'symbol',
        source: typhoonMapSource,
        layout: {
          visibility: 'none',
          'icon-image': ['concat', 'custom-marker-', ['get', 'typhoon_type']],
          'icon-allow-overlap': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.03],
        },
        paint: {
          'icon-opacity': 1,
        },
        filter: ['==', ['geometry-type'], 'Point'],
      });
    }

    // MAIN LINE
    if (!this.map.getLayer('typhoon-track-line')) {
      this.addNoahLayer({
        id: 'typhoon-track-line',
        type: 'line',
        source: typhoonMapSource,
        layout: { visibility: 'none' },
        filter: ['==', ['get', 'type'], 'track_line'],
        paint: {
          'line-width': 2,
          'line-color': '#000',
        },
      });
    }

    // FORECAST - IF EXISTING
    if (!this.map.getLayer('typhoon-forecast-circles-fill')) {
      this.addNoahLayer({
        id: 'typhoon-forecast-circles-fill',
        type: 'fill',
        source: typhoonMapSource,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': 'rgba(96,96,96,0.5)',
          'fill-opacity': 1,
        },
        filter: [
          'all',
          ['==', ['get', 'type'], 'smoothed_hull'],
          ['>', ['get', 'radius'], 0],
        ],
      });

      this.addNoahLayer({
        id: 'typhoon-forecast-circles-outline',
        type: 'line',
        source: typhoonMapSource,
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#606060',
          'line-width': 0.9,
        },
        filter: [
          'all',
          ['==', ['get', 'type'], 'smoothed_hull'],
          ['>', ['get', 'radius'], 0],
        ],
      });
    }

    // TRACK LINE
    if (!this.map.getLayer('typhoon-track-line')) {
      this.addNoahLayer({
        id: 'typhoon-track-line',
        type: 'line',
        source: typhoonMapSource,
        paint: { 'line-color': '#000', 'line-width': 2 },
        filter: ['==', ['get', 'type'], 'track_line'],
      });
    }

    combineLatest([
      this.pgService.typhoonTrackGroupShown$,
      this.pgService.weatherUpdatesGroupShown$,
      this.pgService.getTyphoonTrackShown$('pagasa'), // PAGASA ONLY
    ])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([groupShown, weatherUpdatesShown, soloShown]) => {
        const visibility =
          groupShown && weatherUpdatesShown && soloShown ? 'visible' : 'none';
        [
          'typhoon-track-icon',
          'typhoon-track-line',
          'typhoon-forecast-circles-fill',
          'typhoon-forecast-circles-outline',
        ].forEach((layer) => {
          if (this.map.getLayer(layer)) {
            this.map.setLayoutProperty(layer, 'visibility', visibility);
          }
        });
      });

    // Start typhoon Track
    TYPHOON.forEach((agencyType) => {
      const isPagasa = agencyType.toLowerCase() === 'pagasa';
      const lineId = `${agencyType}-line`;
      const pointsId = `${agencyType}-points`;
      const pagasaShouldBeHidden = hasMainData && isPagasa;

      this.typhoonService
        .getTyphoonTracks(agencyType)
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          const hasFeatures = data.features?.length > 0;

          // --- If both main data and this agency's data are empty → disable all layers and remove popups ---
          if (!hasFeatures && !hasMainData) {
            TYPHOON.forEach((t) => {
              const line = `${t}-line`;
              const points = `${t}-points`;
              if (this.map.getLayer(line)) {
                this.map.setLayoutProperty(line, 'visibility', 'none');
                this.map.setPaintProperty(line, 'line-opacity', 0);
              }
              if (this.map.getLayer(points)) {
                this.map.setLayoutProperty(points, 'visibility', 'none');
                this.map.setPaintProperty(points, 'circle-opacity', 0);
              }
            });

            const popups = document.getElementsByClassName('mapboxgl-popup');
            Array.from(popups).forEach((popup: any) => popup.remove());
            this.typhoonService.setNoTyphoonTypeData(true);
            this.typhoonService.setNoData(false);

            return;
          }

          // --- If GeoJSON is empty and not PAGASA - disable layer ---
          if (!hasFeatures && !isPagasa) {
            if (this.map.getLayer(lineId)) {
              this.map.setLayoutProperty(lineId, 'visibility', 'none');
              this.map.setPaintProperty(lineId, 'line-opacity', 0);
            }
            if (this.map.getLayer(pointsId)) {
              this.map.setLayoutProperty(pointsId, 'visibility', 'none');
              this.map.setPaintProperty(pointsId, 'circle-opacity', 0);
            }
            this.typhoonService.setNoData(true);
            this.typhoonService.setNoTyphoonTypeData(false);
            return;
          }

          // --- PAGASA with data → enable layer (unless we want to hide it) ---
          if (isPagasa && hasFeatures) {
            const visibility = pagasaShouldBeHidden ? 'none' : 'visible';
            const opacity = pagasaShouldBeHidden ? 0 : 1;

            if (this.map.getLayer(lineId)) {
              this.map.setLayoutProperty(lineId, 'visibility', visibility);
              this.map.setPaintProperty(lineId, 'line-opacity', opacity);
            }
            if (this.map.getLayer(pointsId)) {
              this.map.setLayoutProperty(pointsId, 'visibility', visibility);
              this.map.setPaintProperty(pointsId, 'circle-opacity', opacity);
            }
          }

          // add layers if not exists
          const agencyUpper = agencyType.toUpperCase();

          // Both track layers share one GeoJSON source. Mapbox GL JS v3
          // requires a named source referenced by id.
          this.addNoahSource(`${agencyType}-typhoon-track-source`, {
            type: 'geojson',
            data,
          });

          if (!this.map.getLayer(lineId)) {
            this.addNoahLayer({
              id: lineId,
              type: 'line',
              source: `${agencyType}-typhoon-track-source`,
              filter: [
                'all',
                ['==', ['geometry-type'], 'LineString'],
                ['==', ['get', 'agency'], agencyUpper],
              ],
              paint: {
                'line-width': 4,
                'line-color': TYPHOON_TRACK_COLORS[agencyType],
                'line-opacity': hasFeatures
                  ? pagasaShouldBeHidden && isPagasa
                    ? 0
                    : 1
                  : 0,
              },
            });
          }

          if (!this.map.getLayer(pointsId)) {
            this.addNoahLayer({
              id: pointsId,
              type: 'circle',
              source: `${agencyType}-typhoon-track-source`,
              filter: [
                'all',
                ['==', ['geometry-type'], 'Point'],
                ['==', ['get', 'agency'], agencyUpper],
              ],
              paint: {
                'circle-radius': 7,
                'circle-color': TYPHOON_TRACK_COLORS[agencyType],
                'circle-opacity': hasFeatures
                  ? pagasaShouldBeHidden && isPagasa
                    ? 0
                    : 1
                  : 0,
              },
            });
          }

          combineLatest([
            this.pgService.typhoonTrackGroupShown$,
            this.pgService.weatherUpdatesGroupShown$,
            this.pgService.getTyphoonTrackShown$(agencyType),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, weatherUpdatesShown, soloShown]) => {
              const visibleByToggle =
                groupShown && weatherUpdatesShown && soloShown && hasFeatures;

              // Apply PAGASA hide condition
              const finalVisibility =
                isPagasa && pagasaShouldBeHidden
                  ? 'none'
                  : visibleByToggle
                  ? 'visible'
                  : 'none';

              const finalOpacity =
                isPagasa && pagasaShouldBeHidden ? 0 : visibleByToggle ? 1 : 0;

              this.map.setPaintProperty(lineId, 'line-opacity', finalOpacity);
              this.map.setPaintProperty(
                pointsId,
                'circle-opacity',
                finalOpacity
              );
              this.map.setLayoutProperty(lineId, 'visibility', finalVisibility);
              this.map.setLayoutProperty(
                pointsId,
                'visibility',
                finalVisibility
              );

              if (visibleByToggle) {
                this.addTyphoonPopups('typhoon-track-icon');
              } else {
                const popups =
                  document.getElementsByClassName('mapboxgl-popup');
                Array.from(popups).forEach((popup: any) => popup.remove());
              }
            });

          this.pgService.setTyphoonTypeFetched(agencyType, true);
          this.showTyphoon(agencyType);
        });
    });

    // Separate popups for clean code
    this.addTyphoonPopups('typhoon-track-icon');
  }

  initVolcanoes() {
    // 0 - declare the source json files
    const volcanoSourceFiles: Record<VolcanoType, { url: string }> = {
      active: {
        url: 'https://webgis-static.up.edu.ph/api/volcanoes/active_volcano_rad.geojson',
      },
      'potentially-active': {
        url: 'https://webgis-static.up.edu.ph/api/volcanoes/volcanoes_potentially_active.geojson',
      },
      inactive: {
        url: 'https://webgis-static.up.edu.ph/api/volcanoes/volcanoes_inactive.geojson',
      },
    };

    const volcanoColorMap: Record<VolcanoType, string> = {
      active: 'red',
      inactive: 'gray',
      'potentially-active': 'yellow',
    };

    const allShown$ = this.pgService.volcanoGroupShown$.pipe(
      distinctUntilChanged()
    );

    // 1 - load the geojson files (add sources/layers)
    Object.keys(volcanoSourceFiles).forEach((volcanoType: VolcanoType) => {
      const volcanoObjData = volcanoSourceFiles[volcanoType];

      // 2 - load volcano icon (the sprite corresponding to the volcano type)
      const _this = this;
      this.map.loadImage(
        `assets/map-sprites/${volcanoType}.png`,
        (error, image) => {
          if (error) throw error;
          // 3 - add volcano icon
          if (!_this.map.hasImage(volcanoType)) {
            _this.map.addImage(volcanoType, image);
          }

          // 4 - add source
          const volcanoMapSource = `${volcanoType}-map-source`;
          _this.addNoahSource(volcanoMapSource, {
            type: 'geojson',
            data: volcanoObjData.url,
          });

          // 5 - add layer
          const layerID = `${volcanoType}-map-layer`;
          this.addNoahLayer({
            id: layerID,
            type: 'symbol',
            source: volcanoMapSource,
            paint: {
              'icon-opacity': 1,
              'text-color': this.mapStyle === 'terrain' ? '#333333' : '#ffffff',
              'text-halo-color':
                this.mapStyle === 'terrain'
                  ? 'rgba(255, 255, 255, 1)'
                  : 'rgba(0, 0, 0, 1)',
              'text-halo-width': 1,
              'text-halo-blur': 0.5,
            },
            layout: {
              visibility: 'none',
              'icon-image': volcanoType,
              'icon-allow-overlap': true,
              'text-optional': true,
              'text-anchor': 'top',
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              // If elevation is available, display it below the volcano name
              'text-field': [
                'concat',
                ['get', 'name'],
                [
                  'case',
                  ['<=', ['get', 'elevation'], 0],
                  '',
                  ['concat', '\n(', ['get', 'elevation'], ' MASL)'],
                ],
              ],
              'text-offset': [0, 2],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                4,
                10, // Smaller text at low zoom
                6,
                14, // Medium size at zoom 6
                10,
                20, // Larger text at zoom 10+
              ],
              'text-letter-spacing': 0.08,
            },
          });

          const popUp = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: 'auto',
          });

          // 6 - listen to the values from the store (group and individual)
          const volcano$ = this.pgService
            .getVolcano$(volcanoType)
            .pipe(shareReplay(1));

          const volcanoOpacity$ = this.pgService.getVolcano$(volcanoType).pipe(
            map((volcano) => volcano.opacity),
            distinctUntilChanged()
          );

          combineLatest([allShown$, volcano$, volcanoOpacity$])
            .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
            .subscribe(([allShown, volcano, volcanoOpacity]) => {
              const visibility = volcano.shown && allShown ? 'visible' : 'none';
              let newOpacity = 0;
              if (volcano.shown && allShown) {
                newOpacity = volcano.opacity / 100;
                if (volcanoType === 'active') {
                  const handleClick = (e) => {
                    const name = e.features[0].properties.name;
                    const coordinates = (
                      e.features[0].geometry as any
                    ).coordinates.slice();
                    const elevation = e.features[0].properties.elevation;
                    const peak_elevation =
                      e.features[0].properties.peak_elevation;
                    const infoUrl = e.features[0].properties.url;
                    while (Math.abs(e.lnglat - coordinates[0]) > 180) {
                      coordinates[0] +=
                        e.lnglat.lng > coordinates[0] ? 360 : -360;
                    }
                    popUp
                      .setLngLat(coordinates)
                      .setHTML(
                        `<div style="color: #333333;font-size: 13px;padding-top: 4px;">
                          <div><b>Name:</b> ${name} </div>
                          <div><b>Elevation: </b>${elevation.toLocaleString()} masl</div>
                          <div><b>Peak Elevation: </b>${peak_elevation.toLocaleString()} masl</div>
                          <div>To learn more about ${name}, <i><a href="${infoUrl}" style="color: blue;" target="_blank">click here.</a></i></div>
                        </div>`
                      )
                      .addTo(this.map);
                  };
                  this.map.on('click', layerID, handleClick);
                  this.map.on('touchend', layerID, handleClick);
                }
              } else {
                this.map.on('click', layerID, (e) => {
                  popUp.remove();
                });
              }
              popUp.remove();
              this.map.setLayoutProperty(layerID, 'visibility', visibility);
            });
        }
      );
    });
  }

  /**
   * Temperature is a raster image source (heat index / max temperature) that is
   * hidden on load (`temperature.shown` defaults to `false`). The images are
   * only created once the temperature group is actually shown.
   */
  initTemperature() {
    this.runWhenFirstShown(this.pgService.temperatureShown$, () =>
      this.buildTemperatureLayers()
    );
  }

  private buildTemperatureLayers() {
    const temperatureImages = {
      heat_index: {
        urlPrefix: 'HI',
        type: 'image',
      },
      max_temperature: {
        urlPrefix: 't2m',
        type: 'image',
      },
    };

    const getTemperatureUrl = (
      temperatureType: TemperatureType,
      day: TemperatureForecastDay
    ): string => {
      const { urlPrefix } = temperatureImages[temperatureType];
      return `https://webgis-static.up.edu.ph/api/temperature/${urlPrefix}_${day}.png`;
    };

    const getTemperatureSource = (temperatureDetails: {
      urlPrefix: string;
      type: string;
    }): AnySourceData => {
      switch (temperatureDetails.type) {
        case 'image':
          return {
            type: 'image',
            url: `https://webgis-static.up.edu.ph/api/temperature/${temperatureDetails.urlPrefix}_1.png`,
            coordinates: [
              [116.855, 19.402],
              [127.055, 19.402],
              [127.055, 5.205],
              [116.855, 5.205],
            ],
          };
        default:
          throw new Error('[Map Playground] Unable to get Temperature');
      }
    };
    Object.keys(temperatureImages).forEach(
      (temperatureType: TemperatureType) => {
        const temperatureDetails = temperatureImages[temperatureType];
        this.addNoahSource(
          temperatureType,
          getTemperatureSource(temperatureDetails)
        );

        this.addNoahLayer({
          id: temperatureType,
          type: 'raster',
          source: temperatureType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0,
          },
        });
        this._removeOverlayOnLoadError(temperatureType, [temperatureType]);

        const soloShown$ = this.pgService.temperatureShown$.pipe(
          shareReplay(1)
        );

        const selectedTemperature$ = this.pgService.selectedTemperature$.pipe(
          shareReplay(1)
        );

        const selectedForecastDay$ =
          this.pgService.selectedTemperatureForecastDay$.pipe(
            distinctUntilChanged(),
            shareReplay(1)
          );

        const temperatureOpacity$ = this.pgService
          .getTemperature$(temperatureType)
          .pipe(
            map((temperature) => temperature.opacity),
            distinctUntilChanged()
          );

        combineLatest([soloShown$, selectedTemperature$, temperatureOpacity$])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(([soloShown, groupShown, temperatureOpacity]) => {
            let newOpacity = +(soloShown && groupShown === temperatureType);
            if (newOpacity) {
              newOpacity = temperatureOpacity / 100;
            }
            if (this.map.getLayer(temperatureType)) {
              this.map.setPaintProperty(
                temperatureType,
                'raster-opacity',
                newOpacity
              );
            }
          });

        selectedForecastDay$
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe((forecastDay) => {
            const source = this.map.getSource(temperatureType) as any;

            if (!source || typeof source.updateImage !== 'function') {
              return;
            }

            source.updateImage({
              url: getTemperatureUrl(temperatureType, forecastDay),
              coordinates: [
                [116.855, 19.402],
                [127.055, 19.402],
                [127.055, 5.205],
                [116.855, 5.205],
              ],
            });
          });
      }
    );
  }

  initWeatherUpdates() {
    const weatherUpdateShown$ = this.pgService.weatherUpdatesGroupShown$.pipe(
      distinctUntilChanged(),
      shareReplay(1)
    );

    combineLatest([weatherUpdateShown$])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([weatherUpdateShown]) => {
        const visibility = weatherUpdateShown ? 'visible' : 'none';

        if (weatherUpdateShown) {
          this.map.flyTo({
            center: PH_DEFAULT_CENTER,
            zoom: 4,
            essential: true,
          });
        } else {
          this.map.flyTo({
            center: PH_DEFAULT_CENTER,
            zoom: 5.5,
            essential: true,
          });
        }

        if (this.map.getLayer('weather-updates-layer')) {
          this.map.setLayoutProperty(
            'weather-updates-layer',
            'visibility',
            visibility
          );
        }
      });
  }

  /**
   * Weather-satellite overlays are the heaviest optional download in the
   * playground: each source is a WebM *and* an MP4 loop that renders as a
   * `<video>` texture. The weather-updates group is off on load, so building
   * these eagerly downloaded video the user was never looking at. The source,
   * layer and subscriptions are now created the first time the group (and the
   * satellite layer) is actually shown, and rebuilt after a style change while
   * it stays shown.
   */
  initWeatherSatelliteLayers() {
    this.runWhenFirstShown(
      combineLatest([
        this.pgService.weatherUpdatesGroupShown$,
        this.pgService.weatherSatellitesShown$,
      ]).pipe(
        map(([groupShown, satelliteShown]) => groupShown && satelliteShown)
      ),
      () => this.buildWeatherSatelliteLayers()
    );
  }

  private buildWeatherSatelliteLayers() {
    const weatherSatelliteImages = {
      himawari: {
        url: 'https://webgis-static.up.edu.ph/api/sat_webm/ph_himawari.webm',
        urlMp4: 'https://webgis-static.up.edu.ph/api/sat_webm/ph_himawari.mp4',
        type: 'video',
      },
      'himawari-GSMAP': {
        url: 'https://webgis-static.up.edu.ph/api/sat_webm/ph_hima_gsmap.webm',
        urlMp4:
          'https://webgis-static.up.edu.ph/api/sat_webm/ph_hima_gsmap.mp4',
        type: 'video',
      },
    };

    const getWeatherSatelliteSource = (weatherSatelliteDetails: {
      url: string;
      urlMp4?: string;
      type: string;
    }): AnySourceData => {
      switch (weatherSatelliteDetails.type) {
        case 'video':
          return {
            type: 'video',
            urls: weatherSatelliteDetails.urlMp4
              ? [weatherSatelliteDetails.url, weatherSatelliteDetails.urlMp4]
              : [weatherSatelliteDetails.url],
            coordinates: [
              [100.0, 29.25], // top-left
              [160.0, 29.25], // top-right
              [160.0, 5.0], // bottom-right
              [100.0, 5.0], // bottom-left
            ],
          };
        default:
          throw new Error(
            '[MapPlayground] Unable to get weather satellite source'
          );
      }
    };

    Object.keys(weatherSatelliteImages).forEach(
      (weatherType: WeatherSatelliteType) => {
        const weatherSatelliteDetails = weatherSatelliteImages[weatherType];

        // 1. Add source per weather satellite type
        this.addNoahSource(
          weatherType,
          getWeatherSatelliteSource(weatherSatelliteDetails)
        );

        // 2. Fix for mobile (iOS): intercept the video property assignment on
        //    the VideoSource so playsinline is set before Mapbox calls .play().
        //    videoSource.video is assigned asynchronously (on onloadstart), so
        //    we use defineProperty to hook into the assignment.
        //    We also append the video element to the DOM (hidden) because iOS
        //    Safari requires a DOM-attached video to render it as a WebGL texture.
        const videoSource = this.map.getSource(weatherType) as any;
        Object.defineProperty(videoSource, 'video', {
          configurable: true,
          set(el: HTMLVideoElement) {
            el.setAttribute('playsinline', '');
            el.setAttribute('webkit-playsinline', '');
            el.style.cssText =
              'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';
            document.body.appendChild(el);
            Object.defineProperty(videoSource, 'video', {
              value: el,
              writable: true,
              configurable: true,
            });
          },
        });

        // 3. Add layer per weather satellite source
        this.addNoahLayer({
          id: weatherType,
          type: 'raster',
          source: weatherType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0,
          },
        });
        this._removeOverlayOnLoadError(weatherType, [weatherType]);

        // const allShown$ = this.pgService.weatherSatellitesShown$.pipe(
        //   distinctUntilChanged(),
        //   tap(() => {
        //     this.map.flyTo({
        //       center: PH_DEFAULT_CENTER,
        //       zoom: 4,
        //       essential: true,
        //     });
        //   }),
        //   shareReplay(1)
        // );

        const groupShown$ = this.pgService.weatherUpdatesGroupShown$.pipe(
          shareReplay(1)
        );

        // 3. Check for group and individual visibility and opacity
        const allShown$ = this.pgService.weatherSatellitesShown$.pipe(
          shareReplay(1)
        );
        const selectedWeather$ = this.pgService.selectedWeatherSatellite$.pipe(
          shareReplay(1)
        );
        const weatherTypeOpacity$ = this.pgService
          .getWeatherSatellite$(weatherType)
          .pipe(
            map((weather) => weather.opacity),
            distinctUntilChanged()
          );

        combineLatest([
          allShown$,
          selectedWeather$,
          weatherTypeOpacity$,
          groupShown$,
        ])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(
            ([allShown, selectedWeather, weatherTypeOpacity, groupShown]) => {
              let opacity = +(
                allShown &&
                groupShown &&
                selectedWeather === weatherType
              );
              if (opacity) {
                opacity = weatherTypeOpacity / 100;
              }

              if (this.map.getLayer(weatherType)) {
                this.map.setPaintProperty(
                  weatherType,
                  'raster-opacity',
                  opacity
                );
              }
            }
          );
      }
    );
  }

  initLightning() {
    const lightningSourceFile = {
      'realtime-lightning': {
        url: '',
        type: 'geojson',
      },
      '10mins-lightning': {
        url: 'https://webgis-static.up.edu.ph/api/lightning/lightning.geojson',
        type: 'geojson',
      },
    };

    const lightningIconMap = {
      'Cloud to Cloud': 'noah-lightning-ctc',
      'Cloud to Ground': 'noah-lightning-ctg',
    } as const;

    const loadMapboxImage = (
      imageName: string,
      imageUrl: string
    ): Promise<void> =>
      new Promise((resolve, reject) => {
        if (this.map.hasImage(imageName)) {
          resolve();
          return;
        }

        this.map.loadImage(imageUrl, (error, image) => {
          if (error) {
            reject(error);
            return;
          }
          if (image && !this.map.hasImage(imageName)) {
            this.map.addImage(imageName, image);
          }
          resolve();
        });
      });

    Promise.all([
      loadMapboxImage(
        'noah-lightning-ctc',
        'assets/legends/lightning/noah-lightning-ctc.png'
      ),
      loadMapboxImage(
        'noah-lightning-ctg',
        'assets/legends/lightning/noah-lightning-ctg.png'
      ),
    ]).catch((error) =>
      console.error('[MapPlayground] Failed to load lightning icons', error)
    );

    const getLightningSource = (
      lightningDetails: { url: string; type: string },
      lightningType: LightningTypes
    ): AnySourceData => {
      switch (lightningDetails.type) {
        case 'geojson':
          return {
            type: 'geojson',
            data:
              lightningType === 'realtime-lightning'
                ? this.realtimeLightningFeatureCollection
                : lightningDetails.url,
          };
        default:
          throw new Error('[MapPlayground] Unable to get lightning source');
      }
    };

    Object.keys(lightningSourceFile).forEach(
      (lightningType: LightningTypes) => {
        const lightningObjData = lightningSourceFile[lightningType];

        // 1 - add source
        this.addNoahSource(
          lightningType,
          getLightningSource(lightningObjData, lightningType)
        );

        // Track whether this lightning source has valid data
        const dataAvailable$ =
          lightningType === 'realtime-lightning'
            ? this.realtimeLightningDataAvailable$
            : new BehaviorSubject<boolean>(false);

        // Fetch and validate data availability
        fetch(lightningObjData.url)
          .then((response) => {
            if (!response.ok) throw new Error('Unable to fetch');
            return response.json();
          })
          .then((data: any) => {
            const features = Array.isArray(data?.features) ? data.features : [];
            const validFeatures = features.filter((f) => f?.geometry);
            dataAvailable$.next(validFeatures.length > 0);
          })
          .catch(() => dataAvailable$.next(false));

        // 2 - add layer using symbol icons instead of colored circles
        this.addNoahLayer({
          id: lightningType,
          type: 'symbol',
          source: lightningType,
          layout: {
            visibility: 'visible',
            'icon-image': [
              'case',
              ['==', ['get', 'strike_type'], 'Cloud to Cloud'],
              lightningIconMap['Cloud to Cloud'],
              lightningIconMap['Cloud to Ground'],
            ],
            'icon-size': 0.5,
            'icon-allow-overlap': true,
          },
          paint: {
            'icon-opacity': 0.8,
          },
        });

        const lightningPopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'lightning-popup',
        });

        const handleLightningClick = (e: any) => {
          const feature = e.features && e.features[0];
          if (!feature) {
            lightningPopup.remove();
            return;
          }

          const raw = feature.properties?.raw;
          const rawData =
            typeof raw === 'string'
              ? (() => {
                  try {
                    return JSON.parse(raw);
                  } catch {
                    return null;
                  }
                })()
              : raw;

          const realtimeTime = rawData?.observed_at ?? raw?.observed_at;

          const props = feature.properties || {};
          const type = props.strike_type ?? rawData?.strike_type ?? 'Unknown';
          const amplitude = props.amplitude ?? rawData?.amplitude ?? 'N/A';
          const height = props.height ?? 'N/A';
          const observedAt = props.observed_at ?? rawData?.observed_at ?? null;

          const date = observedAt
            ? new Date(observedAt).toLocaleString()
            : 'Unknown';

          const realtimeDate = realtimeTime
            ? new Date(realtimeTime).toLocaleString()
            : null;

          const content = `
            <div style="color: #333333; font-size: 13px; line-height: 1.5; z-index: 11; position: relative;">
              <div><strong>Type:</strong> ${type}</div>
              <div><strong>Amplitude:</strong> ${amplitude}</div>
              <div><strong>Height:</strong> ${height}</div>
              ${
                lightningType === 'realtime-lightning'
                  ? realtimeDate
                    ? `<div><strong>Date:</strong> ${realtimeDate}</div>`
                    : `<div><strong>Date:</strong> Unknown</div>`
                  : `<div><strong>Date:</strong> ${date}</div>`
              }
            </div>
          `;

          const coordinates = (feature.geometry as any).coordinates.slice();
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          lightningPopup
            .setLngLat(coordinates)
            .setHTML(content)
            .addTo(this.map);
        };

        this.map.on('click', lightningType, handleLightningClick);
        this.map.on('touchend', lightningType, handleLightningClick);
        this.map.on('mouseenter', lightningType, () => {
          this.map.getCanvas().style.cursor = 'pointer';
        });
        this.map.on('mouseleave', lightningType, () => {
          this.map.getCanvas().style.cursor = '';
        });

        const allShown$ = this.pgService.lightningGroupShown$.pipe(
          distinctUntilChanged(),
          shareReplay(1)
        );

        const selectedLightning$ = this.pgService.selectedLightning$.pipe(
          distinctUntilChanged(),
          shareReplay(1)
        );

        const lightningOpacity$ = this.pgService
          .getLightningType$(lightningType)
          .pipe(
            map((lightning) => lightning.opacity),
            distinctUntilChanged()
          );

        const weatherUpdateShown$ =
          this.pgService.weatherUpdatesGroupShown$.pipe(shareReplay(1));

        combineLatest([
          allShown$,
          selectedLightning$,
          lightningOpacity$,
          dataAvailable$,
          weatherUpdateShown$,
        ])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(
            ([
              allShown,
              selectedLightning,
              lightningOpacity,
              hasData,
              weatherUpdateShown,
            ]) => {
              const visible =
                allShown &&
                selectedLightning === lightningType &&
                hasData &&
                weatherUpdateShown;
              const opacity = visible ? lightningOpacity / 100 : 0;

              this.map.setLayoutProperty(
                lightningType,
                'visibility',
                visible ? 'visible' : 'none'
              );
              this.map.setPaintProperty(lightningType, 'icon-opacity', opacity);
            }
          );
      }
    );

    const realtimeLayerVisibility$ = combineLatest([
      this.pgService.lightningGroupShown$.pipe(distinctUntilChanged()),
      this.pgService.selectedLightning$.pipe(distinctUntilChanged()),
      this.pgService.weatherUpdatesGroupShown$.pipe(shareReplay(1)),
    ])
      .pipe(
        map(
          ([allShown, selectedLightning, weatherUpdateShown$]) =>
            allShown &&
            selectedLightning === 'realtime-lightning' &&
            weatherUpdateShown$
        ),
        distinctUntilChanged(),
        takeUntil(this._unsub),
        takeUntil(this._changeStyle)
      )
      .subscribe((shouldRunRealtime) => {
        if (shouldRunRealtime && !this.isRealtimeLightningRunning) {
          this.startRealtimeLightning().catch((err) => {
            console.error(
              '[MapPlayground] Failed to initialize realtime lightning',
              err
            );
          });
        }

        if (!shouldRunRealtime && this.isRealtimeLightningRunning) {
          this.stopRealtimeLightning().catch((err) => {
            console.error(
              '[MapPlayground] Failed to stop realtime lightning',
              err
            );
          });
        }
      });
  }

  private initRealtimeLightning(): void {
    // Real-time lightning should only start when the layer is visible.
  }

  private async startRealtimeLightning(): Promise<void> {
    const url = 'ulap-api.up.edu.ph';
    this.resetRealtimeLightningLayer();

    try {
      await fetch(`https://${url}/api/lightning/start/`);
    } catch (error) {
      console.error('[MapPlayground] realtime lightning start failed', error);
    }

    this.realtimeLightningSocket = new WebSocket(`wss://${url}/ws/`);

    this.realtimeLightningSocket.onopen = () => {
      console.log('Connected to Django relay');

      this.realtimeLightningKeepAlive = window.setInterval(() => {
        if (
          this.realtimeLightningSocket &&
          this.realtimeLightningSocket.readyState === WebSocket.OPEN
        ) {
          this.realtimeLightningSocket.send('ping');
        }
      }, 30000);

      this.realtimeLightningResetTimer = window.setInterval(() => {
        this.pruneRealtimeLightningFeatures();
      }, 1000);
    };

    this.realtimeLightningSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const strikeType =
        data.height === 0 ? 'Cloud to Ground' : 'Cloud to Cloud';

      const feature: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [data.longitude, data.latitude],
        },
        properties: {
          strike_type: strikeType,
          icHeight: data.icHeight,
          timestamp: data.timestamp || null,
          raw: data,
          createdAt: Date.now(),
        },
      };

      this.realtimeLightningFeatureCollection.features.push(feature);
      this.pruneRealtimeLightningFeatures();

      const source = this.map.getSource(
        'realtime-lightning'
      ) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(this.realtimeLightningFeatureCollection);
      }

      if (!this.realtimeLightningDataAvailable$.value) {
        this.realtimeLightningDataAvailable$.next(true);
      }
    };

    this.realtimeLightningSocket.onclose = () => {
      console.log('Realtime lightning relay disconnected');
    };

    this.isRealtimeLightningRunning = true;
    // this.realtimeLightningResetTimer = window.setTimeout(
    //   () => this.resetRealtimeLightningLayer(),
    //   60000
    // );
  }

  private async stopRealtimeLightning(): Promise<void> {
    const url = 'ulap-api.up.edu.ph';
    try {
      await fetch(`https://${url}/api/lightning/stop/`);
    } catch (error) {
      console.error('[MapPlayground] realtime lightning stop failed', error);
    }

    this.resetRealtimeLightningLayer();
    this.isRealtimeLightningRunning = false;
  }

  private resetRealtimeLightningLayer(): void {
    if (this.realtimeLightningSocket) {
      this.realtimeLightningSocket.close();
      this.realtimeLightningSocket = null;
    }

    if (this.realtimeLightningKeepAlive) {
      window.clearInterval(this.realtimeLightningKeepAlive);
      this.realtimeLightningKeepAlive = null;
    }

    if (this.realtimeLightningResetTimer) {
      window.clearTimeout(this.realtimeLightningResetTimer);
      this.realtimeLightningResetTimer = null;
    }

    this.realtimeLightningFeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const source = this.map.getSource('realtime-lightning') as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (source) {
      source.setData(this.realtimeLightningFeatureCollection);
    }

    this.realtimeLightningDataAvailable$.next(false);

    console.log('Realtime lightning layer reset');
  }

  // start of boundaries
  initBoundaries() {
    // 0 - declare the source json files
    const boundariesSourceFiles: Record<
      BoundariesType,
      { url: string; type: string; sourceLayer: string }
    > = {
      municipal: {
        url: 'mapbox://upri-noah.ph_muni_tls',
        type: 'vector',
        sourceLayer: 'ph_muni_bound',
      },
      provincial: {
        url: 'mapbox://upri-noah.ph_prov_tls',
        type: 'vector',
        sourceLayer: 'ph_prov_bound',
      },
      barangay: {
        url: 'mapbox://upri-noah.ph_brgy_tls',
        type: 'vector',
        sourceLayer: 'ph_brgy_pop',
      },
    };

    const boundaryColors = {
      barangay: '#7e22ce',
      municipal: '#7e22ce',
      provincial: '#0C0C0C',
    };

    // 1 - load the geojson files (add sources/layers)
    Object.keys(boundariesSourceFiles).forEach(
      (boundariesType: BoundariesType) => {
        const boundariesObjData = boundariesSourceFiles[boundariesType];
        let popup;

        const boundariesMapSource = `${boundariesType}-map-source`;
        // 2 - add source
        this.addNoahSource(boundariesMapSource, {
          type: 'vector',
          url: boundariesObjData.url,
        });
        // 3 - add layer
        const layerID = `${boundariesType}-map-layer`;

        this.addNoahLayer({
          id: layerID,
          type: 'fill',
          source: boundariesMapSource,
          'source-layer': boundariesObjData.sourceLayer,
          layout: {
            visibility: 'none',
          },
          paint: {
            'fill-color': 'rgba(0, 0, 0, 0)', //Transparent color for area
          },
        });

        // Add line layer
        const lineLayerID = `${boundariesType}-line-layer`;
        const linePaint = {
          'line-color': boundaryColors[boundariesType], // Use color based on boundary type
          'line-opacity': 0.75,
        };

        const lineLayerName = ``;

        // Apply different line style for municipal and provincial boundaries
        if (boundariesType === 'municipal' || boundariesType === 'provincial') {
          linePaint['line-width'] = 5; // Adjust line width for municipal and provincial boundaries
          linePaint['line-dasharray'] = [1, 0]; // No dash
        } else {
          linePaint['line-width'] = 3; // Adjust line width Barangay
          linePaint['line-dasharray'] = [1, 1]; // Dashed
        }

        this.addNoahLayer({
          id: lineLayerID,
          type: 'line',
          source: boundariesMapSource,
          'source-layer': boundariesObjData.sourceLayer,
          layout: {
            visibility: 'none',
          },
          paint: linePaint,
        });
        let municipalTextLayerID;
        let provincialTextLayerID;

        if (boundariesType === 'municipal' || boundariesType === 'provincial') {
          const textLayerID = `${boundariesType}-text-layer`;
          this.addNoahLayer({
            id: textLayerID,
            type: 'symbol',
            source: boundariesMapSource,
            'source-layer': boundariesObjData.sourceLayer,
            layout: {
              visibility: 'none',
              'text-field': [
                'get',
                boundariesType === 'municipal' ? 'Mun_Name' : 'Pro_Name',
              ],
              'text-font': ['Open Sans Regular'],
              'text-size': boundariesType === 'municipal' ? 15 : 20, // Set text size based on boundary type
              'text-offset': [0, 0.5],
              'text-anchor': 'center',
              'text-allow-overlap': false, // Prevent text from overlapping
              'text-optional': true, // Hide labels that would overlap
            },
            paint: {
              'text-color':
                boundariesType === 'municipal' ? '#7e22ce' : '#010100', // Adjust text color
              'text-halo-color': '#FFFFFF', // Add text border color
              'text-halo-width': 1, // Text border width
            },
            filter: ['==', '$type', 'Polygon'], // Only show text for polygons
          });

          // Assign text layer ID to corresponding variable
          if (boundariesType === 'municipal') {
            municipalTextLayerID = textLayerID;
          } else if (boundariesType === 'provincial') {
            provincialTextLayerID = textLayerID;
          }
        }

        // 5 - listen to the values from the store (group and individual)
        const allShown$ = this.pgService.boundariesGroupShown$.pipe(
          distinctUntilChanged()
        );
        const boundaries$ = this.pgService
          .getBoundaries$(boundariesType)
          .pipe(shareReplay(1));

        // Inside the visibility subscription after the map layers are added
        combineLatest([allShown$, boundaries$])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(([allShown, boundaries]) => {
            let newOpacity = 0;
            if (boundaries.shown && allShown) {
              newOpacity = boundaries.opacity / 100;
              // Enable interactivity when shown
              this.map.setLayoutProperty(layerID, 'visibility', 'visible');
              this.map.setLayoutProperty(lineLayerID, 'visibility', 'visible');
              this.map.setPaintProperty(layerID, 'fill-opacity', newOpacity);
              this.map.setPaintProperty(
                lineLayerID,
                'line-opacity',
                newOpacity
              );

              // Show text layers
              if (municipalTextLayerID) {
                this.map.setLayoutProperty(
                  municipalTextLayerID,
                  'visibility',
                  'visible'
                );
              }
              if (provincialTextLayerID) {
                this.map.setLayoutProperty(
                  provincialTextLayerID,
                  'visibility',
                  'visible'
                );
              }
            } else {
              // Disable interactivity when hidden
              this.map.setLayoutProperty(layerID, 'visibility', 'none');
              this.map.setPaintProperty(lineLayerID, 'line-opacity', 0);
              this.map.setLayerZoomRange(layerID, 0, 24);
              // Close popup if layer is hidden
              if (popup) {
                popup.remove();
              }

              // Hide text layers
              if (municipalTextLayerID) {
                this.map.setLayoutProperty(
                  municipalTextLayerID,
                  'visibility',
                  'none'
                );
              }
              if (provincialTextLayerID) {
                this.map.setLayoutProperty(
                  provincialTextLayerID,
                  'visibility',
                  'none'
                );
              }
            }
          });

        // 6 - Add click event listener for popup if layer is visible
        this.map.on('click', layerID, (e) => {
          const features = this.map.queryRenderedFeatures(e.point, {
            layers: [layerID],
          });

          if (!features.length) {
            return;
          }

          const feature = features[0];
          const popupContent = `
          <h3><strong>Barangay:</strong> ${feature.properties.Bgy_Name}</h3>
          <p><strong>Municipality:</strong> ${feature.properties.Mun_Name}</p>
          <p><strong>Province:</strong> ${feature.properties.Pro_Name}</p>
        `;
          // Remove existing popup if any
          if (popup) {
            popup.remove();
          }

          // Create new popup
          popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(this.map);
        });

        // 7 - Add mouseenter and mouseleave event listeners
        this.map.on('mouseenter', layerID, () => {
          if (this.map.getLayoutProperty(layerID, 'visibility') === 'visible') {
            this.map.getCanvas().style.cursor = 'pointer';
          }
        });

        this.map.on('mouseleave', layerID, () => {
          if (this.map.getLayoutProperty(layerID, 'visibility') === 'visible') {
            this.map.getCanvas().style.cursor = '';
          }
        });
      }
    );
  }
  // end of boundaries

  initRiverbasin() {
    const riverbasinLayers = [
      {
        layerID: 'upri-noah.93y7a8ygfign-area',
        sourceID: 'upri-noah.93y7a8ygfign',
        url: 'mapbox://upri-noah.93y7a8ygfign',
        sourceLayer: 'a250487fed857cd7bbf4',
        type: 'fill' as const,
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0,
        },
      },
      {
        layerID: 'upri-noah.93y7a8ygfign',
        sourceID: 'upri-noah.93y7a8ygfign',
        url: 'mapbox://upri-noah.93y7a8ygfign',
        sourceLayer: 'a250487fed857cd7bbf4',
        type: 'line' as const,
        paint: {
          'line-color': '#000000',
          'line-width': 1.5,
          'line-opacity': 1,
        },
      },
      {
        layerID: 'upri-noah.ck8tzu2h3osy',
        sourceID: 'upri-noah.ck8tzu2h3osy',
        url: 'mapbox://upri-noah.ck8tzu2h3osy',
        sourceLayer: '8bae472c997f7530636b',
        type: 'line' as const,
        paint: {
          'line-color': '#000000',
          'line-width': 3,
          'line-opacity': 1,
        },
      },
    ];

    riverbasinLayers.forEach((layer) => {
      if (!this.map.getSource(layer.sourceID)) {
        this.addNoahSource(layer.sourceID, {
          type: 'vector',
          url: layer.url,
        });
      }

      if (!this.map.getLayer(layer.layerID)) {
        this.addNoahLayer({
          id: layer.layerID,
          type: layer.type,
          source: layer.sourceID,
          'source-layer': layer.sourceLayer,
          layout: {
            visibility: 'none',
          },
          paint: layer.paint,
        });
      }
    });

    this.pgService.riverbasinShown$
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((shown) => {
        const visibility = shown ? 'visible' : 'none';
        riverbasinLayers.forEach((layer) => {
          if (this.map.getLayer(layer.layerID)) {
            this.map.setLayoutProperty(layer.layerID, 'visibility', visibility);
          }
        });
      });

    this.pgService.riverbasinOpacity$
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((opacity) => {
        ['upri-noah.93y7a8ygfign', 'upri-noah.ck8tzu2h3osy'].forEach(
          (layerID) => {
            if (this.map.getLayer(layerID)) {
              this.map.setPaintProperty(layerID, 'line-opacity', opacity / 100);
            }
          }
        );
      });

    const riverbasinPopup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      className: 'riverbasin-popup',
      maxWidth: 'none',
    });

    this.pgService.riverbasinShown$
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((shown) => {
        if (!shown && riverbasinPopup.isOpen()) {
          riverbasinPopup.remove();
        }
      });

    const riverbasinLayersWithPopups = [
      {
        layerID: 'upri-noah.93y7a8ygfign-area',
        fields: [
          ['Name:', 'Final_Name'],
          ['Watershed:', 'Watershed_'],
        ],
      },
      {
        layerID: 'upri-noah.93y7a8ygfign',
        fields: [
          ['Name:', 'Final_Name'],
          ['Watershed:', 'Watershed_'],
        ],
      },
    ];

    riverbasinLayersWithPopups.forEach(({ layerID, fields }) => {
      this.map.on('click', layerID, (e: any) => {
        const feature = e.features && e.features[0];
        if (!feature) {
          return;
        }

        const props = feature.properties || {};
        const rows = fields
          .map(([label, key]) => {
            const value = props[key];
            const display =
              value === null || value === undefined || value === ''
                ? 'N/A'
                : value;
            return `<div class="riverbasin-popup__row">
              <span class="riverbasin-popup__label">${label}</span>
              <strong class="riverbasin-popup__value">${display}</strong>
            </div>`;
          })
          .join('');

        riverbasinPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div class="riverbasin-popup__body">${rows}</div>`)
          .addTo(this.map);
      });

      this.map.on('mouseenter', layerID, () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', layerID, () => {
        this.map.getCanvas().style.cursor = '';
      });
    });
  }

  private _removeOverlayOnLoadError(sourceId: string, layerIds: string[]) {
    const source = this.map.getSource(sourceId) as any;
    if (!source || typeof source.on !== 'function') {
      return;
    }

    source.on('error', () => {
      if (!this.map.getSource(sourceId)) {
        return;
      }

      layerIds.forEach((layerId) => {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      });

      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    });
  }

  showDataPoints(sensorType: SensorType) {
    const graphDiv = document.getElementById('graph-dom');
    const popUp = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: 'auto',
    });
    const _this = this;

    combineLatest([
      this.pgService.sensorsGroupShown$,
      this.pgService.getSensorTypeShown$(sensorType),
    ])
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe(([groupShown, soloShown]) => {
        if (groupShown && soloShown) {
          this.map.on('mouseover', sensorType, (e) => {
            const coordinates = (
              e.features[0].geometry as any
            ).coordinates.slice();
            const location = e.features[0].properties.location;
            const stationID = e.features[0].properties.station_id;
            const typeName = e.features[0].properties.type_name;
            const status = e.features[0].properties.status_description;
            const dateTime = e.features[0].properties.date_installed;
            const province = e.features[0].properties.province;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            _this.map.getCanvas().style.cursor = 'pointer';
            popUp
              .setLngLat(coordinates)
              .setHTML(
                `
              <div style="color: #333333; font-size: 13px; padding-top: 4px;">
                <div><strong>#${stationID} - ${location}</strong></div>
                <div>Type: ${typeName}</div>
                <div>Status: ${status}</div>
                <div>Date/Time: ${dateTime}</div>
                <div>Province: ${province}</div>
              </div>
            `
              )
              .addTo(_this.map);
          });
          this.map.on('click', sensorType, function (e) {
            graphDiv.hidden = false;
            _this.map.flyTo({
              center: (e.features[0].geometry as any).coordinates.slice(),
              zoom: 13,
              essential: true,
            });

            const stationID = e.features[0].properties.station_id;
            const location = e.features[0].properties.location;
            const pk = e.features[0].properties.pk;

            popUp.setDOMContent(graphDiv).setMaxWidth('900px');

            _this.showChart(+pk, +stationID, location, sensorType);

            _this._graphShown = true;
          });
        } else {
          popUp.remove();
          this.map.on('mouseover', sensorType, (e) => {
            _this._graphShown = false;
            _this.map.getCanvas().style.cursor = '';
            popUp.remove();
          });
          this.map.on('click', sensorType, function (e) {
            _this.map.flyTo({});
            _this._graphShown = false;
          });
        }
      });

    popUp.on('close', () => (_this._graphShown = false));

    this.map.on('mouseleave', sensorType, function () {
      if (_this._graphShown) return;

      _this.map.getCanvas().style.cursor = '';
      popUp.remove();
    });
  }

  async showChart(
    pk: number,
    stationID: number,
    location: string,
    sensorType: SensorType
  ) {
    const options: any = {
      title: {
        text: `#${stationID} - ${location}`,
      },
      credits: {
        enabled: false,
      },
      ...this.sensorChartService.getChartOpts(sensorType),
    };

    const chart = Highcharts.chart('graph-dom', options);
    chart.showLoading();

    const response: any = await this.sensorService
      .getSensorData(pk)
      .pipe(first())
      .toPromise();

    chart.hideLoading();

    const sensorChartOpts = {
      data: response.results,
      sensorType,
    };

    this.sensorChartService.showChart(chart, sensorChartOpts);
  }

  showTyphoon(typhoonType: TyphoonTrackType) {
    const pointLayerId = `${typhoonType}-points`;
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    // Keep references to the listeners
    let mouseOverListener: (e: any) => void;
    let mouseOutListener: (e: any) => void;

    combineLatest([
      this.pgService.typhoonTrackGroupShown$,
      this.pgService.getTyphoonTrackShown$(typhoonType),
    ])
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe(([groupShown, soloShown]) => {
        const visible = groupShown && soloShown;

        // Remove previous listeners if they exist
        if (mouseOverListener)
          this.map.off('mouseover', pointLayerId, mouseOverListener);
        if (mouseOutListener)
          this.map.off('mouseout', pointLayerId, mouseOutListener);

        if (visible) {
          mouseOverListener = (e: any) => {
            popup.remove(); // Always remove previous popup

            const feature = e.features[0];
            const coordinates = (feature.geometry as any).coordinates.slice();
            const internationalName = feature.properties.international_name;
            const windSpeed = feature.properties.windspeed;
            const windSpeedDisplay =
              windSpeed === null ||
              windSpeed === undefined ||
              windSpeed === 'null' ||
              windSpeed === ''
                ? 'N/A'
                : `${windSpeed} KT`;
            const status = feature.properties.status;
            const datetime = feature.properties?.datetime;

            const fixed = datetime.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
            const formattedDate = new Date(fixed).toLocaleString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Manila',
            });

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            this.map.getCanvas().style.cursor = 'pointer';

            popup
              .setLngLat(coordinates)
              .setHTML(
                `
              <strong>Typhoon Name: ${internationalName}</strong><br>
              Wind Speed: ${windSpeedDisplay}<br>
              Status: ${status}<br>
              Date/Time: ${formattedDate}
            `
              )
              .addTo(this.map);
          };

          mouseOutListener = () => {
            popup.remove();
            this.map.getCanvas().style.cursor = '';
          };

          this.map.on('mouseover', pointLayerId, mouseOverListener);
          this.map.on('mouseout', pointLayerId, mouseOutListener);
        } else {
          popup.remove();
          this.map.getCanvas().style.cursor = '';
        }
      });
  }

  /**
   * Add the layers for the critical facilities.
   *
   * Note that each critical facility type has its own layer in mapbox as of the current
   * implementation.
   */
  addCriticalFacilityLayers() {
    CRITICAL_FACILITIES_ARR.forEach((cf) => this._loadCriticalFacilityIcon(cf));
  }

  /**
   * Manually update the exaggeration of the map.
   *
   * The store is the single source of truth. Every path that can change what
   * the map should render (a slider move, the 3D Terrain checkbox, or a
   * `style.load` that wiped the style) funnels into
   * `applyTerrainExaggeration()`, which always sends a *complete* terrain
   * specification. That matters because of two `setTerrain` behaviours in
   * mapbox-gl 3.32.0:
   *
   * - `Style.setTerrain` calls `_checkLoaded()` first, so calling it while a
   *   `setStyle()` is still in flight throws `Style is not done loading`.
   * - `TerrainSpecification.source` is required. When it is omitted,
   *   `setTerrain` only fills it in from the terrain that is *already* applied;
   *   if there is none, the spec fails validation and the update is silently
   *   dropped, leaving the slider doing nothing. Always passing `source` makes
   *   the call self-contained and idempotent.
   *
   * A single subscription folds the store's `shown` flag and `level` into one
   * effective exaggeration, which replaces the two competing subscriptions that
   * used to fight over `setTerrain`. Because `addExaggerationControl()` runs
   * again on *every* `style.load` and `setTerrain` is wiped by `setStyle`, the
   * subscription is scoped with `takeUntil(this._changeStyle)`: each style
   * change tears the previous writer down and the following `style.load`
   * installs exactly one replacement. Without it, every basemap switch would
   * leave another live subscription behind, each one re-calling `setTerrain` —
   * the very "another writer" accumulation this was meant to avoid.
   * `distinctUntilChanged` runs after the mapping so it compares the
   * effective exaggeration and ignores changes that cannot alter the terrain
   * (e.g. toggling the expand chevron).
   *
   * Reference:
   * https://docs.mapbox.com/mapbox-gl-js/example/add-terrain/
   */
  addExaggerationControl() {
    this.applyTerrainExaggeration(this.getEffectiveExaggeration());

    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        map((exaggeration) => (exaggeration.shown ? exaggeration.level : 0)),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe((exaggeration) => this.applyTerrainExaggeration(exaggeration));
  }

  /**
   * The exaggeration the map should currently render: the slider level while
   * 3D Terrain is enabled, and a flat `0` while it is disabled.
   */
  private getEffectiveExaggeration(): number {
    const exaggeration = this.pgService.getExaggeration();
    return exaggeration.shown ? exaggeration.level : 0;
  }

  /**
   * Applies `exaggeration` to the map, re-adding the DEM source if needed.
   *
   * Intended to be called from the `style.load` handler, which is the point
   * where `setTerrain` is allowed to run: `Style.setTerrain` only requires the
   * style's own `_loaded` flag, and `style.load` is fired once that is set.
   * `map.isStyleLoaded()` is deliberately *not* used as a guard here, because
   * it additionally waits for every source, glyph and sprite to finish
   * loading, so it is still `false` for a while after `style.load` and would
   * silently drop the initial terrain.
   *
   * The `try`/`catch` covers the remaining race: a store emission arriving
   * while a `setStyle()` is in flight makes `setTerrain` throw
   * `Style is not done loading`. That must not escape (these run inside the
   * `style.load` initialisation chain) and does not lose the value, because
   * `addExaggerationControl()` runs again on the next `style.load` and
   * re-reads the store.
   */
  private applyTerrainExaggeration(exaggeration: number) {
    if (!this.map) {
      return;
    }

    try {
      this.addNoahSource(this.terrainSourceId, {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
        encoding: 'mapbox',
      });

      this.map.setTerrain({
        source: this.terrainSourceId,
        exaggeration,
      });
    } catch (error) {
      console.warn('Unable to apply the terrain exaggeration', error);
    }
  }

  /**
   * Initialize listeners for the changes in the hazard layers settings
   */
  async initHazardLayers() {
    const PH_TILESETS = await this.pgService.getHazardData();
    PH_TILESETS.forEach((tileset) => {
      const sourceData = {
        type: 'vector',
        url: tileset.url,
      } as mapboxgl.AnySourceData;
      const sourceID = tileset.url.replace('mapbox://upri-noah.', '');
      // 1. Add source first
      this.addNoahSource(sourceID, sourceData);

      // 2. Get the hazard type and level
      const [rawHazardType, rawHazardLevel] = [
        ...sourceID.toLowerCase().split('_').splice(1),
      ];

      const hazardType = getHazardType(rawHazardType as RawHazardType);
      const hazardLevel = getHazardLevel(
        rawHazardType as RawHazardType,
        rawHazardLevel as RawHazardLevel
      );

      if (rawHazardLevel == 'lh2') {
        this._handleLH2Hazard(sourceID, tileset.sourceLayer);
        return;
      }

      tileset.sourceLayer.forEach((sourceLayer: string) => {
        const params: LayerSettingsParam = {
          layerID: sourceLayer,
          sourceID,
          sourceLayer,
          hazardType,
          hazardLevel,
        };

        this._handleFillHazard(params);
      });
    });
  }

  initMap() {
    this.mapService.init();

    this.map = new mapboxgl.Map({
      // Shared cache / rendering-behaviour tuning for every NOAH map. See
      // MapService.getMapPerformanceOptions() for the rationale of each option.
      ...this.mapService.getMapPerformanceOptions(),
      container: 'map',
      style: environment.mapbox.styles.standard,
      zoom: 5.5,
      minZoom: 4,
      touchZoomRotate: true,
      center: PH_DEFAULT_CENTER,
      attributionControl: false,
      antialias: false,
      // The Standard basemap declares `globe`, but NOAH is a flat hazard map
      // and the legacy terrain / satellite styles are mercator. Pinning
      // mercator keeps the basemap, the hazard polygons and the coordinates
      // the rest of the app writes into the store visually unchanged. Without
      // it the basemap would start curving and the exaggeration control would
      // look different from every other layer.
      projection: 'mercator',
    });
  }

  /**
   * True when the currently loaded basemap is a Mapbox Standard style.
   *
   * Standard exposes `bottom` / `middle` / `top` slots; the legacy satellite
   * style does not, so a slot must not be sent for it.
   */
  private get isStandardBasemap(): boolean {
    return hasStandardBasemap(this.map);
  }

  /**
   * Adds a NOAH layer, skipping it when it already exists.
   *
   * Several NOAH initialisers re-run on every `style.load`, so this guard keeps
   * the additions idempotent without changing any layer id, filter or paint
   * value. `slot` defaults to the Standard `top` slot so custom overlays keep
   * the same visual position they had when appended to the end of a classic
   * style's layer array; a layer that already declares a slot (the flood
   * hazard fills, which use `middle`) keeps it.
   */
  private addNoahLayer(
    layer: mapboxgl.AnyLayer,
    slot: StandardSlot = NOAH_OVERLAY_SLOT
  ) {
    if (this.map.getLayer(layer.id)) {
      return;
    }

    let paint: mapboxgl.AnyLayer['paint'] | undefined = layer.paint;
    if (this.isStandardBasemap) {
      paint = withStandardLightingNoop(layer);
      this.map.addLayer({
        ...layer,
        slot,
        paint,
      } as mapboxgl.AnyLayer);
    } else {
      this.map.addLayer(layer);
    }
  }

  /**
   * Adds a source, skipping it when it already exists.
   */
  private addNoahSource(sourceId: string, source: mapboxgl.AnySourceData) {
    if (this.map.getSource(sourceId)) {
      return;
    }
    this.map.addSource(sourceId, source);
  }

  /**
   * The animated wind layer is off on load (it lives inside the weather-updates
   * group). Initialising it eagerly fetched the wind grid and forecast payload
   * and spun up the particle canvas that was never visible, so the whole setup
   * now waits until the group and the wind layer are both shown.
   */
  initWind(): void {
    this.runWhenFirstShown(
      combineLatest([
        this.pgService.weatherUpdatesGroupShown$,
        this.pgService.windShown$,
      ]).pipe(map(([groupShown, windShown]) => groupShown && windShown)),
      () => this.buildWind()
    );
  }

  private buildWind(): void {
    this.resizeWindCanvas();
    this.initWindParticles();

    // Prefetch the forecast payload in the background so the advance
    // forecast buttons apply instantly when clicked (the JSON is large and
    // would otherwise cause a multi-second delay on the first click).
    this.loadForecastPayload().catch(() => undefined);

    this.removeWindResizeListener();
    this.windResizeListener = () => {
      this.resizeWindCanvas();
      this.initWindParticles();
    };
    window.addEventListener('resize', this.windResizeListener);
    this.initWindMoveListeners();

    const weatherUpdateShown$ = this.pgService.weatherUpdatesGroupShown$.pipe(
      distinctUntilChanged(),
      shareReplay(1)
    );

    combineLatest([
      this.pgService.windShown$.pipe(distinctUntilChanged()),
      weatherUpdateShown$,
    ])
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe(([shown, weatherUpdateShown]) => {
        const overallShown = shown && weatherUpdateShown;
        this.windVisible = overallShown;

        if (overallShown) {
          this.resizeWindCanvas();
          this.initWindParticles();
          if (!this.windMapMoving) {
            this.startWindAnimation();
          }
        } else {
          this.stopWindAnimation();
          this.clearWindCanvas();
        }
      });

    this.pgService
      .getWindParticleCount$('wind')
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((particleCount) => {
        this.windSettings.count = particleCount;
        this.initWindParticles();
      });

    this.pgService
      .getWindSpeed$('wind')
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((speed) => {
        this.windSettings.speed = speed;
      });

    this.pgService
      .getWindColor$('wind')
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe((color) => {
        this.windSettings.color = color;
      });

    this.pgService.windTimeline$
      .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
      .subscribe(({ day, blend }) => {
        this.requestWindTimeline(day, blend);
      });
  }

  private resizeWindCanvas(): void {
    const canvas = this.windCanvas?.nativeElement;
    const mapCanvas = this.map?.getCanvas();

    if (!canvas || !mapCanvas) return;

    canvas.width = mapCanvas.clientWidth;
    canvas.height = mapCanvas.clientHeight;
  }

  private removeWindResizeListener(): void {
    if (!this.windResizeListener) return;

    window.removeEventListener('resize', this.windResizeListener);
    this.windResizeListener = null;
  }

  private initWindMoveListeners(): void {
    this.removeWindMoveListeners();

    this.windMoveStartListener = () => {
      this.windMapMoving = true;
      this.stopWindAnimation();
      this.clearWindCanvas();
    };

    this.windMoveEndListener = () => {
      this.windMapMoving = false;

      if (!this.windVisible) return;

      this.resizeWindCanvas();
      this.initWindParticles();
      this.startWindAnimation();
    };

    this.map.on('movestart', this.windMoveStartListener);
    this.map.on('moveend', this.windMoveEndListener);
  }

  private removeWindMoveListeners(): void {
    const map = this.map;

    if (this.windMoveStartListener) {
      if (map) {
        map.off('movestart', this.windMoveStartListener);
      }
      this.windMoveStartListener = null;
    }

    if (this.windMoveEndListener) {
      if (map) {
        map.off('moveend', this.windMoveEndListener);
      }
      this.windMoveEndListener = null;
    }
  }

  private getFallbackWindParticle(): WindParticle {
    const bounds = this.windGridBounds;

    return {
      lng: bounds.west + Math.random() * (bounds.east - bounds.west),
      lat: bounds.south + Math.random() * (bounds.north - bounds.south),
      age: Math.floor(Math.random() * this.windSettings.maxAge),
    };
  }

  private getSafeMapBounds(): mapboxgl.LngLatBounds | null {
    if (!this.map) return null;

    try {
      const bounds = this.map.getBounds();
      const west = bounds?.getWest();
      const east = bounds?.getEast();
      const south = bounds?.getSouth();
      const north = bounds?.getNorth();

      if (
        !bounds ||
        !Number.isFinite(west) ||
        !Number.isFinite(east) ||
        !Number.isFinite(south) ||
        !Number.isFinite(north)
      ) {
        return null;
      }

      return bounds;
    } catch {
      return null;
    }
  }

  private metDirToUV(
    speedMs: number,
    dirFromDeg: number
  ): { u: number; v: number } {
    const rad = (dirFromDeg * Math.PI) / 180;

    return {
      u: -speedMs * Math.sin(rad),
      v: -speedMs * Math.cos(rad),
    };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 103, g: 255, b: 1 };
  }

  /**
   * The wind forecast plays as one continuous sweep: every update carries
   * the day the sweep starts from plus a 0..1 blend into the following day.
   * The day pair is loaded (and cached) once per transition; blend-only
   * updates just move the pointer the running particles sample from, so the
   * flow keeps going straight through without stopping, restarting or
   * jumping when the day changes.
   */
  private requestWindTimeline(day: WindForecastDay, blend: number): void {
    this.pruneWindGridCache();

    this.windBlend = Number.isFinite(blend)
      ? Math.max(0, Math.min(1, blend))
      : 0;

    const nextDay = this.nextWindForecastDay(day);

    if (day === this.windGridDay && nextDay === this.windNextGridDay) {
      return;
    }

    // A newer pair supersedes any load still in flight, so live and
    // forecast data can never overwrite each other.
    const token = ++this.windLoadToken;

    this.windGridDay = day;
    this.windNextGridDay = nextDay;

    this.applyWindDay(day, token, (grid) => {
      this.windGrid = grid;
    });

    this.applyWindDay(nextDay, token, (grid) => {
      this.windNextGrid = grid;
    });
  }

  /**
   * Loads one day of the sweep, applying it synchronously when it is
   * already cached (the sweep revisits every day, so every pass after the
   * first is instant) and asynchronously the first time around.
   */
  private applyWindDay(
    day: WindForecastDay,
    token: number,
    assign: (grid: WindGrid | null) => void
  ): void {
    const cached = this.windGridCache[day];

    if (cached) {
      assign(cached);
      return;
    }

    this.loadWindDay(day)
      .then((grid) => {
        if (token !== this.windLoadToken) return;
        assign(grid);
      })
      .catch(() => {
        if (token !== this.windLoadToken) return;

        console.error('Wind fetch failed, using calm fallback');
        assign(null);
      });
  }

  private loadWindDay(day: WindForecastDay): Promise<WindGrid> {
    if (day === 0) {
      return this.loadLiveWindGrid().then((grid) => {
        this.windGridCache[day] = grid;
        return grid;
      });
    }

    return this.loadForecastPayload().then((payload) => {
      const grid = this.buildForecastGrid(payload.points, day);
      this.windGridCache[day] = grid;
      return grid;
    });
  }

  /**
   * After today (+5D is the last entry) the sweep flows back to the live
   * "Today" grid, so even the wrap around the end of the timeline is a
   * smooth morph instead of a jump.
   */
  private nextWindForecastDay(day: WindForecastDay): WindForecastDay {
    const lastDay = WIND_FORECAST_DAYS[WIND_FORECAST_DAYS.length - 1].value;

    return day >= lastDay ? 0 : ((day + 1) as WindForecastDay);
  }

  /** Forecast grids are keyed to the date they were built for. */
  private pruneWindGridCache(): void {
    const today = new Date().toISOString().slice(0, 10);

    if (this.windCacheDate === today) return;

    this.windCacheDate = today;
    this.windGridCache = {};
  }

  private loadLiveWindGrid(): Promise<WindGrid> {
    // Share one in-flight request so rapid clicks don't fetch the same
    // endpoint multiple times. Once it resolves, the grid is served from
    // the day cache, so this only ever runs once per session.
    if (this.windLiveGridPromise) return this.windLiveGridPromise;

    this.windLiveGridPromise = fetch(
      'https://webgis-static.up.edu.ph/api/wind/wind_grid.json'
    )
      .then((res) => {
        if (!res.ok) throw new Error(`wind API returned ${res.status}`);
        return res.json();
      })
      .then((data) => this.buildLiveGrid(data.points || []))
      .catch((err) => {
        this.windLiveGridPromise = null;
        throw err;
      });

    return this.windLiveGridPromise;
  }

  private loadForecastPayload(): Promise<{ points: any[] }> {
    if (this.windForecastPayload) {
      return Promise.resolve(this.windForecastPayload);
    }

    // Share one in-flight request so rapid clicks don't fetch the same
    // endpoint multiple times.
    if (this.windForecastPayloadPromise) {
      return this.windForecastPayloadPromise;
    }

    this.windForecastPayloadPromise = fetch(
      'https://webgis-static.up.edu.ph/api/wind/wind_forecast_grid.json'
    )
      .then((res) => {
        if (!res.ok) throw new Error(`wind API returned ${res.status}`);
        return res.json() as Promise<{ points: any[] }>;
      })
      .then((payload) => {
        this.windForecastPayload = payload;
        return payload;
      })
      .catch((err) => {
        this.windForecastPayloadPromise = null;
        throw err;
      });

    return this.windForecastPayloadPromise;
  }

  private buildLiveGrid(points: any[]): WindGrid {
    const uGrid: number[][] = [];
    const vGrid: number[][] = [];
    let idx = 0;

    for (let r = 0; r < this.windGridRows; r++) {
      const uRow: number[] = [];
      const vRow: number[] = [];

      for (let c = 0; c < this.windGridCols; c++) {
        const entry = points[idx++];
        const speed = entry?.speed ?? 0;
        const direction = entry?.direction ?? 0;
        const { u, v } = this.metDirToUV(speed, direction);

        uRow.push(u);
        vRow.push(v);
      }

      uGrid.push(uRow);
      vGrid.push(vRow);
    }

    return { uGrid, vGrid };
  }

  private buildForecastGrid(
    points: any[],
    dayOffset: WindForecastDay
  ): WindGrid {
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + dayOffset);
    const targetDateStr = target.toISOString().slice(0, 10);

    const uGrid: number[][] = [];
    const vGrid: number[][] = [];
    let idx = 0;

    for (let r = 0; r < this.windGridRows; r++) {
      const uRow: number[] = [];
      const vRow: number[] = [];

      for (let c = 0; c < this.windGridCols; c++) {
        const point = points[idx++];
        const dayHours = (point?.forecast || []).filter((hour: any) =>
          (hour?.time || '').startsWith(targetDateStr)
        );

        if (!dayHours.length) {
          uRow.push(0);
          vRow.push(0);
          continue;
        }

        // Average speed across the day, midday-ish direction as a
        // representative single frame (same approach as the reference demo).
        const speed =
          dayHours.reduce(
            (sum: number, hour: any) => sum + (hour?.speed ?? 0),
            0
          ) / dayHours.length;
        const direction =
          dayHours[Math.floor(dayHours.length / 2)]?.direction ?? 0;
        const { u, v } = this.metDirToUV(speed, direction);

        uRow.push(u);
        vRow.push(v);
      }

      uGrid.push(uRow);
      vGrid.push(vRow);
    }

    return { uGrid, vGrid };
  }

  /**
   * Wind at a point, blended between the day the sweep is on and the day it
   * is moving into, so day changes morph the flow smoothly instead of
   * snapping the whole field over at once.
   */
  private windAt(lng: number, lat: number): { u: number; v: number } {
    const from = this.sampleWindGrid(this.windGrid, lng, lat);
    const to = this.sampleWindGrid(this.windNextGrid, lng, lat);

    // Either side can still be loading (or have failed); use whichever is
    // available and only blend once both are on screen.
    if (from === null) return to ?? { u: 0, v: 0 };
    if (to === null || this.windBlend <= 0) return from;

    return {
      u: from.u + (to.u - from.u) * this.windBlend,
      v: from.v + (to.v - from.v) * this.windBlend,
    };
  }

  private sampleWindGrid(
    grid: WindGrid | null,
    lng: number,
    lat: number
  ): { u: number; v: number } | null {
    if (!grid) return null;

    const bounds = this.windGridBounds;
    const clampedLng = Math.max(bounds.west, Math.min(bounds.east, lng));
    const clampedLat = Math.max(bounds.south, Math.min(bounds.north, lat));
    const colF =
      ((clampedLng - bounds.west) / (bounds.east - bounds.west)) *
      (this.windGridCols - 1);
    const rowF =
      ((clampedLat - bounds.south) / (bounds.north - bounds.south)) *
      (this.windGridRows - 1);
    const c0 = Math.floor(colF);
    const c1 = Math.min(c0 + 1, this.windGridCols - 1);
    const r0 = Math.floor(rowF);
    const r1 = Math.min(r0 + 1, this.windGridRows - 1);
    const fc = colF - c0;
    const fr = rowF - r0;
    const { uGrid, vGrid } = grid;
    const u00 = uGrid[r0][c0];
    const u10 = uGrid[r0][c1];
    const u01 = uGrid[r1][c0];
    const u11 = uGrid[r1][c1];
    const v00 = vGrid[r0][c0];
    const v10 = vGrid[r0][c1];
    const v01 = vGrid[r1][c0];
    const v11 = vGrid[r1][c1];

    return {
      u:
        u00 * (1 - fc) * (1 - fr) +
        u10 * fc * (1 - fr) +
        u01 * (1 - fc) * fr +
        u11 * fc * fr,
      v:
        v00 * (1 - fc) * (1 - fr) +
        v10 * fc * (1 - fr) +
        v01 * (1 - fc) * fr +
        v11 * fc * fr,
    };
  }

  private randomWindParticle(): WindParticle {
    const bounds = this.getSafeMapBounds();

    if (!bounds) {
      return this.getFallbackWindParticle();
    }

    return {
      lng:
        bounds.getWest() +
        Math.random() * (bounds.getEast() - bounds.getWest()),
      lat:
        bounds.getSouth() +
        Math.random() * (bounds.getNorth() - bounds.getSouth()),
      age: Math.floor(Math.random() * this.windSettings.maxAge),
    };
  }

  private initWindParticles(): void {
    this.windParticles = [];

    for (let i = 0; i < this.windSettings.count; i++) {
      this.windParticles.push(this.randomWindParticle());
    }
  }

  private startWindAnimation(): void {
    if (this.windAnimationFrame !== null) return;

    this.windLastTimestamp = null;
    this.windAnimationFrame = requestAnimationFrame((timestamp) =>
      this.stepWind(timestamp)
    );
  }

  private stopWindAnimation(): void {
    if (this.windAnimationFrame === null) return;

    cancelAnimationFrame(this.windAnimationFrame);
    this.windAnimationFrame = null;
    this.windLastTimestamp = null;
  }

  private clearWindCanvas(): void {
    const canvas = this.windCanvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private stepWind(timestamp: number): void {
    const canvas = this.windCanvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (
      !this.windVisible ||
      this.windMapMoving ||
      !canvas ||
      !ctx ||
      !this.map
    ) {
      this.windAnimationFrame = null;
      return;
    }

    if (this.windLastTimestamp === null) this.windLastTimestamp = timestamp;

    const dt = (timestamp - this.windLastTimestamp) / 1000;
    this.windLastTimestamp = timestamp;
    const timeScale = Math.min(dt, 0.1) * 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.lineWidth = 0.3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.windSettings.color;
    const bounds = this.getSafeMapBounds();
    if (!bounds) {
      this.windAnimationFrame = requestAnimationFrame((ts) =>
        this.stepWind(ts)
      );
      return;
    }
    const dashLengthPx = 5;

    for (const particle of this.windParticles) {
      if (!Number.isFinite(particle.lng) || !Number.isFinite(particle.lat)) {
        Object.assign(particle, this.getFallbackWindParticle());
        continue;
      }

      let prevPx: { x: number; y: number };
      try {
        prevPx = this.map.project([particle.lng, particle.lat]);
      } catch {
        Object.assign(particle, this.getFallbackWindParticle());
        continue;
      }

      if (!Number.isFinite(prevPx.x) || !Number.isFinite(prevPx.y)) {
        Object.assign(particle, this.getFallbackWindParticle());
        continue;
      }

      const { u, v } = this.windAt(particle.lng, particle.lat);
      const speedMs = Math.sqrt(u * u + v * v);
      const magnitude = Math.max(speedMs, 0.001);
      const dirX = u / magnitude;
      const dirY = -v / magnitude;
      const stepPx =
        (0.4 + Math.min(speedMs, 20) * 0.1) *
        this.windSettings.speed *
        timeScale;
      const nextPxRaw = {
        x: prevPx.x + dirX * stepPx,
        y: prevPx.y + dirY * stepPx,
      };

      let nextLngLat: mapboxgl.LngLat;
      try {
        nextLngLat = this.map.unproject([nextPxRaw.x, nextPxRaw.y]);
      } catch {
        Object.assign(particle, this.getFallbackWindParticle());
        continue;
      }

      if (
        !Number.isFinite(nextLngLat.lng) ||
        !Number.isFinite(nextLngLat.lat)
      ) {
        Object.assign(particle, this.getFallbackWindParticle());
        continue;
      }

      particle.lng = nextLngLat.lng;
      particle.lat = nextLngLat.lat;
      particle.age += timeScale;

      const offscreen =
        nextPxRaw.x < 0 ||
        nextPxRaw.x > canvas.width ||
        nextPxRaw.y < 0 ||
        nextPxRaw.y > canvas.height;
      const outOfBounds =
        particle.lng < bounds.getWest() ||
        particle.lng > bounds.getEast() ||
        particle.lat < bounds.getSouth() ||
        particle.lat > bounds.getNorth();

      if (particle.age > this.windSettings.maxAge || outOfBounds || offscreen) {
        Object.assign(particle, this.randomWindParticle());
        continue;
      }

      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(prevPx.x, prevPx.y);
      ctx.lineTo(
        prevPx.x + dirX * dashLengthPx,
        prevPx.y + dirY * dashLengthPx
      );
      ctx.stroke();
    }

    this.windAnimationFrame = requestAnimationFrame((nextTimestamp) =>
      this.stepWind(nextTimestamp)
    );
  }

  private addTyphoonPopups(source: string) {
    // Ensure activePopups array exists
    if (!this.activePopups) this.activePopups = [];

    const layerName =
      source === 'typhoon-track-map-source' ? 'typhoon-track-icon' : source;

    // Helper function to handle typhoon popup display
    const handleTyphoonPopup = (features: GeoJSON.Feature<any>[]) => {
      if (!features || features.length === 0) return;

      // Close existing popups
      this.closeAllTyphoonPopups();

      const feature = features[0];
      const coords = (feature.geometry as any).coordinates.slice();
      const typhoonName = feature.properties?.international_name || 'Unnamed';
      const typhoonClass = this.getTyphoonClassFullName(
        feature.properties?.typhoon_type
      );
      const datetime = feature.properties?.datetime;
      const radius = feature.properties?.radius;

      // Format date/time
      const formattedDate = datetime
        ? new Date(datetime).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila',
          })
        : 'N/A';

      const formattedTyphoonName = typhoonName
        .replace('{', '(')
        .replace('}', ')');

      const popupHTML = `
    <div style="z-index: 9999; position: relative;">
      <h3 style="margin:0 0 10px 0;font-size:14px;font-weight:bold;color:#333;">${formattedTyphoonName}</h3>
      <p style="margin:5px 0;font-size:12px;color:#666;"><strong>Classification:</strong> ${typhoonClass}</p>
      <p style="margin:5px 0;font-size:12px;color:#666;"><strong>Date/Time:</strong> ${formattedDate}</p>
      ${
        radius && radius > 0
          ? `<p style="margin:5px 0;font-size:12px;color:#666;"><strong>Forecast Radius:</strong> ${radius} km</p>`
          : `<p style="margin:5px 0;font-size:12px;font-weight:500;">Actual Position</p>`
      }
    </div>
  `;

      // Fix for wrapped coordinates at world edges
      const lngLat = { lng: coords[0], lat: coords[1] };
      while (Math.abs(lngLat.lng - coords[0]) > 180) {
        coords[0] += lngLat.lng > coords[0] ? 360 : -360;
      }

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 25,
      })
        .setLngLat(coords)
        .setHTML(popupHTML)
        .addTo(this.map);

      // Set z-index to ensure popup appears on top
      popup.getElement().style.zIndex = '9999';

      // Store popup reference
      this.activePopups.push(popup);

      // Optional: handle close button manually if needed
      popup.getElement().addEventListener('click', (event) => {
        if ((event.target as HTMLElement).classList.contains('close-popup')) {
          popup.remove();
          const index = this.activePopups.indexOf(popup);
          if (index > -1) this.activePopups.splice(index, 1);
        }
      });
    };

    // Click event for typhoon points
    this.map.on('click', layerName, (e) => {
      handleTyphoonPopup(e.features);
    });

    // Touch event for mobile devices
    this.map.on('touchend', layerName, (e) => {
      handleTyphoonPopup(e.features);
    });

    // Hover cursor changes
    this.map.on('mouseenter', layerName, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layerName, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  // an array of popups for storing all opened popups.
  private activePopups: mapboxgl.Popup[] = [];

  // method for closing all active popups.
  private closeAllTyphoonPopups(): void {
    this.activePopups.forEach((popup) => popup.remove());
    this.activePopups = [];
  }

  // method to convert typhoon class abbreviations to full names
  private getTyphoonClassFullName(abbreviation: string): string {
    const typhoonClassMap: { [key: string]: string } = {
      LPA: 'Low Pressure Area',
      TD: 'Tropical Depression',
      TS: 'Tropical Storm',
      STS: 'Severe Tropical Storm',
      TY: 'Typhoon',
      STY: 'Super Typhoon',
    };

    return typhoonClassMap[abbreviation] || abbreviation;
  }

  async initAffectedExposure() {
    const PH_AFFECTED_DATA = await this.pgService.getAffectedPopulationData();
    const response = await fetch(
      'https://webgis-static.up.edu.ph/api/4As/affected_psgc.json'
    );
    const affectedData = await response.json();

    // Extract Bgy_Codes from affectedData and create a Set for faster lookup
    const affectedBgyCodes = new Set(affectedData.map((item) => item));

    // Use Promise.all to batch load sources and layers
    await Promise.all(
      PH_AFFECTED_DATA.map(async (layerData) => {
        const sourceData = {
          type: 'vector',
          url: layerData.url,
        } as mapboxgl.AnySourceData;

        await Promise.all(
          layerData.sourceLayer.map(async (sourceLayer) => {
            this.addNoahSource(sourceLayer, sourceData);

            this.addNoahLayer({
              id: sourceLayer,
              type: 'fill',
              source: sourceLayer,
              'source-layer': sourceLayer,
              layout: { visibility: 'none' },
              paint: {
                'fill-color': [
                  'case',
                  [
                    'in',
                    ['get', 'Bgy_Code'],
                    ['literal', [...affectedBgyCodes]],
                  ],
                  [
                    'case',
                    ['has', 'Var'],
                    [
                      'match',
                      ['get', 'Var'],
                      1,
                      NOAH_COLORS['noah-pink'].low,
                      2,
                      NOAH_COLORS['noah-pink'].medium,
                      3,
                      NOAH_COLORS['noah-pink'].high,
                      'transparent',
                    ],
                    [
                      'match',
                      ['get', 'HAZ'],
                      1,
                      NOAH_COLORS['noah-pink'].low,
                      2,
                      NOAH_COLORS['noah-pink'].medium,
                      3,
                      NOAH_COLORS['noah-pink'].high,
                      'transparent',
                    ],
                  ],
                  'transparent',
                ],
                'fill-opacity': 0.7,
              },
            });
            const groupShown$ = this.pgService.populationShown$.pipe(
              shareReplay(1)
            );

            const allShown$ = this.pgService.riskAssessmentGroupShown$.pipe(
              shareReplay(1)
            );
            const populationAffected$ = this.pgService
              .getPopulationExposure$('population')
              .pipe(shareReplay(1));

            combineLatest([allShown$, groupShown$, populationAffected$])
              .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
              .subscribe(([allShown, groupShown, populationAffected]) => {
                const visibility =
                  populationAffected.shown && allShown && groupShown
                    ? 'visible'
                    : 'none';
                this.map.setLayoutProperty(
                  sourceLayer,
                  'visibility',
                  visibility
                );
              });
          })
        );
      })
    );
  }

  /**
   * Rainfall contours are five large PNG raster overlays, all hidden until the
   * weather-updates group is turned on. Building them eagerly downloaded five
   * images that were transparent (opacity 0) on the default view, so they are
   * now created the first time the group and the contour layer are both shown.
   */
  showContourMaps() {
    this.runWhenFirstShown(
      combineLatest([
        this.pgService.weatherUpdatesGroupShown$,
        this.pgService.contourMapGroupShown$,
      ]).pipe(map(([groupShown, contourShown]) => groupShown && contourShown)),
      () => this.buildContourMaps()
    );
  }

  private buildContourMaps() {
    const contourMapImages = {
      '1hr': {
        url: 'https://webgis-static.up.edu.ph/api/contours/1hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '3hr': {
        url: 'https://webgis-static.up.edu.ph/api/contours/3hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '6hr': {
        url: 'https://webgis-static.up.edu.ph/api/contours/6hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '12hr': {
        url: 'https://webgis-static.up.edu.ph/api/contours/12hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '24hr': {
        url: 'https://webgis-static.up.edu.ph/api/contours/24hr_latest_rainfall_contour.png',
        type: 'image',
      },
    };

    const getContourMapSource = (contourMapDetails: {
      url: string;
      type: string;
    }): AnySourceData => {
      switch (contourMapDetails.type) {
        case 'image':
          return {
            type: 'image',
            url: contourMapDetails.url,
            coordinates: [
              [115.35, 21.55], // top-left
              [128.25, 21.55], // top-right
              [128.25, 3.85], // bottom-right
              [115.35, 3.85], // bottom-left
            ],
          };
        case 'video':
          return {
            type: 'video',
            urls: [contourMapDetails.url],
            coordinates: [
              [115.35, 21.55], // top-left
              [128.25, 21.55], // top-right
              [128.25, 3.85], // bottom-right
              [115.35, 3.85], // bottom-left
            ],
          };
        default:
          throw new Error('[MapPlayground] Unable to get contour map source');
      }
    };

    Object.keys(contourMapImages).forEach((contourType) => {
      const contourMapDetails = contourMapImages[contourType];

      this.addNoahSource(contourType, getContourMapSource(contourMapDetails));

      this.addNoahLayer({
        id: contourType,
        type: 'raster',
        source: contourType,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0,
        },
      });
      this._removeOverlayOnLoadError(contourType, [contourType]);

      const weatherUpdateShown$ = this.pgService.weatherUpdatesGroupShown$.pipe(
        shareReplay(1)
      );

      combineLatest([
        this.pgService.contourMapGroupShown$.pipe(distinctUntilChanged()),
        this.pgService.selectedContourMap$.pipe(distinctUntilChanged()),
        this.pgService.contourMapOpacity$.pipe(distinctUntilChanged()),
        weatherUpdateShown$,
      ])
        .pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          map(
            ([groupShown, selectedContourMap, opacity, weatherUpdateShown]) => {
              return groupShown &&
                selectedContourMap === contourType &&
                weatherUpdateShown
                ? opacity / 100
                : 0;
            }
          )
        )
        .subscribe((opacity: number) => {
          if (this.map.getLayer(contourType)) {
            this.map.setPaintProperty(contourType, 'raster-opacity', opacity);
          }
        });
    });
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this._changeStyle.next(null);
      const currentCenter = this.map.getCenter();
      const currentZoom = this.map.getZoom();
      const currentBearing = this.map.getBearing();
      const currentPitch = this.map.getPitch();
      const currentTerrain = (this.map as any).getTerrain
        ? (this.map as any).getTerrain()
        : null;
      this.map.setStyle(environment.mapbox.styles[style]);
      this.map.once('style.load', () => {
        if (currentCenter) {
          this.map.setCenter(currentCenter);
          this.map.setZoom(currentZoom);
          this.map.setBearing(currentBearing);
          this.map.setPitch(currentPitch);
        }
        if (currentTerrain) {
          try {
            this.map.setTerrain(currentTerrain);
          } catch (e) {
            console.warn('Could not restore terrain after style change', e);
          }
        }
      });
    }
  }

  /**
   * Sets up the drawing tool used to measure areas and distances.
   *
   * MapboxDraw's own button bar is hidden (`displayControlsDefault: false`
   * with `controls: false`): the draw, measure and clear actions live in the
   * NOAH map controls toolbar, which drives the control through
   * `changeMode()` / `deleteAll()`.
   */
  initCalculation() {
    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: false,
    });

    this.map.addControl(this.draw);

    this.map.on('draw.create', this.updateCalculate.bind(this));
    this.map.on('draw.delete', this.updateCalculate.bind(this));
    this.map.on('draw.update', this.updateCalculate.bind(this));
  }

  private updateCalculate(event) {
    const data = this.draw.getAll();
    const areaEl = document.getElementById('area');
    const distanceEl = document.getElementById('distance');
    let totalArea = 0;
    let totalLength = 0;

    if (data.features.length > 0) {
      data.features.forEach((feature) => {
        if (feature.geometry.type === 'Polygon') {
          const area = turfArea(feature);
          totalArea += area;
        } else if (feature.geometry.type === 'LineString') {
          const length = turfLength(feature, { units: 'kilometers' });
          totalLength += length;
        }
      });

      if (totalLength > 0 && distanceEl) {
        const roundedLength = Math.round(totalLength * 100) / 100;
        distanceEl.innerHTML = `<p><b>Total Distance:</b> ${roundedLength.toLocaleString()} km</p>`;
      } else if (distanceEl) {
        distanceEl.innerHTML = '';
      }

      if (totalArea > 0 && areaEl) {
        const roundedArea = Math.round(totalArea * 100) / 100;
        areaEl.innerHTML = `<p><b>Total Area</b>: ${roundedArea.toLocaleString()} sqm</p>`;
      } else if (areaEl) {
        areaEl.innerHTML = '';
      }
    } else {
      if (areaEl) {
        areaEl.innerHTML = '';
      }
      if (distanceEl) {
        distanceEl.innerHTML = '';
      }
    }
  }

  /**
   * All hazard maps except the debris flow and alluvial fan are
   * added to the map as layers of FillLayer type with gradations
   * of 1-3 or 2-4.
   */
  private _handleFillHazard(params: LayerSettingsParam) {
    this._addFillHazardLayer(params);
    this._watchFillHazardColor(params);
    this._watchFillHazardOpacity(params);
    this._watchFillHazardVisibility(params);
  }

  /**
   * Hazard maps under LH2 "sublevel" need special handling.
   * The properties available from the layers are as follows:
   *
   * - ALLUVIAL: 3-3
   *   - Debris flow
   *   - Fill layer
   *   - One color only
   * - ALLUVIAL: 4-4
   *   - Alluvial fan
   *   - Line layer
   *   - Black only
   *
   * The layers under LH2 will need to listen to tthe changes in
   * 'debris-flow' HazardLevel.
   */
  private _handleLH2Hazard(sourceID: string, sourceLayers: string[]) {
    sourceLayers.forEach((layerName: string) => {
      const [rawHazardType, lh2Subtype] = [
        ...layerName.toLowerCase().split('_').splice(1),
      ];

      this._addLH2HazardLayer(sourceID, layerName, lh2Subtype as LH2Subtype);
      this._watchLH2HazardColor(layerName, lh2Subtype as LH2Subtype);
      this._watchLH2HazardOpacity(layerName, lh2Subtype as LH2Subtype);
      this._watchLH2HazardVisibility(layerName, lh2Subtype as LH2Subtype);
    });
  }

  /**
   * Add individual layers per hazard level (for each hazard type)
   * @param params
   */
  private _addFillHazardLayer(params: LayerSettingsParam) {
    const { layerID, sourceID, sourceLayer, hazardType, hazardLevel } = params;
    // `middle` keeps the flood polygons above terrain / 3D buildings but below
    // Standard's own labels, so hazard data stays readable.
    this.addNoahLayer(
      {
        id: layerID,
        type: 'fill',
        source: sourceID,
        'source-layer': sourceLayer,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': getHazardColor(hazardType, 'noah-red', hazardLevel),
          'fill-opacity': 0.75,
        },
        slot: 'middle',
      },
      NOAH_HAZARD_SLOT
    );
  }

  /**
   * Reuse the same method to add the alluvial fan and debris flow layers
   *
   * @param sourceID
   * @param layerName
   * @param lh2Subtype
   */
  private _addLH2HazardLayer(
    sourceID: string,
    layerName: string,
    lh2Subtype: LH2Subtype
  ) {
    if (lh2Subtype === 'af') {
      this.addNoahLayer(
        {
          id: layerName,
          type: 'line',
          source: sourceID,
          'source-layer': layerName,
          layout: { visibility: 'none' },
          paint: {
            'line-width': 2,
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'ALLUVIAL'],
              4,
              NOAH_COLORS['noah-black'].high,
            ],
            'line-opacity': 0.75,
          },
        },
        NOAH_HAZARD_SLOT
      );
    }

    if (lh2Subtype === 'df') {
      this.addNoahLayer(
        {
          id: layerName,
          type: 'fill',
          source: sourceID,
          'source-layer': layerName,
          layout: { visibility: 'none' },
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'ALLUVIAL'],
              3,
              NOAH_COLORS['noah-red'].high,
            ],
            'fill-opacity': 0.75,
          },
        },
        NOAH_HAZARD_SLOT
      );
    }
  }

  private _watchFillHazardColor(params: LayerSettingsParam) {
    const { layerID, hazardType, hazardLevel } = params;

    this.pgService
      .getHazardLevel$(hazardType, hazardLevel)
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        filter((level) => !!level),
        distinctUntilChanged(
          (x, y) => x.color === y.color && x.colorRevision === y.colorRevision
        )
      )
      .subscribe((level) =>
        this.map.setPaintProperty(
          layerID,
          'fill-color',
          getHazardColor(
            hazardType,
            level.color,
            hazardLevel,
            level.customPalette
          )
        )
      );
  }

  private _watchLH2HazardColor(layerName: string, lh2Subtype: LH2Subtype) {
    if (lh2Subtype === 'af') {
      return;
    }

    this.pgService
      .getHazardLevel$('landslide', 'debris-flow') // Yes, these are fixed
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        filter((level) => !!level),
        distinctUntilChanged(
          (x, y) => x.color === y.color && x.colorRevision === y.colorRevision
        )
      )
      .subscribe((level) =>
        this.map.setPaintProperty(layerName, 'fill-color', [
          'interpolate',
          ['linear'],
          ['get', 'ALLUVIAL'],
          3,
          level.customPalette?.high ?? NOAH_COLORS[level.color].high,
        ])
      );
  }

  private _watchFillHazardOpacity(params: LayerSettingsParam) {
    const { layerID, hazardType, hazardLevel } = params;

    this.pgService
      .getHazardLevel$(hazardType, hazardLevel)
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        filter((level) => !!level),
        distinctUntilChanged((x, y) => x.opacity !== y.opacity)
      )
      .subscribe((level) =>
        this.map.setPaintProperty(layerID, 'fill-opacity', level.opacity / 100)
      );
  }

  private _watchLH2HazardOpacity(layerName, lh2Subtype: LH2Subtype) {
    this.pgService
      .getHazardLevel$('landslide', 'debris-flow')
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        filter((level) => !!level),
        distinctUntilChanged((x, y) => x.opacity !== y.opacity)
      )
      .subscribe((level) => {
        const newOpacity = level.opacity / 100;
        if (lh2Subtype === 'af') {
          this.map.setPaintProperty(layerName, 'line-opacity', newOpacity);
          return;
        }

        this.map.setPaintProperty(layerName, 'fill-opacity', newOpacity);
      });
  }

  private _watchFillHazardVisibility(params: LayerSettingsParam) {
    const { layerID, hazardType, hazardLevel } = params;

    const hazardType$ = this.pgService.getHazard$(hazardType).pipe(
      takeUntil(this._unsub),
      takeUntil(this._changeStyle),
      distinctUntilChanged((x, y) => x.shown === y.shown),
      shareReplay(1)
    );

    const hazardLevel$ = this.pgService
      .getHazardLevel$(hazardType, hazardLevel)
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged((x, y) => x.shown !== y.shown),
        shareReplay(1)
      );

    combineLatest([hazardType$, hazardLevel$])
      .pipe(
        filter(
          ([hazardTypeValue, hazardLevelValue]) =>
            !!hazardTypeValue && !!hazardLevelValue
        )
      )
      .subscribe(([hazardTypeValue, hazardLevelValue]) => {
        const visibility =
          hazardTypeValue.shown && hazardLevelValue.shown ? 'visible' : 'none';
        this.map.setLayoutProperty(layerID, 'visibility', visibility);
      });
  }

  private _watchLH2HazardVisibility(layerName: string, lh2Subtype: LH2Subtype) {
    const hazardType = 'landslide';
    const hazardLevel = 'debris-flow';

    const hazardType$ = this.pgService.getHazard$(hazardType).pipe(
      takeUntil(this._unsub),
      takeUntil(this._changeStyle),
      distinctUntilChanged((x, y) => x.shown === y.shown),
      shareReplay(1)
    );

    const hazardLevel$ = this.pgService
      .getHazardLevel$(hazardType, hazardLevel)
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged((x, y) => x.shown !== y.shown),
        shareReplay(1)
      );

    combineLatest([hazardType$, hazardLevel$])
      .pipe(
        filter(
          ([hazardTypeValue, hazardLevelValue]) =>
            !!hazardTypeValue && !!hazardLevelValue
        )
      )
      .subscribe(([hazardTypeValue, hazardLevelValue]) => {
        const visibility =
          hazardTypeValue.shown && hazardLevelValue.shown ? 'visible' : 'none';
        this.map.setLayoutProperty(layerName, 'visibility', visibility);
      });
  }

  private _loadCriticalFacilityIcon(name: CriticalFacility) {
    const _this = this;
    this.map.loadImage(`assets/map-sprites/${name}.png`, (error, image) => {
      if (error) throw error;
      // This runs again on every style change, so guard against re-registering
      // an image that Mapbox GL JS already has.
      if (!_this.map.hasImage(name)) {
        _this.map.addImage(name, image);
      }

      _this.addNoahSource(name, {
        type: 'geojson',
        data: criticalFacilities[name].data,
        cluster: true,
        clusterMaxZoom: 12,
        clusterMinPoints: 3,
      });

      _this.addNoahLayer(getCircleLayer(name));
      _this.addNoahLayer(getSymbolLayer(name, this.mapStyle));
      _this.addNoahLayer(getClusterTextCount(name));

      // opacity
      this.pgService
        .getCriticalFacility$(name)
        .pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.opacity !== y.opacity)
        )
        .subscribe((facility) => {
          const newOpacity = facility.opacity / 100;
          this.map.setPaintProperty(
            `${name}-image`,
            'icon-opacity',
            newOpacity
          );

          this.map.setPaintProperty(
            `${name}-image`,
            'text-opacity',
            newOpacity
          );

          this.map.setPaintProperty(
            `${name}-cluster`,
            'circle-opacity',
            newOpacity
          );

          this.map.setPaintProperty(
            `${name}-cluster-text`,
            'text-opacity',
            newOpacity
          );
        });

      // shown
      const allShown$ = this.pgService.criticalFacilitiesShown$.pipe(
        distinctUntilChanged()
      );

      const facility$ = this.pgService
        .getCriticalFacility$(name)
        .pipe(distinctUntilChanged((x, y) => x.shown !== y.shown));

      combineLatest([allShown$, facility$])
        .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
        .subscribe(([allShown, facility]) => {
          const visibility = facility.shown && allShown ? 'visible' : 'none';
          [`${name}-image`, `${name}-cluster`, `${name}-cluster-text`].forEach(
            (id) => this.map.setLayoutProperty(id, 'visibility', visibility)
          );
        });
    });
  }
}

function getHazardType(rawHazardType: RawHazardType): HazardType {
  switch (rawHazardType) {
    case 'fh':
      return 'flood';
    case 'lh':
      return 'landslide';
    case 'ssh':
      return 'storm-surge';
    default:
      break;
  }
  throw new Error(`Cannot find hazard type ${rawHazardType}`);
}

function getHazardLevel(
  rawHazardType: RawHazardType,
  rawHazardLevel: RawHazardLevel
): HazardLevel {
  switch (rawHazardType) {
    case 'fh':
      const strippedFloodLevel = rawHazardLevel.replace('yr', '');
      return `flood-return-period-${strippedFloodLevel}` as HazardLevel;
    case 'lh':
      return handleLandslideLevel(
        rawHazardLevel as RawLandslideHazards
      ) as HazardLevel;
    case 'ssh':
      const strippedSSHLevel = rawHazardLevel.replace('ssa', '');
      return `storm-surge-advisory-${strippedSSHLevel}` as HazardLevel;
    default:
      break;
  }

  throw new Error(`Cannot find hazard type ${rawHazardType}`);
}

function handleLandslideLevel(level: RawLandslideHazards): LandslideHazards {
  switch (level) {
    case 'lh1':
      return 'landslide-hazard';
    case 'lh2':
      // returns debris-flow for both debris-flow and alluvial fan
      return 'debris-flow';
    case 'lh3':
      return 'unstable-slopes-maps';
    default:
      break;
  }

  throw new Error(`Cannot find hazard level ${level}`);
}
