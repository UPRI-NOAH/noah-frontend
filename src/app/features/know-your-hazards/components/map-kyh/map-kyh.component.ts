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
import { LEYTE_FLOOD } from '@shared/mocks/flood';
import { LEYTE_LANDSLIDE } from '@shared/mocks/landslide';
import { LEYTE_STORM_SURGE } from '@shared/mocks/storm-surges';
import mapboxgl, { GeolocateControl, Map, Marker } from 'mapbox-gl';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { fromEvent, Subject } from 'rxjs';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import {
  KYHPage,
  HazardType,
} from '@features/know-your-hazards/store/kyh.store';

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
        this.hideAllLayers();
        this.initHazardLayerListener();

        const page = this.kyhService.currentPage;
        this.showLayers(page);
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  initCenterListener() {
    this.kyhService.center$
      .pipe(distinctUntilChanged(), takeUntil(this._unsub))
      .subscribe((center) => {
        this.map.flyTo({
          center,
          zoom: 15,
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
    this.map.addLayer(LEYTE_FLOOD);
    this.map.addLayer(LEYTE_LANDSLIDE);
    this.map.addLayer(LEYTE_STORM_SURGE);
  }

  initHazardLayerListener() {
    this.kyhService.currentHazard$
      .pipe(takeUntil(this._unsub))
      .subscribe((page) => {
        this.showLayers(page);
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
    });
  }

  initMarkers() {
    this.centerMarker = new mapboxgl.Marker({ color: '#333' })
      .setLngLat(this.kyhService.currentCoords)
      .addTo(this.map);

    this.kyhService.currentCoords$
      .pipe(takeUntil(this._unsub))
      .subscribe((currentCoords) => {
        this.centerMarker.setLngLat(currentCoords);
      });

    const _this = this;
    this.map.loadImage('assets/map-sprites/hospital.png', (error, image) => {
      if (error) throw error;
      _this.map.addImage('icon-hospital', image);
      _this.map.addLayer(LEYTE_HOSPITALS);
    });

    this.map.loadImage(
      'assets/map-sprites/fire-station.png',
      (error, image) => {
        if (error) throw error;
        _this.map.addImage('icon-firestation', image);
        _this.map.addLayer(LEYTE_FIRESTATIONS);
      }
    );

    this.map.loadImage(
      'assets/map-sprites/police-station.png',
      (error, image) => {
        if (error) throw error;
        _this.map.addImage('icon-policestation', image);
        _this.map.addLayer(LEYTE_POLICESTATIONS);
      }
    );

    this.map.loadImage('assets/map-sprites/school.png', (error, image) => {
      if (error) throw error;
      _this.map.addImage('icon-school', image);
      _this.map.addLayer(LEYTE_SCHOOLS);
    });
  }

  hideAllLayers() {
    this.kyhService.hazardTypes.forEach((hazard) => {
      this.map.setLayoutProperty(hazard, 'visibility', 'none');
    });
  }

  showAllLayers() {
    this.kyhService.hazardTypes.forEach((hazard) => {
      this.map.setLayoutProperty(hazard, 'visibility', 'visible');
    });
  }

  showCurrentHazardLayer(currentHazard: HazardType) {
    if (!this.kyhService.isHazardLayer(currentHazard)) return;

    this.map.setLayoutProperty(currentHazard, 'visibility', 'visible');
  }

  showLayers(page: KYHPage) {
    if (page === 'know-your-hazards') {
      this.showAllLayers();
      return;
    }

    this.hideAllLayers();
    this.showCurrentHazardLayer(page as HazardType);
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
    }
  }
}
