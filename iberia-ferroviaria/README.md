# Iberia Ferroviaria · Trenespop

La siguiente versión está preparada con **Trenespop**, la tienda de trenes nuevos y usados: busca anuncios, filtra por fabricante y plazo de entrega, guarda favoritos y revisa tus compras. Las unidades usadas conservan su antigüedad y estado; los pedidos con envío descuentan una señal y cobran el resto cuando llegan.

El catálogo muestra **25 fotos generadas por IA** en un mismo taller, con las marcas parodia Tardo, KAFKA, Schlimmens, Dörfler, BCBB y Malstom. Las operadoras se llaman Tenfe, OuiOui y YaIré. AVArato tiene su propio logo y su rotulación en la foto del tren. Algunas variantes usan la foto de una familia afín; los [créditos de las referencias](./docs/train-photo-credits.md) detallan las series representadas.

- **Jugar:** [Iberia Ferroviaria](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/?v=trenespop339).
- **Escuchar sin el juego:** [Auditorio de voces](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html?v=trenespop339).
- **Fuente editable y pruebas:** [proyecto](./proyecto/) y [docs/README.md](./docs/README.md).

Esta entrega contiene **339 de las 412 grabaciones completas**, los 50 audios de la guía y 36 diálogos de Paco con la referencia real de Torrente. Los 73 cuerpos que faltan por grabar conservan texto y decisiones. El juego y el auditorio comparten las mismas tomas completas; no encadenan los antiguos fragmentos ni sustituyen audios ausentes por síntesis del navegador. La producción y la revisión final de las 412 voces siguen en curso.

**Publicación de Trenespop pendiente de comprobación HTTPS.** La versión pública comprobada anterior contiene 301 voces: su [prueba HTTPS](./docs/pages-301-https-proof.json) acredita 315 rutas con HTTP 200 y SHA coincidentes. La [prueba nativa de Trenespop](./docs/trenespop-native-339-proof.json) comprobó filtros, favoritos, compras reales, señales, entregas y guardados en escritorio y móvil sobre la construcción con 17 fotos; no certifica la reproducción de las 412 voces ni una aprobación humana de su naturalidad.

El progreso se guarda mediante el `localStorage` de tu navegador y origen. Otro dispositivo, navegador o dirección local tiene su propio guardado.

Para probar esta carpeta localmente, ejecuta desde la raíz de `putarenfe`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080/iberia-ferroviaria/> o <http://localhost:8080/iberia-ferroviaria/dialogos.html>. Desde `proyecto`, `npm run web:build` reconstruye la web con el manifiesto congelado aceptado; no genera voces. El contenido de cada entrega queda identificado en [release.json](./release.json), y el procedimiento está en [docs/PUBLICACION.md](./docs/PUBLICACION.md).

Iberia Ferroviaria ocupa esta carpeta propia; la aplicación de Renfe continúa en la raíz del repositorio.
