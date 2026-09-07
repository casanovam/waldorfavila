#!/usr/bin/env node
// Renders the bilingual site from content/*.js into index.html (es) and en/index.html (en).
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LANGS = [
  { file: 'es', out: 'index.html', base: '' },
  { file: 'en', out: path.join('en', 'index.html'), base: '../' },
];

const esc = (s) => String(s).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function render(t, base, alternates) {
  const img = (f) => `${base}assets/img/${f}`;
  const nav = t.nav.items.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('\n          ');
  const facts = t.hero.facts.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
  const principles = t.principles.items
    .map(
      (p, i) => `
        <article class="principle reveal">
          <figure class="principle-media"><img src="${img(p.img)}" alt="${esc(p.alt)}" width="1536" height="1152" loading="lazy" decoding="async"></figure>
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
  const phones = t.contact.phones.map((p) => `<a href="tel:+34${p.replace(/\D/g, '').replace(/^34/, '')}">${esc(p)}</a>`).join(' · ');
  const alt = alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`).join('\n  ');

  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.description)}">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.description)}">
  <meta property="og:image" content="${img('waldorf-7.jpg')}">
  ${alt}
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
          <img src="${img('waldorf-7.jpg')}" alt="${esc(t.hero.imgAlt)}" width="1536" height="1152" fetchpriority="high">
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
          <div><dt>${esc(t.contact.labels.phone)}</dt><dd>${phones}</dd></div>
          <div><dt>${esc(t.contact.labels.web)}</dt><dd><a href="${t.contact.web}" rel="noopener">${esc(t.contact.webLabel)}</a></dd></div>
          <div><dt>${esc(t.contact.labels.facebook)}</dt><dd>${esc(t.contact.facebook)}</dd></div>
          <div><dt>${esc(t.contact.labels.place)}</dt><dd>${esc(t.contact.place)}</dd></div>
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
}

if (require.main === module) build();
module.exports = { build, render };
