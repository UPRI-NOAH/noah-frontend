import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { KyhService } from '@features/know-your-hazards/services/kyh.service';
import {
  LEYTE_FIRESTATIONS,
  LEYTE_HOSPITALS,
  LEYTE_POLICESTATIONS,
  LEYTE_SCHOOLS,
} from '@shared/mocks/critical-facilities';
import mapboxgl, { GeolocateControl, Map, Marker } from 'mapbox-gl';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil,
} from 'rxjs/operators';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { fromEvent, Subject } from 'rxjs';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import PH_COMBO_LAYERS from '@shared/data/kyh_combined_tileset.json';

import {
  KYHPage,
  HazardType,
} from '@features/know-your-hazards/store/kyh.store';
import { getHazardColor } from '@shared/mocks/flood';
import { HazardLevel } from '@features/noah-playground/store/noah-playground.store';
import { NOAH_COLORS } from '@shared/mocks/noah-colors';

type MapStyle = 'terrain' | 'satellite';

@Component({
  selector: 'noah-map-kyh',
  templateUrl: './map-kyh.component.html',
  styleUrls: ['./map-kyh.component.scss'],
})
export class MapKyhComponent implements OnInit {
  map!: Map;
  geolocateControl!: GeolocateControl;
  centerMarker!: Marker;
  mapStyle: MapStyle = 'terrain';
  isMapboxAttrib;
  isOpenedList;
  private _unsub = new Subject();

  constructor(private mapService: MapService, private kyhService: KyhService) {}

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initGeocoder();
        this.initGeolocation();
        this.initCenterListener();
        this.initGeolocationListener();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initLayers();
        this.initMarkers();
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
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
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    geocoder.on('result', (e) => {
      this.kyhService.setCurrentLocation(e.result['place_name']);
      console.log(e.result);
    });
  }

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

      tileset.sourceLayer.forEach((layerName: string) => {
        if (hazardLevel === 'debris-flow') {
          const [rawHazardType, lh2Subtype] = [
            ...layerName.toLowerCase().split('_').splice(1),
          ];
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
        } else {
          this.map.addLayer({
            id: layerName,
            type: 'fill',
            source: sourceID,
            'source-layer': layerName,
            paint: {
              'fill-color': getHazardColor(hazardType, 'noah-red', hazardLevel),
              'fill-opacity': 0.75,
            },
          });
        }

        // add visibility watcher
        this.kyhService
          .isHazardShown$(hazardType)
          .pipe(
            takeUntil(this._unsub),
            // takeUntil(this._changeStyle),
            distinctUntilChanged()
          )
          .subscribe((shown: boolean) => {
            const visibility = shown ? 'visible' : 'none';
            this.map.setLayoutProperty(layerName, 'visibility', visibility);
          });
      });
    });
  }

  initMap() {
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'map-kyh',
      style: environment.mapbox.styles[this.mapStyle],
      zoom: 13,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: this.kyhService.currentCoords,
      attributionControl: false,
    });
  }

  async initMarkers() {
    this.centerMarker = new mapboxgl.Marker({ color: '#333' })
      .setLngLat(this.kyhService.currentCoords)
      .addTo(this.map);

    this.kyhService.center$
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((currentCoords) => {
        this.centerMarker.setLngLat(currentCoords);
      });

    function addImages(map, images) {
      const addImage = (map, id, url) => {
        return new Promise((resolve, reject) => {
          map.loadImage(url, (error, image) => {
            if (error) {
              reject(error);
              return;
            }
            map.addImage(id, image);
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
          this.map.removeSource('cfSource');
        }

        this.map.addSource('cfSource', {
          type: 'geojson',
          data: criticalFacilities,
        });

        this.map.addLayer({
          id: 'criticalFacilities',
          type: 'symbol',
          source: 'cfSource',
          layout: {
            'icon-image': ['get', 'amenity'],
            'text-anchor': 'top',
            'text-field': ['get', 'name'],
            'text-offset': [0, 2],
            'text-size': 10,
          },
        });
      });
  }

  showCurrentHazardLayer(currentHazard: HazardType) {
    if (!this.kyhService.isHazardLayer(currentHazard)) return;

    this.map.setLayoutProperty(currentHazard, 'visibility', 'visible');
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
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
