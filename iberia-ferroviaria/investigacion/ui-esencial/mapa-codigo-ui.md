# In-game UI code map — Tenfe: Conexiones 6.5.2

Snapshot: `main` @ `c903d0a`, clean tree. All paths are relative to `iberia-ferroviaria/proyecto/dist/` unless stated. Line numbers are 1-based for HEAD.
Read-only audit. Evidence produced in the scratchpad (never in the repo):
`<scratchpad>/ui/audit/code-shots/*.png` and `measure2.json` (final positions, `reducedMotion:'reduce'`), `<scratchpad>/ui/audit/code-shots/run1/` (same flows without reduced motion, shows transition lag), probe/measure scripts in `<scratchpad>/tools/` (`measure.mjs`, `measure2.mjs`, `probe-deadend.mjs`, `run-ui.sh`, `pw-register.mjs`), and UI-test logs in `<scratchpad>/logs/` and `<scratchpad>/logs/rerun/` (run on a scratch copy of the repo at `<scratchpad>/repo/`, served by `python3 -m http.server 8731`). `<scratchpad>` = `/tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad`.

Frozen-text check run: `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` = `6348984c…098f` (OK at HEAD).

---------------------------------------------------------------------------------------------------

## 0. The ten facts that matter most for a restructure

1. **Everything in-game is rendered by `app.js` (1724 lines) through string templates + one global click dispatcher** (`document.addEventListener('click')`, app.js:1483–1643, `switch(data-action)`). Sub-modules only return HTML strings (`tenfe-ui.js`, `conexiones-ui.js`, `tycoon-ui.js`, `marketplace.js`, `train-refit.js`, `track-preview.js`, `narration-runtime.js`). No framework, no components, no per-element listeners except the 6 static layer buttons and 3 zoom buttons (app.js:1700–1703).
2. **The static skeleton lives in `index.html`** (13 elements inside `#game`, plus `#toast` and `dialog#modal` outside it). `render()` (app.js:678) repaints HUD, nav, mission, legend, daybar, drawer, inspector, coach every time state changes; `frame()` (app.js:601) repaints clock/timeline/coach every 120 ms and HUD/mission every 1 s while playing.
3. **CSS is a stack of 4 historical layers in one file** (`style-v3.css`: v1 paper 1–328, "2.0 papel/esmalte" 330–501, tycoon cards 502–605, "Tenfe 5 dark desk" 607–662). The *effective* layout is the last layer (lines 608–650). Components only partly re-skinned: the inspector and drawer headers still use the 2.0 brown enamel header with "rails" (style-v3.css:380–381, 447–448), the city card uses serif paper styles, the coach in-dialog is dark… mixing three visual languages.
4. **The guide (tutorial) is the 9-step `TOUR_STEPS` array inside app.js (444–454)**, not `induction*.js`. It highlights one real panel with four blurred "shade" rectangles (`#tour-shades i`), a ring (`#spot.tour-ring`) and a fixed coach box (`#coach.tour-coach`), and marks every other child of `#game` as `inert`. Toasts/narration (`#toast`, z 30) and the alert pill live *under* the shades (z 40), so any message that appears during the guide is blurred and unclickable. Details §6.
5. **Guide texts are recorded narration**: `TOUR_STEPS[i].text` and the three `day` variants (app.js:565) must equal `STATIC_MESSAGES['guide-*'].text` in `narration-data.js` byte for byte (lookup by exact text, `narration-runtime.js:6–7`). A mismatch is not silent: `N.controls(N.keyForText(text))` → `message(undefined)` throws "Mensaje sin personaje" inside `renderCoach`, breaking every render. Titles (`TOUR_STEPS[i].title`), kicker and button labels (`next`) are *not* recorded and may change. The recorded lines also *name* UI labels ("Red → Jornada", "Despacho", "Agenda", «Aplicar plan», «Siguiente jornada», «Hasta el último tren», "Ayuda", "Trenes Pop"…), so those labels must survive the restructure (§6.6).
6. **41 of 46 literal toast strings in app.js are recorded narration** (exact-text lookup → specific cast voice). Changing e.g. `'Plan de servicio actualizado.'` silently downgrades it to the generic `message-info` voice. The other 5 are matched by regex prefixes (`narration-runtime.js:15–41`). Treat all toast texts as frozen.
7. **Tests pin the guide implementation**: `conexiones-ui-test.mjs` and `narracion-ui-test.mjs` assert `#tour-shades i` count = 4 and `#coach` with `[data-action="tutorial-next"]`; conexiones also asserts `#coach[data-step-id]`, `#modal #coach` = 1 during the day report, no `.induction-dialog`, and `#coach,#tour-shades,#spot` count = 0 when the guide ends; narracion asserts `#coach,#tour-shades` = 0 after pause and that `#coach` fits the viewport. `induction-test.mjs` asserts app.js contains the literal `function positionTour()`.
8. **`observer-runtime-test.mjs` executes slices of app.js in a `vm`** cut by literal anchors (`function currentMinute() {` … `function viewTrips() {`, `function frame(t) {` … `function checkIncidents() {`, `function renderDaybar() {` … `function navigate(to) {`, the `#timelineCanvas` pointerdown listener, and the `setMinute:` regex). Any new identifier referenced inside those slices that is not in the vm context throws. This is the most fragile seam (§8.1).
9. **Publisher**: `tools/extract-game-source.mjs` bundles a *hard-coded list* of modules and CSS files; a new `.js` or `.css` file is silently missing from the published `index.html` unless added there. Several exact anchors must survive (§9).
10. **Baseline: many in-game Playwright suites are already red at HEAD** because of stale selectors from 3.x/4.x (`np-pick`, `office-tab`, `.induction-dialog`, page title, `.gazette`): onboarding, gameplay, red, nueva-partida, contract-progression, ui-test, tenfe-ui. Current, maintained suites: `menu-inicio`, `narracion`, `fabricantes` passed; `conexiones` passes both 1440/390 sections and then fails *inside the guide* because a stale shade intercepts the decision button (§6.4-6); `mapa-voces` and `train-refit` pass their functional checks and then hit `page.screenshot` timeouts (twice, machine load ≈ 20 on 4 cores from parallel agents — environmental). These seven (incl. `menu-inicio`) are the regression gate for the restructure.

---------------------------------------------------------------------------------------------------

## 1. File inventory (in-game UI only)

| File | Lines | Role |
|---|---|---|
| `index.html` | 19 | Static skeleton: `#game` > `canvas#map`, `header.hud` (brand, `#date`, `#dateShort`, `#dayKind`, `#sun`, `#clock`, `dl#resources`), `nav#navigation.rail`, `div.map-tools` (`details.map-layers` > 6×`button[data-layer]`, `.zoom` > `#zoomIn #zoomOut #resetMap`), `aside#mission`, `aside#inspector.hidden`, `section#drawer.hidden`, `div#legend`, `footer#daybar`; outside `#game`: `div#toast`, `dialog#modal`. CSS links: style-v3, main-menu, induction, train-refit, narration, marketplace. |
| `app.js` | 1724 | Hub: state, render loop, all page/inspector/modal templates, guide, dispatcher, keyboard, `window.railwayGame` API. |
| `tenfe-ui.js` | 95 | `missionHTML`, `nextHTML` (objective CTA), `supportHTML`, `pactsHTML`, `milestonesHTML`, `megaHTML`, `scandalHTML`, `reportHTML`, `forecastHTML`. For Conexiones games delegates to `conexiones-ui.js`. |
| `conexiones-ui.js` | 70 | `eventHTML` (illustrated event card), `missionHTML` (5 retos list), `campaignHTML`, `researchHTML`, `megaHTML`, `supportHTML`, `pactsHTML`, `newsHTML`, `boardHTML` (unused board), `scandalHTML`. `bind(E,faceURL)` at app.js:34. |
| `tycoon-ui.js` | 97 | `tycoonPage(state,tab)` (agenda/people/research/market/paper), `directionCount` (Despacho badge). Its own `<nav class="tycoon-tabs">` is stripped by regex in app.js (917, 1252, 1261, 1269). |
| `marketplace.js` | 153 | Trenes Pop: `catalogueHTML` (132), `detailHTML` (148). |
| `train-refit.js` | 309 | Taller de reformas: `pageHTML` (287), `catalogueHTML` (278), `jobsHTML` (281), `previewHTML` (293), `detailHTML` (294), `quoteHTML` (304). `bind(E)` app.js:35. |
| `track-preview.js` | 50 | Taller de vías: `photo` (13), `comparison` (19), `designer` (23), `quote` (28), `start` (42). |
| `narration-runtime.js` | 196 | `Narrator` class (queue, toasts tray, modal cards, guide/welcome/event voice) + `card/header/controls/speechHTML/keyForText/toastKey/newsKey`. |
| `narration-data.js` | 647 | FROZEN recorded messages (`STATIC_MESSAGES`, `MESSAGES` incl. `event-*`). |
| `dialogue-presentation.js` | 40 | `dialogueHtml(text, person)` → sentence spans `.say-s` (+ `.dialogue-opener`). |
| `map-v3.js` | 781 | `RailMap` canvas: base, lines, cities, pins, trains, popups, hover tooltip, scale. |
| `sfx.js` | 332 | `ACTIONS` (143 data-action → recipe) and recipes. |
| `induction.js`, `induction-runtime.js` | 167, 98 | Legacy v1 tutorial data/validation. Still imported: `validInduction` (engine save validation, accepts v2 `step<9`, induction-runtime.js:56–63). |
| `induction-task-ui.js` | 142 | Legacy v1 tutorial "mesa" (`focusedTaskHTML`). **Not imported by app.js**; still bundled by build/extractor; tested by `induction-test.mjs`, `contract-progression-ui-test.mjs`. |
| `main-menu.js`, `nueva-partida.js` | 37, 36 | Main menu / new game screens rendered in `#modal`. |
| `rescate-ui.js`, `rescate.css`, `rescate-map.js` | | Old standalone Rescate mode. **Not used in game**, not linked in `index.html`, excluded by extractor (tenfe-test.mjs:93 asserts `'rescate-ui.js'` absent from extractor). |
| CSS | | `style-v3.css` (662), `induction.css` (47: guide, desk-decision, welcome, game-event, track workshop), `narration.css` (31: toasts/narration cards), `marketplace.css` (122), `train-refit.css` (45), `main-menu.css` (101). |

