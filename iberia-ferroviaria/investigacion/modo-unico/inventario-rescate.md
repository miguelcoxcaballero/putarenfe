# Inventario de «Rescate de Tenfe» 4.0

Rutas relativas a `/home/user/putarenfe/iberia-ferroviaria/proyecto/`. Formato de cita: `archivo:línea`. Dinero en M€, viajeros en miles por semana.
Archivos leídos enteros: `dist/rescate-data.js` (529 líneas), `dist/rescate.js` (1358), `dist/rescate-ui.js` (566), `dist/rescate-map.js` (254), `dist/rescate.css` (280), `rescate-test.mjs`, `rescate-ui-test.mjs` y `../docs/RESCATE.md`.
Comprobaciones hechas: `node rescate-test.mjs` (pasa; 4 de 6 semillas ganan), simulaciones propias con el motor y capturas nuevas con Chromium. Los scripts están en `scratchpad/unify/tools/` y las capturas en `scratchpad/unify/cur-*.png`. No he tocado nada del repositorio.

---

## 0. Resumen en diez líneas

1. El motor (`rescate.js`) es puro, determinista (la semilla del azar va en el estado) y está probado con un bot que juega 8 años con órdenes legales. Es la mejor base para el modo único.
2. El bucle es semanal: planificas con el tiempo parado (3 órdenes), cierras la semana o avanzas hasta la próxima decisión (máximo 13 semanas).
3. La interfaz responde siempre a tres preguntas. Qué debo conseguir: panel Misión. Qué me lo impide: obstáculos vivos, cada uno lleva a su acción. Qué puedo hacer: ficha del corredor y planificadores con presupuesto previo.
4. Antes de aprobar se ve la consecuencia calculada con la misma regla que usa el motor (`punctProjection`, `workQuote`, `serviceQuote`, `cashProjection`). Esto es lo más valioso para «que lo que se dice, pase».
5. Hay unas 25 incoherencias concretas: un diálogo o una opción anuncia algo que el motor no hace, o lo hace distinto (§E.1). Ejemplos: «+2 % de nómina» no cuesta nada; «el BCBB no circula en Cantabria» no se aplica; la etapa 3 del Centro de Control no da nada; «tus obras irán más lentas» en realidad resta 3 puntos de vía; el «no» de cualquier negociación lo dice Íñigo.
6. Mucho azar sin causa: el 20 % de las semanas hay un suceso; la avería es el más frecuente (unas 3,5 al año) y no depende del estado de la flota. Además el informe semanal (averías, pruebas fallidas, obras paradas, subvención recortada) **no se enseña**: solo sale un aviso «Semana N · ±X».
7. Ancho, tensión y velocidad son **solo cosméticos**: el motor usa un booleano `elec` por corredor. Las capas del mapa sacan los tramos de `infra.js`, con tres errores: Norte Palencia–León y Sur Córdoba–Sevilla por la LAV (ancho estándar, 25 kV) y Asturias por la Variante de Pajares en lugar de la Rampa.
8. Los km de los datos no coinciden con los reales: Norte 345 frente a 421, Levante 390 frente a 487, Sur 470 frente a 571. Los costes de obra, canon y vía dependen de esos km.
9. Voces: solo hay **3 de 70** diálogos del rescate grabados (`t-1`, `t-2`, `paco-estacion`). Reescribir los otros 67 no tira ninguna grabación.
10. La interfaz es un HUD de vidrio oscuro con 11 páginas en el raíl, 8 capas y hojas llenas de teselas (cajas dentro de cajas). Está bien resuelta, pero choca con el «minimalista, sin cajas dentro de cajas» que se pide.

---

## A. Bucle semanal, órdenes, avance y paradas

### A.1 Calendario
- 416 semanas, del 4 de enero de 2027 a 2034 (`rescate-data.js:6-7`, `rescate.js:16`). Elecciones en las semanas 208 y 416 (`rescate-data.js:8`). El trimestre acaba cuando `week % 13 === 0` (`rescate.js:35`).
- Cinco etapas: s1 de la semana 1 a la 13, s2 de la 14 a la 52, s3 de la 53 a la 208, s4 de la 209 a la 312 y s5 de la 313 a la 416 (`rescate-data.js:252-273`).

### A.2 Planificar: 3 órdenes por semana
`ORDERS_PER_WEEK = 3` (`rescate-data.js:9`). `needOrder` lanza «Ya has dado las tres órdenes…» (`rescate.js:284-288`).

| Gasta orden | Función |
|---|---|
| obra | `startWork` 345, `accelerateWork` 380, `resumeWork` 393, `cancelWork` 408, `buildStation` 612, `startMegaStage` 743 |
| servicio | `reorganize` 434, `openCorridor` 457, `sendRevision` 470 |
| capacidad | `hireCrew` 486, `fireCrew` 495, `rentTrain` 502 |
| compra | `buyTrain` 516 |
| acuerdo | `takeLoan` 550, `licenseTerritory` 561, aceptar o negociar un pacto (`respondPact` 576-593) |

**Gratis:**
- investigar tecnología (`research` 701-708);
- sobornos (`bribe` 769-793, no llama a `needOrder`);
- deslizadores de presupuesto (`rescate-ui.js:543`);
- responder decisiones (`answer` 933);
- rechazar un pacto (580);
- todas las consultas (`*Quote`, `*State`, `serviceForecast`…).

### A.3 Cerrar la semana: `closeWeek` (`rescate.js:1164-1310`), en orden
0. Se niega a cerrar con un impago o una decisión pendientes (1165-1167). Borra los avisos ya leídos (1168).
1. **Llegadas** (1172-1186):
   - trenes pedidos (estado ≥40 %); trenes de revisión (95 %) o de avería (≥60 %), que vuelven a su corredor si caben;
   - devolución de trenes alquilados;
   - cuadrillas contratadas;
   - obras en `commissioning`, a las que se aplica `applyWork`;
   - se liberan la cuadrilla del desprendimiento y los cortes que vencen.
2. **Operación** (1189-1199):
   - incidencia de la semana: `incidentNow` + 10 si `incidentWeeks`;
   - `operate()`; con huelga, ingresos y viajeros ×0,4;
   - historial de puntualidad y racha ≥85 %;
   - desgaste de vía (§B.2).
3. **Desgaste y averías aleatorias** de trenes (1201-1205): dos semanas en el taller. Solo se apunta en `report.events`.
4. **Obras** (1207-1223):
   - pago semanal; si no hay caja, la obra se para;
   - fases;
   - 12 % de que fallen las pruebas una vez (1215);
   - el soborno al inspector salta las pruebas (1214);
   - +3 ★ por obra con «Inauguraciones» (1220).
5. **Megaproyectos** (1224-1241): pago `cost/weeks`; al terminar la etapa se aplican recompensa, sospecha y `corridorMods`.
6. **Cuentas** (1243-1263):
   - caja += billetes − costes;
   - al cerrar trimestre, subvención OSP e incumplimiento leve si hay esenciales mal (1245-1251);
   - pagos programados; impago en s1 → `flags.defaulted` (1253); la deuda baja un 80 % de cada plazo pagado (1256);
   - ayudas condicionadas (1261-1263).
7. **Grupos y popularidad** (1265-1272):
   - `updateGroups`;
   - ★ semanales: +2 con apoyo ≥62, +1 con apoyo ≥48;
   - +1 ★ si «Influencers» y la puntualidad media ≥80;
   - `updatePacts`; caducan ofertas; `offerPacts`;
   - apeadero de Paco.
8. **Sucesos y justicia** (1274-1280):
   - racha de semanas sin incidencias;
   - `judicialWeek`;
   - **un solo** suceso por semana: `randomEvent || offerCorruption || extortion`;
   - semana 208: entra Lowgo.
9. **Registro** (1282-1289): `record`, hitos, programa, revisiones políticas en las semanas 182 y 390, evaluación de etapa, elecciones.
10. **Caja negativa** (1291-1296): `negativeWeeks++`; a la 4.ª seguida, quiebra; si no, decisión de impago.
11. Titular de la Gaceta (1298-1301). Final en la semana 416 (1302-1305). `week++`, órdenes a 0, `stopReasons` (1306-1309).

### A.4 Avanzar hasta la próxima decisión
`advance(s, max = 13)` (`rescate.js:1338-1345`) cierra semanas hasta que `stopReasons` devuelve algo (`1320-1336`):

| Motivo | Condición |
|---|---|
| Fin de la partida | `s.ended` |
| Decisión pendiente | `s.decisions.length` |
| Propuesta de pacto | oferta nacida en la semana anterior |
| Obra terminada | `report.finished` |
| Llegada de material o cuadrillas | `report.arrived` |
| Hito alcanzado | `report.milestone` |
| Plazo de la misión | ≤2 semanas para el fin de etapa |
| Vence un pacto | ≤2 semanas |
| Elecciones cerca | ≤4 semanas |
| La caja no llega al próximo pago | caja − pagos de esta semana < 0 |
| Cuadrillas libres | no hay obras activas y algo ha terminado |

Simulación propia, semilla 5, 209 semanas: 71 llamadas a avanzar, una media de **2,9 semanas por avance**. Paradas: decisión ×45, pacto ×23, plazo ×9, elecciones ×5. El avance rara vez llega a 13 semanas.

### A.5 Decisiones (modales en cola)
- `s.decisions` con `kind`: event, corruption, extortion, scandal, insolvency, notice, stage, stage-intro, milestone, election, review, mega.
- La interfaz las enseña una a una (`rescate-ui.js:380-393`). Al cerrar el modal, salta la siguiente (`100`).
- Solo bloquean el cierre las que tienen `choices`.
- En la semana 208 se juntan resultado de etapa s3, intro de s4, elecciones y aviso de Lowgo: cuatro modales seguidos (1279, 1288-1289).

---

## B. Sistemas con sus números

### B.1 Estado inicial (`newGame`, `rescate.js:39-70`)
- Caja 12, ★ 6, deuda heredada 18 al 4,5 % anual (`DEBT_RATE`, 11).
- Pagos fijos (43-47):
  - semana 5: 2,5 de facturas;
  - semana 9: 0,4 de seguro (solo el primer año, aunque se llame «anual»);
  - semana 13: 2,0;
  - semanas 26, 39 y 52: 1,0 cada una.
