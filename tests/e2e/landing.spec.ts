import { test, expect } from '../support/test';
import { acceptDialogs, knownIssue, searchInput } from '../support/helpers';

/**
 * Landing page (src/app/features/home): hero search, weather-update
 * shortcuts, NOAH Studio call to action, desktop navigation and footer.
 */

const DESKTOP_ALERT =
  'Please open this page on your mobile device to download the app.';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Hero', () => {
  test('introduces Know Your Hazards with a location search', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Know Your Hazards', level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText(
        /Assess how likely you are to be affected by\s+floods, landslides, and storm surges/
      )
    ).toBeVisible();
    await expect(searchInput(page)).toBeVisible();
    await expect(searchInput(page)).toHaveAttribute('type', 'search');
    await expect(searchInput(page)).toHaveAttribute('autocomplete', 'off');
  });

  test('flags weather features as beta', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Check Weather Updates' })
    ).toBeVisible();
    await expect(page.getByText('All features are in BETA')).toBeVisible();
    await expect(
      page.getByText('More hazard insights coming soon!')
    ).toBeVisible();
  });
});

test.describe('Weather update shortcuts', () => {
  const shortcuts = [
    { label: 'Rainfall', path: '/weather-updates/rainfall-contour' },
    { label: 'Typhoon Track', path: '/weather-updates/typhoon-track' },
    { label: 'Temperature', path: '/weather-updates/temperature' },
  ];

  for (const { label, path } of shortcuts) {
    test(`"${label}" opens ${path}`, async ({ page }) => {
      const shortcut = page.locator(`a[href="${path}"]`);
      await expect(shortcut).toBeVisible();
      await expect(
        page.locator('span', { hasText: new RegExp(`^\\s*${label}\\s*$`) })
      ).toBeVisible();

      await shortcut.click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page).toHaveTitle('NOAH - Weather Updates');
    });
  }

  test('the Typhoon Track shortcut turns the typhoon layer on', async ({
    page,
  }) => {
    await page.locator('a[href="/weather-updates/typhoon-track"]').click();
    const typhoonToggle = page
      .locator('noah-typhoon-track-group')
      .filter({ visible: true })
      .getByRole('checkbox')
      .filter({ visible: true });
    await expect(typhoonToggle).toBeChecked();
  });

  test('shortcut icons expose an accessible name', async ({ page }) => {
    knownIssue(
      'The Rainfall / Typhoon Track / Temperature shortcuts are icon-only <a role="button"> ' +
        'elements; their visible labels live in a sibling <span>, so screen readers announce "button".'
    );
    for (const name of ['Rainfall', 'Typhoon Track', 'Temperature']) {
      await expect(
        page.getByRole('button', { name, exact: true })
      ).toBeVisible();
    }
  });
});

test.describe('NOAH Studio call to action', () => {
  test('describes the Studio for researchers and policy makers', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Are you a Researcher or a Policy Maker?',
      })
    ).toBeVisible();
    await expect(
      page.getByText(/for a more granular assessment of natural hazards/)
    ).toBeVisible();
  });

  test('inline "NOAH Studio" link opens the Studio', async ({ page }) => {
    await page
      .locator('section')
      .getByRole('link', { name: 'NOAH Studio' })
      .click();
    await expect(page).toHaveURL(/\/noah-studio$/);
  });

  test('"NOAH Studio" button opens the Studio', async ({ page }) => {
    await page
      .locator('section')
      .getByRole('button', { name: 'NOAH Studio' })
      .click();
    await expect(page).toHaveURL(/\/noah-studio$/);
  });
});

