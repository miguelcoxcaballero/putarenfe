# Iberia Ferroviaria · Trenespop

Gestiona una compañía ferroviaria española entre inauguraciones, averías, presupuestos y personajes con muy poca paciencia. La campaña recorre **cinco capítulos, de 2022 a 2050**: dirige Tenfe, conecta ciudades, cumple contratos, renueva infraestructura y compite con OuiOui y YaIré. También puedes empezar una partida libre con tus propias prioridades.

La entrada incluye un menú ilustrado y una guía de **nueve tareas reales**, con decisiones, costes y consecuencias. Los personajes intervienen de uno en uno y todos participan varias veces. Sus **315 intervenciones de situaciones** cubren nueve personajes, siete emociones y cinco situaciones por emoción; esas combinaciones de diálogo no representan 315 mecánicas diferentes.

**Trenespop** es la tienda de trenes nuevos y usados. Filtra por fabricante, condición y plazo de entrega; guarda favoritos y revisa tus pedidos. Los usados conservan su edad y estado. Los envíos cobran una señal del 30 % al reservar y el 70 % restante al llegar. El catálogo utiliza **25 fotos generadas por IA en el mismo taller** y seis logos de fabricantes renovados: Tardo, KAFKA, Schlimmens, Dörfler, BCBB y Malstom. AVArato tiene logo y rotulación propios. Los [créditos](./docs/train-photo-credits.md) detallan las series y variantes representadas.

Esta construcción reúne **412 grabaciones completas, sin cuerpos pendientes**, y **68 minutos y 18 segundos de audio**. Juego y auditorio utilizan las mismas tomas enteras, incluidos los 50 audios de la guía y **47 diálogos de Paco** generados con la muestra real de José Luis Torrente, interpretado por Santiago Segura, obtenida de RTVE. La banda sonora mantiene las melodías e incorpora guitarra, cajón y palmas. La revisión técnica de voces conserva sus discrepancias de reconocimiento; no equivale a una aprobación humana de parecido, naturalidad o interpretación.

- **Jugar:** [Iberia Ferroviaria](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/?v=v363-412).
- **Escuchar sin el juego:** [Auditorio de voces](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html?v=v363-412).
- **Fuente editable y pruebas:** [proyecto](./proyecto/) y [docs/README.md](./docs/README.md).

**Estado de esta entrega:** validación técnica y pruebas nativas completadas; verificación del despliegue público en curso. La [prueba actual](./docs/final412-qa-index.json) identifica los resultados y su alcance. [release.json](./release.json) conserva las huellas de las páginas, los assets y las 412 grabaciones publicadas.

El progreso se guarda en el `localStorage` de tu navegador y origen. Otro dispositivo, navegador o dirección local tiene su propio guardado.

Para probar la carpeta localmente, ejecuta desde la raíz de `putarenfe`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080/iberia-ferroviaria/> o <http://localhost:8080/iberia-ferroviaria/dialogos.html>. Desde `proyecto`, `npm run web:build` reconstruye la web con sus inputs congelados aceptados; no genera voces. El procedimiento está en [docs/PUBLICACION.md](./docs/PUBLICACION.md). Los HTML autónomos de pruebas, que incluyen todo el audio, se mantienen fuera de Git por su tamaño.

Iberia Ferroviaria ocupa esta carpeta propia; la aplicación de Renfe continúa en la raíz del repositorio. Las pruebas de entregas anteriores se conservan como historial y acreditan únicamente los archivos y el alcance que identifican.