- Después de 2027 la deuda (unos 14 tras pagar el 80 % de cada plazo) **nunca se amortiza**: genera intereses para siempre.
- Grupos: viajeros 31, territorios 26, trabajadores 46, economía 39. Apoyo 35,1 %.
- 2 cuadrillas propias. Deslizadores al 100 %.
- Flota (63-65):
  - Pucela: kafka, 58 %, Norte;
  - La Abuela: used, 49 %, Norte;
  - Guadiana: kafka, 66 %, Levante;
  - Turia: kafka, 61 %, Sur.
- Semana 1, calculado: billetes 0,425/sem, OSP prorrateada 0,281/sem, costes 0,799/sem.
  - Desglose de costes: personal 0,390, energía 0,088, mantenimiento 0,048, infraestructura 0,241, intereses 0,016, indemnizaciones 0,017.
  - Resultado ordinario −0,093/sem. La caja real baja unos **0,37 por semana**, porque la OSP solo se cobra al cerrar trimestre.
- Caja prevista a 13 semanas: mínimo 4,61 en la semana 12.

### B.2 Operación de un corredor
**Constantes** (`rescate.js:9-15`):
- `OSP_BASE` 4,8/trimestre; `STAFF_BASE` 0,18/sem; `DEBT_RATE` 0,045.
- `TRAIN_RUN = {crew .03, energy .022, upkeep .012, idle .008}`.
- `CANON_KM = .00011`; `TRACK_KM = .00009`.
- `SEAT_TURNS = 14×1,8/1000 = 0,0252`: un tren de 290 plazas da 7,3 mil plazas/sem.
- `BASE_CAPACITY = 4` trenes sin atasco.

**Puntualidad objetivo** (`punctTarget`, 167-186): 97, a lo que se resta o suma:
- −(100 − vía)×0,5;
- −(100 − estado medio de los trenes)×0,12;
- −4 por cada tren por encima de la capacidad (4 + `c.capacity` + mod);
- −3 sin electrificar;
- −min(10, (carga − 1)×25) si la carga > 1,05;
- −9 con obra «por fases» en construcción;
- \+ señalización + mod `punct`;
- −incidencia;
- −1 con el apeadero de Villanueva en el Norte.

Se acota entre 25 y 98,5. Cada semana la puntualidad real recorre el **38 %** de la distancia al objetivo (242). Con el corredor cortado o con autobuses se congela (239-243).

**Demanda** (`serviceForecast`, 188-213):
- `pot` = def.pot × (1 + potBonus + mod demand + mod madrid si pasa por Madrid).
- Ajustes: Norte ×1,08 si Asturias abierto con trenes; Norte ×1,03 con el apeadero; Soria y Teruel ×1,12 con el pacto de no agresión.
- `freq(n) = 1 − e^(−n/1,8)`.
- `uR = (fareRef/fare)^1,1 × freq(nR)`.
- `uX = 1,35 × (1,5·fareRef/fareX)^1,3 × freq(nX)`.
- `rel = clamp((punct/100)², .15, 1)`.
- `want = pot × rel × U/(U + .35) × (1 − rival) × demanda del modo de obra`.
- Viajeros = min(demanda, plazas × 0,0252). La cola es `lost`. El exprés quita viajeros al regional y esa canibalización se enseña.
- Ingresos = (paxR×fare + paxX×fareX)/1000 × (1 + mod yield).

**Cuota de Lowgo** (214-218): `theirs/(mine + theirs)`, como mucho 0,7, con `mine = rel × (fareRef/fare)^1,2 × (1 − e^(−(trenes + .5)/1,8))`.

**Coste semanal** (220-233):
- por tren: personal 0,03 + energía 0,022 × (1,5 sin catenaria × (1 + mod dieselEnergy)) + mantenimiento 0,012 × deslizador de flota;
- por corredor: canon km × 0,00011 y conservación km × 0,00009 × deslizador de vía;
- autobuses: 0,03 × km/300 por semana.

**Indemnizaciones** (249): `pax × max(0, 75 − punct)/100 × fare × 0,5 /1000`.

**Desgaste semanal:**
- vía (1198): 0,055 × (2 − deslizador de vía) × (1 + trenes/6) × (1 + mod), con suelo en 5;
- tren (1202): (0,45 en servicio, 0,1 parado) × (2 − deslizador de flota) × (1 + mod wear), con suelo en 10.

**Probabilidad semanal de avería** de cada tren (1203): `(1 − fiabilidad) × .05 × (1 + (100 − estado)/50) × (1 + mod breakdown)`. Cuesta dos semanas en el taller.

### B.3 Cuentas, subvención OSP, préstamos, ayudas y caja prevista
**`weeklyAccounts`** (253-271):
- personal = 0,18 × (1 − mod staff) × deslizador de servicio × nómina + cuadrillas propias × 0,045 × nómina + subcontratas × 0,09 + Σ trenes × 0,03 × nómina;
- `nómina = 1 + Σ upkeep.payroll de los pactos activos`. **No incluye `flags.payrollExtra`** (§E.1);
- mantenimiento incluye trenes parados × 0,008 y alquilados × 0,085;
- `ordinary = billetes + OSP/13 − costes`.

**OSP** (274-281, 1245-1249):
- 4,8 × (1 − 0,12 × esenciales mal) + `ospBonus` + 0,6 × territorios con tren + `ospNext` (sobornos y enchufe) − `ospCut`;
- un esencial está «mal» si su puntualidad es <70, está cerrado o no tiene trenes;
- al empezar hay 2 esenciales mal, así que el factor es 0,76 y la OSP queda en 3,65.

**Incumplimientos** (1250): un trimestre con algún esencial mal suma un leve. Tres leves hacen un grave; tres graves, retirada de la concesión.

**Préstamos** (`LOANS`, 539; `loanQuote`, 540-549):
- cuota = importe/q × (1 + tipo × años/2); primera cuota a las 13 semanas; máximo 20 de saldo vivo; el contrato-programa los prohíbe;
- 4 M€: 3 años al 5 %, sin hito; 12 cuotas de 0,36 (4,32 en total);
- 8 M€: 4 años al 5,5 %, hito m1; 16 cuotas de 0,56 (8,96);
- 12 M€: 5 años al 6 %, hito m3; 20 cuotas de 0,69 (13,8).

**Ayudas** (`AIDS`, `rescate-data.js:119-124`): se cobran cuando la obra pasa a `commissioning` (`rescate.js:1261-1263`) y se enseñan antes como «financiación prevista» (`plannedAid`, 156-161):

| Ayuda | Importe | Condición |
|---|---|---|
| feder-norte | 1,2 | renovar el Norte |
| mitma-señal | 1,0 | señalización de Levante |
| ue-elec | 2,5 | electrificar Extremadura |
| teruel-fite | 1,1 | renovar Teruel |

**`cashProjection`** (135-147): caja + (billetes − costes de hoy) cada semana − pagos de `upcoming` + OSP al cerrar trimestre. `upcoming` (122-133) suma los pagos fijos, el calendario de las obras y las cuotas de megaproyecto.

**Impago** (`insolvencyDecision`, 986-994; efectos en 977-981):

| Opción | Efecto |
|---|---|
| sell | vende el tren en peor estado por precio × 0,55 × estado; marca `flags.cut` |
| defer | aplaza una obra; al reanudarla, +10 % |
| restructure | los pagos de 13 semanas se retrasan 13 con +8 %; economía −6 |
| cut | un tren menos en el corredor que más pierde; viajeros −4, territorios −3; marca `flags.cut` |
| rescue | +4 M€ y 4 devoluciones de 1,1 cada 26 semanas; economía −8 |

Quiebra: 4 semanas seguidas con caja negativa (1291-1294).

### B.4 Corredores y territorios (`rescate-data.js:25-72`)

| id | km (dato) | km reales (segments.json) | pot | billete | elec | vía | punt. | trenes | abrir | otros |
|---|---|---|---|---|---|---|---|---|---|---|
| norte | 345 | 421 | 31 | 17 | sí | 44 | 62 | 2 | abierto | esencial |
| levante | 390 | 487 | 32 | 19 | sí | 66 | 71 | 1 | abierto | esencial, negocio |
| sur | 470 | 571 | 29 | 21 | sí | 64 | 68 | 1 | abierto | esencial, negocio |
| mediterraneo | 350 | 347 | 36 | 20 | sí | 74 | 86 | 0 | 0,6, sin hito | negocio |
| ebro | 300 | 340,6 | 19 | 16 | sí | 58 | 80 | 0 | 0,4, m1 | negocio |
| galicia | 160 | 155 | 17 | 9 | sí | 70 | 84 | 0 | 0,3, m1 | |
| asturias | 170 | 170,6 | 13 | 10 | sí | 50 | 76 | 0 | 0,3, m1 | alimenta al Norte |
| extremadura | 440 | 477 | 12 | 15 | **no** | 30 | 55 | 0 | 0,2 | territorio |
| teruel | 330 | 349 | 8 | 12 | **no** | 32 | 58 | 0 | 0,2 | territorio |
| soria | 250 | 249 | 7 | 11 | **no** | 28 | 57 | 0 | 0,2 | territorio |
| cantabria | 200 | 217 | 10 | 13 | sí | 40 | 70 | 0 | 0,2 | territorio |

- **Abrir** (`openQuote`/`openCorridor`, 446-469):
  - vía ≥40 y un tren libre;
  - hito m1 salvo Mediterráneo y territorios;
  - en un territorio, su licencia;
  - la puntualidad inicial es el objetivo − 6.
- El Mediterráneo, el más rentable, se puede abrir **desde la semana 1** por 0,6.
- **Territorios** (63-72):
  - licencia de 0,5 (Extremadura) o 0,4 (los demás), desde el hito m1 (561-570); da +3 a territorios;
  - un territorio cuenta como servido con el corredor abierto y algún tren; para el apoyo además hace falta puntualidad >55 (1006);
  - cada uno suma 0,6 a la OSP trimestral.

### B.5 Material, alquiler y cuadrillas
**Ofertas de trenes** (`TRAIN_OFFERS`, `rescate-data.js:75-84`):

