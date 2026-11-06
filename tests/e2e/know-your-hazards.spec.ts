import { test, expect, Page } from '../support/test';
import { knownIssue, searchAndSelect, searchInput } from '../support/helpers';
import {
  CRITICAL_FACILITIES,
  DEFAULT_CENTER,
  DEFAULT_HAZARDS,
  ExpectedExposure,
  ExposureLevel,
  HAZARDS_BY_PLACE,
  PLACES,
  expectedExposure,
} from '../support/mock-data';

/**
 * Know Your Hazards (src/app/features/know-your-hazards): point assessment
 * of flood, landslide and storm-surge exposure via the Mapbox Tilequery API,
 * plus the list of nearby critical facilities.
 */

const HAZARDS = [
  { type: 'flood', label: 'Flood' },
  { type: 'landslide', label: 'Landslide' },
  { type: 'storm-surge', label: 'Storm Surge' },
] as const;

const BORDER_CLASS: Record<ExposureLevel, string> = {
  high: 'border-noah-red-high',
  medium: 'border-noah-red-medium',
  low: 'border-noah-red-low',
  unavailable: 'border-noah-red-unavailable',
  'little to none': 'border-noah-black-high',
};

const INCOMPLETE_CAPTION = 'Hazard maps in this area are not yet complete.';

const sidebar = (page: Page) =>
  page.locator('noah-base').locator(':scope > div').filter({ visible: true });

const hazardButton = (page: Page, label: string) =>
  sidebar(page).getByRole('button', {
    name: new RegExp(`${label} Hazard Level`),
  });

const facilitiesList = (page: Page) =>
  page.locator('noah-critical-facilities-kyh').filter({ visible: true });

async function expectExposure(page: Page, expected: ExpectedExposure) {
  for (const { type, label } of HAZARDS) {
    const button = hazardButton(page, label);
    await expect(button).toContainText(
      new RegExp(`Hazard Level\\s+${expected[type]}(\\s|$)`, 'i')
    );
    await expect(button).toHaveClass(new RegExp(BORDER_CLASS[expected[type]]));
    if (expected[type] === 'unavailable') {
      await expect(button).toContainText(INCOMPLETE_CAPTION);
    } else {
      await expect(button).not.toContainText(INCOMPLETE_CAPTION);
    }
  }
}

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/know-your-hazards');
  });

  test('explains how to read the assessment', async ({ page }) => {
    await expect(
      sidebar(page).getByText('You may drag the pin to change the location.')
    ).toBeVisible();
    await expect(
      sidebar(page).getByText('Hazard Levels In Your Area')
    ).toBeVisible();
    for (const text of [
      '100-year rain return for floods;',
      'Shallow and structurally-controlled landslides;',
      '5-meters for storm surges.',
      'These hazard levels are based on flood simulations as well as satellite',
    ]) {
      await expect(
        sidebar(page).getByText(text, { exact: false })
      ).toBeVisible();
    }
    await expect(
      sidebar(page).getByText(/Project NOAH is still in beta\s+release/)
    ).toBeVisible();
  });

  test('links to the methods (bibliography) in a new tab', async ({ page }) => {
    const link = sidebar(page).getByRole('link', { name: 'here', exact: true });
    await expect(link).toHaveAttribute('href', '/bibliography');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('links to NOAH Studio for more information', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: 'NOAH Studio.' }).click();
    await expect(page).toHaveURL(/\/noah-studio$/);
  });

  test('the logo returns to the landing page', async ({ page }) => {
    await sidebar(page).locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Hazard assessment', () => {
  test('assesses the default location (UPRI) on first visit', async ({
    page,
    api,
  }) => {
    await page.goto('/know-your-hazards');
    await expectExposure(page, expectedExposure(DEFAULT_HAZARDS));

    const [call] = api.callsTo('tilequeryHazards');
    const [lng, lat] = DEFAULT_CENTER;
    expect(call.url.pathname).toBe(
      `/v4/upri-noah.ph_fh_100yr_tls,upri-noah.ph_fh_nodata1_tls,upri-noah.ph_lh_lh1_tls,` +
        `upri-noah.ph_lh_lh2_tls,upri-noah.ph_ssh_ssa4_tls/tilequery/${lng},${lat}.json`
    );
    expect(call.url.searchParams.get('radius')).toBe('0');
    expect(call.url.searchParams.get('access_token')).toMatch(/^pk\./);
  });

  test('shows a loading state until the assessment returns', async ({
    page,
    api,
  }) => {
    api.delay('tilequeryHazards', 1_500);
    await page.goto('/know-your-hazards');
    for (const { label } of HAZARDS) {
      await expect(hazardButton(page, label)).toContainText('Loading...');
    }
    await expectExposure(page, expectedExposure(DEFAULT_HAZARDS));
  });

  const scenarios = [
    { place: PLACES.marikina, why: 'high flood hazard' },
    {
      place: PLACES.tacloban,
      why: 'high storm surge and incomplete flood maps',
    },
    { place: PLACES.baguio, why: 'high landslide hazard' },
    { place: PLACES.quezonCity, why: 'medium hazard for every type' },
  ];
  for (const { place, why } of scenarios) {
    test(`searching ${place.name} re-assesses the area (${why})`, async ({
      page,
      api,
    }) => {
      await page.goto('/know-your-hazards');
      await expectExposure(page, expectedExposure(DEFAULT_HAZARDS));

      await searchAndSelect(page, place);
      await expect(searchInput(page)).toHaveValue(place.name);
      await expectExposure(
        page,
        expectedExposure(HAZARDS_BY_PLACE[place.mapboxId])
      );

      const [lng, lat] = place.coordinates;
      expect(
        api
          .callsTo('tilequeryHazards')
          .map((c) => c.url.pathname.split('/tilequery/')[1])
      ).toContain(`${lng},${lat}.json`);
    });
  }

  for (const { type, label } of HAZARDS) {
    test(`the ${label} button opens the ${label.toLowerCase()} guide`, async ({
      page,
    }) => {
      await page.goto('/know-your-hazards');
      await hazardButton(page, label).click();
      await expect(page).toHaveURL(new RegExp(`/know-your-hazards/${type}$`));
    });
  }

  test('does not report "little to none" when the assessment request fails', async ({
    page,
    api,
  }) => {
    knownIssue(
      'HazardsService.getFeatureInfo turns HTTP errors into `null`, and _formatRiskLevel maps ' +
        '`null` to "little to none" – an outage is shown to residents as "no hazard".'
    );
    api.fail('tilequeryHazards', 503);
    await page.goto('/know-your-hazards');
    await expect
      .poll(() => api.callsTo('tilequeryHazards').length)
      .toBeGreaterThan(0);
    for (const { label } of HAZARDS) {
      await expect(hazardButton(page, label)).not.toContainText('Loading...');
      await expect(hazardButton(page, label)).not.toContainText(
        /little to none/i,
        { timeout: 3_000 }
      );
    }
  });
});