---------------------------------------------------------------------------------------------------

## 2. Layers, z-index and effective positions

Effective values come from the **last** matching rule (Tenfe 5 block, style-v3.css:607–650) unless noted.

| Layer | z | Position (desktop ≥861) | ≤860 / ≤600 overrides | Source |
|---|---|---|---|---|
| `#map` canvas | auto | fixed full screen | — | style-v3.css:18 |
| `#network-board` (unused) | 1 | — | — | induction.css:19 |
| `.credit` | 2 | not rendered | — | style-v3.css:69 |
| `#mission` | 3 | `left:18 top:98 w:274`, `max-height:calc(100vh-308px)`, scroll | ≤600 `top:100 left:8 w:245 max-height:170` (truncates list; objective CTA scrolls out of view) | style-v3.css:621–625, 650 |
| `#legend` | 3 | `left:18 bottom:178 max-w:540` | ≤1050 hidden (226); ≤600 `bottom:165` | 626, 650 |
| `.map-tools` (Capas ▾ + zoom) | 4 | `top:98 right:18` | ≤760 old rule `top:auto;bottom:176` + ≤600 `top:100` ⇒ **stretched 100→668 px, a 68 px wide invisible column that swallows map clicks**; zoom hidden ≤600 | 47, 234, 618–620, 650 |
| `.hud` | 5 | `top:14 left:18 right:18 min-h:64` | ≤600 grid, 5 resources in a row, labels 7px | 610–612, 648–650 |
| `#daybar` | 5 | `left:18 right:18 bottom:84 min-h:76` | ≤860 timeline hidden; ≤600 `bottom:74` | 627–628, 649–650 |
| `#navigation.rail` | 6 | **bottom bar** `left:18 right:18 bottom:14 h:62` (the "rail" is no longer a rail) | ≤600 `h:58`; the last 4 icon buttons overflow horizontally (Ayuda, Menú off-screen at 390) | 614–617, 650 |
| `#inspector` | 6 | `top:98 right:18 bottom:178 w:390` → **covers `.map-tools` (86×148 px)** | ≤600 `top:100 left:8 right:8 bottom:165` | 152, 637, 650 |
| `#inspector.wide` (city) | 6 | `top:150 w:440` (2-class selector wins over Tenfe 5 `.inspector{top:98}`) | ≤760 `.inspector.wide{top:auto}` beats ≤600 `.inspector{top:100}` ⇒ **panel grows upward off-screen (measured top −1899 px at 390×844; close button and city title unreachable)** | 244, 484, 293, 494 |
| `#drawer` | 7 | `top:98 left:18 bottom:178 w:min(760,100vw−36)`, slide-in animation 0.22 s | ≤600 `top:100 left:8 bottom:165`; in guide ≤600 `bottom:300` (induction.css:15) | 92, 630–635, 650 |
| `.drawer.trenespop-drawer` | 7 | `w:min(1464,…)` (covers whole map) | ≤760 `top:10 bottom:88` (covers HUD) | marketplace.css:2, 112 |
| `.alert-pill` | 8 | `top:150 left:50%` centred | ≤760 `top:70` | 179, 489–490 |
| `#entry-welcome` | 8 | `top:100 left:310 w:380` | ≤900 `left:18` ⇒ **sits on top of `#mission`**; ≤600 `left:8 right:8` | induction.css:12, 14, 15 |
| `#toast` (narration tray) | 30 | `right:18`, `bottom` set in JS = `innerHeight − daybar.top + 28` (narration-runtime.js:105–108), w 420 | ≤600 `right:12 bottom:172` (JS overrides bottom) | narration.css:13–14, 26 |
| `#tour-shades` (+4 `i`) | 40 | fixed, pointer-events:auto on the `i` | — | induction.css:6 |
| `.spot` legacy | 40 | unused (old `#spot` class) | — | style-v3.css:285 |
| `#spot.tour-ring` | 42 | fixed ring around target | — | induction.css:7 |
| `#coach.tour-coach` | 43 | fixed, JS-positioned; inside a dialog becomes `position:relative` (`.in-dialog`) | ≤600 `max-height:210px` | induction.css:4–9, 15 |
| `dialog#modal` | top layer | centred, `max-width:min(880px,94vw)`, `.single` 660 px; backdrop `blur(3px)` | — | 184–185, 481, 638 |

Measured overlaps without the guide (final positions, desktop 1440×900): `#inspector × .map-tools 86×148`, `#inspector × #toast 376×121` (toast tray stacks on the lower inspector, incl. its plan-submit area), `#legend × #drawer 540×56` (hidden under drawer, harmless). 1280×720: also `#mission × #legend 274×24`, `#entry-welcome × #legend/#daybar`. 390×844: `.map-tools` column overlaps drawer/inspector/toast (68×568), `#entry-welcome × #mission 245×162`, city inspector off-screen (above). See `code-shots/run1/*-map.png`, `*-route-toast.png`.

---------------------------------------------------------------------------------------------------

## 3. Render pipeline

- Boot: app.js:34–35 bind modules → state init (76–83) → `RailMap` with `getViewport` (116–120: uses `.hud`, `#daybar`, `#mission` rects; mobile ignores mission) → `render(); renderMusicButton(); intro(); requestAnimationFrame(frame)` (1722).
- `render()` app.js:678–685: `renderHud, renderNav, renderMission, renderLegend, renderDaybar`, drawer (if `screen`) else hide, `renderInspector, renderBoard, renderCoach`, then `narrator.updates(state,{skip:menuOpen||!!tut})` (news toasts) and `narrator.sync()`.
- `frame(t)` app.js:601–625: clock/timeline/`renderCoach`/music each 120 ms; while playing every 1 s `renderDrawer` (if `screen==='ops'`), `renderInspector` (train/station/city), `renderHud`, `renderMission`.
- `act(fn,msg)` app.js:228–231: run mutation → toast(msg) → `afterCityAction` → autosave → `render()` → `sfx.result`. Errors go to `toast(error.message,{error:true})`.
- UI state vars: `screen` (drawer page key or null), `inspect` ({type,id} or null), `layer`, `ui` (tabs/filters, app.js:78–81), `tut` (guide), `menuOpen`, `np`.
- `navigate(to)` app.js:808–814: toggles drawer; `ALIASES` (73) map legacy screens `ops|works|timetables → network+netView`, `market → fleet+fleetTab`, `archive → press+pressTab`. Opening a drawer clears `inspect`; picking on the map (`pick`, 575–593) hides the drawer. Drawer and inspector are therefore mutually exclusive except via `tycoon-tab`.

---------------------------------------------------------------------------------------------------

## 4. Component map

### 4.1 HUD / top bar
- Markup static in `index.html` (`header.hud`); filled by `renderHud()` app.js:691–705 and `renderClock()` 707–712.
- Content now: brand "Iberia Ferroviaria" + subtitle (`.hud .brand span` = "Conexiones · al mando de Tenfe"), `#date` "Turno N · tu red en marcha", `#dateShort`, `#dayKind` "N turnos hasta las urnas", sun + `#clock` (day minute), and **five resources** in `#resources` (Caja, Resultado / turno ±, Apoyo %, Puntualidad %, Trenes libres).
- CSS: style-v3.css:23–34 (v1), 342–346 (2.0), 610–613 (Tenfe 5), 225–226/230 and 648–650 (responsive). At ≤600 the 5 resources become 7 px labels in a 5-col grid.
- Used by: `getViewport` (`.hud` bottom) app.js:117; tests: onboarding (`.hud` hidden during v1 tutorial, stale).

### 4.2 Mission / objective panel (`aside#mission`)
- `renderMission()` app.js:721–734. Hidden when a drawer is open, when an inspector is open below 1200 px, or before start (723).
- Composition (`el.innerHTML = (rescue||objectives)+active+next+upcoming`):
  - `TenfeUI.missionHTML` tenfe-ui.js:17 → `JUI.missionHTML` conexiones-ui.js:15–18: kicker "Conexiones · turno N", h2, "x/5 retos · y/2 mandatos", list of 5 `CHALLENGES` with ○/✓, muted sentence.
  - Active contract `.tenfe-live-promise` (730): title + `value/target · N meses`.
  - **Objective CTA** `TenfeUI.nextHTML` tenfe-ui.js:13–16: `<div class="tenfe-next"><span>Siguiente</span><button data-action="tenfe-next">label</button>`; label from `U.nextAction` (tenfe.js:230) → `J.nextAction` (conexiones.js:205–215): "Decidir el suceso del turno" / "Escuchar al consejo" / "Elegir un compromiso" / "Abrir el laboratorio" / "Abrir <ruta rural>" / "Probar mi horario". Handler app.js:1511.
  - City requests `.tenfe-city-request` (732) → `data-action="city"`.
- CSS: style-v3.css:56–63, 276–280, 366–371, 601–602 (mandate-card, legacy), 621–625, 650.
- Problems: the actual objective (the CTA) is the 4th block, below a 5-line checklist and a muted sentence; on mobile `max-height:170px` hides it below the fold; the panel disappears whenever a drawer opens (no persistent objective).
- Tests: tenfe-ui-test.mjs:97 (`#mission` text contains "rescate" — stale), gameplay-ui `.mandate-card` (stale).