| id | modelo | precio | entrega | plazas | fiabilidad |
|---|---|---|---|---|---|
| kafka | Civia 463 | 3,0 | 4 sem | 290 | 0,9 |
| dorfler | LIRIO 4 | 3,5 | 6 sem | 310 | 0,97 |
| bcbb | Fuxing Regional | 2,1 | 3 sem | 330 | 0,78 |
| used | 592 de Trenespop | 1,1 | 1 sem | 220 | 0,7 |

- **Ninguna tiene tracción, tensión, ancho ni velocidad.**
- Compra (`trainQuote`/`buyTrain`, 508-527):
  - entrada del 40 % y el resto a la entrega (el usado, entero al comprar);
  - el usado llega al 52 % de estado, o al 67 % con la tecnología «segunda», que además da −25 % de precio;
  - comisión: +10 % de precio, 7 % a caja B.
- Venta (528-536): precio × 0,55 × estado/100. **No hay botón en la interfaz**: solo se vende desde el impago.
- **Alquiler** (`RENT`, 86; `rentTrain`, 502-505): 0,085/sem durante 12 semanas, sin entrada; siempre un `kafka` al 78 %.
- **Revisión** (482-483): 0,18 × (1 + mod), 2 semanas (1 con «contrato»); vuelve al 95 %.
- **Cuadrillas** (`CREW`, `rescate-data.js:87`; `rescate.js:486-501`):
  - propia: 0,12 de entrada + 0,045/sem; llega en 2 semanas; +3 trabajadores;
  - subcontrata: desde m1, 0,09/sem durante 12 semanas;
  - despedir: 0,15 de indemnización y −8 trabajadores; mínimo 1 propia; el convenio lo prohíbe;
  - préstamo de Adif: por pacto, sin nómina.
- Una obra reserva sus cuadrillas en **todas** sus fases (`crewsBusy`, 114-116), aunque `PHASES` diga `crews: 0` en permisos (`rescate-data.js:113`).

### B.6 Obras, fases y modos de servicio
**`WORKS`** (`rescate-data.js:94-105`). Coste = max(mínimo, km × €/km):

| Obra | €/km | mínimo | cuadrillas | fases (sem) | efecto |
|---|---|---|---|---|---|
| renovar | 0,0068 | 0,9 | 1 | [1,5,1] | vía +46 (tope 98) |
| señalización | 0,0085 | 1,6 | 1 | [2,6,2] | +8 de puntualidad |
| apartaderos | 0,004 | 0,7 | 1 | [1,4,1] | +3 de capacidad |
| electrificar | 0,0105 | 2,2 | 2 | [3,9,2] | `elec = true` |
| apeadero (oculta) | — | 1,4 | 1 | [1,3,1] | estación |

- **`SERVICE_MODES`** (107-111):
  - por fases: duración ×1,5, 78 % de la demanda, −9 de puntualidad;
  - autobuses: ×1, 55 % de la demanda, +0,03 × km/300 por semana;
  - cortar: ×0,85, sin demanda.
- **`PHASES`** (112-116): permisos, construcción y pruebas, con el 10 %, el 80 % y el 10 % del coste.
- **`workQuote`** (`rescate.js:296-330`):
  - permisos ×1,5 con `slowPermits` y ×0,5 con `fastPermits`;
  - construcción × duración del modo × (1 − mod buildSpeed);
  - acelerar en el plan: construcción ×0,75, coste ×1,25, +1 cuadrilla; comisión ×1,1;
  - devuelve calendario, ayuda, puntualidad antes y después, ganancia de ingresos y semana de entrada en servicio.
- Con la partida nueva (calculado):
  - Norte: renovar 2,35, 7 semanas, puntualidad 63 → 86; señalización 2,93, 10 semanas, 63 → 71; apartaderos 1,38 sin efecto con 2 trenes; electrificar 3,62 (ya lo está).
  - Extremadura: renovar 2,99; electrificar 4,62, que solo da +3 de puntualidad.
- **`punctProjection`** (332-344) aplica la misma regla del 38 % hasta el fin de la etapa. Así la interfaz dice «✗ 76 % en la semana 13» por fases y «✓ 85 %» con autobuses.
- **Acelerar una obra en marcha** (380-391): +30 % de lo pendiente; recorta floor(25 % de la construcción restante), mínimo 1 semana; +1 cuadrilla. *Es una regla distinta de la del planificador (+25 % del total).*
- **Cancelar** (403-419): se ahorra lo pendiente. Desde construcción, penalización del 12 % del coste. Si estaba construido al menos el 50 %: vía −6, territorios −3, economía −3 y un titular («el puente a ninguna parte»).
- **Pruebas:** 12 % de fallo una vez, +1 semana (1215).
- **Al terminar** (`applyWork`, 1311-1318): con el enchufe de Borja, la vía queda 3 puntos más baja.

### B.7 Pactos (`PACTS`, `rescate-data.js:289-344`; motor en `rescate.js:573-689`)
- Como mucho dos activos (`MAX_PACTS`).
- **Ofertas:**
  - Paco, fija en la semana 3 (683);
  - luego un 9 % semanal desde la semana 6, al azar entre las elegibles (684-688);
  - no se repiten las rechazadas en las últimas 40 semanas;
  - las del sucesor solo desde la semana 209 y las de la ministra solo hasta la 208;
  - caducan a las 3 semanas.
- **Negociar** (586): éxito si `rand < chance + (apoyo del grupo de la persona − 45)/200`. Grupo de cada persona en 594.
- **Al cumplir** (639-647): +3 ★ y la recompensa.
- **Al incumplir** (621-638): penalización y consecuencia.

| id (persona, desde) | Da | Obliga (comprueba) | Plazo | Si fallas | Versión barata |
|---|---|---|---|---|---|
| estacion-paco (alcalde, sem. 3) | territorios +10, 4 ★ | construir el apeadero: 1,4, 5 semanas de cuadrilla (`stationTask`) | 16 | territorios −14, rencor de Paco | 0,9; +6 y 2 ★; 65 % |
| convenio (taller, 8) | trabajadores +10, sin huelgas | nómina +6 %, sin recortes (`noCuts`) | 26 | huelga de 2 semanas, trabajadores −15 | +3 %; +5; 55 % |
| contrato-programa (Hacienda, 20) | OSP +0,8 por trimestre | resultado ≥0 en 2 de 3 trimestres, sin préstamos | 39 | devolver lo cobrado, auditoría, economía −6 | +0,5; 70 % |
| cuadrilla-adif (Adif, 6) | cuadrilla 12 semanas | pagar 0,6 al vencer (automático si hay caja) | 12 | permisos ×1,5 durante 52 semanas | 0,35; 50 % |
| carta-viajeros (viajeros, 10) | viajeros +12 | Norte, Levante y Sur ≥85 (se cumple en cuanto pasa) | 20 | viajeros −16 y 0,5 | ≥80; +7; 60 % |
| inauguracion (ministra, 40) | 6 ★; +1 al cumplir | terminar cualquier obra o etapa | 14 | OSP −1, rencor de la ministra | 4 ★ y 0,6; 60 % |
| cohesion (presidente, 160) | territorios +8; +3 al cumplir | un territorio con tren | 30 | territorios −10 | 40 semanas y 2,2; 55 % |
| tuits (sucesor, 220) | 6 ★, viajeros +6 | 3 obras o etapas terminadas | 26 | viajeros −10 | 2 obras; 4 ★ y +4; 60 % |
| no-agresion (Íñigo, 100) | Soria y Teruel ×1,12 | no abrir Extremadura (`noExtremadura`) | 52 | Íñigo filtra un secreto | 30 semanas; 50 % |

### B.8 Elecciones y grupos
- **Pesos** (`GROUPS`, `rescate-data.js:13-18`): viajeros 0,34, territorios 0,2, trabajadores 0,2, economía 0,26.
- **Objetivos** (`groupTargets`, `rescate.js:1000-1027`). Cada grupo se mueve el 7 % semanal hacia el suyo (1042):
  - viajeros = 30 + (puntualidad media ponderada − 65)×1,2 + (1 − índice de precio)×40 − min(15, sin plaza/viajeros×60);
  - territorios = 25 + 10 × territorios con tren y puntualidad >55 + 2 × licencias + 4 con el apeadero − 5 si Paco tiene rencor;
  - trabajadores = 44 + (cuadrillas propias − 2)×4 − 5 si todas están ocupadas − 2 × subcontratas − 8 en huelga + `payrollExtra`×150;
  - economía = 30 + (puntualidad de los corredores de negocio − 65)×0,8 + (8 si el resultado medio de 8 semanas ≥0; si no, max(−12, media×40)) + (4 si caja ≥3; −15 si caja <0) + 6 con el Mediterráneo abierto + 1,5 × etapas de megaproyecto − 25 × cuota de Lowgo;
  - todos: + `bonus` (60 % de lo ganado en pactos y medidas, que se pierde un 0,5 % cada semana, 1045) − 6×(fase judicial − 1) desde la imputación.
- **Voto** (`electionForecast`, 1029-1038) = Σ (media de 26 semanas del grupo × peso). Se gana con ≥50. Perder acaba la partida (1133). Ganar da +10 ★.
- Revisiones políticas en las semanas 182 y 390 (1287).

### B.9 Hitos y popularidad
**Hitos** (`MILESTONES`, `rescate-data.js:127-134`). Se miden con la media de 4 semanas de viajeros totales (1052):

| Hito | Viajeros | ★ | Desbloquea |
|---|---|---|---|
| m1 | 30 | 6 | nivel 2 de tecnología, licencias, subcontratas, préstamo de 8 y **abrir Ebro, Galicia y Asturias** (esto no aparece en su lista de desbloqueos) |
| m2 | 44 | 8 | megaproyectos de nivel m2 y exprés |
| m3 | 62 | 10 | nivel 3, préstamo de 12, Mediterráneo mega |
| m4 | 80 | 12 | nivel 4 y Estación Central (no hay ninguna tecnología de nivel 4) |
| m5 | 100 | 16 | «Placa conmemorativa», que **no existe en el motor** |

Además: +8 ★ por etapa cumplida y −4 ★ por escándalo.

