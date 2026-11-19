#!/usr/bin/env python3
"""Maakt de Engelse, Duitse, Spaanse en Chinese pagina's uit de Nederlandse.

De Nederlandse pagina's in de hoofdmap blijven de bron. Dit script
1. zet in elke Nederlandse pagina de taalkeuze (menu, uitklapmenu, voettekst) en de hreflang-regels,
2. vertaalt elke pagina met de woordenlijst talen/<taal>.json (Nederlandse tekst -> vertaling)
   en schrijft hem naar /<taal>/<pagina>.html,
3. maakt sitemap.xml opnieuw, met alle talen.

Gebruik:
  python3 talen/bouw.py ontbreekt en      # welke teksten nog geen Engelse vertaling hebben (talen/ontbreekt-en.json)
  python3 talen/bouw.py bouw              # alles opnieuw maken; stopt als er een vertaling ontbreekt
  python3 talen/bouw.py bouw --los        # toch bouwen; ontbrekende teksten blijven Nederlands

Wijzig je een Nederlandse tekst, zet dan de nieuwe tekst met vertaling in elke talen/<taal>.json
en draai bouw opnieuw. De scripts (js/) vertalen apart, via js/taal/<taal>.js.
"""
import json, re, sys, datetime
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Tag

MAP = Path(__file__).resolve().parent.parent
TALEN = ['en', 'de', 'es', 'zh']
NAAM = {'nl': 'Nederlands', 'en': 'English', 'de': 'Deutsch', 'es': 'Español', 'zh': '中文'}
CODE = {'nl': 'NL', 'en': 'EN', 'de': 'DE', 'es': 'ES', 'zh': '中文'}
HREFLANG = {'nl': 'nl', 'en': 'en', 'de': 'de', 'es': 'es', 'zh': 'zh-Hans'}
HTML_LANG = {'en': 'en', 'de': 'de', 'es': 'es', 'zh': 'zh-Hans'}
OG_LOCALE = {'nl': 'nl_NL', 'en': 'en_GB', 'de': 'de_DE', 'es': 'es_ES', 'zh': 'zh_CN'}
TAALLABEL = {'nl': 'Taal', 'en': 'Language', 'de': 'Sprache', 'es': 'Idioma', 'zh': '语言'}
SITE = 'https://muurslot.com'
PAGINAS = ['index', 'zo-werkt-het', 'het-anker', 'verzekering', 'veelgestelde-vragen', 'over-ons',
           'zakelijk', 'muuranker-fiets', 'muuranker-bakfiets', 'muuranker-motor', '404']

INLINE = {'a', 'b', 'strong', 'i', 'em', 'span', 'small', 's', 'br', 'sup', 'sub', 'abbr', 'code',
          'time', 'mark', 'u', 'wbr', 'q', 'cite', 'dfn', 'kbd', 'var', 'bdi', 'bdo', 'data'}
OVERSLAAN = {'script', 'style', 'svg', 'template', 'noscript', 'form'}
TAALBLOKKEN = {'taal', 'menu-talen', 'foot-talen'}
ATTRIBUTEN = ('alt', 'title', 'aria-label', 'placeholder')
META = {('name', 'description'), ('property', 'og:title'), ('property', 'og:description'), ('property', 'og:image:alt')}


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def heeft_letters(s):
    """Tekst die vertaald moet worden: woorden, of getallen met een punt of komma (86.950 is in het Engels 86,950)."""
    kaal = re.sub(r'<[^>]+>', '', s)
    return bool(re.search(r'[A-Za-zÀ-ÿ一-鿿]', kaal) or re.search(r'\d[.,]\d', kaal))


# ---------- taalkeuze ----------
def actief():
    """Talen die al een woordenlijst hebben; alleen die komen in de taalkeuze, hreflang en sitemap."""
    return [t for t in TALEN if (MAP / 'talen' / (t + '.json')).exists()]


def url(taal, pagina):
    pad = '' if pagina == 'index' else pagina
    return ('/' if taal == 'nl' else '/' + taal + '/') + pad


def vlag(taal):
    """Een vlaggetje bij de taal (de vlaggen zelf staan in css/site.css, als kleine plaatjes in de stijl)."""
    return '<span class="vlag vlag-%s" aria-hidden="true"></span>' % taal


def links(taal, pagina, klasse=''):
    uit = []
    for t in ['nl'] + actief():
        huidig = ' aria-current="true"' if t == taal else ''
        uit.append('<a%s href="%s" hreflang="%s" lang="%s"%s>%s%s</a>' % (
            (' class="%s"' % klasse) if klasse else '', url(t, pagina), HREFLANG[t], HREFLANG[t], huidig, vlag(t), NAAM[t]))
    return uit


