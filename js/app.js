import { CATEGORIES, getCategory, getCategoryByCode, getItem } from './data.js?v=10';
import { createRanker, currentPair, choose, skip, isDone, result, remaining, canExtend, extend, lockedEnds, BONUS_TAPS } from './ranker.js?v=10';
import { encodeRanking, decodeRanking, similarity, verdict, archetype, hotTakeText, roast, tableSummary } from './match.js?v=10';
import { drawRankCard, drawMatchCard, canvasToBlob } from './card.js?v=10';
import { api, online, track } from './api.js?v=10';
import { CROWD_MIN } from './config.js?v=10';

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

// ---- Tiny DOM helper. Text always goes in as text, never as HTML. --------
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// ---- Saved state on this device -------------------------------------------
const KEY = 'picksides.v1';
const GAME_KEY = 'picksides.game';
const PENDING_KEY = 'picksides.pending';

function read(storage, key) {
  try { return JSON.parse(storage.getItem(key)); } catch { return null; }
}
function write(storage, key, value) {
  try { value == null ? storage.removeItem(key) : storage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

const randomId = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => (b % 36).toString(36)).join('');

const store = {
  name: '',
  mid: '',        // random id for this device, used to update your own table entries
  rankings: {},   // category id -> ranked item ids
  skipped: {},
  matches: {},    // category id -> [{ name, enc, percent }]
  rids: {},       // category id -> random id of your anonymous crowd entry
  lists: {},      // custom list id -> { title, items }
  tables: {},     // table id -> { cat, title, name }
  roasts: {},     // "cat:enc" -> AI roast text
  states: {},     // category id -> finished game, kept for the bonus round
  ...(read(localStorage, KEY) || {}),
};
if (!store.mid) store.mid = randomId();
const save = () => write(localStorage, KEY, store);

// ---- Helpers --------------------------------------------------------------
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
const go = (hash) => { location.hash = hash; };
const baseUrl = () => `${location.origin}${location.pathname}`;
const hostLabel = () => (location.host + location.pathname).replace(/\/(index\.html)?$/, '') || 'picksides';
const myName = () => cleanName(store.name);

function setTheme(cat) {
  const t = (cat || CATEGORIES[0]).theme;
  const s = document.documentElement.style;
  s.setProperty('--bg', t.bg);
  s.setProperty('--card', t.card);
  s.setProperty('--accent', t.accent);
  s.setProperty('--accent2', t.accent2);
  s.setProperty('--ink', t.ink);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg);
}

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ---- Categories: built in, or a custom list fetched from the server -------
const CUSTOM_THEME = { bg: '#EEF6F5', card: '#FFFFFF', accent: '#0F766E', accent2: '#14B8A6', ink: '#102A2A' };
const DOTS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '🔶', '🔷', '🔺', '🔻', '💠', '⭐', '🌙', '☀️'];

function customCategory(id, list) {
  return {
    id: `u-${id}`,
    code: `u-${id}`,
    custom: true,
    title: list.title,
    emoji: '📝',
    badge: 'Your list',
    blurb: `${list.items.length} things to rank.`,
    theme: CUSTOM_THEME,
    items: list.items.map((it, i) => ({ id: `i${i}`, name: it.name, emoji: it.emoji || DOTS[i % DOTS.length], group: 'all' })),
    consensus: [],
    groups: {},
  };
}

async function findCategory(key) {
  const builtIn = getCategory(key) || getCategoryByCode(key);
  if (builtIn) return builtIn;
  if (typeof key !== 'string' || !key.startsWith('u-')) return null;
  const id = key.slice(2);
  if (!store.lists[id]) {
    const list = await api.readList(id);
    if (!list || list.error) return null;
    store.lists[id] = { title: list.title, items: list.items };
    save();
  }
  return customCategory(id, store.lists[id]);
}

// Swap the hand-written "typical order" for the real crowd's once enough people have played.
const crowdCache = new Map();
async function withCrowd(cat) {
  if (!online) return cat;
  let hit = crowdCache.get(cat.id);
  if (!hit || Date.now() - hit.at > 120000) {
    hit = { at: Date.now(), data: await api.crowd(cat.id) };
    crowdCache.set(cat.id, hit);
  }
  const data = hit.data;
  if (!data || data.error || data.count < CROWD_MIN) return cat;
  const order = decodeRanking(cat, data.order);
  return order ? { ...cat, consensus: order, crowd: data } : cat;
}

