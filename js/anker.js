/* Het anker: de lijst met sloten onderaan de pagina. */
/* ---------- kettingschets ----------
   Tekent drie schakels op schaal. De dikte is de echte schakeldikte in mm,
   zodat je in één oogopslag ziet wat een klasse hoger betekent.
   Heb je productfoto's? Vervang <span class="lr-img"> door
   <img src="..." alt="..."> en haal deze functie weg. */
function ketting(mm){
  if(!mm) return '<svg viewBox="0 0 64 34" aria-hidden="true"></svg>';
  var d = mm * 0.40, rx = 13, ry = 7.5, cy = 17, x = [14, 32, 50];
  var out = '<svg viewBox="0 0 64 34" aria-hidden="true">';
  for(var i=0; i<3; i++){
    out += '<ellipse cx="'+x[i]+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"'+
           (i===1 ? ' transform="rotate(90 '+x[i]+' '+cy+')"' : '')+
           ' stroke-width="'+d.toFixed(2)+'"/>';
  }
  return out + '</svg>';
}

function kabel(){
  return '<svg viewBox="0 0 64 34" aria-hidden="true">' +
    '<path d="M2 17 Q10 7 18 17 T34 17 T50 17 Q56 17 62 12" stroke-width="4" fill="none"/></svg>';
}

/* ---------- slotenlijst onderaan: alleen ter naslag ---------- */
var ladder = byId('ladder');
SLOTEN.forEach(function(sl){
  if(sl.id === 'geen') return;
  var r = document.createElement('div');
  r.className = 'lr';
  r.innerHTML =
    '<span class="lr-img">' + (sl.kabel ? kabel() : ketting(sl.mm)) +
      '<b>' + mm(sl.mm) + '</b></span>' +
    '<span class="lr-cls">' + (sl.klasse
      ? '<i class="bars">' + bars(sl.klasse, false) + '</i><b>ART-' + sl.klasse + '</b>'
      : '<b class="kab">geen ART</b>') + '</span>' +
    '<span class="lr-len">' + (sl.opMaat ? '5 tot 100\u00a0m' : sl.lengte.replace(' ', '\u00a0')) + '</span>' +
    '<span class="lr-for">' + sl.voor + '</span>' +
    '<span class="lr-pr">' + (sl.opMaat ? 'vanaf ' : '') +
      ctEuro(huurCt(ct(MONTAGE) + ct(sl.opMaat ? kabelPrijs(5) : sl.prijs))) +
      '<b class="lr-pm">per maand, met anker</b></span>';
  ladder.appendChild(r);
});
