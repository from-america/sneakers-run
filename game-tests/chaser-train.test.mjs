import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLAYER_X, SHAPES, STEP } from '../game/simulation.js';
import { CHASER_PHYSICS } from '../game/config.js';
import { damagingContacts } from '../game/collision.js';

const ticks = (game, count) => { for (let i = 0; i < count; i++) game.tick(); };
const empty = () => {
  const game = new Game();
  game.reset();
  game.entities = [];
  game.pickups = [];
  game.routeLength = Infinity;
  return game;
};

test('suit chasers copy jump and roll controls after a short delay without becoming hazards', () => {
  const jump = empty();
  jump.command('jump');
  jump.tick();
  assert.equal(jump.chasers[0].action, 'run');
  ticks(jump, Math.ceil(CHASER_PHYSICS.delay / STEP) + 2);
  assert.equal(jump.chasers[0].action, 'jump');
  assert.ok(jump.chasers[0].y > 0);
  assert.equal(damagingContacts([jump.chasers[0]], { x: PLAYER_X, y: 4, w: 46, h: 121 }, { x: PLAYER_X, y: 4, w: 46, h: 121 }).length, 0);

  const roll = empty();
  roll.command('roll', true);
  roll.tick();
  assert.equal(roll.chasers[0].action, 'run');
  ticks(roll, Math.ceil(CHASER_PHYSICS.delay / STEP) + 2);
  assert.equal(roll.chasers[0].action, 'roll');
  assert.equal(roll.chasers[0].low, true);
});

test('suit chasers copy the runner double jump after the same larger delay', () => {
  const game = empty();
  game.command('jump');
  game.tick();
  ticks(game, 10);
  game.command('jump');
  game.tick();
  assert.equal(game.player.jumps, 2);
  ticks(game, Math.ceil(CHASER_PHYSICS.delay / STEP) + 2);
  assert.equal(game.chasers[0].jumps, 2);
  assert.equal(game.chasers[0].action, 'jump');
  assert.ok(game.chasers[0].y > 0);
});

test('suit chasers lock onto the air-drop state before the runner reaches the floor', () => {
  const game = empty();
  game.command('jump');
  let sawDrop = false;
  for (let frame = 0; frame < 180; frame++) {
    if (frame === 28) game.command('roll', true);
    game.tick();
    const delayed = game.chaserHistory[0];
    const chaser = game.chasers[0];
    assert.ok(Math.abs(chaser.y - (delayed.y ?? 0)) < 1e-7, 'jump/drop height must match the delayed runner sample');
    assert.ok(Math.abs(chaser.vy - (delayed.vy ?? 0)) < 1e-7, 'jump/drop velocity must match the delayed runner sample');
    if (chaser.airAction === 'drop') {
      sawDrop = true;
      assert.equal(chaser.state, 'dropping');
      assert.equal(game.player.grounded, false, 'the runner is still airborne when the chaser commits to drop');
      break;
    }
  }
  assert.equal(sawDrop, true, 'the chaser must enter the drop state before landing');
});

test('suit chasers ease back to the floor instead of teleporting after a route break', () => {
  const game = empty();
  game.chasers[0].y = 180;
  game.chasers[0].previousY = 180;
  game.lastStompAt = game.time;
  game.tick();
  assert.ok(game.chasers[0].y < 180);
  assert.ok(game.chasers[0].y > 0);
  for (let i = 0; i < 180; i++) game.tick();
  assert.equal(game.chasers[0].y, 0);
});

test('stomp bounce disjoins suit chasers to the bottom lane, then rejoins after recovery', () => {
  const game = empty();
  const enemy = { id: 'stomp-target', type: 'rival', x: PLAYER_X - 60, y: 0, width: SHAPES.rival.width };
  game.entities.push(enemy);
  const before = game.time;
  game.stomp(enemy);
  game.tick();
  assert.equal(game.time, before + STEP, 'stomp feedback must not stop simulation time');
  assert.equal(game.chasers[0].mode, 'bottom');
  assert.equal(game.chasers[0].y, 0);
  assert.equal(game.chasers[0].disjoint, true);

  for (let i = 0; i < 240 && !game.player.grounded; i++) game.tick();
  assert.equal(game.player.grounded, true);
  assert.equal(game.chasers[0].disjoint, false);
  assert.equal(game.chasers[0].x, game.world + PLAYER_X - CHASER_PHYSICS.gaps[0]);
});

