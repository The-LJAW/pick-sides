// Turns 12 quick "this or that" taps into a full ranking.
//
// An exact order of 12 items would take about 30 taps, so this does two things:
//   1. Runs a knockout, which always finds the player's true #1 in 11 duels.
//      The last duel goes to the items that have not won yet.
//   2. Estimates everything else from who beat whom, how they treated similar
//      items (one chocolate win lifts the other chocolates a little), and the
//      typical order for that category.
// The final order never contradicts an answer the player gave.
//
// The state is plain JSON, so the app can snapshot it for undo and persist it.

export const MAX_TAPS = 12;

// Tuned by simulating players; see the ranker tests.
const PRIOR_WEIGHT = 0.6;
const OWN_VARIANCE = 2;
const GROUP_VARIANCE = 0.6;
const PAIR_JITTER = 0.2;

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Which items are known to beat which, directly or through a chain of wins.
function knownWins(s) {
  const index = new Map(s.ids.map((id, i) => [id, i]));
  const beats = s.ids.map(() => s.ids.map(() => false));
  for (const [w, l] of s.games) beats[index.get(w)][index.get(l)] = true;
  for (let k = 0; k < s.ids.length; k++) {
    for (let i = 0; i < s.ids.length; i++) {
      if (!beats[i][k]) continue;
      for (let j = 0; j < s.ids.length; j++) if (beats[k][j]) beats[i][j] = true;
    }
  }
  return { beats, index };
}

// Estimate how much the player likes each item from their answers so far.
function strengths(s) {
  const own = {};
  const grp = {};
  for (const id of s.ids) { own[id] = 0; grp[s.group[id]] = 0; }
  const strength = (id) => s.prior[id] * PRIOR_WEIGHT + grp[s.group[id]] + own[id];

  for (let step = 0; step < 60; step++) {
    const dOwn = {};
    const dGrp = {};
    for (const id of s.ids) {
      dOwn[id] = -own[id] / OWN_VARIANCE;
      dGrp[s.group[id]] = -grp[s.group[id]] / GROUP_VARIANCE;
    }
    for (const [w, l] of s.games) {
      const surprise = 1 - sigmoid(strength(w) - strength(l));
      dOwn[w] += surprise;
      dOwn[l] -= surprise;
      dGrp[s.group[w]] += surprise;
      dGrp[s.group[l]] -= surprise;
    }
    for (const id of s.ids) own[id] += 0.35 * dOwn[id];
    for (const key of Object.keys(grp)) grp[key] += 0.2 * dGrp[key];
  }
  return Object.fromEntries(s.ids.map((id) => [id, strength(id)]));
}

// Best estimate of the order, always respecting the player's answers.
function estimate(s) {
  const score = strengths(s);
  const { beats, index } = knownWins(s);
  const left = [...s.ids];
  const out = [];
  while (left.length) {
    const free = left.filter((a) => !left.some((b) => b !== a && beats[index.get(b)][index.get(a)]));
    free.sort((a, b) => score[b] - score[a]);
    out.push(free[0]);
    left.splice(left.indexOf(free[0]), 1);
  }
  return out;
}

function nextPair(s, rng) {
  if (s.taps >= s.budget || s.ids.length < 2) return null;
  const { beats, index } = knownWins(s);
  const open = (a, b) => !beats[index.get(a)][index.get(b)] && !beats[index.get(b)][index.get(a)];
  const score = strengths(s);
  const wins = Object.fromEntries(s.ids.map((id) => [id, 0]));
  const losses = { ...wins };
  for (const [w, l] of s.games) { wins[w]++; losses[l]++; }
  const plays = (id) => wins[id] + losses[id];

  // Pair the closest-looking items among those who have played the least.
  const pairFrom = (list) => {
    const fewest = Math.min(...list.map(plays));
    const level = list.filter((id) => plays(id) === fewest);
    const pool = level.length >= 2 ? level : list;
    const jitter = Object.fromEntries(pool.map((id) => [id, rng() * PAIR_JITTER]));
    const sorted = [...pool].sort((a, b) => score[b] + jitter[b] - (score[a] + jitter[a]));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) if (open(sorted[i], sorted[j])) return [sorted[i], sorted[j]];
    }
    return null;
  };

  const groups = [
    s.ids.filter((id) => plays(id) === 0),
    s.ids.filter((id) => plays(id) > 0 && losses[id] === 0),
    s.ids.filter((id) => plays(id) > 0 && wins[id] === 0),
  ];
  for (const list of groups) {
    if (list.length < 2) continue;
    const pair = pairFrom(list);
    if (pair) return pair;
  }

  // Everything else: the closest pair whose order is still unknown.
  let best = null;
  let bestValue = -1;
  for (let i = 0; i < s.ids.length; i++) {
    for (let j = i + 1; j < s.ids.length; j++) {
      const [a, b] = [s.ids[i], s.ids[j]];
      if (!open(a, b)) continue;
      const p = sigmoid(score[a] - score[b]);
      const value = (p * (1 - p)) / (1 + plays(a) + plays(b)) ** 2;
      if (value > bestValue) { bestValue = value; best = [a, b]; }
    }
  }
  return best;
}

function advance(s, rng) {
  const pair = nextPair(s, rng);
  s.pair = pair && (rng() < 0.5 ? pair : [pair[1], pair[0]]);
  return s;
}

// cat: { items: [{ id, group }], consensus: [ids, best first] } (consensus may be empty)
export function createRanker(cat, rng = Math.random) {
  const n = cat.items.length;
  const prior = {};
  const group = {};
  for (const item of cat.items) { prior[item.id] = 0; group[item.id] = item.group; }
  cat.consensus.forEach((id, i) => { prior[id] = (n - 1 - 2 * i) / (n - 1); });
  return advance({
    v: 3,
    ids: shuffle(cat.items.map((i) => i.id), rng),
    prior,
    group,
    games: [],
    taps: 0,
    budget: MAX_TAPS,
    skipped: [],
    pair: null,
  }, rng);
}

export const isDone = (s) => !s.pair;
export const currentPair = (s) => s.pair;
export const result = (s) => (isDone(s) ? estimate(s) : null);

export function choose(s, winnerId, rng = Math.random) {
  if (!s.pair) throw new Error('ranking is already finished');
  if (!s.pair.includes(winnerId)) throw new Error(`${winnerId} is not in the current matchup`);
  const loserId = s.pair[0] === winnerId ? s.pair[1] : s.pair[0];
  s.games.push([winnerId, loserId]);
  s.taps++;
  return advance(s, rng);
}

// "Never tried it": drop the item and any duels it was part of. Costs no tap.
export function skip(s, id, rng = Math.random) {
  s.ids = s.ids.filter((x) => x !== id);
  s.games = s.games.filter(([w, l]) => w !== id && l !== id);
  if (!s.skipped.includes(id)) s.skipped.push(id);
  return advance(s, rng);
}

// Most taps still needed. Used for the progress bar.
export function remaining(s) {
  if (!s.pair) return 0;
  const { beats, index } = knownWins(s);
  let unknown = 0;
  for (let i = 0; i < s.ids.length; i++) {
    for (let j = i + 1; j < s.ids.length; j++) {
      const [a, b] = [index.get(s.ids[i]), index.get(s.ids[j])];
      if (!beats[a][b] && !beats[b][a]) unknown++;
    }
  }
  return Math.min(s.budget - s.taps, unknown);
}
