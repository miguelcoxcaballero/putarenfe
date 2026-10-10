# Tenfe · Conexiones

**Versión 6.0: un juego nuevo.** Las mejores mecánicas de Rescate y La herencia funcionan juntas desde el primer turno: una red propia de conexiones, cinco retos simultáneos, sucesos ilustrados y elecciones cada 12 turnos.

[Jugar](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/) · [Reglas y mapa](docs/CONEXIONES.md) · [Auditorio](https://miguelcoxcaballero.github.io/putarenfe/iberia-ferroviaria/dialogos.html)

Conecta capitales y territorios con AVE, Alvia y regionales. Ajusta frecuencias y tarifas, atiende incidencias en jornadas simuladas o delega la operación del turno. El consejo, los rivales, los pactos y los grandes proyectos están disponibles desde el comienzo.

Completa cinco retos de fiabilidad, cobertura, rentabilidad, compromisos y construcción; gana dos mandatos para completar la partida. Después puedes continuar ampliando la red. Tres cuadrillas, dos pactos y recursos de investigación limitan qué puedes encargar a la vez.

Las **63 ilustraciones de Rescate** participan en sucesos, 18 investigaciones, seis megaproyectos de cuatro fases, objetivos, elecciones, bienvenida y resultados. Las fotos de material, ciudades y personajes de La herencia permanecen. Se conservan sin modificación los **412 textos y grabaciones canónicos**.

**Trenes Pop sigue siendo Trenespop**, con fotografías, filtros, favoritos, segunda mano, pedidos y pagos del 30 % / 70 %. El material respeta ancho, tensión y tracción.

El taller visual de vías compara la configuración actual y la propuesta con franjas amarillas animadas. Ofrece **27 combinaciones**: ibérico/estándar/mixto, ninguna/3 kV/25 kV y vía única/doble/triple. La preview no gasta dinero; la obra valida coste, plazo, cuadrillas y cortes antes de contratar.

La guía resalta los paneles y controles reales, desenfocando el resto. Se puede pausar y reanudar; la bienvenida entra sobre el mapa sin encadenar avisos de producción ni decisiones ajenas a la guía.

## Partidas anteriores

La campaña clásica continúa en la interfaz unificada. «Recuperar Rescate anterior» muestra la conversión antes de sustituir la partida activa: caja y deuda se escalan ×30, material y corredores pasan a vías reales, y se conservan los votos y las tecnologías equivalentes. Los horarios se replantean con una salida diaria; obras, pactos y expedientes antiguos quedan documentados en la copia original. Esa copia se conserva íntegra y se puede exportar; la clave antigua del navegador no se borra.

El progreso se guarda en el navegador y origen actuales. Exporta desde Guardar para moverlo a otro dispositivo.

## Desarrollo y comprobación

La fuente editable vive en `proyecto/dist/`. `conexiones.js` define las reglas nuevas; `tenfe.js` conecta la progresión al motor común; `partidas-anteriores.js` convierte guardados. Los datos e imágenes de Rescate se usan en Conexiones. Sus antiguos motor e interfaz independientes se conservan para migración y pruebas.

Desde `proyecto/`:

```sh
npm test
npm run web:build
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
npm run conexiones-ui
```

GitHub Actions ejecuta las regresiones del motor, las reglas nuevas y el recorrido de Chromium sobre la web compilada, con pantallas de 1440 y 390 píxeles. Guarda capturas y un informe en el artefacto `tenfe-qa`. Solo conserva la publicación reconstruida cuando pasan las comprobaciones. `release.json` recoge los archivos publicados y sus SHA-256.

La aplicación de Renfe sigue en la raíz del repositorio.

### Reforma de trenes

En **Flota → Reformas** puedes comparar el interior de serie y reformado de cada uno de los 14 modelos, elegir unidades libres y consultar el coste antes de enviarlas al taller. El catálogo reúne 28 imágenes creadas con IA a partir de referencias de interiores ferroviarios, enlazadas en cada comparador. Los modelos ficticios están marcados como conceptos. Los lotes reformados vuelven a los cinco turnos con interior renovado y 98 % de estado; se conserva el descuento por investigación y el guardado admite reformas anteriores.

Las fuentes y criterios del arte están en [interiores-reforma-6.1.md](investigacion/interiores-reforma-6.1.md). El proceso de publicación exporta WebP de 768 × 512 desde siete láminas finales, y verifica las 28 imágenes en Chromium de escritorio y móvil. Se mantienen Trenes Pop, las 63 fotografías de eventos, las 27 configuraciones de vía y las 412 grabaciones canónicas.
