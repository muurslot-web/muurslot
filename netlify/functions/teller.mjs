// Bezoekersteller van muurslot.com. Telt bekeken pagina's zonder cookies en zonder IP-adressen op te slaan.
//
// POST /api/teller            één bekeken pagina of geopend filmpje, gestuurd door js/teller.js
// GET  /api/teller?dagen=30   de cijfers voor muurslot.com/teller, alleen met de juiste code
//
// Nodig in Netlify (Environment variables): TELLER_CODE, de code waarmee je de cijfers bekijkt.
// Een nieuwe of gewijzigde code werkt pas nadat de site daarna opnieuw online is gezet.
//
// Opslag in Netlify Blobs: 'teller' voor muurslot.com, 'teller-proef' voor proefversies op netlify.app.
// Elke telling is een eigen regel h/<dag>/<volgnummer>~<gegevens>, met de gegevens in de naam zelf.
// Tellen is dus alleen schrijven, nooit eerst lezen: twee bezoekers tegelijk zitten elkaar niet in de weg.
// Een dag die voorbij is, wordt bij het opvragen één keer opgeteld en bewaard als d/<dag>.

import { getStore } from '@netlify/blobs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const config = { path: '/api/teller' };

const TALEN = new Set(['nl', 'en', 'de', 'es', 'zh']);
const APPARATEN = new Set(['telefoon', 'tablet', 'computer']);
const FILMS = new Set(['bakfiets', 'fiets', 'motor', 'boot', 'terras']);

// zoekmachines, linkvoorbeelden en andere programma's tellen niet mee (Cubot is een telefoonmerk)
const ROBOT = /(?<!cu)bot|crawl|spider|slurp|scrap|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|facebookexternalhit|whatsapp|telegram|curl|wget|python|httpclient|okhttp|node-fetch|undici|axios|go-http|java\/|libwww|phantom|selenium|puppeteer|playwright/i;

// de site waar een bezoeker vandaan kwam, als naam die je herkent
const BRONNEN = [
  [/(^|\.)gemini\.google\./, 'Gemini'],
  [/^mail\.google\.|^com\.google\.android\.gm$/, 'Gmail'],
  [/google/, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)ecosia\.org$/, 'Ecosia'],
  [/(^|\.)startpage\.com$/, 'Startpage'],
  [/(^|\.)yahoo\./, 'Yahoo'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$|^com\.facebook\./, 'Facebook'],
  [/(^|\.)instagram\.com$|^com\.instagram\./, 'Instagram'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$|^com\.linkedin\./, 'LinkedIn'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)pinterest\./, 'Pinterest'],
  [/(^|\.)reddit\.com$/, 'Reddit'],
  [/(^|\.)marktplaats\.nl$/, 'Marktplaats'],
  [/whatsapp/, 'WhatsApp'],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)claude\.ai$/, 'Claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'Copilot'],
  [/(^|\.)github\.com$/, 'GitHub'],
  [/(^|\.)netlify\.app$/, 'Netlify'],
];

// datum in Nederlandse tijd, zoals 2026-12-11
const DATUM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
const dagVan = (d) => DATUM.format(d);

// de n dagen tot en met vandaag, oudste eerst (gerekend op de kalender, dus zomer- en wintertijd maken niets uit)
function reeks(vandaag, n) {
  const [j, m, d] = vandaag.split('-').map(Number);
  const nul = Date.UTC(j, m - 1, d);
  const r = [];
  for (let i = n - 1; i >= 0; i--) r.push(new Date(nul - i * 86400000).toISOString().slice(0, 10));
  return r;
}

function antwoord(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

const leeg = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

// ---------- tellen ----------

function schoonPad(p) {
  if (typeof p !== 'string') return null;
  p = p.split(/[?#]/)[0].slice(0, 200);
  try { p = decodeURIComponent(p); } catch { /* dan zoals het is */ }
  p = p.toLowerCase().replace(/[^a-z0-9/._~-]/g, '').replace(/\/{2,}/g, '/').slice(0, 100);
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (/^\/(en|de|es|zh)$/.test(p)) p += '/';
  return p;
}

function bronVanSite(host) {
  if (typeof host !== 'string') return null;
  host = host.toLowerCase().slice(0, 120);
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  for (const [patroon, naam] of BRONNEN) if (patroon.test(host)) return naam;
  return host.replace(/^www\./, '').slice(0, 60);
}

// maakt van wat het script stuurt een korte, nette regel; onbruikbaar = null
function regelVan(g) {
  if (!g || typeof g !== 'object' || Array.isArray(g)) return null;
  const r = {
    t: TALEN.has(g.t) ? g.t : 'nl',
    a: APPARATEN.has(g.a) ? g.a : 'computer',
  };
  if (g.f !== undefined) {
    if (!FILMS.has(g.f)) return null;
    r.k = 'f';
    r.f = g.f;
    return r;
  }
  const p = schoonPad(g.p);
  if (!p) return null;
  r.k = g.n === 1 ? 'n' : 'p';
  r.p = p;
  if (g.b === 1) {
    r.b = 1;
    const code = (v) => typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) : '';
    const link = code(g.l), dealer = code(g.d);
    if (link) r.l = link;
    else if (dealer) r.d = dealer;
    else {
      const site = bronVanSite(g.r);
      if (site) r.s = site;
    }
  }
  return r;
}

async function tel(req, winkel) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || ROBOT.test(ua)) return;
  const herkomst = req.headers.get('sec-fetch-site');
  if (herkomst && herkomst !== 'same-origin') return;
  const tekst = (await req.text()).slice(0, 2000);
  let g;
  try { g = JSON.parse(tekst); } catch { return; }
  const r = regelVan(g);
  if (!r) return;
  const sleutel = 'h/' + dagVan(new Date()) + '/' + Date.now().toString(36) + randomBytes(3).toString('hex')
    + '~' + Buffer.from(JSON.stringify(r)).toString('base64url');
  await winkel.set(sleutel, '1');
}

