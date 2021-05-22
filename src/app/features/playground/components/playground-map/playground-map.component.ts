import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { environment } from '@env/environment';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

@Component({
  selector: 'noah-playground-map',
  templateUrl: './playground-map.component.html',
  styleUrls: ['./playground-map.component.scss'],
})
export class PlaygroundMapComponent implements OnInit {
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
    this.map.addControl(geocoder, 'top-right');
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  initMap() {
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.styles.base,
      zoom: 5,
      touchZoomRotate: true,
      center: [122.65301737691877, 11.834938659565541],
    });
  }
}
