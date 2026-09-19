# Sneaker Run visual-model art

These atlases restore the high-detail pixel arcade direction from the
pre-turnaround runner and suit art. The player source is Sneakers O'Toole: the
orange-haired, freckled runner in the pale blue shirt, dark baggy jeans, and
white sneakers. The source sheets are kept in `source/` and the browser uses
the packed strips in `runner/`, `chaser/`, `props/`, and `vfx/`.

`runner-otoole-source-board.png` is the canonical identity board for future
art passes. It keeps the face, orange hair, freckles, wardrobe, proportions,
and sneaker design stable across new generated poses.

`runner-otoole-run-8.png` is the runtime's eight-frame run cycle. Its middle
poses deliberately include alternating front-leg crossover so the stride reads
as a run rather than a four-pose march.

`runner-otoole-actions.png` contains the grounded run, jump, and recovery
poses. `runner-otoole-roll-crouch.png` contains the roll and low-profile
poses. Both sheets copy the source character traits while using the game's
hand-pixeled arcade treatment rather than the source drawing style.

The runner and pursuer use 8 FPS gameplay animation. Props and effects use
two authored frames at 2 FPS, with world motion and particle physics staying
continuous between those frames.

Repack after an art pass from the repository root:

```sh
python3 assets/visual-model/pack_visual_model_assets.py
```

The source atlases were visually checked for transparent backgrounds, stable
silhouettes, consistent wardrobe, and readable action poses before they were
connected to the game.