def blok_kop(pagina):
    if pagina == '404':
        return ''
    r = ['<link rel="alternate" hreflang="%s" href="%s%s">' % (HREFLANG[t], SITE, url(t, pagina)) for t in ['nl'] + actief()]
    r.append('<link rel="alternate" hreflang="x-default" href="%s%s">' % (SITE, url('nl', pagina)))
    return '\n'.join(r)


def blok_keuze(taal, pagina):
    return ('<details class="taal">\n      <summary aria-label="%s: %s">%s<span class="taal-code">%s</span></summary>\n      <div class="taal-lijst">\n        %s\n      </div>\n    </details>'
            % (TAALLABEL[taal], NAAM[taal], vlag(taal), CODE[taal], '\n        '.join(links(taal, pagina))))


def blok_menu(taal, pagina):
    return '<div class="menu-talen" aria-label="%s">%s</div>' % (TAALLABEL[taal], ''.join(links(taal, pagina)))


def blok_voet(taal, pagina):
    return '<p class="foot-talen" aria-label="%s">%s</p>' % (TAALLABEL[taal], ''.join(links(taal, pagina)))


def zet_blok(html, naam, inhoud, na=None, voor=None):
    """Vervangt <!-- talen:naam -->...<!-- /talen:naam --> of zet het blok er de eerste keer neer."""
    begin, eind = '<!-- talen:%s -->' % naam, '<!-- /talen:%s -->' % naam
    inspring = re.match(r'[ ]*', inhoud).group(0) if inhoud else ''
    blok = begin + '\n' + inhoud.rstrip() + '\n' + inspring + eind if inhoud.strip() else begin + eind
    if begin in html:
        return re.sub(re.escape(begin) + r'.*?' + re.escape(eind), lambda m: blok, html, count=1, flags=re.S)
    if na:
        m = re.search(na, html, flags=re.S)
        if not m:
            raise SystemExit('Ankerpunt niet gevonden voor talen:%s' % naam)
        return html[:m.end()] + '\n' + blok + html[m.end():]
    m = re.search(voor, html, flags=re.S)
    if not m:
        raise SystemExit('Ankerpunt niet gevonden voor talen:%s' % naam)
    if m.group(0).startswith('\n'):
        return html[:m.start()] + '\n' + inspring + blok + html[m.start():]
    return html[:m.start()] + blok + '\n' + inspring + html[m.start():]


def taalblokken(html, taal, pagina):
    if pagina == '404':
        return html
    html = zet_blok(html, 'kop', blok_kop(pagina), na=r'<link rel="canonical"[^>]*>')
    html = zet_blok(html, 'keuze', '    ' + blok_keuze(taal, pagina), voor=r'<button class="menuknop"')
    html = zet_blok(html, 'menu', '      ' + blok_menu(taal, pagina), voor=r'\n    </div>\n  </div>\n</nav>')
    html = zet_blok(html, 'voet', '    ' + blok_voet(taal, pagina), voor=r'\n  </div>\n</footer>')
    return html


# ---------- teksten vinden ----------
def is_inline(tag):
    if not isinstance(tag, Tag):
        return True
    if tag.name in INLINE:
        return all(is_inline(c) for c in tag.children)
    if tag.name == 'button':   # een tekstknop midden in een zin, zoals 'algemene voorwaarden'
        return all(isinstance(c, NavigableString) and not isinstance(c, Comment) or (isinstance(c, Tag) and c.name in INLINE and is_inline(c)) for c in tag.children)
    return False


def binnenkant(el):
    return norm(''.join(str(c) for c in el.contents if not isinstance(c, Comment)))


def in_taalblok(el):
    for p in [el] + list(el.parents):
        if isinstance(p, Tag) and set(p.get('class') or []) & TAALBLOKKEN:
            return True
    return False


def eenheden(soup):
    """De stukken tekst die vertaald worden: elementen met eigen tekst en alleen inline opmaak erin."""
    gevonden = []

    def loop(el):
        for c in el.children:
            if not isinstance(c, Tag) or c.name in OVERSLAAN or in_taalblok(c):
                continue
            eigen = any(isinstance(x, NavigableString) and not isinstance(x, Comment) and x.strip() for x in c.children)
            if eigen and all(is_inline(x) for x in c.children if isinstance(x, Tag)):
                tekst = binnenkant(c)
                if heeft_letters(tekst):
                    gevonden.append(c)
                continue
            loop(c)
    loop(soup)
    return gevonden


