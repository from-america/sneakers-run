import { test, expect } from '@playwright/test';

const url = '/?test=1&seed=42';

async function openLowMemory(page, requests, bytes) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', {
    configurable: true,
    value: 2,
  }));
  await page.route('**/*.mp3', route => route.abort());
  page.on('request', request => {
    if (request.url().includes('/assets/')) requests.push(request.url());
  });
  page.on('response', response => {
    if (response.url().includes('/assets/')) bytes.set(response.url(), Number(response.headers()['content-length'] || 0));
  });
  const started = performance.now();
  await page.goto(url);
  await page.waitForFunction(() => window.__RUN_TEST__?.ready());
  return performance.now() - started;
}

function percentile(values, fraction) {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] || 0;
}

test('2 GB boot stays within the compact asset budget', async ({ page }) => {
  const requests = [], bytes = new Map();
  const bootMs = await openLowMemory(page, requests, bytes);
  const state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
  const manifestUrl = [...bytes.keys()].find(url => url.endsWith('/assets/runtime/sprites.json'));

  expect(bootMs).toBeLessThan(3000);
  expect(state.assets.quality).toBe('low');
  expect(state.assets.image).toBe('sprites-low.webp');
  expect(state.assets.sceneCount).toBe(1);
  expect(state.assets.rasterCount).toBe(0);
  expect(state.assets.atlasDecodedPixels).toBeLessThan(20_000_000);
  expect(bytes.get(manifestUrl)).toBeLessThan(500_000);
  expect(requests.some(url => /\/sprites\.webp(?:\?|$)/.test(url))).toBe(false);
  expect(requests.some(url => url.includes('/assets/imagegen/'))).toBe(false);
  expect(requests.some(url => url.endsWith('.mp3'))).toBe(false);
});

test('2 GB gameplay keeps decoded art and frame work bounded', async ({ page }) => {
  const requests = [], bytes = new Map();
  await openLowMemory(page, requests, bytes);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__RUN_TEST__.snapshot().phase === 'running');
  await page.evaluate(() => window.__RUN_TEST__.freeze(false));
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const state = window.__RUN_TEST__.snapshot();
    const frames = state.timings.slice(-45);
    const steady = frames.slice(10);
    return {
      assets: state.assets,
      world: state.world,
      phase: state.phase,
      frameCount: frames.length,
      canvasPixels: document.getElementById('game').width * document.getElementById('game').height,
      p95: frames.length ? [...frames].sort((a, b) => a - b)[Math.floor(frames.length * .95)] : 0,
      warmupMax: Math.max(...frames, 0),
      steadyMax: Math.max(...steady, 0),
    };
  });
  const optional = [...bytes].filter(([url]) => /assets\/runtime\/(flow|stomp|rolling|drop|oil)-/.test(url));

  expect(result.assets.sceneCount).toBe(1);
  expect(result.world).toBeGreaterThan(250);
  expect(result.phase).toBe('running');
  expect(result.frameCount).toBeGreaterThan(20);
  expect(result.assets.rasterCount).toBe(4);
  expect(result.assets.kitDecodedPixels).toBeLessThan(500_000);
  expect(result.assets.rasterDecodedPixels).toBeLessThan(2_100_000);
  expect(result.canvasPixels).toBeLessThan(900_000);
  expect(result.p95).toBeLessThan(8);
  expect(result.warmupMax).toBeLessThan(500);
  expect(result.steadyMax).toBeLessThan(24);
  expect(optional).toHaveLength(4);
  expect(optional.every(([url]) => url.endsWith('-low.webp'))).toBe(true);
  expect(optional.reduce((sum, [, size]) => sum + size, 0)).toBeLessThan(1_000_000);
});

for (const profile of [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 },
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
]) test(`${profile.name}: real frame cadence and input stay responsive across heavy chapters`, async ({ browser }, testInfo) => {
  const context = await browser.newContext(profile);
  const page = await context.newPage(), errors = [], records = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4198' + url);
    await page.waitForFunction(() => window.__RUN_TEST__?.ready());
    for (const stage of [0, 4, 8, 9]) {
      await page.evaluate(s => window.__RUN_TEST__.start(s), stage);
      await page.evaluate(() => {
        window.__RUN_TEST__.setInvincible(true);
        window.__RUN_TEST__.setWorld(2000);
        window.__RUN_TEST__.freeze(false);
      });
      // Includes the first gameplay frame, texture use, input polling, fixed
      // simulation, HUD work, raster submission and actual display cadence.
      const intervals = await page.evaluate(() => new Promise(resolve => {
        let last = 0; const values = [];
        function sample(now) {
          if (last) values.push(now - last);
          last = now;
          if (values.length < 150) requestAnimationFrame(sample); else resolve(values);
        }
        requestAnimationFrame(sample);
      }));
      const state = await page.evaluate(() => window.__RUN_TEST__.snapshot());
      const record = { stage, p50: percentile(intervals, .5), p95: percentile(intervals, .95),
        max: Math.max(...intervals), missed: intervals.filter(value => value > 34).length,
        drawP95: percentile(state.timings.slice(-150), .95), workP95: percentile(state.frameWork.slice(-150), .95),
        decodedPixels: state.assets.atlasDecodedPixels, world: state.world };
      records.push(record);
      expect(state.phase).toBe('running');
      expect(state.world).toBeGreaterThan(2500);
      expect(state.assets.atlasDecodedPixels).toBeLessThan(20_000_000);
      expect(record.p95, JSON.stringify(record)).toBeLessThan(25);
      expect(record.max, JSON.stringify(record)).toBeLessThan(100);
      expect(record.missed, JSON.stringify(record)).toBeLessThanOrEqual(3);
      expect(record.workP95).toBeLessThan(12);
      await page.evaluate(() => window.__RUN_TEST__.freeze(true));
    }
    await page.evaluate(() => { window.__RUN_TEST__.clear(); window.__RUN_TEST__.setPlayer({ y: 0, previousY: 0, grounded: true, jumps: 0 }); window.__RUN_TEST__.freeze(false); });
    await page.evaluate(() => {
      window.__inputSample = new Promise(resolve => {
        document.addEventListener('keydown', () => {
          const start = performance.now();
          function check() {
            if (window.__RUN_TEST__.snapshot().player.y > 0) resolve(performance.now() - start);
            else requestAnimationFrame(check);
          }
          requestAnimationFrame(check);
        }, { once: true });
      });
    });
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__inputSample)).toBeLessThan(100);
    expect(errors).toEqual([]);
    await testInfo.attach(`${profile.name}-frame-measurements`, { body: JSON.stringify(records, null, 2), contentType: 'application/json' });
    console.log(`${profile.name} frame measurements: ${JSON.stringify(records)}`);
  } finally { await context.close(); }
});
