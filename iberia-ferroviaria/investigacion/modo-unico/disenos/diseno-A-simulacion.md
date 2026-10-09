# Diseño A · «Iberia Ferroviaria: la red» — el modo único visto desde la simulación

Ángulo: primero la red, los trenes y el dinero, que tienen que sentirse reales y leerse de un vistazo (Transport Fever 2, Airport CEO). Encima va la política (Tropico) y la progresión (Cities: Skylines). Todo lo que diga un personaje sale de ese mismo estado.

Fuentes: los inventarios, auditorías, datos y estudios de juegos de `investigacion/modo-unico/`, más una lectura del código de `proyecto/dist/`. No he tocado el repositorio.

---

## 0. El juego en una pantalla

**Para el jugador.** Eres el presidente de Tenfe desde el lunes 3 de enero de 2022. Heredas una red real: 128 tramos con su ancho, su tensión, su velocidad y su vía única o doble, y una flota de trenes reales con su marca paródica. Trazas líneas sobre esa red. Compras en Trenespop solo lo que puede circular por ellas. Encargas a Adif las obras que abren caminos nuevos: catenaria, tercer carril, desdoblamientos, cambiadores. Firmas convenios con el Ministerio y con las comunidades, y aguantas elecciones cada cuatro años. El tiempo corre día a día. Puedes mirar la jornada con los trenes del horario real moviéndose por el mapa o pasar semanas en segundos, y la cuenta es la misma en los dos casos. Cada personaje habla solo cuando lo que dice es verdad en tu partida, y lo que eliges se ve después en el mapa, en una línea o en la caja.

| # | Decisión | Resumen |
|---|---|---|
| D1 | Calendario | Empieza el 3-1-2022 (o en 2027 con el escenario de rescate). El tiempo avanza **día a día con pausa y cuatro velocidades**. Parte cada semana, cierre cada mes, elecciones el 23-7-2023 y luego cada 4 años. Horizonte en 2050, con opción de seguir sin fin. |
| D2 | Dinero | Escala clásica en M€ realistas, una sola caja y demanda logit con puntualidad y satisfacción. Ingresos de OSP por tren-km, convenios, ayudas por obra y transferencia anual del Estado. Préstamos con calendario. |
| D3 | Red | Tramos reales con ancho, tensión, velocidad, vía, estado y **capacidad en surcos**. Catálogo de 15 obras con fases y modos de servicio. **Las líneas las traza el jugador** (herramienta al estilo Cities) sobre los tramos. |
| D4 | Trenes | Catálogo de `trains.json` (16 series más las heredadas). Compatibilidad por ancho, tensión, tracción y gálibo, enseñada con etiquetas, tira de ruta y tres estados (✓ ◐ ✗) en Trenespop, en la flota y en el mapa. |
| D5 | Rejugabilidad | Arranques, semilla con código, generador del estado inicial, deslizadores, rasgo del presidente, modificadores, retos, facciones con exigencias, sucesos situados en tramos reales, hitos, investigación, megaproyectos y partida sin fin. |
| D6 | Verdad narrativa | Un módulo de `hechos` y un banco de diálogos con predicado, instancia y efecto. Selector de encuentros guiado por el estado, registro de compromisos y pruebas de veracidad. **Se retiran 5 cuerpos grabados. Hacen falta 99 tomas nuevas.** |
| D7 | Qué se queda | Del clásico: red, horario real, Trenespop, encargos, rivales, tutorial grabado y escala de dinero. Del rescate: presupuestos previos, fases, pactos, elecciones, hitos, megaobras, cloacas y Gaceta. Del libre: opciones de maqueta y juego sin fin. Se van las 3 órdenes semanales, los dados sin causa y los menús separados. |
| D8 | Airport CEO | Convenios marco con peticiones de servicio y estrellas, renegociación con puntos, monitor de operaciones, surcos como «stands», avisos con prioridad situados en el mapa, diagnóstico de ruta, tutorial con lista que se marca sola y premio anual. |
| D9 | Interfaz | Zonas fijas: arriba la hora y los recursos, a la izquierda la Agenda, en el centro el mapa, a la derecha la ficha y abajo ocho verbos. Paneles de 2 niveles como máximo, desde la izquierda y sin tapar más de la mitad. No hay cajas dentro de cajas y el texto está presupuestado. |
| D10 | Fases | 8 fases que se pueden jugar y publicar por separado. La primera unifica la entrada en una sola partida y añade la tensión de la catenaria a la compatibilidad, todo en una entrega pequeña. |

---

## D1. Calendario, unidad de tiempo y estructura del turno

### D1.1 Decisión

- **Fecha de inicio por defecto: lunes 3 de enero de 2022** (arranque «2022 · Toma de posesión»).
  - Así siguen siendo ciertos los 50 cuerpos grabados del tutorial («Enero de 2022», «Óscar del Puente, hoy alcalde consultado», «En 2022 no han entrado todos en todas partes»).
  - También los 10 hitos históricos fechados: Burgos el 21-7-2022, YaIré en noviembre de 2022, Murcia el 20-12-2022, el titular de los trenes que no caben en febrero de 2023, Pajares el 29-11-2023, la catenaria de Extremadura el 14-12-2023, el S106 en mayo de 2024 y la licitación de 2026.
  - Y el reparto real: Raquel Sanz es ministra hasta el relevo que sigue a las elecciones del 23-7-2023, y Óscar del Puente lo es desde el 20-11-2023. Los propios datos clásicos ya ponen a Óscar a hablar de Pajares, Extremadura y el S106.
- **Unidad de tiempo: la jornada.** El reloj avanza día a día con pausa y cuatro velocidades:

  | Control | Qué hace | Ritmo orientativo |
  |---|---|---|
  | ⏸ | Pausa. Mirar, comparar y presupuestar es gratis. | — |
  | ▶ Ver la jornada | Los trenes del horario real (GTFS) circulan por el mapa. Puedes intervenir en cada incidencia. | 10 min de juego por segundo; una jornada en ~1,5 min |
  | ▶▶ Días | Se simulan días completos y los trenes se dibujan por muestreo. | 1 día ≈ 2 s |
  | ▶▶▶ Semanas | Se ven flujos agregados en las líneas. | 1 semana ≈ 2 s |
  | ⏭ Hasta el próximo aviso | Corre a ▶▶▶ hasta un motivo de parada. Es `stopReasons` del rescate, ampliado. | — |

- **El mismo modelo a cualquier velocidad.** Cada día se calcula una sola vez con `simularDia(s)`, que hace este recorrido:
  1. plan de circulaciones;
  2. incidencias por riesgo con causa;
  3. respuestas;
  4. retrasos, viajeros, ingresos y costes acumulados.

  A ▶ el jugador ve ese mismo plan minuto a minuto y puede **sustituir** la respuesta del protocolo en cada incidencia (equipo 18.000 €, autobús 9.000 € o esperar; son los `RESPONSES` del clásico, `operations.js:49-53`). A ▶▶ y ▶▶▶ se aplica el **protocolo** que el jugador fijó en Monitor › Protocolos. Mirar la jornada sirve para afinar, no es obligatorio. Delegar ya no sale estrictamente mejor (el problema que señala `inventario-campana-clasica §0.2`): las dos vías dan el mismo resultado si se responde igual que el protocolo, y mirar puede mejorarlo.

- **Ritmos fijos dentro del calendario continuo:**

  | Ritmo | Qué pasa |
  |---|---|
  | Diario | Operación, incidencias, viajeros, caja provisional. Aperturas históricas en su día exacto (`infra.js:15-21`). |
  | Semanal (noche del domingo) | **Parte semanal** (tarjeta no bloqueante). Anuncios de segunda mano de Trenespop. Pactos y compromisos. Selector de encuentros. Deriva de los grupos (7 % hacia su objetivo, como el rescate). Titular de la Gaceta. |
  | Mensual (último día) | Lo que promete el tutorial grabado («Al cerrar el mes llegan el balance, las entregas, las obras, la formación y la investigación que hayan vencido»): balance consolidado de los días, entregas (2 unidades al mes), obras que terminan, alumnos formados, investigación, pago de OSP y convenios, rachas de encargos (3 cierres seguidos). |
  | Trimestral | Cumplimiento de la OSP: un trimestre con incumplimiento cuenta como leve; 3 leves suman un grave; 3 graves, retirada de la concesión (regla del rescate). |
  | Anual | En enero, transferencia de inversiones del Estado y actualización de tarifas por IPC si la medida está activa. En diciembre, premio «Operador Ferroviario del Año» (§D8). |

- **Paradas automáticas** (al estilo de Airport CEO «vuelve a velocidad normal cuando pasa algo»; se configuran en Ajustes):
  - decisión o escena pendiente;
  - oferta con plazo;
  - obra terminada;
  - entrega;
  - hito;
  - elecciones a 4 semanas o menos;
  - la caja no cubre los pagos de las próximas 4 semanas;
  - un compromiso vence en 2 semanas o menos;
  - incidencia grave (opcional).

  ⏭ se para en cualquiera de ellas.

### D1.2 Legislaturas, elecciones y reparto

| Fecha | Qué pasa | Por qué |
|---|---|---|
| 3-1-2022 | Decisión `inaugural` y tutorial grabado (9 etapas) | Cuerpos fechados en enero de 2022 |
| 23-7-2023 | **Primeras elecciones generales** | Fecha real. Son el examen de la primera legislatura y cierran la etapa 1 y el primer encargo (18 meses) |
| 20-11-2023 | Si el Gobierno gana: relevo de Raquel Sanz por Óscar del Puente, con dos líneas nuevas (`relevo-raquel`, `relevo-oscar`) | Paralelo real. Hace verdad los cuerpos clásicos de 2023-2026 dichos por `successor` |
| Cada 4 años (jul 2027, jul 2031… jul 2047) | Elecciones | Ciclo normal |
| Cuando lo decida el presidente | Adelanto electoral (`event:election`): la fecha pasa a dentro de 8 semanas y el ciclo se reinicia | «He convocado elecciones, que me apetecía» pasa de verdad |

- **Quién vota.** El resultado lo deciden los 4 grupos del rescate con sus pesos: Viajeros 0,34, Territorios 0,20, Trabajadores 0,20 y Economía 0,26. Cuenta la media de 26 semanas de cada grupo (`electionForecast`, `rescate.js:1029-1038`). Con menos del 50 %, el Gobierno pierde y otro ocupa tu sillón (`el-lose`: «El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú»).
- **El cese clásico se mantiene**, como «Confianza del Gobierno»: por debajo de 15 durante 26 semanas seguidas, te cesan.
- **Pedro Sancho** es presidente del Gobierno toda la partida mientras se ganen elecciones. Es sátira, pero coherente.

### D1.3 Fin y continuación

- **Horizonte por defecto: «Agenda 2050».** El 31-12-2050 llegan el veredicto y la puntuación (`finalScore` clásico ampliado, §D5). Después se puede «Seguir sin fin»: la inflación se congela en 2050, como hace hoy `economicYear` en `engine.js:12`.
- **Opción «Sin horizonte»** desde el principio. En ese caso no se reproduce `decision:legacyvote` («Quedan cuatro años»).
- **Arranque «2027 · Rescate de Tenfe».**
  - Empieza el lunes 4-1-2027 con todo el histórico aplicado y su propio calendario de escenario: elecciones en diciembre de 2030 y diciembre de 2034; Raquel ministra hasta 2030 y Óscar después.
  - Es el único sitio donde `t-1` («Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda») y `t-2` son ciertos.
  - Regla del escenario, avisada antes de empezar: si fallas las primeras 13 semanas, Hacienda te cesa.

### D1.4 Por qué así

1. **El tutorial grabado está hecho sobre «jornada + cierre de mes».** Turnos semanales lo romperían. El día como unidad lo mantiene entero sin volver a grabar.
2. **Los cuatro juegos de referencia van en tiempo real con pausa.** Tropico, Cities, Airport CEO y Transport Fever 2 se juegan así, y el usuario pide «más como el Tropico y el Cities». Las 3 órdenes por semana del rescate son un recurso de juego de mesa. La escasez la dan cosas que existen: caja, frentes de obra, maquinistas, plazas de taller, surcos y capital político (★).
3. **El horario real deja de ser un modo espectador.** Antes, la jornada estaba ahí para mirarla. Ahora cada día cuenta: las incidencias de la jornada alimentan la puntualidad, la puntualidad alimenta la demanda y la demanda, la caja.
4. **Un mes es demasiado grueso** para que los diálogos fechados sean verdad. Burgos abre el 21 de julio, no el día 1. La auditoría encontró que las decisiones salen antes que la obra que anuncian (`auditoria-historia`, punto 1). Con días, cada cuerpo fechado sale el día que ocurre.

---

## D2. Escala de dinero y economía

### D2.1 Escala: la clásica, en M€ realistas

- **Por qué.** 50 tomas grabadas del tutorial y varias decisiones citan cifras de esta escala:
  - abrir un servicio, 4 M€;
  - 20 maquinistas, 0,3 M€ y tres meses;
  - equipo de incidencias 18.000 €, autobús 9.000 €;
  - venta online, 10 M€ y cuatro meses;
  - ERTMS, 35 M€ y doce meses;
  - primer encargo, 18 o 26 M€ en 18 meses.

  La escala del rescate (caja de 12 M€, trenes de 1 a 3,5 M€) no tiene ninguna grabación que dependa de ella: se abandona. El escenario 2027 se reescala.
- **Precios de los trenes:** los de `trains.json`. S103 38 M€, S112 29, S130 25, S730 30, Civia 465 7, 449 8, 599 8.
- **Obras:** fórmulas por km de `infra.js` (§D3.4).
- **Una sola caja.** El cuerpo grabado de Charo dice: «La caja paga inversiones… Una línea rentable puede financiar otra necesaria». En Finanzas, los informes separan explotación, inversión y financiación.

