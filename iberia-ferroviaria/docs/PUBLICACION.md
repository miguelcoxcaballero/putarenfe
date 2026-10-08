# Publicación en GitHub Pages

El juego permanece en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/> y el auditorio en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html>. Pages publica desde `main`, carpeta raíz `/`. El archivo `.nojekyll` de la raíz permite servir archivos estáticos directamente. La aplicación de Renfe continúa en la raíz e Iberia Ferroviaria ocupa `iberia-ferroviaria/`.

La próxima versión incorpora Trenespop, 25 fotos generadas, logos parodia y AVArato, con **339/412 grabaciones completas**, 50 audios de la guía y 36 diálogos de Paco con la referencia real de Torrente. Quedan 73 cuerpos disponibles solo como texto. Su publicación y comprobación HTTPS están pendientes. La [prueba nativa](./trenespop-native-339-proof.json) acredita compras, entregas y guardados de la construcción con 17 fotos, anterior a esa ampliación; no certifica reproducción completa ni aprobación humana de las voces.

La última entrega pública comprobada es la de 301 voces, commit `4b59b8e8e6594e6dc72a09313a8801f31168bf7c`. [pages-301-https-proof.json](./pages-301-https-proof.json) conserva las 315 respuestas HTTPS 200 con SHA coincidentes, incluidos sus 301 MP3. La prueba de [261 voces](./pages-261-https-proof.json) es histórica. Cada prueba acredita los archivos exactos que identifica.

Desde la raíz de `putarenfe`, reconstruye a partir de un manifiesto y sus MP3 físicos congelados:

```sh
node iberia-ferroviaria/tools/build-web.mjs \
  --manifest /ruta/al/snapshot/manifest.json \
  --audio-stage /ruta/al/snapshot
```

El constructor extrae `proyecto/dist`, comprueba catálogo, referencias y SHA de audio, y escribe páginas, assets y `release.json`. Los argumentos del snapshot aceptado quedan guardados: desde `proyecto`, `npm run web:build` usa esos mismos inputs. Los MP3 se cargan a petición conservando sus bytes, y los assets de páginas antiguas se conservan para atender la caché. Usa un snapshot congelado como entrada de publicación. El constructor no genera voces ni descarga modelos.

Después de revisar el resultado, publica el commit en `main`:

```sh
git add -- iberia-ferroviaria .nojekyll
git commit -m "Actualiza Iberia Ferroviaria"
git -c pack.threads=1 push origin HEAD:main
```

Pages se reconstruye desde ese commit. Comprueba el estado de la construcción y descarga por HTTPS las páginas, `release.json` y todos sus archivos para contrastar estado HTTP, bytes y SHA. Conserva una prueba fechada con el commit y recuento reales, y actualiza los enlaces con `?v=trenespop339` cuando la entrega esté verificada. Mantén las pruebas anteriores como historial.

El contenido de cada entrega queda en `release.json`; una entrega completa exige cierre y revisión de las 412 tomas, junto con sus pruebas actuales, antes de describirse como terminada. [train-photo-credits.md](./train-photo-credits.md) documenta las imágenes y sus referencias.
