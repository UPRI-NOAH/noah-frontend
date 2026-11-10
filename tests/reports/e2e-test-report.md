# NOAH Frontend – End-to-End Test Report

**Date:** 6 November 2026, 17:42 (17 min) · **Branch:** `qa/staging-2026` (Angular 21, mapbox-gl 3)
**Tool:** Playwright 1.64.1 · **Browsers:** Chromium, Firefox, WebKit (Safari engine), Pixel 7 (Chrome) and iPhone 14 (Safari)

---

## Summary

This is the first run of the new automated end-to-end suite. It covers every
user-facing feature of the web app.

| Test runs |  Passed | Defects found        | Unexpected failures | Release blockers | Skipped |
| --------: | ------: | -------------------- | ------------------: | ---------------: | ------: |
|   **727** | **691** | **11** (33 results¹) |               **0** |            **2** |       3 |

¹ Each defect fails on all three desktop browsers: Chromium, Firefox and WebKit.

- **All features work end to end** on all five browsers and devices, apart from the 11 defects below.
- **The 11 defects reproduce identically** on Chromium, Firefox and WebKit, so they are app bugs, not browser quirks. One is a **safety issue**: Know Your Hazards tells residents their hazard is "little to none" when the hazard service is down.
- **Phone layouts pass** on both Android (Pixel 7) and iPhone 14.
- **Two issues block a release:** the production build fails, and the production Mapbox token is empty on the branch (a fix is pending merge). Both are explained below.
- **The suite is wired into GitHub Actions** for every push and pull request. Tests start running there once B1 is fixed.

---

## What was tested

247 scenarios: 233 run on each desktop browser, 14 phone-layout scenarios run on
each phone profile.

| Area                          | Scenarios | Covers                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | --------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell                     |        26 | Routing and redirects, page titles, PWA manifest, icons and splash screens, broken assets, console errors, third-party traffic                                                                                                                                                                                                                                             |
| Landing page                  |        23 | Hero search, weather shortcuts, NOAH Studio links, navigation (Donate / Blog / Downloads / Install / Login), footer                                                                                                                                                                                                                                                        |
| Location search               |        30 | Mapbox suggestions, debounce, loading state, keyboard navigation, current location, API failures, **search history** (record, order, 5-item cap, 5-day expiry, remove, corrupt storage, shared across pages)                                                                                                                                                               |
| Login                         |        13 | QC / Laguna / dev accounts, invalid credentials, service down, sign-out, signed-in state                                                                                                                                                                                                                                                                                   |
| Know Your Hazards             |        37 | Flood / landslide / storm-surge assessment for several locations, loading and failure states, critical facilities, hazard guides and survival kit, hazard legend, draggable pin                                                                                                                                                                                            |
| Weather Updates               |        22 | Rainfall 1–24 h and forecast, opacity, temperature with forecast days, typhoon track and satellite, pin                                                                                                                                                                                                                                                                    |
| NOAH Studio                   |        55 | Sidebar and defaults, flood / landslide / storm-surge layers, colour palettes and custom colours, 3D terrain, temperature, volcanoes, critical facilities, satellite, typhoon tracks, rainfall contours, wind animation, Flood Impact Forecast (4As), IoT and partner-only layers (river basins, administrative boundaries), measuring tools, behaviour during API outages |
| Map controls (all three maps) |        25 | Zoom, compass, my location, measuring buttons, Map style panel (Streets / Satellite / **Standard**), lighting presets incl. automatic Philippine-time lighting, attribution                                                                                                                                                                                                |
| Bibliography                  |         2 | References and navigation                                                                                                                                                                                                                                                                                                                                                  |
| Phone layouts                 |        14 | Hamburger menu, app-store redirects, Know Your Hazards and Weather Updates bottom sheets, Studio drawer                                                                                                                                                                                                                                                                    |

### How the tests run

- **The real app, built and served** the way Netlify serves it. Tests drive real browsers like a user would.
- **Every external service is simulated**: Mapbox, NOAH static data, IoT, panahon. Results are repeatable, runs never bill Mapbox map loads, and tests can simulate outages on demand. The test data is clearly fake ("Sample General Hospital").
- **CI** (`.github/workflows/playwright.yml`): each browser runs in parallel on every push and pull request, after a type-check and a production build. Reports are uploaded as artifacts. Until release blocker B1 is fixed, CI stops at the production-build step.
- **Defect tests** are marked `knownIssue()`. They assert the correct behaviour and are reported as "expected to fail". When a fix lands, Playwright flags the test as passing; delete the marker and it becomes a regression guard.

---

## Results

