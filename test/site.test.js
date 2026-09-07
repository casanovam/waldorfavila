const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { build } = require('../build');

const ROOT = path.join(__dirname, '..');
build();

const pages = {
  es: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  en: fs.readFileSync(path.join(ROOT, 'en', 'index.html'), 'utf8'),
};

test('both languages are built with the right lang attribute', () => {
  assert.match(pages.es, /<html lang="es">/);
  assert.match(pages.en, /<html lang="en">/);
});

test('pages link to each other and declare hreflang alternates', () => {
  assert.match(pages.es, /href="en\/" hreflang="en"/);
  assert.match(pages.en, /href="\.\.\/" hreflang="es"/);
  assert.match(pages.es, /rel="alternate" hreflang="en"/);
  assert.match(pages.en, /rel="alternate" hreflang="es"/);
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
    const dir = lang === 'es' ? ROOT : path.join(ROOT, 'en');
    const refs = [...html.matchAll(/(?:src|href)="((?:\.\.\/)?assets\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length > 5, `expected asset references in ${lang}`);
    for (const ref of refs) assert.ok(fs.existsSync(path.join(dir, ref)), `${lang}: missing ${ref}`);
  }
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
