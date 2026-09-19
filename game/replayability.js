(() => {
  const SAVE_KEY = 'sneakers-run-v2';
  const BADGES = [
    ['EXIT', 'Clear the block'],
    ['POCKET', 'Collect 40 coins'],
    ['CLEAN', 'Finish without a hit'],
    ['FLOW', 'Reach a 5-escape streak'],
  ];
  const $ = id => document.getElementById(id);

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'game/replayability.css?v=6';
  document.head.append(stylesheet);

  function readSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
  }
  function score(value) { return Number.isFinite(value) ? Math.max(0, Math.floor(value)).toLocaleString() : '0'; }
  function currentBadges(run) { return Array.isArray(run?.badges) ? BADGES.map((_, i) => run.badges[i] === true) : BADGES.map(() => false); }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderResult() {
    const panel = $('resultPanel'), data = readSave(), run = data?.lastRun;
    if (!panel || panel.hidden || !run) return;
    const record = run.mode === 'story' ? data.records?.[`${run.difficulty}:${run.stage}`] : data.endless?.[run.difficulty];
    const goals = currentBadges(run);
    const key = JSON.stringify({ run, record });
    let meta = $('replayMeta');
    if (!meta) {
      meta = node('section', 'replay-meta');
      meta.id = 'replayMeta';
      meta.setAttribute('aria-label', 'Replay objectives and best run');
      panel.append(meta);
    }
    if (meta.dataset.key === key) return;
    meta.dataset.key = key;
    meta.replaceChildren();

    if (run.mode === 'story') {
      const heading = node('p', 'replay-kicker', 'BLOCK OBJECTIVES');
      meta.append(heading);
      const badges = node('div', 'replay-badges');
      BADGES.forEach(([label, target], index) => {
        const badge = node('div', `replay-badge${goals[index] ? ' is-earned' : ''}`);
        badge.setAttribute('aria-label', `${label}: ${goals[index] ? 'earned' : target}`);
        badge.append(node('strong', '', label), node('span', '', goals[index] ? 'earned' : target));
        badges.append(badge);
      });
      meta.append(badges);

      const next = goals.findIndex(earned => !earned);
      meta.append(node('p', 'replay-next', next < 0 ? 'Block complete · all four objectives hit.' : `Next objective · ${BADGES[next][1]}.`));

      const objectives = $('objectives');
      if (objectives && !objectives.querySelector('[data-replay-goal="flow"]')) {
        const flow = node('li', goals[3] ? 'earned' : '', 'Reach a 5-escape streak');
        flow.dataset.replayGoal = 'flow';
        objectives.append(flow);
        objectives.setAttribute('aria-label', 'Block objectives');
      }
    }

    const bestScore = record?.score || run.score || 0;
    const bestStreak = record?.bestStreak || run.bestStreak || 0;
    const bestCoins = record?.coins || run.coins || 0;
    const summary = node('div', 'replay-best');
    const delta = (run.score || 0) - (run.previousBestScore || 0);
    const headline = run.mode === 'endless'
      ? (run.isNewBest ? `NEW DISTANCE · ${score(record?.meters || 0)} M` : `BEST DISTANCE · ${score(record?.meters || 0)} M`)
      : run.isNewBest && run.previousBestScore > 0
        ? `NEW BEST LINE · +${score(delta)}`
        : run.isNewBest ? 'FIRST LINE ON THE BOARD' : `BEST LINE · ${score(bestScore)}`;
    summary.append(node('span', 'replay-best-label', 'BEST RUN'), node('strong', '', headline));
    summary.append(node('small', '', `${score(bestScore)} score · ${bestCoins} coins · ${bestStreak} peak streak`));
    meta.append(summary);
  }

  let syncing = false;
  function sync() {
    if (syncing) return;
    syncing = true;
    try { renderResult(); } finally { syncing = false; }
  }

  new MutationObserver(sync).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  sync();
})();
