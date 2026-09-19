# Sneakers Run level design: current → improved

This is the next route pass for the ten authored blocks and Endless. It keeps the
current raster style, floor locked camera, safe obstacle tops, stomp rules, and
static scroller timing. The work is primarily in route composition: each block
gets a readable identity, a sequence of connected decisions, and a finale that
belongs to that place.

## What is shipped now

`game/routes.js` now stores a named beat deck for every block. Each beat has a
specific player verb, signature landmark, sheet-parsed street prop, enemy pair,
reward, and deterministic layout pattern. The ten decks contain 58 unique beat
IDs, so the campaign no longer reads as one repeated route with ten background
swaps. Every finale also has its own ordered set-piece arrangement while keeping
the shared collision contract and safe runway rules.

The current system already has the pieces needed for a stronger campaign:

- Structures: platform, fire escape, conveyor, shutter, crane, train, and
  security gate.
- Obstacles: barrier, car, barrel, low gate, bollards, sweeper, truck, spikes,
  and electrified rail.
- Enemies: rival, courier, suit runners, parking attendant, raincoat snatcher,
  bike messenger, pigeon flock, construction roller, and camera chaser.
- Goals and rewards: checkpoint, floor button, finish marker, coins, shield,
  magnet, and rush.

## Shared composition rules

1. **Author beats, not tokens.** Replace a section string with a beat object that
   names its entrance runway, required action, exit height, signature asset,
   enemy role, reward, and visual anchor. The generator still places everything
   deterministically, but the route reads like an authored level.
2. **Use a four-part rhythm.** Every compound follows `read → commit → recover →
   reward`. Give the player a clear runway before a jump, roll, stomp, or cover
   choice; never hide the required action at the edge of the screen.
3. **Make height useful.** Each block should have at least three meaningful
   elevated choices. An upper deck must reconnect to the floor within one
   compound, with a visible support or fire escape reaching the floor line.
4. **Give every block a signature.** A signature asset appears in an authored
   arrangement that is unique to that block. Do not place the same hazard family
   in two consecutive beats unless the second use changes elevation or action.
5. **Keep the scroller fair.** Timed catalog ideas remain static, telegraphed
   jump, roll, or cover decisions until a moving-state system exists. No beat
   should require waiting for a cycle or reacting to an event the camera has not
   revealed.
6. **Separate danger from decoration.** Use the shared `SHAPES` solids and
   registration offsets for all contacts. Decorative wheels, lamps, rails,
   shadows, and supports never become invisible walls. All floor items are
   authored at `y=0`, and every upper platform has a deliberate landing height.
7. **Reward exploration without blocking progress.** Optional coin arcs and
   power pickups should sit on the riskier route, while a safe floor route stays
   open. A checkpoint follows the hardest compound, not the start of it.
8. **End with a place-specific payoff.** Replace the shared `putFinal()` chain
   with a finale beat list. Each finale may use the same goal assets, but the
   approach, height, enemy, and last action must be different.

## Ten-block current → improved plan

