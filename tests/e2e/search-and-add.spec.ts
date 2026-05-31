import { test, expect } from '../../playwright/fixtures';

test('search for a song and add it to the mix', async ({ page }) => {
  await page.goto('/mix/new');

  // Wait for the search panel to appear — the search input is only shown
  // when accountA is connected. The fixture pre-seeds sessionStorage so
  // App.tsx loads the account before first render.
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });

  // Type a search query
  await page.fill('input[placeholder*="Search"]', 'Bohemian Rhapsody');

  // Wait for results (debounced search, allow up to 8s)
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-label^="Add"]').length > 0,
    { timeout: 8000 }
  );

  // Click the first "+" add button
  const addBtn = page.locator('[aria-label^="Add"]').first();
  await addBtn.click();

  // Verify the track appears in the track list
  await expect(page.locator('text=Bohemian Rhapsody').first()).toBeVisible({ timeout: 5000 });
});
