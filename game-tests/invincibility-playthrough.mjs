import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'game-tests/review/invincibility');
await mkdir(out, { recursive: true });
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch(existsSync(chrome) ? { executablePath: chrome } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const results = [];

try {
  await page.goto('http://127.0.0.1:4197/?test=1&seed=42');
  await page.waitForFunction(() => window.__RUN_TEST__?.ready());
  await page.evaluate(() => document.fonts.ready);

  for (let stage = 0; stage < 10; stage++) {
    await page.evaluate(stageIndex => window.__RUN_TEST__.start(stageIndex), stage);
    await page.evaluate(() => window.__RUN_TEST__.setInvincible(true));
    const openingSeconds = 3;
    await page.evaluate(seconds => window.__RUN_TEST__.advance(seconds), openingSeconds);
    if (stage === 0) await page.screenshot({ path: path.join(out, 'level-01-opening.png') });
    if (stage === 4) {
      await page.evaluate(() => window.__RUN_TEST__.advance(22));
      await page.screenshot({ path: path.join(out, 'level-05-mid-route.png') });
    }
    if (stage === 9) {
      await page.evaluate(() => {
        for (let step = 0; step < 300; step++) {
          const snapshot = window.__RUN_TEST__.snapshot();
          const boss = snapshot.entities.find(entity => entity.type === 'deliveryBoss');
          const relative = boss ? boss.x - snapshot.world - 224 : Infinity;
          if (relative > 160 && relative < 720) break;
          window.__RUN_TEST__.advance(.25);
        }
      });
      await page.screenshot({ path: path.join(out, 'level-10-boss-arena.png') });
    }
    await page.evaluate(() => window.__RUN_TEST__.advance(90));
    const snapshot = await page.evaluate(() => window.__RUN_TEST__.snapshot());
    results.push({ stage: stage + 1, phase: snapshot.phase, hits: snapshot.hits, stomps: snapshot.stomps, coins: snapshot.coins, invincible: snapshot.invincibleTest });
    if (stage === 9) await page.screenshot({ path: path.join(out, 'level-10-clear.png') });
  }
  await writeFile(path.join(out, 'playthrough.json'), JSON.stringify({ seed: 42, invincibility: true, results }, null, 2) + '\n');
  if (results.some(result => result.phase !== 'cleared' || result.hits !== 0 || !result.invincible)) throw new Error(`Campaign playthrough failed: ${JSON.stringify(results)}`);
  console.log(`Invincibility playthrough cleared ${results.length} levels with no hits.`);
} finally {
  await browser.close();
}
