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
    expect((await entry.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await entry.locator('.wheel-label').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
  }
  const software = work.getByRole('button', { name: 'Software Projects', exact: true });
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

test('separators terminate on the visible rail strokes before and after rotation', async ({ page, isMobile }) => {
  for (const name of ['About', 'Work', 'Contact']) {
    if (isMobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name, exact: true }).click();
    const wheel = page.getByRole('region', { name, exact: true });
    for (let rotation = 0; rotation < 2; rotation++) {
      const errors = await wheel.evaluate(element => {
        const rails = [...element.querySelectorAll<SVGPathElement>('.rail-front, .rail-inner')];
        const pointAt = (path: SVGPathElement, length: number) => path.getPointAtLength(length).matrixTransform(path.getCTM()!);
        return [...element.querySelectorAll<SVGPathElement>('.row-line')]
          .filter(line => Number(getComputedStyle(line).opacity) > 0)
          .flatMap(line => [0, line.getTotalLength()].map(length => {
            const endpoint = pointAt(line, length);
            return Math.min(...rails.map(rail => {
              let low = 0, high = rail.getTotalLength();
              for (let step = 0; step < 25; step++) {
                const middle = (low + high) / 2;
                if (pointAt(rail, middle).y < endpoint.y) low = middle;
                else high = middle;
              }
              const nearest = pointAt(rail, (low + high) / 2);
              return Math.hypot(endpoint.x - nearest.x, endpoint.y - nearest.y);
            }));
          }));
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(Math.max(...errors)).toBeLessThan(.3);
      await wheel.locator('.wheel-item[aria-pressed="true"]').focus();
      await page.keyboard.press('ArrowDown');
    }
  }
});
