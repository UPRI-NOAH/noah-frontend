import { test, expect, Page } from '../support/test';
import {
  expectMapReady,
  searchAndSelect,
  searchInput,
} from '../support/helpers';
import { CRITICAL_FACILITIES, PLACES } from '../support/mock-data';
import { sidebar, sidebarCollapseButton } from '../support/studio';

/**
 * Phone layouts (runs in the mobile-chrome / mobile-safari projects): the
 * hamburger navigation, app-store redirects, the Know Your Hazards and
 * Weather Updates bottom sheets and the NOAH Studio drawer.
 */

const PLAY_STORE =
  'https://play.google.com/store/apps/details?id=co.median.android.akawld&hl=en';
const APP_STORE = 'https://apps.apple.com/ph/app/up-noah/id6479632667';

const isIOS = () => test.info().project.name.includes('safari');

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('the hamburger menu holds the navigation links', async ({ page }) => {
    // The desktop bar is hidden on phones.
    await expect(page.getByRole('link', { name: 'Donate' })).toHaveCount(0);

    await page.locator('#menu').click();
    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();
    for (const name of ['Downloads', 'Blog', 'Donate']) {
      await expect(drawer.getByRole('link', { name })).toHaveAttribute(
        'target',
        '_blank'
      );
    }
    await expect(
      drawer.getByRole('button', { name: 'NOAH Studio' })
    ).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Install' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'LOGIN' })).toBeVisible();

    await page.locator('#cross').click();
    await expect(drawer).toBeHidden();
  });

  test('"NOAH Studio" in the menu opens the Studio', async ({ page }) => {
    await page.locator('#menu').click();
    await page
      .locator('#mobile-nav')
      .getByRole('button', { name: 'NOAH Studio' })
      .click();
    await expect(page).toHaveURL(/\/noah-studio$/);
  });

  test('"Install" sends the phone to its app store', async ({ page }) => {
    const store = isIOS() ? APP_STORE : PLAY_STORE;
    await page.locator('#menu').click();
    const request = page.waitForRequest((r) => r.url() === store);
    await page
      .locator('#mobile-nav')
      .getByRole('button', { name: 'Install' })
      .click();
    expect((await request).isNavigationRequest()).toBe(true);
  });

  test('footer badges also open the app store', async ({ page }) => {
    const store = isIOS() ? APP_STORE : PLAY_STORE;
    const request = page.waitForRequest((r) => r.url() === store);
    await page.locator('footer button:has(img)').first().click();
    await request;
  });

  test('search is usable on a phone', async ({ page }) => {
    await searchAndSelect(page, PLACES.marikina);
    await expect(page).toHaveURL(/\/know-your-hazards$/);
  });
});

test.describe('Know Your Hazards bottom sheet', () => {
  const hazard = (page: Page, label: string) =>
    page
      .getByRole('button', { name: new RegExp(`${label} Hazard Level`) })
      .filter({ visible: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/know-your-hazards');
    await expectMapReady(page.locator('#map-kyh'));
  });

  test('pages between hazard levels and nearby facilities', async ({
    page,
  }) => {
    await expect(hazard(page, 'Flood')).toBeVisible();
    await expect(
      page
        .getByText('You may drag the pin to change the location.')
        .filter({ visible: true })
    ).toBeVisible();

    await page
      .getByRole('button', { name: '>' })
      .filter({ visible: true })
      .click();
    const facilities = page
      .locator('noah-critical-facilities-kyh')
      .filter({ visible: true });
    await expect(facilities.getByRole('button')).toHaveCount(
      CRITICAL_FACILITIES.length
    );
    await expect(hazard(page, 'Flood')).toHaveCount(0);

    await page
      .getByRole('button', { name: '<' })
      .filter({ visible: true })
      .click();
    await expect(hazard(page, 'Flood')).toBeVisible();
  });

  test('can be hidden to show the full map and brought back', async ({
    page,
  }) => {
    await page.locator('noah-know-your-hazards div.right-2.mt-5').click();
    await expect(hazard(page, 'Flood')).toHaveCount(0);

    const restore = page
      .locator('noah-know-your-hazards button.bottom-0')
      .filter({ visible: true })
      .filter({ hasNotText: 'Legend' });
    await expect(restore).toBeVisible();
    await restore.click();
    await expect(hazard(page, 'Flood')).toBeVisible();
  });

  test('searching from the map header re-assesses the place', async ({
    page,
  }) => {
    await searchAndSelect(page, PLACES.marikina);
    await expect(searchInput(page)).toHaveValue(PLACES.marikina.name);
    await expect(hazard(page, 'Flood')).toContainText(/high/i);
  });
});

test.describe('Weather Updates bottom sheet', () => {
  /** The previous / next arrows pinned under the swiper. */
  const slideButtons = (page: Page) =>
    page.locator('noah-base button[class="p-2"]').filter({ visible: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/weather-updates');
    await expect(page.locator('.swiper-slide')).toHaveCount(2);
  });

  test('swipes between rainfall and typhoon track', async ({ page }) => {
    await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
    await expect(
      page
        .getByText('Current Accumulated Rainfall in Your Area')
        .filter({ visible: true })
    ).toBeVisible();

    await slideButtons(page).last().click();
    await expect(page).toHaveURL(/\/weather-updates\/typhoon-track$/);
    await expect(
      page
        .locator('.swiper-slide-active noah-typhoon-track-group')
        .getByText('Typhoon Track', { exact: true })
        .first()
    ).toBeVisible();

    await slideButtons(page).first().click();
    await expect(page).toHaveURL(/\/weather-updates\/rainfall-contour$/);
  });

  test('a typhoon-track deep link opens on the typhoon slide', async ({
    page,
  }) => {
    await page.goto('/weather-updates/typhoon-track');
    await expect(
      page.locator('.swiper-slide-active noah-typhoon-track-group')
    ).toBeVisible();
  });

  test('can be hidden to show the full map and brought back', async ({
    page,
  }) => {
    await page.locator('noah-weather-updates div.right-2.mt-5').click();
    await expect(
      page
        .getByText('Current Accumulated Rainfall in Your Area')
        .filter({ visible: true })
    ).toHaveCount(0);
    const restore = page
      .locator('noah-weather-updates button.bottom-0')
      .filter({ visible: true })
      .filter({ hasNotText: 'Legend' });
    await restore.click();
    await expect(
      page
        .getByText('Current Accumulated Rainfall in Your Area')
        .filter({ visible: true })
    ).toBeVisible();
  });
});

test.describe('NOAH Studio drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/noah-studio');
    await expect(sidebar(page)).toBeVisible();
  });

  test('opens as a bottom drawer above the map', async ({ page }) => {
    const box = (await sidebar(page).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y + box.height).toBeGreaterThanOrEqual(viewport.height - 2);
    expect(box.height).toBeLessThan(viewport.height);
    await expect(
      sidebar(page).getByText('3D Terrain', { exact: true })
    ).toBeAttached();
  });

  test('can be closed and reopened', async ({ page }) => {
    await sidebarCollapseButton(page).click();
    await expect(sidebar(page)).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(sidebar(page)).toBeVisible();
  });

  test('keeps a search bar above the map', async ({ page }) => {
    await searchAndSelect(page, PLACES.quezonCity);
    await expect(searchInput(page)).toHaveValue(PLACES.quezonCity.name);
    await expect(page).toHaveURL(/\/noah-studio$/);
  });
});
