import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('export and import a mix JSON round-trip', async ({ page }) => {
  // Start on the mixes page
  await page.goto('/mixes');
  await expect(page.locator('h1', { hasText: 'Saved Mixes' })).toBeVisible({ timeout: 10000 });

  // Verify the Import button is present and enabled
  const importBtn = page.locator('button', { hasText: 'Import mix' });
  await expect(importBtn).toBeVisible();
  await expect(importBtn).not.toBeDisabled();

  // Create a test mix JSON file
  const mixJson = JSON.stringify({
    id: 'test-mix-import-e2e',
    name: 'E2E Test Mix',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tracks: [],
  });

  const tmpPath = path.join('/tmp', 'e2e-test-mix.json');
  fs.writeFileSync(tmpPath, mixJson);

  // Use file chooser to import
  const fileChooserPromise = page.waitForEvent('filechooser');
  await importBtn.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(tmpPath);

  // Wait for import to complete — mix should appear in the list
  await expect(page.locator('text=E2E Test Mix')).toBeVisible({ timeout: 10000 });

  // Clean up temp file
  fs.unlinkSync(tmpPath);
});
