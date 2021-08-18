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
  map,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { getHazardColor, getHazardLayer } from '@shared/mocks/flood';
import {
  CriticalFacility,
  CRITICAL_FACILITIES_ARR,
  getSymbolLayer,
} from '@shared/mocks/critical-facilities';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

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
        this.initCenterListener();
        this.initGeolocationListener();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initMarkers();
        this.addExaggerationControl();
        this.addCriticalFacilityLayers();
        this.initHazardLayers();
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

  initHazardLayers() {
    // Loop through all the hazard types (floods, landslides, storm surges)
    HAZARDS.forEach((h) => {
      // Loop through all the hazard levels (flood: 5-year, 25-year, 100-year, etc)
      h.levels.forEach((hl) => {
        // Loop through each of the hazard layers for each hazard level
        hl.layers.forEach((l) => {
          this.map.addLayer(
            getHazardLayer(l.sourceLayer, l.url, l.sourceLayer, h.type)
          );

          // Watch changes in opacity
          this.pgService
            .getHazardLevel$(h.type, hl.id)
            .pipe(
              takeUntil(this._unsub),
              takeUntil(this._changeStyle),
              distinctUntilChanged((x, y) => x.opacity !== y.opacity)
            )
            .subscribe((level) =>
              this.map.setPaintProperty(
                l.sourceLayer,
                'fill-opacity',
                level.opacity / 100
              )
            );

          // Watch changes in visibility
          const hazardType$ = this.pgService.getHazard$(h.type).pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            distinctUntilChanged((x, y) => x.shown === y.shown)
          );

          const hazardLevel$ = this.pgService
            .getHazardLevel$(h.type, hl.id)
            .pipe(
              takeUntil(this._unsub),
              takeUntil(this._changeStyle),
              distinctUntilChanged((x, y) => x.shown !== y.shown)
            );

          combineLatest([hazardType$, hazardLevel$])
            .pipe(
              tap(([hazardType, hazardLevel]) => {
                if (h.type === 'flood' && !environment.production) {
                  console.log(
                    'hazardTypeShown',
                    hazardType.shown,
                    'hazardLevelShown',
                    hazardLevel.shown,
                    h.name,
                    hl.name
                  );
                }
              })
            )
            .subscribe(([hazardType, hazardLevel]) => {
              if (hazardType.shown && hazardLevel.shown) {
                this.map.setPaintProperty(
                  l.sourceLayer,
                  'fill-opacity',
                  hazardLevel.opacity / 100
                );
                return;
              }

              this.map.setPaintProperty(l.sourceLayer, 'fill-opacity', 0);
            });

          // Watch changes in color
          this.pgService
            .getHazardLevel$(h.type, hl.id)
            .pipe(
              takeUntil(this._unsub),
              takeUntil(this._changeStyle),
              distinctUntilChanged((x, y) => x.color !== y.color)
            )
            .subscribe((level) =>
              this.map.setPaintProperty(
                l.sourceLayer,
                'fill-color',
                getHazardColor(h.type, level.color, l.sourceLayer) // TO DO: Handle l.sourceLayer properly
              )
            );
        });
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
      _this.map.addLayer(getSymbolLayer(name));

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
            name,
            'icon-opacity',
            facility.opacity / 100
          );
          this.map.setPaintProperty(
            name,
            'text-opacity',
            facility.opacity / 100
          );
        });

      // shown
      const allShown$ = this.pgService.criticalFacilitiesShown$.pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged()
      );

      const facility$ = this.pgService.getCriticalFacility$(name).pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged((x, y) => x.shown !== y.shown)
      );

      combineLatest([allShown$, facility$]).subscribe(
        ([allShown, facility]) => {
          if (facility.shown && allShown) {
            this.map.setPaintProperty(
              name,
              'icon-opacity',
              facility.opacity / 100
            );
            this.map.setPaintProperty(
              name,
              'text-opacity',
              facility.opacity / 100
            );
            return;
          }

          this.map.setPaintProperty(name, 'icon-opacity', 0);
          this.map.setPaintProperty(name, 'text-opacity', 0);
        }
      );
    });
  }
}
