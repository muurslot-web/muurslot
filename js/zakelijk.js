/* Zakelijk: het formulier waarmee een dealer een opdracht aanmeldt. */
/* ---------- dealers ----------
   Geen wachtwoord: met een dealercode kun je alleen wérk aanmelden, niets ophalen.
   Groei je naar tientallen dealers, dan wil je hier wel echte accounts. */
var DEALER_COMMISSIE = 0.20;   // 20% van het totaal; pas dit aan als je een ander percentage afspreekt

var dsel  = byId('d-voertuig');
var dslot = byId('d-slot');

SLOTEN.forEach(function(sl){
  var o = document.createElement('option');
  o.value = sl.id;
  o.textContent = sl.prijs ? slotNaam(sl) + ' — ' + euro(sl.prijs) : t('Geen slot');
  dslot.appendChild(o);
});
dslot.value = 'k180';

function dealerBedragen(){
  var sl  = slotById(dslot.value);
  var bon = MONTAGE + sl.prijs
          + (byId('d-twee').checked ? MONTAGE_2 + sl.prijs : 0)
         ;
  var com = Math.round(bon * DEALER_COMMISSIE * 100) / 100;
  byId('d-pct').textContent  = Math.round(DEALER_COMMISSIE * 100);
  byId('d-bon').textContent  = euro(bon);
  byId('d-com').textContent  = euro(com);
  byId('d-fact').textContent = euro(Math.round((bon - com) * 100) / 100);
  return {bon:bon, com:com, fact:bon - com, slot:sl};
}
['d-slot','d-twee'].forEach(function(id){
  byId(id).addEventListener('change', dealerBedragen);
});
VOERTUIGEN.forEach(function(v){
  if(v.id === 'zelf') return;
  var o = document.createElement('option');
  o.value = v.id; o.textContent = t(v.naam);
  dsel.appendChild(o);
});
var oAnders = document.createElement('option');
oAnders.value = 'anders'; oAnders.textContent = t('Iets anders');
dsel.appendChild(oAnders);

/* Kwam de dealer binnen via zijn eigen link (?ref=...)? Dan de code alvast invullen en het formulier tonen. */
(function(){
  var m = location.search.match(/[?&]ref=([\w-]+)/);
  if(m){
    byId('d-code').value = m[1];
    byId('dealer').hidden = false;
  }
})();

dealerBedragen();

/* "Ik ben fietsdealer" in de voettekst wijst naar #dealer: dan tonen we het formulier en scrollen erheen */
function toonDealer(){
  byId('dealer').hidden = false;
  setTimeout(function(){ scrollNaar(byId('dealer')); }, 30);
}
if(location.hash === '#dealer') toonDealer();
window.addEventListener('hashchange', function(){ if(location.hash === '#dealer') toonDealer(); });

byId('d-stuur').addEventListener('click', function(){
  var velden = [['d-code','je dealercode'], ['d-zaak','de naam van je zaak'],
                ['d-mail','je eigen e-mailadres'], ['d-knaam','de naam van de klant'],
                ['d-ktel','het telefoonnummer van de klant'], ['d-kmail','het e-mailadres van de klant'],
                ['d-kadres','het adres van de klant']];
  for(var i=0; i<velden.length; i++){
    if(!byId(velden[i][0]).value.trim()){
      byId('d-err').hidden = false;
      byId('d-err').textContent = tv('Vul nog even {veld} in.', {veld: t(velden[i][1])});
      byId(velden[i][0]).focus();
      return;
    }
  }
  byId('d-err').hidden = true;

  /* de opdracht naar ons blijft Nederlands, ook als de dealer de site in een andere taal leest */
  var vk = VOERTUIGEN.filter(function(x){ return x.id === dsel.value; })[0];
  var v = vk ? vk.naam : 'Iets anders';
  var g = dealerBedragen();
  var regels = opNL(function(){ return [
    'DEALEROPDRACHT',
    '',
    'Dealercode: ' + byId('d-code').value.trim(),
    'Zaak: '       + byId('d-zaak').value.trim(),
    'Dealer mail: '+ byId('d-mail').value.trim(),
    '',
    'Klant: '      + byId('d-knaam').value.trim(),
    'Telefoon: '   + byId('d-ktel').value.trim(),
    'E-mail: '     + byId('d-kmail').value.trim(),
    'Adres: '      + byId('d-kadres').value.trim(),
    '',
    'Voertuig: '   + v,
    'Slot: '       + (g.slot.prijs ? slotNaam(g.slot, true) : 'geen'),
    'Tweede anker: '+ (byId('d-twee').checked ? 'ja' : 'nee'),
    '',
    'Op de bon van de klant: ' + euro(g.bon),
    'Commissie dealer: '       + euro(g.com),
    'Wij factureren de dealer: ' + euro(g.fact),
    '',
    'Opmerkingen: '+ (byId('d-opm').value.trim() || 'geen'),
    '',
    'Aangemeld op ' + new Date().toLocaleString('nl-NL') + ' via muurslot.com' + (TAAL !== 'nl' ? ' (' + TAAL + ')' : '')
  ].join('\n'); });

  var dealerLink = 'mailto:' + ONS_MAILADRES +
    '?subject=' + encodeURIComponent('Dealeropdracht ' + byId('d-code').value.trim() + ' — ' + byId('d-knaam').value.trim()) +
    '&body='    + encodeURIComponent(regels);

  /* "Bedankt" staat pas in beeld als de opdracht echt binnen is. Lukt het niet, dan zeggen we dat. */
  function dealerKlaar(){
    byId('d-done-txt').textContent =
      tv('Bedankt. Zet {bon} op de bon van {klant}. Wij nemen binnen een werkdag contact op om de plek af te stemmen en de montagedag in te plannen. '
        + 'Daarna sturen we jou een factuur van {factuur}, je commissie van {commissie} is er dan al vanaf.',
        {bon: euro(g.bon), klant: byId('d-knaam').value.trim(), factuur: euro(g.fact), commissie: euro(g.com)});
    byId('d-done').classList.add('on');
    scrollNaar(byId('d-done'));
  }

  if(FORM_ENDPOINT){
    var knopD = byId('d-stuur');
    knopD.disabled = true; knopD.textContent = t('Versturen…');
    var fdd = new FormData();
    fdd.append('form-name', 'dealer');
    fdd.append('dealercode', byId('d-code').value.trim());
    fdd.append('zaak', byId('d-zaak').value.trim());
    fdd.append('klant', byId('d-knaam').value.trim());
    fdd.append('opdracht', regels);
    fetch(FORM_ENDPOINT, {method:'POST', headers:{'Accept':'application/json'}, body:fdd})
      .then(function(r){ return r.ok; }, function(){ return false; })
      .then(function(gelukt){
        knopD.disabled = false; knopD.textContent = t('Opdracht aanmelden');
        if(gelukt){ dealerKlaar(); return; }
        var e = byId('d-err');
        e.innerHTML = tv('<b>Het versturen is niet gelukt.</b>'
          + 'Je gegevens staan nog hier. Probeer het over een paar minuten nog eens. '
          + 'Lukt het dan weer niet, <a href="{link}">mail de opdracht</a>.', {link: dealerLink});
        e.hidden = false;
        e.scrollIntoView({behavior:'smooth', block:'center'});
      });
  } else {
    window.location.href = dealerLink;
    dealerKlaar();
  }
});
