# Adding raster assets

The game separates source art from the compact files shipped to players:

1. Put the approved raster source in the matching folder under
   assets/imagegen/.
2. Add its role and provenance to the nearest manifest or catalog.
3. Reference the source from the relevant shape, route, or renderer code.
4. Run the runtime packer and manifest builder.
5. Check the result in the local game and add a focused regression if its
   footprint or collision behavior matters.

## Common paths

- Characters: assets/imagegen/runner/ and assets/imagegen/chaser/
- Background plates: assets/imagegen/streets-v2/
- Obstacles and platforms: assets/imagegen/obstacles/
- Enemies and props: assets/imagegen/enemies/ and assets/imagegen/props/
- Runtime atlas and manifest: assets/runtime/

The runtime atlas is generated. Do not edit sprites.webp, sprites-low.webp, or
sprites.json by hand. From the repository root:

    python3 tools/pack-runtime-art.py
    node tools/build-runtime-manifest.mjs
    npm run build:app

The packer records source hashes and frame geometry. A new sprite must have a
transparent background, a stable painted-foot or ground registration, and a
world footprint that agrees with game/config.js.

## Checklist

- [ ] Raster PNG or another approved raster source; no generated SVG.
- [ ] Source filename describes the character, prop, or action.
- [ ] Source appears in the appropriate manifest/catalog.
- [ ] Atlas and runtime manifest regenerated.
- [ ] Desktop and narrow viewport checked.
- [ ] Art gate and focused tests pass.
