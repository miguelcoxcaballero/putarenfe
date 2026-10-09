# Diseño B · Un solo juego: «Presidente de Tenfe»

Ángulo de este diseño: fantasía del jugador, facciones y rejugabilidad primero (Tropico 6 + Cities: Skylines), sin dejar fuera nada de D1–D10.

Base de todo lo que sigue: los inventarios (`inventario-*.md`), las restricciones (`restricciones-build-voces.md`), las tres auditorías de diálogos (`auditoria-*.md` y `datos/audit-*.json`), los datos reales (`datos/segments.json`, `datos/trains.json`, `reglas-infraestructura.md`, `trenespop-reutilizacion.md`) y la investigación de juegos (`juegos-*.md`). El repositorio no se ha tocado.

---

## 0. La fantasía en una página

**Eres el presidente de Tenfe.** No eres ministro ni alcalde: te nombra un Gobierno que quiere fotos, te vigila una Hacienda que quiere cuentas, te exigen unos viajeros que quieren llegar, un alcalde que quiere su estación y una plantilla que quiere su convenio. Gobiernas una red **real**, tramo a tramo, con su ancho, su tensión, su velocidad y su vía única. Y si el Gobierno pierde las elecciones, o se harta de ti, te vas a casa.

Tres verbos resumen el juego:

1. **Construir** (Cities): líneas que dibujas parada a parada, obras en tramos concretos, trenes de Trenespop que de verdad caben por la vía, megaobras por etapas, hitos que abren herramientas nuevas.
2. **Gobernar** (Tropico): cinco facciones con líder, agenda y voz grabada que te piden cosas verificables, te dan ultimátums y deciden unas elecciones cada cuatro años; directrices, estatuto, pactos, cloacas.
3. **Cumplir** (la regla del usuario): lo que dice un personaje es cierto en la partida cuando suena, y cada elección deja una marca que se ve en el mapa, en la ficha del objeto y en el informe del mes.

**Por qué cada partida es distinta** (detalle en D5): dos arranques muy distintos (2022 «La herencia» y 2027 «El rescate») más un preset de maqueta; semilla con código para compartir; rasgo del presidente; agenda secreta de cada líder de facción; línea de Marisa y pueblo de Paco sorteados; tramos degradados, flota, rivales, clima, fábricas y fondos europeos sembrados; hitos con paquetes a elegir; elecciones y remodelaciones de Gobierno que cambian quién manda en Transportes; sucesos con causa y sitio; modo sin fin.

**Decisión de arquitectura.** El modo único se construye **sobre el motor clásico** (mensual, red real de 125 tramos, escala realista en M€, horario GTFS, Trenespop, encargos, rivales, tutorial grabado) y **trasplanta los sistemas del Rescate** como módulos puros reescalados (planificación con presupuesto previo, obras por fases con modos de servicio, pactos, elecciones, hitos, megaobras, tecnologías, cloacas, Gaceta, obstáculos → acción). Motivos:

- Arranca en 2022, donde son verdad decenas de cuerpos grabados (D1) y la induction de 50 tomas.
- Su escala de dinero coincide con las cifras grabadas («abrir cuesta cuatro millones», «contratar veinte cuesta 0,3 M€», «diez millones y cuatro meses», «18.000 euros»).
- Ya tiene la red real con planificador de compatibilidad, lo más caro de rehacer.
- Las partidas clásicas `iberia-ferroviaria-v2` se pueden **migrar** (mismo calendario y misma red); las del Rescate se convierten cuando su arranque se porte (fase F7).
- Del Rescate se reutiliza el **motor como librería** (funciones puras de `rescate.js`), no su calendario semanal ni su escala de juguete.

---

## D1. Calendario, turno y continuidad

### D1.1 Turno = un mes, con días jugables opcionales

| Elemento | Decisión | Por qué |
|---|---|---|
| Unidad de turno | **El mes** (cierre mensual). | 2022–2050 son 348 turnos (1.508 semanas serían inmanejables). Obras reales tardan meses o años; entregas de tren, 16–42 meses. Los cuerpos grabados hablan en meses: «tres meses» de formación, «cuatro meses / doce meses» de investigación, «dieciocho meses» de plazo, «al cerrar el mes llegan el balance…». |
| Firmas | **3 firmas al mes** (Fácil 4; Maqueta ilimitadas). +1 en los hitos 3, 6 y 9 (máx. 6). | Hereda la escasez del Rescate («tres órdenes»), que obliga a priorizar, y la convierte en recompensa de progreso (Cities). |
| Qué cuesta firma | Abrir o cerrar una línea, iniciar una obra o etapa de megaobra, cada pedido de trenes, vender un lote, firmar pacto o encargo, pedir préstamo, cambiar un artículo del Estatuto. | Compromisos de capital o políticos. |
| Qué es gratis | Mirar y presupuestar todo, ajustar frecuencia o tarifa de una línea abierta, directrices (con enfriamiento), contratar maquinistas o cuadrillas, investigar, revisar un tren, responder escenas, vivir días, cloacas. | «Mirar es gratis» (Rescate). Ajustar no es comprometerse. |
| Cierre | Botón **Cerrar mes** o **Avanzar ▸▸** (hasta la próxima parada, máx. 6 meses). Paradas con motivo (de `stopReasons` del Rescate, en meses): escena con opciones, pacto ofrecido, obra terminada, entrega, hito, plazo ≤1 mes, elecciones ≤3 meses, caja que no llega al próximo pago. | Evita saltarse cosas y acorta las partidas largas. |
| Contabilidad | Caja mensual; subvención OSP y cumplimiento **trimestral**; liquidación anual (seguro, Operador del Año, revisión de tarifas). | Reutiliza las reglas trimestrales del Rescate y las mensuales del clásico. |

### D1.2 El día jugable y los trenes reales (GTFS)

- **El mapa siempre anima los trenes del plan del mes:** horario Renfe real para las relaciones con GTFS, reducido a la frecuencia elegida (`S.thin`), y salidas repartidas 06:30–21:30 para las líneas sin horario (Media Distancia sintética hasta que se amplíe el GTFS, F8).
- **Las incidencias del mes se generan al empezar el mes, con día, hora, tramo y tren** (no al azar en el momento). Cada una tiene su causa calculada desde el estado (D5.6).
- **«Vivir un día»** (opcional) abre la jornada clásica (`operations.js`) con las incidencias de ese día. Las respuestas en directo (equipo 18.000 €, demora ×0,3; autobús 9.000 €; esperar) **sustituyen** al protocolo para esas incidencias y cambian de verdad la puntualidad mensual de las líneas afectadas. Los días que no juegas aplican el **Protocolo de incidencias** (directriz: Equipo / Autobús / Esperar).
- Consecuencia: **jugar días nunca es peor que delegar** (corrige el defecto medido en el clásico, 55 → 8 de satisfacción). Los picos de demanda dan bonus si los atiendes en directo y no castigan si delegas.
- «Cada jornada avanza un día. Al cerrar el mes llegan el balance, las entregas, las obras, la formación y la investigación que hayan vencido» (`induction:review:briefing:1`) sigue siendo **literalmente cierto**: el día avanza el reloj, y el último día llama al cierre de mes.
- Observador: la línea de tiempo del día, las salidas de estación y la noche/día por el sol real se conservan (son inmersión barata y «el mundo es real»).

### D1.3 Arranques y calendario político

| | **2022 · La herencia** | **2027 · El rescate** | **Maqueta** (preset de sandbox) |
|---|---|---|---|
| Fecha inicial | 3 de enero de 2022 | 4 de enero de 2027 | 2022 o 2027, a elegir |
| Mandato | hasta diciembre de 2050 (5 actos grabados) | 8 años, hasta diciembre de 2034 (5 etapas nuevas), y luego actos 4–5 | sin mandato |
| Red tuya al empezar | AVE y Alvia (8 servicios abiertos, 80 unidades, clásico). **La Media Distancia te la traspasan en enero de 2024** (D3.6). | Solo la Media Distancia (11 líneas convencionales del Rescate, deterioradas). **La alta velocidad la opera OuiOui** tras una privatización parcial: puedes volver desde el hito 5. | La que elijas |
| Elecciones generales | **23-07-2023 (real)**, luego julio de 2027, 2031, 2035, 2039, 2043, 2047, más anticipadas (`event:election`). | diciembre de 2030 y de 2034 (calendario del Rescate), luego cada 4 años. | desactivables |
| Ministro de Transportes | Raquel Sanz hasta la investidura del 21-11-2023; **Óscar del Puente desde entonces** (lo exige `decision:pajares`, voz del sucesor el 29-11-2023). Tras cada elección ganada, **remodelación** (D5.3). | Raquel Sanz al empezar (lo exige `t-1`, grabada con su voz); remodelación tras diciembre de 2030. | — |
| Fin | Veredicto en 2050 y **«Seguir gobernando»** (sin fin). | Veredicto en 2034 («ocho años») y sin fin, con los actos «Territorio» (2035) y «Legado» (2042). | Sin fin |

- **Por qué 2022 es el arranque principal:** mantiene verdaderos (con disparador correcto) 9 decisiones fechadas, 5 aperturas reales, los 5 capítulos y las 50 tomas de la induction («Enero de 2022»), y encaja el relevo real Raquel → Óscar tras las elecciones de julio de 2023.
- **Por qué existe 2027:** es el mejor contenido del Rescate (crisis, Hacienda encima, Media Distancia rota) convertido en *misión con reglas propias* (Tropico 6). Usa las 3 tomas del Rescate ya grabadas, que allí son ciertas.
- **Perder unas generales termina tu mandato** (`el-lose`: «El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú.»). **Cese:** Gobierno < 15 durante 6 meses (regla clásica, «ya sabes dónde está la puerta»). Ambos desactivables en Maqueta.
- **Sin fin:** al terminar el mandato aparece «Seguir gobernando». Las elecciones siguen, la inflación se congela en 2050 (regla clásica `economicYear`), el Operador del Año sigue subiendo el listón y se generan **Retos de legado** anuales. Los cuerpos ya oídos pueden repetirse pasados 10 años (D6).

---

## D2. Dinero y economía

### D2.1 Escala: M€ realistas (la del clásico)

- Toda la economía va en **M€ con la escala del clásico** (caja inicial 2022 = 500 M€, trenes de 0,5 a 38 M€, electrificar 0,42 M€/km).
- La escala del Rescate (caja 12, electrificar 0,0105 M€/km, 40 veces menos) **se abandona**: era irreal (R3) y ninguna de sus 3 tomas grabadas cita dinero.
- Las cifras grabadas que obligan a esta escala se convierten en **contratos del motor con prueba automática** (generalización de `voice-text-test.mjs`): abrir 4 M€; 20 maquinistas 0,3 M€ y 3 meses; venta online 10 M€ / 4 meses; ERTMS 35 M€ / 12 meses; equipo 18.000 € con demora ×0,3; autobús 9.000 €; Torralba–Soria 44 M€ / 21 meses; premios del primer encargo 18 y 26 M€, +25 %.
- **Arranque 2027:** misma escala, estado inicial distinto, calibrado por el bot. Orden de magnitud: caja 60 M€, deuda 1.200 M€ al 4,5 %, OSP 45 M€/trimestre, y la Norte al 62 % de puntualidad, como en el Rescate.

### D2.2 Demanda (por línea)

Se parte del **logit clásico** (`engine.metrics`): tiempo, tarifa, frecuencia, fiabilidad y reputación frente a autobús y rivales, con tope de capacidad. Cambios:

1. **El tiempo sale de los tramos reales** con el perfil del tren (`tiempoDeViaje` de `reglas-infraestructura.md`): velocidad del tramo, tope 160 km/h en diésel, 220 km/h a 3 kV, limitaciones temporales (LTV) por estado de vía, +12 min por cambio de ancho.
2. **La puntualidad pesa de verdad:** factor `(puntualidad/100)²` acotado a 0,15–1 (del Rescate) además del término logit.
3. **La satisfacción mueve demanda** mediante la confianza de Viajeros (×0,9–×1,08). En el clásico no lo hacía.
4. **Crecimiento sembrado por regiones** («boom» de Málaga, València, Madrid sur… según semilla), sobre la curva clásica de recuperación y crecimiento.
5. **Campañas con objeto y plazo** en lugar de banderas globales (`hype`, `tourism`, `passes`): cada una dice qué líneas toca, cuánto y hasta cuándo (chip con cuenta atrás en la línea).
6. Rivales y autobús con su propio estado por línea (D5.5).

### D2.3 Costes

| Partida | Regla |
|---|---|
| Energía | tren-km × consumo del modelo × **índice de energía** (eléctrico y diésel por separado; 3 kV +8 % por pérdidas; pico real de 2022 sembrado en la Herencia). |
| Personal | maquinistas reales (bolsa con necesidad, formación, jubilaciones), tripulación, horas extra. |
| Mantenimiento de flota | por unidad × estado × edad × presupuesto de mantenimiento (50–150 %). |
| Canon de Adif | por tren-km: LAV más caro que convencional. |
| Estaciones y estructura | estructura clásica `(9 + unidades × 0,035) × índice de costes` y personal de estaciones atendidas. |
| Deuda | interés según la confianza de Hacienda y la ratio deuda/ingresos. |
| Seguro | anual, según el tamaño de la flota (el Rescate lo cobraba una sola vez). |
| Autobuses de sustitución | durante obras en modo «Autobuses»; se pagan a Autocares Meseta, y Íñigo lo celebra. |