### B.10 Tecnologías (`TECHS`, `rescate-data.js:140-159`)
- 18 tecnologías en 6 ramas × 3 niveles. Se pagan con ★ y dinero.
- Hito por nivel: 1 → m0, 2 → m1, 3 → m3 (`TIER_MILESTONE`, 162).
- Coste (★ / M€) y efecto:
  - **Mantenimiento:** ultrasonidos 8/0,4, vía −30 % de desgaste · predictivo 14/1,0, averías aleatorias −40 % · bateadora 22/1,8, construcción −20 %.
  - **Operación:** cadenciados 8/0,3, demanda +6 % · regulación 15/1,2, puntualidad +3 · ertms 26/2,6, puntualidad +4 y +1 de capacidad.
  - **Material:** contrato 7/0,5, revisión −25 % y 1 semana · segunda 12/0,6, usados −25 % y 67 % de estado · bimodo 20/1,6, energía diésel −30 %.
  - **Comercial:** abono 8/0,3, viajeros +8 y demanda +4 % · dinámico 14/0,8, ingresos +8 % · app 20/1,2, estructura −15 % y demanda +5 %.
  - **Comunicación:** prensa 6/0,2, escándalos −30 % · inauguraciones 10/0,4, +3 ★ por obra (+2 territorios) · influencers 18/0,9, +1 ★ por semana con media ≥80.
  - **Fontanería:** contabilidad 5/0,2, comisión +50 % · abogados 10/0,6, avance judicial −50 % y opción «abogados» ante extorsiones · destructora 16/0,5, las pruebas decaen ×3 y «destructora» ante auditorías.

### B.11 Megaproyectos y logros
- **Logros** (`ACHIEVEMENTS`, `rescate-data.js:168-193`): 22 condiciones evaluadas por `achievement` (`rescate.js:711-730`). Tipos: punct, reliable, fleet, cash, milestone, group, tech, open, streak, calm (`incidentFree`), ordinary, pactDone, clean.
- **Etapas** (`megaState`/`startMegaStage`, 731-753): exigen sus logros, el hito del nivel, las cuadrillas libres y caja para el primer pago (`cost/weeks`).
- **Megaproyectos** (`MEGAPROJECTS`, `rescate-data.js:199-248`). Cada etapa: coste/semanas/cuadrillas · requisitos · beneficio.
  - **taller (m2):**
    1. 0,8/4/0 · norte80 · revisión −10 %;
    2. 3,2/9/1 · flota6 · desgaste −20 %;
    3. 2,4/7/1 · predictivo + trab55 · averías −25 %;
    4. 0,5/2/0 · 12 semanas tranquilas · 12 ★ y trabajadores +8.
  - **ctc (m2):**
    1. 0,6/3/0 · fiables3 · puntualidad +1;
    2. 2,8/8/1 · regulación · +2;
    3. 2,2/8/2 · caja5 + resultado · «incidencias −30 %», **sin efecto**: el mod `incident` no se usa;
    4. 0,6/2/1 · 12 semanas tranquilas · +2 y 10 ★.
  - **mediterraneo (m3):**
    1. 0,9/4/0 · Mediterráneo abierto · economía +4;
    2. 5,5/14/2 · eco55 · capacidad +4;
    3. 4,5/12/2 · med85 durante 8 semanas + un pacto · pot +35 %;
    4. 0,7/2/0 · pax66 · 15 ★ y economía +8.
  - **teruel (m2):**
    1. 0,5/5/0 · Teruel abierto · territorios +6;
    2. 4,0/12/2 · terr50 · vía 90;
    3. 3,0/9/2 · resultado · electrificado;
    4. 0,4/1/0 · un pacto · 12 ★ y territorios +10.
  - **estacion (m4):**
    1. 1,0/4/0 · pax86 · 6 ★;
    2. 7,0/16/2 · flota9 + ertms · Madrid +8 %;
    3. 5,0/12/2 · fiables5 · Madrid +8 %;
    4. 0,8/2/0 · viaj60 · 20 ★ y +6 a todos.
  - **monumento (m1, de vanidad):**
    1. 0,4/2 · nada · 5 ★;
    2. 1,2/5/1 · un pacto · 6 ★ y territorios +4;
    3. 1,5/4 · caja5 · 8 ★ y sospecha +6;
    4. 0,6/1 · pacto con la ministra · 15 ★ y territorios +6.
- En las partidas del bot nunca se empieza la Estación Central. Del taller suele quedarse en la etapa 2: hacen falta 12 semanas sin incidencias y el bot llega a una racha máxima de 16 a 22.

### B.12 Cloacas
- **Caja B:**
  - comisión de compra, obra o megaproyecto: 7 % × (1 + mod), sospecha +6, pruebas +5 (756-762);
  - traviesas: +0,5; yate: +0,3.
- **Sobornos** (`BRIBES`, `rescate-data.js:348-363`; `bribe`, `rescate.js:769-793`). Se pagan de caja B; si no llega, de caja A con pruebas ×1,8. Coste · sospecha · pruebas · efecto:

| Soborno | Coste | Sospecha | Pruebas | Efecto |
|---|---|---|---|---|
| alcalde | 0,15 | 7 | 6 | permisos ×0,5 durante 8 semanas; territorios +6 |
| inspector | 0,1 | 6 | 5 | salta las pruebas; riesgo +8 |
| periodista | 0,2 | 5 | 4 | el próximo escándalo hace la mitad de daño |
| diputados | 0,45 | 10 | 8 | OSP +0,9 |
| sindicato | 0,2 | 8 | 6 | fin de huelga; trabajadores +8 |
| juez | 0,6 | 14 | 12 | solo con causa abierta. 30 %: le pillan (fase +2, como mucho 3). 70 %: la fase retrocede 1 y pruebas −10 |
| Charo | 0,3 | 20 | 15 | 75 %: escándalo y diligencias. 25 %: OSP +1,4 |

- **Cada semana** (`judicialWeek`, 862-885):
  - sospecha −0,6; pruebas −0,25 × (1 + mod evidenceDecay);
  - accidente con probabilidad riesgo/900;
  - cada secreto sale a la luz con probabilidad 0,002 + sospecha/3000 + pruebas/3500;
  - sin causa abierta: diligencias si sospecha ≥35 y `rand < (sospecha − 30)/160`;
  - con causa y pruebas <8: 10 semanas tranquilas la archivan;
  - si no: la fase sube con probabilidad pruebas/420 × (1 + mod judicial);
  - fase 2 (imputado): −6 a todos; fase 3 (juicio oral): −10 a todos; fase 4: **condena, fin de la partida**;
  - desde la fase 2: viajeros −0,3 y economía −0,3 cada semana.
- **Escándalo** (`exposeSecret`, 799-816):
  - golpe = hit × (1 + mod scandal) × (0,5 si se ha comprado al periodista);
  - viajeros −golpe, territorios −0,6×, trabajadores −0,5×, economía −0,8×;
  - sospecha +15, pruebas +10, −4 ★;
  - el del juez sube la fase +2 y la sospecha +20;
  - el de Charo deja la fase en 1 como mínimo.
  - Opciones (972-975):
    - negar: 45 % de que cuele (+4 y +3); si no, −6/−4/−3/−5 y sospecha +8;
    - cesar a Benito: pruebas −15, trabajadores −6, permisos lentos 26 semanas;
    - comisión de investigación: +3 y +2, sospecha +6;
    - comprar el silencio: 0,3 de caja B, +5/+3/+2/+4, pruebas +3.
  - Golpe base (`SCANDALS`, 794-798): comisión 9, traviesas 12, yate 10, enchufe 8, mariscada 7, sobres 11, juez 18, Charo 14, pacto 9.
- **Propuestas corruptas** (`offerCorruption`, 818-845):
  - traviesas: la primera renovación después de la semana 4, en construcción;
  - yate: 2 semanas después de comprar BCBB con comisión;
  - enchufe: 2 % por semana entre las semanas 30 y 200;
  - mariscada: semana 50 de cada año, con un 60 %.
- **Extorsión** (`extortion`, 846-861): hace falta un secreto sin publicar, cada 20 semanas, con un 25 % de probabilidad.
  - Paco (rencor): 0,25. Benito (traviesas y causa abierta): 0,3. Íñigo (sospecha >18): 0,4.
  - Pagar sale de caja B o de A (A: pruebas +4). No pagar: se publica. Abogados: 50 %.
- **Fases judiciales** (`JUDICIAL`, `rescate-data.js:366`): sin causa, diligencias, imputación, juicio oral, condena.

### B.13 Etapas, obstáculos y programa
**Etapas** (`stageProgress`, `rescate.js:1058-1077`; `evaluateStage`, 1112-1127). Se evalúan en la última semana de cada una:

| Etapa | Qué se comprueba |
|---|---|
| s1 | Norte ≥80 y sin impago en un pago programado |
| s2 | Norte, Levante y Sur ≥80 y caja ≥3 **en la semana 52** |
| s3 | solo el resultado ordinario medio de 26 semanas ≥0. Encuestas y Programa se enseñan, pero no cuentan |
| s4 | 2 territorios con tren y cuota frente a Lowgo ≥60 %, con cuota = 1 − media(Lowgo en levante, sur y mediterraneo; **1 si el corredor está cerrado**) |
| s5 | 5 corredores con media ≥85 en 12 semanas y 0 rescates desde la semana 313. Las encuestas no cuentan |

- Cumplir: +8 ★. Fallar: un grave, economía −5 y viajeros −3.
- **Obstáculos** (`obstacles`, 1079-1101), como mucho 6, por gravedad:
  - en los corredores de la etapa: obra en marcha, vía <70, carga >1,05, abierto sin trenes;
  - trenes con estado <45; trenes en el taller;
  - sin cuadrillas libres;
  - pagos a 4 semanas > 60 % de la caja;
  - fase judicial;
  - en s4: Lowgo >40 % y territorios sin tren.
  - Cada uno lleva su `action`, que la interfaz traduce a planificador o página (`rescate-ui.js:487-497`).
- **Programa** (`PROGRAM`, `rescate-data.js:276-283`; `checkProgram`, `rescate.js:1102-1111`): 6 promesas. Se marcan en cuanto se cumplen y **nunca se desmarcan**:
  1. Norte 80;
  2. tres esenciales a 80;
  3. resultado medio de 26 semanas ≥0;
  4. 2 territorios;
  5. 5 corredores al 85 % (media de 12 semanas);
  6. un megaproyecto que no sea el monumento.

