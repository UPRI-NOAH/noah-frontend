import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import mapboxgl from 'mapbox-gl';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Basemap,
  DEFAULT_BASEMAP,
  getBasemapConfig,
  hasStandardBasemap,
  STANDARD_BASEMAP_IMPORT,
} from '@core/services/standard-style';

/**
 * Shared map configuration plus the Mapbox Standard lighting preset.
 *
 * The preset is shared across every map page so re-lighting is not duplicated
 * per page. This service only *stores* the selection; the playground
 * additionally feeds it a preset derived from the Philippine clock (see
 * `getBasemapForPhilippineTime`), which is why the scheduling lives in the
 * calling component rather than here.
 */
@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor(private httpClient: HttpClient) {}
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

  /** Maps handed to {@link applyStandardConfig} and still alive. */
  private readonly configuredMaps = new Set<mapboxgl.Map>();

  get currentBasemap(): Basemap {
    return this.basemapSubject.value;
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

  getNewGeolocateControl() {
    return new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false,
      },
      trackUserLocation: true,
    });
  }

  getNewAttributionControl() {
    return new mapboxgl.AttributionControl({
      customAttribution:
        '<a href="https://doh.gov.ph" target="_blank">© Department of Health</a>',
    });
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
