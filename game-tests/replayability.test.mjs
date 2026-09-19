import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLAYER_X } from '../game/simulation.js';
import { readSave, recordResult, SAVE_KEY } from '../game/save.js';

function storageWith(value) {
  let raw = value;
  return { getItem: key => key === SAVE_KEY ? raw : null, setItem: (_, next) => { raw = next; }, raw: () => raw };
}

function emptyRun() {
  const game = new Game();
  game.reset({ stage: 0, difficulty: 'standard', seed: 42 });
  game.entities = [];
  game.pickups = [];
  game.routeLength = Infinity;
  game.world = PLAYER_X;
  return game;
}

test('legacy block records migrate with replay fields without inventing progress', () => {
  const storage = storageWith(JSON.stringify({ version: 2, records: {
    'standard:0': { score: 900, coins: 12, stars: [true, false, false] },
  } }));
  const save = readSave(storage);
  assert.deepEqual(save.records['standard:0'], {
    score: 900,
    coins: 12,
    stars: [true, false, false],
    badges: [true, false, false, false],
    bestStreak: 0,
    attempts: 0,
  });
  assert.equal(save.lastRun, null);
});

test('story results accumulate four deterministic block marks and a best-run summary', () => {
  const save = readSave(storageWith(null));
  const game = emptyRun();
  game.phase = 'cleared';
  game.score = 1400;
  game.coins = 48;
  game.hits = 0;
  game.bestStreak = 6;

  const first = recordResult(save, game);
  const record = first.records['standard:0'];
  assert.equal(save.lastRun, null, 'recordResult should not mutate the previous save');
  assert.deepEqual(record.badges, [true, true, true, true]);
  assert.equal(record.bestStreak, 6);
  assert.equal(record.attempts, 1);
  assert.deepEqual(first.lastRun, {
    mode: 'story', difficulty: 'standard', stage: 0, phase: 'cleared', score: 1400, coins: 48,
    bestStreak: 6, previousBestScore: 0, previousBestStreak: 0, isNewBest: true,
    badges: [true, true, true, true],
  });

  game.phase = 'gameover';
  game.score = 600;
  game.coins = 10;
  game.hits = 1;
  game.bestStreak = 2;
  const second = recordResult(first, game);
  const kept = second.records['standard:0'];
  assert.equal(kept.score, 1400);
  assert.equal(kept.coins, 48);
  assert.equal(kept.bestStreak, 6);
  assert.equal(kept.attempts, 2);
  assert.deepEqual(kept.badges, [true, true, true, true]);
  assert.equal(second.lastRun.isNewBest, false);
  assert.deepEqual(second.lastRun.badges, [false, false, false, false]);
});

test('endless results keep the existing distance record and add best streak plus attempts', () => {
  const save = readSave(storageWith(null));
  const game = emptyRun();
  game.mode = 'endless';
  game.phase = 'gameover';
  game.score = 700;
  game.world = 12500;
  game.bestStreak = 4;

  const next = recordResult(save, game);
  assert.deepEqual(next.endless.standard, { score: 700, meters: 1250, bestStreak: 4, attempts: 1 });
  assert.equal(next.lastRun.mode, 'endless');
  assert.equal(next.lastRun.isNewBest, true);
});
