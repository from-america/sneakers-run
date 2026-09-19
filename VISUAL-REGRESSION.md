> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# Sneakers Run verification

From this directory, run `npm test`. This runs the separate recorded art-review check, the model/authoring tests,
then the Chromium browser tests. `npm run dev` serves the game locally on
port 4188. The browser config uses local Google Chrome when available;
`SNEAKER_RUN_BROWSER` can override the executable. Otherwise install
Playwright Chromium with `npx playwright install chromium`.

## Coverage

- Five viewport sizes: 1280×800, 1440×900, 390×844, 320×568, and 844×390.
- Ready, running, rolling, paused and cleared screenshots at every size,
  plus three distinct neighborhood compositions.
- Real keyboard and touch-button input, double jumping, full gate clearance,
  swipe detection, cancellation, and focus-loss pause.
- Actual world/road movement at different speeds, including reduced motion
  and repeated background wraps.
- Correct aspect ratios for drawn raster sprites, including every hazard.
- Scenery/runner proportions across three equal-width portrait heights; menu
  separation from both actors, 44px block targets, full double-jump and feedback
  clearance, and uniform extended sky pixels.
- Death/retry, next block, checkpoint reload, final completion, blocked
  storage, failed art loading and retry.
- Repeated rolls without new frame preparation or background cache builds.
- A 95th-percentile render-submission budget of 12 ms and browser frame
  interval budget of 50 ms in the local performance check.
- Pure-model sweep through all 10 blocks with 25 seeds each, using a simple
  jump/roll controller. It asserts completion and bounded entity counts.
- Single-step tests for buffering, coyote time, repeated rolls, pause,
  powers, collision fairness at both speed extremes and saved objectives.

## Screenshot maintenance

A matching screenshot is not evidence of good art. Follow `ART-DIRECTION.md`
and complete the reference comparison before accepting replacement captures.
`npm run test:art` becomes stale when the visual inputs change; updating PNG
baselines does not update that separate record.

`npm run test:visual -- --update-snapshots` intentionally updates screenshots.
Inspect new images before accepting them, then rerun without that flag.
The rejected composition remains in `tests/art-direction/before-*.png` for
comparison; it is not an expected visual result.

`?visual-test=1&seed=42` enables a test-only bridge. Its start hook freezes
immediately after startup, allowing reproducible physical scenarios. The
normal Start button always runs in real time. The bridge supports model
snapshots, bounded stepping, representative hazards, finish/failure and
render-performance diagnostics; it is absent from normal game URLs.

## Scope of evidence

The automated browser checks run in desktop Chromium, with phone dimensions
and emulated touch input. They are not physical iOS/Android certification.
Render-submission timings measure JavaScript draw work and frame intervals,
not total GPU time or end-to-end touch latency. Real device performance and
speaker/headphone listening remain outside this local verification.
