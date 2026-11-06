import { test, expect } from '../support/test';

/** Methods & references page linked from Know Your Hazards ("Click here for the methods used"). */

test.beforeEach(async ({ page }) => {
  await page.goto('/bibliography');
});

test('lists international and local publication references', async ({
  page,
}) => {
  const international = page.getByRole('heading', {
    name: 'International Publication References',
  });
  const local = page.getByRole('heading', {
    name: 'Local publication references',
  });
  await expect(international).toBeVisible();
  await expect(local).toBeVisible();

  const lists = page.locator('ul.list-decimal');
  await expect(lists).toHaveCount(2);
  expect(await lists.nth(0).locator('li').count()).toBeGreaterThanOrEqual(20);
  expect(await lists.nth(1).locator('li').count()).toBeGreaterThanOrEqual(5);
  await expect(lists.nth(0)).toContainText(
    'Devastating Storm Surges of Typhoon Haiyan'
  );
});

test('keeps the site navigation so readers can return home', async ({
  page,
}) => {
  await page
    .getByRole('navigation')
    .filter({ visible: true })
    .locator('a[href="/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
});
