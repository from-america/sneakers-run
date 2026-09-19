# Sneakers Run: engine and animation audit

Current lag and placement findings, fixes, and verification are in [the September 19 audit](PERFORMANCE-PLACEMENT-AUDIT.md). The historical checks below did not establish frame cadence or visual background clearance.

September 16, 2026 · Version 3. This supersedes the version 2 review. The earlier review missed the absence of obstacle-top collision and accepted a runner sheet whose poses did not alternate legs. Its old campaign and endless results do not establish correctness for this version.

The game now has elevated routes, moving enemies, stomp bounces, rotating coins and an individually authored full-character run cycle. The interface and approved illustration style are retained. This is a local engineering and visual review, not a claim of AAA production quality, perfection, Eric's approval, or Steam Deck certification.

## Contact and movement

| Part | Critique | Replacement and verification |
| --- | --- | --- |
| Obstacle tops | Almost every obstacle was an undifferentiated damage rectangle. | Every solid has explicit upper faces. Nonlethal tops are walkable; spikes and the electrified rail keep lethal top contact while sides and undersides damage. Both floor and elevated instances are exercised. |
| Cars and trucks | A single rectangle filled empty space around roofs and hoods. | Separate chassis, cab/roof and hood rectangles, with safe stepped tops. The truck now matches the car's raster style. |
| Decorative edges | Lamps, glow, shadows and perspective rims could become invisible walls. | Authored interior geometry excludes those decorations. Platform support follows its painted front lip. |
| Fast contact | Final overlap can miss a thin beam or moving actor. | Swept feet/body contact in relative motion, using previous and current entity positions. |
| Event order | Snapping to a landing could erase an earlier side hit. | Damage is resolved along the original trajectory before landing, then along its remaining segment. A lethal contact stops processing immediately. |
| Edge landings | Requiring overlap at the end of a tick lost valid edge impacts. | Impact and continued support are distinct. Edge landings/stomps count; walking off receives coyote time. |
| Elevated movement | Ground-only geometry prevented a real upper route. | Entity Y offsets apply to art, collision and pickups. Jumps start relative to the current support height. The camera stays floor-locked with the full jump envelope visible. |
| Enemies | Most existing actors never appeared in play. | Ten enemy families patrol on ground and upper decks. Landing defeats one, awards 250 once, bounces the runner and restores one air jump. Dead enemies lose collision immediately. |
| Stomp feedback | No enemy interaction or readable outcome. | Brief raster squash/fade, impact art, score feedback and bounce. All ten types pass ground/elevated, left/right patrol cases. |
| Roll on landing | A queued air-drop could land standing for the remaining part of a tick. | Landing posture is applied before the remaining collision sweep. The one-tick drop-to-beam regression is covered. |
| Jump feel | Timing and recovery needed consistent rules. | 120 Hz simulation, 140 ms buffer, 100 ms coyote time, two jumps, capped lift relative to takeoff. Existing jump/frame-rate checks remain. |
| Conveyor | The asset was absent and mechanically inert. | Walkable belt surface adds forward travel while supported. Decorative handrail stays outside contact. |

## Animation and artwork

| Part | Critique | Replacement and verification |
| --- | --- | --- |
| Runner poses | The old eight-frame sheet repeatedly showed one leading leg. | Eight whole-character poses from the v8 contact sheet: right contact/compression, left passing/flight, left contact/compression, right passing/flight. Each frame is alpha-parsed and inspected individually. |
| Hands and arm swing | A proposed cutout sheet had incorrect hands; an early whole-character revision snapped arms between extremes. | Cutout approach discarded. Compression frames were redrawn with intermediate arm positions. Independent review checked hands, identity, transitions and loop seam. |
| Registration | Centering each tight alpha crop shifted the torso as limbs extended. Bottom alignment pinned flight shoes to the floor. | Explicit pelvis X and ground Y in `assets/runner-registration.json`. Stable head position; flight feet retain clearance. No runtime crop-centering of the runner. |
| Animation clock | Global time advanced the stride while airborne and ignored travel. | Run phase follows distance. Pause stops it, landing resumes a contact phase, relaxed pace slows it naturally. |
| Coins | Static front-facing tokens gave no rotating-volume cue. | Eight raster rotation views with fixed diameter/center, including actual edge artwork. Frames follow simulation time and freeze on pause. |
| Enemy sheets | Equal-width slicing cut through hands and shoes. Some source frames changed actor count. | Connected alpha components preserve complete actors. Head/ground registration controls crop drift. Skateboard uses push/recovery subset; pigeons use the consistent three-bird subset. |
| Protected pursuers | A single cropped sheet made the two people read as one jittery actor and cut hands/feet at the cell edges. | The runtime carries separate gray-suit and blue-suit raster families: run, point/start, finish-fatigue, jump, and roll. They match the attached two-man reference, are alpha-component parsed, head-axis registered, and keep the forward fist and action anchors readable. |
| Platform placement | Upper platforms without structure would look pasted into the sky. | Existing support rasters extend to ground behind elevated decks. Platforms preserve their full silhouette and aspect ratio. |
| Asset use | Props, enemies and powers were stored but absent. | All current gameplay families are in authored routes: 10 enemies, 19 environment shapes, rotating coins, shield, magnet, rush, static goal/switch set-pieces, four effect families and 10 new four-FPS looping raster props. Historical variants are listed separately below. |
| Old variants | Loading every historical image would reintroduce rejected styles and broken cycles. | Old runner attempts, cutout proposals, pixel truck and inconsistent full pigeon sequence are not runtime assets. Original sources remain available. |

