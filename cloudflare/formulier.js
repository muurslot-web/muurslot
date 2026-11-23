// Verwerkt de formulieren van de site op Cloudflare Pages (bestelling, herroeping, dealeropdracht, inschrijving).
// Dit vervangt Netlify Forms plus netlify/functions/submission-created.js.
//
// Wat er gebeurt bij een inzending:
//   1. Wij krijgen een mail met alles wat de klant invulde, de foto's als bijlage (Resend).
//      Lukt dat niet, dan krijgt de site een foutmelding en biedt het mailprogramma als andere weg aan.
//      Er staat dus nooit "gelukt" terwijl wij niets ontvingen.
//   2. Bij een bestelling of herroeping krijgt de klant een bevestiging, in de taal van de site (veld taal).
//
// Nodig in Cloudflare (Settings, Variables and secrets): RESEND_API_KEY
// Optioneel: MAIL_VAN (standaard "Muurslot <info@muurslot.com>"), MAIL_NAAR (waar wij de inzendingen ontvangen,
// standaard info@muurslot.com), MAIL_ANTWOORD (adres voor antwoorden van de klant), RESEND_ADRES (alleen voor tests).
//
// Het blok "Je bestelling" in de bevestiging komt uit het veld overzicht: dat maakt de site in de taal van de klant.
// De bestelling zelf komt bij ons altijd in het Nederlands binnen.
//
// Bij huur stuurt de site de ingevulde huurovereenkomst mee (velden huurcontract en, in een andere taal,
// huurcontract_klant). Die gaat onderaan de bevestiging, zodat de klant hem bewaart. Alleen als het echt onze tekst is:
// dezelfde zinnen als in js/gedeeld.js en js/taal/<taal>.js, met alleen op de invulplekken iets anders.
// Ook de rest van wat de site meestuurt komt alleen in de bevestiging als het kort is en geen link bevat.
// Zo kan niemand dit formulier gebruiken om eigen tekst vanaf ons adres naar anderen te laten versturen.

import SJABLONEN from './sjablonen.json';