### 4.3 Map overlays, layers, legend
- Canvas (map-v3.js `RailMap.render` 446–488): `drawSelected` 490, `drawWorks` 529, `drawNodes` 376, `drawStations` 603, `drawCities` 722–753 (status ring colours, station-level dots, crowd figures, **red "!" request pin** pulsing), labels cache 401, `drawTrains` 647, `drawPopups` 755–772 (floating "+N viajeros / +N mil €", "¡Refuerzo a tiempo!", "Petición en marcha"), `drawHover` 680–720 (tooltip with name + sub-line, e.g. "N/M conexiones · pulsa para abrir"), `drawScale` 774.
- Data for cities: `mapCities()` app.js:293–312; popups from `spawnArrivals` 327–338 / `celebrate` 339–342.
- Layers: static buttons in index.html inside `details.map-layers` ("Capas ▾"); handlers bound once at app.js:1700 (`[data-layer]` onclick: sfx `lever`, `setLayer`, `renderCoach`, close `<details>`). `setLayer` app.js:1454–1460 (also toasts the "Horario real" notice for `real`). **These buttons are not data-action; re-rendering them dynamically drops their handlers.**
- Zoom: `#zoomIn/#zoomOut/#resetMap` onclick app.js:1701–1703.
- Legend: `renderLegend()` app.js:744–754 (per layer list + hints "Pulsa una ciudad", etc.). CSS 66–68, 281–282, 295, 373–375, 626. Hidden ≤1050 px.
- Tests: mapa-voces (`.map-layers summary` then `[data-layer=X]`, `#zoomIn`, `#resetMap`, `getViewport` must contain mad/bcn/aco/mal/cad/sev, clicking Madrid on canvas opens `#inspector .city-title`), red-ui (`.layer-switch [data-layer]` order: Velocidad right after Electrificación; `#legend` texts "Más de 200 km/h", "Hasta 120 km/h", "3 kV continua"; `.layer-switch` inside viewport at 390/320), ui-test (`#legend` "Ancho estándar", "25 kV").

### 4.4 Day bar / timeline (`footer#daybar`)
- `renderDaybar()` app.js:755–767: `.turn` (phase small text, "06:30 → 02:11 +1", "N circulaciones · N en autobús"), `#timeline > canvas#timelineCanvas`, `.controls` (`.speed` 1×/3×/10×/30× `data-action="speed"`, `.play` `data-action="play"`, primary `day-start|day-end|day-review` with labels "Comienza la jornada / Hasta el último tren / Ver parte del día", and `skip-month` "Cerrar turno" with tooltip `delegationHint`).
- `drawTimeline()` 768–804 (sky gradient, trains-in-circulation curve, hour ticks, incident triangles, now-marker; sets `canvas.dataset.first/span`). Seek: pointerdown listener 1691–1697 (observer layer only).
- CSS 72–80, 342, 347–350, 597, 627–628, 649–650.
- **observer-runtime-test executes this exact range in a vm** (see §8.1); output must contain `Observación del horario real` and no `day-start/day-end/day-review/skip-month` when `layer==='real'`.
- Tests: conexiones/mapa-voces `#daybar [data-action="skip-month"]`; strict-mode clicks on bare `[data-action="day-start"]`, `[data-action="day-end"]` (must stay unique in DOM, see §8.2); narracion asserts toast bottom ≤ `#daybar` top − 8.

### 4.5 Bottom navigation (`nav#navigation`)
- `renderNav()` app.js:713–720: 6 page buttons from `PAGES` (71: Red, Flota, Dinero, Despacho, Progreso, Prensa) with SVG `ICONS` (45–70), badge on Red (pending incidents) and Despacho (`directionCount`, tycoon-ui.js:17), spacer, then `#musicBtn` (`music`), `save-dialog`, `help`, `menu-home`.
- Order of `PAGES` keys also drives: keyboard 1–6 (1709), nav sfx pitch (`clickSound`, 248).
- CSS 36–44, 309, 352–358, 614–617, 648–650, 598–599, 654.
- Tests: `#navigation [data-screen=X]` (6 keys) and `.active` class (mapa-voces), `#navigation [data-action=menu-home|save-dialog]` (nueva-partida, stale).

### 4.6 Drawer pages and tabs (`section#drawer`)
`renderDrawer()` app.js:818–837 picks `pages[screen]()` → `[headHTML, bodyHTML]`; wraps wide tables in `.table-scroll` (826–829); restores scroll/focus; draws finance chart; `councilVoice()`; `narrator.events()` for event cards. `header(kicker,title,text)` 815–817 (close = `close-drawer`).

| Page (`screen`) | Renderer | Tabs (data-action) | Body renderers |
|---|---|---|---|
| `network` "Red" | `redPage` 1250–1254 | `net-view`: routes "Servicios", ops "Jornada", works "Obras", timetables "Horarios", rivals "Competencia" | `networkPage` 874–901 (route-tab chips, search, status select, "Relación nueva", 6-col table), `opsPage` 850–872 (figures, callouts, incidents `respond`, priority select, autopause, departures board), `worksPage` 977–1010 (own `works-tab` sub-tabs + layer buttons), `timetablesPage` 922–945 (`tt-type` tabs, station search), `tycoonPage(state,'market')` stripped |
| `fleet` "Flota" | `trainsPage` 908–913 | `fleet-tab`: fleet "Mi parque", refits "Reformas", market "Trenes Pop", orders "Pedidos" | `fleetPage` 947–960, `Refits.pageHTML`, `marketPage` 962–975 → `Marketplace.catalogueHTML`; market tab replaces header with `.tp-game-strip` and adds `.trenespop-drawer` |
| `finance` "Dinero" | `moneyPage` 1255–1258 | — | `financePage` 1012–1021 + chart 1022–1035 + `TenfeUI.forecastHTML` |
| `story` "Despacho" | `officePage` 914–920 | `tycoon-tab`: agenda, apoyo, pactos, people "Políticas", cloacas | agenda = `deskDecisionHTML` (1303–1307: council decision + `JUI.eventHTML`) + `tycoonPage(state,'agenda')`; apoyo `TenfeUI.supportHTML`; pactos `pactsHTML`; cloacas `scandalHTML` |
| `progress` "Progreso" | `progressPage` 1259–1266 | `progress-tab`: campaign "Mandato", hitos, research "Investigación", proyectos "Megaproyectos" | `JUI.campaignHTML`, `TenfeUI.milestonesHTML`, `JUI.researchHTML`+`tycoonPage('research')`, `JUI.megaHTML` |
| `press` "Prensa" | `pressPage` 1267–1271 | `press-tab`: paper "Gaceta", journal "Diario", reports "Informes" | `JUI.newsHTML`, `archivePage` 1050–1053, `N.card('turn-report')+reportHTML` |

- Note `tycoon-tab` is the cross-page router (app.js:1500): `research → progress`, `paper → press`, `market → network/rivals`, else `story`.
- Tab CSS: `.tabs` 105–107, 392–397, 632–633 (sticky inside drawer); `.segmented` 398–400 (unused now).
- Problems: up to 3 levels of navigation (page → tab → sub-tab/chips, e.g. Red → Obras → "Vías y catenaria" + layer buttons); every body starts with h2 + explanatory paragraph(s); Despacho agenda stacks council decision + event card + banner + calendar + contracts + "Próximos pasos" + 5 pressure cards + histories in one scroll.

### 4.7 Inspector (`aside#inspector`)
- `renderInspector()` app.js:1056–1072; types: `routeInspector` 1082–1112 (+ `updatePreview` 1115–1127 for `#routeForm`, `#routeFleet`, `#frequency`, `#fare`, `#routePreview`), `trainInspector` 1131–1152, `stationInspector` 1153–1174, `workInspector` 1175–1186, `cityInspector` 406–438 (wide variant, skyline hero, stats, incident/surge/request cards, connection cards with `freq-up/down`, `open-route`, station levels), `tramoInspector` 1197–1214 (track photo + `track-designer`), `nodeInspector` 1215–1225.
- CSS 151–171, 243–275, 445–454, 484, 637, 655–657, 661.
- verdad-test.mjs:121 requires the literal regex `Ocupación \$\{n\(mt\.occupancy \* 100\)\} %` in app.js (city connection card) and forbids an old flag string.

### 4.8 Modals (`dialog#modal`)
`showModal(html, cls)` app.js:1228 (pauses, injects `<div class="modal cls">`, `showModal()`, `mountViewers`, `narrator.modal()`, sfx). `closeModal` 1229. Listeners: `cancel` 1232 and 1715, `keydown` 1233–1245, `close` 1246, 1248.
In-game modals: `showDecision` 1370–1377 (portrait `.art.portrait` + `.plate`), `dayReport` 1378–1388, `fleetDetail` 1389–1397, `refitDialog` 1398, `purchaseDialog` 1404, `marketListingDialog` 1409 (`.trenespop-modal`), `newLineDialog` 1422, `serviceDialog` 1427, `saveDialog` 1438, `help` 1441–1450, `trackDialog` 1463–1470 (`.track-modal`), `workDialog` 1471–1481, `project` (inline 1629), `tenfe-shortcut` (inline 1515), `showTenfeUpdate` notices/month report 1272–1279, `showLegacy` 1280, `musicDialog` 200–220, `menuGuide` 1365–1369.
**`narrator.modal()` (narration-runtime.js:161–179) inserts an extra narration card (portrait + name + Escuchar + spoken summary) after the `<h1>` of every modal** whose content matches a key (day report, refit, track, purchase, line, service, shortcut, save, help, generic `message-info` if any `<p>`). That is the "second talking box" seen in modals.

### 4.9 Council / agenda conversations
- In drawer: `deskDecisionHTML` app.js:1303–1307 → `section.desk-decision[data-dialogue][data-person]` with portrait, kicker "Consejo de dirección · decisión pendiente", name/role, `.say-caption`, `sayButton` (141), h2, `p[data-say]` (`sayHtml` → `.say-s` spans), `.desk-options` with `button.choice[data-action="decision"]`. Auto-voice: `councilVoice()` 1295–1302 (once per seed+month+dialogue; skipped during guide/modal/menu).
- Modal variant `showDecision` 1370–1377 (used by `play()` 632, `skip-month` 1547, `day-next` 1546, `decision` chaining 1539, `tenfe-decision`).
- Contracts in agenda: `tycoon-ui.js` `contractHTML` 32–56 (own `.say-btn` `data-say-text`).
- Voice plumbing: `speakIn` 154–164, `syncSayButtons` 142–151, `say` action 1567–1573.
- CSS: induction.css:11, 47; style-v3.css:318–327, 470–471.
- Tests: mapa-voces (`.desk-decision .say-btn` visible + `aria-pressed`, `.desk-decision .say-s.on`, `.desk-decision [data-action="decision"]`), conexiones (`pendingCouncil`).

