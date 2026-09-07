#!/usr/bin/env node
// Renders the bilingual site from content/*.js into index.html (es) and en/index.html (en).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE_URL = (process.env.SITE_URL || 'https://casanovam.github.io/waldorfavila/').replace(/\/?$/, '/');
const MAPS_PLACE = 'https://www.google.com/maps/place/?q=place_id:0xd40f37bb921f0e5:0x4b9080d0b1f6c2f8';
const GEO = { lat: 40.6721393, lng: -4.6794784 };
const LANGS = [
  { file: 'es', out: 'index.html', base: '' },
  { file: 'en', out: path.join('en', 'index.html'), base: '../' },
];

const esc = (s) => String(s).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function render(t, base, alternates) {
  const img = (f) => `${base}assets/img/${f}`;
  const pageUrl = SITE_URL + (t.lang === 'es' ? '' : 'en/');
  // Responsive photo: 480/800/1200 resized copies plus the 1536 original
  const photo = (file, alt, sizes, extra) => {
    const stem = file.replace(/\.jpg$/, '');
    const srcset = [480, 800, 1200].map((w) => `${img(`${stem}-${w}.jpg`)} ${w}w`).concat(`${img(file)} 1536w`).join(', ');
    return `<img src="${img(`${stem}-800.jpg`)}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" width="1536" height="1152" ${extra}>`;
  };
  const nav = t.nav.items.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('\n          ');
  const facts = t.hero.facts.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
  const principles = t.principles.items
    .map(
      (p, i) => `
        <article class="principle reveal">
          <figure class="principle-media">${photo(p.img, p.alt, '(max-width: 760px) calc(100vw - 2.5rem), (max-width: 1180px) 45vw, 520px', 'loading="lazy" decoding="async"')}</figure>
          <div class="principle-body">
            <span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')} / 05</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.text)}</p>
          </div>
        </article>`
    )
    .join('');
  const steps = t.day.steps
    .map(([when, title, text, kind]) => `<li class="${kind}"><span class="when">${esc(when)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`)
    .join('\n        ');
  const rows = t.compare.rows
    .map(
      (r) => `<tr>${r.map((c, i) => `<td data-label="${esc(t.compare.head[i])}">${esc(c)}</td>`).join('')}</tr>`
    )
    .join('\n          ');
  const strengths = t.compare.strengths.map(([h, p]) => `<div class="strength"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n        ');
  const faq = t.practical.items
    .map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
    .join('\n        ');
  const alt = alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n  ');
  const reviews = t.reviews.items
    .map(([who, text]) => `<figure class="review"><blockquote><p>${esc(text)}</p></blockquote><figcaption><span class="stars" aria-label="5/5">★★★★★</span> ${esc(who)}</figcaption></figure>`)
    .join('\n        ');
  const a = t.contact.address;
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['Preschool', 'LocalBusiness'],
    '@id': SITE_URL + '#school',
    name: 'Jardín de Infancia Waldorf de Ávila',
    alternateName: 'Waldorf Ávila',
    description: t.description,
    url: pageUrl,
    image: SITE_URL + 'assets/img/waldorf-7.jpg',
    email: t.contact.email,
    address: { '@type': 'PostalAddress', streetAddress: a.street, postalCode: a.postal, addressLocality: a.city, addressRegion: a.region, addressCountry: a.country },
    geo: { '@type': 'GeoCoordinates', latitude: GEO.lat, longitude: GEO.lng },
    hasMap: t.contact.mapsUrl,
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:15', closes: '14:00' },
    ],
    founder: { '@type': 'Person', name: 'Beatriz' },
    foundingDate: '2015',
    audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'children 18 months to 5 years' },
    sameAs: [t.contact.instagram, t.contact.facebook, MAPS_PLACE],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', bestRating: '5', reviewCount: '16' },
    review: t.reviews.items.map(([who, text]) => ({ '@type': 'Review', author: { '@type': 'Person', name: who }, reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }, reviewBody: text, inLanguage: t.lang })),
  };

  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.description)}">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.description)}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="Jardín de Infancia Waldorf de Ávila">
  <meta property="og:locale" content="${t.lang === 'es' ? 'es_ES' : 'en_GB'}">
  <meta property="og:locale:alternate" content="${t.lang === 'es' ? 'en_GB' : 'es_ES'}">
  <meta property="og:image" content="${SITE_URL}assets/img/waldorf-7-1200.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="900">
  <meta property="og:image:alt" content="${esc(t.hero.imgAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="geo.region" content="ES-AV">
  <meta name="geo.placename" content="Ávila">
  <meta name="geo.position" content="${GEO.lat};${GEO.lng}">
  ${alt}
  <link rel="alternate" hreflang="x-default" href="${base}./">
  <link rel="preload" as="image" href="${img('waldorf-7-800.jpg')}" imagesrcset="${[480, 800, 1200].map((w) => `${img(`waldorf-7-${w}.jpg`)} ${w}w`).join(', ')}" imagesizes="(max-width: 860px) min(100vw - 2.5rem, 32rem), (max-width: 1180px) 42vw, 500px">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..600,0..100,0..1&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap">
  <link rel="stylesheet" href="${base}assets/styles.css">
</head>
<body>
  <header class="site-head">
    <div class="wrap">
      <a class="brand" href="${base || './'}">
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c6 7 12 11 12 19a12 12 0 0 1-24 0c0-8 6-12 12-19z" fill="var(--red)"/><path d="M20 12c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10z" fill="var(--wood)"/></svg>
        <span>${esc(t.nav.brand)}</span>
      </a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <nav class="nav" id="nav">
          ${nav}
          <a class="lang" href="${t.otherLang.href}" hreflang="${t.otherLang.code}" lang="${t.otherLang.code}" aria-label="${esc(t.nav.langLabel)}">${t.otherLang.label}</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero" id="inicio">
      <canvas class="wash" aria-hidden="true"></canvas>
      <div class="wrap">
        <div class="hero-copy">
          <p class="eyebrow">${esc(t.hero.eyebrow)}</p>
          <h1>${esc(t.hero.title)}</h1>
          <p class="lead">${esc(t.hero.lead)}</p>
          <div class="actions">
            <a class="btn btn-primary" href="#contacto">${esc(t.hero.cta)}</a>
            <a class="btn btn-ghost" href="#pedagogia">${esc(t.hero.cta2)}</a>
          </div>
          <div class="facts">${facts}</div>
        </div>
        <figure class="hero-figure">
          ${photo('waldorf-7.jpg', t.hero.imgAlt, '(max-width: 860px) min(100vw - 2.5rem, 32rem), (max-width: 1180px) 42vw, 500px', 'fetchpriority="high" decoding="async"')}
        </figure>
      </div>
    </section>

    <section class="story">
      <div class="wrap">
        <h2>${esc(t.story.title)}</h2>
        <div class="story-text">${t.story.text.map((p) => `<p>${p}</p>`).join('')}</div>
      </div>
    </section>

    <section class="principles" id="pedagogia">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">${esc(t.principles.eyebrow)}</p>
          <h2>${esc(t.principles.title)}</h2>
        </div>
        <div class="principle-list">${principles}
        </div>
      </div>
    </section>

    <section class="day" id="dia">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">${esc(t.day.eyebrow)}</p>
          <h2>${esc(t.day.title)}</h2>
          <p class="note">${esc(t.day.note)}</p>
        </div>
        <ol class="breath">
        ${steps}
        </ol>
        <div class="legend"><span class="out">${esc(t.day.legend[0])}</span><span class="in">${esc(t.day.legend[1])}</span></div>
      </div>
    </section>

    <section class="compare" id="comparativa">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">${esc(t.compare.eyebrow)}</p>
          <h2>${esc(t.compare.title)}</h2>
          <p class="lead">${esc(t.compare.intro)}</p>
        </div>
        <div style="overflow-x:auto">
        <table class="compare-table">
          <thead><tr>${t.compare.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>
          ${rows}
          </tbody>
        </table>
        </div>
        <div class="strengths">
          <h2>${esc(t.compare.strengthsTitle)}</h2>
          <div class="strength-grid">
        ${strengths}
          </div>
        </div>
      </div>
    </section>

    <section class="reviews" id="familias">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">${esc(t.reviews.eyebrow)}</p>
          <h2>${esc(t.reviews.title)}</h2>
          <p class="rating"><span class="stars" aria-hidden="true">★★★★★</span> ${esc(t.reviews.summary)} · <a href="${MAPS_PLACE}" rel="noopener">${esc(t.reviews.link)}</a></p>
        </div>
        <div class="review-grid">
        ${reviews}
        </div>
        <p class="note small">${esc(t.reviews.note)}</p>
      </div>
    </section>

    <section class="practical" id="practico">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">${esc(t.practical.eyebrow)}</p>
          <h2>${esc(t.practical.title)}</h2>
        </div>
        <div class="faq">
        ${faq}
        </div>
      </div>
    </section>

    <section class="contact" id="contacto">
      <div class="wrap">
        <div>
          <p class="eyebrow">${esc(t.contact.eyebrow)}</p>
          <h2>${esc(t.contact.title)}</h2>
          <p style="margin-top:1rem">${esc(t.contact.text)}</p>
        </div>
        <dl class="contact-list">
          <div><dt>${esc(t.contact.labels.email)}</dt><dd><a href="mailto:${t.contact.email}">${t.contact.email}</a></dd></div>
          <div><dt>${esc(t.contact.labels.instagram)}</dt><dd><a href="${t.contact.instagram}" rel="noopener">${esc(t.contact.instagramLabel)}</a></dd></div>
          <div><dt>${esc(t.contact.labels.facebook)}</dt><dd><a href="${t.contact.facebook}" rel="noopener">${esc(t.contact.facebookLabel)}</a></dd></div>
          <div><dt>${esc(t.contact.addressLabel)}</dt><dd>${esc(a.street)}<br>${esc(a.postal)} ${esc(a.city)}<br><a href="${t.contact.mapsUrl}" rel="noopener">${esc(t.contact.mapsLabel)}</a></dd></div>
          <div><dt>${esc(t.contact.hoursLabel)}</dt><dd>${esc(t.contact.hours)}</dd></div>
        </dl>
      </div>
    </section>
  </main>

  <footer class="site-foot">
    <div class="wrap">
      <span>© ${new Date().getFullYear()} ${esc(t.footer.rights)}</span>
      <span>${t.footer.credit}</span>
    </div>
  </footer>

  <script src="${base}assets/site.js" defer></script>
</body>
</html>
`;
}

function build() {
  const alternates = [
    { lang: 'es', href: './' },
    { lang: 'en', href: 'en/' },
  ];
  for (const l of LANGS) {
    const t = require(path.join(ROOT, 'content', `${l.file}.js`));
    const alts = alternates.map((a) => ({ ...a, href: l.base + a.href }));
    const html = render(t, l.base, alts);
    const out = path.join(ROOT, l.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    console.log(`built ${l.out} (${html.length} bytes)`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: SITE_URL, lang: 'es' },
    { loc: SITE_URL + 'en/', lang: 'en' },
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}"/>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
  console.log('built sitemap.xml, robots.txt');
}

if (require.main === module) build();
module.exports = { build, render };
