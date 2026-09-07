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
assets/img/        fotografías del jardín
serve.js           servidor estático sin dependencias
test/              comprobaciones con node:test
```

Para cambiar textos, edita `content/*.js` y ejecuta `npm run build`. Los archivos HTML generados se versionan para que el sitio pueda publicarse tal cual (por ejemplo en GitHub Pages).

## Créditos

Fotografías cortesía de [Ávila con Niños](https://xn--avilaconnios-jhb.com/jardin-de-infancia-waldorf-de-avila/).
Contacto del jardín: waldorfavila@gmail.com · 648 755 577 · 647 643 204.
