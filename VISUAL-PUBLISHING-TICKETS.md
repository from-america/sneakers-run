> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# Sneaker Run visual publishing tickets

**Audit scope:** characters, animation, art placement, backgrounds, camera,
effects, HUD composition, responsive states, and asset provenance.

**Audit baseline:** 2026-09-15. The approved visual target is the supplied
orange-haired runner sheet: clean cartoon linework, flat cel shading, dark
inked edges, compact readable silhouettes, and consistent shoe-to-ground
contact. The existing suit/chaser artwork remains the reference for the suit
directly behind the runner.

## Release status

The new eight-frame runner cycle and ten raster background plates are generated
with ChatGPT Image Gen. The first three plates are wired to the three playable
levels. Seven plates are present but intentionally reserved for the seven
locked route slots. That means the art set is ready for integration, but the
game is not yet a ten-level publishing candidate.

No AI-generated SVG artwork is part of this set. Code-native SVG icons in the
HTML are GUI controls only.

The runtime rival no longer has a separate character strip: it reuses the
approved Sneakers run sheet and mirrors it left, while the existing suit/chaser
remains the separate pursuer.

## Ticket list

### P0 — publishing blockers

#### SR-VIS-001 — Make the route inventory honest and complete

- **Area:** level coverage and scene metadata
- **Evidence:** `index.html` exposes ten route slots, while
  `world-spec.js` defines only three playable levels. Only the first three
  regenerated backgrounds can currently be reached through gameplay.
- **Task:** Either author levels 04–10 completely or remove/label those route
  slots as unavailable for the release. For each shipped level add a unique
  id, name, cue, distance range, background key, layer treatment, accent,
  encounter rhythm, and completion transition.
- **Acceptance:** Every visible route choice is playable end to end, or its
  locked state clearly says it is not part of this release. No level silently
  falls back to another level's background or pacing.

#### SR-VIS-002 — Complete the non-GUI raster asset migration

- **Area:** asset provenance and style consistency
- **Evidence:** The new run cycle is Image Gen raster art, but jump, roll,
  crouch, stumble, land, celebrate, rush, chaser, props, and several effects
  still load from `assets/visual-model` or code-drawn art.
- **Task:** Generate replacement raster PNG/WebP assets with ChatGPT Image Gen
  for every non-GUI character, animation, prop, background, and in-game
  effect. Keep the supplied runner style and the existing suit/chaser artwork
  as the guides; do not turn the suit into a new character design.
- **Acceptance:** A reviewed asset inventory has a source, format, frame count,
  and approval status for every non-GUI visual. No AI-generated SVG artwork is
  created or deployed. GUI-only HTML/CSS/SVG controls remain separate from the
  game-art inventory.

#### SR-VIS-003 — Make every runner action belong to one visual family

- **Area:** character animation set
- **Evidence:** `run-v6.png` is now the regenerated eight-frame cycle, while
  the other action sheets are legacy artwork. Mixing those sheets risks changes in
  head size, outline weight, shoe shape, and shirt/pants proportions at state
  boundaries.
- **Task:** Regenerate jump, roll, crouch, land, stumble, celebrate, rush, and
  any fallback poses as matching raster sheets. Preserve the run cycle's
  orange hair, pale blue shirt, white tee, navy pants, white sneakers, and
  compact cartoon silhouette.
- **Acceptance:** A frame-by-frame contact sheet shows no style jump when
  switching among run, jump, roll, crouch, hit, power-up, and finish states.

#### SR-VIS-004 — Establish a final visual regression gate

- **Area:** release QA
- **Task:** Capture deterministic screenshots and short recordings for each
  shipped level at desktop landscape, tablet landscape, phone portrait, and
  phone landscape sizes. Include ready, running, jump, double jump, roll,
  crouch, hit, shield, rush, transition, game over, and complete states.
- **Acceptance:** A reviewer can compare the same scenes after every art or
  motion change. The gate fails on cropped feet, pose stretch, lane drift,
  collision misalignment, text overlap, missing assets, visible seams, or
  console errors.

### P1 — correctness and polish

#### SR-VIS-005 — Normalize every animation frame to one shoe baseline

- **Area:** runner positioning
- **Evidence:** `drawSheetFrameFitted` now preserves aspect ratio and anchors
  the bottom of the portrait action sheets, but the final regenerated action
  sheets still need measured bounds.
- **Task:** Record the opaque pixel bounds for every frame, align the planted
  shoe contact point to the same ground baseline, and center the torso without
  changing the collision box. Give jump and roll explicit intentional
  offsets rather than inheriting accidental transparent padding.
- **Acceptance:** On a frame scrub, the runner's feet do not vibrate, slide, or
  jump sideways; the collision rectangle remains stable while the painted pose
  changes.

#### SR-VIS-006 — Author readable state transitions

