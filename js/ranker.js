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
