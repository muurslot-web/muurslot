// Draait automatisch bij elke nieuwe formulier-inzending op Netlify.
// Stuurt een bevestiging naar de klant via Resend.
// Nodig in Netlify (Environment variables): RESEND_API_KEY
// Optioneel: MAIL_VAN (standaard "Muurslot <info@muurslot.com>"), MAIL_ANTWOORD (adres voor antwoorden)

exports.handler = async function (event) {
  try {
    const p = JSON.parse(event.body).payload || {};
    const d = p.data || {};
    const formulier = p.form_name;
    const sleutel = process.env.RESEND_API_KEY;
    const aan = (d.email || '').trim();

    if (!sleutel || aan.indexOf('@') < 1) return { statusCode: 200, body: 'overgeslagen' };
    if (formulier !== 'bestelling' && formulier !== 'herroeping') return { statusCode: 200, body: 'geen bevestiging nodig' };

    const voornaam = (d.naam || '').trim().split(' ')[0] || '';
    let onderwerp, tekst;

    if (formulier === 'bestelling') {
      onderwerp = 'We hebben je bestelling ontvangen';
      tekst = [
        'Hoi ' + voornaam + ',',
        '',
        'Dank je wel, we hebben je bestelling ontvangen.',
        '',
        'Je bestelling',
        'Voertuig: ' + (d.voertuig || '-'),
        'Slot: ' + (d.slot || '-'),
        'Totaal: ' + (d.totaal || '-'),
        '',
        'Wat gebeurt er nu',
        '1. We kijken of het anker op de door jou gekozen plek kan.',
        '2. Je hoort van ons op welke dag we komen. Thuis zijn hoeft niet: het kettingslot hangt bij ons vertrek al door het anker en de sleutels gaan door je brievenbus.',
        '3. Je ontvangt de betaallink per e-mail.',
        '4. Na de montage krijg je een gedateerd fotoverslag voor je verzekeraar.',
        '',
        'Heb je nog geen foto van de muur meegestuurd? Stuur die dan als antwoord op deze mail mee, met een kruisje op de plek waar het anker moet komen.',
        '',
        'Vragen? Antwoord gewoon op deze mail.',
        '',
        'Groet,',
        'Muurslot.com'
      ].join('\n');
    } else {
      onderwerp = 'We hebben je herroeping ontvangen';
      tekst = [
        'Hoi ' + voornaam + ',',
        '',
        'We hebben je herroeping ontvangen op ' + (d.moment || 'dit moment') + '.',
        'Bestelling: ' + (d.bestelling || '-'),
        '',
        'We nemen contact met je op over de afhandeling. Bewaar deze mail als bewijs.',
        '',
        'Groet,',
        'Muurslot.com'
      ].join('\n');
    }

    const body = {
      from: process.env.MAIL_VAN || 'Muurslot <info@muurslot.com>',
      to: [aan],
      subject: onderwerp,
      text: tekst
    };
    if (process.env.MAIL_ANTWOORD) body.reply_to = process.env.MAIL_ANTWOORD;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + sleutel, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { statusCode: 200, body: r.ok ? 'verstuurd' : 'mislukt ' + r.status };
  } catch (e) {
    return { statusCode: 200, body: 'fout' };
  }
};