test('an elevated route disjoins suit chasers without making the trailing floor lane unsafe', () => {
  const game = empty();
  const platform = { id: 'upper-route', type: 'platform', x: PLAYER_X - 100, y: 0, width: SHAPES.platform.width };
  game.entities.push(platform);
  Object.assign(game.player, { y: SHAPES.platform.top, previousY: SHAPES.platform.top, vy: 0, grounded: true, support: platform.id });
  game.tick();
  assert.equal(game.chasers[0].disjoint, true);
  assert.equal(game.chasers[0].y, 0);
  assert.equal(game.chasers[0].action, 'run');

  Object.assign(game.player, { y: 0, previousY: 0, vy: 0, grounded: true, support: null });
  for (let i = 0; i < 60 && game.chasers[0].disjoint; i++) game.tick();
  assert.equal(game.chasers[0].disjoint, false);
});

test('a platform transition keeps the visual chaser trajectory continuous', () => {
  const game = empty();
  const platform = { id: 'upper-route', type: 'platform', x: PLAYER_X - 100, y: 0, width: SHAPES.platform.width };
  game.entities.push(platform);
  game.chasers[0].y = 220;
  game.chasers[0].previousY = 220;
  Object.assign(game.player, { y: SHAPES.platform.top, previousY: SHAPES.platform.top, vy: 0, grounded: true, support: platform.id });
  const before = game.chasers[0].y;
  game.tick();
  const during = game.chasers[0].y;
  assert.ok(during < before && during > 0, 'the higher-platform fallback must ease instead of teleporting');
  assert.equal(game.chasers[0].state, 'recovering');
  assert.ok(Math.abs(during - game.chasers[0].previousY) < before, 'the chaser must retain a continuous previous position');

  Object.assign(game.player, { y: 0, previousY: 0, vy: 0, grounded: true, support: null });
  let previous = during;
  for (let i = 0; i < 90; i++) {
    game.tick();
    assert.ok(game.chasers[0].y <= previous + 1e-7, 'the fallback cannot rebound while rejoining');
    previous = game.chasers[0].y;
  }
  assert.equal(game.chasers[0].y, 0);
  assert.equal(game.chasers[0].disjoint, false);
});

test('moving trains make one oncoming pass, hold safely under a roof runner, and never reverse', () => {
  const game = empty();
  const train = {
    id: 'moving-train', type: 'train', x: PLAYER_X + 260, y: 0, width: SHAPES.train.width,
    patrol: { min: PLAYER_X - 100, max: PLAYER_X + 300, speed: 600 },
    direction: 1, rush: { trigger: 9999, active: true },
  };
  game.entities.push(train);
  const first = train.x;
  game.tick();
  assert.ok(train.x < first);
  assert.equal(train.direction, -1);

  // Put the already-moving set piece under the runner for the roof-support
  // portion of the contract without introducing a setup-side ankle contact.
  train.x = PLAYER_X - 40;
  train.previousX = train.x;
  Object.assign(game.player, { y: 245, previousY: 245, vy: 0, grounded: true, support: train.id });
  const roofPosition = train.x;
  for (let i = 0; i < 30; i++) game.tick();
  assert.ok(train.x > roofPosition, 'the roof carries with the camera while Sneakers is supported');
  assert.equal(game.hits, 0);
  assert.equal(game.player.grounded, true);
  assert.equal(game.player.support, train.id);

  game.player.support = null;
  game.player.y = 0;
  game.player.previousY = 0;
  game.player.grounded = true;
  ticks(game, 100);
  assert.ok(train.x <= roofPosition);
  assert.ok(train.direction <= 0);
  while (train.x > train.patrol.min) game.tick();
  const stopped = train.x;
  ticks(game, 30);
  assert.equal(train.x, stopped);
  assert.equal(train.direction, 0);
});
