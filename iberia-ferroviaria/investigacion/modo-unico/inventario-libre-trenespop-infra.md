# Inventario: modo libre, Trenespop y capa de realismo de infraestructura

Fuente leída: `/home/user/putarenfe/iberia-ferroviaria/proyecto/dist/*.js` (las referencias `archivo:línea` son de esa carpeta salvo que diga `proyecto/`). Todo lo numérico se ha comprobado ejecutando los módulos en Node (scripts en `scratchpad/unify/tmp/`: `infra-dump.mjs`, `cmp.mjs`, `market.mjs`, `routes.mjs`, `calib.mjs`, `works.mjs`). Se han verificado y ampliado `scratchpad/market.md` y `scratchpad/rules.md`: sus cifras y líneas de `app.js`, `engine.js`, `infra.js` y `marketplace.js` son correctas a fecha de esta lectura (las de `rescate*.js` pueden moverse, otro agente las edita).

---

## (a) Modo libre frente a campaña

El modo libre **no es un motor aparte**: es la misma partida clásica (`engine.js`, `tycoon.js`, `operations.js`) con `state.tycoon.mode === 'free'`. Se crea así (`app.js:1283`): `state = E.initialState(); T.freeGame(state, cash, rivals); O.ensureOps(state); state.ops.day = 3; state.started = true; state.tutorial = {done: true}`.

`T.freeGame` (`tycoon.js:19`): solo acepta `cash ∈ {500, 1500, 5000}` y `rivals` booleano; falla si la partida ya empezó o `month !== 0`; pone `s.cash = cash`, `mode = 'free'`, `rivals`.

| Aspecto | Campaña | Modo libre | Dónde |
|---|---|---|---|
| Arranque | `initialState()` (`engine.js:22-27`): 500 M€, 80 trenes (s100×12 56 % 1992, s112×22 78 %, s103×16 82 %, s130×14 72 %, s730×8 74 %, s120×8 64 %; `engine.js:24`), 8 servicios abiertos (`START_SERVICE`, `engine.js:18`) | Igual, pero caja 500/1.500/5.000 M€ | `tycoon.js:19` |
| Tutorial guiado | Sí (inducción) y primera decisión `inaugural` al empezar (`app.js:1165` `showDecision()`) | No: `state.tutorial={done:true}` | `app.js:1283` |
| Rivales (OuiOui / YaIré) | Siempre | Conmutables (`freeRivals`); sin rivales `marketEntry` devuelve `null` | `tycoon.js:21` |
| Capítulos con objetivos y premio (100/180/260/350/500 M€) | Sí, 5 (`story.js:14-19`) | No: `chapterReady` → `false` | `engine.js:184` |
| 15 decisiones con fecha (`DECISIONS`) | Sí | No: `pendingDecision` solo devuelve imprevisto o encuentro | `engine.js:155` |
| 22 imprevistos (`EVENTS`) y 315 encuentros | Sí (32 %/mes; encuentro cada 3 meses, bloquean el avance) | Sí, igual | `engine.js:157-162`, `tycoon.js:158` |
| Encargos (contratos de `tycoon`) | Sí; primer encargo `arc = s.chapter` | Sí; `arc = t.arc % 5` | `tycoon.js:146` |
| Peticiones de ciudades | Hasta el mes 346 | Siempre | `engine.js:233` |
| Guerra de autobuses cada 18 meses | Hasta el mes 340 | Siempre | `engine.js:230` |
| Fin por fecha | 31-12-2050 (`month>=348`) | No hay; `validateSave` admite hasta `month 12000` | `engine.js:235`, `engine.js:270` |
| Cese político (Gobierno < 15 durante 6 meses) | Termina la partida | No termina | `tycoon.js:165` |
| Quiebra (caja < −100 con deuda 1.500) | Termina | Termina igual | `engine.js:232` |
| Calendario | `effectiveMonth = min(month, 347)` | Sin tope; la inflación sí se congela en 2050 (`economicYear = min(2050, yearOf)`) | `engine.js:10-12` |
| Logro exclusivo | — | «Más allá de 2050» | `tycoon.js:187` |
| Guardado | Clave única `iberia-ferroviaria-v2` (`app.js:31`) | La misma: empezar libre sustituye la campaña (aviso en `app.js:1283`) | |

Lo que el modo libre deja hacer es **exactamente lo mismo que la campaña** (abrir/cerrar relaciones, crear relaciones nuevas, comprar en Trenespop, obras de vía, cambiadores, líneas propias, grandes proyectos, estaciones, políticas, investigación, contratación, préstamos, jornada diaria), solo que sin guion ni meta. Los contratos históricos (S106, `HISTORICAL_ORDERS`, `data.js:69-73`) y las obras históricas (`infra.js:15-21`) llegan igual en su fecha.

Interfaz específica del modo libre:
- Portada: botón «Modo libre» `data-action="free-setup"` (`main-menu.js:53`); resumen de guardado «Modo libre» (`main-menu.js:24`).
- Modal de configuración `free-setup` (`app.js:1282`): select `#freeCash` (500 «ajustada», 1500 «expansión», 5000 «constructor»), checkbox `#freeRivals`; confirmación si hay guardado (`app.js:1283`).
- Panel de misión: «Modo libre · Tu red, tus reglas» (`app.js:663`).
- Despacho → pestaña «Campaña»: cartel «Modo libre» con botón «Nueva partida» (`app.js:960`).
- Dirección: «Modo libre · sin objetivos obligatorios» (`tycoon-ui.js:71`); en Competencia, aviso si no hay rivales (`tycoon-ui.js:90`).

Problemas del modo libre:
1. **«Nueva partida» del modo libre arranca una campaña**: `app.js:960` emite `data-action="new-game"`, cuyo modal (`app.js:1385`) dice «Nueva campaña… Empezar en 2022» y llama a `campaign-confirm` → `beginCampaign()` (`app.js:1290`, `1164`).
2. El panel de misión en libre hace `return` antes de pintar las peticiones de ciudades y los picos de demanda (`app.js:663` frente a `668`): en libre esa lista no aparece (solo los pines del mapa).
3. La pestaña «Campaña» del Despacho sigue visible en libre (`app.js:838`).
4. No hay meta, ni progresión, ni presión narrativa: los únicos ingresos extra son encargos y peticiones. La caja de 5.000 M€ anula el reto (una LAV propia Madrid–Badajoz cuesta 458 M€).