| Block | Current route | Improved sequence and intended feel |
| --- | --- | --- |
| 1 · Waterfront | `stairs / traffic / stairs / works / market`; generic final chain | **Learn the route.** Barrier runway → parked-car hood landing → two connected loading platforms → low gate under the waterfront rail → skateboard rival stomp on the upper deck → conveyor return to the floor → checkpoint and finish beside the pier. Coins teach the safe and risky heights; shield appears after the first clean stomp. |
| 2 · Loading zone | `works / stairs / market / works / traffic`; same finale | **Climb through machinery.** Conveyor belt → truck roof climb → barrel stack with a safe top → closed shutter wall → parking attendant on the lower lane → floor button → security gate opens into a fire escape shortcut → finish at the loading bay. The button is the only switch; the gate never closes behind the player. |
| 3 · Rooftops | `stairs / traffic / stairs / market / stairs / works`; same finale | **Cross open air.** Fire escape ascent → short rooftop gap marked by parapets → pigeon flock over the upper landing → crane hook used as a cover silhouette → staggered platforms back to street level → low gate under a roof sign → checkpoint on the far roof → finish at the skyline edge. Spikes mark the gap edge but never occupy the only landing. |
| 4 · Night market | `market / stairs / traffic / market / works / stairs`; same finale | **Thread a crowded lane.** Bollards force a first jump → awning-height platform → rolling barrel on the floor → camera chaser on the stall roof → street sweeper sweep zone with a clear floor route → coin arc through a low gate → fire escape shortcut → finish behind the market shutters. The optional upper lane pays out magnet; the lower lane remains readable. |
| 5 · Underpass | `traffic / market / works / stairs / traffic / market`; same finale | **Stay low, then leap.** Parked car → low gate → electrified rail with a wide jump runway → raincoat snatcher and bike messenger on alternating heights → conveyor under the beam → stationary train as a safe roof → checkpoint at the tunnel mouth → finish in daylight. The rail is lethal on contact, while the train top is explicitly safe. |
| 6 · Subway | `works / market / stairs / traffic / market / works`; same finale | **Use the platforms.** Train roof entry → drop to a subway platform → third rail jump → shutter climb → courier on the upper lip → suit runner on the floor → fire escape reconnection → button and gate open the final platform → finish past the tunnel signal. Coins show the intended train-roof landing before the drop. |
| 7 · Basketball court | `stairs / traffic / stairs / works / market / traffic`; same finale | **Bounce between lanes.** Car hood → barrier pair with a wide landing → bleacher platforms → rival stomp followed by a pigeon flock over the hoop line → street sweeper at floor level → crane support climb → checkpoint behind the backboard → finish through the court gate. Rush is placed after the stomp so its extra speed is earned. |
| 8 · Bridge | `works / traffic / works / stairs / market / works`; same finale | **Commit to long jumps.** Crane base climb → truck roof transfer → bollard zigzag on the bridge deck → bike messenger patrol across the upper rail → raincoat snatcher on the return platform → electrified maintenance rail → fire escape down-ramp → finish beside the far pier. The bridge uses long, visible runways and never asks for a last-frame dodge. |
| 9 · Crosswalk | `traffic / stairs / market / traffic / works / stairs`; same finale | **Read the street signal.** Car and truck stagger → parking gate arm that is always readable as a roll or jump → platform over the curb → parking attendant and suit sprinter on separate lanes → barrier at the landing → construction spikes in a marked work strip → checkpoint after the crossing → finish at the storefront. Magnet sits on the optional platform route. |
| 10 · Daybreak | `stairs / works / market / traffic / stairs / works / market`; same finale | **Campaign exam.** Conveyor start → shutter climb → crane hook cover → train roof transfer → mixed enemy pair (camera chaser above, construction roller below) → separated spikes and electric rail with a safe platform lane → button opens the final gate → fire escape descent → finish in the dawn scene. Place the three powers before, during, and after the exam so each has a distinct purpose. |

The exact pixel offsets should be tuned in the editor after the beat data lands.
The table defines the gameplay order and asset roles; it is not a request to
paint new art before the existing pieces have been composed well.

## Endless: current → improved

Endless currently chooses one of four generic section kinds from a seeded random
sequence and passes it through the same `section()` grammar. It is deterministic
and bounded, but the player can see the same staircase, market, works, or traffic
sentence repeatedly with only the enemy roster changing. A seed-42 audit over
1,000 compounds found 254 immediate structural repeats; after sequence 27 the
roster is capped at four stage-9 enemies, so six enemy families disappear from
long runs. The section `speed` argument is currently unused, and the background
stays on the first story scene while Endless advances.

Nine static kit pieces are also absent from Endless by construction: barrier,
spikes, electric rail, train, fire escape, checkpoint, finish, button, and
security gate. Finish is intentionally story-only; the rest should have Endless
roles. The two-button title screen currently hides the old Endless button with
the legacy menu markup, so Endless also needs a reachable mode choice behind
Start (or in the level picker) that works with keyboard, touch, and controller.