### B.14 Fin y veredicto
- **Derrotas:**
  - quiebra: 4 semanas seguidas con caja negativa;
  - retirada: 3 graves (1121, 1250);
  - elecciones: voto <50;
  - condena: fase judicial 4.
- **Victoria** (`finalVerdict`, 1141-1147):
  - las 6 promesas;
  - resultado ordinario medio de las últimas 52 semanas ≥0;
  - 0 rescates en las últimas 104 semanas;
  - 2 elecciones ganadas;
  - si falta algo, final «parcial».
- **Bot** (`rescate-test.mjs:80-181`), 6 semillas: 4 victorias y 2 parciales. Votos de 53 a 67. Resultado de 0,17 a 0,37/sem. Megas: taller 2, CTC 4, Mediterráneo 1-2.
- **Jugador pasivo** (simulación propia, cerrar semanas eligiendo la primera o la última opción): pierde siempre antes de la semana 53. Por quiebra (semanas 48-51) o por retirada en la semana 52: s1 falla (1 grave), los leves de las semanas 13, 26 y 39 suman otro y s2 falla (3.º).

---

## C. Interfaz (`rescate-ui.js`, `rescate.css`, `rescate-map.js`)

**Montaje.** `mountRescue` (`rescate-ui.js:66-75`) cuelga `div.rs` de `body` con:
- canvas del mapa;
- `header.rs-top`, `nav.rs-rail`, `aside.rs-mission` y `aside.rs-side`;
- `footer.rs-dock`;
- `dialog.rs-sheet` (páginas) y `dialog.rs-modal` (planificadores y decisiones);
- toast.

Se arranca desde la portada clásica: `app.js:1149-1154`, botón `rescue-new`/`rescue-continue` en `app.js:1289`. Se guarda en `localStorage['tenfe-rescate-v1']` (`rescate.js:8`; `rescate-ui.js:47-53`).

**Estilo.** Vidrio oscuro `rgba(21,18,25,.86)` con blur 16 (`rescate.css:2-9`), sobre el mapa ilustrado claro (pergamino) heredado de `map-v3.js`. Dos lenguajes visuales mezclados.

### C.1 Barra superior (`renderTop`, 126-141; css 14-30)
- Logo, «Semana N» y fecha.
- Cinco recursos que abren su página:
  - caja + resultado ordinario semanal; aviso si la caja prevista mínima <0;
  - trenes disponibles/total;
  - cuadrillas libres/total;
  - apoyo %;
  - ★.
- Tres puntos de órdenes y botón de menú.
- **Engaña:** el resultado semanal incluye la OSP prorrateada (`rescate.js:270`), pero la caja no la recibe hasta fin de trimestre. La cabecera dice −93 k€ y la caja baja 370 k€ (captura `cur-04-decision.png`: «−45 k€» arriba y «Semana 1 · −370 k€» en el aviso).

### C.2 Raíl (`renderRail`, 142-145; `PAGES` 40; css 33-39)
- 11 iconos: Finanzas, Obras, Flota, Pactos, Progreso, Tecnología, Megaobras, Elecciones, Cloacas, Gaceta y Ayuda.
- Punto rojo en Pactos (hay ofertas), Cloacas (causa abierta), Tecnología y Megaobras (algo disponible).
- La etiqueta solo aparece al pasar el ratón. En móvil, ninguna (css 264).

### C.3 Misión (`renderMission`, 146-156; css 42-64)
- Etapa N/5 y semanas restantes (rojo si quedan ≤3); título corto (`STAGE_TITLE`, 41).
- Filas de objetivo con valor, meta y barra.
- Botón «N decisiones pendientes».
- Lista de obstáculos con punto de gravedad y «›».
- Ofertas de pacto con la cara del personaje.

### C.4 Ficha del corredor (`corridorHTML`, 171-189; css 67-90)
- **Abierto:**
  - tipo (Esencial, Territorio, Negocio, Regional), nombre, «km · electrificado»;
  - puntualidad, vía y viajeros;
  - trenes, exprés, neto/sem, sin plaza y Lowgo;
  - las 3 causas peores como etiquetas («Vía −28»);
  - bloque de obra: pastillas de progreso, semanas, pagado/total, Acelerar y Cancelar;
  - acciones: las 4 obras con su coste, Servicio y precio, Comprar trenes.
- **Cerrado:** vía, potencial, motivo que bloquea, Licencia o Abrir, Renovar si la vía <40.

### C.5 Abajo (`renderDock`, 162-168; css 93-109)
- **8 capas** (`LAYERS`, `rescate-map.js:49-58`): Puntualidad, Estado de la vía, Viajeros, Catenaria, Ancho, Velocidad, Obras y Territorios.
- Teletipo de la Gaceta.
- ⏩ «Avanzar hasta la próxima decisión» y «Cerrar semana N», que se vuelve «Decidir» en rojo vino si hay decisiones.
- Teclado: Enter cierra la semana; Mayúsculas+Enter avanza (551-556).

### C.6 Modales
- **Obra** (`drawWorkPlan`, 203-222):
  - pestañas de tipo de obra; barra de 3 fases;
  - 3 modos con semanas, % de viajeros y coste extra;
  - 4 cifras: coste, cuadrillas, semana de entrada en servicio, puntualidad antes → después;
  - gráfico de pagos semanales;
  - avisos: ayuda, +ingresos/sem, «✓/✗ X % en la semana Y» y motivos;
  - interruptores Acelerar y «Aceptar la atención del contratista»;
  - «1 orden · Aprobar».
- **Servicio** (`drawServicePlan`, 226-237): deslizadores de trenes, exprés (desde m2) y billetes; 4 cifras antes y después; avisos de canibalización, gente sin plaza y «con la vía al X % apenas sube».
- **Compra** (`drawBuy`, 241-252): «Uno más en el X: +pax · neto»; 4 teselas con foto 3D (`trainThumb`), plazas, ★ de fiabilidad, precio y llegada; tesela de alquiler; interruptor de comisión.
- **Abrir corredor** (255-261) y **territorio** (262-268): banner, frase, 3 pasos (licencia, vía ≥40 %, tren diario).
- **Decisión** (`nextDecision`, 380-393):
  - banner con imagen fija;
  - antetítulo por tipo (Imprevisto, Escándalo, Propuesta discreta, Extorsión, Impago, Nueva etapa…) y título;
  - **bloque de personaje** (`talk`, 117-121): retrato de 150×186 con la emoción, nombre, cargo, cita entre comillas y botón «Escuchar» solo si hay grabación;
  - texto extra si difiere de la línea hablada;
  - opciones grandes con nota a la derecha.
- **Propuesta de pacto** (`showOffer`, 401-408): personaje, 4 columnas (Ganas, Te obliga, Plazo, Si fallas) y Aceptar, Negociar o Rechazar.
- **Resultado de negociar** (409-417): «Trato hecho / Sin rebaja» con la línea `negotiate-ok/no`.
- **Final** (`showEnd`, 436-444): banner de victoria o derrota, línea del final, 4 cifras, Menú y Nueva partida.
- **Menú** (533): seguir, exportar o importar `.json`, menú principal, empezar de nuevo.

### C.7 Páginas (hojas de hasta 1080 px)

| Página | Líneas | Contenido |
|---|---|---|
| Finanzas | 278-295 | semana desglosada; 26 semanas; caja prevista a 13; pagos; financiación prevista; préstamos en teselas; 3 deslizadores de presupuesto del 50 al 150 % |
| Obras | 296-304 | contratar, subcontratar, despedir; apeadero; en marcha, aplazadas, terminadas |
| Flota | 305-312 | lista con estado y botón de revisión |
| Pactos | 316-322 | activos y sobre la mesa |
| Progreso | 323-330 | hitos, programa, etapas, graves y leves |
| Tecnología | 331-334 | árbol de 6×3 teselas con foto |
| Megaobras | 341-348 | 6 tarjetas con foto, pastillas de etapa, requisitos y botón |
| Elecciones | 349-356 | indicador, 4 grupos con sus 3 causas principales, resultados |
| Cloacas | 357-363 | caja B, sospecha y pruebas, 5 fases judiciales, 7 sobres |
| Gaceta | 364-366 | titulares |
| Ayuda | 367-371 | 4 teselas y repetir el tutorial |

### C.8 Voces (`speak`, 107-116)
- `RESCUE_VOICES[line]` viene de `assets/rescate-voices.js`: **3/70 grabadas**, según el manifiesto `assets/rescate-voces/manifest.json` («recorded»: 3, «expected»: 70, Qwen3-TTS 0.6B).
- La reproducción automática solo ocurre al abrir una decisión o un paso del tutorial (`autoSpeak` 122, `coach` 461).
- Sin grabación no hay síntesis del navegador: el diálogo se queda en texto.

### C.9 Tutorial (`TUTORIAL`, 56-64; `coach`, 447-467)
- 7 pasos, en cada uno habla una persona y hay que hacer algo real:
  1. Raquel → «Vamos»;
  2. Marisa → pulsar el Norte;
  3. Benito → abrir Renovar vía;
  4. Charo (dentro del modal) → aprobar;
  5. Fermín → abrir Flota;
  6. Raquel → cerrar la semana;
  7. Raquel → «A gobernar».
- Caja flotante con retrato, «N/7», texto, tarea, Siguiente y Saltar, y el elemento resaltado con un pulso (`rescate.css:239-252`).
- Dentro de un modal el globo se mete en el propio modal: una caja dentro de otra (css 247).

### C.10 Mapa (`rescate-map.js`)
- `RescueMap extends RailMap` (73-77), con el sol fijo a media tarde.
- Los corredores siguen la geometría real con su propio Dijkstra (`path`, 15-27; `GEOMETRY`, 28-40), **duplicado** del de `rescate.js:86-99`.
- Capas por corredor (`corridorColor`, 79-87). Catenaria, Ancho y Velocidad colorean tramo a tramo en proporción a sus km con `segmentsOf` (115-124).
- Territorios como halos radiales (103-109).
- Trenes animados con su velocidad atada a la puntualidad y borde rojo si está por debajo de 70 (199-218); autobuses amarillos durante obras (220-223).
- Casco de obra en el 42 % del corredor (139-152), no en el tramo real; grúa en los megaproyectos (153-161).
- Etiquetas «Norte · 62 %» (176-186) y avisos de viajeros y neto al cerrar la semana (`rescate-ui.js:430`).
- En móvil, con 390 px, las etiquetas se pisan (captura `investigacion/verificacion-4.0/10-movil.png`).

