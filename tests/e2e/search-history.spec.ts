import { test, expect } from '../support/test';
import {
  currentLocationOption,
  historyItems,
  readSearchHistory,
  searchAndSelect,
  searchBox,
  searchInput,
  seedSearchHistory,
  suggestion,
} from '../support/helpers';
import {
  MockPlace,
  PLACES,
  SEARCH_HISTORY_MAX_ITEMS,
  SEARCH_HISTORY_TTL_MS,
} from '../support/mock-data';

/**
 * Recent searches (feature #470, src/app/core/services/location-search-history.service.ts).
 * History lives in localStorage under "noah.locationSearchHistory.v1", keeps
 * the 5 most recent unique places for 5 days and is shown when the search box
 * is focused with an empty query.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Places that exist only in history (not in the search API mock). */
const historyOnlyPlace = (n: number): MockPlace => ({
  mapboxId: `e2e.history.only-${n}`,
  name: `Sample Town ${n}`,
  address: `Sample Town ${n}, Sample Province, Philippines`,
  coordinates: [121 + n / 100, 14 + n / 100],
});

const removeButton = (page, place: MockPlace) =>
  searchBox(page).getByRole('button', {
    name: `Remove ${place.name} from search history`,
    // The row itself is role="button" and its name includes this label.
    exact: true,
  });

async function openHistory(page) {
  await searchInput(page).click();
  await expect(currentLocationOption(page)).toBeVisible();
}

test.describe('Recording searches', () => {
  test('stores a place after it is picked from the suggestions', async ({
    page,
  }) => {
    await page.goto('/');
    const before = Date.now();
    await searchAndSelect(page, PLACES.marikina);
    await expect(page).toHaveURL(/\/know-your-hazards$/);

    const history = await readSearchHistory(page);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      mapboxId: PLACES.marikina.mapboxId,
      name: PLACES.marikina.name,
      address: PLACES.marikina.address,
      coordinates: PLACES.marikina.coordinates,
    });
    expect(history[0].searchedAt).toBeGreaterThanOrEqual(before);
    expect(history[0].searchedAt).toBeLessThanOrEqual(Date.now());
  });

  test('moves a repeated search to the top without duplicating it', async ({
    page,
  }) => {
    await seedSearchHistory(page, [
      { place: PLACES.marikina, ageMs: 2 * HOUR },
      { place: PLACES.baguio, ageMs: HOUR },
    ]);
    await page.goto('/');
    await searchAndSelect(page, PLACES.marikina);
    await expect(page).toHaveURL(/\/know-your-hazards$/);

    const ids = (await readSearchHistory(page)).map((entry) => entry.mapboxId);
    expect(ids).toEqual([PLACES.marikina.mapboxId, PLACES.baguio.mapboxId]);
  });

  test(`keeps only the ${SEARCH_HISTORY_MAX_ITEMS} most recent places`, async ({
    page,
  }) => {
    const seeded = [1, 2, 3, 4, 5].map((n) => ({
      place: historyOnlyPlace(n),
      ageMs: n * HOUR, // Sample Town 5 is the oldest
    }));
    await seedSearchHistory(page, seeded);
    await page.goto('/');
    await searchAndSelect(page, PLACES.tacloban);
    await expect(page).toHaveURL(/\/know-your-hazards$/);

    const names = (await readSearchHistory(page)).map((entry) => entry.name);
    expect(names).toEqual([
      PLACES.tacloban.name,
      'Sample Town 1',
      'Sample Town 2',
      'Sample Town 3',
      'Sample Town 4',
    ]);
  });
});

