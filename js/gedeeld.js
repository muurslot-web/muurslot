/* Gedeeld door elke pagina: menu, klantinformatie, filmvenster en herroepen. */
function byId(id){ return document.getElementById(id); }

/* ------------------------------------------------------------------
   Waar aanvragen heen gaan.
   '/' = Netlify Forms. Bestellingen, dealeropdrachten en herroepingen
   komen binnen in Netlify onder Forms, met een mail naar jou als je dat
   daar aanzet. De verborgen formulieren onderaan de pagina vertellen
   Netlify welke velden er zijn. Lukt het versturen niet, dan opent het
   mailprogramma van de klant met alles al ingevuld.
   Leeg laten = altijd via het mailprogramma.
------------------------------------------------------------------ */
var FORM_ENDPOINT   = '/';
var BETAAL_ENDPOINT = '';
/* Hier komt het adres van de Mollie-koppeling (iDEAL, in3 en de eerste huurbetaling).
   Zolang dit leeg is, komt de bestelling per mail binnen en stuur je zelf een betaallink. */
var ONS_MAILADRES = 'info@muurslot.com';

/* ------------------------------------------------------------------
   Bestellen aan of uit.
   false = bezoekers kunnen alles lezen en de prijs bekijken, maar niet bestellen.
   Boven aan elke pagina staat dan een melding, het bestelblok blijft dicht en er gaat niets naar Netlify.
   Weer aanzetten: zet dit op true en
   1. zet de zin over de bedrijfsaansprakelijkheidsverzekering terug bij Leidingen en bedrading
      (hieronder in de voorwaarden) en in veelgestelde-vragen.html, maar pas als de polis er is,
   2. zet in de voorwaarden bij Wie wij zijn je KvK-nummer en btw-id,
   3. zet "availability": "https://schema.org/InStock" terug in de gegevens voor Google in index.html,
   4. zet in 404.html "en kun je bestellen" terug,
   5. haal de melding boven aan elke pagina weg (de regel met class dicht-balk, voor het menu).
------------------------------------------------------------------ */
var BESTELLEN_OPEN = false;