### 4.10 Narrated messages (Narrator)
- One `Narrator` (app.js:134) used by: `toast()` 223 → `narrator.toast` (narration-runtime.js:138–151): creates `article.narration-toast` = `card(key)` (portrait, name, role, Escuchar, spoken text, plus a "Detalle" block with the literal toast text when it differs) + `button.narration-dismiss`; appended to `#toast` (or into the open modal's `.content`), auto-removed 4.2 s after the voice ends. Tray position recomputed on each `sync()` from `#daybar` (105–108).
- Welcome card `#entry-welcome` (`showWelcome` app.js:1287–1293; `narrator.welcome`), guide (`narrator.guide`, §6), modal cards (§4.8), event cards (`narrator.events`), news toasts after each turn (`narrator.updates`, skipped during guide/menu).
- Priority: replay 100, guide 90, welcome 80, modal 60, error toast 50, event 40, toast 20 (narration-runtime.js:124–183).
- CSS: narration.css (all), `#toast` base style-v3.css:221–222, 240, 477.
- Problem: every toast is a full character card (portrait + name + role + control + paragraph + "Detalle"), 120 px tall, stacked bottom-right over the inspector.

### 4.11 Event cards
- `JUI.eventHTML` conexiones-ui.js:11–14: `article.game-event[data-narration-key="event-<id>"]` (photo, kicker "Suceso del turno N", h2, narration card, `button.choice[data-action="game-event"]`). Rendered inside agenda (`deskDecisionHTML`) and Prensa → Gaceta (`newsHTML`).
- Opened automatically after a turn: `showTenfeUpdate` app.js:1274 sets Despacho/agenda; `play()` refuses to start a day while an event is pending (631).
- CSS induction.css:28–29; narration.css:24.
- Tests: conexiones (`.game-event` count 1 after skip-month, `.game-event img`), narracion (`.game-event .narration-card [data-say]` equals `MESSAGES[key].text`, `.game-event [data-action="narration-replay"]`), mapa-voces.

### 4.12 Alert pill and welcome
- `showAlert` app.js:651–671: incidents/surges → if a drawer is open only a toast, else `div.alert-pill` appended to `#game` (12 s) with `open-incidents` / `city` buttons, plus a narration toast (`incident-alert`/`surge-alert`). CSS 178–181, 283, 297–298, 475–476, 489–490.
- `#entry-welcome` (see 4.10), removed on any `data-action` click (app.js:1488) except `welcome-close` itself and the narration controls; it overlaps `#mission` below 900 px.

### 4.13 Toasts
`#toast` is the narration tray (above). There is no plain text toast anymore.

### 4.14 Trenes Pop
- Entry: Flota → tab "Trenes Pop" (`fleet-tab` market), keyboard `t` (1710), `market-route` from route preview ("Compra uno que sí", 1120). `marketPage('catalogue')` → `Marketplace.catalogueHTML(state, ui.market, quote, trainThumb)`.
- Filters: `#marketSearchForm`/`#marketSearch` (submit 1645, input 1660), selects `#marketState #marketDelivery #marketMaker #marketSort #marketRoute` (change 1680), `market-family`, `market-favorites`, `market-reset`, cards `.tp-card[data-listing]` → `market-listing` → `marketListingDialog` 1409 (`detailHTML`, `#buyQty`, `#purchaseQuote`, `confirm-buy`).
- CSS marketplace.css; drawer variant `.trenespop-drawer` (white theme, full-width).
- Tests: node marketplace-test.mjs:82–107 and tenfe-test.mjs:36 (strings: `Trenespop`, select ids, `data-listing`, "Todas las unidades entran en tu parque al pagar.", `id="marketRoute"`, `✗ Sagunt — València: 3 kV`, `✓ Circula`, `marketRouteCount`, "Circula en N de M relaciones", "Solo 25 kV", "Gasóleo · 180 km/h", `tp-fit`); UI conexiones/tenfe/fabricantes/red (`.trenespop`, `[data-action="market-family"][data-id="Regional"]`, `[data-action="market-listing"][data-id="new-r599"]`, `#buyQty`, `confirm-buy`, `#marketMaker`, `.tp-card[data-listing]`, `.tp-photo img`, `.tp-detail-photo img`, `.tp-game-strip [data-action="fleet-tab"][data-id="fleet"]`, `#drawer.trenespop-drawer #marketRoute`, `.tp-fit`).

### 4.15 Taller de vías (track workshop)
- Entry: tramo inspector button `track-designer` (app.js:1203) → `trackDialog` 1463–1470: `Tracks.designer` (comparison scene + 3 fieldsets × 3 `track-select` buttons) + figures + callouts + `track-confirm`. Selection kept in `trackTarget/trackChoice` (1462, 1496).
- Legacy per-work dialog `workDialog` 1471–1481 still used by `work` buttons in tramo/node inspectors and Obras tab (`Tracks.comparison`).
- CSS induction.css:33–42, 44.
- Tests: conexiones (`.track-options button` = 9, `.track-proposal .track-photo[data-lanes|data-gauge|data-power]`, `.track-scene .track-photo` = 2 with background-position 100% 100%, `track-confirm`), ui-test (`#inspector [data-action=work]` ×4 for trb-sor).

### 4.16 Refit (taller de material)
- Entry: Flota → "Reformas" (`fleet-tab` refits) → `Refits.pageHTML(state, ui.refitView)` with `refit-view` workshop/catalogue; `refit-detail` → `refitDialog` (detailHTML + `#refitQty` + `#refitQuote`), `interior-preview` → previewHTML (slider `[data-refit-slider]`, input handler 1666–1669), `refit-confirm` 1618. Also from `fleetDetail` ("Comparar reforma").
- CSS train-refit.css.
- Tests: train-refit-ui (`#drawer .tabs [data-action="fleet-tab"][data-id="refits"]`, `.refit-lots img`, `[data-action="refit-view"][data-id="catalogue"]`, `.refit-catalogue article`=14, `img`=28, `interior-preview`, `#modal .refit-photo`, `#modal [data-refit-slider]`, `#modal .refit-scene` `--refit-split`, `#modal .refit-references`, `#refitQty`, `refit-confirm`), narracion (refit-info voice when the modal opens, toast `refit-started` survives closing).

---------------------------------------------------------------------------------------------------

## 5. Event dispatchers and data-actions

### 5.1 Listeners (all in app.js)
| Line | Listener | Notes |
|---|---|---|
| 188 | `pointerdown/pointerup/touchend/keydown/click` capture | unlock audio |
| 1232, 1715 | `#modal cancel` | Esc rules (menu subscreens, np, induction-dialog legacy, pending decision blocks close) |
| 1233 | `#modal keydown` | menu arrow navigation, np seed Enter |
| 1246, 1248 | `#modal close` | stop modal voice/narration; reopen menu if `menuOpen` |
| **1483–1643** | **`document click` → `[data-action]` switch** | `messageAction=a; clickSound(a,b)`; removes welcome; guide guards (1489–1490); after switch, if guide active: `tutorialIncident`, soria mark, `renderCoach()` (1642) |
| 1644 | `document submit` | `#marketSearchForm`, `#routeForm` (configureRoute, sfx `plan`) |
| 1652 | `document input` | sliders sfx, volumes, route preview (`routeFleet/frequency/fare`), searches, `npSeed`, `npGuide`, `buyQty`, `refitQty`, `data-refit-slider`, line/service previews |
| 1673 | `document change` | selects sfx, `routeStatus`, market selects, `ttHour`, `dayPriority`, `autoPause`, `musicMode`, `maintenance`, `importSave` |
| 1691 | `document pointerdown` | timeline seek (observer) — **anchor used by observer-runtime-test** |
| 1699 | `document pointerdown` | form-field tick sfx |
| 1700–1703 | static `[data-layer]`, `#zoomIn/#zoomOut/#resetMap` onclick | only non-delegated handlers |
| 1704 | `document keydown` | Esc blur/close; during guide only Esc (suspends); Space play; 1–6 pages; `t` Trenes Pop; +/− zoom |
| 1724 | `document keydown` | Esc cancels line picking |
| map-v3.js 72–97 | canvas wheel/pointer | pan/zoom/pick → `onPick` → `pick()` |

### 5.2 data-action catalogue (handler line in app.js · sfx recipe in sfx.js `ACTIONS`)
Navigation/panels: `navigate` 1506 nav · `close-drawer` 1507 drawerClose · `close-inspector` 1508 dismiss · `close-modal` 1509 @close · `net-view` 1591 · `fleet-tab` 1613 · `tycoon-tab` 1500 · `progress-tab` 1520 · `press-tab` 1521 · `tenfe-tab` 1519 · `route-tab` 1590 · `works-tab` 1608 · `tt-type` 1597 · `refit-view` 1615 · `office-tab` 1592 (dead) — all `tab`.
Objective/turn: `tenfe-next` 1511 tap · `tenfe-decision` 1512 · `decision` 1539 =decision · `game-event` 1494 =decision · `play` 1541 !play · `speed` 1542 · `day-start` 1543 !play · `day-end` 1544 dayEnd · `day-review` 1545 · `day-next` 1546 =dayNext · `skip-month` 1547 =skipMonth · `open-incidents` 1548 nav · `respond` 1549 =respond · `month-report` 1523 · `tenfe-notice` 1522.
Map/selection: `route` 1550 pickRoute · `city` 1551 pickCity · `train` 1593 · `station` 1594 · `station-map` 1595 · `station-timetable` 1596 · `tt-station` 1598 · `real-trip` 1599 · `follow` 1600 !toggle · `layer` 1601 lever · `visit-work` 1602 · `tramo` 1603 · `tramo-zoom` 1604 · `node` 1605 · `route-zoom` 1588 · `route-trips` 1589 · `line-map` 1631.
Network actions: `freq-up/down` 1552 · `open-route` 1553 · `request` 1554 · `station-up` 1555 · `new-service` 1609 · `confirm-service` 1610 · `close-service` 1611 · `upgrade` 1612 · `work` 1606 · `confirm-work` 1607 · `project` 1629 · `confirm-project` 1630 · `new-line` 1632 · `confirm-line` 1633 · `track-designer` 1497 · `track-select` 1496 · `track-confirm` 1498.
Fleet/market/refit: `fleet-detail` 1614 · `refit-detail` 1616 · `interior-preview` 1617 · `refit-confirm` 1618 · `refurbish` 1619 (dead) · `sell` 1620 · `purchase` 1621 (dead) · `market-listing` 1622 · `market-reset` 1623 · `market-family` 1624 · `market-route` 1625 · `market-favorites` 1626 · `market-favorite` 1627 · `confirm-buy` 1628.
Company: `tycoon-policy` 1501 · `tycoon-hire` 1502 · `tycoon-research` 1503 · `tycoon-lobby` 1504 · `tycoon-public/commercial` 1505 · `tenfe-pact` 1513 · `tenfe-mega` 1514 · `tenfe-shortcut(-confirm)` 1515–1516 · `tenfe-restitute` 1517 · `tenfe-lawyer` 1518 · `game-research` 1495 · `claim` 1540 · `borrow/repay` 1634–1635.
Audio/voice: `music` 1556 · `music-play` 1557 · `audio-activate/reset` 1558 · `music-toggle` 1564 · `voice-toggle` 1565 · `sfx-toggle` 1566 · `say` 1567 · `music-next` 1574 · `narration-replay` 1492 · `narration-dismiss` 1493 · `welcome-close` 1499.
Guide: `tutorial-next` 1575 tutorialNext · `tutorial-skip` 1576 dismiss · `tutorial-start` 1587 · legacy/dead: `tutorial-collapse` 1577, `-advice` 1578, `-advice-close` 1579, `-view` 1580, `-recover-day` 1581, `-quote` 1582, `-answer` 1583, `-focus` 1584, `-hold` 1585, `-finish` 1586.
Menu/save: `save-dialog` 1636 · `help` 1637 · `save-now` 1638 · `export` 1639 · `new-game` 1640 · `menu-home` 1533 · `menu-guide` 1534 · `menu-settings` 1535 · `menu-load` 1536 · `continue(-other)` 1537 · `observe` 1538 · `np-*` 1510, 1527–1532 · `legacy-*` 1524–1526.

**Rule enforced by test.mjs §11 (lines 154–164):** every `data-action="…"` literal and every `case '…':` in `app.js + main-menu.js + nueva-partida.js` must exist in `sfx.js ACTIONS` with a valid recipe (`=x` → `RECIPES[x]`, `!play|!toggle`, `@…` free, else `RECIPES[spec]`). Actions built by helper functions in other modules (`button('…','tenfe-next')`) are not scanned but still need an entry to make a sound (`clickSound` 234–251 returns silently if missing). Adding a new action ⇒ add `ACTIONS['new-action']` (append like sfx.js:332 does).

---------------------------------------------------------------------------------------------------

## 6. Guided tutorial — implementation in detail

### 6.1 Data and state
- `TOUR_STEPS` app.js:444–454: `{id,title,text,person,target,next,ready()}` for `welcome(#mission) → network(#drawer) → offer(#inspector) → decisions(#drawer) → people(#drawer) → research(#drawer) → infrastructure(#inspector) → day(#daybar) → handoff(#drawer)`. `text` = frozen narration (`guide-<id>`); `title`, `next`, `target`, `ready` are free.
- State `tut` (= `state.tutorial`, version 2): `{version:2,done,suspended,step,marks[],baseline:{frequency,fare,completed}}` created in `startTutorial` 470–479; validated by `validInduction` (induction-runtime.js:60–63: `step<9`, marks whitelist). **Changing the number of steps requires changing that validator** (save compatibility).
- Lifecycle: `startTutorial` (470) ← new game with guide (1357), `continueClassic` (1363), import (1687), `tutorial-start` (1587). `suspendTutorial` 480 (× button `tutorial-skip`, Esc 1707, menu 1533/1249). `endTutorial` 485. `tutorialNext` 489 (only if `ready()`). `focusTutorial` 497–509 forces the UI into the step's state (opens drawer page/tab or inspector, scrolls form). `tutorialIncident` 512–517 injects a breakdown when the day starts. Guards in dispatcher 1489–1490.
- `renderCoach()` 557–572 is called from `render()`, `frame()` every 120 ms, the dispatcher (1642), layer buttons (1700): rebuilds coach HTML when `[step,ready,phase,incident-resolved]` changes; coach content = portrait img + kicker ("Tu primer turno" / "Guía · n / 9") + name + `N.controls` (Escuchar) + × pause + h2 title + `p[data-say]` narration spans + footer ("Listo para seguir" / "Hazlo en el panel marcado" + next button). Then `narrator.guide(...)` and `positionTour()`.

### 6.2 Target choice — `tourTarget()` 518–527
1. If `#modal` is open → the modal (whatever modal it is: decision, day report, purchase…).
2. `network` step with `inspect.id==='madrid-valencia'` → `#inspector`.
3. `day` step: running and incident unresolved → `#drawer` (Red → Jornada); otherwise `#daybar`.
4. Else `document.querySelector(stage.target)` — **even if that element is hidden** (`.hidden`/display:none).

### 6.3 Highlight and blur — `positionTour()` 528–556
- Coach host: modal `.content` if the target is the modal, else `document.body` (532).
- Classes: `.tour-target` on the target (no CSS rule uses it), `.tour-dialog` on the dialog (outline + blurred backdrop, induction.css:8).
- **`inert` on every `#game` child except the target or its ancestor** (535). `#toast`, `#modal`, coach, shades and ring are outside `#game`, so they are not inert.
- In a dialog: remove shades and ring, coach gets `.in-dialog` (relative, full width, max-height 210, prepended to `.content`), return (536).
- Otherwise create (once) `#tour-shades` with four `<i>` and `#spot.tour-ring`, both appended to `body` (538–540).
- Hole = target rect ± 5 px clamped to the viewport (541–542). The four shades are the rectangles above / left / right / below the hole (553–554), each `position:fixed; background:#0b111a59; backdrop-filter:blur(3px) brightness(.8); pointer-events:auto` with 200 ms transitions (induction.css:6). Ring = same rect (555), 200 ms transitions (induction.css:7).
- Coach placement (543–552): width `min(340,w−32)` (mobile ≤600: `w−16`); height `min(offsetHeight, mobile?210:h−48)`.
  - mobile: `x=8`, `y = target.top > 60%·h ? 102 : h−74−ch` (i.e. bottom, on top of the day bar);
  - desktop: target left > 45 % width → coach to the left of it; else if room → right of it; else (wide target such as `#daybar`) → right-aligned above the target, or below it if it does not fit. `y` clamped to `[102, h−ch−100]` (magic numbers for the HUD height and the bottom bars).
  - Re-layout only when the geometry string changes (550–551) but the inert/class part runs every call.
- Coach CSS induction.css:4–9, 15; narration controls in coach narration.css:21, 29, 31; legacy `.coach`/`.spot` rules in style-v3.css:284–293, 337–338, 466–468, 487, 503 are dead.

### 6.4 Why other boxes get blurred or overlapped (root causes)
1. **Single-target model.** Only one element is the hole. Anything shown at the same time is blurred and inert: the HUD (resources), the mission/objective, the day bar while a drawer step is active, the inspector during `network` (until the route is picked), the drawer when a modal is open, etc.
2. **Messages live below the shades.** `#toast` (z 30) and `.alert-pill` (z 8, also inert) are under `#tour-shades` (z 40). Every toast emitted during the guide — "Plan de servicio actualizado." right after the `offer` step, "Investigación financiada.", the incident alert — is blurred unless it happens to fall inside the hole, and its Escuchar/× buttons are unclickable because the shade `<i>` have `pointer-events:auto`. Measured hit-tests on `#toast [data-action=narration-dismiss]`: 390×844 blocked by a shade in steps 2b, 3, 7, 7b, 7c; 1440×900 blocked by the coach in 7c, clickable in 2b only because the tray overlaps the highlighted inspector.
3. **Modals take over the guide.** When any modal opens, the coach is moved inside it and stacked above the modal content *and* above the narration card that `narrator.modal()` inserts after the `<h1>` — two character boxes with the same speaker one above the other (day report: Marisa Andén twice; see `run1/shot-1440x900-guide-7d-day-report.png`). The required button ("Siguiente jornada") ends below the fold of the modal while the coach "next" is disabled.
4. **Hidden-target dead end.** `tourTarget` returns `stage.target` even when it is hidden. In `network`, clicking a route other than Madrid — València hides the drawer and opens the inspector; the target becomes a 0×0 rect, the shades cover the whole screen and the inspector is inert (verified with `tools/probe-deadend.mjs`: drawer hidden, inspector visible + `inert`, ring 4×4 px at (4,4), its × hit-tests to a shade, coach "next" disabled). Same if the player closes the inspector during `offer`/`infrastructure` (its × is inside the target and allowed). Only exits: × pause or Esc. (`tutorial-focus` exists in the dispatcher but no button renders it.)
5. **Overlap by construction.** The coach is placed by fixed offsets (102 px top, 100/90 px bottom) and lives at z 43 above everything, toasts included. Desktop (final positions): it sits beside the target and does not cover panels, but in the `day` step it lands exactly on the toast tray (1440×900: coach 1082,496–1422,717 × toast 1002,588–1422,712 → 340×125) and **covers the toast's × button** (hit-test "blocked by P" of the coach); during the modal step it pushes the report down. Mobile (≤600): it is pinned to the bottom (`h−74−ch`) **on top of the whole day bar in 11 of the 14 measured states (374×82)**, so "Comienza la jornada"/"Hasta el último tren" are hidden under the coach footer (hit-test at step 7b: `[data-action=day-end]` blocked by the coach's own button), it overlaps the toast tray (362×82) and the 68 px invisible `.map-tools` column; when it jumps to the top (`day` step) it covers `#mission` (245×168).
6. **Lag/flicker.** Hole, ring and coach use CSS transitions (200–220 ms) driven by a 120 ms polling loop; the drawer itself slides in 14 px (`animation:slide`), so the first geometry is computed on the animated rect. Under CPU load the visible hole stays on the previous step's panel: run1 (normal motion) measured, 450 ms after each step change, the ring still around `#mission` in `network`, around the drawer in `network-route`, around the inspector in `decisions` and `day`, around the day bar in `handoff`, with the coach also at its previous place. Playwright reported "element is not stable" for the coach button and **shades intercepting `.desk-decision [data-action="decision"]` for 20 s at the `decisions` step — the current `conexiones-ui-test.mjs` failure**. With `prefers-reduced-motion` (all transitions off, style-v3.css:651) the same flow measures correct holes and the decision button is clickable (`code-shots/1440x900-3-decisions.png`). Because the shades take pointer events, a stale hole is not only ugly: it blocks the very control the coach asks for.
7. **Content under the hole may need scrolling.** On mobile the drawer/inspector are shortened to `bottom:300px` (induction.css:15) and the controls the guide needs (`#drawer [data-action=route][data-id=madrid-valencia]`, `#routeForm [type=submit]`, `#drawer [data-action=respond]`) start below the visible part of the panel body (hit-test "blocked by shade" until scrolled); `focusTutorial` only scrolls `#routeForm` (app.js:507) and the agenda top (508).
8. **Blur on the dialog backdrop is global**: `dialog#modal::backdrop{backdrop-filter:blur(3px)}` (style-v3.css:185) already blurs the whole game for every modal, guide or not; during the guide the backdrop is darkened further (induction.css:8).

