/* De bestelstroom op de voorpagina: voertuig kiezen, advies, prijs, gegevens en bestellen. */
var picker = byId('picker');

var picker2 = byId('picker2');

VOERTUIGEN.forEach(function(v){
  [picker, picker2].forEach(function(rij){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'veh';
    b.setAttribute('aria-pressed','false');
    b.dataset.id = v.id;
    b.textContent = v.naam;
    b.addEventListener('click', function(){ choose(v.id); });
    rij.appendChild(b);
  });
});
var huidig = null;
var tweeAan = false;
var betaalwijze = 'huur';   // standaard huur; 'eens' of 'drie' kan ook
var bijBestellen = false;
var MATEN = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
var maatM = 20;

function zetMaat(m){
  maatM = m;
  var sl = slotById('maat');
  sl.lengte = m + ' m kabel';
  sl.prijs  = kabelPrijs(m);
  Array.prototype.forEach.call(byId('maat-row').children, function(b){
    b.setAttribute('aria-pressed', (+b.dataset.m === m) ? 'true' : 'false');
  });
  if(huidig) toonOpties(huidig);
  if(gekozenSlot && gekozenSlot.id === 'maat') kiesSlot('maat');
  else herbereken();
}

function bedragTekst(kort){
  /* wat de klant ziet: eenmalig, drie termijnen of huur */
  if(betaalwijze === 'huur') return euro(huurPm()) + (kort ? ' p/m' : ' per maand');
  if(betaalwijze === 'drie') return in3Tekst();
  return euro(totaal());
}
function nuTeBetalen(){
  /* het eerste bedrag dat je betaalt */
  if(betaalwijze === 'huur') return euro(huurPm());   /* eerste maand = machtiging */
  if(betaalwijze === 'drie') return ctEuro(in3().eerste);
  return euro(totaal());
}

function knoppen(){
  var b = byId('q-book-tot');
  if(b) b.textContent = bedragTekst(true);
  if(huidig){
    var sl = gekozenSlot || slotById('geen');
    byId('balk-wat').textContent = huidig.naam + (sl.prijs ? ' met ' + slotNaam(sl) : ', alleen montage');
    byId('balk-tot').textContent = bedragTekst(true);
    byId('balk').hidden = bijBestellen || !BESTELLEN_OPEN;
  }
  var p = byId('betaal');
  if(p && !p.disabled) p.textContent = 'Bestellen met betalingsverplichting';
  var el = byId('eind-lab'), et = byId('eind-tot');
  if(el && et){
    el.textContent = betaalwijze === 'huur' ? 'Eerste betaling: de eerste maand, inclusief btw'
                   : betaalwijze === 'drie' ? 'Eerste betaling: het eerste deel via in3, inclusief btw'
                   : 'Totaal om te betalen met iDEAL, inclusief btw';
    et.textContent = nuTeBetalen();
  }
}
function betaalTekst(){
  /* zoals de klant het in het overzicht leest */
  if(betaalwijze === 'huur') return 'Huur, ' + euro(huurPm()) + ' per maand, minimaal 36 maanden';
  if(betaalwijze === 'drie') return 'In drie termijnen via in3, ' + in3Tekst();
  return 'In één keer met iDEAL, ' + euro(totaal());
}

MATEN.forEach(function(m){
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'maatknop'; b.dataset.m = m;
  b.setAttribute('aria-pressed', m === maatM ? 'true' : 'false');
  b.textContent = m + ' m';
  b.addEventListener('click', function(){ zetMaat(m); });
  byId('maat-row').appendChild(b);
});

byId('alles').addEventListener('click', function(){
  allesAan = !allesAan;
  if(huidig){
    toonOpties(huidig);
    kiesSlot(gekozenSlot ? gekozenSlot.id : 'geen');
  }
});

[['term1','eens'], ['term3','drie'], ['term36','huur']].forEach(function(p){
  byId(p[0]).addEventListener('click', function(){
    betaalwijze = p[1];
    termijnen();
    if(huidig) toonOpties(huidig);          /* slotprijzen mee laten bewegen */
    if(tweeAan) vulTweeSlot();
    herbereken();
  });
});

/* in3: drie termijnen. Gaat het niet precies op, dan vangt het eerste deel de rest op (hooguit een cent verschil). */
function in3(){
  var t = totaalCt(), rest = Math.round(t / TERMIJNEN);
  return {eerste: t - (TERMIJNEN - 1) * rest, rest: rest};
}
function in3Tekst(maal){
  var d = in3(), x = maal || '×';
  return d.eerste === d.rest
    ? TERMIJNEN + ' ' + x + ' ' + ctEuro(d.rest)
    : ctEuro(d.eerste) + ' + ' + (TERMIJNEN - 1) + ' ' + x + ' ' + ctEuro(d.rest);
}

