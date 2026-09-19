import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/editor.html?test=1');
  await page.evaluate(() => localStorage.removeItem('sneakers-run-editor-v1'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(window.__EDITOR_TEST__))).toBe(true);
});

test('loads every shipping element into an editable source block', async ({ page }) => {
  await expect(page.getByRole('button', { name: /loading dock/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /camera chaser/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /coin pickup/i })).toBeVisible();
  const route = await page.evaluate(() => window.__EDITOR_TEST__.state());
  expect(route.entities.length).toBeGreaterThan(20);
  expect(route.pickups.length).toBeGreaterThan(40);
  expect(route.entities.some(item => item.type === 'rival')).toBe(true);
});

test('dragging from the palette places a selected, movable element', async ({ page }) => {
  const car = page.getByRole('button', { name: /parked car/i });
  const canvas = page.locator('#editorCanvas');
  const before = await page.evaluate(() => window.__EDITOR_TEST__.state().entities.length);
  await car.dragTo(canvas, { targetPosition: { x: 430, y: 400 } });
  await expect(page.locator('#selectionName')).toHaveText(/parked car/i);
  expect(await page.evaluate(() => window.__EDITOR_TEST__.state().entities.length)).toBe(before + 1);
  await page.locator('#xInput').fill('925');
  await page.locator('#xInput').press('Tab');
  const selected = await page.evaluate(() => window.__EDITOR_TEST__.state().entities.at(-1));
  expect(selected.x).toBe(925);
});

test('dragging an existing canvas element updates its authored world position', async ({ page }) => {
  await page.getByRole('button', { name: /road barrier/i }).dblclick();
  const canvas = page.locator('#editorCanvas');
  const box = await canvas.boundingBox();
  const before = await page.evaluate(() => window.__EDITOR_TEST__.state().entities.at(-1));
  const start = {
    x: box.x + (before.x + before.width / 2) * .5,
    y: box.y + box.height - 56 - before.height * .25,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 100, start.y - 20);
  await page.mouse.up();
  const after = await page.evaluate(() => window.__EDITOR_TEST__.state().entities.at(-1));
  expect(after.x).toBeGreaterThan(before.x);
  expect(after.y).toBeGreaterThan(before.y);
});

test('background scenery is selectable and saved with the route JSON', async ({ page }) => {
  await page.getByLabel('Background scenery').selectOption('4');
  const route = await page.evaluate(() => window.__EDITOR_TEST__.state());
  expect(route.backgroundStage).toBe(4);
});

test('shares the gameplay background placement contract and keeps the playable lane in front', async ({ page }) => {
  const result = await page.evaluate(() => {
    window.__EDITOR_TEST__.loadStage(5);
    const route = window.__EDITOR_TEST__.state();
    const order = window.__EDITOR_TEST__.paintOrder();
    const landmark = route.entities.find(item => item.background && item.type === 'marketStall');
    const platform = route.entities.find(item => !item.background && item.type === 'platform' && item.y > 0);
    const view = window.__EDITOR_TEST__.view();
    window.__EDITOR_TEST__.scrollTo(landmark.x - 300);
    return { order, landmark, platform, placement: window.__EDITOR_TEST__.placement(landmark), bounds: window.__EDITOR_TEST__.bounds(landmark), view: window.__EDITOR_TEST__.view() };
  });

  expect(result.landmark).toBeTruthy();
  expect(result.platform).toBeTruthy();
  expect(result.placement).toMatchObject({ background: true, track: 2 });
  expect(result.placement.alpha).toBeGreaterThan(0);
  expect(result.placement.alpha).toBeLessThanOrEqual(1);
  expect(result.placement.elevation).toBeGreaterThanOrEqual(result.view.laneClearance);
  expect(result.placement.factor).toBeLessThanOrEqual(.65);
  expect(result.order.background).toContain(result.landmark.id);
  expect(result.order.supports).toContain(result.platform.id);
  expect(result.order.foreground).toContain(result.platform.id);
  expect(result.order.background).not.toContain(result.platform.id);

  const canvas = await page.locator('#editorCanvas').boundingBox();
  await page.mouse.click(
    canvas.x + (result.bounds.left + result.bounds.right) / 2 * result.view.scale - result.view.scroll * result.view.scale,
    canvas.y + result.view.ground - (result.bounds.bottom + result.bounds.top) / 2 * result.view.scale,
  );
  await expect(page.locator('#selectionName')).toHaveText(/market canopy stall/i);

  const tall = await page.evaluate(() => {
    window.__EDITOR_TEST__.loadStage(9);
    const item = window.__EDITOR_TEST__.state().entities.find(entity => entity.background && entity.type === 'dawnStreetlight');
    return { bounds: window.__EDITOR_TEST__.bounds(item), view: window.__EDITOR_TEST__.view() };
  });
  expect(tall.bounds.bottom).toBeGreaterThanOrEqual(tall.view.laneClearance);
  expect(tall.bounds.top).toBeLessThanOrEqual(tall.view.ground / tall.view.scale);
});

test('supports duplicate, delete, undo and browser-local drafts', async ({ page }) => {
  await page.getByRole('button', { name: /road barrier/i }).dblclick();
  const withBarrier = await page.evaluate(() => window.__EDITOR_TEST__.state().entities.length);
  await page.getByRole('button', { name: 'Duplicate' }).click();
  expect(await page.evaluate(() => window.__EDITOR_TEST__.state().entities.length)).toBe(withBarrier + 1);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: /Undo/ }).click();
  expect(await page.evaluate(() => window.__EDITOR_TEST__.state().entities.length)).toBe(withBarrier + 1);
  await page.getByRole('button', { name: 'Save draft' }).click();
  expect(await page.evaluate(() => localStorage.getItem('sneakers-run-editor-v1'))).toContain('barrier');
});

test('loads the complete 100-idea asset playground with searchable raster previews', async ({ page }) => {
  await page.getByRole('button', { name: /asset playground/i }).click();
  const state = await page.evaluate(() => window.__EDITOR_TEST__.state());
  expect(state.name).toContain('Asset Playground');
  expect(state.entities.length + state.pickups.length).toBe(100);
  const catalog = await page.evaluate(() => window.__EDITOR_TEST__.catalog());
  expect(catalog).toHaveLength(100);
  await page.getByPlaceholder('Find an element').fill('lava');
  const lava = page.getByRole('button', { name: /molten asphalt trench/i });
  await expect(lava).toBeVisible();
  await lava.dragTo(page.locator('#editorCanvas'), { targetPosition: { x: 440, y: 380 } });
  await expect(page.locator('#selectionName')).toHaveText(/molten asphalt trench/i);
  await page.getByPlaceholder('Find an element').fill('');
  await expect(page.getByRole('button', { name: /construction spikes/i })).toHaveCount(2);
  const victory = page.getByRole('button', { name: /victory dressing kit/i });
  await expect(victory).toBeVisible();
  await victory.dblclick();
  await expect(page.locator('#selectionName')).toHaveText(/victory dressing kit/i);
});

test('direct file launch keeps the builder usable in the designer tab', async ({ page }) => {
  await page.goto(new URL('../editor.html?file-test=1', import.meta.url).href);
  await expect(page.locator('#paletteList .palette-item').first()).toBeVisible();
  expect(await page.locator('#paletteList .palette-item').count()).toBeGreaterThanOrEqual(100);
  await page.getByRole('button', { name: /asset playground/i }).click();
  await expect(page.locator('#routeMeta')).toHaveText(/100 elements/);
  await page.getByPlaceholder('Find an element').fill('lava');
  await expect(page.getByRole('button', { name: /molten asphalt trench/i })).toBeVisible();
});
