/* Prijzen, sloten en voertuigen. Gedeeld door de voorpagina, Het anker en Zakelijk. */
/* ------------------------------------------------------------------
   Alles wat je kunt aanpassen staat in dit ene blok.
   min / rec = ART-klasse (1 t/m 5). prijs = kettingslot in euro's.
------------------------------------------------------------------ */
var MONTAGE = 99.95;
var MONTAGE_2 = 69.95;
var HUUR_OPHALEN = 25;   // eenmalig bij opzeggen, voor het ophalen van anker en slot
var HUUR_OPSLAG  = 1.15; // huurprijs: totaal / 36 maanden, x 1,15. Montage gratis.
   // tweede anker in hetzelfde bezoek

/* Alle sloten op één plek. Pas hier je prijzen aan. */
var SLOTEN = [
  {id:'k110', lengte:'110 cm', klasse:2, mm:8.3, prijs:39,
   voor:'Gewone stadsfiets. Vierkante schakels van gehard staal, 2,2 kg.'},
  {id:'k120', lengte:'120 cm', klasse:3, mm:10, prijs:79,
   voor:'E-bikes en duurdere fietsen. De klasse waar de meeste verzekeraars om vragen.'},
  {id:'k150', lengte:'150 cm', klasse:4, mm:12, prijs:119,
   voor:'Scooter en brommer. Fors zwaarder dan een fietsslot.'},
  {id:'k180', lengte:'180 cm', klasse:4, mm:12, prijs:129,
   voor:'Bakfiets. Genoeg lengte om er echt omheen te komen.'},
  {id:'k200', lengte:'200 cm', klasse:5, mm:16, prijs:179,
   voor:'De zwaarste klasse die bestaat. Voor motoren, en te zwaar om mee te nemen.'},
  {id:'kab250', lengte:'250 cm kabel', klasse:0, mm:10, prijs:29, kabel:true,
   voor:'Staalkabel van 10 mm met los hangslot, 640 gram. Voor tuinmeubels en lichte spullen.'},
  {id:'kab1000', lengte:'10 m kabel', klasse:0, mm:10, prijs:27.86, adviesprijs:30.95, kabel:true,
   voor:'Tien meter. Genoeg om een hele set terrasstoelen in één keer aan het anker te leggen.'},
  {id:'maat', lengte:'op maat', klasse:0, mm:10, prijs:73, kabel:true, opMaat:true,
   voor:'Staalkabel van de rol, 5 tot 100 meter, met geperste ogen en een hangslot. Prijs hangt af van de lengte; vanaf €37.'},
  {id:'geen', lengte:'Geen slot', klasse:0, mm:0, prijs:0,
   voor:'Ik heb al een ketting of koop hem zelf. Dan boeken we alleen de montage.'}
];

function slotById(id){ return SLOTEN.filter(function(s){return s.id===id;})[0]; }

