import { test, expect, Page } from '../support/test';
import { expectMapReady, knownIssue } from '../support/helpers';
import { MockEndpoint, NetworkMock } from '../support/network';
import {
  GROUPS,
  groupToggle,
  measureOnMap,
  sidebar,
  studioMap,
} from '../support/studio';

/**
 * NOAH Studio when an upstream service is down. Each outage is configured
 * *before* the first navigation – that is how a user meets it.
 */

/**
 * Records console.error() calls as text, flattening Error-like arguments
 * (Error, HttpErrorResponse, ...) to their message. Firefox reports such
 * arguments as opaque handles in ConsoleMessage.text(), so the Playwright
 * console event alone is not enough.
 */
async function recordAppErrors(page: Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as any).__noahAppErrors = log;
    const original = console.error.bind(console);
    const describe = (arg: any) =>
      arg instanceof Error
        ? `${arg.name}: ${arg.message}`
        : arg && typeof arg === 'object' && 'message' in arg
        ? String(arg.message)
        : String(arg);
    console.error = (...args: unknown[]) => {
      log.push(args.map(describe).join(' '));
      original(...args);
    };
  });
}

/**
 * Errors that reached Angular's global ErrorHandler – which logs them as
 * `console.error('ERROR', error)` – i.e. errors the app did not handle itself
 * (uncaught exceptions inside the zone, unhandled promise rejections). This
 * does not depend on how a given zone.js version words the message.
 */
async function unhandledAppErrors(page: Page): Promise<string[]> {
  const log: string[] = await page.evaluate(
    () => (window as any).__noahAppErrors ?? []
  );
  return log
    .filter((text) => text.startsWith('ERROR'))
    .map((text) => text.slice(0, 200));
}

async function openStudio(page: Page) {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
  await expectMapReady(studioMap(page));
}

const LINE: Array<[number, number]> = [
  [0.55, 0.45],
  [0.7, 0.55],
];

function breakSatelliteVideos(api: NetworkMock) {
  for (const file of ['ph_himawari', 'ph_hima_gsmap']) {
    api.missingStaticFiles.add(`/api/sat_webm/${file}.webm`);
    api.missingStaticFiles.add(`/api/sat_webm/${file}.mp4`);
  }
}

const weatherUpdatesToggle = (page: Page) =>
  GROUPS.weatherUpdates.root(page).getByRole('checkbox').first();

test('measuring keeps working when the satellite animation fails after the map is ready', async ({
  page,
  api,
}) => {
  breakSatelliteVideos(api);
  await openStudio(page);
  // A first measurement proves the map has finished loading.
  await measureOnMap(page, 'distance', LINE, /Total Distance/);
  await page
    .getByRole('button', { name: 'Clear measurements', exact: true })
    .click();

  await weatherUpdatesToggle(page).click();
  await expect.poll(() => api.callsTo('staticVideo').length).toBeGreaterThan(0);
  await measureOnMap(page, 'distance', LINE, /Total Distance/, 15_000);
});

test('measuring works when the satellite layer is switched on while the map is still loading', async ({
  page,
  api,
}) => {
  knownIssue(
    'Mapbox Draw activates on the map "load" event, which waits for every source. ' +
      'Studio adds the Himawari video sources in its idle-time init, before "load", when ' +
      'Weather Updates is already on – so the measuring tools wait for both videos to ' +
      'buffer and never activate if they fail to load.'
  );
  breakSatelliteVideos(api);
  // Hold the tileset metadata back so the map is still loading when the user
  // switches Weather Updates on.
  api.delay('mapboxTileJson', 8_000);
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
  await weatherUpdatesToggle(page).click();
  await expect.poll(() => api.callsTo('staticVideo').length).toBeGreaterThan(0);

  await measureOnMap(page, 'distance', LINE, /Total Distance/, 25_000);
});

const OUTAGES: Array<{
  name: string;
  endpoints: MockEndpoint[];
  knownIssue?: string;
}> = [
  { name: 'the IoT sensor API', endpoints: ['iotSensors'] },
  {
    name: 'the exposure (panahon) API',
    endpoints: ['exposureAffected', 'exposureArchive'],
    knownIssue:
      'RiskAssessmentModalComponent.ngOnInit calls archiveData(), which awaits ' +
      'panahon.up.edu.ph/api/latest-results/ without a try/catch – an outage surfaces as ' +
      'an unhandled error (Angular ErrorHandler) on every Studio visit.',
  },
];

for (const { name, endpoints, knownIssue: issue } of OUTAGES) {
  test(`stays usable when ${name} is unreachable`, async ({ page, api }) => {
    if (issue) knownIssue(issue);
    for (const endpoint of endpoints) api.abort(endpoint);
    await recordAppErrors(page);
    await openStudio(page);

    // The sidebar still responds.
    await groupToggle(page, GROUPS.volcanoes).click();
    await expect(groupToggle(page, GROUPS.volcanoes)).toBeChecked();
    await page.waitForTimeout(1_000);

    expect(await unhandledAppErrors(page)).toEqual([]);
  });
}
