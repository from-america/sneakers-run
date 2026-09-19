import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { LEVELS } from '../game/routes.js';

test('the ten story levels use the requested soundtrack order', () => {
  assert.deepEqual(LEVELS.map(level => level.music), [
    'assets/music/wasot-01.mp3',
    'assets/Sneakers Run theme.mp3',
    'assets/music/chinese-03.mp3',
    'assets/music/cancelme.mp3',
    'assets/music/05-prolly.mp3',
    'assets/music/lace-up-06.mp3',
    'assets/music/airport-ooooo.mp3',
    'assets/music/gtyoyf.mp3',
    'assets/music/pleasespeed-2ndlast.mp3',
    'assets/music/wasot-01.mp3',
  ]);
  assert.equal(LEVELS[0].music, LEVELS[9].music);
  for (const level of LEVELS) {
    const file = level.music.includes(' ') ? level.music : level.music;
    assert.ok(existsSync(file), `missing soundtrack ${file}`);
    assert.ok(statSync(file).size > 100_000, `soundtrack is unexpectedly small ${file}`);
  }
});

test('the opening dialogue is shipped as a playable audio asset', () => {
  const file = 'assets/audio/intro-dialogue.mp3';
  assert.ok(existsSync(file), `missing opening dialogue ${file}`);
  assert.ok(statSync(file).size > 100_000, 'opening dialogue is unexpectedly small');
});
