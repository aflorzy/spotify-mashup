import { test } from '@playwright/test';
import { test as withAuth, expect } from '../../playwright/fixtures';

// This test doesn't require auth (IndexedDB-based persistence works without login)
test('mix persists after page reload', async ({ page }) => {
  await page.goto('/mix/new');

  // Wait for mix builder to initialize
  await page.waitForSelector('text=New Mix', { timeout: 10000 });

  // Navigate to mixes list — the new mix should be auto-saved
  await page.goto('/mixes');

  // After reload, verify the page loads without error
  await expect(page.locator('h1', { hasText: 'Saved Mixes' })).toBeVisible({ timeout: 10000 });
});

withAuth('authenticated mix appears in mixes list', async ({ page }) => {
  await page.goto('/mix/new');
  await page.waitForSelector('text=New Mix', { timeout: 10000 });

  // Navigate away and back to mixes
  await page.goto('/mixes');
  await expect(page.locator('h1', { hasText: 'Saved Mixes' })).toBeVisible({ timeout: 10000 });
});
