import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (isMobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name: 'About', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
});

test('held drags track the pointer without icon or separator drift and snap only on release', async ({ page }) => {
  const about = page.locator('[data-section="about"]');
  const education = about.getByRole('button', { name: 'Education', exact: true });
  const before = (await education.boundingBox())!;
  const frame = (await about.boundingBox())!;
  const title = about.getByRole('heading', { name: 'About', exact: true });
  const titleBefore = await title.boundingBox();
  const distance = frame.height * .1;
  const x = before.x + before.width / 2, y = before.y + before.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - distance);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const held = (await education.boundingBox())!;
  expect(Math.abs(before.y - held.y - distance)).toBeLessThan(3);
  const separators = await about.locator('.row-line').evaluateAll(lines => lines.map(line => line.getBoundingClientRect().y));
  await page.waitForTimeout(300);
  expect(await education.boundingBox()).toEqual(held);
  expect(await about.locator('.row-line').evaluateAll(lines => lines.map(line => line.getBoundingClientRect().y))).toEqual(separators);
  expect(await title.boundingBox()).toEqual(titleBefore);
  expect(titleBefore!.y + titleBefore!.height).toBeLessThan(Math.min(...separators));
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await page.mouse.up();
  const experience = about.getByRole('button', { name: 'Experience', exact: true });
  await expect(experience).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => Math.abs((await experience.boundingBox())!.y - before.y)).toBeLessThan(.1);
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await expect(page.locator('[data-section="work"] [data-index="0"]')).toHaveAttribute('aria-pressed', 'true');
  await experience.click();
  await expect(page.locator('.detail-heading h3')).toHaveText('Experience');
});

test('grabbing a settling wheel freezes its visible position and resumes without a jump', async ({ page }) => {
  const about = page.locator('[data-section="about"]');
  const education = about.getByRole('button', { name: 'Education', exact: true });
  const before = (await education.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.wheel(0, 115 * await page.evaluate(() => devicePixelRatio));
  await expect.poll(async () => before.y - (await education.boundingBox())!.y).toBeGreaterThan(5);
  await page.mouse.down();
  const grabbed = (await education.boundingBox())!;
  await page.waitForTimeout(250);
  expect(await education.boundingBox()).toEqual(grabbed);
  const mouseY = before.y + before.height / 2;
  await page.mouse.move(before.x + before.width / 2, mouseY - 10);
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const moved = (await education.boundingBox())!;
  expect(grabbed.y - moved.y).toBeGreaterThan(0);
  expect(grabbed.y - moved.y).toBeLessThan(11);
  await page.mouse.up();
  await expect(page.locator('.detail-view')).toHaveCount(0);
});

test('capture survives leaving the wheel and reversing at an end has no dead zone', async ({ page }) => {
  const about = page.locator('[data-section="about"]');
  const box = (await about.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height * .52;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, -500);
  await expect(about.getByRole('button', { name: 'Résumé / CV', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(x + box.width, -500 + box.height * .18);
  await expect(about.getByRole('button', { name: 'Skills', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.up();
  await page.waitForTimeout(450);
  const settled = await about.locator('.wheel-item').evaluateAll(items => items.map(item => item.getBoundingClientRect().y));
  await page.mouse.move(x, y);
  await page.mouse.move(x, y - 90);
  expect(await about.locator('.wheel-item').evaluateAll(items => items.map(item => item.getBoundingClientRect().y))).toEqual(settled);
  await expect(about).toHaveAttribute('data-dragging', 'false');
  await expect(page.locator('.detail-view')).toHaveCount(0);
});

test('a diagonal gesture keeps its initial axis instead of both rotating and switching', async ({ page, isMobile }) => {
  const about = page.locator('[data-section="about"]');
  const box = (await about.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height * .52;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 2, y - 12);
  await page.mouse.move(x - 140, y - box.height * .18);
  await page.mouse.up();
  await expect(about).toBeVisible();
  await expect(about.getByRole('button', { name: 'Experience', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(450);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 15, y - 2);
  await page.mouse.move(x - 140, y - box.height * .25);
  await page.mouse.up();
  await expect(about.locator('[aria-label="Experience"]')).toHaveAttribute('aria-pressed', 'true');
  if (isMobile) await expect(page.locator('[data-section="work"]')).toBeVisible();
  else await expect(page.locator('[data-section="work"] [data-index="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('cancelled touch drags recover for immediate swipes and taps', async ({ page, isMobile, context }) => {
  test.skip(!isMobile, 'Touchscreen-specific behavior');
  const about = page.locator('[data-section="about"]');
  const box = (await about.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height * .52;
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - box.height * .18 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(about).toHaveAttribute('data-dragging', 'false');
  await expect(about.getByRole('button', { name: 'Experience', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(450);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + box.height * .18 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const education = about.getByRole('button', { name: 'Education', exact: true });
  await expect(education).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await education.tap();
  await expect(page.locator('.detail-heading h3')).toHaveText('Education');
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
