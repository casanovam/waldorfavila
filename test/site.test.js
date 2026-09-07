const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { build } = require('../build');

const ROOT = path.join(__dirname, '..');
build();

const DIST = path.join(ROOT, 'dist');
const pages = {
  es: fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(DIST, 'en', 'index.html'), 'utf8'),
};

test('both languages are built with the right lang attribute', () => {
  assert.match(pages.es, /<html lang="es">/);
  assert.match(pages.en, /<html lang="en">/);
});

test('pages link to each other and declare hreflang alternates', () => {
  assert.match(pages.es, /href="en\/" hreflang="en"/);
  assert.match(pages.en, /href="\.\.\/" hreflang="es"/);
  assert.match(pages.es, /rel="alternate" hreflang="en" href="https:\/\/[^"]+\/en\/"/);
  assert.match(pages.en, /rel="alternate" hreflang="es" href="https:\/\/[^"]+\/"/);
  for (const html of Object.values(pages)) assert.doesNotMatch(html, /fonts\.googleapis\.com/, 'fonts must be self-hosted');
});

test('mobile viewport meta and collapsible nav are present', () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
    assert.match(html, /class="menu-btn"[^>]*aria-controls="nav"/);
  }
});

test('key content is present in each language', () => {
  assert.match(pages.es, /Waldorf frente a la escuela tradicional/);
  assert.match(pages.es, /18 meses a 5 años/);
  assert.match(pages.en, /Waldorf versus traditional preschool/);
  assert.match(pages.en, /18 months to 5 years/);
  for (const html of Object.values(pages)) assert.match(html, /waldorfavila@gmail\.com/);
});

test('every referenced local asset exists', () => {
  for (const [lang, html] of Object.entries(pages)) {
    const dir = lang === 'es' ? DIST : path.join(DIST, 'en');
    const refs = [...html.matchAll(/(?:src|href)="((?:\.\.\/)?assets\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length > 5, `expected asset references in ${lang}`);
    for (const ref of refs) assert.ok(fs.existsSync(path.join(dir, ref)), `${lang}: missing ${ref}`);
  }
});

test('dist contains sitemap, robots and headers but not the photo originals', () => {
  for (const f of ['sitemap.xml', 'robots.txt', '_headers']) assert.ok(fs.existsSync(path.join(DIST, f)), f);
  for (const html of Object.values(pages)) {
    assert.match(html, /assets\/styles\.[0-9a-f]{8}\.css/, 'stylesheet must be fingerprinted');
    assert.match(html, /assets\/site\.[0-9a-f]{8}\.js/, 'script must be fingerprinted');
  }
  assert.ok(!fs.existsSync(path.join(DIST, 'assets', 'styles.css')), 'unhashed stylesheet must not ship');
  assert.ok(!fs.existsSync(path.join(DIST, 'assets', 'img', 'src')), 'originals must not ship');
});

test('local server serves both pages', async () => {
  process.env.PORT = '5199';
  const server = require('../serve');
  await new Promise((r) => (server.listening ? r() : server.once('listening', r)));
  try {
    for (const p of ['/', '/en/', '/assets/styles.css']) {
      const res = await fetch(`http://localhost:5199${p}`);
      assert.strictEqual(res.status, 200, p);
    }
    const missing = await fetch('http://localhost:5199/nope.html');
    assert.strictEqual(missing.status, 404);
  } finally {
    server.close();
  }
});

test('contact lists email, Instagram and Facebook only, no phone numbers', () => {
  for (const html of Object.values(pages)) {
    assert.match(html, /instagram\.com\/waldorfavila/);
    assert.match(html, /facebook\.com\/jardindeinfanciawaldorfavila/);
    assert.doesNotMatch(html, /tel:/);
    assert.doesNotMatch(html, /648 ?755 ?577|647 ?643 ?204/);
    assert.doesNotMatch(html, /Ingrid|Aldara/);
    assert.match(html, /Beatriz/);
  }
});

test('English content mirrors the Spanish structure completely', () => {
  const es = require('../content/es');
  const en = require('../content/en');
  const walk = (a, b, trail) => {
    if (Array.isArray(a)) {
      assert.ok(Array.isArray(b), `${trail}: expected array in en`);
      assert.strictEqual(b.length, a.length, `${trail}: array length differs`);
      a.forEach((v, i) => walk(v, b[i], `${trail}[${i}]`));
    } else if (a && typeof a === 'object') {
      for (const k of Object.keys(a)) {
        assert.ok(k in b, `${trail}.${k}: missing in en`);
        walk(a[k], b[k], `${trail}.${k}`);
      }
    } else if (typeof a === 'string') {
      assert.ok(typeof b === 'string' && b.trim().length > 0, `${trail}: empty in en`);
    }
  };
  walk(es, en, 'es');
});

test('SEO: canonical, Open Graph image, description and schema.org Preschool', () => {
  for (const [lang, html] of Object.entries(pages)) {
    assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+">/);
    assert.match(html, /<meta name="description" content="[^"]{50,160}">/, `${lang}: description length`);
    const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    assert.ok(ld, `${lang}: JSON-LD missing`);
    const data = JSON.parse(ld[1]);
    assert.deepStrictEqual(data['@type'], ['Preschool', 'LocalBusiness']);
    assert.strictEqual(data.address.postalCode, '05004');
    assert.strictEqual(data.openingHoursSpecification[0].opens, '08:15');
    assert.strictEqual(data.review.length, 6);
    assert.ok(data.sameAs.some((u) => u.includes('instagram.com/waldorfavila')));
  }
});

test('calls to action repeat after the comparison and after the reviews', () => {
  for (const html of Object.values(pages)) {
    assert.strictEqual((html.match(/class="cta-band/g) || []).length, 2);
    assert.match(html, /class="contact-actions"[\s\S]*mailto:waldorfavila@gmail\.com/);
    assert.match(html, /<iframe src="https:\/\/www\.google\.com\/maps\?q=40\.67[^"]*output=embed"[^>]*loading="lazy"/);
  }
});

test('photos use srcset with resized files and lazy loading below the hero', () => {
  for (const html of Object.values(pages)) {
    const imgs = html.match(/<img [^>]*waldorf-\d[^>]*>/g);
    assert.strictEqual(imgs.length, 5);
    for (const tag of imgs) assert.match(tag, /srcset="[^"]*-640\.jpg 640w, [^"]*-960\.jpg 960w, [^"]*-1280\.jpg 1280w/);
    assert.match(imgs[0], /waldorf-7-1600\.jpg 1600w/);
    assert.match(imgs[0], /fetchpriority="high"/);
    assert.strictEqual(imgs.slice(1).filter((t) => /loading="lazy"/.test(t)).length, 4);
    assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+share\.jpg">/);
    assert.match(html, /<meta property="og:image:height" content="630">/);
  }
});

test('single light theme: no dark-mode overrides and the hero is the canopy photo', () => {
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'styles.css'), 'utf8');
  assert.doesNotMatch(css, /prefers-color-scheme|data-theme/);
  assert.match(css, /color-scheme: light/);
  for (const html of Object.values(pages)) {
    assert.match(html, /<section class="hero"[\s\S]*?waldorf-7-960\.jpg/);
    assert.strictEqual((html.match(/<canvas class="wash"/g) || []).length, 2);
  }
});