---

## (b) Trenespop

### Dónde vive y cómo se llega
- Trenes → pestañas «Parque y taller», «Trenespop», «Mis compras» (`app.js:832-836`); alias `market` → `fleet/fleetTab/market` (`app.js:60`).
- En Trenespop el cajón cambia de piel: clase `trenespop-drawer` (`app.js:749`) y tira propia «‹ Mi parque · Compra material para tu red · ×» (`app.js:834`).
- No hay ningún acceso desde una relación incompatible: la ficha de relación dice «Ningún tren tuyo puede ir por esta vía. Compra uno que sí» (`app.js:1039`) pero no abre Trenespop filtrado.
- Ojo, colisión de nombres: `ui.fleetTab='market'` es Trenespop y `ui.tycoonTab='market'` es «Competencia» (`tycoon-ui.js:68`).

### Catálogo `MODELS` (`data.js:57-67`)
Campos: `id, name, family ('AVE'|'Alvia'), maker, gauge ('uic'|'variable'), power ('electric'|'hybrid'), speed (km/h), seats, price (M€), lead (meses), year (a la venta desde), energy (factor de coste), desc`. **No hay campo de tensión, ni ancho ibérico fijo, ni diésel puro, ni regionales.**

| id | Nombre | Familia | Fabricante | Ancho | Tracción | km/h | Plazas | M€ | Meses | Año | energy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| s100 | S100 · AVE | AVE | Malstom | uic | eléctrico | 300 | 329 | 16 | 30 | 2099 (solo usado) | .78 |
| s112 | S112 · AVE «Pato» | AVE | Tardo | uic | eléctrico | 330 | 365 | 25 | 30 | 2022 | .62 |
| s103 | S103 · AVE Velaro | AVE | Schlimmens | uic | eléctrico | 350 | 404 | 33 | 34 | 2022 | .66 |
| s106f | S106 · AVE Avril | AVE | Tardo | uic | eléctrico | 330 | 521 | 29 | 36 | 2024 | .58 |
| av2030 | AV 2030 · Nueva generación | AVE | Tenfe | uic | eléctrico | 350 | 540 | 36 | 42 | 2026 | .48 |
| s120 | S120 · Alvia | Alvia | KAFKA | variable | eléctrico | 250 | 238 | 18 | 26 | 2022 | .6 |
| s130 | S130 · Alvia «Patito» | Alvia | Tardo | variable | eléctrico | 250 | 299 | 21 | 28 | 2022 | .62 |
| s730 | S730 · Alvia híbrido | Alvia | Tardo | variable | híbrido | 250 | 265 | 24 | 30 | 2022 | .8 |
| s106v | S106 · Avril variable | Alvia | Tardo | variable | eléctrico | 330 | 507 | 31 | 38 | 2024 | .6 |

Etiquetas: `GAUGES`, `POWERS`, `ELECS` (`data.js:88-90`). El ancho del tren se escribe `'uic'` y el de la vía `'std'`.

Comparado con `trains.json`:
- s103: el juego da 404 plazas y 33 M€; la ficha real, 405 y unos 38 M€. Solo 25 kV.
- s112: 25 M€ frente a 29 M€; solo 25 kV.
- s130: 21 M€ frente a 25 M€.
- s730: 265 plazas frente a 262 de Renfe (265 en Wikipedia); 24 M€ frente a 30 M€; en diésel va a 180 km/h real, pero el juego lo limita a 160 (`infra.js:132`).
- s106f: 521 plazas frente a 507 (AVE) o 581 (Avlo).
- av2030 lleva como fabricante a **Tenfe**, que es el operador.
- Faltan todos los trenes de ancho ibérico de `trains.json`: 463, 465, 449, 470, 480, 592, 594, 599, el BMU de Dörfler…

### Anuncios (`marketplace.js:24-37`)
- **Nuevos**:
  - Un anuncio por cada modelo con `year < 2099` (`new-<id>`), más dos «equivalentes»: `new-dorfler-s120` («Dörfler · Alvia a medida»: perfil de S120, `priceFactor 1.04`, `leadAdjustment −4`) y `new-bcbb-s103` («BCBB · Alta velocidad»: perfil de S103, `priceFactor .76`, `leadAdjustment −8`).
  - Todos con `stock 30` que nunca baja, estado 100 y vendedor «<marca> · fábrica».
- **Usados** (8 modelos: `usedModels`, `marketplace.js:14`):
  - Un lote por modelo y semestre (`marketPeriod = floor(month/6)`, `marketplace.js:20`), con id `used-<modelo>-<periodo>`.
  - Solo aparecen modelos ya lanzados (`AVAILABLE_YEAR = {s100: 2022}`). Con `i` = posición en esa lista:
    - estado `59 + (i·7 + periodo·5) % 29` (59-87 %);
    - stock `2 + (índice + periodo·3) % 5` (2-6);
    - edad: `max(8, año − 1992)` para el s100 y `6 + (i + periodo) % 8` para los demás;
    - `priceFactor = .30 + estado·.0035`;
    - plazo `[0, 1, 3, 6][(i + periodo) % 4]` meses;
    - vendedor de `yards` y ciudad de `['Valladolid','Toledo','Madrid','Zaragoza']`.
  - El stock vendido se resta con `s.marketplace.sold[id]`.
  - Ejemplo en el mes 0: `used-s100-0`, estado 59 %, 30 años, 2 uds., 8,10 M€, entrega inmediata.
- **Precio** (`engine.js:93-100`):
  - Precio estándar: `m.price · (1 + max(0, economicYear − 2022)·.018)`.
  - Cartera pendiente (`backlog`): unidades sin entregar de pedidos nuevos.
  - Plazo: `max(16, m.lead + floor(backlog/10)·2 + (flag backlog ? 8 : 0) − (flag factory ? 6 : 0))`.
  - Encima, `quoteListing` (`marketplace.js:43-52`):
    - unidad = estándar × `priceFactor`;
    - plazo: el del anuncio si es usado; `max(16, estándar + leadAdjustment)` si es nuevo;
    - plazo 0 → se paga el 100 % y se entrega ya; si no, 30 % de anticipo;
    - último lote: `plazo + ceil(cantidad/2) − 1`.
  - Errores: anuncio inexistente, modelo que no corresponde, año aún no alcanzado, cantidad mayor que el stock.

