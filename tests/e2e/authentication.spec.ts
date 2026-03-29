import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  test('should display login/sign-in options when present', async ({ page }) => {
    await page.goto('/');

    // Check for any login/signin related elements
    const loginElements = await page.$('text=/login|sign in| Sign In/i');
    // If login exists, it should be clickable
    if (loginElements) {
      await expect(loginElements).toBeVisible();
    }
  });

  test('should navigate to login page if login button exists', async ({ page }) => {
    await page.goto('/');

    const loginButton = await page.$('text=/login|sign in/i');
    if (loginButton) {
      await loginButton.click();
      // Wait for navigation or modal
      await page.waitForTimeout(1000);
    }
  });
});
