import { Component, Input, OnInit, NgZone } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import mapboxgl, { GeolocateControl, Map, Marker } from 'mapbox-gl';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { fromEvent, Subject } from 'rxjs';
import {
  hasStandardBasemap,
  NOAH_HAZARD_SLOT,
  NOAH_OVERLAY_SLOT,
  StandardSlot,
  withStandardLightingNoop,
} from '@core/services/standard-style';

import PH_COMBO_LAYERS from '@shared/data/kyh_combined_tileset.json';

import {
  HazardType,
  MapStyle,
} from '@features/know-your-hazards/store/kyh.store';
import { Observable } from 'rxjs';
import { getHazardColor } from '@shared/mocks/flood';
import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { NOAH_COLORS } from '@shared/mocks/noah-colors';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
  standalone: false,
  selector: 'noah-map-kyh',
  templateUrl: './map-kyh.component.html',
  styleUrls: ['./map-kyh.component.scss'],
})
export class MapKyhComponent implements OnInit {
  map!: Map;
  geolocateControl!: GeolocateControl;
  //centerMarker!: Marker;
  mapStyle: MapStyle = 'standard';
  currentLocation$: Observable<string>;

  /**
   * How far above the bottom edge of the map the shared attribution sits.
   *
   * The page raises the credits when the sidebar panel covers the bottom of
   * the map on a phone.
   */
  @Input() attributionBottomOffset: number | null = null;

  kyhLegend: boolean = true;
  btnLegend: boolean = false;

