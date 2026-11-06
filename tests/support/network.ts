import type {
  BrowserContext,
  Request,
  Route,
  WebSocketRoute,
} from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  AFFECTED_BARANGAYS,
  ALL_PLACES,
  ARCHIVE_RESULTS,
  CRITICAL_FACILITIES,
  DEFAULT_CENTER,
  DEFAULT_HAZARDS,
  EMPTY_FEATURE_COLLECTION,
  EMPTY_GLYPH_RANGE_PBF,
  HAZARDS_BY_PLACE,
  HazardFixture,
  IOT_ACCOUNTS,
  IOT_PASSWORD,
  LngLat,
  MockFacility,
  MockPlace,
  RAINFALL_DATETIME_TEXT,
  REVERSE_GEOCODE_PLACE_NAME,
  STUDIO_AFFECTED_POPULATION_TILESETS,
  STUDIO_HAZARD_TILESETS,
  TRANSPARENT_PNG,
  criticalFacilitiesFeatureCollection,
  hazardFeatureCollection,
  retrieveResponse,
  searchSuggestions,
  stubMapStyle,
  stubTileJson,
} from './mock-data';

/**
 * Every third-party endpoint the NOAH frontend talks to, grouped by purpose.
 * Specs use these names to override, fail, delay or inspect traffic.
 */
export type MockEndpoint =
  | 'mapboxStyle'
  | 'mapboxTileJson'
  | 'mapboxTile'
  | 'mapboxFonts'
  | 'mapboxSprite'
  | 'mapboxTelemetry'
  | 'mapboxAssets'
  | 'searchSuggest'
  | 'searchRetrieve'
  | 'reverseGeocode'
  | 'tilequeryHazards'
  | 'tilequeryFacilities'
  | 'iotLogin'
  | 'iotSensors'
  | 'exposureAffected'
  | 'exposureArchive'
  | 'staticImage'
  | 'staticVideo'
  | 'staticData'
  | 'legacySensors'
  | 'lightningRelay'
  | 'lightningSocket'
  | 'analytics'
  | 'webFonts'
  | 'unmocked';

export interface RecordedCall {
  endpoint: MockEndpoint;
  url: URL;
  method: string;
  postData: string | null;
}

type Responder = (
  route: Route,
  request: Request,
  url: URL
) => Promise<void> | void;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Playable one-frame videos standing in for the Himawari loops (see tests/fixtures/media). */
const MEDIA_DIR = join(__dirname, '..', 'fixtures', 'media');
const BLANK_VIDEO = {
  webm: readFileSync(join(MEDIA_DIR, 'blank.webm')),
  mp4: readFileSync(join(MEDIA_DIR, 'blank.mp4')),
};

function nearlyEqual([lngA, latA]: LngLat, [lngB, latB]: LngLat) {
  return Math.abs(lngA - lngB) < 1e-3 && Math.abs(latA - latB) < 1e-3;
}