### Funciones de la interfaz (`marketplace.js:107-124`, `app.js`)
| Función | Implementación |
|---|---|
| Cabecera | logo Trenespop (`market-reset`), buscador `#marketSearchForm/#marketSearch`, botón Favoritos con contador (`marketplace.js:112`) |
| Categorías | «España» · Todos / Alta velocidad (`family AVE`) / Ancho variable (`family Alvia`) / «Mis compras» (`fleet-tab orders`) (`marketplace.js:113`) |
| Filtros | `#marketState` (todos/nuevo/usado), `#marketDelivery` (inmediato, ≤3, ≤12 meses), `#marketMaker` (6 marcas), «Limpiar filtros» (`marketplace.js:114`); ordenar `#marketSort`: relevantes, precio, entrega, estado (`marketplace.js:116`, `98-100`) |
| Búsqueda | título, marca, familia, vendedor y ciudad, sin acentos (`marketplace.js:95`) |
| Tarjeta | foto (`photoKey`: BCBB→`bcbb`, Dörfler→`dorfler`, resto → modelo; `marketplace.js:7`), sello «Nuevo» o «Usado · N %», corazón, precio por unidad, título, `velocidad · plazas · equivalente`, envío, ciudad + uds., logo del fabricante (`marketplace.js:117`) |
| Ficha | volver, foto con sello, vendedor («Vendedor verificado · ciudad») con logo y corazón, descripción (+ nota de equivalencia), etiquetas (velocidad, plazas, ancho, tracción, estado, edad/stock), cantidad `#buyQty` (por defecto `min(stock usado o 4, 4)`), presupuesto `#purchaseQuote` (Total, Anticipo 30 % o «A pagar ahora», Primer lote o «Ahora mismo», último lote, aviso de caja; `app.js:1207-1211`), botones «Comprar y recibir» / «Comprar con envío» / «Seguir mirando» (`marketplace.js:124`) |
| Favoritos | `favorite()` alterna; como mucho 200 (FIFO); se guardan en `s.marketplace.favorites`; comprueba que el anuncio existe (`marketplace.js:53-59`; `app.js:1372`) |
| Pedidos y entregas | `E.buy` (`engine.js:101-110`) crea `{id:'o'+n, model, qty, delivered, start, first, next, total, remaining, unit, delay, historical:false, marketplace:{listing,state,maker,condition,born,depositRate}}`. Cada mes (`engine.js:218-223`): los pedidos nuevos tiran un retraso una vez (28 %, de 2 a 6 meses); llegan `min(2, pendientes)` unidades al mes y se pagan `unidad·(1 − anticipo)`; sin caja se retiene la entrega. Los usados no tiran retraso (`delayChecked = true`). Altas en el parque: `addPurchasedFleet` (`engine.js:187-193`, origen «Trenespop o…», estado y año de fabricación reales) |
| Mis compras | lista de pedidos con barra, fabricante, estado de ocasión, próximo lote, retraso y pendiente, más la tabla de contratos heredados (`app.js:888-895`) |
| Venta | **No está en Trenespop**: va en la ficha del lote (`app.js:1189-1197`). `sell`: `qty·price·.23·estado/100` con el precio base sin inflación (`engine.js:113`). No se puede revender por más de lo pagado |
| Reforma | 12 % del precio base, 5 meses, vuelve al 98 % como lote nuevo (`engine.js:112`, `224`) |
| Depreciación | Solo por estado: −0,29 al mes en uso y −0,08 parado (×0,8 con mantenimiento predictivo, ×1,2 si se externaliza), más `(mantenimiento − 1)·.35`, con suelo en 15 (`engine.js:214`). **La edad no afecta ni al valor ni a las averías.** El precio de un usado no depende de su edad: un S100 de 35 años al 80 % cuesta más (10,12 M€, mes 60) que el mismo con 30 años y al 59 % (8,10 M€, mes 0) |
| Compatibilidad por relación | **No existe.** Ni filtro, ni marca en la tarjeta, ni tabla en la ficha. La ficha solo muestra las etiquetas de ancho y tracción |
| Fotos / «3D» | `train3d.js`: ya no usa WebGL. `trainThumb(clave)` pone una foto de `assets/train-photos.js` (8,4 MB en data URI; 25 series, alias en `TRAIN_PHOTO_ALIASES`) o la foto propia del fabricante (`MAKER_PHOTOS` bcbb/dorfler → `assets/rescate/tren-*.webp`, con la serie equivalente de reserva; `train3d.js:13-18`). Si no hay foto, «Fotografía en preparación». `mountViewers` rellena `[data-train3d]` en la ficha del lote, del pedido y del tren (`app.js:1064`, `1192`, `1200`). `train-art.js` dibuja en SVG por familia y solo se usa para el autobús (`train3d.js:20`) |
| Logos | `brands.js`: 11 marcas (6 fabricantes, 4 operadores y Trenespop) en webp base64 dentro de `ART` (2,2 MB); variantes `color`, `white` y `dark`; alias de nombres reales: Talgo→Tardo, CAF→KAFKA, Siemens→Schlimmens, Alstom→Malstom, Renfe→Tenfe, AVLO→AVArato, Lowgo→OuiOui, Rossa→YaIré (`brands.js:8`) |
| Guardado | `validMarketplace` y `validMarketplaceOrder` (`marketplace.js:60-84`) recalculan el stock vendido a partir de los pedidos; `validateSave` lo exige (`engine.js:287`) |

