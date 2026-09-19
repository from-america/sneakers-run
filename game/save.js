import { LEVELS } from './routes.js?v=11';
export const SAVE_KEY = 'sneakers-run-v2';
export const BLOCK_BADGES = Object.freeze([
  { id: 'exit', label: 'EXIT', target: 'Clear the block' },
  { id: 'coins', label: 'POCKET', target: 'Collect 40 coins' },
  { id: 'clean', label: 'CLEAN', target: 'Finish without a hit' },
  { id: 'flow', label: 'FLOW', target: 'Reach a 5-escape streak' },
]);
const integer = (v, max = 99999999) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
const badges = (source, fallback = []) => BLOCK_BADGES.map((_, i) => source?.[i] === true || fallback?.[i] === true);
const badgesFor = game => [game.phase === 'cleared', game.coins >= 40, game.phase === 'cleared' && game.hits === 0, game.bestStreak >= 5];
const defaults = () => ({ version: 2, unlocked: 0, records: {}, endless: {}, lastRun: null, settings: { difficulty: 'standard',
  music: .28, effects: .65, muted: false, cues: true, reducedMotion: false, contrast: false, jumpKey: 'Space', rollKey: 'ArrowDown' } });
const levelKey = game => `${game.difficulty}:${game.stage}`;
const validKey = key => /^(Space|ArrowUp|ArrowDown|Key[A-Z]|Digit[0-9])$/.test(key || '');
export function validBinding(action, key, other) {
  return validKey(key) && !['KeyP','KeyR'].includes(key) && key !== other &&
    !(action==='jumpKey' ? ['ArrowDown','KeyS'] : ['ArrowUp','KeyW']).includes(key);
}
export function readSave(storage) {
  const save = defaults();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      const previous = JSON.parse(storage.getItem('sneakers-run-city-v1') || 'null');
      if (previous) save.unlocked = integer(previous.unlocked, LEVELS.length - 1);
      return save;
    }
    const parsed = JSON.parse(raw);
    if (parsed.version !== 2) return save;
    save.unlocked = integer(parsed.unlocked, LEVELS.length - 1);
    for (const difficulty of ['standard', 'relaxed']) {
      for (let stage = 0; stage < LEVELS.length; stage++) {
        const key = `${difficulty}:${stage}`, r = parsed.records?.[key];
        if (r && typeof r === 'object') save.records[key] = { score: integer(r.score), coins: integer(r.coins),
          stars: [0, 1, 2].map(i => r.stars?.[i] === true), badges: badges(r.badges, r.stars),
          bestStreak: integer(r.bestStreak), attempts: integer(r.attempts) };
      }
      const r = parsed.endless?.[difficulty];
      if (r) save.endless[difficulty] = { score: integer(r.score), meters: integer(r.meters),
        bestStreak: integer(r.bestStreak), attempts: integer(r.attempts) };
    }
    const run = parsed.lastRun;
    if (run && typeof run === 'object' && ['story', 'endless'].includes(run.mode) && ['standard', 'relaxed'].includes(run.difficulty)) {
      save.lastRun = { mode: run.mode, difficulty: run.difficulty, stage: integer(run.stage, LEVELS.length - 1),
        phase: run.phase === 'cleared' ? 'cleared' : 'gameover', score: integer(run.score), coins: integer(run.coins),
        bestStreak: integer(run.bestStreak), previousBestScore: integer(run.previousBestScore),
        previousBestStreak: integer(run.previousBestStreak), isNewBest: run.isNewBest === true,
        badges: run.mode === 'story' ? badges(run.badges) : [] };
    }
    const s = parsed.settings || {};
    save.settings.difficulty = s.difficulty === 'relaxed' ? 'relaxed' : 'standard';
    for (const k of ['music', 'effects']) if (typeof s[k] === 'number' && Number.isFinite(s[k])) save.settings[k] = Math.min(1, Math.max(0, s[k]));
    for (const k of ['muted', 'cues', 'reducedMotion', 'contrast']) if (typeof s[k] === 'boolean') save.settings[k] = s[k];
    for (const k of ['jumpKey', 'rollKey']) if (validBinding(k,s[k],s[k==='jumpKey'?'rollKey':'jumpKey'])) save.settings[k] = s[k];
    if (save.settings.jumpKey === save.settings.rollKey) { save.settings.jumpKey = 'Space'; save.settings.rollKey = 'ArrowDown'; }
    return save;
  } catch { return save; }
}
export function writeSave(storage, save) { try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; } }
export function recordResult(save, game) {
  if (!['cleared', 'gameover'].includes(game.phase)) return save;
  const next = structuredClone(save);
  if (game.mode === 'endless') {
    const previous = next.endless[game.difficulty] || { score: 0, meters: 0, bestStreak: 0, attempts: 0 };
    const meters = Math.floor(game.world / 10);
    next.endless[game.difficulty] = { score: Math.max(previous.score, game.score), meters: Math.max(previous.meters, meters),
      bestStreak: Math.max(previous.bestStreak || 0, game.bestStreak), attempts: (previous.attempts || 0) + 1 };
    next.lastRun = { mode: 'endless', difficulty: game.difficulty, stage: game.stage, phase: game.phase, score: game.score,
      coins: game.coins, bestStreak: game.bestStreak, previousBestScore: previous.score, previousBestStreak: previous.bestStreak || 0,
      isNewBest: game.score > previous.score || meters > previous.meters, badges: [] };
  } else {
    const key = levelKey(game), previous = next.records[key] || { score: 0, coins: 0, stars: [false, false, false], badges: [false, false, false, false], bestStreak: 0, attempts: 0 };
    const currentBadges = badgesFor(game);
    next.records[key] = { score: Math.max(previous.score, game.score), coins: Math.max(previous.coins, game.coins),
      stars: game.stars().map((star, i) => star || previous.stars[i]),
      badges: currentBadges.map((badge, i) => badge || previous.badges?.[i] === true),
      bestStreak: Math.max(previous.bestStreak || 0, game.bestStreak), attempts: (previous.attempts || 0) + 1 };
    next.lastRun = { mode: 'story', difficulty: game.difficulty, stage: game.stage, phase: game.phase, score: game.score,
      coins: game.coins, bestStreak: game.bestStreak, previousBestScore: previous.score, previousBestStreak: previous.bestStreak || 0,
      isNewBest: game.score > previous.score, badges: currentBadges };
    if (game.phase === 'cleared') next.unlocked = Math.max(next.unlocked, Math.min(LEVELS.length - 1, game.stage + 1));
  }
  return next;
}