/** Parses ".../{lng},{lat}.json" at the end of a Mapbox URL path. */
function coordinatesFromPath(pathname: string): LngLat | null {
  const match = decodeURIComponent(pathname).match(
    /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\.json$/
  );
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/**
 * Hermetic network layer for the NOAH frontend.
 *
 * - Mapbox GL gets a blank style, empty TileJSON and 404 tiles. Maps still
 *   load and fire their `load`/`style.load` events, but no map loads are
 *   billed to the production token and runs don't depend on Mapbox uptime.
 * - Search, geocoding, tilequery, IoT, exposure and static NOAH data are
 *   answered with fixtures from mock-data.ts.
 * - Any other third-party request is aborted and listed in `unmocked`
 *   (attached to the test report) so new integrations are easy to spot.
 */
export class NetworkMock {
  readonly calls: RecordedCall[] = [];
  readonly unmocked: string[] = [];
  /** Mocked sockets of the realtime lightning relay (wss://ulap-api.up.edu.ph/ws/). */
  readonly lightningSockets: WebSocketRoute[] = [];

  /** Places known to the search mock. */
  places: MockPlace[] = [...ALL_PLACES];
  /** Hazard values returned for an unknown point (incl. the default map centre). */
  defaultHazards: HazardFixture = { ...DEFAULT_HAZARDS };
  /** Hazard values per place, keyed by mapboxId. */
  hazardsByPlace: Record<string, HazardFixture> = { ...HAZARDS_BY_PLACE };
  criticalFacilities: MockFacility[] = [...CRITICAL_FACILITIES];
  affectedBarangays = [...AFFECTED_BARANGAYS];
  /** Static files that should respond with a 404 (e.g. a missing typhoon feed). */
  readonly missingStaticFiles = new Set<string>();

  private readonly overrides = new Map<MockEndpoint, Responder>();
  private readonly delays = new Map<MockEndpoint, number>();

  constructor(
    private readonly context: BrowserContext,
    private readonly appOrigin: string
  ) {}

  async install(): Promise<void> {
    await this.context.route(
      (url) => /^https?:$/.test(url.protocol) && url.origin !== this.appOrigin,
      (route, request) => this.handle(route, request)
    );

    // WebSockets bypass page.route(). Refuse unknown third-party sockets...
    const appHost = new URL(this.appOrigin).host;
    await this.context.routeWebSocket(
      (url) => url.host !== appHost,
      (ws) => {
        this.unmocked.push(`WS ${ws.url()}`);
        void ws.close({ code: 1008, reason: 'blocked by e2e network mock' });
      }
    );
    // ...but keep a fake realtime lightning relay that specs can push strikes to.
    // (Registered last so it takes precedence over the catch-all above.)
    await this.context.routeWebSocket(
      /^wss?:\/\/ulap-api\.up\.edu\.ph\//,
      (ws) => {
        this.lightningSockets.push(ws);
        this.calls.push({
          endpoint: 'lightningSocket',
          url: new URL(ws.url()),
          method: 'WEBSOCKET',
          postData: null,
        });
        ws.onMessage(() => undefined); // swallow keep-alive pings
      }
    );
  }

  // -- Public helpers used by specs -----------------------------------------

  /** Replace the response of an endpoint for the remainder of the test. */
  override(endpoint: MockEndpoint, responder: Responder): void {
    this.overrides.set(endpoint, responder);
  }

  /** Make an endpoint fail with the given HTTP status. */
  fail(endpoint: MockEndpoint, status = 500): void {
    this.override(endpoint, (route, request) =>
      route.fulfill({
        status,
        headers: this.corsHeaders(request),
        json: { message: 'Simulated failure from the e2e network mock' },
      })
    );
  }

  /** Make the network itself fail (connection refused) for an endpoint. */
  abort(endpoint: MockEndpoint): void {
    this.override(endpoint, (route) => route.abort('connectionrefused'));
  }

  /** Hold responses for an endpoint, e.g. to observe loading states. */
  delay(endpoint: MockEndpoint, ms: number): void {
    this.delays.set(endpoint, ms);
  }

  /** Restore the default fixture response (and no delay) for an endpoint. */
  reset(endpoint: MockEndpoint): void {
    this.overrides.delete(endpoint);
    this.delays.delete(endpoint);
  }

  callsTo(endpoint: MockEndpoint): RecordedCall[] {
    return this.calls.filter((call) => call.endpoint === endpoint);
  }

  /** Hazard fixture that the tilequery mock will return for `place`. */
  hazardsFor(place: MockPlace): HazardFixture {
    return this.hazardsByPlace[place.mapboxId] ?? this.defaultHazards;
  }

  // -- Routing ----------------------------------------------------------------

  private async handle(route: Route, request: Request): Promise<void> {
    const url = new URL(request.url());
    const endpoint = this.classify(url);
    this.calls.push({
      endpoint,
      url,
      method: request.method(),
      postData: request.postData(),
    });

    if (request.method() === 'OPTIONS') {
      // CORS preflight (e.g. JSON POST to the IoT login endpoint).
      await route.fulfill({ status: 204, headers: this.corsHeaders(request) });
      return;
    }

    const delay = this.delays.get(endpoint);
    if (delay) await sleep(delay);

    const responder =
      this.overrides.get(endpoint) ?? this.defaultResponder(endpoint);
    try {
      await responder(route, request, url);
    } catch (error) {
      // The page may have navigated away while a delayed response was pending.
      if (!String(error).includes('Route is already handled')) {
        await route.abort().catch(() => undefined);
      }
    }
  }

  private classify(url: URL): MockEndpoint {
    const { hostname, pathname } = url;

    if (hostname === 'api.mapbox.com') {
      if (pathname.startsWith('/styles/v1/')) {
        return pathname.includes('/sprite') ? 'mapboxSprite' : 'mapboxStyle';
      }
      if (pathname.startsWith('/fonts/v1/')) return 'mapboxFonts';
      if (pathname.startsWith('/search/searchbox/v1/suggest')) {
        return 'searchSuggest';
      }
      if (pathname.startsWith('/search/searchbox/v1/retrieve')) {
        return 'searchRetrieve';
      }
      if (pathname.startsWith('/geocoding/v5/')) return 'reverseGeocode';
      if (pathname.startsWith('/v4/') && pathname.includes('/tilequery/')) {
        return pathname.includes('schools_tls')
          ? 'tilequeryFacilities'
          : 'tilequeryHazards';
      }
      if (/^\/v4\/[^/]+\.json$/.test(pathname)) return 'mapboxTileJson';
      if (pathname.startsWith('/v4/') || pathname.startsWith('/raster/')) {
        return 'mapboxTile';
      }
      if (pathname.startsWith('/map-sessions/')) return 'mapboxTelemetry';
      if (pathname.startsWith('/mapbox-gl-js/')) return 'mapboxAssets';
      return 'unmocked';
    }
    if (hostname === 'events.mapbox.com') return 'mapboxTelemetry';

    if (hostname === 'webgis-static.up.edu.ph') {
      if (/\.(png|jpe?g|webp)$/i.test(pathname)) return 'staticImage';
      if (/\.(webm|mp4)$/i.test(pathname)) return 'staticVideo';
      return 'staticData';
    }
    if (hostname === 'iot-noah.up.edu.ph') {
      return pathname.startsWith('/login') ? 'iotLogin' : 'iotSensors';
    }
    if (hostname === 'panahon.up.edu.ph') {
      return pathname.startsWith('/affected_brgy')
        ? 'exposureAffected'
        : 'exposureArchive';
    }
    if (hostname === 'noah-api.up.edu.ph') return 'legacySensors';
    if (hostname === 'ulap-api.up.edu.ph') return 'lightningRelay';

    if (
      hostname.endsWith('googletagmanager.com') ||
      hostname.endsWith('google-analytics.com') ||
      hostname.endsWith('analytics.google.com') ||
      hostname.endsWith('doubleclick.net')
    ) {
      return 'analytics';
    }
    if (
      hostname === 'fonts.googleapis.com' ||
      hostname === 'fonts.gstatic.com'
    ) {
      return 'webFonts';
    }
    return 'unmocked';
  }

  private corsHeaders(request: Request): Record<string, string> {
    const origin = request.headers()['origin'];
    return {
      'access-control-allow-origin': origin || '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers':
        request.headers()['access-control-request-headers'] ||
        'content-type, authorization',
      vary: 'Origin',
      // Never let the browser cache a fixture: specs change responses between
      // navigations (e.g. api.missingStaticFiles + reload).
      'cache-control': 'no-store',
    };
  }

  private json(route: Route, request: Request, body: unknown, status = 200) {
    return route.fulfill({
      status,
      headers: this.corsHeaders(request),
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  }

  private defaultResponder(endpoint: MockEndpoint): Responder {
    switch (endpoint) {
      case 'mapboxStyle':
        return (route, request, url) =>
          this.json(
            route,
            request,
            // /styles/v1/<owner>/<id> -> "<owner>/<id>"
            stubMapStyle(url.pathname.split('/').slice(3, 5).join('/'))
          );

      case 'mapboxSprite':
        return (route, request, url) =>
          url.pathname.endsWith('.json')
            ? this.json(route, request, {})
            : route.fulfill({
                headers: this.corsHeaders(request),
                contentType: 'image/png',
                body: TRANSPARENT_PNG,
              });

      case 'mapboxTileJson':
        return (route, request, url) => {
          const ids = decodeURIComponent(
            url.pathname.replace(/^\/v4\//, '').replace(/\.json$/, '')
          );
          const isRaster = /terrain-dem|satellite|raster/.test(ids);
          return this.json(route, request, stubTileJson(ids, isRaster));
        };

      case 'mapboxTile':
        // Mapbox GL silently ignores 404 tiles, which keeps the console clean.
        return (route, request) =>
          route.fulfill({ status: 404, headers: this.corsHeaders(request) });

      case 'mapboxFonts':
        return (route, request) =>
          route.fulfill({
            headers: this.corsHeaders(request),
            contentType: 'application/x-protobuf',
            body: EMPTY_GLYPH_RANGE_PBF,
          });

      case 'mapboxTelemetry':
      case 'analytics':
        return (route, request, url) =>
          url.pathname.endsWith('.js') ||
          url.hostname.endsWith('googletagmanager.com')
            ? route.fulfill({
                headers: this.corsHeaders(request),
                contentType: 'text/javascript',
                body: '/* stubbed by e2e network mock */',
              })
            : route.fulfill({
                status: 204,
                headers: this.corsHeaders(request),
              });

      case 'mapboxAssets':
      case 'webFonts':
        return (route, request, url) =>
          url.hostname === 'fonts.gstatic.com'
            ? route.fulfill({ status: 404, headers: this.corsHeaders(request) })
            : route.fulfill({
                headers: this.corsHeaders(request),
                contentType: 'text/css',
                body: '/* stubbed by e2e network mock */',
              });

      case 'searchSuggest':
        return (route, request, url) =>
          this.json(
            route,
            request,
            searchSuggestions(url.searchParams.get('q') ?? '', this.places)
          );

      case 'searchRetrieve':
        return (route, request, url) => {
          const id = decodeURIComponent(url.pathname.split('/').pop() ?? '');
          const place = this.places.find((p) => p.mapboxId === id);
          return this.json(
            route,
            request,
            place
              ? retrieveResponse(place)
              : { type: 'FeatureCollection', features: [] }
          );
        };

      case 'reverseGeocode':
        return (route, request) =>
          this.json(route, request, {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                place_name: REVERSE_GEOCODE_PLACE_NAME,
                text: 'Diliman',
              },
            ],
          });

      case 'tilequeryHazards':
        return (route, request, url) => {
          const coords = coordinatesFromPath(url.pathname) ?? DEFAULT_CENTER;
          const place = this.places.find((p) =>
            nearlyEqual(p.coordinates, coords)
          );
          const fixture = place ? this.hazardsFor(place) : this.defaultHazards;
          return this.json(
            route,
            request,
            hazardFeatureCollection(fixture, coords)
          );
        };

      case 'tilequeryFacilities':
        return (route, request, url) => {
          const coords = coordinatesFromPath(url.pathname) ?? DEFAULT_CENTER;
          return this.json(
            route,
            request,
            criticalFacilitiesFeatureCollection(this.criticalFacilities, coords)
          );
        };

      case 'iotLogin':
        return (route, request) => {
          let body: { username?: string; password?: string } = {};
          try {
            body = JSON.parse(request.postData() || '{}');
          } catch {
            // fall through to 401
          }
          const known = Object.values(IOT_ACCOUNTS).some(
            (account) => account.username === body.username
          );
          return known && body.password === IOT_PASSWORD
            ? this.json(route, request, { token: 'e2e-token' })
            : this.json(
                route,
                request,
                { detail: 'Invalid username or password' },
                401
              );
        };

      case 'iotSensors':
      case 'legacySensors':
        return (route, request) =>
          this.json(route, request, EMPTY_FEATURE_COLLECTION);

      case 'exposureAffected':
        return (route, request, url) => {
          const search = (url.searchParams.get('search') ?? '').toLowerCase();
          const results = this.affectedBarangays.filter((row) =>
            [row.brgy, row.muni, row.prov].some((value) =>
              value.toLowerCase().includes(search)
            )
          );
          return this.json(route, request, {
            count: results.length,
            next: null,
            previous: null,
            results,
          });
        };

      case 'exposureArchive':
        return (route, request) => this.json(route, request, ARCHIVE_RESULTS);

      case 'lightningRelay':
        // /api/lightning/start/ and /api/lightning/stop/
        return (route, request) => this.json(route, request, { status: 'ok' });

      case 'staticImage':
        return (route, request, url) =>
          this.missingStaticFiles.has(url.pathname)
            ? route.fulfill({ status: 404, headers: this.corsHeaders(request) })
            : route.fulfill({
                headers: this.corsHeaders(request),
                contentType: 'image/png',
                body: TRANSPARENT_PNG,
              });

      case 'staticVideo':
        return (route, request, url) => {
          if (this.missingStaticFiles.has(url.pathname)) {
            return route.fulfill({
              status: 404,
              headers: this.corsHeaders(request),
            });
          }
          const isMp4 = url.pathname.endsWith('.mp4');
          return route.fulfill({
            headers: { ...this.corsHeaders(request), 'accept-ranges': 'bytes' },
            contentType: isMp4 ? 'video/mp4' : 'video/webm',
            body: isMp4 ? BLANK_VIDEO.mp4 : BLANK_VIDEO.webm,
          });
        };

      case 'staticData':
        return (route, request, url) => this.staticData(route, request, url);

      case 'unmocked':
      default:
        return (route, request) => {
          this.unmocked.push(`${request.method()} ${request.url()}`);
          return route.abort('blockedbyclient');
        };
    }
  }

  private staticData(route: Route, request: Request, url: URL) {
    const path = url.pathname;
    if (this.missingStaticFiles.has(path)) {
      return route.fulfill({ status: 404, headers: this.corsHeaders(request) });
    }
    if (path.endsWith('/hazards/ph_combined_tileset.json')) {
      return this.json(route, request, STUDIO_HAZARD_TILESETS);
    }
    if (path.endsWith('/4As/combined_fl_bgy.json')) {
      return this.json(route, request, STUDIO_AFFECTED_POPULATION_TILESETS);
    }
    if (path.endsWith('/4As/affected_psgc.json')) {
      return this.json(route, request, []);
    }
    if (path.includes('/wind/')) {
      return this.json(route, request, { points: [] });
    }
    if (path.endsWith('/rainfall/datetime.txt')) {
      return route.fulfill({
        headers: this.corsHeaders(request),
        contentType: 'text/plain',
        body: RAINFALL_DATETIME_TEXT,
      });
    }
    if (/\.(geo)?json$/.test(path)) {
      return this.json(route, request, EMPTY_FEATURE_COLLECTION);
    }
    this.unmocked.push(`${request.method()} ${request.url()}`);
    return route.fulfill({ status: 404, headers: this.corsHeaders(request) });
  }
}