Incoherencias de Trenespop:
1. **Dörfler**: se anuncia como «Alvia a medida» (copia exacta del S120: ancho variable, 250 km/h), pero su foto dice «Dörfler · LIRIO 4», un regional (`train3d.js:13`).
2. **BCBB**: es alta velocidad (S103), pero el texto alternativo de la foto dice «Fuxing Regional», y la descripción de la imagen (`rescate-data.js:466`) es de un tren de alta velocidad.
3. El parque muestra el lote comprado a Dörfler con la foto y el nombre del S120 (`app.js:876`).
4. El stock de los anuncios nuevos es fijo en 30. La edad de los usados va saltando entre semestres y no crece de forma lógica.
5. Alias de fotos erróneos: `470→592` en `assets/train-photos.js` y `470: 'camello'` en `train-art.js:45`. La 470 es una eléctrica de 3 kV (la antigua 440), no el diésel 592.
6. `purchaseDialog` y la acción `purchase` (`app.js:1198-1202`, `1367`) son código muerto: ningún botón emite `data-action="purchase"`.
7. Los textos de las notas sí coinciden con el motor: retraso de 2 a 6 meses, dos unidades al mes, 70 % por lote, renovación semestral, reforma de 5 meses.

---

## (c) Modelo de infraestructura

### Datos estáticos (`assets/infra.js`, generado con `tools/build_infra.py` desde OSM)
**Nodos: 90** (`infra.js:5`):
- 74 ciudades, 15 bifurcaciones y 1 extranjero (`per`, Perpiñán).
- 11 con cambiador desde el inicio (campo `changer`): gra (Granada), sev (Majarabique), cor, ant (Bobadilla), alb, tar (Roda de Berà), zar (Plasencia de Jalón), med, vll (Valdestillas), leo, our (Taboadela).
- 2 con `changerName`, que entran por histórico: pol (Pola de Lena, 2023-11-29) y bur (Burgos, 2022-07-21) (`infra.js:90`).

**Tramos: 125**:
- `lav` 52 (4.708 km) y `conv` 73 (6.234 km); 10.942 km en total.
- Por ancho: std 51, ib 70, mixto 4 (tdn-huc, leo-pol, sag-vlc, sag-cas).
- Por tensión: 25 kV 61, 3 kV 45, sin electrificar 19.
- Todos los tramos de ancho estándar son de 25 kV. Los tramos de 3 kV no pasan de 200 km/h.
- Campos estáticos: `id, a, b, kind, name, km, gauge, elec, speed, g` (polilínea codificada), `approx` (16 con geometría aproximada: los 14 planificados, alb-mur y mor-alm), `start` (estado en 2022, 6 tramos), `hist` (cambios con fecha, 6 tramos) y `plan` (14 tramos de los `PROJECTS`).
- **No hay campo de vías (única/doble)** ni de gálibo. El rescate se inventa `track:'doble'` (`rescate.js:80`).

**Estado en la partida**: `s.infra = {ver, t:{[id]:{g,e,v,b}}, c:[nodos con cambiador], h:[claves de hist aplicadas], custom:[{id,a,b,km}], done:{elec,conv,changers,lav}}`, creado en `initialInfra` (`infra.js:53-66`). `HISTORY` tiene 5 hitos con fecha real (`infra.js:15-21`), aplicados por `applyHistoric` (`infra.js:79-95`; llamado desde `engine.js:198`).

### Perfiles y recorrido
- `profileOf(m) = {fixed: m.gauge==='uic', electric: m.power==='electric', speed: m.speed}` (`infra.js:104`).
- `PROFILES`: ave (fijo, eléctrico, 300), alvia (variable, eléctrico, 250), hybrid (variable, no eléctrico, 250) (`infra.js:105`).
- `graph(s)` se guarda en caché en `s.__graph` (no enumerable) y se invalida con `s.infra.ver` y con la lista de tramos cortados (`infra.js:108-121`). **Cualquier cambio en `s.infra.t` tiene que subir `s.infra.ver`.**
- `traverse` (`infra.js:124-135`). Faltas posibles:
  - `build`: tramo no construido;
  - `closed`: cortado por una obra `standard`;
  - `elec`: perfil eléctrico en tramo sin catenaria;
  - `gauge`, que se comprueba con `ok = st.g==='mixto' || (mode==='std' ? st.g==='std' : st.g==='ib')`. En modo relajado solo el tren de ancho fijo acumula la falta; el variable se descarta y tiene que cambiar de ancho en un nodo.
- **La tensión no importa**: 3 kV y 25 kV valen igual. Consecuencia: el AVE Madrid–Castelló (25 kV) pasa por `sag-vlc` y `sag-cas`, que son mixto/3 kV.
- `search` (`infra.js:138-180`):
  - Dijkstra sobre (capa del nodo de paso, nodo, ancho).
  - Ancho fijo: modos `['std']`. **No existe el ancho ibérico fijo.**
  - Cambio de ancho en un nodo con cambiador: +12 min (`CHANGE_MINUTES`, `infra.js:12`). Sin cambiador, en modo relajado, +12 + 60 y falta `changer`.
- `plan(s, way, prof)` (`infra.js:183-199`):
  - Busca primero en modo estricto. Un rodeo de más de `km físicos·1,3 + 40` cuenta como bloqueado.
  - Si no hay recorrido, busca en modo relajado para explicar qué falta, y quita faltas repetidas.
  - Devuelve `{ok, tramos[{id,rev}], changes[], faults[], km, minutes}`.
  - Caché por `way + f/v + e/h + velocidad`.
- Textos de las faltas: `faultText` (`infra.js:222-233`).
- Geometría: `pathCoords` y `pathNodes` (`infra.js:236-249`).

### Fórmula del tiempo de viaje
- Por tramo: `top = min(st.v, prof.speed, st.e==='no' ? 160 : 999)` y `min = km / max(40, top·0,84) · 60` (`infra.js:132-133`).
- Total: suma de tramos + 12 min por cambio de ancho, redondeado (`infra.js:172-179`).
- Lo que ve el servicio (`engine.js:47-49`):
  - `pathMin = p.ok ? p.minutes : km/1,5`;
  - `trainTime = ((real && r.minutes ? (r.minutes + pathMin)/2 : pathMin)/60 + 0,1)·tx.speed − cambios·tx.changer/60`;
  - con ERTMS, `tx.speed` = 0,95; el cambiador rápido resta 3 min por cambio (`tycoon.js:33`);
  - cada cambio de ancho resta 1,5 de puntualidad (`engine.js:54`).