### D2.2 Ingresos

| Fuente | Regla | Cuándo |
|---|---|---|
| Billetes | viajeros del día × tarifa (× devolución por retraso si la medida está activa) | diaria |
| **Contrato OSP con el Estado** (Media Distancia y regionales declarados OSP) | tarifa por tren-km (≈ 9 €/tren-km a precios de 2022, con IPC) **multiplicada por el cumplimiento**: 1,0 si todas las líneas OSP tienen puntualidad ≥ 85 % y los servicios mínimos; −12 % por cada línea esencial mal (regla del rescate) | mensual; cumplimiento trimestral |
| **Convenios autonómicos** (§D8.1) | cada petición aceptada paga una cuota mensual fija si se cumplen sus KPI del mes | mensual |
| Ayudas europeas por obra (FEDER, MRR) | % fijo de una obra concreta, cobrado **al certificar**. Se enseña antes como «financiación prevista» (`plannedAid` del rescate) | al terminar la obra |
| Transferencia de inversiones del Estado | en enero, `base × (0,5 + confianza del Gobierno/100) × bonus de la etapa`; base de 60 M€ en 2022 con IPC | anual |
| Premios | etapa cumplida (100/180/260/350/500 M€, valores clásicos), hitos, Operador del Año | al cumplir |
| Venta de trenes | `precio × factor de edad × estado × 0,55`, nunca por encima de lo pagado | inmediata |

### D2.3 Costes

| Partida | Regla |
|---|---|
| Energía | Por tren-km y tramo, según el **modo de tracción en ese tramo**: eléctrico a 3 kV ×1,08 (más pérdidas), a 25 kV ×1,00, diésel ×2,2 por plaza-km. Índice de precios de la energía con la crisis real de 2022 (×1,6 de pico entre marzo y diciembre) y choques futuros sacados de la semilla. |
| Personal | Maquinistas e interventores por **tren-hora** (2 por tren). Plantilla de talleres. |
| Mantenimiento | Por unidad: `base × (1 + máx(0, edad − 20) × 0,02) × (2 − deslizador de mantenimiento)`. El deslizador va del 50 al 150 % (Cities). |
| Canon de Adif | Por tren-km según la categoría del tramo: LAV 4,5 €/km, convencional 1,2 €/km. Más un importe por parada en estación de categoría A o B. |
| Estructura | `(9 + unidades × 0,035) × índice de costes`, como el clásico. |
| Intereses | Los de cada préstamo, por su calendario. |
| Indemnizaciones | Con la medida «Devolución por retraso» activa. |
| Alquileres | Trenes alquilados (13 semanas) y frentes de obra subcontratados. |

### D2.4 Demanda (el logit clásico, corregido)

```
tiempo_tren = Σ minutos por tramo (§D3.3) + paradas + cambios de ancho     ← misma cifra que ve el jugador
U_tren = 1,6 − 0,2·h − tarifa/35 + 0,045·min(salidas, 40)
         + 0,018·(puntualidad_4sem − 80) + 0,010·(Viajeros − 50)     ← la satisfacción mueve la demanda (hoy no lo hace)
         + 0,12·nivel_estaciones + modificadores con causa (descuentos, campañas, sucesos)
U_bus  = 1,1 − 0,2·h_bus − tarifa_bus/35       (Autocares Meseta, con campañas reales)
U_otros = 0,33 + Σ rivales (OuiOui / YaIré con su tarifa, frecuencia y calidad)
cuota = e^U_tren / (e^U_tren + e^U_bus + U_otros)
viajeros_día = min(plazas_día × 0,98, mercado_día × cuota) ; el resto es «sin plaza» → afecta a Viajeros
```

- **Mercados.** Hay uno por cada par de ciudades servidas: los 91 del clásico (76 con horario real) y gravedad `110·√(pobA·pobB)` en los demás.
- **Paradas intermedias.** Suman un 50 % de la demanda de gravedad de esas ciudades hacia los extremos, a cambio de 2 minutos por parada. El modo exprés las quita.
- **Calendario.** Crecimiento y estacionalidad como el clásico (`engine.js:44-68`). Tipo de día: laborable ×1,08, sábado ×0,78, domingo ×0,70.

### D2.5 Préstamos, impago y quiebra

- **Línea de crédito.** Disposiciones de ±50 M€. El tope crece con la nota de Tenfe: 300 M€ más 300 por estrella (§D8.2), hasta 1.500.
- **Préstamos bancarios con calendario** (los `LOANS` del rescate, reescalados):

  | Importe | Plazo | Tipo | Requisito |
  |---|---|---|---|
  | 200 M€ | 3 años | 5 % | — |
  | 400 M€ | 4 años | 5,5 % | Hito 2 |
  | 800 M€ | 6 años | 6 % | Hito 4 |

  La cuota es fija y aparece en el calendario de pagos.
- **Impago.** La decisión del rescate con sus 5 salidas reescaladas: vender, aplazar obra, refinanciar, recortar o rescate de Hacienda. Las opciones que no harían nada salen desactivadas y cada una dice cuánto recupera.
- **Quiebra.** 4 semanas seguidas con caja negativa y sin salida aplicada.

### D2.6 Cierres de los abusos que se han medido

| Abuso | Arreglo |
|---|---|
| Peticiones que pagan al instante (+42 M€ en el mes 0) | Se cobran tras **13 semanas de servicio continuo** |
| Primer encargo que se gana solo | El objetivo pasa a ser **viajeros nuevos acumulados sobre la línea base de enero de 2022** (público T, comercial 1,25·T, T calibrado con el bot para que haga falta abrir Salamanca y reforzar València). Se mantienen el plazo de 18 meses y los premios de 18 y 26 M€: así sigue siendo cierto lo grabado |
| `fleetcare` (+8 de estado a toda la flota por 2 M€) | Revisiones **por unidad** y con plaza de taller |
| Repetir una apuesta hasta ganarla | Las apuestas declaradas usan una semilla propia de esa decisión (no se puede repetir) y enseñan su probabilidad |
| Bloqueo por falta de caja | Ninguna escena puede dejar todas sus opciones sin caja: siempre hay una salida con coste diferido |

---

## D3. Red, obras y líneas

### D3.1 Datos de tramo

`assets/infra.js` se regenera con `tools/build_infra.py` y una capa encima que sale de `segments.json`. Se arreglan estos huecos:

- convencional `pal-leo-c` (123 km, ib, 3 kV, 155, doble);
- `cor-sev-c` (129 km, ib, 3 kV, 155, mixta);
- `leo-pol` partido en **Rampa** (`leo-pol-r`: 108 km, ib, 3 kV, 115, mixta) y **Variante** (`leo-pol-v`: 71 km, mixto, 25 kV, 220, con su apertura histórica);
- el nodo `mot` corregido (−1,88, 39,56);
- velocidades y km de `segments.json` en los tramos de los 11 corredores;
- parada **Villanueva del Andén** en el km 40 de `avi-med`. Es la estación de Paco: 412 habitantes.

| Campo | Valores | Fuente |
|---|---|---|
| `gauge` | ib · std · mixto | infra + segments |
| `elec` | no · 3kv · 25kv | infra + segments |
| `vmax` / `vproj` | km/h actual y de proyecto (lo que da una renovación) | segments; `vproj = min(220, vmax + 40)` en convencional si no hay dato |
| `track` | unica · doble · mixta | segments en 11 corredores. En los demás, la etiqueta OSM `tracks` extraída por `build_infra.py`; si falta, `doble` marcado como **provisional** |
| `cond` | 0-100, estado de la vía | 2022: 70-90 según la línea; la semilla degrada 3-5 tramos (§D5) |
| `cap` | trenes/día en ambos sentidos (§D3.2) | derivado |
| `u0` | ocupación base: Cercanías, mercancías y otros (0-0,6) | estimación por tramo, marcada como provisional |
| `galibo` | normal · estrecho | estrecho en `pal-san` y `leo-pol-r` |
| `tags` | rampa · montaña · trinchera · túnel · calor · nieve · robo · yacimiento · ganado | lista a mano. Sitúan los sucesos (§D5.6) |

### D3.2 Capacidad: los surcos

Equivalen a los *stands* de Airport CEO: cada tramo admite un número de trenes al día. Las líneas del jugador, los rivales (OuiOui y YaIré en LAV) y `u0` consumen surcos.

| Tipo de vía | Capacidad (trenes/día, ambos sentidos) |
|---|---|
| LAV doble | 220 (×1,2 con ERTMS) |
| Convencional doble con CTC/BAB | 160 |
| Convencional doble con bloqueo antiguo | 110 |
| Mixta (tramos parciales de doble vía) | 90 |
| Única con apartaderos suficientes | 48, +12 por paquete de apartaderos (máximo 72) |
| Única sin apartaderos | 30 |

- **Carga** = `(u0·cap + Σ salidas de las líneas + rivales) / cap`.
  - Por debajo de 0,75, sin efecto.
  - Entre 0,75 y 1,0, la puntualidad baja `(carga − 0,75)·40`.
  - **Por encima de 1, el planificador no deja añadir la salida** y lo dice: «Sin surcos libres en Encina–Xàtiva (vía única, 30/30)». No hay fallos silenciosos (es la lección de Airport CEO, §3.1).
- **Acuerdos marco de capacidad.** Cada 5 años Adif reparte el 70 % de los surcos LAV de los grandes ejes por concurso entre Tenfe, OuiOui y YaIré, como en la realidad desde 2020. Pujas con ★ y M€. Lo que no ganes, lo usan los rivales.

### D3.3 Compatibilidad y tiempo de viaje

Se reutilizan `compatibilidad` y `tiempoDeViaje` de `reglas-infraestructura.md` §5. Ya se comprobaron contra `plan()` en 129 casos. Se amplían con diésel, bimodo, batería y gálibo, como `compat()` en `trenespop-reutilizacion.md` §5.

| Falta | Cuándo |
|---|---|
| `gauge` | Tren de ancho fijo en ancho ajeno (el mixto vale para los dos) |
| `changer` | Tren de ancho variable que cambia de ancho en un nodo sin cambiador |
| `elec` | Tren solo eléctrico en tramo sin catenaria |
| `tension` | Tren eléctrico sin la tensión del tramo (p. ej., S103/S112 de 25 kV en `sag-cas`, que es de 3 kV) |
| `galibo` | Tren ancho (BCBB) en tramo de gálibo estrecho |
| `bateria` | Hueco sin catenaria mayor que la autonomía |
| `closed` / `build` | Tramo cortado por obra o no construido |

```
v_tramo = min(vmax_tramo, vmax_tren (o vmaxDiesel si va con motor térmico), 220 si 3 kV)
min_tramo = km / (v_tramo × F) × 60          F = factor comercial calibrado (arranque 0,70)
min_línea = Σ min_tramo + 2 × paradas + 12 × cambios de ancho (9 con el cambiador rápido) + 5 de cabecera
```

**Prueba de calibración.** Mediana `min_plan / min_horario_real` = 1,00 ± 0,05 en las 72 relaciones reales. Hoy da 0,75, un 25 % demasiado optimista (`inventario-libre §c`).

### D3.4 Catálogo de obras

Costes en M€ y plazos en meses. Base: las fórmulas de `infra.js:252-277`, más las obras que faltan.

| Obra | Coste | Plazo | Efecto | Servicio durante la obra |
|---|---|---|---|---|
| Renovar vía | 8 + 0,18·km | ⌈4 + km/40⌉ | `cond` → 95; `vmax` → `vproj` | fases / autobús / corte |
| Electrificar a 3 kV | 6 + 0,46·km | 12 + km/10 | `elec = 3kv` | fases / corte |
| Electrificar a 25 kV | 6 + 0,42·km | 12 + km/10 | `elec = 25kv` (y aviso si los vecinos son de 3 kV) | fases / corte |
| Pasar de 3 kV a 25 kV | 4 + 0,30·km | 8 + km/15 | `elec = 25kv` | fases (noches) / corte |
| Tercer carril (ancho mixto) | 8 + 0,5·km | 14 + km/9 | `gauge = mixto` | fases |
| Ancho estándar desde ibérico | 5 + 0,3·km | 8 + km/14 | `gauge = std` | **corte obligatorio** (como el clásico) |
| Quitar tercer carril (mixto → estándar) | 2 + 0,1·km | 3 + km/40 | `gauge = std` | fases |
| Desdoblar vía | 10 + 1,4·km | 18 + km/5 | `track = doble`, `cap` → 160 | fases (`cap` −35 %) |
| Apartaderos (paquete) | 4 + 0,06·km | 6 + km/50 | `cap` +12 en vía única | fases |
| Señalización CTC/BAB | 2 + 0,12·km | 6 + km/30 | `cap` ×1,15; +3 de puntualidad | fases |
| ERTMS en tramo (con la investigación ERTMS hecha) | 3 + 0,15·km | 8 + km/30 | `cap` +20 %; +10 % de `vmax` en LAV | fases |
| Gálibo de túneles | 15 + 0,6·km | 18 | `galibo = normal` | corte |
| Vallado | 0,02·km | 2 | acaba con las incidencias de ganado en el tramo | ninguno |
| Cambiador de ancho | 18 | 10 | nodo con cambiador (posible donde se tocan tramos `std` e `ib`) | ninguno |
| Variante o rectificación | 20 + 2·km | 36 + km/4 | `vproj` +60 | ninguno (vía nueva) |
| Nueva LAV (`newLineQuote`) | 25 + 1,1·km | 42 + km/10 | tramo `lav`, std, 25 kV, 300 | ninguno |
| Grandes proyectos AV (los 9 `PROJECTS`) | tabla clásica (90-280) | 42-84, con año mínimo | tramos planificados | ninguno |
| Estación (nivel 1-3) y apeadero | clásico; apeadero 3 M€ y 5 meses | — | demanda +6 % por nivel; apeadero abre parada | ninguno |

