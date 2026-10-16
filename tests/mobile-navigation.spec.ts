import { expect, test } from '@playwright/test';
import type { CDPSession } from '@playwright/test';

interface Point { x: number; y: number }

async function swipe(session: CDPSession, start: Point, end: Point, cancelled = false) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let step = 1; step <= 6; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + (end.x - start.x) * step / 6, y: start.y + (end.y - start.y) * step / 6 }],
    });
  }
  await session.send('Input.dispatchTouchEvent', { type: cancelled ? 'touchCancel' : 'touchEnd', touchPoints: [] });
}

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile section navigation');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
});

for (const width of [320, 390, 768]) {
  test(`horizontal touch swipes work across the full wheel area at ${width}px and preserve selections`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
    const session = await context.newCDPSession(page);
    const work = page.locator('[data-section="work"]');
    const frame = (await work.boundingBox())!;
    const y = frame.y + frame.height * .52;
    await swipe(session, { x: width / 2, y }, { x: width / 2, y: y - frame.height * .18 });
    await expect(work.getByRole('button', { name: 'AI / ML Research', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(work).toHaveAttribute('data-rotating', 'false');

    // Start outside the narrow cylinder, in the surrounding black space.
    expect(width - 12).toBeGreaterThan(frame.x + frame.width);
    await swipe(session, { x: width - 12, y }, { x: width - 152, y });
    const contact = page.locator('[data-section="contact"]');
    await expect(contact).toBeVisible();
    await expect(contact.getByRole('button', { name: 'GitHub', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Contact', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.detail-view')).toHaveCount(0);

    await swipe(session, { x: 12, y }, { x: 152, y });
    await expect(work).toBeVisible();
    await expect(work.getByRole('button', { name: 'AI / ML Research', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await swipe(session, { x: width / 2, y }, { x: width / 2 + 120, y });
    await expect(page.locator('[data-section="about"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'About', exact: true })).toHaveAttribute('aria-pressed', 'true');

    // The existing section buttons remain an alternative after swiping.
    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await expect(work).toBeVisible();
    await expect(work.getByRole('button', { name: 'AI / ML Research', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => scrollX)).toBe(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('short, cancelled, and outward edge swipes do not switch sections or open details', async ({ page, context }) => {
  const session = await context.newCDPSession(page);
  const work = page.locator('[data-section="work"]');
  const frame = (await work.boundingBox())!;
  const start = { x: frame.x + frame.width / 2, y: frame.y + frame.height * .52 };
  await swipe(session, start, { x: start.x - 25, y: start.y });
  await expect(work).toBeVisible();
  await swipe(session, start, { x: start.x - 140, y: start.y }, true);
  await expect(work).toBeVisible();
  await expect(work).toHaveAttribute('data-dragging', 'false');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await work.getByRole('button', { name: 'Software Projects', exact: true }).tap();
  await expect(page.locator('.detail-heading h3')).toHaveText('Software Projects');
  await page.getByRole('button', { name: 'Return to wheels' }).click();

  await swipe(session, start, { x: start.x - 140, y: start.y });
  await expect(page.locator('[data-section="contact"]')).toBeVisible();
  await swipe(session, start, { x: start.x - 140, y: start.y });
  await expect(page.locator('[data-section="contact"]')).toBeVisible();
  await swipe(session, start, { x: start.x + 140, y: start.y });
  await expect(work).toBeVisible();
  await swipe(session, start, { x: start.x + 140, y: start.y });
  await expect(page.locator('[data-section="about"]')).toBeVisible();
  await swipe(session, start, { x: start.x + 140, y: start.y });
  await expect(page.locator('[data-section="about"]')).toBeVisible();
  await expect(page.locator('.detail-view')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('horizontal gestures leave an expanded information view in place', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Software Projects', exact: true }).tap();
  const before = page.url();
  const session = await context.newCDPSession(page);
  const content = (await page.locator('.detail-scroll').boundingBox())!;
  const y = content.y + content.height / 2;
  await swipe(session, { x: content.x + content.width - 20, y }, { x: content.x + 20, y });
  await expect(page.locator('.detail-heading h3')).toHaveText('Software Projects');
  expect(page.url()).toBe(before);
  await page.getByRole('button', { name: 'Return to wheels' }).click();
  await expect(page.locator('[data-section="work"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Work', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
