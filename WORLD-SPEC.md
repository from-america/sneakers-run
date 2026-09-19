> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# Sneakers Run runtime

The September 16 rebuild replaces the browser runtime with four small modules:

- `run-model.js`: deterministic 120 Hz physics, collisions, input states,
  authored stage routes, rewards, pursuit pressure and completion.
- `renderer.js`: camera, prepared raster sprite frames, scenery and effects.
- `session-state.js`: validated, versioned checkpoint and objective storage.
- `main.js`: input, audio, loading, browser lifecycle and accessible UI.

`levels/campaign-manifest.js` supplies the ten neighborhood identities and
background keys. The runtime maps these keys through `assets/imagegen/streets-v2/manifest.js`. The old `gameplay-core.js`, `engine-core.js` and
`world-spec.js` are retained for the route-authoring tools and their tests;
they no longer drive browser physics or stage lengths.

## Play loop

Each block lasts approximately 32–44 seconds without stopping. The stage
lengths, route pools and three optional objectives live in `STAGES` in
`run-model.js`. Finishing opens a result screen and unlocks the next block.
The player chooses when to continue. Retrying begins the current block.

Objectives are finishing, collecting 15 coins and chaining 6 clean escapes.
Checkpoints and earned objectives save locally under `sneakers-run-city-v1`.
Blocked storage keeps progress for the current visit and says so at results.
The previous game's distance record is preserved, but is not mixed into the
new per-block objectives.

## Coordinate and movement contract

Physics uses world units, independent of canvas dimensions and device pixel
ratio. Camera scale is the minimum of width / 680, height / 560 and 1.
Short landscape views use height / 640. The camera is locked to the floor line,
with enough vertical overscan for the full jump envelope; high jumps never move
the landing floor out of view. Resizing pauses the run and preserves its world
coordinates.

The runner's standing collision body is 48 × 110 units; rolling and crouching
reduce its height to 48. A roll lasts 1.05 seconds, including enough time to
cross the whole gate. Repeated keydown events do not restart active rolls.
Every new roll resets its own animation clock. Holding down stays low;
pressing down in midair drops toward the ground. Jumps support one airborne
correction, a 150 ms landing buffer and 120 ms of platform coyote time.

Gate collisions cover the overhead beam. Low hazards use inset collision
bodies. Platforms are one-way landing surfaces whose top matches the raster
platform. A clean escape reduces pursuit pressure; collisions close the gap.
A shield absorbs one collision, a magnet attracts coins and quick kicks add
a modest speed boost. Failure and success stop physics immediately.

## Art and rendering

All gameplay art uses ChatGPT Image Gen raster sources. The retained runner
run-v8 and action sheets remain unchanged. The two pursuers use separate raster
families matching the attached two-man reference: eight-pose run sheets,
six-pose point/start sheets, six-pose finish fatigue loops, and four-pose
jump/roll sheets for the bald gray-suit and brown-haired blue-suit men.
Grounded actions share head-axis/ground registration; jump and roll use action
anchors so the chasers copy Sneakers' vertical path without floating or
snapping. Ten new looping prop sheets and ten new street plates
in `assets/imagegen/streets-v2` replace the painterly backgrounds. Provenance
is separate from artistic approval; see `ART-DIRECTION.md`.

`tools/measure-art.py` only measures alpha bounds and writes
`assets/art-catalog.json`; it never edits an image. Startup decodes two sheets
at a time, trims transparent padding using this metadata and prepares 83
small raster frames. Both axes use one scale factor. Uniform character
scaling and bottom anchors prevent frame-size jumps and floating feet.
Platforms use complete, naturally proportioned raster supports instead of
squashed strips. Dust is small and trails behind the runner.

The full scenery plate travels at 28% of world speed; its raster road travels
at world speed. Reflected repeating tiles share their boundary pixels, so
travel never runs out or reveals an empty edge. This deliberately repeats
landmarks instead of pretending that one static illustration is a unique,
infinite city. Scene profiles keep open rooftops airy while nesting underpass,
market, subway, and warehouse ceilings against the same floor line. Scene and
road crops are cached only on scene entry or resize, never on
a roll or in the normal draw loop. Scenery is 560 world units tall and
anchors its footline to the actors. Extra portrait space extends a quiet
raster pixel; it does not magnify the buildings or stretch a noisy scanline. Only the current and next background are
retained. Reduced-motion mode disables decorative dust and bobbing while
preserving movement essential to playing.

## Browser lifecycle and performance

The frame loop performs at most 12 fixed simulation steps after a stall,
updates HUD text at roughly 12 Hz, and renders once. It does no image decoding,
alpha scanning or scene-layer allocation while playing. Sprite effects and
entity lists have fixed limits or distance-based pruning.

Blur, tab hiding and canvas resize pause the game and release held input.
Resume requires an explicit action. Startup gates play on successful art
preparation; failures have a visible retry. Music and short feedback sounds
start from a user gesture, with a persistent mute control.

See `VISUAL-REGRESSION.md` for reproducible validation and physical-device
limitations.