- **Modos de servicio** (`SERVICE_MODES` del rescate):
  - **Por fases**: plazo ×1,5, capacidad −35 %, −9 de puntualidad en el tramo.
  - **Autobús**: plazo ×1; la demanda de la línea en ese tramo cae al 55 %; el autobús se paga.
  - **Corte**: plazo ×0,85; la línea se suspende o se desvía si existe otra ruta compatible.
- **Fases de cada obra** (`PHASES` del rescate): permisos 10 % del coste, obra 80 % y pruebas 10 %. **Los frentes solo se ocupan en la fase de obra**; se arregla `rescate-data.js:113` frente a `rescate.js:115`.
- **Frentes de obra.** Son la capacidad de Adif para llevar obras a la vez. Hay 2 al empezar. Se suman con hitos y con frentes subcontratados por meses.
- **Los plazos se alargan solo por una causa con nombre.** Nada de un 22 % de probabilidad.

  | Causa | Efecto |
  |---|---|
  | Clima | Nieve en tramos de montaña en invierno; calor en verano |
  | Yacimiento | El tramo con etiqueta `yacimiento` puede disparar `event:adifdelay` |
  | Relación con Adif baja | +1 mes de permisos |
  | Falta de caja | La obra se para |
  | Sobornos | Su efecto exacto (§D5.8) |

- **Una sola regla de aceleración**: +25 % del coste pendiente y −25 % de la obra que queda.
- **Antes de aprobar se ve todo**, calculado por la misma función que usa el motor (`workQuote` + `punctProjection` del rescate, pasados a tramos):
  - coste y ayuda;
  - fecha de entrada en servicio;
  - puntualidad antes y después;
  - minutos ganados por línea;
  - **trenes que dejarán de poder circular** (p. ej., «Pasar a 25 kV deja fuera a 6 × 470 de Madrid–Ávila»).

### D3.5 Líneas: las traza el jugador (herramienta al estilo Cities)

- **Qué es una línea:**

  ```
  {id, nombre, origen, destino, ruta:[tramos], paradas:[nodos], producto, lote(s), salidas_día, cadencia, tarifa, exprés, osp}
  ```

  - `producto`: AV, LD, MD o Regional.
  - `cadencia`: primera salida e intervalo, o la plantilla real del GTFS si la relación existe en el horario.
- **Herramienta Línea** (verbo Líneas › Nueva, o pulsar dos ciudades en el mapa con la herramienta activa):
  1. Pulsar el origen y el destino. Salen hasta 3 rutas alternativas: la más rápida para la serie elegida, la convencional y «por…».
  2. La **tira de ruta** pinta los tramos según la serie elegida: verde puede, ámbar cambio de ancho, rojo falta (con el motivo).
  3. Elegir serie (solo se resaltan las compatibles), salidas por día, tarifa, paradas y exprés.
  4. Bajo el botón aparecen los **requisitos escritos** (Airport CEO):
     - trenes libres compatibles: necesarios `⌈(2·viaje + 2·30 min) / intervalo⌉`, +1 de reserva si hay más de 6;
     - maquinistas;
     - surcos en cada tramo;
     - abrir cuesta 4 M€.
  5. Previsión con la misma fórmula del motor: viajeros, ocupación, margen, puntualidad esperada y sus causas.
- **Las 91 relaciones clásicas** pasan a ser «Relaciones» (mercados) con su plantilla de horario real. Se pueden abrir con un clic como línea sugerida.
- **Las 11 rutas del rescate** son líneas MD ya hechas: Norte = Madrid–León convencional, y así las demás.
- **Lo que hay al empezar en 2022:**
  - las 8 líneas clásicas (`START_SERVICE`, `engine.js:18`), es decir, AVE y Alvia;
  - la Media Distancia llega con el **Contrato OSP**, que la ministra ofrece al terminar el tutorial (§D4.4): unas 14 líneas MD y su flota.

  Así sigue siendo verdad lo grabado: «Para una vía sin catenaria solo sirve hoy nuestro Alvia híbrido S730».

---

## D4. Tipos de tren y Trenespop

### D4.1 Catálogo (`catalogo-trenes.js`, generado desde `trains.json`)

| Serie | Marca | Segmento | Tracción | Tensión | Ancho | km/h | Plazas | M€ | Cómo se consigue |
|---|---|---|---|---|---|---|---|---|---|
| 463 Civia | KAFKA | Regional | eléctrica | 3 kV | IB | 120 | 184 | 5 | nueva (24 m) / usada |
| 465 Civia | KAFKA | Regional | eléctrica | 3 kV | IB | 120 | 277 | 7 | nueva (24 m) / traspaso |
| 470 | KAFKA | Regional | eléctrica | 3 kV | IB | 140 | 221 | 0,5 | solo usada; fiabilidad baja |
| 449 | KAFKA | MD | eléctrica | 3 kV (preparada para 25 kV) | IB | 160 | 257 | 8 | usada; en talleres, **adaptación a 2T** por 1,5 M€ y 6 m |
| 480 Civity | KAFKA | MD | eléctrica | 3 y 25 kV | IB | 200 | 256 | 9 | nueva desde 2026 (30 m) |
| 592 | Malstom | MD | diésel | — | IB | 120 | 228 | 0,6 | usada |
| 594 | KAFKA | MD | diésel | — | IB | 160 | 123 | 1 | usada |
| 599 | KAFKA | MD | diésel | — | IB | 160 | 181 | 8 | nueva (24 m) / usada |
| BMU | Dörfler | MD | bimodo | 3 y 25 kV | IB | 160 (140 en diésel) | 204 | 9 | nueva (30 m), con la investigación «Bimodo» |
| 120 | KAFKA | LD | eléctrica | 3 y 25 kV | VAR | 250 | 238 | 16 | nueva (26 m) |
| 130 | Tardo | LD | eléctrica | 3 y 25 kV | VAR | 250 | 299 | 25 | nueva (28 m) |
| 730 | Tardo | LD | bimodo | 3 y 25 kV | VAR | 250 (180 en diésel) | 262 | 30 | nueva (30 m) |
| 106 Avril | Tardo | AV | eléctrica | 3 y 25 kV | VAR | 330 | 507 | 32 | contrato histórico de 30 unidades (mayo de 2024 → 2025) / nueva |
| 103 | Schlimmens | AV | eléctrica | 25 kV | UIC | 350 | 405 | 38 | nueva (34 m) |
| 112 | Tardo | AV | eléctrica | 25 kV | UIC | 330 | 365 | 29 | nueva (30 m) |
| 100 | Malstom | AV | eléctrica | 3 y 25 kV | UIC | 300 | 329 | 16 | solo usada |
| BCBB AV | BCBB | AV | eléctrica | 25 kV | UIC | 350 | 576 | 19 | nueva (20 m); fiabilidad 0,78; **gálibo ancho** |
| Nueva generación | concurso | AV | eléctrica | 25 kV (variante 2T) | UIC / VAR | 350 | 540 | 36 | solo tras `decision:futuretender` (42 m) |

- **Ids heredados**, para migrar partidas y pruebas: `s106f` y `s106v` → `106`; `av2030` → «Nueva generación». La marca deja de ser «Tenfe», que es el operador.
- **Logotipos:** los 6 fabricantes de `brands.js`. El build exige exactamente 6 logos distintos.
- **Campos de cada serie:** `segmento, traccion, tensiones[], ancho, vmax, vmaxDiesel, autonomia, plazas, precio, plazoMeses, desde, energia, fiabilidad, galibo, marca, foto`.

### D4.2 Cómo se ve la compatibilidad (cuatro patrones combinados, `juegos-ferroviarios` §8.1)

1. **Etiquetas fijas, con el mismo vocabulario en toda la interfaz.**
   - Ancho: `IB` · `UIC` · `VAR`.
   - Tensión y tracción: `3 kV` · `25 kV` · `2T` (bitensión) · `DSL` · `BIMODO` · `BAT`.
   - Velocidad (`vmax`) y `GÁLIBO ANCHO`.

   Salen en las tarjetas de Trenespop, en el parque, en el selector de la herramienta Línea y en la ficha del tramo.
2. **Tres estados cuando Trenespop se abre desde una línea:**
   - ✓ Puede: tiempo de viaje y tramo que limita la velocidad.
   - ◐ Puede con cambio: el cambiador está en X (+12 min).
   - ✗ No puede: el primer motivo y el enlace «Obra que lo arregla (coste, meses)».

   La casilla «Solo los que circulan» viene marcada.
3. **Tira de ruta** en la ficha de compra y en la de línea. Los tramos llevan su color y sus km, al estilo TF2 pero **antes** de comprar.
4. **Capa del mapa «Compatibilidad: <serie>».** Pinta en verde los tramos por donde puede ir la serie y en rojo donde no, con el motivo al pasar el ratón. Se enciende sola al abrir Trenespop desde una línea (Cities: las vistas de información se abren solas).

Además:
- En el parque: «Circula en: 3 líneas abiertas · 9 posibles».
- **Barrido semanal:** si una obra o un traslado deja un tren donde no puede circular, sale de la línea con aviso. El planificador de obra ya lo anunció antes.

### D4.3 Trenespop

- **Vistas.** Se aprovecha `marketplace.js` como capa de presentación, con la refactorización de `trenespop-reutilizacion` §1: `tpCatalogue` y `tpDetail` reciben atributo, ids y formato de dinero como parámetros.
- **Anuncios nuevos, de fábrica.** Una ficha por serie a la venta y por año.
  - Cada fabricante tiene una **cartera de pedidos** con su capacidad (unidades al mes).
  - Plazo = plazo base + cartera / capacidad.
  - Hay retraso **solo si la cartera crece después de pedir**, y se anuncia con su causa: «KAFKA acumula 60 unidades: tu pedido o12 se retrasa 3 meses».
  - Se acaban los dados del 28 %.
- **Unidades de stock.** Pedidos cancelados de otros operadores y traspasos de Cercanías, con plazo de 1 a 3 meses. Sirven para el arranque 2027: «un tren de stock llega en un mes».
- **Segunda mano.**
  - Cada semana salen de 1 a 3 anuncios que duran de 2 a 5 semanas.
  - Son **deterministas**: dependen de `(semilla, semana)` y no gastan azar del estado; mirar es gratis.
  - La edad y el estado deciden el precio.
  - Hay señuelos incompatibles, como un 2700 de ancho métrico.

  Ya hay un prototipo medido (`trenespop-reutilizacion` §6).
- **Ofertas relámpago con causa:**
  - `event:secondhand`: un operador extranjero vende 4 unidades AV, que aparecen como anuncio real.
  - Avance de fabricante (OpenTTD): «¿Un año de exclusiva del nuevo X?».
- **Compra.**
  - Pedido nuevo: 30 % de señal, 2 unidades al mes y el resto se paga a la entrega en el cierre de mes.
  - Usado con entrega inmediata: se paga entero.
  - **Comisión** («una atención del 7 %»): solo en pedidos nuevos, la ofrece Íñigo como conseguidor (`cor-comision`) y queda en el registro de secretos (§D5.8).
- **Taller.**
  - Reforma: 12 % del precio y 5 meses; vuelve al 98 %.
  - Adaptaciones, como pasar la 449 a 2T.
  - Revisión por unidad, con plaza de taller.
  - Venta depreciada por edad.
- **Alquiler.** 470 o 599 por 13 semanas, sin señal.

### D4.4 Arranque de flota y llegada de la Media Distancia

- **3-1-2022:** los 80 trenes AVE y Alvia del clásico (`engine.js:24`). La reserva de maquinistas sobra, como dice lo grabado: «Hoy sobra cobertura».
- **Al terminar el tutorial**, la ministra ofrece el **Contrato OSP de Media Distancia** (línea nueva `osp-oferta`):
  - Tenfe recibe unos 40 trenes MD (592, 594, 599, 470, 449 y 463), cerca de 14 líneas MD y el pago por tren-km;
  - a cambio, KPI trimestrales.
  - Si lo rechazas, la MD sigue siendo del Ministerio y vuelve a ofrecerse en el Hito 2.
- Así la Media Distancia es un **desbloqueo al estilo Cities** y no rompe el tutorial.

---

## D5. Rejugabilidad (Tropico + Cities + juegos de trenes)

### D5.1 Arranques (pantalla «¿Adónde vamos?»)

| Arranque | Fecha | Qué cambia | Medallas |
|---|---|---|---|
| **2022 · Toma de posesión** | 3-1-2022 | Tutorial grabado, historia real, horizonte 2050 | sí |
| **2027 · Rescate de Tenfe** | 4-1-2027 | Deuda de 1.900 M€, caja de 40 M€, Norte con la vía al 45 % en `avi-med`, flota vieja, OuiOui fuerte, 13 semanas para salvarte, calendario propio (Raquel hasta 2030). Tutorial `t-*` y etapas `stage-*` | sí |
| **Maqueta** (lo que era el modo libre) | 2022 o 2027 | Casillas: caja (500/1.500/5.000/ilimitada), rivales sí o no, cese sí o no, elecciones sí o no, imprevistos (ninguno… frecuentes), todo desbloqueado, sin horizonte, y «seleccionar todo» | no (avisado al cargar) |

### D5.2 Semilla y código

- **Semilla de texto con botón «Aleatoria».** Genera un **código para compartir** (`TNF-4K7Q-9M2X`) que se enseña al empezar y al final.
- **La semilla decide, siempre dentro de lo verosímil:**
  - qué 3-5 tramos empiezan degradados (estado 35-55 %);
  - el estado de cada lote (±10);
  - la cartera de cada fabricante;
  - el año de entrada de los rivales en cada eje (±2 años desde 2025; antes manda la historia real);
  - la secuencia de inviernos duros y veranos tórridos;
  - los choques de energía después de 2023;
  - una comunidad hostil (−15) y una amiga (+15);
  - el megaproyecto favorito del Gobierno;
  - las tres metas de los retos.
