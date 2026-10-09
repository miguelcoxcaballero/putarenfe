# Publicación en GitHub Pages

## Entrega 4.0 · Rescate de Tenfe

La 4.0 añade el modo Rescate de Tenfe sin tocar el catálogo de 412 diálogos ni su manifiesto aceptado. `tools/build-web.mjs` copia además `proyecto/dist/assets/rescate/` (imágenes con nombre fijo) y `proyecto/dist/assets/rescate-voces/` (una grabación entera por diálogo del rescate), comprueba que cada nombre lleva el principio de su SHA-256, los registra en `release.json` (`rescue` y `assets`) y añade esos diálogos a la sala de escucha con las mismas URL que usa el juego. Las fotos de BCBB y Dörfler son `assets/rescate/tren-bcbb.webp` y `tren-dorfler.webp`; mientras falten, Trenespop enseña las series 103 y 120.

Orden de trabajo: grabar con `proyecto/tools/build_rescate_voices.py --model … --stage …` (fuera de Git), publicar las tomas validadas con `--package`, subir las imágenes con los nombres de `docs/PROMPT-FOTOS.md` a `proyecto/dist/assets/rescate/` y `assets/rescate/`, reconstruir con `node tools/build-web.mjs`, probar con `proyecto/rescate-ui-test.mjs`, hacer commit en `main` y verificar con `node tools/verify-pages.mjs URL docs/pages-400-https-proof.json`.

El juego utiliza <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/> y el auditorio <https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html>. Pages publica desde `main`, carpeta raíz `/`, con HTTPS y sin CNAME. La aplicación de Renfe continúa en la raíz; Iberia Ferroviaria ocupa `iberia-ferroviaria/`.

La versión completa está publicada y verificada: commit `90247a3a130ac13d65a3d3b41ba713815fcada24`, 496 rutas HTTPS correctas y 412 MP3, sin repeticiones dirigidas tras completarse el despliegue. La [prueba actual](./final412-qa-index.json) enlaza los resultados, sus SHA y los archivos exactos que verifican; las pruebas históricas conservan el alcance de su propia entrega.

La construcción contiene **412/412 grabaciones enteras**, cero cuerpos pendientes, 50 audios de la guía y **47 diálogos de Paco** generados con la muestra real de Torrente interpretado por Santiago Segura. Suman **4097,976 segundos: 68 minutos y 18 segundos**. Juego y auditorio comparten las mismas tomas completas, sin encadenar fragmentos ni usar síntesis del navegador como sustitución. Incluye Trenespop, las 25 fotos del taller, AVArato, los seis logos de fabricantes, 315 intervenciones de situaciones y la campaña de cinco capítulos de 2022 a 2050.

La construcción revisable está fuera de Git, en `/workspace/onboarding/final412-web-stage-001`. Sus huellas son:

| Archivo o entrada | SHA256 |
| --- | --- |
| `release.json` | `37446ca2d267dc3fcc92ce9650fa731f683b12d3762a0508bafca0f1042832e3` |
| `index.html` | `adb5deb55865b7766b889868edf5deb3a38fcb3fb259df375bc8c054a810930c` |
| `dialogos.html` | `226d6dac2f509bee1d25f0099ed8da9d243238a546e3732488f17f346afb4799` |
| Manifiesto de voces C6 completo | `c88ba4b445d5d474060035fc7453c76b495dc42854d6d889a72733bdbca49cac` |
| Catálogo C6 | `6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f` |
| Referencias actuales | `46ba5d81fc8a6f657f5f1cdab3951a39956bfd86a7fcc0798006ea8fa9c470bd` |

El release enumera **412 MP3, 39 assets actuales y 41 assets conservados**, además de las dos páginas. Las 492 entradas de esos tres grupos no son el recuento final de peticiones HTTPS: el verificador añade las páginas, `release.json` y el alias del directorio. El recuento real se obtiene del informe de la ejecución actual.

La integridad física y la revisión del texto/ASR de las 412 tomas han sido aceptadas para validar el producto. Se conservan las diferencias de reconocimiento y las pruebas BASE/SMALL originales. La reconexión interrumpió al supervisor de TTS: su resultado de espera es desconocido y queda representado mediante cierre observado y validación física independiente, sin inventar una salida cero. BASE y SMALL conservan sus esperas propias reales. Nada de ello acredita escucha humana, parecido, acento, sarcasmo o naturalidad de todas las interpretaciones.

Las invariantes de la materialización completa y la campaña legal tienen salida cero registrada. Las pruebas actuales han pasado: 24 intervenciones y 57 acciones reales del tutorial; nueve personajes dentro del juego y nueve muestras de dos párrafos en el auditorio; reproducción de MP3 en la web y compras, entregas, filtros y guardado de Trenespop. Se comprobaron pantallas de 1440, 390 y 320 píxeles y se conservaron los intentos de prueba fallidos y sus correcciones. Las pruebas usan las mismas 412 tomas completas; la cobertura nativa es la muestra descrita, no una escucha de las 412. La comprobación de archivos abarca las 25 fotos; el informe nativo identifica cuáles aparecieron efectivamente en pantalla. Ninguna prueba automatizada constituye una escucha humana de todas las voces.

Reconstruye únicamente con manifiesto, catálogo y MP3 físicos congelados aceptados, desde la raíz de `putarenfe`:

```sh
node iberia-ferroviaria/tools/build-web.mjs \
  --manifest /workspace/onboarding/spoken-brand-final-c6-stage/manifest.json \
  --audio-stage /workspace/onboarding/spoken-brand-final-c6-stage
```

El constructor extrae el último `proyecto/dist`, verifica catálogo, referencias y SHA de audio, y escribe páginas, assets y `release.json`. La construcción completa muestra `412/412 diálogos grabados`. Sus inputs aceptados se guardan como default de reconstrucción; desde `proyecto`, `npm run web:build` usa esos mismos inputs. El constructor no genera voces ni descarga modelos. Conserva assets de páginas antiguas para atender cachés. Los HTML autónomos y mapas D grandes permanecen en una carpeta de pruebas propia fuera de Git; los MP3 publicados se sirven como archivos individuales, inferiores al límite de GitHub.

Después de revisar los resultados actuales y los cambios de esta carpeta, publica un commit mediante actualización normal de `main`. Conserva el contenido de la raíz y no fuerces el historial. Pages se reconstruye desde ese commit. Comprueba el estado de la construcción y verifica por HTTPS las páginas, `release.json`, todos los assets actuales, los 412 MP3 y los assets conservados, contrastando estado HTTP, bytes y SHA.

La comprobación preparada utiliza `verify-pages-release.py` con `--count 412` y el commit final real. Si aparece un fallo temporal, conserva la respuesta inicial y realiza una repetición dirigida solo después de diagnosticarla. Mantén el resultado inicial, la repetición y el informe consolidado; nunca reescribas una prueba fallida como si hubiera pasado en el primer intento. Los enlaces de esta entrega utilizan `?v=v363-412` después de la verificación pública.

La [prueba histórica de los logos de 339 voces](./pages-manufacturer-logos-339-https-proof.json) corresponde al commit `3901721634b9e37996f0dd75c8bf2e184700986e`: verificó 389 rutas mediante 388 comparaciones iniciales y una repetición dirigida del único HTTP503. La [prueba nativa histórica de Trenespop](./trenespop-native-339-proof.json) ejercitó la versión con 17 fotos. Estas pruebas se conservan y no certifican esta construcción completa. [train-photo-credits.md](./train-photo-credits.md) documenta las imágenes y sus referencias.
