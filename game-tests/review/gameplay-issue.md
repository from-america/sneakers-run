# Gameplay issue 01: the first route loses its safe-lane read

The first block is readable in the opening frame, but the read collapses as the
first elevated compound arrives. In the mid and late frames, the upper decks,
their support legs, the ground barrier/cart, the large waterfront marker, and
the next enemy all share one short reaction window. The phone frame makes the
problem clearest: the foreground marker visually sits on top of the playable
lane, so the runner and suit chasers are partially lost behind it while the
player is already resolving the previous hazard.

This is a gameplay readability issue, not a control or chaser issue. The route
needs a recovery runway between a high-route commitment and the next ground
threat, and decorative landmarks must not compete with collision silhouettes.

Evidence captured from the live build with seed 42:

- [Opening](gameplay-issue/opening.png) — the starting high route is legible.
- [Mid](gameplay-issue/mid.png) — the first ground hit and the next elevated
  choice occupy the same view.
- [Late](gameplay-issue/late.png) — the following low obstacle, moving cart,
  enemy, and power pickups are simultaneously competing for the same lane.
- [Phone mid](gameplay-issue/phone-mid.png) — the marker occludes the runner
  and chasers at the smaller viewport.

Fix target for the next route pass: keep the same controls and chase behavior,
but separate the landmark from the active lane, preserve a clean recovery
runway after each elevated transfer, and verify that authored solids do not
overlap.
