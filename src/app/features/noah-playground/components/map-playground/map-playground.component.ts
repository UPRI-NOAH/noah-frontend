import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { environment } from '@env/environment';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { fromEvent, Subject } from 'rxjs';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { getHazardLayer } from '@shared/mocks/flood';

@Component({
  selector: 'noah-map-playground',
  templateUrl: './map-playground.component.html',
  styleUrls: ['./map-playground.component.scss'],
})
export class MapPlaygroundComponent implements OnInit, OnDestroy {
  map!: Map;
  pgLocation: string = '';

  private _unsub = new Subject();

  constructor(
    private mapService: MapService,
    private pgService: NoahPlaygroundService
  ) {}

  ngOnInit(): void {
    this.initMap();
    fromEvent(this.map, 'load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initExaggeration();
        this.initHazardLayers();
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
  }

  initExaggeration() {
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    });

    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        distinctUntilChanged(),
        map((exaggeration) => exaggeration.level)
      )
      .subscribe((level) =>
        this.map.setTerrain({ source: 'mapbox-dem', exaggeration: level })
      );

    this.pgService.exagerration$
      .pipe(takeUntil(this._unsub), distinctUntilChanged())
      .subscribe((exaggeration) => {
        if (exaggeration.shown) {
          this.map.setTerrain({
            source: 'mapbox-dem',
            exaggeration: exaggeration.level,
          });
          return;
        }

        this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 0 });
      });
  }

  initHazardLayers() {
    HAZARDS.forEach((h) => {
      h.levels.forEach((l) => {
        this.map.addLayer(getHazardLayer(l.id, l.url, l.sourceLayer, h.type));

        console.log(h.type, l.id);
        // opacity
        this.pgService
          .getHazardLevel$(h.type, l.id)
          .pipe(
            takeUntil(this._unsub),
            distinctUntilChanged((x, y) => x.opacity !== y.opacity)
          )
          .subscribe((level) =>
            this.map.setPaintProperty(l.id, 'fill-opacity', level.opacity / 100)
          );

        // shown
        this.pgService
          .getHazardLevel$(h.type, l.id)
          .pipe(
            takeUntil(this._unsub),
            distinctUntilChanged((x, y) => x.shown !== y.shown)
          )
          .subscribe((level) => {
            if (level.shown) {
              this.map.setPaintProperty(
                l.id,
                'fill-opacity',
                level.opacity / 100
              );
              return;
            }

            this.map.setPaintProperty(l.id, 'fill-opacity', 0);
          });

        // color
        // this.pgService.getHazardLevel$(h.type, l.id)
        //   .pipe(
        //     takeUntil(this._unsub),
        //     distinctUntilChanged(),
        //   )
        //   .subscribe((level) => {}
        //     // this.map.setTerrain({ source: 'mapbox-dem', exaggeration: level })
        //   );
      });
    });
  }

  initMap() {
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'map',
      style: environment.mapbox.styles.terrain,
      // zoom: 5,
      zoom: 10,
      touchZoomRotate: true,
      center: {
        lat: 10.872407621178079,
        lng: 124.93480374252101,
      },
    });
  }
}