const TEKST = {
  nl: {
    bestelling: 'We hebben je bestelling ontvangen',
    groet: (n) => 'Hoi ' + n + ',',
    dank: 'Dank je wel, we hebben je bestelling ontvangen.',
    jouw: 'Je bestelling',
    nu: 'Wat gebeurt er nu',
    stappen: [
      '1. We kijken of het anker op de door jou gekozen plek kan.',
      '2. Je hoort van ons op welke dag we komen. Thuis zijn hoeft niet: het kettingslot hangt bij ons vertrek al door het anker en de sleutels gaan door je brievenbus.',
      '3. Je ontvangt de betaallink per e-mail.',
      '4. Na de montage krijg je een gedateerd fotoverslag voor je verzekeraar.'
    ],
    foto: 'Heb je nog geen foto van de muur meegestuurd? Stuur die dan als antwoord op deze mail mee, met een kruisje op de plek waar het anker moet komen.',
    vragen: 'Vragen? Antwoord gewoon op deze mail.',
    slot: 'Groet,',
    herroeping: 'We hebben je herroeping ontvangen',
    ontvangen: (m) => 'We hebben je herroeping ontvangen op ' + m + '.',
    bestelnr: 'Bestelling: ',
    verder: 'We nemen contact met je op over de afhandeling. Bewaar deze mail als bewijs.',
    nuMoment: 'dit moment',
    huurOnder: 'Je huurovereenkomst staat onderaan deze mail. Bewaar hem goed.'
  },
  en: {
    bestelling: 'We have received your order',
    groet: (n) => 'Hi ' + n + ',',
    dank: 'Thank you, we have received your order.',
    jouw: 'Your order',
    nu: 'What happens next',
    stappen: [
      '1. We check whether the anchor can go in the spot you chose.',
      '2. We let you know which day we are coming. You do not need to be home: when we leave, the chain lock is already through the anchor and the keys go through your letterbox.',
      '3. You will receive the payment link by email.',
      '4. After the installation you will receive a dated photo report for your insurer.'
    ],
    foto: 'Not sent us a photo of the wall yet? Reply to this email with one, with a cross on the spot where the anchor should go.',
    vragen: 'Questions? Just reply to this email.',
    slot: 'Kind regards,',
    herroeping: 'We have received your withdrawal',
    ontvangen: (m) => 'We received your withdrawal on ' + m + '.',
    bestelnr: 'Order: ',
    verder: 'We will contact you about the next steps. Please keep this email as proof.',
    nuMoment: 'this moment',
    huurOnder: 'Your rental agreement is at the bottom of this email. Please keep it.',
    bindend: 'Below is the Dutch text, which is legally binding.'
  },
  de: {
    bestelling: 'Wir haben deine Bestellung erhalten',
    groet: (n) => 'Hallo ' + n + ',',
    dank: 'Vielen Dank, wir haben deine Bestellung erhalten.',
    jouw: 'Deine Bestellung',
    nu: 'Wie es weitergeht',
    stappen: [
      '1. Wir prüfen, ob der Anker an der von dir gewählten Stelle angebracht werden kann.',
      '2. Wir sagen dir, an welchem Tag wir kommen. Du musst nicht zu Hause sein: Wenn wir gehen, hängt das Kettenschloss schon durch den Anker, und die Schlüssel werfen wir in deinen Briefkasten.',
      '3. Den Zahlungslink bekommst du per E-Mail.',
      '4. Nach der Montage bekommst du einen datierten Fotobericht für deinen Versicherer.'
    ],
    foto: 'Du hast uns noch kein Foto der Wand geschickt? Schick es als Antwort auf diese E-Mail, mit einem Kreuz an der Stelle, an die der Anker kommen soll.',
    vragen: 'Fragen? Antworte einfach auf diese E-Mail.',
    slot: 'Viele Grüße',
    herroeping: 'Wir haben deinen Widerruf erhalten',
    ontvangen: (m) => 'Wir haben deinen Widerruf am ' + m + ' erhalten.',
    bestelnr: 'Bestellung: ',
    verder: 'Wir melden uns bei dir wegen der Abwicklung. Bitte bewahre diese E-Mail als Nachweis auf.',
    nuMoment: 'diesem Zeitpunkt',
    huurOnder: 'Deinen Mietvertrag findest du unten in dieser E-Mail. Bitte bewahre ihn gut auf.',
    bindend: 'Darunter steht der niederländische Text, der rechtlich verbindlich ist.'
  },
  es: {
    bestelling: 'Hemos recibido tu pedido',
    groet: (n) => 'Hola, ' + n + ':',
    dank: 'Gracias, hemos recibido tu pedido.',
    jouw: 'Tu pedido',
    nu: 'Qué pasa ahora',
    stappen: [
      '1. Comprobamos si el anclaje se puede colocar en el lugar que has elegido.',
      '2. Te diremos qué día vamos. No hace falta que estés en casa: cuando nos vamos, el candado de cadena ya pasa por el anclaje y las llaves van a tu buzón.',
      '3. Recibirás el enlace de pago por correo electrónico.',
      '4. Después de la instalación recibirás un informe fotográfico con fecha para tu aseguradora.'
    ],
    foto: '¿Todavía no nos has enviado una foto de la pared? Envíala respondiendo a este correo, con una cruz en el lugar donde debe ir el anclaje.',
    vragen: '¿Preguntas? Responde a este correo.',
    slot: 'Un saludo,',
    herroeping: 'Hemos recibido tu desistimiento',
    ontvangen: (m) => 'Recibimos tu desistimiento el ' + m + '.',
    bestelnr: 'Pedido: ',
    verder: 'Nos pondremos en contacto contigo para tramitarlo. Guarda este correo como prueba.',
    nuMoment: 'este momento',
    huurOnder: 'Tu contrato de alquiler está al final de este correo. Guárdalo bien.',
    bindend: 'Debajo está el texto en neerlandés, que es el jurídicamente vinculante.'
  },
  zh: {
    bestelling: '我们已收到您的订单',
    groet: (n) => n + '，您好：',
    dank: '谢谢您，我们已收到您的订单。',
    jouw: '您的订单',
    nu: '接下来',
    stappen: [
      '1. 我们会确认锚具能否安装在您选择的位置。',
      '2. 我们会告诉您上门的日期。您不必在家：我们离开时，链条锁已经穿过锚具，钥匙会投进您的信箱。',
      '3. 您会通过电子邮件收到付款链接。',
      '4. 安装完成后，您会收到一份注明日期的照片报告，可以交给您的保险公司。'
    ],
    foto: '还没有发送墙面照片？请回复本邮件并附上照片，在要安装锚具的位置画一个叉。',
    vragen: '有问题？直接回复本邮件即可。',
    slot: '此致',
    herroeping: '我们已收到您的撤销申请',
    ontvangen: (m) => '我们已于 ' + m + ' 收到您的撤销申请。',
    bestelnr: '订单：',
    verder: '我们会就后续处理与您联系。请保留此邮件作为凭证。',
    nuMoment: '此刻',
    huurOnder: '您的租赁合同附在本邮件末尾，请妥善保存。',
    bindend: '以下是具有法律约束力的荷兰语文本。'
  }
};

