> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# Sneaker Run animation checklist

This is the release inventory for motion, separate from the GUI artwork. All
non-GUI art in this checklist must remain raster PNG/WebP generated with
ChatGPT Image Gen. The supplied orange-haired Sneakers sheet is the identity
reference; the two separate pursuer sheets retain the same outlined, hand-painted
suit language while keeping each character's frames independent.

## Already present and retained

| Motion state | Runtime asset | Current contract | QA decision |
| --- | --- | --- | --- |
| Main run | `assets/imagegen/runner/run-v6.png` | 8 full-body frames at 8 FPS, right-facing; four right-drive and four left-drive frames | Rebuilt one frame at a time; renderer re-anchors head and shoe baseline so the suit cadence stays calm |
| Jump / double jump | `assets/visual-model/runner/jump.png` | 4 action frames at 6 FPS; both jump types reuse the same authored sheet | Keep gameplay behavior; audit scale and entry/exit poses |
| Roll under beam | `assets/visual-model/runner/roll.png` | 4 action frames at 6 FPS; grounded tuck with no whole-body cartwheel | Keep behavior; audit contact height against gate beam |
| Hold-low crouch | `assets/visual-model/runner/crouch.png` | 4 looping frames at 6 FPS | Keep behavior; audit that the held pose does not pop into run |
| Land recovery | `assets/visual-model/runner/land.png` | 4 one-shot frames during the landing window | Keep behavior; audit shoe plant and final run handoff |
| Hit / stumble | `assets/visual-model/runner/stumble.png` | 4 one-shot frames, fixed readable game-over frame | Keep behavior; audit impact direction and red flash timing |
| Finish celebrate | `assets/visual-model/runner/celebrate.png` | 4 looping frames at 6 FPS | Keep behavior; audit ground anchor and completion overlay |
| Rush burst | `assets/imagegen/runner/run-v6.png` | Reuses the same normalized 8-frame run at 8 FPS; power state changes speed/status, not character identity | Never sample the legacy 8-pose rush strip as a 4-frame sheet |
| Bald pursuer | `assets/imagegen/chaser/run-gray-suit-v1.png` | 8 complete full-body poses; right-facing; visible forward fist; head axis and shared ground baseline | Keep the charcoal suit identity and never slice it with the blue pursuer |
| Blue pursuer | `assets/imagegen/chaser/run-blue-suit-v1.png` | 8 complete full-body poses; right-facing; visible forward fist; head axis and shared ground baseline | Keep the blue suit/tie identity and its independent frame list |
| Pursuer intro | `assets/imagegen/chaser/start-point-*-suit-v1.png` | 6 poses: point, hold, lean, launch, first stride | Play once at block start, then hand off to the run loop |
| Pursuer finish | `assets/imagegen/chaser/out-of-breath-*-suit-v1.png` | 6 grounded breathing poses; hands-on-knees and brow wipe | Loop after Sneakers crosses the finish line |
| Pursuer jump | `assets/imagegen/chaser/jump-*-suit-v1.png` | 4 poses: takeoff, rise, apex, descent | Select from the same vertical velocity thresholds as Sneakers |
| Pursuer roll | `assets/imagegen/chaser/roll-*-suit-v1.png` | 4 low poses: tuck, curl, roll, uncurl | Select from the same roll action clock as Sneakers |
| Rival encounter | Separate bald and blue sheets, selected by actor | Each actor samples its own eight-pose list; no mixed cells or duplicate runner strip | Preserve spacing behind Sneakers and keep both actors grounded |
| Pickups | `assets/visual-model/props/*.png` | 2-frame object pulse at 2 FPS | Keep behavior; audit consistent center anchors |
| Particles | `assets/visual-model/vfx/*.png` | 2-frame bursts at 2 FPS, lifetime-driven | Keep behavior; audit spawn point and reduced-motion fallback |

## Required motion states and release gaps

| State or transition | Current status | Required task |
| --- | --- | --- |
| Ready / idle | Static `otoole-static.png` fallback and intro overlay | Add a deterministic idle/anticipation pose only if the ready screen still feels frozen after the run pass |
| Run loop | Fixed in v6 | Frame-scrub all 8 poses: legs alternate, each arm owns four frames, transition poses sit between contact poses, and neither forearm fuses with the face or other arm |
| Run ↔ jump | Reuses action frame mapping | Capture takeoff, apex, and descent; ensure the planted shoe does not slide into the first airborne frame |
| Jump ↔ double jump | Same sheet and physics | Confirm the second jump does not restart at an impossible crouch or teleport the torso |
| Run ↔ roll | One-shot roll plus small lean | Confirm bottom anchor, beam clearance, and return to run without a scale pop |
| Run ↔ crouch | Held 4-frame loop | Confirm crouch keeps the same forward direction and does not use a taller run frame |
| Land ↔ run | One-shot landing sheet | Confirm last landing frame can hand back to v6 without a head or shoe jump |
| Hit / shield break | Stumble sheet plus impact VFX | Confirm impact originates at the player, not the obstacle, and that shield break has distinct cyan feedback |
| Rush start / end | Rush sheet replaces run while power is active | Confirm the swap keeps Sneakers' size and baseline and does not reset the run phase visibly |
| Finish / game over | Celebrate or fixed stumble frame | Capture both full states with overlays and navigation controls |
| Rival / chaser depth | Separate authored layers | Confirm rival is a left-facing encounter target, suit is the left pursuer, and neither can cover the player unfairly |
| Object / VFX timing | Generic 2-FPS frame helper | Ensure every two-frame asset is centered, does not flicker at reduced motion, and never exposes a transparent padding jump |

## Regression gates

- Every required sheet is a loaded raster asset; no AI-generated SVG is allowed.
- Every frame has non-empty alpha bounds and a measured intended anchor.
- The main runner has exactly 8 square gameplay frames at 8 FPS.
- The player box stays stable through run, jump, roll, crouch, land, hit, rush,
  celebrate, and game-over states.
- The active pursuit screenshot shows the bald and blue sheets as separate
  actors; each stays left of the player, keeps its own frame sequence and
  remains grounded to the same floor line.
- Desktop, tall desktop, phone, short phone, and touch-landscape screenshots
  have no crop, overlap, or horizontal overflow.
