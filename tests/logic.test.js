import test from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORIES } from '../js/data.js';
import { createRanker, currentPair, choose, skip, isDone, result, remaining, MAX_TAPS, BONUS_TAPS, canExtend, extend, lockedEnds } from '../js/ranker.js';
import { encodeRanking, decodeRanking, similarity, archetype, hotTake, roast } from '../js/match.js';

// Deterministic random numbers so failures are repeatable.
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

// Answer every matchup according to a known "true" order.
function play(cat, truth, rng, onStep) {
  const rank = new Map(truth.map((id, i) => [id, i]));
  const s = createRanker(cat, rng);
  while (!isDone(s)) {
    const [a, b] = currentPair(s);
    const before = remaining(s);
    choose(s, rank.get(a) < rank.get(b) ? a : b, rng);
    onStep?.(s, before);
  }
  return s;
}

test('data: every category is internally consistent', () => {
  for (const cat of CATEGORIES) {
    const ids = cat.items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `${cat.id} has duplicate item ids`);
    assert.ok(ids.length <= 36, 'share links use one base-36 character per item');
    assert.deepEqual([...cat.consensus].sort(), [...ids].sort(), `${cat.id} consensus must list every item once`);
    for (const item of cat.items) assert.ok(cat.groups[item.group], `${item.id} has unknown group`);
  }
  assert.equal(new Set(CATEGORIES.map((c) => c.code)).size, CATEGORIES.length);
  const typeKeys = CATEGORIES.flatMap((c) => Object.keys(c.groups));
  assert.equal(new Set(typeKeys).size, typeKeys.length, 'type names must differ between categories, or their roast lines get mixed up');
});

test('ranker: 12 taps always finds the true #1 and never contradicts an answer', () => {
  for (const cat of CATEGORIES) {
    const ids = cat.items.map((i) => i.id);
    for (let seed = 1; seed <= 150; seed++) {
      const rng = seeded(seed);
      const truth = [...ids].sort(() => rng() - 0.5);
      const s = play(cat, truth, rng, (state, before) => assert.ok(remaining(state) < before));
      const out = result(s);
      assert.equal(s.taps, MAX_TAPS);
      assert.equal(MAX_TAPS, 12);
      assert.equal(out[0], truth[0], 'true favourite must be #1');
      assert.deepEqual([...out].sort(), [...ids].sort());
      for (const [w, l] of s.games) assert.ok(out.indexOf(w) < out.indexOf(l), `${w} beat ${l}`);
    }
  }
});

test('ranker: short lists are ranked exactly', () => {
  const cat = { items: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, group: 'all' })), consensus: [] };
  for (let seed = 1; seed <= 100; seed++) {
    const rng = seeded(seed);
    const truth = cat.items.map((i) => i.id).sort(() => rng() - 0.5);
    assert.deepEqual(result(play(cat, truth, rng)), truth);
  }
});

test('ranker: long custom lists still stop at 12 taps', () => {
  const items = Array.from({ length: 24 }, (_, i) => ({ id: `i${i}`, group: 'all' }));
  const rng = seeded(3);
  const s = play({ items, consensus: [] }, items.map((i) => i.id).sort(() => rng() - 0.5), rng);
  assert.equal(s.taps, 12);
  assert.equal(result(s).length, 24);
});

test('ranker: never-tried items drop out, keep the true #1, and saved games resume', () => {
  let maxTaps = 0;
  const cat = CATEGORIES[1];
  const ids = cat.items.map((i) => i.id);
  for (let seed = 1; seed <= 100; seed++) {
    const rng = seeded(seed);
    const truth = [...ids].sort(() => rng() - 0.5);
    const rank = new Map(truth.map((id, i) => [id, i]));
    const drop = new Set([truth[0], truth[6], truth[10]]);
    let s = createRanker(cat, rng);
    while (!isDone(s)) {
      const pair = currentPair(s);
      const hit = pair.find((id) => drop.has(id));
      if (hit) skip(s, hit, rng);
      else choose(s, rank.get(pair[0]) < rank.get(pair[1]) ? pair[0] : pair[1], rng);
      s = JSON.parse(JSON.stringify(s));
    }
    const out = result(s);
    maxTaps = Math.max(maxTaps, s.taps);
    assert.ok(out.every((id) => !drop.has(id)));
    assert.equal(out[0], truth.find((id) => !drop.has(id)), 'true favourite of what they have tried');
  }
  assert.ok(maxTaps <= 15, `took ${maxTaps} taps`);
});

