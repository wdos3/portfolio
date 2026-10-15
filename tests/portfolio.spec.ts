import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LE TRI LAM', exact: true })).toBeVisible();
});

async function chooseSection(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole('group', { name: 'Choose a section' }).getByRole('button', { name, exact: true }).click();
  return page.getByRole('region', { name, exact: true });
}

async function openEntry(page: Page, section: string, name: string, mobile: boolean) {
  const wheel = await chooseSection(page, section, mobile);
  const button = wheel.getByRole('button', { name, exact: true });
  if (await button.getAttribute('aria-pressed') !== 'true') {
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await button.click();
  await expect(page.locator('.wheel--expanded h3')).toHaveText(name);
}

async function closeDetails(page: Page) {
  await page.getByRole('button', { name: 'Return to wheels' }).click();
  await expect(page.locator('.wheel--expanded')).toHaveCount(0);
  await expect(page.locator('.detail-view')).toHaveCount(0);
}

test('the monochrome overview prioritizes Work between About and Contact', async ({ page, isMobile }) => {
  expect(await page.locator('.wheel').evaluateAll(elements => elements.map(el=>el.getAttribute('data-section')))).toEqual(['about', 'work', 'contact']);
  await expect(page.locator('.wheel:visible')).toHaveCount(isMobile ? 1 : 3);
  await expect(page.locator('[data-section="work"]')).toBeVisible();
  await expect(page.getByText('Software Development · Machine Learning', { exact: true })).toBeVisible();
  const measurements = await page.evaluate(() => ({
    black: getComputedStyle(document.documentElement).backgroundColor,
    overflow: document.documentElement.scrollWidth > innerWidth,
    fits: document.documentElement.scrollHeight <= innerHeight,
  }));
  expect(measurements).toEqual({ black: 'rgb(0, 0, 0)', overflow: false, fits: true });
  await expect(page.locator('.wheel-item-number')).toHaveCount(0);
  const work = page.locator('[data-section="work"]');
  await expect(work.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(work.locator('[aria-pressed="true"]')).toHaveAccessibleName('Software Projects');
  if (!isMobile) expect((await work.boundingBox())!.width).toBeGreaterThan((await page.locator('[data-section="about"]').boundingBox())!.width);
});

test('keyboard rotation is bounded and expansion returns focus to the selected icon', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  await about.getByRole('button', { name: 'Education', exact: true }).focus();
  await page.keyboard.press('Home');
  const profile = about.getByRole('button', { name: 'Profile', exact: true });
  await expect(profile).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(profile).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const education = about.getByRole('button', { name: 'Education', exact: true });
  await expect(education).toBeFocused();
  await page.keyboard.press('Enter');
  const heading = page.getByRole('heading', { name: 'Education', exact: true });
  await expect(heading).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('group', { name: 'Scrollable details' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Return to wheels' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await expect(education).toBeFocused();
  await page.keyboard.press('End');
  const resume = about.getByRole('button', { name: 'Résumé / CV', exact: true });
  await expect(resume).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(resume).toBeFocused();
});

test('inactive icons select first, then their wheel becomes the information view', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  const experience = about.getByRole('button', { name: 'Experience', exact: true });
  await experience.click();
  await expect(experience).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await experience.click();
  await expect(about).toHaveClass(/wheel--expanded/);
  await expect(about.getByRole('heading', { name: 'Experience', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await closeDetails(page);
  await expect(experience).toHaveAttribute('aria-pressed', 'true');
});

test('hovered wheel scrolling snaps independently without scrolling the page', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  const box = (await about.boundingBox())!;
  const initial = (await about.getByRole('button', { name: 'Education', exact: true }).boundingBox())!;
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await page.mouse.wheel(0, 115 * await page.evaluate(()=>devicePixelRatio));
  const experience = about.getByRole('button', { name: 'Experience', exact: true });
  await expect(experience).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => Math.abs((await experience.boundingBox())!.y - initial.y)).toBeLessThan(1);
  await page.mouse.wheel(0, 5000);
  await expect(about.getByRole('button', { name: 'Résumé / CV', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.wheel(0, -5000);
  await expect(about.getByRole('button', { name: 'Profile', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-section="work"] [data-index="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-section="contact"] [data-index="1"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
});

test('normal motion follows the curved path and changes foreground emphasis', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished)));
  const frame = (await about.boundingBox())!;
  const next = about.getByRole('button', { name: 'Experience', exact: true });
  const before = (await next.boundingBox())!;
  const glyphWidth = (await next.locator('svg').boundingBox())!.width;
  const current = (await about.getByRole('button', { name: 'Education', exact: true }).boundingBox())!;
  await page.mouse.move(frame.x + frame.width/2, frame.y + frame.height/2);
  await page.mouse.wheel(0, 115 * await page.evaluate(()=>devicePixelRatio));
  await expect(next).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async()=>Math.abs((await next.boundingBox())!.y-current.y)).toBeLessThan(1);
  expect(Math.abs((await next.boundingBox())!.x-before.x)).toBeGreaterThan(1);
  expect((await next.locator('svg').boundingBox())!.width).toBeGreaterThan(glyphWidth*1.15);
  expect(await about.boundingBox()).toEqual(frame);
});

test('all wheel selections survive expansion and reverse transformation', async ({ page, isMobile }) => {
  const about = await chooseSection(page, 'About', isMobile);
  await about.getByRole('button', { name: 'Experience', exact: true }).click();
  await expect(about.getByRole('button', { name: 'Experience', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const contact = await chooseSection(page, 'Contact', isMobile);
  await contact.getByRole('button', { name: 'LinkedIn', exact: true }).click();
  await expect(contact.getByRole('button', { name: 'LinkedIn', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const work = await chooseSection(page, 'Work', isMobile);
  const readSelections = () => page.locator('.wheel-item[aria-pressed="true"]').evaluateAll(buttons=>buttons.map(button=>button.getAttribute('aria-label')));
  const before = await readSelections();
  await work.getByRole('button', { name: 'Software Projects', exact: true }).click();
  await expect(work).toHaveClass(/wheel--expanded/);
  await closeDetails(page);
  expect(await readSelections()).toEqual(before);
});

test('expanded rails straighten and siblings move aside, then return smoothly', async ({ page, isMobile }) => {
  await chooseSection(page, 'Work', isMobile);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished)));
  const work = page.locator('[data-section="work"]');
  const before = (await work.boundingBox())!;
  const curvature = () => work.locator('.rail-start').evaluate(el=>{
    const path=el as SVGPathElement, length=path.getTotalLength();
    const points=[0,0.5,1].map(t=>path.getPointAtLength(length*t).x);
    return Math.max(...points)-Math.min(...points);
  });
  expect(await curvature()).toBeGreaterThan(10);
  await work.getByRole('button', { name: 'Software Projects', exact: true }).click();
  await expect(work).toHaveClass(/wheel--expanded/);
  await expect.poll(curvature).toBeLessThan(0.1);
  if (!isMobile) {
    await expect.poll(async()=>(await work.boundingBox())!.width).toBeGreaterThan(before.width*2);
    for(const sibling of await page.locator('.wheel--parked').all()) {
      await expect(sibling).toHaveAttribute('inert', '');
      expect(await sibling.evaluate(el=>Number(getComputedStyle(el).opacity))).toBeLessThan(0.3);
    }
  }
  await closeDetails(page);
  await expect.poll(async()=>Math.abs((await work.boundingBox())!.width-before.width)).toBeLessThan(1);
  expect(await curvature()).toBeGreaterThan(10);
  await expect(work.getByRole('button', { name: 'Software Projects', exact: true })).toBeFocused();
});

test('contact values and CV remain honestly unavailable until configured', async ({ page, isMobile }) => {
  for (const name of ['Email','GitHub','LinkedIn','Location']) {
    await openEntry(page, 'Contact', name, isMobile);
    await expect(page.locator('.detail-view')).toContainText('Not added yet.');
    await expect(page.locator('.detail-view a')).toHaveCount(0);
    await closeDetails(page);
  }
  const about=await chooseSection(page,'About',isMobile);
  await about.getByRole('button',{name:'Education',exact:true}).focus();
  await page.keyboard.press('End');
  await expect(about.getByRole('button',{name:'Résumé / CV',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-view')).toContainText('CV not added yet');
  await expect(page.locator('.detail-view a[download]')).toHaveCount(0);
});

test('software and experiment details expose every required field without invented results', async ({ page, isMobile }) => {
  for(const [category,name] of [['Software Projects','Chess Web App'],['Software Projects','Visual Instruction Tool'],['Software Projects','Automation Tools'],['Experiments','Audio ML Experiments']]) {
    await openEntry(page,'Work',category,isMobile);
    await page.locator('.work-list').getByRole('link',{name:new RegExp(name)}).click();
    await expect(page.locator('.detail-heading h3')).toHaveText(name);
    for(const title of ['Problem','My contributions','Challenges','Results']) await expect(page.locator('.detail-view').getByRole('heading',{name:title,exact:true})).toBeAttached();
    await expect(page.locator('.detail-view')).toContainText('No results have been added.');
    await expect(page.locator('.detail-view')).toContainText('Sample project');
    await expect(page.locator('.detail-view')).toContainText('Technologies');
    await expect(page.locator('.detail-view')).toContainText('Development');
    await closeDetails(page);
  }
  await openEntry(page,'Work','AI / ML Research',isMobile);
  await expect(page.locator('.detail-view')).toContainText('No entries have been added yet.');
});

test('project URLs survive reload and support copy, back, and forward', async ({ page }) => {
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(value:string)=>sessionStorage.setItem('copied-project-link',value)}}));
  await page.goto('/#/work/software');
  await page.locator('.work-list').getByRole('link',{name:/Chess Web App/}).click();
  await expect(page).toHaveURL(/#\/work\/software\/chess-web-app$/);
  await page.reload();
  await expect(page.locator('.detail-heading h3')).toHaveText('Chess Web App');
  await expect(page).toHaveTitle('Chess Web App — Le Tri Lam');
  await page.getByRole('button',{name:'Copy project link'}).click();
  expect(await page.evaluate(()=>sessionStorage.getItem('copied-project-link'))).toBe(page.url());
  await page.goBack();
  await expect(page.locator('.detail-heading h3')).toHaveText('Software Projects');
  await page.goForward();
  await expect(page.locator('.detail-heading h3')).toHaveText('Chess Web App');
  await closeDetails(page);
  await page.goBack();
  await expect(page.locator('.detail-heading h3')).toHaveText('Chess Web App');
});

test('invalid or mismatched URLs recover to an accessible overview', async ({ page }) => {
  for(const path of ['/#/work/research/chess-web-app','/#/work/software/missing','/#/about/%ZZ']) {
    await page.goto(path);
    await expect(page.getByRole('status')).toContainText('This entry is unavailable');
    await expect(page.locator('.wheel--expanded')).toHaveCount(0);
    await page.getByRole('link',{name:'Return to wheels',exact:true}).click();
    await expect(page.getByRole('status')).toHaveCount(0);
  }
});

test('tablet and small screens keep readable content without horizontal overflow', async ({ page }) => {
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await expect(page.locator('.wheel:visible')).toHaveCount(1);
    await expect(page.locator('[data-section="work"]')).toBeVisible();
    await page.goto('/#/work/software/chess-web-app');
    await expect(page.locator('.detail-heading h3')).toHaveText('Chess Web App');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const back=page.getByRole('button',{name:'Return to wheels'});
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await closeDetails(page);
  }
});

test('reduced motion disables transformation animations and labels remain keyboard accessible', async ({ page }) => {
  const software=page.getByRole('button',{name:'Software Projects',exact:true});
  await software.focus();
  await expect(software.locator('.wheel-label')).toHaveCSS('opacity','1');
  await page.keyboard.press('Enter');
  await expect(page.locator('.wheel--expanded')).toHaveCSS('transition-duration','0s');
  await expect(page.locator('.detail-body')).toHaveCSS('animation-name','none');
  await page.keyboard.press('Escape');
  await expect(software).toBeFocused();
});

test('expansion and project navigation make no external asset requests or runtime errors', async ({ page }) => {
  const errors:string[]=[], external:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173')&&!request.url().startsWith('data:'))external.push(request.url());});
  await page.reload();
  await page.getByRole('button',{name:'Software Projects',exact:true}).click();
  await page.locator('.work-list').getByRole('link',{name:/Chess Web App/}).click();
  await closeDetails(page);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('touch rotation, immediate taps, and horizontal switching preserve state', async ({ page,isMobile,context }) => {
  test.skip(!isMobile,'Touchscreen-specific behavior');
  const work=page.locator('[data-section="work"]');
  const box=(await work.boundingBox())!;
  const session=await context.newCDPSession(page);
  async function swipe(x1:number,y1:number,x2:number,y2:number){
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
    for(let step=1;step<=8;step++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*step/8,y:y1+(y2-y1)*step/8}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const x=box.x+box.width/2,y=box.y+box.height*.55;
  await swipe(x,y,x,y-box.height*.17);
  const research=work.getByRole('button',{name:'AI / ML Research',exact:true});
  await expect(research).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await research.tap();
  await expect(page.locator('.detail-heading h3')).toHaveText('AI / ML Research');
  await page.getByRole('button',{name:'Return to wheels'}).tap();
  await expect(page.locator('.detail-view')).toHaveCount(0);
  await swipe(x+70,y,x-70,y);
  await expect(page.locator('[data-section="contact"]')).toBeVisible();
  await chooseSection(page,'Work',true);
  await expect(research).toHaveAttribute('aria-pressed','true');
});

test('expanded project content scrolls by touch without rotating its wheel', async ({ page,isMobile,context }) => {
  test.skip(!isMobile,'Touchscreen-specific behavior');
  await page.goto('/#/work/software/chess-web-app');
  const scroll=page.locator('.detail-scroll');
  const box=(await scroll.boundingBox())!;
  const session=await context.newCDPSession(page);
  const x=box.x+box.width/2,y=box.y+box.height*.8;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let step=1;step<=10;step++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-box.height*.6*step/10}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(40);
  await expect(page.locator('[data-section="work"] .wheel-item[data-index="0"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.detail-heading h3')).toHaveText('Chess Web App');
  expect(await page.evaluate(()=>scrollY)).toBe(0);
});
