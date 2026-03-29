import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have reasonable first contentful paint', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(p => p.name === 'first-contentful-paint');
      return {
        firstContentfulPaint: fcp?.startTime,
      };
    });

    // FCP should be under 2 seconds
    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    }
  });
});