`game-tests/review/run-v8-all-frames.png` and `run-v8-loop.gif` are rendered from the shipping atlas at the authored 4 FPS review cadence. `sprites.json` records source hashes; `test:art` checks raster provenance, atlas bounds, uniform aspect ratios, prop footprints and roll clearance. Numeric checks do not replace visual inspection.

## Levels and replay

| Part | Critique | Replacement and verification |
| --- | --- | --- |
| Blocks 1–7 | Long recovery gaps and isolated jump/roll obstacles made them repetitive. | Compounds start in block 1: connected ascending decks, enemies above/below, low-clearance roof/underpass choices, trucks, shutters, cranes and traffic. |
| Route choice | Platforms were occasional props rather than a useful path. | Each block contains multiple walkable elevations; coins and opponents occupy those paths. Upper decks reconnect to ground. |
| Difficulty | More objects alone can create unavoidable hits. | A bounded lookahead playtest driver sends ordinary jump/roll/release commands with damage active. It must clear all ten blocks at both paces, collect at least 40 coins and stomp enemies. It does not teleport or suppress damage. |
| Seeded layouts | Fixed story placements made retries predictable while unconstrained randomness would create unfair jumps. | Story beats use three authored alternatives selected by the run seed, with explicit reaction/recovery windows, bounded step rises, a grounded high/low route, and extra decorative raster dressing. Endless compounds retain their seeded ordering and bounded active history. |
| Powers | Speed artwork was unused. | Shield absorbs one hit; magnet lasts eight seconds; rush gives 4.5 seconds of 7% faster travel, shield and magnet, with visible status. |
| Goals and saves | Replay needs durable progression. | Finish, 40 coins, no hits; separate pace records; existing save corruption, denied-storage and unlock tests remain. |

## Interface and desktop

| Part | Review / evidence |
| --- | --- |
| Keyboard, touch, controller | Existing input system retained. Browser checks cover real keyboard play, touch cancellation, remapping, menu navigation and controller disconnect. |
| Help and feedback | Prompts distinguish stomp, stay low and climb; elevated routes and coin paths show where to go. |
| Responsive composition | Desktop, portrait phone, small phone, landscape, 720p and ultrawide checks; actual elevated-route captures at desktop, phone and Deck-sized viewports. |
| Pause and recovery | Pause/focus loss release inputs, stop physics and coin animation; resume countdown remains. |
| Renderer | Fixed-step interpolation, uniform raster scale, elevation camera, bounded transient effects; immediate resize redraw retained. |
| Audio | Existing music and settings retained; synthesized gameplay cues were removed. Audio never gates input. |
| Desktop wrapper | Offline assets, controller navigation, fullscreen, native save queue and sandboxed host retained. Local Mac launch, suspend and save/reopen checks are rerun after packaging. |
| Steam | Standalone macOS, Windows and Linux packages support adding a non-Steam application. Store publication, Steamworks integration and Deck Verified certification are outside the delivered build. |

The current simulation/assets run covers the collision, gate/button, train-top, enemy-stomp, route, chaser-registration and looping-prop contracts, including twenty campaign clears (ten blocks at both paces) with no hits, at least 40 coins and at least one stomp each. The browser suite covers the six responsive home views, real keyboard play, touch/controller input, loading recovery, all ten route openings, coin rotation, train hazards and the editor playground.

Reproduce with `npm run test:unit`, `npm run test:visual`, `npm run test:desktop`, `npm run capture`, and `node game-tests/route-capture.mjs`. Exact reviewed content and captures are recorded in `game-tests/review.json`.

Physical Deck/controller ergonomics, Windows/Linux execution, battery use, broad human playtesting and low-end hardware performance remain unverified. A solved route proves a path exists; it does not prove every player will find its difficulty enjoyable. The remaining human playtest questions are in `PLAYTEST.md`.
