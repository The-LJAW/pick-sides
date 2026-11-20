import { CATEGORIES, getCategory, getCategoryByCode, getItem } from './data.js';
import { createRanker, currentPair, choose, skip, isDone, result, remaining } from './ranker.js';
import { encodeRanking, decodeRanking, similarity, verdict, archetype, hotTakeText, roast } from './match.js';
import { drawRankCard, drawMatchCard, canvasToBlob } from './card.js';

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

// ---- Saved state: stays on this device, nothing is sent anywhere. --------
const KEY = 'picksides.v1';
const GAME_KEY = 'picksides.game';
const PENDING_KEY = 'picksides.pending';

function read(storage, key) {
  try { return JSON.parse(storage.getItem(key)); } catch { return null; }
}
function write(storage, key, value) {
  try { value == null ? storage.removeItem(key) : storage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

const store = { name: '', rankings: {}, skipped: {}, matches: {}, ...(read(localStorage, KEY) || {}) };
const save = () => write(localStorage, KEY, store);

// ---- Helpers --------------------------------------------------------------
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
const go = (hash) => { location.hash = hash; };
const baseUrl = () => `${location.origin}${location.pathname}`;
const hostLabel = () => (location.host + location.pathname).replace(/\/(index\.html)?$/, '') || 'picksides';

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
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function challengeUrl(cat) {
  const enc = encodeRanking(cat, store.rankings[cat.id]);
  return `${baseUrl()}#/vs/${cat.code}/${enc}/${encodeURIComponent(cleanName(store.name) || 'A friend')}`;
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

// Native share sheet with the image where the device supports it,
// otherwise fall back to copying the link.
async function shareCard(canvas, text, url) {
  const blob = await canvasToBlob(canvas);
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

async function saveImage(canvas) {
  const blob = await canvasToBlob(canvas);
  if (!blob) return;
  const a = h('a', { href: URL.createObjectURL(blob), download: 'pick-sides.png' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const topbar = (right) => h('div', { class: 'topbar' }, h('a', { class: 'brand', href: '#/' }, 'Pick Sides'), right);

function matchList(catId) {
  const list = store.matches[catId] || [];
  if (!list.length) return null;
  const cat = getCategory(catId);
  return h('section', { class: 'panel matches' },
    h('h2', {}, `Your ${cat.title} matches`),
    [...list].sort((a, b) => b.percent - a.percent).map((m) =>
      h('a', { href: `#/vs/${cat.code}/${m.enc}/${encodeURIComponent(m.name)}` },
        h('span', {}, m.name), h('span', { class: 'pct' }, `${m.percent}%`))));
}

function render(...nodes) {
  document.onkeydown = null;
  app.replaceChildren(...nodes.flat().filter(Boolean));
  window.scrollTo(0, 0);
}

// ---- Home -----------------------------------------------------------------
function viewHome() {
  setTheme(null);
  render(
    topbar(),
    h('div', { class: 'stack-lg' },
      h('header', { class: 'hero' },
        h('h1', {}, 'Two options. One tap. Pick a side.'),
        h('p', {}, 'Rank your favourites in about 30 taps, then find out who matches you and who is completely wrong.')),
      h('div', { class: 'stack' }, CATEGORIES.map((cat) => {
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
      })),
      CATEGORIES.map((cat) => matchList(cat.id)),
      h('p', { class: 'muted small center' }, 'No sign-up. Your rankings stay on your device unless you share a link.')));
}

// ---- Game -----------------------------------------------------------------
function viewPlay(cat) {
  setTheme(cat);
  let game = read(sessionStorage, GAME_KEY);
  if (!game || game.catId !== cat.id || isDone(game.state)) {
    game = { catId: cat.id, state: createRanker(cat.items.map((i) => i.id)), history: [] };
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
    save();
    const pending = read(sessionStorage, PENDING_KEY);
    write(sessionStorage, PENDING_KEY, null);
    go(pending && pending.startsWith(`#/vs/${cat.code}/`) ? pending : `#/result/${cat.id}`);
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
        h('h1', {}, 'Which do you want more?'),
        h('p', { class: 'muted small' }, cat.title)),
      h('div', { class: 'duel' }, [a, b].map((item, i) => h('div', { class: 'side' },
        buttons[i],
        h('button', { class: 'linkbtn', type: 'button', onclick: () => !busy && act((s) => skip(s, item.id)) }, 'Never tried it')))),
      h('div', { class: 'game-foot' },
        h('button', { class: 'linkbtn', type: 'button', disabled: !game.history.length, onclick: undo }, '← Undo'),
        h('span', { class: 'muted small' }, left === 1 ? 'Last one!' : `${left} taps left, at most`)));

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
function nameField(onChange) {
  const input = h('input', { id: 'name', type: 'text', maxlength: 24, autocomplete: 'given-name', placeholder: 'First name or nickname', value: store.name || '' });
  input.addEventListener('input', () => {
    store.name = cleanName(input.value);
    save();
    onChange();
  });
  return h('div', { class: 'field' }, h('label', { for: 'name' }, 'Your name, for your card and link'), input);
}

function viewResult(cat) {
  const ranking = store.rankings[cat.id];
  if (!ranking) return go(`#/play/${cat.id}`);
  setTheme(cat);
  const type = archetype(cat, ranking);
  const take = hotTakeText(cat, ranking);
  const skipped = (store.skipped[cat.id] || []).map((id) => getItem(cat, id)?.name).filter(Boolean);

  const canvas = h('canvas', { 'aria-label': 'Your shareable ranking card' });
  const drawCard = () => drawRankCard(canvas, { cat, ranking, name: cleanName(store.name), type, take, host: hostLabel() });
  const shareText = () => `I'm a ${type.label}. Rank your ${cat.title} and see how we match:`;

  render(
    topbar(h('a', { class: 'linkbtn', href: '#/' }, 'All rankings')),
    h('div', { class: 'stack-lg' },
      h('section', { class: 'type' },
        h('div', { class: 'emoji' }, type.emoji),
        h('div', { class: 'label' }, `Your ${cat.title} type`),
        h('h1', {}, type.label),
        h('p', {}, roast(cat, ranking))),
      take && h('div', { class: 'take' }, h('span', {}, 'Your hot take'), take),
      h('section', { class: 'panel' },
        h('ol', { class: 'rank' }, ranking.map((id, i) => {
          const item = getItem(cat, id);
          return h('li', { class: i < 3 ? 'top' : '' },
            h('span', { class: 'n' }, i + 1), h('span', { class: 'emoji' }, item.emoji), h('span', {}, item.name));
        })),
        skipped.length ? h('p', { class: 'muted small', style: 'margin-top:12px' }, `Never tried: ${skipped.join(', ')}`) : null),
      h('section', { class: 'stack' },
        h('h2', {}, 'Now find out who matches you'),
        h('p', { class: 'muted' }, 'Send your link. They rank theirs, then you both see your match score.'),
        nameField(drawCard),
        h('div', { class: 'cardwrap' }, canvas),
        h('button', { class: 'btn', type: 'button', onclick: () => shareCard(canvas, shareText(), challengeUrl(cat)) }, 'Challenge a friend'),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn secondary', type: 'button', onclick: async () => { await copyText(challengeUrl(cat)); toast('Link copied!'); } }, 'Copy link'),
          h('button', { class: 'btn secondary', type: 'button', onclick: () => saveImage(canvas) }, 'Save image'))),
      matchList(cat.id),
      h('div', { class: 'center' },
        h('a', { class: 'linkbtn', href: `#/play/${cat.id}` }, 'Redo this ranking'),
        ' · ',
        h('a', { class: 'linkbtn', href: '#/' }, 'Rank something else'))));
  drawCard();
}

// ---- Compare with someone's link -----------------------------------------
function viewVs(cat, theirs, theirName) {
  setTheme(cat);
  const mine = store.rankings[cat.id];

  if (!mine) {
    return render(
      topbar(),
      h('section', { class: 'challenge stack' },
        h('div', { class: 'emoji' }, cat.emoji),
        h('h1', {}, `${theirName} ranked their ${cat.title}.`),
        h('p', { class: 'muted' }, 'Rank yours to see how well you match. It takes about 30 taps, and their picks stay hidden until you finish.'),
        h('button', { class: 'btn', type: 'button', onclick: () => { write(sessionStorage, PENDING_KEY, location.hash); go(`#/play/${cat.id}`); } }, 'Start ranking')));
  }

  const enc = encodeRanking(cat, theirs);
  if (enc === encodeRanking(cat, mine) && theirName === (cleanName(store.name) || 'A friend')) {
    return render(
      topbar(),
      h('section', { class: 'challenge stack' },
        h('div', { class: 'emoji' }, '🪞'),
        h('h1', {}, 'This is your own link.'),
        h('p', { class: 'muted' }, 'You match yourself 100%. Send it to someone else to get a real score.'),
        h('a', { class: 'btn', href: `#/result/${cat.id}` }, 'Back to my ranking')));
  }

  const match = similarity(mine, theirs);
  if (!match) {
    return render(
      topbar(),
      h('section', { class: 'challenge stack' },
        h('div', { class: 'emoji' }, '🤷'),
        h('h1', {}, 'Not enough in common to compare.'),
        h('p', { class: 'muted' }, `You and ${theirName} have tried fewer than 3 of the same things.`),
        h('a', { class: 'btn', href: `#/result/${cat.id}` }, 'See my ranking')));
  }

  const list = (store.matches[cat.id] ||= []);
  const existing = list.find((m) => m.name === theirName);
  if (existing) Object.assign(existing, { enc, percent: match.percent });
  else list.push({ name: theirName, enc, percent: match.percent });
  save();

  const v = verdict(match.percent);
  const name = (id) => { const i = getItem(cat, id); return `${i.emoji} ${i.name}`; };
  const posTheirs = new Map(theirs.map((id, i) => [id, i]));
  const column = (title, ranking, other) => h('div', {},
    h('h3', {}, title),
    h('ol', {}, ranking.map((id, i) => h('li', { class: other.get(id) === i ? 'same' : '' },
      h('span', { class: 'n' }, i + 1), h('span', {}, getItem(cat, id).name)))));
  const posMine = new Map(mine.map((id, i) => [id, i]));

  const canvas = h('canvas', { 'aria-label': 'Your shareable match card' });
  const drawCard = () => drawMatchCard(canvas, { cat, me: cleanName(store.name), them: theirName, match, verdict: v, host: hostLabel() });
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
          match.love && h('li', {}, h('b', {}, 'You both love'), name(match.love)),
          match.clash && h('li', {}, h('b', {}, 'You will fight over'),
            `${name(match.clash.id)}: your #${match.clash.a}, their #${match.clash.b}`),
          match.hate && h('li', {}, h('b', {}, 'You both snub'), name(match.hate)),
          h('li', { class: 'muted small' }, `Based on the ${match.common} things you have both tried. Top and bottom picks count the most.`))),
      h('section', { class: 'panel versus' },
        column('You', mine, posTheirs),
        column(theirName, theirs, posMine)),
      h('section', { class: 'stack' },
        h('h2', {}, 'Keep it going'),
        nameField(drawCard),
        h('div', { class: 'cardwrap' }, canvas),
        h('button', { class: 'btn', type: 'button', onclick: () => shareCard(canvas, shareText(), challengeUrl(cat)) }, 'Share this match'),
        h('button', { class: 'btn secondary', type: 'button', onclick: async () => { await copyText(challengeUrl(cat)); toast('Your link is copied. Send it back!'); } }, `Send ${theirName} your link`)),
      matchList(cat.id)));
  drawCard();
}

// ---- Router ---------------------------------------------------------------
function route() {
  const [view, a, b, c] = location.hash.replace(/^#\/?/, '').split('/');
  if (view === 'play' && getCategory(a)) return viewPlay(getCategory(a));
  if (view === 'result' && getCategory(a)) return viewResult(getCategory(a));
  if (view === 'vs') {
    const cat = getCategoryByCode(a);
    const theirs = cat && decodeRanking(cat, b);
    let name = 'A friend';
    try { name = cleanName(decodeURIComponent(c || '')) || name; } catch { /* malformed name */ }
    if (theirs && theirs.length >= 3) return viewVs(cat, theirs, name);
    toast('That link looks broken.');
  }
  viewHome();
}

window.addEventListener('hashchange', route);
route();
