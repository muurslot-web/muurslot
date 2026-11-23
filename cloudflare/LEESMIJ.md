# Muurslot.com op Cloudflare Pages

Dit vervangt Netlify. De site blijft gewone bestanden. Alleen de formulieren en de bezoekersteller zijn kleine programma's.

Wat waar staat:
- cloudflare/bouw.mjs maakt de map dist (alleen wat online hoort) en de huurteksten voor de controle. Bouwopdracht: node cloudflare/bouw.mjs, uitvoermap: dist.
- cloudflare/formulier.js en functions/api/formulier.js verwerken alle formulieren. Ze mailen elke inzending naar info@muurslot.com en sturen de klant bij een bestelling of herroeping een bevestiging, via Resend.
- functions/api/teller.js is de bezoekersteller, met een D1-database.
- cloudflare/_headers bepaalt hoe lang foto's, filmpjes en lettertypen onthouden worden.

Instellen in Cloudflare (eenmalig):
1. Workers en Pages, Pages, koppel de GitHub-opslagplaats muurslot-web/muurslot. Bouwopdracht en uitvoermap zoals hierboven.
2. Database: maak een D1-database met de naam muurslot-teller en koppel die in het project onder Bindings met de naam DB.
3. Variabelen (als geheim): RESEND_API_KEY (de nieuwe sleutel) en TELLER_CODE. Optioneel MAIL_VAN, MAIL_NAAR, MAIL_ANTWOORD.
4. Domein: muurslot.com moet een zone in Cloudflare zijn, dus de nameservers gaan van Mijndomein naar Cloudflare. Eerst alle bestaande DNS-regels (mail, Resend, verificaties) controleren, dan pas omzetten.

Na een wijziging in js/gedeeld.js of js/taal/*.js bouwt Cloudflare zelf de huurteksten opnieuw. Lokaal testen kan met wrangler pages dev dist.
