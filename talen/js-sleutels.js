// Zoekt alle teksten in de scripts die vertaald worden: de eerste tekst in t('...') en tv('...'),
// de veldnamen bij de foutmeldingen en de teksten in VOERTUIGEN, SLOTEN en FILMS.
// Gebruik: node talen/js-sleutels.js [taal]   -> toont wat er in js/taal/<taal>.js nog ontbreekt
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const MAP = path.join(__dirname, '..');
const bestanden = ['gedeeld.js', 'prijzen.js', 'bestellen.js', 'anker.js', 'zakelijk.js'].map(f => path.join(MAP, 'js', f));

function literals(bron, start, stopBijKomma) {
  // leest vanaf start (net na de openingshaak) tot de sluitende haak, of tot de eerste komma op het bovenste niveau
  const groepen = []; let huidig = null; let diepte = 0; let i = start;
  while (i < bron.length) {
    const c = bron[i];
    if (c === "'" || c === '"') {
      let j = i + 1, s = '';
      while (bron[j] !== c) { if (bron[j] === '\\') { s += bron[j + 1] === 'n' ? '\n' : bron[j + 1]; j += 2; } else { s += bron[j]; j++; } }
      huidig = (huidig === null ? '' : huidig) + s;
      i = j + 1; continue;
    }
    if (c === '+' && huidig !== null) { i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (huidig !== null) { groepen.push(huidig); huidig = null; }
    if (c === '(') diepte++;
    if (c === ')') { if (diepte === 0) break; diepte--; }
    if (c === ',' && diepte === 0 && stopBijKomma) break;
    i++;
  }
  if (huidig !== null) groepen.push(huidig);
  return groepen;
}

const sleutels = new Set();
for (const f of bestanden) {
  const bron = fs.readFileSync(f, 'utf8');
  const re = /\b(tv?|T)\(/g; let m;
  while ((m = re.exec(bron))) {
    const voor = bron[m.index - 1];
    if (voor && /[\w.$]/.test(voor)) continue;   // geen onderdeel van een ander woord, zoals parseInt(
    for (const s of literals(bron, m.index + m[0].length, m[1] === 'tv')) sleutels.add(s);
  }
  const rv = /\[\s*'(?:f|d)-[\w-]+'\s*,\s*'([^']+)'\s*\]/g;
  while ((m = rv.exec(bron))) sleutels.add(m[1]);
  const rf = /naam:'([^']+)',\s*waar:'([^']+)'/g;
  while ((m = rf.exec(bron))) { sleutels.add(m[1]); sleutels.add(m[2]); }
}
// de gegevens uit prijzen.js
const ctx = { t: s => s, tv: s => s, TAAL: 'nl', GELD_TAAL: 'nl', Math, String, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(MAP, 'js', 'prijzen.js'), 'utf8') + '\nthis.VOERTUIGEN = VOERTUIGEN; this.SLOTEN = SLOTEN;', ctx);
for (const v of ctx.VOERTUIGEN) {
  ['naam', 'label', 'lede', 'locknote', 'why'].forEach(k => v[k] && sleutels.add(v[k]));
  v.opties.forEach(o => { if (!o.schakel && o.tag) sleutels.add(o.tag); });
}
for (const s of ctx.SLOTEN) s.voor && sleutels.add(s.voor);

const lijst = [...sleutels].filter(s => /[A-Za-zÀ-ÿ]/.test(s));
const taal = process.argv[2];
if (taal) {
  const p = path.join(MAP, 'js', 'taal', taal + '.js');
  let W = {};
  if (fs.existsSync(p)) { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(p, 'utf8'), c); W = c.window.VERTALING || {}; }
  const mis = lijst.filter(s => !(s in W));
  fs.writeFileSync(path.join(MAP, 'talen', 'js-ontbreekt-' + taal + '.json'), JSON.stringify(mis, null, 1));
  console.log(mis.length + ' teksten in de scripts zonder vertaling in ' + taal + ' (talen/js-ontbreekt-' + taal + '.json)');
} else {
  console.log(JSON.stringify(lijst, null, 1));
}
