# Image Gen game-art set

These raster assets were generated with ChatGPT Image Gen for Sneaker Run.
Generation provenance does not establish artistic approval. The retained
orange-haired runner is the style reference. The earlier painterly background
set was rejected for mismatch and viewport composition; current runtime
backgrounds live in `streets-v2/`. See `../../ART-DIRECTION.md`.

## Runner

- `runner/run-v6.png` — eight-frame transparent RGBA running cycle with four
  readable right-arm drive frames and four left-arm drive frames, packed as
  square frames so Sneakers fills the gameplay box instead of being reduced by
  portrait letterboxing.
- `runner/run-v6-frames/frame-01.png` through `frame-08.png` — the individual
  generated frames reviewed for arm balance, leg alternation, identity, and
  shoe baseline before assembling the runtime strip. The runner preserves
  these frames; the runtime rival uses its own generated sheet.
- `runner/idle-v1.png` — static raster fallback.
- `runner/actions/jump-v1.png`, `roll-v1.png`, `crouch-v1.png`, `land-v1.png`,
  `stumble-v1.png`, `celebrate-v1.png`, and `rush-v1.png` — four-frame action
  sheets generated from the approved runner reference.

## Chaser, props, and effects

- `chaser/run-gray-suit-v1.png` and `chaser/run-blue-suit-v1.png` — separate
  eight-frame suit-chaser sheets generated from the attached two-man reference:
  the bald gray-suit man and the brown-haired blue-suit man. Each sheet keeps
  the forward fist visible in the passing and flight poses.
- `chaser/start-point-gray-suit-v1.png` and `chaser/start-point-blue-suit-v1.png`
  — six-frame point, lean, and first-stride intro sheets used when Sneakers is
  dropped into a block.
- `chaser/out-of-breath-gray-suit-v1.png` and
  `chaser/out-of-breath-blue-suit-v1.png` — six-frame grounded breathing loops
  shown after Sneakers crosses the finish.
- `chaser/jump-gray-suit-v1.png` and `chaser/jump-blue-suit-v1.png` — four-frame
  takeoff, rise, apex, and descent sheets that follow Sneakers' jump envelope.
- `chaser/roll-gray-suit-v1.png` and `chaser/roll-blue-suit-v1.png` — four-frame
  low-clearance tuck and roll sheets that follow Sneakers' roll action.
- `props/car-v1.png`, `low-v1.png`, `platform-v1.png`, `coin-v1.png`,
  `shield-v1.png`, `speed-v1.png`, and `magnet-v1.png` — two-frame raster
  gameplay objects; `coin-icon-v1.png` is the single-frame HUD crop.
- `vfx/dust-v1.png`, `coin-v1.png`, `power-v1.png`, and `impact-v1.png` —
  two-frame raster effect sheets.

## Delivery boss

- `enemies/delivery-boss/run-v2-frames/frame-01.png` through `frame-04.png` —
  four isolated transparent courier-and-hand-truck poses generated from one
  identity reference. They share a head axis and wheel baseline, and are
  packed into the `deliveryBoss` runtime family for the final encounter.
- `enemies/delivery-boss/run-v2.png` — review contact sheet assembled from the
  four accepted frames.

Two earlier contact-sheet attempts were rejected because adjacent panels touched
the silhouette edges and could have clipped a wheel in the atlas. They remain
outside the project asset tree and are not loaded by the game.

The complete runtime inventory, source type, frame count, and preservation
exceptions are recorded in `runtime-art-manifest.json`. The old
`visual-model` sheets remain available as an art-direction record and are not
loaded by the browser runtime.

## Historical backgrounds (not loaded by the current runtime)

1. `01-waterfront-diner.png` — Waterfront Diner
2. `02-rooftop-sunset.png` — Rooftop Sunset
3. `03-underpass-rain.png` — Underpass Rain
4. `04-neon-market.png` — Neon Market
5. `05-subway-platform.png` — Subway Platform
6. `06-basketball-block.png` — Basketball Block
7. `07-industrial-bridge.png` — Industrial Bridge
8. `08-uplift-crosswalk.png` — Uplift Crosswalk
9. `09-warehouse-district.png` — Warehouse District
10. `10-city-clear-dawn.png` — City Clear Dawn

These historical plates remain in `backgrounds/manifest.js` for the old
authoring tools. The current renderer loads `streets-v2/manifest.js`. Each level selects one unique PNG plate and carries its
own horizon/depth treatment, landmark, atmosphere, lower-band focus, and
preload record. Gameplay encounter geometry remains owned by the route
authoring workstream.

## Runner arm timing contract

The runtime run sheet is eight full-body frames. Four frames belong to the
right-arm drive and four belong to the left-arm drive, with transition poses in
each group. `world-spec.js` and the visual regression suite lock the frame
ownership so a future Image Gen replacement cannot silently collapse one side.

## Runner v6 animation plan

This replacement cycle was generated one frame at a time so the arm/leg
counter-swing could be checked instead of relying on a single generated strip.
The runner faces right and keeps the same head, torso, shoe, outline, palette,
and bottom ground anchor in every frame.

1. Right-arm drive contact: the opposite arm trails behind.
2. Right-arm drive transition: both fists remain separated.
3. Left-arm drive contact: the opposite arm trails behind.
4. Left-arm drive transition: both fists remain separated.
5. Right-arm drive contact repeat with a different leg contact.
6. Right-arm drive transition repeat.
7. Left-arm drive contact repeat with a different leg contact.
8. Left-arm drive transition repeat before returning to frame 1.

Every frame must be a transparent raster image generated with ChatGPT Image
Gen. The approved pasted runner style is the primary reference; the existing
suit artwork remains a rendering guide only.