- Unidades necesarias (`tycoon.js:42-47`):
  - relaciones reales: `ceil(pico·min(1, f/base)·1,12·lento)`, con `lento = clamp(minPlan/minOficial, 0,8, 1,35)`;
  - propias: `ceil(((min/60 + 0,6)·2) / (15/(f − 1)))`, con un mínimo de 2.
- En la jornada, las relaciones reales usan los minutos del horario oficial y no los de `plan`. Solo heredan `changes`, con un 35 % de probabilidad de incidencia «cambiador» (`operations.js:81-88`, `159`).
- **Calibración** (`calib.mjs`, red de 2027, 72 relaciones reales sin las francesas): `plan / horario oficial` da una mediana de **0,75** (mínimo 0,56, máximo 1,08). La fórmula es un 25 % más optimista que la realidad, porque no tiene paradas ni aceleraciones y el factor 0,84 se queda corto.

### Compatibilidad
- `routeCheck(s,r,m) = I.plan(s, r.via, I.profileOf(m))` (`engine.js:32`).
- `routeOptions` (`engine.js:34`), `canRun` (`engine.js:35`), `isUnlocked` (`engine.js:36`), `bestProduct` (`engine.js:39`).
- Bloqueos que aplican la compatibilidad:
  - `configureRoute` rechaza el tren (`engine.js:82-83`);
  - `validateSave` rechaza un servicio activo con tren incompatible (`engine.js:293`);
  - `supplyOptions` y `readyRoute` de los contratos (`tycoon.js:40`, `49`);
  - `fleetFor/setService` eligen lote por rango AVE > eléctrico > híbrido (`app.js:312-329`).
- Interfaz:
  - ficha de relación «Qué puede circular» con tiempo, km, cambios o faltas enlazadas a tramo o nodo (`app.js:1002-1004`, `1016`);
  - select de material con los incompatibles desactivados (`app.js:1021`);
  - etiquetas AVE/Alvia/Híbrido en la lista de la red (`app.js:814`);
  - vista previa de una relación nueva (`app.js:1225-1231`).

Estado de las 43 relaciones base en 2027 (`routes.mjs`):
- **AVE posible en 14.**
- **Alvia eléctrico en 30** (13 con cambio de ancho).
- **Solo híbrido en 9**: madrid-badajoz, -algeciras, -almeria, -lugo, -soria, -cartagena, -ferrol, valencia-zaragoza y granada-almeria.
- **Ninguno en 2**: murcia-almeria y bilbao-donostia, porque dependen de proyectos.
- Si se exigiera tensión, 17 recorridos Alvia/híbrido mezclan 25 kV y 3 kV (todos los S120/S130/S730 son bitensión en la realidad, así que funcionan), y el AVE a Castelló necesitaría tren bitensión.

### Obras (`infra.js:252-277`, `engine.js:118-133`, `199-207`)

| Obra | base | €/km | meses | efecto | se ofrece si | corta la línea |
|---|---|---|---|---|---|---|
| `renew` (renovación a 220) | 8 | 0,18 | `ceil(4 + km/40)` | `v = max(v, 220)` | `v < 220` | no |
| `electrify` (siempre 25 kV) | 6 | 0,42 | `round(12 + km/10)` | `e = '25kv'`, `done.elec += km` | `e === 'no'` | no |
| `mixed` (tercer carril) | 8 | 0,5 | `round(14 + km/9)` | `g = 'mixto'`, `done.conv += km` | `g === 'ib'` | no |
| `standard` (cambio de ancho) | 5 | 0,3 | `round(8 + km/14)` | `g = 'std'`, `done.conv += km` | `g === 'ib'` | **sí** |
| Cambiador | 18 fijo | — | 10 | nodo añadido a `infra.c` | `changerPossible`: no hay cambiador, el nodo no es extranjero y llegan tramos construidos `std` e `ib` (el mixto no cuenta) | no |

- Coste: `round(base + porKm·km)`. Con el flag `eufunds`: ×0,6, solo en obras de tramo y cambiador (`engine.js:118`).
- Obras que faltan: pasar de 3 kV a 25 kV, de mixto a estándar, desdoblar vía, mejorar el gálibo y electrificar a 3 kV.
- Una obra `standard` corta los servicios que pasan (`active = false`, `cut = id`) y quita `1 + nº afectados` de reputación (`engine.js:123`, `130-131`).
- Retraso: 22 % de probabilidad de +3 a +9 meses al vencer. Se aplica a todo menos mejoras de servicio y cambiadores, también a proyectos y líneas propias (`engine.js:226`).
- Otros cambios de plazo:
  - con el grupo Territorio por debajo de 25, cada 6 meses todas las obras suman 1 mes (`tycoon.js:164`);
  - eventos `adifdelay` (+4) y `adifboost` (−3).
- Líneas propias:
  - presupuesto `newLineQuote`: km = ortodrómica ×1,2; coste `km·1,1 + 25`; plazo `42 + km/10` meses (`engine.js:134`);
  - `buildLine` admite como mucho 40 y crea una relación si los dos extremos son ciudades (`engine.js:135-143`);
  - siempre ancho estándar, 25 kV y 300 km/h (`infra.js:69-72`);
  - ejemplos: Madrid–Toledo, 80 km, 113 M€, 50 meses; Madrid–Badajoz, 394 km, 458 M€, 81 meses.
- Grandes proyectos (`PROJECTS`, `data.js:75-85`): 9 líneas de alta velocidad con coste, plazo y año mínimo (de 90 a 280 M€, de 42 a 84 meses, de 2027 a 2032). `startProject`: `due = max(mes + duración, (earliest − 2022)·12)` (`engine.js:115`).
- Contadores de campaña que dependen de las obras: `electrified`, `converted`, `changers`, `projects`, `mediterranean` y `aveCities` (`engine.js:183`; capítulos en `story.js:15-19`).
- Precios en los tramos de los corredores del rescate (red de 2027): ver `works.mjs`. Ejemplos:
  - Soria `trb-sor` (90,8 km): electrificar 44 M€ / 21 meses;
  - Teruel `zar-ter` (190 km): electrificar 86 M€ / 31 meses;
  - `pal-san` (217 km): ancho mixto 117 M€ / 38 meses;
  - `mad-avi` (121 km): estándar 41 M€ / 17 meses.
