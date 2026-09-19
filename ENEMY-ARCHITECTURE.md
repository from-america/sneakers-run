> **Historical document — superseded by the September 16 version 2 rebuild.**
> This describes earlier implementations or proposals. See [README](README.md) and
> [the current audit](FULL-GAME-AUDIT.md) for shipped behavior and verification.

# Sneaker Run enemy architecture

This is the manager-facing contract for the approved enemy rollout. It is
data-only by design: runtime integration belongs to the manager's gameplay
workstream, while this file defines the roles, readable state transitions,
collision profiles, asset provenance gate, and encounter budgets that runtime
code must consume.

## Canon boundary

The source-confirmed roster contains exactly two unnamed business men:

- `business-man-1` / Business Man #1 — direct shoe-taker.
- `business-man-2` / Business Man #2 — slower pressure chaser.

Their game behaviors and all of their animation beats are original Famous Moji
game extensions. The following are original extensions, not source canon:

`shoe-box-courier`, `parking-attendant`, `raincoat-snatcher`,
`skateboard-rival`, `bike-messenger`, `pigeon-flock`, `construction-roller`,
and `camera-flash-chaser`.

The current `rival` entity is a legacy runtime extension that mirrors the
approved Sneakers run strip. It is not a third source-confirmed role. The
existing suit/chaser assets remain a separate approved reference and must not
be redesigned or reused as one of these enemy identities.

## Data contract

`enemy-architecture.js` exports `ENEMY_SPECS`, one immutable record per new
enemy. Each record includes:

- `canonStatus` and `canonNote`, so a new concept cannot silently become canon;
- one primary `role` plus role tags from `pursuer`, `blocker`, `sweeper`, and
  `lane-switcher`;
- a behavior record with a telegraph, primary counter-move, pressure shape,
  and intended encounter use;
- `states.entry` ending in the collidable `active` state;
- `states.exit` with non-collidable `clear`, `hit`, `missed`, and `despawn`
  states, so enemies never pop out of the route or leave a shadow behind;
- a normalized painted-silhouette collision profile with a shoe-baseline
  anchor, damage, surface, and safe counter-moves;
- an `assetKey` that resolves to the raster approval manifest.

The state machine is deliberately renderer-neutral. Runtime code may choose
the actual frame names, but it must keep entry and exit collision flags and the
counter-move semantics intact.

## Encounter budgets

`ENCOUNTER_BUDGETS.standard` is the default manager integration gate:

- no more than two visible enemy entities;
- no more than two overlapping silhouettes in one readable window;
- no more than one simultaneous telegraph;
- at least 190 px between non-overlapping enemy centers;
- the standard window may contain at most one enemy tagged with each role;
- every enemy must expose a readable counter-move.

`businessDuo` is the only approved special budget in this handoff. It allows
Business Man #1 and #2 together, with the same two-silhouette cap and one
telegraph at a time, and raises the pursuer-role limit to two. Any future
exception that needs more than two silhouettes must be explicitly added as a
named budget and reviewed by the manager; a route must not bypass the
validator with an ad hoc flag.

`validateEnemyEncounter()` accepts `{ enemies, budget }`, where each enemy is
`{ id, x, width, telegraphing? }`. The validator checks roster membership,
visible count, horizontal overlap, spacing, telegraph concurrency, allowed duo
membership, and the existence of a counter-move.

## Asset handoff

`assets/imagegen/enemy-asset-manifest.json` is an approval gate. All new
entries are now `generated-raster` after the art pipeline generated transparent
raster PNGs; runtime and visual QA still own the final release gate. No SVG may
be generated, requested, or wired into the game for these enemies.

Each generated enemy sheet must be checked against the manifest, at minimum:

1. transparent raster output and stable painted bounds;
2. grounded shoe or prop baseline where applicable;
3. clear distinction from Sneakers and the existing suit/chaser;
4. readable role telegraph at 320x568, 390x844, 844x390, 1280x720, and
   1440x900;
5. original adult-animated suburban-comedy sensibility without copied named-
   show characters, locations, props, wardrobe, logos, catchphrases, or exact
   compositions.

The manager may wire an asset path into `main.js` only while the manifest entry
is `generated-raster` and the art/QA worker has recorded evidence.

## Integration order

1. Generate and approve the raster sheets using the manifest briefs.
2. Import `ENEMY_SPECS` into the manager-owned runtime adapter.
3. Map runtime entity states to `states.entry` and `states.exit`.
4. Convert normalized collision profiles into the existing gameplay hitbox
   representation without changing the player hitbox contract.
5. Author encounters using `validateEnemyEncounter()` before adding them to
   level routes.
6. Add browser screenshots for one canonical enemy, the business duo, and at
   least two original extensions across the supported viewport matrix.

This worker intentionally does not edit `main.js`, `gameplay-core.js`, or
`world-spec.js`; the manager owns those integration points.
