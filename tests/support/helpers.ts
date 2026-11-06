import { expect, Locator, Page, test } from '@playwright/test';
import {
  IOT_ACCOUNTS,
  MockPlace,
  SEARCH_HISTORY_STORAGE_KEY,
  historyEntry,
} from './mock-data';

// ---------------------------------------------------------------------------
// Search component (src/app/shared/components/search)
// ---------------------------------------------------------------------------

/**
 * The visible `noah-search` instance. Several pages render one search box
 * for phones and another for desktop and hide one with CSS, so always scope
 * to the instance the user can actually see.
 */
export function searchBox(page: Page): Locator {
  return page
    .locator('noah-search')
    .filter({
      has: page.getByPlaceholder('Search Location').filter({ visible: true }),
    })
    .first();
}

export function searchInput(page: Page): Locator {
  return searchBox(page).getByPlaceholder('Search Location');
}

/** A suggestion row returned by the Mapbox Search Box mock. */
export function suggestion(page: Page, place: MockPlace): Locator {
  return searchBox(page)
    .locator('div[tabindex="0"]')
    .filter({ has: page.getByText(place.address, { exact: true }) });
}

export function currentLocationOption(page: Page): Locator {
  return searchBox(page).getByText('Your Current Location');
}

export function historyItems(page: Page): Locator {
  return searchBox(page).getByTestId('search-history-item');
}

/** Types a query and waits for the matching suggestion to be offered. */
export async function searchFor(
  page: Page,
  query: string,
  expected: MockPlace
) {
  await searchInput(page).click();
  await searchInput(page).fill(query);
  await expect(suggestion(page, expected)).toBeVisible();
}

/** Searches for a place and picks it from the dropdown. */
export async function searchAndSelect(page: Page, place: MockPlace) {
  await searchFor(page, place.name, place);
  await suggestion(page, place).click();
}

// ---------------------------------------------------------------------------
// Browser storage seeding
// ---------------------------------------------------------------------------

/**
 * Writes localStorage entries before the app boots. Runs only on the first
 * document of the tab, so later reloads (e.g. logout) see the app's own
 * writes instead of being re-seeded.
 */
export async function seedLocalStorage(
  page: Page,
  entries: Record<string, string>
): Promise<void> {
  await page.addInitScript((values: Record<string, string>) => {
    const guard = '__noah_e2e_seeded__';
    if (window.sessionStorage.getItem(guard)) return;
    for (const [key, value] of Object.entries(values)) {
      window.localStorage.setItem(key, value);
    }
    window.sessionStorage.setItem(guard, '1');
  }, entries);
}

export async function seedSearchHistory(
  page: Page,
  entries: Array<{ place: MockPlace; ageMs: number }> | unknown
): Promise<void> {
  const now = Date.now();
  const value = Array.isArray(entries)
    ? entries.map((entry) =>
        entry && typeof entry === 'object' && 'place' in entry
          ? historyEntry(entry.place, now - entry.ageMs)
          : entry
      )
    : entries;
  await seedLocalStorage(page, {
    [SEARCH_HISTORY_STORAGE_KEY]:
      typeof value === 'string' ? value : JSON.stringify(value),
  });
}

export async function readSearchHistory(page: Page): Promise<any[]> {
  return page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) || '[]'),
    SEARCH_HISTORY_STORAGE_KEY
  );
}

/** Puts the browser in the state LoginComponent leaves after a successful IoT login. */
export async function seedIotSession(
  page: Page,
  account: keyof typeof IOT_ACCOUNTS = 'qc'
): Promise<void> {
  const { displayName, loginStatus } = IOT_ACCOUNTS[account];
  await seedLocalStorage(page, {
    loggedIn: 'true',
    name: displayName,
    loginStatus,
  });
}

// ---------------------------------------------------------------------------
// Map helpers
// ---------------------------------------------------------------------------

/** Waits until Mapbox GL has created its canvas inside `container`. */
export async function expectMapReady(container: Locator): Promise<void> {
  await expect(container.locator('canvas.mapboxgl-canvas')).toBeVisible();
}

/** Mapbox style id (".../styles/v1/<owner>/<id>") of a recorded style request. */
export function styleIdOf(url: URL): string {
  return url.pathname.split('/').filter(Boolean).slice(2, 4).join('/');
}

// ---------------------------------------------------------------------------
// Known defects
// ---------------------------------------------------------------------------

/**
 * Marks the current test as documenting a known, unfixed defect. The test
 * keeps asserting the *correct* behaviour, so it is reported as "expected to
 * fail" until the bug is fixed – at which point Playwright flags it as
 * passing unexpectedly and the marker should be removed.
 */
export function knownIssue(description: string): void {
  test.info().annotations.push({ type: 'known issue', description });
  test.fail(true, description);
}

/** Collects same-origin responses with HTTP errors (broken asset references). */
export function trackBrokenLocalAssets(page: Page, origin: string): string[] {
  const broken: string[] = [];
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      broken.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) {
      broken.push(`failed ${request.url()} (${request.failure()?.errorText})`);
    }
  });
  return broken;
}

/**
 * Accepts every alert/confirm the page opens and records "<type>: <message>".
 * Register it *before* the action – an unhandled alert() blocks the click.
 */
export function acceptDialogs(page: Page): string[] {
  const seen: string[] = [];
  page.on('dialog', async (dialog) => {
    seen.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.accept().catch(() => undefined);
  });
  return seen;
}