---

## D. Lo que vale la pena conservar en el modo único

1. **Motor puro, semanal y determinista**, con el azar guardado en el estado (`rand`, 24-29). Guardado, validación e importación (`serialize/validate/load`, 1348-1358) y un bot de 8 años que hace de banco de equilibrio (`rescate-test.mjs`).
2. **Presupuesto antes de comprometerse**, con la misma regla que el motor:
   - `workQuote` + `punctProjection`: «✗ 76 % en la semana 13 por fases»;
   - `serviceQuote`: antes y después, canibalización del exprés;
   - `openQuote`, `trainQuote` con «uno más en el Norte: +X»;
   - `cashProjection`/`upcoming`: caja prevista y calendario de pagos;
   - `plannedAid`: financiación prevista.

   Es la herramienta principal para que lo prometido se cumpla.
3. **Causas a la vista:** `punctTarget().causes` en la ficha («Vía −28») y `groupTargets().rows` en las elecciones. El jugador ve por qué pasa algo.
4. **Misión → obstáculo → acción** (`obstacles` + `rescate-ui.js:487-497`): cada problema lleva a la herramienta que lo arregla.
5. **Tres órdenes por semana** y «mirar es gratis»: escasez clara y pocas decisiones por turno.
6. **Paradas con motivo** (`stopReasons`), que evitan saltarse cosas al avanzar.
7. **Obras en 3 fases con 3 modos de servicio** (fases, autobuses, cortar): un dilema real entre tiempo, demanda y coste, que el test ancla (`rescate-test.mjs:22-26`).
8. **Pactos verificables:** beneficio, obligación, plazo y consecuencia, comprobados por el motor (`pactCheck` 648-660 y reglas `noLoans/noCuts/noExtremadura`). Los dos huecos activos obligan a elegir.
9. **Financiación prevista ligada a una obra concreta** y **decisión de impago** con 5 salidas, todas con coste diferido.
10. **Cloacas con causalidad:**
    - los secretos solo existen si los creas;
    - la probabilidad de que salgan crece con sospecha y pruebas;
    - las fases judiciales tienen umbrales;
    - Benito solo extorsiona si existe el secreto de las traviesas y hay causa abierta (`extortion` 851), el patrón a seguir.
11. **Megaproyectos con logros** (estilo SimCity 5), en los que cada etapa ya rinde, y **hitos** que abren sistemas poco a poco.
12. **Territorios desatendidos** con su ciclo licencia → vía ≥40 → tren diario → +0,6 de OSP y +10 de apoyo.
13. **Grupos con peso y media de 26 semanas**, con causas: unas elecciones legibles.
14. **Tutorial por acciones**, una persona cada vez, y retratos con emoción.
15. **Imágenes con nombre fijo**: las 63 de `IMAGES` están en `assets/rescate/`. Se pueden reutilizar.
16. **Tuberías de voz:** una grabación por diálogo con su hash en el nombre (`tools/build-web.mjs:200-222`).
17. **Mapa:** corredores sobre geometría real, capas con color y leyenda, trenes animados, autobuses y avisos de viajeros. Es reutilizable.

---

## E. Debilidades

### E.1 Lo que dice un diálogo o una opción y el motor no hace (o hace distinto)

| # | Lo que se dice | Lo que hace el motor | Dónde |
|---|---|---|---|
| 1 | Huelga «Negociar: +2 % de nómina» | `flags.payrollExtra += .02` solo sube el apoyo de los trabajadores (+3). `weeklyAccounts` no lo cobra. Comprobado: los costes no cambian (0,7994 → 0,7994). | `rescate.js:949`, `258`, `1017` |
| 2 | Túneles: «el BCBB no circula en Cantabria» | Solo `flags.tuneles = true` y territorios −5. El suceso salta si alguna vez compraste un BCBB, aunque no esté en Cantabria. | `rescate.js:899`, `914`, `960` |
| 3 | CTC etapa 3: «Las incidencias se resuelven antes: −30 % de su efecto» | El mod `incident` no lo lee nadie: 2,2 M€, 8 semanas y 2 cuadrillas a cambio de nada. | `rescate-data.js:213`; `rescate.js` sin `mod(s,'incident')` |
| 4 | Enchufe de Borja: «Tus obras irán algo más lentas» | Las fases no cambian; cada obra terminada deja la vía 3 puntos más baja. | `rescate.js:835`, `964`, `1317` |
| 5 | Extorsión de Paco: «le cuento a la prensa lo del sobre» | Salta con su rencor (pacto roto) y publica el primer secreto que haya (comisión, yate…), aunque nunca le diste un sobre. | `rescate.js:848-858`, `969` |
| 6 | Extorsión de Íñigo: «Tengo unas fotos tuyas» | Salta con sospecha >18 y cualquier secreto, aunque no hubo yate. | `rescate.js:851` |
| 7 | Escándalo de comisiones | Usa la línea del yate («tú en un yate con el fabricante chino»). | `rescate.js:795` |
| 8 | Filtración del pacto con Autocares Meseta | Usa la línea de los sobres («alcaldes, inspectores y diputados…»). Además, si hay otros secretos, Íñigo filtra uno de ellos y no el pacto. | `rescate.js:797`, `633` |
| 9 | Accidente por pruebas sin mirar | Suena la línea `sc-sobres` mientras el texto dice «Descarrilamiento leve…». Después `exposeSecret('sobres')` abre otro escándalo con la misma línea. | `rescate.js:866-868` |
| 10 | «Causa archivada» | Habla la ministra con `stage-pass`: «Objetivo cumplido. Lo voy a contar como si hubiera sido idea mía». | `rescate.js:875` |
| 11 | Negociar, «Sin rebaja» | La línea `negotiate-no` es siempre de Íñigo; `negotiate-ok`, siempre de Charo. Da igual con quién negocies (Paco, Fermín, Benito…). | `rescate-data.js:400-401`; `rescate-ui.js:413-415` |
| 12 | Cesar a Benito Balasto | Benito sigue hablando como jefe de obras: cable, nevada, desprendimiento, pacto de la cuadrilla, traviesas, extorsión. La opción sale incluso en escándalos sin relación con él (yate, mariscada, Charo, juez). | `rescate.js:812`, `973` |
| 13 | Rencores: «Ministra mosqueada», «una ministra muy enfadada», «Benito no olvida» | `grudges` con `minister` o `adif` no tiene ningún efecto; solo cuenta `mayor`. | `rescate.js:627`, `959`, `965`, `973`; lecturas en `851` y `1016` |
| 14 | Contrato-programa: «me lo devuelves con intereses y con auditoría» | Devuelve justo lo cobrado, sin intereses. La «auditoría» solo hace elegible un suceso aleatorio (20 %/semana × su peso), que puede no llegar nunca. | `rescate-data.js:389`; `rescate.js:631-632`, `896` |
| 15 | Juez: «Si sale mal, es el final» | Si sale mal, la fase sube 2 hasta un máximo de 3 (juicio oral). No es el final. | `rescate-data.js:359`; `rescate.js:784`, `806` |
| 16 | Vídeo viral «en el Teruel» | Puede salir desde la semana 9 aunque Teruel no tenga tren. | `rescate.js:894` |
| 17 | Desprendimiento: «la vía está cortada… lo despejo en una semana si me das una cuadrilla» | No dice qué corredor. Con la cuadrilla no se corta nada. Si esperas, se corta 3 semanas un corredor **elegido al azar** después de decidir. Si no hay corredor abierto sin obras, `pick` devuelve undefined y `.id` lanza un error. | `rescate.js:953-954` |
| 18 | Tecnología «bimodo»: «…y fallan menos» | Solo baja la energía diésel; la fiabilidad no cambia. | `rescate-data.js:149` |
| 19 | Tecnología «prensa»: «Los escándalos y las averías restan un 30 % menos» | Las averías no restan apoyo, así que solo afecta a los escándalos. | `rescate-data.js:153`; `rescate.js:802` |
| 20 | Tecnología «predictivo»: «40 % menos de averías» | Solo afecta a las averías silenciosas de `closeWeek`; el suceso «Avería grave» (peso 3) no cambia. | `rescate.js:1203` frente a `889` |
| 21 | Obra «Electrificar»: «…trenes más fiables» | Solo da +3 de puntualidad y energía ×1 en vez de ×1,5. | `rescate-data.js:101`; `rescate.js:176`, `223` |
| 22 | Pacto de Paco | Su apeadero ocupa el **hueco de obra del Norte**: bloquea la renovación («Ya hay una obra en marcha») y quita 9 de puntualidad durante sus 3 semanas «por fases». No se avisa en ningún sitio, y en s1 puede hacer perder la etapa. | `rescate.js:612-620`, `179-180`, `301` (comprobado) |
| 23 | Etapa s2: «no bajes de tres millones en caja» | Solo se mira la caja en la semana 52. | `rescate-data.js:380`; `rescate.js:1066` |
| 24 | Etapa s3: «sanea las cuentas, cumple el programa y gánanos las elecciones… las tres» | La etapa solo comprueba el resultado; la misión enseña Encuestas y Programa como si contaran. | `rescate.js:1116` frente a `1067-1069` |
| 25 | s4: «que Lowgo no se coma tus corredores buenos» | Un Mediterráneo **cerrado** cuenta como 100 % de Lowgo. Es un requisito escondido: hay que tenerlo abierto. | `rescate.js:1071` |
| 26 | Ministra en s4 y s5 | `pact-done`, `fin-retirada` y `end-win` los dice Raquel aunque desde la semana 209 el ministro es Óscar. | `rescate-data.js:398`, `438`, `442` |
| 27 | Hito m5: «Placa conmemorativa en Atocha» | No existe. | `rescate-data.js:133` |
| 28 | `t-3`: «El problema es la vía entre Ávila y Medina» | Renovar trata todo el corredor, que tiene un solo valor de vía. El casco de obra se pinta en el 42 % del recorrido. | `rescate.js:307`, `1313`; `rescate-map.js:143` |
| 29 | `t-2`: «Ese que parpadea en rojo» | El que parpadea es todo el mapa (`.rs-focus` en el canvas), no el Norte. | `rescate-ui.js:58` |
| 30 | `t-1`: «Las primeras trece semanas deciden si llegas a la segunda» | Fallar s1 es solo 1 de 3 graves. | `rescate.js:1120-1121` |
| 31 | Acelerar | Hay dos reglas: en el plan, +25 % del total; en marcha, +30 % de lo pendiente y −25 % de la construcción restante. | `rescate.js:313`, `386-387`; `RESCATE.md:49` |
| 32 | `PHASES.crews` (0 en permisos) | La cuadrilla queda reservada toda la obra. | `rescate-data.js:113`; `rescate.js:115` |
| 33 | `workRequirements`: «cada fase tiene su lista» | Todo es `ok: true` salvo la caja. Es decorado y no se enseña. | `rescate.js:370-379` |
| 34 | «Seguro anual de la flota» | Solo se paga en 2027. | `rescate.js:44` |
| 35 | Escándalo: «Comprar el silencio del periodista: se acaba la noticia» | El daño ya está hecho; lo que hace es sumar apoyo positivo. | `rescate.js:975` |
| 36 | `cor-comision` (Íñigo: «el fabricante te ofrece una atención…») | Nunca se usa: la comisión es un interruptor mudo en los planificadores. | `rescate-data.js:416`; `rescate-ui.js:220`, `250` |
| 37 | Pacto de no agresión, `corrupt: true` | No suma sospecha ni secreto al firmarlo. El campo no se lee. | `rescate-data.js:341` |