  private _unsub = new Subject();
  private _changeStyle = new Subject();
  private centerMarker: mapboxgl.Marker | null = null;
  private readonly terrainSourceId = 'noah-terrain-dem';
  private readonly defaultTerrainExaggeration = 1.8;
  constructor(
    private gaService: GoogleAnalyticsService,
    private mapService: MapService,
    private kyhService: KyhService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initGeocoder();
        this.initGeolocation();
        this.initCenterListener();
        this.initGeolocationListener();
        this.iniScaleControl();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        // No-op for the legacy terrain / satellite basemaps, but this map can be
        // switched to a Mapbox Standard style, so configure it whenever the
        // loaded style actually is Standard.
        this.mapService.applyStandardConfig(this.map);
        this.applyDefaultTerrain();
        this.initLayers();
        this.initMarkers();
      });
  }

  ngOnDestroy(): void {
    this._unsub.next(null);
    this._unsub.complete();
    // Stop tracking the map so it is not re-lit after it is discarded.
    this.mapService.releaseMap(this.map);
  }

  selectPlace(selectedPlace) {
    this.kyhService.setCurrentLocation(
      selectedPlace.text ||
        selectedPlace.place_name ||
        selectedPlace.properties?.name || // display on search results
        selectedPlace.properties?.full_address
    );

    // Handle both Geocoding API (.center) and Searchbox API (.geometry.coordinates)
    const coords = selectedPlace.center || selectedPlace.geometry?.coordinates;

    if (!coords) {
      console.error('No coordinates found in selected place:', selectedPlace);
      return;
    }

    const [lng, lat] = coords;
    this.kyhService.setCenter({ lat, lng });
    this.kyhService.setCurrentCoords({ lat, lng });
  }

  initCenterListener() {
    this.kyhService.currentCoords$
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((center) => {
        this.map.flyTo({
          center,
          zoom: 17,
          essential: true,
        });
      });
  }

  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: {
        color: 'orange',
      },
      flyTo: {
        padding: 15, // If you want some minimum space around your result
        easing: function (t) {
          return t;
        },
        maxZoom: 13, // If you want your result not to go further than a specific zoom
      },
    });
    geocoder.on('result', (e) => {
      this.kyhService.setCurrentLocation(e.result['place_name']);
      console.log(e.result);
    });
  }

  /**
   * Adds the geolocation control.
   *
   * The control's own button is hidden (`showButton: false`); the locate
   * action lives in the NOAH map controls toolbar, which triggers the control
   * programmatically.
   */
  initGeolocation() {
    this.geolocateControl = this.mapService.getNewGeolocateControl();
    this.map.addControl(this.geolocateControl, 'top-right');
  }

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
        _this.kyhService.setCurrentLocation(myPlace);
      } catch (error) {
        // temporary
        alert(
          'Unable to retrieve your location, please manually input your city / brgy'
        );
      }
    }
  }

  initLayers() {
    PH_COMBO_LAYERS.forEach((tileset) => {
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

      tileset.sourceLayer.forEach((layerName: string) => {
        if (hazardLevel === 'debris-flow') {
          const [rawHazardType, lh2Subtype] = [
            ...layerName.toLowerCase().split('_').splice(1),
          ];
          if (lh2Subtype === 'af') {
            this.addNoahLayer(
              {
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
        } else {
          this.addNoahLayer(
            {
              id: layerName,
              type: 'fill',
              source: sourceID,
              'source-layer': layerName,
              paint: {
                'fill-color': getHazardColor(
                  hazardType,
                  'noah-red',
                  hazardLevel
                ),
                'fill-opacity': 0.75,
              },
            },
            NOAH_HAZARD_SLOT
          );
        }

        // add visibility watcher
        this.kyhService
          .isHazardShown$(hazardType)
          .pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            distinctUntilChanged()
          )
          .subscribe((shown: boolean) => {
            const visibility = shown ? 'visible' : 'none';
            if (!this.map.getLayer(layerName)) return;
            this.map.setLayoutProperty(layerName, 'visibility', visibility);
          });
      });
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
   * Adds a NOAH layer, skipping it when it already exists, and placing it in
   * the Standard `top` slot by default so overlays keep the visual position
   * they had when appended to a classic style's layer array.
   *
   * Inside a Standard basemap the layer is also opted out of Standard's
   * `light-3d` lighting (see `withStandardLightingNoop`), so hazard colours
   * stay identical in every dawn / day / dusk / night preset — exactly as they
   * do in the playground.
   */
  private addNoahLayer(
    layer: mapboxgl.AnyLayer,
    slot: StandardSlot = NOAH_OVERLAY_SLOT
  ) {
    if (this.map.getLayer(layer.id)) {
      return;
    }

    if (this.isStandardBasemap) {
      this.map.addLayer({
        ...layer,
        slot,
        paint: withStandardLightingNoop(layer),
      } as mapboxgl.AnyLayer);
      return;
    }

    this.map.addLayer(layer);
  }

  private addNoahSource(sourceId: string, source: mapboxgl.AnySourceData) {
    if (this.map.getSource(sourceId)) {
      return;
    }
    this.map.addSource(sourceId, source);
  }

  /**
   * Applies the default 3D terrain and exaggeration, matching the playground.
   *
   * `setTerrain` is wiped by `setStyle`, so this is called from the
   * `style.load` handler and therefore re-runs after every basemap switch.
   */
  private applyDefaultTerrain() {
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
        exaggeration: this.defaultTerrainExaggeration,
      });
    } catch (error) {
      console.warn('Unable to apply the default terrain exaggeration', error);
    }
  }

  initMap() {
    this.currentLocation$ = this.kyhService.currentLocation$;
    this.mapService.init();
    this.map = new mapboxgl.Map({
      // Shared cache / rendering-behaviour tuning for every NOAH map.
      ...this.mapService.getMapPerformanceOptions(),
      container: 'map-kyh',
      style: environment.mapbox.styles[this.mapStyle],
      zoom: 13,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: this.kyhService.currentCoords,
      attributionControl: false,
      antialias: false,
    });
  }

  async initMarkers() {
    this.centerMarker = new mapboxgl.Marker({
      color: '#4D4C51',
      draggable: true,
    })
      .setLngLat(this.kyhService.currentCoords)
      .addTo(this.map);

    this.kyhService.center$
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((currentCoords) => {
        this.centerMarker.setLngLat(currentCoords);
      });

    //start draggable marker
    this.centerMarker.on('dragend', async () => {
      const coords = document.getElementById('coordinates');
      const lngLat = this.centerMarker.getLngLat();
      coords.style.display = 'block';
      coords.innerHTML = `Lon: ${lngLat.lng.toFixed(
        5
      )}<br />Lat: ${lngLat.lat.toFixed(5)}`;
      await this.mapService.dragReverseGeocode(lngLat.lat, lngLat.lng);
      // Fly to the new center with a smooth animation
      this.map.flyTo({
        center: lngLat,
        zoom: 17,
        speed: 1.2,
        curve: 1,
        easing: (t) => t,
        essential: true,
      });
      const dragAddress = await this.mapService.dragReverseGeocode(
        lngLat.lat,
        lngLat.lng
      );

      this.kyhService.setCenter(lngLat);
      this.kyhService.setCurrentLocation(dragAddress); // update current location
    });

    function addImages(map, images) {
      const addImage = (map, id, url) => {
        return new Promise((resolve, reject) => {
          map.loadImage(url, (error, image) => {
            if (error) {
              reject(error);
              return;
            }
            // initMarkers runs again after every style change; Mapbox GL JS
            // throws if an image id is registered twice.
            if (!map.hasImage(id)) {
              map.addImage(id, image);
            }
            resolve(image);
          });
        });
      };
      const promises = images.map((imageData) =>
        addImage(map, imageData.id, imageData.url)
      );
      return Promise.all(promises);
    }

    await addImages(this.map, [
      { url: 'assets/map-sprites/hospital.png', id: 'hospital' },
      { url: 'assets/map-sprites/fire-station.png', id: 'fire_station' },
      { url: 'assets/map-sprites/police-station.png', id: 'police' },
      { url: 'assets/map-sprites/school.png', id: 'school' },
    ]);

    this.kyhService.criticalFacilities$
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((criticalFacilities) => {
        const criticalFacilitiesLayer = this.map.getLayer('criticalFacilities');
        if (criticalFacilitiesLayer) {
          this.map.removeLayer('criticalFacilities');
          if (this.map.getSource('cfSource')) {
            this.map.removeSource('cfSource');
          }
        }

        this.addNoahSource('cfSource', {
          type: 'geojson',
          data: criticalFacilities,
        });

        this.addNoahLayer({
          id: 'criticalFacilities',
          type: 'symbol',
          source: 'cfSource',
          paint: {
            'icon-opacity': 1,
            'icon-halo-color':
              this.mapStyle === 'terrain'
                ? 'rgba(255, 255, 255, 1)'
                : 'rgba(0, 0, 0, 1)',
            'icon-halo-width': 0.5,
            'icon-halo-blur': 0.5,
            'text-opacity': 1,
            'text-color': this.mapStyle === 'terrain' ? '#333333' : '#ffffff',
            'text-halo-color':
              this.mapStyle === 'terrain'
                ? 'rgba(255, 255, 255, 1)'
                : 'rgba(0, 0, 0, 1)',
            'text-halo-width': 0.5,
            'text-halo-blur': 0.5,
          },
          layout: {
            'icon-image': ['get', 'amenity'],
            'text-anchor': 'top',
            'text-field': ['get', 'name'],
            'text-offset': [0, 2],
            'text-size': 12,
            'text-letter-spacing': 0.08,
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'icon-allow-overlap': true,
            'text-allow-overlap': true,
          },
        });
      });
  }

  iniScaleControl() {
    this.attachCoordsToMap();
    this.mapService.attachScaleControl(this.map, 'bottom-right');
  }

  /**
   * Moves the coordinate readout into the map container.
   *
   * The readout is stacked on top of the scale bar, and both follow the map
   * credits in the bottom-right corner. The credits publish their geometry on
   * the map container, so the readout lives there as well to read the same
   * CSS variables.
   */
  private attachCoordsToMap() {
    const coords = document.getElementById('coordinates');
    const container = this.map?.getContainer();

    if (!coords || !container || coords.parentElement === container) {
      return;
    }

    container.appendChild(coords);
  }

  openLegend() {
    this.btnLegend = !this.btnLegend;
    this.kyhLegend = !this.kyhLegend;
  }

  showCurrentHazardLayer(currentHazard: HazardType) {
    if (!this.kyhService.isHazardLayer(currentHazard)) return;

    this.map.setLayoutProperty(currentHazard, 'visibility', 'visible');
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.gaService.event('switch_map_style', 'know_your_hazards', style);
      this.mapStyle = style;
      const currentCenter = this.map.getCenter();
      const currentZoom = this.map.getZoom();
      const currentBearing = this.map.getBearing();
      const currentPitch = this.map.getPitch();
      this.map.setStyle(environment.mapbox.styles[style]);
      this.map.once('style.load', () => {
        if (currentCenter) {
          this.map.setCenter(currentCenter);
          this.map.setZoom(currentZoom);
          this.map.setBearing(currentBearing);
          this.map.setPitch(currentPitch);
        }
      });
      this._changeStyle.next(null);
    }
    if (this.centerMarker) {
      this.centerMarker.remove();
      this.centerMarker = null; // Reset the marker
    }
  }
}

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

function handleLandslideLevel(level: RawLandslideHazards): string {
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
