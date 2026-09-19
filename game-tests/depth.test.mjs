import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHAPES, PHYSICS, SCENE_PROFILES } from '../game/config.js';
import { makeRoute, LEVELS } from '../game/routes.js';
import { BACKGROUND_TRACKS, BACKGROUND_PARALLAX, BACKGROUND_FOCAL_X, BACKGROUND_LANE_CLEARANCE, backgroundPlateFor, backgroundPlacementFor, backgroundScreenX } from '../game/depth.js';

const atlas = JSON.parse(readFileSync(new URL('../assets/runtime/sprites.json', import.meta.url)));

test('faster scenery motion stays anchored to its authored encounter through long chapters', () => {
  assert.equal(BACKGROUND_PARALLAX, 2.1);
  assert.deepEqual(Object.values(BACKGROUND_TRACKS).map(track => track.speed), [1.5, 2, 3]);
  for (const track of Object.keys(BACKGROUND_TRACKS)) for (const world of [0, 1800, 25000, 60000]) {
    const value = world + BACKGROUND_FOCAL_X;
    assert.equal(backgroundScreenX(value, world, .5, track), BACKGROUND_FOCAL_X * .5);
    const delta = backgroundScreenX(value, world + 10, .5, track) - backgroundScreenX(value, world, .5, track);
    assert.equal(delta, -10 * .5 * BACKGROUND_TRACKS[track].speed);
  }
});

test('all chapter scenery frames clear the runner corridor and fit below the scene ceiling', () => {
  assert.ok(BACKGROUND_LANE_CLEARANCE >= PHYSICS.standing + 32);
  for (let stage = 0; stage < 10; stage++) for (const entity of makeRoute(stage).entities.filter(e => e.background)) {
    const shape = SHAPES[entity.type];
    for (const frame of atlas.sprites[shape.art]) for (const worldHeight of [548, 600, 915]) {
      const { track, factor, elevation } = backgroundPlacementFor(entity, shape, frame, worldHeight);
      const bottom = elevation - (frame.height - frame.pivotY) * factor;
      const top = elevation + frame.pivotY * factor;
      assert.ok(bottom >= BACKGROUND_LANE_CLEARANCE - .001, `${stage}/${entity.type} enters runner lane`);
      assert.ok(top <= worldHeight - 12 + .001, `${stage}/${entity.type} clips ceiling`);
      assert.ok(factor > 0 && factor <= BACKGROUND_TRACKS[track].scale);
    }
  }
});

test('registration room below a pivot and negative authored offsets cannot enter the lane', () => {
  const shape = { width: 120, height: 150 }, frame = { height: 150, pivotY: 120 };
  const { factor, elevation } = backgroundPlacementFor({ y: -100 }, shape, frame, 548);
  assert.equal(elevation - 30 * factor, BACKGROUND_LANE_CLEARANCE);
});

test('portrait, landscape and desktop dressing stays behind the painted roadway', () => {
  for (const [width, height] of [[1280, 600], [390, 480], [844, 210]]) {
    const scale = Math.min(width / (width < 600 ? 820 : 1100), height / 600, 1.5);
    const ground = height - 52 * scale;
    for (let stage = 0; stage < 10; stage++) {
      const profile = SCENE_PROFILES[LEVELS[stage].scene];
      const plate = backgroundPlateFor(width, height, ground, 3, scale, profile);
      assert.ok(plate.top <= 0 && plate.top + plate.height >= height - .001);
      const rearEdge = plate.top + plate.height * profile.dressingLine;
      for (const entity of makeRoute(stage).entities.filter(e => e.background)) {
        const shape = SHAPES[entity.type];
        for (const frame of atlas.sprites[shape.art]) {
          const { factor, elevation } = backgroundPlacementFor(entity, shape, frame, ground / scale, plate.laneClearance);
          const bottom = ground - (elevation - (frame.height - frame.pivotY) * factor) * scale;
          assert.ok(bottom <= rearEdge + .001, `${width}/${stage}/${entity.type} paints on roadway`);
          assert.ok(ground - (elevation + frame.pivotY * factor) * scale >= -.001);
        }
      }
    }
  }
});
