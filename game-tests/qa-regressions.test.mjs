import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeRoute, LEVELS, PLATFORM_RULES, SECTION_LENGTH } from '../game/routes.js';
import { Game, PLAYER_X, SHAPES } from '../game/simulation.js';
import { solidBoxes, topFaces } from '../game/config.js';

const seeds = [1, 42, 881, 12345, 54321];

function emptyGame() {
  const game = new Game();
  game.reset();
  game.entities = [];
  game.pickups = [];
  game.routeLength = Infinity;
  return game;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
}

test('authored beat openings keep the full reaction window free of overlapping solids', () => {
  for (const seed of seeds) for (let stage = 0; stage < LEVELS.length; stage++) {
    const route = makeRoute(stage, 'standard', seed);
    for (let beat = 0; beat < LEVELS[stage].beats.length; beat++) {
      const start = PLAYER_X + 900 + beat * SECTION_LENGTH;
      const end = start + PLATFORM_RULES.reactionWindow;
      const boxes = route.entities
        .filter(entity => !entity.decorative && entity.x < end && entity.x + entity.width > start)
        .flatMap(entity => solidBoxes(entity).map(box => ({ entity, box })));

      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        assert.equal(
          overlaps(boxes[i].box, boxes[j].box),
          false,
          `seed ${seed}, block ${stage + 1}, beat ${beat + 1}: ${boxes[i].entity.type} overlaps ${boxes[j].entity.type} in its opening window`,
        );
      }
    }
  }
});

test('a roof rider is safe while a one-way train passes, and the train never reverses', () => {
  const game = emptyGame();
  const train = { id: 'train', type: 'train', x: PLAYER_X - 40, y: 0, width: SHAPES.train.width, hit: false, passed: false };
  train.patrol = { min: train.x - 60, max: train.x + 240, speed: 430 };
  train.direction = -1;
  train.rush = { trigger: Infinity, active: true };
  game.entities.push(train);

  const trainTop = Math.max(...topFaces(train).map(face => face.y));
  Object.assign(game.player, { y: trainTop + 1, previousY: trainTop + 1, vy: -100, grounded: false });
  const positions = [];
  for (let tick = 0; tick < 100; tick++) {
    positions.push(train.x);
    game.tick();
    assert.equal(game.phase, 'running', 'the moving train must not end a roof ride');
    assert.equal(game.hits, 0, 'the train must not turn a supported rider into an ankle hit');
  }

  const deltas = positions.slice(1).map((position, index) => position - positions[index]);
  assert.ok(deltas.some(delta => delta < 0), 'the train should visibly travel through the encounter');
  assert.ok(deltas.some(delta => delta > 0), 'the roof should carry safely with the camera while supported');
  assert.ok(game.entities.find(entity => entity.id === train.id)?.direction <= 0, 'the encounter train must not reverse its travel direction');
  const roofSupport = game.player.support;
  game.player.support = null;
  game.player.y = 0;
  game.player.previousY = 0;
  game.player.grounded = true;
  for (let tick = 0; tick < 100; tick++) game.tick();
  assert.ok(game.entities.find(entity => entity.id === train.id)?.direction <= 0, 'the train remains one-way after the roof ride');
});

test('favicon wiring keeps a static icon and an animated two-state update path', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../game/app.js', import.meta.url), 'utf8');
  assert.match(html, /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=/i, 'index must retain a static favicon fallback');
  assert.match(app, /favicon|favIcon/i, 'the app must own favicon animation wiring');
  assert.match(app, /setInterval|setTimeout|requestAnimationFrame/, 'favicon animation must advance on a timer or frame callback');
  assert.match(app, /(?:href|src|setAttribute)\s*[=(]/i, 'favicon wiring must switch the linked image rather than only styling it');
  assert.match(app, /coin|icon/i, 'favicon states must be coin/icon artwork, not an unrelated page asset');
});

test('homepage Sneaker Run preview shows the player and both gameplay chasers', () => {
  const homepageDocument = new URL('../index.html', import.meta.url);
  const html = readFileSync(homepageDocument, 'utf8');
  const stylesheetHrefs = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)/gi)]
    .map(([, href]) => href.split('?')[0]);
  const previewSource = [html, ...stylesheetHrefs.map(href => readFileSync(new URL(href, homepageDocument), 'utf8'))].join('\n');
  const manifest = JSON.parse(readFileSync(new URL('../assets/runtime/sprites.json', import.meta.url), 'utf8'));
  for (const asset of ['home-runner.webp', 'home-chaser-gray.webp', 'home-chaser-blue.webp']) {
    assert.match(html, new RegExp(`runtime/${asset.replace('.', '\\.')}`), `${asset} must be wired into the homepage`);
    assert.ok(manifest.homepagePreview.chasers || asset === 'home-runner.webp', 'homepage preview metadata must include chaser sheets');
  }
  assert.match(html, /runtime\/01-sneaker-shops-flat-v1\.webp/, 'preview must use a clean level background without baked characters');
  assert.doesNotMatch(html, /assets\/city-generated\.webp/, 'preview must not use the legacy composite background');
  const embeddedChasers = html.match(/class="game-chaser /g) || [];
  const standaloneChasers = html.match(/class="home-preview-character home-preview-chaser-(?:gray|blue)"/g) || [];
  assert.equal(
    embeddedChasers.length + standaloneChasers.length,
    2,
    'homepage must render two animated chasers',
  );
  assert.match(previewSource, /aspect-ratio:\s*320\s*\/\s*360/, 'homepage preview cells must include transparent edge margin');
  assert.match(previewSource, /animation:\s*home-(?:run|preview-run)/, 'homepage characters must animate with the gameplay run cadence');
  assert.match(
    previewSource,
    /min-height:\s*(?:clamp\(360px,\s*100svh,\s*760px\)|360px)/,
    'homepage preview must fill short viewport heights without a bottom gap',
  );
});

test('gameplay events never enter a timing-sensitive Web Audio path', () => {
  const app = readFileSync(new URL('../game/app.js', import.meta.url), 'utf8');
  const audio = readFileSync(new URL('../game/audio.js', import.meta.url), 'utf8');
  const input = readFileSync(new URL('../game/input.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /sound\.(cue|unlock)\(/, 'gameplay events must not schedule or unlock synthesized audio');
  assert.doesNotMatch(audio, /AudioContext|createOscillator/, 'audio must remain soundtrack-only');
  assert.doesNotMatch(input, /unlockAudio/, 'input must not gate a move on audio setup');
});
