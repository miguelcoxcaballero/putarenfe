# Iberia Ferroviaria · avance 3.6.3

En este checkout está preparado el avance de **301 de las 412 grabaciones completas**, las 50 intervenciones y respuestas de la guía y 32 diálogos de Paco con la referencia real de Torrente. Los 412 textos están presentes; los diálogos todavía sin grabación conservan subtítulos y decisiones. Su publicación y comprobación HTTPS siguen pendientes. La versión pública verificada conserva todavía 261 grabaciones y 28 diálogos de Paco. La producción y la verificación final siguen en curso.

- **Jugar en el navegador:** [Iberia Ferroviaria](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/).
- **Escuchar diálogos sin el juego:** [Auditorio de voces](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html).
- **Fuente editable y continuidad:** [proyecto](./proyecto/) y [docs/README.md](./docs/README.md).

La primera publicación de 261 voces se verificó desde el commit `b1bce7e339cdd78f9b48d947de6b2ab590871279`: Pages terminó su construcción y las 273 rutas comprobadas, incluidos los 261 MP3, devolvieron HTTP 200 y los SHA esperados. La [prueba HTTPS histórica](./docs/pages-261-https-proof.json) registra ese alcance; no certifica el avance preparado de 301 ni es una prueba nativa de navegador.

Cada intervención con audio utiliza una toma completa y continua. La versión web carga los MP3 actuales; no encadena los antiguos fragmentos ni sustituye una grabación ausente por síntesis del navegador. Las comprobaciones parciales anteriores tienen su propio alcance: todavía no consta la prueba nativa completa de este avance ni el cierre de las 412 voces. No se afirma aprobación de naturalidad o parecido de todo el reparto.

El progreso se guarda en el navegador mediante `localStorage`. El guardado pertenece a ese navegador y origen; otro dispositivo, navegador o dirección local tiene su propio guardado.

El constructor web utiliza la fuente editable de `proyecto/dist`. Desde `proyecto`, `npm run web:build` reconstruye la web con el manifiesto congelado aceptado; no genera voces.

Para servir esta carpeta en tu equipo, ejecuta desde la raíz del repositorio `putarenfe`:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Abre <http://localhost:8080/iberia-ferroviaria/> para jugar o <http://localhost:8080/iberia-ferroviaria/dialogos.html> para escuchar. El servidor debe mantenerse abierto mientras uses la web.

Iberia Ferroviaria ocupa esta carpeta propia. La aplicación de Renfe continúa en la raíz del repositorio. Las próximas versiones conservan las mismas direcciones; [release.json](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/release.json) identifica su cobertura y archivos. Procedimiento de actualización: [docs/PUBLICACION.md](./docs/PUBLICACION.md).
