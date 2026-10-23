import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Basemap,
  DEFAULT_BASEMAP,
  getBasemapConfig,
  getBasemapForPhilippineTime,
  hasStandardBasemap,
  LightingSelection,
  STANDARD_BASEMAP_IMPORT,
} from '@core/services/standard-style';

/**
 * Shared map configuration plus the Mapbox Standard lighting preset.
 *
 * The preset is shared across every map page so re-lighting is not duplicated
 * per page. This service owns the whole lighting state machine:
 *
 * - which preset is applied ({@link basemap$}),
 * - whether that preset was picked by hand or derived from the Philippine
 *   clock ({@link lightingSelection$}),
 * - the preset the clock currently points at ({@link scheduledBasemap$}),
 *
 * so the controls panel can render an accurate status line without knowing
 * anything about the schedule itself.
 */
@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  constructor(private httpClient: HttpClient, private zone: NgZone) {
    // Default to manual Day basemap lighting.
    this.lightingSelectionSubject.next('day');
    this.basemapSubject.next('day');
    this.scheduledBasemapSubject.next(getBasemapForPhilippineTime());
    this.startLightingClock();
  }
  private addressSubject = new Subject<string>();
  private sessionToken: string = this.generateUUID();

  address$: Observable<string> = this.addressSubject.asObservable();

  /**
   * The lighting preset currently applied.
   *
   * Seeded with {@link DEFAULT_BASEMAP} and only changed through
   * {@link switchBasemap}.
   */
  private basemapSubject = new BehaviorSubject<Basemap>(DEFAULT_BASEMAP);

  /**
   * Emits whenever the lighting preset changes, whether from a manual
   * selection or from an automatic (Philippine-Time) schedule.
   */
  basemap$: Observable<Basemap> = this.basemapSubject.asObservable();

  /**
   * The lighting *selection*: `auto` follows the Philippine clock, any other
   * value is a manual preset that stays pinned until the user switches back.
   */
  private lightingSelectionSubject = new BehaviorSubject<LightingSelection>(
    'auto'
  );

  /** Emits the current lighting selection (`auto` or a manual preset). */
  lightingSelection$: Observable<LightingSelection> =
    this.lightingSelectionSubject.asObservable();

  /**
   * The preset the Philippine clock currently points at.
   *
   * Kept apart from {@link basemap$} so a manual selection is not immediately
   * overwritten: the clock only switches when the Philippine-Time window
   * changes, and the manual choice stands until then.
   */
  private scheduledBasemapSubject = new BehaviorSubject<Basemap>(
    getBasemapForPhilippineTime()
  );

  /** Emits the preset the Philippine clock currently points at. */
  scheduledBasemap$: Observable<Basemap> =
    this.scheduledBasemapSubject.asObservable();

  /** Maps handed to {@link applyStandardConfig} and still alive. */
  private readonly configuredMaps = new Set<mapboxgl.Map>();

  /**
   * Interval id of the Philippine-Time lighting clock. Created outside Angular
   * so it cannot trigger change detection on every tick.
   */
  private lightingClockTimer: number | null = null;

  get currentBasemap(): Basemap {
    return this.basemapSubject.value;
  }

  /** The lighting selection currently in effect. */
  get currentLightingSelection(): LightingSelection {
    return this.lightingSelectionSubject.value;
  }

  /** The lighting preset the Philippine clock currently points at. */
  get currentScheduledBasemap(): Basemap {
    return this.scheduledBasemapSubject.value;
  }

  ngOnDestroy(): void {
    if (this.lightingClockTimer !== null) {
      window.clearInterval(this.lightingClockTimer);
      this.lightingClockTimer = null;
    }
  }

  init() {
    mapboxgl.accessToken = environment.mapbox.accessToken;
  }

  /**
   * Registers a map and applies the current Mapbox Standard lighting preset.
   *
   * Only Mapbox Standard styles expose a configurable `basemap` import, so
   * this is a no-op for the legacy satellite / terrain styles. Detection is
   * done against the loaded style (see `hasStandardBasemap`) rather than a
   * style URL, because the NOAH basemaps are derived styles that merely
   * import Standard.
   *
   * Called on `style.load`, so it covers the initial load and survives
   * `setStyle()` calls, which is what keeps the lighting correct after the
   * playground switches basemap.
   */
  applyStandardConfig(map: mapboxgl.Map) {
    this.configuredMaps.add(map);
    this.applyBasemapToMaps();
  }

  /**
   * Stops tracking a map. Call from a component's `ngOnDestroy` so a destroyed
   * map is not kept alive in memory.
   */
  releaseMap(map: mapboxgl.Map) {
    this.configuredMaps.delete(map);
  }

  /**
   * Immediately switches every registered map to `basemap`.
   *
   * Accepts all four Mapbox Standard presets: `'dawn'`, `'day'`, `'dusk'` or
   * `'night'`. This is the only entry point that changes the lighting; any
   * automatic (time-based) cycling is driven through it by the calling
   * component.
   */
  switchBasemap(basemap: Basemap) {
    if (this.currentBasemap === basemap) {
      return;
    }

    this.basemapSubject.next(basemap);
    this.applyBasemapToMaps();
  }

  /**
   * Selects the lighting mode.
   *
   * `auto` re-lights the map from the Philippine clock; any other value pins
   * the map to that preset. This is the only entry point the controls panel
   * uses, so the manual override and the automatic schedule can never fight
   * over the same state.
   */
  setLighting(selection: LightingSelection) {
    this.lightingSelectionSubject.next(selection);

    if (selection === 'auto') {
      this.applyScheduledBasemap(getBasemapForPhilippineTime());
      return;
    }

    this.switchBasemap(selection);
  }

  /**
   * Records the preset the Philippine clock points at and, while the
   * selection is `auto`, applies it to every registered map.
   */
  private applyScheduledBasemap(scheduled: Basemap) {
    if (scheduled !== this.currentScheduledBasemap) {
      this.scheduledBasemapSubject.next(scheduled);
    }

    if (this.currentLightingSelection === 'auto') {
      this.switchBasemap(scheduled);
    }
  }

  /**
   * Starts the Philippine-Time lighting clock.
   *
   * The preset is applied immediately (so a 3 AM visit opens on `night`, not
   * the static `day` default) and re-checked every minute, so a long-lived
   * tab crosses each dawn / day / dusk / night boundary without a reload. A
   * manual selection still works: the schedule only acts when the
   * Philippine-Time window changes.
   */
  private startLightingClock(): void {
    this.zone.runOutsideAngular(() => {
      this.lightingClockTimer = window.setInterval(() => {
        const scheduled = getBasemapForPhilippineTime();

        // Nothing changed: stay outside Angular so the tick cannot trigger
        // change detection.
        if (scheduled === this.currentScheduledBasemap) {
          return;
        }

        this.zone.run(() => this.applyScheduledBasemap(scheduled));
      }, 60_000);
    });
  }

  /**
   * Writes the current basemap config into every registered Mapbox Standard
   * map. Styles without the Standard `basemap` import are skipped.
   */
  private applyBasemapToMaps() {
    const config = getBasemapConfig(this.currentBasemap);

    this.configuredMaps.forEach((map) => {
      try {
        if (!hasStandardBasemap(map)) {
          return;
        }

        // Mapbox Standard's `light-3d` lights follow the preset, and in
        // mapbox-gl v3 every custom layer that renders in a basemap slot is
        // lit by them: all `*-emissive-strength` paints default to 0, so the
        // night/dawn/dusk ambient+directional lights multiply the layer's
        // literal paint colour. That is what darkens the NOAH hazard fills,
        // rainfall contours and satellite/video rasters per preset. The layers
        // themselves opt out by declaring `*-emissive-strength: 1` when they
        // are created (see `addNoahLayer` in the playground component), which
        // keeps this service purely about the basemap config. Setting the
        // preset below re-lights the basemap itself — exactly the desired
        // behaviour; only the NOAH data is pinned.
        map.setConfig(STANDARD_BASEMAP_IMPORT, config);
      } catch (error) {
        // A `setStyle()` in flight, or a style with no Standard basemap
        // import, must not break the map. Lighting is re-applied on the next
        // `style.load` through `applyStandardConfig`.
        console.warn('Unable to apply the basemap configuration', error);
      }
    });
  }

  /**
   * The geolocation control used by every NOAH map.
   *
   * `showButton: false` hides Mapbox's own button: the location action lives
   * in the NOAH map controls toolbar instead, which triggers the control
   * programmatically (`geolocateControl.trigger()`). The control still draws
   * the user dot and the accuracy circle.
   */
  getNewGeolocateControl() {
    return new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false,
      },
      trackUserLocation: true,
      showButton: false,
    });
  }

  /**
   * Map options shared by every NOAH map for a fast, cache-friendly first load.
   *
   * These are deliberately about *resource behaviour* only — none of them
   * changes the visual output of the basemap or of any NOAH layer — so they are
   * kept in one place instead of drifting between the three map pages
   * (playground, weather updates, know-your-hazards). Spread the result into
   * the `mapboxgl.Map` constructor:
   *
   * ```ts
   * new mapboxgl.Map({
   *   ...this.mapService.getMapPerformanceOptions(),
   *   container: 'map',
   *   // page-specific options …
   * });
   * ```
   *
   * - `renderWorldCopies: false` — NOAH only ever shows the Philippines, so the
   *   horizontal copies of the world that Mapbox renders by default are pure
   *   waste: they request and draw extra basemap tiles on every frame.
   * - `refreshExpiredTiles: false` — Mapbox serves basemap tiles with
   *   short-lived cache directives. Left at the default (`true`) the map
   *   silently re-requests tiles it already holds as they "expire" mid-session,
   *   which is exactly the duplicate traffic that makes an online basemap feel
   *   slower than a local one. The basemap does not change within a session, so
   *   keeping already-downloaded tiles is safe; dynamic NOAH layers are separate
   *   sources and are unaffected.
   * - `maxTileCacheSize: 200` — a bounded increase over the viewport-derived
   *   default (~70 tiles on a 1080p window) so panning back to a previously
   *   viewed area re-uses tiles instead of re-downloading them, while staying
   *   safe on low-memory devices.
   * - `fadeDuration: 100` — shortens the cross-fade from the 300ms default so a
   *   freshly fetched tile becomes legible sooner (the "snap-in" feel) without
   *   reintroducing the flicker the fade exists to hide.
   */
  getMapPerformanceOptions(): Pick<
    mapboxgl.MapOptions,
    | 'renderWorldCopies'
    | 'refreshExpiredTiles'
    | 'maxTileCacheSize'
    | 'fadeDuration'
  > {
    return {
      renderWorldCopies: false,
      refreshExpiredTiles: false,
      maxTileCacheSize: 200,
      fadeDuration: 100,
    };
  }

  /**
   * Adds the custom scale bar to a map.
   *
   * By default the bar sits in the right-hand column below the NOAH map
   * controls toolbar (positioned by CSS via `--noah-map-controls-toolbar-*`).
   * For pages where the toolbar isn't present or where it needs to sit above
   * the map attribution (e.g. KYH and Weather Updates), pass
   * `'bottom-right'` to place it just above the shared attribution.
   * `'bottom-left'` puts the bar in the bottom-left corner of the map, where
   * the page publishes the place of the Mapbox logo it sits above as
   * `--noah-scale-left` and `--noah-scale-bottom`.
   *
   * Sharing one implementation keeps the three map pages (playground, weather
   * updates, know your hazards) from drifting apart.
   */
  attachScaleControl(
    map: mapboxgl.Map,
    position: 'right-top' | 'bottom-right' | 'bottom-left' = 'right-top'
  ): void {
    // Remove any existing custom scale control to avoid duplicates
    const existing = document.getElementById('custom-scale-control');
    if (existing && existing.parentElement) {
      existing.parentElement.removeChild(existing);
    }

    const scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric',
    });

    const container = document.createElement('div');
    container.id = 'custom-scale-control';
    container.dataset.position = position;

    map.getContainer().appendChild(container);

    const scaleEl = scale.onAdd(map);
    container.appendChild(scaleEl);

    // Style adjustments: the number sits above the bar; center it in the background.
    const scaleElem = scaleEl as HTMLElement;
    scaleElem.style.fontSize = '11px';
    scaleElem.style.lineHeight = '14px';
    scaleElem.style.fontWeight = '500';
    scaleElem.style.display = 'flex';
    scaleElem.style.flexDirection = 'column-reverse';
    scaleElem.style.alignItems = 'center';
    scaleElem.style.textAlign = 'center';
    scaleElem.style.color = '#111827';
    scaleElem.style.width = '100%';
    scaleElem.style.gap = '2px';
  }

  // Simple UUID generator (to replace crypto.randomUUID for Angular compatibility)
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Returns the geographic coordinates given a string address
   */
  forwardGeocode(searchText: string) {
    const params = new URLSearchParams({
      q: searchText,
      country: 'ph',
      types: [
        'poi',
        'address',
        'country',
        'block',
        'street',
        'chome',
        'region',
        'district',
        'postcode',
        'place',
        'neighborhood',
        'locality',
        'prefecture',
        'city',
        'oaza',
      ].join(','),
      proximity: '-73.990593,40.740121', // Example: set dynamically based on user location
      session_token: this.sessionToken,
      access_token: environment.mapbox.accessToken,
    });

    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`;

    return this.httpClient.get(url);
  }

  // Retrieve API (needs only mapbox_id + session_token + token)
  retrievePlace(mapboxId: string) {
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
      mapboxId
    )}?session_token=${this.sessionToken}&access_token=${
      environment.mapbox.accessToken
    }`;

    return this.httpClient.get(url);
  }
  /**
   * Returns the string address given the geographic coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=locality&access_token=${environment.mapbox.accessToken}`;
      const response = await this.httpClient.get<any>(api_url).toPromise();
      return response.features[0].place_name;
    } catch (error) {
      console.error(error);
      throw Error('Unable to perform reverse geocoding');
    }
  }

  /**
   * Returns the string address given the geographic coordinates this is applicable for drag marker
   */
  async dragReverseGeocode(lat: number, lng: number) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapbox.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();
      const address = data.features[0].place_name;
      this.addressSubject.next(address);
      return address;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to perform drag reverse geocoding');
    }
  }
}
