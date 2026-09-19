# Sneaker Run Level Design Bible

Every level should read as a place first and an obstacle course second. The player must be able to understand the safe route at running speed without guessing which painted object has collision.

## Collision truth

- The level has two tracks. The foreground track is the playable lane and contains only solid gameplay pieces, pickups, and grounded enemies. The background track is a separate visual lane behind it.
- A solid object must look load-bearing. Elevated platforms use visible supports and expose a clean top edge.
- Fruit stands, loose crates, lamps, signs, parked vehicles, and other street dressing stay in the background layer and have no collision. A prop may overlap a gameplay x-range only after it has been assigned to the background track.
- Ground enemies stand on the street line. Elevated enemies stand exactly on a real platform top; unsupported actors are moved to the street.
- A skateboard rival may start on a supported ledge and jump down when the player approaches.
- Never hide a collider inside scenery or let scenery look like a usable platform.
- The top face of every authored platform or fire escape must stay at or below 350 world units. This leaves a small margin below the measured double-jump peak and keeps the landing reachable without changing physics.

## Readable beats

- Build one readable action, one decision, then a recovery space. Do not pile unrelated tests into one footprint.
- Keep simultaneous threats to two or fewer. Use coins to preview the intended jump arc and upper route.
- Separate a duck beam from an elevated landing. Never put a low gate directly under a platform; the silhouettes merge into a fake wall.
- Leave a clean approach before a required jump and a clean landing after it.
- Repeat a chapter's visual language, but vary spacing, height, and route choice so the song-length run develops instead of copy-pasting a screen.

## Scenery and motion

- Decorative objects and selected fly-by enemies render on the background track before supports, platforms, enemies, pickups, and hazards. They use the shared 72% background alpha, with enough contrast to remain part of the setting rather than looking like ghosts.
- Street landmarks use the shared 1.5×, 2×, and 3× background-track speeds, anchored 400 world units ahead so each passes that focal point near its authored encounter. Never add duplicate copies or time-based wrap offsets. Visual-only background actors never become floors, hazards, stomp targets, or pickup routes.
- The scene plate is an independent, repeating backdrop at 2.1× world travel. Preserve its aspect ratio and cover the entire viewport; never use it to place gameplay geometry.
- Background tracks use the shared `BACKGROUND_TRACKS` contract: 50%, 65%, and 80% scale, with a shared 168 world-unit lift. Each background item's authored Y is clamped above the greater of the 168-unit gameplay lane and the active plate profile's painted rear edge; tall landmarks may scale down to remain inside the viewport. The editor uses the same scale, vertical clearance, and layer order while showing static authored X coordinates for legible placement.
- Keep the background selective: no more than three unscripted background pieces in a 2400-unit compound. A finale crowd may use a composed group when it is intentionally staged across the finish approach.
- The complete background plate tiles without mirroring. Buildings and road move as one image; no reversed landmarks or static city with a sliding road strip.
- Keep foreground solids out of the background silhouette, and keep background landmarks out of jump takeoff, landing, and recovery reads. Use one strong landmark per compound, with additional motion only when it explains the setting.

## Chapter timing

- At normal pace, the finish line lands at 80% of the assigned song duration, leaving the final 20% as a recovery margin for stomp bounce feedback. Music plays once from the start of the run.
- Speed pickups provide a mild 7% forward boost for 4.5 seconds and also grant their shield and magnet benefits. They should feel like momentum, never like a compressed obstacle exam. Pausing pauses the track.
- Fill long chapters by cycling the full authored beat deck. Preserve reaction windows and recovery spacing on every cycle.

## Finales

- A finale follows: checkpoint, place-specific traversal, boss encounter, recovery, finish.
- Use hazards and landmarks from that chapter's setting. A pier, rooftop, subway, market, and factory should never end with the same exam.
- Do not stack a gate, train, spikes, and electricity as a generic ending. Avoid any four-object pile that asks for unrelated actions without recovery.
- Give the boss a clear arena and at least 90 world units of recovery before the next solid object.

## Placement audit

For every chapter and difficulty:

1. Trace the street route and every upper route from left to right.
2. Confirm every enemy touches the street or an exact platform top.
3. Confirm every elevated platform has visible supports.
4. Confirm every platform top is at or below 350 world units and can be reached by a double jump.
5. Confirm decorative objects and selected fly-by enemies have no solids, carry the background flag, and sit behind gameplay.
6. Check that low gates do not share horizontal space with platforms.
7. Check each jump approach, landing, and recovery at running speed.
8. Check the foreground lane has no decorative assets and the background density stays within its budget.
9. Check the finale uses its chapter vocabulary and contains no generic hazard pile.
10. Confirm the finish distance matches 80% of the song duration at that route's base speed.
11. Inspect the opening, representative middle beats, and finale in the editor.
12. Play the opening and at least one complete route after structural changes.
