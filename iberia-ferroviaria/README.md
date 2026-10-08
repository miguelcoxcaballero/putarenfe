# Iberia Ferroviaria · Trenespop

La versión publicada incorpora **Trenespop**, la tienda de trenes nuevos y usados: busca anuncios, filtra por fabricante y plazo de entrega, guarda favoritos y revisa tus compras. Las unidades usadas conservan su antigüedad y estado; los pedidos con envío descuentan una señal y cobran el resto cuando llegan.

La actualización local rehace los **seis logotipos de fabricantes** con imágenes generadas por IA a partir de referencias visuales de Talgo, CAF, Siemens, CRRC y Alstom. Conserva los nombres parodia y amplía las marcas en las tarjetas para facilitar su lectura. Dörfler comparte ahora la referencia visual de Siemens. Su despliegue público está **pendiente**; los enlaces siguientes siguen identificando la entrega publicada anterior.

El catálogo muestra **25 fotos generadas por IA** en un mismo taller, con las marcas parodia Tardo, KAFKA, Schlimmens, Dörfler, BCBB y Malstom. Las operadoras se llaman Tenfe, OuiOui y YaIré. AVArato tiene su propio logo y su rotulación en la foto del tren. Algunas variantes usan la foto de una familia afín; los [créditos de las referencias](./docs/train-photo-credits.md) detallan las series representadas.

- **Jugar:** [Iberia Ferroviaria](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/?v=trenespop339).
- **Escuchar sin el juego:** [Auditorio de voces](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html?v=trenespop339).
- **Fuente editable y pruebas:** [proyecto](./proyecto/) y [docs/README.md](./docs/README.md).

Esta entrega contiene **339 de las 412 grabaciones completas**, los 50 audios de la guía y 36 diálogos de Paco con la referencia real de Torrente. Los 73 cuerpos que faltan por grabar conservan texto y decisiones. El juego y el auditorio comparten las mismas tomas completas; no encadenan los antiguos fragmentos ni sustituyen audios ausentes por síntesis del navegador. La producción y la revisión final de las 412 voces siguen en curso.

Trenespop está publicado desde el [commit `9a8d587`](https://github.com/miguelcoxcaballero/putarenfe/commit/9a8d587e88ee122503cff23e79dce9ecc671ca7d). La [prueba HTTPS de esa construcción anterior](./docs/pages-339-https-proof.json) verificó las 381 rutas con HTTP 200, bytes y SHA coincidentes, incluidos los 339 MP3 y las 25 fotos. La [revisión independiente de los archivos de esa construcción](./docs/trenespop-339-final25-independent-proof.json) comprobó esa ampliación y AVArato. La [prueba nativa de Trenespop](./docs/trenespop-native-339-proof.json) comprobó filtros, favoritos, compras reales, señales, entregas y guardados en escritorio y móvil sobre la construcción previa con 17 fotos. Estas pruebas corresponden a sus archivos exactos y no certifican los nuevos logos, la reproducción de las 412 voces ni una aprobación humana de su naturalidad. La [verificación local de los nuevos logos](./docs/manufacturer-logos-339-independent-proof.json) documenta los archivos, las grabaciones conservadas y el alcance de su comprobación sin navegador.

El progreso se guarda mediante el `localStorage` de tu navegador y origen. Otro dispositivo, navegador o dirección local tiene su propio guardado.

Para probar esta carpeta localmente, ejecuta desde la raíz de `putarenfe`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080/iberia-ferroviaria/> o <http://localhost:8080/iberia-ferroviaria/dialogos.html>. Desde `proyecto`, `npm run web:build` reconstruye la web con el manifiesto congelado aceptado; no genera voces. El contenido de cada entrega queda identificado en [release.json](./release.json), y el procedimiento está en [docs/PUBLICACION.md](./docs/PUBLICACION.md).

Iberia Ferroviaria ocupa esta carpeta propia; la aplicación de Renfe continúa en la raíz del repositorio.
