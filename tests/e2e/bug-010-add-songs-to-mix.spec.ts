import { test as base, expect, type Page } from '@playwright/test';

/** Seed a mix into IndexedDB in the app's origin context.
 *  Must be called after page.goto() so we are running in the correct origin.
 *  Handles both cases: DB not yet created (runs onupgradeneeded) and DB already open by the app.
 */
async function seedMix(page: Page, mix: Record<string, unknown>) {
  await page.evaluate((m) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('mashup-db', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('mixes')) {
          const store = db.createObjectStore('mixes', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('waveforms')) {
          db.createObjectStore('waveforms', { keyPath: 'spotifyTrackId' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('mixes', 'readwrite');
        tx.objectStore('mixes').put(m);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, mix);
}

base.describe('BUG-010 — Add songs to existing mix from MixEditorPage', () => {
  base.test('+ Add songs button is visible in MixEditorPage', async ({ page }) => {
    // Navigate to / first so we are in the app's origin and IndexedDB is available
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await seedMix(page, {
      id: 'test-mix-bug010',
      name: 'Test Mix for Add Songs',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: [{
        id: 'track-1',
        spotifyTrackId: 'abc123',
        spotifyUri: 'spotify:track:abc123',
        title: 'Test Track',
        artist: 'Test Artist',
        albumName: 'Test Album',
        albumArt: '',
        durationMs: 200000,
        bpm: null,
        startMs: 0,
        endMs: 200000,
        crossfadeOutMs: 4000,
        crossfadeInMs: 4000,
        waveform: [],
      }],
    });

    await page.goto('/mix/test-mix-bug010/edit');
    await expect(page.locator('text=Test Mix for Add Songs').first()).toBeVisible({ timeout: 8000 });

    // The "+ Add songs" button must be in the header
    await expect(page.locator('button:has-text("+ Add songs")')).toBeVisible({ timeout: 3000 });
  });

  base.test('clicking + Add songs navigates to /build route with existing tracks intact', async ({ page }) => {
    // Navigate to / first so we are in the app's origin and IndexedDB is available
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await seedMix(page, {
      id: 'test-mix-bug010b',
      name: 'Mix With Tracks',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: [{
        id: 'track-a',
        spotifyTrackId: 'zzz',
        spotifyUri: 'spotify:track:zzz',
        title: 'Existing Song',
        artist: 'Existing Artist',
        albumName: 'Existing Album',
        albumArt: '',
        durationMs: 180000,
        bpm: null,
        startMs: 0,
        endMs: 180000,
        crossfadeOutMs: 4000,
        crossfadeInMs: 4000,
        waveform: [],
      }],
    });

    await page.goto('/mix/test-mix-bug010b/edit');
    await expect(page.locator('text=Mix With Tracks').first()).toBeVisible({ timeout: 8000 });

    await page.locator('button:has-text("+ Add songs")').click();

    // Should navigate to /mix/:id/build
    await expect(page).toHaveURL(/\/mix\/test-mix-bug010b\/build/, { timeout: 5000 });

    // The builder page shows the existing track — NOT a blank "New Mix"
    await expect(page.locator('text=Existing Song').first()).toBeVisible({ timeout: 5000 });
  });
});
