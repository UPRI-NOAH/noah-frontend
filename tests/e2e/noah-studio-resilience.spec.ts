import { test, expect, Page } from '../support/test';
import { expectMapReady, knownIssue } from '../support/helpers';
import { MockEndpoint } from '../support/network';
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
 * Records console.error() calls with Error arguments flattened to text.
 * (Firefox reports Error arguments as opaque handles in ConsoleMessage.text(),
 * so the Playwright console event alone is not enough to read Angular's
 * "ERROR Error: Uncaught (in promise): ..." reports.)
 */
async function recordAppErrors(page: Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as any).__noahAppErrors = log;
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      log.push(
        args
          .map((arg) =>
            arg instanceof Error ? `${arg.name}: ${arg.message}` : String(arg)
          )
          .join(' ')
      );
      original(...args);
    };
  });
}

/** Unhandled promise rejections, as reported by Angular's ErrorHandler. */
async function unhandledRejections(page: Page): Promise<string[]> {
  const log: string[] = await page.evaluate(
    () => (window as any).__noahAppErrors ?? []
  );
  return log
    .filter((text) => text.includes('Uncaught (in promise)'))
    .map((text) => text.slice(0, 200));
}

async function openStudio(page: Page) {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
  await expectMapReady(studioMap(page));
}

test('measuring tools work even when the satellite animation cannot be loaded', async ({
  page,
  api,
}) => {
  knownIssue(
    'Mapbox Draw only activates on the map "load" event, which waits for every source – ' +
      'including the Himawari video loops added at start-up even while hidden. If the ' +
      'videos fail to load (outage, unsupported codec) the measuring tools never respond.'
  );
  for (const file of ['ph_himawari', 'ph_hima_gsmap']) {
    api.missingStaticFiles.add(`/api/sat_webm/${file}.webm`);
    api.missingStaticFiles.add(`/api/sat_webm/${file}.mp4`);
  }
  await openStudio(page);
  await measureOnMap(
    page,
    'line',
    [
      [0.55, 0.45],
      [0.7, 0.55],
    ],
    /Total Distance/,
    20_000
  );
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
      'an unhandled promise rejection on every Studio visit.',
  },
  { name: 'the realtime lightning relay', endpoints: ['lightningRelay'] },
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

    expect(await unhandledRejections(page)).toEqual([]);
  });
}
