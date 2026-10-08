# Publicación en GitHub Pages

El juego permanece en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/> y el auditorio en <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html>. Pages publica desde `main`, carpeta raíz `/`. El archivo `.nojekyll` de la raíz permite servir archivos estáticos directamente. La aplicación de Renfe continúa en la raíz e Iberia Ferroviaria ocupa `iberia-ferroviaria/`.

La versión publicada incorpora Trenespop, 25 fotos generadas, logos parodia y AVArato, con **339/412 grabaciones completas**, 50 audios de la guía y 36 diálogos de Paco con la referencia real de Torrente. Quedan 73 cuerpos disponibles solo como texto. La [prueba HTTPS de la construcción anterior](./pages-339-https-proof.json) verificó las 381 rutas del [commit `9a8d587`](https://github.com/miguelcoxcaballero/putarenfe/commit/9a8d587e88ee122503cff23e79dce9ecc671ca7d), incluidos los 339 MP3, 33 assets actuales, cinco assets conservados y las 25 fotos, con HTTP 200, bytes y SHA coincidentes. El `release.json` de aquella construcción tiene SHA256 `31cfa7654eda0fb49bfea8e64503d77c4bf0b805084d3666983c85e2c431ba36`.

La actualización local de los seis fabricantes tiene su despliegue público **pendiente**. Sus nuevos logos se generaron por IA utilizando referencias visuales de las compañías correspondientes; Dörfler sigue la referencia de Siemens. La publicación sirve seis WebP sin pérdida como archivos locales independientes y amplía los logos de las tarjetas. Conserva los 339 MP3, las 25 fotos y las identidades de los operadores. La [verificación local](./manufacturer-logos-339-independent-proof.json) acredita los bytes y el alcance de esta revisión, sin atribuirle una prueba nativa o HTTPS todavía pendiente.

La [revisión independiente final](./trenespop-339-final25-independent-proof.json) comprobó la ampliación a 25 fotos y AVArato sin navegador. La [prueba nativa](./trenespop-native-339-proof.json) acredita compras, entregas y guardados de la construcción con 17 fotos, anterior a esa ampliación. Estas pruebas no certifican reproducción completa ni aprobación humana de las voces. [pages-301-https-proof.json](./pages-301-https-proof.json) conserva las 315 respuestas HTTPS 200 del commit `4b59b8e8e6594e6dc72a09313a8801f31168bf7c`, y la prueba de [261 voces](./pages-261-https-proof.json) es histórica. Cada prueba acredita los archivos exactos que identifica.

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

Pages se reconstruye desde ese commit. Comprueba el estado de la construcción y descarga por HTTPS las páginas, `release.json` y todos sus archivos para contrastar estado HTTP, bytes y SHA. Conserva una prueba con el commit y recuento reales, y añade una versión a los enlaces cuando la entrega esté verificada; la actual utiliza `?v=trenespop339`. Mantén las pruebas anteriores como historial.

El contenido de cada entrega queda en `release.json`; una entrega completa exige cierre y revisión de las 412 tomas, junto con sus pruebas actuales, antes de describirse como terminada. [train-photo-credits.md](./train-photo-credits.md) documenta las imágenes y sus referencias.