- Cambiador posible en 2027 en: mad, bcn, vlc, ali, mur, gua, vdb, pal.

### Textos de la red que no coinciden con el motor (la regla «si el diálogo dice algo, que pase»)
1. La ficha de tramo describe `renew` como «ya pueden pasar los Alvia eléctricos» (`app.js:1127`, rama por defecto del ternario). Esa obra solo sube la velocidad a 220 km/h.
2. La ficha de nodo dice que los Alvia cambian de ancho «en un par de minutos» (`app.js:1139`), pero el motor carga 12 min por cambio (9 con cambiador rápido).
3. `workDialog` y `help` hablan bien de 25 kV y del corte de la línea (`app.js:1264`, `1238`).

---

## (d) Mapa `map-v3.js`: qué conviene conservar

`RailMap` (`map-v3.js:54-761`) es un renderizador en canvas reutilizable. `RescueMap extends RailMap` lo demuestra: solo cambia `drawLines`, `hit` y los colores (`rescate-map.js:73-253`).

- **Base ilustrada** (`drawBase`, `194-269`): halo costero, países (España, Portugal y el resto), textura de papel, sierras con sombra y picos dibujados, ríos, la red ferroviaria de OSM como fondo y rótulos de mares y países.
- **Luz real**: altitud del sol por longitud, de oeste a este, con noche y crepúsculo (`427-469`). De noche, capa de luces urbanas según población, estaciones según tráfico y destellos (`271-291`).
- **Cachés** base, luces, líneas y rótulos, que se recolocan al mover y hacer zoom y se rehacen tras 140 ms quieto (`413-425`, `446`).
- Límite de 30 fps y pausa si la pestaña está oculta. `isVisible` lo regula desde `app.js:96-100`.
- **Capas** (`app.js:33`, botones `[data-layer]` en `index.html:11`):
  - `network`: tramos del horario coloreados por producto, AVE `#a3123a` y Alvia `#2f6f9f`, con grosor `log2(uso)`;
  - `real`: horario oficial por línea;
  - `gauge`: std `#a3123a`, ib `#d08a1c`, mixto `#7a4fb0`;
  - `power`: 25 kV `#2f6fb0`, 3 kV `#3f9a5c`, sin catenaria `#9a7f5c` discontinuo;
  - `works` (`339-355`, `510-582`).
  - En las capas de ancho y tensión, los tramos proyectados se ven discontinuos y una obra en curso aparece como trazo dorado encima (`353-354`).
- **Cambiadores como rombos** de dos colores (punteados si están en obra), bifurcaciones y nodos donde cabe un cambiador (`357-380`).
- **Obras vivas**:
  - la plataforma con el tramo terminado según el avance;
  - traviesas con zoom > 9;
  - 5 hitos de fase (`STAGES`, `operations.js:284`) con nombre si zoom > 16;
  - grúa con baliza intermitente en el frente;
  - etiqueta «nombre · %»;
  - marcadores «P» en los proyectos sin financiar (`510-582`).
- **Selección**:
  - de tramo con tolerancia de 9 px (`174-189`);
  - prioridad ciudad > obra > nodo o tramo > tren > estación (`145-171`);
  - resalte de la relación y de todas las de la ciudad elegida, discontinuas las cerradas (`471-493`);
  - tooltips de cada tipo (`661-701`).
- **Ciudades**:
  - anillo verde, ámbar o gris según conexión;
  - puntos por nivel de estación;
  - figuras de «andén lleno»;
  - chincheta de petición con pulso;
  - pin seleccionado (`703-734`).
- **Trenes**:
  - silueta con faros de noche, anillo de retraso, seguimiento de cámara y etiqueta con zoom > 28;
  - recorrido por el horario real (`S.position`) o por la polilínea de `pathCoords` (`601-659`).
- Estaciones con zoom ≥ 4, rótulos sin solapes y escala gráfica (`584-599`, `382-411`, `755-760`).
- Rueda, arrastre y pellizco; zoom de 0,7 a 260 (`55-110`).
- **Lo que tiene el mapa del rescate y no el clásico**: capa `velocidad` (`speedColor`, `rescate-map.js:63`), puntualidad, estado de la vía, demanda y territorios. En un modo único, una capa de velocidad por tramo encaja directamente en `drawInfra`.
- Acoplamientos:
  - `drawLines`, `drawInfra`, `drawNodes`, `drawWorks`, `drawSelected`, `infraCoords` y `tramoAt` leen `state.routes`, `fleet`, `infra` y `projects` en el formato clásico;
  - importa `engine.js` (`routeCheck`, `routeOptions`, `product`), `operations.js` y `schedule.js` (aristas del horario real);
  - `ELEC_COLOR` y `GAUGE_COLOR` están duplicados en `rescate-map.js:61-62`.

---

## (e) `infra.js` frente a `segments.json` (red de 2027, con todo el histórico aplicado)

Comparación hecha con `cmp.mjs`: tramo convencional emparejado por nodos. Diferencias:

**Huecos estructurales**:
1. **Norte `pal-leo`**: no hay convencional en `infra`, solo `pal-leo-av` (estándar, 25 kV, 280 km/h, 114,9 km). Dato real: ibérico, 3 kV, 155 km/h, doble vía, 123 km. Por eso `baseSegments` del rescate mete la LAV en el corredor Norte (`rescate.js:80`).
2. **Sur `cor-sev`**: tampoco hay convencional, solo `cor-sev-av` (estándar, 25 kV, 240 km/h, 126,7 km). Dato real: ibérico, 3 kV, 155 km/h, vía mixta, 129 km.
3. **Asturias `leo-pol`**: `infra` modela un único tramo que en 2022 es la Rampa (`start`: ibérico, 3 kV, 70 km/h) y el 29-11-2023 pasa a ser la Variante (mixto, 25 kV, 220 km/h, 71,1 km, cambiador en Pola). `segments.json` describe la **Rampa clásica**: ibérico, 3 kV, 115 km/h, vía mixta, **108 km**. En la realidad conviven las dos líneas, así que hacen falta dos tramos. El corredor del rescate se llama «Rampa de Pajares» pero hoy circula por la Variante.

