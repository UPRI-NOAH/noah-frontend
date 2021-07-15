import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import mapboxgl, { Map, Marker } from 'mapbox-gl';
import { environment } from '@env/environment';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { combineLatest, fromEvent, Subject } from 'rxjs';
import { NoahPlaygroundService } from '@features/noah-playground/services/noah-playground.service';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { HAZARDS } from '@shared/mocks/hazard-types-and-levels';
import { getHazardColor, getHazardLayer } from '@shared/mocks/flood';
import {
  CriticalFacility,
  CRITICAL_FACILITIES_ARR,
  getSymbolLayer,
} from '@shared/mocks/critical-facilities';

type MapStyle = 'terrain' | 'satellite';

@Component({
  selector: 'noah-map-playground',
  templateUrl: './map-playground.component.html',
  styleUrls: ['./map-playground.component.scss'],
})
export class MapPlaygroundComponent implements OnInit, OnDestroy {
  map!: Map;
  pgLocation: string = '';
  mapStyle: MapStyle = 'terrain';

  private _unsub = new Subject();
  private _changeStyle = new Subject();

  constructor(
    private mapService: MapService,
    private pgService: NoahPlaygroundService
  ) {}

  ngOnInit(): void {
    this.initMap();
    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe(() => {
        this.initExaggeration();
        this.initCriticalFacilityLayers();
        this.initHazardLayers();
      });
  }

  ngOnDestroy(): void {
    this._unsub.next();
    this._unsub.complete();
    this._changeStyle.next();
    this._changeStyle.complete();
  }

  initCriticalFacilityLayers() {
    CRITICAL_FACILITIES_ARR.forEach((cf) => this._loadCriticalFacilityIcon(cf));
  }

  initExaggeration() {
    this.map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    });

    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged(),
        map((exaggeration) => exaggeration.level)
      )
      .subscribe((level) =>
        this.map.setTerrain({ source: 'mapbox-dem', exaggeration: level })
      );

    this.pgService.exagerration$
      .pipe(
        takeUntil(this._unsub),
        takeUntil(this._changeStyle),
        distinctUntilChanged()
      )
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

        // opacity
        this.pgService
          .getHazardLevel$(h.type, l.id)
          .pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            distinctUntilChanged((x, y) => x.opacity !== y.opacity)
          )
          .subscribe((level) =>
            this.map.setPaintProperty(l.id, 'fill-opacity', level.opacity / 100)
          );

        // shown
        const hazardType$ = this.pgService.getHazard$(h.type).pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.shown === y.shown)
        );

        const hazardLevel$ = this.pgService.getHazardLevel$(h.type, l.id).pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.shown !== y.shown)
        );

        combineLatest([hazardType$, hazardLevel$])
          .pipe(
            tap(([hazardType, hazardLevel]) => {
              if (h.type === 'flood') {
                console.log(
                  'hazardTypeShown',
                  hazardType.shown,
                  'hazardLevelShown',
                  hazardLevel.shown,
                  h.name,
                  l.name
                );
              }
            })
          )
          .subscribe(([hazardType, hazardLevel]) => {
            if (hazardType.shown && hazardLevel.shown) {
              this.map.setPaintProperty(
                l.id,
                'fill-opacity',
                hazardLevel.opacity / 100
              );
              return;
            }

            this.map.setPaintProperty(l.id, 'fill-opacity', 0);
          });

        // color
        this.pgService
          .getHazardLevel$(h.type, l.id)
          .pipe(
            takeUntil(this._unsub),
            takeUntil(this._changeStyle),
            tap((c) => console.log(c)),
            distinctUntilChanged((x, y) => x.color !== y.color)
          )
          .subscribe((level) =>
            this.map.setPaintProperty(
              l.id,
              'fill-color',
              getHazardColor(h.type, level.color, l.id) // TO DO: Handle l.id properly
            )
          );
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

  private _loadCriticalFacilityIcon(name: CriticalFacility) {
    const _this = this;
    this.map.loadImage(`assets/map-sprites/${name}.png`, (error, image) => {
      if (error) throw error;
      _this.map.addImage(name, image);
      _this.map.addLayer(getSymbolLayer(name));

      // opacity
      this.pgService
        .getCriticalFacility$(name)
        .pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.opacity !== y.opacity)
        )
        .subscribe((facility) => {
          this.map.setPaintProperty(
            name,
            'icon-opacity',
            facility.opacity / 100
          );
          this.map.setPaintProperty(
            name,
            'text-opacity',
            facility.opacity / 100
          );
        });

      // shown
      this.pgService
        .getCriticalFacility$(name)
        .pipe(
          takeUntil(this._unsub),
          takeUntil(this._changeStyle),
          distinctUntilChanged((x, y) => x.shown !== y.shown)
        )
        .subscribe((facility) => {
          if (facility.shown) {
            this.map.setPaintProperty(
              name,
              'icon-opacity',
              facility.opacity / 100
            );
            this.map.setPaintProperty(
              name,
              'text-opacity',
              facility.opacity / 100
            );
            return;
          }

          this.map.setPaintProperty(name, 'icon-opacity', 0);
          this.map.setPaintProperty(name, 'text-opacity', 0);
        });
    });
  }

  switchMapStyle(style: MapStyle) {
    if (this.mapStyle === style) return;

    if (style in environment.mapbox.styles) {
      this.mapStyle = style;
      this.map.setStyle(environment.mapbox.styles[style]);
      this._changeStyle.next();
    }
  }
}
