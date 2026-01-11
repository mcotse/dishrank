import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174/dishrank';

// Note: These tests require authentication. In a real setup, you would:
// 1. Use a test user with stored auth state
// 2. Or mock the Supabase auth in the test environment
// For now, we test what's visible on the auth page and structure

test.describe('Entry Wizard Flow', () => {
  test.describe('Without Authentication', () => {
    test('entry page redirects to auth when not logged in', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Should redirect to auth page
      await expect(page).toHaveURL(/\/auth/);
      await expect(page.getByRole('heading', { name: 'DishRank' })).toBeVisible();
    });
  });

  // These tests would run with authentication
  // To enable, use: npx playwright test --project=authenticated
  test.describe.skip('With Authentication', () => {
    test.beforeEach(async ({ page }) => {
      // This would be where you set up authenticated state
      // For example, using page.context().addCookies() or localStorage
    });

    test('should show dish name step first', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      await expect(page.getByRole('heading', { name: /what did you eat/i })).toBeVisible();
      await expect(page.getByPlaceholder(/dish name/i)).toBeVisible();
    });

    test('should navigate to restaurant step after entering dish name', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Enter dish name
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();

      // Should be on restaurant step
      await expect(page.getByRole('heading', { name: /where did you eat/i })).toBeVisible();
    });

    test('should show home cooking button on restaurant step', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Navigate to restaurant step
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();

      // Should see Home Cooking option
      await expect(page.getByText('Home Cooking')).toBeVisible();
    });

    test('should navigate to cuisine step after selecting restaurant', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Enter dish name
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();

      // Click Home Cooking
      await page.getByText('Home Cooking').click();

      // Enter city
      await page.getByPlaceholder(/San Francisco/i).fill('New York');
      await page.getByRole('button', { name: /continue/i }).click();

      // Should be on cuisine step
      await expect(page.getByRole('heading', { name: /what type of food/i })).toBeVisible();
    });

    test('should show fusion option on cuisine step', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Navigate through to cuisine step
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();
      await page.getByText('Home Cooking').click();
      await page.getByPlaceholder(/San Francisco/i).fill('New York');
      await page.getByRole('button', { name: /continue/i }).click();

      // Should see Fusion option
      await expect(page.getByText('Fusion Cuisine')).toBeVisible();
    });

    test('should navigate to photo step', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Navigate through all steps
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();
      await page.getByText('Home Cooking').click();
      await page.getByPlaceholder(/San Francisco/i).fill('New York');
      await page.getByRole('button', { name: /continue/i }).click();
      await page.getByRole('button', { name: /next/i }).click();

      // Should be on photo step
      await expect(page.getByRole('heading', { name: /add a photo/i })).toBeVisible();
    });

    test('should show skip and done buttons on photo step', async ({ page }) => {
      await page.goto(`${BASE_URL}/entry`);

      // Navigate through all steps
      await page.getByPlaceholder(/dish name/i).fill('Pad Thai');
      await page.getByRole('button', { name: /next/i }).click();
      await page.getByText('Home Cooking').click();
      await page.getByPlaceholder(/San Francisco/i).fill('New York');
      await page.getByRole('button', { name: /continue/i }).click();
      await page.getByRole('button', { name: /next/i }).click();

      // Should see Skip and Done buttons
      await expect(page.getByRole('button', { name: /skip/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /done/i })).toBeVisible();
    });
  });
});
