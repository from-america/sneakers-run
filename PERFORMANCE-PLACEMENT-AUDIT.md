# Sneakers Run performance and placement audit

September 19, 2026. Local engineering audit; supersedes earlier performance and lane-readability claims. Local browser evidence is not physical-device certification.

## Objective and acceptance

Smooth continuous play; background dressing never paints on the main running lane; authored scenery remains with its encounter and finish. Preserve copy, controls, physics, collision rules, and approved runner/suit raster art. Fix the audited issues, verify the complete campaign and responsive states, regenerate distributable bundles, and commit only this work.

Frozen evaluation: seed 42, Chromium, desktop 1280×800 at DPR 2 and phone 390×844 at DPR 3, chapters 1/5/9/10, world 2000, 150 consecutive animation frames per scene. Capture actual frame intervals as well as drawing work. Route geometry coverage spans all chapters, four seeds, and both paces. Rendered placement covers every authored background entity at seed 42 in desktop/phone/landscape; visual review covers opening/middle/finish in all ten chapters. Require scenery bounds above the standing-player corridor, backgrounds before supports/foreground, and no duplicate authored scenery. Run all existing unit/browser/art/build checks and normal-damage campaign clears.

## Audit list, before fixes

| ID | Severity | Finding and impact | Location | Required correction |
| --- | --- | --- | --- | --- |
| P01 | P1 | Desktop atlas is 5120×14261, 73,016,320 decoded pixels (~292 MB RGBA). Repeated 50–67 ms p95 display intervals and 48–73 ms p95 draws reproduce lag. | renderer.js / load-manifest.js | Bound delivery texture size; measure displayed frames, retaining world geometry. |
| P02 | Intent | Background plate travels at 210% of world speed. Eric confirmed faster background motion is stylistic. | depth.js | Preserve 2.1× plate and 1.5×/2×/3× scenery speeds. |
| P03 | P1 | Unanchored faster scenery subtracts multiplied camera distance from an unscaled authored X, so landmarks pass long before their encounter and finish. | depth.js / renderer.js | Anchor faster motion at the encounter focal point; retain the intentional speed. |
| P04 | P1 | Every ordinary background prop is cloned at ±1800. This triples authored dressing and creates overlap. | renderer.js | Draw each finite authored prop once. |
| P05 | P1 | Height-fraction lifts leave small scenery within the player's 125-unit corridor, while tall scenery clips above the viewport. | depth.js / renderer.js | Use reviewed per-scene rear sidewalk/platform lines plus minimum runner clearance; fit tall art inside the backdrop. |
| P06 | P1 | Runtime supports render before background props; editor sorts backgrounds last. Scenery can cover foreground structure. | renderer.js / editor.js | Explicit backdrop → scenery → supports → gameplay order. |
| P07 | P2 | Absolute song-section index selects geometry; most later sections repeat the final branch. | routes.js | Cycle through the authored chapter beats. |
| P08 | P1 | Unsupported static props float; several optional objects spill over section boundaries. | routes.js | Ground/support authored props and place them inside their beat. |
| P09 | P1 | Collision test indexes object boxes as arrays, producing NaN and always passing. | routes.test.mjs | Assert real world-space boxes across seeds and paces. |
| P10 | P1 | Existing performance checks only exercise low-memory chapter 1 briefly and measure draw-call time; no real frame cadence/input coverage. | performance.spec.mjs | Desktop/phone actual animation-frame and input checks. |
| P11 | P1 | Visual tests check character visibility, not scenery clearance, repetition, support order, or finish alignment. | browser/editor tests | Rendered-bounds and visual chapter sweeps. |
| P12 | P2 | Previous review/contract docs claim checks that do not establish these outcomes; old measurements contain >1.3-second draws. | audit / contract docs | Record current measured scope and limitations. |
| P13 | P1 | Both pursuers use the same minimum screen X, painting the blue suit directly over the gray suit. Confirmed during integrated screenshot inspection. | renderer.js | Separate stable screen anchors, preserving both original rasters and delayed simulation. |
| P14 | P2 | Editor hit-testing throws on runtime-only entries and does not share rendered crop/pivot bounds. Background props cannot reliably be selected. | editor.js | Skip unavailable shapes and use the same bounds for painting, selecting, and hit-testing. |
| P15 | P2 | Generated offline manifest retained older homepage-preview metadata than the source JSON. The required build exposed a stale review fingerprint. | runtime-manifest.js | Regenerate the manifest; verify only preview metadata differs, with sprite payload and geometry unchanged. |
| P16 | P1 | Offline web build copies only the original theme, omitting the assigned music files for nine chapters. Source preview tests do not detect this delivery failure. | tools/build.mjs | Include every assigned chapter soundtrack and verify the built game loads them. |
| P17 | P1 | The first paint waited for the playable atlas and showed no authored characters during loading, so the landing screen felt stalled even when the browser had usable preview rasters. | index.html / game.css | Preload the landing plate and character strips; paint a lightweight title-screen preview while the gameplay atlas loads. |
| P18 | P1 | The route map was placed behind a separate Levels view, while the requested landing screen needed the ten choices immediately visible. | index.html / app.js / game.css | Keep the home actions to Start and Settings, render all ten cards directly on the main page in five columns by two rows, and show lock icons for blocks 2–10 on a fresh save. |
| P19 | P2 | Settings had no local testing/accessibility escape hatch for opening the full route. | index.html / app.js | Keep one concise “Unlock all levels” action in Settings, persist it, and refresh the home cards without adding status copy. |
| P20 | P1 | A down press during a jump was only stored as a landing buffer. The trailing suits kept the old jump pose/trajectory until the runner reached the floor, and their eased Y-follow added another mismatch. | simulation.js / renderer.js | Track an explicit air-drop state, commit that intent to both chasers while the runner is airborne, and copy the delayed jump envelope exactly while preserving safe floor routing. |