function termijnen(){
  [['term1','eens'], ['term3','drie'], ['term36','huur']].forEach(function(p){
    var aan = betaalwijze === p[1];
    byId(p[0]).setAttribute('aria-checked', aan ? 'true' : 'false');
    byId(p[0]).classList.toggle('on', aan);
  });
  byId('term1-b').textContent  = euro(totaal());
  byId('term3-b').textContent  = in3Tekst();
  byId('term36-b').textContent = euro(huurPm()) + ' per maand';

  var sl = gekozenSlot || slotById('geen');
  byId('term-uitleg').textContent = betaalwijze === 'huur'
    ? 'Montage is gratis. Je betaalt ' + euro(huurPm()) + ' per maand, te beginnen met de eerste maand: de betaallink krijg je na je bestelling per e-mail. '
      + 'Minimaal 36 maanden, daarna maandelijks opzegbaar. Anker en slot blijven van Muurslot: zeg je op, dan halen we ze op voor ' + euro(HUUR_OPHALEN) + '. '
      + 'Verhuis je, dan kan de huur over naar de nieuwe bewoner.'
    : 'Na je bestelling krijg je een betaallink per e-mail. Kan het anker niet op de plek die jij aanwijst, dan krijg je je geld volledig terug.';
}

var gekozenSlot2 = null;

byId('tweeTog').addEventListener('click', function(){
  tweeAan = !tweeAan;
  if(tweeAan){
    vulTweeSlot();
    byId('twee-slot-keuze').hidden = false;
  } else {
    byId('twee-slot-keuze').hidden = true;
    gekozenSlot2 = null;
  }
  herbereken();
});

