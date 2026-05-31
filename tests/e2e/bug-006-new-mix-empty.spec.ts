import { test, expect } from '../../playwright/fixtures';

// BUG-006: /mix/new must always produce a fresh empty mix, even when the
// same session previously added tracks to a mix. MixBuilderPage now calls
// createMix() on every mount, so the in-memory mix store is reset.

test('navigating to /mix/new after adding tracks always shows an empty track list', async ({ page }) => {
  // ── Step 1: land on the builder and confirm it initialises ──────────────
  await page.goto('/mix/new');
  await page.waitForSelector('text=New Mix', { timeout: 10000 });

  // ── Step 2: search for a track and add it ───────────────────────────────
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  await page.fill('input[placeholder*="Search"]', 'Daft Punk');

  // Wait for Add buttons to appear (debounced search, allow 8 s for Spotify)
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-label^="Add"]').length > 0,
    { timeout: 8000 }
  );

  const firstAddBtn = page.locator('[aria-label^="Add"]').first();
  await firstAddBtn.click();

  // Confirm exactly one track was added — badge reads "1 track"
  // Use .first() because the TrackRow also renders a "1 track" span inside DnD context
  const trackBadgeAfterAdd = page.locator('span', { hasText: /^1 track$/ }).first();
  await expect(trackBadgeAfterAdd).toBeVisible({ timeout: 5000 });

  // ── Step 3: navigate away, then return to /mix/new ──────────────────────
  await page.goto('/mixes');
  await expect(page.locator('h1', { hasText: 'Saved Mixes' })).toBeVisible({ timeout: 10000 });

  await page.goto('/mix/new');
  await page.waitForSelector('text=New Mix', { timeout: 10000 });

  // ── Step 4: the track count badge must show 0 tracks ────────────────────
  // The badge renders as: `{n} {n === 1 ? 'track' : 'tracks'}`
  // After a fresh createMix() it must show "0 tracks".
  // Use .first() — the DnD layer may duplicate the span in the DOM tree.
  const trackBadgeAfterReset = page.locator('span', { hasText: /^0 tracks$/ }).first();
  await expect(trackBadgeAfterReset).toBeVisible({ timeout: 5000 });
});