// ---- Sharing --------------------------------------------------------------
function challengeUrl(cat) {
  const enc = encodeRanking(cat, store.rankings[cat.id]);
  return `${baseUrl()}#/vs/${cat.code}/${enc}/${encodeURIComponent(myName() || 'A friend')}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

// Native share sheet (with the image where the device supports it),
// otherwise fall back to copying the link.
async function share({ canvas, text, url, cat }) {
  track('share', cat?.id);
  const blob = canvas && (await canvasToBlob(canvas));
  const file = blob && new File([blob], 'pick-sides.png', { type: 'image/png' });
  const attempts = [];
  if (file && navigator.canShare?.({ files: [file] })) attempts.push({ files: [file], text: `${text} ${url}` });
  if (navigator.share) attempts.push({ text, url });
  for (const data of attempts) {
    try { await navigator.share(data); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  await copyText(url);
  toast('Link copied. Paste it to a friend!');
}

async function copyLink(url, cat, message = 'Link copied!') {
  track('copy_link', cat?.id);
  await copyText(url);
  toast(message);
}

async function saveImage(canvas, cat) {
  track('save_image', cat?.id);
  const blob = await canvasToBlob(canvas);
  if (!blob) return;
  const a = h('a', { href: URL.createObjectURL(blob), download: 'pick-sides.png' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---- Shared pieces --------------------------------------------------------
const topbar = (right) => h('div', { class: 'topbar' }, h('a', { class: 'brand', href: '#/' }, 'Pick Sides'), right);

function render(...nodes) {
  document.onkeydown = null;
  app.replaceChildren(...nodes.flat().filter(Boolean));
  window.scrollTo(0, 0);
}

const message = (emoji, title, text, action) => render(
  topbar(),
  h('section', { class: 'challenge stack' },
    h('div', { class: 'emoji' }, emoji), h('h1', {}, title), text && h('p', { class: 'muted' }, text), action));

function nameField(onChange, label = 'Your name, for your card and link') {
  const input = h('input', { id: 'name', type: 'text', maxlength: 24, autocomplete: 'given-name', placeholder: 'First name or nickname', value: store.name || '' });
  input.addEventListener('input', () => {
    store.name = cleanName(input.value);
    save();
    onChange?.();
  });
  return h('div', { class: 'field' }, h('label', { for: 'name' }, label), input);
}

function needName() {
  if (myName()) return true;
  toast('Add your name first.');
  document.getElementById('name')?.focus();
  return false;
}

function matchList(cat) {
  const list = store.matches[cat.id] || [];
  if (!list.length) return null;
  return h('section', { class: 'panel matches' },
    h('h2', {}, `Your ${cat.title} matches`),
    [...list].sort((a, b) => b.percent - a.percent).map((m) =>
      h('a', { href: `#/vs/${cat.code}/${m.enc}/${encodeURIComponent(m.name)}` },
        h('span', {}, m.name), h('span', { class: 'pct' }, `${m.percent}%`))));
}

function categoryCard(cat) {
  const done = !!store.rankings[cat.id];
  return h('a', {
    class: 'cat', href: done ? `#/result/${cat.id}` : `#/play/${cat.id}`,
    style: `--cat-accent:${cat.theme.accent};--cat-ink:${cat.theme.ink}`,
  },
    h('span', { class: 'emoji' }, cat.emoji),
    h('span', { class: 'badge' }, cat.badge),
    h('span', { class: 'title' }, cat.title),
    h('span', { class: 'blurb' }, cat.blurb),
    h('span', { class: 'cta' }, done ? 'See your ranking →' : 'Start ranking →'));
}