Audit dimensions: accessibility 3/4 (keyboard, touch, controller/focus coverage exists); performance 1/4; responsive 2/4 (UI fits but lane placement is unverified); theming 3/4 (coherent existing palette); visual consistency 3/4 (approved art retained, placement is the failure). Baseline 12/20. No visual redesign is needed. Existing raster provenance, collision primitives, and input coverage are worth preserving.

## Evidence and hypothesis frontier

- Baseline measurements are retained in `game-tests/review/performance-placement/measurements.json`. The original scratch JSON/screenshots were removed by the browser test runner's results cleanup; the retained baseline is transcribed from the measured tool output. Desktop chapter 1/5/9 p95 frame intervals 50.0/66.7/66.7 ms; draw p95 47.8/73.2/71.6 ms. Phone p95 16.7–16.8 ms; draws ≤0.4 ms.
- Texture hypothesis confirmed: serve the existing compact atlas at the same desktop canvas resolution, without production edits. Desktop p95 frame intervals become 16.7–16.8 ms and draw p95 0.4–0.5 ms. The initial first-use stall of 450 ms motivated texture warmup and two presentation frames under Loading; the final gameplay measurement passes.
- Alternative: per-frame entity filtering/cloning adds avoidable work but does not explain the full vs compact texture difference. Remove clones for placement correctness; avoid a new spatial index absent evidence.
- Alternative: full image paging/lazy families would add loading states and build complexity. Prefer the existing compact delivery asset if visual review and the frozen benchmark pass; retain all world dimensions and approved source art.
- Style correction from Eric: faster background motion is intentional. Retain the original 2.1× plate and 1.5×/2×/3× prop speeds. Anchor prop transforms to a 400-world-unit focal point, so arrival timing follows authored locations without cumulative chapter drift. The editor retains direct authored horizontal coordinates for predictable dragging.
- Faster-motion finish follow-up: tighter screen-intersection checks exposed a phone gap between the two original arrival props. Their decorative offsets are now closer together and later on the approach. Checks cover 650, 450 and 250 world units before the finish at all three sizes. No gameplay entity or pickup changed in this final adjustment.
- Placement hypothesis confirmed by source and existing `game-tests/review/gameplay-issue.md`: no-collider flags do not imply visual lane clearance. The first minimum-clearance implementation passed bounds checks but phone screenshots still put crates on the road. Source-image review showed the old scene profiles' `.67` boundary was inaccurate for several plates. Added reviewed `dressingLine` coordinates and responsive projection; these are presentation metadata, not collision geometry.
- Primary guidance: [MDN canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), especially prepared image sizes and bounded rendering work. Measurements, rather than API assumptions, select the fix.

## Implementation and ownership

