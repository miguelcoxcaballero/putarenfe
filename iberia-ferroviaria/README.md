# Iberia Ferroviaria · Trenespop

La versión publicada incorpora **Trenespop**, la tienda de trenes nuevos y usados: busca anuncios, filtra por fabricante y plazo de entrega, guarda favoritos y revisa tus compras. Las unidades usadas conservan su antigüedad y estado; los pedidos con envío descuentan una señal y cobran el resto cuando llegan.

Los **seis logotipos de fabricantes renovados ya están publicados**, con imágenes generadas por IA a partir de referencias visuales de Talgo, CAF, Siemens, CRRC y Alstom. Conservan los nombres parodia y ocupan más espacio en las tarjetas para facilitar su lectura. Dörfler comparte ahora la referencia visual de Siemens.

El catálogo muestra **25 fotos generadas por IA** en un mismo taller, con las marcas parodia Tardo, KAFKA, Schlimmens, Dörfler, BCBB y Malstom. Las operadoras se llaman Tenfe, OuiOui y YaIré. AVArato tiene su propio logo y su rotulación en la foto del tren. Algunas variantes usan la foto de una familia afín; los [créditos de las referencias](./docs/train-photo-credits.md) detallan las series representadas.

- **Jugar:** [Iberia Ferroviaria](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/?v=logos339).
- **Escuchar sin el juego:** [Auditorio de voces](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html?v=logos339).
- **Fuente editable y pruebas:** [proyecto](./proyecto/) y [docs/README.md](./docs/README.md).

Esta entrega contiene **339 de las 412 grabaciones completas**, los 50 audios de la guía y 36 diálogos de Paco con la referencia real de Torrente. Los 73 diálogos aún no incorporados a esta entrega conservan texto y decisiones. El juego y el auditorio comparten las mismas tomas completas; no encadenan los antiguos fragmentos ni sustituyen audios ausentes por síntesis del navegador. La producción y la revisión final de las 412 voces siguen en curso.

Los logos renovados están publicados en el [commit `3901721`](https://github.com/miguelcoxcaballero/putarenfe/commit/3901721634b9e37996f0dd75c8bf2e184700986e). La [prueba HTTPS de esta entrega](./docs/pages-manufacturer-logos-339-https-proof.json) verificó sus **389 rutas** con HTTP 200, bytes y SHA coincidentes: 388 comparaciones iniciales y una repetición dirigida del único MP3 que había devuelto un HTTP 503 temporal. Incluye las seis imágenes de marcas, las 25 fotos y los 339 audios, sin afirmar una prueba nativa o una escucha humana de las voces. La [verificación local de los logos](./docs/manufacturer-logos-339-independent-proof.json) conserva la revisión anterior a su publicación.

Trenespop se publicó inicialmente en el [commit `9a8d587`](https://github.com/miguelcoxcaballero/putarenfe/commit/9a8d587e88ee122503cff23e79dce9ecc671ca7d). Su [prueba HTTPS anterior](./docs/pages-339-https-proof.json) verificó 381 rutas y la [revisión independiente](./docs/trenespop-339-final25-independent-proof.json) comprobó las 25 fotos y AVArato. La [prueba nativa de Trenespop](./docs/trenespop-native-339-proof.json) comprobó filtros, favoritos, compras reales, señales, entregas y guardados en escritorio y móvil sobre la construcción previa con 17 fotos. Estas pruebas corresponden a sus archivos exactos y no certifican los nuevos logos, la reproducción de las 412 voces ni una aprobación humana de su naturalidad.

El progreso se guarda mediante el `localStorage` de tu navegador y origen. Otro dispositivo, navegador o dirección local tiene su propio guardado.

Para probar esta carpeta localmente, ejecuta desde la raíz de `putarenfe`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080/iberia-ferroviaria/> o <http://localhost:8080/iberia-ferroviaria/dialogos.html>. Desde `proyecto`, `npm run web:build` reconstruye la web con el manifiesto congelado aceptado; no genera voces. El contenido de cada entrega queda identificado en [release.json](./release.json), y el procedimiento está en [docs/PUBLICACION.md](./docs/PUBLICACION.md).

Iberia Ferroviaria ocupa esta carpeta propia; la aplicación de Renfe continúa en la raíz del repositorio.