La inflación clásica (+2,05 %/año) se mantiene. La **revisión anual de tarifas** es una directriz con coste en Viajeros, así que el margen no se erosiona sin remedio.

### D2.4 Subvenciones y contratos públicos

- **Estatuto · Misión** (la fija `decision:inaugural`; D5.3): Servicio público = OSP 2,2 €/tren-km y transferencia base 3,5 M€/mes. Comercial = 1,6 y 2 M€.
- **Contrato OSP de Media Distancia:** pago por tren-km de líneas OSP con **cumplimiento trimestral** (del Rescate). Una línea esencial por debajo del 70 % o sin trenes recorta un 12 %. Tres leves hacen un grave, y tres graves retiran la concesión (`fin-retirada`, fin de partida salvo en Maqueta).
- **Contratos comarcales** (`decision:rural`): pago mensual solo en los meses en que se cumple (frecuencia ≥ 2 por sentido y puntualidad ≥ 80 % en las líneas listadas).
- **Fondos europeos:** ventana sembrada (en la Herencia, la real NextGenerationEU hasta 2026: `event:eufunds`, −40 % durante 24 meses) y **ayudas ligadas a obras concretas** (del Rescate), cobradas al certificar.
- **Encargos** con estrellas (D8) y **peticiones de ciudades** (pagan después de 3 meses de servicio sostenido; se acaba el exploit del clásico de +42 M€ por abrir y cerrar).

### D2.5 Préstamos, impago y quiebra

- **Préstamos por tramos de 100 M€.** El techo de deuda sube con los hitos (Cities): 300 M€ al empezar y hasta 1.500 M€. El interés depende de Hacienda.
- **Se acaba el préstamo puente automático del clásico.** Con caja < 0 al cerrar el mes llega la **decisión de impago** del Rescate (vender el peor tren, aplazar una obra, reestructurar, recortar servicio, rescate de Hacienda). Cada salida muestra cuánto recupera y está desactivada si no haría nada.
- Tres cierres seguidos en negativo = **concurso de acreedores** (fin de partida).
- **Préstamo del Estado** por pacto (contrato-programa).

---

## D3. La red: tramos reales, obras y líneas

### D3.1 Datos

- **Base:** los 125 tramos y 90 nodos de `assets/infra.js` (OSM) más correcciones de `segments.json` en un nuevo `assets/tramos-reales.js`:
  - convencional **Palencia–León** (123 km, ib, 3 kV, 155 km/h, doble);
  - convencional **Córdoba–Sevilla** (129 km, ib, 3 kV, 155, mixta);
  - **Rampa de Pajares** (108 km, ib, 3 kV, 115, mixta) separada de la **Variante** (mixto, 25 kV, 220, cambiador en Pola, abre el 29-11-2023, como dice la toma de `decision:pajares`);
  - nodo `mot` corregido;
  - velocidades reales;
  - nodo ficticio **Villanueva del Andén** (apeadero; en 2027 entre Ávila y Medina, en la Herencia sembrado en una línea rural; D5.2).
- **Estado de cada tramo:** `{g: ib|std|mixto, e: no|3kv|25kv, v (vmax de diseño), vias: unica|doble|mixta, cond 0-100, cap, lav, cerrado, obras[], banderas}`. Las banderas son vallado, plan de calor, bloqueo automático y ERTMS.
- **Estado de vía → LTV:** con `cond < 70` la velocidad baja al 80 %; con `< 50`, al 60 %; con `< 35`, a 60 km/h. Se ven en el mapa como tramos discontinuos con «LTV». La vía se desgasta con el tráfico (fórmula del Rescate por tren-km) y con el presupuesto de vía.
- **Capacidad por tramo** (trenes al día, a calibrar): única 60, mixta 120, doble 220, LAV 260. Todas las líneas que comparten tramo suman. Si se pasa, penaliza la puntualidad como la congestión del Rescate. Así **Madrid–Alcázar es común a Levante y Sur**: una obra allí ayuda a las dos y corta a las dos.

### D3.2 Compatibilidad (de `reglas-infraestructura.md`, ya probada contra `plan()` en 129 casos)

- **Ancho:** fijo `ib` o `std`, o `variable` (cambia en nodos con cambiador, +12 min; sin cambiador, falta `changer`). Un tramo mixto admite los dos.
- **Tensión:** un tren eléctrico solo circula si su lista de tensiones contiene la del tramo. Falta `tension` (nueva) o `elec` si no hay catenaria. Diésel y bimodo pasan en diésel con su vmax diésel.
- **Topes:** 160 km/h en diésel (o el `vmaxDiesel` del modelo); 220 km/h a 3 kV.
- **Obra que corta:** falta `closed`.
- `infra.plan` pasa a recibir el perfil nuevo `{anchos, tensiones, traccion, vmax, vmaxDiesel}`. Las claves de caché incluyen anchos y tensiones, y `faultText` añade «tensión».
- Corrige el caso que el clásico deja pasar: un AVE de 25 kV por Sagunt–Castelló a 3 kV.

### D3.3 Catálogo de obras

Coste en M€ = base + €/km × km. Plazo en meses. Una obra se aplica a **un tramo** o a una selección contigua (la interfaz permite «todo Ávila–Medina» o «toda la línea Norte»).

| Obra | Coste | Meses | Efecto | Afecta al servicio | Disponible |
|---|---|---|---|---|---|
| Renovar vía | 8 + 0,18·km (clásico) | ⌈4 + km/40⌉ | `cond` → 95; vmax hasta min(diseño + 20, 220 conv.) | fases / autobuses / corte | desde el inicio |
| Electrificar 25 kV | 6 + 0,42·km (clásico: Torralba–Soria 44 M€ / 21) | round(12 + km/10) | `e = 25kv` | fases | inicio |
| Electrificar 3 kV | 6 + 0,38·km | round(12 + km/10) | `e = 3kv` (tope 220) | fases | inicio |
| Cambio de tensión 3 → 25 kV | 4 + 0,25·km | round(8 + km/15) | `e = 25kv`. **Los trenes solo de 3 kV pierden el tramo**: el planificador lista las líneas y unidades afectadas | fases nocturnas (×1,4) o corte | hito 4 |
| Tercer carril (ancho mixto) | 8 + 0,5·km (clásico) | round(14 + km/9) | `g = mixto` | fases | inicio |
| Ancho estándar | 5 + 0,3·km (clásico) | round(8 + km/14) | `g = std`; los trenes ibéricos pierden el tramo | corte (o fases ×1,5 si hay vía doble) | inicio |
| Mixto → estándar | 3 + 0,15·km | round(6 + km/20) | `g = std` | fases | hito 4 |
| Duplicar vía | 10 + 1,6·km | round(18 + km/5) | `vias = doble`, capacidad ×3, puntualidad +4 | fases | hito 3 |
| Apartaderos | 2 + 0,06·km | 6 | capacidad en vía única ×1,4 | ninguna | inicio |
| Bloqueo automático / CTC | 3 + 0,08·km | round(6 + km/30) | capacidad +25 %, puntualidad +3 | ninguna | inicio |
| ERTMS en tramo | 2 + 0,1·km | 8 | puntualidad +2; LAV hasta 350 | ninguna | tras investigar ERTMS |
| Cambiador de ancho | 18 (clásico) | 10 | nodo con cambiador | ninguna | donde confluyen `std` e `ib` |
| Apeadero / estación | 4 / mejora por nivel (clásico) | 3–6 | parada nueva, +demanda | ninguna | inicio |
| Vallado | 0,02·km | 2 | incidencias de intrusos y animales −50 % | ninguna | `event:cows` o hito 2 |
| Plan de resiliencia al calor | por región | 12 | topes e incidencias de calor −50 % | ninguna | `decision:climate` |
| Línea AV nueva (propia) | km·1,1 + 25 (clásico) | 42 + km/10 | tramo std, 25 kV, 300 | — | hito 5 |
| Proyectos AV (Almería, Y vasca, Burgos–Vitoria…) | `PROJECTS` del clásico | ídem | megaobra por etapas (D5.7) | — | por año y hito |

**Modos de servicio** (del Rescate), aplicados a **todas las líneas que cruzan el tramo**:
- **Por fases:** duración ×1,5, demanda 78 %, puntualidad −9.
- **Autobuses:** duración ×1, demanda 55 %, coste de autobús.
- **Corte total:** duración ×0,85, sin servicio.

Obras en tres fases (permisos 10 % · construcción 80 % · pruebas 10 %). Las cuadrillas solo se reservan en construcción y pruebas (en el Rescate se reservaban en todas las fases, `PHASES.crews`). Pruebas fallidas: la probabilidad depende del contratista y de que el inspector esté sobornado, y se ve en el presupuesto.

**Cuadrillas** (capacidad de obra, del Rescate): propias, contratas y préstamo de Adif. Cada obra usa 1–2. Las incidencias rápidas (cable, desprendimiento) piden una cuadrilla libre, y si no la hay la opción sale apagada con el motivo.

**Retrasos con causa:** sustituyen al 22 % aleatorio. Se suman terreno y montaña en invierno, permisos lentos (confianza con Adif baja, territorio enfadado), cartera de la contrata y restos arqueológicos (`event:adifdelay`, una obra con nombre). El presupuesto muestra «riesgo de retraso: medio (montaña, invierno)».

### D3.4 Líneas: preestablecidas + herramienta de líneas (Cities)

- **Línea = paradas + trayecto + producto + material + frecuencia + tarifa.** El trayecto lo calcula el planificador con el perfil del tren y se muestra como **franja de ruta** (D4.4).
- **Relaciones preestablecidas** (atajo de un clic): las 91 clásicas (76 con horario real) y las 11 de Media Distancia del Rescate (Norte, Levante, Sur, Mediterráneo, Ebro, Galicia, Asturias, Extremadura, Teruel, Soria, Cantabria).
- **Herramienta «Nueva línea»:** pinchas ciudades en el mapa en orden y eliges producto (AVE, Alvia, Media Distancia, Regional). Trenespop y la flota se filtran por compatibilidad. Ves tiempo, demanda, ocupación, margen, unidades y maquinistas necesarios, y abres por 4 M€ y 1 firma (`createService` del clásico generalizado).
- **Productos:** etiquetas comerciales que dependen del tren y del tramo, no catálogos separados. AVE = tren de alta velocidad por LAV; Alvia = ancho variable; Media Distancia = convencional OSP; Regional = paradas frecuentes OSP. **No hay Cercanías** (decisión previa del usuario).
- **Ajustes rápidos en la ficha:** ± frecuencia y ± tarifa (gratis). El planificador completo compara antes y después con la misma regla del motor (`serviceQuote` del Rescate).

### D3.5 Estaciones

- Niveles clásicos 0–3 (+6 % de demanda y +0,72 de fiabilidad por nivel).
- **Atendida o no atendida:** personal 6 meses, demanda ×1,03 o ×0,98. Hace verdad las 63 líneas del tema 3 («El andén olvidado»).
- **Accesible:** sí o no. Villanueva del Andén es la estación de Paco.

### D3.6 El traspaso de la Media Distancia (giro de la Herencia)

- En enero de 2024 (o antes, si se completa el Acto 1) el Ministerio **traspasa a Tenfe las 11 líneas de Media Distancia** con su flota vieja (449, 470, 592, 594, 599, Civia) y su contrato OSP: es el «Acto 2» del Rescate metido en la Herencia.
- **Por qué:** hace cierta la toma de la induction «para una vía sin catenaria solo sirve hoy nuestro Alvia híbrido S730» (en enero de 2022 la flota de Tenfe es solo AVE y Alvia), y abre la complejidad poco a poco (Cities): primero AVE/Alvia y el tutorial, después diésel, 3 kV, vía única, OSP y territorios.
- Lo anuncia una línea nueva de Óscar (ministro desde noviembre de 2023).

---

## D4. Trenes y Trenespop

### D4.1 Catálogo único (`trenes.js`, a partir de `trains.json` + modelos clásicos)

| Segmento | Modelos (marca paródica) | Tracción · tensión · ancho | vmax | Plazas | M€ nuevo |
|---|---|---|---|---|---|
| Regional | Civia 463 / 465 (KAFKA), 449 (KAFKA), 470 (KAFKA, solo usado) | eléctrico · 3 kV · ib | 120–160 | 184–277 | 0,5–8 |
| Media Distancia | 480 Civity (KAFKA, desde 2027, **bitensión**), Dörfler BMU (bimodo 3/25 kV, ib, 160/140, desde 2028), 592 «camello» (Malstom, diésel, usado), 594 TRD y 599 (KAFKA, diésel) | varias | 120–200 | 123–256 | 0,6–9 |
| Larga distancia | S120, S130 (eléctricos 3/25 kV, ancho variable), S730 (bimodo, variable, 250/180), S106v | — | 250–330 | 238–507 | 16–32 |
| Alta velocidad | S100 (solo usado), S112, S103, S106 Avril estándar, AV 2030 (licitación), BCBB «Fuxing» (desde 2029) | eléctrico · 25 kV · std | 300–350 | 329–576 | 19–38 |