/* ---------- wat de site meestuurt ---------- */
const LINK = /https?:|www\.|:\/\/|[<>]/i;
function schoon(s, max) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return s && s.length <= max && !LINK.test(s) ? s : '';
}

/* ---------- de huurovereenkomst ----------
   De vaste tekst komt uit cloudflare/sjablonen.json, dat cloudflare/bouw.mjs bij elke bouwbeurt opnieuw maakt. */
function sjabloon(taal) { return SJABLONEN[taal]; }
/* het sjabloon als gewone tekst, net zoals de site hem maakt (huurAlsTekst in js/bestellen.js) */
function alsTekst(doc, metIndex) {
  const html = doc[1].replace(/<span class="huur-index">([\s\S]*?)<\/span>/g, metIndex ? '$1' : '');
  const tekst = html.replace(/<\/p>/g, '\n\n').replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&');
  return (doc[0] + '\n\n' + tekst).replace(/\n{3,}/g, '\n\n').trim();
}
/* Klopt de tekst met het sjabloon? Per alinea moeten de vaste stukken op volgorde staan;
   wat ertussen staat (de invulplekken) is kort, op één regel en zonder link. */
function past(tekst, sjabloonTekst) {
  const alineas = tekst.split('\n\n'), vast = sjabloonTekst.split('\n\n');
  if (alineas.length !== vast.length) return false;
  let ingevuld = 0;
  for (let i = 0; i < vast.length; i++) {
    const stukken = vast[i].split(/\{\w+\}/), r = alineas[i];
    if (!r.startsWith(stukken[0])) return false;
    let pos = stukken[0].length;
    for (let k = 1; k < stukken.length; k++) {
      const st = stukken[k];
      const j = k < stukken.length - 1 ? r.indexOf(st, pos + 1) : (r.endsWith(st) ? r.length - st.length : -1);
      if (j <= pos) return false;
      const w = r.slice(pos, j);
      if (w.length > 300 || /\n/.test(w) || LINK.test(w)) return false;
      ingevuld += w.length;
      pos = j + st.length;
    }
    if (pos !== r.length) return false;
  }
  return ingevuld <= 3000;
}
function overeenkomst(tekst, taal) {
  const doc = sjabloon(taal);
  if (!doc || typeof tekst !== 'string' || tekst.length > 30000) return '';
  tekst = tekst.replace(/\r\n?/g, '\n').trim();
  return past(tekst, alsTekst(doc, true)) || past(tekst, alsTekst(doc, false)) ? tekst : '';
}

