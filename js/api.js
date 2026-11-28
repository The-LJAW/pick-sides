// Thin client for the Pick Sides server. Every call resolves to the JSON reply,
// to { error, status } when the server says no, or to null when it is
// unreachable or switched off, so the app always keeps working without it.

import { API } from './config.js?v=12';

export const online = !!API;

async function call(path, body, timeout = 5000) {
  if (!API) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    });
    const data = await res.json().catch(() => null);
    return res.ok ? data : { error: data?.error || 'error', status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Anonymous counter. Fire and forget.
export function track(name, cat) {
  if (!API) return;
  fetch(`${API}/api/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, cat }),
    keepalive: true,
  }).catch(() => {});
}

export const api = {
  saveRanking: (rid, cat, enc) => call('/api/rankings', { rid, cat, enc }),
  crowd: (cat) => call(`/api/crowd/${cat}`, null, 1500),
  createTable: (cat, title) => call('/api/tables', { cat, title }),
  readTable: (id) => call(`/api/tables/${id}`),
  joinTable: (id, mid, name, enc) => call(`/api/tables/${id}/members`, { mid, name, enc }),
  createList: (title, items) => call('/api/lists', { title, items }),
  readList: (id) => call(`/api/lists/${id}`),
  roast: (cat, enc) => call('/api/roast', { cat, enc }, 25000),
  checkout: (id, returnTo) => call(`/api/tables/${id}/checkout`, { returnTo }, 15000),
  confirm: (id, session) => call(`/api/tables/${id}/confirm`, { session }, 15000),
  stats: () => call('/api/stats'),
};