**Velocidades** (infra frente a real; Δ = real − infra):
- Norte: `vll-vdb` 140/135 (−5); `vdb-pal` 160/130 (−30).
- Levante: `mad-alc` 150/145 (−5); `xat-enc` 140/135 (−5); `vlc-xat` 150/140 (−10).
- Sur: `mad-alc` 150/145 (−5); `alc-lin` 140/130 (−10); `lin-cor` 160/150 (−10).
- Mediterráneo: `cas-tar` 190/195 (+5).
- Ebro: `mir-bil` 90/92 (+2); `log-cst` 120/125 (+5).
- Galicia: `aco-scq` 180/185 (+5); `scq-pon` 180/170 (−10); `pon-vig` 190/185 (−5).
- Asturias: `pol-ovi` 110/100 (−10).
- Extremadura: `mad-tal` y `tal-pla` 150/155 (+5); `pla-cac`, `cac-mer` y `mer-bad` 180/200 (+20).
- **Teruel: `ter-sag` 160/90 (−70)**, la mayor diferencia.
- Soria: `mad-gua` 140/160 (+20); `gua-trb` 140/150 (+10); `trb-sor` 110/100 (−10).
- Cantabria: `pal-san` 110/120 (+10).

**Longitudes** (diferencia de más de 3 km):
- `cac-mer` 78 frente a 71;
- `zar-ter` 190,2 frente a 182;
- `sag-vlc` 34,2 frente a 29 (y 33 en el Mediterráneo);
- `mad-tal` 137,1 frente a 134;
- `leo-pol` 71,1 frente a 108 (otra línea).

**Ancho y tensión**: coinciden en todos los tramos comparables, salvo `leo-pol` (mixto/25 kV frente a ibérico/3 kV, porque es otra línea).

**Vía única o doble**: `infra` no tiene este dato. `segments.json` marca vía única en `enc-xat`, `lin-cor`, `mir-log`, `log-cst`, `tal-pla`, `zar-ter`, `ter-sag`, `trb-sor` y `pal-san`, y vía mixta en `vll-vdb`, `alc-lin`, `cor-sev`, `bil-mir`, `leo-pol`, `mad-tal`, `pla-cac`, `cac-mer` y `mer-bad`.

**Otro error de datos, fuera de `segments.json`**:
- El nodo `mot` (Motilla) está en (−2,7533, 40,0316), al oeste de Cuenca (−2,1444, 40,0352). Motilla del Palancar está hacia (−1,88, 39,56).
- Por eso `cue-mot-av` (54,4 km) retrocede y luego `mot-req-av` (187,6 km) y `mot-alb-av` (180,6 km) vuelven a avanzar.
- Resultado:
  - `plan` da 499 km para Madrid–València frente a 398 del horario oficial;
  - Madrid–Alicante: 589 frente a 487;
  - Madrid–Murcia: 633 frente a 570;
  - Madrid–Castelló: 574 frente a 464.
- Todos los tiempos y costes por km del Levante en alta velocidad salen inflados.

---

## (f) Integración: qué está atado al estado y al DOM clásicos y qué hay que rehacer

### Acoplamientos al DOM en `app.js`
- **Escuchas en todo el documento**:
  - clic en cualquier `[data-action]` (`app.js:1268-1388`; unas 140 acciones);
  - `submit` en `#marketSearchForm` y `#routeForm` (`1389-1396`);
  - `input` en `sfxVolume`, `routeFleet`, `frequency`, `fare`, `musicVolume`, `routeSearch`, `marketSearch`, `ttStation`, `buyQty`, `lineA/lineB` y `svcA/svcB` (`1397-1409`);
  - `change` en `routeStatus`, `marketState/Delivery/Maker/Sort`, `ttHour`, `dayPriority`, `autoPause`, `musicMode`, `maintenance` e `importSave` (`1410-1427`);
  - `pointerdown` en `#timelineCanvas` (`1428`);
  - `keydown` global (`1441-1450`, `1460`);
  - `[data-layer]` y zoom (`1437-1440`);
  - `cancel` y `close` de `#modal` (`1155-1156`, `1451`).
- **Ids fijos de `index.html`**: `game`, `map`, `modal`, `drawer`, `inspector`, `mission`, `legend`, `daybar`, `navigation`, `resources`, `date`, `dateShort`, `dayKind`, `clock`, `sun`, `toast`, `zoomIn`, `zoomOut` y `resetMap`.
- El rescate evita choques con `data-a` y escuchas en su propia raíz (`rescate-ui.js:478`, `540`, `545`; 52 `data-a=`, ningún `data-action`). Si se reutilizan las vistas de Trenespop dentro de otra capa, hay que parametrizar atributo e ids (`market.md` §1). Si no, «Comprar» llama a `E.buy` de la partida clásica (`app.js:1373`).
- `window.railwayGame` (`app.js:1454-1456`) expone el estado y el motor a los tests de Playwright (`ui-test.mjs:67` usa `pick({type:'tramo', id:'trb-sor'})`).

### Acoplamientos al estado
- `infra.js` recibe `s` y lee:
  - `s.infra` (`t`, `c`, `h`, `custom`, `ver`);
  - `s.projects` con forma `{done, type:'tramo'|'changer'|'custom'|'infrastructure', work, target}` (`closedTramos` en 98-100, `closedKey` en 121, `tramoWorks` en 264);
  - el caché `s.__graph` (118).
  
  Un modo único puede reutilizarlo tal cual si conserva esas dos estructuras, o necesita un adaptador.
- `marketplace.js` depende de:
  - `s.month` (semestres; los años se calculan como 2022 + mes/12);
  - `s.marketplace` (`version: 1`, `sold`, `favorites`);
  - `s.orders` (validación);
  - `MODEL` y `MODELS` de AVE y Alvia;
  - el `standard` de `E.purchaseQuote`;
  - textos en meses.
