import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, { GeolocateControl, Map, Marker } from 'mapbox-gl';
import { environment } from '@env/environment';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { combineLatest, fromEvent, Subject } from 'rxjs';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  pluck,
  shareReplay,
  takeUntil,
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

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import {
  HazardLevel,
  HazardType,
  LandslideHazards,
  PH_DEFAULT_CENTER,
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

  private _unsub = new Subject();
  private _changeStyle = new Subject();

  constructor(
    private mapService: MapService,
    private pgService: NoahPlaygroundService
  ) {}

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'load')
      .pipe(takeUntil(this._unsub))
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
        this.initWeatherLayer();
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
    });
  }

  initWeatherLayer() {
    const layerID = 'himawari-satellite-image';

    this.map.addLayer({
      id: layerID,
      type: 'raster',
      source: {
        type: 'video',
        urls: [
          'https://upri-noah.s3.ap-southeast-1.amazonaws.com/himawari/ph_himawari.webm',
        ],
        coordinates: [
          [100.0, 29.25], // top-left
          [160.0, 29.25], // top-right
          [160.0, 5.0], // bottom-right
          [100.0, 5.0], // bottom-left
        ],
      },
      paint: {
        'raster-opacity': 0,
      },
    });

    combineLatest([
      this.pgService.weather$.pipe(pluck('shown'), distinctUntilChanged()),
      this.pgService.weather$.pipe(pluck('opacity'), distinctUntilChanged()),
    ])
      .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
      .subscribe(([shown, opacity]) => {
        let newOpacity = 0;
        if (shown) {
          newOpacity = opacity / 100;
          this.map.flyTo({
            center: PH_DEFAULT_CENTER,
            zoom: 4,
            essential: true,
          });
        }

        this.map.setPaintProperty(layerID, 'raster-opacity', newOpacity);
      });
  }

  showContourMaps() {
    const contourMapImages = {
      '1hr':
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/1hr_latest_rainfall_contour.png',
      '3hr':
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/3hr_latest_rainfall_contour.png',
      '6hr':
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/6hr_latest_rainfall_contour.png',
      '12hr':
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/12hr_latest_rainfall_contour.png',
      '24hr':
        'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/24hr_latest_rainfall_contour.png',
    };

    Object.keys(contourMapImages).forEach((contourType) => {
      this.map.addSource(contourType, {
        type: 'image',
        url: contourMapImages[contourType],
        coordinates: [
          [115.35, 21.55], // top-left
          [128.25, 21.55], // top-right
          [128.25, 3.85], // bottom-right
          [115.35, 3.85], // bottom-left
        ],
      });

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
      _this.map.addLayer(getSymbolLayer(name));
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
