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
import {
  LEYTE_PROVINCE_LANDSLIDE,
  LEYTE_PROVINCE_ALLUVIAL,
  LEYTE_PROVINCE_UNSTABLE_SLOPES,
  LEYTE_PROVINCE_DEBRIS_FLOW,
} from '@shared/mocks/landslide';
import { PlaygroundService } from '@features/playground/services/playground.service';
import {
  FloodReturnPeriod,
  StormSurgeAdvisory,
  LandslideHazards,
} from '@features/playground/store/playground.store';

@Component({
  selector: 'noah-playground-map',
  templateUrl: './playground-map.component.html',
  styleUrls: ['./playground-map.component.scss'],
})
export class PlaygroundMapComponent implements OnInit {
  map!: Map;
  pgLocation: string = '';

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
      this.initLandslideHazardsListener();
    });
  }

  hideFloodLayers() {
    this.playgroundService.floodReturnPeriods.forEach(
      (returnPeriod: FloodReturnPeriod) => {
        this.map.setLayoutProperty(returnPeriod, 'visibility', 'none');
      }
    );
  }

  hideLandslideLayers() {
    this.playgroundService.landslideHazards.forEach(
      (landslideHazards: LandslideHazards) => {
        this.map.setLayoutProperty(landslideHazards, 'visibility', 'none');
        if (landslideHazards === 'alluvial-fan-hazard') {
          this.map.setLayoutProperty('debris-flow', 'visibility', 'none');
        }
      }
    );
  }

  hideStormSurgeLayers() {
    this.playgroundService.stormsurgeAdvisory.forEach(
      (stormsurgeAdvisory: StormSurgeAdvisory) => {
        this.map.setLayoutProperty(stormsurgeAdvisory, 'visibility', 'none');
      }
    );
  }

  initFloodReturnPeriodListener() {
    this.playgroundService.currentFloodReturnPeriod$.subscribe(
      (returnPeriod) => {
        this.hideFloodLayers();
        this.map.setLayoutProperty(returnPeriod, 'visibility', 'visible');
      }
    );
  }

  initLandslideHazardsListener() {
    this.playgroundService.currentLandslideHazards$.subscribe(
      (landslideHazards) => {
        this.hideLandslideLayers();
        this.map.setLayoutProperty(landslideHazards, 'visibility', 'visible');
        if (landslideHazards === 'alluvial-fan-hazard') {
          this.map.setLayoutProperty('debris-flow', 'visibility', 'visible');
        }
      }
    );
  }

  initStormSurgeAdvisoryListener() {
    this.playgroundService.currentStormSurgeAdvisory$.subscribe(
      (stormsurgeAdvisory) => {
        this.hideStormSurgeLayers();
        this.map.setLayoutProperty(stormsurgeAdvisory, 'visibility', 'visible');
      }
    );
  }

  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    });
    // document.getElementById('geocoder').appendChild(geocoder.onAdd(this.map));
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    geocoder.on('result', (e) => {
      this.playgroundService.setCurrentLocationPg(e.result['place_name']);
      console.log(e.result['place_name']);
    });
  }

  initLayers() {
    this.map.addLayer(LEYTE_FLOOD_5);
    this.map.addLayer(LEYTE_FLOOD_25);
    this.map.addLayer(LEYTE_FLOOD_100);
    this.hideFloodLayers();

    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_1);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_2);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_3);
    this.map.addLayer(LEYTE_STORM_SURGE_ADVISORY_4);
    this.hideStormSurgeLayers();

    this.map.addLayer(LEYTE_PROVINCE_LANDSLIDE);
    this.map.addLayer(LEYTE_PROVINCE_ALLUVIAL);
    this.map.addLayer(LEYTE_PROVINCE_DEBRIS_FLOW);
    this.map.addLayer(LEYTE_PROVINCE_UNSTABLE_SLOPES);
    this.hideLandslideLayers();
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