test('ranker: skipping everything but one item ends cleanly', () => {
  const cat = { items: ['a', 'b', 'c'].map((id) => ({ id, group: 'all' })), consensus: [] };
  const s = createRanker(cat);
  while (!isDone(s)) skip(s, currentPair(s)[0]);
  assert.equal(result(s).length, 1);
});

test('share links: encode and decode round-trip, bad input is rejected', () => {
  const cat = CATEGORIES[0];
  const ranking = [...cat.consensus];
  const enc = encodeRanking(cat, ranking);
  assert.equal(enc.length, ranking.length);
  assert.deepEqual(decodeRanking(cat, enc), ranking);
  assert.deepEqual(decodeRanking(cat, enc.slice(0, 5)), ranking.slice(0, 5));
  assert.equal(decodeRanking(cat, '00'), null, 'duplicates');
  assert.equal(decodeRanking(cat, 'z'), null, 'out of range');
  assert.equal(decodeRanking(cat, '<script>'), null);
  assert.equal(decodeRanking(cat, ''), null);
});

test('similarity: identical is 100, reversed is 0, and it is symmetric', () => {
  const a = CATEGORIES[0].consensus;
  assert.equal(similarity(a, a).percent, 100);
  assert.equal(similarity(a, [...a].reverse()).percent, 0);
  const rng = seeded(7);
  for (let i = 0; i < 100; i++) {
    const b = [...a].sort(() => rng() - 0.5);
    const ab = similarity(a, b).percent;
    assert.equal(ab, similarity(b, a).percent);
    assert.ok(ab >= 0 && ab <= 100);
  }
});

test('similarity: top and bottom disagreements cost more than middle ones', () => {
  const a = CATEGORIES[0].consensus;
  const swap = (i, j) => { const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; };
  assert.ok(similarity(a, swap(0, 1)).percent < similarity(a, swap(5, 6)).percent);
});

test('similarity: only shared items count, and too little overlap gives null', () => {
  const a = ['turkey', 'stuffing', 'mashed', 'gravy'];
  assert.equal(similarity(a, ['corn', 'turkey', 'stuffing', 'mashed', 'gravy', 'pie'].filter((x) => x !== 'corn' && x !== 'pie')).percent, 100);
  assert.equal(similarity(a, ['turkey', 'pie', 'stuffing', 'corn', 'mashed', 'gravy']).percent, 100);
  assert.equal(similarity(a, ['turkey', 'stuffing', 'corn']), null);
});

test('similarity: shared favourite and biggest clash are reported', () => {
  const a = CATEGORIES[0].consensus;
  const b = [a[0], ...a.slice(2), a[1]];
  const r = similarity(a, b);
  assert.equal(r.love, a[0]);
  assert.deepEqual(r.clash, { id: a[1], a: 2, b: 12 });
});

test('archetype and hot take', () => {
  const cat = CATEGORIES[1];
  assert.equal(archetype(cat, cat.consensus).key, 'choc');
  assert.equal(hotTake(cat, cat.consensus), null);
  const spicy = ['candycorn', ...cat.consensus.filter((id) => id !== 'candycorn')];
  assert.deepEqual(hotTake(cat, spicy), { above: 'candycorn', below: 'reeses', gap: 11 });
  assert.equal(archetype(cat, ['candycorn', 'tootsie', 'reeses', 'snickers']).key, 'oldschool');
  assert.match(roast(cat, spicy), /Candy Corn/);
  assert.equal(roast(cat, ['reeses']), '');
});

test('table summary: most alike, least alike, odd one out and combined ranking', async () => {
  const { tableSummary } = await import('../js/match.js');
  const base = CATEGORIES[0].consensus;
  const members = [
    { name: 'Ann', ranking: base },
    { name: 'Bo', ranking: [base[1], base[0], ...base.slice(2)] },
    { name: 'Cy', ranking: [...base].reverse() },
  ];
  const s = tableSummary(members);
  assert.equal(s.pairs.length, 3);
  assert.deepEqual([s.mostAlike.a, s.mostAlike.b], ['Ann', 'Bo']);
  assert.equal(s.leastAlike.percent, 0);
  assert.equal(s.outlier.name, 'Cy');
  assert.equal(s.combined.length, base.length);
  assert.ok(s.combined.indexOf(base[0]) < s.combined.indexOf(base[11]), 'two against one keeps the favourite on top');
  assert.equal(tableSummary([members[0]]).mostAlike, null);
  assert.equal(tableSummary(members.slice(0, 2)).outlier, null);
});

