import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LE TRI LAM', exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function chooseSection(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name, exact: true }).click();
  return page.getByRole('region', { name, exact: true });
}

test('monochrome interface fits the viewport with accessible wheel controls', async ({ page, isMobile }) => {
  await expect(page.locator('.wheel:visible')).toHaveCount(isMobile ? 1 : 3);
  const measurements = await page.evaluate(() => ({
    background: getComputedStyle(document.documentElement).backgroundColor,
    overflow: document.documentElement.scrollWidth > innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    height: innerHeight,
  }));
  expect(measurements.background).toBe('rgb(0, 0, 0)');
  expect(measurements.overflow).toBe(false);
  expect(measurements.scrollHeight).toBeLessThanOrEqual(measurements.height);
  await expect(page.getByRole('button', { name: 'About Me', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('keyboard selection is bounded, opens details, and returns focus', async ({ page }) => {
  const first = page.getByRole('button', { name: 'About Me', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowUp');
  await expect(first).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const education = page.getByRole('button', { name: 'Education', exact: true });
  await expect(education).toBeFocused();
  await expect(education).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Education', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close details' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(education).toBeFocused();
  await expect(education).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('End');
  const skills = page.getByRole('button', { name: 'Skills', exact: true });
  await expect(skills).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(skills).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
});

test('clicking an inactive entry opens its content and keeps its selection', async ({ page }) => {
  const experience = page.getByRole('button', { name: 'Experience', exact: true });
  await experience.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(experience).toHaveAttribute('aria-pressed', 'true');
});

test('wheel input affects only the hovered selector and snaps at both ends', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  const box = await about.boundingBox();
  const deviceScale = await page.evaluate(() => devicePixelRatio);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 115 * deviceScale);
  await expect(about.getByRole('button', { name: 'Education', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Snapping is debounced after the last wheel event.
  await expect.poll(() => about.getByRole('button', { name: 'Education', exact: true }).evaluate((el) => el.style.top)).toBe('36.5625%');
  await page.mouse.wheel(0, 5000);
  await expect(about.getByRole('button', { name: 'Skills', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.wheel(0, 5000);
  await expect(about.getByRole('button', { name: 'Skills', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.wheel(0, -5000);
  await expect(about.getByRole('button', { name: 'About Me', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wheel--center [data-index="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.wheel--right [data-index="0"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('all placeholder contact entries have honest unavailable states and no fake links', async ({ page, isMobile }) => {
  const contact = await chooseSection(page, 'Contact', isMobile);
  for (const name of ['Email', 'GitHub', 'LinkedIn', 'Location']) {
    await contact.getByRole('button', { name, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(dialog.getByRole('link')).toHaveCount(0);
    await expect(dialog).toContainText(name === 'Location' ? 'City, country' : 'Not added yet.');
    await page.getByRole('button', { name: 'Close details' }).click();
  }
});

test('all sample projects open with configurable metadata', async ({ page, isMobile }) => {
  const projects = await chooseSection(page, 'Projects', isMobile);
  for (const name of ['Chess Web App', 'Visual Instruction Tool', 'Audio ML Experiments', 'Automation Tools']) {
    await projects.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Built with');
    await expect(page.getByRole('dialog')).toContainText('Sample project');
    await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close details' }).click();
  }
});

test('smooth rotation settles without moving the wheel frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  const about = page.getByRole('region', { name: 'About', exact: true });
  const before = (await about.boundingBox())!;
  const education = about.getByRole('button', { name: 'Education', exact: true });
  const initialTop = await education.evaluate((el) => parseFloat(el.style.top));
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.wheel(0, 115 * await page.evaluate(() => devicePixelRatio));
  await expect(education).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => education.evaluate((el) => parseFloat(el.style.top))).toBeLessThan(initialTop);
  await expect.poll(() => education.evaluate((el) => el.style.top)).toBe('36.5625%');
  expect(await about.boundingBox()).toEqual(before);
});

test('tablet layout keeps one readable wheel and switches sections', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.wheel:visible')).toHaveCount(1);
  await chooseSection(page, 'Projects', true);
  await expect(page.locator('.wheel--right')).toBeVisible();
  const project = page.getByRole('button', { name: 'Chess Web App', exact: true });
  expect(await project.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(17);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('no runtime errors or external asset requests occur during exploration', async ({ page, isMobile }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:')) external.push(request.url());
  });
  await page.reload();
  await chooseSection(page, 'About', isMobile);
  await page.getByRole('button', { name: 'About Me', exact: true }).click();
  await page.getByRole('button', { name: 'Close details' }).click();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('mobile section switching preserves selections and touch swipes do not open details', async ({ page, isMobile, context }) => {
  test.skip(!isMobile, 'Touchscreen-specific behavior');
  const about = await chooseSection(page, 'About', true);
  const box = (await about.boundingBox())!;
  const session = await context.newCDPSession(page);
  async function swipe(x1: number, y1: number, x2: number, y2: number) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * step / 8, y: y1 + (y2 - y1) * step / 8 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  const centerX = box.x + box.width / 2;
  const middleY = box.y + box.height * 0.55;
  await swipe(centerX, middleY, centerX, middleY - box.height * 0.17);
  await expect(about.getByRole('button', { name: 'Education', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await swipe(centerX + 70, middleY, centerX - 70, middleY);
  await expect(page.locator('.wheel--center')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await chooseSection(page, 'About', true);
  await expect(about.getByRole('button', { name: 'Education', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