- **Los hechos de 2022 a 2024 son siempre los reales.** La semilla solo cambia lo que viene después.

### D5.3 Dificultad, deslizadores, rasgo y modificadores

- **Dificultad** (multiplica la puntuación, como Tropico 4): Fácil ×0,8 · Normal ×1 · Difícil ×1,25 · Infernal ×1,5.
- **Deslizadores** (4 pasos cada uno; la dificultad los preajusta):
  - Fondos europeos;
  - Exigencia de los grupos;
  - Competencia;
  - Imprevistos;
  - Sindicatos;
  - Cartera de fábricas.
- **Rasgo del presidente de Tenfe** (se elige uno; Tropico):

  | Rasgo | Efecto |
  |---|---|
  | Carismático | +2 con todos los grupos |
  | Inaugurador compulsivo | +★ por obra terminada; obras un 10 % más caras |
  | Pide perdón | −50 % de castigo al rechazar exigencias |
  | Comisionista | comisiones +5 %; sospecha +50 % |
  | Tecnócrata | investigación un 20 % más rápida; −2 con Territorios |
  | Ferroviario de carrera | formación de maquinistas en 9 semanas; +5 con Trabajadores |
  | Gestor de Excel | intereses −0,5 puntos; −3 con Viajeros |
  | Blando | sin cloacas; +5 con Trabajadores |

- **Modificadores** (de 0 a 3, sortéalos o elígelos; Mini Motorways): Austeridad (+25 % obras y mantenimiento, −15 % demanda), Bruselas se olvida, Huelga perpetua, Ancho ibérico para siempre, Prensa hostil, Invierno largo, Diésel prohibido en 2040, Fábricas saturadas.

### D5.4 Facciones: los grupos de Tropico con las caras del reparto

| Grupo (peso electoral) | Líder (voz) | Qué mide | Exigencias (temas de encuentro) | Ultimátum (grupo < 25) |
|---|---|---|---|---|
| Viajeros (0,34) | Marisa Andén | puntualidad ponderada, precio, sin plaza, incidencias, compromisos con viajeros | 1 billetes, 2 averías, 4 la app | «Huelga de usuarios»: indemnizaciones ×2 durante 8 semanas |
| Territorios (0,20) | Paco Terruño | territorios con tren diario, estaciones atendidas, convenios cumplidos | 3 el andén olvidado | una comunidad rescinde su convenio |
| Trabajadores (0,20) | Fermín Bogie | cobertura de maquinistas, horas extra, nómina, saturación de talleres | 0 turnos, 2 taller | huelga (`event:strike`) |
| Economía (0,26) | Charo Tijera | resultado, deuda, caja, cuota de OuiOui | 1 descuentos, 4 pilotos | congelación (`event:freeze`) |
| Confianza del Gobierno (no vota) | Pedro Sancho y el ministro de turno | apoyo, etapa, inauguraciones, escándalos | `arc:4`, elecciones | cuenta atrás de cese, 26 semanas |
| Adif (no vota) | Benito Balasto | relación con Adif | — | +1 mes de permisos; sin préstamo de frentes |
| Rival y conseguidor | Íñigo Asfalto | autobuses, campañas y tratos sucios | — | — |

- **Discurso de campaña** (Tropico). 8 semanas antes de las elecciones eliges dos promesas entre las que tienen sentido en ese momento: «Teruel eléctrico», «Norte puntual», «Billetes congelados»… Dan apoyo ya y **se convierten en compromisos** de la legislatura siguiente (§D6.5).

### D5.5 Rivales

- **OuiOui y YaIré.**
  - Entran por eje y año: la historia real hasta 2024 y la semilla después.
  - Ocupan surcos LAV.
  - Revisan su estrategia cada 26 semanas frente a tu tarifa y tu frecuencia (la regla determinista del clásico, `tycoon.js:20-32`).
  - YaIré lanza promociones de 13 semanas.
- **Autocares Meseta.**
  - Tiene cuota de autobús en cada relación.
  - Lanza **campañas de 13 semanas cada 78**, o cuando subes tarifas más de un 10 %: billetes a 5 € en sus relaciones de menos de 400 km.
  - Así `event:busprice` es literalmente cierto.

### D5.6 Sucesos situados en tramos reales (sin «dados sin causa»)

Cada suceso tiene **condición de estado**, **lugar** (tramo, línea o tren concretos), **efecto con duración** y su diálogo. El riesgo se ve antes en Monitor › Riesgos («Nieve: 3 puertos con catenaria · semanas 1-8 y 49-52»).

| Suceso | Condición | Lugar | Efecto | Diálogo |
|---|---|---|---|---|
| Nieve | Semana de invierno marcada por la semilla y 3 o más tramos `nieve` electrificados con líneas | Pajares (`leo-pol-r`), Reinosa (`pal-san`), Guadarrama (`mad-avi`)… | Los trenes eléctricos no pasan durante 1 a 3 días; los diésel sí | `event:snow` |
| Ola de calor | Semana de verano «tórrida» y tramo `calor` con líneas | Sur, Extremadura, Murcia | Tope de velocidad o riesgo de incidencias | `event:heatwave`, `decision:climate` (Córdoba ≥ 44 °C), `ev-calor` (aire acondicionado de un tren concreto) |
| Robo de cable | Tramo `robo` de 3 kV con riesgo acumulado | Convencional periurbano | Límite de velocidad y −punt. hasta reponer | `event:cable` |
| Desprendimiento | Tramo `trinchera` con lluvia o deshielo | `pal-san`, `ter-sag`, `leo-pol-r` | Corte desde el aviso hasta despejar | `ev-desprendimiento` |
| Ganado | Tramo `ganado` de vía única con un Alvia | Rural | Retraso ese día; el vallado lo acaba | `event:cows` |
| Restos romanos | Obra en fase de obra sobre un tramo `yacimiento` | Mérida, Tarragona, Córdoba, Zaragoza, Lugo | +N meses en **esa** obra | `event:adifdelay` |
| Avería en rampa | Fiabilidad × estado × tensión del tramo (`rampa`) | Un tren y un tramo concretos | Tren en taller 1 o 3 semanas de servicio, cifra exacta | `ev-averia` |
| Viral | Línea con puntualidad ≥ 95 % durante 2 semanas, o revisora en el Teruel con tren | Esa línea | +demanda en esa línea durante 6 semanas | `event:influencer`, `ev-viral(-teruel)` |
| Visita | Ministro en el cargo y línea Norte abierta | Un tren real | Telediario según la puntualidad prevista esa semana | `ev-visita` |
| Jefe de Estado | Línea AVE con su puntualidad | Esa línea | Resultado determinista según la puntualidad | `event:royal` |
| Huelga | Trabajadores < 38 o convenio vencido | Toda la red | Servicios mínimos reales: 40 % de los viajes cancelados | `event:strike` |

### D5.7 Hitos, investigación, megaproyectos y medallas

- **12 hitos** por viajeros semanales (media de 4 semanas), con ladder ×1,2: 175 mil, 210 mil, 250 mil… hasta 1,25 millones.
  - Cada hito paga: transferencia del Estado, ★ y más tope de crédito.
  - Cada hito desbloquea algo con nombre:
    - H1: OSP de MD si se rechazó y segundo préstamo;
    - H2: investigación de nivel 2, convenios autonómicos de 3★ y exprés;
    - H3: megaproyectos de nivel 1;
    - H4: grandes proyectos AV y tercer préstamo;
    - …;
    - H7: Estación Central.
  - Lo bloqueado se ve con su candado y su requisito (Cities).
- **Investigación** (cuadrícula 6×3, «solo cabe una investigación en curso», tal como está grabado).
  - Las 6 investigaciones clásicas (online, fidelización, ERTMS, cambiador rápido, predictivo, hidrógeno) con sus costes y plazos grabados (online 10 M€ y 4 meses; ERTMS 35 M€ y 12 meses).
  - Más las del rescate, agrupadas en Mantenimiento, Operación, Material, Comercial y Comunicación. La rama «Fontanería» pasa a Cloacas.
  - **Pilotos:** el 30 % del coste, 8 semanas en una sola línea, resultado medido y crédito al comprarla. Hacen verdad el tema 4 de los encuentros.
- **Megaproyectos** (SimCity 5). Cada etapa exige logros y ya rinde.
  - Los 6 del rescate: Gran Taller, Centro de Control, Corredor Mediterráneo, Teruel, Estación Central y Monumento (la vanidad que hace falta para «otra escultura»).
  - Más los 9 `PROJECTS` de alta velocidad, con su calendario real.
  - Nadie se queda sin el beneficio prometido: se arregla el CTC de la etapa 3.
- **Retos.** 3 por partida, sacados de la semilla, con fecha («AVE a Granada antes de 2026», «Teruel eléctrico en 2030», «Sin préstamos hasta 2027»). Se ven como medallas oscuras que se doran al cumplirse.
- **Medallas.** Las 9 clásicas, las 22 del rescate y algunas satíricas («Ministro dimitido», «Puerta giratoria»).
- **Partida sin fin.** Después de 2050 siguen los convenios, los rivales y las elecciones.

### D5.8 Cloacas (del rescate, con procedencia)

- **Registro de secretos.** Cada secreto guarda tipo, importe, contrato o tramo, participantes y **testigos**. Solo puede extorsionar un testigo, y con su línea. Cada escándalo usa su línea propia (`sc-comision`, `sc-pacto-meseta`, `sc-accidente`). Ningún secreto se publica dos veces.
- **Íñigo es el conseguidor**, el Broker de Tropico. Es la identidad coherente que pedía la auditoría.
- **Fases judiciales** con una sola función. Toda subida emite su aviso (`jud-1/2/3`); el archivo tiene su línea (`jud-archivo`).
- **Juez.** «Si sale mal, es el final» pasa a ser literal: inhabilitación y fin de la partida.
- **Se desbloquean** en el Hito 2, o antes si aceptas la primera propuesta.

---

## D6. Motor de verdad narrativa

### D6.1 Las 9 reglas

1. **No se elige ningún diálogo al azar.** Se encola solo cuando su predicado es cierto en el estado.
2. **Se vuelve a validar** justo antes de enseñarlo y al cargar la partida. Si ya no es cierto, se descarta sin ruido.
3. **Toda opción es una acción del motor** con objeto, magnitud y duración. Se ve como etiqueta con cuenta atrás en el objeto (línea, tramo, tren, estación, comunidad), en el Parte semanal y en el Diario, con su origen («Porque elegiste *Esperar al deshielo* el 12-2-2023»).
4. **Las cifras de un texto grabado son constantes del motor**, y lo comprueba `verdad-test.mjs`.
5. **Las cifras dinámicas van solo en el párrafo extra sin voz**, debajo de la cita (patrón `extra` del rescate).
6. **Toda promesa abre un compromiso** en la Agenda, con objetivo, plazo y consecuencia (§D6.5).
7. **El hablante sale del papel y la fecha** (`F.cargo`): ministra o sucesor, Benito o quien esté en Adif, la contraparte de cada pacto.
8. **El silencio está permitido.** Si nada es cierto, no hay escena.
9. **El azar solo existe en riesgos con causa visible** (probabilidad enseñada). Nunca decide el desenlace de una elección del jugador. Las apuestas declaradas usan una semilla por decisión, así que no se pueden repetir.

### D6.2 Arquitectura

```
estado ──► hechos.js  F = facts(s)  (≈ 200 hechos: cargo, grupos, líneas, tramos, trenes, sucesos, ventanas)
            │
            ▼
       dialogos.js  BANCO: por fuente de catálogo (decision:x, event:y, encounter:scene-…, induction:…, arc:n,
            │        chapter:x) y por id de LINES →
            │        {when(F), bind(F)→instancia, extra(inst), choices:[{label, preview(F,inst), apply(s,inst)}],
            │         prioridad, enfriamiento, retirado?}
            ▼
       selector semanal y diario ─► cola de escenas (1 bloqueante al día como máximo) ─► modal Escena
            │                                                                              │
            ▼                                                                              ▼
       registro s.dlg {usados, enfriamientos, activos:[efectos con fin], compromisos, diario}  ◄── apply()
```

- **El texto nunca se copia.** El banco lee `{person, mood, raw}` de los módulos originales (`DECISIONS`, `EVENTS`, `CHAPTERS`, `ARCS`, `ENCOUNTERS`, `INDUCTION_STAGES`) y de `LINES`. Así no se escapa nada del SHA del catálogo (`restricciones` §6.1).
- **Todo pasa por `Voices.speak`.**
  - Las tomas clásicas se buscan por `clipId(person, raw)`.
  - Las de `LINES` se indexan por `clipId(person, texto)` en tiempo de ejecución.

  Un solo reproductor: una atenuación, un error y un respaldo de subtítulos.
- **Prioridades:** historia fechada > crisis (impago, elecciones, cese) > etapa y compromisos > suceso > exigencia (encuentro) > pacto u oferta.

### D6.3 Los 97 diálogos de historia y tutorial

El detalle de cada disparador y efecto está en el anexo A. Resumen:

- **Las 15 decisiones** dejan de ir por mes fijo y se disparan con el hecho:
  - Burgos, el día que abre `vdb-bur`;
  - Murcia, Pajares y Extremadura, el día de su apertura;
  - S106, con la primera entrega del contrato histórico;
  - la licitación, que **es** la que abre el catálogo de nueva generación;
  - la industria, cuando la cartera de fábrica alcanza 18 meses;
  - el clima, con una semana de 44 °C en Córdoba y trenes pasando por allí;
  - lo rural, con Villanueva del Andén sin trenes y Territorios < 50.
