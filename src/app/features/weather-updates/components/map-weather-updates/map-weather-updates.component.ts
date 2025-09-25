import { Component, OnInit } from '@angular/core';
import { MapService } from '@core/services/map.service';
import { environment } from '@env/environment';
import { WeatherUpdatesService } from '@features/weather-updates/services/weather-updates.service';
import {
  MapStyle,
  PH_DEFAULT_CENTER,
  RainfallContourTypes,
} from '@features/weather-updates/store/weather-updates.store';
import mapboxgl, { AnySourceData, GeolocateControl, Map } from 'mapbox-gl';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { combineLatest, fromEvent, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  take,
  takeUntil,
} from 'rxjs/operators';
@Component({
  selector: 'noah-map-weather-updates',
  templateUrl: './map-weather-updates.component.html',
  styleUrls: ['./map-weather-updates.component.scss'],
})
export class MapWeatherUpdatesComponent implements OnInit {
  map!: Map;
  geolocateControl: GeolocateControl;
  mapStyle: MapStyle = 'terrain';
  currentLocation$: Observable<string>;

  private _unsub = new Subject();
  private _changeStyle = new Subject();
  private centerMarker: mapboxgl.Marker | null = null;
  private attributionControl: mapboxgl.AttributionControl | null = null;
  private isInitialized = false;

  constructor(
    private gaService: GoogleAnalyticsService,
    private mapService: MapService,
    private wuService: WeatherUpdatesService
  ) {}

  ngOnInit(): void {
    this.initMap();

    this.wuService.typhoonTrackShown$
      .pipe(takeUntil(this._unsub))
      .subscribe((shown) => {
        this.updateTyphoonTrackVisibility(shown);
      });

    fromEvent(this.map, 'style.load')
      .pipe(takeUntil(this._unsub))
      .subscribe((shown) => {
        // Only initialize these controls once
        if (!this.isInitialized) {
          this.initGeocoder();
          this.initGeolocation();
          this.initAttribution();
          this.initCenterListener();
          this.initGeolocationListener();
          this.iniScaleControl();
          this.isInitialized = true;
          this.wuService.zoomTyphoon$.subscribe(() => {
            this.zoomTyphoon();
          });
        }

        // Always re-initialize these layers when style changes
        this.showRainfallContour();
        this.initWeatherSatellite();
        this.initTyphoonTrackLayers();
      });
  }

  ngOnDestroy(): void {
    this.closeAllTyphoonPopups();
    this._unsub.next();
    this._unsub.complete();
  }

  selectPlace(selectedPlace) {
    this.wuService.setCurrentLocation(
      selectedPlace.text ||
        selectedPlace.place_name ||
        selectedPlace.properties?.name || // display on search results
        selectedPlace.properties?.full_address
    );

    // Handle both Geocoding API (.center) and Searchbox API (.geometry.coordinates)
    const coords = selectedPlace.center || selectedPlace.geometry?.coordinates;

    if (!coords) {
      console.error('No coordinates found in selected place:', selectedPlace);
      return;
    }

    const [lng, lat] = coords;
    this.wuService.setCenter({ lat, lng });
    this.wuService.setCurrentCoords({ lat, lng });
  }

