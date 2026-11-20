// Pure logic for comparing rankings and describing them. No DOM in here.

import { getItem } from './data.js';

// ---- Share-link encoding -------------------------------------------------
// One base-36 character per item (its index in cat.items), best first.

export function encodeRanking(cat, ranking) {
  return ranking
    .map((id) => cat.items.findIndex((i) => i.id === id))
    .filter((idx) => idx >= 0)
    .map((idx) => idx.toString(36))
    .join('');
}

export function decodeRanking(cat, str) {
  if (typeof str !== 'string' || !/^[0-9a-z]+$/.test(str)) return null;
  const ids = [];
  for (const ch of str) {
    const item = cat.items[parseInt(ch, 36)];
    if (!item || ids.includes(item.id)) return null;
    ids.push(item.id);
  }
  return ids;
}

// ---- Match score ---------------------------------------------------------
// Compares only the items both people ranked. Disagreement about favourites
// and least-favourites counts up to 3x as much as disagreement in the middle,
// because that is where people actually care. Identical = 100, reversed = 0.

export function similarity(a, b) {
  const inA = new Set(a);
  const inB = new Set(b);
  const ca = a.filter((id) => inB.has(id));
  const cb = b.filter((id) => inA.has(id));
  const m = ca.length;
  if (m < 3) return null;

  const posB = new Map(cb.map((id, i) => [id, i]));
  const edge = (x) => 0.5 + Math.abs(2 * x - 1);
  let dist = 0;
  let worst = 0;
  const rows = ca.map((id, i) => {
    const j = posB.get(id);
    const xa = i / (m - 1);
    const xb = j / (m - 1);
    dist += ((edge(xa) + edge(xb)) / 2) * Math.abs(xa - xb);
    worst += edge(xa) * Math.abs(1 - 2 * xa);
    return { id, a: i, b: j };
  });
  const percent = Math.round(100 * (1 - Math.min(1, dist / worst)));

  const third = Math.max(1, Math.ceil(m / 3));
  const bySum = [...rows].sort((p, q) => p.a + p.b - (q.a + q.b));
  const top = bySum[0];
  const bottom = bySum[bySum.length - 1];
  const love = top.a < third && top.b < third ? top.id : null;
  const hate = bottom.a >= m - third && bottom.b >= m - third ? bottom.id : null;
  const clashRow = [...rows].sort((p, q) => Math.abs(q.a - q.b) - Math.abs(p.a - p.b))[0];
  const clash = Math.abs(clashRow.a - clashRow.b) >= 2
    ? { id: clashRow.id, a: clashRow.a + 1, b: clashRow.b + 1 }
    : null;

  return { percent, common: m, love, hate, clash };
}

export function verdict(percent) {
  if (percent >= 90) return { title: 'Taste twins', line: 'Suspiciously similar. Are you the same person?' };
  if (percent >= 75) return { title: 'Kindred spirits', line: 'You could share a plate without a fight.' };
  if (percent >= 55) return { title: 'Friendly rivals', line: 'Mostly aligned, with a few hills to die on.' };
  if (percent >= 35) return { title: 'Agree to disagree', line: 'There will be words at the table.' };
  if (percent >= 15) return { title: 'Sworn enemies', line: 'One of you is wrong, and you both know who.' };
  return { title: 'Exact opposites', line: 'Perfect, actually. You will never fight over the last serving.' };
}

// ---- Describing one ranking ----------------------------------------------

// Which group of items this person ranks highest on average.
export function archetype(cat, ranking) {
  const n = ranking.length;
  if (!n) return null;
  const totals = {};
  ranking.forEach((id, pos) => {
    const item = getItem(cat, id);
    if (!item) return;
    const t = (totals[item.group] ||= { sum: 0, count: 0 });
    t.sum += n > 1 ? 1 - pos / (n - 1) : 1;
    t.count++;
  });
  let best = null;
  for (const [key, t] of Object.entries(totals)) {
    const score = t.sum / t.count;
    if (!best || score > best.score) best = { key, score };
  }
  return best ? { key: best.key, ...cat.groups[best.key] } : null;
}

// The pair this person ranks most "backwards" compared with the crowd.
export function hotTake(cat, ranking) {
  const crowd = new Map(cat.consensus.map((id, i) => [id, i]));
  let best = null;
  for (let i = 0; i < ranking.length; i++) {
    for (let j = i + 1; j < ranking.length; j++) {
      if (!crowd.has(ranking[i]) || !crowd.has(ranking[j])) continue;
      const gap = crowd.get(ranking[i]) - crowd.get(ranking[j]);
      if (gap >= 3 && (!best || gap > best.gap)) best = { above: ranking[i], below: ranking[j], gap };
    }
  }
  return best;
}

export function hotTakeText(cat, ranking) {
  const take = hotTake(cat, ranking);
  if (!take) return null;
  return `${getItem(cat, take.above).name} above ${getItem(cat, take.below).name}`;
}

// Template roast. A real LLM-written roast needs a server; this stands in.
export function roast(cat, ranking) {
  if (ranking.length < 2) return '';
  const type = archetype(cat, ranking);
  const take = hotTake(cat, ranking);
  const last = getItem(cat, ranking[ranking.length - 1]).name;
  const first = getItem(cat, ranking[0]).name;
  const pick = (options) => options[(ranking[0].length + ranking.length + last.length) % options.length];

  const opener = take
    ? pick([
        `${getItem(cat, take.above).name} above ${getItem(cat, take.below).name}? Bold. Wrong, but bold.`,
        `You put ${getItem(cat, take.above).name} above ${getItem(cat, take.below).name}. Seek help.`,
        `${getItem(cat, take.above).name} over ${getItem(cat, take.below).name} is a choice people will remember.`,
      ])
    : pick([
        `${first} at number one. Suspiciously normal. No hot takes detected.`,
        `A ranking so sensible it could run for office.`,
      ]);
  const closer = pick([
    `And ${last} dead last? Somebody's feelings are hurt.`,
    `${last} in last place will be brought up at dinner.`,
    `Justice for ${last}.`,
  ]);
  return [opener, type ? type.line : '', closer].filter(Boolean).join(' ');
}