// ---- Home -----------------------------------------------------------------
function viewHome() {
  setTheme(null);
  const custom = Object.entries(store.lists).map(([id, list]) => customCategory(id, list));
  const tables = Object.entries(store.tables);
  render(
    topbar(),
    h('div', { class: 'stack-lg' },
      h('header', { class: 'hero' },
        h('h1', {}, 'Two options. One tap. Pick a side.'),
        h('p', {}, 'Rank your favourites in 12 quick taps, then find out who matches you and who is completely wrong.')),
      h('div', { class: 'stack' },
        CATEGORIES.map(categoryCard),
        custom.map(categoryCard),
        online && h('a', { class: 'cat new', href: '#/new', style: `--cat-accent:${CUSTOM_THEME.accent};--cat-ink:${CUSTOM_THEME.ink}` },
          h('span', { class: 'emoji' }, '➕'),
          h('span', { class: 'badge' }, 'Anything you like'),
          h('span', { class: 'title' }, 'Make your own list'),
          h('span', { class: 'blurb' }, 'Office snacks, pizza toppings, road trip albums.'),
          h('span', { class: 'cta' }, 'Create a list →'))),
      tables.length ? h('section', { class: 'panel matches' },
        h('h2', {}, 'Your tables'),
        tables.map(([id, t]) => h('a', { href: `#/table/${id}` }, h('span', {}, t.title), h('span', { class: 'pct' }, '→')))) : null,
      [...CATEGORIES, ...custom].map(matchList),
      h('p', { class: 'muted small center' }, online
        ? 'No sign-up. Rankings are counted anonymously. Your name is only seen by people you send a link or table to.'
        : 'No sign-up. Your rankings stay on your device unless you share a link.')));
}

// ---- Game -----------------------------------------------------------------
function viewPlay(cat) {
  setTheme(cat);
  let game = read(sessionStorage, GAME_KEY);
  if (!game || game.catId !== cat.id || game.state?.v !== 3 || isDone(game.state)) {
    game = { catId: cat.id, state: createRanker(cat), history: [] };
    track('start', cat.id);
  }
  const persist = () => write(sessionStorage, GAME_KEY, game);
  let busy = false;

  const act = (fn) => {
    game.history.push(JSON.stringify(game.state));
    fn(game.state);
    persist();
    isDone(game.state) ? finish() : draw();
  };

  const finish = () => {
    const ranking = result(game.state);
    write(sessionStorage, GAME_KEY, null);
    if (ranking.length < 3) {
      toast('Rank at least 3 things you have tried.');
      return go('#/');
    }
    store.rankings[cat.id] = ranking;
    store.skipped[cat.id] = game.state.skipped;
    store.rids[cat.id] ||= randomId();
    store.states[cat.id] = game.state;
    save();
    if (!game.state.extended) track('finish', cat.id);
    api.saveRanking(store.rids[cat.id], cat.id, encodeRanking(cat, ranking));
    crowdCache.delete(cat.id);
    // A challenge or table link stays pending: the result page shows their
    // own type first, with a button through to it.
    go(`#/result/${cat.id}`);
  };

  const pickSide = (id, btn, otherBtn) => {
    if (busy) return;
    busy = true;
    btn.classList.add('picked');
    otherBtn.classList.add('lost');
    setTimeout(() => { busy = false; act((s) => choose(s, id)); }, 170);
  };

  const undo = () => {
    if (busy || !game.history.length) return;
    game.state = JSON.parse(game.history.pop());
    persist();
    draw();
  };

  function draw() {
    const [a, b] = currentPair(game.state).map((id) => getItem(cat, id));
    const left = remaining(game.state);
    const pct = Math.round((100 * game.state.taps) / (game.state.taps + left));
    const buttons = [a, b].map((item) => h('button', { class: 'choice', type: 'button' },
      h('span', { class: 'emoji' }, item.emoji), h('span', { class: 'name' }, item.name)));
    buttons[0].addEventListener('click', () => pickSide(a.id, buttons[0], buttons[1]));
    buttons[1].addEventListener('click', () => pickSide(b.id, buttons[1], buttons[0]));

    render(
      topbar(h('a', { class: 'linkbtn', href: '#/' }, 'Quit')),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 },
        h('div', { style: `width:${pct}%` })),
      h('div', { class: 'prompt' },
        h('h1', {}, game.state.extended ? 'Bonus round: which one?' : 'Which do you want more?'),
        h('p', { class: 'muted small' }, cat.title)),
      h('div', { class: 'duel' }, [a, b].map((item, i) => h('div', { class: 'side' },
        buttons[i],
        h('button', { class: 'linkbtn', type: 'button', onclick: () => !busy && act((s) => skip(s, item.id)) }, 'Never tried it')))),
      h('div', { class: 'game-foot' },
        h('button', { class: 'linkbtn', type: 'button', disabled: !game.history.length, onclick: undo }, '← Undo'),
        h('span', { class: 'muted small' }, left === 1 ? 'Last one!' : `${left} taps left`)));

    document.onkeydown = (e) => {
      if (e.key === 'ArrowLeft') buttons[0].click();
      else if (e.key === 'ArrowRight') buttons[1].click();
      else if (e.key === 'Backspace') undo();
    };
  }

  persist();
  draw();
}

