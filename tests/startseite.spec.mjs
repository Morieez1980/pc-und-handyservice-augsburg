import { test, expect } from '@playwright/test';

const profiles = [
  { name: 'desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'smartphone', viewport: { width: 390, height: 844 } }
];

for (const profile of profiles) {
  test(`Startseite ${profile.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: profile.viewport });
    const page = await context.newPage();
    const failures = [];

    page.on('pageerror', error => failures.push(`PAGEERROR | ${error.message}`));
    page.on('response', response => {
      if (response.status() >= 400) {
        failures.push(`${response.status()} | ${response.request().resourceType()} | ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      failures.push(`REQUEST_FAILED | ${request.resourceType()} | ${request.url()} | ${request.failure()?.errorText || 'unbekannt'}`);
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await page.waitForTimeout(5000);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('#anfahrt')).toBeAttached();

    await page.screenshot({
      path: `test-results/screenshots/startseite-${profile.name}.png`,
      fullPage: true
    });

    expect(failures, `Browser-/HTTP-Fehler bei ${profile.name}:\n${failures.join('\n')}`).toEqual([]);
    await context.close();
  });
}