function vulTweeSlot(){
  var cont = byId('twee-slot-opties');
  while(cont.firstChild) cont.removeChild(cont.firstChild);   /* altijd opnieuw opbouwen */
  var opties = huidig ? huidig.opties : [{id:'geen'}];
  var start  = gekozenSlot2 ? gekozenSlot2.id : (gekozenSlot ? gekozenSlot.id : 'geen');
  if(!opties.some(function(o){ return o.id === start; })) start = 'geen';
  gekozenSlot2 = slotById(start);

  opties.forEach(function(o){
    var sl = slotById(o.id);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'twee-opt' + (o.id === start ? ' on' : '');
    btn.dataset.id = o.id;
    btn.innerHTML = '<span class="twee-opt-naam">' + (sl.prijs ? slotNaam(sl) : 'Geen slot') + '</span>'
      + '<span class="twee-opt-pr">' + labelTweedeSlot(sl.prijs) + '</span>';
    btn.addEventListener('click', function(){
      Array.prototype.forEach.call(cont.children, function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      gekozenSlot2 = slotById(o.id);
      herbereken();
    });
    cont.appendChild(btn);
  });
}

function choose(id){
  var v = VOERTUIGEN.filter(function(x){ return x.id===id; })[0];
  if(!v) return;
  huidig = v;

  /* tweede anker en zijn slotkeuze resetten bij elk nieuw voertuig */
  tweeAan = false;
  gekozenSlot2 = null;
  byId('twee-slot-keuze').hidden = true;
  var c2 = byId('twee-slot-opties');
  while(c2.firstChild) c2.removeChild(c2.firstChild);

  [picker, picker2].forEach(function(rij){
    Array.prototype.forEach.call(rij.children, function(b){
      b.setAttribute('aria-pressed', b.dataset.id===id ? 'true' : 'false');
    });
  });

  byId('adv-title').textContent = 'Voor ' + v.label;
  byId('adv-lede').textContent  = v.lede;

  byId('adv-locknote').textContent = v.locknote;
  toonOpties(v);
  byId('adv-why').textContent = v.why;
  toonAdvFilm(v.id);
  byId('boeken').classList.remove('uit');

  var std = v.opties.filter(function(o){return o.advies;})[0] || v.opties[0];
  kiesSlot(std.id);

  herbereken();


  var panel = byId('advice');
  panel.classList.add('on');
  vulRecap();
  setTimeout(function(){
    panel.scrollIntoView({behavior:'smooth', block:'start'});
  }, 60);
}

function verzamel(){
  return {
    naam:     byId('f-naam').value.trim(),
    telefoon: byId('f-tel').value.trim(),
    email:    byId('f-mail').value.trim(),
    adres:    byId('f-adres').value.trim(),
    postcode: byId('f-pc').value.trim(),
    voertuig: huidig ? huidig.naam : 'niet opgegeven',
    ankers:   tweeAan ? '2 (tweede anker ' + euro(MONTAGE_2) + ', slot ' + (gekozenSlot2 && gekozenSlot2.prijs ? slotNaam(gekozenSlot2) + ' ' + euro(gekozenSlot2.prijs) : 'geen') + ')' : '1',
    betaling: betaalwijze === 'drie' ? 'drie termijnen via in3, ' + in3Tekst('x')
            : betaalwijze === 'huur' ? 'huur: montage gratis, ' + euro(huurPm()) + ' per maand (eerste maand via betaallink), minimaal 36 maanden, ophalen bij opzeggen ' + euro(HUUR_OPHALEN)
            : 'in een keer, ' + euro(totaal()),
    slotId:   gekozenSlot ? gekozenSlot.id : 'geen',
    slot:     gekozenSlot && gekozenSlot.prijs
              ? slotNaam(gekozenSlot) + ' — ' + euro(gekozenSlot.prijs) : 'geen',
    totaal:   euro(totaal()),
    toestemming: (byId('ak-vw') && byId('ak-vw').checked)
              ? 'Klant verklaarde eigenaar te zijn of toestemming te hebben om in deze muur te laten boren.'
              : 'NIET verklaard',
    akkoord:  (byId('ak-start') && byId('ak-start').checked)
              ? 'Klant verzocht uitdrukkelijk om uitvoering binnen de bedenktijd en erkende verlies van het '
                + 'herroepingsrecht op de montage. Aangevinkt op ' + new Date().toLocaleString('nl-NL') + '.'
              : 'NIET aangevinkt',
    plek:     PLEK[0].omschrijving() || 'nog niet opgegeven',
    plek2:    tweeAan ? (PLEK[1].omschrijving() || 'nog niet opgegeven') : '',
    lengte:   byId('f-lengte').value.trim() || 'standaard',
    kruisje:  PLEK[0].kruisTekst(),
    kruisje2: tweeAan ? PLEK[1].kruisTekst() : ''
  };
}

function toonBevestiging(d){
  byId('done-txt').textContent =
    'Dank je, ' + d.naam.split(' ')[0] + '. We hebben je aanvraag voor ' +
    d.voertuig.toLowerCase() + ' binnen. Je hoort per e-mail op ' + d.email +
    ' of het op de door jou gekozen plek kan, meestal dezelfde dag nog. Je hoort vooraf op welke dag we komen — thuis zijn hoeft niet.';
  byId('done').classList.add('on');
  byId('done').scrollIntoView({behavior:'smooth', block:'center'});
}

function mailLink(d){
  var regels = [
    'Naam: '            + d.naam,
    'Telefoon: '        + d.telefoon,
    'E-mail: '          + d.email,
    'Adres: '           + d.adres,
    'Postcode/plaats: ' + d.postcode,
    'Aantal ankers: '   + d.ankers,
    'Voertuig: '        + d.voertuig,
    'Kettingslot: '     + d.slot,
    'Totaal: '          + d.totaal,
    'Betaling: '        + d.betaling,
    '',
    'Akkoord: '         + d.akkoord,
    'Toestemming muur: '+ d.toestemming,
    'Plek 1: '          + d.plek,
    'Kruisje plek 1: '  + d.kruisje,
    '',
    'Verstuurd via muurslot.com'
  ].join('\n');
  return 'mailto:' + ONS_MAILADRES +
    '?subject=' + encodeURIComponent('Montage-aanvraag: ' + d.voertuig + ' — ' + d.naam) +
    '&body='    + encodeURIComponent(regels);
}
function viaMailprogramma(d){ window.location.href = mailLink(d); }

/* ---------- keuze in het adviesblok ---------- */
var gekozenSlot = null;
var opts = byId('adv-opts');

var allesAan = false;

function alleOpties(v){
  if(!allesAan || v.id === 'zelf') return v.opties;
  var gekozen = {};
  v.opties.forEach(function(o){ gekozen[o.id] = o; });
  return SLOTEN.map(function(sl){
    if(gekozen[sl.id]) return gekozen[sl.id];
    return {id: sl.id, tag: sl.prijs ? 'Schakels van ' + mm(sl.mm) : 'Ik regel zelf een ketting'};
  });
}

function toonOpties(v){
  opts.innerHTML = '';
  var knop = byId('alles');
  knop.hidden = (v.id === 'zelf');
  knop.textContent = allesAan ? 'Alleen het advies tonen' : 'Alle sloten tonen';
  alleOpties(v).forEach(function(o){
    var sl = slotById(o.id);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.dataset.id = sl.id;
    b.setAttribute('role','radio');
    b.innerHTML =
      '<span class="opt-mark" aria-hidden="true"></span>' +
      '<span class="opt-mid">' +
        '<span class="opt-top">' +
          (sl.prijs ? '<b>' + sl.lengte + '</b><i class="opt-art">'
                      + (sl.klasse ? 'ART-' + sl.klasse : 'geen ART') + '</i>'
                    : '<b>Geen slot</b>') +
        '</span>' +
        '<span class="opt-tag' + (o.advies ? ' is-advies' : '') + '">' + o.tag + '</span>' +
        (sl.adviesprijs ? '<span class="opt-adv">Adviesprijs ' + euro(sl.adviesprijs) + '. Jij krijgt 10% korting.</span>' : '') +
      '</span>' +
      '<span class="opt-pr">' + labelSlot(sl.prijs) + '</span>';
    b.addEventListener('click', function(){ kiesSlot(sl.id); });
    opts.appendChild(b);
  });
}

function kiesSlot(id){
  gekozenSlot = slotById(id);
  byId('maat').hidden = (id !== 'maat');
  Array.prototype.forEach.call(opts.children, function(b){
    var aan = b.dataset.id === id;
    b.classList.toggle('on', aan);
    b.setAttribute('aria-checked', aan ? 'true' : 'false');
  });
  herbereken();
}

/* ---------- rekenen ---------- */
function herbereken(){
  var sl  = gekozenSlot || slotById('geen');
  var tot = totaal();
  var sl2 = gekozenSlot2 || slotById('geen');
  byId('twee-pr').textContent = labelTweedeAnker(sl2.prijs);
  termijnen();
  if(tweeAan) werkTweeSlotsBij();
  byId('twee-uitleg').innerHTML = betaalwijze === 'huur'
    ? 'Een tweede anker kost minder, omdat we er toch staan. '
      + (sl2.prijs ? 'Met het tweede slot erbij' : 'Zonder slot') + ' komt er <b>' + ctEuro(tweedeAnkerCt(sl2.prijs)) + ' per maand</b> bij.'
    : 'Tweede anker <b>' + euro(MONTAGE_2) + '</b> in plaats van '
      + '<s>' + euro(MONTAGE) + '</s>, omdat we er toch staan'
      + (sl2.prijs ? ', plus ' + euro(sl2.prijs) + ' voor het tweede slot' : '') + '.';
  byId('adv-twee').classList.toggle('on', tweeAan);
  if(byId('plek2')) toonPlek2();
  byId('tweeTog').setAttribute('aria-checked', tweeAan ? 'true' : 'false');

  if(!huidig) return;

  var isHuur = betaalwijze === 'huur';
  function bedrag(x){ return isHuur ? 'inbegrepen' : euro(x); }
  byId('q-mont').textContent = bedrag(MONTAGE);
  byId('q-montnaam').textContent = 'Muuranker + montage';
  byId('q-twee-row').hidden = !tweeAan;
  byId('q-twee').textContent = bedrag(MONTAGE_2);
  byId('q-lockname').textContent = slotNaam(sl);
  byId('q-lock').textContent = bedrag(sl.prijs);
  var toon2 = tweeAan && sl2.prijs > 0;
  byId('q-lock2-row').hidden = !toon2;
  if(toon2){
    byId('q-lockname2').textContent = slotNaam(sl2) + ', tweede anker';
    byId('q-lock2').textContent = bedrag(sl2.prijs);
  }
  /* bij huur alleen het maandbedrag; de eenmalige waarde staat pas in de laatste stap */
  byId('q-totnaam').textContent = isHuur ? 'Per maand' : 'Samen, eenmalig';
  byId('q-tot').textContent     = isHuur ? euro(huurPm()) : euro(tot);
  byId('q-huur-row').hidden = true;
  knoppen();

  /* waarschuwen als de keuze onder het minimum voor dit voertuig zit */
  var w = byId('adv-warn');
  if(sl.prijs && sl.klasse < huidig.min){
    w.hidden = false;
    w.textContent = 'Let op: ART-' + sl.klasse + ' zit onder het minimale advies van ART-' +
                    huidig.min + ' voor ' + huidig.label + '. Je verzekeraar kan hier moeilijk over doen.';
  } else {
    w.hidden = true;
  }
}

/* ---------- interne links ---------- */
document.addEventListener('click', function(e){
  var k = e.target.closest ? e.target.closest('[data-ga]') : null;
  if(!k) return;
  var doel = document.getElementById(k.dataset.ga);
  if(!doel) return;
  if(k.tagName === 'A') e.preventDefault();                     /* Montage boeken is een link naar deze pagina; het scrollen doen wij */
  if(doel.id === 'boeken' && !huidig) doel = byId('kies');     /* eerst kiezen wat je wilt vastzetten: scroll naar de vraag, niet naar de rij knoppen die dan onder het menu zit */
  if(doel.id === 'boeken') naarStap(2);
  setTimeout(function(){ scrollNaar(doel); }, 30);
});

/* ---------- stappen ---------- */
var stap = 2;
var foto = null;

function naarStap(n){
  stap = n;
  byId('stap2').hidden = (n !== 2);
  byId('stap3').hidden = (n !== 3);
  Array.prototype.forEach.call(byId('stepper').children, function(li){
    var d = +li.dataset.s;
    li.classList.toggle('nu',   d === n);
    li.classList.toggle('klaar', d < n);
  });
  vulRecap();
  if(n === 3) vulCheck();
}

function regel(naam, bedrag){
  return '<div><span>' + naam + '</span><span>' + bedrag + '</span></div>';
}

function vulRecap(){
  var leeg = !huidig;
  byId('recap-kies').hidden   = !leeg;
  byId('recap-lines').hidden  = leeg;
  byId('wijzig').hidden       = leeg;
  byId('recap-kop').textContent = leeg ? 'Eerst even dit' : 'Je keuze';
  if(leeg) return;

  var sl  = gekozenSlot  || slotById('geen');
  var sl2 = gekozenSlot2 || slotById('geen');
  var huur = betaalwijze === 'huur';
  function pr(x){ return euro(x); }
  var h = regel((huur ? 'Muuranker' : 'Muuranker + montage') + (huidig ? ', ' + huidig.label : ''), pr(MONTAGE));
  if(sl.prijs) h += regel(slotNaam(sl), pr(sl.prijs));
  if(tweeAan){
    h += regel(huur ? 'Tweede muuranker' : 'Tweede muuranker + montage', pr(MONTAGE_2));
    if(sl2.prijs) h += regel(slotNaam(sl2) + ', tweede anker', pr(sl2.prijs));
  }
  if(betaalwijze === 'huur'){
    h += regel('Waarde van je bestelling', euro(totaal()));
    h += regel('Montage', 'gratis');
    h += '<div class="tot"><span>Eerste betaling, de eerste maand</span><b>' + euro(huurPm()) + '</b></div>';
    h += regel('Daarna per maand, minimaal 36 maanden', euro(huurPm()));
    h += regel('Ophalen als je opzegt', euro(HUUR_OPHALEN));
  } else if(betaalwijze === 'drie'){
    h += '<div class="tot"><span>Samen</span><b>' + euro(totaal()) + '</b></div>';
    h += regel('Via in3, in drie delen', in3Tekst());
  } else {
    h += '<div class="tot"><span>Totaal</span><b>' + euro(totaal()) + '</b></div>';
  }
  byId('recap-lines').innerHTML = h;
}

function aantal(){ return tweeAan ? 2 : 1; }

function totaalCt(){
  return ct(MONTAGE) + slotCt(gekozenSlot)
       + (tweeAan ? ct(MONTAGE_2) + slotCt(gekozenSlot2) : 0);
}
function totaal(){ return totaalCt() / 100; }
function huurPm(){ return huurCt(totaalCt()) / 100; }

/* wat er bij komt als je 'extra' (centen) op 'basis' (centen) zet: bij huur het verschil per maand, anders het bedrag zelf */
function extraCt(extra, basis){
  return betaalwijze === 'huur' ? huurCt(basis + extra) - huurCt(basis) : extra;
}
function plusTekst(c){
  var huur = betaalwijze === 'huur';
  if(!c) return huur ? '€0 p/m' : '€0';
  return '+ ' + ctEuro(c) + (huur ? ' p/m' : '');
}
function eersteBasisCt(){ return ct(MONTAGE) + slotCt(gekozenSlot); }   /* eerste anker met zijn slot */
function labelSlot(prijs){ return plusTekst(extraCt(ct(prijs), ct(MONTAGE))); }
function tweedeAnkerCt(prijs2){ return extraCt(ct(MONTAGE_2) + ct(prijs2), eersteBasisCt()); }
function labelTweedeAnker(prijs2){ return plusTekst(tweedeAnkerCt(prijs2)); }
function labelTweedeSlot(prijs2){ return plusTekst(extraCt(ct(prijs2), eersteBasisCt() + ct(MONTAGE_2))); }

/* de bedragen bij de sloten van het tweede anker meebewegen als het eerste slot verandert */
function werkTweeSlotsBij(){
  Array.prototype.forEach.call(byId('twee-slot-opties').children, function(btn){
    var sl = slotById(btn.dataset.id);
    var naam = btn.querySelector('.twee-opt-naam'), pr = btn.querySelector('.twee-opt-pr');
    if(naam) naam.textContent = sl.prijs ? slotNaam(sl) : 'Geen slot';
    if(pr)   pr.textContent   = labelTweedeSlot(sl.prijs);
  });
}

function vulCheck(){
  var d = verzamel();
  function fotoTekst(P){
    return P.foto ? (P.merk ? 'met kruisje op de plek' : 'zonder kruisje') : 'geen foto';
  }
  var r = [['Aantal ankers', d.ankers], ['Voertuig', d.voertuig], ['Slot', d.slot], ['Betaling', betaalTekst()],
           ['Naam', d.naam], ['Telefoon', d.telefoon], ['E-mail', d.email],
           ['Adres', d.adres + ', ' + d.postcode],
           [tweeAan ? 'Plek 1' : 'Plek voor het anker', d.plek + ' — ' + fotoTekst(PLEK[0])]];
  if(tweeAan) r.push(['Plek 2', d.plek2 + ' — ' + fotoTekst(PLEK[1])]);
  byId('check').innerHTML = r.map(function(x){
    return '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('');
  knoppen();
}

/* ---------- foto kiezen en de plek aanwijzen ----------
   Eén bouwer, twee keer gebruikt: plek 1 en plek 2. */
var MAX_ORIGINEEL  = 25 * 1024 * 1024;   /* grootste foto die iemand kan kiezen; hij wordt toch verkleind */
var MAX_ZIJDE      = 1600;               /* langste zijde van de foto die we versturen, in pixels */
var MAX_ONVERKLEIND = 3 * 1024 * 1024;   /* lukt verkleinen niet, dan gaat de originele foto alleen mee als hij zo klein is */

function maakPlek(n){
  var P = { foto:null, merk:null, n:n };
  var el = function(id){ return byId(id + n); };

  /* melding bij de foto zelf, in de pagina (geen popup) */
  function fotoFout(tekst){
    var m = el('foto-fout');
    m.textContent = tekst || '';
    m.hidden = !tekst;
  }

  el('drop-btn').addEventListener('click',  function(){ el('f-foto').click(); });
  el('drop-btn2').addEventListener('click', function(){ el('f-foto').click(); });

  P.toon = function(f){
    fotoFout('');
    P.foto = f; P.merk = null;
    var lezer = new FileReader();
    lezer.onload = function(ev){
      el('drop-prev').src = ev.target.result;
      el('prev').hidden = false;
      el('kruis').hidden = true;
      el('kruis-weg').hidden = true;
      el('wenk').hidden = false;
      el('prev-tip').textContent = 'Tik nu op de foto om de plek aan te wijzen';
      el('prev-tip').classList.remove('gezet');
      el('drop-btn').hidden = true;
      el('drop').classList.add('vol');
    };
    lezer.readAsDataURL(f);
  };

  P.weg = function(){
    P.foto = null; P.merk = null;
    el('f-foto').value = '';
    el('prev').hidden = true;
    el('drop-prev').removeAttribute('src');
    el('drop-btn').hidden = false;
    el('drop').classList.remove('vol');
  };
  el('foto-weg').addEventListener('click', P.weg);

  function zetKruis(x, y){
    P.merk = {x:x, y:y};
    var k = el('kruis');
    k.style.left = (x*100) + '%';
    k.style.top  = (y*100) + '%';
    k.hidden = false;
    el('kruis-weg').hidden = false;
    el('wenk').hidden = true;
    el('prev-tip').textContent = 'Hier komt het anker. Tik ergens anders om het te verplaatsen.';
    el('prev-tip').classList.add('gezet');
  }

  el('kruis-weg').addEventListener('click', function(){
    P.merk = null;
    el('kruis').hidden = true;
    this.hidden = true;
    el('wenk').hidden = false;
    el('prev-tip').textContent = 'Tik nu op de foto om de plek aan te wijzen';
    el('prev-tip').classList.remove('gezet');
  });

  el('prev-wrap').addEventListener('click', function(e){
    var r = this.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top)  / r.height;
    if(x < 0 || x > 1 || y < 0 || y > 1) return;
    zetKruis(x, y);
  });

  function neem(f){
    if(f.size > MAX_ORIGINEEL){
      P.weg();
      fotoFout('Die foto is groter dan 25 MB. Kies een kleinere foto, of stuur hem later per e-mail.');
      return;
    }
    P.toon(f);
  }

  el('f-foto').addEventListener('change', function(){
    var f = this.files && this.files[0];
    if(f) neem(f);
  });

  /* een foto die de browser niet kan laten zien (bijvoorbeeld HEIC op een computer) */
  el('drop-prev').addEventListener('error', function(){
    if(!P.foto) return;
    P.weg();
    fotoFout('Deze foto kunnen we niet laten zien. Kies een foto als JPG of PNG.');
  });

  ['dragover','dragenter'].forEach(function(t){
    el('drop').addEventListener(t, function(e){ e.preventDefault(); this.classList.add('sleep'); });
  });
  ['dragleave','drop'].forEach(function(t){
    el('drop').addEventListener(t, function(e){ e.preventDefault(); this.classList.remove('sleep'); });
  });
  el('drop').addEventListener('drop', function(e){
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if(f && f.type.indexOf('image/') === 0) neem(f);
  });

  /* De foto verkleinen en het kruisje erin branden. Verkleinen is nodig: een foto van een telefoon is al snel
     4 tot 6 MB, en Netlify neemt maximaal 8 MB per bestelling aan. Met 1600 pixels aan de lange kant blijft
     er ruim genoeg te zien en is een foto zo'n halve MB. Roept klaar(gelukt, bestand) aan. */
  P.metKruis = function(klaar){
    if(!P.foto) return klaar(true, null);
    var terug = function(){   /* verkleinen lukte niet: de originele foto gaat alleen mee als hij klein genoeg is */
      klaar(P.foto.size <= MAX_ONVERKLEIND, P.foto);
    };
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth, h = img.naturalHeight;
        if(!w || !h) return terug();
        var s = Math.min(1, MAX_ZIJDE / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
        var g = c.getContext('2d');
        g.drawImage(img, 0, 0, c.width, c.height);
        if(P.merk){
          var x = P.merk.x * c.width, y = P.merk.y * c.height;
          var r = Math.max(18, Math.min(c.width, c.height) * 0.055);
          g.lineCap = 'round';
          [['#ffffff', r*0.34], ['#c8341a', r*0.17]].forEach(function(laag){
            g.strokeStyle = laag[0]; g.lineWidth = laag[1];
            g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.stroke();
            g.beginPath();
            g.moveTo(x - r*0.62, y - r*0.62); g.lineTo(x + r*0.62, y + r*0.62);
            g.moveTo(x + r*0.62, y - r*0.62); g.lineTo(x - r*0.62, y + r*0.62);
            g.stroke();
          });
        }
        c.toBlob(function(blob){
          if(!blob) return terug();
          klaar(true, new File([blob], 'plek-' + n + (P.merk ? '-met-kruisje' : '') + '.jpg', {type:'image/jpeg'}));
        }, 'image/jpeg', 0.85);
      }catch(e){ terug(); }
    };
    img.onerror = terug;
    img.src = el('drop-prev').src;
  };

  P.omschrijving = function(){ return el('f-plek').value.trim(); };
  P.kruisTekst = function(){
    return P.merk ? 'aangewezen op de foto (' + Math.round(P.merk.x*100) + '% van links, '
                  + Math.round(P.merk.y*100) + '% van boven)' : 'niet aangewezen';
  };
  return P;
}

var PLEK = [maakPlek(1), maakPlek(2)];

function toonPlek2(){
  byId('plek2').hidden = !tweeAan;
  byId('plek1-kop').hidden = !tweeAan;
  if(!tweeAan) PLEK[1].weg();
}

byId('wijzig').addEventListener('click', function(){
  scrollNaar(byId('advice'));
});
byId('terug2').addEventListener('click', function(){ naarStap(2); scrollNaar(byId('boeken')); });

byId('naar3').addEventListener('click', function(){
  var velden = [['f-naam','je naam'],['f-tel','je telefoonnummer'],['f-mail','je e-mailadres'],
                ['f-adres','je straat en huisnummer'],['f-pc','je postcode en plaats'],
                ['f-plek1','waar het anker moet komen']];
  if(tweeAan) velden.push(['f-plek2','waar het tweede anker moet komen']);
  for(var i=0; i<velden.length; i++){
    var el = byId(velden[i][0]);
    if(!el.value.trim()){
      var f = byId('stap2-err');
      f.hidden = false;
      f.textContent = 'Vul nog even ' + velden[i][1] + ' in.';
      el.focus(); return;
    }
  }
  if(byId('f-mail').value.indexOf('@') < 1){
    byId('stap2-err').hidden = false;
    byId('stap2-err').textContent = 'Dat e-mailadres klopt nog niet.';
    byId('f-mail').focus(); return;
  }
  for(var j=0; j < (tweeAan ? 2 : 1); j++){
    if(PLEK[j].foto && !PLEK[j].merk){
      byId('stap2-err').hidden = false;
      byId('stap2-err').textContent = 'Zet nog even een kruisje op de foto van plek ' + (j+1)
        + ', dan weten we precies waar we moeten boren.';
      byId('prev-wrap' + (j+1)).scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
  }
  byId('stap2-err').hidden = true;
  naarStap(3);
  scrollNaar(byId('boeken'));
});

byId('betaal').addEventListener('click', function(){
  if(!BESTELLEN_OPEN) return;   /* bestellen staat uit (zie gedeeld.js): er wordt niets verstuurd */
  if(!byId('ak-start').checked || !byId('ak-vw').checked){
    byId('ak-err').hidden = false;
    byId('ak-err').textContent = !byId('ak-start').checked
      ? 'Zet nog even een vinkje bij de eerste regel. Zonder dat verzoek mogen we niet binnen veertien dagen komen monteren.'
      : 'Zet nog even een vinkje bij de voorwaarden.';
    (byId('ak-start').checked ? byId('ak-vw') : byId('ak-start')).focus();
    return;
  }
  byId('ak-err').hidden = true;
  var d = verzamel();
  var knop = this;

  function klaar(){
    byId('done-txt').textContent =
      'Dank je, ' + d.naam.split(' ')[0] + '. Je bestelling staat genoteerd (' + bedragTekst(false) + '). ' +
      'Je hoort op ' + d.email + ' of het op de door jou gekozen plek kan, en op welke dag we komen. Thuis zijn hoeft niet: je kettingslot hangt bij ons vertrek al door het anker en de sleutels gaan door je brievenbus. ' +
      'Je ontvangt de betaallink per e-mail; na de montage krijg je een gedateerd fotoverslag voor je verzekeraar.' +
      (PLEK[0].foto ? '' : ' Stuur je nog even een foto van de muur mee als antwoord op die mail?');
    byId('done').classList.add('on');
    byId('stap3').hidden = true;
    scrollNaar(byId('done'));
  }

  /* Mislukt het versturen, dan zeggen we dat eerlijk, laten alles staan en bieden een andere weg aan.
     Het is dus nooit zo dat er "Gelukt" staat terwijl we niets ontvangen hebben. */
  var fout = byId('send-fout');
  fout.hidden = true;
  function mislukt(foto){
    fout.innerHTML = foto
      ? '<b>We konden je foto niet klein genoeg maken om te versturen.</b>'
        + 'Ga terug naar je gegevens, haal de foto weg en probeer het nog eens. Stuur de foto daarna per e-mail naar ' + ONS_MAILADRES + '.'
      : '<b>Het versturen is niet gelukt.</b>'
        + 'Je gegevens staan nog hier. Probeer het over een paar minuten nog eens. '
        + 'Lukt het dan weer niet, '
        + '<a href="' + mailLink(d) + '">stuur je bestelling per e-mail</a>.';
    fout.hidden = false;
    knop.disabled = false; knoppen();
    fout.scrollIntoView({behavior:'smooth', block:'center'});
  }

  if(BETAAL_ENDPOINT){
    knop.disabled = true; knop.textContent = 'Even geduld…';
    fetch(BETAAL_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(d)})
      .then(function(r){ return r.json(); })
      .then(function(j){ if(j && j.url){ window.location.href = j.url; } else { throw 0; } })
      .catch(function(){ mislukt(false); });
    return;
  }

  if(FORM_ENDPOINT){
    knop.disabled = true; knop.textContent = 'Versturen…';
    PLEK[0].metKruis(function(ok1, b1){
     PLEK[1].metKruis(function(ok2, b2){
      if(!ok1 || (tweeAan && !ok2)) return mislukt(true);
      var fd = new FormData();
      fd.append('form-name', 'bestelling');
      Object.keys(d).forEach(function(k){ fd.append(k, d[k]); });
      if(b1) fd.append('foto1', b1);
      if(b2 && tweeAan) fd.append('foto2', b2);
      fetch(FORM_ENDPOINT, {method:'POST', headers:{'Accept':'application/json'}, body:fd})
        .then(function(r){ return r.ok; }, function(){ return false; })
        .then(function(gelukt){
          if(!gelukt) return mislukt(false);
          klaar();
          knop.disabled = false; knoppen();
        });
     });
    });
    return;
  }

  viaMailprogramma(d);
  klaar();
});

/* ---------- beeldcarrousel ---------- */
var SLIDES = [
  { beeld:'img/muuranker-gevel.jpg',     pos:'center 42%',
    kop:'ART-4 muuranker, gemonteerd', prijs:'€3,19 per maand', bij:'of €99,95 in één keer' },
  { beeld:'img/kettingslot-door-anker.jpg',  pos:'center 55%',
    kop:'Kettingslot door het anker',  prijs:'in je maandbedrag', bij:'ART-2 tot ART-5' },
  { beeld:'img/anker-schuur-garage.jpg',   pos:'center 45%',
    kop:'Ook in de schuur of garage',  prijs:'€2,23 per maand', bij:'tweede anker, zelfde bezoek' }
];

var cara = byId('cara'), dots = byId('cara-dots'), nu = 0, loopt = null;

SLIDES.forEach(function(sl, i){
  var d = document.createElement('div');
  d.className = 'cara-s' + (i === 0 ? ' on' : '');
  d.style.backgroundImage = 'url("' + sl.beeld + '")';
  d.style.backgroundPosition = sl.pos;
  d.setAttribute('role','group');
  d.setAttribute('aria-label', (i+1) + ' van ' + SLIDES.length + ': ' + sl.kop);
  d.innerHTML = '<div class="cara-kaart"><p class="cara-kop">' + sl.kop + '</p>' +
                '<p class="cara-prijs">' + (sl.prijs || euro(MONTAGE_2)) + '</p>' +
                '<p class="cara-bij">' + sl.bij + '</p></div>';
  cara.appendChild(d);

  var b = document.createElement('button');
  b.type = 'button'; b.className = 'cara-dot' + (i === 0 ? ' on' : '');
  b.setAttribute('role','tab');
  b.setAttribute('aria-label', sl.kop);
  b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  b.addEventListener('click', function(){ toon(i); stop(); });
  dots.appendChild(b);
});

function toon(i){
  nu = (i + SLIDES.length) % SLIDES.length;
  Array.prototype.forEach.call(cara.children, function(el, j){ el.classList.toggle('on', j === nu); });
  Array.prototype.forEach.call(dots.children, function(el, j){
    el.classList.toggle('on', j === nu);
    el.setAttribute('aria-selected', j === nu ? 'true' : 'false');
  });
}

function start(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  stop();
  loopt = setInterval(function(){ toon(nu + 1); }, 5000);
}
function stop(){ if(loopt){ clearInterval(loopt); loopt = null; } }

/* vegen op de telefoon */
var x0 = null;
byId('carousel').addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; stop(); }, {passive:true});
byId('carousel').addEventListener('touchend', function(e){
  if(x0 === null) return;
  var dx = e.changedTouches[0].clientX - x0;
  if(Math.abs(dx) > 40) toon(nu + (dx < 0 ? 1 : -1));
  x0 = null;
}, {passive:true});

