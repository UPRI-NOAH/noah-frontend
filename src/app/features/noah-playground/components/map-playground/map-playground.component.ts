import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, {
  AnySourceData,
  GeolocateControl,
  Map,
  Marker,
} from 'mapbox-gl';
import { MapboxCircle } from 'mapbox-gl-circle';
import { environment } from '@env/environment';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { combineLatest, fromEvent, Subject } from 'rxjs';
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
import { SENSOR_COLORS } from '@shared/mocks/noah-colors';
import * as Highcharts from 'highcharts';
import { SensorChartService } from '@features/noah-playground/services/sensor-chart.service';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import {
  ContourMapType,
  HazardLevel,
  HazardType,
  LandslideHazards,
  PH_DEFAULT_CENTER,
  WeatherSatelliteState,
  WeatherSatelliteType,
  WeatherSatelliteTypeState,
  WEATHER_SATELLITE_ARR,
} from '@features/noah-playground/store/noah-playground.store';
import { NOAH_COLORS } from '@shared/mocks/noah-colors';

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

// hazardOpacity$: Observable<number>;
// hazardShown$: Observable<boolean>;

@Component({
  selector: 'noah-map-playground',
  templateUrl: './map-playground.component.html',
  styleUrls: ['./map-playground.component.scss'],
})
export class MapPlaygroundComponent implements OnInit, OnDestroy {
  map!: Map;
  geolocateControl!: GeolocateControl;
  centerMarker!: Marker;
  pgLocation: string = '';
  mapStyle: MapStyle = 'terrain';
  isMapboxAttrib;

  private _graphShown = false;
  private _unsub = new Subject();
  private _changeStyle = new Subject();

