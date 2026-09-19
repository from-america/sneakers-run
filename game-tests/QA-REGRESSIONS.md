# Sneakers Run QA regressions

These checks protect player-visible guarantees that are easy to lose when route
geometry, movement physics, or the game shell changes:

- authored beat openings keep a full reaction window without overlapping solid
  colliders;
- a train encounter is one-way and safe for a runner riding its roof;
- touch controls remain named, keyboard-reachable, and large enough to activate;
- standard-controller pause/disconnect behavior returns focus to an accessible
  menu action;
- the coin favicon retains a static fallback and a two-state animation path.

Run the focused checks from the repository root:

```sh
node --test game-tests/qa-regressions.test.mjs
npx playwright test --config=game-tests/playwright.config.mjs game-tests/qa-accessibility.spec.mjs
```

The train and favicon checks are intentionally allowed to fail before their
corresponding gameplay and shell integration lands. A failure there is a
release-blocking integration finding, not permission to weaken the assertion.
