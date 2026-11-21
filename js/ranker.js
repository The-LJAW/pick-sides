// Interactive merge sort: turns "which of these two?" taps into a full ranking
// in about n*log2(n) taps (33 at most for 12 items) instead of all 66 pairs.
//
// The state is plain JSON, so the app can snapshot it for undo and persist it.
//   queue  - sorted lists (best first) waiting to be merged
//   left/right/merged - the merge in progress; the current matchup is left[0] vs right[0]

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRanker(ids, rng = Math.random) {
  return settle({
    queue: shuffle(ids, rng).map((id) => [id]),
    left: null,
    right: null,
    merged: [],
    taps: 0,
    skipped: [],
  });
}

// Advance until a matchup needs the user, or everything is in one list.
function settle(s) {
  for (;;) {
    if (s.left) {
      if (s.left.length && s.right.length) return s;
      const out = [...s.merged, ...s.left, ...s.right];
      if (out.length) s.queue.push(out);
      s.left = s.right = null;
      s.merged = [];
    }
    s.queue = s.queue.filter((l) => l.length);
    if (s.queue.length <= 1) return s;
    s.left = s.queue.shift();
    s.right = s.queue.shift();
  }
}

export const isDone = (s) => !s.left;
export const currentPair = (s) => (s.left ? [s.left[0], s.right[0]] : null);
export const result = (s) => (isDone(s) ? s.queue[0] || [] : null);

export function choose(s, winnerId) {
  if (!s.left) throw new Error('ranking is already finished');
  const side = s.left[0] === winnerId ? s.left : s.right[0] === winnerId ? s.right : null;
  if (!side) throw new Error(`${winnerId} is not in the current matchup`);
  s.merged.push(side.shift());
  s.taps++;
  return settle(s);
}

// "Never tried it": drop the item from the ranking entirely.
export function skip(s, id) {
  const without = (l) => l.filter((x) => x !== id);
  s.queue = s.queue.map(without);
  if (s.left) {
    s.left = without(s.left);
    s.right = without(s.right);
    s.merged = without(s.merged);
  }
  if (!s.skipped.includes(id)) s.skipped.push(id);
  return settle(s);
}

// Worst-case taps still needed. Used for the progress bar.
export function remaining(s) {
  let total = 0;
  const sizes = s.queue.map((l) => l.length);
  if (s.left) {
    total += s.left.length + s.right.length - 1;
    sizes.push(s.merged.length + s.left.length + s.right.length);
  }
  while (sizes.length > 1) {
    const a = sizes.shift();
    const b = sizes.shift();
    total += a + b - 1;
    sizes.push(a + b);
  }
  return total;
}

// ---- Draft: a full ranking in far fewer taps --------------------------------
// One tap on a grid says more than one this-or-that. Players alternate picking
// their favourite and their worst from what is left, which fixes both ends of
// the ranking first. The last few items are settled head-to-head.
// 12 items take 8 grid taps + at most 5 duels = 13 taps, for an exact order.

export const DUEL_SIZE = 4;

function settleDraft(s, rng) {
  if (!s.duel && s.pool.length <= DUEL_SIZE) {
    s.duel = createRanker(s.pool, rng);
    s.pool = [];
  }
  return s;
}

export function createDraft(ids, rng = Math.random) {
  return settleDraft({ v: 2, pool: shuffle(ids, rng), best: [], worst: [], turn: 'best', duel: null, taps: 0, skipped: [] }, rng);
}

export const draftDone = (s) => !!s.duel && isDone(s.duel);

export function draftStep(s) {
  if (draftDone(s)) return null;
  if (s.duel) return { kind: 'duel', pair: currentPair(s.duel) };
  return { kind: 'pick', mode: s.turn, options: s.pool };
}

export function draftChoose(s, id, rng = Math.random) {
  if (draftDone(s)) throw new Error('ranking is already finished');
  if (s.duel) {
    choose(s.duel, id);
  } else {
    if (!s.pool.includes(id)) throw new Error(`${id} is not on the board`);
    s.pool = s.pool.filter((x) => x !== id);
    (s.turn === 'best' ? s.best : s.worst).push(id);
    s.turn = s.turn === 'best' ? 'worst' : 'best';
  }
  s.taps++;
  return settleDraft(s, rng);
}

// "Never tried it": drop the item from the ranking entirely.
export function draftSkip(s, id, rng = Math.random) {
  if (s.duel) skip(s.duel, id);
  else s.pool = s.pool.filter((x) => x !== id);
  if (!s.skipped.includes(id)) s.skipped.push(id);
  return settleDraft(s, rng);
}

export const draftResult = (s) => (draftDone(s) ? [...s.best, ...result(s.duel), ...[...s.worst].reverse()] : null);

// Most taps still needed. Used for the progress bar.
export const draftRemaining = (s) => (s.duel ? remaining(s.duel) : s.pool.length - DUEL_SIZE + 5);
