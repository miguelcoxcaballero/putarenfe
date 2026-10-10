# Iberia Ferroviaria · Al mando de Tenfe

**Versión 5.0: un único juego.** La herencia y el rescate forman una campaña continua de 2022 a 2050. Empiezas con la red heredada; en 2027 se activa el rescate sobre **tu misma red, flota, caja, calendario y guardado**. Ya no se abre otro motor ni otra interfaz.

[Jugar](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/) · [Auditorio](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html)

Programa servicios, conecta ciudades y ajusta tarifas. Cumple encargos, investiga, firma hasta dos pactos y construye megaproyectos por fases. Los hitos se comprueban con tus viajeros reales al cerrar el mes. Las elecciones al cerrar diciembre de 2030 y 2034 dependen de la media de apoyo de seis meses: viajeros, territorios, plantilla y economía.

La interfaz reúne **Red, Flota, Dinero, Despacho, Progreso y Prensa** alrededor del mapa. La misión propone una acción concreta; el informe mensual muestra resultado, viajeros, caja, puntualidad y noticias. Puedes jugar cada jornada o cerrar el mes para avanzar. Las capas del mapa se abren desde «Capas».

**Trenes Pop sigue siendo Trenespop.** Conserva su identidad, fotografías, filtros, favoritos, material usado, pedidos y pagos del 30 % / 70 %. AVE, Alvia y regionales se compran allí. Los regionales incluyen Civia, S599, S592, BCBB y Dörfler; usan la red real y respetan ancho, tensión y tracción.

El rescate incorpora pactos comprobables, elecciones, hitos, proyectos de tres fases y adjudicaciones irregulares con inspección y restitución. Los importes se expresan en la economía de la red nacional. Las voces clásicas conservan sus **412 textos y grabaciones completos**; las nuevas pantallas de gestión tienen texto y no regeneran audio.

En «Nueva partida» eliges semilla, primer turno guiado y presión electoral: **Con desafío** (una derrota termina el mandato) o **A tu ritmo** (una derrota reduce el apoyo y permite continuar). Las jornadas y el resto de la economía comparten las mismas reglas.

## Partidas anteriores

La campaña clásica continúa en la interfaz unificada. «Recuperar Rescate anterior» muestra la conversión antes de sustituir la partida activa: caja y deuda se escalan ×30, material y corredores pasan a vías reales, y se conservan los votos y las tecnologías equivalentes. Los horarios se replantean con una salida diaria; obras, pactos y expedientes antiguos quedan documentados en la copia original. Esa copia se conserva íntegra y se puede exportar; la clave antigua del navegador no se borra.

El progreso se guarda en el navegador y origen actuales. Exporta desde Guardar para moverlo a otro dispositivo.

## Desarrollo y comprobación

La fuente editable vive en `proyecto/dist/`. `tenfe.js` añade la progresión al motor común; `partidas-anteriores.js` convierte guardados. Los archivos del rescate 4.0 se conservan como historia y pruebas, pero quedan fuera del empaquetado publicado.

Desde `proyecto/`:

```sh
npm test
npm run web:build
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
npm run tenfe-ui
```

GitHub Actions ejecuta las regresiones del motor, las reglas nuevas y el recorrido de Chromium sobre la web compilada, con pantallas de 1440, 390 y 320 píxeles. Guarda capturas y un informe en el artefacto `tenfe-qa`. Solo conserva la publicación reconstruida cuando pasan las comprobaciones. `release.json` recoge los archivos publicados y sus SHA-256.

La aplicación de Renfe sigue en la raíz del repositorio.
