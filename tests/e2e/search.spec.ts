import { test, expect } from '../support/test';
import {
  acceptDialogs,
  currentLocationOption,
  searchAndSelect,
  searchBox,
  searchFor,
  searchInput,
  suggestion,
} from '../support/helpers';
import {
  MOCK_GEOLOCATION,
  PLACES,
  REVERSE_GEOCODE_PLACE_NAME,
} from '../support/mock-data';

/**
 * Location search (src/app/shared/components/search) backed by the Mapbox
 * Search Box API (suggest + retrieve) and reverse geocoding. Exercised from
 * the landing page, where picking a place opens Know Your Hazards.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Suggestions', () => {
  test('lists matching places with their address', async ({ page }) => {
    await searchFor(page, 'Marikina', PLACES.marikina);
    const row = suggestion(page, PLACES.marikina);
    await expect(
      row.getByText(PLACES.marikina.name, { exact: true })
    ).toBeVisible();
    await expect(
      row.getByText(PLACES.marikina.address, { exact: true })
    ).toBeVisible();
    // Non-matching fixtures are not offered.
    await expect(suggestion(page, PLACES.baguio)).toHaveCount(0);
  });

  test('queries the Search Box API restricted to the Philippines', async ({
    page,
    api,
  }) => {
    await searchFor(page, 'Baguio', PLACES.baguio);
    const [call] = api.callsTo('searchSuggest');
    expect(call.url.searchParams.get('q')).toBe('Baguio');
    expect(call.url.searchParams.get('country')).toBe('ph');
    expect(call.url.searchParams.get('session_token')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(call.url.searchParams.get('access_token')).toMatch(/^pk\./);
    expect(call.url.searchParams.get('types')).toContain('place');
  });

  test('debounces typing into a single API request', async ({ page, api }) => {
    await searchInput(page).click();
    await searchInput(page).pressSequentially('Tacloban', { delay: 40 });
    await expect(suggestion(page, PLACES.tacloban)).toBeVisible();
    const queries = api
      .callsTo('searchSuggest')
      .map((c) => c.url.searchParams.get('q'));
    expect(queries).toEqual(['Tacloban']);
  });

  test('ignores surrounding whitespace in the query', async ({ page, api }) => {
    await searchFor(page, '   Quezon   ', PLACES.quezonCity);
    expect(api.callsTo('searchSuggest').at(-1)!.url.searchParams.get('q')).toBe(
      'Quezon'
    );
  });

  test('shows a loading state while the API responds', async ({
    page,
    api,
  }) => {
    api.delay('searchSuggest', 1_500);
    await searchInput(page).click();
    await searchInput(page).fill('Marikina');
    const loading = searchBox(page).getByText('Loading...');
    await expect(loading).toBeVisible();
    await expect(suggestion(page, PLACES.marikina)).toBeVisible();
    await expect(loading).toBeHidden();
  });

  test('offers only "Your Current Location" when nothing matches', async ({
    page,
    api,
  }) => {
    await searchInput(page).fill('Atlantis');
    await expect.poll(() => api.callsTo('searchSuggest').length).toBe(1);
    await expect(currentLocationOption(page)).toBeVisible();
    await expect(
      searchBox(page)
        .locator('div[tabindex="0"]')
        .filter({ hasText: 'Philippines' })
    ).toHaveCount(0);
  });

  test('keeps working when the suggest API fails', async ({ page, api }) => {
    api.fail('searchSuggest', 503);
    await searchInput(page).fill('Marikina');
    await expect.poll(() => api.callsTo('searchSuggest').length).toBe(1);
    await expect(currentLocationOption(page)).toBeVisible();
    await expect(suggestion(page, PLACES.marikina)).toHaveCount(0);

    // Recovers once the API is healthy again.
    api.reset('searchSuggest');
    await searchInput(page).fill('Marikina City');
    await expect(suggestion(page, PLACES.marikina)).toBeVisible();
  });

  test('clicking the backdrop closes the dropdown', async ({ page }) => {
    await searchFor(page, 'Marikina', PLACES.marikina);
    await page.mouse.click(5, 300);
    await expect(suggestion(page, PLACES.marikina)).toBeHidden();
    await expect(currentLocationOption(page)).toBeHidden();
  });
});

test.describe('Selecting a place', () => {
  test('opens Know Your Hazards centred on the chosen place', async ({
    page,
    api,
  }) => {
    await searchAndSelect(page, PLACES.marikina);

    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expect(searchInput(page)).toHaveValue(PLACES.marikina.name);

    // The hazard assessment runs for the coordinates returned by "retrieve".
    const [lng, lat] = PLACES.marikina.coordinates;
    await expect
      .poll(() =>
        api
          .callsTo('tilequeryHazards')
          .some((c) => c.url.pathname.endsWith(`/tilequery/${lng},${lat}.json`))
      )
      .toBe(true);
  });

  test('retrieves place details with the suggestion session token', async ({
    page,
    api,
  }) => {
    await searchAndSelect(page, PLACES.tacloban);
    await expect(page).toHaveURL(/\/know-your-hazards$/);

    const [suggest] = api.callsTo('searchSuggest');
    const [retrieve] = api.callsTo('searchRetrieve');
    expect(decodeURIComponent(retrieve.url.pathname)).toMatch(
      new RegExp(`/retrieve/${PLACES.tacloban.mapboxId}$`)
    );
    expect(retrieve.url.searchParams.get('session_token')).toBe(
      suggest.url.searchParams.get('session_token')
    );
  });

  test('stays on the page when place details cannot be retrieved', async ({
    page,
    api,
  }) => {
    api.override('searchRetrieve', (route, request) =>
      route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': request.headers()['origin'] ?? '*',
        },
        json: { type: 'FeatureCollection', features: [] },
      })
    );
    await searchAndSelect(page, PLACES.baguio);
    await expect.poll(() => api.callsTo('searchRetrieve').length).toBe(1);
    await expect(page).toHaveURL(/\/$/);
    await expect(searchInput(page)).toHaveValue(PLACES.baguio.name);
  });
});

test.describe('Keyboard navigation', () => {
  test('arrow keys move through options and Enter selects', async ({
    page,
  }) => {
    await searchFor(page, 'Baguio', PLACES.baguio);

    await searchInput(page).press('ArrowDown');
    await expect(
      searchBox(page)
        .locator('div[tabindex="0"]')
        .filter({ hasText: 'Your Current Location' })
    ).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(suggestion(page, PLACES.baguio)).toBeFocused();

    // Wraps around to the first option and back.
    await page.keyboard.press('ArrowDown');
    await expect(
      searchBox(page)
        .locator('div[tabindex="0"]')
        .filter({ hasText: 'Your Current Location' })
    ).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(suggestion(page, PLACES.baguio)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expect(searchInput(page)).toHaveValue(PLACES.baguio.name);
  });
});

test.describe('Your Current Location', () => {
  test('uses the device location and reverse geocodes it', async ({
    page,
    context,
    api,
  }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(MOCK_GEOLOCATION);

    await searchInput(page).click();
    await currentLocationOption(page).click();

    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expect(searchInput(page)).toHaveValue(REVERSE_GEOCODE_PLACE_NAME);

    const [reverse] = api.callsTo('reverseGeocode');
    expect(decodeURIComponent(reverse.url.pathname)).toContain(
      `/${MOCK_GEOLOCATION.longitude},${MOCK_GEOLOCATION.latitude}.json`
    );
  });

  test('alerts the user when the location cannot be determined', async ({
    page,
  }) => {
    // Browsers differ when permission is simply not granted (Chromium denies,
    // Firefox leaves the prompt pending), so report PERMISSION_DENIED directly.
    await page.addInitScript(() => {
      const denied = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      };
      const fail = (_success: unknown, error?: (e: unknown) => void) =>
        setTimeout(() => error?.(denied), 0);
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: fail,
          watchPosition: (s: unknown, e?: (e: unknown) => void) => (
            fail(s, e), 0
          ),
          clearWatch: () => undefined,
        },
      });
    });
    await page.goto('/');
    const dialogs = acceptDialogs(page);
    await searchInput(page).click();
    await currentLocationOption(page).click();
    await expect
      .poll(() => dialogs)
      .toEqual(['alert: Unable to find your location']);
    await expect(page).toHaveURL(/\/$/);
  });
});