- **Las opciones hacen lo que dicen:**
  - «Lanzar los Alvia a Asturias» abre o refuerza Madrid–Gijón por la Variante con un Alvia libre, o sale desactivada con el motivo.
  - «Plan Extremadura» encarga de verdad la electrificación de `mad-tal` y `tal-pla`, con la ayuda europea prevista.
  - «Reducir la oferta» recorta salidas en las líneas que cruzan tramos `calor`.
  - «Prometer catenaria» abre un compromiso con fecha.
- **Los 22 sucesos** salen de condiciones de estado y lugar (§D5.6). Ya no hay una tirada del 32 % al mes.
- **Los 5 arcos** presentan los convenios o programas solo si encajan:
  - `arc:0`, si OuiOui está en esa relación y es más barato;
  - `arc:1`, en Asturias después del 29-11-2023;
  - `arc:2`, mientras Raquel es ministra;
  - `arc:4`, si faltan 26 semanas o menos para unas elecciones.
- **Los 5 capítulos** son las introducciones de las etapas por legislatura. Cada uno trae sus objetivos clásicos y un plazo, que es la elección que cierra la legislatura:
  - recuperación: 2022 → jul 2023;
  - competencia: 2024 → jul 2027;
  - Mediterráneo: 2028 → 2031 («AVE de València a Barcelona» cuenta como un AVE **circulando**, no solo posible);
  - territorio: 2035 → 2039;
  - legado: 2042 → 2047 o 2050.
- **Las 50 tomas del tutorial** se mantienen en el arranque 2022, con los nombres de interfaz que citan: «Qué puede circular», «Competencia», «Investigación», «Agenda» y «parte».
  - La etapa de incidencia usa ▶ Ver la jornada.
  - El parte del día sale de los viajes del día.

### D6.4 Los 315 encuentros: exigencias de los grupos

- **Se usa el algoritmo de `auditoria-encuentros` §6** con las semanas del calendario continuo. Se evalúa una vez por semana, el domingo, después del parte.
  - Nunca en las 5 primeras semanas ni con una decisión pendiente.
  - Como mucho un encuentro cada 4 semanas; el objetivo es uno cada 6.
  - Enfriamientos: el mismo cuerpo, una vez por partida; persona y estado de ánimo, 26 semanas; persona y tema, 26; tema, 8; persona, 8; instancia, 13.
  - Puntuación: `0,55·gravedad + 0,25·implicación + 0,20·nivel`.
- **El estado de ánimo sale del grupo del personaje.** Contento u orgulloso solo con confianza ≥ 40; enfadado o decepcionado solo con ≤ 60.
- **Mecánicas que este diseño incorpora para que los 310 cuerpos utilizables puedan ser verdad** (`auditoria-encuentros` §8):
  - bolsa de maquinistas con déficit real y formación de 13 semanas;
  - horas extra;
  - plazas de taller con cola y turno de noche;
  - frentes de guardia de Adif;
  - estaciones con personal (26 semanas a 0,006 M€ por semana);
  - campaña de descuento real (×0,85 durante 13 semanas, con vuelta automática);
  - revisión de un tren concreto;
  - pilotos tecnológicos con partida reservada;
  - fallo de la app en semanas punta;
  - OuiOui y YaIré con promociones;
  - Autocares Meseta con campañas;
  - el Monumento;
  - el apeadero de Paco;
  - cloacas;
  - calendario de cargos.
- **Si una mecánica se desactiva** con una casilla de maqueta (p. ej., rivales no), su grupo de cuerpos se retira en esa partida, con la tabla `auditoria-encuentros` §7.2.
- **Cuerpos retirados para siempre** (nunca pueden ser verdad; siguen en la sala de escucha):
  - `scene-adif-happy-0`
  - `scene-adif-determined-2`
  - `scene-workshop-happy-2`
  - `scene-rival-surprised-1`
  - `scene-successor-happy-0`
- **Ventanas estrechas:** los 9 casos de `auditoria-encuentros` §7.3 se codifican tal cual.

### D6.5 Registro de compromisos

```
{id, quien, origen:'decision:teruel'|'discurso'|'pacto:…', que:'Electrificar zar–ter y ter–sag', objetivo: F=>…,
 inicio, plazo, consecuencia:{grupo:-8, rencor:'mayor', linea:'comp-alcalde'}, estado:'abierto'|'cumplido'|'fallado'}
```

- Se ve en la Agenda con barra de avance y plazo.
- Lo vigila el motor cada día.
- Si se falla, se aplica la consecuencia y suena la línea del que prometió (`comp-*`, 5 tomas nuevas).
- Si se cumple, suena `pact-done` en su versión de ministra o de sucesor.
- **Lo que abre compromisos:**
  - `decision:legacyvote`;
  - `event:teruel`, `event:mayorchain` («estudio de parada»), `event:tweet` («esta semana todo funciona»: puntualidad de la red ≥ X la semana siguiente);
  - los pactos;
  - el discurso de campaña;
  - los convenios.

### D6.6 Qué se retira, qué se sustituye y qué se graba

- **Retirados del juego, pero en la sala de escucha:**
  - los 5 encuentros de §D6.4;
  - `decision:legacyvote` en partidas sin horizonte;
  - los diálogos fechados de 2022-2026 y el tutorial clásico no se pueden reproducir en el arranque 2027;
  - `t-1` y `t-2` no se pueden reproducir en el arranque 2022.
- **Líneas del rescate sin grabar que se borran** porque las sustituye un cuerpo clásico grabado:
  - `ev-cable` → `event:cable`
  - `ev-nevada` → `event:snow`
  - `ev-huelga` → `event:strike`
  - `ev-auditoria` → `event:audit`
  - `ev-fondos` → `event:eufunds`
  - `ev-lowgo` → titular de la Gaceta

  No se pierde ninguna grabación.
- **Tomas nuevas: 99**, con `build_rescate_voices.py`, el mismo modelo, referencias, semilla y masterización (unos 83 minutos de CPU). El presupuesto era de 150. La lista completa está en el anexo B:

  | Grupo | Tomas |
  |---|---|
  | Tutorial de 2027 reescrito | 5 |
  | Etapas de 2027 | 8 |
  | Pactos (con `paco-estacion` regrabado: «Presidente» en vez de «Ministro») | 11 |
  | Resultado de pactos | 3 |
  | Negociación (por contraparte) | 10 |
  | Sucesos propios | 7 |
  | Cloacas | 23 |
  | Finanzas | 4 |
  | Elecciones | 3 |
  | Finales | 4 |
  | Hito y megaobra | 2 |
  | Convenios | 6 |
  | Guías de desbloqueo | 5 |
  | Compromisos | 5 |
  | Premio | 1 |
  | Relevo de 2023 | 2 |

### D6.7 Pruebas de veracidad

| Prueba | Qué comprueba |
|---|---|
| `verdad-test.mjs` | Cada cifra o fecha de los cuerpos que se reutilizan coincide con la del motor en el momento del disparo: 4 M€; 0,3 M€ y 13 semanas; 18.000 y 9.000 €; demora al 30 %; 10 M€ y 4 meses; 35 M€ y 12 meses; 18 meses, 18 y 26 M€, +25 %; Burgos el 21-7-2022… Generaliza `voice-text-test`. |
| `alcanzabilidad-test.mjs` | Un bot que juega 10 semillas hasta 2050 alcanza al menos el 90 % de los cuerpos no retirados. Ninguno sale con su predicado falso: se vuelve a evaluar después de enseñarlo. |
| `efectos-test.mjs` | Toda opción deja un efecto observable en el estado antes de 8 días, o un compromiso abierto. |

---

## D7. Qué se queda de cada modo y qué se va

| Origen | Se queda (y cómo) | Se va (y por qué) |
|---|---|---|
| **Campaña clásica** | Red de tramos y planificador (`infra.plan`, `faultText`); horario real GTFS y jornada (ahora es el tick); aperturas históricas; Trenespop; encargos de 3 etapas, que pasan a ser **programas dentro de los convenios**; rivales deterministas; maquinistas con formación; investigación; estaciones; peticiones (cobradas tras 13 semanas); capítulos (etapas por legislatura con plazo); las 15 decisiones con disparador real; el tutorial grabado; la escala de dinero; el mapa ilustrado y el arte de las ciudades | «Delegar mes» (lo sustituyen las velocidades); dados del 28, 22 y 32 %; apuestas que se repiten; `fleetcare`; política fijada para siempre (ahora se puede cambiar al empezar cada legislatura); el Despacho con 4 pestañas y 5 subpestañas |
| **Rescate 4.0** | Motor puro y determinista con el azar en el estado; **presupuesto antes de aprobar** con la misma regla del motor; causas a la vista; misión → obstáculo → acción (la «Siguiente» de la Agenda); obras en 3 fases con 3 modos; frentes; pactos verificables; financiación prevista; impago con 5 salidas; elecciones con 4 grupos y causas; hitos; tecnologías (dentro de Investigación); megaobras; cloacas con causalidad; Gaceta; paradas de ⏭; parte semanal (ahora sí se enseña); las 63 imágenes; el bot de 8 años como banco de equilibrio. El arranque 2027 es su premisa | **3 órdenes por semana** (escasez artificial; la sustituyen recursos reales); corredores escalares (sustituidos por líneas sobre tramos); escala de 12 M€; vidrio oscuro sobre pergamino; 11 páginas en el raíl; 8 capas, 3 de ellas falsas |
| **Modo libre** | Sus opciones como **casillas de Maqueta**; juego sin fin; logro «Más allá de 2050» | El modo como entrada aparte; el botón «Nueva partida» que arrancaba una campaña (fallo de `app.js:960`) |

---

## D8. Lo que tomamos de Airport CEO (adaptado al tren)

1. **Convenios marco con peticiones de servicio** (contrato de aerolínea → vuelos).
   - El Ministerio (OSP) y cada comunidad firman **un convenio marco sin caducidad**.
   - Luego mandan **peticiones**: «Madrid–Badajoz, 3 salidas al día, puntualidad ≥ 85 %, tarifa ≤ 35 €, 0,9 M€ al mes durante 36 meses».
   - Las aceptas, las negocias o las rechazas.
   - Cada mes se mide el KPI con **margen** (5 puntos de puntualidad, como la hora de margen de los vuelos). Cumplir sube la satisfacción de la comunidad; fallar la baja; con 3 meses seguidos por debajo del umbral, rescinde.
   - Los encargos clásicos de 3 etapas (`tycoon.js:35-188`) son peticiones de tipo «programa de corredor».
2. **Clase en estrellas ligada a la nota.** Cada comunidad tiene de 1★ a 5★ según la **media de 8 semanas** de satisfacción en su territorio. Las peticiones de 4-5★ pagan más pero exigen más puntualidad y castigan más. Así hay dilema, que era la crítica a Airport CEO.
3. **Renegociación con puntos y probabilidad visible.**
   - Gastas ★ como puntos de negociación y ves la probabilidad.
   - Como mucho **2 contraofertas**; después, la otra parte cierra y se molesta (−5).
   - La probabilidad usa una semilla por contrato: cargar no sirve.
   - Rebajar tu propia petición se acepta siempre.
   - Hay negociador automático en Ajustes.
4. **Monitor de operaciones (tecla G).** Tabla de líneas con columnas agrupadas por color y contador de avisos con su causa al pasar el ratón (§D9.4). Pestañas Tramos (carga de surcos) y Trenes (estado, avería, taller).
5. **Surcos como *stands*.** El planificador de líneas no deja asignar salidas sin capacidad y **dice por qué y dónde**. Nunca devuelve una petición a la lista sin explicarlo.
6. **Avisos con prioridad** (la lección de DB 152, «la atención es un bien escasísimo»).
   - Columna fija con **3 críticos como máximo**.
   - El resto, **sobre el mapa**, en su tramo o ciudad: causa al pasar el ratón y ficha al pulsar.
   - Lo informativo, al Diario.
   - El informe de los directivos se reduce a **un parte semanal de 3 líneas** que se puede quitar.
7. **Diagnóstico de ruta** (análisis de rutas de la Alpha 36). Herramienta «¿Puede ir X de A a B?»: pinta en verde el camino, o en rojo el primer tramo imposible con su motivo y la obra que lo arregla.
8. **Tutorial con lista que se marca sola.** Los pasos de la inducción se marcan leyendo el estado del motor (`induction-runtime.stageChecks`). Botón «¿Por qué no se marca?», que dice qué falta, y botón para saltar el paso.
9. **Nota en dos niveles.** 4 notas de Tenfe (Viajeros, Territorios, Trabajadores, Economía), cada una con 3-4 secundarias. Se enseñan la nota de la semana y la media de 8 semanas; **la media abre ofertas**. Al pasar el ratón: «de qué depende y qué puedes hacer».
10. **Premio anual «Operador Ferroviario del Año».** Top 10 de operadores europeos parodiados y premio en M€. Se calcula con datos reales de la partida.
11. **Partida nueva con ficha y casillas** (arranque, dificultad, maqueta con «seleccionar todo»). Las medallas se desactivan en maqueta y se avisa.

**Lo que no copiamos:**
- correos imposibles de quitar;
- interruptores escondidos;
- fallos silenciosos;
- el planificador automático que manda todo en oleadas;
- la negociación que se gana repitiendo;
- notas sin consecuencias;
- información repartida en cinco canales;
- menús de tres niveles.

---

## D9. Arquitectura de la interfaz

### D9.1 Zonas fijas (cada zona hace una sola cosa)