Use a seeded **compound deck** instead:

- Author 12–16 compounds, each with an entrance height, signature asset, enemy
  role, optional power, and exit height. Include short, medium, and long
  compounds so the cadence breathes.
- Give the nine currently absent kit pieces explicit compound roles: barrier as
  an early read, spikes and electric rail as separated lethal exams, train and
  fire escape as elevated transfers, and checkpoint/button/security gate as
  progress landmarks. Keep finish reserved for authored story blocks.
- Draw the next compound from a seeded shuffle bag. Do not repeat a signature or
  the same required action three times in a row. After four compounds, guarantee
  a recovery compound with a broad floor runway and optional coins.
- Rotate through the full enemy roster by role bands instead of deriving it only
  from the current story stage. Long runs should revisit every family while
  preserving each actor's authored stomp height and patrol limits.
- Keep every compound self-contained and floor registered. The exit of one
  compound must be a legal entrance for the next, including when the player is
  on an upper deck.
- Spawn with a viewport-aware lookahead: the reveal distance must exceed the
  widest supported visible world span plus the full decision runway. A compound
  must never enter view already inside the runner's reaction window.
- Increase challenge through speed, enemy pairing, and route height choices,
  never through hidden timing. The first two compounds teach; later compounds
  combine two known verbs; the final speed band adds density without removing a
  safe path.
- Link switches to gates by local IDs inside a compound. A preloaded gate from a
  previous compound must never be activated because it happens to be farther
  right than a button. “Cover” in a plan must name a real low-clearance route;
  moving platforms, projectiles, and wait-for-a-cycle behaviors stay out until
  their mechanics are implemented.
- Resolve scene transitions as explicit Endless environment bands instead of
  leaving the renderer on block 1. A band can change background and anchor art
  only at a compound boundary, with a safe runway around the handoff.
- Surface the active compound identity in debug/editor data so a seeded failure
  can be reproduced from a single seed and sequence index.
- Give Endless its own small HUD contract: distance and personal best replace
  the empty story progress bar, and feedback uses direct phrases such as
  “Streak”, “Rush active”, “Shield ready”, and “Shield used”.

Endless acceptance: the same seed produces the same first 20 compounds and
placements; three different seeds produce visibly different signatures; no
compound creates an unavoidable contact or spawns inside the viewport decision
window; history remains bounded; every enemy family and every non-finish kit
piece appears within a 40-compound audit; switch targets remain local; the scene
band changes at least twice; and the player gets a recovery runway at least once
every four compounds.

## Implementation order and checks

1. Add a beat schema and validator beside `makeRoute()`. Validate floor and
   elevated registration, required runways, no same-family adjacency, and a
   reachable exit height.
2. Convert the ten table rows into authored beat data. **Shipped:** the campaign
   now uses 58 named beats with unique sequences, props, enemy pairs, and
   rewards; the generic section grammar remains only as the deterministic
   Endless fallback.
3. Replace the shared finale with ten finale beat lists and move checkpoint,
   button, gate, fire escape, train, lethal strips, and finish markers into
   place-specific contexts. **Shipped:** all ten chapters use distinct finale
   orderings and the moving train remains a swept collider.
4. Build the Endless compound deck and seeded shuffle bag. Add sequence metadata
   to the test snapshot and editor preview.
5. Tune each block in the internal editor, then capture desktop, phone, and
   Deck-sized openings plus one full route per block.
6. Add automated checks for asset coverage, unique signatures, deterministic
   seeds, runway spacing, safe top contacts, enemy stomp opportunities, and the
   campaign driver at both paces.

The pass is ready to ship when all ten blocks have distinct opening, middle, and
finale captures; every existing gameplay asset has a purposeful placement in at
least two different blocks; the route driver clears every block without
teleports or damage suppression; and the Endless checks above pass for fixed
seeds.
