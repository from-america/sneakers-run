# Contributing to Sneakers Run

Thanks for helping build the runner. Keep changes small, playable, and easy to
review.

## Start here

1. Install Node.js 22.12 or newer.
2. Run npm ci.
3. Start the game with npm run dev and open http://localhost:4188/.
4. Use npm run check before opening a pull request.

For browser coverage, install Chromium with npx playwright install chromium.
The full CI workflow installs it automatically.

## Where things live

| Area | Directory | Use |
| --- | --- | --- |
| Game shell and renderer | game/ | Runtime code and UI |
| Authored routes | game/routes.js | Blocks, beats, obstacles, platforms |
| Source rasters | assets/imagegen/ | Approved artwork and source sheets |
| Packed runtime art | assets/runtime/ | Generated delivery files; rebuild, do not hand-edit |
| Asset tooling | tools/ | Packing, manifest, and build scripts |
| Simulation tests | game-tests/*.test.mjs | Physics and route guarantees |
| Browser tests | game-tests/*.spec.mjs | Layout, input, and playable flows |

Read [Adding raster assets](docs/ADDING-ASSETS.md) and [Adding levels](docs/ADDING-LEVELS.md)
before changing content.

## Content rules

- Keep in-game artwork raster. Do not add generated SVG artwork.
- Preserve the approved runner and suit/chaser designs.
- Keep collision boxes and painted feet registered to the authored world grid.
- Add or update a focused test when a change affects physics, routes, or controls.
- Do not put API keys, Cloudflare tokens, private-site code, or generated secrets
  in commits.

## Pull requests

Describe the player-visible result, list the checks you ran, and include a
short screen recording or screenshots for visual changes. A pull request must
leave the game runnable from a clean checkout and must not modify the private
Famous Moji website repository.

The main branch is protected by the CI workflow. Production deployment runs
only after the checks pass and uses the protected GitHub production
environment.