// ---------- optellen ----------

function nieuweDag() {
  return { bekeken: 0, bezoeken: 0, paginas: {}, bronnen: {}, links: {}, dealers: {}, talen: {}, apparaten: {}, films: {}, nietGevonden: {} };
}

function plus(lijst, naam) {
  if (!naam) return;
  // een lijst groeit niet eindeloos: na 300 verschillende namen gaat de rest onder 'overig'
  if (!(naam in lijst) && Object.keys(lijst).length >= 300) naam = 'overig';
  lijst[naam] = (lijst[naam] || 0) + 1;
}

function voegToe(dag, r) {
  if (r.k === 'f') { plus(dag.films, r.f); return; }
  if (r.k === 'n') plus(dag.nietGevonden, r.p);
  else { dag.bekeken++; plus(dag.paginas, r.p); }
  if (r.b) {
    dag.bezoeken++;
    if (r.l) plus(dag.links, r.l);
    else if (r.d) plus(dag.dealers, r.d);
    else plus(dag.bronnen, r.s || 'Direct');
    plus(dag.talen, r.t);
    plus(dag.apparaten, r.a);
  }
}

function regelUitSleutel(sleutel) {
  const i = sleutel.indexOf('~');
  if (i < 0) return null;
  try { return JSON.parse(Buffer.from(sleutel.slice(i + 1), 'base64url').toString('utf8')); } catch { return null; }
}

async function telDag(winkel, dag) {
  const uit = nieuweDag();
  for await (const blad of winkel.list({ prefix: 'h/' + dag + '/', paginate: true })) {
    for (const { key } of blad.blobs) {
      const r = regelUitSleutel(key);
      if (r) voegToe(uit, r);
    }
  }
  return uit;
}

// voert taak uit voor elk item, steeds een paar tegelijk
async function inPartijen(items, tegelijk, taak) {
  const uit = new Array(items.length);
  let volgende = 0;
  const werkers = Array.from({ length: Math.min(tegelijk, items.length) }, async () => {
    while (volgende < items.length) {
      const i = volgende++;
      uit[i] = await taak(items[i]);
    }
  });
  await Promise.all(werkers);
  return uit;
}

function zelfdeCode(a, b) {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
}

async function cijfers(req, winkel) {
  const code = String(globalThis.Netlify?.env?.get?.('TELLER_CODE') ?? process.env.TELLER_CODE ?? '').trim();
  if (!code) return antwoord({ fout: 'geen-code' }, 503);
  if (!zelfdeCode((req.headers.get('x-teller-code') || '').trim(), code)) return antwoord({ fout: 'code' }, 401);

  const n = Math.min(Math.max(parseInt(new URL(req.url).searchParams.get('dagen'), 10) || 30, 1), 400);
  const vandaag = dagVan(new Date());
  const dagen = reeks(vandaag, n);
  const gisteren = reeks(vandaag, 2)[0];

  // welke dagen tellingen hebben, en welke al opgeteld zijn: twee lijsten in plaats van een vraag per dag
  const [metTellingen, opgeteld] = await Promise.all([
    winkel.list({ prefix: 'h/', directories: true }),
    winkel.list({ prefix: 'd/' }),
  ]);
  const heeft = new Set(metTellingen.directories.map((d) => d.replace(/^h\//, '').replace(/\/$/, '')));
  const bewaard = new Set(opgeteld.blobs.map((b) => b.key.replace(/^d\//, '')));

  const uitkomst = await inPartijen(dagen, 12, async (dag) => {
    const voorbij = dag < gisteren;   // gisteren en vandaag tellen we altijd opnieuw
    if (voorbij && bewaard.has(dag)) {
      const oud = await winkel.get('d/' + dag, { type: 'json' });
      if (oud) return { dag, ...oud };
    }
    if (!heeft.has(dag)) return { dag, ...nieuweDag() };
    const telling = await telDag(winkel, dag);
    if (voorbij) await winkel.setJSON('d/' + dag, telling);
    return { dag, ...telling };
  });
  return antwoord({ vandaag, dagen: uitkomst });
}

export default async (req) => {
  const host = new URL(req.url).hostname;
  const winkel = getStore(/(^|\.)muurslot\.com$/i.test(host) ? 'teller' : 'teller-proef');
  if (req.method === 'POST') {
    // het script kijkt niet naar het antwoord; 500 is alleen om te kunnen zien dat het opslaan misging
    try { await tel(req, winkel); } catch (e) {
      console.error('teller: tellen mislukt', e && e.message);
      return new Response(null, { status: 500, headers: { 'cache-control': 'no-store' } });
    }
    return leeg();
  }
  if (req.method === 'GET') {
    try { return await cijfers(req, winkel); } catch (e) {
      console.error('teller: cijfers mislukt', e && e.message);
      return antwoord({ fout: 'opslag' }, 500);
    }
  }
  return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
};