test.describe('Critical facilities near you', () => {
  test('lists nearby facilities with type icon and distance', async ({
    page,
    api,
  }) => {
    await page.goto('/know-your-hazards');
    const list = facilitiesList(page);
    await expect(
      list.getByRole('heading', { name: 'Critical Facilities Near You' })
    ).toBeVisible();

    const rows = list.getByRole('button');
    await expect(rows).toHaveCount(CRITICAL_FACILITIES.length);
    for (const [index, facility] of CRITICAL_FACILITIES.entries()) {
      const row = rows.nth(index);
      await expect(row).toContainText(facility.name);
      await expect(row).toContainText(facility.distanceLabel);
      await expect(row.locator('img')).toHaveAttribute(
        'src',
        `assets/map-sprites/svg/${facility.icon}.svg`
      );
    }

    const [call] = api.callsTo('tilequeryFacilities');
    expect(call.url.pathname).toContain(
      'upri-noah.schools_tls,upri-noah.hospitals_tls,upri-noah.fire_station_tls,upri-noah.police_station_tls'
    );
    expect(call.url.searchParams.get('radius')).toBe('5000');
    expect(call.url.searchParams.get('limit')).toBe('25');
  });

  test('refreshes the list for a newly searched place', async ({
    page,
    api,
  }) => {
    await page.goto('/know-your-hazards');
    await expect(facilitiesList(page).getByRole('button')).toHaveCount(
      CRITICAL_FACILITIES.length
    );

    api.criticalFacilities = CRITICAL_FACILITIES.slice(0, 1);
    await searchAndSelect(page, PLACES.baguio);
    await expect(facilitiesList(page).getByRole('button')).toHaveCount(1);
    const [lng, lat] = PLACES.baguio.coordinates;
    expect(api.callsTo('tilequeryFacilities').at(-1)!.url.pathname).toContain(
      `/${lng},${lat}.json`
    );
  });

  test('shows only the heading when no facility is within 5 km', async ({
    page,
    api,
  }) => {
    api.criticalFacilities = [];
    await page.goto('/know-your-hazards');
    await expect(
      facilitiesList(page).getByRole('heading', {
        name: 'Critical Facilities Near You',
      })
    ).toBeVisible();
    await expect(facilitiesList(page).getByRole('button')).toHaveCount(0);
  });

  test('focusing a facility keeps the assessment on screen', async ({
    page,
  }) => {
    await page.goto('/know-your-hazards');
    await facilitiesList(page)
      .getByRole('button', { name: /Sample General Hospital/ })
      .click();
    await expect(page).toHaveURL(/\/know-your-hazards$/);
    await expectExposure(page, expectedExposure(DEFAULT_HAZARDS));
  });

  test('recovers after a failed facilities lookup', async ({
    page,
    api,
    issues,
  }) => {
    knownIssue(
      'CriticalFacilitiesKyhComponent reads `featureCollection.features` without a null check. ' +
        'A failed lookup throws "Cannot read properties of null", which ends the subscription, ' +
        'so the list never refreshes again for the session.'
    );
    api.fail('tilequeryFacilities', 500);
    await page.goto('/know-your-hazards');
    await expect.poll(() => api.callsTo('tilequeryFacilities').length).toBe(1);

    api.reset('tilequeryFacilities');
    await searchAndSelect(page, PLACES.marikina);
    await expect.poll(() => api.callsTo('tilequeryFacilities').length).toBe(2);
    await expect(facilitiesList(page).getByRole('button')).toHaveCount(
      CRITICAL_FACILITIES.length,
      {
        timeout: 3_000,
      }
    );
    expect(issues.consoleErrors.filter((e) => e.includes('TypeError'))).toEqual(
      []
    );
  });
});
