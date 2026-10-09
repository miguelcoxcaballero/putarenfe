# Modo único: análisis previo

**Especificación final: [ESPECIFICACION.md](ESPECIFICACION.md)** (qué cambia para el jugador, modelo de estado, motor de verdad de los diálogos, red y trenes reales, Trenespop, rejugabilidad, interfaz y plan en nueve fases publicables).

Material de trabajo para fusionar la campaña clásica, el modo libre y el Rescate de Tenfe en un único modo de juego. Lo que digan los diálogos tiene que pasar de verdad. Hay que conservar Trenespop y el realismo de catenaria, anchos, velocidades y tipos de tren. Se toman ideas de Tropico, Cities: Skylines y Airport CEO, y la interfaz será más clara.

## Inventario de lo que existe

| Archivo | Contenido |
| --- | --- |
| [inventario-campana-clasica.md](inventario-campana-clasica.md) | Campaña 2022–2050: bucle mensual y diario, economía, encargos, rivales, tutorial y debilidades, con archivo:línea. |
| [inventario-libre-trenespop-infra.md](inventario-libre-trenespop-infra.md) | Modo libre, Trenespop, red de 90 nodos y 125 tramos, compatibilidad por ancho y catenaria, y obras. |
| [inventario-rescate.md](inventario-rescate.md) | Rescate 4.0: motor semanal, economía, obras por fases, pactos, elecciones, cloacas e interfaz. |
| [restricciones-build-voces.md](restricciones-build-voces.md) | Lo que no se puede romper: las 412 grabaciones, el constructor, las pruebas, los guardados y AGENTS.md. |
| [trenespop-reutilizacion.md](trenespop-reutilizacion.md), [reglas-infraestructura.md](reglas-infraestructura.md) | Cómo reutilizar la tienda y las reglas de la red. |
| [datos/segments.json](datos/segments.json), [datos/trains.json](datos/trains.json) | Tramos reales comprobados (ancho, tensión, velocidad, vía única o doble) y catálogo real de trenes españoles con su marca paródica. |

## Auditoría de diálogos: lo que dicen frente a lo que pasa

| Archivo | Resultado |
| --- | --- |
| [auditoria-historia.md](auditoria-historia.md) · [datos](datos/audit-story.json) | 97 diálogos clásicos de historia y tutorial: 52 coherentes, 36 a medias, 4 sin mecánica y 3 que contradicen al motor. |
| [auditoria-encuentros.md](auditoria-encuentros.md) · [datos](datos/audit-encounters.json) | 315 encuentros: hoy salen por turno fijo sin mirar la partida. Ninguno es del todo cierto: 126 a medias, 140 sin mecánica y 49 contradicen al motor. Se propone qué tiene que pasar en la partida para que cada uno sea verdad. |
| [auditoria-rescate.md](auditoria-rescate.md) · [datos](datos/audit-rescue.json) | 166 textos del rescate: 47 coherentes, 62 a medias, 14 contradicen al motor, 4 sin mecánica, 8 de ambiente y 31 que nunca se enseñan. |

Conclusión principal: las 412 grabaciones clásicas no se pueden volver a grabar, así que el juego único las conserva tal cual y solo las reproduce cuando lo que dicen es cierto en la partida. Cada elección tiene un efecto concreto que se ve después. Los diálogos nuevos se graban con el mismo modelo y las mismas referencias.

## Juegos de referencia

| Archivo | Qué se mira |
| --- | --- |
| [juegos-airport-ceo.md](juegos-airport-ceo.md) | Contratos con estrellas y renegociación, planificador, monitor de operaciones, avisos, calificación con causas, finanzas y emergencias. |
| [juegos-tropico.md](juegos-tropico.md) | Facciones con exigencias, edictos, elecciones, almanaque, sucesos y opciones de partida que hacen cada partida distinta. |
| [juegos-cities-skylines.md](juegos-cities-skylines.md) | Hitos y desbloqueos, políticas, capas de información, presupuesto, líneas de transporte y modo libre. |
| [juegos-sintesis-ideas-y-menus.md](juegos-sintesis-ideas-y-menus.md) | Síntesis: las 25 mejores ideas por valor y coste, herramientas de rejugabilidad y mapa completo de la interfaz con bocetos de la pantalla principal y de los paneles clave. |
| [juegos-ferroviarios.md](juegos-ferroviarios.md) | Transport Fever 2, Railway Empire 2, OpenTTD, Mini Metro, Rail Route y NIMBY Rails: compra de trenes con compatibilidad, gestor de líneas y recompensas semanales. |

El diseño del modo único se escribe a partir de estos documentos.

## Diseños del modo único

Tres diseños independientes, puntuados por tres jueces (jugador exigente, jefe técnico y defensor de lo que pidió el usuario) en cumplimiento, verdad de los diálogos, diversión, realismo, interfaz, viabilidad y entregas por fases:

| Diseño | Enfoque | Puntos |
| --- | --- | --- |
| [diseno-C-narrativa.md](disenos/diseno-C-narrativa.md) | Lo que se dice, pasa: motor de hechos, guion por diálogo, promesas y reparto por fecha. **Ganador para los tres jueces.** | 181 |
| [diseno-B-tropico-cities.md](disenos/diseno-B-tropico-cities.md) | Facciones con líder, edictos, elecciones, hitos, arranques y semillas. | 164 |
| [diseno-A-simulacion.md](disenos/diseno-A-simulacion.md) | Red y operación reales, convenios al estilo Airport CEO, monitor y líneas trazadas. | 161 |

Los veredictos y lo que cualquier diseño final debe evitar están en [disenos/jueces.json](disenos/jueces.json). La especificación final parte del diseño C e incorpora las mejores ideas de A y B.
