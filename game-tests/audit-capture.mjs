#!/usr/bin/env node
/**
 * Deterministic visual-audit capture for Sneakers Run.
 *
 * Usage:
 *   node game-tests/audit-capture.mjs
 *   node game-tests/audit-capture.mjs --base-url http://127.0.0.1:4188 --output /tmp/run-audit
 *
 * With no reachable server, this starts a temporary Python static server for
 * the repository and shuts it down when capture completes. It intentionally
 * creates review images only when it is run; it does not compare or approve a
 * visual baseline.
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { BACKGROUND_FOCAL_X, BACKGROUND_TRACKS, backgroundTrackFor } from '../game/depth.js';
import { SHAPES } from '../game/config.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const defaultOutput = join(scriptDir, 'review', 'performance-placement');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const views = [
  { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 2 },
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'landscape', width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

function usage(message) {
  if (message) console.error(`Error: ${message}`);
  console.log('Usage: node audit-capture.mjs [--base-url http://127.0.0.1:4188] [--output directory]');
  process.exit(message ? 1 : 0);
}

function options(argv) {
  const result = { output: defaultOutput, baseUrl: process.env.SNEAKERS_RUN_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:4188', explicitBaseUrl: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') usage();
    if (arg === '--base-url') {
      result.baseUrl = argv[++index]; result.explicitBaseUrl = true;
    } else if (arg === '--output') result.output = argv[++index];
    else usage(`Unknown option ${arg}`);
    if (!result.baseUrl || !result.output) usage(`Missing value for ${arg}`);
  }
  result.baseUrl = result.baseUrl.replace(/\/$/, '');
  result.output = resolve(result.output);
  return result;
}

const gameUrl = baseUrl => `${baseUrl}/?test=1&seed=42`;

async function reachable(baseUrl) {
  try {
    const response = await fetch(gameUrl(baseUrl), { signal: AbortSignal.timeout(1200) });
    return response.ok;
  } catch { return false; }
}

function startServer() {
  return new Promise((resolveServer, rejectServer) => {
    const child = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', repoRoot], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let settled = false;
    const settle = callback => value => {
      if (settled) return;
      settled = true; clearTimeout(timeout); callback(value);
    };
    const fail = settle(error => rejectServer(new Error(`Could not start temporary HTTP server: ${error.message || error}`)));
    const ready = settle(port => resolveServer({ baseUrl: `http://127.0.0.1:${port}`, child }));
    const timeout = setTimeout(() => fail('startup timed out after 5 seconds'), 5000);
    const inspect = chunk => {
      output += String(chunk);
      const port = output.match(/port (\d+)/i)?.[1];
      if (port) ready(port);
    };
    child.once('error', fail);
    child.stdout.on('data', inspect);
    child.stderr.on('data', inspect);
    child.once('exit', code => fail(`Temporary HTTP server exited early (${code}). ${output.trim()}`));
  });
}

function visibleBounds(draws) {
  const boxes = draws.filter(draw => [draw.x, draw.y, draw.w, draw.h].every(Number.isFinite) && draw.w > 0 && draw.h > 0);
  if (!boxes.length) return null;
  const left = Math.min(...boxes.map(draw => draw.x));
  const top = Math.min(...boxes.map(draw => draw.y));
  const right = Math.max(...boxes.map(draw => draw.x + draw.w));
  const bottom = Math.max(...boxes.map(draw => draw.y + draw.h));
  return { left: Math.round(left), top: Math.round(top), right: Math.round(right), bottom: Math.round(bottom) };
}

function layerCounts(draws) {
  return Object.fromEntries(Object.entries(draws.reduce((counts, draw) => {
    const layer = draw.layer || 'unattributed'; counts[layer] = (counts[layer] || 0) + 1; return counts;
  }, {})).sort(([a], [b]) => a.localeCompare(b)));
}

async function state(page) {
  return page.evaluate(() => window.__RUN_TEST__.snapshot());
}

async function capture(page, output, records, { level, view, stateName, target, targetEntityId }) {
  const snapshot = await state(page);
  const filename = stateName === 'home'
    ? `home-${view.name}.jpg`
    : `level-${String(level + 1).padStart(2, '0')}-${stateName}-${view.name}.jpg`;
  await page.screenshot({ path: join(output, filename), animations: 'disabled', type: 'jpeg', quality: 88, scale: 'css' });
  records.push({
    file: filename,
    level: stateName === 'home' ? null : level + 1,
    viewport: { name: view.name, width: view.width, height: view.height, deviceScaleFactor: view.deviceScaleFactor },
    state: stateName,
    target,
    targetEntityId: targetEntityId || null,
    world: Math.round(snapshot.world),
    playLength: Math.round(snapshot.playLength || 0),
    scene: {
      bounds: visibleBounds(snapshot.draws),
      layerCounts: layerCounts(snapshot.draws),
      drawCount: snapshot.draws.length,
      entityCounts: {
        total: snapshot.entities.length,
        background: snapshot.entities.filter(entity => entity.background).length,
        finishArrival: snapshot.entities.filter(entity => entity.backgroundGroup === 'finish-arrival').length,
      },
    },
  });
}

async function startFrozen(page, level) {
  await page.evaluate(async stage => {
    await window.__RUN_TEST__.start(stage);
    window.__RUN_TEST__.freeze(true);
  }, level);
  await page.waitForFunction(() => window.__RUN_TEST__.snapshot().phase === 'running');
}

async function captureLevel(page, output, records, level, view) {
  await startFrozen(page, level);
  const opening = await state(page);
  await capture(page, output, records, { level, view, stateName: 'opening', target: 'start' });

  // Select an authored background prop nearest the center of the route, then
  // place it at the review focal point. This catches scenery placement issues
  // while retaining the actual seeded route instead of injecting test art.
  const midpoint = opening.playLength / 2;
  const middleEntity = opening.entities
    .filter(entity => entity.background && entity.backgroundGroup !== 'finish-arrival')
    .sort((a, b) => Math.abs(a.x - midpoint) - Math.abs(b.x - midpoint))[0];
  const middleFocalX = Math.min(500, Math.round(view.width * 0.6));
  const middleWorld = middleEntity
    ? Math.max(0, middleEntity.x + middleEntity.width / 2 - BACKGROUND_FOCAL_X - (middleFocalX / opening.view.scale - BACKGROUND_FOCAL_X) / BACKGROUND_TRACKS[backgroundTrackFor(middleEntity, SHAPES[middleEntity.type])].speed)
    : Math.max(0, midpoint - opening.view.worldWidth * 0.5);
  await page.evaluate(world => window.__RUN_TEST__.setWorld(world), middleWorld);
  await capture(page, output, records, {
    level, view, stateName: 'middle', target: middleEntity ? `background near x=${middleFocalX}` : 'playLength midpoint', targetEntityId: middleEntity?.id,
  });

  const beforeFinish = await state(page);
  const arrival = beforeFinish.entities.find(entity => entity.backgroundGroup === 'finish-arrival');
  const finishWorld = arrival
    ? Math.max(0, arrival.x + arrival.width / 2 - BACKGROUND_FOCAL_X)
    : Math.max(0, beforeFinish.playLength - 200);
  await page.evaluate(world => window.__RUN_TEST__.setWorld(world), finishWorld);
  await capture(page, output, records, {
    level, view, stateName: 'finish-arrival', target: arrival ? 'finish-arrival background group' : 'playLength - 200', targetEntityId: arrival?.id,
  });
}

async function main() {
  const config = options(process.argv.slice(2));
  await mkdir(config.output, { recursive: true });
  let server;
  let baseUrl = config.baseUrl;
  if (!await reachable(baseUrl)) {
    if (config.explicitBaseUrl) throw new Error(`The requested --base-url is not reachable: ${baseUrl}`);
    server = await startServer(); baseUrl = server.baseUrl;
  }
  const browser = await chromium.launch(existsSync(chrome) ? { executablePath: chrome } : {});
  const records = [], browserErrors = [];
  try {
    for (const view of views) {
      const page = await browser.newPage({
        viewport: { width: view.width, height: view.height },
        deviceScaleFactor: view.deviceScaleFactor,
        isMobile: view.isMobile,
        hasTouch: view.hasTouch,
      });
      page.on('pageerror', error => browserErrors.push(`${view.name}: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') browserErrors.push(`${view.name}: ${message.text()}`); });
      await page.goto(gameUrl(baseUrl), { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__RUN_TEST__?.ready());
      await page.evaluate(() => document.fonts.ready);
      const title = await page.locator('h1').first().textContent();
      if (title?.trim() !== 'Sneakers Run') throw new Error(`Home title changed to ${JSON.stringify(title)} in ${view.name}`);
      await capture(page, config.output, records, { level: null, view, stateName: 'home', target: 'exact home title' });
      for (let level = 0; level < 10; level += 1) await captureLevel(page, config.output, records, level, view);
      await page.close();
    }
    if (browserErrors.length) throw new Error(`Browser errors during capture:\n${browserErrors.join('\n')}`);
    await writeFile(join(config.output, 'metadata.json'), `${JSON.stringify({
      generatedAt: new Date().toISOString(), baseUrl, seed: 42, captures: records,
    }, null, 2)}\n`);
    console.log(`Captured ${records.length} review frames in ${config.output}`);
  } finally {
    await browser.close();
    server?.child.kill('SIGTERM');
  }
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