- Cada modelo lleva `{fabricante, segmento, traccion, tensiones[], ancho, vmax, vmaxDiesel?, plazas, precio, plazoMeses, añoDisponible, consumo, fiabilidadBase}`.
- Los identificadores clásicos se conservan (`s100`, `s112`, `s103`, `s106f`, `av2030`, `s120`, `s130`, `s730`, `s106v`), así que las partidas v4 migran.
- **Precios de `trains.json`** (S103 38, S112 29, S130 25, S730 30). La inflación clásica sigue (+1,8 %/año).
- **Fiabilidad por fabricante**, a la vista en la ficha:
  - KAFKA: fiable, precio medio.
  - Tardo: especialista en ancho variable, cartera llena y retrasos.
  - Schlimmens: caro y fiable.
  - Malstom: cartera enorme.
  - Dörfler: bimodo, puntual y caro.
  - BCBB: barato, entrega rápida, fiabilidad menor y riesgo político (Bruselas y Gobierno lo miran mal; yate en cloacas).
- **Personalidad de los fabricantes por semilla** (cartera inicial y ofertas de estreno).

### D4.2 Reglas de material

- **Estado y edad:** el estado baja con el uso y el presupuesto de mantenimiento. La edad sube el coste de mantenimiento y baja el valor de reventa.
- **Probabilidad de avería** = (1 − fiabilidad) × f(estado) × (1 + rampa/calor del tramo). Cada avería tiene tren y tramo con nombre.
- **Taller con capacidad:** 2 huecos más 1 por etapa de la megaobra «Gran Taller», con cola. La revisión es dirigida a un tren (se acaba el `fleetcare` global de 2 M€).
- **Reventa por edad y estado** sobre el precio pagado, no sobre el precio nuevo. Así se cierra el beneficio de comprar usado y revender del Rescate.
- **Entregas:** 2 unidades al mes y 30 % de anticipo (clásico). El **riesgo de retraso se calcula y se enseña** (fabricante × cartera × crisis de fábricas). Se sortea una vez con la semilla al firmar, sin repetir.

### D4.3 Trenespop (se conserva la marca, la tienda y la interfaz)

- **Dónde:** Flota › Trenespop, y **desde cualquier línea o tramo incompatible** («Comprar un tren que pueda» abre Trenespop prefiltrado).
- **Anuncios:**
  - fábrica: stock por cartera, no fijo en 30;
  - usados: lote mensual determinista por semilla y mes, con estado, edad, km, vendedor y ciudad;
  - **ofertas relámpago** de sucesos (`event:secondhand`: 4× S112 al 80 %, 60 M€, caduca en un mes);
  - **licitaciones** (`decision:futuretender`: pujas de Tardo, Schlimmens, Malstom, BCBB y KAFKA con precio, plazo, tensiones y ancho);
  - **estreno de fabricante** (OpenTTD: «hemos diseñado un tren nuevo, ¿lo prueba un año en exclusiva?»).
- **Filtros:** tracción (eléctrico 3 kV / 25 kV / bitensión, diésel, bimodo), ancho (ibérico, estándar, variable), segmento, fabricante, estado, entrega y el clave **«Puede circular en…»**.
- **Refactorización mínima** (`trenespop-reutilizacion.md` §1): atributo y `id` parametrizados, dinero y tiempo inyectados, catálogo inyectado. El HTML clásico sigue saliendo idéntico para no romper `marketplace-test.mjs`.

### D4.4 Cómo se ve la compatibilidad

1. **Chips iguales en todas partes:** `IB` · `UIC` · `VAR` (ancho), `3 kV` · `25 kV` · `2T` · `DSL` · `BIMODO` (tracción) y vmax.
2. **Tres estados en Trenespop abierto desde una línea:**
   - ✓ *Puede circular* (minutos y cuello de botella);
   - ◐ *Con cambio* (cambiador en X, +12 min);
   - ✗ *No puede*: primer motivo, más «Ver la obra que lo arregla» con coste y meses.
3. **Franja de ruta** en la ficha de línea, en Trenespop y en el planificador: barra con los tramos del recorrido coloreados para el tren elegido (verde puede, ámbar cambiador, rojo falta), con km y nombres.
4. **Capa «Compatibilidad»** en el mapa: al seleccionar un tren o modelo, la red se pinta según dónde puede ir (el diagnóstico de ruta de Airport CEO; D8).
5. **Al firmar una obra que quita compatibilidad** (3 → 25 kV, ancho estándar), el planificador lista las unidades y líneas que la pierden, en rojo, antes de aprobar.

---

## D5. Rejugabilidad: que ninguna partida sea igual

### D5.1 Pantalla «Nueva partida» (absorbe el modo libre)

1. **Arranque:** tres tarjetas con ficha (Cities): caja, deuda, flota, % electrificado, % ancho estándar, apoyo y próximas elecciones.
2. **Semilla** (texto, con botón aleatorio) y **código para compartir** (arranque + opciones + semilla), visible también en el final.
3. **Rasgo del presidente de Tenfe** (Tropico), uno de 8, cada uno con ventaja y pega mecánicas:

   | Rasgo | Ventaja | Pega |
   |---|---|---|
   | Ferroviario de carrera | Plantilla +10; revisiones −20 % | Gobierno −5 |
   | Exbanquero | interés −1 punto; Hacienda +10 | Plantilla −10 |
   | Inaugurador compulsivo | +Gobierno por obra terminada | obras +10 % |
   | Tecnócrata | investigación −25 % de plazo | mítines con la mitad de efecto |
   | Tuitero | Viajeros +5; escándalos −20 % | Hacienda −5; crisis virales más probables |
   | Negociador | +1 contraoferta en pactos | ultimátums 1 mes más cortos |
   | Paracaidista político | Gobierno +15 | todos los demás −5 |
   | Ecologista | electrificar −10 %; Bruselas + | diésel +15 % de coste |

4. **Dificultad:** Fácil / Normal / Difícil / Infernal. Son presets de 6 deslizadores (exigencia de las facciones, fondos europeos, imprevistos, agresividad de los rivales, combatividad sindical, listón europeo) y **multiplican la puntuación final** (Tropico 4).
5. **Modificadores** (0–3; estilo Mini Motorways): Austeridad (obras y mantenimiento +25 %, demanda −10 %), Bruselas exigente, Sindicatos combativos, Prensa hostil, Veranos infernales, Fábricas saturadas, Diésel caro, Sin YaIré, Solo ancho ibérico.
6. **Reglas libres** (lo que era el modo libre), con casillas y «seleccionar todo»: caja (ajustada 300 / normal 500 / expansión 1.500 / constructor 5.000 / ilimitada), rivales sí/no, elecciones y cese sí/no, cloacas sí/no, firmas ilimitadas, todo desbloqueado, sin fecha de fin, sucesos sí/no.
   - **Cualquier regla libre convierte la partida en «Maqueta»** y apaga medallas y retos (Cities: los mods desactivan logros).
7. **Retos:** 3 medallas oscuras sorteadas por la semilla, que se vuelven doradas (Transport Fever 2). Ejemplos: «Teruel con catenaria antes de 2030», «Vencer a OuiOui en Madrid–Barcelona», «Ni un diésel en Extremadura», «Cero sobres», «Norte al 90 % un año entero».
8. **Reto mensual:** semilla y modificadores fijos para todos durante un mes del calendario real. Se calcula a partir de la fecha, sin servidor.

### D5.2 Lo que siembra la semilla (todo con estado legible)

| Variable | Rango | Dónde se ve |
|---|---|---|
| Tramos degradados al empezar | 3–5 tramos convencionales con `cond` 25–45 % y LTV | capa «Estado de vía» |
| Flota inicial | edad y estado de los lotes ±; qué unidades están paradas | Flota |
| **Línea de Marisa** (su trayecto diario) | una de las líneas abiertas al empezar (en 2027 siempre la Norte: lo dice `t-2`) | ficha de Marisa y icono en la línea |
| **Pueblo de Paco** (Villanueva del Andén) | un punto de una línea rural (en 2027, entre Ávila y Medina) | mapa |
| **Obsesión de cada líder** (agenda secreta; se revela tras su primera petición o pagando una Audiencia) | 1 de 3 por líder (D5.3) | Política |
| Crecimiento regional | 2–3 regiones en auge | capa «Viajeros» |
| Rivales | año de entrada ±2 fuera de lo histórico, estrategia preferida (precio, capacidad o calidad), personalidad de Íñigo | Política › Poderes |
| Fábricas | cartera inicial, estreno de modelos, crisis de suministro (la de 2041 en la Herencia) | Trenespop |
| Clima | calendario de olas de calor, nevadas y DANAs, con aviso previo | Agenda › Calendario |
| Energía | crisis futuras (la de 2022 es histórica) | Finanzas |
| Fondos europeos | ventanas de convocatorias | Progreso |
| Viento político | ±3 puntos por elección, anunciado un año antes | Política › Elecciones |

### D5.3 Facciones (Tropico) con líder, agenda, peticiones y ultimátums

Cinco facciones votantes, cada una con un personaje de la plantilla grabada como líder, y tres **poderes** no votantes.

| Facción (peso en el voto) | Líder | Sube con | Baja con | Obsesiones (1 de 3, por semilla) |
|---|---|---|---|---|
| **Viajeros** (0,30) | Marisa Andén | puntualidad ponderada por viajeros, precio, plazas, atención | retrasos en su línea, hacinamiento, subidas de tarifa | Puntualidad de *su* línea · Precios · Comodidad (wifi, maletas, aire) |
| **Territorio** (0,20) | Paco Terruño | líneas rurales servidas (≥2 frecuencias por sentido, >55 %), estaciones, catenaria donde había diésel | cierres, recortes, estaciones sin personal | Estación en Villanueva · Tren diario en las comarcas · Catenaria para su comarca |
| **Plantilla** (0,15) | Fermín Bogie | cobertura de maquinistas, presupuesto de taller, convenio, contratar | externalizar, recortes, horas extra crónicas, despidos | Convenio · Taller · Contratar |
| **Hacienda** (0,15) | Charo Tijera | resultado ordinario a 12 meses, colchón de caja, deuda contenida | pérdidas, mal uso (cancelaciones con multa, aceleraciones, vanidad, préstamos con pérdidas) | Deuda · Resultado · Colchón |
| **Gobierno** (0,20) | Pedro Sancho, con el ministro de Transportes como portavoz | inauguraciones (6 meses), media de Viajeros y Territorio, rango en el Operador del Año | escándalos, incumplimientos OSP, fotos fallidas | Inauguraciones · Encuestas · Europa (ERTMS, ranking) |

**Poderes** (relación 0–100, sin voto):
- **Adif** (Benito): plazos de permisos, cuadrillas prestadas, retrasos.
- **Bruselas** (sin voz; la Gaceta habla por ella): fondos, ERTMS, ancho estándar, liberalización.
- **Competidores:** OuiOui, YaIré y Autocares Meseta (Íñigo).

**Mecánica** (del Rescate: objetivo por facción, deriva mensual del 25 % hacia él, media de 6 meses para votar), **con las causas a la vista** (Almanaque › Apoyo: tres principales causas de cada facción, Tropico).

**Peticiones = encuentros grabados.** La petición abierta de una facción es una escena de su líder (o de alguien de su grupo) elegida por el selector de verdad (D6.4): «Fermín quiere que revises el 599 *Pucela*». Hay como mucho una petición abierta por facción. Cumplirla da +5 y la opción contraria −3.

**Peticiones dobles** (Tropico): cuando dos líderes con intereses opuestos tienen escena verdadera **del mismo tema** el mismo mes, suenan las **dos tomas seguidas** y eliges a quién atender. Ejemplos con cuerpos ya grabados:
- tema 0: Fermín «Necesito manos en el turno de noche» frente a Charo «Las horas extra no se pagan con entusiasmo»;
- tema 1: Marisa «¿Vendéis billetes o apuestas?» frente a Charo «Cada descuento tiene que salir de algún sitio»;
- tema 3: Paco «Quiero atención en la estación» frente a Charo «Ese pueblo necesita atención, no otra escultura».

Cada persona tiene una opción preferida por tema (se define en la tabla de predicados), así que la decisión mueve a ambos de verdad.

**Ultimátums** (Tropico, escalados por el peso de la facción):
- **Se disparan** con confianza < 25 durante 2 meses.
- **Cuenta atrás:** 3 meses. Se levantan subiendo a ≥ 35 o cumpliendo la petición de su obsesión.
- **Castigo de 12 meses**, distinto para cada facción:

| Facción | Castigo | Voz |
|---|---|---|
| Plantilla | **Huelga de maquinistas** con servicios mínimos reales (AVE 50 %, OSP 75 %) | `event:strike` (grabada: «Los maquinistas han convocado huelga…») |
| Hacienda | **Intervención**: −1 firma y préstamos bloqueados | nueva |
| Territorio | **Moción en el Congreso**: OSP −15 % | nueva |
| Viajeros | **Reclamación colectiva**: devolución por retraso obligatoria | nueva |
| Gobierno | no hay ultimátum, hay **cese** (< 15 durante 6 meses), con un «último aviso» a 20 | nueva |