// ---- Your result ----------------------------------------------------------
function waitingBanner(cat) {
  const pending = read(sessionStorage, PENDING_KEY);
  if (!pending || pending.cat !== cat.id) return null;
  const table = pending.kind === 'table';
  return h('section', { class: 'panel waiting stack' },
    h('h2', {}, table ? `Done! Now add your ranking to ${pending.who}.` : `Done! Now, how do you match with ${pending.who}?`),
    h('a', { class: 'btn', href: pending.hash }, table ? 'Go to the table' : 'See your match'));
}

function crowdFact(cat, ranking) {
  if (!cat.crowd) return null;
  const top = getItem(cat, ranking[0]);
  const ch = cat.items.indexOf(top).toString(36);
  const share = Math.round((100 * (cat.crowd.first[ch] || 0)) / cat.crowd.count);
  return share
    ? `${share}% of ${cat.crowd.count} people also put ${top.name} first.`
    : `Almost nobody out of ${cat.crowd.count} people put ${top.name} first.`;
}

async function startTable(cat) {
  if (!needName()) return;
  const made = await api.createTable(cat.id, `${myName()}'s ${cat.title} table`);
  if (!made || made.error) return toast('Could not start a table. Try again in a moment.');
  const joined = await api.joinTable(made.id, store.mid, myName(), encodeRanking(cat, store.rankings[cat.id]));
  if (!joined || joined.error) return toast('Could not start a table. Try again in a moment.');
  store.tables[made.id] = { cat: cat.id, title: joined.title, name: myName() };
  save();
  go(`#/table/${made.id}`);
}

function accuracyNote(state) {
  if (!state) return null;
  const ends = lockedEnds(state);
  const text = ends.first && ends.last ? 'Your #1 and last place are locked in. The middle is our best read from your picks.'
    : ends.first ? 'Your #1 is locked in. The rest is our best read from your picks.'
    : 'Our best read from your picks.';
  return h('p', { class: 'muted small', style: 'margin-top:12px' }, text);
}

function viewResult(cat) {
  const ranking = store.rankings[cat.id];
  if (!ranking) return go(`#/play/${cat.id}`);
  setTheme(cat);
  const type = archetype(cat, ranking);
  const take = hotTakeText(cat, ranking);
  const enc = encodeRanking(cat, ranking);
  const skipped = (store.skipped[cat.id] || []).map((id) => getItem(cat, id)?.name).filter(Boolean);
  const fact = crowdFact(cat, ranking);
  const saved = store.states[cat.id];

  const canvas = h('canvas', { 'aria-label': 'Your shareable ranking card' });
  const drawCard = () => drawRankCard(canvas, { cat, ranking, name: myName(), type, take, host: hostLabel() });
  const shareText = () => (type
    ? `I'm a ${type.label}. Rank your ${cat.title} and see how we match:`
    : `I ranked ${cat.title}. Rank yours and see how we match:`);

  const roastKey = `${cat.id}:${enc}`;
  const roastEl = h('p', {}, store.roasts[roastKey] || roast(cat, ranking));
  if (online && !store.roasts[roastKey]) {
    api.roast(cat.id, enc).then((r) => {
      if (!r?.roast) return;
      const keys = Object.keys(store.roasts);
      if (keys.length >= 20) delete store.roasts[keys[0]];
      store.roasts[roastKey] = r.roast;
      save();
      roastEl.textContent = r.roast;
    });
  }

  render(
    topbar(h('a', { class: 'linkbtn', href: '#/' }, 'All rankings')),
    h('div', { class: 'stack-lg' },
      waitingBanner(cat),
      h('section', { class: 'type' },
        h('div', { class: 'emoji' }, type ? type.emoji : cat.emoji),
        h('div', { class: 'label' }, type ? `Your ${cat.title} type` : 'Your ranking'),
        h('h1', {}, type ? type.label : cat.title),
        roastEl),
      (take || fact) && h('div', { class: 'take' },
        take && h('span', {}, 'Your hot take'), take,
        fact && h('div', { class: 'muted small', style: 'font-weight:600' }, fact)),
      h('section', { class: 'panel' },
        h('ol', { class: 'rank' }, ranking.map((id, i) => {
          const item = getItem(cat, id);
          return h('li', { class: i < 3 ? 'top' : '' },
            h('span', { class: 'n' }, i + 1), h('span', { class: 'emoji' }, item.emoji), h('span', {}, item.name));
        })),
        accuracyNote(saved),
        skipped.length ? h('p', { class: 'muted small', style: 'margin-top:12px' }, `Never tried: ${skipped.join(', ')}`) : null),
      saved && canExtend(saved) && h('section', { class: 'panel stack center' },
        h('h2', {}, 'Want it sharper?'),
        h('p', { class: 'muted' }, cat.items.length <= 12 ? `${BONUS_TAPS} more quick picks to lock in your last place and tighten the rest.` : `${BONUS_TAPS} more quick picks to tighten your ranking.`),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => {
          const state = extend(JSON.parse(JSON.stringify(saved)));
          write(sessionStorage, GAME_KEY, { catId: cat.id, state, history: [] });
          go(`#/play/${cat.id}`);
        } }, `Play ${BONUS_TAPS} more`)),
      h('section', { class: 'stack' },
        h('h2', {}, 'Now find out who matches you'),
        h('p', { class: 'muted' }, 'Send your link. They rank theirs, then you both see your match score.'),
        nameField(drawCard),
        h('div', { class: 'cardwrap' }, canvas),
        h('button', { class: 'btn', type: 'button', onclick: () => share({ canvas, text: shareText(), url: challengeUrl(cat), cat }) }, 'Challenge a friend'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn secondary', type: 'button', onclick: () => copyLink(challengeUrl(cat), cat) }, 'Copy link'),
          h('button', { class: 'btn secondary', type: 'button', onclick: () => saveImage(canvas, cat) }, 'Save image'))),
      online && h('section', { class: 'panel stack' },
        h('h2', {}, 'Got a whole table of people?'),
        h('p', { class: 'muted' }, 'One link for the family or the group chat. Everyone ranks, then you see who is most alike, who is the odd one out, and the group’s ranking.'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => startTable(cat) }, 'Start a table')),
      matchList(cat),
      h('div', { class: 'center' },
        h('a', { class: 'linkbtn', href: `#/play/${cat.id}`, onclick: () => write(sessionStorage, GAME_KEY, null) }, 'Redo this ranking'),
        ' · ',
        h('a', { class: 'linkbtn', href: '#/' }, 'Rank something else'))));
  drawCard();
}

