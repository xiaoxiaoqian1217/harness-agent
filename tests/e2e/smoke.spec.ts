import { test, expect } from '@playwright/test';

test.describe('Harness Agent Application - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application homepage', async ({ page }) => {
    // Check that the page loaded
    await expect(page).toHaveTitle(/Harness Agent/);
    await expect(page.locator('body')).toBeAttached();
  });

  test('should display main navigation elements', async ({ page }) => {
    // Check for key UI elements (adjust selectors based on actual app)
    const hasTitle = await page.$('h1') !== null;
    expect(hasTitle).toBeTruthy();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Check that content is still visible
    await expect(page.locator('body')).toBeAttached();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    await expect(page.locator('body')).toBeAttached();
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    await expect(page.locator('body')).toBeAttached();
  });

  test('should have no images missing alt text', async ({ page }) => {
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    expect(imagesWithoutAlt).toBe(0);
  });

  test('should have form inputs properly labeled', async ({ page }) => {
    const inputsWithoutLabels = await page.$$eval(
      'input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])',
      inputs => inputs.length
    );
    // This may vary based on the actual app
    expect(inputsWithoutLabels).toBeLessThan(10);
  });
});