  constructor(
    private mapService: MapService,
    private pgService: NoahPlaygroundService,
    private sensorChartService: SensorChartService,
    private sensorService: SensorService
  ) {}

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'style.load')
      .pipe(first(), takeUntil(this._unsub))
      .subscribe(() => {
        this.addNavigationControls();
        this.addGeolocationControls();
        this.initCenterListener();
        this.initGeolocationListener();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.addExaggerationControl();
        this.addCriticalFacilityLayers();
        this.initHazardLayers();
        this.initSensors();
        this.initWeatherSatelliteLayers();
        this.initTyphoonTrackLayers();
        this.showContourMaps();
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
    this._changeStyle.next();
    this._changeStyle.complete();
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
          zoom: 13,
          essential: true,
        });

        if (!this.centerMarker) {
          this.centerMarker = new mapboxgl.Marker({ color: '#333' })
            .setLngLat(center)
            .addTo(this.map);
        }

        this.centerMarker.setLngLat(center);
      });
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

  initSensors() {
    SENSORS.forEach((sensorType) => {
      this.sensorService
        .getSensors(sensorType)
        .pipe(first())
        .toPromise()
        .then((data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) => {
          // add layer to map
          this.map.addLayer({
            id: sensorType,
            type: 'circle',
            source: {
              type: 'geojson',
              data,
            },
            paint: {
              'circle-color': SENSOR_COLORS[sensorType],
              'circle-radius': 5,
              'circle-opacity': 0,
            },
          });

          // add show/hide listeners
          combineLatest([
            this.pgService.sensorsGroupShown$,
            this.pgService.getSensorTypeShown$(sensorType),
          ])
            .pipe(takeUntil(this._changeStyle), takeUntil(this._unsub))
            .subscribe(([groupShown, soloShown]) => {
              this.map.setPaintProperty(
                sensorType,
                'circle-opacity',
                +(groupShown && soloShown)
              );
            });

          this.pgService.setSensorTypeFetched(sensorType, true);
          // show mouse event listeners
          this.showDataPoints(sensorType);
        })
        .catch(() =>
          console.error(
            `Unable to fetch data from DOST for sensors of type "${sensorType}"`
          )
        );
    });
  }

  showDataPoints(sensorType: SensorType) {
    const graphDiv = document.getElementById('graph-dom');
    const popUp = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
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
            const dateInstalled = e.features[0].properties.date_installed;
            const province = e.features[0].properties.province;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            _this.map.getCanvas().style.cursor = 'pointer';
            popUp
              .setLngLat(coordinates)
              .setHTML(
                `
              <div style="color: #333333;">
                <div><strong>#${stationID} - ${location}</strong></div>
                <div>Type: ${typeName}</div>
                <div>Status: ${status}</div>
                <div>Date Installed: ${dateInstalled}</div>
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
              zoom: 11,
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
    });

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
      zoom: 5,
      touchZoomRotate: true,
      center: PH_DEFAULT_CENTER,
      attributionControl: false,
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

    const getWeatherSatelliteSource = (weatherSatelliteDetails: {
      url: string;
      type: string;
    }): AnySourceData => {
      switch (weatherSatelliteDetails.type) {
        case 'video':
          return {
            type: 'video',
            urls: [weatherSatelliteDetails.url],
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
        this.map.addSource(
          weatherType,
          getWeatherSatelliteSource(weatherSatelliteDetails)
        );

        // 2. Add layer per weather satellite source
        this.map.addLayer({
          id: weatherType,
          type: 'raster',
          source: weatherType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0,
          },
        });

        // 3. Check for group and individual visibility and opacity
        const allShown$ = this.pgService.weatherSatellitesShown$.pipe(
          distinctUntilChanged(),
          tap(() => {
            this.map.flyTo({
              center: PH_DEFAULT_CENTER,
              zoom: 4,
              essential: true,
            });
          }),
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

        combineLatest([allShown$, selectedWeather$, weatherTypeOpacity$])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(([allShown, selectedWeather, weatherTypeOpacity]) => {
            let opacity = +(allShown && selectedWeather === weatherType);
            if (opacity) {
              opacity = weatherTypeOpacity / 100;
            }

            this.map.setPaintProperty(weatherType, 'raster-opacity', opacity);
          });
      }
    );
  }

  initTyphoonTrackLayers() {
    this.map.loadImage('assets/icons/typhoon.png', (error, image) => {
      if (error) throw error;
      this.map.addImage('custom-marker', image);
    });
    this.map.addSource('typhoonTrack', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/typhoon_track/typhoon.geojson',
    });
    this.map.addSource('PAR', {
      type: 'geojson',
      data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/par/PAR.geojson',
    });

    // Add point layer
    this.map.addLayer({
      id: 'typhoon-track-icon',
      type: 'symbol',
      source: 'typhoonTrack',
      layout: {
        'icon-image': 'custom-marker',
        'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.03],
      },
    });
    // Add line layer
    this.map.addLayer({
      id: 'typhoon-track-line',
      type: 'line',
      source: 'typhoonTrack',
      paint: {
        'line-color': '#bdd9f1',
        'line-width': 1.5,
        'line-dasharray': [2, 1],
      },
      filter: ['==', 'name', 'typhoon-track'],
    });
    // Add PAR layer
    this.map.addLayer({
      id: 'par',
      type: 'line',
      source: 'PAR',
      paint: {
        'line-color': 'white',
        'line-width': 2,
      },
    });

    // Add probability radius per point
    // for (const feature of typhoonTrack.features) {
    //   const rad = feature.properties.radius
    //   console.log(rad);
    //   let myCircle = new MapboxCircle({lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0]}, 300, {
    //     editable: false,
    //     fillColor: '#29AB87'
    // }).addTo(map).setRadius(rad); //
    // };

    this.pgService.typhoonTrack$
      .pipe(pluck('opacity'), distinctUntilChanged())
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe((opacity) => {
        this.map.setPaintProperty(
          'typhoon-track-icon',
          'icon-opacity',
          opacity / 100
        );
        this.map.setPaintProperty(
          'typhoon-track-line',
          'line-opacity',
          opacity / 100
        );
      });

    this.pgService.typhoonTrack$
      .pipe(
        distinctUntilChanged((prev, next) => prev.shown === next.shown),
        takeUntil(this._unsub),
        takeUntil(this._changeStyle)
      )
      .subscribe((typhoonTrack) => {
        let newOpacity = 0;
        if (typhoonTrack.shown) {
          newOpacity = typhoonTrack.opacity / 100;
          this.map.flyTo({
            center: PH_DEFAULT_CENTER,
            zoom: 4,
            essential: true,
          });
        }
        this.map.setPaintProperty(
          'typhoon-track-icon',
          'icon-opacity',
          newOpacity
        );
        this.map.setPaintProperty(
          'typhoon-track-line',
          'line-opacity',
          newOpacity
        );
        this.map.setPaintProperty('par', 'line-opacity', newOpacity);
      });
  }

  showContourMaps() {
    const contourMapImages = {
      '1hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/1hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '3hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/3hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '6hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/6hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '12hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/12hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '24hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/24hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '24hr-lapse': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/ph_contour.webm',
        type: 'video',
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

      this.map.addSource(contourType, getContourMapSource(contourMapDetails));

      this.map.addLayer({
        id: contourType,
        type: 'raster',
        source: contourType,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': 0,
        },
      });

      combineLatest([
        this.pgService.contourMapGroupShown$.pipe(distinctUntilChanged()),
        this.pgService.selectedContourMap$.pipe(distinctUntilChanged()),
      ])
        .pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          map(([groupShown, selectedContourMap]) => {
            return +(groupShown && selectedContourMap === contourType);
          })
        )
        .subscribe((opacity: number) => {
          this.map.setPaintProperty(contourType, 'raster-opacity', opacity);
        });
    });
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
      this._changeStyle.next();
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