/* ---------- de bevestiging aan de klant ---------- */
function bevestiging(formulier, d) {
  const taal = TEKST[(d.taal || 'nl').slice(0, 2)] ? (d.taal || 'nl').slice(0, 2) : 'nl';
  const T = TEKST[taal];
  const voornaam = schoon((d.naam || '').trim().split(' ')[0], 40);
  let onderwerp, tekst;

  if (formulier === 'bestelling') {
    let overzicht = String(d.overzicht || '').split(/\r?\n/).slice(0, 8).map((r) => schoon(r, 200)).filter(Boolean);
    if (!overzicht.length) {
      overzicht = ['Voertuig: ' + (schoon(d.voertuig, 120) || '-'), 'Slot: ' + (schoon(d.slot, 120) || '-'), 'Totaal: ' + (schoon(d.totaal, 40) || '-')];
    }
    const huurNl = d.huurcontract ? overeenkomst(d.huurcontract, 'nl') : '';
    const huurKlant = huurNl && taal !== 'nl' && d.huurcontract_klant ? overeenkomst(d.huurcontract_klant, taal) : '';
    onderwerp = T.bestelling;
    const regels = [T.groet(voornaam), '', T.dank, '', T.jouw]
      .concat(overzicht)
      .concat(['', T.nu])
      .concat(T.stappen)
      .concat(huurNl ? ['', T.huurOnder] : [])
      .concat(['', T.foto, '', T.vragen, '', T.slot, 'Muurslot.com']);
    if (huurNl) {
      const lijn = '—'.repeat(24);
      if (huurKlant) regels.push('', lijn, '', huurKlant);
      regels.push('', lijn, '');
      if (taal !== 'nl') regels.push(T.bindend, '');
      regels.push(huurNl);
    }
    tekst = regels.join('\n');
  } else {
    onderwerp = T.herroeping;
    tekst = [
      T.groet(voornaam),
      '',
      T.ontvangen(schoon(d.moment, 60) || T.nuMoment),
      T.bestelnr + (schoon(d.bestelling, 200) || '-'),
      '',
      T.verder,
      '',
      T.slot,
      'Muurslot.com'
    ].join('\n');
  }
  return { onderwerp, tekst };
}

/* ---------- de mail aan ons ---------- */
const TITEL = {
  bestelling: 'Nieuwe bestelling',
  herroeping: 'Herroeping',
  dealer: 'Dealeropdracht',
  inschrijving: 'Inschrijving'
};
const EEN_REGEL = (s) => String(s || '').replace(/\s+/g, ' ').trim();

function melding(formulier, d, bijlagen, ontbrekendeFotos) {
  const regels = [TITEL[formulier], ''];
  const lang = [];
  for (const k of Object.keys(d)) {
    if (k === 'form-name' || k === 'bot-field' || k.startsWith('huurcontract')) continue;
    const w = String(d[k]).replace(/\r/g, '').trim();
    if (w.indexOf('\n') >= 0) lang.push(k, w, '');
    else regels.push(k + ': ' + w);
  }
  if (lang.length) regels.push('', ...lang);
  if (formulier === 'bestelling') {
    regels.push('', bijlagen.length ? 'Foto\'s: ' + bijlagen.length + ' als bijlage' : 'Foto\'s: geen meegestuurd');
    if (ontbrekendeFotos) regels.push(ontbrekendeFotos);
  }
  for (const k of ['huurcontract', 'huurcontract_klant']) {
    if (d[k]) regels.push('', '—'.repeat(24), k, '', String(d[k]).replace(/\r/g, '').trim());
  }
  return regels.join('\n');
}

