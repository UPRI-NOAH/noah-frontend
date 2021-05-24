import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { MARKERS } from '@shared/mocks/critical-facilities';
import { LEYTE_FLOOD } from '@shared/mocks/flood';
import { LEYTE_LANDSLIDE } from '@shared/mocks/landslide';
import { LEYTE_STORM_SURGE } from '@shared/mocks/storm-surges';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { query } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { features } from 'node:process';

@Component({
  selector: 'noah-pra-map',
  templateUrl: './pra-map.component.html',
  styleUrls: ['./pra-map.component.scss'],
})
export class PraMapComponent implements OnInit {
  map!: Map;
  centerMarker!: Marker;
  mylocation: string = '';
  private _unsub = new Subject();

  constructor(
    private mapService: MapService,
    private praService: PraService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.map.on('load', () => {
      this.initGeocoder();
      this.initLayers();
      this.initMarkers();
      this.initPageListener();
      this.initCenterListener();
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
    this.map.getContainer().querySelector('.mapboxgl-ctrl-bottom-left');
    this.map.addControl(geocoder);
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    geocoder.on('result', (e) => {
      this.praService.setCurrentLocation(e.result['place_name']);
      console.log(e.result);
    });
  }

  initLayers() {
    this.map.addLayer(LEYTE_FLOOD);
    this.map.addLayer(LEYTE_LANDSLIDE);
    this.map.addLayer(LEYTE_STORM_SURGE);

    // Hide all on init
    this.hideAllLayers;
  }

  initPageListener() {
    this.praService.currentPage$
      .pipe(takeUntil(this._unsub))
      .subscribe((page) => {
        if (page === 'critical-facilities') {
          this.showAllLayers();
          return;
        }

        this.hideAllLayers();
        if (this.praService.isHazardPage(page)) {
          this.map.setLayoutProperty(page, 'visibility', 'visible');
        }
      });
  }

  initMap() {
    this.mapService.init();

    this.map = new mapboxgl.Map({
      container: 'pra-map',
      style: environment.mapbox.styles.base,
      zoom: 13,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: this.praService.currentCoords,
    });

    var geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false,
      },
      trackUserLocation: true,
    });

    this.map.addControl(geolocate, 'bottom-right');
    this.map.on('load', () => {
      geolocate.trigger();
    });
    geolocate.on('geolocate', locateUser);

    const access_token =
      'pk.eyJ1IjoiY2xvdWQ1IiwiYSI6ImNpcDU1czB2bzAwM2V2ZWt0NXF4bjNtcjEifQ.TPa7NFOV0B1PRnhSUUxTnA';
    function locateUser(e) {
      this.Mylongitude = e.coords.longitude;
      this.Mylatitude = e.coords.latitude;
      let api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.Mylongitude},${this.Mylatitude}.json?types=locality&access_token=${access_token}`;
      console.log('lng:' + this.Mylongitude);
      console.log('lat' + this.Mylatitude);

      fetch(api_url)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          // console.log(data);
          let myPlace = data.features[0].place_name;
          console.log(myPlace);
        });

      geolocate.off('geolocate', null);
    }
  }

  initMarkers() {
    this.centerMarker = new mapboxgl.Marker({ color: '#333' })
      .setLngLat(this.praService.currentCoords)
      .addTo(this.map);

    MARKERS.forEach((m) =>
      new mapboxgl.Marker().setLngLat(m.coords).addTo(this.map)
    );
  }

  showAllLayers() {
    this.praService.hazardTypes.forEach((hazard) => {
      this.map.setLayoutProperty(hazard, 'visibility', 'visible');
    });
  }
}