| Zona | Siempre muestra | Al pulsar |
|---|---|---|
| **Barra superior** | Logo · fecha y hora · ⏸ ▶ ▶▶ ▶▶▶ ⏭ · ⚠ avisos críticos (contador) · Caja con Δ semanal · Puntualidad · Apoyo y semanas hasta las urnas · ★ · ☰ | Caja → Finanzas; Puntualidad → Monitor; Apoyo → Política; ★ → Progreso |
| **Columna izquierda: Agenda** | 5 tarjetas como máximo: objetivo de la etapa · ofertas y encargos con plazo · compromisos · convenio en riesgo · elecciones · **Siguiente paso** | «Ir» abre el panel exacto o centra el mapa |
| **Centro: mapa** | Red, líneas, trenes, obras vivas y **avisos situados** (icono rojo o ámbar en el tramo o la ciudad) | Ficha del objeto |
| **Derecha: ficha** | Solo cuando hay algo elegido: ciudad, línea, tramo, nodo o cambiador, tren, obra, comunidad | Acciones de ese objeto |
| **Barra inferior** | ◧ Capas · **8 verbos en orden fijo y con nombre**: Líneas · Obras · Flota · Monitor · Convenios · Política · Finanzas · Progreso · Teletipo de la Gaceta | Abre el panel |

- **Paneles.** Entran desde la izquierda y ocupan **el 50 % del ancho como máximo**, para que el mapa siga a la vista. Cada uno tiene **un único nivel de pestañas**.
- **Planificadores** (Línea, Obra, Compra). Sustituyen el contenido del panel, con la miga de pan «‹ Líneas»; nunca se apilan. Mientras están abiertos, pintan su vista previa en el mapa.
- **Profundidad máxima: 2 niveles** (panel › pestaña). Las fichas son de nivel 1.
- **El Monitor** es la única pantalla ancha, como el planificador de Airport CEO.

### D9.2 Pantallas

| Pantalla | Contenido (pestañas) |
|---|---|
| Portada | Continuar · Nueva partida · Escuchar los diálogos · Ajustes. Conserva el ancla `<h2 id="menu-departures-title">¿Adónde vamos?</h2>` sobre la elección de arranque |
| Nueva partida | Arranque · semilla · dificultad · rasgo · modificadores · retos · opciones de maqueta (§D9.6) |
| Líneas | Abiertas · Relaciones · **Competencia** (+ planificador de línea) |
| Obras | En marcha · Catálogo (del tramo elegido o por tipo) · Grandes proyectos (+ planificador de obra) |
| Flota | Parque · **Trenespop** · Pedidos · Personal · Talleres |
| Monitor | Líneas · Tramos · Trenes · Protocolos |
| Convenios | Ministerio · Comunidades · Encargos (**Agenda** los resume) |
| Política | Grupos y elecciones · Pactos · Medidas · Cloacas (cuando se desbloquean) |
| Finanzas | Resumen · Por línea · Préstamos · Calendario de pagos |
| Progreso | Etapa · Hitos · **Investigación** · Megaproyectos · Retos y medallas |
| Diario (desde ⚠ o la Gaceta) | Avisos · Decisiones (con origen) · Gaceta |
| Modales | Escena (decisión, suceso, encuentro, pacto) · Parte semanal (tarjeta) · Fin de partida |
| Ayuda (F1) | Captura anotada de la interfaz y repetir el tutorial |

**Teclado:** L, O, F, G, C, P, E (finanzas), R (progreso), Espacio (pausa), 1-4 (velocidades), F1 (ayuda).

### D9.3 Pantalla principal

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆TENFE  lun 11 abr 2022 · 07:42 ☼   ⏸ ▶ ▶▶ ▶▶▶ ⏭    ⚠ 2    382 M€ ▲1,4/sem  ◷ 88 %  ☺ 54 % · urnas 66 sem  ★ 12  ☰ │
├───────────────────────┬──────────────────────────────────────────────────────────────┬───────────────┤
│ AGENDA                │                                                              │ TRAMO trb–sor │
│ ● Etapa 1  ▮▮▮▯ 3/4   │                                                              │ IB · sin cat. │
│   jul 23 ............ │                    · León                                    │ 100 km/h · única │
│ ● Encargo · firmar    │                      ╲        · Burgos                       │ estado 61 %   │
│   2 sem ......... Ir ›│          · Salamanca ─╲─ Medina                              │ surcos 9/30   │
│ ● OSP: Norte 78 %     │                        ╲     ⚠ (trb–sor: el S120 no pasa:    │ ───────────── │
│   umbral 85 · Ir ›    │          · Cáceres      Madrid ●───── · Soria   sin catenaria)│ Electrificar   │
│ ● Elecciones jul 23   │                          ╲                                    │ 45 M€ · 21 m  │
│   previsión 49 % Ir › │                           · Córdoba                           │ Renovar        │
│ ▸ SIGUIENTE           │                                                              │ 25 M€ · 7 m   │
│   Abre Madrid–Salamanca│                                                             │ Líneas: 1     │
├───────────────────────┴──────────────────────────────────────────────────────────────┴───────────────┤
│ ◧ Capas ▾ │ Líneas  Obras  Flota  Monitor  Convenios  Política  Finanzas  Progreso │ GACETA · «Burgos ya tiene AVE…» │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Móvil (390 px):
- arriba, una sola fila con la fecha, la velocidad, la caja y ⚠;
- la Agenda, como cajón que se desliza desde la izquierda con un contador;
- la ficha, como hoja que sube desde abajo;
- los 8 verbos, como barra de iconos con etiqueta que se desplaza en horizontal;
- los paneles, a pantalla completa con «‹ Mapa»;
- sin desplazamiento horizontal de la página (lo comprueba la prueba a 390 y 320 px).

### D9.4 Paneles clave

**Planificador de línea** (Líneas › Nueva, o dos clics en el mapa):

```
┌ LÍNEA NUEVA · Madrid → Salamanca ────────────────────────────────────────────── ‹ Líneas ┐
│ Ruta     (•) Por Medina          ( ) Por Ávila                                          │
│ ████████████████████◆██████████   mad ─ LAV · UIC · 25 kV · 300 ─ med ◆ ─ IB · 25 kV · 160 ─ sal │
│ Tren     S130 · LD · VAR · 2T · 250          libres 10                     [Cambiar ▾]   │
│ Qué puede circular   S103 ✗ ancho en med–sal   S130 ✓ 1 h 34   S730 ✓ 1 h 41               │
│ Salidas  − 4 +   cada 3 h desde 07:05      Tarifa  − 32 € +      Paradas  Ávila ☐ Medina ☑ │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ 9.400 viaj/sem     71 % ocupación     +0,21 M€/sem     91 % puntualidad (◆ −1,5 · vía −2) │
│ Necesita  3 trenes ✓ · 14 maquinistas ✓ · surcos ✓ · 4 M€ ✓                              │
│                                                  [Solo presupuesto]   [Abrir línea · 4 M€] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Trenespop abierto desde una línea:**

```
┌ TRENESPOP · Trenes para Madrid–Badajoz · IB · 268 km sin catenaria · 209 km a 25 kV ── ‹ Línea ┐
│ Buscar ____   Estado ▾   Tracción ▾   Entrega ▾   Marca ▾        ☑ Solo los que circulan         │
│ ─────────────────────────────────────────────────────────────────────────────────────────────── │
│ ▣ 730 · Tardo         VAR 2T BIMODO 250/180   262 pl   30,0 M€    ✓ 2 h 51    nuevo · 36 meses   │
│ ▣ 599 · KAFKA         IB DSL 160              181 pl    8,0 M€    ✓ 3 h 20    nuevo · 24 meses   │
│ ▣ 599 · 2009 · 71 %   IB DSL 160              181 pl    3,1 M€    ✓ 3 h 20    usado · ya · 2 uds │
│ ▣ BMU · Dörfler       IB 2T BIMODO 160/140    204 pl    9,0 M€    ✓ 3 h 32    nuevo · 30 meses   │
│ ▣ 449 · KAFKA         IB 3 kV 160             257 pl    —         ✗ sin catenaria mad–pla › obra │
│ ─────────────────────────────────────────────────────────────────────────────────────────────── │
│ 730 ▸ ██████████████░░░░░░░░  diésel 268 km · 25 kV 209 km        uno más: +1.900 viaj/sem       │
│ Cantidad − 2 +   60,0 M€ · señal 18,0 M€ · llegan mar → abr 2025              [Comprar · 18 M€]   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Monitor (G):**

```
┌ MONITOR · mar 14 jun 2022 ─ Líneas │ Tramos │ Trenes │ Protocolos ─── Producto ▾  ☐ Solo con avisos ┐
│ LÍNEA               SERIE │ SAL  UDS   MAQ │ VIAJ/DÍA  OCUP  SIN PLAZA │ PUNT hoy/4s  INC │ €/SEM    │ ⚠ │
│ Madrid–Barcelona    112   │ 14   9/9   ✓   │ 8.120     96 %  640       │ 97 / 95      0   │ ● +2,10  │   │
│ Madrid–València     103   │  6   4/4   ✓   │ 3.900     88 %  120       │ 91 / 92      1   │ ● +0,90  │ 1 │
│ Madrid–Badajoz      730   │  3   3/3   ✓   │   610     54 %    0       │ 74 / 79      2   │ ● −0,20  │ 2 │
│ Zaragoza–Teruel     599   │  2   2/2   ✗   │   340     41 %    0       │ 68 / 72      1   │ ● −0,35  │ 3 │
│ (colores: identidad · recursos · viajeros · operación · dinero; ● verde/ámbar/rojo como OpenTTD)  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Al pasar el ratón por «3» en Zaragoza–Teruel: «Faltan 2 maquinistas (se cancela la primera salida) · `ter-sag` a 90 km/h · el convenio de Aragón exige 85 %».

**Convenio (estilo contrato de aerolínea):**

```
┌ CONVENIOS · Comunidades › Extremadura   ★★☆☆☆   satisfacción 46 % · media 8 sem 51 % ───────────┐
│ Marco desde abr 2022 · revisión en 14 sem                                                       │
│ PETICIÓN   Madrid–Badajoz · 3 salidas/día · puntualidad ≥ 85 % · tarifa ≤ 35 €                    │
│            0,9 M€/mes · 36 meses · 3 meses por debajo: rescisión                                 │
│            ✓ tren sin catenaria   ✗ 3 unidades (tienes 2) › Trenespop   ✓ surcos                  │
│                                        [Rechazar]   [Negociar · 2 ★ · 40 %]   [Aceptar]           │
│ EN CURSO   Mérida–Sevilla · 2/día · 88 % ✓ · racha ▮▮▮ 3 meses                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Planificador de obra:**

```
┌ OBRA · Torralba–Soria · 93 km · IB · única · sin catenaria ────────────────────────── ‹ Obras ┐
│ Tipo      (•) Electrificar 25 kV   ( ) Electrificar 3 kV   ( ) Renovar   ( ) Apartaderos         │
│ Fases     ▮ permisos 2 m  ▮▮▮▮▮▮▮▮▮▮ obra 17 m  ▮ pruebas 2 m      frentes 2 de 2 libres          │
│ Durante   (•) Por fases −9 punt.   ( ) Autobús 55 % viaj.   ( ) Corte                              │
│ Coste     45 M€ · ayuda FEDER 18 M€ al certificar · en servicio oct 2023                          │
│ Después   Madrid–Soria podrá ir con 2T · −0,05 M€/sem de energía                                  │
│ Ojo       25 kV junto a 3 kV: solo trenes 2T (tienes 0 en esa línea)                               │
│                                                       [Solo presupuesto]   [Encargar a Adif]       │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
mapa: el tramo trb–sor en rojo (le falta) · el resto de la línea en azul (ya lo tiene)
```

**Escena:**

```
┌ IMPREVISTO · Nieve en los puertos ─────────────────────────────────────────┐
│ [retrato Benito · preocupado]  «Ha nevado en la meseta como no se recuerda, │
│                                 y la catenaria se ha congelado en tres      │
│                                 puertos…»                       ▶ Escuchar   │
│ Pajares · Reinosa · Guadarrama — 7 líneas eléctricas paradas; los diésel siguen │
│ [ Sacar las quitanieves · −0,6 M€ · vía libre mañana ]                       │
│ [ Esperar al deshielo · 3 días cortados · −14.000 viajeros ]                │
└────────────────────────────────────────────────────────────────────────────┘
```

**Parte semanal (tarjeta, no bloquea):**

```
┌ SEMANA 15 · 11–17 abr 2022 ─────────────────────────────────── [Seguir] ┐
│ 382 M€ ▲1,4   128.400 viaj ▲3 %   88 % ▼1                                  │
│ ● Madrid–Badajoz −0,2 M€: 730 en taller 4 días (avería en tal–pla)         │
│ ● Llega 1 × 599 (pedido o12) · quedan 3                                    │
│ ● trb–sor: permisos al 50 %                                                │
└───────────────────────────────────────────────────────────────────────────┘
```

### D9.5 Cómo se sabe siempre qué hacer

1. **«Siguiente paso»** en la Agenda: el obstáculo más grave con su verbo, por ejemplo «Contrata 20 maquinistas (faltan 12 en 13 sem)». Es `obstacles()` del rescate, generalizado.
2. **Lista del tutorial** que se marca sola.
3. **Todo aviso trae su arreglo** («Comprar compatible ›», «Obra que lo arregla ›»).
4. **Candados con requisito.** Lo bloqueado está a la vista, con «Se desbloquea en el Hito 3 ›».
5. **Al primer uso de un sistema**, una sola línea con voz de su guía (5 tomas nuevas) y una flecha. Se puede repetir desde la Ayuda.

### D9.6 Presupuesto de texto y estilo

