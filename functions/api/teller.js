// Bezoekersteller van muurslot.com op Cloudflare. Telt bekeken pagina's zonder cookies en zonder IP-adressen op te slaan.
//
// POST /api/teller            één bekeken pagina of geopend filmpje, gestuurd door js/teller.js
// GET  /api/teller?dagen=30   de cijfers voor muurslot.com/teller, alleen met de juiste code
//
// Nodig in Cloudflare: een D1-database gekoppeld onder de naam DB, en de variabele TELLER_CODE
// (de code waarmee je de cijfers bekijkt). Een nieuwe code werkt na de volgende keer online zetten.
//
// Opslag in D1: tabel hits (elke telling is één regel) en tabel dagen (een afgelopen dag, eenmaal opgeteld en bewaard).
// Tellingen op muurslot.com horen bij de echte cijfers; tellingen op een andere naam (proefversies op pages.dev)
// krijgen proef = 1 en komen nooit in de echte cijfers.
// Tellen is alleen schrijven, nooit eerst lezen: twee bezoekers tegelijk zitten elkaar niet in de weg.

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

// ---------- tellen ----------

let schemaKlaar = null;
function schema(db) {
  if (!schemaKlaar) {
    schemaKlaar = db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY AUTOINCREMENT, proef INTEGER NOT NULL, dag TEXT NOT NULL, r TEXT NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS hits_dag ON hits (proef, dag)'),
      db.prepare('CREATE TABLE IF NOT EXISTS dagen (proef INTEGER NOT NULL, dag TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (proef, dag))'),
    ]).catch((e) => { schemaKlaar = null; throw e; });
  }
  return schemaKlaar;
}

async function tel(req, db, proef) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || ROBOT.test(ua)) return;
  const herkomst = req.headers.get('sec-fetch-site');
  if (herkomst && herkomst !== 'same-origin') return;
  const tekst = (await req.text()).slice(0, 2000);
  let g;
  try { g = JSON.parse(tekst); } catch { return; }
  const r = regelVan(g);
  if (!r) return;
  await db.prepare('INSERT INTO hits (proef, dag, r) VALUES (?1, ?2, ?3)').bind(proef, dagVan(new Date()), JSON.stringify(r)).run();
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

async function telDag(db, proef, dag) {
  const uit = nieuweDag();
  const { results } = await db.prepare('SELECT r FROM hits WHERE proef = ?1 AND dag = ?2').bind(proef, dag).all();
  for (const rij of results) {
    let r;
    try { r = JSON.parse(rij.r); } catch { continue; }
    if (r) voegToe(uit, r);
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

async function zelfdeCode(a, b) {
  const sha = async (x) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(x))));
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let verschil = 0;
  for (let i = 0; i < x.length; i++) verschil |= x[i] ^ y[i];
  return verschil === 0;
}

async function cijfers(req, env, db, proef) {
  const code = String(env.TELLER_CODE ?? '').trim();
  if (!code) return antwoord({ fout: 'geen-code' }, 503);
  if (!(await zelfdeCode((req.headers.get('x-teller-code') || '').trim(), code))) return antwoord({ fout: 'code' }, 401);

  const n = Math.min(Math.max(parseInt(new URL(req.url).searchParams.get('dagen'), 10) || 30, 1), 400);
  const vandaag = dagVan(new Date());
  const dagen = reeks(vandaag, n);
  const gisteren = reeks(vandaag, 2)[0];
  const eerste = dagen[0];

  // welke dagen tellingen hebben, en welke al opgeteld zijn: twee vragen in plaats van een vraag per dag
  const [metTellingen, opgeteld] = await Promise.all([
    db.prepare('SELECT DISTINCT dag FROM hits WHERE proef = ?1 AND dag >= ?2').bind(proef, eerste).all(),
    db.prepare('SELECT dag, data FROM dagen WHERE proef = ?1 AND dag >= ?2').bind(proef, eerste).all(),
  ]);
  const heeft = new Set(metTellingen.results.map((x) => x.dag));
  const bewaard = new Map(opgeteld.results.map((x) => [x.dag, x.data]));

  const uitkomst = await inPartijen(dagen, 12, async (dag) => {
    const voorbij = dag < gisteren;   // gisteren en vandaag tellen we altijd opnieuw
    if (voorbij && bewaard.has(dag)) {
      try { return { dag, ...JSON.parse(bewaard.get(dag)) }; } catch { /* dan opnieuw optellen */ }
    }
    if (!heeft.has(dag)) return { dag, ...nieuweDag() };
    const telling = await telDag(db, proef, dag);
    if (voorbij) {
      await db.prepare('INSERT OR REPLACE INTO dagen (proef, dag, data) VALUES (?1, ?2, ?3)').bind(proef, dag, JSON.stringify(telling)).run();
    }
    return { dag, ...telling };
  });
  return antwoord({ vandaag, dagen: uitkomst });
}

export async function onRequest({ request, env }) {
  const req = request;
  if (req.method !== 'POST' && req.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
  const db = env.DB;
  if (!db) {
    console.error('teller: geen database gekoppeld (DB)');
    return req.method === 'POST' ? new Response(null, { status: 500, headers: { 'cache-control': 'no-store' } }) : antwoord({ fout: 'opslag' }, 500);
  }
  const host = new URL(req.url).hostname;
  const proef = /(^|\.)muurslot\.com$/i.test(host) ? 0 : 1;
  if (req.method === 'POST') {
    // het script kijkt niet naar het antwoord; 500 is alleen om te kunnen zien dat het opslaan misging
    try { await schema(db); await tel(req, db, proef); } catch (e) {
      console.error('teller: tellen mislukt', e && e.message);
      return new Response(null, { status: 500, headers: { 'cache-control': 'no-store' } });
    }
    return leeg();
  }
  try { await schema(db); return await cijfers(req, env, db, proef); } catch (e) {
    console.error('teller: cijfers mislukt', e && e.message);
    return antwoord({ fout: 'opslag' }, 500);
  }
}
