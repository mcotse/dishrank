import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174/dishrank';

test.describe('Authentication', () => {
  test('should display the auth page with branding', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // Check branding elements
    await expect(page.getByRole('heading', { name: 'Deli' })).toBeVisible();
    await expect(page.getByText('Rank your favorite dishes with Elo ratings')).toBeVisible();
  });

  test('should display value propositions', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // Check value props
    await expect(page.getByText('Elo-based rankings')).toBeVisible();
    await expect(page.getByText('Track by restaurant')).toBeVisible();
    await expect(page.getByText('Community powered')).toBeVisible();
  });

  test('should have email input and submit button', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // Check form elements
    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeVisible();

    const submitButton = page.getByRole('button', { name: 'Continue with Email' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled(); // Should be disabled when empty
  });

  test('should enable submit button when email is entered', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    const emailInput = page.getByPlaceholder('Enter your email');
    const submitButton = page.getByRole('button', { name: 'Continue with Email' });

    // Enter email
    await emailInput.fill('test@example.com');

    // Button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should redirect unauthenticated users to auth page', async ({ page }) => {
    // Try to access protected route
    await page.goto(`${BASE_URL}/`);

    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect from entry page when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/entry`);
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect from leaderboard when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`);
    await expect(page).toHaveURL(/\/auth/);
  });
});