// ---- Compare with someone's link -----------------------------------------
function viewVs(cat, theirs, theirName) {
  setTheme(cat);
  const mine = store.rankings[cat.id];

  if (!mine) {
    track('challenge_open', cat.id);
    return message(cat.emoji, `${theirName} ranked their ${cat.title}.`,
      'Rank yours to see how well you match. It takes 12 quick taps, and their picks stay hidden until you finish.',
      h('button', { class: 'btn', type: 'button', onclick: () => {
        write(sessionStorage, PENDING_KEY, { hash: location.hash, cat: cat.id, kind: 'vs', who: theirName });
        go(`#/play/${cat.id}`);
      } }, 'Start ranking'));
  }

  write(sessionStorage, PENDING_KEY, null);
  const enc = encodeRanking(cat, theirs);
  if (enc === encodeRanking(cat, mine) && theirName === (myName() || 'A friend')) {
    return message('🪞', 'This is your own link.', 'You match yourself 100%. Send it to someone else to get a real score.',
      h('a', { class: 'btn', href: `#/result/${cat.id}` }, 'Back to my ranking'));
  }

  const match = similarity(mine, theirs);
  if (!match) {
    return message('🤷', 'Not enough in common to compare.', `You and ${theirName} have tried fewer than 3 of the same things.`,
      h('a', { class: 'btn', href: `#/result/${cat.id}` }, 'See my ranking'));
  }

  const list = (store.matches[cat.id] ||= []);
  const existing = list.find((m) => m.name === theirName);
  if (existing) Object.assign(existing, { enc, percent: match.percent });
  else { list.push({ name: theirName, enc, percent: match.percent }); track('match_view', cat.id); }
  save();

  const v = verdict(match.percent);
  const label = (id) => { const i = getItem(cat, id); return `${i.emoji} ${i.name}`; };
  const posTheirs = new Map(theirs.map((id, i) => [id, i]));
  const posMine = new Map(mine.map((id, i) => [id, i]));
  const column = (title, ranking, other) => h('div', {},
    h('h3', {}, title),
    h('ol', {}, ranking.map((id, i) => h('li', { class: other.get(id) === i ? 'same' : '' },
      h('span', { class: 'n' }, i + 1), h('span', {}, getItem(cat, id).name)))));

  const canvas = h('canvas', { 'aria-label': 'Your shareable match card' });
  const drawCard = () => drawMatchCard(canvas, { cat, me: myName(), them: theirName, match, verdict: v, host: hostLabel() });
  const shareText = () => `${theirName} and I match ${match.percent}% on ${cat.title}. Rank yours and see how you compare:`;

  render(
    topbar(h('a', { class: 'linkbtn', href: `#/result/${cat.id}` }, 'My ranking')),
    h('div', { class: 'stack-lg' },
      h('section', { class: 'score' },
        h('p', { class: 'small', style: 'font-weight:800' }, `You + ${theirName}`),
        h('div', { class: 'pct' }, `${match.percent}%`),
        h('h1', {}, v.title),
        h('p', {}, v.line)),
      h('section', { class: 'panel' },
        h('ul', { class: 'facts' },
          match.love && h('li', {}, h('b', {}, 'You both love'), label(match.love)),
          match.clash && h('li', {}, h('b', {}, 'You will fight over'),
            `${label(match.clash.id)}: your #${match.clash.a}, their #${match.clash.b}`),
          match.hate && h('li', {}, h('b', {}, 'You both snub'), label(match.hate)),
          h('li', { class: 'muted small' }, `Based on the ${match.common} things you have both tried. Top and bottom picks count the most.`))),
      h('section', { class: 'panel versus' },
        column('You', mine, posTheirs),
        column(theirName, theirs, posMine)),
      h('section', { class: 'stack' },
        h('h2', {}, 'Keep it going'),
        nameField(drawCard),
        h('div', { class: 'cardwrap' }, canvas),
        h('button', { class: 'btn', type: 'button', onclick: () => share({ canvas, text: shareText(), url: challengeUrl(cat), cat }) }, 'Share this match'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => copyLink(challengeUrl(cat), cat, 'Your link is copied. Send it back!') }, `Send ${theirName} your link`)),
      matchList(cat)));
  drawCard();
}

