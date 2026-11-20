// Draws the shareable images on a canvas (1080x1350, the 4:5 size feeds like).

import { getItem } from './data.js?v=7';

const W = 1080;
const H = 1350;
const FONT = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function setup(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  return ctx;
}

const font = (ctx, size, weight = 800) => { ctx.font = `${weight} ${size}px ${FONT}`; };

// Draw one line, shrinking the font until it fits.
function fit(ctx, text, x, y, maxWidth, size, weight = 800, min = 24) {
  let s = size;
  font(ctx, s, weight);
  while (ctx.measureText(text).width > maxWidth && s > min) font(ctx, --s, weight);
  ctx.fillText(text, x, y, maxWidth);
}

// Draw wrapped text. Anything past maxLines is squeezed onto the last line.
function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const lines = [''];
  for (const word of text.split(/\s+/)) {
    const cur = lines[lines.length - 1];
    const next = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(next).width > maxWidth && lines.length < maxLines) lines.push(word);
    else lines[lines.length - 1] = next;
  }
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight, maxWidth));
}

function frame(ctx, cat, headHeight) {
  const t = cat.theme;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, headHeight);
  g.addColorStop(0, t.accent);
  g.addColorStop(1, t.accent2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, headHeight);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  font(ctx, 30);
  ctx.textAlign = 'left';
  ctx.fillText('P I C K   S I D E S', 72, 96);
  ctx.textAlign = 'right';
  ctx.fillText(cat.title.toUpperCase(), W - 72, 96);
  ctx.textAlign = 'left';
}

function footer(ctx, cat, line, host) {
  ctx.fillStyle = cat.theme.ink;
  ctx.fillRect(0, H - 140, W, 140);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  fit(ctx, line, W / 2, H - 82, W - 144, 40);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  fit(ctx, host, W / 2, H - 36, W - 144, 30, 700);
  ctx.textAlign = 'left';
}

export function drawRankCard(canvas, { cat, ranking, name, type, take, host }) {
  const ctx = setup(canvas);
  const t = cat.theme;
  frame(ctx, cat, 380);

  ctx.fillStyle = '#fff';
  fit(ctx, name ? `${name}'s ${cat.title}` : `My ${cat.title}`, 72, 210, W - 144, 72);
  if (type) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    font(ctx, 34, 700);
    ctx.fillText('CERTIFIED', 72, 282);
    ctx.fillStyle = '#fff';
    fit(ctx, `${type.emoji} ${type.label}`, 72, 340, W - 144, 56);
  }

  const top = ranking.slice(0, 5);
  const rowH = 118;
  let y = 480;
  top.forEach((id, i) => {
    const item = getItem(cat, id);
    ctx.fillStyle = t.accent;
    font(ctx, 68);
    ctx.fillText(String(i + 1), 72, y);
    font(ctx, 68);
    ctx.fillStyle = t.ink;
    ctx.fillText(item.emoji, 160, y);
    fit(ctx, item.name, 270, y - 4, W - 342, 56);
    y += rowH;
  });

  y = 480 + 5 * rowH - 20;
  ctx.fillStyle = t.ink;
  ctx.globalAlpha = 0.14;
  ctx.fillRect(72, y - 50, W - 144, 3);
  ctx.globalAlpha = 1;

  if (ranking.length > 5) {
    const last = getItem(cat, ranking[ranking.length - 1]);
    ctx.globalAlpha = 0.7;
    fit(ctx, `Dead last: ${last.emoji} ${last.name}`, 72, y + 10, W - 144, 40, 700);
    ctx.globalAlpha = 1;
    y += 62;
  }
  if (take) {
    ctx.fillStyle = t.accent;
    fit(ctx, `Hot take: ${take}`, 72, y + 10, W - 144, 40);
  }

  footer(ctx, cat, 'Think you can match me? Rank yours:', host);
}

export function drawMatchCard(canvas, { cat, me, them, match, verdict, host }) {
  const ctx = setup(canvas);
  const t = cat.theme;
  frame(ctx, cat, 300);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  fit(ctx, `${me || 'Me'} + ${them}`, W / 2, 220, W - 144, 76);

  ctx.fillStyle = t.accent;
  font(ctx, 330);
  ctx.fillText(`${match.percent}%`, W / 2, 640);
  ctx.fillStyle = t.ink;
  fit(ctx, verdict.title, W / 2, 750, W - 144, 80);
  ctx.globalAlpha = 0.7;
  font(ctx, 38, 700);
  wrap(ctx, verdict.line, W / 2, 815, W - 200, 50, 2);
  ctx.globalAlpha = 1;

  let y = 980;
  const fact = (label, text) => {
    ctx.fillStyle = t.accent;
    fit(ctx, label, W / 2, y, W - 144, 28);
    ctx.fillStyle = t.ink;
    fit(ctx, text, W / 2, y + 52, W - 144, 46);
    y += 112;
  };
  if (match.love) { const i = getItem(cat, match.love); fact('B O T H   L O V E', `${i.emoji} ${i.name}`); }
  if (match.clash) { const i = getItem(cat, match.clash.id); fact('F I G H T   O V E R', `${i.emoji} ${i.name}`); }
  else if (match.hate) { const i = getItem(cat, match.hate); fact('B O T H   S N U B', `${i.emoji} ${i.name}`); }

  footer(ctx, cat, 'How do you match? Rank yours:', host);
}

export const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