test.describe('Showing recent searches', () => {
  test('lists recent places, newest first, when the empty search box is focused', async ({
    page,
  }) => {
    await seedSearchHistory(page, [
      { place: PLACES.baguio, ageMs: 3 * HOUR },
      { place: PLACES.marikina, ageMs: 5 * MINUTE },
      { place: PLACES.tacloban, ageMs: DAY },
    ]);
    await page.goto('/');
    await openHistory(page);

    await expect(historyItems(page)).toHaveCount(3);
    await expect(historyItems(page).nth(0)).toContainText(PLACES.marikina.name);
    await expect(historyItems(page).nth(0)).toContainText(
      PLACES.marikina.address
    );
    await expect(historyItems(page).nth(1)).toContainText(PLACES.baguio.name);
    await expect(historyItems(page).nth(2)).toContainText(PLACES.tacloban.name);
  });

  test(`never shows more than ${SEARCH_HISTORY_MAX_ITEMS} entries`, async ({
    page,
  }) => {
    await seedSearchHistory(
      page,
      [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        place: historyOnlyPlace(n),
        ageMs: n * MINUTE,
      }))
    );
    await page.goto('/');
    await openHistory(page);
    await expect(historyItems(page)).toHaveCount(SEARCH_HISTORY_MAX_ITEMS);
    await expect(historyItems(page).last()).toContainText('Sample Town 5');
  });

  test('hides recent searches while a query is typed', async ({ page }) => {
    await seedSearchHistory(page, [{ place: PLACES.baguio, ageMs: HOUR }]);
    await page.goto('/');
    await openHistory(page);
    await expect(historyItems(page)).toHaveCount(1);

    await searchInput(page).fill('Marikina');
    await expect(suggestion(page, PLACES.marikina)).toBeVisible();
    await expect(historyItems(page)).toHaveCount(0);

    await searchInput(page).fill('');
    await expect(historyItems(page)).toHaveCount(1);
  });

  test('forgets places searched more than five days ago', async ({ page }) => {
    await seedSearchHistory(page, [
      { place: PLACES.marikina, ageMs: SEARCH_HISTORY_TTL_MS + HOUR },
      { place: PLACES.baguio, ageMs: SEARCH_HISTORY_TTL_MS - HOUR },
    ]);
    await page.goto('/');
    await openHistory(page);

    await expect(historyItems(page)).toHaveCount(1);
    await expect(historyItems(page)).toContainText(PLACES.baguio.name);
    // Expired entries are purged from storage too.
    expect((await readSearchHistory(page)).map((e) => e.mapboxId)).toEqual([
      PLACES.baguio.mapboxId,
    ]);
  });

  test('ignores invalid entries in storage', async ({ page }) => {
    const now = Date.now();
    await seedSearchHistory(page, [
      { place: PLACES.baguio, ageMs: HOUR },
      // Each of the following is invalid and must be skipped:
      {
        mapboxId: '',
        name: 'No id',
        address: '',
        coordinates: [121, 14],
        searchedAt: now,
      },
      {
        mapboxId: 'x1',
        name: 'Bad coords',
        address: '',
        coordinates: [500, 14],
        searchedAt: now,
      },
      {
        mapboxId: 'x2',
        name: 'From the future',
        address: '',
        coordinates: [121, 14],
        searchedAt: now + DAY,
      },
      {
        mapboxId: 'x3',
        name: 'No timestamp',
        address: '',
        coordinates: [121, 14],
      },
      'not-an-object',
    ]);
    await page.goto('/');
    await openHistory(page);
    await expect(historyItems(page)).toHaveCount(1);
    await expect(historyItems(page)).toContainText(PLACES.baguio.name);
  });

  test('survives corrupted storage', async ({ page }) => {
    await seedSearchHistory(page, '{this is not json');
    await page.goto('/');
    await openHistory(page);
    await expect(historyItems(page)).toHaveCount(0);

    // Search keeps working and rewrites a clean history.
    await searchInput(page).fill('Marikina');
    await suggestion(page, PLACES.marikina).click();
    await expect(page).toHaveURL(/\/know-your-hazards$/);
    expect((await readSearchHistory(page)).map((e) => e.name)).toEqual([
      PLACES.marikina.name,
    ]);
  });
});

test.describe('Using recent searches', () => {
  test('picking a recent place opens it without calling the search API', async ({
    page,
    api,
  }) => {
    await seedSearchHistory(page, [
      { place: PLACES.marikina, ageMs: MINUTE },
      { place: PLACES.baguio, ageMs: HOUR },
    ]);
    await page.goto('/');
    await openHistory(page);
    await historyItems(page).filter({ hasText: PLACES.baguio.name }).click();

    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expect(searchInput(page)).toHaveValue(PLACES.baguio.name);

    const [lng, lat] = PLACES.baguio.coordinates;
    await expect
      .poll(() =>
        api
          .callsTo('tilequeryHazards')
          .some((c) => c.url.pathname.endsWith(`/${lng},${lat}.json`))
      )
      .toBe(true);
    expect(api.callsTo('searchSuggest')).toHaveLength(0);
    expect(api.callsTo('searchRetrieve')).toHaveLength(0);

    // ...and it becomes the most recent entry.
    expect((await readSearchHistory(page)).map((e) => e.mapboxId)).toEqual([
      PLACES.baguio.mapboxId,
      PLACES.marikina.mapboxId,
    ]);
  });

  test('a recent place can be chosen with the keyboard', async ({ page }) => {
    await seedSearchHistory(page, [{ place: PLACES.tacloban, ageMs: MINUTE }]);
    await page.goto('/');
    await openHistory(page);

    await searchInput(page).press('ArrowDown'); // "Your Current Location"
    await page.keyboard.press('ArrowDown'); // first recent search
    await expect(historyItems(page).first()).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expect(searchInput(page)).toHaveValue(PLACES.tacloban.name);
  });

  test('the remove button deletes one entry and keeps the dropdown open', async ({
    page,
  }) => {
    await seedSearchHistory(page, [
      { place: PLACES.marikina, ageMs: MINUTE },
      { place: PLACES.baguio, ageMs: HOUR },
    ]);
    await page.goto('/');
    await openHistory(page);

    await expect(removeButton(page, PLACES.marikina)).toBeVisible();
    await removeButton(page, PLACES.marikina).click();

    await expect(historyItems(page)).toHaveCount(1);
    await expect(historyItems(page)).toContainText(PLACES.baguio.name);
    await expect(currentLocationOption(page)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    expect((await readSearchHistory(page)).map((e) => e.mapboxId)).toEqual([
      PLACES.baguio.mapboxId,
    ]);
  });

  test('removing every entry leaves an empty history', async ({ page }) => {
    await seedSearchHistory(page, [
      { place: PLACES.quezonCity, ageMs: MINUTE },
    ]);
    await page.goto('/');
    await openHistory(page);
    await searchBox(page).getByTestId('remove-search-history-item').click();
    await expect(historyItems(page)).toHaveCount(0);
    expect(await readSearchHistory(page)).toEqual([]);
  });
});

test.describe('Shared across features', () => {
  for (const path of [
    '/know-your-hazards',
    '/weather-updates',
    '/noah-studio',
  ]) {
    test(`recent searches are offered on ${path}`, async ({ page }) => {
      await seedSearchHistory(page, [
        { place: PLACES.marikina, ageMs: MINUTE },
      ]);
      await page.goto(path);
      await openHistory(page);
      await expect(historyItems(page)).toHaveCount(1);
      await expect(historyItems(page)).toContainText(PLACES.marikina.name);
    });
  }
});