- La partida guardada:
  - `migrate` exige que existan en `s.infra.t` todos los `TRAMOS` (`engine.js:266`): **añadir tramos (pal-leo, cor-sev, Rampa) invalida las partidas viejas** si no se migran;
  - `validateSave` limita ancho y tensión a `ib/std/mixto` y `25kv/3kv/no` (`engine.js:280`) y exige ids de `MODEL` en flota, pedidos y reformas (`engine.js:286-291`).
- Escala de dinero incompatible entre modos:
  - clásico (aproximadamente realista): caja 500 M€, trenes de 16 a 36 M€, electrificar 0,42 M€/km, renovar 0,18 M€/km;
  - rescate: caja 12 M€ (`rescate.js:41`), electrificar 0,0105 M€/km (`rescate-data.js:101`, unas 40 veces menos), trenes de 1,1 a 3,5 M€.
- Escala de tiempo: el clásico usa meses más una jornada diaria jugable (con plazos de entrega de 16 a 42 meses); el rescate usa semanas (entregas de 1 a 6 semanas).
- Red: el clásico tiene 91 relaciones (43 base + 48 del horario; 76 reales) sobre 125 tramos, con `via` libre y Dijkstra. El rescate tiene 11 corredores fijos con su lista de segmentos (`rescate.js:75-84`, recorrido propio `netPath` que penaliza ×3 las LAV). Un corredor del rescate es solo una relación clásica con su `via`: `plan()` lo cubre si se corrigen los tramos.

### Refactorizaciones que necesita un modo único (orden sugerido)
1. **Datos de red**:
   - Añadir los convencionales `pal-leo` (123 km, ibérico, 3 kV, 155 km/h) y `cor-sev` (129 km, ibérico, 3 kV, 155 km/h).
   - Separar `leo-pol` en Rampa (convencional, 108 km, ibérico, 3 kV, 115 km/h) y Variante.
   - Corregir el nodo `mot`.
   - Añadir el campo `tracks` (`unica`, `doble`, `mixta`) y `tunnels`/gálibo.
   - Pasar las velocidades de `segments.json`.
   - Migrar `s.infra.t` en las partidas viejas.
2. **Perfil de tren con tensión**: `profileOf` → `{modes: ['ib'] | ['std'] | ['ib','std'], voltages: ['3kv','25kv'], thermal: 'none'|'diesel'|'bimodo'|'battery', vmax, vmaxDiesel, range}`.
   - `traverse` tiene que comprobar la tensión, añadir la falta nueva `'tension'` y aplicar `vmaxDiesel` y 220 km/h a 3 kV.
   - Las claves de caché de `plan` deben incluir modos y tensiones.
   - El borrador de `compatibilidad()` en `rules.md` §5 ya reproduce `plan` en los 129 casos.
3. **Catálogo único de trenes**:
   - Sustituir `MODELS` (solo AVE y Alvia) por las 16 series de `trains.json` más las equivalentes de Dörfler y BCBB con su propio perfil: Dörfler bimodo ibérico 160/140, BCBB alta velocidad 350, 576 plazas.
   - Campos: tensión, tracción, ancho, km/h, km/h en diésel, plazas, precio, plazo, año, consumo y fiabilidad.
   - Mapear los ids viejos (s100…s106v) para no romper partidas.
4. **Obras**:
   - Elegir la tensión al electrificar.
   - Añadir obras de 3 kV a 25 kV, mixto a estándar, desdoblamiento (capacidad o puntualidad) y gálibo.
   - Mantener las fórmulas de `WORKS`, `CHANGER_WORK` y el corte por cambio a ancho estándar.
5. **Trenespop**:
   - Parametrizar `catalogueHTML` y `detailHTML` (atributo, ids, dinero, unidades de tiempo).
   - Añadir filtros de tracción, ancho y tipo, y el filtro clave «compatible con la relación o corredor X», más un distintivo en cada tarjeta.
   - En la ficha, una tabla de relaciones con ✓/✗ y el motivo (reutilizar `faultText`).
   - Abrir Trenespop prefiltrado desde una relación incompatible.
   - Depreciar por edad. Hacer el precio de los usados función de la edad y no solo del estado. Stock finito para los nuevos o plazos por cartera de pedidos.
6. **Interfaz**: un solo despachador por pantalla (`data-a`) en lugar de escuchas sueltas en el documento. Quitar `purchaseDialog`. La capa de velocidad en el mapa clásico sale gratis de `drawInfra`.
7. **Textos**: corregir los dos desajustes de la ficha de tramo y de nodo (sección c) o hacer que el motor cumpla lo que dicen.

### Pruebas que fijan este comportamiento
- `proyecto/marketplace-test.mjs:13-86`: API de pedidos 30/70, filtros, compra usada inmediata o con envío, impago, favoritos y renovación semestral, Dörfler y BCBB, HTML con `marketState`, `data-listing`, etc.
- `proyecto/test.mjs`:
  - 31-38: 8 servicios compatibles;
  - 39-54: Soria solo híbrido; Gijón, Alvia con cambio;
  - 55-79: obras electrificar, cambiador en `vlc`, mixto en `cas-tar`, estándar con corte en Badajoz; tras 48 meses, AVE València–Barcelona;
  - 82-91: Pajares y Burgos en su fecha;
  - 141-148: guardado manipulado.
- `proyecto/tycoon-test.mjs`: 29 (modo libre) y 33 (renovación sube la velocidad).
- `proyecto/campaign-test.mjs:80-115` y `152-155`: el bot hace obras de mixto y catenaria y un cambiador en `vlc`.
- `proyecto/induction-test.mjs:26` y `127-128`: presupuesto de Soria y fecha del modo libre.
- Pruebas de interfaz:
  - `ui-test.mjs:63-69` (capas de ancho y tensión, tramo `trb-sor`) y 168 (modo libre sin rivales);
  - `gameplay-ui-test.mjs:26`, `onboarding-ui-test.mjs:338`, `529-537` y `561`, y `voice-game-ui-test.mjs:228-230` (configuración del modo libre);
  - `rescate-ui-test.mjs:70-74` (fotos de BCBB y Dörfler en el modal de compra; ver `market.md`).