test.describe('Desktop navigation bar', () => {
  const nav = (page) => page.getByRole('navigation').filter({ visible: true });

  test('shows the NOAH logo linking home', async ({ page }) => {
    const logoLink = nav(page).locator('a[href="/"]');
    await expect(logoLink).toBeVisible();
    await expect(
      logoLink.locator('img[src="assets/icons/noah_logo.png"]')
    ).toBeVisible();
  });

  const externalLinks = [
    {
      name: 'Donate',
      href: 'https://resilience.up.edu.ph/give-to-upri-and-noah-center/',
    },
    { name: 'Blog', href: 'https://noahcenter.up.edu.ph/' },
    {
      name: 'Downloads',
      href: 'https://drive.google.com/drive/folders/1ALE4-E9c-4AGjm1fqiPprWHrLUskeY9o',
    },
  ];
  for (const { name, href } of externalLinks) {
    test(`"${name}" opens ${new URL(href).host} in a new tab`, async ({
      page,
    }) => {
      const link = nav(page).getByRole('link', { name });
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
    });
  }

  test('"NOAH Studio" navigates to the Studio', async ({ page }) => {
    await nav(page).getByRole('button', { name: 'NOAH Studio' }).click();
    await expect(page).toHaveURL(/\/noah-studio$/);
  });

  test('"Install" explains the app must be installed from a phone', async ({
    page,
  }) => {
    const alerts = acceptDialogs(page);
    await nav(page).getByRole('button', { name: 'Install' }).click();
    await expect.poll(() => alerts).toEqual([`alert: ${DESKTOP_ALERT}`]);
    await expect(page).toHaveURL(/\/$/);
  });

  test('"LOGIN" opens the account login dialog', async ({ page }) => {
    await nav(page).getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Login Your Account' })
    ).toBeVisible();
  });
});

test.describe('Footer', () => {
  const footer = (page) => page.locator('footer');

  test('presents NOAH, its parent institutions and partners', async ({
    page,
  }) => {
    await expect(
      footer(page).getByText(/Nationwide Operational\s*Assessment of Hazards/)
    ).toBeVisible();
    await expect(
      footer(page).getByText('noah is a project of:', { exact: false })
    ).toBeVisible();
    await expect(
      footer(page).getByText('in partnership with:', { exact: false })
    ).toBeVisible();

    for (const href of [
      'https://up.edu.ph/',
      'https://resilience.up.edu.ph/',
      'https://www.mapbox.com/',
    ]) {
      const link = footer(page).locator(`a[href="${href}"]`);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('links to NOAH social channels', async ({ page }) => {
    await expect(
      footer(page).getByRole('heading', { name: 'Contact Us' })
    ).toBeVisible();
    await expect(
      footer(page).locator('a[href="https://www.facebook.com/UPNOAH"]')
    ).toHaveAttribute('target', '_blank');
    await expect(
      footer(page).locator('a[href="https://twitter.com/nababaha"]')
    ).toHaveAttribute('target', '_blank');
  });

  test('the contact e-mail link is a valid mailto address', async ({
    page,
  }) => {
    knownIssue(
      'Footer e-mail link is "mailto: resilience.institute at up.edu.ph" – mail clients ' +
        'cannot send to it.'
    );
    const mailto = await footer(page)
      .locator('a[href^="mailto:"]')
      .getAttribute('href');
    expect(mailto).toMatch(/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('describes the mission of UP NOAH', async ({ page }) => {
    await expect(
      footer(page).getByRole('heading', { name: 'About' })
    ).toBeVisible();
    await expect(
      footer(page).getByText(
        /UP NOAH seeks to assist the country in disaster risk reduction/
      )
    ).toBeVisible();
  });

  test('app store badges explain the desktop limitation', async ({ page }) => {
    await expect(
      footer(page).getByRole('heading', { name: 'Download Mobile App' })
    ).toBeVisible();
    const badges = footer(page).locator('button:has(img)');
    await expect(badges).toHaveCount(2);
    const alerts = acceptDialogs(page);
    for (const badge of await badges.all()) {
      await badge.click();
    }
    await expect
      .poll(() => alerts)
      .toEqual([`alert: ${DESKTOP_ALERT}`, `alert: ${DESKTOP_ALERT}`]);
  });

  test('app store badges have distinct accessible names', async ({ page }) => {
    knownIssue(
      'Both footer badges use aria-label="get it on google play", so the App Store badge ' +
        'is announced as Google Play.'
    );
    await expect(
      footer(page).getByRole('button', { name: /app store/i })
    ).toBeVisible();
    await expect(
      footer(page).getByRole('button', { name: /google play/i })
    ).toHaveCount(1);
  });
});
