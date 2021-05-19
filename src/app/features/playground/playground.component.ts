import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl, { Map, Marker } from 'mapbox-gl';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { MapService } from '@core/services/map.service';

@Component({
  selector: 'noah-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
})
export class PlaygroundComponent implements OnInit {
  map!: Map;
  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.initMap();
    this.map.on('load', () => {
      this.initGeocoder();
    });
  }

  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });
    this.map.addControl(geocoder);
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  initMap() {
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.styles.base,
      zoom: 5,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: [122, 11],
    });
  }
}