test('custom lists: no type, no hot take, still a roast', () => {
  const cat = { items: ['a', 'b', 'c', 'd'].map((n, i) => ({ id: `i${i}`, name: n.toUpperCase(), emoji: '', group: 'all' })), consensus: [], groups: {} };
  const ranking = ['i2', 'i0', 'i3', 'i1'];
  assert.equal(archetype(cat, ranking), null);
  assert.equal(hotTake(cat, ranking), null);
  assert.match(roast(cat, ranking), /\bC\b/);
  assert.match(roast(cat, ranking), /\bB\b/, 'names the last place item');
  assert.deepEqual(decodeRanking(cat, encodeRanking(cat, ranking)), ranking);
});

test('roasts: every item has lines, nothing is left unfilled, and there is lots of variety', async () => {
  const { ITEM_LINES, TYPE_LINES } = await import('../js/roasts.js');
  for (const cat of CATEGORIES) {
    for (const item of cat.items) {
      assert.equal(ITEM_LINES[item.id]?.top?.length, 3, `${item.id} needs 3 top lines`);
      assert.equal(ITEM_LINES[item.id]?.last?.length, 3, `${item.id} needs 3 last lines`);
    }
    for (const key of Object.keys(cat.groups)) assert.ok(TYPE_LINES[key]?.length, `${key} needs type lines`);
  }
  const rng = seeded(11);
  for (const cat of CATEGORIES) {
    const ids = cat.items.map((i) => i.id);
    const seen = new Set();
    for (let i = 0; i < 3000; i++) {
      const r = [...ids].sort(() => rng() - 0.5);
      const text = roast(cat, r);
      assert.doesNotMatch(text, /[{}]|undefined/, text);
      assert.equal(text, roast(cat, r), 'same ranking, same roast');
      seen.add(text);
    }
    assert.ok(seen.size > 1500, `${cat.id}: only ${seen.size} different roasts in 3000 rankings`);
  }
});

test('bonus round: 5 more taps lock in both #1 and last place', () => {
  for (const cat of CATEGORIES) {
    const ids = cat.items.map((i) => i.id);
    for (let seed = 1; seed <= 150; seed++) {
      const rng = seeded(seed);
      const truth = [...ids].sort(() => rng() - 0.5);
      const rank = new Map(truth.map((id, i) => [id, i]));
      let s = play(cat, truth, rng);
      assert.ok(canExtend(s));
      s = extend(JSON.parse(JSON.stringify(s)), rng);
      assert.equal(remaining(s), BONUS_TAPS);
      while (!isDone(s)) {
        const [a, b] = currentPair(s);
        choose(s, rank.get(a) < rank.get(b) ? a : b, rng);
      }
      const out = result(s);
      assert.equal(s.taps, MAX_TAPS + BONUS_TAPS);
      assert.equal(out[0], truth[0]);
      assert.equal(out[11], truth[11]);
      assert.deepEqual(lockedEnds(s), { first: true, last: true });
      for (const [w, l] of s.games) assert.ok(out.indexOf(w) < out.indexOf(l));
      assert.equal(canExtend(s), false, 'offered only once');
    }
  }
});

test('bonus round: not offered when the order is already certain', () => {
  const cat = { items: ['a', 'b', 'c'].map((id) => ({ id, group: 'all' })), consensus: [] };
  assert.equal(canExtend(play(cat, ['b', 'a', 'c'], seeded(1))), false);
});

test('party pack awards: every guest gets one, with special titles for the extremes', async () => {
  const { awards } = await import('../js/match.js');
  const cat = CATEGORIES[1];
  const base = cat.consensus;
  const members = [
    { name: 'Ann', ranking: base },
    { name: 'Bo', ranking: [base[1], base[0], ...base.slice(2)] },
    { name: 'Cy', ranking: [...base].reverse() },
    { name: 'Di', ranking: ['candycorn', ...base.filter((id) => id !== 'candycorn')] },
  ];
  const list = awards(cat, members);
  assert.deepEqual(list.map((a) => a.name), ['Ann', 'Bo', 'Cy', 'Di']);
  for (const a of list) assert.ok(a.title && a.line, JSON.stringify(a));
  assert.equal(list.find((a) => a.name === 'Cy').title, 'The Wild Card');
  assert.equal(list.find((a) => a.name === 'Di').title, 'Most Likely to Defend Candy Corn');
  assert.equal(list.filter((a) => a.title === 'The Peacemaker').length, 1);
  assert.deepEqual(awards(cat, members.slice(0, 1)), []);
  const rng = seeded(4);
  for (let t = 0; t < 200; t++) {
    const group = Array.from({ length: 2 + (t % 9) }, (_, i) => ({ name: `P${i}`, ranking: [...base].sort(() => rng() - 0.5) }));
    const out = awards(cat, group);
    assert.equal(out.length, group.length);
    assert.ok(out.every((a) => a.title && a.line && !/undefined/.test(a.title + a.line)));
  }
});
