import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { PraService } from '@features/personalized-risk-assessment/services/pra.service';
import { LEYTE_FLOOD } from '@shared/mocks/flood';
import { LEYTE_LANDSLIDE } from '@shared/mocks/landslide';
import { LEYTE_STORM_SURGE } from '@shared/mocks/storm-surges';
import mapboxgl, { Map } from 'mapbox-gl';

@Component({
  selector: 'noah-pra-map',
  templateUrl: './pra-map.component.html',
  styleUrls: ['./pra-map.component.scss'],
})
export class PraMapComponent implements OnInit {
  map!: Map;

  constructor(private mapService: MapService, private praService: PraService) {}

  ngOnInit(): void {
    this.map = new mapboxgl.Map({
      container: 'pra-map',
      style: environment.mapbox.styles.base,
      zoom: 13,
      pitch: 50,
      touchZoomRotate: true,
      bearing: 30,
      center: this.praService.currentCoords,
    });

    this.map.on('load', () => {
      this.map.addLayer(LEYTE_FLOOD);
      this.map.addLayer(LEYTE_LANDSLIDE);
      this.map.addLayer(LEYTE_STORM_SURGE);

      // this.map.setLayoutProperty(LEYTE_FLOOD.id, 'visibility', 'none');
      // this.map.setLayoutProperty(LEYTE_LANDSLIDE.id, 'visibility', 'none');
      // this.map.setLayoutProperty(LEYTE_STORM_SURGE.id, 'visibility', 'none');
    });
  }
}