def attribuut_teksten(soup):
    uit = []
    for el in soup.find_all(True):
        if el.name in OVERSLAAN and el.name != 'form' or in_taalblok(el):
            continue
        for a in ATTRIBUTEN:
            if el.has_attr(a) and heeft_letters(el[a]):
                uit.append((el, a))
        if el.name == 'meta' and el.has_attr('content'):
            for k, v in META:
                if el.get(k) == v:
                    uit.append((el, 'content'))
    return uit


def json_ld_teksten(obj, uit):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ('name', 'description', 'alternateName') and isinstance(v, str) and v != 'Muurslot':
                uit.append(v)
            elif k == 'areaServed' and isinstance(v, dict) and isinstance(v.get('name'), str):
                uit.append(v['name'])
            else:
                json_ld_teksten(v, uit)
    elif isinstance(obj, list):
        for v in obj:
            json_ld_teksten(v, uit)
    return uit


def alle_teksten(soup):
    teksten = [binnenkant(e) for e in eenheden(soup)]
    teksten += [norm(el[a]) for el, a in attribuut_teksten(soup)]
    for s in soup.find_all('script', type='application/ld+json'):
        teksten += [norm(x) for x in json_ld_teksten(json.loads(s.string), [])]
    return teksten


# ---------- vertalen ----------
def woordenlijst(taal):
    p = MAP / 'talen' / (taal + '.json')
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def vertaal_json_ld(obj, W, mis, taal, pagina):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in ('name', 'description', 'alternateName') and isinstance(v, str) and v != 'Muurslot':
                obj[k] = W.get(norm(v)) or (mis.append(norm(v)) or v)
            elif k == 'areaServed' and isinstance(v, dict) and isinstance(v.get('name'), str):
                v['name'] = W.get(norm(v['name'])) or (mis.append(norm(v['name'])) or v['name'])
            elif k == 'url' and isinstance(v, str) and v.startswith(SITE):
                obj[k] = SITE + url(taal, pagina)
            else:
                vertaal_json_ld(v, W, mis, taal, pagina)
    elif isinstance(obj, list):
        for v in obj:
            vertaal_json_ld(v, W, mis, taal, pagina)


ASSETS = ('img/', 'css/', 'js/', 'fonts/', 'film/')


def herschrijf_url(u, taal):
    if not u or u.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:', '#', '//')):
        return u
    if u.startswith(ASSETS):
        return '/' + u
    if u.startswith('/'):
        if u.startswith(tuple('/' + a for a in ASSETS)) or u.startswith('/' + taal + '/'):
            return u
        if u == '/' or u.startswith(('/#', '/?')):
            return '/' + taal + '/' + u[1:]
        return '/' + taal + u
    return u


def film_in_taal(u, taal):
    """Een filmpje (of zijn voorplaat) waarvan een versie in deze taal bestaat, wijst naar /film/<taal>/."""
    for voor in (SITE + '/film/', '/film/'):
        if u.startswith(voor):
            naam = u[len(voor):]
            if '/' not in naam and (MAP / 'film' / taal / naam).exists():
                return voor + taal + '/' + naam
    return u


def films_in_json_ld(obj, taal):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                obj[k] = film_in_taal(v, taal)
            else:
                films_in_json_ld(v, taal)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                obj[i] = film_in_taal(v, taal)
            else:
                films_in_json_ld(v, taal)