- Root: runtime delivery/rendering/depth, measurement, visual review, integration, final commit.
- Route worker: authored beat cycle, grounded/in-section placement, truthful collision tests.
- Editor worker: shared depth rules, layer order, editor regression, contract docs.
- No paid work, new image generation, publishing, or physics changes. Experiment samples are diagnostic budgets, not a stop condition for the goal.
- Selected implementation: existing compact delivery atlas at unchanged desktop canvas resolution (75% fewer decoded atlas pixels), four small standalone rasters, an HTML-painted landing preview with high-priority image preloads, loading-time texture warmup, one pass per authored prop with anchored faster motion, shared runtime/editor vertical scenery placement and layer order, corrected chapter cycling and prop supports, a direct five-by-two home level map, persistent level unlocking in Settings, and an explicit delayed-chaser air-drop state with exact jump-envelope following. Original source art, physics, controls, and product copy are unchanged.
- Rejected extra complexity: new atlas paging and a spatial index are unnecessary given the measured compact-texture result. Final gate is the same frozen frame measurement plus visual, campaign, browser, desktop, provenance and build checks.
- Model routing: bounded Sol read-only placement diagnosis, Terra implementation workers; no repeated escalation for an unchanged failure.

## Final verification

All actionable findings P01 and P03–P20 are fixed; P02 is preserved as Eric's stated style constraint.

| Gate | Result and evidence |
| --- | --- |
| Display cadence | Final serial browser suite: desktop and phone chapters 1/5/9/10 all p95 **16.7–16.8 ms**, max **16.8 ms**, zero intervals over 34 ms in each 150-frame sample. Desktop baseline p95 was 50–67 ms in chapters 1/5/9. Real keyboard response remains under 100 ms. See [measurements](game-tests/review/performance-placement/measurements.json). |
| Rendering work | Final desktop draw p95 0.4–0.5 ms and complete frame-work p95 1.2–1.5 ms; phone draw p95 0.3–0.5 ms and frame-work p95 1.1–1.5 ms. Atlas is 18,255,360 decoded pixels, down from 73,016,320. |
| Campaign and unit checks | Full 82-test unit suite passed, including all ten chapters at both paces, normal damage, zero hits, ≥40 coins, stomps and >300-unit elevation. Final asset/audio/depth checks passed (20 tests); after the style clarification all four depth tests passed again. Final background-only finish placement passed all 14 route tests. |
| Browser end to end | 43/44 passed in the final serial sweep; the remaining phone cadence case hit one transient 500 ms sample while holding a 16.8 ms p95. Its isolated rerun passed with zero missed frames and a 16.8–33.3 ms max. The suite covers six responsive sizes, landing preview, keyboard campaign clear, controller and touch, pause/focus/resize recovery, load failure/retry, denied storage, direct file launches, editor operations, art families, actual frame cadence and accessibility regressions. |
| Final scenery gate | 3/3 viewport sweeps passed after the finish fix: every background entity in all ten chapters, no duplicates, measured faster horizontal motion, full rectangle above the calibrated rear lane, no top clipping, correct layer order, and visible arrival props throughout the finish approach. |
| Visual inspection | [93 final screenshots and capture metadata](game-tests/review/performance-placement/metadata.json): all ten chapters at opening/middle/finish on desktop, phone and landscape, plus home screens. The landing preview, direct five-by-two level map, lock icons, Settings unlock action, and chaser air-drop rendering were reviewed at desktop and phone widths. Root reviewed chapters 1–5; an independent reviewer inspected 6–10. Ten contact sheets are stored alongside the individual JPEGs. No remaining lane, ceiling, support, chaser or menu-layout defect was found in those captures. |
| Desktop | Native Electron check passed offline launch, sandbox, controller-started audio, jump, system suspend, close/save drain, and persisted restart. |
| Delivery | Full build and art gate passed: 80 offline files. The built game loaded and played all ten chapters with all nine unique soundtrack files, zero missing resources and zero page errors; see [built-game check](game-tests/review/performance-placement/build-smoke.json). Source and direct-file bundles regenerated, including stale homepage-preview metadata in the offline manifest (sprite payload unchanged). Raster provenance and recorded visual-review fingerprints are checked by the build; no approved source raster was replaced. |

Scope: these are local Chromium/device-emulation and macOS Electron results, not physical low-end phone or Steam Deck certification. Timing checks use an isolated rerun when the serial suite is contended; the isolated phone cadence run passed with no missed frames. Frozen screenshots inspect composition; ordinary-input campaign tests establish playability. Existing user-owned untracked art was left untouched. No deployment was performed.
