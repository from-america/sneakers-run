import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLAYER_X, SHAPES } from '../game/simulation.js';
import { solidBoxes } from '../game/config.js';
import { LEVELS, makeRoute } from '../game/routes.js';

const empty = () => {
  const game = new Game();
  game.reset({ stage: 0, seed: 42 });
  game.entities = [];
  game.pickups = [];
  game.routeLength = Infinity;
  return game;
};

test('flow charms reward a clean line with a short rush instead of being cosmetic', () => {
  const game = empty();
  game.pickups = [{ id: 'flow', type: 'flow', x: PLAYER_X, y: 58 }];
  game.tick();
  assert.equal(game.streak, 1);
  assert.equal(game.bestStreak, 1);
  assert.equal(game.score, 165);
  assert.ok(game.rush > 2);
  assert.ok(game.drainEvents().some(event => event.type === 'flow'));
});

test('every authored block gives the player at least one optional flow decision', () => {
  for (let stage = 0; stage < LEVELS.length; stage++) {
    const route = makeRoute(stage, 'standard', 42);
    assert.ok(route.pickups.some(pickup => pickup.type === 'flow'), LEVELS[stage].name);
  }
});

test('new obstacle verbs stay obstacle-only and create distinct responses', () => {
  assert.equal(SHAPES.rollingCart.enemy, undefined);
  assert.equal(SHAPES.dropGate.enemy, undefined);
  assert.equal(SHAPES.oilSlick.enemy, undefined);
  assert.equal(SHAPES.factoryGluePuddle.enemy, undefined);

  const cartGame = empty();
  const cart = { id: 'cart', type: 'rollingCart', x: PLAYER_X + 420, y: 0, width: SHAPES.rollingCart.width, patrol: { min: PLAYER_X + 350, max: PLAYER_X + 480, speed: 180 }, direction: -1 };
  cartGame.entities = [cart];
  const start = cart.x;
  for (let i = 0; i < 60; i++) cartGame.tick();
  assert.notEqual(cart.x, start, 'rolling cart should patrol instead of acting like a static prop');

  const gate = { id: 'drop-gate', type: 'dropGate', x: PLAYER_X + 80, y: 0, width: SHAPES.dropGate.width, floorPhase: true };
  assert.equal(solidBoxes(gate)[0].y, 0, 'floor phase should block the feet');
  gate.floorPhase = false;
  assert.equal(solidBoxes(gate)[0].y, 96, 'overhead phase should leave a roll lane');

  const oilGame = empty();
  oilGame.entities = [{ id: 'slick', type: 'oilSlick', x: PLAYER_X - 80, y: 0, width: SHAPES.oilSlick.width }];
  oilGame.tick();
  assert.equal(oilGame.hits, 0, 'oil is not a damage wall');
  assert.ok(oilGame.slip > 0, 'running through oil should briefly slow the run');
  assert.ok(oilGame.drainEvents().some(event => event.type === 'slip'));

  const jumpGame = empty();
  jumpGame.entities = [{ id: 'jump-slick', type: 'oilSlick', x: PLAYER_X - 80, y: 0, width: SHAPES.oilSlick.width }];
  jumpGame.command('jump');
  jumpGame.tick();
  assert.equal(jumpGame.slip, 0, 'jumping over oil should preserve speed');

  const glueGame = empty();
  glueGame.entities = [{ id: 'glue', type: 'factoryGluePuddle', x: PLAYER_X - 80, y: 0, width: SHAPES.factoryGluePuddle.width }];
  glueGame.tick();
  assert.equal(glueGame.hits, 0, 'glue is not a damage wall');
  assert.ok(glueGame.slip > 0, 'factory glue should reuse the readable surface slowdown');
});
