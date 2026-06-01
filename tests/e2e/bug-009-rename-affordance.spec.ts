import { test as base, expect } from '@playwright/test';

base.describe('BUG-009 — mix name rename affordance', () => {
  base.test('pencil icon visible on hover and rename works in MixEditorPage', async ({ page }) => {
    // Seed IndexedDB with a mix so we can navigate directly to the editor
    await page.addInitScript(() => {
      // Open IndexedDB and insert a test mix
      const MIX_ID = 'test-mix-bug009';
      const openReq = indexedDB.open('mashup-db', 1);
      openReq.onsuccess = () => {
        const db = openReq.result;
        // Only insert if the object store exists
        if (!db.objectStoreNames.contains('mixes')) return;
        const tx = db.transaction('mixes', 'readwrite');
        tx.objectStore('mixes').put({
          id: MIX_ID,
          name: 'Original Mix Name',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tracks: [],
        });
      };
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
    await page.addInitScript(() => {
      const openReq = indexedDB.open('mashup-db', 1);
      openReq.onsuccess = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains('mixes')) return;
        const tx = db.transaction('mixes', 'readwrite');
        tx.objectStore('mixes').put({
          id: 'test-mix-bug009b',
          name: 'Keep This Name',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tracks: [],
        });
      };
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
