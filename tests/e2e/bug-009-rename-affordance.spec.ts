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

base.describe('BUG-009 — mix name rename affordance', () => {
  base.test('pencil icon visible on hover and rename works in MixEditorPage', async ({ page }) => {
    // Navigate to / first so we are in the app's origin and IndexedDB is available
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await seedMix(page, {
      id: 'test-mix-bug009',
      name: 'Original Mix Name',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: [],
    });

    await page.goto('/mix/test-mix-bug009/edit');

    // Wait for the editor to load — mix name heading should be visible
    await expect(page.locator('text=Original Mix Name').first()).toBeVisible({ timeout: 8000 });

    // Hover over the mix name to reveal the pencil icon
    await page.locator('text=Original Mix Name').first().hover();
    await expect(page.locator('[aria-label="Rename mix"]').first()).toBeVisible({ timeout: 3000 });

    // Click the mix name to enter edit mode
    await page.locator('text=Original Mix Name').first().click();
    const nameInput = page.locator('input[aria-label="Mix name"]');
    await expect(nameInput).toBeVisible({ timeout: 3000 });

    // Type a new name and press Enter
    await nameInput.fill('Renamed Mix');
    await nameInput.press('Enter');

    // The new name should be shown
    await expect(page.locator('text=Renamed Mix').first()).toBeVisible({ timeout: 3000 });
    // The input should be gone
    await expect(nameInput).not.toBeVisible({ timeout: 3000 });
  });

  base.test('Escape cancels rename without saving', async ({ page }) => {
    // Navigate to / first so we are in the app's origin and IndexedDB is available
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await seedMix(page, {
      id: 'test-mix-bug009b',
      name: 'Keep This Name',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: [],
    });

    await page.goto('/mix/test-mix-bug009b/edit');
    await expect(page.locator('text=Keep This Name').first()).toBeVisible({ timeout: 8000 });

    await page.locator('text=Keep This Name').first().click();
    const nameInput = page.locator('input[aria-label="Mix name"]');
    await expect(nameInput).toBeVisible({ timeout: 3000 });

    await nameInput.fill('Should Not Save');
    await nameInput.press('Escape');

    await expect(page.locator('text=Keep This Name').first()).toBeVisible({ timeout: 3000 });
    await expect(nameInput).not.toBeVisible();
  });
});
