# Sneakers Run build and review tools

- `pack-runtime-art.py`: lossless atlas packing and uniform resampling of the
  existing ChatGPT Image Gen rasters. Requires Pillow. Does not repaint sources.
- `check-rebuild-review.mjs`: validates source provenance, runtime frame geometry,
  and the explicitly recorded visual review against current file fingerprints.
- `build.mjs`: copies only the active game, fonts, music, and runtime atlas/plates
  into `dist/web`, with a SHA-256 build manifest.
- `package-desktop.mjs`: packages that offline build with Electron for the current
  OS, or `--platform=win32 --arch=x64` / `--platform=linux --arch=x64`.
- `measure-art.py`: retained source-catalog measurement utility.

The former metadata-only route validator and pattern editor were retired with
the old engine. Route correctness is now exercised against live physics in
`game-tests/simulation.test.mjs`, with collision and damage enabled.