| Browser / device   | Scenarios |  Passed | Defects (expected failures) | Unexpected failures | Skipped |
| ------------------ | --------: | ------: | --------------------------: | ------------------: | ------: |
| Chromium           |       233 |     221 |                          11 |                   0 |       1 |
| Firefox            |       233 |     221 |                          11 |                   0 |       1 |
| WebKit (Safari)    |       233 |     221 |                          11 |                   0 |       1 |
| Pixel 7 (Chrome)   |        14 |      14 |                           0 |                   0 |       0 |
| iPhone 14 (Safari) |        14 |      14 |                           0 |                   0 |       0 |
| **Total**          |   **727** | **691** |                      **33** |               **0** |   **3** |

**Stability:** no test failed unexpectedly and none were flaky.

**Skipped:** the service-worker check, which only applies to production builds.
This run used the development build because of release blocker B1.

**HTML report:** `npx playwright show-report` opens the full results for all five
browsers. Type `p:<project>` in the search box (for example `p:mobile-safari`)
to filter by browser.

---

## Defects

### D1 – A hazard-service outage is reported as "little to none" hazard · **High (safety)**

- **Steps:** Open Know Your Hazards while the Mapbox Tilequery API is unavailable (in DevTools, block `api.mapbox.com/v4/*/tilequery`).
- **Expected:** "Unavailable", or a message saying the assessment could not be loaded.
- **Actual:** Flood, Landslide and Storm Surge all show **little to none**.
- **Cause:** `HazardsService.getFeatureInfo` turns HTTP errors into `null`, and `_formatRiskLevel` maps `null` to `'little to none'` (`know-your-hazards/services/hazards.service.ts`).
- **Fix:** Treat a failed request as `'unavailable'` (the "not yet complete" caption already exists) or show a retry message.
- **Test:** `know-your-hazards.spec.ts` › does not report "little to none" when the assessment request fails.

### D2 – One failed facilities lookup empties "Critical Facilities Near You" until reload · Medium

- **Steps:** Open Know Your Hazards with the facilities lookup failing, then search another place.
- **Expected:** Facilities for the new place.
- **Actual:** The list stays empty. The console shows `TypeError: Cannot read properties of null (reading 'features')`.
- **Cause:** `critical-facilities-kyh.component.ts` reads `featureCollection.features` without a null check; the error ends the subscription.
- **Fix:** Map `null` to an empty list, or add `catchError` so the stream survives.
- **Test:** `know-your-hazards.spec.ts` › recovers after a failed facilities lookup.

### D3 – Measuring tools can stay disabled when the satellite animation fails · Medium

- **Steps:** In NOAH Studio, switch Weather Updates on while the map is still loading (slow connection) while the Himawari videos are unavailable. Then click **Measure distance** and draw.
- **Expected:** The distance is measured.
- **Actual:** Nothing happens. On a slow but working connection, the tools only start once both satellite videos have buffered.
- **Cause:** Mapbox Draw activates on the map's `load` event, which waits for every source. Studio's idle-time init adds the video sources before `load` when Weather Updates is already on (`map-playground.component.ts`).
- **Fix:** Add the video sources after `map.once('load')`, or activate Draw on `style.load`.
- **Test:** `noah-studio-resilience.spec.ts` › measuring works when the satellite layer is switched on while the map is still loading.

### D4 – Clicking "Map style" with a mouse closes the panel · Medium

- **Steps:** On desktop, move the mouse onto the **Map style** button (the panel opens), then click it.
- **Expected:** The panel stays open.
- **Actual:** The panel closes. Keyboard users are not affected.
- **Cause:** The panel opens on hover (`onStyleButtonEnter`). The click then calls `togglePanel()` on an already-open panel, which closes it (`shared/components/map-controls`).
- **Fix:** In `togglePanel()`, pin a hover-opened panel instead of closing it.
- **Test:** `map-controls.spec.ts` › a mouse click on "Map style" opens the panel.

### D5 – NOAH Studio raises an unhandled error when the panahon API is down · Medium

- **Steps:** Block `panahon.up.edu.ph`, then open NOAH Studio.
- **Expected:** No unhandled errors. The exposure summary explains that data is unavailable.
- **Actual:** `ERROR Http failure response for https://panahon.up.edu.ph/api/latest-results/` reaches Angular's error handler on every visit.
- **Cause:** `RiskAssessmentModalComponent.ngOnInit` calls `archiveData()`, which awaits the request without `try/catch`.
- **Fix:** Wrap `archiveData()` in `try/catch`, as `loadData()` already is.
- **Test:** `noah-studio-resilience.spec.ts` › stays usable when the exposure (panahon) API is unreachable.

### D6 – Signed-in users who open `/login` still see the login dialog · Medium

- **Steps:** Log in, then open `/login`.
- **Expected:** Redirect to the home page without a dialog.
- **Actual:** The page redirects to `/`, but **Login Your Account** is shown, and submitting it does nothing.
- **Cause:** `LoginComponent.ngOnInit` redirects, then opens the modal anyway because the URL still contains `login`.
- **Fix:** Return immediately after the redirect.
- **Test:** `login.spec.ts` › visiting /login while signed in skips the dialog.