var VOERTUIGEN = [
  {
    id:'fiets', naam:'Fiets', label:'een gewone fiets',
    min:2, rec:3, lengte:'110 tot 120 cm',
    opties:[{id:'k110', tag:'Minimaal vereist door de verzekering'},
            {id:'k120', tag:'Ons advies', advies:true},
            {id:'k150', tag:'Nog een stap zwaarder en langer'},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'Een stadsfiets is zelden het doelwit van een georganiseerde dief, maar wel van de gelegenheidsdief met een kniptang.',
    locknote:'Met het ART-2 slot van 110 cm voldoe je aan het minimale advies. ART-3 is een kleine stap in prijs en levert flink dikkere schakels op.',
    why:'ART-2 is het minimum dat Stichting ART adviseert voor een gewone fiets. Staat je fiets in de stad, \'s nachts, buiten? Ga dan een klasse hoger. Een dief kiest bijna altijd de fiets ernaast als die makkelijker gaat.'
  },
  {
    id:'ebike', naam:'E-bike', label:'een e-bike',
    min:3, rec:4, lengte:'150 cm',
    opties:[{id:'k120', tag:'Minimaal vereist door de verzekering'},
            {id:'k150', tag:'Ons advies', advies:true},
            {id:'k200', tag:'Nog een stap zwaarder en langer'},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'Een e-bike kost al gauw drie mille en is daarmee interessant genoeg om gericht op af te komen.',
    locknote:'Kijk even in je polis. Staat daar ART-2, dan ben je verzekerd, maar de meeste maatschappijen zijn inmiddels naar ART-3 gegaan.',
    why:'Bij een e-bike is een los tweede slot vrijwel altijd verplicht — een insteekketting telt niet mee. Sommige verzekeraars eisen daarbij dat je hem aan een vast object vastzet; thuis heb je dat meestal niet staan. Neem je accu trouwens mee naar binnen als je fiets een nacht buiten staat; die zit er bij veel modellen in twee tellen af en sommige polissen eisen het.'
  },
  {
    id:'bakfiets', naam:'Bakfiets', label:'een bakfiets',
    min:3, rec:4, lengte:'180 cm',
    opties:[{id:'k120', tag:'Minimaal vereist door de verzekering'},
            {id:'k180', tag:'Ons advies', advies:true},
            {id:'k200', tag:'Nog een stap zwaarder en langer'},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'Hier is een muuranker geen luxe maar het enige dat werkt.',
    locknote:'Neem ruim. Met 180 cm kun je om de bak heen, om een echt framedeel en door het anker. Een slot van 150 cm is in de praktijk vaak net te krap. Neem gerust de zware: deze ketting hangt aan je gevel en hoeft nergens heen.',
    why:'Een bakfiets wordt zelden weggefietst — daar is hij te opvallend voor. Hij wordt met z\'n tweeën opgetild en in een bus gezet, ringslot en al. Het enige dat dat tegenhoudt is een verbinding met het gebouw zelf. Een tweede slot is bij een e-bakfiets bijna altijd verplicht, en een aantal verzekeraars eist bovendien dat je hem aan een vast object zet. Op straat is dat een lantaarnpaal; thuis heb je meestal niets.'
  },
  {
    id:'scooter', naam:'Scooter', label:'een scooter of brommer',
    min:3, rec:4, lengte:'150 cm',
    opties:[{id:'k120', tag:'Minimaal vereist door de verzekering'},
            {id:'k150', tag:'Ons advies', advies:true},
            {id:'k200', tag:'Nog een stap zwaarder en langer'},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'Twee man tillen een scooter zo een bus in. Een schijfremslot houdt hem hooguit tegen op eigen wielen.',
    locknote:'ART-3 is het minimum, maar bij nieuwere scooters vragen verzekeraars regelmatig ART-4. Vraag het na voordat je koopt.',
    why:'Een schijfremslot voorkomt wegrijden, niet wegdragen. Pas als de ketting door een verankerd punt loopt, moet een dief de muur mee. InShared rekent €400 eigen risico in plaats van €200 als je scooter niet aan een in de grond verankerd voorwerp vastzat. Dat verschil is al twee keer de montage.'
  },
  {
    id:'boot', naam:'Boot', label:'een boot',
    min:3, rec:4, lengte:'200 cm of langer',
    opties:[{id:'k120', tag:'Minimaal vereist door de verzekering'},
            {id:'k200', tag:'Ons advies', advies:true},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'Bij boten is een vast punt op de wal geen advies maar vaak een polisvoorwaarde.',
    locknote:'Neem ruim. De ketting moet van een bevestigingspunt op je boot tot aan het anker op de wal reiken, en bij wisselend waterpeil wil je speling.',
    why:'Het Watersportverbond stelt het onomwonden: uitbetaling bij diefstal is uitgesloten als de boot niet met een ART- of CCV-goedgekeurde ketting of staalkabel verbonden is met een vast punt op de boot, wal of steiger. Ligt je boot in Amsterdam, Utrecht, Leiden of Den Haag en niet in een jachthaven of op afgesloten terrein, dan stellen verzekeraars daar bovenop extra eisen. Let op: je buitenboordmotor is een apart verhaal. Daar hoort een CCV- of VbV-goedgekeurd buitenboordmotorslot bij, en dat verkopen wij niet.'
  },
  {
    id:'motor', naam:'Motor', label:'een motor',
    min:4, rec:5, lengte:'200 cm',
    opties:[{id:'k180', tag:'Minimaal vereist door de verzekering'},
            {id:'k200', tag:'Ons advies', advies:true},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
    lede:'De zwaarste categorie, en de enige waarbij het anker zelf ook echt op de proef wordt gesteld.',
    locknote:'ART-5 is de zwaarste klasse die bestaat. Zo\'n ketting weegt al snel zes kilo — je laat hem thuis bij het anker liggen.',
    why:'Hier is een anker bij sommige verzekeraars gewoon een polisvoorwaarde. Staat je motor buiten, dan eist InShared een ketting- of beugelslot van minimaal ART-4 aan een in de grond verankerd voorwerp; Univé adviseert met zoveel woorden een muur- of vloeranker. Zet het anker bij voorkeur in de vloer van je garage of schuur, niet in de buitengevel: daar kan een dief met beide handen bij en heeft hij ruimte om te wrikken.'
  }
];

/* ---------- helpers ---------- */
function bars(n, good){
  var s='';
  for(var i=1;i<=5;i++) s += '<i class="bar'+(i<=n?(good?' g':' f'):'')+'"></i>';
  return s;
}
function euro(n){
  /* Nederlands: punt als duizendtal, komma voor centen. Hele bedragen zonder ,00 */
  var afgerond = Math.round(n * 100) / 100;
  var geheel = Math.floor(afgerond);
  var rest = Math.round((afgerond - geheel) * 100);
  if(rest === 0) return '€' + geheel;
  return '€' + geheel + ',' + (rest < 10 ? '0' + rest : rest);
}
function mm(x){ return String(x).replace('.', ',') + ' mm'; }
function slotNaam(sl){
  if(!sl.prijs) return 'Geen slot';
  if(sl.kabel)  return 'Kabelslot ' + sl.lengte.replace(' kabel', '');
  return 'Kettingslot ' + sl.lengte + ' (ART-' + sl.klasse + ')';
}

/* ---------- picker ---------- */
VOERTUIGEN.push({
  id:'caravan', naam:'Caravan', label:'een caravan of vouwwagen',
  min:4, rec:5, lengte:'200 cm of langer',
  opties:[{id:'k200', tag:'Ons advies', advies:true},
          {id:'maat', tag:'Langer nodig? Kabel op maat'},
          {id:'geen', tag:'Ik heb zelf al een ketting'}],
  lede:'Een caravan wordt niet opgetild maar aangekoppeld en weggereden. Daar helpt een anker pas tegen als er een zware ketting doorheen loopt.',
  locknote:'Reken op lengte: de ketting moet van het chassis of de dissel tot aan het anker in je oprit of schuurvloer reiken.',
  why:'Wees hier eerlijk over wat je verzekeraar wil: die eist een goedgekeurd disselslot of wielklem, bij InShared met een VbV- of SCM-keurmerk, bij Univé met CCV of SCM. Zonder dat vergoeden die twee diefstal niet, hoeveel kettingen je er ook aan hangt. Staat je caravan in een afgesloten stalling, dan vervalt die eis bij allebei. Een grondanker is dus geen vervanging maar een aanvulling: het disselslot voorkomt aankoppelen, het anker voorkomt dat iemand hem alsnog wegsleept. Bij langdurige stalling thuis is die combinatie het sterkst.'
});

VOERTUIGEN.push({
  id:'racefiets', naam:'Racefiets', label:'een racefiets',
  min:2, rec:3, lengte:'110 tot 120 cm',
  opties:[{id:'k110', tag:'Minimaal vereist door de verzekering'},
            {id:'k120', tag:'Ons advies', advies:true},
            {id:'k150', tag:'Nog een stap zwaarder en langer'},
            {id:'geen', tag:'Ik heb zelf al een ketting'}],
  lede:'Op een racefiets zit meestal helemaal geen slot. Niet eens een ringslot.',
  locknote:'Onderweg neem je zo min mogelijk gewicht mee, en dat snappen we. Maar thuis speelt dat niet: die ketting hangt aan het anker en gaat nergens heen.',
  why:'Een racefiets van een paar duizend euro wordt bijna altijd binnen gezet, en dat is ook het beste. Maar in de praktijk staat hij regelmatig even in de schuur, in de gang of tegen de gevel — na een rit, tijdens het uitladen, als de garage openstaat. Precies dan is hij weg. Een anker met een ketting die er al aan hangt kost je vijf seconden. Check ook je polis: een losse fietsverzekering eist vrijwel altijd een goedgekeurd slot, ook als je fiets alleen thuis staat.'
});

VOERTUIGEN.push({
  id:'terras', naam:'Terras', label:'tuinmeubels of een terras',
  min:0, rec:0, lengte:'250 cm of 10 meter',
  opties:[{id:'kab250', tag:'Voor een paar stoelen of een BBQ'},
          {id:'kab1000', tag:'Ons advies bij een hele set', advies:true},
          {id:'maat', tag:'Op maat, 5 tot 100 meter'},
          {id:'k200', tag:'Als er iets duurs tussen staat'},
          {id:'geen', tag:'Ik regel zelf een kabel'}],
  lede:'Tuinmeubels, een BBQ, plantenbakken, of het meubilair van je zaak. Weinig weegt genoeg om niet weggedragen te worden.',
  locknote:'Met tien meter rijg je een hele set stoelen aan elkaar en leg je het geheel aan het anker. Meet even hoe ver je stoelen van de muur staan voordat je kiest.',
  why:'Hier speelt ART geen rol: geen verzekeraar eist een keurmerk voor een terrasstoel. Wees ook eerlijk over wat een kabel is — met een goede kniptang gaat hij door. Het punt is dat losse spullen die aan een ART-4 anker vastliggen niet meer even snel in een busje gaan; daar moet iemand gereedschap voor pakken en tijd voor nemen. Staat er iets echt kostbaars tussen, neem dan een ART-kettingslot in plaats van een kabel.'
});

VOERTUIGEN.push({
  id:'zelf', naam:'Zelf kiezen', label:'je eigen samenstelling',
  min:0, rec:0, lengte:'jij bepaalt',
  opties: SLOTEN.map(function(sl){
    return {id: sl.id, tag: sl.prijs ? 'Schakels van ' + mm(sl.mm) : 'Ik regel zelf een ketting'};
  }),
  lede:'Staat jouw voertuig er niet bij, of weet je zelf al precies wat je wilt? Kies hieronder vrij uit alles wat we voeren.',
  locknote:'Twijfel je? Bel of mail ons even. Wij zeggen liever vooraf dat iets te licht is dan achteraf.',
  why:'Wij geven hier geen advies, want dat hangt af van wat je vastzet en wat je polis eist. Kijk in je voorwaarden naar twee dingen: welk ART-niveau je slot moet hebben, en of je aan een vast object moet vastzetten. Het anker is en blijft ART-4, wat je ook kiest.'
});

var ONDERHOUD  = 3.95;   // jaarlijkse controle, per maand — jouw bedrag, pas dit aan
var TERMIJNEN  = 3;      // in maximaal drie termijnen mag zonder AFM-vergunning
var HUUR_PM    = 3.95;   // huur per maand
var HUUR_MND   = 36;     // drie jaar

/* Kabel op maat. Reken zelf uit wat jouw inkoop is:
   basis dekt het hangslot en de geperste ogen, per meter is de kabel zelf. */
var KABEL_BASIS  = 25;
var KABEL_PER_M  = 2.4;
function kabelPrijs(m){ return Math.round(KABEL_BASIS + KABEL_PER_M * m); }

/* ---------- rekenen in hele centen ----------
   Wat je op het scherm optelt, moet ook echt optellen. Daarom rekenen we in hele centen.
   De huur wordt voor de hele bestelling afgerond (totaal / 36 maanden, x 1,15). Wat er voor een slot of
   een tweede anker bij komt, is het verschil tussen twee afgeronde totalen: basis plus extra is dus altijd
   precies het totaal. Bij in3 vangt het eerste deel de rest op (zie in3()). */
function ct(x){ return Math.round((x || 0) * 100); }
function ctEuro(c){ return euro(c / 100); }
function huurCt(totCt){ return Math.round(totCt / 36 * HUUR_OPSLAG); }
function slotCt(sl){ return sl && sl.prijs ? ct(sl.prijs) : 0; }