- **Area:** motion design
- **Evidence:** Run, rush, jump, roll, crouch, land, stumble, and celebrate use
  different frame counts and timings in `main.js`.
- **Task:** Define the timing and entry/exit frame for each state. Make the
  first and last frames share a compatible silhouette so rapid input does not
  pop between unrelated poses. Keep the roll as a grounded forward tuck, not a
  full cartwheel; keep rush as a deliberate four-frame burst.
- **Acceptance:** Repeated jump-roll-jump and run-hit-run input at 60 FPS has
  no frozen frame, backwards foot motion, torso stretch, or one-frame flash.

#### SR-VIS-007 — Reconcile painted obstacles with collision rectangles

- **Area:** obstacle placement
- **Evidence:** `drawObstacle` paints `car`, `low`, and `high` art into
  `obstacleRect(obstacle)` while the collision box is authored separately.
- **Task:** For every obstacle type, overlay the collision rectangle on the
  painted art at ground, jump, and roll heights. Correct source transparent
  padding, draw offsets, width/height, and lane placement. Document the final
  contact edge for the car, low barrier, and high barrier.
- **Acceptance:** A runner clears an obstacle exactly when the silhouette
  appears to clear it. No invisible hitbox, floating prop, buried prop, or
  obstacle that enters from outside the camera unexpectedly remains.

#### SR-VIS-008 — Fix pickup and platform visual anchoring

- **Area:** collectibles and traversal art
- **Evidence:** Pickups pulse between two object frames and platforms tile a
  two-frame sheet, but their visual bounds and gameplay rectangles are not
  covered by the current runner-frame fit contract.
- **Task:** Align coin, shield, speed, magnet, and platform art to their
  authored rects. Keep pickup pulse centered, make platform top edges form a
  continuous walkable surface, and remove any apparent 2 FPS positional snap
  caused by scaling or transparent padding.
- **Acceptance:** The pickup center stays fixed while it pulses; the platform
  top is visually coincident with its collision surface at every scale.

#### SR-VIS-009 — Set a per-background gameplay corridor

- **Area:** background composition and placement
- **Evidence:** The ten Image Gen plates share the comic-book city direction,
  but each has its own perspective, horizon, and lower-ground detail.
- **Task:** For every plate, mark the horizon, runner ground line, safe lower
  28% gameplay corridor, and high-contrast regions. Crop or grade each plate
  so the runner and obstacles remain readable and the horizon does not appear
  to rise or sink when a level changes.
- **Acceptance:** The runner's shoe baseline is visually stable across all
  plates. No important background detail competes with the runner, and no
  generated sign contains distracting readable text or accidental logos.

#### SR-VIS-010 — Make scene transitions seam-free

- **Area:** level transition motion
- **Evidence:** `drawBackground` uses a right-to-left comic-panel wipe after
  the previous cross-fade was removed; the wipe edge and unlike perspectives
  still need a visual pass on all adjacent scenes.
- **Task:** Test each transition with the player running, jumping, and near an
  obstacle. Tune overlap, accent edge, haze, and crop so the wipe reads as an
  intentional panel turn. Keep the runner, collision world, and HUD out of the
  transition clip.
- **Acceptance:** No one-pixel seam, exposed empty canvas, double road line,
  z-order jump, or abrupt runner scale change appears during a transition.

#### SR-VIS-011 — Preserve suit/chaser hierarchy and placement

- **Area:** chaser artwork
- **Evidence:** The suit artwork is the approved flawless reference, while the
  chaser position is dynamically clamped near the left edge as danger rises.
- **Task:** Keep the suit's silhouette, colors, and rendering untouched. Tune
  only scale, shoe baseline, bob, rotation, and left-edge clamp so the chaser
  reads behind the runner without cropping, merging into the runner, or
  appearing to float.
- **Acceptance:** At minimum and maximum danger, the full readable suit
  silhouette remains visible enough to identify the pursuit; its feet share
  the runner's ground plane and it never obscures the runner's collision cue.

#### SR-VIS-012 — Remove motion artifacts from props and effects

- **Area:** in-game animation
- **Evidence:** Obstacles, pickups, particles, road streaks, shield rings, and
  haze have independent timing and some are code-drawn rather than part of a
  unified raster style.
- **Task:** Audit each animated effect for purpose, anchor, cadence, opacity,
  and z-order. Replace non-GUI artwork with approved raster Image Gen assets;
  keep only simple UI feedback code-native. Ensure effects originate from the
  relevant shoe, pickup, obstacle, or impact point.
- **Acceptance:** No effect jitters independently of its source, flashes over
  the runner's face, creates a false collision cue, or persists after its
  source disappears.

#### SR-VIS-013 — Lock the camera and composition contract

- **Area:** scale and framing
- **Evidence:** The game scales a 2048×768 design world into the viewport and
  uses a fixed runner width/height, but art sheets have different aspect
  ratios and backgrounds have different focal points.