**Directriz «Audiencia»** (1 vez al año, 3 ★): pide la petición de las dos facciones peor tratadas. Si ninguna tiene escena verdadera, el juego dice «Nadie tiene nada que pedirte ahora». El silencio es honesto.

**Peticiones: un solo sistema.** Las peticiones de ciudades del clásico («¡Queremos AVE!», más frecuencia, estación, tarifa) pasan a ser peticiones **de la facción Territorio o Viajeros**, con chincheta en el mapa. Viven en la misma lista que las peticiones de los líderes (Política › Peticiones) y en la Agenda. Hay como mucho 4 abiertas, nunca piden lo que ya tienes, y pagan tras 3 meses de servicio sostenido.

**Consejo de Ministros trimestral** (bucle corto de recompensa, de Mini Metro): cada trimestre Pedro ofrece **2 cartas y eliges 1**. Ejemplos: una cuadrilla de Adif gratis 6 meses, crédito blando, un lote usado cedido por otro operador, +1 firma ese mes o un adelanto de fondos europeos. Con Gobierno ≥ 60 las cartas son mejores; con < 35 hay una sola carta y con condiciones. Son ofertas mecánicas sin voz; no afirman nada que no pase.

**Remodelación del Gobierno** (Tropico, ministros):
- Tras cada elección general ganada (salvo la de 2023 en la Herencia, fijada por la historia), Pedro te deja elegir ministro de Transportes: **Raquel Sanz** (agenda: inauguraciones y territorio; da el pacto «inauguración») u **Óscar del Puente** (agenda: puntualidad y redes; da el pacto «tuits»).
- Quien no está en el cargo **no habla como ministro**: sus 35 encuentros y sus pactos solo se ofrecen mientras ocupa el puesto.
- Esto reparte de verdad las 70 tomas de los ministros a lo largo de partidas largas, y cada partida tiene otra política de Transportes.

**Estatuto de Tenfe** (la Constitución de Tropico; 4 artículos, revisables una vez por legislatura tras ganar elecciones):
1. **Misión:** servicio público / comercial (la fija la toma `decision:inaugural`). Antes no se podía cambiar nunca.
2. **Tarifas:** social / plana / dinámica.
3. **Mantenimiento:** propio / mixto / externalizado (la política clásica).
4. **Transparencia:** opaca (cloacas más baratas, escándalos peores) / auditada / **portal abierto** (cloacas desactivadas, +confianza de Gobierno y Bruselas).

**Directrices** (los edictos de Tropico). Tienen 3 niveles (0★, 1★, 2★) que mejoran a los 6 y 12 meses activas, y llevan chips de facción en la tarjeta:
- Abono joven, Tarifa dinámica, Wifi gratis, Devolución por retraso, AVArato (marca de bajo coste, desde el hito 4);
- Prioridad puntualidad (la «punctual» clásica);
- Vigilancia de cable (reduce el riesgo de robo);
- Protocolo de incidencias;
- Presupuesto de mantenimiento y Presupuesto de vía (50–150 %);
- Revisión anual de tarifas;
- Campaña de imagen (★).

**Capital político ★** (las ★ del Rescate): se gana con apoyo alto, hitos, actos, pactos cumplidos y el Operador del Año. Se gasta en Audiencia, Campaña de imagen, **puntos de negociación** (D8) y huecos del mitin.

**Elecciones:**
- **Previsión** = Σ (media de 6 meses de cada facción × peso) ± viento político, frente a 50.
- Se ve **un año antes**, con sus tres componentes (facciones, listón europeo, confianza personal: Tropico).
- **Mitin** (de 6 a 1 mes antes, constructor de Tropico): reconocer un problema (quita esa causa del cálculo de su facción durante 6 meses), elogiar a una facción (+6), culpar a un tercero (Adif, Bruselas, el tiempo; sube el voto y baja la relación) y **prometer** (crea un compromiso para la legislatura; romperlo cuesta −10 de confianza personal).
- **Elecciones anticipadas** (`event:election`) adelantan la fecha de verdad.

### D5.4 Hitos y desbloqueos (Cities)

- **12 hitos con nombre:** Apeadero, Andén, Estación, Intercambiador, Nudo, Red regional, Red nacional, Red ibérica, Red europea, Referente, Leyenda, Patrimonio.
- **Cómo se miden:** viajeros/mes en **media de 3 meses** (no se puede inflar un mes), más obras en servicio al menos 6 meses. Las obras canceladas o cerradas restan, así que no hay granjas de puntos (la crítica nº 1 de Cities: Skylines II).
- **Cada hito da** ★, techo de préstamo, y a veces +1 firma, un nivel del árbol de investigación, megaobras, obras nuevas (duplicar vía en el 3; 3 → 25 kV y mixto → estándar en el 4; línea AV propia en el 5), productos (AVArato) y categorías de Trenespop.
- **En los hitos 4, 7 y 10 se elige 1 de 2 paquetes** (CS2: el orden de desbloqueo es la identidad de la partida). Ejemplos:
  - «Plan Ferrocarril Verde» (electrificar −15 %, Bruselas +) frente a «Plan Velocidad» (LAV −10 %, Gobierno +);
  - «Taller propio» frente a «Contratas»;
  - «Red de proximidad rural» frente a «Ejes»;
  - Lo no elegido se puede conseguir más tarde, al doble de coste.
- Lo bloqueado se ve con candado y su requisito, con «Ir a Progreso».

### D5.5 Rivales con comportamiento propio

- **OuiOui** (`lowgo`) y **YaIré** (`rossa`):
  - entrada por corredor, año y demanda (reglas clásicas; YaIré en noviembre de 2022 en la Herencia, como dice `decision:Rossa`);
  - revisión de estrategia cada 6 meses según tu tarifa y tu frecuencia;
  - guerras de precios en ciclos;
  - **promociones de YaIré** (hacen verdad las 7 tomas del sucesor en el tema 1).
  - En el arranque 2027 OuiOui opera la AV y tú puedes volver por surcos desde el hito 5.
- **Autocares Meseta** (Íñigo):
  - cuota de autobús por línea (logit clásico) y **campañas de 6 meses cada 18**, con la fecha anunciada en la Gaceta;
  - reacción a tus recortes y obras;
  - además es **el conseguidor**: intermediario de comisiones, yates y extorsiones (D7). Así su papel en el Rescate deja de ser incoherente.
- **Bruselas** sube el **listón europeo** cada año: el **Operador Ferroviario del Año** compara 10 operadores europeos parodiados (D8).

### D5.6 Sucesos con causa, sitio y aviso

Se sustituye la tirada del 32 % mensual del clásico y la del 20 % semanal del Rescate. Cada tipo de suceso tiene un **riesgo por tramo o tren** calculado con el estado, visible en la capa **«Riesgos»** (Cities) y mitigable:

| Suceso (toma) | Riesgo de… | Mitigación |
|---|---|---|
| Robo de cable (`event:cable`) | tramos señalizados con poca vigilancia cerca de ciudades | directriz Vigilancia, bloqueo automático |
| Nevada en la catenaria (`event:snow`) | tramos electrificados de montaña en diciembre–febrero, solo con ≥3 puertos así en servicio | quitanieves, bimodos |
| Ola de calor (`event:heatwave`, `decision:climate`) | tramos del sur en junio–agosto según su estado | plan de resiliencia, presupuesto de vía |
| Vacas en la vía (`event:cows`) | vía única rural sin vallar | vallado |
| Avería con nombre (nueva) | fiabilidad × estado × rampa | revisiones, taller |
| Desprendimiento (nueva) | trincheras con estado bajo en época de lluvias | renovar |
| Incendio en el taller (`event:workshopfire`) | taller saturado y viejo | Gran Taller |
| Viral bueno (`event:influencer`) | solo si una línea pasó del 95 % el mes anterior | — |
| Restos romanos (`event:adifdelay`) | obra de plataforma en zona histórica | — |

- **Calendario de sucesos anunciados** (Tropico): huelgas convocadas con fecha, ola de calor prevista, campaña de Autocares, entrada de un rival, revisión de Bruselas, licitaciones y fin de los fondos.
- **Historias emergentes** que salen solas del registro de verdad. Ejemplo:
  1. Fermín pide revisar el 599 *Pucela* (tema 2) y eliges «Seguir con el plan»: el juego apunta «avisado».
  2. Dos meses después, la avería del *Pucela* en la Rampa de Pajares corta la línea de Marisa. Suena la toma de Marisa enfadada («¡Vete tú a esperar tres horas de pie, caradura!»), cierta porque la línea va llena y sin tren.
  3. El mes siguiente puede sonar la toma de Fermín decepcionado («Te avisé. Pero claro, qué sabrá el del mono de grasa»), cierta porque el tren que avisó se ha roto.
  4. El informe del mes lo dice en una línea: «*Pucela* averiado — Fermín te avisó en marzo».

### D5.7 Megaobras (SimCity) y medallas

- **Megaobras del Rescate** (Gran Taller, Centro de Control, Corredor Mediterráneo, Teruel, Estación Central de Madrid, Monumento al Ministro). Se mantiene el Monumento: la vanidad hace verdad el tema 3 de Charo («otra escultura delante del apeadero»).
- **Proyectos AV del clásico** como megaobras de 5 etapas («Estudio y permisos», «Plataforma», «Montaje de vía», «Electrificación y señalización», «Pruebas»; `operations.js:284`). Cada etapa exige medallas o estado, rinde algo y se puede ver en el mapa (grúa, plataforma).
- **Medallas:** las 9 del clásico y las 22 del Rescate, fusionadas en unas 30, más algunas satíricas negativas («Puerta giratoria», «Ministro dimitido»). Algunas desbloquean estaciones emblemáticas.

### D5.8 Final, puntuación y sin fin

- **Veredicto del mandato:**
  - Herencia: puntuación clásica `finalScore` + actos + retos + compromisos cumplidos − rotos, × multiplicador de dificultad.
  - 2027: veredicto del Rescate (programa, resultado, sin rescates, dos elecciones).
- Luego **«Seguir gobernando»**: elecciones cada 4 años, Retos de legado anuales y listón europeo creciente. La partida termina por cese, derrota electoral, concurso, retirada de la concesión o condena.

---

## D6. Motor de verdad: lo que se dice, pasa

### D6.1 Arquitectura (nuevos módulos puros)

| Módulo | Qué hace |
|---|---|
| `hechos.js` | Calcula una vez al cierre de mes el vocabulario de hechos `F` (adaptación mensual del §9 de la auditoría de encuentros): puntualidad por línea con historial, confianza por facción con deltas, cobertura de maquinistas, estado de flota por unidad, taller, estaciones, obras (terminada, primera vez, retrasada, acelerada), cloacas, rivales, autobús, elecciones, quién ocupa cada cargo y registro de sucesos (`eventLog`). |
| `guion.js` | **Registro de diálogos.** Para cada fuente (`decision:burgos`, `event:cable`, `scene-adif-angry-2`, `induction:…`, `t-1`, `pact-…`): `when(F)` (predicado de verdad), `instance(F)` (tren, tramo, línea, estación o técnica concretos), `speaker` (resuelto por cargo y fecha), `choices(F, inst)` con efectos, enfriamiento y prioridad. **El texto se toma del catálogo por `source`**: nunca se copia (restricción §6.1.3). |
| `efectos.js` | Operaciones concretas sobre el estado (iniciar obra X con parámetros, +1 frecuencia en la línea Y, tarifa ×0,85 en Z durante 3 meses, tope de vmax en un tramo, cancelar N trenes, revisión del tren T, crear oferta en Trenespop…). Cada operación sabe **describirse** (línea de detalle con números calculados) y **dejar marca** (chip con cuenta atrás en el objeto). |
| `compromisos.js` | Libro de promesas `{id, origen, etiqueta, predicado, plazo, premio, castigo}`. Se comprueba cada mes, se enseña en la Agenda y cada resultado se informa nombrando la escena que lo causó. |

**Ciclo:**
1. Cierre de mes.
2. `hechos`.
3. `guion` monta la cola: primero lo histórico y lo causado por el estado, luego sucesos, ultimátums y avisos, y por último **un encuentro como mucho**.
4. **Antes de mostrar cada escena se vuelve a validar** su predicado (y también al cargar partida). Si ya no es cierta, se descarta en silencio.
5. Presentación: retrato con el humor del catálogo, cuerpo grabado (`data-say`), **una línea de contexto sin voz** que nombra el objeto («599 *Pucela* · 38 % · línea Norte»), opciones con detalle calculado. **Nunca** cifras dinámicas en la voz.
6. El efecto se aplica, deja marca y, si es una promesa, entra en la Agenda.

**Reglas que evitan el «pulsar random»:**
- **Ninguna opción sin efecto.** Una prueba lo comprueba: cada opción cambia el estado o el libro de promesas.
- **Ninguna apuesta re-tirable.** Las apuestas (auditoría, visita de Estado) dependen del estado y se resuelven con una semilla fija por escena.
- **Nunca un bloqueo.** Siempre hay una opción sin coste inmediato (corrige el bloqueo de `event:freeze` con caja < 12).
- **Lo exógeno pasa elijas lo que elijas** (descuentos, fiestas, guerra de precios del autobús). La elección solo decide cómo respondes.
- **Una toma solo suena si su hablante ocupa el cargo que la toma supone** (ministra o ministro, Benito mientras siga en Adif…).

