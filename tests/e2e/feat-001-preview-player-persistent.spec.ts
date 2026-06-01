import { test, expect } from '../../playwright/fixtures';

// FEAT-001: PreviewPlayerProvider was lifted from MixEditorPage into AppShell.
// This means the hidden Spotify SDK iframe is mounted once for the entire app
// session and persists across page navigations. When the user navigates away
// from the editor and returns, the player should already be registered — the
// "Preview transition" button should become enabled far faster than the initial
// cold-start (20 s) because no new SDK init is required.

test('preview player stays connected after navigating away and back to the editor', async ({ page }) => {
  test.setTimeout(60_000);

  // ── Step 1: open the builder and add two tracks ───────────────────────────
  await page.goto('/mix/new');
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10_000 });

  // Add first track
  await page.fill('input[placeholder*="Search"]', 'Daft Punk');
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-label^="Add"]').length > 0,
    { timeout: 8_000 }
  );
  await page.locator('[aria-label^="Add"]').first().click();

  // Wait for track count to reach 1
  await page.waitForFunction(
    () => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.some((s) => /^1 track$/.test(s.textContent?.trim() ?? ''));
    },
    { timeout: 5_000 }
  );

  // Add second track
  await page.fill('input[placeholder*="Search"]', 'Coldplay');
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-label^="Add"]').length > 0,
    { timeout: 8_000 }
  );
  await page.locator('[aria-label^="Add"]').first().click();

  // Wait for track count to reach 2
  await page.waitForFunction(
    () => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.some((s) => /^2 tracks$/.test(s.textContent?.trim() ?? ''));
    },
    { timeout: 5_000 }
  );

  // ── Step 2: navigate to the editor ────────────────────────────────────────
  const editBtn = page.locator('button', { hasText: 'Edit Mix →' });
  await expect(editBtn).toBeEnabled({ timeout: 5_000 });
  await editBtn.click();

  await page.waitForSelector('text=Trimmed:', { timeout: 10_000 });

  // Capture the mix URL so we can navigate back to it later
  const editorUrl = page.url();

  // ── Step 3: wait for the player to become ready (cold start, up to 20 s) ──
  // TransitionPreviewButton renders:
  //   "Connect Spotify to preview" — no accountA (won't happen with auth fixture)
  //   "Player connecting…"         — SDK initialising
  //   "Preview transition"         — player ready, clickable
  let playerReadyOnFirstVisit = false;
  try {
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(
          (btn) => (btn.textContent ?? '').includes('Preview transition') && !btn.disabled
        );
      },
      { timeout: 20_000 }
    );
    playerReadyOnFirstVisit = true;
  } catch {
    // Player never became ready — no Premium device. Skip the persistence check.
  }

  if (!playerReadyOnFirstVisit) {
    test.skip(
      true,
      'Spotify player did not become ready on first editor visit (no Premium device available)'
    );
    return;
  }

  // ── Step 4: navigate away to /mixes ──────────────────────────────────────
  await page.goto('/mixes');
  // Confirm we left the editor
  await expect(page).toHaveURL(/\/mixes/, { timeout: 5_000 });

  // ── Step 5: navigate back to the same editor ──────────────────────────────
  await page.goto(editorUrl);
  await page.waitForSelector('text=Trimmed:', { timeout: 10_000 });

  // ── Step 6: assert the player becomes ready within 5 s (warm reconnect) ───
  // Because PreviewPlayerProvider lives in AppShell the iframe was never
  // destroyed — the device is already registered. The button should flip to
  // "Preview transition" much faster than the 20 s cold-start timeout.
  const playerReadyOnReturn = await page.waitForFunction(
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(
        (btn) => (btn.textContent ?? '').includes('Preview transition') && !btn.disabled
      );
    },
    { timeout: 5_000 }
  ).then(() => true).catch(() => false);

  expect(
    playerReadyOnReturn,
    'Expected "Preview transition" button to be enabled within 5 s on return navigation ' +
    '— PreviewPlayerProvider should persist across navigation (FEAT-001)'
  ).toBe(true);
});