// ---- Group table ----------------------------------------------------------
async function viewTable(id, stale) {
  message('⏳', 'Finding the table…');
  let table = await api.readTable(id);
  if (stale()) return;
  if (!table || table.error) {
    return message('🤷', 'That table could not be opened.', table ? 'The link may be wrong.' : 'Check your connection and try again.',
      h('a', { class: 'btn', href: '#/' }, 'Home'));
  }
  const cat = await findCategory(table.cat);
  if (stale()) return;
  if (!cat) return message('🤷', 'That table could not be opened.', null, h('a', { class: 'btn', href: '#/' }, 'Home'));
  setTheme(cat);

  const known = (store.tables[id] ||= { cat: cat.id, title: table.title, name: '' });
  known.title = table.title;
  save();

  const mine = store.rankings[cat.id];
  const count = table.members.length;
  if (!mine) {
    return message(cat.emoji, table.title,
      `${count} ${count === 1 ? 'person has' : 'people have'} ranked their ${cat.title}. Add yours to see who you match. Everyone's picks stay hidden until you finish.`,
      h('button', { class: 'btn', type: 'button', onclick: () => {
        write(sessionStorage, PENDING_KEY, { hash: `#/table/${id}`, cat: cat.id, kind: 'table', who: table.title });
        go(`#/play/${cat.id}`);
      } }, 'Start ranking'));
  }
  const pending = read(sessionStorage, PENDING_KEY);
  if (pending?.hash === `#/table/${id}`) write(sessionStorage, PENDING_KEY, null);

  const enc = encodeRanking(cat, mine);
  let me = known.name && table.members.find((m) => m.name === known.name);

  // Keep my entry current if I have redone the ranking since joining.
  if (me && me.enc !== enc) {
    const updated = await api.joinTable(id, store.mid, known.name, enc);
    if (stale()) return;
    if (updated && !updated.error) { table = updated; me = table.members.find((m) => m.name === known.name); }
  }

  if (!me) {
    const join = async () => {
      if (!needName()) return;
      const joined = await api.joinTable(id, store.mid, myName(), enc);
      if (joined?.status === 409) return toast(joined.error === 'name taken' ? 'Someone at this table already has that name.' : 'This table is full.');
      if (!joined || joined.error) return toast('Could not join. Try again in a moment.');
      known.name = myName();
      save();
      viewTable(id, stale);
    };
    return render(
      topbar(h('a', { class: 'linkbtn', href: `#/result/${cat.id}` }, 'My ranking')),
      h('section', { class: 'challenge stack' },
        h('div', { class: 'emoji' }, cat.emoji),
        h('h1', {}, table.title),
        h('p', { class: 'muted' }, `${count} ${count === 1 ? 'person is' : 'people are'} at this table. Add your name so they can see how you match.`),
        nameField(null, 'Your name, as the table will see it'),
        h('button', { class: 'btn', type: 'button', onclick: join }, 'Join the table')));
  }

  const members = table.members
    .map((m) => ({ name: m.name, enc: m.enc, ranking: decodeRanking(cat, m.enc) }))
    .filter((m) => m.ranking);
  const others = members.filter((m) => m.name !== me.name)
    .map((m) => ({ ...m, percent: similarity(mine, m.ranking)?.percent }))
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
  const sum = tableSummary(members);
  const url = `${baseUrl()}#/table/${id}`;
  const inviteText = `Join "${table.title}" on Pick Sides. Rank your ${cat.title} and see who matches:`;
  const pair = (p) => `${p.a} + ${p.b}: ${p.percent}%`;

  render(
    topbar(h('a', { class: 'linkbtn', href: `#/result/${cat.id}` }, 'My ranking')),
    h('div', { class: 'stack-lg' },
      h('header', { class: 'center' },
        h('div', { class: 'label-top' }, `${cat.emoji} ${cat.title}`),
        h('h1', {}, table.title),
        h('p', { class: 'muted' }, `${members.length} ${members.length === 1 ? 'person' : 'people'} so far`)),
      h('section', { class: 'stack' },
        h('button', { class: 'btn', type: 'button', onclick: () => share({ text: inviteText, url, cat }) }, 'Invite people'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn secondary', type: 'button', onclick: () => copyLink(url, cat) }, 'Copy link'),
          h('button', { class: 'btn secondary', type: 'button', onclick: () => viewTable(id, stale) }, 'Refresh'))),
      others.length
        ? h('section', { class: 'panel matches' },
            h('h2', {}, 'How you match'),
            others.map((m) => h('a', { href: `#/vs/${cat.code}/${m.enc}/${encodeURIComponent(m.name)}` },
              h('span', {}, m.name), h('span', { class: 'pct' }, m.percent == null ? '–' : `${m.percent}%`))))
        : h('section', { class: 'panel center stack' },
            h('h2', {}, 'You are the first one here'),
            h('p', { class: 'muted' }, 'Invite people and this fills in as they finish.')),
      sum.mostAlike && members.length >= 3 && h('section', { class: 'panel' },
        h('ul', { class: 'facts' },
          h('li', {}, h('b', {}, 'Most alike'), pair(sum.mostAlike)),
          sum.leastAlike && h('li', {}, h('b', {}, 'Least alike'), pair(sum.leastAlike)),
          sum.outlier && h('li', {}, h('b', {}, 'Odd one out'), `${sum.outlier.name}, who matches everyone else ${sum.outlier.average}% on average`))),
      members.length >= 2 && h('section', { class: 'panel' },
        h('h2', {}, "The table's ranking"),
        h('ol', { class: 'rank' }, sum.combined.map((itemId, i) => {
          const item = getItem(cat, itemId);
          return h('li', { class: i < 3 ? 'top' : '' },
            h('span', { class: 'n' }, i + 1), h('span', { class: 'emoji' }, item.emoji), h('span', {}, item.name));
        })))));
}