Otros datos muertos:
- `flags['halfwork-…']` (417), `noStrike` (300) y `ribbon` (154) no se leen.
- Los textos `blurb` de los corredores, `pitch` de los megaproyectos, `dilemma` y `obstacles` de las etapas, `drivers` de los grupos y `note` de las ofertas **no se enseñan**.

### E.2 Azar sin causa (o sin explicación)
- **Suceso semanal:** 20 % desde la semana 5 (`rescate.js:925`), por pesos (888-900).
  - Sin causa del jugador: avería (3), cable (1), calor (2, de temporada), nevada (2, de temporada), viral (1, regalo), desprendimiento (1), fondos (1, regalo) y visita (1).
  - Con causa (el buen patrón): huelga (trabajadores <38), auditoría (pruebas >12), túneles (BCBB y Cantabria).
  - En 4 años simulados: 14 averías, 6 desprendimientos y 5 virales.
- **Averías silenciosas** (1203) y **pruebas fallidas** con un 12 % (1215): solo van a `report.events`, y la interfaz **no enseña el informe**. Solo hay un aviso «Semana N · ±X» (`rescate-ui.js:433`). Tampoco se ven el importe de la OSP, el leve, la ayuda cobrada ni la obra parada por falta de caja.
- **Ofertas de pacto:** un 9 % semanal al azar (684-688), en vez de responder a una situación (Paco cuando el Norte mejora, Fermín cuando los trabajadores están bajos…).
- **Apuestas explícitas:** negar 45 %, abogados 50 %, juez 30 %, Charo 75 %, extorsión 25 % para que ocurra, enchufe 2 %/semana, mariscada 60 %. Al menos se enseñan como apuestas.
- **Regalos sin mérito:** fondos (+0,5 y 2 ★) y viral (+5 viajeros y 3 ★).

### E.3 Exceso de texto, cajas dentro de cajas y cosas solo decorativas
- Las páginas son hojas con teselas, y las teselas llevan filas o columnas: Pactos con 4 columnas de texto, 7 sobres con una frase cada uno, megaproyectos con requisitos, coste y beneficio, préstamos. El globo del tutorial se mete dentro del modal.
- Las propuestas de pacto ponen 4 columnas de 1-2 frases debajo de una cita: mucho texto para leer en cada propuesta.
- 11 páginas y 8 capas son muchas entradas. Tres capas son decorado (Catenaria, Ancho, Velocidad) y además están mal en Norte, Sur y Asturias (§F).
- En móvil el raíl ocupa toda la fila, las capas son puntos sin nombre y las etiquetas del mapa se pisan.
- La Gaceta es solo ambiente (bien), pero ocupa una página entera.
- El árbol tecnológico mezcla los efectos de juego con «Fontanería»; para un modo único conviene mover la rama corrupta a Cloacas.
- Solo 3 de 70 líneas tienen voz. Casi todo se lee.

### E.4 Otros fallos
- La OSP y la caja descuadran en la cabecera (§C.1).
- `openQuote` monta un estado falso para calcular el coste (455); funciona, pero es frágil.
- `serviceForecast` con plan supone 300 plazas por tren (207) en vez de las de la flota real.
- En la semana 208 llegan 4 modales seguidos.
- El rival Íñigo (Autocares Meseta, autobuses) es quien anuncia Lowgo (`ev-lowgo`), propone la comisión del fabricante y el yate con BCBB: el personaje no tiene una identidad coherente.

---

## F. ¿Puede el motor llevar una red real con ancho, tensión y velocidad?

### F.1 Lo que hay hoy
- **El estado es por corredor y escalar:**
  - `track`, `punct`, `signal`, `capacity`, `elec` (booleano), `potBonus`, `works`… (`rescate.js:59-62`);
  - las obras modifican el corredor entero (`applyWork`, 1311-1318).
- **Los tramos existen solo para el mapa:**
  - `baseSegments` (75-82) recorre `infra.js` con Dijkstra (LAV ×3) y pone `track: 'doble'` **siempre** (80);
  - `segmentsOf` (84) mezcla `s.segs[key]`, que **nadie escribe**;
  - `def.segments` (78) permite fijarlos a mano, pero ningún corredor lo usa;
  - solo los lee `rescate-map.js:117`.
- **Ancho y velocidad no afectan al juego.**
- **La tensión** se reduce a `c.elec`: −3 de puntualidad y energía ×1,5 (`rescate.js:176`, `223`).
- **Los trenes** no tienen tracción, ancho, tensión ni velocidad (`rescate-data.js:75-84`). Un Civia eléctrico circula por Extremadura sin catenaria pagando gasóleo; un 592 diésel en el Norte paga energía eléctrica.

### F.2 Errores de `baseSegments` frente a `segments.json`
Comprobado con `scratchpad/unify/tools/segs.mjs`:

| Corredor | Tramo | Motor (infra.js) | Real | Causa |
|---|---|---|---|---|
| norte | pal-leo | 115 km, **std**, **25 kV**, 280, doble (LAV) | 123 km, ib, 3 kV, 155, doble | en `infra.js` no hay convencional Palencia–León; solo `pal-leo` LAV |
| sur | cor-sev | 127 km, **std**, **25 kV**, 240, doble (LAV) | 129 km, ib, 3 kV, 155, mixta | en `infra.js` no hay convencional Córdoba–Sevilla |
| asturias | leo-pol | 71 km, **mixto**, **25 kV**, 220 (Variante de Pajares) | 108 km, ib, 3 kV, 115, mixta (Rampa) | el tramo `leo-pol` de `infra.js` es la Variante, pero el corredor se llama «Rampa de Pajares» |
| todos | — | `track: 'doble'` | única en: Levante enc-xat (53); Sur lin-cor (127); Ebro mir-log y log-cst (146,6); Extremadura tal-pla (134); Teruel zar-ter y ter-sag (320); Soria trb-sor (93); Cantabria pal-san (217) | constante en `rescate.js:80` |
| varios | vmax | pequeñas diferencias: Norte vdb-pal 160 frente a 130; Teruel ter-sag 160 frente a 90; Ebro bil-mir 90 frente a 92… | segments.json | velocidades de `infra.js` |

Además los km del dato `km` (que usan los costes) no cuadran con la suma de tramos:

| Corredor | km del dato | Motor | Real |
|---|---|---|---|
| Norte | 345 | 414 | 421 |
| Levante | 390 | 485 | 487 |
| Sur | 470 | 568 | 571 |
| Ebro | 300 | 340 | 340,6 |
| Extremadura | 440 | 488 | 477 |
| Teruel | 330 | 361 | 349 |

Resumen real por corredor (cálculo propio sobre `segments.json`; tiempo con la fórmula del clásico, km/max(40, v×0,84)×60):

| Corredor | km | Ancho | Tensión | Vía | Velocidad media | Minutos |
|---|---|---|---|---|---|---|
| norte | 421 | ib | 3 kV entero | doble 384, mixta 37 | 138 | 222 |
| levante | 487 | ib | 3 kV | única 53 | 153 | 229 |
| sur | 571 | ib | 3 kV | doble 148, mixta 296, única 127 | 144 | 285 |
| mediterraneo | 347 | ib 274, mixto 73 | 3 kV | doble | 179 | 141 |
| ebro | 340,6 | ib | 3 kV | doble 90, mixta 104, única 146,6 | 119 | 215 |
| galicia | 155 | ib | **25 kV entero** | — | 179 | 62 |
| asturias | 170,6 | ib | 3 kV | doble 62,6, mixta 108 | 111 | 110 |
| extremadura | 477 | ib | **25 kV 209 + sin catenaria 268** | — | — | 198 |
| teruel | 349 | ib 320, mixto 29 | **sin catenaria 320** + 3 kV 29 | única 320 | — | 204 |
| soria | 249 | ib | 3 kV 156 + **sin catenaria 93** | — | — | 139 |
| cantabria | 217 | ib | 3 kV | única 217 | 120 | 129 |

Consecuencias de juego si la compatibilidad pasa a ser real:
- La flota inicial (Civia de 3 kV) **no podría circular** en Galicia (25 kV) ni en Extremadura, Teruel o Soria (sin catenaria).
- El dato `elec: true` de Galicia y `elec: false` de Extremadura y Soria (parte electrificadas) se queda corto: hace falta tensión por tramo.

