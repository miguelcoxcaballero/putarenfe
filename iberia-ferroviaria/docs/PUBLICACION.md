# Publicación en GitHub Pages

El juego permanece en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/> y el auditorio en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html>. Pages está configurado con el sistema de publicación por rama: `main`, carpeta raíz `/`. El archivo `.nojekyll` de la raíz permite servir los archivos estáticos directamente. Iberia Ferroviaria ocupa `iberia-ferroviaria/`; la aplicación de Renfe continúa en la raíz.

El primer avance publicado tiene **261/412 grabaciones**, guía completa de 50 audios y 28 diálogos de Paco con la referencia real de Torrente. Commit de esa publicación: `b1bce7e339cdd78f9b48d947de6b2ab590871279`. Su construcción de Pages terminó y [pages-261-https-proof.json](./pages-261-https-proof.json) conserva 273 respuestas HTTPS 200 con SHA coincidentes, incluidos los 261 MP3. Esta prueba es histórica y acredita entrega de archivos; no certifica reproducción nativa, naturalidad, parecido ni el catálogo completo de 412.

Desde la raíz de `putarenfe`, el constructor actual permite añadir grabaciones a partir de un manifiesto y sus MP3 físicos congelados:

```sh
node iberia-ferroviaria/tools/build-web.mjs \
  --manifest /ruta/al/snapshot/manifest.json \
  --audio-stage /ruta/al/snapshot
```

El constructor usa las plantillas y metadatos conservados en `web-source`, comprueba el catálogo, las referencias y los SHA del audio, y escribe las páginas, assets y `release.json`. Los MP3 se cargan a petición y conservan sus bytes; no ejecuta TTS. Para incorporar también cambios del juego, hay que renovar las fuentes web desde una pareja verificada de HTML de juego y auditorio y su snapshot común; añadir MP3 no actualiza por sí solo esa fuente de interfaz. No uses el stage activo como una instantánea de publicación.

Después de revisar el resultado, desde la rama `main`:

```sh
git add -- iberia-ferroviaria .nojekyll
git commit -m "Actualiza Iberia Ferroviaria"
git push origin main
```

Pages se reconstruye desde ese commit. Comprueba el estado de la construcción y descarga las páginas, `release.json` y sus archivos para contrastar HTTP y SHA. Las direcciones públicas se mantienen; el recuento y la procedencia de cada versión quedan en `release.json`. Conserva las pruebas anteriores con su versión y hash: no atribuyas una comprobación histórica al HTML nuevo. Una entrega completa requiere el cierre y la revisión de las 412 tomas y sus pruebas actuales antes de describirse como terminada.
