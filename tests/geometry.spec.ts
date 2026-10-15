import { expect, test } from '@playwright/test';
import path from 'node:path';

// Zero-size probes ask the browser for projected corners. This deliberately
// does not import the application's projection or reconstruct its matrices.
async function measureGeometry(wheel: HTMLElement, { frames = 1 } = {}) {
  function corners(element: HTMLElement) {
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
    return [[0, 0], [100, 0], [100, 100], [0, 100]].map(([x, y], index) => {
      let probe = element.querySelector<HTMLElement>(`:scope > [data-probe="${index}"]`);
      if (!probe) {
        probe = document.createElement('span');
        probe.dataset.probe = String(index);
        probe.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:0;height:0;padding:0;border:0;pointer-events:none`;
        element.append(probe);
      }
      const rect = probe.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
  }
  const rails = [...wheel.querySelectorAll<SVGPathElement>('.rail-front, .rail-inner')];
  const railPoint = (rail: SVGPathElement, length: number) => rail.getPointAtLength(length).matrixTransform(rail.getScreenCTM()!);
  let margin = Infinity, railError = 0, joinError = 0, lineError = 0, centerError = 0, samples = 0;
  let movingFrames = 0;
  for (let frame = 0; frame < frames; frame++) {
    await new Promise(requestAnimationFrame);
    if (wheel.dataset.rotating === 'true') movingFrames++;
    let previous: ReturnType<typeof corners> | undefined;
    for (const segment of wheel.querySelectorAll<HTMLElement>('.wheel-segment')) {
      if (getComputedStyle(segment).visibility === 'hidden') { previous = undefined; continue; }
      const polygon = corners(segment);
      if (previous) {
        joinError = Math.max(joinError,
          Math.hypot(previous[3].x - polygon[0].x, previous[3].y - polygon[0].y),
          Math.hypot(previous[2].x - polygon[1].x, previous[2].y - polygon[1].y));
      }
      previous = polygon;
      for (const corner of polygon) {
        const distance = Math.min(...rails.map(rail => {
          let low = 0, high = rail.getTotalLength();
          for (let i = 0; i < 24; i++) {
            const middle = (low + high) / 2;
            if (railPoint(rail, middle).y < corner.y) low = middle;
            else high = middle;
          }
          const point = railPoint(rail, (low + high) / 2);
          return Math.hypot(point.x - corner.x, point.y - corner.y);
        }));
        railError = Math.max(railError, distance);
      }
      const lines = segment.querySelectorAll<SVGPathElement>('.row-line');
      for (const line of lines) {
        const top = line.getAttribute('d') === 'M 0 0 L 1 0';
        const [a, b] = top ? [polygon[0], polygon[1]] : [polygon[3], polygon[2]];
        const rect = line.getBoundingClientRect();
        lineError = Math.max(lineError, Math.abs(rect.left - Math.min(a.x, b.x)), Math.abs(rect.right - Math.max(a.x, b.x)),
          Math.abs(rect.top - Math.min(a.y, b.y)), Math.abs(rect.bottom - Math.max(a.y, b.y)));
      }
      for (const child of segment.querySelectorAll<HTMLElement>('.wheel-glyph, .wheel-label')) {
        for (const point of corners(child)) {
          for (let i = 0; i < 4; i++) {
            const a = polygon[i], b = polygon[(i + 1) % 4];
            const signedDistance = ((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) / Math.hypot(b.x - a.x, b.y - a.y);
            margin = Math.min(margin, signedDistance);
          }
        }
      }
      // Test centering in the cell before perspective, including wrapped text.
      const button = segment.querySelector<HTMLButtonElement>('button')!;
      const content = segment.querySelector<HTMLElement>('.wheel-content')!;
      centerError = Math.max(centerError, Math.abs(content.offsetTop + content.offsetHeight / 2 - button.clientHeight / 2));
      samples++;
    }
  }
  return { margin, railError, joinError, lineError, centerError, samples, movingFrames };
}

function expectContained(result: Awaited<ReturnType<typeof measureGeometry>>) {
  expect(result.samples).toBeGreaterThan(0);
  expect(result.margin, 'unclipped glyph/label corners stay inside their cell').toBeGreaterThan(0);
  expect(result.railError, 'projected segment corners meet the rails').toBeLessThan(.3);
  expect(result.joinError, 'adjacent segments share the same boundary').toBeLessThan(.1);
  expect(result.lineError, 'rendered dividers move with the segment corners').toBeLessThan(.1);
  expect(result.centerError, 'content stays centered in the cell').toBeLessThan(1);
}

test('all segments remain contained throughout full-range drags and animated snapping', async ({ page, context, isMobile }, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Containment must come from the shared geometry, even with its safety clip
  // disabled. A clip-only workaround cannot pass these measurements.
  await page.addStyleTag({ content: '.wheel-item { clip-path: none !important; }' });
  const touch = isMobile ? await context.newCDPSession(page) : null;
  const sizes = [page.viewportSize()!, isMobile ? { width: 320, height: 844 } : { width: 1000, height: 700 }];
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const name of ['About', 'Work', 'Contact']) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (isMobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name, exact: true }).click();
      const wheel = page.getByRole('region', { name, exact: true });
      await wheel.locator('.wheel-item[aria-pressed="true"]').focus();
      await page.keyboard.press('Home');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const box = (await wheel.boundingBox())!;
      const count = await wheel.locator('.wheel-item').count();
      const x = box.x + box.width / 2, y = box.y + box.height * .55;
      if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      else {
        await page.mouse.move(x, y);
        await page.mouse.down();
      }
      const steps = (count - 1) * 12;
      for (let step = 1; step <= steps; step++) {
        const nextY = y - step / 12 * box.height * .154;
        if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: nextY }] });
        else await page.mouse.move(x, nextY);
        expectContained(await wheel.evaluate(measureGeometry));
        if (step === 17 && size === sizes[0]) {
          await page.screenshot({ path: path.resolve(`.sites-runtime/geometry-${testInfo.project.name}-${name.toLowerCase()}-drag.png`) });
        }
      }
      if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
      expectContained(await wheel.evaluate(measureGeometry, { frames: 35 }));
      await expect(wheel.locator('.wheel-item').last()).toHaveAttribute('aria-pressed', 'true');
      // Observe a long animated return and a fractional scroll + timed snap.
      await wheel.locator('.wheel-item[aria-pressed="true"]').focus();
      const returning = wheel.evaluate(measureGeometry, { frames: 40 });
      await page.keyboard.press('Home');
      const returned = await returning;
      expectContained(returned);
      expect(returned.movingFrames).toBeGreaterThan(5);
      await page.mouse.move(x, y);
      const scrolling = wheel.evaluate(measureGeometry, { frames: 45 });
      await page.mouse.wheel(0, 43 * await page.evaluate(() => devicePixelRatio));
      const scrolled = await scrolling;
      expectContained(scrolled);
      expect(scrolled.movingFrames).toBeGreaterThan(5);
      await expect(wheel).toHaveAttribute('data-rotating', 'false');
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
  }
});
