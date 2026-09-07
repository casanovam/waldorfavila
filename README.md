# Jardín de Infancia Waldorf de Ávila

Sitio web estático y bilingüe (español por defecto, inglés en `/en/`) para el Jardín de Infancia Waldorf de Ávila: un jardín para niños y niñas de 18 meses a 5 años basado en la pedagogía Waldorf.

Static, bilingual (Spanish default, English under `/en/`) website for the Waldorf Kindergarten of Ávila.

## Probar en local / Run locally

Requiere Node 18 o superior. Sin dependencias.

```sh
npm start        # construye y sirve en http://localhost:5173  (inglés: /en/)
npm test         # construye y ejecuta las comprobaciones
npm run build    # solo regenera index.html y en/index.html
```

## Estructura / Structure

```
content/es.js      textos en español
content/en.js      texts in English
build.js           plantilla HTML; genera index.html y en/index.html
assets/styles.css  estilos (tema claro y oscuro, móvil)
assets/site.js     menú móvil, acuarela del inicio
assets/img/        fotografías (640/960/1280/1600, generadas desde assets/img/src)
assets/fonts/      Fraunces y Alegreya Sans autoalojadas (sin peticiones a Google Fonts)
tools/             process-images.py: recorte 4:3, gradado cálido, redimensionado y nitidez
serve.js           servidor estático sin dependencias
test/              comprobaciones con node:test
sitemap.xml        generados por build.js
robots.txt
```

Para cambiar textos, edita `content/*.js` y ejecuta `npm run build`. La URL pública (canonical, Open Graph, sitemap y datos estructurados) se toma de la variable `SITE_URL`; por defecto es `https://casanovam.github.io/waldorfavila/`:

```sh
SITE_URL=https://www.tudominio.es/ npm run build
``` Los archivos HTML generados se versionan para que el sitio pueda publicarse tal cual (por ejemplo en GitHub Pages).

## Fotografías

Los originales viven en `assets/img/src/`. Para regenerar todas las medidas, el gradado y la imagen de compartir (`share.jpg`, 1200×630):

```sh
python3 -m venv .venv && .venv/bin/pip install pillow
.venv/bin/python tools/process-images.py
```

## Rendimiento

Lighthouse 12 en local (7 sept 2026): móvil 90 / 100 / 100 / 100, escritorio 100 / 100 / 100 / 100 (rendimiento, accesibilidad, buenas prácticas, SEO).

## Créditos

Fotografías cortesía de [Ávila con Niños](https://xn--avilaconnios-jhb.com/jardin-de-infancia-waldorf-de-avila/).
Dirección: Calle de la Encina, 25, Chalet 19, 05004 Ávila · Horario: lunes a viernes 8:15 – 14:00 (ampliable hasta las 15:00).
Contacto del jardín: waldorfavila@gmail.com · Instagram [@waldorfavila](https://www.instagram.com/waldorfavila/) · [Facebook](https://www.facebook.com/jardindeinfanciawaldorfavila/).