/* stilzetten zodra iemand er met de muis op komt of erop klikt */
byId('carousel').addEventListener('mouseenter', stop);
byId('carousel').addEventListener('mouseleave', start);

/* stilzetten als het tabblad niet zichtbaar is */
document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
start();

/* balk verbergen zodra het bestelblok in beeld staat */
if('IntersectionObserver' in window){
  new IntersectionObserver(function(rijen){
    rijen.forEach(function(r){
      bijBestellen = r.isIntersecting;
      if(huidig) byId('balk').hidden = bijBestellen || !BESTELLEN_OPEN;
    });
  }, {threshold:0.12}).observe(byId('boeken'));
}

/* Welk filmpje bij welk voertuig. Heeft een voertuig nog geen eigen filmpje,
   dan het meest verwante. Maak je er een bij, zet hem dan hier en in FILMS. */
var FILM_BIJ = {
  fiets:'fiets', ebike:'fiets', racefiets:'fiets', bakfiets:'bakfiets',
  scooter:'motor', motor:'motor', caravan:'motor', boot:'boot', terras:'terras', zelf:'motor'
};

function toonAdvFilm(voertuig){
  var kaart = byId('adv-film');
  var id = FILM_BIJ[voertuig], f = id ? FILMS[id] : null;
  if(!f){ kaart.hidden = true; return; }
  kaart.dataset.film = id;
  byId('adv-film-img').src = 'film/' + id + '.jpg';
  byId('adv-film-tijd').textContent = f.tijd;
  byId('adv-film-sub').textContent = f.naam + ', ' + f.waar;
  kaart.setAttribute('aria-label', 'Bekijk het filmpje: ' + f.naam.toLowerCase() + ' ' + f.waar);
  kaart.hidden = false;
}
