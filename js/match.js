// Pure logic for comparing rankings and describing them. No DOM in here.

import { getItem } from './data.js?v=7';
import { ITEM_LINES, TYPE_LINES, TAKE_LINES, NORMAL_LINES, CUSTOM_TOP, CUSTOM_LAST } from './roasts.js?v=7';

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
  return best && cat.groups[best.key] ? { key: best.key, ...cat.groups[best.key] } : null;
}

// ---- Group tables ----------------------------------------------------------
// members: [{ name, ranking }]. Finds who is most and least alike, the person
// least like everyone else, and the group's combined ranking.
export function tableSummary(members) {
  const pairs = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const s = similarity(members[i].ranking, members[j].ranking);
      if (s) pairs.push({ a: members[i].name, b: members[j].name, percent: s.percent });
    }
  }
  const sorted = [...pairs].sort((p, q) => q.percent - p.percent);

  let outlier = null;
  if (members.length >= 3) {
    for (const m of members) {
      const mine = pairs.filter((p) => p.a === m.name || p.b === m.name);
      if (!mine.length) continue;
      const average = Math.round(mine.reduce((t, p) => t + p.percent, 0) / mine.length);
      if (!outlier || average < outlier.average) outlier = { name: m.name, average };
    }
  }

  // Average position of each item, counting only items most of the group ranked.
  const totals = new Map();
  for (const { ranking } of members) {
    ranking.forEach((id, pos) => {
      const t = totals.get(id) || { sum: 0, count: 0 };
      t.sum += ranking.length > 1 ? pos / (ranking.length - 1) : 0;
      t.count++;
      totals.set(id, t);
    });
  }
  const combined = [...totals.entries()]
    .filter(([, t]) => t.count >= members.length / 2)
    .sort(([, p], [, q]) => p.sum / p.count - q.sum / q.count)
    .map(([id]) => id);

  return {
    pairs,
    mostAlike: sorted[0] || null,
    leastAlike: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    outlier,
    combined,
  };
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

// Roast built from the hand-written lines in roasts.js: an opener (the hot
// take, or their #1), a middle line (their type, or their #1), and a closer
// about their last place pick. The same ranking always gets the same roast.
function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function roast(cat, ranking) {
  if (ranking.length < 2) return '';
  const seed = seedOf(`${cat.id}|${ranking.join(',')}`);
  const pick = (options, salt) => options[seedOf(`${seed}:${salt}`) % options.length];
  const fill = (line, vars) => line.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

  const firstId = ranking[0];
  const lastId = ranking[ranking.length - 1];
  const top = getItem(cat, firstId).name;
  const last = getItem(cat, lastId).name;
  const take = hotTake(cat, ranking);
  const type = archetype(cat, ranking);
  const topLines = ITEM_LINES[firstId]?.top;
  const lastLines = ITEM_LINES[lastId]?.last;
  const typeLines = type ? [type.line, ...(TYPE_LINES[type.key] || [])] : [];

  let opener;
  let middle = '';
  if (take) {
    opener = fill(pick(TAKE_LINES, 'take'), { a: getItem(cat, take.above).name, b: getItem(cat, take.below).name });
    const topIsInTake = take.above === firstId || take.below === firstId;
    const useTop = topLines && !topIsInTake && pick([true, false], 'mid');
    middle = useTop ? pick(topLines, 'top') : typeLines.length ? pick(typeLines, 'type') : '';
  } else if (topLines) {
    opener = pick(topLines, 'top');
    middle = typeLines.length ? pick(typeLines, 'type') : '';
  } else {
    opener = fill(pick(cat.consensus.length ? NORMAL_LINES : CUSTOM_TOP, 'normal'), { top });
    middle = typeLines.length ? pick(typeLines, 'type') : '';
  }
  const closer = lastLines ? pick(lastLines, 'last') : fill(pick(CUSTOM_LAST, 'last'), { last });

  return [opener, middle, closer].filter(Boolean).join(' ');
}
