// Draait automatisch bij elke nieuwe formulier-inzending op Netlify.
// Stuurt een bevestiging naar de klant via Resend, in de taal waarin de klant de site las (veld taal).
// Nodig in Netlify (Environment variables): RESEND_API_KEY
// Optioneel: MAIL_VAN (standaard "Muurslot <info@muurslot.com>"), MAIL_ANTWOORD (adres voor antwoorden)
//
// In een andere taal dan Nederlands komt het blok "Je bestelling" uit het veld overzicht:
// dat maakt de site in de taal van de klant. De bestelling zelf komt bij ons altijd in het Nederlands binnen.

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
    nuMoment: 'dit moment'
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
    nuMoment: 'this moment'
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
    nuMoment: 'diesem Zeitpunkt'
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
    nuMoment: 'este momento'
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
    nuMoment: '此刻'
  }
};

exports.handler = async function (event) {
  try {
    const p = JSON.parse(event.body).payload || {};
    const d = p.data || {};
    const formulier = p.form_name;
    const sleutel = process.env.RESEND_API_KEY;
    const aan = (d.email || '').trim();

    if (!sleutel || aan.indexOf('@') < 1) return { statusCode: 200, body: 'overgeslagen' };
    if (formulier !== 'bestelling' && formulier !== 'herroeping') return { statusCode: 200, body: 'geen bevestiging nodig' };

    const taal = TEKST[(d.taal || 'nl').slice(0, 2)] ? (d.taal || 'nl').slice(0, 2) : 'nl';
    const T = TEKST[taal];
    const voornaam = (d.naam || '').trim().split(' ')[0] || '';
    let onderwerp, tekst;

    if (formulier === 'bestelling') {
      const overzicht = (taal !== 'nl' && d.overzicht)
        ? String(d.overzicht).split('\n')
        : ['Voertuig: ' + (d.voertuig || '-'), 'Slot: ' + (d.slot || '-'), 'Totaal: ' + (d.totaal || '-')];
      onderwerp = T.bestelling;
      tekst = [T.groet(voornaam), '', T.dank, '', T.jouw]
        .concat(overzicht)
        .concat(['', T.nu])
        .concat(T.stappen)
        .concat(['', T.foto, '', T.vragen, '', T.slot, 'Muurslot.com'])
        .join('\n');
    } else {
      onderwerp = T.herroeping;
      tekst = [
        T.groet(voornaam),
        '',
        T.ontvangen(d.moment || T.nuMoment),
        T.bestelnr + (d.bestelling || '-'),
        '',
        T.verder,
        '',
        T.slot,
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
