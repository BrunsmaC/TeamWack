import { test, expect } from '@playwright/test';

async function answer(page, taskId, text) {
  const input = page.locator(`#answer-${taskId}`);
  await input.fill(text);
  await input.locator('xpath=ancestor::form').getByRole('button', { name: 'Submit', exact: true }).click();
}

async function completeHunt(page) {
  await answer(page, 'clockkeeper', '1');
  await answer(page, 'garden-gate', 'rose');
  await answer(page, 'market-motto', 'community');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/game?code=BUC123');
});

test('incomplete tasks and incorrect answers do not celebrate', async ({ page }) => {
  await expect(page.locator('.game-progress strong')).toHaveText('0');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await answer(page, 'clockkeeper', 'wrong');
  await expect(page.getByText('Incorrect answer. Try again.')).toBeVisible();
  await expect(page.locator('.game-progress strong')).toHaveText('0');
  await answer(page, 'clockkeeper', '1');
  await answer(page, 'garden-gate', 'rose');
  await expect(page.locator('.game-progress strong')).toHaveText('2');
  await expect(page.locator('.game-summary .game-kicker')).toHaveText('Active hunt');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('final task marks hunt complete and opens a themed modal with home navigation', async ({ page }) => {
  await completeHunt(page);
  const dialog = page.getByRole('dialog', { name: 'Congratulations!' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.game-summary .game-kicker')).toHaveText('Hunt complete');
  await expect(page.locator('.game-progress strong')).toHaveText('3');
  await expect(dialog).toContainText('Congratulations for completing Old Town Secrets!');
  await expect(dialog).toContainText('All 3 tasks completed.');
  await expect(dialog).toContainText('Would you like to play another game?');
  await expect(dialog).toHaveCSS('background-color', 'rgb(255, 250, 241)');
  await expect(dialog).toHaveCSS('color', 'rgb(22, 36, 74)');
  const home = dialog.getByRole('link', { name: 'Back to home' });
  await expect(home).toHaveCSS('background-color', 'rgb(245, 200, 76)');
  await expect(home).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await home.click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('completion has no close button and Escape keeps the modal open', async ({ page }) => {
  await completeHunt(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  for (const element of [dialog, dialog.locator('.completion-medal'), dialog.locator('.completion-home')]) {
    await expect(element).toHaveCSS('box-shadow', 'none');
  }
});

test('completion modal fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await completeHunt(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('overflow', 'visible');
  expect(await dialog.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(667);
  await expect(dialog.getByRole('link', { name: 'Back to home' })).toBeInViewport();
});
