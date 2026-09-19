# Looping street raster sheets

Each sheet is an original ChatGPT Image Gen raster with eight equal cells at
4 FPS. The runtime packer alpha-crops every cell, registers a shared ground
baseline, and records the visible footprint in `assets/runtime/sprites.json`.
The ten loops are decorative world dressing: they animate in place and have no
solid collider, so they add life without hiding a gameplay hitbox.
