/* Bezoekersteller. Telt een bekeken pagina zonder cookies en zonder iets te bewaren waarmee iemand te herkennen is.
   Het stuurt alleen: welke pagina (of welk adres niet bestond), de taal, telefoon, tablet of computer,
   en bij binnenkomst de naam van de site waar de bezoeker vandaan kwam, of de bron uit de link:
   muurslot.com/?bron=flyer, ?utm_source=... of een dealercode ?ref=...
   De cijfers staan op muurslot.com/teller. Op een apparaat waar daar 'Tel dit apparaat niet mee' aanstaat, telt dit niets.
   Opnieuw laden telt niet; robots, zoekmachines en testprogramma's ook niet.
   Op de 404-pagina's staat <meta name="teller" content="niet-gevonden">: dan telt het adres als niet gevonden. */
(function(){
  var ADRES = '/api/teller';

  function uitgezet(){
    try { return localStorage.getItem('muurslot-teller') === 'uit'; } catch(e){ return false; }
  }
  function mag(){
    return !!(navigator.sendBeacon && window.JSON) && !navigator.webdriver && !uitgezet();
  }
  function taal(){
    return (document.documentElement.getAttribute('lang') || 'nl').slice(0, 2).toLowerCase();
  }
  function apparaat(){
    var grof = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if(!grof) return 'computer';
    return Math.min(screen.width, screen.height) < 600 ? 'telefoon' : 'tablet';
  }
  function stuur(g){
    try { navigator.sendBeacon(ADRES, JSON.stringify(g)); } catch(e){}
  }

  /* een geopend filmpje (aangeroepen vanuit openFilm in gedeeld.js) */
  window.telFilm = function(id){
    if(mag()) stuur({f: String(id), t: taal(), a: apparaat()});
  };

  function telPagina(){
    var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var soort = nav ? nav.type : 'navigate';
    if(soort === 'reload') return;
    var g = {t: taal(), a: apparaat()};
    var nietGevonden = document.querySelector('meta[name="teller"][content="niet-gevonden"]');
    var canon = document.querySelector('link[rel="canonical"]');
    if(nietGevonden){ g.n = 1; g.p = location.pathname; }
    else g.p = canon ? new URL(canon.href, location.href).pathname : location.pathname;

    var van = '';
    try { van = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch(e){}
    var thuis = location.hostname.toLowerCase().replace(/^www\./, '');
    var binnen = van && van.replace(/^www\./, '') === thuis;
    if(!binnen && soort !== 'back_forward'){
      g.b = 1;
      var z = new URLSearchParams(location.search);
      var bron = z.get('bron') || z.get('utm_source') || '', dealer = z.get('ref') || '';
      if(bron) g.l = bron.slice(0, 40);
      else if(dealer) g.d = dealer.slice(0, 40);
      else if(van) g.r = van.slice(0, 120);
    }
    stuur(g);
  }

  try {
    if(mag()){
      if(document.prerendering) document.addEventListener('prerenderingchange', telPagina, {once: true});
      else telPagina();
    }
    /* de bron hoort niet in een adres dat de bezoeker bewaart of doorstuurt; de dealercode (ref) blijft staan */
    var q = location.search.slice(1);
    if(q && /(^|&)(bron|utm_[a-z]+)=/i.test(q) && history.replaceState){
      var rest = q.split('&').filter(function(d){ return d && !/^(bron|utm_[a-z]+)=/i.test(d); }).join('&');
      history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    }
  } catch(e){}
})();
