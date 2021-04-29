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

@Component({
  selector: 'noah-pra-map',
  templateUrl: './pra-map.component.html',
  styleUrls: ['./pra-map.component.scss'],
})
export class PraMapComponent implements OnInit {
  map!: Map;
  centerMarker!: Marker;
  private _unsub = new Subject();

  constructor(private mapService: MapService, private praService: PraService) {}

  ngOnInit(): void {
    this.initMap();
    this.map.on('load', () => {
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