### D6.2 Las 47 tomas clásicas de decisiones, sucesos, capítulos y encargos

Se aplican las correcciones de `audit-story.json` (`unifiedFix`) en escala mensual. «H» = Herencia 2022; «R» = Rescate 2027.

**Decisiones (15)**

| Fuente | Suena cuando… (H / R) | Opciones y efecto real |
|---|---|---|
| inaugural (ministra) | mes 0 con Raquel en el cargo (H; en R tras `t-1`/`t-2`) | Fija el artículo Misión del Estatuto: OSP 2,2/1,6 €/tren-km, transferencia 3,5/2 M€/mes, Territorio +10 o Hacienda +10; ayuda inicial +120/+160 M€. Sustituye al test de la induction. |
| energy (Hacienda) | índice de energía ≥ +50 % (H: marzo de 2022 histórico; luego crisis sembradas) | «Cobertura»: congela el índice 12 meses con una prima = 50 % de la exposición prevista (se enseña). «Arriesgar»: se paga el índice. «La segunda, más» es cierto en esperanza. |
| burgos | cierre del mes en que se aplica `vdb-bur-av@2022-07-21` (H) | Campaña: −10 M€, +10 % de demanda 6 meses en líneas por Burgos. «Sin fiesta»: reputación −1. |
| discounts | septiembre de 2022 (H): bonos estatales que suben un 15 % la demanda Alvia **pase lo que pase** durante 18 meses | «Reforzar los Alvia»: +65 M€ ligados a un plan (≥1 salida más por sentido en 3 líneas Alvia en 3 meses; si no, se devuelven). «Que vayan de pie»: +25 M€ y penalización por hacinamiento. |
| Rossa | entrada real de YaIré (H, noviembre de 2022) | «Competir en servicio»: −18 M€, +3 de calidad en líneas con YaIré durante 24 meses. «Esperar». |
| murcia | `elx-mur-av@2022-12-20` aplicado (H) | Fiesta: +10 % Madrid–Murcia 6 meses. |
| gauge | febrero de 2023 (H): noticia de trenes ajenos que no caben | «Revisar lo tuyo»: revisión real de compatibilidad de la flota y los pedidos (marca pedidos incompatibles) y +8 de estado en las 10 peores unidades. «No es nuestro». |
| pajares (sucesor) | `leo-pol@2023-11-29` aplicado y Óscar ministro (H) | «Lanzar los Alvia a Asturias»: abre o refuerza Madrid–Gijón/Oviedo con una unidad de ancho variable libre; si no hay, abre Trenespop filtrado. −12 M€ (+4 si abre). |
| extremadura (sucesor) | `pla-cac@2023-12-14` aplicado (H) | «Electrificar lo que falta»: obra real 25 kV en Madrid–Talavera–Plasencia (Tenfe paga 20 M€, el Ministerio el resto), compromiso con plazo y Territorio en juego. «Alvia decentes»: asigna o compra S730 para Madrid–Badajoz. «Que esperen»: Territorio −. |
| s106 | mayo de 2024, entregas históricas (H) | Campaña: +10 % en líneas con S106 durante 6 meses. «A trabajar»: revisión dirigida. |
| futuretender (sucesor) | se abre una ventana de licitación (H: marzo de 2026; R: cuando toque, con Óscar en el cargo) | Licitación real en Trenespop. «Preparar la inversión»: 45 M€ para el anticipo (se devuelven si no pides en 6 meses). «Priorizar lo que hay»: +8 de reputación y sin nueva generación hasta la próxima ventana. |
| climate (presidente) | junio–agosto desde 2030, tras una ola de calor en Córdoba («Cuarenta y cinco grados en Córdoba») | «Plan de resiliencia»: obra regional permanente. «Reducir la oferta»: −20 % de frecuencia real en líneas por Córdoba/Sevilla/Badajoz ese verano. |
| rural (alcalde) | Villanueva tiene estación **sin trenes** y hay ≥3 líneas rurales (H: septiembre de 2035 o antes) | «Firmar»: contrato comarcal con obligaciones (D2.4). «No firmar»: Territorio −5. |
| industry (taller) | crisis mundial de fábricas (H: 2041; R: sembrada) que suma +8 meses de entrega a todos durante 18 meses | «Colarnos» −45 M€: exento y pedidos adelantados 6 meses. «Esperar». |
| legacyvote (presidente) | quedan 48 meses de mandato (H: enero de 2047; R: no aplica) | Compromiso final puntuado: «Red para todos» o «Cuentas saneadas». |

**Sucesos (22)**

| Fuente | Disparador por estado | Efecto real |
|---|---|---|
| cable (Adif) | riesgo de robo en un tramo señalizado con servicio | Tramo con vmax −30 % e incidencias. «Reponer ya» (doble de coste, 1 semana) o «a nuestro ritmo» (2 meses). Solo pierden las líneas que lo cruzan. |
| strike (taller) | **castigo del ultimátum de Plantilla** o convenio vencido | «Negociar»: nómina +3 % permanente (se cobra de verdad). «Aguantar»: un mes de servicios mínimos reales. |
| wifi (viajeros) | directriz Wifi apagada y flota vieja en una línea con mucho público | «Wifi nuevo»: inversión que equipa los lotes (+3 de calidad). «Ignorarlo». |
| eufunds (Hacienda) | ventana europea abierta (H: hasta 2026) | −40 % en catenaria, ancho, renovación y cambiadores durante 24 meses (ya funciona así). |
| freeze (Hacienda) | año sin presupuestos: tras unas elecciones con previsión < 52 o anticipadas | Transferencias −30 % 12 meses, o «Protestar» −12 % con Gobierno −10. Nunca pago por adelantado. |
| mayorchain (alcalde) | una ciudad solo con Alvia y Territorio < 45 (la ciudad se nombra en el contexto) | «Prometer un estudio»: estudio real de 6 meses que abre un presupuesto AV y una petición «¡Queremos AVE!». «Ignorarlo»: vuelve. |
| busprice (rival) | inicio de la campaña programada de Autocares (billetes a máx(5 €, 0,03 €/km) durante 6 meses, **siempre**) | «Bajar tarifas» −15 % real en líneas < 400 km. «Confiar en la velocidad». |
| heatwave (Adif) | ola de calor del calendario | «Limitar velocidades»: tope real 8 semanas. «Patrullas»: coste y riesgo menor. |
| snow (Adif) | ≥3 tramos electrificados de montaña en servicio en invierno | 3 puertos sin tensión 2 semanas: solo pasan bimodos. «Movilizar todo» lo acorta. |
| cows (Adif) | vía única rural sin vallar con servicio | «Vallar» (obra) o «Que se aparten» (una incidencia de 40 min ese mes). |
| secondhand (taller) | oferta relámpago generada | Abre el anuncio en Trenespop (4× S112 al 80 %). |
| workshopfire (taller) | riesgo del taller | «Reconstruir» o «Apañarse» (mantenimiento ×0,85 durante 6 meses). |
| influencer (viajeros) | una línea ≥ 95 % el mes pasado | +10 % en esa línea 6 meses. |
| festival (alcalde) | verano: +10 % de demanda 3 meses **siempre** | «Refuerzo de verano»: salidas temporales reales con unidades libres. |
| audit (Hacienda) | meses en negativo, deuda o pruebas en cloacas | El resultado se calcula con el estado y una semilla fija: multa y Hacienda −, o limpio. |
| adifdelay (Adif) | obra de plataforma activa | **Una** obra con nombre: +4 meses, o pagar el turno de noche. |
| adifboost (Adif) | obra ≥ 50 % sin retraso | Esa obra −3 meses por ≈10 % de su coste. |
| royal (presidente) | ≥1 línea AVE con una unidad libre | La probabilidad de éxito es la puntualidad de esa línea; semilla fija. |
| election (presidente) | **adelanta las elecciones** 4–6 meses cuando la previsión ≥ 52 (le «apetece») | «Inaugurar»: solo si una obra o apertura termina antes del día de votación (adelantándola si hace falta). «No hay nada que cortar»: Gobierno −8 y compromiso. |
| tweet (sucesor) | Óscar en el cargo y un tema viral | Reto de una semana real: ninguna incidencia en los días 1–7 del mes siguiente. Se mide con las incidencias por día. |
| teruel (alcalde) | algún tramo Zaragoza–Teruel–Sagunt sin catenaria | «Prometer catenaria»: compromiso de empezar a electrificar en 12 meses (elegir 3 o 25 kV). Si se rompe, Territorio −15. |
| luggage (viajeros) | ocupación > 85 % en una línea de larga distancia | «Reformar coches»: +1 de calidad en esos lotes. |

**Capítulos = Actos** (H). Cada uno tiene **objetivos exactamente como los dice su toma**, plazo (las elecciones de su legislatura) y consecuencia (Gobierno −20 si fallas; ayuda y ★ si cumples). Dejan de estar abiertos solo por fecha.
- Recuperación (2022): incluye trenes pedidos en Trenespop.
- Competencia (2024): incluye cambiadores.
- Mediterráneo (2028): un **AVE circulando** de València a Barcelona, LAV de Almería y tercer carril donde haga falta.
- Territorio (2035): Soria, Teruel y Extremadura con catenaria.
- Legado (2042).

Si en 2028 o 2035 la ministra es Raquel (por remodelación), el acto abre con su **variante nueva grabada** en vez de la toma del sucesor.

**Encargos (5 `ARCS`)** como plantillas de encargo con región y requisito coherentes:
- arco 0: solo líneas con OuiOui presente;
- arco 1: solo rutas que usan `leo-pol` tras la apertura de la Variante;
- arco 2: el Mediterráneo con requisito de obra, y Raquel en el cargo;
- arco 3: ciudades rurales u OSP, con primera salida antes de las 07:00;
- arco 4: solo en los 12 meses antes de unas elecciones.

**Induction (50, H):** es el **«Primer mes guiado»** opcional, con lista que se marca sola (Airport CEO). Se conservan las etiquetas de la interfaz que citan las tomas: «Qué puede circular», «Competencia», «Investigación», **«Agenda»** (nombre de la columna izquierda) y «Comienza la jornada». El primer encargo pasa a medir **viajeros nuevos sobre la base** (ya no se gana solo en el primer cierre). La de Óscar «hoy alcalde consultado» es cierta en enero de 2022.

### D6.3 Las 3 tomas grabadas del Rescate (arranque 2027)

- **`t-1` (Raquel):** «No hay dinero» (caja baja), «no hay trenes» (pocas unidades libres), «el Norte llega tarde» (62 %), «Tienes ocho años» (mandato hasta 2034). «Las primeras trece semanas deciden si llegas a la segunda» es **literal**: si no cumples la etapa 1 (Norte ≥ 80 % y sin impagos el 31 de marzo), te cesan.
- **`t-2` (Marisa):** «Pincha en el corredor Norte… Ese que parpadea en rojo» → el trazo de la **línea Norte** parpadea en rojo (puntualidad < 70), no el lienzo entero.
- **`paco-estacion`:** se ofrece cuando Villanueva no tiene estación y Territorio pesa ≥ 0,2 en el voto («votantes, los suficientes»). El «Ministro» es la muletilla documentada de Paco (llama ministro a todo el que lleva corbata). Sus líneas nuevas la mantienen; la toma `decision:rural` («Señor presidente de Tenfe») es un escrito formal.

### D6.4 Los 315 encuentros: selección por estado

Se aplica el algoritmo del §6 de `auditoria-encuentros.md`, pasado a meses:

- **Cuándo:** como mucho una escena al mes, tras el cierre. Nunca en los 3 primeros meses de la Herencia (tutorial) ni en el primer trimestre de 2027. Nunca con una escena con opciones pendiente.
- **Hablantes:** ministra o ministro solo mientras ocupan el cargo (`F.office.transport`); Benito, mientras siga en Adif.
- **Humor:** el predicado del arranque de frase (63) tiene que ser cierto, con la guarda de confianza (happy y proud ≥ 40; angry y disappointed ≤ 60).
- **Tema:** el predicado del tema (45) tiene que ser cierto y devolver **instancia y gravedad**.
- **Puntuación:** 0,55·gravedad + 0,25·interés del hablante + 0,20·nivel del humor. Si la mejor nota es < 0,45 y no han pasado 2 meses, no suena nada.
- **Enfriamientos (meses):**

  | Ámbito | Valor |
  |---|---|
  | mismo cuerpo | 1 vez por partida (10 años en sin fin) |
  | misma persona y humor | 6 |
  | misma persona y tema | 6 |
  | mismo tema | 2 |
  | misma persona | 2 |
  | misma instancia | 3 |