### F.3 Cuánto cuesta llevar una red real
Lo que ya ayuda:
- `segmentsOf` y `s.segs` están pensados para guardar cambios por tramo;
- `def.segments` permite meter a mano los datos de `segments.json` sin tocar `infra.js`;
- las funciones de `rules.md` (`compatibilidad`, `tiempoDeViaje`, `modoTraccion`) y `compat()` de `market.md` son puras y entran tal cual;
- el planificador ya calcula «antes y después», así que añadir minutos o compatibilidad al presupuesto es natural.

Lo que habría que cambiar:
1. **Estado por tramo:** `s.segs[key] = {track %, elec, gauge, vmax, vías: 1|2, apartaderos, obra}`. La puntualidad del corredor sale de sus tramos:
   - vía: media ponderada por km, o el peor tramo para ser exigente;
   - capacidad: la del cuello de botella (vía única → capacidad menor);
   - tensión y velocidad: por tramo.
2. **Tramos compartidos:**
   - mad-alc lo usan Levante y Sur;
   - vlc-sag, Mediterráneo y Teruel;
   - los nodos `pal`, `leo` y `mad` son comunes.

   Hoy cada corredor es una línea aislada y renovar Levante no mejora el tramo común con el Sur. Con tramos, una obra en Madrid–Alcázar ayuda a los dos y también corta los dos. La decisión es más interesante y más creíble.
3. **Obras por tramo:** así se cumple literalmente lo que dice Benito en `t-3` (Ávila–Medina). Obras nuevas: duplicar vía en tramos únicos, electrificar eligiendo 3 o 25 kV, pasar de 3 a 25 kV, tercer carril o mixto, y cambiador de ancho. Coste por km del tramo.
4. **Trenes con ficha técnica** (tracción, tensiones, ancho, vmax): `serviceQuote`, `reorganize`, `openCorridor` y la vuelta del taller exigen compatibilidad. El gálibo de Cantabria resuelve el suceso de los túneles (§E.1 #2).
5. **Velocidad → minutos → demanda:** hoy `serviceForecast` no mira el tiempo. Un factor `(minutos de referencia/minutos)^0,5` acotado entre 0,8 y 1,2 hace que renovar a más velocidad y el material rápido sirvan para algo, sin mover la línea base si la referencia es la flota inicial.
6. **Arreglar Norte, Sur y Asturias** con `segments` a mano, y añadir `track` (única/doble/mixta) desde `segments.json`.
7. **La geometría del mapa** usa su propio Dijkstra (`rescate-map.js:15-27`). Para Norte y Sur se puede reutilizar la polilínea LAV como aproximación visual. Para la Rampa de Pajares hace falta geometría nueva.
8. **Km reales:** pasar de 345 a 421 en el Norte encarece la renovación de 2,35 a unos 2,86 M€. `rescate-test.mjs:18` y `rescate-ui-test.mjs:55` exigen 2,35, y `RESCATE.md:15` también lo dice; ninguna voz grabada lo menciona. Si se quiere mantener la cifra, hay que bajar el `perKm` de renovar a unos 0,0056 o renovar solo los tramos malos (Ávila–Medina, 86 km).
9. **Lo que obliga a reestructurar:** los ids de corredor aparecen fijos en el motor (`norte`, `levante`, `sur`, `asturias`, `mediterraneo`, `soria`, `teruel`, `extremadura`, `cantabria` en 184, 194-196, 453, 466, 651-652, 890, 899, 907, 947-948, 1018, 1061-1072, 1081, 1105-1106, 1278). Las etapas están cableadas en `switch (st.id)` (1062, 1116). Una red de más de 11 corredores, o de servicios que se cruzan, pide pasar de «corredor = servicio = vía» a «servicio sobre tramos».

**Veredicto:** el bucle, la economía, la presentación de decisiones y el modelo de pactos y etapas valen para una red real. El modelo físico (corredor escalar) hay que sustituirlo por tramos compartidos y material con ficha técnica. Los ganchos (`segmentsOf`, `s.segs`, `def.segments`) ya están puestos.

---

## G. Qué funciones son puras o portables

**`rescate-data.js`:** solo datos, sin dependencias. Portable entero.

**`rescate.js`:** sin DOM. Solo importa `rescate-data.js` y `TRAMOS` de `infra.js` (6), y esto último solo para `netPath`. Funciona en Node. El azar es `rand(s)`, guardado en `s.rng`. Ninguna consulta consume azar.

- **Consultas sin efectos** (no cambian el estado):
  - `dateOf`, `dateLabel` (usa `Intl`), `yearOf`, `quarterEnd`, `stageOf`;
  - `baseSegments` (con caché en el módulo), `segKey`, `segmentsOf`, `corridorDef`, `isOpen`, `ordersLeft`, `hasTech`, `mod`;
  - `crewsBusy`, `crewsFree`, `crewInfo`, `trainsAvailable`, `trainsIdle`;
  - `upcoming`, `cashProjection`, `dueWithin`, `committed`, `plannedAid`;
  - `punctTarget`, `serviceForecast`, `corridorCost`, `weeklyAccounts`, `territoryOsp`, `ospWeekly`, `ospCompliance`, `fmt`;
  - `workQuote`, `punctProjection`, `workSchedule`, `workStatus`, `workRequirements`, `cancelQuote`, `serviceQuote`, `openQuote`;
  - `revisionCost`, `revisionWeeks`, `trainQuote`, `loanQuote`, `pactTerms`, `pactActive`, `activePacts`, `techState`, `achievement`, `megaState`, `bribeState`, `eventChoices`;
  - `groupTargets`, `support`, `electionForecast`, `totalPax`, `nextMilestone`, `stageProgress`, `obstacles`, `finalVerdict`, `personName`, `stopReasons`;
  - `serialize`, `validate`, `load`.
- **Órdenes** (cambian `s`, deterministas salvo donde se indica):
  - `newGame`, `startWork`, `accelerateWork`, `resumeWork`, `cancelWork`, `reorganize`, `openCorridor`, `sendRevision`;
  - `hireCrew`, `fireCrew`, `rentTrain`, `buyTrain`, `sellTrain`, `takeLoan`, `licenseTerritory`;
  - `respondPact` (azar al negociar), `buildStation`, `research`, `startMegaStage`;
  - `bribe` (azar con el juez y con Charo), `answer` (azar al negar, con abogados y al esperar tras el desprendimiento);
  - `closeWeek` y `advance` (azar en sucesos, averías, pruebas, cloacas y ofertas).
- **Sin exportar:** todo el sistema de cloacas, los sucesos, pactos (`signPact`, `breakPact`, `fulfilPact`, `pactCheck`, `updatePacts`, `offerPacts`), grupos, hitos, programa, etapas y elecciones (`takeKickback`, `exposeSecret`, `offerCorruption`, `extortion`, `judicialWeek`, `randomEvent`, `addGroups`, `updateGroups`, `checkMilestones`, `checkProgram`, `evaluateStage`, `election`, `applyWork`, `record`, `pushGaceta`). Para moverlos a otro motor hay que exportarlos o copiarlos.
- **Exportadas que ni la interfaz ni las pruebas usan:** `committed`, `dueWithin`, `trainsAvailable`, `workRequirements`, `sellTrain` (solo desde el impago) y `stopReasons` (solo dentro de `closeWeek`).

**Portables con cambios pequeños:**
- `serviceForecast`, `punctTarget` y `corridorCost` dependen de los ids fijos y del estado por corredor (§F.3.9).
- `groupTargets` lee `s.corridors.mediterraneo` y el apeadero del Norte.

**`rescate-map.js`:**
- Puros: `GEOMETRY`, `pointAt`, `slice`, `LAYERS`, `punctColor`, `trackColor`, `ELEC_COLOR`, `GAUGE_COLOR` y `speedColor`.
- `RescueMap` depende de `map-v3.js` (`RailMap`) y del canvas.

**`rescate-ui.js`:** todo vive dentro de la función de `mountRescue`. Para reutilizarlo hay que extraerlo:
- `talk`, `speak`, `coach`, `TUTORIAL`;
- los planificadores y las páginas;
- `esc`, `icon` y `P`, que se pueden sacar a un módulo de componentes.

**Pruebas que fijan contratos** (cuidado al unificar):
- `rescate-test.mjs:15-47`:
  - caja 12, 4 trenes, 2 cuadrillas, Norte 62;
  - renovar el Norte: 2,35, 7 semanas, 1 cuadrilla, ayuda 1,2, 80 % o más;
  - con autobuses ≥80 en la semana 13 y por fases <80;
  - kafka a 3 que llega en la semana 5; un tren más en el Norte suma <1,2;
  - 3 órdenes;
  - la ayuda se cobra al certificar;
- `rescate-test.mjs:191-192`: el bot gana al menos la mitad y aprueba siempre s1;
- `rescate-ui-test.mjs`:
  - textos «2,35 M€», «+1,2 M€ al terminar», «Sem. 8» y «✗/✓ N % en la semana 13»;
  - fotos de BCBB y Dörfler;
  - 7 pasos de tutorial;
  - Paco con «votantes, los suficientes»;
  - 4 condiciones del pacto, 9 páginas, guardado con la clave `tenfe-rescate-v1` y móvil sin desplazamiento horizontal.

---

## Anexo: voces y diálogos (para el plan de unificación)
- 70 líneas en `LINES` (`rescate-data.js:369-446`). 69 se usan; `cor-comision` nunca.
  - Las de etapa y extorsión se piden componiendo el id (`'stage-' + id`, `'ext-' + who`).
- **Grabadas solo 3:** `t-1`, `t-2` y `paco-estacion` (`assets/rescate-voices.js`; manifiesto con «recorded»: 3). Ningún texto del rescate coincide con los 412 diálogos clásicos grabados (comprobado), así que **no hay grabaciones clásicas que aprovechar**.
- Reescribir cualquiera de las otras 67 no tira ninguna grabación. Las tres grabadas son:
  - `t-1`: «Bienvenido a Tenfe… no hay dinero, no hay trenes y el Norte llega tarde… Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda.»
  - `t-2`: «Pincha en el corredor Norte del mapa. Ese que parpadea en rojo.»
  - `paco-estacion`: «Ministro, mi pueblo necesita una estación…»
- Las imágenes del rescate (63) están todas.
