import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { environment } from '@env/environment';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {
  LEYTE_FLOOD_100,
  LEYTE_FLOOD_25,
  LEYTE_FLOOD_5,
} from '@shared/mocks/flood';
import { PlaygroundService } from '@features/playground/services/playground.service';
import { FloodReturnPeriod } from '@features/playground/store/playground.store';

@Component({
  selector: 'noah-playground-map',
  templateUrl: './playground-map.component.html',
  styleUrls: ['./playground-map.component.scss'],
})
export class PlaygroundMapComponent implements OnInit {
  map!: Map;

  constructor(
    private mapService: MapService,
    private playgroundService: PlaygroundService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.map.on('load', () => {
      this.initLayers();
      this.initGeocoder();

      this.initFloodReturnPeriodListener();
    });
  }

  hideAllLayers() {
    this.playgroundService.floodReturnPeriods.forEach(
      (returnPeriod: FloodReturnPeriod) => {
        this.map.setLayoutProperty(returnPeriod, 'visibility', 'none');
      }
    );
  }

  initFloodReturnPeriodListener() {
    this.playgroundService.currentFloodReturnPeriod$.subscribe(
      (returnPeriod) => {
        this.hideAllLayers();
        this.map.setLayoutProperty(returnPeriod, 'visibility', 'visible');
      }
    );
  }

  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });
    this.map.addControl(geocoder, 'top-right');
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  initLayers() {
    this.map.addLayer(LEYTE_FLOOD_5);
    this.map.addLayer(LEYTE_FLOOD_25);
    this.map.addLayer(LEYTE_FLOOD_100);

    this.hideAllLayers();
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
