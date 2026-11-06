import { test, expect, Page } from '../support/test';
import { seedIotSession } from '../support/helpers';
import { IOT_ACCOUNTS } from '../support/mock-data';
import { GROUPS, expandGroup, groupToggle, sidebar } from '../support/studio';

/**
 * IoT sensors (Quezon City / Laguna pilot) and the layers unlocked by an IoT
 * partner login: river basin boundaries (#487/#488) and administrative
 * boundaries.
 */

const iotDisclaimer = (page: Page) =>
  page
    .locator('noah-disclaimer #modal')
    .filter({ hasText: 'Internet of Things (IoT)' })
    .first();

test.describe('IoT sensors (public)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/noah-studio');
    await expect(sidebar(page)).toBeVisible();
  });

  test('describes the sensor layers and their disclaimers', async ({
    page,
  }) => {
    const group = GROUPS.iot;
    await expandGroup(page, group, group.root(page).getByText('IoT Sensors'));
    await expect(
      group
        .root(page)
        .getByText(
          'Disclaimer: Calibration and validation of sensor datasets are still in progress'
        )
    ).toBeVisible();
    await expect(
      group.root(page).getByText('Administrative Boundaries', { exact: true })
    ).toBeVisible();
    await expect(
      group
        .root(page)
        .getByText(
          'Disclaimer: Administrative boundaries are not authoritative'
        )
    ).toBeVisible();
    for (const layer of [
      'Flood',
      'Rain Gauge',
      'Municipal Boundary',
      'Barangay Boundary',
      'Government-Owned Facilities',
    ]) {
      await expect(
        group.root(page).getByText(layer, { exact: true }).first()
      ).toBeVisible();
    }
  });

  test('"View Data Summary" is only available while IoT is shown', async ({
    page,
  }) => {
    const group = GROUPS.iot;
    const summary = group
      .root(page)
      .getByRole('button', { name: 'View Data Summary' });
    await expandGroup(page, group, summary);
    await expect(summary).toBeDisabled();

    await groupToggle(page, group).click();
    await expect(groupToggle(page, group)).toBeChecked();
    await expect(summary).toBeEnabled();
  });

  test('turning IoT on shows the Quezon City data disclaimer', async ({
    page,
  }) => {
    await groupToggle(page, GROUPS.iot).click();
    const modal = iotDisclaimer(page);
    await expect(
      modal.getByRole('heading', { name: 'Internet of Things (IoT)' })
    ).toBeVisible();
    await expect(
      modal.getByText(
        /pilot project of UP Resilience Institute with the local\s+government of Quezon City/
      )
    ).toBeVisible();

    await modal.getByRole('button', { name: 'See more...' }).click();
    await expect(
      modal.getByText(/Republic Act No\. 10121/).first()
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: 'See more...' })
    ).toHaveCount(0);
  });

  test('loads Quezon City and Laguna sensor feeds', async ({ api }) => {
    await expect
      .poll(() => api.callsTo('iotSensors').length)
      .toBeGreaterThanOrEqual(2);
    const types = api
      .callsTo('iotSensors')
      .map((c) => c.url.searchParams.get('iot_type'));
    expect(types).toEqual(expect.arrayContaining(['flood', 'rain']));
    for (const call of api.callsTo('iotSensors')) {
      expect(call.url.searchParams.getAll('municity[]')).toEqual([
        'laguna',
        'quezon_city',
      ]);
    }
  });
});

test.describe('Signed-in IoT partner', () => {
  test('Quezon City admins see their name, logo and restricted layers', async ({
    page,
  }) => {
    await seedIotSession(page, 'qc');
    await page.goto('/noah-studio');
    await expect(
      sidebar(page).getByText(IOT_ACCOUNTS.qc.displayName, { exact: true })
    ).toBeVisible();
    await expect(
      sidebar(page).locator('img[src="assets/icons/qclogo.png"]')
    ).toBeVisible();
    await expect(GROUPS.riverbasin.root(page)).toBeVisible();
    await expect(GROUPS.boundaries.root(page)).toBeVisible();
  });

  test('Laguna admins see the Laguna logo', async ({ page }) => {
    await seedIotSession(page, 'laguna');
    await page.goto('/noah-studio');
    await expect(
      sidebar(page).locator('img[src="assets/icons/laguna_logo.png"]')
    ).toBeVisible();
  });

  test('river basin boundaries can be shown with a legend and opacity', async ({
    page,
  }) => {
    await seedIotSession(page, 'qc');
    await page.goto('/noah-studio');
    const group = GROUPS.riverbasin;
    await expandGroup(
      page,
      group,
      group.root(page).getByText('River Basin Boundary')
    );
    await expect(
      group.root(page).getByText('Sub-basin Zone Boundary')
    ).toBeVisible();
    await expect(group.root(page).locator('noah-slider')).toContainText(
      'Opacity'
    );

    await expect(groupToggle(page, group)).not.toBeChecked();
    await groupToggle(page, group).click();
    await expect(groupToggle(page, group)).toBeChecked();
  });

  test('administrative boundaries cover barangay, municipal and provincial levels', async ({
    page,
  }) => {
    await seedIotSession(page, 'qc');
    await page.goto('/noah-studio');
    const group = GROUPS.boundaries;
    const solos = group.root(page).locator('noah-boundaries-solo');
    await expandGroup(page, group, solos.first());
    await expect(solos).toHaveCount(3);
    for (const level of ['barangay', 'municipal', 'provincial']) {
      await expect(solos.filter({ hasText: level })).toHaveCount(1);
    }
    await expect(
      group.root(page).getByText('Source: Philippine Statistics Authority')
    ).toBeVisible();
  });

  test('logging out from the Studio removes the restricted layers', async ({
    page,
  }) => {
    await seedIotSession(page, 'qc');
    await page.goto('/noah-studio');
    await sidebar(page)
      .getByText(IOT_ACCOUNTS.qc.displayName, { exact: true })
      .click();
    await sidebar(page).getByText('Logout', { exact: true }).click();

    await expect(GROUPS.riverbasin.root(page)).toHaveCount(0);
    await expect(GROUPS.boundaries.root(page)).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem('loggedIn'))
    ).toBeNull();
  });
});
