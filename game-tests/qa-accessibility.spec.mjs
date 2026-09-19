import { test, expect } from '@playwright/test';

const url = '/?test=1&seed=42';

async function open(page) {
  await page.goto(url);
  await page.waitForFunction(() => window.__RUN_TEST__?.ready());
}

async function start(page) {
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__RUN_TEST__.snapshot().phase === 'running');
}

function pursuerDraws(state) {
  return state.draws.filter(draw => draw.name.startsWith('chaser'));
}

function expectVisiblePursuerPair(state, names) {
  const draws = pursuerDraws(state);
  expect(draws.map(draw => draw.name)).toEqual(expect.arrayContaining(names));
  expect(Math.abs(draws[0].anchorX-draws[1].anchorX)).toBeGreaterThan(20);
  for (const draw of draws) {
    expect(draw.x).toBeGreaterThanOrEqual(0);
    expect(draw.y).toBeGreaterThanOrEqual(0);
    expect(draw.y + draw.h).toBeLessThanOrEqual(state.view.height + 0.5);
  }
}

test('touch actions are named, reachable, and large enough to activate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await start(page);

  const jump = page.getByRole('button', { name: /jump/i });
  const roll = page.getByRole('button', { name: /roll/i });
  await expect(jump).toBeVisible();
  await expect(roll).toBeVisible();
  await expect(jump).toBeEnabled();
  await expect(roll).toBeEnabled();
  for (const control of [jump, roll]) {
    const box = await control.boundingBox();
    expect(box?.width, 'touch control width').toBeGreaterThanOrEqual(44);
    expect(box?.height, 'touch control height').toBeGreaterThanOrEqual(44);
    await expect(control).toHaveRole('button');
  }

  await jump.focus();
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.__RUN_TEST__.advance(.05));
  await expect.poll(async () => page.evaluate(() => window.__RUN_TEST__.snapshot().player.y)).toBeGreaterThan(0);
});

test('controller menu navigation and disconnect preserve an accessible pause path', async ({ page }) => {
  await page.addInitScript(() => {
    window.padButtons = Array(17).fill(false);
    window.padPresent = true;
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => window.padPresent ? [{
        index: 0,
        mapping: 'standard',
        connected: true,
        axes: [0, 0],
        buttons: window.padButtons.map(pressed => ({ pressed, value: pressed ? 1 : 0 })),
      }] : [],
    });
  });
  await open(page);

  const press = index => page.evaluate(button => {
    window.padButtons[button] = true;
    window.__RUN_TEST__.poll();
    window.padButtons[button] = false;
    window.__RUN_TEST__.poll();
  }, index);

  await press(0);
  await expect.poll(async () => page.evaluate(() => window.__RUN_TEST__.snapshot().phase)).toBe('running');
  await press(9);
  await expect(page.getByRole('button', { name: /resume/i })).toBeFocused();
  await page.evaluate(() => { window.padPresent = false; window.__RUN_TEST__.poll(); });
  await expect(page.locator('#pausePanel')).toBeVisible();
  await expect(page.locator('#pauseReason')).toHaveText('Controller disconnected');
  await expect(page.getByRole('button', { name: /resume/i })).toBeFocused();
});

test('the two suit pursuers keep a visible floor fallback and rejoin after action poses', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await start(page);

  let state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  expectVisiblePursuerPair(state, ['chaserStart', 'chaser2Start']);
  await page.evaluate(() => window.__RUN_TEST__.advance(1.4));
  state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  expectVisiblePursuerPair(state, ['chaser', 'chaser2']);

  await page.evaluate(() => window.__RUN_TEST__.command('jump'));
  // The pursuers intentionally copy the verb after a short readable delay.
  await page.evaluate(() => window.__RUN_TEST__.advance(.4));
  state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  expectVisiblePursuerPair(state, ['chaserJump', 'chaser2Jump']);

  await page.evaluate(() => window.__RUN_TEST__.advance(1.5));
  state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  expectVisiblePursuerPair(state, ['chaser', 'chaser2']);

  await page.evaluate(() => window.__RUN_TEST__.command('roll', true));
  await page.evaluate(() => window.__RUN_TEST__.advance(.4));
  state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  expectVisiblePursuerPair(state, ['chaserRoll', 'chaser2Roll']);
});
