import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, {
  AnySourceData,
  GeolocateControl,
  Map,
  Marker,
} from 'mapbox-gl';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { environment } from '@env/environment';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {
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
  takeUntil,
  tap,
} from 'rxjs/operators';
import { getHazardColor } from '@shared/mocks/flood';
import {
  criticalFacilities,
  CriticalFacility,
  CRITICAL_FACILITIES_ARR,
  getCircleLayer,
  getClusterTextCount,
  getSymbolLayer,
} from '@shared/mocks/critical-facilities';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
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

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

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

type MapStyle = 'terrain' | 'satellite';

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

HC_exporting(Highcharts);
HC_Data(Highcharts);
Accessbility(Highcharts);

@Component({
  selector: 'noah-map-playground',
  templateUrl: './map-playground.component.html',
  styleUrls: ['./map-playground.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MapPlaygroundComponent implements OnInit, OnDestroy {
  map!: Map;

  geolocateControl!: GeolocateControl;
  centerMarker!: Marker;
  pgLocation: string = '';
  mapStyle: MapStyle = 'terrain';
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
  private hasInitialized = false;

  @ViewChild('selectQc') selectQc: ElementRef;

  constructor(
    private mapService: MapService,
    private pgService: NoahPlaygroundService,
    private sensorChartService: SensorChartService,
    private sensorService: SensorService,
    private qcSensorService: QcSensorService,
    private qcSensorChartService: QcSensorChartService,
    private modalService: ModalService,
    private typhoonService: TyphoonTrackService
  ) {
    // this.getScreenSize();
  }

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initOnce();
        this.initStyleDependentLayers();
      });
  }

  private initOnce(): void {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    this.addNavigationControls();
    this.addGeolocationControls();

    this.initCenterListener();
    this.initGeolocationListener();
    this.initCalculation();
    this.addCustomTooltips();

    this.getScreenSize();
    this.iniScaleControl();
    this.initGMABoundary();
  }

  private initStyleDependentLayers(): void {
    // Lightweight first (important for perceived speed)
    this.addExaggerationControl();
    this.addCriticalFacilityLayers();
    this.initBoundaries();
    this.initBarangayBoundary();

    // Medium load
    this.initHazardLayers();
    this.initVolcanoes();
    this.initWeatherSatelliteLayers();

    // Heavy layers (lazy load)
    requestAnimationFrame(() => {
      this.initQuezonCitySensors();
      this.initQCCritFac();
      this.initQCMunicipalBoundary();
      this.initAffectedExposure();
      this.initRainForcast();
      this.initTyphoonTrack();
      this.initPar();
    });

    // Center listeners (cheap)
    this.initQcCenterListener();
    this.initLagunaCenterListener();
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
    this._changeStyle.next();
    this._changeStyle.complete();
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  /**
   * Adds the plus and minus zoom map controls
   */
  addNavigationControls() {
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  /**
   * Adds the geolocation map control
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
          pitch: 50,
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
                pitch: 50,
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
    const scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric',
    });

    // Create a custom container for the scale control
    const container = document.createElement('div');
    container.id = 'custom-scale-control';
    container.style.position = 'absolute';
    container.style.top = '50%'; // vertically centered
    container.style.right = '10px'; // some margin from right edge
    container.style.transform = 'translateY(-50%)';
    container.style.padding = '5px'; // padding around the box
    container.style.background = 'white';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

    // Append container to the map
    this.map.getContainer().appendChild(container);

    // Add the scale control using Mapbox’s API
    const scaleEl = scale.onAdd(this.map);
    container.appendChild(scaleEl);

    // Style adjustments
    const scaleElem = scaleEl as HTMLElement;
    scaleElem.style.fontSize = '12px';
    scaleElem.style.lineHeight = '20px';
    scaleElem.style.fontWeight = 'bold';

    // Align the text and scale bar like Mapbox example
    scaleElem.style.display = 'flex';
    scaleElem.style.flexDirection = 'column'; // puts number above the bar
    scaleElem.style.alignItems = 'center'; // center horizontal alignment

    if (scaleElem.style.flexDirection === 'row') {
      // find the label element inside the scaleEl
      const label = scaleElem.querySelector('div');
      if (label) {
        (label as HTMLElement).style.paddingLeft = '8px'; // space between bar and text
      }
    }

    const applyPosition = () => {
      if (window.innerWidth <= 767) {
        container.style.top = '423px';
      } else {
        container.style.top = '359px';
      }
    };
    applyPosition();
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
          // add layer to map
          this.map.addLayer({
            id: qcSensorType,
            type: 'circle',
            source: {
              type: 'geojson',
              data,
            },
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
          this.map.addLayer({
            id: qcTextID,
            type: 'symbol',
            source: {
              type: 'geojson',
              data,
            },
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

              while (Math.abs(e.lnglat - coordinates[0]) > 180) {
                coordinates[0] += e.lnglat.lng > coordinates[0] ? 360 : -360;
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

              while (Math.abs(e.lnglat - coordinates[0]) > 180) {
                coordinates[0] += e.lnglat.lng > coordinates[0] ? 360 : -360;
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
          // add layer to map
          this.map.addLayer({
            id: 'private_school',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#FF87CA', // PINK color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'Private School'],
          });
          this.map.addLayer({
            id: 'barangay',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#9EA9F0', // BLUE color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'Barangay'],
          });
          this.map.addLayer({
            id: 'qc_hospitals',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#CD5D7D', // GREEN color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'Hospital'],
          });
          this.map.addLayer({
            id: 'health_center',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#F7D59C', // YELLOW color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'Health Center'],
          });
          this.map.addLayer({
            id: 'university',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#54BAB9', // TEAL color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'University'],
          });
          this.map.addLayer({
            id: 'elem_school',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#B983FF', // purple color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'Elementary School'],
          });
          this.map.addLayer({
            id: 'high_school',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#6E85B7', // LIGHT BLUE color fill
              'fill-opacity': 0.75,
            },
            filter: ['==', 'CF Type', 'High School'],
          });
          // 4 - add a outline around the polygon
          this.map.addLayer({
            id: 'ps_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#FF87CA', // PINK LINE fill
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'Private School'],
          });
          this.map.addLayer({
            id: 'b_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#9EA9F0', // BLUE LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'Barangay'],
          });
          this.map.addLayer({
            id: 'h_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#CD5D7D', // red LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'Hospital'],
          });
          this.map.addLayer({
            id: 'hc_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#F7D59C', // YELLOW LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'Health Center'],
          });
          this.map.addLayer({
            id: 'u_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#54BAB9', // TEAL LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'University'],
          });
          this.map.addLayer({
            id: 'es_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#B983FF', // purple LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'Elementary School'],
          });
          this.map.addLayer({
            id: 'hs_outline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'line-color': '#6E85B7', // LIGHT BLUE LINE color
              'line-width': 3,
              'line-opacity': 1,
            },
            filter: ['==', 'CF Type', 'High School'],
          });

          // add show/hide listeners
          combineLatest([
            this.pgService.qcCriticalFacilitiesShown$,
            this.pgService.getQcCriticalFacilitiesShown$(qcCriticalFacilities),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              this.map.setPaintProperty(
                'private_school',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'barangay',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'qc_hospitals',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'health_center',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'university',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'elem_school',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'high_school',
                'fill-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'ps_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'b_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'h_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'hc_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'u_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'es_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
              this.map.setPaintProperty(
                'hs_outline',
                'line-opacity',
                +(groupShown && soloShown)
              );
            });
        })
        .catch(() =>
          console.error(
            `Unable to fetch qc critical facilities data "${qcCriticalFacilities}"`
          )
        );
    });
  }

  initGMABoundary() {
    if (!this.map) return; // make sure map is initialized

    this.map.on('load', () => {
      // 1️⃣ Add the GeoJSON source
      if (!this.map.getSource('gma-boundary')) {
        this.map.addSource('gma-boundary', {
          type: 'geojson',
          data: 'https://upri-noah.s3.amazonaws.com/boundary/Boundary_NCR_Updated.geojson',
        });
      }

      // 2️⃣ Add fill layer
      // if (!this.map.getLayer('gma-boundary-fill')) {
      //   this.map.addLayer({
      //     id: 'gma-boundary-fill',
      //     type: 'fill',
      //     source: 'gma-boundary',
      //     paint: {
      //       'fill-color': '#0080ff',
      //       'fill-opacity': 0.3,
      //     },
      //   });
      // }

      // 3️⃣ Add outline layer
      if (!this.map.getLayer('gma-boundary-outline')) {
        this.map.addLayer({
          id: 'gma-boundary-outline',
          type: 'line',
          source: 'gma-boundary',
          paint: {
            'line-color': '#4B0082',
            'line-width': 3,
          },
        });
      }

      // 4️⃣ Fit map to MultiPolygon bounds
      fetch(
        'https://upri-noah.s3.amazonaws.com/boundary/Boundary_NCR_Updated.geojson'
      )
        .then((res) => res.json())
        .then((data: GeoJSON.FeatureCollection) => {
          const bounds = new mapboxgl.LngLatBounds();

          data.features.forEach((feature) => {
            if (feature.geometry.type === 'Polygon') {
              feature.geometry.coordinates[0].forEach((coord) =>
                bounds.extend(coord as [number, number])
              );
            } else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach((polygon) =>
                polygon[0].forEach((coord) =>
                  bounds.extend(coord as [number, number])
                )
              );
            }
          });

          if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, { padding: 20 });
          }
        });
    });
  }

  initQCMunicipalBoundary() {
    QCBoundary.forEach((qcMunicipalBoundary: QuezonCityMunicipalBoundary) => {
      this.qcSensorService
        .getQcMunicipalBoundary()
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          // add layer to map
          this.map.addLayer({
            id: 'qc_muni_boundary',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#000000', // white fill
              'fill-opacity': 0.01,
            },
          });
          this.map.addLayer({
            id: 'qc_muni_boudline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
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
              const fillColor =
                groupShown && soloShown ? '#000000' : 'rgba(0,0,0,0)';
              this.map.setPaintProperty(
                'qc_muni_boundary',
                'fill-color',
                fillColor
              );
              this.map.setPaintProperty(
                'qc_muni_boudline',
                'line-opacity',
                +(groupShown && soloShown)
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
          // add layer to map
          this.map.addLayer({
            id: 'brgy-boundary',
            type: 'fill',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'fill-color': '#000000', // white fill
              'fill-opacity': 0.01,
            },
          });
          this.map.addLayer({
            id: 'brgy_boundline',
            type: 'line',
            source: {
              type: 'geojson',
              data,
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
              const fillColor =
                groupShown && soloShown ? '#000000' : 'rgba(0,0,0,0)';
              this.map.setPaintProperty(
                'brgy-boundary',
                'fill-color',
                fillColor
              );
              this.map.setPaintProperty(
                'brgy_boundline',
                'line-opacity',
                +(groupShown && soloShown)
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
    this.map.addSource('par-outline', {
      type: 'geojson',
      data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/par/par_outline.geojson',
    });

    this.map.addLayer({
      id: 'par-outline-layer',
      type: 'line',
      source: 'par-outline',
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

    const allShown$ = this.pgService.weatherSatellitesShown$.pipe(
      shareReplay(1)
    );
    const groupShown$ = this.pgService.typhoonTrackGroupShown$.pipe(
      shareReplay(1)
    );

    combineLatest([allShown$, groupShown$])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([allShown, groupShown]) => {
        const opacity = +(allShown || groupShown);
        this.map.setPaintProperty('par-outline-layer', 'line-opacity', opacity);
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
  //         this.map.addLayer({
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

  initRainForcast() {
    const rainForcastImage = {
      'rain-forecast': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/rainfall/rainmap_gtif_day1.png',
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
      this.map.addSource(rainType, getRainForcastSource(rainForcastDetails));

      this.map.addLayer({
        id: rainType,
        type: 'raster',
        source: rainType,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 1,
        },
      });

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
          this.map.setPaintProperty(rainType, 'raster-opacity', newOpacity);
        });
    });
  }

  async initTyphoonTrack() {
    const typhoonLayerSourceFile: string =
      'https://upri-noah.s3.amazonaws.com/typhoon_track/pagasa_typhoon.geojson';

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
      this.map.addSource(typhoonMapSource, { type: 'geojson', data: mainData });
    } else {
      (this.map.getSource(typhoonMapSource) as any).setData(mainData);
    }
    // MAIN POINTS
    if (!this.map.getLayer('typhoon-track-icon')) {
      this.map.addLayer({
        id: 'typhoon-track-icon',
        type: 'symbol',
        source: typhoonMapSource,
        layout: {
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
      this.map.addLayer({
        id: 'typhoon-track-line',
        type: 'line',
        source: typhoonMapSource,
        filter: ['==', ['get', 'type'], 'track_line'],
        paint: {
          'line-width': 2,
          'line-color': '#000',
        },
      });
    }

    // FORECAST - IF EXISTING
    if (!this.map.getLayer('typhoon-forecast-circles-fill')) {
      this.map.addLayer({
        id: 'typhoon-forecast-circles-fill',
        type: 'fill',
        source: typhoonMapSource,
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

      this.map.addLayer({
        id: 'typhoon-forecast-circles-outline',
        type: 'line',
        source: typhoonMapSource,
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
      this.map.addLayer({
        id: 'typhoon-track-line',
        type: 'line',
        source: typhoonMapSource,
        paint: { 'line-color': '#000', 'line-width': 2 },
        filter: ['==', ['get', 'type'], 'track_line'],
      });
    }

    combineLatest([
      this.pgService.typhoonTrackGroupShown$,
      this.pgService.getTyphoonTrackShown$('pagasa'), // PAGASA ONLY
    ])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([groupShown, soloShown]) => {
        const visibility = groupShown && soloShown ? 'visible' : 'none';
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

          if (!this.map.getLayer(lineId)) {
            this.map.addLayer({
              id: lineId,
              type: 'line',
              source: { type: 'geojson', data },
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
            this.map.addLayer({
              id: pointsId,
              type: 'circle',
              source: { type: 'geojson', data },
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
            this.pgService.getTyphoonTrackShown$(agencyType),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              const visibleByToggle = groupShown && soloShown && hasFeatures;

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
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/volcanoes/active_volcano_rad.geojson',
      },
      'potentially-active': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/volcanoes/volcanoes_potentially_active.geojson',
      },
      inactive: {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/volcanoes/volcanoes_inactive.geojson',
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
          _this.map.addImage(volcanoType, image);

          // 4 - add source
          const volcanoMapSource = `${volcanoType}-map-source`;
          _this.map.addSource(volcanoMapSource, {
            type: 'geojson',
            data: volcanoObjData.url,
          });

          // 5 - add layer
          const layerID = `${volcanoType}-map-layer`;
          this.map.addLayer({
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

          combineLatest([allShown$, volcano$])
            .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
            .subscribe(([allShown, volcano]) => {
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
              this.map.setPaintProperty(layerID, 'icon-opacity', newOpacity);
              this.map.setPaintProperty(layerID, 'text-opacity', newOpacity);
            });
        }
      );
    });
  }
  initWeatherSatelliteLayers() {
    const weatherSatelliteImages = {
      himawari: {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/sat_webm/ph_himawari.webm',
        type: 'video',
      },
      'himawari-GSMAP': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/sat_webm/ph_hima_gsmap.webm',
        type: 'video',
      },
    };

    Object.keys(weatherSatelliteImages).forEach(
      (weatherType: WeatherSatelliteType) => {
        const weatherSatelliteDetails = weatherSatelliteImages[weatherType];

        this.map.addSource(weatherType, {
          type: 'video',
          urls: [weatherSatelliteDetails.url],
          coordinates: [
            [100.0, 29.25],
            [160.0, 29.25],
            [160.0, 5.0],
            [100.0, 5.0],
          ],
        });

        this.map.addLayer({
          id: weatherType,
          type: 'raster',
          source: weatherType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0,
          },
        });

        const allShown$ = this.pgService.weatherSatellitesShown$.pipe(
          distinctUntilChanged(),
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

        let hasZoomed = false;

        combineLatest([allShown$, selectedWeather$, weatherTypeOpacity$])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(([allShown, selectedWeather, weatherTypeOpacity]) => {
            // ✅ Zoom only when allShown turns true
            if (allShown && !hasZoomed) {
              hasZoomed = true;
              this.map.flyTo({
                center: PH_DEFAULT_CENTER,
                zoom: 5,
                essential: true,
              });
            }
            if (!allShown) {
              hasZoomed = false;
            }

            const isVisible = allShown && selectedWeather === weatherType;
            const opacity = isVisible ? weatherTypeOpacity / 100 : 0;

            this.map.setPaintProperty(weatherType, 'raster-opacity', opacity);
          });
      }
    );
  }

  // start of boundaries
  initBoundaries() {
    // Define variables to hold popup and layer IDs
    let popup;
    let layerID;

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

        const boundariesMapSource = `${boundariesType}-map-source`;
        // 2 - add source
        this.map.addSource(boundariesMapSource, {
          type: 'vector',
          url: boundariesObjData.url,
        });
        // 3 - add layer
        layerID = `${boundariesType}-map-layer`;

        this.map.addLayer({
          id: layerID,
          type: 'fill',
          source: boundariesMapSource,
          'source-layer': boundariesObjData.sourceLayer,
          paint: {
            'fill-color': 'rgba(0, 0, 0, 0)', //Transparent color for area
          },
          interactive: true,
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

        this.map.addLayer({
          id: lineLayerID,
          type: 'line',
          source: boundariesMapSource,
          'source-layer': boundariesObjData.sourceLayer,
          paint: linePaint,
          interactive: false,
        });
        let municipalTextLayerID;
        let provincialTextLayerID;

        if (boundariesType === 'municipal' || boundariesType === 'provincial') {
          const textLayerID = `${boundariesType}-text-layer`;
          this.map.addLayer({
            id: textLayerID,
            type: 'symbol',
            source: boundariesMapSource,
            'source-layer': boundariesObjData.sourceLayer,
            layout: {
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
   * Reference:
   * https://docs.mapbox.com/mapbox-gl-js/example/add-terrain/
   */
  addExaggerationControl() {
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      volatile: true,
    } as any);

    // Watch exaggeration level
    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged(),
        map((exaggeration) => exaggeration.level)
      )
      .subscribe((level) =>
        this.map.setTerrain({ source: 'mapbox-dem', exaggeration: level })
      );

    // Watch exaggeration visibility
    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged()
      )
      .subscribe((exaggeration) => {
        if (exaggeration.shown) {
          this.map.setTerrain({
            source: 'mapbox-dem',
            exaggeration: exaggeration.level,
          });
          return;
        }

        this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 0 });
      });
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
      this.map.addSource(sourceID, sourceData);

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
      container: 'map',
      style: environment.mapbox.styles.terrain,
      zoom: 5.5,
      minZoom: 5.5, // can't zoom out further than PH
      maxZoom: 18, // optional (adjust if needed)
      touchZoomRotate: true,
      center: PH_DEFAULT_CENTER,
      attributionControl: false,
    });
  }

  private addTyphoonPopups(source: string) {
    // Ensure activePopups array exists
    if (!this.activePopups) this.activePopups = [];

    // Click event for typhoon points
    this.map.on(
      'click',
      source === 'typhoon-track-map-source' ? 'typhoon-track-icon' : source,
      (e) => {
        if (!e.features || e.features.length === 0) return;

        // Close existing popups
        this.closeAllTyphoonPopups();

        const feature = e.features[0];
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
      <div>
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
        while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
          coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
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
      }
    );

    // Hover cursor changes
    this.map.on(
      'mouseenter',
      source === 'typhoon-track-map-source' ? 'typhoon-track-icon' : source,
      () => {
        this.map.getCanvas().style.cursor = 'pointer';
      }
    );
    this.map.on(
      'mouseleave',
      source === 'typhoon-track-map-source' ? 'typhoon-track-icon' : source,
      () => {
        this.map.getCanvas().style.cursor = '';
      }
    );
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
      'https://upri-noah.s3.ap-southeast-1.amazonaws.com/4As/affected_psgc.json'
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
            this.map.addSource(sourceLayer, sourceData);

            this.map.addLayer({
              id: sourceLayer,
              type: 'fill',
              source: sourceLayer,
              'source-layer': sourceLayer,
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
                let newOpacity = 0;
                if (populationAffected.shown && allShown && groupShown) {
                  newOpacity = populationAffected.opacity / 100;
                }
                this.map.setPaintProperty(
                  sourceLayer,
                  'fill-opacity',
                  newOpacity
                );
              });
          })
        );
      })
    );
  }

  // showContourMaps() {
  //   const contourMapImages = {
  //     '1hr': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/1hr_latest_rainfall_contour.png',
  //       type: 'image',
  //     },
  //     '3hr': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/3hr_latest_rainfall_contour.png',
  //       type: 'image',
  //     },
  //     '6hr': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/6hr_latest_rainfall_contour.png',
  //       type: 'image',
  //     },
  //     '12hr': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/12hr_latest_rainfall_contour.png',
  //       type: 'image',
  //     },
  //     '24hr': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/24hr_latest_rainfall_contour.png',
  //       type: 'image',
  //     },
  //     '24hr-lapse': {
  //       url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/ph_contour.webm',
  //       type: 'video',
  //     },
  //   };

  //   const getContourMapSource = (contourMapDetails: {
  //     url: string;
  //     type: string;
  //   }): AnySourceData => {
  //     switch (contourMapDetails.type) {
  //       case 'image':
  //         return {
  //           type: 'image',
  //           url: contourMapDetails.url,
  //           coordinates: [
  //             [115.35, 21.55], // top-left
  //             [128.25, 21.55], // top-right
  //             [128.25, 3.85], // bottom-right
  //             [115.35, 3.85], // bottom-left
  //           ],
  //         };
  //       case 'video':
  //         return {
  //           type: 'video',
  //           urls: [contourMapDetails.url],
  //           coordinates: [
  //             [115.35, 21.55], // top-left
  //             [128.25, 21.55], // top-right
  //             [128.25, 3.85], // bottom-right
  //             [115.35, 3.85], // bottom-left
  //           ],
  //         };
  //       default:
  //         throw new Error('[MapPlayground] Unable to get contour map source');
  //     }
  //   };

  //   Object.keys(contourMapImages).forEach((contourType) => {
  //     const contourMapDetails = contourMapImages[contourType];

  //     this.map.addSource(contourType, getContourMapSource(contourMapDetails));

  //     this.map.addLayer({
  //       id: contourType,
  //       type: 'raster',
  //       source: contourType,
  //       paint: {
  //         'raster-fade-duration': 0,
  //         'raster-opacity': 0,
  //       },
  //     });

  //     combineLatest([
  //       this.pgService.contourMapGroupShown$.pipe(distinctUntilChanged()),
  //       this.pgService.selectedContourMap$.pipe(distinctUntilChanged()),
  //     ])
  //       .pipe(
  //         takeUntil(this._unsub),
  //         takeUntil(this._changeStyle),
  //         map(([groupShown, selectedContourMap]) => {
  //           return +(groupShown && selectedContourMap === contourType);
  //         })
  //       )
  //       .subscribe((opacity: number) => {
  //         this.map.setPaintProperty(contourType, 'raster-opacity', opacity);
  //       });
  //   });
  // }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
      this._changeStyle.next();
    }
  }

  initCalculation() {
    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        trash: true,
      },
    });

    this.map.addControl(this.draw);

    this.map.on('draw.create', this.updateCalculate.bind(this));
    this.map.on('draw.delete', this.updateCalculate.bind(this));
    this.map.on('draw.update', this.updateCalculate.bind(this));
  }

  private updateCalculate(event) {
    const data = this.draw.getAll();
    const answer = document.getElementById('area');
    let totalArea = 0;
    let totalLength = 0;

    if (data.features.length > 0) {
      data.features.forEach((feature) => {
        if (feature.geometry.type === 'Polygon') {
          const area = turf.area(feature);
          totalArea += area;
        } else if (feature.geometry.type === 'LineString') {
          const length = turf.length(feature, { units: 'kilometers' });
          totalLength += length;
        }
      });

      let output = '';

      if (totalLength > 0) {
        const roundedLength = Math.round(totalLength * 100) / 100;
        output += `<p style="margin-bottom:2px;"><b>Total Distance:</b> ${roundedLength.toLocaleString()} km</p>`;
      }
      if (totalArea > 0) {
        const roundedArea = Math.round(totalArea * 100) / 100;
        output += `<p><b>Total Area</b>: ${roundedArea.toLocaleString()} sqm</p>`;
      }

      answer.innerHTML = output;
    } else {
      answer.innerHTML = '';
    }
  }

  // Add custom tooltips for are and distance
  private addCustomTooltips = () => {
    const buttons = document.querySelectorAll('.mapbox-gl-draw_ctrl-draw-btn');
    buttons.forEach((button) => {
      if (button.classList.contains('mapbox-gl-draw_polygon')) {
        button.setAttribute('title', 'Measure Area');
      }
      if (button.classList.contains('mapbox-gl-draw_line')) {
        button.setAttribute('title', 'Measure Distance');
      }
    });
  };

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
    this.map.addLayer({
      id: layerID,
      type: 'fill',
      source: sourceID,
      'source-layer': sourceLayer,
      paint: {
        'fill-color': getHazardColor(hazardType, 'noah-red', hazardLevel),
        'fill-opacity': 0.75,
      },
    });
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
      this.map.addLayer({
        id: layerName,
        type: 'line',
        source: sourceID,
        'source-layer': layerName,
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
      });
    }

    if (lh2Subtype === 'df') {
      this.map.addLayer({
        id: layerName,
        type: 'fill',
        source: sourceID,
        'source-layer': layerName,
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
      });
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
        distinctUntilChanged((x, y) => x.color !== y.color)
      )
      .subscribe((level) =>
        this.map.setPaintProperty(
          layerID,
          'fill-color',
          getHazardColor(hazardType, level.color, hazardLevel)
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
        distinctUntilChanged((x, y) => x.color !== y.color)
      )
      .subscribe((level) =>
        this.map.setPaintProperty(layerName, 'fill-color', [
          'interpolate',
          ['linear'],
          ['get', 'ALLUVIAL'],
          3,
          NOAH_COLORS[level.color].high,
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
        let newOpacity = 0;
        if (hazardTypeValue.shown && hazardLevelValue.shown) {
          newOpacity = hazardLevelValue.opacity / 100;
        }

        this.map.setPaintProperty(layerID, 'fill-opacity', newOpacity);
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
        let newOpacity = 0;
        if (hazardTypeValue.shown && hazardLevelValue.shown) {
          newOpacity = hazardLevelValue.opacity / 100;
        }

        if (lh2Subtype === 'af') {
          this.map.setPaintProperty(layerName, 'line-opacity', newOpacity);
          return;
        }
        this.map.setPaintProperty(layerName, 'fill-opacity', newOpacity);
      });
  }

  private _loadCriticalFacilityIcon(name: CriticalFacility) {
    const _this = this;
    this.map.loadImage(`assets/map-sprites/${name}.png`, (error, image) => {
      if (error) throw error;
      _this.map.addImage(name, image);

      _this.map.addSource(name, {
        type: 'geojson',
        data: criticalFacilities[name].data,
        cluster: true,
        clusterMaxZoom: 12,
        clusterMinPoints: 3,
      });

      _this.map.addLayer(getCircleLayer(name));
      _this.map.addLayer(getSymbolLayer(name, this.mapStyle));
      _this.map.addLayer(getClusterTextCount(name));

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
          let newOpacity = 0;

          if (facility.shown && allShown) {
            newOpacity = facility.opacity / 100;
          }

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
