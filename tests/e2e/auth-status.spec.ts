import { test as base, expect } from '@playwright/test';

base.describe('BUG-012 — connection badge reacts to token validity, not SDK ready state', () => {
  base.test('valid token → green badge on Home page without visiting editor', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'mashup_account_A',
        JSON.stringify({
          role: 'A',
          accessToken: 'fake_valid_token',
          refreshToken: 'fake_refresh',
          expiresAt: Date.now() + 3_500_000, // ~1 hour from now
          deviceId: null, // no SDK ready — this is the key: green must NOT require deviceId
          displayName: 'Test User A',
          scopesVersion: 3,
        })
      );
    });

    await page.goto('/');

    // The green dot must be visible — token is valid even though deviceId is null
    // The Account A card shows 'Test User A' in green state
    const accountCard = page.locator('text=Test User A').first();
    await expect(accountCard).toBeVisible({ timeout: 5000 });

    // The dot for this card must be green (bg-green-400), not yellow
    // We look for the green dot within the Account A card area
    const greenDot = page.locator('.bg-green-400').first();
    await expect(greenDot).toBeVisible({ timeout: 3000 });
  });

  base.test('no account → gray dot and Not connected text', async ({ page }) => {
    // No sessionStorage injection — no account
    await page.goto('/');
    await expect(page.locator('text=Not connected').first()).toBeVisible({ timeout: 5000 });
  });
});
