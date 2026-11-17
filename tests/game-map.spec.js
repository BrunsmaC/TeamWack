import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('buchunt-phone', '5551234567'));
  await page.route('**/api/hunts/BUC123/tasks**', route => route.fulfill({ json: { tasks: [
    { id: 1, title: 'Clockkeeper', description: 'Find the clock', done: false,
      location: { latitude: 36.3038, longitude: -82.367683, name: 'ETSU Carillon Clock Tower' } },
    { id: 2, title: 'Hidden Garden', description: 'Find the garden', done: true,
      location: { latitude: 36.314, longitude: -82.355, name: 'Founders Park' } },
    { id: 3, title: 'Unmapped stop', description: 'No coordinates', done: false, location: null },
  ] } }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
});

test('maps task coordinates, completion status, and live location updates', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 36.3038, longitude: -82.367683, accuracy: 10 });
  await page.goto('/game?code=BUC123');
  await expect(page.locator('.hunt-stop')).toHaveCount(2);
  await expect(page.locator('.hunt-stop-complete')).toHaveCount(1);
  await expect(page.getByText('1 task(s) have no valid location yet.')).toBeVisible();
  await page.getByRole('button', { name: '1. Clockkeeper', exact: true }).click();
  await expect(page.locator('.leaflet-popup-content')).toContainText('ETSU Carillon Clock Tower');
  await page.getByRole('button', { name: 'Enable location' }).click();
  await expect(page.getByRole('status')).toContainText('Location live');
  await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(2);
  await context.setGeolocation({ latitude: 36.314, longitude: -82.355, accuracy: 25 });
  await expect(page.getByRole('status')).toContainText('25 m');
  await page.getByRole('button', { name: 'Show tasks' }).click();
  await page.getByRole('button', { name: 'Stop tracking' }).click();
  await expect(page.getByRole('status')).toHaveText('Location tracking stopped.');
  await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(0);
});

test('location denial leaves the task map usable', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.watchPosition = (_success, error) => {
      queueMicrotask(() => error({ code: 1 }));
      return 1;
    };
    navigator.geolocation.clearWatch = () => {};
  });
  await page.goto('/game?code=BUC123');
  await page.getByRole('button', { name: 'Enable location' }).click();
  await expect(page.getByRole('status')).toContainText('Location access denied');
  await expect(page.locator('.hunt-stop')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Show tasks' })).toBeEnabled();
});
