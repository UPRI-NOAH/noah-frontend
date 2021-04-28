import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl, { Map } from 'mapbox-gl';

@Component({
  selector: 'noah-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  map: Map;

  constructor() {
    this.map = new mapboxgl.Map({
      container: 'map-mapbox',
      style: environment.mapbox.styles.base,
      zoom: 12,
      center: [124.45192, 11.62844], // biliran
    });

    this.map.on('load', () => {
      this.map.addSource('iloilo-hazzard', {
        type: 'vector',
        url: 'mapbox://kennethliporada.1wc8qxxd',
      });

      this.map.addLayer({
        id: 'iloilo-map',
        type: 'fill',
        source: 'iloilo-hazzard',
        'source-layer': 'Iloilo_LandslideHazards-dboy4c',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'LH'],
            1,
            'hsl(200, 21%, 33%)', // "hsl(75, 90%, 68%)"
            2,
            'hsl(144, 97%, 31%)', // "hsl(360, 100%, 44%)"
            3,
            'hsl(36, 88%, 44%)', // "hsl(216, 68%, 29%)"
          ],
          'fill-opacity': 0.7,
        },
      });

      this.map.addSource('biliran-flood', {
        type: 'vector',
        url: 'mapbox://kennethliporada.78sczcuj',
      });

      this.map.addLayer({
        id: 'biliran-map',
        type: 'fill',
        source: 'biliran-flood',
        'source-layer': 'Biliran_Flood_100years-636bl0',
        paint: {
          'fill-color': [
            'match',
            ['get', 'Var'],
            [1],
            'hsl(0, 93%, 51%)',
            [2],
            'hsl(95, 95%, 39%)',
            [3],
            'hsl(216, 92%, 33%)',
            '#000000',
          ],
          'fill-opacity': 0.7,
        },
      });

      this.map.addSource('biliran-stormsurge', {
        type: 'vector',
        url: 'mapbox://kennethliporada.02hps5f9',
      });

      this.map.addLayer({
        id: 'biliran-map',
        type: 'fill',
        source: 'biliran-stormsurge',
        'source-layer': 'Biliran_StormSurge-axhjcl',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'HAZ'],
            1,
            'hsl(0, 100%, 52%)',
            2,
            'hsl(108, 94%, 56%)',
            3,
            'hsl(26, 90%, 53%)',
          ],
          'fill-opacity': 0.7,
        },
      });
    });
  }

  ngOnInit(): void {}
}
