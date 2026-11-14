import { test, expect } from '@playwright/test';

test('Fehlerhafte Ressourcen exakt ermitteln', async ({ page }) => {
  const failures = new Map();

  page.on('response', response => {
    if (response.status() >= 400) {
      const request = response.request();
      const key = `${response.status()}|${response.url()}`;

      failures.set(key, {
        status: response.status(),
        type: request.resourceType(),
        method: request.method(),
        url: response.url()
      });
    }
  });

  page.on('requestfailed', request => {
    const key = `REQUEST_FAILED|${request.url()}`;

    failures.set(key, {
      status: 'REQUEST_FAILED',
      type: request.resourceType(),
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || 'unbekannt'
    });
  });

  const response = await page.goto('/', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  expect(response).not.toBeNull();

  await page.waitForTimeout(5000);

  console.log('\n=== FEHLERHAFTE RESSOURCEN ===');

  if (failures.size === 0) {
    console.log('KEINE');
  } else {
    for (const failure of failures.values()) {
      const error = failure.error ? ` | ${failure.error}` : '';

      console.log(
        `${failure.status} | ${failure.method} | ${failure.type} | ${failure.url}${error}`
      );
    }
  }

  console.log('=== ENDE RESSOURCEN ===\n');
});