| Regla | Límite |
|---|---|
| Botón | ≤ 3 palabras |
| Título de panel | 1-2 palabras |
| Fila de lista | ≤ 60 caracteres, cifra antes que palabra |
| Explicación visible | 1 frase de ≤ 90 caracteres; el resto, al pasar el ratón (≤ 120) |
| Párrafos | ninguno fuera de los diálogos y la ayuda |
| Anidación | no hay cajas dentro de cajas: listas como filas con separadores; tarjetas solo en el primer nivel (Agenda, rejilla de Trenespop, opciones de una escena) |
| Color | un color, un significado: verde bien · ámbar riesgo · rojo bloqueo · vino Tenfe `#a3123a` acento. Productos: AV vino · LD azul · MD verde · Regional ocre |
| Estilo | **Un solo lenguaje visual**: el mapa ilustrado de papel se queda; los marcos pasan a tinta sólida (`#1d1a21` al 94 %) sin desenfoque de vidrio, con bordes de 1 px y la escala de espaciado de 4 px. Dos tipografías: rótulos y cifras tabulares |

---

## D10. Plan por fases (8 fases; cada una se juega, se prueba y se publica sola)

**Cada fase termina igual** (AGENTS.md y `docs/PUBLICACION.md`):
1. `node tools/build-web.mjs`.
2. Suites Node y Playwright de la fase.
3. Commit de la fuente, el constructor, los recursos y `release.json` en `main`; push.
4. `node tools/verify-pages.mjs <URL> docs/pages-<ver>-https-proof.json`.
5. Subir `?v=`, la versión de `build-web.mjs:298`, `main-menu.js` y `package.json`.
6. README con lo que es verdad en ese momento.
7. Si hay voces: grabar fuera de Git, `--package` y cifra real en las dos páginas (412 + N/99).

**Regla de construcción para módulos nuevos:**
- se meten en `optionalBefore` de `extract-game-source.mjs` en orden de dependencias;
- solo importaciones con nombre en una línea;
- CSS en la lista de estilos;
- cada acción nueva lleva su receta en `sfx.js`. La prueba de §11 se extiende al atributo `data-u` de la interfaz nueva.

**Guardado:**
- clave nueva `iberia-ferroviaria-v5` (`version: 5`) desde la fase 1, con migración desde `-v2`/v4;
- nunca se borran las claves viejas;
- `tenfe-rescate-v1` se convierte en la fase 8; mientras tanto se puede exportar.

### Fase 1 · «Una sola partida» (4.1.0)

- **Qué ve el jugador:**
  - en la portada, un solo «Nueva partida» con la elección de arranque: 2022, 2027 (por ahora con el motor del rescate 4.0, marcado como tal) o Maqueta, que **absorbe el modo libre**;
  - la catenaria importa: el S103 y el S112 ya no pasan por los tramos de 3 kV;
  - Norte, Sur y Pajares tienen sus tramos convencionales reales;
  - capa «Velocidad»;
  - en Trenespop, «Solo compatibles con…» desde la ficha de la relación.
- **Archivos:**
  - `main-menu.js` / `main-menu.css`: portada con ancla y la elección de arranque;
  - `app.js`: el modal de partida nueva sustituye a `free-setup` y se arregla `new-game` en libre; sigue el ancla del aviso;
  - `tycoon.js`: `freeGame` pasa a `configurar(s, opciones)`;
  - `engine.js`: horizonte, `validateSave` v5 y migración;
  - `infra.js`: `profileOf` con tensiones, falta `tension`, tope de 220 km/h a 3 kV, `changer || changerName`;
  - `tools/build_infra.py` y `assets/infra.js`: tramos nuevos, nodo `mot`, `vmax`/km de `segments.json`, `track` guardado;
  - `data.js`: tensiones de `MODELS`;
  - `marketplace.js`: etiquetas y filtro de compatibilidad;
  - `map-v3.js`: capa de velocidad;
  - textos de la ficha de tramo y de nodo («12 min», `renew`);
  - `sfx.js`.
- **Se reutiliza:** `compatibilidad()` de `reglas-infraestructura` §5 y la capa `speedColor` de `rescate-map.js:63`.
- **Pruebas:**
  - `test.mjs`: la §11 pasa a comprobar el manifiesto y `release.json`, sin base64;
  - compatibilidad nueva (S103 en `sag-cas` ✗ tensión; Alvia ✓; Madrid–Gijón por la Rampa ✓);
  - `induction-test` (fechas de la portada);
  - `onboarding-ui-test` (título);
  - `menu-ui-test.mjs` nueva: una sola entrada, 3 arranques, 390 y 320 px;
  - `rescate-ui-test`: sin el botón `begin`, entra por el arranque 2027.
- **Voces:** 0.
- **Tamaño:** ~1.200 líneas.

### Fase 2 · «La jornada cuenta» (4.2.0)

- **Qué ve el jugador:**
  - barra superior nueva con las 4 velocidades y ⏭;
  - Agenda a la izquierda;
  - 8 verbos abajo (los paneles viejos van dentro, con estilo nuevo);
  - parte semanal;
  - avisos críticos (3 como máximo) y avisos sobre el mapa;
  - los diálogos fechados salen el día exacto;
  - desaparece «Delegar mes».
- **Motor:**
  - `calendario.js` nuevo: `simularDia`, cierres semanal y mensual, `motivosParada`, velocidades;
  - `operations.js`: el parte se calcula de los viajes; protocolos de respuesta; arreglo del fallo del cambio de mes;
  - `engine.js`: `step` pasa a `cerrarMes` y consume lo acumulado; la satisfacción entra en la demanda;
  - primera pasada de disparadores (`disparadores.js`): fechas exactas y precondiciones simples para los 22 sucesos en lugar de la tirada del 32 %;
  - abusos cerrados (§D2.6).
- **Interfaz:** `hud.js`, `juego.css` y la Agenda.
- **Pruebas:**
  - `jornada-test.mjs`: con la misma semilla, ▶ con protocolo y ▶▶▶ dan meses idénticos; los viajeros del parte suman los del mes;
  - `campaign-test` adaptado: el bot usa velocidades;
  - `observer-runtime-test` se retira, con su archivo conservado;
  - `operations-calendar-test` adaptado;
  - prueba de humo de la barra superior.
- **Voces:** 0.
- **Tamaño:** ~2.000.

### Fase 3 · «Flota real y Trenespop» (4.3.0)

- **Qué ve el jugador:**
  - el catálogo de 16 series con fotos;
  - el Contrato OSP de Media Distancia al terminar el tutorial, con su flota y sus líneas;
  - maquinistas con déficit real y formación de 13 semanas;
  - talleres con plazas;
  - segunda mano semanal;
  - carteras de fábrica con retrasos que tienen causa;
  - el panel Flota nuevo (Parque · Trenespop · Pedidos · Personal · Talleres);
  - los tres estados ✓ ◐ ✗ y la tira de ruta.
- **Archivos:**
  - `catalogo-trenes.js` (desde `trains.json`, con correspondencia de ids heredados);
  - `mercado.js` (`adsOfWeek`, carteras, presupuesto);
  - `marketplace.js` refactorizado (`tpCatalogue`/`tpDetail`);
  - `ui-flota.js`;
  - `infra.js` (diésel, bimodo, gálibo, batería).
- **Pruebas** (`flota-test.mjs`):
  - Civia en Galicia ✗ 25 kV;
  - 599 en Extremadura ✓;
  - 730 en Madrid–Badajoz ✓ a 180 en diésel;
  - BCBB en Cantabria ✗ gálibo;
  - anuncios deterministas;
  - el presupuesto no cambia el estado;
  - `sold` manipulado se rechaza;
  - `marketplace-test` adaptado;
  - `induction-test`: en enero de 2022 el único tren no eléctrico propio es el S730 («solo sirve hoy nuestro Alvia híbrido S730»).
- **Voces:** `osp-oferta`, `guia-trenespop` (2).
- **Tamaño:** ~1.800.

### Fase 4 · «Vía, capacidad y obras» (4.4.0)

- **Qué ve el jugador:**
  - estado y capacidad de cada tramo;
  - el catálogo de 15 obras con fases y modos;
  - frentes de obra;
  - vista previa roja y azul en el mapa;
  - ayudas al certificar;
  - las obras se ven en su tramo real;
  - sucesos situados (nieve, calor, cable, desprendimiento, ganado, yacimientos) como fuente de `event:snow`, `heatwave`, `cable`, `cows`, `adifdelay` y `adifboost`.
- **Archivos:**
  - `capacidad.js`;
  - `obras.js` (`workQuote` y `punctProjection` del rescate, pasados a tramos);
  - `infra.js` (obras nuevas);
  - `operations.js` (incidencias por tramo);
  - `assets/infra.js` (`track`, `u0`, `tags`);
  - `map-v3.js` (capa de capacidad, obra en su tramo);
  - `ui-obras.js`.
- **Pruebas** (`obras-test.mjs`):
  - lo presupuestado es lo que se aplica;
  - fases y modos;
  - el planificador rechaza por falta de surcos y dice dónde;
  - pasar a 25 kV saca los trenes de solo 3 kV, con aviso previo;
  - presupuesto de Soria;
  - secciones de obras de `test.mjs` adaptadas.
- **Voces:** `guia-capacidad`, `ev-averia`, `ev-calor`, `ev-desprendimiento`, `ev-tuneles` (5).
- **Tamaño:** ~2.000.

### Fase 5 · «Líneas y Monitor» (4.5.0)

- **Qué ve el jugador:**
  - la herramienta Línea con rutas alternativas, cadencia o plantilla real, exprés y paradas;
  - requisitos escritos debajo del botón;
  - Monitor (G) con avisos por fila;
  - Finanzas nuevo con puntos de margen por línea;
  - el diagnóstico de ruta;
  - la pestaña Competencia.
- **Archivos:**
  - `lineas.js` (motor);
  - `network.js` (mercados);
  - `engine.js` (métricas por línea y factor comercial calibrado);
  - `schedule.js` (planes con cadencia);
  - `ui-lineas.js`, `ui-monitor.js`, `ui-finanzas.js`.
- **Pruebas:**
  - `lineas-test.mjs`: unidades según el ciclo; tope de surcos; tiempo y demanda del exprés; **calibración: mediana plan/horario de 1,00 ± 0,05**;
  - `monitor-ui-test.mjs`.
- **Voces:** `guia-monitor` (1).
- **Tamaño:** ~2.000.

### Fase 6 · «Gobierno, grupos y convenios» (4.6.0)

- **Qué ve el jugador:**
  - 4 grupos con su líder, la confianza del Gobierno y las elecciones del 23-7-2023 y siguientes (con adelanto);
  - el relevo de Raquel por Óscar;
  - el discurso de campaña;
  - convenios al estilo Airport CEO (OSP y comunidades, estrellas, peticiones, renegociación y rescisión);
  - encargos como programas;
  - pactos con lo que se enseña igual a lo que se aplica;
  - compromisos en la Agenda;
  - etapas por legislatura con plazo;
  - Medidas cuya eficacia crece con el tiempo;
  - panel Política.
- **Archivos:**
  - `politica.js` (grupos, `electionForecast`, calendario de cargos, pactos traídos de `rescate.js` con sus pruebas);
  - `convenios.js` (motor de contratos de `tycoon.js` y peticiones);
  - `ui-politica.js`, `ui-convenios.js`.
- **Pruebas:**
  - `politica-test.mjs`: previsión = Σ de los pesos; cargos por fecha; pactos con lo enseñado igual a lo aplicado; renegociación con 2 rondas como máximo y semilla por contrato;
  - `tycoon-contract-test` adaptado;
  - prueba de interfaz de un convenio.
- **Voces:** 44.
  - Elecciones: 3. Relevo: 2. Convenios: 5.
  - Pactos: 11. Resultado de pactos: 3. Negociación: 10.
  - Compromisos: 5. Finanzas: 4. Premio: 1.
- **Tamaño:** ~2.500.

### Fase 7 · «Lo que se dice, pasa» (4.7.0)

- **Qué ve el jugador:** los 412 diálogos solo cuando son verdad y cada elección con efecto visible y con origen en el Diario. Los encuentros salen como exigencias de los grupos. La sala de escucha muestra títulos y tipos según dónde suena cada diálogo.
- **Archivos:**
  - `hechos.js`;
  - `dialogos.js` (banco y selector);
  - disparadores y efectos de los 97 diálogos de historia (anexo A);
  - mecánicas que faltaban para los encuentros (estaciones con personal, campañas de descuento, pilotos, fallo de la app);
  - retoque de etiquetas en `web-source/dialogue-catalogue.json` (solo metadatos).
- **Pruebas:**
  - `verdad-test.mjs`, `alcanzabilidad-test.mjs`, `efectos-test.mjs`;
  - `dialogue-presentation-test` y `voice-text-test` se mantienen;
  - `voice-listening-ui-test` adaptado a 412 + N.
- **Voces:** `ev-viral`, `ev-viral-teruel`, `ev-visita` (3).
- **Tamaño:** ~2.500.

### Fase 8 · «Rejugable» (5.0.0)

- **Qué ve el jugador:**
  - la partida nueva completa: semilla con código, dificultad, rasgo, modificadores y retos;
  - el generador del estado inicial;
  - 12 hitos;
  - Investigación unificada con pilotos;
  - megaproyectos;
  - cloacas con registro de secretos;
  - **el arranque 2027 rehecho sobre el motor único** (el motor de `rescate.js` deja de estar en la portada);
  - Operador del Año;
  - medallas;
  - juego sin fin.
- **Archivos:**
  - `partida.js` (opciones, generador, migración de `tenfe-rescate-v1` o exportación con aviso);
  - `progreso.js`, `cloacas.js`;
  - `rescate-data.js` (sigue siendo la casa del catálogo de voces `LINES`);
  - documentación, README y `release.json` 5.0.0.
- **Pruebas:**
  - `escenario-2027-test.mjs` (bot de 8 años con 6 semillas; sustituye la parte de motor de `rescate-test`);
  - `semilla-test.mjs`: el mismo código da la misma partida y otro código da otra;
  - `partida-ui-test.mjs`.
- **Voces:** 44.
  - Tutorial de 2027: 5. Etapas: 8. Cloacas: 23.
  - Finales: 4. Hito y megaobra: 2. Guías: 2.