/* ---------- versturen via Resend ---------- */
async function resend(env, body) {
  const r = await fetch(env.RESEND_ADRES || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok;
}

function naarBase64(buffer) {
  const b = new Uint8Array(buffer);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
const EXTENSIE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif' };

const antwoord = (status, tekst) => new Response(JSON.stringify({ ok: status === 200, bericht: tekst }), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const MAX_FOTO = 8 * 1024 * 1024;         // per foto; de site maakt ze zelf al kleiner
const MAX_TOTAAL = 20 * 1024 * 1024;      // alles bij elkaar
const MAX_VELDEN = 80;

export async function verwerk(request, env) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });

  // alleen vanaf onze eigen site
  const herkomst = request.headers.get('origin');
  if (herkomst) {
    let zelfde = false;
    try { zelfde = new URL(herkomst).host === new URL(request.url).host; } catch (e) { /* onbekend */ }
    if (!zelfde) return antwoord(403, 'andere herkomst');
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_TOTAAL + 1024 * 1024) return antwoord(413, 'te groot');
  if (!env.RESEND_API_KEY) return antwoord(503, 'mail nog niet ingesteld');

  let fd;
  try { fd = await request.formData(); } catch (e) { return antwoord(400, 'geen formulier'); }

  const d = Object.create(null);
  const bestanden = [];
  for (const [k, v] of fd.entries()) {
    const naam = String(k).slice(0, 60);
    if (typeof v === 'string') {
      if (!(naam in d) && Object.keys(d).length < MAX_VELDEN) d[naam] = v.slice(0, naam.startsWith('huurcontract') ? 30000 : 5000);
    } else if (v && v.size) bestanden.push({ naam, bestand: v });
  }

  const formulier = d['form-name'];
  if (!TITEL[formulier]) return antwoord(400, 'onbekend formulier');
  if (d['bot-field']) return antwoord(200, 'ontvangen');   // een programma vulde het verborgen veld in: doen alsof het lukte, niets versturen

  // foto's als bijlage
  const bijlagen = [];
  let totaal = 0, teGroot = 0;
  if (formulier === 'bestelling') {
    for (const { naam, bestand } of bestanden) {
      if (naam !== 'foto1' && naam !== 'foto2') continue;
      const soort = String(bestand.type || '').toLowerCase();
      if (!soort.startsWith('image/') || bestand.size > MAX_FOTO || totaal + bestand.size > MAX_TOTAAL) { teGroot++; continue; }
      totaal += bestand.size;
      bijlagen.push({ filename: naam.replace('foto', 'foto-') + '.' + (EXTENSIE[soort] || 'jpg'), content: naarBase64(await bestand.arrayBuffer()) });
    }
  }

  const aan = EEN_REGEL(d.email);
  const geldigAdres = /^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/.test(aan) && aan.length <= 200;
  const van = env.MAIL_VAN || 'Muurslot <info@muurslot.com>';

  // 1. de mail aan ons: lukt die niet, dan is de inzending niet aangekomen
  const wie = EEN_REGEL(d.naam || d.klant || d.zaak).slice(0, 60);
  const ons = {
    from: van,
    to: [env.MAIL_NAAR || 'info@muurslot.com'],
    subject: TITEL[formulier] + (wie ? ' — ' + wie : ''),
    text: melding(formulier, d, bijlagen, teGroot ? 'Let op: ' + teGroot + ' foto niet meegestuurd (te groot of geen foto). Vraag er een op.' : '')
  };
  if (geldigAdres) ons.reply_to = aan;
  if (bijlagen.length) ons.attachments = bijlagen;
  let aangekomen = false;
  try { aangekomen = await resend(env, ons); } catch (e) { aangekomen = false; }
  if (!aangekomen) return antwoord(502, 'versturen mislukt');

  // 2. de bevestiging aan de klant (mislukt die, dan is de inzending zelf toch binnen)
  if ((formulier === 'bestelling' || formulier === 'herroeping') && geldigAdres) {
    try {
      const b = bevestiging(formulier, d);
      const naarKlant = { from: van, to: [aan], subject: b.onderwerp, text: b.tekst };
      if (env.MAIL_ANTWOORD) naarKlant.reply_to = env.MAIL_ANTWOORD;
      await resend(env, naarKlant);
    } catch (e) { /* de bestelling is binnen; de bevestiging sturen we dan zelf */ }
  }
  return antwoord(200, 'ontvangen');
}
