> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# September 16 game rebuild

The browser game now has a new simulation, renderer, input/lifecycle layer,
save system and interface. The first engine pass reused the existing raster artwork. That did not
resolve the rejected art direction. See the subsequent correction in
`ART-DIRECTION.md`; the original screenshot pass below is technical evidence
only and does not certify visual quality.

The user-reported failures had concrete causes:

1. Background drift used a fraction of an entire long level and available
   image overflow, resulting in barely visible travel. It now uses distance
   with an independently moving road and repeating scenery.
2. Source-sheet padding and unrelated width/height targets squashed props
   and chasers. Measured painted bounds now drive uniformly scaled draws.
3. The old runtime rebuilt large masked background canvases while playing,
   wrote HUD state in every physics substep and retained finished action
   clocks across repeat rolls. These paths were replaced with prepared frames,
   cached scenery, a throttled HUD and explicit action state.
4. The long continuous level loop now has short blocks, checkpoint selection,
   objectives, useful results and an explicit next-block action.
5. Mobile world geometry, input cancellation, tab pause, load failures,
   collision timing and persistence now have direct runtime tests.

Visual direction: expressive street arcade, Archivo Black display type with
Space Grotesk controls, ink/paper surfaces with yellow actions, mint power-ups
and coral pursuit danger. The game stage owns the screen; controls sit below
it. A dashboard/card-grid wrapper was ruled out because it would compete with
playfield visibility. See WORLD-SPEC.md for the current runtime contract.

## Verified locally

- `npm test`: 15 model/authoring tests, the existing 320-encounter authoring
-  check, and 18 browser tests passed. The route sweep covers 250 stage runs.
- 28 replacement screenshot baselines checked for layout across five viewport sizes
  and three additional neighborhood compositions. The art gate also requires a
  current fingerprinted local review; it does not claim user approval.
- Real-time Chromium playthrough at 390×844 with actual keyboard actions:
  opening block cleared in 32.16 simulated seconds, 64 coins, 10 clean
  escapes, 1 hit and no page errors. The 95th-percentile frame interval was
  16.7 ms. Sampled render-submission work was about 0.2 ms for both running
  and rolling; 83 prepared frames and one scenery cache build stayed fixed.
- These are local desktop-browser results with phone viewport/touch emulation,
  not measured physical-phone or GPU performance. Runtime sprite sources
  still total approximately 24.6 MiB on an uncached first load, so a slow
  connection can spend time on the visible artwork-loading screen.