- **Peticiones dobles** (D5.3): si dos hablantes de facciones opuestas tienen escena válida del mismo tema el mismo mes.
- **Efectos de las opciones** (bloques de la auditoría, reescalados a M€ y meses y calibrados por el bot):

  | Tema | Opción A | Opción B |
  |---|---|---|
  | 0 · El turno imposible | **Horas extra**: cobertura forzada un mes, coste por tren sin cubrir | **Ajustar turnos**: se cancelan de verdad los trenes sin cubrir (primeras salidas y líneas grandes primero; nunca una esencial a cero), puntualidad −2 |
  | 1 · Billetes de saldo | **Campaña**: tarifa ×0,85 durante 3 meses en las líneas de la instancia, con vuelta automática | **Proteger el margen**: el rival sigue ganando cuota y se ve |
  | 2 · Tornillos o titulares | **Revisión** del tren con nombre (hueco de taller) | **Seguir el plan**: probabilidad de avería ×1,5 dos meses y queda «avisado» |
  | 3 · El andén olvidado | **Personal en la estación** con nombre 6 meses (×1,03) | **Atención centralizada** (×0,98) |
  | 4 · El invento del mes | **Piloto** de una técnica en una línea durante 2 meses (30 % del coste, resultado medido, se descuenta si la compras en 3 meses; partida reservada de pilotos) | **Otra evaluación**: esa técnica no se pilota en 3 meses |

- **Retiradas para siempre (5, nunca pueden ser ciertas):** `scene-adif-happy-0`, `scene-adif-determined-2`, `scene-workshop-happy-2`, `scene-rival-surprised-1`, `scene-successor-happy-0`.
- **Ventanas estrechas (9)** según el §7.3 de la auditoría, comprobadas por el selector.
- **Grupos condicionados (17):** ninguno se retira, porque el diseño implementa todas las mecánicas que piden: maquinistas, cuadrillas, taller, estaciones, pilotos, descuentos, autobús, YaIré, Monumento, fallo de la app en los meses punta hasta tener «App que funciona», AVE, cloacas y calendario político. **Mientras la fase que trae una mecánica no esté publicada, su grupo se desactiva por bandera** (`requires: ['pilotos']`), y la prueba de alcance lo vigila.
- **Cobertura prevista:** unas 2 escenas cada 3 meses, es decir 200–230 en una Herencia completa, con 310 cuerpos alcanzables. Cada partida oye **otros** cuerpos porque los provoca otra situación.

### D6.5 Promesas que el juego vigila

Entran en el libro de compromisos y en la Agenda, con plazo, premio y castigo:
- Plan Extremadura, catenaria para Teruel, estudio del alcalde encadenado, contrato comarcal;
- el refuerzo de los descuentos, la licitación;
- «Inaugurar» antes de votar, el reto del tuit;
- los pactos;
- las promesas del mitin y el compromiso final (`legacyvote`);
- los encargos y las peticiones de ciudades.

El informe del mes dice cuáles se cumplieron, cuáles vencen y cuáles se rompieron, siempre con la escena de origen.

### D6.6 Tomas que no suenan nunca o según el arranque

- **Nunca:** los 5 encuentros imposibles.
- **En el arranque 2027:**
  - las 8 decisiones fechadas 2022–2024 (burgos, discounts, Rossa, murcia, gauge, pajares, extremadura, s106);
  - las 50 de la induction (su tutorial son `t-1`…`t-7`);
  - los capítulos Recuperación, Competencia y Mediterráneo (las etapas ocupan 2027–2034);
  - `legacyvote`.
- **En la Herencia:** las líneas propias del Rescate (etapas, `t-*`).
- **Siempre en el auditorio**, con títulos que dicen dónde suenan.

### D6.7 Líneas nuevas que hay que grabar: 112 (más hasta 30 variantes opcionales; tope de 150)

Van al catálogo de voces nuevas (`LINES` de `rescate-data.js`, que se reescribe; solo se conservan intactas `t-1`, `t-2` y `paco-estacion`). Se graban con `build_rescate_voices.py` (Qwen, mismas referencias y semilla) a unos 50 s cada una: **unas 1,6 h de CPU**. Ninguna lleva cifras que cambien.

| Grupo | Líneas | Detalle |
|---|---|---|
| Arranque 2027 | 17 | `t-3`…`t-7` reescritas sin cifras y con «firmas al mes»; etapas s1–s5 (s4 en dos variantes, Raquel sigue u Óscar entra); `stage-fail`; `stage-pass` × 2 (por cargo); `end-win` × 2; `end-partial` |
| Política | 15 | `el-forecast`, `el-win`, `el-lose`; remodelación (Pedro) + toma de posesión de Raquel y de Óscar; 4 ultimátums (Hacienda, Territorio, Viajeros, aviso de Plantilla) + último aviso de Gobierno; mitin (Pedro); variantes de los actos Mediterráneo y Territorio por Raquel (2); traspaso de la Media Distancia (Óscar) |
| Pactos | 27 | 8 ofertas reescaladas (convenio, contrato-programa, cuadrilla de Adif, carta de viajeros, inauguración, cohesión, tuits, no agresión); `paco-inaugura`; **cumplido y roto en boca de cada contraparte** (9 + 9; resuelve «Íñigo dice todos los no») |
| Cloacas | 26 | 6 propuestas (comisión por Íñigo nombrando al fabricante; traviesas; yate BCBB; enchufe × 2 según ministra o ministro; mariscada); 3 extorsiones, cada una ligada a su secreto; 11 escándalos (los 8 del Rescate con `sc-enchufe` × 2 + `sc-comision`, `sc-pacto-meseta`, `sc-accidente`); 5 judiciales (+ `jud-archivo`); `paco-sobre` |
| Finanzas | 4 | `fin-impago`, `fin-quiebra` (en meses), `fin-retirada` × 2 por cargo |
| Sucesos nuevos | 8 | avería con nombre × 2 (en rampa / en llano), aire acondicionado, desprendimiento, revisora viral × 2 (Teruel / genérica), visita del ministro × 2 |
| Progreso | 15 | 6 hitos grandes, 6 megaobras, inauguración de LAV propia × 2 por cargo, resultado del Operador del Año |
| **Total** | **112** | Variantes opcionales (3 por línea recurrente, la queja de Tropico): hasta +30 |

---

## D7. Qué se queda de cada modo y qué se va

| Origen | Se queda | Se va (y por qué) |
|---|---|---|
| **Campaña clásica** | Red de 125 tramos y planificador con «Qué puede circular»; horario GTFS y trenes en el mapa; aperturas históricas en su fecha; encargos (con estrellas, D8); actos (capítulos con plazo); rivales OuiOui, YaIré y autobús; maquinistas con formación; Trenespop; ficha de ciudad con skyline; induction grabada; logit de demanda; incidencias de la jornada; líneas AV propias y proyectos; niveles de estación; investigación (6 técnicas con su coste grabado) | Tirada del 32 % de sucesos (la sustituye el riesgo por estado); permutación de encuentros (selector de verdad); préstamo puente automático (decisión de impago); peticiones que pagan al instante (pagan tras 3 meses); `fleetcare` global (revisión dirigida); «Trenes llenos» falso; parte del día con viajeros inventados; capítulos abiertos solo por fecha; política inmutable (Estatuto); 5 cajones con subpestañas (D9) |
| **Rescate 4.0** | Planificar con el tiempo parado y «mirar es gratis»; firmas limitadas; presupuesto antes de firmar (`workQuote`, `punctProjection`, `serviceQuote`, `cashProjection`, `plannedAid`); causas a la vista; Misión → obstáculo → acción (Agenda); paradas con motivo; obras en 3 fases con 3 modos de servicio; pactos verificables; decisión de impago; cloacas con causalidad; megaobras con medallas; hitos; ciclo de territorios; facciones con pesos y medias; elecciones; tutorial por acciones; 63 imágenes; capas del mapa; Gaceta | Turno semanal (pasa a mensual); escala de juguete (pasa a M€ reales); 11 corredores como toda la red (pasan a líneas MD sobre tramos reales); estado escalar por corredor (pasa a tramos); 4 ofertas abstractas de tren (catálogo real); sucesos al azar del 20 %; ofertas de pacto al azar del 9 % (pasan a dispararse por situación); raíl de 11 páginas (7 verbos); «Lowgo» (se llama OuiOui); textos de etapa escondidos (van a la Agenda); la placa que no existía (se implementa en Atocha) |
| **Modo libre** | Caja elegible, rivales sí/no, sin fecha de fin, sin cese, partidas largas | Modo aparte y su botón (pasan a reglas de la partida nueva); el fallo de «Nueva partida» que arrancaba una campaña; 5.000 M€ con medallas (en Maqueta se apagan) |

---

## D8. Lo que se toma de Airport CEO (adaptado)

1. **Encargos con estrellas ligados a la calificación.**
   - Clientes: Ministerio (OSP), comunidades autónomas (servicios regionales), ayuntamientos y empresas (trenes de feria o de evento).
   - Un encargo de 4–5★ solo aparece si la **calificación media de 6 meses** es alta, paga más y castiga más: exige más puntualidad y la penalización es mayor. Hay dilema.
2. **Calificación de Tenfe en dos niveles.**
   - 4 notas: Puntualidad, Atención, Seguridad y Cuentas.
   - Cada nota tiene 3–4 subnotas y se muestran la nota del mes y la media de 6 meses.
   - Al pasar el ratón: «de qué depende» y «qué puedes hacer».
   - Abre estrellas de encargos, estrenos de fabricante y el Operador del Año.
3. **Renegociar con puntos y probabilidad visible, sin repetir hasta acertar.**
   - En pactos y encargos se gastan ★ como puntos de negociación y se ve el % de aceptación.
   - Como mucho **2 contraofertas**; después la otra parte se cierra y se enfada (Gobierno o su facción −).
   - Las rebajas propias se aceptan siempre.
   - Sustituye el «negociar» del Rescate y elimina el re-roll del clásico.
4. **Monitor de líneas** (Operaciones de Airport CEO), en Almanaque › Red: tabla con columnas de color (puntualidad, ocupación, margen, estado de material, incidencias del mes, rival), punto de semáforo por línea (como OpenTTD), orden por columna y clic que centra el mapa.
5. **Avisos por prioridad.**
   - Como mucho **3 críticos** fijados arriba de la Agenda; el resto, en la campana.
   - Cada aviso aparece **sobre el objeto en el mapa**, con la causa al pasar el ratón y la ficha al pulsar.
   - Siempre lleva verbo de arreglo. Los informes rutinarios, en una línea y desactivables.
6. **Diagnóstico de ruta** «¿Puede ir *este tren* de A a B?»: herramienta del mapa que pinta el camino en verde o el **primer tramo incompatible en rojo** con su motivo (ancho, tensión, sin catenaria, obra, capacidad) y la obra que lo arregla.
7. **Tutorial con lista de comprobación** que se marca sola desde el motor, con botón «¿Por qué no se marca?» (dice qué condición falta) y botón para saltar el paso. Se aplica a la induction y a `t-1`…`t-7`.
8. **Emergencias con informe que cuadra con la multa.** Tras un incidente grave (descarrilamiento por pruebas sobornadas, choque en un paso a nivel), inspección de la AESF con nota en letra y multa. El informe dice **exactamente** lo que el motor cobra, que era la queja nº 1 de Airport CEO.
9. **Premio anual «Operador Ferroviario del Año»**: top 10 de operadores europeos parodiados con listón creciente. Da ★, Gobierno y Viajeros, y es el «benchmark caribeño» de Tropico en versión ferroviaria.
10. **Partida nueva con ficha de arranque**, dificultad, reglas libres por casillas con «seleccionar todo» y medallas apagadas en modo libre.
11. **Panel de gestión a la izquierda que ocupa ≤ 50 %** de la pantalla y deja el mapa siempre visible, con 2 niveles como máximo.
12. **Planos** (modo plano de construcción): una obra o línea se puede **guardar como plano** sin firmarla. Se ve discontinua en el mapa, con coste, plazo y efecto, y se pueden comparar 2–3 planos lado a lado (por ejemplo, «electrificar Teruel a 3 kV» frente a «a 25 kV + cambio de tensión en Sagunt») antes de encargar uno con una firma.
13. **Requisitos escritos debajo** de cada servicio u obra, y **botón apagado con el motivo y el remedio** cuando falta algo («Falta una cuadrilla libre · Contratar»), en vez de fallar en silencio.

---

## D9. Arquitectura de la interfaz

### D9.1 Reglas

- **Una zona, un trabajo** (Cities, Transport Fever 2), siempre en el mismo sitio:

  | Zona | Contenido |
  |---|---|
  | Arriba | estado y fecha |
  | Izquierda | Agenda (qué hacer) |
  | Derecha | ficha del objeto pulsado |
  | Abajo, centro | verbos |
  | Abajo, derecha | tiempo |
  | Esquina superior izquierda del mapa | capas |

- **Niveles:**
  - nivel 0: mapa y HUD;
  - nivel 1: **panel de verbo** (hoja izquierda ≤ 50 %) o **ficha** (derecha);
  - nivel 2: **planificador** o **escena** (modal centrado).
  - Nunca hay un tercero. Las pestañas dentro de un nivel no cuentan, pero son 4 como mucho.
