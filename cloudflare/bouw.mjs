// Bouwt de site voor Cloudflare Pages: `node cloudflare/bouw.mjs`
//
// 1. Zet alleen wat online hoort te staan in de map dist (dus niet talen/, netlify/, cloudflare/, functions/,
//    package.json en wat daarbij hoort). Cloudflare kent geen 404-regel voor zulke mappen, daarom blijven ze er gewoon uit.
// 2. Maakt cloudflare/sjablonen.json: de vaste tekst van de huurovereenkomst in elke taal, uit js/gedeeld.js en js/taal/*.js.
//    De formulierfunctie gebruikt die om te controleren dat een meegestuurde overeenkomst echt onze tekst is.
//    Cloudflare laat geen code uit een tekst uitvoeren, daarom doen we dat hier, bij het bouwen.
//
// In Cloudflare Pages: bouwopdracht `node cloudflare/bouw.mjs`, uitvoermap `dist`.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WORTEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UIT = path.join(WORTEL, 'dist');
const NIET = new Set(['.git', '.gitignore', '.wrangler', 'node_modules', 'netlify', 'netlify.toml', 'cloudflare', 'functions',
  'talen', 'package.json', 'package-lock.json', 'wrangler.toml', 'dist']);

function sjablonen() {
  const uit = {};
  const gedeeld = fs.readFileSync(path.join(WORTEL, 'js/gedeeld.js'), 'utf8');
  const m = gedeeld.match(/\nvar DOCS = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error('DOCS niet gevonden in js/gedeeld.js');
  uit.nl = vm.runInNewContext('(' + m[1] + ')', {}, { timeout: 500 }).ho;
  for (const t of ['en', 'de', 'es', 'zh']) {
    const venster = {};
    vm.runInNewContext(fs.readFileSync(path.join(WORTEL, 'js/taal/' + t + '.js'), 'utf8'), { window: venster }, { timeout: 500 });
    uit[t] = venster.VERTALING_DOCS && venster.VERTALING_DOCS.ho;
    if (!uit[t]) throw new Error('huurovereenkomst ontbreekt in js/taal/' + t + '.js');
  }
  if (!uit.nl) throw new Error('huurovereenkomst ontbreekt in js/gedeeld.js');
  return uit;
}

fs.writeFileSync(path.join(WORTEL, 'cloudflare/sjablonen.json'), JSON.stringify(sjablonen()));

fs.rmSync(UIT, { recursive: true, force: true });
fs.mkdirSync(UIT);
let n = 0;
for (const naam of fs.readdirSync(WORTEL)) {
  if (NIET.has(naam) || naam.startsWith('.')) continue;
  fs.cpSync(path.join(WORTEL, naam), path.join(UIT, naam), { recursive: true, filter: (bron) => !path.basename(bron).startsWith('.') });
  n++;
}
fs.copyFileSync(path.join(WORTEL, 'cloudflare/_headers'), path.join(UIT, '_headers'));
console.log('dist klaar: ' + n + ' onderdelen uit de hoofdmap, sjablonen in alle talen');
