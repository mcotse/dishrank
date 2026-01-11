import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5174/dishrank';

test.describe('Comparison Flow', () => {
  test.describe('Without Authentication', () => {
    test('compare page redirects to auth when not logged in', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Should redirect to auth page
      await expect(page).toHaveURL(/\/auth/);
      await expect(page.getByRole('heading', { name: 'Deli' })).toBeVisible();
    });
  });

  // These tests would run with authentication
  // To enable, use: npx playwright test --project=authenticated
  test.describe.skip('With Authentication', () => {
    test.beforeEach(async ({ page }) => {
      // This would be where you set up authenticated state
      // For example, using page.context().addCookies() or localStorage
    });

    test('should show "not enough dishes" when user has fewer than 2 dishes', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Should show not enough dishes message
      await expect(page.getByRole('heading', { name: /not enough dishes/i })).toBeVisible();
      await expect(page.getByText(/add at least 2 dishes/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add a dish/i })).toBeVisible();
    });

    test('should display comparison cards with dish images when user has dishes', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison cards to appear
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Both cards should be visible
      const cards = page.locator('[data-testid="comparison-card"]');
      await expect(cards).toHaveCount(2);

      // Each card should have an image placeholder or actual image
      const images = page.locator('[data-testid="comparison-card"] img, [data-testid="card-image-placeholder"]');
      await expect(images).toHaveCount(2);
    });

    test('should show progress indicator during comparisons', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison to load
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Progress bar should be visible
      await expect(page.getByText(/of/)).toBeVisible(); // "1 of X"
      await expect(page.locator('.bg-orange-500')).toBeVisible(); // Progress bar
    });

    test('should allow skipping a comparison', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison to load
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Skip button should be visible and clickable
      const skipButton = page.getByRole('button', { name: /skip this one/i });
      await expect(skipButton).toBeVisible();
      await skipButton.click();

      // Should move to next comparison or complete
    });

    test('should select a winner when clicking a card', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison to load
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Get the first comparison card and click it
      const firstCard = page.locator('[data-testid="comparison-card"]').first();
      await firstCard.click();

      // Should move to next comparison or show completion
    });

    test('should show completion screen after all comparisons', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison to load
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Complete all comparisons by clicking first card repeatedly
      while (await page.getByText('Would you rather eat...').isVisible()) {
        await page.locator('[data-testid="comparison-card"]').first().click();
        await page.waitForTimeout(200); // Brief wait for state update
      }

      // Should show completion message
      await expect(page.getByRole('heading', { name: /rankings updated/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /view leaderboard/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /compare more/i })).toBeVisible();
    });

    test('should display dish name and restaurant on comparison cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/compare`);

      // Wait for comparison to load
      await expect(page.getByText('Would you rather eat...')).toBeVisible();

      // Cards should have dish names (h3 elements)
      const dishNames = page.locator('[data-testid="comparison-card"] h3');
      await expect(dishNames).toHaveCount(2);

      // Cards should have restaurant info
      const restaurantInfo = page.locator('[data-testid="comparison-card"] .text-gray-500');
      await expect(restaurantInfo).toHaveCount(2);
    });
  });
});