### 6.5 Measured guide states (final positions, reduced motion)
See §10 and screenshots `code-shots/<size>-<step>.png` (`measure2.json` has every box and hit-test).

### 6.6 UI vocabulary that recorded narration refers to (keep these labels visible)
The frozen voice lines name UI places and buttons; renaming/removing them makes the narration wrong:
- `guide-welcome` (target #mission): "Aquí tienes **el objetivo de tu mandato** y **una propuesta para tu siguiente jugada**" → step-0 target must show both the mandate goal and the next-move CTA (`tenfe-next`).
- `guide-network`: "la misma **Red**… Pulsa **Madrid — València** para abrir su ficha" → page "Red" with a clickable Madrid — València row.
- `guide-offer`: "En el **plan de servicio**… La **previsión**… pulsa **«Aplicar plan»**" → route inspector form heading "Plan de servicio", `#routePreview` "Previsión del plan", submit label "Aplicar plan" (app.js:1097–1102, 1126).
- `guide-decisions`: "**tu Despacho**"; `guide-handoff`: "Esta es **tu Agenda**… acepta el encargo"; `guide-research`: "**laboratorio**"; `guide-people`: maquinistas disponibles/necesarios (tycoon people tab figures).
- `guide-infrastructure`: "abre el servicio: **cuesta 4 M€**" → "Abrir servicio · 4 M€" (app.js:1102).
- `guide-day`: "**Comienza la jornada**. Atiende la avería en **Red → Jornada**, avanza **hasta el último tren** y consulta **el parte**" → day-start label, Red page with "Jornada" tab, day-end label, day report.
- `guide-day-review`: "pulsa **«Siguiente jornada»**" (dayReport `day-next`, app.js:1387); `guide-day-resolved`: "Pulsa **«Hasta el último tren»**" (daybar `day-end`, app.js:759).
- `guide-paused`: "Puedes retomarla desde **Ayuda**" → nav "Ayuda" (`help`) must keep the "Retomar primer turno" button (`tutorial-start`, app.js:1448).
- `guide-close`: "…antes de **delegar el mes**" (`skip-month` "Cerrar turno"); `event-pending`/`event-choose`: "el suceso"; `help-info`: "compra material en **Trenes Pop**… **cierra el turno** jugando una jornada o delegando su operación"; `welcome`: "**Cinco retos y dos mandatos**"; `welcome-resume`: "Revisa **el objetivo**".

---------------------------------------------------------------------------------------------------

## 7. Text/number density (what the user calls "hecho por IA")

Inventory of always-visible text at 1440×900 after "Vamos a dirigir" (no panel open), from `run1/shot-1440x900-map.png`:
- HUD: brand + subtitle, "Turno 1 · tu red en marcha", "12 turnos hasta las urnas", clock, 5 labelled numbers (Caja, Resultado/turno, Apoyo, Puntualidad, Trenes libres).
- Mission: kicker, title, "0/5 retos · 0/2 mandatos", 5 retos with ○, a muted sentence, "SIGUIENTE" + CTA, 1 city request with "+34 M€".
- Legend: 8 entries + "Pulsa una ciudad". Layers "Capas ▾" + 3 zoom buttons.
- Day bar: "PREPARACIÓN", "06:30 → 02:11 +1", "24 circulaciones · 0 en autobús", timeline with 10 hour labels, 4 speeds, play, "Comienza la jornada", "Cerrar turno".
- Bottom nav: 6 labelled pages + 4 icons (music, save, help, menu).
- Map: ~70 city labels, request pin, crowd icons, glowing city halos.
Panels repeat explanations in every header (`header(kicker,title,text)`), every tab body opens with an h2 + paragraph (e.g. `JUI.campaignHTML` "Cómo se juega" callout, `researchHTML` rules sentence, `tycoonPage` banner + calendar text), and the inspector/route form adds a 4-line "Previsión del plan".

---------------------------------------------------------------------------------------------------

## 8. Tests that touch the UI

### 8.1 Node tests (run in `npm test` or standalone) — source-string and HTML assertions
| Test | What it pins |
|---|---|
| `test.mjs` §8 (121–128) | No `ficti|ficción|parodia`, **no external `http(s)://` links** in app.js/index.html (only w3.org) |
| `test.mjs` §11 (154–164) | **Every data-action / `case` in app.js+main-menu.js+nueva-partida.js has an sfx recipe** |
| `observer-runtime-test.mjs` 10–67 | **Executes app.js slices in a vm**: `function currentMinute() {`→`function viewTrips() {`, `function frame(t) {`→`function checkIncidents() {` (frame, play, pause), `function renderDaybar() {`→`function navigate(to) {` (renderDaybar, drawTimeline, mix), the listener starting at the last `document.addEventListener('pointerdown'` before `const cv = event.target.closest?.('#timelineCanvas')` up to `// campos de formulario`, and `/setMinute: m => \{[^\n]+?; render\(\); \}/`. Context provides only: `state,O,E,S,layer,playing,speedIndex,SPEEDS,lastTick,lastTimeline,lastPanel,observerMinute,requestAnimationFrame,dayType,plan,realTrips,clock,n,devicePixelRatio,$ (daybar/timelineCanvas/else {open:false}),document{body.dataset.sky,addEventListener},spawnArrivals,checkIncidents,checkSurgeEvents,finishDay,renderClock,renderCoach,checkMusicMood,renderDrawer,renderInspector,renderHud,renderMission,render,toast,intro,showDecision,dayReport,resetToday,networkKey,seenIncidents,screen,inspect,sfx`. Asserts daybar HTML for `layer==='real'` contains `Observación del horario real` and none of `data-action="day-start|day-end|day-review|skip-month"`; timeline dataset first 240 / span 1320. ⇒ Do not call new helpers (e.g. `esc`, `icon`, `J`, `renderObjective`) inside those slices, or add them to the test context. |
| `induction-test.mjs` 135–137 | app.js contains `function positionTour()`; does not contain `focusedTaskHTML(state,tut)`. Also tests `induction-task-ui.js` HTML (legacy). |
| `verdad-test.mjs` 119–121 | app.js contains regex `Ocupación \$\{n\(mt\.occupancy \* 100\)\} %`; not the old `<span class="flag">Petición</span><span><i class="crowd">▮▮▮</i>Trenes llenos</span>` |
| `tenfe-test.mjs` 36, 91–93 | `catalogueHTML` includes `Trenespop`, `BCBB`; `newGameHTML` has no `np-pick`/`Maqueta`; app.js has no `mountRescue`; extractor has no `'rescate-ui.js'` |
| `marketplace-test.mjs` 82–107 | Trenes Pop strings/ids (see 4.14) |
| `tycoon-contract-test.mjs` 54–66 | `tycoonPage` contains "Margen del servicio", "Ocupación de plazas", not "Tarifa máxima", not "Servicio preparado.", "Objetivo opcional · +N M€", "Historial del mandato", `E.dateOf(12)` |
| `train-refit-test.mjs` 18, 27 | `previewHTML` contains model name; `quoteHTML(...).disabled` without cash |
| `nueva-partida-test.mjs` 46–62 | menu/new-game strings (`data-action="continue" data-game="classic"`, `<time>enero de 2022</time>`, `legacy-preview`, `role="alert"`, `np-no/np-yes`, autofocus) |
| `narration-test.mjs` 16–23 | 12 guide messages; every STATIC text maps back to its key; `toastKey` examples (`Material enviado al taller.`→refit-started, errors → error-money/fleet, "15 maquinistas en formación." → training-result, "Financiación: 23,4 M€" → finance-result) |

### 8.2 Playwright selectors the in-game UI must keep (current suites)
Strict-mode note: Playwright `locator(sel).click()` throws when `sel` matches more than one element (hidden ones count). Bare selectors used today that must stay unique: `[data-action="day-start"]`, `[data-action="day-end"]`, `[data-action="day-next"]`, `[data-action="close-drawer"]`, `[data-action="close-inspector"]`, `[data-action="track-designer"]`, `[data-action="track-confirm"]`, `[data-action="confirm-buy"]`, `[data-action="refit-confirm"]`, `[data-action="welcome-close"]`, `[data-action="tutorial-skip"]`, `[data-action="skip-month"]` (tenfe-ui, unscoped), `[data-action="new-game"]`, `[data-action="continue"]`, `#buyQty`, `#frequency`, `#fare`, `#routeFleet`. Note the drawer keeps its old innerHTML when hidden, so duplicates inside a closed drawer still count.

| Suite | Status at HEAD (this run) | In-game selectors/assertions |
|---|---|---|
| `conexiones-ui-test.mjs` | 1440 and 390 sections pass; **fails in the guide section at `decisions`: `#tour-shades i` intercepts the click on `.desk-decision [data-action="decision"]`** (log `<scratchpad>/logs/conexiones-ui-test.mjs.log`; observed under load ≈ 15–20, a re-run on the same loaded machine was aborted; with reduced motion the same step works, so expect it to pass on an idle machine but fail whenever frames are slow) | `#navigation [data-screen=network|fleet|finance|story|progress|press]`, `#drawer` `.hidden` class, `#drawer .body` no h-overflow, `#entry-welcome` count 1, `#network-board` 0, `#map` visible, `welcome-close`, `progress-tab research/proyectos`, `.game-research article`=18, `game-research[data-id=cadenciados]`, `.game-megas article`=6, `tenfe-mega[data-id=control]`, `tycoon-tab pactos/agenda`, `tenfe-pact[data-id=investigacion]`, `.desk-decision [data-action=decision]`, `#daybar [data-action=skip-month]`, `#modal [data-action=decision]`, `.game-event` + img, `game-event`, Trenes Pop and track workshop (4.14/4.15). Guide: `#coach`, `#tour-shades i`=4, `.induction-task,.induction-question`=0, `#coach [data-action=tutorial-next]`, `#drawer [data-action=route][data-id=madrid-valencia]`, `#routeForm [type=submit]`, `#coach` `data-step-id` = `infrastructure`/`handoff`, `#routeFleet` option `f2`, `#drawer [data-action=respond]`, `#modal .induction-dialog`=0, `#modal #coach`=1, `tycoon-public`, end: `#coach,#tour-shades,#spot`=0 and `tutorial.done`. Mobile: `#frequency/#fare` visible after step 2, `tutorial-skip` removes guide, `continue` opens no modal. |
| `narracion-ui-test.mjs` | **pass** (159 s) | `#entry-welcome .narration-speaker strong`="Raquel Sanz", `#entry-welcome [data-action=narration-replay]`, `#toast .narration-speaker strong`, `.narration-toast` fits, **toast bottom ≤ `#daybar` top − 8**, `#toast [data-narration-key=…] [data-action=narration-replay]`, `.game-event .narration-card [data-say]`, refit flow, `#toast .narration-card[data-narration-key=refit-started]`; guide: `#tour-shades i`=4, `#coach` fits viewport, `tutorial-skip` → `#coach,#tour-shades`=0, guide voices `guide-welcome`, `guide-network`, `guide-paused`; repaint must not restart voices. |
| `mapa-voces-ui-test.mjs` | map section passes; twice stopped by a `page.screenshot` timeout at line 86 (council voice screenshot) with machine load ≈ 20 on 4 cores (other agents' browsers) — environmental, re-run on an idle machine | `#map`, `#network-board`=0, `getViewport` frame contains 6 cities, `#zoomIn`, `#resetMap`, click Madrid → `#inspector .city-title`, `#inspector [data-action=route]`, `close-inspector`, `.map-layers summary` + `[data-layer=…]`, Despacho voice (`.desk-decision .say-btn` visible/aria-pressed, `.say-s.on`), `day-start`, `day-end`, `#modal [data-action=day-next]`, `#navigation [data-screen=story].active`, `.game-event [data-action=game-event]`, `#daybar [data-action=skip-month]`, mobile `.desk-decision .say-btn` visible. |
| `train-refit-ui-test.mjs` | catalogue/SHA/comparator checks pass at 1440; twice stopped by a `page.screenshot` timeout at line 66 under the same load — environmental | see 4.16 |
| `fabricantes-ui-test.mjs` | **pass** (161 s) | `#navigation [data-screen=fleet]`, `fleet-tab market`, `#marketMaker`, `.tp-card[data-listing]`, `.tp-photo img`, `.tp-detail-photo img`, `#modal [data-action=close-modal]`, `#drawer .body` fits |
| `menu-inicio-ui-test.mjs` | **pass** | main menu only + `welcome-close`, `#map` visible |
| `tenfe-ui-test.mjs` | **fails (stale)** at `.gazette` (Prensa→Gaceta now renders `JUI.newsHTML`) | 6 sections fit, Trenes Pop, pacts, research `tycoon-research[data-id=online]`, `skip-month` ×4, `.tenfe-report`≥4, `#mission` contains "rescate" |
| `gameplay-ui-test.mjs`, `red-ui-test.mjs` | **fail (stale)**: `np-pick[data-id=maqueta]` no longer exists | `.tycoon-tabs`, `office-tab`, `.mandate-card`, layer order, legend texts, `#routePreview [data-action=market-route]`, `.tp-fit` |
| `nueva-partida-ui-test.mjs` | **fails (stale)**: `#menu-departures-title` | old menu/rescate selectors |
| `onboarding-ui-test.mjs` | **fails (stale)**: title "Tenfe 2022–2050"; whole suite targets the v1 tutorial (`.induction-dialog`, `.lesson-controls`, `tutorial-view`) | — |
| `contract-progression-ui-test.mjs` | **fails (stale)**: legacy fixtures/decisions, `office-tab` | — |
| `ui-test.mjs` | **fails before the browser** (requires 522 embedded voice clips, `assets/voices.js` is empty by design) | `office-tab`, `.induction-dialog`, title text |
| `voice-*-ui-test.mjs`, `rescate-ui-test.mjs`, `audio-*-ui-test.mjs` | not in-game UI / need `outputs/Iberia-Ferroviaria.html` or a headed browser | `audio-salida`: menu audio button and game audio; skip for layout work |

`window.railwayGame` (app.js:1718–1720) is used by every suite and must keep: `state, snapshot, render, navigate, setLayer, selectRoute, pick, setMinute, plan, minute, play, pause, finishDay, map (zoom, layer, cityPoints, trainPoints, opts.getViewport/getCities/isVisible, focusAt), narrator (toast, reset), voices (enabled, toggle, stop, speaking, source, lastError), music, sfx, engine, unified, campaign, operations, schedule`.

Screenshots: every suite writes PNG/JPEG to `outputs/tenfe-qa/` (gitignored) or `investigacion/verificacion-*` (tracked!) — `ui-test.mjs`, `onboarding-ui-test.mjs`, `gameplay-ui-test.mjs`, `red-ui-test.mjs`, `contract-progression-ui-test.mjs` default into `investigacion/…`; set `UI_TEST_OUT` / `ONBOARDING_SCREENSHOTS` or run on a copy. No suite compares pixels (screenshots are evidence only); assertions are DOM/geometry based.

How to run (verified here): serve the game folder, `PLAYWRIGHT_MODULE=/opt/node-tools/node_modules/playwright/index.mjs CHROMIUM_PATH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome|head -1)`; suites that `import {chromium} from 'playwright'` need a resolver hook (e.g. `NODE_OPTIONS="--import <register.mjs>"` mapping `playwright` to the path above). Self-serving suites (`conexiones`, `tenfe`, `narracion`, `mapa-voces`, `fabricantes`, `train-refit`, `menu-inicio`) serve `iberia-ferroviaria/` and therefore test the **published `index.html`**, not `dist/` — rebuild (`node iberia-ferroviaria/tools/build-web.mjs`) before running them on edited source. Run suites one at a time: swiftshader + map canvas saturates 4 cores and causes screenshot/stability timeouts.

---------------------------------------------------------------------------------------------------

## 9. Publisher constraints (UI-relevant)

`tools/extract-game-source.mjs` (called by `tools/build-web.mjs:153`):
- Bundle list is hard-coded (`baselineOrder` line 27–28 + `optionalBefore` 29–30; optional files only if they exist). **A new module file is not bundled unless added there** (e.g. to `optionalBefore['app.js']`). Keep `'rescate-ui.js'` out (tenfe-test).
- Module syntax accepted (48–53): single-line `import * as X from '…';`, single-line `import {a, b as c} from '…';`, `export function|const|let|class`, `export {…}`. Multi-line imports, `export default`, dynamic `import()`, `import.meta`, top-level `await` break the build (`Unsupported module syntax` or `vm.Script` compile error).
- CSS: only `style-v3.css + main-menu.css + induction.css (+ marketplace.css) + train-refit.css + narration.css` are concatenated (61–64). New CSS must go into one of them. `url('assets/…')` must use single quotes to be embedded; any other `url(...)` must be `data:`/`blob:`/`#` (68–72).
- `index.html` must contain exactly once (`replaceOne`, count===1): `<link rel="stylesheet" href="main-menu.css">`, `…induction.css">`, `…train-refit.css">`, `…narration.css">`, `…style-v3.css">`, `<script>globalThis.IBERIA_SAMPLE_BASE = 'assets/';</script>`, `<script type="module" src="app.js"></script>`, `</body>`; optional once: `…marketplace.css">`, `…rescate.css">`, `<script src="assets/three.min.js"></script>`.
- app.js must contain exactly once: `onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }` (inside `speakIn`, app.js:160).
- main-menu.js must contain exactly once `<footer class="menu-council">` (receives `__WEB_PREVIEW_LABEL__`, replaced once by build-web.mjs:288).
- voice.js must include `NARRATION_VOICES[id]` and `await response.arrayBuffer()` and no `speechSynthesis`.
- build-web.mjs: game script must keep exactly one `__WEB_DIALOGUES__`; module markers `// ---- assets/train-photos.js\n` and `// ---- brands.js\n` are generated by the extractor (unique); no `<base>`; runtime image paths referenced from JS must be under folders the builder publishes (`assets/rescate/`, `assets/vias/`, interiors, logos, train photos, narration). New images referenced from JS elsewhere would 404 in the published page; images used from CSS are embedded automatically.

---------------------------------------------------------------------------------------------------

## 10. Measurements (`code-shots/measure2.json`, reduced motion, seed AUDIT-GUIDE)

Boxes are `left,top–right,bottom` in CSS px. "Hit" = `document.elementFromPoint` at the control centre.

**1440×900** — fixed boxes: HUD 18,14–1422,78 · mission 18,98–292,563 · map-tools 1336,98–1422,246 · legend 18,666–558,722 · daybar 18,740–1422,816 · nav 18,824–1422,886 · drawer 18,98–778,722 · inspector 1032,98–1422,722 (city 982,150–1422,722) · toast tray anchored 1002,·–1422,712/726.

| Step | Target | Coach | Notable |
|---|---|---|---|
| 0 welcome | #mission | right of mission 317,102 | `day-start` under shade (expected) |
| 1 network | #drawer | right of drawer 803,102 | route row clickable |
| 1b network (route picked) | #inspector | left of inspector 667,102 | `#routeForm` submit below the inspector fold |
| 2b offer + toast | #inspector | 667,102 | toast tray overlaps the inspector 390×125 (inside the hole, so clickable) |
| 3 decisions | #drawer | 803,102 | decision button clickable (fails only with transitions, §6.4-6) |
| 7 day | #daybar | 1082,477–1422,717 (above day bar, right) | |
| 7b incident | #drawer | 803,102 | `day-end` under shade |
| 7c resolved | #daybar | 1082,496 | **coach covers the toast tray 340×125; toast × blocked by coach** |
| 7d report | #modal | inside `.content`, 429,71–1011,281 | **coach + `narrator.modal` card = 2 character boxes**; coach sticks 7 px over the HUD |
| 8 handoff | #drawer | 803,102 | `tycoon-public` below the drawer fold |
| (no guide) city panel | — | — | inspector × toast 420×125; inspector × map-tools 86×96 |

**390×844** — HUD 8,8–382,88 · mission 8,100–253,270 · `.map-tools` **314,100–382,668** (invisible 68 px column) · daybar 8,688–382,770 · nav 8,778–382,836 · drawer/inspector in guide 8,100–382,544.

| Step | Coach | Notable |
|---|---|---|
| 0–6, 7b, 8 | 8,578/594–382,770 | **covers the whole day bar (374×82)**; `day-start` blocked by the coach footer/button |
| 2b, 3, 7, 7b, 7c | — | toast × blocked by a shade (toast tray z 30 < shades z 40) |
| 7 day / 7c | 8,102–382,294 | coach jumps to the top over `#mission` (245×168) |
| 7b incident | 8,594 | `day-end` blocked by the coach's next button; incident buttons below the drawer fold |
| 7d report | 33,58–357,234 (in modal) | narration card + coach inside the modal |
| city panel (no guide) | — | **inspector 8,−1899–382,679: top off-screen** (×, title, hero unreachable) |

Normal-motion run (`code-shots/run1/measure.json`, same flows, under CPU load) shows the stale hole/coach described in §6.4-6.

---------------------------------------------------------------------------------------------------

## 10b. Dead or legacy code that can be removed while restructuring

- app.js: `ongoingHTML` 736–743 and `withView` 904–907 (never called); `renderBoard` 686–690 only removes the old `#network-board`; no-op stubs `rememberTutorialDraft/restoreTutorialDraft` 467–468, `tutorialAnswer` 494; v1-tutorial helpers reachable only from dead actions (`tutorialView` 510, `tutorialAdvice` 511, `officeTutorial` 496 is still used by `tutorial-finish`); vars `adviceLine`, `tutorialDraft`, `inductionModalKey`; dispatcher cases `office-tab`, `purchase`, `refurbish`, `continue-other`, `np-pick`, `np-cash`, `np-rivals`, `tutorial-collapse|advice|advice-close|view|recover-day|quote|answer|focus|hold|finish` (keep their `ACTIONS` entries if any literal remains, test.mjs §11 scans `case` labels too); `storyPage` 1037 used only for non-Conexiones saves; `#modal` cancel branch for `.induction-dialog` (1232).
- `conexiones-ui.js` `boardHTML` 53–62 (board view, never rendered); `tenfe-ui.js` non-`game` branches (pre-Conexiones saves are migrated by `U.begin`).
- CSS: style-v3.css `.coach`/`.spot` 284–293 (+ in lists 337–338, 466–468, 487, 503), `.segmented` 398–400, `.story/.chapters` 208–213 (only `storyPage`), `.mandate-card` 602, `.mission .requests` 276–280, `.credit` 69–70, `.catalogue` 205–207; induction.css `#network-board` and `.board-*` 19–27, 43–44. Grep templates before deleting.

## 11. Safe seams for the restructure

Ordered from least to most risky.

1. **CSS-only re-layout in the Tenfe 5 block.** Append a new final section at the end of `style-v3.css` (or `induction.css` for guide styles) and override positions/z-index there; delete the dead legacy rules (`.coach`, `.spot`, `.segmented`, `#network-board`, `.board-*`, `.mandate-card`, `.chapters`, `.story`) only after grepping templates. Fix the measured layout bugs here: `.map-tools{bottom:auto}` at ≤760, `.inspector.wide{top:…}` at ≤760, `#inspector`/`.map-tools` collision (move tools left of the inspector or hide while open), entry-welcome vs mission, mobile rail overflow.
2. **Keep the skeleton ids, change what they contain.** `#mission`, `#daybar`, `.hud`, `#navigation`, `#drawer`, `#inspector`, `#legend`, `#toast`, `#modal`, `#map`, `#zoomIn`, `#resetMap`, `.map-layers summary`, `[data-layer]` are referenced by `getViewport` (app.js:116–120), `narrator.positionTray` (narration-runtime.js:105–108), tests and the guide targets. Restyle or re-template them; do not rename. A compact objective strip can live inside `#mission` (rewrite `renderMission` 721–734 and `JUI.missionHTML`/`TenfeUI.nextHTML`) — keep `data-action="tenfe-next"` and its handler (1511), and keep `#mission` in the DOM even when visually merged into the HUD (it is the first guide target and part of the map viewport frame; if it moves into the top bar, update `getViewport` so the map is not fitted behind it).
3. **New HUD/menu layer = new child of `#game` rendered by a new `render*` function called from `render()`** (app.js:681). Use `data-action` buttons handled in the existing switch (add `case` + `sfx.js ACTIONS` entry). Do **not** call it from `frame()` or `renderDaybar()`/`drawTimeline()` (observer vm slices) — call it from `render()` or from `renderHud()` (not in the vm slices; only stubbed). If it must refresh while playing, piggyback on `renderHud()` (called every 1 s in `frame`). Because the guide sets `inert` on every `#game` child except the target, a new always-visible element becomes inert/blurred during the guide unless the target logic includes it.
4. **Menus/dropdowns for secondary info**: reuse the native `<details>` pattern already used by `details.map-layers` (index.html) and `details.contract-history/branch-bonus` (tycoon-ui.js); it needs no JS and survives re-render (state lost on re-render unless tracked like `libraryOpen` in `musicDialog` 201). Secondary HUD numbers (Apoyo, Puntualidad, Trenes libres, turns to election) can move into such a dropdown or into Dinero/Progreso without touching tests (no test reads `#resources`).
5. **Drawer pages**: page renderers are pure functions returning `[head, body]` (`pages` map app.js:821). Tabs can be merged/removed freely except the ones tests click: `net-view routes` + `#drawer [data-action=route][data-id=madrid-valencia]` (guide step 2), Red→Jornada `#drawer [data-action=respond]` (guide `day`), `progress-tab research|proyectos`, `tycoon-tab agenda|pactos|people`, `press-tab paper|reports`, `fleet-tab market|refits|fleet`. `ALIASES` (73) and `tycoon-tab` routing (1500) let old keys keep working.
6. **Guide**: rewrite `tourTarget`/`positionTour`/`renderCoach` (518–572) freely as long as `function positionTour()` stays in app.js, `#coach` (+ `data-step-id`, `[data-action=tutorial-next]`, `[data-action=tutorial-skip]`), `#tour-shades` with exactly 4 `<i>` and `#spot` are created during the guide and removed at the end/pause, and the coach moves into the modal (`#modal #coach`) for the day report. Recommended fixes: raise `#toast` (and a new message area) above the shades or give the shades `pointer-events:none` plus a transparent click-catcher only outside the union of target + coach + toast; support a list of targets (e.g. drawer + inspector, daybar + its toast) by computing the hole from the union rect or by switching to a single `box-shadow:0 0 0 100vmax` ring with `pointer-events:none`; stop putting the coach inside modals (dock it outside the dialog using a top-layer element, or hide `narrator.modal`'s card while `tut`); fall back to `focusTutorial()` when the target is hidden; replace the magic 102/100/90 px offsets with the measured HUD/daybar rects; drop the 200 ms transitions (or position synchronously after the drawer animation ends); keep step texts byte-identical, titles/buttons may change. Step count change ⇒ update `validInduction` (induction-runtime.js:60–63) and `oldSteps` mapping (app.js:473).
7. **Narration cards**: shrink visually via CSS (`narration.css`) — e.g. hide `.narration-details`, role `small`, portrait size — without changing `card()` markup (tests read `.narration-speaker strong`, `[data-action=narration-replay]`, `[data-narration-key]`, `.narration-card [data-say]`, `#toast .narration-card`). Do not change toast message strings (41 recorded) or `narrator.modal` key detection classes (`.report-head`, `.refit-modal`, `.track-modal`, `.trenespop-modal`, `#buyQty`, `#lineA`, `#svcA`, `[data-action="tenfe-shortcut-confirm"]`, `#importSave`, `.method`, `.tenfe-news-modal`, `.tenfe-month-report`), or the voices stop playing.
8. **New files** (`hud.js`, `hud.css`): only with matching edits to `tools/extract-game-source.mjs` (`optionalBefore['app.js']`, CSS concatenation + `index.html` link replacement). Simpler to keep code in app.js / existing CSS.
9. **Single source for "the objective"**: `U.nextAction(state)` (tenfe.js:230 → conexiones.js:205–215) already returns `{label, action, id|screen}` for the next thing to do, and `J.CHALLENGES` (conexiones.js:15–21) + `state.tenfe.game.challenges` give the mandate progress. Neither label set is recorded (free to shorten). An always-visible objective chip (HUD or day bar) can render `nextAction` with `data-action="tenfe-next"` — but a second `tenfe-next` button in the DOM makes the bare selector ambiguous only if a test clicks it unscoped (none does today). Keep the `#mission` copy (or move the id) so `guide-welcome` still points at "objetivo + propuesta".
10. **Regression gate after each step**: `npm test` in `proyecto/` (node suites incl. `test.mjs` sfx check), `node observer-runtime-test.mjs`, `node induction-test.mjs`, `node verdad-test.mjs`, `node tycoon-contract-test.mjs`, then rebuild (`node iberia-ferroviaria/tools/build-web.mjs`, which also runs the extractor checks) and run, one at a time, `conexiones-ui`, `narracion-ui`, `mapa-voces-ui`, `fabricantes-ui`, `train-refit-ui`, `menu-inicio-ui`; finally `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` = `6348984c…098f`.
