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
import {
  LEYTE_STORM_SURGE_ADVISORY_1,
  LEYTE_STORM_SURGE_ADVISORY_2,
  LEYTE_STORM_SURGE_ADVISORY_3,
  LEYTE_STORM_SURGE_ADVISORY_4,
} from '@shared/mocks/storm-surges';
import { PlaygroundService } from '@features/playground/services/playground.service';
import {
  FloodReturnPeriod,
  StormSurgeAdvisory,
} from '@features/playground/store/playground.store';

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
      this.initStormSurgeAdvisoryListener();
    });
  }

  hideAllLayers() {
    this.playgroundService.floodReturnPeriods.forEach(
      (returnPeriod: FloodReturnPeriod) => {
        this.map.setLayoutProperty(returnPeriod, 'visibility', 'none');
      }
    );
    this.playgroundService.stormsurgeAdvisory.forEach(
      (stormsurgeAdvisory: StormSurgeAdvisory) => {
        this.map.setLayoutProperty(stormsurgeAdvisory, 'visibility', 'none');
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

  initStormSurgeAdvisoryListener() {
    this.playgroundService.currentStormSurgeAdvisory$.subscribe(
      (stormsurgeAdvisory) => {
        this.hideAllLayers();
        this.map.setLayoutProperty(stormsurgeAdvisory, 'visibility', 'visible');
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

    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_1);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_2);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_3);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_4);

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
