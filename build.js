#!/usr/bin/env node
// Renders the bilingual site from content/*.js into index.html (es) and en/index.html (en).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
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
  // Responsive photo: 640/960/1280/1600 copies made by tools/process-images.py (4:3, never upscaled)
  const photo = (file, alt, sizes, extra) => {
    const stem = file.replace(/\.jpg$/, '');
    const widths = [640, 960, 1280, 1600].filter((w) => fs.existsSync(path.join(ROOT, 'assets', 'img', `${stem}-${w}.jpg`)));
    const srcset = widths.map((w) => `${img(`${stem}-${w}.jpg`)} ${w}w`).join(', ');
    return `<img src="${img(`${stem}-960.jpg`)}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" width="1600" height="1200" ${extra}>`;
  };
  const ctaBand = (text) => `<div class="cta-band reveal">
          <p>${esc(text)}</p>
          <div class="actions"><a class="btn btn-primary" href="#contacto">${esc(t.cta.primary)}</a><a class="btn btn-ghost" href="mailto:${t.contact.email}">${esc(t.cta.secondary)}</a></div>
        </div>`;
  const nav = t.nav.items.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('\n          ');
  const facts = t.hero.facts.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
  const principles = t.principles.items
    .map(
      (p, i) => `
        <article class="principle reveal${p.img ? '' : ' no-media'}">
          ${p.img ? `<figure class="principle-media">${photo(p.img, p.alt, '(max-width: 760px) calc(100vw - 2.5rem), (max-width: 1180px) 56vw, 660px', 'loading="lazy" decoding="async"')}</figure>` : ''}
          <div class="principle-body">
            <span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')} / 05</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.text)}</p>
          </div>
        </article>`
    )
    .join('');
  const steps = t.day.steps
    .map(([when, title, text, kind]) => `<li class="${kind} reveal"><span class="phase">${esc(kind === 'out' ? t.day.legend[0] : t.day.legend[1])}</span><span class="when">${esc(when)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`)
    .join('\n        ');
  const rows = t.compare.rows
    .map(
      (r) => `<tr>${r.map((c, i) => `<td data-label="${esc(t.compare.head[i])}">${esc(c)}</td>`).join('')}</tr>`
    )
    .join('\n          ');
  const strengths = t.compare.strengths.map(([h, p]) => `<div class="strength card reveal"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n        ');
  const faq = t.practical.items
    .map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
    .join('\n        ');
  const alt = alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.abs}">`).join('\n  ');
  const reviews = t.reviews.items
    .map(([who, text]) => `<figure class="review reveal"><blockquote><p>${esc(text)}</p></blockquote><figcaption><span class="stars" aria-label="5/5">★★★★★</span> ${esc(who)}</figcaption></figure>`)
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
    image: [SITE_URL + 'assets/img/share.jpg', SITE_URL + 'assets/img/waldorf-1-1280.jpg'],
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
  <meta property="og:image" content="${SITE_URL}assets/img/share.jpg">
  <meta property="og:image:secure_url" content="${SITE_URL}assets/img/share.jpg">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t.hero.imgAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(t.title)}">
  <meta name="twitter:description" content="${esc(t.description)}">
  <meta name="twitter:image" content="${SITE_URL}assets/img/share.jpg">
  <meta name="geo.region" content="ES-AV">
  <meta name="geo.placename" content="Ávila">
  <meta name="geo.position" content="${GEO.lat};${GEO.lng}">
  ${alt}
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}">
  <link rel="preload" as="image" href="${img('waldorf-1-960.jpg')}" imagesrcset="${[640, 960, 1280, 1600].map((w) => `${img(`waldorf-1-${w}.jpg`)} ${w}w`).join(', ')}" imagesizes="(max-width: 860px) calc(100vw - 2.5rem), (max-width: 1180px) 56vw, 660px">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" as="font" type="font/woff2" href="${base}assets/fonts/fraunces-normal-400-600.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="${base}assets/fonts/alegreya-sans-normal-400.woff2" crossorigin>
  <link rel="stylesheet" href="${base}assets/fonts.css">
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
          <a class="lang" href="${t.otherLang.href}" hreflang="${t.otherLang.code}" lang="${t.otherLang.code}" aria-label="${t.otherLang.label} · ${esc(t.nav.langLabel)}" title="${esc(t.nav.langLabel)}">${t.otherLang.label}</a>
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
          ${photo('waldorf-1.jpg', t.hero.imgAlt, '(max-width: 860px) calc(100vw - 2.5rem), (max-width: 1180px) 56vw, 660px', 'fetchpriority="high" decoding="async"')}
          <figcaption>${esc(t.hero.caption)}</figcaption>
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
        <div class="table-scroll">
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
        ${ctaBand(t.cta.afterCompare)}
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
        ${ctaBand(t.cta.afterReviews)}
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
          <div class="contact-actions">
            <a class="btn btn-primary" href="mailto:${t.contact.email}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>${esc(t.contact.emailBtn)}</a>
            <a class="btn btn-ghost" href="${t.contact.instagram}" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>${esc(t.contact.instagramBtn)}</a>
            <a class="btn btn-ghost" href="${t.contact.facebook}" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z"/></svg>${esc(t.contact.facebookBtn)}</a>
          </div>
        </div>
        <div class="contact-info">
          <div class="map">
            <iframe src="https://www.google.com/maps?q=${GEO.lat},${GEO.lng}&z=16&hl=${t.lang}&output=embed" title="${esc(t.contact.mapTitle)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
          <dl class="contact-meta">
            <div><dt>${esc(t.contact.addressLabel)}</dt><dd>${esc(a.street)}<br>${esc(a.postal)} ${esc(a.city)}<br><a href="${t.contact.mapsUrl}" rel="noopener">${esc(t.contact.mapsLabel)}</a></dd></div>
            <div><dt>${esc(t.contact.hoursLabel)}</dt><dd>${esc(t.contact.hours)}</dd></div>
            <div><dt>${esc(t.contact.labels.email)}</dt><dd><a href="mailto:${t.contact.email}">${t.contact.email}</a></dd></div>
            <div><dt>${esc(t.contact.labels.instagram)}</dt><dd><a href="${t.contact.instagram}" rel="noopener">${esc(t.contact.instagramLabel)}</a></dd></div>
          </dl>
        </div>
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

function copyAssets() {
  // Everything under assets/ except the full-size originals in assets/img/src
  const from = path.join(ROOT, 'assets');
  const to = path.join(DIST, 'assets');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true, filter: (src) => !src.includes(path.join('img', 'src')) });
}

function build() {
  copyAssets();
  const alternates = [
    { lang: 'es', href: './' },
    { lang: 'en', href: 'en/' },
  ];
  for (const l of LANGS) {
    const t = require(path.join(ROOT, 'content', `${l.file}.js`));
    const alts = alternates.map((a) => ({ ...a, href: l.base + a.href, abs: SITE_URL + (a.lang === 'es' ? '' : 'en/') }));
    const html = render(t, l.base, alts);
    const out = path.join(DIST, l.out);
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
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, '_headers'), `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
  console.log('built sitemap.xml, robots.txt, _headers → dist/');
}

if (require.main === module) build();
module.exports = { build, render };
