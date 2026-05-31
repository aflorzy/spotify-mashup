import { test as base, expect } from '@playwright/test';

// BUG-007: Existing sessions authorized without playlist-read-private must be
// cleared and the user prompted to reconnect. The fix adds a scopesVersion check
// in App.tsx that compares the stored account's scopesVersion against
// REQUIRED_SCOPES_VERSION (2). Accounts without scopesVersion or with a stale
// value are cleared and an auth error banner is shown.
//
// This test does NOT require a live Spotify API call — it validates the scope
// version gate mechanism that is the core of the BUG-007 fix.

base.describe('BUG-007 — scope version gate', () => {
  base.test('stale session (no scopesVersion) triggers auth error banner', async ({ page }) => {
    // Inject an account that looks like it was saved before scopesVersion was added.
    // It has no scopesVersion field — App.tsx treats it as version 0, which is < 2.
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'mashup_account_A',
        JSON.stringify({
          role: 'A',
          accessToken: 'fake_old_token',
          refreshToken: 'fake_old_refresh',
          expiresAt: Date.now() + 3_500_000,
          deviceId: null,
          displayName: 'Old Session User',
          // intentionally omit scopesVersion
        })
      );
    });

    await page.goto('/');

    // The auth error banner must appear — AppShell renders it when authError is set
    await expect(
      page.locator('text=Your Spotify connection needs to be updated')
    ).toBeVisible({ timeout: 5000 });

    // The account should be cleared — no Player A name shown in connected state
    await expect(page.locator('text=Old Session User')).not.toBeVisible({ timeout: 3000 });
  });

  base.test('stale session with old scopesVersion (1) triggers auth error banner', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'mashup_account_A',
        JSON.stringify({
          role: 'A',
          accessToken: 'fake_v1_token',
          refreshToken: 'fake_v1_refresh',
          expiresAt: Date.now() + 3_500_000,
          deviceId: null,
          displayName: 'V1 User',
          scopesVersion: 1, // stale — below REQUIRED_SCOPES_VERSION (2)
        })
      );
    });

    await page.goto('/');

    await expect(
      page.locator('text=Your Spotify connection needs to be updated')
    ).toBeVisible({ timeout: 5000 });
  });

  base.test('fresh session with scopesVersion 3 loads without auth error banner', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'mashup_account_A',
        JSON.stringify({
          role: 'A',
          accessToken: 'fake_fresh_token',
          refreshToken: 'fake_fresh_refresh',
          expiresAt: Date.now() + 3_500_000,
          deviceId: null,
          displayName: 'Fresh User',
          scopesVersion: 3, // current — meets REQUIRED_SCOPES_VERSION
        })
      );
    });

    await page.goto('/');

    // No auth error banner — the account is accepted
    await expect(
      page.locator('text=Your Spotify connection needs to be updated')
    ).not.toBeVisible({ timeout: 5000 });
  });
});
