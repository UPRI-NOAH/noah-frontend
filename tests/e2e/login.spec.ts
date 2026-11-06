import { test, expect } from '../support/test';
import { knownIssue, seedIotSession } from '../support/helpers';
import { IOT_ACCOUNTS, IOT_PASSWORD } from '../support/mock-data';

/**
 * IoT partner login (src/app/shared/components/login) backed by
 * POST https://iot-noah.up.edu.ph/login/. Successful logins unlock the IoT,
 * river basin and administrative boundary layers in NOAH Studio.
 */

const loginDialog = (page) => page.locator('#modal').filter({ visible: true });

test.describe('Login dialog', () => {
  test('/login opens the account login dialog over the landing page', async ({
    page,
  }) => {
    await page.goto('/login');
    const dialog = loginDialog(page);
    await expect(
      dialog.getByRole('heading', { name: 'Login Your Account' })
    ).toBeVisible();
    await expect(
      dialog.getByText('Enter your information to login')
    ).toBeVisible();
    await expect(dialog.getByPlaceholder('Username')).toBeVisible();
    await expect(dialog.getByPlaceholder('************')).toHaveAttribute(
      'type',
      'password'
    );
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('/qc-login opens the Quezon City variant of the dialog', async ({
    page,
  }) => {
    await page.goto('/qc-login');
    const dialog = loginDialog(page);
    await expect(
      dialog.getByRole('heading', { name: 'Login Your QC Account' })
    ).toBeVisible();
    await expect(
      dialog.locator('img[src="assets/icons/qc_logo.jpg"]')
    ).toBeVisible();
  });

  test('"Cancel" closes the dialog and returns to the landing page', async ({
    page,
  }) => {
    await page.goto('/login');
    await loginDialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Login Your Account' })
    ).toBeHidden();
  });

  test('clicking the backdrop closes the dialog', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Login Your Account' })
    ).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(
      page.getByRole('heading', { name: 'Login Your Account' })
    ).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Authentication', () => {
  test('rejects invalid credentials with a temporary error', async ({
    page,
    api,
  }) => {
    await page.goto('/login');
    const dialog = loginDialog(page);
    await dialog.getByPlaceholder('Username').fill(IOT_ACCOUNTS.qc.username);
    await dialog.getByPlaceholder('************').fill('wrong-password');
    await dialog.getByRole('button', { name: 'Login' }).click();

    const error = page.getByText('Invalid Username or Password');
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => localStorage.getItem('loggedIn'))
    ).toBeNull();
    // The alert auto-dismisses after two seconds.
    await expect(error).toBeHidden({ timeout: 5_000 });

    const [call] = api.callsTo('iotLogin').filter((c) => c.method === 'POST');
    expect(JSON.parse(call.postData!)).toEqual({
      username: IOT_ACCOUNTS.qc.username,
      password: 'wrong-password',
    });
  });

  test('shows an error when the login service is unreachable', async ({
    page,
    api,
  }) => {
    api.abort('iotLogin');
    await page.goto('/login');
    const dialog = loginDialog(page);
    await dialog.getByPlaceholder('Username').fill(IOT_ACCOUNTS.qc.username);
    await dialog.getByPlaceholder('************').fill(IOT_PASSWORD);
    await dialog.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid Username or Password')).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem('loggedIn'))
    ).toBeNull();
  });

  for (const account of Object.values(IOT_ACCOUNTS)) {
    test(`logs in "${account.username}" and opens NOAH Studio`, async ({
      page,
      api,
    }) => {
      await page.goto('/login');
      const dialog = loginDialog(page);
      await dialog.getByPlaceholder('Username').fill(account.username);
      await dialog.getByPlaceholder('************').fill(IOT_PASSWORD);
      await dialog.getByRole('button', { name: 'Login' }).click();

      await expect(page).toHaveURL(/\/noah-studio$/);
      expect(
        await page.evaluate(() => ({
          loggedIn: localStorage.getItem('loggedIn'),
          name: localStorage.getItem('name'),
          loginStatus: localStorage.getItem('loginStatus'),
        }))
      ).toEqual({
        loggedIn: 'true',
        name: account.displayName,
        loginStatus: account.loginStatus,
      });
      await expect(
        page.locator('#sidebar').getByText(account.displayName, { exact: true })
      ).toBeVisible();
      expect(
        api.callsTo('iotLogin').filter((c) => c.method === 'POST')
      ).toHaveLength(1);
    });
  }

  test('pressing Enter submits the form exactly once', async ({
    page,
    api,
  }) => {
    await page.goto('/login');
    const dialog = loginDialog(page);
    await dialog.getByPlaceholder('Username').fill(IOT_ACCOUNTS.qc.username);
    await dialog.getByPlaceholder('************').fill(IOT_PASSWORD);
    await dialog.getByPlaceholder('************').press('Enter');
    await expect(page).toHaveURL(/\/noah-studio$/);
    expect(
      api.callsTo('iotLogin').filter((c) => c.method === 'POST')
    ).toHaveLength(1);
  });
});

test.describe('Signed-in session', () => {
  test.beforeEach(async ({ page }) => {
    await seedIotSession(page, 'qc');
  });

  test('the navigation shows the account name instead of LOGIN', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation').filter({ visible: true });
    await expect(nav.getByRole('button', { name: 'LOGIN' })).toHaveCount(0);
    await expect(
      nav.getByText(IOT_ACCOUNTS.qc.displayName, { exact: true })
    ).toBeVisible();
  });

  test('visiting /login while signed in skips the dialog', async ({ page }) => {
    knownIssue(
      'LoginComponent.ngOnInit redirects signed-in users to "/" but then opens the dialog ' +
        'anyway because window.location still contains "login"; submitting it does nothing.'
    );
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: 'Login Your Account' })
    ).toBeHidden();
  });

  test('logging out from the navigation clears the session', async ({
    page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation').filter({ visible: true });
    await nav.getByText(IOT_ACCOUNTS.qc.displayName, { exact: true }).click();
    await nav.getByText('Logout', { exact: true }).click();

    await expect(nav.getByRole('button', { name: 'LOGIN' })).toBeVisible();
    expect(
      await page.evaluate(() =>
        ['loggedIn', 'name', 'loginStatus'].map((k) => localStorage.getItem(k))
      )
    ).toEqual([null, null, null]);
  });
});