// ---- Make your own list ---------------------------------------------------
const LEADING_EMOJI = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator})*)\s*(.*)$/u;

function parseItems(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const m = line.match(LEADING_EMOJI);
    return m && m[2] ? { emoji: m[1], name: m[2].slice(0, 40) } : { emoji: '', name: line.slice(0, 40) };
  });
}

function viewNew() {
  if (!online) return viewHome();
  setTheme({ theme: CUSTOM_THEME });
  const title = h('input', { id: 'list-title', type: 'text', maxlength: 60, placeholder: 'Pizza toppings' });
  const items = h('textarea', { id: 'list-items', rows: 10, placeholder: 'Pepperoni\nMushrooms\n🍍 Pineapple\nSausage\nOlives' });
  const count = h('p', { class: 'muted small' }, 'One per line, 4 to 24 things. Start a line with an emoji to use it as the picture.');
  items.addEventListener('input', () => {
    const n = parseItems(items.value).length;
    count.textContent = `${n} ${n === 1 ? 'thing' : 'things'} so far. You need 4 to 24.`;
  });

  const create = async () => {
    const name = title.value.trim();
    const parsed = parseItems(items.value);
    if (!name) { title.focus(); return toast('Give your list a name.'); }
    if (parsed.length < 4 || parsed.length > 24) return toast('A list needs 4 to 24 things.');
    if (new Set(parsed.map((p) => p.name.toLowerCase())).size !== parsed.length) return toast('Two of those are the same.');
    const made = await api.createList(name, parsed);
    if (!made || made.error) return toast(made?.error || 'Could not save the list. Try again in a moment.');
    store.lists[made.id] = { title: made.title, items: made.items };
    save();
    go(`#/play/u-${made.id}`);
  };

  render(
    topbar(h('a', { class: 'linkbtn', href: '#/' }, 'Cancel')),
    h('div', { class: 'stack' },
      h('h1', {}, 'Make your own list'),
      h('p', { class: 'muted' }, 'You rank it first, then share it like any other. Anyone with the link can see the list, so keep names of real people out of it.'),
      h('div', { class: 'field' }, h('label', { for: 'list-title' }, 'What are you ranking?'), title),
      h('div', { class: 'field' }, h('label', { for: 'list-items' }, 'The things to rank'), items, count),
      h('button', { class: 'btn', type: 'button', onclick: create }, 'Create and start ranking')));
}