- **Sin cajas dentro de cajas:** filas separadas por filetes, no tarjetas dentro de tarjetas. Un solo color de acento (rojo vino Tenfe) y semáforo verde/ámbar/rojo para estados.
- **Un solo lenguaje visual:** mapa ilustrado clásico + HUD de pizarra opaca (se dejan los vidrios con desenfoque del Rescate).
- **Un solo despachador de clics** por la raíz del juego (`data-t`), sin escuchas sueltas en el documento. Se acaba el riesgo de que un botón del Rescate dispare una acción clásica. Las recetas de `sfx.js` cubren `data-t`, y `test.mjs` §11 se amplía.
- **«¿Por qué?» en cada número:** al pasar el ratón (o con pulsación larga en el móvil) se ve el desglose calculado con **la misma función** que dio el número. Por ejemplo, puntualidad 64 % = vía −14 · flota −6 · obra por fases −9 · congestión −4.
- **Sin callejones sin salida:** todo lo bloqueado se ve con candado, el motivo y el remedio, con un enlace que lleva a él («Hito 4 · Ir a Progreso», «Falta catenaria en Talavera–Plasencia · Ver obra»).
- **Móvil (390 px):**
  - los verbos van en una barra inferior con nombre (nunca iconos sin rótulo);
  - la Agenda se pliega en la línea «Ahora»;
  - la ficha sale como hoja inferior;
  - las etiquetas del mapa se ocultan si se pisan;
  - no hay desplazamiento horizontal (prueba de interfaz).

### D9.2 Presupuesto de texto

| Elemento | Máximo |
|---|---|
| Etiqueta o botón | 2 palabras |
| Nombre de verbo | 1 palabra |
| Fila de dato | número + unidad + 1 palabra |
| Frase de aviso o contexto | 1 línea, ≤ 80 caracteres |
| Detalle de opción | 1 línea calculada («−12 M€ · +1 salida en Madrid–Gijón») |
| Explicaciones | solo al pasar el ratón («¿Por qué?») o en el Almanaque, ≤ 2 líneas |
| Diálogo | la toma (grabada) + 1 línea de contexto sin voz + opciones |

No hay párrafos en los paneles. Los números van antes que las palabras, y los iconos solo acompañan al texto, nunca lo sustituyen.

### D9.3 Lo que siempre está en el HUD

- **Fecha** (mes y año) y firmas que quedan (●●○).
- **Caja** con el resultado del mes (clic: Dinero).
- **Viajeros/mes** con su tendencia.
- **Puntualidad** media.
- **Apoyo:** previsión electoral frente a 50 y meses que faltan.
- **★** capital político.
- **Campana** de avisos con contador.
- Menú.

### D9.4 Al pulsar objetos del mapa (ficha derecha, 3 pestañas como máximo)

| Objeto | Contenido | Acciones |
|---|---|---|
| Ciudad o estación | skyline por hora (clásico), líneas, nivel, personal, petición | Nueva línea desde aquí · Mejorar estación · Personal |
| Línea | puntualidad, ocupación, margen, unidades, ± frecuencia y tarifa, **franja de ruta** y «Qué puede circular», 3 causas | Ajustar · Comprar trenes (Trenespop filtrado) · Cerrar |
| Tramo | ancho, tensión, vmax, vías, estado y LTV, capacidad usada, líneas que lo usan, riesgos | Obras posibles (coste y meses) · Diagnóstico |
| Tren | chips, estado, edad, línea, averías, «avisado por Fermín» | Revisión · Reasignar · Vender |
| Obra | fases, meses, pagado, modo | Acelerar · Cancelar |
| Cambiador | anchos, líneas que cambian | — |
| Icono de aviso | abre la ficha de su objeto con la fila del aviso resaltada | según el aviso |

### D9.5 Cómo sabe el jugador qué hacer

- **La Agenda** (columna izquierda) tiene como primera tarjeta **«Ahora»**, calculada así:
  1. una escena con opciones pendiente;
  2. un ultimátum o plazo de ≤ 1 mes;
  3. un objetivo del acto que va mal, con su acción;
  4. el peor obstáculo (`obstacles` del Rescate), con verbo de arreglo;
  5. si sobran firmas y caja, una sugerencia.
- Debajo, como mucho 5 tarjetas: objetivos del acto con barra y plazo, peticiones de facción, promesas con plazo, encargos y **Calendario** (próximos sucesos anunciados).
- **Avisos:** críticos fijados en la Agenda y sobre el mapa; el resto en la campana.
- **Informe del mes:** es la única pantalla obligatoria después de cerrar (ver D9.6, panel D).

### D9.6 Esquemas

**Pantalla principal**
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ TENFE  Marzo 2023 ●●○ │ 412 M€ +6/mes │ 1,92 M viaj ▲ │ 87 % │ Apoyo 51 % · Elecc. jul │ ★34 │ 🔔3 ☰│
├──────────────────┬──────────────────────────────────────────────────────┬──────────────────┤
│ AGENDA           │ [Capas ▾ Puntualidad]                                │ LÍNEA            │
│ AHORA            │                                                      │ Madrid–Salamanca │
│  Norte 64 %  →   │                    ·  León                           │ Alvia · S130 ×2  │
│  Renovar Ávila–  │          Valladolid ●━━━━━╸                          │ 91 % · 78 % · +2 │
│  Medina  [Ir]    │                 ╱                                    │ ───────────────  │
│ ACTO 1 · 9 meses │        Salamanca ●      ● Madrid                     │ Frec. 4  [−][+]  │
│  Servicios 9/12 ▮│                                                      │ Tarifa 32€ [−][+]│
│  Peticiones 1/2 ▮│      ⚠ Robo de cable                                 │ ▓▓▓▓▓░▓▓  ruta   │
│ FERMÍN · taller  │        Alcázar–Linares                               │ Qué puede circ.  │
│  Revisar Pucela  │                                                      │ [Ajustar][Trenes]│
│ PROMESA · Teruel │                                                      │                  │
│  catenaria 7 m   │                                                      │                  │
├──────────────────┴──────────────────────────────────────────────────────┴──────────────────┤
│ Líneas · Obras · Flota · Dinero · Política · Progreso · Almanaque │ [Vivir un día] [Cerrar mes ▸] │
│ Gaceta: «Autocares Meseta anuncia billetes a 5 € desde septiembre»                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**A · Nueva partida**
```
┌─ Nueva partida ──────────────────────────────────────────────────────────────┐
│  ARRANQUE                                                                  │
│  ▣ 2022 · La herencia     ▢ 2027 · El rescate        ▢ Maqueta             │
│    500 M€ · 80 trenes       60 M€ · deuda 1.200 M€     reglas libres        │
│    AVE y Alvia · elecc. 23-7-2023   Media Distancia rota                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Semilla  [ TERUEL-4417 ] [🎲]     Código  IF5-H-N-TERUEL-4417  [Copiar]     │
│  Rasgo    ‹ Ferroviario de carrera ›   Plantilla +10 · Gobierno −5          │
│  Dificultad  Fácil  [Normal]  Difícil  Infernal          ×1,0 puntos        │
│  Modificadores  [+ Austeridad]  [+ …]                    (0–3)              │
│  Reglas libres ▸  (cualquier casilla = Maqueta, sin medallas)               │
│  Retos  ◐ Teruel con catenaria · ◐ Vencer a OuiOui · ◐ Cero sobres          │
│                                        [Primer mes guiado ✓]  [Empezar ▸]   │
└────────────────────────────────────────────────────────────────────────────┘
```

**B · Trenespop abierto desde una línea**
```
┌─ Trenespop · para Madrid–Badajoz · IB · diésel 268 km + 25 kV 209 km · 155 km/h ──────────┐
│ Filtros            │  ✓ Puede  ◐ Con cambio  ✗ No puede        Orden: €/plaza ▾        │
│ Tracción  ▣ Todas  │ ─────────────────────────────────────────────────────────────────── │
│ Ancho     ▣ Todos  │ ✓ S730  Tardo  VAR·BIMODO·2T  180/250  262 pl  30 M€  31 m  ★★★★    │
│ Segmento  ▢ AV     │ ✓ Dörfler BMU  IB·BIMODO·2T  140/160   204 pl   9 M€  20 m  ★★★★★   │
│ Fabricante ▾       │ ✓ 599  KAFKA usado 71 %  IB·DSL  160    181 pl   3 M€  ya   ★★★     │
│ Estado  nuevo/usado│ ✗ 480 Civity  IB·3/25 kV  — sin catenaria Madrid–Plasencia         │
│ ▢ Ver los que no   │      → Electrificar Madrid–Talavera–Plasencia · 118 M€ · 39 m [Ver]│
├────────────────────┴───────────────────────────────────────────────────────────────────┤
│ Dörfler BMU · Bimodo ibérico   ▓▓▓▓▓▓▓▓▓░░░░ franja: diésel ▒ 25 kV ▓                │
│ Madrid 2 h 58 · cuello: Talavera–Plasencia 140 · «Uno más: +1.900 viaj/mes · +0,4 M€» │
│ Cantidad [2]  Anticipo 30 % 5,4 M€ · llegan nov 2025 y dic 2025   [Comprar · 1 firma]  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**C · Planificador de obra** (nivel 2)
```
┌─ Obra · Ávila–Medina (86 km · IB · 3 kV · 150 · doble · estado 31 % LTV 60) ───────────┐
│ Tipo   [Renovar] Electrificar 25 kV  Bloqueo  Duplicar✗(ya doble)  Ancho std         │
│ Fases  ▓ permisos 1 m ▓▓▓▓▓▓ obra 5 m ▓ pruebas 1 m                                   │
│ Servicio  ( ) Por fases 10 m · 78 %   (•) Autobuses 7 m · 55 % · 2,1 M€   ( ) Corte 6 m │
│ ─────────────────────────────────────────────────────────────────────────────────── │
│ 23,5 M€   1 cuadrilla   En servicio: oct 2027   Puntualidad Norte 64 → 86 %           │
│ Afecta: Norte · Madrid–León MD                     Ayuda FEDER +12 M€ al certificar     │
│ Riesgo de retraso: bajo        Charo: «Caja prevista mínima 31 M€ en julio» ✓          │
│                                                    [Cancelar]  [Aprobar · 1 firma]     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**D · Informe del mes** (tras cerrar)
```
┌─ Marzo de 2023 ────────────────────────────────────────────────────────── [Seguir ▸] ┐
│ Caja 412 M€  +6,1   Ingresos 31,4 · Costes 28,9 · OSP +3,6   Viajeros 1,92 M ▲4 %     │
│ ─────────────────────────────────────────────────────────────────────────────────── │
│ ● Madrid–Barcelona 96 %  +4,2   ● Madrid–Málaga 93 % +2,1   ● Madrid–Badajoz 61 % −0,8 │
│ PASÓ         Robo de cable Alcázar–Linares (3 días) · Sur −6 puntos                   │
│              S106: llegan 2 unidades · Obra Torralba–Soria: fase 2/3                   │
│ TUS DECISIONES  Campaña Burgos: +9 % (quedan 2 meses)                                  │
│              Pucela averiado en la Rampa — Fermín te avisó en enero                    │
│ FACCIONES    Viajeros 48 ▼3   Territorio 41 ▲2   Plantilla 62   Hacienda 55   Gob. 58  │
│ VIENE        Elecciones en 4 meses (51 %) · Huelga convocada el 12 de mayo            │
│ Gaceta       «Burgos estrena AVE y el alcalde estrena corbata»                         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**E · Política** (nivel 1, pestañas: Facciones · Peticiones · Elecciones · Pactos · Directrices)
```
┌─ Política · Facciones ───────────────────────────────────────────────┐
│ [Marisa]  Viajeros    48 ▼  ▮▮▮▮▮▯▯▯▯▯  quiere: puntualidad de su línea │
│           causas: Norte 64 % −9 · tarifas +4 · plazas −2       [Ver]   │
│ [Paco]    Territorio  41 ▲  ▮▮▮▮▯▯▯▯▯▯  quiere: estación en Villanueva  │
│           ⚠ ULTIMÁTUM 2 meses → moción en el Congreso (OSP −15 %)      │
│ [Fermín]  Plantilla   62    ▮▮▮▮▮▮▯▯▯▯  quiere: ?  (Audiencia 3 ★)     │
│ [Charo]   Hacienda    55    ▮▮▮▮▮▯▯▯▯▯  quiere: resultado ≥ 0          │
│ [Pedro]   Gobierno    58    ▮▮▮▮▮▮▯▯▯▯  ministro: Óscar del Puente     │
│ ──────────────────────────────────────────────────────────────────── │
│ Elecciones 23-7-2023 · previsión 51,2 % (facciones 49 + viento +2,2)  │
│ [Audiencia · 3 ★]   [Preparar mitin ▸]   [Estatuto ▸]                 │
└──────────────────────────────────────────────────────────────────────┘
```

**F · Escena (petición doble)** (nivel 2)
```
┌─ Petición doble · El turno imposible ─────────────────────────────────────────┐
│ [retrato Fermín, enfadado] «¡Ese cacharro no sale del taller…! Necesito manos   │
│                            en el turno de noche…»                    ▶ escuchar │
│ [retrato Charo, preocupada] «He visto la caja… Las horas extra no se pagan      │
│                            con entusiasmo…»                          ▶ escuchar │
│ Contexto: 599 «Pucela» en taller · Norte sin reserva · faltan 6 maquinistas     │
│ ───────────────────────────────────────────────────────────────────────────── │
│ [Pagar refuerzos]   −0,6 M€ · cubre 1 mes · Fermín +5 · Charo −3               │
│ [Ajustar turnos]    se cancelan 4 trenes/día en Levante · Charo +5 · Fermín −3 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### D9.7 Mapa de pantallas (2 niveles como máximo)