- **Task:** Define final runner scale, ground Y, camera overscan, horizon band,
  and left/right safe margins. Check the full character, chaser, nearest
  obstacle, pickup, and transition edge at the smallest supported viewport.
- **Acceptance:** No character or obstacle is unintentionally cropped; the
  runner occupies the same visual weight from 320 px phone width through
  desktop; the camera never reveals an unpainted strip.

#### SR-VIS-014 — Recompose HUD and overlays around the art

- **Area:** visual hierarchy and placement
- **Evidence:** Level title, cue, progress bar, move cue, chase meter, intro
  panel, status card, and touch controls share the same fixed shell as the
  canvas. Long names such as “THE LAST BLOCK” and short portrait heights are
  collision risks.
- **Task:** Test every overlay against the runner's ready position, jump arc,
  chaser, and upcoming obstacle. Give the title/cue/progress system a bounded
  composition that cannot collide with the play lane or wrap unpredictably.
- **Acceptance:** At 320×568, 390×844, 844×390, 1280×720, and 1440×900,
  no overlay covers a required gameplay silhouette, clips, wraps into another
  control, or becomes unreadable.

#### SR-VIS-015 — Finish touch and reduced-motion behavior

- **Area:** accessibility and input feedback
- **Evidence:** Touch controls are shown for phone and short landscape layouts;
  reduced motion disables parallax/road drift but still needs state-by-state
  validation.
- **Task:** Verify jump, double jump, roll, and held crouch feedback without
  relying on parallax. Keep controls at least 48 px, separated from the nav,
  and visible over every background. Disable nonessential bob, rotation,
  screen movement, and flashing effects under reduced motion.
- **Acceptance:** A reduced-motion playthrough remains fully understandable;
  touch targets do not overlap; keyboard and touch produce the same visual
  state changes.

#### SR-VIS-016 — Make resizing and high-DPI rendering stable

- **Area:** canvas rendering quality
- **Task:** Test device-pixel-ratio 1, 2, and 3, browser zoom, orientation
  changes, and resize during play. Snap only intentional pixel-art edges;
  preserve transparent edges and avoid half-pixel blur on characters,
  platforms, and HUD borders.
- **Acceptance:** No stretched sprite, blurry outline, one-frame canvas flash,
  or changed collision scale appears after resize or orientation change.

### P2 — final polish and publish hardening

#### SR-VIS-017 — Grade all ten plates as one world

- **Area:** color and texture continuity
- **Task:** Compare the ten plates side by side. Normalize navy, cream, red,
  cyan, shadow density, outline softness, halftone scale, and rain/glow
  treatment without flattening the intentional scene differences.
- **Acceptance:** The sequence feels like one illustrated game world, and the
  approved runner remains the highest-contrast focal point in every scene.

#### SR-VIS-018 — Remove accidental text, logos, and visual noise

- **Area:** background cleanup
- **Task:** Inspect every generated plate at 1× and gameplay scale. Mask or
  crop malformed signage, pseudo-letters, accidental brand marks, repeated
  objects, tangencies, and high-frequency detail behind the runner.
- **Acceptance:** Backgrounds contain no distracting readable text or logos and
  no artifact that could be mistaken for an obstacle or pickup.

#### SR-VIS-019 — Publish an asset inventory and size budget

- **Area:** loading and delivery
- **Task:** Record dimensions, color model, alpha usage, frame count, byte size,
  and load priority for every image. Compress without changing the approved
  silhouettes. Preload only the ready-state runner and first background; lazy
  load later scene art with a visible fallback.
- **Acceptance:** All assets decode in supported browsers, first play has no
  missing-art flash, and total initial payload meets the game's agreed mobile
  budget.

#### SR-VIS-020 — Verify fallback states are visually intentional

- **Area:** failure and loading states
- **Task:** Disconnect or delay each asset request and inspect the fallback
  runner, missing prop, missing background, game over, and complete screens.
  Use a consistent branded placeholder rather than a mismatched legacy pose.
- **Acceptance:** A failed request never produces a blank canvas, stretched
  sprite, broken-image icon, or collision state that disagrees with what is
  painted.

#### SR-VIS-021 — Final art-direction sign-off

- **Area:** release approval
- **Task:** Review the final contact sheets, background sequence, transition
  recordings, responsive captures, reduced-motion capture, asset inventory,
  and console report against this ticket list.
- **Acceptance:** P0 tickets are closed, P1 tickets have evidence attached,
  P2 polish is either closed or explicitly accepted as post-release work, and
  the release build contains only approved raster game artwork plus GUI-only
  vector controls.

## Definition of done

Sneaker Run is visually publishable when the supplied runner style is
consistent across every action, the suit remains the approved guide, every
painted object agrees with its collision geometry, every background preserves
the same ground and focal hierarchy, every route presented to players is
honestly playable, and the responsive/reduced-motion regression set passes
without visual or runtime errors.