// ---- Stats (unlisted page: #/stats) ---------------------------------------
async function viewStats(stale) {
  setTheme(null);
  message('⏳', 'Loading the numbers…');
  const s = await api.stats();
  if (stale()) return;
  if (!s || s.error) return message('📊', 'No numbers yet.', 'The server is not connected.', h('a', { class: 'btn', href: '#/' }, 'Home'));
  const t = s.totals;
  const rate = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–');
  const row = (label, value) => h('a', {}, h('span', {}, label), h('span', { class: 'pct' }, value));
  render(
    topbar(h('a', { class: 'linkbtn', href: '#/' }, 'Home')),
    h('div', { class: 'stack-lg' },
      h('h1', {}, 'The numbers'),
      h('section', { class: 'panel matches' },
        h('h2', {}, 'The loop'),
        row('Rankings started', t.start || 0),
        row('Rankings finished', t.finish || 0),
        row('Finish rate', rate(t.finish || 0, t.start || 0)),
        row('Shares and link copies', (t.share || 0) + (t.copy_link || 0)),
        row('Shares per finished ranking', rate((t.share || 0) + (t.copy_link || 0), t.finish || 0)),
        row('Challenge links opened by new people', t.challenge_open || 0),
        row('Matches seen', t.match_view || 0)),
      h('section', { class: 'panel matches' },
        h('h2', {}, 'Groups and lists'),
        row('Tables created', s.tables),
        row('People who joined a table', t.table_join || 0),
        row('Custom lists made', s.lists)),
      h('section', { class: 'panel matches' },
        h('h2', {}, 'Stored rankings by category'),
        s.rankings.length ? s.rankings.map((r) => row(getCategory(r.cat)?.title || (r.cat.startsWith('u-') ? 'A custom list' : r.cat), r.n)) : h('p', { class: 'muted' }, 'None yet.'))));
}

// ---- Router ---------------------------------------------------------------
let routeToken = 0;
async function route() {
  const token = ++routeToken;
  const stale = () => token !== routeToken;
  const [view, a, b, c] = location.hash.replace(/^#\/?/, '').split('/');

  if (view === 'new') return viewNew();
  if (view === 'stats') return viewStats(stale);
  if (view === 'table' && /^[a-z0-9]{6,32}$/.test(a || '')) return viewTable(a, stale);

  if (view === 'play' || view === 'result' || view === 'vs') {
    let cat = await findCategory(a);
    if (stale()) return;
    if (cat && view === 'play') return viewPlay(cat);
    if (cat && view === 'result') {
      cat = await withCrowd(cat);
      if (stale()) return;
      return viewResult(cat);
    }
    if (view === 'vs') {
      const theirs = cat && decodeRanking(cat, b);
      let name = 'A friend';
      try { name = cleanName(decodeURIComponent(c || '')) || name; } catch { /* malformed name */ }
      if (theirs && theirs.length >= 3) return viewVs(cat, theirs, name);
      toast('That link looks broken.');
    }
  }
  viewHome();
}

window.addEventListener('hashchange', route);
route();