  iniScaleControl() {
    const scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric',
    });

    // Create a custom container for the scale control
    const container = document.createElement('div');
    container.id = 'custom-scale-control';
    container.style.position = 'absolute';
    container.style.top = '50%'; // vertically centered
    container.style.right = '10px'; // some margin from right edge
    container.style.transform = 'translateY(-50%)';
    container.style.padding = '5px'; // padding around the box
    container.style.background = 'white';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

    // Append container to the map
    this.map.getContainer().appendChild(container);

    // Add the scale control using Mapbox’s API
    const scaleEl = scale.onAdd(this.map);
    container.appendChild(scaleEl);

    // Style adjustments
    const scaleElem = scaleEl as HTMLElement;
    scaleElem.style.fontSize = '12px';
    scaleElem.style.lineHeight = '20px';
    scaleElem.style.fontWeight = 'bold';

    // Align the text and scale bar like Mapbox example
    scaleElem.style.display = 'flex';
    scaleElem.style.flexDirection = 'column'; // puts number above the bar
    scaleElem.style.alignItems = 'center'; // center horizontal alignment

    if (scaleElem.style.flexDirection === 'row') {
      // find the label element inside the scaleEl
      const label = scaleElem.querySelector('div');
      if (label) {
        (label as HTMLElement).style.paddingLeft = '8px'; // space between bar and text
      }
    }
    const applyPosition = () => {
      if (window.innerWidth <= 767) {
        container.style.top = '114px';
      } else {
        container.style.top = '80px';
      }
    };
    applyPosition();
  }

  zoomTyphoon() {
    if (!this.map) return;
    this.map.flyTo({
      center: PH_DEFAULT_CENTER,
      zoom: 4.4,
      essential: true,
    });
  }

  switchMapStyle(style: MapStyle) {
    // Prevent unnecessary style changes if the same style is selected
    if (this.mapStyle === style) {
      return; // Exit early if the same style is already active
    }

    this.mapStyle = style;
    let mapboxStyle: string;

    switch (style) {
      case 'terrain':
        mapboxStyle = environment.mapbox.styles.terrain;
        break;
      case 'satellite':
        mapboxStyle = environment.mapbox.styles.satellite;
        break;
      default:
        mapboxStyle = environment.mapbox.styles.terrain;
    }

    this.map.setStyle(mapboxStyle);
    this._changeStyle.next();
  }

  initAttribution() {
    // Only create attribution control if it doesn't exist
    if (!this.attributionControl) {
      this.attributionControl = this.mapService.getNewAttributionControl();
      this.map.addControl(this.attributionControl, 'bottom-right');
    }
  }

  initCenterListener() {
    this.wuService.currentCoords$
      .pipe(
        distinctUntilChanged(),
        takeUntil(this._unsub),
        filter((center) => center !== null)
      )
      .subscribe((center) => {
        this.map.flyTo({
          center,
          zoom: 17,
          essential: true,
          bearing: 30,
          pitch: 50,
        });
        if (!this.centerMarker) {
          this.centerMarker = new mapboxgl.Marker({
            color: '#3D3D3D',
            draggable: true,
          })
            .setLngLat(center)
            .addTo(this.map)
            .on('dragend', (e) => {
              // Update the center position when the marker is dragged
              const coords = document.getElementById('coordinates');
              const LngLat = this.centerMarker.getLngLat();
              coords.style.display = 'block';
              coords.innerHTML = `Lon: ${LngLat.lng.toFixed(
                5
              )}<br />Lat: ${LngLat.lat.toFixed(5)}`;
              this.mapService.dragReverseGeocode(LngLat.lat, LngLat.lng);
              this.map.flyTo({
                center: LngLat,
                zoom: 17,
                speed: 1.2,
                curve: 1,
                easing: (t) => t,
                essential: true,
              });
            });
        } else {
          this.centerMarker.setLngLat(center);
        }
      });
  }

  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: environment.mapbox.accessToken,
      mapboxgl: mapboxgl,
      marker: {
        color: 'orange',
      },
      flyTo: {
        padding: 15,
        easing: function (t) {
          return t;
        },
        maxZoom: 13,
      },
    });

    geocoder.on('result', (e) => {
      this.wuService.setCurrentLocation(e.result['place_name']);
      console.log(e.result);
    });
  }

  initGeolocation() {
    this.geolocateControl = this.mapService.getNewGeolocateControl();
  }

  initGeolocationListener() {
    const _this = this;

    fromEvent(this.geolocateControl, 'geolocate')
      .pipe(takeUntil(this._unsub), debounceTime(2500))
      .subscribe(locateUser);

    async function locateUser(e) {
      try {
        const { latitude, longitude } = e.coords;
        const myPlace = await _this.mapService.reverseGeocode(
          latitude,
          longitude
        );
        _this.wuService.setCurrentLocation(myPlace);
      } catch (error) {
        console.error('Error locating user:', error);
      }
    }
  }

  initMap() {
    this.currentLocation$ = this.wuService.currentLocation$;
    this.mapService.init();
    this.map = new mapboxgl.Map({
      container: 'map-weather-updates',
      style: environment.mapbox.styles.terrain,
      zoom: 4.4, // Initial zoom level for Rainfall Contour and Typhoon Track
      touchZoomRotate: true,
      center: PH_DEFAULT_CENTER,
      attributionControl: false,
    });
  }

  showRainfallContour() {
    const rainfallContourMapImages = {
      '1hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/1hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '3hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/3hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '6hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/6hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '12hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/12hr_latest_rainfall_contour.png',
        type: 'image',
      },
      '24hr': {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/contours/24hr_latest_rainfall_contour.png',
        type: 'image',
      },
    };

    const getRainfallContourSource = (rainfallContourMapDetails: {
      url: string;
      type: string;
    }): AnySourceData => {
      switch (rainfallContourMapDetails.type) {
        case 'image':
          return {
            type: 'image',
            url: rainfallContourMapDetails.url,
            coordinates: [
              [115.35, 21.55], // top-left
              [128.25, 21.55], // top-right
              [128.25, 3.85], // bottom-right
              [115.35, 3.85], // bottom-left
            ],
          };
        case 'video':
          return {
            type: 'video',
            urls: [rainfallContourMapDetails.url],
            coordinates: [
              [115.35, 21.55], // top-left
              [128.25, 21.55], // top-right
              [128.25, 3.85], // bottom-right
              [115.35, 3.85], // bottom-left
            ],
          };
        default:
          throw new Error('[Weather Updates] Invalid rainfall contour type');
      }
    };

    Object.keys(rainfallContourMapImages).forEach(
      (rainfallContourType: RainfallContourTypes) => {
        const rainfallContourMapDetails =
          rainfallContourMapImages[rainfallContourType];
        this.map.addSource(
          rainfallContourType,
          getRainfallContourSource(rainfallContourMapDetails)
        );

        this.map.addLayer({
          id: rainfallContourType,
          type: 'raster',
          source: rainfallContourType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0.8,
          },
        });

        const rainfallOpacity$ = this.wuService
          .getRainfallContour$(rainfallContourType)
          .pipe(
            map((rainfall) => rainfall.opacity),
            distinctUntilChanged()
          );

        const selectedRainfallContour$ =
          this.wuService.selectedRainfallContourType$.pipe(
            distinctUntilChanged()
          );

        combineLatest([rainfallOpacity$, selectedRainfallContour$])
          .pipe(takeUntil(this._unsub), takeUntil(this._changeStyle))
          .subscribe(([rainfallOpacity, selectedRainfallContour]) => {
            let opacity = +(
              rainfallOpacity && selectedRainfallContour === rainfallContourType
            );
            if (opacity) {
              opacity = rainfallOpacity / 100;
            }
            this.map.setPaintProperty(
              rainfallContourType,
              'raster-opacity',
              opacity
            );
          });
      }
    );
  }

  // function that toggles the all layout properties of the typhoon track depending on the value
  // of the shown property of the typhoonTrack type.
  private updateTyphoonTrackVisibility(shown: boolean): void {
    if (!this.map.getLayer('typhoon-track-icon')) return;

    const visibility = shown ? 'visible' : 'none';

    this.map.setLayoutProperty('typhoon-track-icon', 'visibility', visibility);
    this.map.setLayoutProperty('typhoon-track-line', 'visibility', visibility);
    this.map.setLayoutProperty(
      'typhoon-forecast-circles-fill',
      'visibility',
      visibility
    );
    this.map.setLayoutProperty(
      'typhoon-forecast-circles-outline',
      'visibility',
      visibility
    );
    this.map.setLayoutProperty('par-outline', 'visibility', visibility);

    // if (shown) {
    //   this.map.flyTo({
    //     center: PH_DEFAULT_CENTER,
    //     zoom: 4.4,
    //     essential: true,
    //   });
    // }

    if (!shown) {
      this.closeAllTyphoonPopups();
    }
  }

  // an array of popups for storing all opened popups.
  private activePopups: mapboxgl.Popup[] = [];

  // method for closing all active popups.
  private closeAllTyphoonPopups(): void {
    this.activePopups.forEach((popup) => popup.remove());
    this.activePopups = [];
  }

  // method to convert typhoon class abbreviations to full names
  private getTyphoonClassFullName(abbreviation: string): string {
    const typhoonClassMap: { [key: string]: string } = {
      LPA: 'Low Pressure Area',
      TD: 'Tropical Depression',
      TS: 'Tropical Storm',
      STS: 'Severe Tropical Storm',
      TY: 'Typhoon',
      STY: 'Super Typhoon',
    };

    return typhoonClassMap[abbreviation] || abbreviation;
  }

  initTyphoonTrackLayers() {
    // 0 - declare the source json files
    const typhoonLayerSourceFile: string =
      // 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/typhoon_track/BISINGDANAS.geojson';
      'https://upri-noah.s3.amazonaws.com/typhoon_track/pagasa_typhoon.geojson';
    const parOutlineSourceFile: string =
      'https://upri-noah.s3.ap-southeast-1.amazonaws.com/par/par_outline.geojson';

    // 1 - load typhoon track layers icons
    const _this = this;
    const typhoonLegend = {
      LPA: 'assets/legends/typhoon-track/LPA.png',
      STS: 'assets/legends/typhoon-track/STS.png',
      STY: 'assets/legends/typhoon-track/STY.png',
      TD: 'assets/legends/typhoon-track/TD.png',
      TS: 'assets/legends/typhoon-track/TS.png',
      TY: 'assets/legends/typhoon-track/TY.png',
    };

    // add typhoon legend.
    Object.entries(typhoonLegend).forEach(([legend, url]) => {
      this.map.loadImage(url, (error, image) => {
        if (error) throw error;
        this.map.addImage(`custom-marker-${legend}`, image);
      });
    });

    // 2 - add map sources.
    const typhoonMapSource = `typhoon-track-map-source`;
    _this.map.addSource(typhoonMapSource, {
      type: 'geojson',
      data: typhoonLayerSourceFile,
    });

    // Add PAR outline source
    const parOutlineSource = `par-outline-source`;
    _this.map.addSource(parOutlineSource, {
      type: 'geojson',
      data: parOutlineSourceFile,
    });

    // 3 - add point layer.
    this.map.addLayer({
      id: 'typhoon-track-icon',
      type: 'symbol',
      source: typhoonMapSource,
      paint: {
        'icon-opacity': 1,
        'text-opacity': 1,
        'text-color': _this.mapStyle === 'terrain' ? '#333333' : '#ffffff',
        'text-halo-color':
          _this.mapStyle === 'terrain'
            ? 'rgba(255, 255, 255, 1)'
            : 'rgba(0, 0, 0, 1)',
        'text-halo-width': 0.5,
        'text-halo-blur': 0.5,
      },

      layout: {
        'icon-image': [
          'concat',
          'custom-marker-',
          ['concat', ['get', 'typhoon_type']],
        ],
        'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.03],
      },
      filter: ['==', ['geometry-type'], 'Point'],
    });

    // Click events.
    this.map.on('click', 'typhoon-track-icon', (e) => {
      if (e.features && e.features.length > 0) {
        // Close all existing popups before opening a new one
        this.closeAllTyphoonPopups();

        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const typhoonName = feature.properties?.international_name;
        const typhoonClass = this.getTyphoonClassFullName(
          feature.properties?.typhoon_type
        );
        const datetime = feature.properties?.datetime;
        const radius = feature.properties?.radius;
        const formattedTyphoonName = typhoonName
          .replace('{', '(')
          .replace('}', ')');

        // HTML of the popup
        const popupContent = `
          <div>
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333;">${formattedTyphoonName}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>Classification:</strong> ${typhoonClass}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>Date/Time:</strong> ${datetime}
            </p>
            ${
              radius && radius > 0
                ? `<p style="margin: 5px 0; font-size: 12px; color: #666;">
                     <strong>Forecast Radius:</strong> ${radius} km
                   </p>`
                : `<p style="margin: 5px 0; font-size: 12px; color: #2563eb; font-weight: 500;">
                     Actual Position
                   </p>`
            }
          </div>
        `;

        // if map is zoomed out such that multiple
        // copies of the feature are visible, popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Create a new popup instance for each click
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 25,
        })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(this.map);

        // Store the popup reference
        this.activePopups.push(popup);

        // event listener for the close button
        popup.getElement().addEventListener('click', (event) => {
          if ((event.target as HTMLElement).classList.contains('close-popup')) {
            popup.remove();
            // Remove from active popups array
            const index = this.activePopups.indexOf(popup);
            if (index > -1) {
              this.activePopups.splice(index, 1);
            }
          }
        });
      }
    });

    // change cursor when hovering over icon.
    this.map.on('mouseenter', 'typhoon-track-icon', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'typhoon-track-icon', () => {
      this.map.getCanvas().style.cursor = '';
    });

    // 4 - add forecast circles as fill layers
    // Define forecast circle colors based on radius ranges
    const getForecastColor = (radius: number) => {
      if (radius >= 80 && radius < 117)
        return { edge: '#E87974', inner: 'rgba(232, 121, 116, 0.3)' }; // 24hr
      if (radius >= 117 && radius < 153)
        return { edge: '#71A2F3', inner: 'rgba(113, 162, 243, 0.3)' }; // 48hr
      if (radius >= 153 && radius < 182)
        return { edge: '#54B585', inner: 'rgba(84, 181, 133, 0.3)' }; // 72hr
      if (radius >= 182 && radius < 191)
        return { edge: '#F2C04B', inner: 'rgba(242, 192, 75, 0.3)' }; // 96hr
      if (radius >= 191)
        return { edge: '#461F8E', inner: 'rgba(70, 31, 142, 0.3)' }; // 120hr
      return { edge: '#E87974', inner: 'rgba(232, 121, 116, 0.3)' }; // default to 24hr
    };

    // Add forecast circle fill layer
    this.map.addLayer({
      id: 'typhoon-forecast-circles-fill',
      type: 'fill',
      source: typhoonMapSource,
      paint: {
        'fill-color': 'rgba(96, 96, 96, 0.5)', // always same color
        'fill-opacity': 1,
      },
      filter: [
        'all',
        ['==', ['get', 'type'], 'smoothed_hull'],
        ['==', ['geometry-type'], 'Polygon'],
        ['>', ['get', 'radius'], 0],
      ],
    });

    // Add forecast circle outline layer
    this.map.addLayer({
      id: 'typhoon-forecast-circles-outline',
      type: 'line',
      source: typhoonMapSource,
      paint: {
        'line-color': '#606060', // always same color
        'line-width': 0.9,
        'line-opacity': 0,
      },
      filter: [
        'all',
        ['==', ['get', 'type'], 'smoothed_hull'],
        ['==', ['geometry-type'], 'Polygon'],
        ['>', ['get', 'radius'], 0],
      ],
    });

    // 5 - Add line layer
    this.map.addLayer({
      id: 'typhoon-track-line',
      type: 'line',
      source: typhoonMapSource,
      paint: {
        'line-color': '#000000',
        'line-width': 2,
      },
      filter: ['==', ['get', 'type'], 'track_line'],
    });

    // 6 - Add PAR outline layer
    this.map.addLayer({
      id: 'par-outline',
      type: 'line',
      source: parOutlineSource,
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          '#FFFFFF', // White for PAR
          ['==', ['get', 'layer'], 'philoutline'],
          '#000000', // Black for philoutline
          '#FFFFFF', // Default to white
        ],
        'line-width': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          3, // Thicker line for PAR

          ['==', ['get', 'layer'], 'philoutline'],
          2, // Thinner line for philoutline
          2, // Default line width
        ],
        'line-opacity': 0.8,
        'line-dasharray': [
          'case',
          ['==', ['get', 'layer'], 'PAR'],
          ['literal', [1, 0]], // Dashed lines for PAR only
          ['literal', [1, 0]], // Solid lines for philoutline (1px dash, 0px gap = solid)
        ],
      },
      filter: ['==', ['geometry-type'], 'LineString'], // Show only LineString geometries
    });

    // 7 - listen to the values from the store.
    const typhoonTrack = this.wuService.getTyphoonTrack();

    const initialVisibility = typhoonTrack.shown ? 'visible' : 'none';
    this.map.setLayoutProperty(
      'typhoon-track-icon',
      'visibility',
      initialVisibility
    );
    this.map.setLayoutProperty(
      'typhoon-track-line',
      'visibility',
      initialVisibility
    );
    this.map.setLayoutProperty(
      'typhoon-forecast-circles-fill',
      'visibility',
      initialVisibility
    );
    this.map.setLayoutProperty(
      'typhoon-forecast-circles-outline',
      'visibility',
      initialVisibility
    );
    this.map.setLayoutProperty('par-outline', 'visibility', initialVisibility);
  }

  initWeatherSatellite() {
    const weatherSatelliteMapImage = {
      himawari: {
        url: 'https://upri-noah.s3.ap-southeast-1.amazonaws.com/sat_webm/ph_himawari.webm',
        type: 'video',
      },
    };

    const getWeatherSatelliteSource = (weatherSatelliteMapDetails: {
      url: string;
      type: string;
    }): AnySourceData => {
      switch (weatherSatelliteMapDetails.type) {
        case 'video':
          return {
            type: 'video',
            urls: [weatherSatelliteMapDetails.url],
            coordinates: [
              [100.0, 29.25], // top-left
              [160.0, 29.25], // top-right
              [160.0, 5.0], // bottom-right
              [100.0, 5.0], // bottom-left
            ],
          };
        default:
          throw new Error(
            '[MapPlayground] Unable to get weather satellite source'
          );
      }
    };

    // Explicitly type the key as "himawari"
    (Object.keys(weatherSatelliteMapImage) as Array<'himawari'>).forEach(
      (weatherSatelliteType) => {
        const weatherSatelliteMapDetails =
          weatherSatelliteMapImage[weatherSatelliteType];

        // Add source
        this.map.addSource(
          weatherSatelliteType,
          getWeatherSatelliteSource(weatherSatelliteMapDetails)
        );

        // Add layer
        this.map.addLayer({
          id: weatherSatelliteType,
          type: 'raster',
          source: weatherSatelliteType,
          paint: {
            'raster-fade-duration': 0,
            'raster-opacity': 0,
          },
        });

        // Combine observables for visibility and opacity
        combineLatest([
          this.wuService.weatherSatellitesShown$,
          this.wuService.getWeatherSatellite$(weatherSatelliteType).pipe(
            map((state) => state.opacity),
            distinctUntilChanged()
          ),
        ])
          .pipe(takeUntil(this._unsub))
          .subscribe(([shown, opacity]) => {
            const newOpacity = shown ? opacity / 100 : 0;
            this.map.setPaintProperty(
              weatherSatelliteType,
              'raster-opacity',
              newOpacity
            );
          });
      }
    );
  }
}
