# Sneakers Run

[![CI](https://github.com/from-america/sneakers-run/actions/workflows/ci.yml/badge.svg)](https://github.com/from-america/sneakers-run/actions/workflows/ci.yml)

A compact city runner with ten authored blocks, an endless chase, three replay goals per block, and the original Famous Moji raster artwork. Version 3 adds connected upper routes, patrolling enemies you can stomp, safe obstacle tops, rotating coins, and an individually authored full-character run cycle. Story missions use a reproducible seed: each beat chooses from three curated layouts with reaction space, a readable high/low option, a recovery runway, and grounded animated dressing, so retries vary without becoming arbitrary.

This is the open-source game repository. The Famous Moji website and its shop
remain in the private from-america/famous.moji repository.

## Play

From this directory, with Node.js 22.12 or newer:

```sh
npm ci
npm run dev
```

Open `http://localhost:4188/`. To launch the native desktop app, run `npm run desktop`.

The unlinked internal level workshop is available during local development at
`http://localhost:4188/editor.html`. It can load any
shipping block, drag every obstacle, enemy, platform, and pickup on the shared
world grid, edit enemy patrols, inspect collision faces, undo changes, save a
browser-local draft, and import or export route JSON. The workshop is excluded
from web and desktop builds until edited routes are ready for production use.
Use **Asset playground** to load all 100 approved builder ideas into a long,
spaced test route. Search by gameplay purpose, drag any item into view, and
inspect its shared raster family, footprint, environment profile, and primary
verb before promoting it into a shipping route. The catalog is maintained in
[builder-catalog.js](game/builder-catalog.js).

| Action | Keyboard | Standard controller | Touch |
| --- | --- | --- | --- |
| Jump / double jump | Space, W, Up | A / bottom face button, D-pad up | JUMP |
| Roll / air drop | Down, S | B / right face button, D-pad down | ROLL |
| Pause / back | Escape, P | Start / B in menus | Pause / Back |
| Choose / confirm | Tab or arrows, Enter | D-pad or stick, A | Tap |
| Retry from menus | R | X / left face button | Run again |
| Fullscreen | F11, Alt+Enter | Fullscreen menu control | Fullscreen control |

Tap roll for a complete roll; hold to stay low. A press in the air drops toward the ground and buffers a roll. Jump and roll keys are rebindable. Standard pace has three chances. Relaxed pace slows both travel and movement by 20% and gives five chances, with separate records. Optional move prompts, reduced effects, high-contrast HUD, mute and separate sound/music volumes are in Settings.

Land on nonlethal obstacle tops to use them as platforms. Construction spikes and
the electrified rail are clearly marked lethal surfaces; the stationary train,
fire escape, and security gate provide safe elevated routes. Step on the floor
button to open its downstream gate. Landing on an enemy defeats it and bounces
you upward; side contact still hurts. Ground and elevated paths reconnect
throughout each block.

Each block awards goals for finishing, collecting 40 coins, and taking no hits. Finishing unlocks the next block. Endless gradually reaches the final block's speed and saves best score and distance separately for each pace. Shield absorbs one collision; magnet attracts nearby coins for eight seconds. Rush gives six seconds of faster travel with a shield and magnet. The suit behind the runner visually represents remaining chances; it is not a second collidable character. Losing all chances ends the chase.

## Build and verify

```sh
npm test                  # raster review gate, simulation and browser checks
npm run test:desktop      # launches Electron; needs a graphical desktop
npm run build             # self-contained website in dist/web
npm run package           # native package for this computer
npm run package:linux     # Linux x64 package
npm run package:windows   # Windows x64 package
```

The shortest contributor check is npm run check. The full CI path installs
Chromium, runs the raster/art gate, unit tests, browser tests, and builds the
Cloudflare Pages artifact.

For browser tests, install Chromium once with `npx playwright install chromium` if Google Chrome is not installed. `node game-tests/route-capture.mjs` captures actual multilevel play; `python3 tools/capture-animation.py` renders all run frames and the loop from the shipping atlas. `npm run capture` expects a repository HTTP server on port 4197 and writes reference images. It does not approve or update the review record. `game-tests/review.json` binds an explicit local review to exact source, artwork, fonts and runtime files.

The production website uses no remote fonts, CDNs or network services. Original image sources are retained but excluded from the distributable. Runtime art totals about 8.5 MiB. Build manifests include SHA-256 checksums. `dist/` and local test results are ignored by Git; reviewed captures are committed.

## Play through Steam

The packages are standalone applications suitable for Steam's **Add a Non-Steam Game** flow. Select the executable for the target OS:

| Target | Package executable |
| --- | --- |
| macOS Apple Silicon | `dist/desktop/Sneakers Run-darwin-arm64/Sneakers Run.app` |
| Windows x64 | `dist/desktop/Sneakers Run-win32-x64/sneakers-run.exe` |
| Linux x64 / Steam Deck desktop mode | `dist/desktop/Sneakers Run-linux-x64/sneakers-run` |

Use Steam Input's **Gamepad** template. Optional launch argument `--fullscreen` starts directly in fullscreen. Controller navigation covers starting, block selection, settings, pause, results, replay and quitting. The UI is checked at 1280×800 and 1280×720, alongside phone and ultrawide sizes.

Desktop saves use Electron's user-data directory, in `progress.json`, with atomic replacement and a queue drained before exit. Browser saves use local storage. `SNEAKERS_RUN_USER_DATA` overrides the desktop save directory for testing. Browser and desktop progress are separate; previous browser block unlocks migrate automatically.

This is **not a Steam store release or Deck Verified certification**. The Mac application was executed locally; Windows and Linux packages were built, not executed on their target hardware. Before public distribution, test the physical Deck/controller and target OS builds, sign/notarize the Mac app, and configure Steamworks launch options, depots, store assets and any Cloud saves. No Steamworks SDK, achievements, overlay integration or Cloud save setup is claimed. See [Valve's compatibility requirements](https://partner.steamgames.com/doc/steamhardware/compat) and [Electron distribution guidance](https://www.electronjs.org/docs/latest/tutorial/distribution-overview).

## Design and audit

- [Current performance and placement audit](PERFORMANCE-PLACEMENT-AUDIT.md)
- [Earlier engine critique and verification evidence](FULL-GAME-AUDIT.md)
- [Visual design contract](DESIGN.md)
- [Artwork provenance and placement](ART-DIRECTION.md)
- [Runtime asset and scene contract](RUNTIME-ASSET-CONTRACT.md)
- [100-entry builder catalog](BUILDER-CATALOG.md)
- [Level design current → improved plan](LEVEL-DESIGN-PLAN.md)
- [Human playtest checklist](PLAYTEST.md)
- [Current build tools](tools/README.md)

The runtime lives only in game/. desktop/ is a narrow sandboxed host; game-tests/
tests the shipping implementation. Former engines, remapping layers and obsolete
tests were removed. Historical planning documents and screenshots are marked as
archival.

## Add content

- [Adding raster assets](docs/ADDING-ASSETS.md) explains the source → manifest → runtime path.
- [Adding levels](docs/ADDING-LEVELS.md) covers scene art, route beats, platforms, and test fixtures.
- [Contributing](CONTRIBUTING.md) explains the review and pull-request workflow.

All in-game artwork stays raster. Do not add generated SVG artwork to the game.

## Deployment

Every push to main runs the checks and, after they pass, deploys dist/web/ to
the sneakers-run Cloudflare Pages project. Production credentials are GitHub
Environment secrets only; they are never stored in this repository. See
[SECURITY.md](SECURITY.md) for the required Cloudflare token scope.
