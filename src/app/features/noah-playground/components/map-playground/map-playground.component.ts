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
} from '@features/noah-playground/store/noah-playground.store';
type MapStyle = 'terrain' | 'satellite';

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
        // this.initCenterListener();
        this.initGeolocationListener();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initMarkers();
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
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((center) => {
        this.map.flyTo({
          center,
          zoom: 13,
          essential: true,
        });
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

    // const criticalFacilities = [
    //   {
    //     sourceName: 'schools',
    //     layerName: 'schools_layer',
    //     data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/schools.geojson',
    //     color: '#EB5757',
    //   },
    //   {
    //     sourceName: 'police_station',
    //     layerName: 'police_station_layer',

    //     data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/police_station.geojson',
    //     color: '#C21D7D',
    //   },
    //   {
    //     sourceName: 'hospitals',
    //     layerName: 'hospitals_layer',
    //     data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/hospitals.geojson',
    //     color: '#804B9B',
    //   },
    //   {
    //     sourceName: 'fire_station',
    //     layerName: 'fire_station_layer',
    //     data: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/critical_facilities/fire_station.geojson',
    //     color: '#2B75B2',
    //   },
    // ];

    // criticalFacilities.forEach((criticalFacilityObj) => {
    //   this.map.addLayer({
    //     id: criticalFacilityObj.layerName,
    //     type: 'circle',
    //     source: {
    //       type: 'geojson',
    //       data: criticalFacilityObj.data,
    //     },
    //     paint: {
    //       'circle-radius': [
    //         'step',
    //         ['get', 'point_count'],
    //         20,
    //         100,
    //         30,
    //         750,
    //         40,
    //       ],
    //       'circle-stroke-width': 1,
    //       'circle-color': criticalFacilityObj.color,
    //       'circle-stroke-color': 'white',
    //     },
    //   });
    // });
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
    const phComboLayers = await this.pgService.getHazardData();
    phComboLayers.forEach((comboLayerObj) => {
      const sourceID = comboLayerObj.url.replace('mapbox://upri-noah.', '');
      const sourceData = {
        type: 'vector',
        url: comboLayerObj.url,
      } as mapboxgl.AnySourceData;
      this.map.addSource(sourceID, sourceData);

      comboLayerObj.sourceLayer.forEach((sourceLayer) => {
        const [rawHazardType, rawHazardLevel] = [
          ...sourceLayer.toLowerCase().split('_').splice(1),
        ];

        const hazardTypes = {
          fh: 'flood',
          lh: 'landslide',
          ssh: 'storm-surge',
        };

        const getHazardLevel = (
          type: HazardType,
          level: string
        ): HazardLevel => {
          if (type === 'flood') {
            const strippedLevel = level.replace('yr', '');
            return `flood-return-period-${strippedLevel}` as HazardLevel;
          }

          if (type === 'storm-surge') {
            const strippedLevel = level.replace('ssa', '');
            return `storm-surge-advisory-${strippedLevel}` as HazardLevel;
          }

          if (type === 'landslide') {
            // We currently have only one shown
            return 'landslide-hazard';
          }

          throw Error('hazard level not found');
        };

        const hazardType = hazardTypes[rawHazardType];
        const hazardLevel = getHazardLevel(hazardType, rawHazardLevel);

        // const layerID = `${sourceID}_${hazardType}_${hazardLevel}`;
        const layerID = sourceLayer;
        this.map.addLayer({
          id: layerID,
          type: 'fill',
          source: sourceID,
          'source-layer': sourceLayer,
          paint: {
            'fill-color': getHazardColor(hazardType, 'noah-red', hazardType),
            'fill-opacity': 0.75,
          },
        });

        // OPACITY
        this.pgService
          .getHazardLevel$(hazardType, hazardLevel)
          .pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            filter((level) => !!level),
            distinctUntilChanged((x, y) => x.opacity !== y.opacity)
          )
          .subscribe((level) =>
            this.map.setPaintProperty(
              layerID,
              'fill-opacity',
              level.opacity / 100
            )
          );

        // VISIBILITY
        const hazardType$ = this.pgService.getHazard$(hazardType).pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.shown === y.shown)
        );

        const hazardLevel$ = this.pgService
          .getHazardLevel$(hazardType, hazardLevel)
          .pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            distinctUntilChanged((x, y) => x.shown !== y.shown)
          );

        combineLatest([hazardType$, hazardLevel$])
          .pipe(
            filter(
              ([hazardTypeValue, hazardLevelValue]) =>
                !!hazardTypeValue && !!hazardLevelValue
            )
          )
          .subscribe(([hazardTypeValue, hazardLevelValue]) => {
            if (hazardTypeValue.shown && hazardLevelValue.shown) {
              this.map.setPaintProperty(
                layerID,
                'fill-opacity',
                hazardLevelValue.opacity / 100
              );
              return;
            }

            this.map.setPaintProperty(layerID, 'fill-opacity', 0);
          });

        // COLOR
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
              getHazardColor(hazardType, level.color, layerID)
            )
          );
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
      center: this.pgService.currentCoords,
    });
  }

  initMarkers() {
    this.centerMarker = new mapboxgl.Marker({ color: '#333' })
      .setLngLat(this.pgService.currentCoords)
      .addTo(this.map);

    this.pgService.currentCoords$
      .pipe(takeUntil(this._unsub))
      .subscribe((currentCoords) => {
        this.centerMarker.setLngLat(currentCoords);
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

    this.pgService.weather$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged()
      )
      .subscribe((weather) => {
        if (weather.shown) {
          this.map.setPaintProperty(
            layerID,
            'raster-opacity',
            weather.opacity / 100
          );
          return;
        }

        this.map.setPaintProperty(layerID, 'raster-opacity', 0);
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
          this.map.setPaintProperty(
            `${name}-image`,
            'icon-opacity',
            facility.opacity / 100
          );

          this.map.setPaintProperty(
            `${name}-image`,
            'text-opacity',
            facility.opacity / 100
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
          if (facility.shown && allShown) {
            this.map.setPaintProperty(
              `${name}-image`,
              'icon-opacity',
              facility.opacity / 100
            );
            this.map.setPaintProperty(
              `${name}-image`,
              'text-opacity',
              facility.opacity / 100
            );
            return;
          }

          this.map.setPaintProperty(`${name}-image`, 'icon-opacity', 0);
          this.map.setPaintProperty(`${name}-image`, 'text-opacity', 0);
        });
    });
  }
}
