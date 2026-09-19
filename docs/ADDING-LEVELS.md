# Adding levels

Levels are authored as data and deterministic route beats. Keep the runner's
reaction space readable before adding spectacle.

## Workflow

1. Add or select a raster street plate in assets/imagegen/streets-v2/.
2. Add the block metadata and scene filename in game/routes.js.
3. Add beats using existing obstacle, platform, enemy, and pickup types.
4. Use editor.html locally to inspect placements, collision faces, patrols,
   and elevated-route support.
5. Add route coverage to game-tests/ when the level introduces a new mechanic
   or geometry pattern.
6. Run the build so the scene and runtime assets are copied into dist/web/.

Every beat should provide a reaction window, a readable high/low decision, and
a recovery runway. Elevated routes must reconnect cleanly to the floor. Chaser
trajectories follow the delayed simulation state; do not add a renderer-only
teleport or snap to make a route look right.

## Level checklist

- [ ] LEVELS metadata has a unique title, scene, chapter, and soundtrack.
- [ ] Route seed is deterministic and survives a retry.
- [ ] Reaction window has no overlapping solid hazards.
- [ ] Platform tops are safe only when their shape says so.
- [ ] Floor and elevated paths both remain playable.
- [ ] Both chasers remain visible and recover continuously.
- [ ] The level is checked at desktop, phone, and landscape widths.
- [ ] Tests and docs describe any new mechanic.
