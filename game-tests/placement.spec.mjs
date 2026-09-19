import { test, expect } from '@playwright/test';
import { BACKGROUND_LANE_CLEARANCE, BACKGROUND_FOCAL_X, BACKGROUND_TRACKS, backgroundScreenX, backgroundTrackFor } from '../game/depth.js';
import { SHAPES } from '../game/config.js';

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}×${viewport.height}: every chapter keeps authored scenery off the main track`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?test=1&seed=42');
    await page.waitForFunction(() => window.__RUN_TEST__?.ready());
    for (let stage = 0; stage < 10; stage++) {
      await page.evaluate(s => window.__RUN_TEST__.start(s), stage);
      const original = await page.evaluate(() => window.__RUN_TEST__.snapshot());
      const scenery = original.entities.filter(e => e.background);
      expect(scenery.length).toBeGreaterThan(0);
      for (const entity of scenery) {
        const world = Math.max(0, entity.x + entity.width / 2 - BACKGROUND_FOCAL_X);
        await page.evaluate(x => window.__RUN_TEST__.setWorld(x), world);
        const state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
        const draws = state.draws.filter(draw => draw.layer === 'background');
        expect(draws.filter(draw => draw.entityId === entity.id), `${stage}/${entity.id} visible at authored position`).toHaveLength(1);
        expect(new Set(draws.map(draw => draw.entityId)).size).toBe(draws.length);
        expect(state.view.backgroundLaneClearance).toBeGreaterThanOrEqual(BACKGROUND_LANE_CLEARANCE);
        for (const draw of draws) {
          expect(draw.y + draw.h, `${stage}/${draw.name} enters track`).toBeLessThanOrEqual(state.view.ground - state.view.backgroundLaneClearance * state.view.scale + .01);
          expect(draw.y, `${stage}/${draw.name} clips ceiling`).toBeGreaterThanOrEqual(0);
          const source = scenery.find(item => item.id === draw.entityId);
          expect(draw.anchorX).toBeCloseTo(backgroundScreenX(source.x + source.width / 2, world, state.view.scale, backgroundTrackFor(source, SHAPES[source.type])), 4);
        }
        const lastBackground = state.draws.findLastIndex(draw => draw.layer === 'background');
        const firstSupport = state.draws.findIndex(draw => draw.layer === 'support');
        const firstForeground = state.draws.findIndex(draw => draw.layer === 'foreground');
        expect(firstForeground).toBeGreaterThan(lastBackground);
        if (firstSupport >= 0) { expect(firstSupport).toBeGreaterThan(lastBackground); expect(firstForeground).toBeGreaterThan(firstSupport); }
        if (entity === scenery[0]) {
          const before = draws.find(draw => draw.entityId === entity.id);
          await page.evaluate(x => window.__RUN_TEST__.setWorld(x), world + 10);
          const after = await page.evaluate(id => window.__RUN_TEST__.snapshot().draws.find(draw => draw.entityId === id), entity.id);
          const speed = BACKGROUND_TRACKS[backgroundTrackFor(entity, SHAPES[entity.type])].speed;
          expect(speed).toBeGreaterThan(1);
          expect(after.anchorX - before.anchorX).toBeCloseTo(-10 * state.view.scale * speed, 4);
        }
      }
      const arrival = scenery.filter(e => e.backgroundGroup === 'finish-arrival');
      expect(arrival.length).toBeGreaterThan(0);
      // Finish dressing must remain with the actual finish after a long run.
      const finish = original.entities.find(e => e.type === 'finish');
      for (const approach of [650, 450, 250]) {
        await page.evaluate(x => window.__RUN_TEST__.setWorld(x), finish.x - approach);
        const final = await page.evaluate(() => window.__RUN_TEST__.snapshot());
        expect(final.draws.filter(d => d.x + d.w > 0 && d.x < final.view.width && arrival.some(e => e.id === d.entityId)).length, `${stage} finish approach ${approach}`).toBeGreaterThan(0);
      }
    }
    expect(errors).toEqual([]);
  });
}