### D7 – Lighting hint refers to a non-existent "Light" basemap · Low

- **Steps:** Open **Map style** and choose Streets or Satellite.
- **Actual:** The hint reads "Select the Light basemap", but the basemap is labelled **Standard**.
- **Fix:** Change the `lightingStatus` text in `map-controls.component.ts`.
- **Test:** `map-controls.spec.ts` › explains which basemap supports lighting.

### D8 – Dragging the pin geocodes the same point twice · Low (cost)

- **Steps:** In Know Your Hazards, drag the pin and watch the Network tab.
- **Actual:** Two identical Mapbox reverse-geocoding requests per drag.
- **Cause:** The `dragend` handler in `map-kyh.component.ts` calls `dragReverseGeocode` twice.
- **Fix:** Reuse the first result. This halves the geocoding cost of pin drags.
- **Test:** `know-your-hazards-map.spec.ts` › reverse geocodes a dragged point only once.

### D9 – Weather shortcuts have no accessible name · Low (accessibility)

- **Actual:** The Rainfall / Typhoon Track / Temperature icons on the landing page are announced only as "button".
- **Cause:** Icon-only `<a role="button">` elements; the visible labels sit in a sibling `<span>` (`landing-page.component.html`).
- **Fix:** Add an `aria-label` to each shortcut (WCAG 4.1.2).
- **Test:** `landing.spec.ts` › shortcut icons expose an accessible name.

### D10 – App Store badge is announced as "get it on google play" · Low (accessibility)

- **Cause:** Both footer badges use `aria-label="get it on google play"` (`footer.component.html`).
- **Fix:** Label the first badge "Download on the App Store".
- **Test:** `landing.spec.ts` › app store badges have distinct accessible names.

### D11 – Footer contact link is not a valid e-mail address · Low

- **Actual:** `mailto: resilience.institute at up.edu.ph`. Mail clients can't send to it.
- **Fix:** `mailto:resilience.institute@up.edu.ph`.
- **Test:** `landing.spec.ts` › the contact e-mail link is a valid mailto address.

---

## Other observations

- **Double style download:** Mapbox GL v3 downloads each map style twice when the basemap is switched, because its style diff falls back to a full reload. `map.setStyle(url, { diff: false })` avoids the extra request.
- **Unlabelled palette buttons:** the Studio colour swatches have no accessible names (colour and ✓ only).
- **Nested interactive elements:** search-history rows are `role="button"` elements containing a second button (Remove). Screen readers handle this poorly.
- **Dormant lightning code:** the lightning code remains in `map-playground.component.ts` with its init commented out. If it is re-enabled, the suite will flag its WebSocket connection as unexpected traffic.

## Scope and limitations

- **No visual check of map tiles:** basemap rendering isn't checked pixel by pixel. The tests use a blank stand-in basemap and verify the app's behaviour around the map: layers, controls, requests and readouts.
- **Live checks not part of this run:** contracts with the real services are covered by a separate, opt-in suite (`npm run test:e2e:live`, scheduled daily in CI). It includes a check that the production token is set, so run it once the B2 fix is merged.
- **Safari ran in a container:** WebKit and iPhone 14 need Ubuntu/Debian system libraries, which the QA workstation (Arch Linux) lacks. They ran in the official Playwright Docker image (Ubuntu), the same environment GitHub Actions uses. Chromium, Firefox and Pixel 7 ran directly on the workstation.
- **Phone coverage is limited:** the 14 phone scenarios cover navigation, the Know Your Hazards and Weather Updates bottom sheets and the Studio drawer. Several phone-only screens are not tested yet: the Weather Updates rainfall cards, legends and temperature controls; the Studio layer toggles inside the drawer; the map toolbar and "Map style" panel on touch screens; the collapsed attribution on narrow screens; and login from the phone menu.

## Running the tests

```sh
npm ci
npx playwright install --with-deps      # first time only
npm run test:e2e:chromium              # Chromium desktop + phone (fast)
npm run test:e2e                       # all browsers
npm run test:e2e:report                # open the HTML report
```

WebKit and iPhone 14 need Ubuntu/Debian system libraries. On other Linux
distributions (e.g. Arch), run them in the Playwright Docker image:

```sh
docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp -e E2E_SKIP_BUILD=1 \
  -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.64.1-noble \
  node node_modules/@playwright/test/cli.js test --project=webkit --project=mobile-safari --workers=2
```

Details: `tests/README.md`.

## Requested actions

1. **Prioritise D1** (safety), then D2–D6.
2. **Delete the matching `knownIssue(...)` line** when fixing a defect. CI will confirm the fix.
