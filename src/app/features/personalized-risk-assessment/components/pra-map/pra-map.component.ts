import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import {
  LEYTE_FIRESTATIONS,
  LEYTE_HOSPITALS,
  LEYTE_POLICESTATIONS,
  LEYTE_SCHOOLS,
  MARKERS,
} from '@shared/mocks/critical-facilities';
import { LEYTE_FLOOD } from '@shared/mocks/flood';
import { LEYTE_LANDSLIDE } from '@shared/mocks/landslide';
import { LEYTE_STORM_SURGE } from '@shared/mocks/storm-surges';
import mapboxgl, { GeolocateControl, Map, Marker } from 'mapbox-gl';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import { PRAPage } from '@features/personalized-risk-assessment/store/pra.store';

type MapStyle = 'terrain' | 'satellite';

@Component({
  selector: 'noah-pra-map',
  templateUrl: './pra-map.component.html',
  styleUrls: ['./pra-map.component.scss'],
})
export class PraMapComponent implements OnInit {
  map!: Map;
  geolocateControl!: GeolocateControl;
  centerMarker!: Marker;
  mapStyle: MapStyle = 'terrain';

  private _unsub = new Subject();

  constructor(private mapService: MapService, private praService: PraService) {}

  ngOnInit(): void {
    this.initMap();

    fromEvent(this.map, 'load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initGeocoder();
        this.initGeolocation();
        // this.initMarkers();

        this.initPageListener();
        this.initCenterListener();
        this.initGeolocationListener();
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initLayers();
        this.initMarkers();
        this.hideAllLayers();

        const page = this.praService.currentPage;
        this.showLayers(page);
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  hideAllLayers() {
    this.praService.hazardTypes.forEach((hazard) => {
      this.map.setLayoutProperty(hazard, 'visibility', 'none');
    });
  }

  initCenterListener() {
    this.praService.currentCoords$
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
      this.praService.setCurrentLocation(e.result['place_name']);
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
        _this.praService.setCurrentLocation(myPlace);
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

  initPageListener() {
    this.praService.currentPage$
      .pipe(takeUntil(this._unsub))
      .subscribe((page) => {
        this.showLayers(page);
      });
  }

  initMap() {
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'pra-map',
      style: environment.mapbox.styles[this.mapStyle],
      zoom: 13,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: this.praService.currentCoords,
    });
  }

  initMarkers() {
    this.centerMarker = new mapboxgl.Marker({ color: '#333' })
      .setLngLat(this.praService.currentCoords)
      .addTo(this.map);

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

  showAllLayers() {
    this.praService.hazardTypes.forEach((hazard) => {
      this.map.setLayoutProperty(hazard, 'visibility', 'visible');
    });
  }

  showCurrentHazardLayer(page: PRAPage) {
    if (!this.praService.isHazardPage(page)) return;

    this.map.setLayoutProperty(page, 'visibility', 'visible');
  }

  showLayers(page: PRAPage) {
    if (page === 'critical-facilities') {
      this.showAllLayers();
      return;
    }

    this.hideAllLayers();
    this.showCurrentHazardLayer(page);
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
    }
  }
}
