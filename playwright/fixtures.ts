import { test as base, type Page } from '@playwright/test';

// Fixture shape: extend the default 'page' with pre-seeded sessionStorage
type AuthFixtures = {
  page: Page;
};

// Authenticated fixture: injects both Spotify accounts into sessionStorage
// before the page loads, so App.tsx useEffect picks them up via loadAccount().
// Keys must match auth.ts: mashup_account_A / mashup_account_B
const withAuth = base.extend<AuthFixtures>({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({
        tokenA,
        expiresAtA,
        nameA,
        refreshA,
        tokenB,
        expiresAtB,
        nameB,
        refreshB,
      }: {
        tokenA: string;
        expiresAtA: number;
        nameA: string;
        refreshA: string;
        tokenB: string;
        expiresAtB: number;
        nameB: string;
        refreshB: string;
      }) => {
        sessionStorage.setItem(
          'mashup_account_A',
          JSON.stringify({
            role: 'A',
            accessToken: tokenA,
            refreshToken: refreshA,
            expiresAt: expiresAtA,
            deviceId: null,
            displayName: nameA,
          })
        );
        sessionStorage.setItem(
          'mashup_account_B',
          JSON.stringify({
            role: 'B',
            accessToken: tokenB,
            refreshToken: refreshB,
            expiresAt: expiresAtB,
            deviceId: null,
            displayName: nameB,
          })
        );
      },
      {
        tokenA: process.env.SPOTIFY_FRESH_TOKEN_A ?? process.env.SPOTIFY_ACCESS_TOKEN_A!,
        expiresAtA: Number(process.env.SPOTIFY_FRESH_EXPIRES_A ?? Date.now() + 3_500_000),
        nameA: process.env.SPOTIFY_DISPLAY_NAME_A ?? 'Test Account A',
        refreshA: process.env.SPOTIFY_REFRESH_TOKEN_A!,
        tokenB: process.env.SPOTIFY_FRESH_TOKEN_B ?? process.env.SPOTIFY_ACCESS_TOKEN_B!,
        expiresAtB: Number(process.env.SPOTIFY_FRESH_EXPIRES_B ?? Date.now() + 3_500_000),
        nameB: process.env.SPOTIFY_DISPLAY_NAME_B ?? 'Test Account B',
        refreshB: process.env.SPOTIFY_REFRESH_TOKEN_B!,
      }
    );
    await use(page);
  },
});

export { withAuth as test };
export { expect } from '@playwright/test';