def vertaal_pagina(pagina, taal, W, mis):
    bron = (MAP / (pagina + '.html')).read_text(encoding='utf-8')
    soup = BeautifulSoup(bron, 'html.parser')

    for el in eenheden(soup):
        nl = binnenkant(el)
        tr = W.get(nl)
        if tr is None:
            mis.append(nl)
            continue
        frag = BeautifulSoup(tr, 'html.parser')
        el.clear()
        for c in list(frag.contents):
            el.append(c.extract())
    for el, a in attribuut_teksten(soup):
        nl = norm(el[a])
        tr = W.get(nl)
        if tr is None:
            mis.append(nl)
        else:
            el[a] = tr
    for s in soup.find_all('script', type='application/ld+json'):
        obj = json.loads(s.string)
        vertaal_json_ld(obj, W, mis, taal, pagina)
        films_in_json_ld(obj, taal)
        s.string = '\n' + json.dumps(obj, ensure_ascii=False, indent=2) + '\n'

    # adressen: pagina's naar /<taal>/, foto's, scripts en filmpjes naar de gedeelde map
    for el in soup.find_all(True):
        for a in ('href', 'src', 'poster'):
            if el.has_attr(a):
                el[a] = film_in_taal(herschrijf_url(el[a], taal), taal)
    html_el = soup.find('html')
    html_el['lang'] = HTML_LANG[taal]
    canon = soup.find('link', rel='canonical')
    if canon:
        canon['href'] = SITE + url(taal, pagina)
    for m in soup.find_all('meta', property='og:url'):
        m['content'] = SITE + url(taal, pagina)
    for m in soup.find_all('meta', property='og:locale'):
        m['content'] = OG_LOCALE[taal]
    # oude adressen met een # (alleen op de Nederlandse startpagina nodig): naar de pagina in deze taal
    for s in soup.find_all('script'):
        if s.string and 'Oude adressen' in s.string:
            s.string = s.string.replace("'/", "'/" + taal + '/')
    # de woordenlijst voor de scripts, vóór het eerste script van de site
    eerste = soup.find('script', src=re.compile(r'/js/gedeeld\.js$'))
    if eerste:
        w = soup.new_tag('script', src='/js/taal/%s.js' % taal)
        w['defer'] = ''
        eerste.insert_before(w)
        eerste.insert_before('\n')

    html = str(soup)
    html = html.replace('<script defer="" src=', '<script defer src=').replace('<script src="/js/taal/%s.js" defer="">' % taal, '<script src="/js/taal/%s.js" defer>' % taal)
    return taalblokken(html, taal, pagina)


# ---------- sitemap ----------
def sitemap():
    vandaag = datetime.date.today().isoformat()
    r = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for pagina in PAGINAS:
        if pagina == '404':
            continue
        for t in ['nl'] + actief():
            r.append('  <url>')
            r.append('    <loc>%s%s</loc>' % (SITE, url(t, pagina)))
            r.append('    <lastmod>%s</lastmod>' % vandaag)
            for t2 in ['nl'] + actief():
                r.append('    <xhtml:link rel="alternate" hreflang="%s" href="%s%s"/>' % (HREFLANG[t2], SITE, url(t2, pagina)))
            r.append('    <xhtml:link rel="alternate" hreflang="x-default" href="%s%s"/>' % (SITE, url('nl', pagina)))
            r.append('  </url>')
    r.append('</urlset>')
    (MAP / 'sitemap.xml').write_text('\n'.join(r) + '\n', encoding='utf-8')


def nederlands_bijwerken():
    for pagina in PAGINAS:
        p = MAP / (pagina + '.html')
        oud = p.read_text(encoding='utf-8')
        nieuw = taalblokken(oud, 'nl', pagina)
        if nieuw != oud:
            p.write_text(nieuw, encoding='utf-8')


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == 'ontbreekt':
        taal = sys.argv[2]
        nederlands_bijwerken()
        W = woordenlijst(taal)
        alles, gezien = [], set()
        for pagina in PAGINAS:
            soup = BeautifulSoup((MAP / (pagina + '.html')).read_text(encoding='utf-8'), 'html.parser')
            for tekst in alle_teksten(soup):
                if tekst not in W and tekst not in gezien:
                    gezien.add(tekst)
                    alles.append({'pagina': pagina, 'nl': tekst})
        (MAP / 'talen' / ('ontbreekt-%s.json' % taal)).write_text(json.dumps(alles, ensure_ascii=False, indent=1), encoding='utf-8')
        print('%d teksten zonder vertaling in %s (talen/ontbreekt-%s.json)' % (len(alles), taal, taal))
        return
    if len(sys.argv) >= 2 and sys.argv[1] == 'bouw':
        los = '--los' in sys.argv
        nederlands_bijwerken()
        tekort = {}
        for taal in TALEN:
            W = woordenlijst(taal)
            if not W and not los:
                print('Geen woordenlijst voor %s, overgeslagen' % taal)
                continue
            (MAP / taal).mkdir(exist_ok=True)
            for pagina in PAGINAS:
                mis = []
                html = vertaal_pagina(pagina, taal, W, mis)
                if mis:
                    tekort.setdefault(taal, []).extend(mis)
                (MAP / taal / (pagina + '.html')).write_text(html, encoding='utf-8')
        sitemap()
        for taal, mis in tekort.items():
            print('%s: %d teksten nog Nederlands' % (taal, len(set(mis))))
        if tekort and not los:
            raise SystemExit(1)
        print('klaar')
        return
    print(__doc__)


if __name__ == '__main__':
    main()
