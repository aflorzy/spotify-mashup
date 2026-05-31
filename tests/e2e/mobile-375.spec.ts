import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'mixes', path: '/mixes' },
  { name: 'builder', path: '/mix/new' },
];

for (const { name, path: pagePath } of PAGES) {
  test(`${name} page has no horizontal overflow at 375px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Take a screenshot for visual review
    await page.screenshot({
      path: `tests/screenshots/${name}-375px.png`,
      fullPage: true,
    });

    // Check for horizontal overflow: scrollWidth should equal viewport width
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasOverflow, `${name} page has horizontal overflow at 375px`).toBe(false);

    await context.close();
  });
}