/* ---------- scrollen ---------- */
function scrollNaar(el){
  el.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------- dealerlink ----------
   Een dealer krijgt een eigen link, zoals muurslot.com/?ref=tweewielers-jansen. Die code geven we mee aan elke link naar een
   andere pagina van deze site, zodat hij blijft staan tot de dealer bij Zakelijk is. Er wordt niets opgeslagen. */
(function(){
  var m = location.search.match(/[?&]ref=([\w-]+)/);
  if(!m) return;
  Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function(a){
    var u = a.getAttribute('href');
    if(!u || /^(https?:|mailto:|tel:|#)/.test(u)) return;
    var h = '', i = u.indexOf('#');
    if(i > -1){ h = u.slice(i); u = u.slice(0, i); }
    a.setAttribute('href', u + (u.indexOf('?') > -1 ? '&' : '?') + 'ref=' + m[1] + h);
  });
})();

/* ---------- menu ---------- */
var menuPaneel = byId('menu'), menuKnop = byId('menuknop');
function sluitMenu(){
  if(menuPaneel && !menuPaneel.hidden){ menuPaneel.hidden = true; menuKnop.setAttribute('aria-expanded', 'false'); }
}
menuKnop.addEventListener('click', function(){
  var open = menuPaneel.hidden;
  menuPaneel.hidden = !open;
  menuKnop.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') sluitMenu(); });
document.addEventListener('click', function(e){
  if(menuPaneel.hidden || !e.target.closest || e.target.closest('.nav')) return;
  sluitMenu();
});

/* ---------- bestellen nog niet open ---------- */
/* de melding staat vast in elke pagina (class dicht-balk), zodat de pagina niet verspringt */
if(BESTELLEN_OPEN){
  Array.prototype.forEach.call(document.querySelectorAll('.dicht-balk'), function(el){ el.remove(); });
} else {
  document.documentElement.classList.add('nog-dicht');
  /* de knoppen die naar bestellen leidden, leiden nu naar de prijs */
  Array.prototype.forEach.call(document.querySelectorAll('.navcta'), function(a){
    var lang = a.querySelector('.nc-lang'), kort = a.querySelector('.nc-kort');
    if(lang) lang.textContent = 'Bekijk de prijs';
    if(kort) kort.textContent = 'Prijs';
    if(a.dataset.ga) a.dataset.ga = 'kies';
  });
  Array.prototype.forEach.call(document.querySelectorAll('#menu a'), function(a){
    if(a.textContent.trim() === 'Prijs en bestellen') a.textContent = 'Prijs';
  });
}

/* ---------- klantinformatie ---------- */
var DOCS = {
  vw: ['Algemene voorwaarden', ''
    + '<p><b>Wie wij zijn.</b> Muurslot, Sassenheim, info@muurslot.com.</p>'
    + '<p><b>Wat wij doen.</b> Wij leveren en monteren een ART-4 muuranker op een door jou aangewezen plek, en verkopen kettingsloten en kabelsloten. Anker en slot kun je kopen of huren. Alle prijzen zijn inclusief btw.</p>'
    + '<p><b>Betaling.</b> Na je bestelling krijg je een betaallink per e-mail. Je kiest uit drie vormen. <b>In één keer</b> met iDEAL; na de montage ben je eigenaar van het anker. <b>In drie termijnen via in3</b>: eerst het eerste deel, de rest na 30 en 60 dagen. Je sluit daarvoor een overeenkomst met in3, dat de betaling afhandelt. <b>Huur</b>: de montage is gratis; je betaalt een vast bedrag per maand via automatische incasso, te beginnen met de eerste maand. Dat maandbedrag staat bij je bestelling vermeld.</p>'
    + '<p><b>Huur.</b> De huur geldt voor minimaal 36 maanden en loopt daarna voor onbepaalde tijd door, maandelijks opzegbaar met een opzegtermijn van één maand. Anker en slot blijven eigendom van Muurslot; je kunt ze niet overnemen. Zeg je op, dan halen wij anker en slot op; daarvoor rekenen wij eenmalig €25. Verhuis je, dan kan de huur worden overgedragen aan de nieuwe bewoner. Wordt een maandbedrag niet betaald, dan sturen wij eerst een herinnering met een termijn van veertien dagen voordat wij incassokosten in rekening brengen, zoals de wet voorschrijft.</p>'
    + '<p><b>Terugbetaling.</b> Kan het anker niet worden geplaatst op de plek die jij aanwees, of herroep je vóór de montage, dan betalen wij het volledige bedrag binnen veertien dagen terug.</p>'
    + '<p><b>Uitvoering.</b> Wij bepalen ter plekke welke bevestiging de ondergrond nodig heeft, mechanisch of chemisch, zonder meerprijs. Wij spreken de montagedag vooraf met je af. Je hoeft niet thuis te zijn. Blijkt de ondergrond op de door jou aangewezen plek ongeschikt, dan monteren wij niet en krijg je je geld volledig terug.</p>'
    + '<p><b>Leidingen en bedrading.</b> Jij wijst de plek aan en kent je eigen woning. Geef bij je opdracht door of er water, gas of elektra door die muur loopt. Wij beschikken niet over detectieapparatuur en gaan af op jouw opgave en op wat ter plekke zichtbaar is.</p>'
    + '<p><b>Toestemming om te boren.</b> Wij monteren op de plek die jij aanwijst. Door te bestellen verklaar je dat je eigenaar bent van die muur of vloer, of dat je toestemming hebt van je verhuurder of VvE. Wij vragen dat niet na en controleren het niet. Blijkt achteraf dat je die toestemming niet had, dan zijn de gevolgen daarvan en de kosten van verwijderen of herstellen voor jou. Huur je je woning, of woon je in een appartement met een VvE? Regel het dan vooraf even. Het is meestal een kwestie van één mailtje.</p>'
    + '<p><b>Wettelijke garantie.</b> Je hebt recht op een product dat doet wat je ervan mag verwachten. Dat recht heb je altijd, ook los van wat hier staat.</p>'
    + '<p><b>Klachten.</b> Mail naar info@muurslot.com. Wij reageren binnen veertien dagen. Komen we er samen niet uit, dan kun je je klacht voorleggen aan de rechter.</p>'],

  pv: ['Privacyverklaring', ''
    + '<p><b>Wat wij bewaren.</b> Je naam, telefoonnummer, e-mailadres en adres. En als je die meestuurt: een foto van je gevel met het kruisje waar het anker moet komen.</p>'
    + '<p><b>Waarom.</b> Om de afspraak uit te voeren en je betaling te verwerken. Zonder die gegevens weten we niet waar we moeten zijn.</p>'
    + '<p><b>Die foto.</b> Daarop staat waar jouw fiets straks vastligt. Dat is gevoelige informatie. Wij gebruiken hem alleen om de plek te bepalen en verwijderen hem uiterlijk drie maanden na de montage.</p>'
    + '<p><b>Wie er meewerkt.</b> Een paar partijen verwerken gegevens in onze opdracht. Netlify host deze site en bewaart de bestellingen die hier binnenkomen, met de foto die je meestuurt. Resend verstuurt onze e-mails, zoals de bevestiging van je bestelling. Voor betalingen werken wij met Mollie en, als je in drie termijnen betaalt, met in3. Netlify en Resend zijn Amerikaanse bedrijven die zijn aangesloten bij het EU-US Data Privacy Framework, het kader waarmee gegevens uit Europa wettelijk naar de VS mogen. Verder geven wij je gegevens niet door, tenzij de wet dat van ons vraagt.</p>'
    + '<p><b>Hoe lang.</b> Je factuurgegevens houden wij zeven jaar, omdat de Belastingdienst dat eist. Huur je het anker, dan houden wij je adres zolang de huur loopt. De rest verwijderen wij eerder.</p>'
    + '<p><b>Je rechten.</b> Je mag opvragen wat wij van je hebben, het laten wijzigen of laten wissen. Mail naar info@muurslot.com, wij reageren binnen een maand. Kom je er niet uit, dan kun je klagen bij de Autoriteit Persoonsgegevens.</p>'
    + '<p><b>Cookies.</b> Deze site plaatst geen cookies en meet je gedrag niet.</p>'],

  hr: ['Retour en bedenktijd', '<p><b>Op het kettingslot of kabelslot</b> heb je veertien dagen bedenktijd, gerekend vanaf de dag dat je ze ontvangt. Je hoeft geen reden op te geven. Stuur ze ongebruikt terug, dan krijg je je geld binnen veertien dagen terug. De kosten van het terugsturen zijn voor jou.</p>'
    + '<p><b>Op de montage</b> heb je diezelfde veertien dagen bedenktijd. Maar omdat wij vaak al binnen die veertien dagen komen, vragen wij je bij het afrekenen uitdrukkelijk om al binnen die termijn te mogen beginnen. Vink je dat aan, dan vervalt je herroepingsrecht op de montage zodra het anker geplaatst is. Dat is wettelijk zo geregeld en daarom staat het als apart vinkje in de bestelling, niet weggestopt in de voorwaarden.</p>'
    + '<p><b>Herroep je vóórdat wij gemonteerd hebben</b>, dan krijg je het volledige bedrag binnen veertien dagen terug.</p>'
    + '<p><b>Kan het niet op de plek die jij aanwees</b>, dan monteren wij niet en krijg je je geld volledig terug. Ook als je niets hebt aangevinkt.</p>'
    + '<p><b>Huur je het anker?</b> Dan gelden dezelfde veertien dagen bedenktijd. Zeg je binnen die termijn op en is het anker al geplaatst op jouw uitdrukkelijke verzoek, dan betaal je alleen de huur over de dagen dat het anker er al hing. Daarna geldt de huur voor minimaal 36 maanden en loopt hij per maand door tot je opzegt.</p>'],

  hf: ['Overeenkomst herroepen', '<p>Je mag binnen veertien dagen zonder reden herroepen. Vul in om welke bestelling het gaat en bevestig. Je krijgt een ontvangstbevestiging per e-mail en je geld binnen veertien dagen terug.</p>'
    + '<div class="hf">'
    + '<label for="hf-naam">Je naam</label><input id="hf-naam" autocomplete="name">'
    + '<label for="hf-wat">Welke bestelling</label><input id="hf-wat" placeholder="Bestelnummer, of datum en adres van de bestelling">'
    + '<label for="hf-mail">E-mailadres voor de bevestiging</label><input id="hf-mail" type="email" autocomplete="email">'
    + '<p class="ak-err" id="hf-err" hidden></p>'
    + '<button type="button" class="btn" id="hf-ok">Herroeping bevestigen</button>'
    + '</div><div class="done" id="hf-klaar" role="status"></div>'
    + '<p class="hint">Liever per mail? Stuur je naam, adres en bestelnummer naar <b>info@muurslot.com</b> met de zin: <i>"Ik herroep de overeenkomst."</i></p>']
};

var modal = byId('modal');
document.addEventListener('click', function(e){
  var k = e.target.closest ? e.target.closest('[data-doc]') : null;
  if(!k) return;
  var d = DOCS[k.dataset.doc];
  if(!d) return;
  byId('modal-t').textContent = d[0];
  byId('modal-in').innerHTML = d[1];
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  byId('modal-x').focus();
});
function sluitModal(){ modal.hidden = true; document.body.style.overflow = ''; }
byId('modal-x').addEventListener('click', sluitModal);
modal.addEventListener('click', function(e){ if(e.target === modal) sluitModal(); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !modal.hidden) sluitModal(); });

/* ---------- filmpjes ----------
   De filmpjes staan als mp4 in de map film, naast deze pagina. Zet die map mee online.
   b en h zijn breedte en hoogte, zodat het venster de juiste vorm krijgt. */
var FILMS = {
  bakfiets: {src:'film/bakfiets.mp4', naam:'Bakfiets', waar:'aan de gevel',          tijd:'0:56', b:720,  h:1280},
  fiets:    {src:'film/fiets.mp4',    naam:'Fiets',    waar:'naast de deur',         tijd:'1:02', b:720,  h:1280},
  motor:    {src:'film/motor.mp4',    naam:'Motor',    waar:'in de garagevloer',     tijd:'2:15', b:960,  h:540},
  boot:     {src:'film/boot.mp4',     naam:'Boot',     waar:'aan de beschoeiing',    tijd:'0:56', b:720,  h:1280},
  terras:   {src:'film/terras.mp4',   naam:'Terras',   waar:'stoelen aan een kabel', tijd:'1:03', b:720,  h:1280}
};

var kijk = byId('kijk'), kijkVideo = byId('kijk-video');
var kijkId = null, kijkTerug = null;

function maatFilm(){
  if(!kijkId) return;
  var f = FILMS[kijkId], r = f.b / f.h, cs = getComputedStyle(kijk);
  var ruimB = kijk.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  var ruimH = kijk.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom) - 44;
  var w = Math.max(120, Math.min(ruimB, ruimH * r));
  kijkVideo.style.width  = Math.round(w) + 'px';
  kijkVideo.style.height = Math.round(w / r) + 'px';
}
function openFilm(id, knop){
  var f = FILMS[id];
  if(!f) return;
  kijkId = id;
  kijkTerug = knop || null;
  byId('kijk-naam').textContent = f.naam + ', ' + f.waar;
  byId('kijk-fout').hidden = true;
  kijkVideo.src = f.src;
  kijk.hidden = false;
  document.body.style.overflow = 'hidden';
  maatFilm();
  var p = kijkVideo.play();
  if(p && p.catch) p.catch(function(){});
  byId('kijk-x').focus();
}
function sluitFilm(){
  if(kijk.hidden) return;
  kijkVideo.pause();
  kijkVideo.removeAttribute('src');
  kijkVideo.load();
  kijk.hidden = true;
  kijkId = null;
  document.body.style.overflow = '';
  if(kijkTerug) kijkTerug.focus();
}
kijkVideo.addEventListener('error', function(){
  if(kijkId && kijkVideo.getAttribute('src')) byId('kijk-fout').hidden = false;
});
byId('kijk-x').addEventListener('click', sluitFilm);
kijk.addEventListener('click', function(e){ if(e.target === kijk) sluitFilm(); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') sluitFilm(); });
window.addEventListener('resize', maatFilm);
document.addEventListener('click', function(e){
  var k = e.target.closest ? e.target.closest('[data-film]') : null;
  if(k) openFilm(k.dataset.film, k);
});

/* ---------- herroepen ----------
   De wet vraagt sinds 19 juni 2026 een herroepknop op de site, met een tweede knop om te bevestigen.
   Staat FORM_ENDPOINT ingevuld, dan gaat het op de achtergrond; anders via het mailprogramma.
   Stuur de klant daarna zelf een ontvangstbevestiging per e-mail. */
document.addEventListener('click', function(e){
  if(!e.target.closest || !e.target.closest('#hf-ok')) return;
  var naam = byId('hf-naam').value.trim(), wat = byId('hf-wat').value.trim(), mail = byId('hf-mail').value.trim();
  var err = byId('hf-err');
  if(!naam || !wat || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){
    err.hidden = false;
    err.textContent = 'Vul je naam, de bestelling en een geldig e-mailadres in.';
    return;
  }
  err.hidden = true;
  var moment = new Date().toLocaleString('nl-NL');
  var tekst = 'Ik herroep de overeenkomst.\n\nNaam: ' + naam + '\nBestelling: ' + wat +
              '\nBevestiging naar: ' + mail + '\nVerstuurd op: ' + moment;
  function viaMail(){
    window.location.href = 'mailto:' + ONS_MAILADRES + '?subject=' + encodeURIComponent('Herroeping — ' + naam) +
      '&body=' + encodeURIComponent(tekst);
  }
  function toon(ontvangen){
    var k = byId('hf-klaar');
    k.innerHTML = '';
    var kop = document.createElement('h3');
    kop.textContent = ontvangen ? 'Herroeping ontvangen' : 'Nog één stap';
    var p = document.createElement('p');
    p.textContent = ontvangen
      ? 'We hebben je herroeping op ' + moment + ' ontvangen. Je krijgt een bevestiging op ' + mail + '.'
      : 'Je mailprogramma opent met je herroeping erin. Verstuur die mail, dan bevestigen wij hem op ' + mail + '.';
    k.appendChild(kop); k.appendChild(p);
    k.classList.add('on');
    byId('hf-ok').disabled = true;
  }
  if(FORM_ENDPOINT){
    var fd = new FormData();
    fd.append('form-name', 'herroeping');
    fd.append('soort', 'herroeping'); fd.append('naam', naam); fd.append('bestelling', wat);
    fd.append('email', mail); fd.append('moment', moment);
    fetch(FORM_ENDPOINT, {method:'POST', headers:{'Accept':'application/json'}, body:fd})
      .then(function(r){ if(!r.ok) throw 0; toon(true); })
      .catch(function(){ viaMail(); toon(false); });
  } else {
    viaMail(); toon(false);
  }
});