- **Tamaño:** ~3.000.

**Voces en total:** 0 + 0 + 2 + 5 + 1 + 44 + 3 + 44 = **99**.

---

## Riesgos

1. **Tamaño.** Unas 17.000 líneas en 8 fases. `app.js` (1.460 líneas, con escuchas en todo el documento) es frágil.
   - La fase 2 levanta la interfaz nueva con su propio despachador (`data-u` en su raíz, como el rescate) y va vaciando `app.js` poco a poco.
   - Cada fase lleva su prueba de humo en Playwright.
2. **Rendimiento del tick diario a ▶▶▶.** Con más de 100 líneas e incidencias, simular una semana en 2 s exige que un día cueste menos de 50 ms.
   - Planes en caché por versión de la red.
   - Viajeros calculados por línea, no por viaje.
3. **Los encuentros dependen de muchas mecánicas.** Si una no llega, su grupo de cuerpos tiene que retirarse en la construcción con una bandera por mecánica. Si no, vuelve la mentira.
4. **Equilibrio sin regalos.** Escala realista y transferencias condicionadas pueden dejar el juego trivial o imposible.
   - Hace falta el bot en cada fase.
   - Primer encargo y transferencia anual calibrados con 10 semillas.
5. **Datos provisionales.** `segments.json` solo cubre 11 corredores. En el resto, la vía, `u0`, las etiquetas y la `vproj` son estimaciones (OSM `tracks`). Se marcan como provisionales en la ficha.
6. **Producción de voces.**
   - 99 tomas son unos 83 min de CPU, más repeticiones.
   - Hace falta un entorno virtual con `requirements-qwen-voices.txt` y los pesos fuera de Git.
   - `--package` tira las tomas cuyo texto, persona o estado de ánimo cambie: los textos de cada fase se congelan antes de grabar.
7. **Herramientas de publicación.** `optionalBefore`, la lista de CSS, las anclas (`¿Adónde vamos?`, el aviso de `app.js`, `voice.js`), los 6 logos y el `release.json` que hoy está desfasado: hay que reconstruir en la fase 1.
8. **Deuda de pruebas.** Varias suites de navegador ya están rotas o dependen de archivos que no están en Git. Se retiran o se adaptan dejando constancia, sin reescribir un fallo como acierto.
9. **El puente de 2027.** Durante las fases 1 a 7 el arranque 2027 usa el motor 4.0, con otra escala y sin realismo. Tiene que estar marcado como tal hasta la fase 8.
10. **Saber de antemano.** Que la historia de 2022-2024 sea fija puede hacer predecibles los dos primeros años. Lo compensan la semilla desde 2025, los deslizadores y los modificadores.
11. **Petición del usuario: «sube lo que tengas a GitHub en cuanto puedas».** Este diseño está en el scratchpad, no en el repositorio, porque la tarea era de solo lectura. Si se quiere publicar ya, hay que copiarlo a `investigacion/modo-unico/` y hacer commit y push. Cada fase del plan acaba en push y verificación de Pages.

---

## Anexo A · Disparadores y efectos de los 97 diálogos de historia y tutorial

Las etiquetas y los efectos de las opciones se pueden cambiar porque no tienen voz. El texto, la persona y el estado de ánimo no se tocan.

| Fuente | Disparador (hecho) | Opción A → efecto real | Opción B → efecto real |
|---|---|---|---|
| `decision:inaugural` | 3-1-2022, arranque 2022 | «Primero los alcaldes»: mandato público (OSP ×1,1, tope de tarifa en OSP, Territorios +5) | «Primero Hacienda»: mandato comercial (+60 M€ de capital, OSP ×0,85, tarifas libres, Economía +5). El mandato se puede revisar al empezar cada legislatura |
| `decision:energy` | 1-3-2022 (crisis real) | Seguro: prima = 60 % del sobrecoste esperado; índice con tope de 1,1 durante 12 meses | Sin seguro: índice histórico (pico ×1,6). «La segunda, más» se cumple porque la prima es menor que el sobrecoste |
| `decision:burgos` | Día de apertura de `vdb-bur` (21-7-2022) | Abrir Madrid–Burgos AV con un lote libre compatible y campaña (+10 % durante 26 semanas); desactivada si no hay tren | Sin línea; reputación −1 |
| `decision:discounts` | 1-9-2022: pasa siempre que la demanda LD/MD crezca ×1,15 durante 16 meses | Refuerzo: +2 salidas al día en las 3 líneas LD más llenas, con ayuda que cubre su coste | Sin refuerzo: «sin plaza» visible, Viajeros − |
| `decision:Rossa` | 1-11-2022 (YaIré entra el 25-11) | Plan de calidad LAV: +3 de calidad 52 semanas, con coste | Nada |
| `decision:murcia` | Apertura de la LAV de Murcia (20-12-2022) | Abrir Madrid–Murcia AV | Nada |
| `decision:gauge` | 1-2-2023 | Revisar gálibos: auditoría de la flota y los pedidos, se activa el control de gálibo; −16 M€, reputación +5 | Mirar a otro lado: reputación −2 |
| `decision:pajares` | Apertura de `leo-pol-v` (29-11-2023), solo con el sucesor en el cargo | Lanzar o reforzar Madrid–Gijón con un Alvia por la Variante | Nada |
| `decision:extremadura` | Catenaria `pla-cac-mer-bad` (14-12-2023) | Plan Extremadura: encarga la electrificación de `mad-tal` y `tal-pla` con FEDER previsto | Alvia decentes: pone el 730 en Madrid–Badajoz |
| `decision:s106` | Primera entrega del contrato histórico de S106 | Celebrar: campaña AV | Revisión de los S100 por unidad |
| `decision:futuretender` | 1-3-2026 | Firmar 30 + 10 opcionales (señal y entrega a 42 meses) | Solo abrir el catálogo |
| `decision:climate` | Semana con ≥ 44 °C en Córdoba y líneas por `lin-cor` o `cor-sev-c` | Reforzar mantenimiento: −35 M€; los tramos `calor` sin incidencias ese verano | Reducir oferta: −20 % de salidas en tramos `calor` durante las semanas tórridas |
| `decision:rural` | Villanueva del Andén sin trenes y Territorios < 50, desde 2024 | Convenio de las comarcas: +6 M€ al mes durante 5 años **con obligación** (N líneas rurales con 1 ida y vuelta diaria); si fallas, devuelves | Manos libres: nada |
| `decision:industry` | Cartera de fábrica ≥ 18 meses | Pagar para colarse: −6 meses en tus pedidos | Esperar: +8 meses en los pedidos nuevos durante 18 meses |
| `decision:legacyvote` | 1-1-2047, con horizonte en 2050 | Compromiso «Red para todos» | Compromiso «Cuentas saneadas» |
| `event:cable` | Riesgo acumulado en un tramo `robo` de 3 kV | Reponer deprisa: el doble de coste, 1 semana | Al ritmo de Adif: 6 semanas con límite de velocidad |
| `event:strike` | Trabajadores < 38 o convenio vencido | Negociar: nómina +2 % cobrada siempre | Aguantar: servicios mínimos reales |
| `event:wifi` | Política de wifi apagada y Viajeros en bajada en LD | Encender la medida de wifi | Nada |
| `event:eufunds` | Ventana de fondos 2022-2023 y obras elegibles | Obras de catenaria y ancho ×0,6 durante 24 meses | +30 M€ |
| `event:freeze` | Presupuestos no aprobados (año electoral o Gobierno < 30) | Adelantar de tesorería | Recortar servicios OSP de verdad |
| `event:mayorchain` | Villanueva sin AVE y un AVE posible a ≤ 60 km | Compromiso «estudio de parada»: 6 meses, termina en enlace de autobús o apeadero | Paco encadenado: Norte −punt. una semana |
| `event:busprice` | Empieza una campaña de Autocares Meseta | Bajar tarifas ×0,85 durante 13 semanas en las relaciones afectadas | No responder: cuota de autobús + |
| `event:heatwave` | Semana tórrida con líneas por tramos `calor` | Limitar a 120 km/h esos tramos | Riesgo de incidencias de calor ×3 |
| `event:snow` | §D5.6 | Quitanieves: 1 día | Esperar: 3 días |
| `event:cows` | Tramo `ganado` de vía única con un Alvia | Esperar: retraso ese día | Vallar: obra de 2 meses que acaba con el problema |
| `event:secondhand` | Anuncio relámpago de 4 AV compatibles | Comprar el anuncio | Ignorar |
| `event:workshopfire` | Talleres al ≥ 90 % durante 8 semanas | Reparar: −18 M€ | −1 plaza de taller durante 3 meses |
| `event:influencer` | Línea LD o AV con ≥ 95 % durante 2 semanas | Campaña: +10 % de demanda 6 meses en esa línea | Reputación +2 |
| `event:festival` | Verano: demanda +10 % en relaciones turísticas, pase lo que pase | Trenes extra temporales | Sin refuerzo: cuota de autobús + |
| `event:audit` | Pruebas ≥ 12, o incumplimiento del contrato-programa, o pérdidas 2 años | Abogado: pruebas −10 | Consultora: si pruebas ≥ 20, se publica un secreto |
| `event:adifdelay` | Obra en fase de obra sobre un tramo `yacimiento` | Pagar trabajo nocturno: −50 % del retraso | +N meses en esa obra |
| `event:adifboost` | Obra con más frentes de los necesarios | Pagar: termina antes | Nada |
| `event:royal` | Línea AV abierta | Preparar el viaje: tren reservado; sale bien si la previsión ≥ 90 % | En el normal: resultado según la puntualidad real |
| `event:election` | Gobierno ≥ 60 y ≥ 2 años de legislatura | Inaugurar lo que haya: exige obra o estación en pruebas o terminada en 8 semanas | Nada que cortar: apoyo − |
| `event:tweet` | Sucesor en el cargo y la puntualidad de la red cae 5 puntos | Reserva extra: compromiso de que la semana siguiente sea ≥ X | Nada |
| `event:teruel` | Teruel o Soria sin catenaria y con línea diésel | Compromiso: empezar a electrificar en 12 meses | Paciencia: Territorios − |
| `event:luggage` | Líneas LD con ≥ 90 % de ocupación | Reformar coches: plazas −2 %, satisfacción + | Nada |
| `chapter:*` | Comienzo de la legislatura: 2022, ene 2024, 2028, 2035, 2042 | Objetivos clásicos y plazo electoral | — |
| `arc:0`…`arc:4` | Presentan peticiones de convenio que encajan (§D6.3) | — | — |
| `induction:*` y `feedback:*` | Tutorial, solo en el arranque 2022 | Comprobaciones reales de estado; los pasos y sus cifras no cambian | — |

## Anexo B · Las 99 tomas nuevas (catálogo `LINES` de `rescate-data.js`)

- **Tutorial 2027 (5).** `t-3` (Benito: Ávila–Medina, cifras de la obra unificada), `t-4`, `t-5` («un tren de stock llega en un mes»), `t-6` (velocidades, sin órdenes), `t-7`.
- **Etapas 2027 (8).** `stage-s1` a `stage-s5`, `stage-fail`, `stage-pass`, `stage-pass-sucesor`.
- **Pactos (11).** `paco-estacion` (regrabada con «Presidente»), `fermin-convenio`, `charo-contrato`, `benito-cuadrilla`, `marisa-carta`, `raquel-inauguracion`, `pedro-cohesion`, `oscar-tuits`, `inigo-noagresion`, `paco-inaugura`, `paco-sobre`.
- **Resultado de pactos (3).** `pact-done`, `pact-done-sucesor`, `pact-broken`.
- **Negociación (10).** `neg-ok` y `neg-no` para alcalde, taller, Hacienda, Adif y rival.
- **Sucesos (7).** `ev-averia`, `ev-calor`, `ev-desprendimiento`, `ev-viral`, `ev-viral-teruel`, `ev-visita`, `ev-tuneles`.
- **Cloacas (23).**
  - Propuestas: `cor-comision`, `cor-traviesas`, `cor-yate`, `cor-enchufe`, `cor-mariscada`.
  - Extorsiones: `ext-inigo`, `ext-paco`, `ext-benito`.
  - Escándalos: `sc-traviesas`, `sc-yate`, `sc-enchufe`, `sc-mariscada`, `sc-sobres`, `sc-juez`, `sc-charo`, `sc-comision`, `sc-accidente`, `sc-pacto-meseta`.
  - Juzgado: `jud-1`, `jud-2`, `jud-3`, `jud-end`, `jud-archivo`.
- **Finanzas (4).** `fin-impago`, `fin-quiebra`, `fin-retirada`, `fin-retirada-sucesor`.
- **Elecciones (3).** `el-forecast`, `el-win`, `el-lose`.
- **Finales (4).** `end-2034-win` (sucesor), `end-2034-partial`, `end-2050-win`, `end-2050-partial`.
- **Progreso (2).** `milestone` (solo el primer hito), `mega-done`.
- **Convenios (6).** `osp-oferta` (ministra), `convenio-oferta` (alcalde), `convenio-renegociar` (Hacienda), `convenio-aviso` (viajeros), `convenio-rescision` (Hacienda), `convenio-estrella` (presidente).
- **Guías (5).** `guia-trenespop` (taller), `guia-capacidad` (Adif), `guia-monitor` (viajeros), `guia-megaproyectos` (presidente), `guia-cloacas` (rival).
- **Compromisos (5).** `comp-ministra`, `comp-sucesor`, `comp-presidente`, `comp-alcalde`, `comp-viajeros`.
- **Otros (3).** `premio-operador` (presidente), `relevo-raquel` (ministra), `relevo-oscar` (sucesor).

Se conservan sin tocar las dos tomas ya grabadas que siguen siendo ciertas en el arranque 2027: `t-1` y `t-2`.
