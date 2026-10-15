import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
});

test('entry labels are readable without hover and guidance stays dismissed after interaction', async ({ page, isMobile }) => {
  const work = page.locator('[data-section="work"]');
  const hint = page.locator('.interaction-hint');
  await expect(hint).toBeVisible();
  await page.mouse.move(1, 1);
  for (const entry of await work.locator('.wheel-item').all()) {
    await expect(entry.locator('.wheel-label')).toBeVisible();
    expect(await entry.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(.5);
    // Receding cells compress with the cylinder; the foreground target keeps
    // its full touch height rather than overlapping adjacent segments.
    expect((await entry.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    expect(await entry.locator('.wheel-label').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
  }
  const software = work.getByRole('button', { name: 'Software Projects', exact: true });
  expect((await software.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await software.focus();
  await expect(hint).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(hint).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-heading h3')).toHaveText('AI / ML Research');
  await page.keyboard.press('Escape');
  await expect(work.getByRole('button', { name: 'AI / ML Research', exact: true })).toBeFocused();
  await expect(hint).toBeHidden();
  if (isMobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name: 'About', exact: true }).tap();
  else await page.mouse.move(1, 1);
  await expect(hint).toBeHidden();
});
