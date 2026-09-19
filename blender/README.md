# Sneaker Run 3D asset pipeline

The checked-in `.blend` file is the source of truth for both runners, the chaser, and four environments. Each character has a named armature and separate Blender Action clips for running, rolling, crouching, and jumping. Frames are keyed and rendered at 4 FPS with a locked orthographic camera. Each environment is split into far, middle, and near collections so the game can scroll them at different speeds.

```sh
blender --background --python blender/build_assets.py
python3 blender/pixelize.py
python3 blender/build_background_layers.py
```

The first command writes transparent raw PNG renders to `assets/3d-raw/`. The second downsamples every render to a shared pixel grid, reduces its palette, restores hard alpha edges, and scales with nearest-neighbor sampling. Game-ready spritesheets and scenery layers are written to `assets/pixel/`.
