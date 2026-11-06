import { test, expect, Page } from '../support/test';
import {
  AFFECTED_BARANGAYS,
  RAINFALL_DATETIME_TEXT,
} from '../support/mock-data';
import { GROUPS, groupToggle, sidebar } from '../support/studio';

/**
 * Flood Impact Forecast / Exposure Assessment (4As, BETA): combines the
 * 24-hour rain forecast with flood-prone population to estimate affected
 * people per barangay (panahon.up.edu.ph/affected_brgy).
 */

const group = (page: Page) => GROUPS.floodImpact.root(page);
const calculate = (page: Page) =>
  group(page).getByRole('button', { name: 'Calculate Flood Exposure' });
const rainForecast = (page: Page) =>
  group(page).locator('noah-risk-assessment-rain').getByRole('checkbox');
const population = (page: Page) =>
  group(page).locator('noah-risk-assessment-exposure').getByRole('checkbox');
const disclaimer = (page: Page) =>
  page
    .locator('noah-alert')
    .locator('#modal')
    .filter({ hasText: 'Exposure Assessment' })
    .filter({ visible: true });
/** Desktop variant of the summary modal (the phone variant is hidden on wide screens). */
const summary = (page: Page) =>
  page
    .locator('noah-risk-assessment-modal > div')
    .filter({ visible: true })
    .filter({ has: page.locator('table') });

async function enableExposure(page: Page) {
  await groupToggle(page, GROUPS.floodImpact).click();
  await expect(disclaimer(page).first()).toBeVisible();
  await disclaimer(page)
    .first()
    .getByRole('button', { name: 'Accept' })
    .click();
  await expect(disclaimer(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/noah-studio');
  await expect(sidebar(page)).toBeVisible();
});

test('turning the forecast on shows the 4As disclaimer once per session', async ({
  page,
}) => {
  await groupToggle(page, GROUPS.floodImpact).click();
  const popup = disclaimer(page).first();
  await expect(
    popup.getByRole('heading', { name: 'Exposure Assessment' })
  ).toBeVisible();
  await expect(
    popup.getByText(
      /Impact-Based Flood Forecasting\s+System developed by the UP Resilience Institute/
    )
  ).toBeVisible();
  await expect(popup.getByAltText('usaid-logo')).toBeVisible();
  await popup.getByRole('button', { name: 'Accept' }).click();
  await expect(disclaimer(page)).toHaveCount(0);

  // Toggling again in the same session does not nag.
  await groupToggle(page, GROUPS.floodImpact).click();
  await groupToggle(page, GROUPS.floodImpact).click();
  await page.waitForTimeout(500);
  await expect(disclaimer(page)).toHaveCount(0);
});

test('"Calculate Flood Exposure" needs both rain forecast and population layers', async ({
  page,
}) => {
  await enableExposure(page);
  await expect(group(page).getByText('Rain Forecast')).toBeVisible();
  await expect(group(page).getByText('Flood Prone Population')).toBeVisible();
  await expect(rainForecast(page)).toBeChecked();
  await expect(population(page)).not.toBeChecked();
  await expect(calculate(page)).toBeDisabled();

  await population(page).click();
  await expect(calculate(page)).toBeEnabled();

  await rainForecast(page).click();
  await expect(calculate(page)).toBeDisabled();
});

test.describe('Exposure summary', () => {
  test.beforeEach(async ({ page }) => {
    await enableExposure(page);
    await population(page).click();
    await calculate(page).click();
    await expect(summary(page)).toBeVisible();
  });

  test('tabulates affected population per barangay', async ({ page }) => {
    const modal = summary(page);
    await expect(
      modal.getByText(
        'In a large flood event, how many people might be affected'
      )
    ).toBeVisible();
    await expect(
      modal.getByText(`As of ${RAINFALL_DATETIME_TEXT}`)
    ).toBeVisible();

    for (const header of [
      'Barangay',
      'Municipality',
      'Provincial',
      'Total Population',
      'Total Affected Population',
      'Exposed to Med-High Hazard',
      'Percentage of Exposed to Med-High',
    ]) {
      await expect(modal.locator('thead')).toContainText(header);
    }

    const rows = modal.locator('tbody tr');
    await expect(rows).toHaveCount(AFFECTED_BARANGAYS.length);
    const first = AFFECTED_BARANGAYS[0];
    const row = rows.filter({ hasText: first.brgy });
    await expect(row).toContainText(first.muni);
    await expect(row).toContainText(first.prov);
    await expect(row).toContainText('12,500');
    await expect(row).toContainText('4,300');
    await expect(row).toContainText(`${first.perc_aff_medhigh}%`);
    await expect(modal.getByText(/1\s*-\s*20\s+of\s+3/)).toBeVisible();
  });

  test('shows the population exposure legend on the map', async ({ page }) => {
    const legend = group(page).getByText(
      'Population Exposure to Flood 100-Year Return Period'
    );
    await expect(legend).toBeVisible();
    for (const level of ['High', 'Moderate', 'Low']) {
      await expect(group(page).getByText(level, { exact: true })).toBeVisible();
    }
  });

  test('searches barangays through the API', async ({ page, api }) => {
    const modal = summary(page);
    await modal.getByPlaceholder('Search Location').fill('Riverside');
    await expect(modal.locator('tbody tr')).toHaveCount(1);
    await expect(modal.locator('tbody tr')).toContainText(
      'Riverside Test Barangay'
    );
    expect(
      api
        .callsTo('exposureAffected')
        .some((c) => c.url.searchParams.get('search') === 'Riverside')
    ).toBe(true);

    await modal.getByPlaceholder('Search Location').fill('Atlantis');
    await expect(modal.getByText('No result')).toBeVisible();
  });

  test('columns can be sorted', async ({ page }) => {
    const modal = summary(page);
    const firstCell = modal.locator('tbody tr').first().locator('td').first();
    await modal.locator('thead').getByText('Total Population').click();
    const sortedOnce = await firstCell.innerText();
    await modal.locator('thead').getByText('Total Population').click();
    await expect(firstCell).not.toHaveText(sortedOnce);
  });

  test('lists archived forecasts for download', async ({ page }) => {
    const modal = summary(page);
    await modal.getByText('Select Date').click();
    await expect(modal.getByText(/Nov 5, 2026/)).toBeVisible();
  });
});

test('explains when no forecast reaches the large-flood threshold', async ({
  page,
  api,
}) => {
  api.affectedBarangays = [];
  await page.reload();
  await enableExposure(page);
  await population(page).click();
  await calculate(page).click();
  await expect(
    summary(page).getByText(
      'No forecast that meets pre-determined thresholds for large floods'
    )
  ).toBeVisible();
});
