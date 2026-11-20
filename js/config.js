// Address of the Pick Sides server (the Cloudflare Worker in /worker).
// While this is empty the live site runs without server features:
// no counters, crowd data, AI roasts, tables or make-your-own lists.
const LIVE_API = 'https://pick-sides-api.levi-joseph-andrew-wilson.workers.dev';

const local = ['localhost', '127.0.0.1'].includes(location.hostname);
export const API = local ? 'http://localhost:8787' : LIVE_API;

// Use real crowd rankings for hot takes once this many people have ranked a category.
export const CROWD_MIN = 25;