| Verbo (nivel 1) | Pestañas | Nivel 2 |
|---|---|---|
| **Líneas** | Mis líneas (monitor) · Posibles | Planificador de línea / Nueva línea |
| **Obras** | En marcha · Posibles (por tramo) · Planos · Megaobras · Cuadrillas | Planificador de obra / etapa |
| **Flota** | Parque · Trenespop · Pedidos · Taller | Ficha de anuncio y compra |
| **Dinero** | Resultado (por línea y por causa, 3 periodos) · Caja prevista (12 meses y pagos) · Crédito · Presupuestos (mantenimiento y vía, 50–150 % con antes → después) | Confirmar préstamo |
| **Política** | Facciones (y poderes) · Peticiones · Elecciones · Pactos · Directrices (y Estatuto) | Mitin / propuesta de pacto / negociación / cambio de Estatuto |
| **Progreso** | Acto · Hitos · Investigación · Medallas | Elegir paquete de hito |
| **Almanaque** | Resumen (peor indicador primero, calificación de Tenfe) · Red (monitor completo) · Apoyo (tres partes de la previsión) · Historia (Gaceta, decisiones, diálogos oídos con «escuchar») | — |
| **Cloacas** (aparece con la primera propuesta; nunca con Transparencia «portal abierto») | Caja B · Causa · Secretos | Soborno |
| Capas (desplegable sobre el mapa) | Red · Puntualidad · Ocupación · Estado de vía · Velocidad · Tensión · Ancho · Vías · Obras · Apoyo territorial · Riesgos · Compatibilidad | — (se encienden solas al abrir Obras o Trenespop, como en CS2) |

---

## D10. Plan de implementación por fases

Cada fase se puede jugar y probar por separado, y se publica entera: build, pruebas, commit en `main`, Pages y `verify-pages`, con `release.json` y versiones al día (R7).

**F0 · Publicar lo que hay** (tamaño mínimo, antes de F1)
- Rebuild para corregir `release.json` (63 fotos del Rescate sin registrar) y subir la carpeta `investigacion/modo-unico/`.
- Hace lo que pide el usuario ahora mismo («sube lo que tengas»).

**F1 · Una sola partida** (pequeña-media, unas 1.500 líneas)
- **Visible:** un único «Nueva partida» con arranques (2022, Maqueta y 2027 «versión anterior», con el motor del Rescate hasta F7), semilla y código, reglas libres (absorbe el modo libre), **informe del mes**, guardado `iberia-ferroviaria-v5` (la v4 se migra; las claves viejas no se borran) y botón «Partidas anteriores».
- **Arreglos rápidos de verdad:**
  - peticiones que pagan tras 3 meses;
  - primer encargo sobre la base de viajeros;
  - apuestas con semilla fija (sin re-roll);
  - sin bloqueo en `event:freeze`;
  - huelga con servicios mínimos reales;
  - wifi que enciende la directriz;
  - autobús que baja tarifas de verdad.
- **Archivos nuevos:** `partida.js` (arranques, opciones, código, migración), `nueva-partida-ui.js`, `informe.js`.
- **Archivos tocados:** `main-menu.js` (se mantiene el ancla «¿Adónde vamos?»), `app.js` (se mantiene el aviso de voz), `engine.js` (`validateSave` v5 y arreglos), `tycoon.js` (`freeGame` → opciones), `sfx.js`, `extract-game-source.mjs` (módulos nuevos).
- **Pruebas:** nueva `partida-test.mjs` (opciones → estado, código de ida y vuelta, migración v4 sin pérdidas); adaptar `rescate-ui-test` (sin botón `begin`), `onboarding-ui-test` (título), `gameplay-ui-test` (opciones), `test.mjs` §11 (sfx).
- **Voces:** 0.

**F2 · Interfaz nueva y red real** (grande, unas 4.000 líneas)
- **Visible:** HUD nuevo (barra, Agenda, verbos, ficha derecha, capas), tramos reales con tensión y vía única, estado de vía con LTV, capacidad compartida, compatibilidad por tensión, **Trenespop con ✓◐✗ y franja de ruta**, catálogo real de trenes, obras nuevas con modos de servicio, herramienta de líneas, **traspaso de la Media Distancia** (enero de 2024).
- **Archivos nuevos:** `assets/tramos-reales.js`, `trenes.js`, `red.js` (compatibilidad, tiempo y capacidad), `tenfe-ui.js` (shell, `data-t`), `ui-lineas.js`, `ui-obras.js`, `ui-flota.js`, `ui-dinero.js`, `tenfe.css` (añadir a la lista de CSS del extractor).
- **Archivos tocados:** `infra.js` (perfil nuevo; las salidas antiguas se mantienen para 129 casos), `engine.js`, `marketplace.js` (parametrizado; el HTML clásico no cambia), `map-v3.js` (capas).
- **Pruebas:** nueva `red-test.mjs` (los 129 casos de `plan()` más tensión, diésel, bimodo, 3 → 25 kV, LTV, capacidad); adaptar `marketplace-test` y `test.mjs` (fuera «solo AVE y Alvia»; Pajares y Burgos en fecha; Torralba–Soria 44/21).
- **Voces:** 0 (el traspaso se muestra en texto hasta F4).

**F3 · Lo que se dice, pasa** (grande, unas 3.500 líneas)
- **Visible:** las escenas nombran su tren, tramo o estación; las opciones dicen lo que hacen y dejan marca; promesas en la Agenda; peticiones dobles; los 315 encuentros elegidos por estado.
- **Archivos nuevos:** `hechos.js`, `guion.js`, `efectos.js`, `compromisos.js`.
- **Mecánicas que exige:** bolsa de maquinistas con jubilaciones, taller con huecos, revisiones dirigidas, personal de estación, campañas de tarifa, pilotos, promociones de YaIré, campañas del autobús, calendario de ministros, registro de sucesos, riesgo de sucesos por tramo con capa «Riesgos».
- **Archivos tocados:** solo campos fuera del catálogo de `story.js`, `encounters.js` y `tycoon.js` (disparadores, títulos, opciones, efectos); `engine.pendingDecision` delega en `guion`.
- **Pruebas:** nueva `verdad-test.mjs`:
  - alcance de cada fuente no retirada con estados de guion;
  - cifras grabadas = motor;
  - ninguna opción sin efecto;
  - revalidación al cargar.
  
  Se adapta `tycoon-test` (integridad de ENCOUNTERS).
- **Voces:** 0 (usa las 412).

**F4 · Facciones, elecciones y pactos** (grande, unas 3.000 líneas)
- **Visible:** panel Política, líderes con obsesión, peticiones unificadas, ultimátums, Audiencia, Consejo de Ministros trimestral, elecciones (2023 real + cada 4 años + anticipadas), mitin, remodelación, Estatuto, directrices con niveles, pactos con negociación por puntos (Airport CEO), Operador del Año.
- **Archivos nuevos:** `politica.js` y `pactos.js` (portados de `rescate.js` y reescalados), `ui-politica.js`.
- **Pruebas:** nuevas `politica-test.mjs` (previsión = fórmula; ultimátum → castigo; condiciones del pacto mostradas = aplicadas; no se negocia 3 veces).
- **Voces:** política 15 + pactos 27 = **42**.

**F5 · Progreso** (media, unas 2.000 líneas)
- **Visible:** hitos con paquetes a elegir, árbol de investigación unificado (6 clásicas con su coste grabado + 18 del Rescate reescaladas), megaobras (6 del Rescate + proyectos AV en 5 etapas), medallas y retos, firmas que crecen.
- **Archivos nuevos:** `progreso.js`, `ui-progreso.js`.
- **Pruebas:** `progreso-test.mjs` (no se pueden inflar hitos; cancelar resta; requisitos de etapa).
- **Voces:** **15**.

**F6 · Cloacas, Gaceta y sucesos con sitio** (media, unas 2.000 líneas)
- **Visible:**
  - cloacas con libro de secretos (cada secreto tiene tipo, contrato, testigos; solo extorsiona un testigo de ese secreto);
  - fases judiciales con su aviso;
  - Íñigo como conseguidor;
  - Transparencia «portal abierto»;
  - Gaceta y teletipo generados solo con hechos;
  - calendario de sucesos anunciados;
  - emergencias con multa = informe;
  - sucesos nuevos con nombre.
- **Archivos nuevos:** `cloacas.js`, `gaceta.js`, `sucesos.js`.
- **Pruebas:** `cloacas-test.mjs` (procedencia de los secretos, un secreto no sale dos veces) y `gaceta-test.mjs` (cada titular con predicado cierto).
- **Voces:** cloacas 26 + sucesos 8 + finanzas 4 = **38**.

**F7 · Arranque 2027: el rescate dentro del juego único** (media-grande, unas 2.500 líneas)
- **Visible:** el arranque 2027 corre en el motor único: solo Media Distancia, la AV de OuiOui, mandato de Hacienda, etapas s1–s5, tutorial `t-1`…`t-7` con lista y el Norte que parpadea de verdad. Se migran las partidas `tenfe-rescate-v1` con una función pura (corredores → líneas; grupos, pactos y cloacas se conservan). El motor viejo del Rescate sale del menú, pero sus módulos siguen para el build.
- **Pruebas:** `rescate-test.mjs` pasa a ser la prueba del arranque 2027 en el motor único (bot de 6 semillas; s1 siempre aprobada); `rescate-ui-test.mjs` pasa a ser la prueba de interfaz del juego único (390 px sin desplazamiento horizontal).
- **Voces:** **17**.

**F8 · Sin fin, dificultad y pulido** (media, unas 1.500 líneas)
- Modo sin fin y Retos de legado, presets de dificultad, modificadores y rasgos finales, reto mensual.
- Auditoría del presupuesto de texto en todas las pantallas y GTFS de Media Distancia (si cabe).
- Títulos del auditorio con el contexto de cada toma (`412/412 + N/112`).
- Documentación (README, PUBLICACION) y versión 5.0.0 en `build-web.mjs`, `main-menu.js` y `package.json`.
- **Pruebas:** `bot-test.mjs` (Herencia 2022–2050 y 2027–2034, varias semillas y dificultades; gana un bot competente y pierde un bot pasivo); `ui-test` del juego único; `verify-pages`.
- **Voces:** variantes, hasta 30.

**Lo que se reutiliza en todas:** `infra.plan`, `metrics` y `balance` clásicos, `operations.js` (día y sol), `schedule.js` (GTFS), `map-v3.js` y `rescate-map.js` (capas), contratos de `tycoon.js`, funciones puras de `rescate.js` (presupuestos, pactos, elecciones, megaobras, cloacas), `marketplace.js` (vistas), `faces.js`, `city-art.js`, `dialogue-presentation.js`, `Voices`. Las tomas del Rescate pasan por `Voices.speak` indexadas por `clipId(person, text)`: un solo reproductor, con atenuación de la música y subtítulos.

---

## Anexo A · Partida tipo (Herencia, Normal)

| Fecha | Qué pasa |
|---|---|
| Ene 2022 | Primer mes guiado (induction 50 tomas). Raquel pregunta qué proteges (Estatuto · Misión). Abres Madrid–Salamanca con un S130 por Medina. |
| Mar 2022 | Crisis de energía (decisión `energy`): cobertura o riesgo. |
| Jul 2022 | Abre la LAV de Burgos el día 21 y la toma suena al cierre de julio. |
| Sep 2022 | Bonos estatales: +15 % de demanda pase lo que pase; ¿plan de refuerzo? |
| Nov 2022 | Entra YaIré en Madrid–Barcelona. |
| Feb 2023 | Fermín (obsesión «Taller») pide revisar un S100 viejo; Charo, que no. Petición doble. |
| Jul 2023 | Elecciones generales; el mitin promete «catenaria en Soria». |
| Nov 2023 | Óscar, ministro. Pajares. |
| Ene 2024 | Te traspasan la Media Distancia: diésel, 3 kV, vía única, OSP. La línea de Marisa es la Norte (sorteada). |
| 2024–2027 | Acto 2: cambiadores, competencia, primer ultimátum de Territorio. |
| Jul 2027 | Elecciones; remodelación: eliges a Raquel (inauguraciones) y el acto Mediterráneo abre con su variante. |
| … | Hitos 4/7/10 con paquetes, megaobras, Operador del Año, crisis de fábricas en 2041, legado en 2047. |
| 2050 | Veredicto y «Seguir gobernando». |

## Anexo B · Pruebas de verdad que vigilan el diseño

1. **Alcance:** cada fuente no retirada se dispara en algún estado de guion, y cada `(person, text)` mostrado tiene toma o está marcado como pendiente.
2. **Cifras:** cada número de una toma grabada es igual al valor del motor en el momento de sonar (4 M€; 0,3 M€ y 3 meses; 10 M€ y 4 meses; 35 M€ y 12 meses; 18.000 € y ×0,3; 9.000 €; 44 M€ y 21 meses; 18, 26 y +25 %; −40 % durante 24 meses).
3. **Sin opciones vacías:** cada opción cambia el estado o el libro de promesas.
4. **Revalidación:** una partida guardada con una escena que ya no es cierta la descarta al cargar.
5. **Hablantes:** ningún ministro habla fuera de su mandato, y nadie cesado habla en su cargo antiguo.
6. **Titulares:** cada titular de la Gaceta tiene su predicado cierto en el mes en que sale.
