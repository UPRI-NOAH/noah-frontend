# NOAH frontend – end-to-end tests

Playwright suite covering every user-facing feature of the NOAH web app. It
runs on every push and pull request (`.github/workflows/playwright.yml`).

## Running

```sh
npm run test:e2e              # build the app, serve on :4300, all projects
E2E_SKIP_BUILD=1 npm run test:e2e   # reuse the existing dist/ build
npm run test:e2e:chromium     # desktop + phone Chromium only (fast local loop)
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:report       # open the last HTML report
npm run test:e2e:live         # live checks against production APIs (see below)
npm run test:e2e:typecheck    # type-check the specs (Playwright only transpiles)

# Against an already running app (ng serve, staging, ...):
E2E_BASE_URL=http://localhost:4200 npx playwright test --project=chromium
```

Projects: `chromium`, `firefox`, `webkit` (1440×900 desktop) run every
`*.spec.ts`; `mobile-chrome` (Pixel 7) and `mobile-safari` (iPhone 14) run the
`*.mobile.spec.ts` files. WebKit needs the system libraries installed by
`npx playwright install --with-deps` (Ubuntu/Debian); on other distros use the
Playwright Docker image:

```sh
docker run --rm -v "$PWD":/work -w /work --ipc=host \
  mcr.microsoft.com/playwright:v1.64.1-noble \
  sh -c 'E2E_SKIP_BUILD=1 npx playwright test --project=webkit --project=mobile-safari'
```

## Markdown report

Every run also writes `test-results/e2e-report.md`
(`support/markdown-reporter.ts`). It lists totals per browser, failures with
their errors and links to traces, flaky tests, known issues and skipped tests.
The file is replaced on each run, so copy it elsewhere (for example
`tests/reports/`) to keep it. In CI the same summary appears on the job's
summary page and is uploaded as the `e2e-report-md-<project>` artifact.

- Different path: `E2E_REPORT_MD=reports/run.md npm run test:e2e`
- A `--reporter=...` flag on the command line replaces the configured
  reporters, so no Markdown file is written for that run.

## Layout

| Path                                                        | What it covers                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/app-shell.spec.ts`                                     | Routing, redirects, titles, PWA manifest/icons/service worker, broken assets, console errors                                                                       |
| `e2e/landing*.spec.ts`, `responsive-layouts.mobile.spec.ts` | Hero, weather shortcuts, Studio CTA, nav, install, footer, phone layouts                                                                                           |
| `e2e/search*.spec.ts`                                       | Location search (Mapbox Search Box), keyboard, current location, search history                                                                                    |
| `e2e/login.spec.ts`                                         | IoT partner login / logout                                                                                                                                         |
| `e2e/know-your-hazards*.spec.ts`                            | Hazard assessment, critical facilities, hazard guides, survival kit, map, draggable pin                                                                            |
| `e2e/weather-updates.spec.ts`                               | Rainfall contours, forecast, temperature, typhoon track                                                                                                            |
| `e2e/noah-studio*.spec.ts`                                  | Studio sidebar, hazard layers & palettes, weather layers, wind, 4As exposure, IoT, restricted layers, measuring tools                                              |
| `e2e/map-controls.spec.ts`                                  | Shared map toolbar (zoom, orientation, location, measuring), Map style panel (Streets / Satellite / Standard), lighting presets and attribution, on all three maps |
| `live/`                                                     | Opt-in contract checks against the real services                                                                                                                   |
| `support/network.ts`                                        | Hermetic network mock for every external host                                                                                                                      |
| `support/mock-data.ts`                                      | Fixture data (places, hazard values, facilities, ...)                                                                                                              |
| `support/test.ts`                                           | Project `test` – installs the mock, fails on uncaught page errors                                                                                                  |

## How the mock works

Every spec imports `test`/`expect` from `support/test.ts`, which routes all
third-party traffic through `NetworkMock`:

- Mapbox gets a blank style, stub TileJSON and 404 tiles, so maps initialise
  without billing map loads to the production token.
- Search, geocoding, tilequery, IoT, panahon and webgis-static data come from
  `mock-data.ts`. The Himawari loops are real (tiny) videos in `fixtures/media/`.
- Unknown hosts are blocked and listed in the `unmocked-requests.txt`
  attachment; `app-shell.spec.ts` fails if any appear.

Inside a test, the `api` fixture lets you shape responses:

```ts
api.fail('tilequeryHazards', 503); // HTTP error
api.abort('iotLogin'); // network failure
api.delay('searchSuggest', 1500); // observe loading states
api.criticalFacilities = []; // change fixture data
api.callsTo('tilequeryHazards'); // inspect requests that were made
```

## Adding tests for a new feature

1. Put the spec next to its feature area (or create `e2e/<feature>.spec.ts`;
   use `.mobile.spec.ts` for phone-only behaviour).
2. If the feature calls a new endpoint, classify it in `NetworkMock.classify`
   and add a fixture – the "third-party traffic" test fails until you do.
3. Prefer user-facing locators (`getByRole`, `getByText`) scoped to the
   feature's Angular component; filter `{ visible: true }` where the app
   renders separate phone and desktop markup.
4. Run `E2E_SKIP_BUILD=1 npm run test:e2e:chromium` locally before pushing.

## Known issues

Tests that document an unfixed defect call `knownIssue('…')`. They keep
asserting the _correct_ behaviour and are reported as expected failures. When
the bug is fixed Playwright reports "expected to fail, but passed" – delete the
`knownIssue` line. List them with `grep -rn knownIssue tests/e2e`.

## Live checks

`npm run test:e2e:live` hits production Mapbox, webgis-static and
noah.up.edu.ph (read-only GETs). CI runs it daily and on manual dispatch, not on
pull requests, so upstream outages never block merges.
