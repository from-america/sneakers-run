# Runtime asset contract

The workshop and the playable route use one authored footprint per element. A
shape declares its world width, height, solid boxes, and walkable top faces in
`game/config.js`. The renderer draws the same origin and the simulator consumes
the same geometry, so an art placement cannot create a second invisible
collision shape.

## Supports and scene profiles

Elevated `platform` and `fireEscape` elements are assembled from repeated
150-unit support modules. The final module is clipped to the authored height;
supports are never stretched, which keeps bolts, feet, and perspective scale
consistent. New support art should be added as a raster frame with a stable
pivot and a module height that can repeat cleanly.

Each chapter has one raster scene plate. It is a backdrop behind the fixed-floor
gameplay camera, while landmarks use the shared background-depth contract in
`game/depth.js`. That contract supplies their scale, opacity, and minimum lane
clearance to both the game and editor. The active scene profile's painted rear
edge can increase that clearance for a portrait crop. Background artwork has no
collision and cannot redefine the floor line, top faces, or pickup bounds. The
scene plate travels at 2.1× world speed; landmark tracks travel at 1.5×, 2×, and
3× around a 400-world-unit focal anchor so their authored encounter stays
readable. The editor shares the vertical and layer contract but keeps landmarks
at static authored X positions while a route is being arranged.

## Static kit pieces

`assets/runtime/urban-hazard-kit-v1.png` is a reviewed raster sheet with stable
source rectangles in `URBAN_KIT`. It contains construction spikes, an
electrified rail, a train obstacle, a checkpoint beacon, a finish marker, a
floor button, and a security gate. These pieces are deliberately static:

- spikes and the rail are lethal jump hazards;
- the train has a safe, walkable top and can be cleared with a jump;
- the button opens security gates to its right after contact;
- checkpoint and finish markers are sensors, never invisible walls.

The kit hitboxes follow the painted contact lines. Every crop is registered to
the same floor anchor even though the sheet has transparent room beneath the
art: spikes `-6`, electric rail `-4`, finish `-16`, checkpoint `-16`, button
`-20`, gate `-31`, and train `-41` world units. After registration, the train's
single body box ends at its painted roof (`y=245`) while its decorative wheels
remain non-solid; the gate's warning beam is the walkable top (`y=241`). The
button is a trigger with no blocking solid, and checkpoint, finish, and button
triggers are bounded to their visible regions. Red overlay rectangles are
solids, green lines are walkable tops, purple dashed rectangles are triggers,
and blue rectangles are pickup collection bounds.

The route gives every set-piece a readable runway. Any moving element is
telegraphed and solved through the runner's jump or cover posture because the
game scrolls continuously.

Cars and trucks share a deterministic engine pulse made from the existing
raster spark frames. The effect is cosmetic, disabled with reduced motion, and
phase-shifted by world position so a row of vehicles does not flash in unison.

## Editor checklist

When adding a new asset, add its shape and colliders first, then register its
raster source or kit rectangle. Add it to the palette group, place one safe
example in a route, and add a contact test for every authored top. Keep the
editor's hitbox overlay enabled while checking that the visible footprint and
the solid boxes agree at floor and elevated placements.
