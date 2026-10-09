# Research synthesis: steal list and UI information architecture

**For:** «Iberia Ferroviaria · Rescate de Tenfe», the unified single mode.

**Inputs, all read in full** (in `scratchpad/unify/`):
- `research-airport-ceo.md`
- `research-tropico.md`
- `research-cities.md`
- `research-rail-games.md`

**Checked against the current game with:**
- `rescue.md` §A–E: the loop, the systems, the UI and 37 places where the dialogue and the engine disagree;
- `classic.md` §9;
- `free-trenespop-infra.md` (Trenespop);
- the screenshots `cur-02-ancho.png` and `cur-04-decision.png`.

**Abbreviations:**
- Games: ACEO = Airport CEO; CS1 and CS2 = Cities: Skylines and Cities: Skylines II; TF2 = Transport Fever 2; RE2 = Railway Empire 2; SMR = Sid Meier's Railroads!.
- Scores: V = value, from 1 to 5; C = cost, from 1 to 3.

Contents:
- 0. Four rules every steal obeys
- 1. The top 25 steals
- 2. The replayability toolkit
- 3. The UI information architecture, with 5 wireframes
- 4. Anti-patterns these games avoid and our UI falls into
- 5. Open questions for the design judges

---

## 0. Four rules every steal obeys

1. **The words follow the engine.** Every line of dialogue, headline, alert and tooltip is built from an engine record (an event, a cause or a ledger line) and quotes that record's numbers. If the engine doesn't do something, no text says it does. ACEO shows what goes wrong otherwise: a report saying «grado A, sin multa» arrived together with a 1,364,509 $ fine.
2. **Every number explains itself**, using the same function that computed it.
3. **No new top-level doors.** Each steal names its place in the navigation of §3. A steal with no place there is not in v1.
4. **Variety comes from the game state, not from dice.** Random draws happen in two places only: at setup (the seed), or as hazards with a visible cause that grow with the state.

---

## 1. The top 25 steals

### 1.1 How the 25 were chosen and ranked
- **Merging.** The four reports propose 97 ideas. Many are the same idea found in several games; four reports propose an alert inbox, for example. Each such idea becomes one entry that credits every source. §1.5 says where each of the other ideas went.
- **Scoring.** I re-scored value and cost against our own code instead of copying the reports' scores.
  - V measures fun, clarity and replayability in this game.
  - C1 means showing values the engine already computes; C2, one small engine rule plus its UI; C3, a new subsystem or a change to the engine model.
- **Ranking.** Only ideas with V ≥ 4 qualify. They are ranked by V/C. Ties go to the idea that more of the four reports arrive at independently.
- **Rank is not build order.** Four entries are foundations that others need, so §1.4 gives the build order separately.
- **Airport CEO**, which the user asked us to mine, is the main source of 9 entries (6, 7, 9, 11, 13, 14, 17, 19 and 23) and a co-source of 7 more.

### 1.2 Summary

| # | Steal | Main source + others | Kind | V | C | V/C | Where it lives (§3) |
|---|---|---|---|---|---|---|---|
| 1 | «¿Por qué?» on every number | CS2 + ACEO, Tropico | feedback | 5 | 1 | 5.0 | popover on any number |
| 2 | No dead ends: padlock, reason, remedy | CS2 + ACEO, OpenTTD | onboarding | 5 | 1 | 5.0 | a rule for every control |
| 3 | Layers that switch on with the tool, plus a context legend | CS2 + ACEO, TF2, Tropico | UI | 4 | 1 | 4.0 | Capas ▾ in the map corner |
| 4 | A maker's exclusive preview offer | OpenTTD | mechanic | 4 | 1 | 4.0 | decision → Flota › Trenespop |
| 5 | New game: seed, starting situation, president with one trait | Tropico + CS, TF2, ACEO, RE2 | replay | 5 | 2 | 2.5 | start screen |
| 6 | Alert triage: critical, inbox, on the map | **ACEO** + TF2, RE2, CS | feedback | 5 | 2 | 2.5 | Misión · Avisos · map |
| 7 | «Monitor de corredores» | **ACEO** + CS2, TF2, OpenTTD | UI | 5 | 2 | 2.5 | Red › Corredores (M) |
| 8 | Named modifiers, weekly challenge, «Modo maqueta» | Mini Motorways + CS1, ACEO | replay | 5 | 2 | 2.5 | start screen |
| 9 | A tutorial that checks itself against the game state | **ACEO** + CS2, TF2 | onboarding | 5 | 2 | 2.5 | Misión, «Lista» view |
| 10 | Gaceta and «Trenter»: facts only, silence when all is well | CS2 + OpenTTD, Tropico | feedback | 5 | 2 | 2.5 | ticker · Prensa |
| 11 | «Notas de Tenfe»: the four groups in two levels and three parts | **ACEO** + Tropico | feedback | 5 | 2 | 2.5 | Política › Apoyo |
| 12 | Named milestones that pay ◆; ◆ only for lasting results; trees in any order | CS2 + CS1 | progression | 5 | 2 | 2.5 | Hito badge · Progreso › Desarrollo |
| 13 | «Planos»: draw works, compare them, then order one | **ACEO** + TF2, OpenTTD | mechanic | 5 | 2 | 2.5 | card → Obra |
| 14 | Incidents with a deadline, a grade and a report that matches the ledger | **ACEO** + Tropico | mechanic | 5 | 2 | 2.5 | decision · Prensa › Informes |
| 15 | «Consejo de Ministros»: choose 1 of 2 cards every 4 weeks | Mini Metro + Mini Motorways | progression | 5 | 2 | 2.5 | decision |
| 16 | «Mitin»: a speech builder whose promises become tasks | Tropico | mechanic | 5 | 2 | 2.5 | decision · Política › Apoyo |
| 17 | «Comité de dirección»: directors unlock tools | **ACEO** + Tropico, CS2 | onboarding | 4 | 2 | 2.0 | Progreso › Comité |
| 18 | A seeded calendar of future events | Tropico 4 + OpenTTD | replay | 4 | 2 | 2.0 | Progreso › Calendario · week chip |
| 19 | Renegotiation with a visible chance and a counteroffer | **ACEO** | mechanic | 4 | 2 | 2.0 | Política › Pactos |
| 20 | Trenespop opened from a corridor, and «¿Puede pasar?» | OpenTTD + TF2, NIMBY Rails, ACEO | UI + engine | 5 | 3 | 1.67 | Flota › Trenespop · corridor card |
| 21 | «Peticiones»: one request system | ACEO + Tropico, OpenTTD | mechanic | 5 | 3 | 1.67 | Política › Peticiones |
| 22 | «Medidas»: policy cards in limited slots that ramp up | Tropico + CS, ACEO | mechanic | 5 | 3 | 1.67 | Política › Medidas |
| 23 | One drawer from the left, at most 50 % wide, two levels deep | **ACEO** + CS2 | UI | 5 | 3 | 1.67 | the drawer |
| 24 | Stages with visible exit conditions and a final path you choose | Tropico + RE2, TF2 | progression | 5 | 3 | 1.67 | Misión · Progreso › Etapa |
| 25 | «El Conseguidor»: corruption as an offer board with a visible risk | Tropico + OpenTTD | mechanic | 5 | 3 | 1.67 | Política › Conseguidor |

### 1.3 The 25, in detail

Each entry has the same five parts:
- **From:** what the source games do, with their numbers.
- **In Tenfe:** the mechanic, its UI and our numbers.
- **Why:** what it adds to fun, clarity or replayability.
- **Fixes:** a documented problem in our game that it solves, when there is one.
- **Needs:** another entry it depends on, when there is one.

Every number is a starting point for tuning.

#### 1 · «¿Por qué?» on every number · V5 C1
- **From:**
  - CS2: hovering the five happiness faces lists the signed pros and cons. Districts, households and companies work the same way.
  - ACEO: each sub-rating has a tooltip saying what it depends on and what you can do about it.
  - Tropico 6: the Almanac lists the modifiers behind each faction's standing. Players who never found that list thought approval was random.
- **In Tenfe:**
  - Every number on the HUD, the corridor card, the monitor and the Política section opens a popover on hover, or on long-press on phones.
  - The popover shows the value, its target or trend, up to 5 signed causes, and one «Ir ›» link to the fix.
  - The causes come from the functions that already compute each value: `punctTarget().causes` («Vía −28», «Trenes −6»), `groupTargets().rows`, `weeklyAccounts` and `cashProjection`.
  - Example for cash: «Semana 34: −0,37 M€ = billetes +0,92 · nómina −0,61 · energía −0,22 · obra Norte −0,46 · OSP +0,32 que se cobra en la semana 39».
- **Why:** the game stops feeling random, and it is the cheapest clarity win on the list.
- **Fixes:** the top bar shows −45 k€ while the toast shows −370 k€, because one figure includes the prorated OSP and the other does not (rescue.md §C.1, `cur-04-decision.png`).

#### 2 · No dead ends: padlock, reason, remedy · V5 C1
- **From:**
  - CS2 shows the whole toolbar from minute one, with padlocks. A common complaint: an item is "in the menu, just locked, without even a button to open the UI to unlock it".
  - ACEO lists each ground service's requirements underneath it. Its worst-reviewed behaviour is a flight that silently bounces back to the list.
  - OpenTTD answers with a reason: "{TOWN} local authority refuses to allow this".
- **In Tenfe**, three rules:
  - Locked things stay visible, greyed, with a padlock. Hovering one shows «Se desbloquea en el Hito 3, Operador Solvente (faltan 4,2 k viajeros/sem)» and a button «Abrir Progreso ›».
  - Every refused action answers in place, with the cause and a remedy button that shows its cost or time. Examples:
    - «El S-112 es de ancho UIC y Extremadura es ibérica → Ver modelos VAR».
    - «Ya has dado las 3 órdenes → Solo presupuesto o Cerrar semana».
  - Every toggle lists its requirements below it with ✓ and ✗, for example «Exprés: ✓ Hito 2 · ✗ 1 tren libre».
  - A disabled control with no visible reason counts as a bug.
- **Why:** clarity; the game teaches itself through its own refusals.
- **Fixes:**
  - Paco's apeadero silently takes the Norte's works slot (rescue.md E.1 #22).
  - `workRequirements` is decorative (E.1 #33).
  - The classic relation card says «compra uno que sí» but has no link to Trenespop.

#### 3 · Layers that switch on with the tool, plus a context legend · V4 C1
- **From:**
  - CS2: opening a build menu opens its info view. The base map greys out and a legend with checkboxes appears.
  - ACEO, Beta 4: a context panel that explains the current tool ("if you're unsure what you're looking at, check it").
  - TF2: one colour ramp per layer, with numbers in boxes when zoomed in.
  - Tropico: overlays mark full buildings with an icon.
- **In Tenfe:**
  - Each tool switches on its layer:
    - Obra › Electrificar switches on Catenaria, and Cambiar ancho switches on Ancho.
    - Servicio switches on Ocupación, where saturated corridors carry a crowded-train icon.
    - Hovering a model in Trenespop paints where it can run: green ✓, amber ◐ with a changer, grey ✗.
  - The base map fades while a layer is on.
  - The legend sits under the «Capas ▾» chip in the top-left corner of the map. It holds 3–5 swatches, one sentence on what the layer means and, while a tool is active, the tool's keys («Esc cancelar · Enter encargar»).
  - Obras stops being a layer: works are always shown as icons.
- **Why:** clarity at the moment of decision.
- **Fixes:** the 8 layer pills have no legend (`cur-02-ancho.png`).
- **Needs:** #20's section model. Without it, Catenaria, Ancho and Velocidad stay cosmetic, and today they are wrong in the Norte, Sur and Asturias corridors (rescue.md §0.7 and §F).

#### 4 · A maker's exclusive preview offer · V4 C1
- **From:** OpenTTD: "We have just designed a new X – would you be interested in a year's exclusive use of this vehicle, so we can see how it performs…?"
- **In Tenfe:**
  - The offer comes 1–2 times a year; the seed picks the maker and the week. For example: «Malstom: hemos diseñado el Avril 3. ¿Un año de uso exclusivo para ver cómo se porta?».
  - Answering is free; buying spends the normal purchase order.
  - Accepting gives −25 % on the price for at most 2 units. Their reliability starts at 62 % and rises 0,5 points a week to 88 %, on a visible curve with no dice.
  - In week 26 the Gaceta runs a piece with the model's real breakdown count.
  - Declining: everyone can buy the model at full price in 52 weeks. If Lowgo is active, it debuts the model on its corridor and gains 4 points of share for 26 weeks.
- **Why:** a gamble the player can read; ready-made satire for the parody makers; a different maker and model in each seed.

#### 5 · New game: seed, starting situation, president with one trait · V5 C2
- **From:**
  - Tropico 6: a map seed with a share code, and one leader trait out of 12. Tropico 5's Dynasty roster was dropped because players found it confusing, which gives the rule "one leader, one trait".
  - CS: each map card shows its resources and buildable area up front.
  - TF2: a seed box ("same seed and same settings, same map").
  - ACEO: a card for the chosen site, and difficulty from Easy (3 M$) to Extreme (0,5 M$).
  - RE2: 6 leaders, each with strengths and weaknesses.
- **In Tenfe:** one screen with four rows.
  - **Semilla:** a text box and an «Aleatoria» button. The share code appears again on the end screen.
  - **Situación inicial:** 4–6 cards, each with chips for deuda, edad media de la flota, % electrificado, % ancho estándar, apoyo and semanas hasta las elecciones (see §2.2).
  - **Presidente:** 1 of 8, each with one plus and one minus. For example:
    - «Tecnócrata»: obras −10 %, Trabajadores −8.
    - «Ex-alcaldesa»: Territorios +10, Economía −8.
    - «Inaugurador compulsivo»: +2 de apoyo por obra terminada, obras +10 %.
    - «Pide perdón»: rechazar peticiones cuesta la mitad.
    - «Comisionista»: +5 % en Andorra, sospecha +20 %.
    - «Ex-sindicalista»: huelgas −50 %, Ministerio −10.
  - **Dificultad:** a preset, or «Personalizar», which opens the sliders of §2.9.
  - A one-line preview of the seed, for example «Norte y Sur degradados · alcaldesa de Cáceres hostil · flota de 24 años».
  - The engine already keeps its random seed in the game state.
- **Why:** replayability for almost no new content; the trait changes how you play from week 1.

#### 6 · Alert triage: critical, inbox, on the map · V5 C2
- **From:**
  - ACEO's Alpha 36 rewrite, built on the idea that "the player's attention is a very scarce resource":
    - only critical alerts go in the fixed column, and the rest go to a review panel;
    - agent alerts become small red boxes in the world, showing the cause on hover;
    - the mute settings were removed.
  - TF2: a warning icon that "shines in red"; clicking a name in a warning jumps to the place.
  - RE2: the reason on hover, and the complaint that "a resolution isn't always obvious".
  - CS: an icon over the object, plus a row in its panel with the cause and the fix.
- **In Tenfe:** every alert reads object + cause + fix verb, for example «Sur · vía 41 % · −22 de puntualidad → Renovar 2,1 M€». Alerts go to three places:
  - **Critical**, pinned in the Misión column, at most 3, in priority order money → stage → deadline → justice:
    - a payment due in 2 weeks or less that the cash forecast can't cover;
    - an essential corridor below its stage target with 3 weeks or less left;
    - a decision or ultimatum due in 2 weeks or less;
    - a judicial phase of imputación or later.
  - **Everything else** goes to the «Avisos» inbox in the top bar, with a counter. Items are grouped by object, filtered by Red · Dinero · Gente · Justicia, and disappear by themselves once the cause is gone.
  - **On the map:** a small marker on the corridor or station shows the cause on hover and opens the card on click. It turns red after 4 unresolved weeks, but only if the engine then really applies something, such as a speed restriction.
  - There are no mute settings: an alert that annoys was not critical.
  - The engine's `obstacles` and `stopReasons` feed the system.
- **Why:** clarity; the alerts are the "what do I do next" list.
- **Fixes:** today the only weekly feedback is the toast «Semana N · ±X». Breakdowns, failed tests and stopped works only reach `report.events`, which the UI never shows (rescue.md E.2).

#### 7 · «Monitor de corredores» · V5 C2
- **From:**
  - ACEO's flight monitor, opened with G:
    - columns grouped by colour: white for identity, blue for schedule, yellow for passengers, red for ground services;
    - an alert counter with the causes on hover;
    - "one weak piece delays everything; the table tells you which".
  - The CS2 Transportation Overview: sortable columns Name · Length · Stops · Vehicles · Passengers · Usage %.
  - TF2's line statistics: hovering a row makes the line blink on the map, and a filter shows only what is in view.
  - OpenTTD's profit dot.
- **In Tenfe:** Red › Corredores (key M), with one row per corridor and per territory. The columns are grouped by colour:
  - **white:** profit dot · name · type · gauge and voltage chips;
  - **blue:** trains ×n · trains per day · occupancy %;
  - **yellow:** viajeros/sem · sin plaza · puntualidad %;
  - **red:** vía % · trains in the workshop · works;
  - then «Neto 13 sem (anterior)», the rival's share and the alert counter.

  The profit dot is grey for the first 4 weeks, red if the 13-week balance is below 0, amber below +5 k€ a week, and green otherwise.

  Any column sorts. Hovering a row makes its corridor pulse on the map. Clicking a row opens its card without closing the table, and a filter shows «solo lo visible en el mapa».

  Flota › Mis trenes uses the same table pattern, with estado, edad, corredor, fiabilidad and the profit dot.
- **Why:** one glance answers what is losing money and what is running late. It replaces the Flota list and half of today's Finanzas and Obras pages.

#### 8 · Named modifiers, weekly challenge, «Modo maqueta» · V5 C2
- **From:**
  - Mini Motorways: about 47 named rule tweaks; the daily and weekly challenges give everyone the same seed and modifiers.
  - CS1's built-in mods: Unlimited Money, Unlock All, and Hard Mode (+25 % construction, +25 % upkeep, lower demand). Using any of them turns achievements off.
  - ACEO: sandbox rules as per-game checkboxes. The community asked for a «select all» button, and achievements stay off for good in that game.
- **In Tenfe:**
  - At setup the player draws or picks 0–3 modifiers. Each is one `if` in the engine with a score effect (list in §2.10).
  - «Reto semanal» derives the seed, the president and 2 modifiers from the ISO week number, so every player gets the same game without a server. The end screen shows the score and a code to compare.
  - «Modo maqueta» has checkboxes plus «Seleccionar todo»: caja ilimitada · sin elecciones · sin imprevistos · todo desbloqueado · todos los territorios · sin cloacas · sin rivales.
  - Ticking any box shows a «Medallas desactivadas» banner at the start and on every load.
- **Why:** each modifier gives variety for a few lines of code, and players set their own challenge.

#### 9 · A tutorial that checks itself against the game state · V5 C2
- **From:**
  - ACEO:
    - a checklist mode that ticks itself from the game state ("if a point doesn't tick, you're missing something");
    - a button to skip a step;
    - criticised as passive, with hidden switches.
  - CS2:
    - later tasks stay grey until the previous one is done;
    - a pulsing outline marks the exact button;
    - each panel shows a one-card intro the first time it opens;
    - new things carry a green dot;
    - reading only the bold text gives the short answer.
  - TF2: a highlight on first use, and F1 for context help.
- **In Tenfe:**
  - During stages 1 and 2 the Misión panel has a «Lista» view with 6 checks. The engine evaluates them after every action and every week. Examples: «Encarga una obra en el Norte», «Pon un tren más en el Norte», «Cambia un precio», «Firma un pacto», «Cierra la semana».
  - Each unticked check has a «¿Por qué no se marca?» link and a «Saltar» link.
    - «¿Por qué no se marca?» prints the exact failing condition with its fix: «Te faltan 0,6 M€ → Ver Dinero», «No hay cuadrillas libres → Contratar».
    - «Saltar» skips the step.
  - The coach outlines the real control and never puts a bubble inside a modal.
  - The first time each drawer section opens, it shows one card whose first sentence is bold.
  - New tabs and controls carry a green dot.
  - There are three phases: Rescate (stage 1), Red regional (stage 2) and Alta velocidad (stage 3).
- **Why:** onboarding that can't fall out of step with the game.
- **Fixes:**
  - The tutorial says «ese que parpadea en rojo» while the whole map pulses (E.1 #29).
  - The tutorial bubble sits inside the modal (E.3).

#### 10 · Gaceta and «Trenter»: facts only, silence when all is well · V5 C2
- **From:**
  - CS2's Chirper: "chirps relate to actual events, and the likes show how important the subject is". GameStar's verdict: Chirper is noise, while the radio only talks about real problems and plays music otherwise.
  - CS1: chirps that carry a hint ("having more local retailers would help").
  - OpenTTD: 16 news types, each set to Full, Summary or Off, with short punchy headlines.
  - Tropico: Canal Uno comments on your actions, and players issued an edict to kill the DJ, Juanito, so they could silence him.
- **In Tenfe:**
  - Every headline and post is built from an engine event and keeps a link to it. Hovering shows «Fuente: Norte 61 % en la semana 34»; clicking centres the map or opens the panel.
  - The «likes» on a post are the number of people affected, in thousands of viajeros or votantes.
  - Jokes carry the hint: «#SinCatenaria en Extremadura, ¿para cuándo los 3 kV?».
  - At most 3 items a week. A week where nothing crosses a threshold publishes nothing, or at most one flavour line every 4 weeks.
  - Seven categories, each set to Portada, Teletipo or Off: Tus trenes, Obras, Política, Rivales, Economía, Fabricantes and Ayuntamientos. Routine items default to Teletipo.
  - «Silenciar al tertuliano» mutes the voiced chatter. It is a joke and an accessibility switch in one.
  - The jefe de gabinete adds a one-line quip to cards, with 2–3 voiced variants.
- **Why:** satire that doubles as diagnosis; the coherence rule turned into a feature.

#### 11 · «Notas de Tenfe»: the four groups in two levels and three parts · V5 C2
- **From:**
  - ACEO:
    - 4 main ratings, each made of sub-ratings;
    - the current rating moves the average, and the average decides traffic, partner class and the licence;
    - a bad safety average can cost you the licence.
  - Tropico 6: support = faction standing + your happiness minus a rising Caribbean benchmark + personal trust, which fraud and cancelled elections damage.
- **In Tenfe:** no new parallel rating. The game re-presents what already exists.
  - **Two levels.** Each group (Viajeros, Territorios, Trabajadores, Economía) shows «semana 58 · media 54». The 26-week average already decides the vote.
  - **Three parts on hover:**
    - **Gestión:** the causes from today's formula.
    - **vs media europea:** the Viajeros and Economía formulas use a constant 65. Replace it with a benchmark that rises from 65 in week 1 to 79 in week 416, drawn as a line.
    - **Confianza:** one track shared by all groups. Aplazar elecciones −20; pucherazo −10; promesa rota −10; escándalo probado −10; campaña de imagen +10. It drifts back 1 point every 10 weeks.
  - **Seguridad AESF** is a fifth meter outside the vote. It is fed by track below 45 %, incidents, skipped tests and trains below 45 % condition. A weekly average below 40 for 4 weeks opens an expediente, which counts as one «leve».
  - **Category.** The vote forecast gives Tenfe a category of 1 to 5 ★: below 40 is 1 ★, 40–49 is 2, 50–59 is 3, 60–69 is 4, and 70 or more is 5.
    - Pacts, maker offers and credit only reach you up to your ★ + 1.
    - 5 ★ partners pay 30 % more but demand punctuality of 90 or more and double their penalties.
    - 1–2 ★ partners are cheap and tolerant, so the low tier stays a real option. ACEO's players complained that the high tier always won.
  - ★ becomes this reputation tier. The spendable currency moves to ◆ (#12).
- **Why:** support stops feeling random, and the rising benchmark keeps pressure on in the late game without random events.

#### 12 · Named milestones that pay ◆; ◆ only for lasting results; trees in any order · V5 C2
- **From:**
  - CS2:
    - 20 named milestones, with exponential XP requirements;
    - a reward popup with chips («₡1,900,000 / +8 DP / +10 permits») and a button that opens the progression panel;
    - development points are spent in per-service trees, in any order ("no two games are ever quite the same");
    - the most-upvoted negative review (6,324 votes) reached milestone 20 with 50 inhabitants by repeatedly building and bulldozing one building.
  - CS1: the milestone button fills clockwise.
- **In Tenfe:**
  - **12 hitos.** They are still measured by the 4-week average of viajeros a la semana: 30, 34, 38, 43, 49, 55, 62, 70, 79, 89, 100 and 113 thousand. They are named from «Operador Quebrado» and «Intervenido» to «Campeón Ferroviario».
  - **Badge.** At the bottom left: the hito's name, a filling ring and the number of unspent ◆.
  - **Reward card.** Reaching a hito shows chips (Transferencia del Tesoro +0,3–2 M€ · +◆ · tope de crédito +X), the exact list of what it unlocks, generated from data, and two buttons, «Ir a Progreso» and «Cerrar».
  - **Where ◆ comes from.** ◆ are development points and take over the spendable role of ★. They come only from:
    - hitos: 1 for the first, rising to 6 for the last;
    - stages: +3 each;
    - lasting results: +1 for a work still in service 8 weeks after it opens, taken back if it is cancelled; +1 for a fulfilled pact.
    - Viral videos, funds and inaugurations alone pay nothing.
  - **Trees** in Progreso › Desarrollo, bought in any order inside each branch:
    - **Vía y energía:** ultrasonidos → electrificar a 3 kV → 25 kV → cambiadores → ancho estándar → alta velocidad.
    - **Flota:** contrato de mantenimiento → segunda mano → bimodo → BCBB and Dörfler as suppliers.
    - **Servicio:** cadenciados → regulación → ERTMS.
    - **Comercial:** abono → tarifa dinámica → app.
    - «Fontanería» moves to the Conseguidor (#25).
  - **Scarcity.** The trees cost about 60 ◆ and a good run earns about 45, so the order you buy in becomes your run's identity.
- **Why:** progression with real choice, and no way to farm it.
- **Fixes:**
  - Hito m1 silently opens three corridors (rescue.md B.9).
  - Hito m5 promises a plaque that doesn't exist (E.1 #27).
  - «Inauguraciones» pays +3 ★ for every work (B.9).

#### 13 · «Planos»: draw works, compare them, then order one · V5 C2
- **From:**
  - ACEO, Beta 3: a planning mode where any object can be drawn as a blueprint and built later.
  - TF2's upgrade tools: sections that still lack the upgrade are red and the rest blue.
  - OpenTTD: "press Shift to show cost estimate only".
- **In Tenfe:**
  - In the Obra planner, the target corridor's sections are painted on the map: rojo needs the work, azul already has it. Each section shows its km, € and weeks, taken from `workQuote`.
  - «Añadir al plano» is free and leaves a dashed ghost on the map.
  - The plans tray sums cost, weeks, crews and payments, and shows before → after for punctuality, velocidad útil, compatible trains and viajeros. It compares up to 3 plans side by side.
  - «Encargar» turns one plan into a real work and spends 1 order.
  - Plans re-quote themselves when prices change.
  - Every purchase and works button gets «Solo presupuesto», with Shift-click or long-press.
- **Why:** planning is the heart of a rail game, and "looking is free" becomes visible on the map.
- **Fixes:** the tutorial says the problem is «la vía entre Ávila y Medina», but Renovar treats the whole corridor (E.1 #28).
- **Needs:** #20, for per-section data.

#### 14 · Incidents with a deadline, a grade and a report that matches the ledger · V5 C2
- **From:**
  - ACEO:
    - active emergencies that you accept or reject, with 30 minutes to assign a stand;
    - a grade from A to F and a report by mail;
    - passive crises, such as a 2–5-day fuel crisis, that you survive with savings, higher fees or stockpiles;
    - no emergencies before the commercial licence, and their frequency set by difficulty;
    - the criticism: a «grade A, no fine» report arrived next to a 1,364,509 $ fine.
  - Tropico 6: disasters announced just before they hit, some with a decision, and relief money afterwards.
- **In Tenfe:**
  - **Active incidents** only come from a cause on the map:
    - a minor derailment on a corridor with track below 45 %;
    - fallen catenary on old catenary during a heat wave;
    - copper theft on 3 kV sections without the vigilance Medida.
  - **Choice:** «Aceptar: 1 cuadrilla 2 semanas + 1 orden» or «Rechazar: multa de 0,4 M€ y Seguridad −8».
  - **Report.** When the incident closes, the Gaceta publishes a grade from A (on time, no repeat) to F (rejected), what was done and the fine. The fine is the exact ledger line, with a link to Dinero › Semana.
  - **Passive crises** are announced 1–2 weeks ahead with 2–3 ways out:
    - crisis eléctrica, lasting 2–5 weeks: energy +40 % unless the fixed-price Medida is on. Choose to pay it, raise fares 10 % or cut frequencies 15 %;
    - huelga;
    - ola de calor: limit speed to 160 km/h, or risk the catenary.
  - **Timing.** None in stage 1 except scripted ones. The Imprevistos slider sets the frequency. Emergency funds afterwards scale with your relation with the Ministerio.
- **Why:** decisions instead of dice.
- **Fixes:**
  - Today an event is rolled with 20 % chance each week, and about 3,5 breakdowns a year happen whatever the state of the fleet (E.2).
  - The desprendimiento cuts a random corridor after you have already decided (E.1 #17).

#### 15 · «Consejo de Ministros»: choose 1 of 2 cards every 4 weeks · V5 C2
- **From:**
  - Mini Metro: every week you get 1 locomotive plus your choice of 2 options (a line, a carriage, tunnels or an interchange). Each map bends the odds; Osaka offers 2 locomotives or 1 Shinkansen.
  - Mini Motorways: the same choice every Sunday. Its "Mini Mysteries" modifier hides the options.
- **In Tenfe:**
  - Every 4 weeks, two cards side by side. Each card has exactly one effect line, which the engine applies, and only refers to things that exist in this game. For example:
    - «Licitación exprés: −30 % en tu próxima obra de catenaria»;
    - «Préstamo de 2 trenes de Dörfler, 8 semanas»;
    - «Rueda de prensa: Viajeros +5»;
    - «Cuadrilla de Adif: +1 cuadrilla, 13 semanas»;
    - «Partida europea: obras de ancho estándar −20 %».
  - Skipping gives +0,1 M€. The choice costs no order.
  - The deck depends on:
    - the state: a corridor below 70 % adds crew cards;
    - the seed, the president and the modifiers: «Ministro tacaño» removes the money cards, and «Misterio de Moncloa» deals the cards face down.
- **Why:** the genre's best short reward loop, a small and regular choice that always matters.

#### 16 · «Mitin»: a speech builder whose promises become tasks · V5 C2
- **From:** Tropico 6.
  - The speech has slots: acknowledge a problem, praise a faction, blame a superpower, make a promise.
  - A promise becomes a task for the next term.
  - In Tropico 3 and 4, rigging was offered only when you were losing.
  - Complaints: one recorded line per option, and promises with unreachable thresholds.
- **In Tenfe:**
  - In weeks 200–207 and 408–415, a decision with 4 slots. Each option shows its exact effect before you pick it.
    - **Reconocer** puntualidad, averías, precios or cierres: removes that negative cause from the affected group's target until the vote.
    - **Elogiar:** +6 with one group for 26 weeks.
    - **Culpar** a la Adif de la parodia, a Bruselas, al tiempo or al gobierno anterior: +3 with one group and −15 with whoever you blamed, who remembers it.
    - **Prometer:** only promises the engine can check, shown as target against today, for example «Norte ≥85 % antes de la semana 312 · hoy 78 %». A promise becomes a task in Peticiones; breaking it costs 10 points of Confianza.
  - The speech text is assembled from the chosen slots, with 3–4 voiced variants per slot.
  - «Pucherazo» appears only if the forecast is below 50. It adds 4 points to the count, costs 10 points of Confianza, creates a new cloaca secret and adds 15 sospecha.
  - These promises replace the 6-item «Programa», whose items tick once and can never untick (rescue.md B.13). A Mitin promise can be broken.
- **Why:** the election becomes a decision, and the promises tie politics to the network.

#### 17 · «Comité de dirección»: directors unlock tools · V4 C2
- **From:**
  - ACEO:
    - the CFO unlocks the Fees tab, the CIO data and graphs, and the COO and CIO together the automatic planner;
    - in the 2016 design, dashboard widgets read «Sin conexión…» until you built or hired what they needed;
    - criticism: the board is hired once and never becomes a choice again.
  - Tropico 6's Ministry: candidates from different factions with different bonuses. A minister gives +2 with their faction, firing one costs money, and the Broker's crony pays your Swiss account.
  - CS2: panel tabs unlock by milestone.
- **In Tenfe:**
  - Five posts, each with 2–3 seeded candidates from different groups and with distinct effects:
    - **Finanzas:** per-corridor fares in Dinero › Tarifas, and a 26-week forecast.
    - **Operaciones:** automatic train assignment and automatic overhauls.
    - **Datos:** 52-week history graphs.
    - **Institucional:** renegotiation (#19) and the external powers.
    - **Personas:** the labour Medidas and the paga extra.
  - Salaries run from 0,02 to 0,05 M€ a week. Hiring gives +2 with the candidate's group; firing costs 4 weeks of salary and −3 with that group.
  - One «enchufado del Conseguidor» per post pays into the caja B and raises sospecha.
  - An empty post keeps its tab visible, showing «Sin dirección financiera · Nombrar».
  - Information you need to avoid losing is never locked: the cash forecast, the alerts and the monitor are always free.
- **Why:** the interface grows as you learn it, and each seed adds another choice.

#### 18 · A seeded calendar of future events · V4 C2
- **From:**
  - Tropico 4, Modern Times: timeline events generated at random for each game but visible up to 10 years ahead.
  - OpenTTD: events tied to periods, and recessions 2–3 times a century, lasting 9–12 months.
- **In Tenfe:**
  - Progreso › Calendario shows the next 52 weeks in detail and 104 weeks by title. Hovering the week chip shows the next 3 items.
  - Entries:
    - known dates: elecciones, pagos (from `upcoming`), vencimientos de pactos, ventanas de renegociación, Consejo de Ministros;
    - seeded events, each with a precondition:
      - «Huelga convocada · semana 41»: if Trabajadores rise above 45 before then, it is called off with a Gaceta line;
      - «Bruselas revisa el ERTMS · semana 140»;
      - «Lowgo entra en el Levante · semana 196»;
      - «Ola de calor prevista · julio»;
      - «Recesión · semana ~150 ± 2»: 0–2 per game, lasting 26–52 weeks, ridership ×0,85;
      - market events in the Gaceta, such as energy +20 % for 13 weeks or steel prices raising KAFKA and Tardo orders 10 %.
- **Why:** planning instead of surprise, and it differs per seed. It replaces much of today's weekly 20 % roll with causes the player can read.

#### 19 · Renegotiation with a visible chance and a counteroffer · V4 C2
- **From:** ACEO, Alpha 36:
  - a renegotiation window per contract, signalled by the card turning orange;
  - a «Negociar» button with price sliders and negotiation points, a success chance and an automatic negotiator;
  - players won by reloading, and asked for a counteroffer limited to 2 rounds, and for any cut in the partner's favour to be accepted always.
- **In Tenfe:**
  - Every pact or contract opens a window every 26 weeks, shown as an orange card plus a notice from the director.
  - The window has one or two sliders (subvención, plazo, precio por tren) and shows the success % live.
  - The % uses today's formula, `chance + (apoyo del grupo − 45)/200`, plus the relationship and the category ★.
  - The roll is drawn when the window opens and stored in the game state, so reloading changes nothing.
  - If you are refused, that same character counteroffers halfway, in their own voice. At most 2 rounds; then the window closes for 26 weeks and the relation drops 5.
  - A concession in the partner's favour is always accepted.
  - «Que negocie Finanzas» picks the offer with the best expected result.
- **Why:** a small minigame of skill and risk that the player can read.
- **Fixes:** «Sin rebaja» is always voiced by Íñigo and «Trato hecho» by Charo, whoever you negotiate with (E.1 #11).

#### 20 · Trenespop opened from a corridor, and «¿Puede pasar?» · V5 C3
- **From:**
  - OpenTTD:
    - the purchase window opened from a depot lists only engines that have power on that rail type, and its caption says so;
    - each engine prints a «Rail types:» line;
    - the sort options include power vs running cost.
  - TF2: a train's top speed is its slowest car's; sections without an upgrade are red; the warning reads "No electric path found".
  - NIMBY Rails: compatibility as tags.
  - ACEO's route analysis: the path in green or, in red, the closest failed attempt, with a report.
- **In Tenfe**, engine first:
  - **Tags.** Each section carries {ancho: ib | std | mixto; tensión: 3 kV | 25 kV | none; vmax}. Each model carries the gauges and traction systems it accepts, {IB, UIC, VAR} × {3 kV, 25 kV, diésel, bimodo}, plus its vmax.
  - **Rule.** A train may enter a section if every tag group matches. A changer node lets VAR trains through.
  - **Chips.** The UI reads the same tags as chips, so the text and the engine can't disagree.
  - **Trenespop from a corridor** titles itself «Trenes para Extremadura · IB · sin catenaria 214 km · vmax 200» and groups its rows:
    - ✓ Puede circular: travel time and the section that limits speed;
    - ◐ Con cambiador: +12 min;
    - ✗ No puede: the first blocking reason and «Ver obra · coste · semanas». A toggle hides these rows.
  - **Route strip.** The corridor card gets a route strip coloured for the selected train.
  - **«¿Puede pasar?»** is a tool in Red. Pick a model and two stations; the map paints the path green, or red up to the first incompatible section, with the reason and the works that would fix it.
  - **Velocidad útil** is min(tren, tramo): «160 km/h, limita Navalmoral–Monfragüe».
- **Why:** the real network made readable. In TF2 and OpenTTD the most common electric-train complaint is an invisible gap.
- **Fixes:**
  - In the rescue engine, ancho, tensión and velocidad are cosmetic; the engine only knows a boolean `elec` per corridor.
  - The classic Trenespop has no per-route compatibility at all.

#### 21 · «Peticiones»: one request system · V5 C3
- **From:**
  - ACEO:
    - a framework contract signed once, after which the airline offers flights according to its satisfaction;
    - a 1-hour tolerance, cancellations that hurt, and termination below a threshold;
    - a slider that sets the mix of offers.
  - Tropico 6:
    - **demand:** one per faction at a time, no deadline, about +5;
    - **dual demand:** two rivals ask at once, and refusing both angers both;
    - **ultimatum:** triggered by low standing, with a countdown and a unique one-year punishment;
    - **Audience edict:** pulls demands from the 3 lowest factions;
    - complaints: requests for things you already own, and punishments not scaled to the angry group's size.
  - OpenTTD: a mayor rating ladder with priced actions.
- **In Tenfe:** one inbox, Política › Peticiones. The Misión column shows only ultimatums. Every request uses the same card: who, what, deadline, reward, «si fallas» and an «Ir» button. Two kinds of requester:
  - **Territories** sign a convenio once.
    - After that they send 0–2 requests every 4 weeks: refuerzo, servicio de verano, parada nueva.
    - Satisfaction runs from 0 to 100. It rises each week the agreed punctuality holds and falls with each cancellation.
    - Below 20 for 6 weeks, the convenio ends: the train stops and Territorios takes −8.
    - Mayors keep OpenTTD's ladder: −1000 to 1000, with 8 labels.
  - **Groups:**
    - one open demand per group, with no deadline, worth +5;
    - a dual demand when two opposed groups ask at once, played as a two-voice scene;
    - an ultimatum after 4 weeks below 25: a 13-week countdown, then a 52-week punishment scaled by the group's weight:
      - Trabajadores: a strike of 2–6 weeks;
      - Economía: costs ×1,15;
      - Territorios: OSP −1 per quarter;
      - Viajeros: a plataforma de afectados, demand −8 %.
  - The Ministerio can send dated encargos with a speed bonus (as in RE2).
  - On completion the player picks the reward: money, standing or a ◆.
  - «Audiencia pública»: 1 order and 0,2 M€, with a 52-week cooldown. It pulls one demand from each of the 3 lowest groups.
  - Requests never ask for something that already exists; they are checked against the game state. At most 1 is open per requester.
- **Why:** a steady stream of concrete goals tied to the map.
- **Fixes:** pact offers are drawn by a 9 % weekly dice roll (E.2).

#### 22 · «Medidas»: policy cards in limited slots that ramp up · V5 C3
- **From:**
  - Tropico 6 edicts: 0, 1 or 2 stars that improve while active; one-off, monthly or per-head costs; cooldowns; faction effects printed on the card; Penultimo's quip.
  - CS policies: a toggle, sometimes with a slider, printing the effect and the drawback per unit. CS2 shipped only 7 district policies and 5 city ones, and players found that too few.
  - ACEO programs: 3 groups of 4, only 2 active per group, and an efficacy that grows while the program stays active.
- **In Tenfe:** Política › Medidas, about 18 cards in 3 groups (Gestión, Servicio, Política), with 2 active slots per group.
  - Each card prints its effect, drawback, weekly cost, group chips (+/−) and the advisor's quip.
  - The effect ramps from 25 % to 100 % over 8 weeks, shown as 4 pips. Switching a card resets its ramp, and a removed card waits 4 weeks before it can return.
  - Cards unlock by hito or through the tree.
  - Examples:
    - «Abono gratuito en regionales»: demand +25 % on regional corridors, fare 0, Viajeros +6, Economía −8.
    - «Devolución por retraso»: 0,02 M€ for each point below 90, per corridor and week; Viajeros +5.
    - «Tarifa dinámica»: a slider from 0 to 40 %.
    - «Servicios mínimos del 90 %»: strike revenue ×0,8 instead of ×0,4; Trabajadores −6.
    - «Paga extra»: one month of payroll every 13 weeks; Trabajadores +10.
    - «Externalizar mantenimiento a Malstom»: missing workshop capacity covered at +30 %.
    - «Contrato de energía a precio fijo»: energy +8 %, immune to energy crises.
    - «Portal de transparencia»: closes the Conseguidor; Confianza +10.
- **Why:** play-style identity and real trade-offs.
- **Fixes:**
  - The Comercial and Comunicación tech flags are absorbed into these cards.
  - The strike option «+2 % de nómina» costs nothing (E.1 #1).

#### 23 · One drawer from the left, at most 50 % wide, two levels deep · V5 C3
- **From:**
  - ACEO:
    - the management panel slides in from the left and takes at most 50 % of the screen, "so you feel you are still inside the game";
    - at most two levels of tabs, one panel at a time, mouse travel kept short;
    - the old half-screen panel with three levels of tabs was "impossible to navigate";
    - Tab reopens the last tab.
  - CS2: one panel template for all panels (navigation · content · explanation).
  - TF2: players complain that windows cover the map.
- **In Tenfe:**
  - The 11 rail pages become 6 drawer sections with at most 5 tabs each (§3.4). They open from the labelled bottom bar or with keys 1–6. Tab reopens the last one; Esc closes.
  - The map stays visible and clickable on the right. Clicking a corridor opens its card without closing the drawer.
  - Only Trenespop may widen to 70 %. On phones the drawer is full-screen with a back arrow.
  - Inside, a list next to a detail view, with one «¿qué significa?» line under the title. Never a third container nested inside.
- **Why:** players always know where things are, and the map is never lost.

#### 24 · Stages with visible exit conditions and a final path you choose · V5 C3
- **From:**
  - Tropico 6:
    - the Colonial era has a mandate timer that Crown tasks extend;
    - independence needs 60 % Revolutionaries, then you pay or fight;
    - from the Cold War to Modern Times you go by 1 of 3 paths;
    - an «Era Outline» button explains the current era;
    - complaint: the order of goals in the first era is confusing.
  - RE2 and TF2: tasks with dates, and 3 bonus tasks that award medals.
- **In Tenfe:**
  - Progreso › Etapa, and the top of Misión, always show:
    - what this stage adds;
    - the exit conditions as bars, which are exactly the engine's checks: nothing shown that doesn't count, and nothing counted that isn't shown;
    - the time left.
  - **Stage 1:** Hacienda's «mandato» of 13 weeks, +4 weeks for each Hacienda task done (at most 2).
  - **Stage 2** ends with a choice:
    - «Devolver el rescate»: 4 M€, Economía +6;
    - «Plantarse»: Hacienda relation −30, OSP −20 % for 52 weeks, Trabajadores +6.
  - **Stage 5** opens in week 313 with a choice of 1 of 3 paths, each with 3 conditions and its own ending:
    - Corredor Mediterráneo completo;
    - Tren verde: 90 % or more of the km electrified, and no pure-diesel trains;
    - Salida a bolsa: a result of 0,3 M€ a week or more for 52 weeks, and debt under a cap.
- **Why:** clear goals, and 2 × 3 = 6 arcs per run.
- **Fixes:**
  - Stage 2's cash condition is only checked in week 52 (E.1 #23).
  - Stage 3 shows Encuestas and Programa, which don't count (E.1 #24).
  - Stage 4 has a hidden rule: a closed Mediterráneo counts as 100 % Lowgo (E.1 #25).

#### 25 · «El Conseguidor»: corruption as an offer board with a visible risk · V5 C3
- **From:**
  - Tropico 6's Broker:
    - offer slots, with refresh at S$2,500 and lock at S$500;
    - «Convincing Talk» completes a demand, «Stage a Distraction» neutralises an ultimatum, «Image Campaign» costs S$7,500;
    - the Swiss balance counts in the final score even if you are deposed;
    - the Lobbyistico DLC adds a corruption meter.
  - OpenTTD's bribe: +200 rating, up to 800. There is a 1 in 14 chance "a regional investigator" discovers it: the rating falls to −50, station ratings drop to 0, and you are banned for 6 months.
- **In Tenfe:**
  - The caja B becomes the «Cuenta en Andorra» (A€), which scores at the end even if you lose.
  - Política › Conseguidor stays padlocked until Hito 2 and shows a red dot when offers are waiting.
  - **Slots:** 3, plus 1 every 52 weeks, up to 5. Refresh costs 0,25 A€; locking a slot costs 0,05 A€.
  - **Offers:**
    - «Llamada al ministro»: completes a group demand.
    - «Cortina de humo»: cancels an ultimatum or a leak.
    - «Campaña de imagen»: Confianza +10.
    - «Lobby inverso»: +6 with one group.
    - «Campaña contra el vecino»: the European benchmark −3 for 26 weeks.
    - «Sobre al alcalde»: +200 rating, up to 800. 1 in 14 «la UCO lo descubre»: the rating falls to −50, the convenio freezes for 26 weeks, and a scandal opens.
    - Today's 7 bribes, rewritten as offers.
  - Each card prints the sospecha and pruebas it adds. The meter is always visible here, and also in Misión from 35.
  - Rejecting the Conseguidor's own requests is free.
  - The «Fontanería» tech branch moves here.
- **Why:** the satire's core fantasy, kept readable, and avoidable through the «Portal de transparencia» Medida.
- **Fixes:** extortions cite secrets you never created (E.1 #5 and #6). Every offer and extortion must name a secret that exists in the game state.

### 1.4 Build order
1. **The section model** in the engine: tags on sections and trains, which is half of #20. It unblocks #3, #13 and #20 and makes the layers truthful.
2. **#1 and #2.** Apply them as each screen is rebuilt.
3. **#23, #6 and #7 together.** They form the skeleton of the new navigation.
4. **#11 and #12 together.** ★ becomes the reputation tier and ◆ the currency, which needs a save migration (constraints.md §4).
5. **#24, #21 and #18.** They replace the dice with goals and causes.
6. **Everything else**, by rank.

### 1.5 The other ideas and where they went

| Idea (source) | Where it went |
|---|---|
| Partners with stars gated by your rating (ACEO) | inside #11 (the category ★) |
| «¿Puede pasar?» route analysis (ACEO), speed bottleneck (TF2), compatibility tags (NIMBY Rails) | inside #20 |
| Profit dot (OpenTTD), sortable line table (CS2, TF2) | inside #7 |
| Gap preview in red and blue (TF2), cost estimate only (OpenTTD) | inside #13 |
| Services that list their requirements, impossible actions refused with a reason (ACEO), padlocks (CS2) | inside #2 |
| Audience, tiered quests and reward choice (Tropico), request-mix slider (ACEO), mayor ladder (OpenTTD), dated tasks (RE2) | inside #21 |
| Programs (ACEO), policies (CS), edicts (Tropico), welfare bonus (RE2), service import (CS2), electricity contract by class (ACEO) | inside #22 |
| Directors (ACEO), cabinet (Tropico), tabs that unlock (CS2) | inside #17 |
| Market events (Tropico), events tied to periods (OpenTTD) | inside #18 |
| Rigging or cancelling the vote (Tropico) | inside #16 and the Confianza track (#11) |
| Benchmark sabotage (Tropico) | a Conseguidor offer (#25) |
| Approval in three parts (Tropico) | inside #11 |
| Advisor quip, newspaper categories (Tropico, OpenTTD) | inside #10 |
| Coverage icons on overlays (Tropico) | inside #3 (Ocupación layer) |
| A single adjustable credit line whose cap rises (CS2), three banks (ACEO) | Dinero › Crédito: one slider, with a cap raised by hito and by category ★ |
| Budget sliders that preview their effect (CS2) | Dinero › Presupuestos: 50–150 % with live before → after |
| Per-line panel with sliders (CS2), frequency as one number (NIMBY Rails) | the corridor card in Servicio mode (wireframe C) |
| Fixed screen zones (CS, TF2), labelled action bar (Tropico), the Almanac as the "why" screen (Tropico) | §3; the Almanac's "worst indicator first" becomes the «Siguiente» line and the «Peor causa» rows |
| Honest demand bars (CS) | the «Siguiente» line does that job on the HUD; Red › Corredores opens with three bars: Viajeros sin servicio · Trenes ociosos · Presión política |
| Help in three layers (TF2) | #9 plus the keyboard rules in §3.8 |
| Operator of the Year award (ACEO), subsidy race (OpenTTD), patent auctions (SMR) | §2.5, rivals |
| Leader traits (RE2, Tropico) | inside #5 |
| Scenarios (CS1, Tropico), medals (CS), signature buildings (CS2), HQ and title ladder (TF2, OpenTTD) | §2.7 and §2.11 |
| Districts with a specialisation (CS) | §2.6 |
| Expansion permits and rising upkeep (CS2) | §2.6, the «Canon por concesión» |
| External powers with an escalation ladder (Tropico) | Política › Pactos lists them as people with a relation; the escalation ladder comes later (C3) |
| Constitution (Tropico) | reduced for v1 to the «Portal de transparencia» Medida; a full «Estatuto» comes later |
| Faction axes unlocked by stage (Tropico) | open question 3 (§5) |
| Follow one traveller (CS2), franchises with a weekly target (ACEO) | later (V3, C3) |
| Two-colour progression tokens (Rail Route) | rejected: they duplicate ◆ |

---

## 2. The replayability toolkit

Our map is real Spain and stays fixed. Each run therefore has to differ in four things, all of them visible to the player:
1. where you start;
2. who you deal with;
3. what happens, and when;
4. what you choose to become.

### 2.1 What the seed decides

| Area | What the seed draws | Range | When the player sees it |
|---|---|---|---|
| Network | which 3–5 of the corridors start degraded | track at 35–60 % | at the start: seed preview and map |
| Fleet | age and mix | average 18–31 years; ±20 % units per family | at the start |
| People | 2 hostile and 2 friendly mayors; each character's 2 agendas (which pacts they bring and their triggers); 3 Comité candidates per post | ladder at 250 / 700 out of ±1000 | as you meet them |
| Calendar | strike call, ERTMS review, Lowgo's entry week (180–240) and target (Levante, Sur or Mediterráneo), 0–2 recessions, heat-wave strength each summer, maker previews | — | 52 weeks ahead in detail, 104 by title |
| Decks | Consejo de Ministros weights, incident order | — | when drawn |
| Retos | 3 bonus goals from a pool of 20 | — | at the start, as dark medals |
| Media europea | starting value and slope | 63–67; +1,5 to +2,2 a year | always (the line on Apoyo) |
| Regions | one specialisation per comunidad: Turismo, Negocio, Cercanías or Alta velocidad | — | at the start (Red › Territorios) |

The share code (for example «TNF-7K2Q-RX41») packs the seed plus the setup: situation, president, difficulty and modifiers.

### 2.2 Starting situations
These values are indicative; tune them in the balance pass.

| Situación | Caja | Deuda | Fleet age | Apoyo | First vote | Twist |
|---|---|---|---|---|---|---|
| Rescate 2027 (default, with the tutorial) | 12 M€ | today's | 24 | 35 % | week 208 | — |
| Crisis de deuda | 6 M€ | ×1,4 | 26 | 30 % | 208 | interest +1 point; Economía starts at 30 |
| Fondos europeos | 12 M€ | today's | 22 | 40 % | 208 | subsidies ×1,5 for 104 weeks if 2 corridors reach ancho estándar |
| Año preelectoral | 10 M€ | today's | 24 | 45 % | 52, then every 208 | Mitin in weeks 44–51 |
| Huelga general | 12 M€ | today's | 24 | 33 % | 208 | Trabajadores starts at 25; strike called for week 6 |
| Herencia envenenada | 9 M€ | ×1,2 | 28 | 38 % | 208 | 2 megaproyectos half built with payments due; Lowgo already in the Levante |

### 2.3 Factions and characters
- **The groups.** The four groups are fixed. The seed shifts their weights by ±0,03, keeping the total at 1, and the situation sets their starting standings.
- **Character agendas.** Each recurring character carries 2 of 4 possible agendas: Paco either the apeadero or the convenio de verano, Fermín either the convenio or the paga extra. A pact appears when its trigger is true, with no 9 % dice roll.
- **The minister after week 208.** The seed draws the successor's trait: tacaño, generoso or tecnócrata. That trait changes the Consejo deck and the OSP's tolerance.
- **The classic recordings** (412 takes, 315 encounters) are picked by a topic that exists in the game state and by the speaker's mood, which comes from their group's standing (classic.md §9). The same week reads differently in each run.

### 2.4 Events with a cause
Every event has a cause the player can read in the game state, a date or a hazard that grows with that cause, and a text that names the cause.

| Event | Only when | How often | What the player can do | What the text names |
|---|---|---|---|---|
| Serious breakdown | per corridor; hazard = (100 − average fleet condition) / 400 a week | grows with fleet wear | overhaul; maintenance contract | the unit and its age |
| Landslide | in winter, on corridors with track below 50 % | seasonal | renew | the section |
| Heat wave | July and August; strength from the seed | 1 per summer | limit to 160 km/h (Medida) | catenary older than 30 years |
| Strike | Trabajadores below 38 for 4 weeks → called 6 weeks ahead | from the state | paga extra, convenio, servicios mínimos | who called it, and the date |
| Copper theft | 3 kV sections without the vigilance Medida | low | vigilance | the section |
| Audit | pruebas above 12 | from the state | Conseguidor, transparencia | the evidence |
| Recession | from stage 3, on the calendar | 0–2 a game | — | ridership ×0,85 |
| Viral video (good) | a corridor at 90 % or more for 4 weeks | earned | — | that corridor |
| European subsidy (good) | a plan that qualifies (for example ancho estándar) | earned | — | the plan |

The Imprevistos slider multiplies the hazards by 0, 0,5, 1 or 1,5. Stage 1 has no events except scripted ones.

### 2.5 Rivals
- **Who.** Lowgo (OuiOui, id `lowgo`) and YaIré (id `rossa`). At setup: rivals off, 1 or 2, and «Absorciones» on or off (RE2's "disable mergers").
- **Where they enter.** The entry week comes from the seed. The target is the corridor with the best margin among Levante, Sur and Mediterráneo, weighted by your weakness there (your lowest punctuality).
- **Their share** grows 2 points a week while your punctuality there is below 80, shrinks 1 a week once it is 88 or more, and is capped at 60 %. It is a column in the monitor.
- **Subsidy races** (OpenTTD), for example «Primer Vigo–Oporto directo antes de la semana 60 → ingresos ×2 durante 52 semanas». A rival can claim it first, and the Gaceta reports it.
- **Patent auctions** (SMR) every ~26 weeks, for example «Cambiador automático Tardo: −40 % en cambiadores». The rivals bid too; losing gives a rival a visible boost on its corridor.
- **Maker previews** (#4) go to the rival if you decline them.
- **«Operador Ferroviario del Año»** (ACEO). Every 52 weeks, a top 10 of parody European operators by punctuality and satisfaction. Winning pays 2 M€ and Confianza +5; coming last puts you on the Gaceta's front page.

### 2.6 One real map, many networks
- **The seed** decides the degraded corridors and the known electrification gaps, which are always shown.
- **Each comunidad's specialisation** changes its demand mix and its Peticiones:
  - Turismo: summer peaks;
  - Negocio: Economía cares 1,5 times as much about AVE punctuality;
  - Cercanías: frequency matters;
  - Alta velocidad.
- **Territories.** The seed draws which 6–8 territories want a train.
- **Historic works** (from the classic data) arrive on their real dates and show in the calendar.
- **«Canon por concesión»** (CS2 tile upkeep). Every corridor or territory you open beyond the starting set adds a weekly canon. It grows from 5 % to 25 % of the opening cost as you hold more of them, so opening everything is no longer the dominant strategy. It is a difficulty lever.

### 2.7 Optional goals
- **3 Retos per seed** (TF2's bonus tasks), shown as dark medals that turn gold. Examples:
  - «Ningún esencial bajo el 70 % en 2028»;
  - «Electrifica Teruel antes de las elecciones»;
  - «Gana sin el Conseguidor».
- **Encargos del Ministerio** every ~13 weeks, in Peticiones (#21), with a speed bonus (RE2).
- **About 40 medallas** (CS):
  - teaching: «Mira todas las capas», «Firma tu primer pacto»;
  - ladders: 25, 50 and 100 % of the network electrified;
  - satirical: «Ministro dimitido» (apoyo below 15 %), «Tren fantasma» (0 viajeros for 8 weeks), «Puerta giratoria».
  - Some medals unlock an emblematic station.
- **Emblematic stations and megaproyectos** (CS2 signature buildings). Each has 2–3 visible conditions: a hito, satisfaction at X or more, and km electrified at Y or more. Once the conditions are met, it is free to build once and gives a buff.
- **The «Sede de Tenfe»** grows with the score: km electrified, km of ancho estándar, fastest train, viajeros. Your title climbs from Becario to Presidente de Honor, and the Gaceta announces each promotion (TF2, OpenTTD).
- **Operador Ferroviario del Año** (§2.5).

### 2.8 Branching arcs
Stage 2's exit choice (devolver or plantarse) times stage 5's path (Mediterráneo, Tren verde or Bolsa) gives 6 arcs. Each has its own ending, Gaceta front page and medal.

### 2.9 Difficulty
Four presets, Fácil, Normal, Difícil and Infernal, set six sliders of 4 steps each plus three multipliers. «Personalizar» shows them all.

| Slider | Steps | Effect |
|---|---|---|
| Fondos europeos | abundantes / justos / simbólicos / ninguno | subsidies ×1,5 / 1 / 0,5 / 0 |
| Exigencia de los grupos | indulgente / justa / exigente / agresiva | ultimatum below 15 / 25 / 30 / 35; punishment ×0,5 / 1 / 1,25 / 1,5 |
| Oposición | amable / reacia / moderada / fuerte | 0 / −2 / −4 / −6 points on the vote count (the 50 % rule stays) |
| Media europea | débil / moderada / media / fuerte | slope +1,0 / +1,5 / +1,8 / +2,2 a year |
| Imprevistos | ninguno / raros / ocasionales / frecuentes | hazard ×0 / 0,5 / 1 / 1,5 |
| Sindicatos | dóciles / normales / combativos / en pie de guerra | strike threshold 30 / 38 / 45 / 50 |
| Multipliers | — | interest ×0,8–1,5 · works cost ×0,9–1,25 · maintenance ×0,9–1,25 |

The score multiplier is the product of the slider factors, from about 0,7 on Fácil to 1,6 on Infernal, shown live (Tropico 4).

### 2.10 Modifiers (0–3 per game)

| Modifier | Effect | Score |
|---|---|---|
| Ministerio en funciones | no pacts with the minister for the first 26 weeks | +10 % |
| Verano tórrido | track −10 a week in July and August in the Sur | +10 % |
| Bruselas generosa | subsidies ×1,5 | −10 % |
| Misterio de Moncloa | the Consejo's cards come face down | +5 % |
| Solo diésel | no new catenary works | +20 % |
| Ancho ibérico obligatorio | no gauge-change works | +10 % |
| Huelga perpetua | Trabajadores starts at 20 | +15 % |
| Prensa hostil | harsher headlines; scandals ×1,3 | +10 % |
| Austeridad | works +25 %, maintenance +25 %, demand −15 % (CS1 Hard Mode) | +25 % |
| Año electoral | the first vote is in week 52 | +15 % |
| Fabricante en quiebra | one maker, from the seed, disappears around week 100 | +5 % |
| Lowgo madrugador | the rival enters in week 60 | +15 % |
| Tarifa social | the price index is capped at 0,9 | +10 % |
| Puerta giratoria | Comité candidates cost 30 % less; sospecha +2 a week | ±0 |

### 2.11 Encargos (scenarios)
Each encargo shows its win and lose conditions as chips before you start (CS1 patch 1.6.1). Finishing one unlocks the next and awards a medal and a unique unlock.

| Encargo | You win if | You lose if |
|---|---|---|
| Rescate exprés | result ≥ 0 before week 52 | debt rises 50 % or apoyo falls below 20 % |
| Electrifica Extremadura | 214 km under catenary before week 208 | you lose the election |
| Ancho único | 3 corridors at ancho estándar within 156 weeks | 3 graves |
| Solo diésel | you win the election without one catenary work | bankruptcy |
| Bruselas te odia | stage 2 passed with Bruselas at 10 and no funds | bankruptcy |
| Huelga perpetua | 5 corridors at 85 % with Trabajadores starting at 10 | 26 weeks of strikes in total |

### 2.12 «Modo maqueta», Reto semanal and endless play
- **«Modo maqueta»** (#8): checkboxes plus «Seleccionar todo»; medals off, with a banner.
- **«Reto semanal»** (#8): the same seed, president and 2 modifiers for everyone, derived from the ISO week, with no server needed.
- **«Prórroga»** after a win in week 416 (Mini Metro's endless mode):
  - elections every 208 weeks;
  - the media europea keeps rising and the calendar keeps drawing;
  - the score is counted per 52 weeks.
- **«Sin fin»** from the start: no stage deadlines after stage 2, elections still held.

### 2.13 Two seeds, two different games
- **«TNF-4R7Q»** · Rescate 2027 · Tecnócrata · Verano tórrido.
  - Norte and Sur start degraded.
  - Lowgo enters the Levante in week 188, and a recession comes around week 150.
  - Paco brings the apeadero.
  - The final path is Tren verde.
  - A game about track and catenary, with summers that punish the Sur.
- **«TNF-9K2M»** · Herencia envenenada · Ex-sindicalista · Bruselas generosa + Misterio de Moncloa.
  - Extremadura and Galicia start degraded.
  - Lowgo is already in the Levante, and there is no recession.
  - Fermín brings the paga extra.
  - Stage 2 ends with «Plantarse», and the final path is Salida a bolsa.
  - A game about money and rivals.

---

## 3. The UI information architecture

### 3.1 The principle: the player always knows what to do next and where to find it
Five questions always have an answer on screen:

| Question | Where it is answered | Always visible? |
|---|---|---|
| What do I have to achieve? | Misión, left column: stage, its conditions, time left | yes |
| What is going wrong? | the critical alerts in Misión, the Avisos counter, the markers on the map, the problem rows in the card | yes |
| What do I do now? | the «Siguiente» line in Misión; the verbs in the object's card | yes |
| When? | the top right: week, countdown to the election, orders ●●○; hovering the week shows the next 3 calendar items | yes |
| Where is X? | 6 labelled sections in a fixed order, at most 5 tabs each; everything else is the card of something on the map | yes |

### 3.2 The «Siguiente» line
One line with one «Ir» button. It picks the first item that applies from this list:
1. a pending decision → «Decide: …»;
2. a critical alert → its fix;
3. an unticked tutorial step, in stages 1 and 2;
4. the stage condition furthest behind for the weeks left → its best action. `obstacles` already carries an `action` for each problem;
5. unused orders → one useful action, for example «Te quedan 2 órdenes: el Sur tiene 600 sin plaza → +1 tren»;
6. «Cierra la semana».

### 3.3 Screen zones: one job each

| Zone | Job | Holds | Never holds |
|---|---|---|---|
| Top bar | status and time | ≡ menu · Caja (± a week) · Apoyo · Puntualidad · Cuadrillas libres · Trenes libres │ Avisos (n) │ week · elections · orders ●●○ · ? | long text |
| Left column | goal and the next step | Misión: stage, 2–4 conditions, at most 3 critical alerts, «Siguiente» | lists, history |
| Top-left of the map | how to read the map | Capas ▾ and the legend of the active layer or tool | anything else |
| Right | the object you clicked | its card, which widens into the Obra or Servicio planner | global pages |
| Bottom bar | progress, places, end of turn | hito badge with ◆ │ 1 Red · 2 Flota · 3 Dinero · 4 Política · 5 Progreso · 6 Prensa │ ticker │ Avanzar · Cerrar semana | layer pills |
| Drawer | management | one section at a time, at most 5 tabs | a third level |

Verbs live in the card of whatever you clicked; nouns live in the bottom bar. The rule for the player: «Lo que haces está en la ficha; lo que consultas, abajo».

### 3.4 Navigation map (at most two levels)

```
MAPA (pantalla principal; nunca se cierra)
│
├─ Barra superior ··· ≡ · Caja · Apoyo · Puntualidad · Cuadrillas · Trenes │ Avisos (n) │ Semana · Elecciones · ●●○ · ?
├─ Columna izq. ····· MISIÓN: etapa y condiciones · críticos (máx. 3) · SIGUIENTE
├─ Esquina del mapa · CAPAS ▾ + leyenda de la capa o de la herramienta activa
├─ Derecha ·········· FICHA del objeto pulsado ──► se amplía a OBRA o SERVICIO
├─ Barra inferior ··· Hito ◔ ◆ │ 1 Red · 2 Flota · 3 Dinero · 4 Política · 5 Progreso · 6 Prensa │ Teletipo │ Avanzar · Cerrar
│
└─ CAJÓN (entra por la izquierda, ≤50 %; nivel 1 = sección, nivel 2 = pestaña)
   1 Red ········ Corredores (monitor, M) · Obras · Territorios · Megaproyectos
   2 Flota ······ Mis trenes · Trenespop (hasta 70 %, T) · Pedidos
   3 Dinero ····· Semana · Previsión · Crédito · Presupuestos · Tarifas*
   4 Política ··· Apoyo · Peticiones · Pactos · Medidas · Conseguidor*
   5 Progreso ··· Etapa · Hitos y medallas · Desarrollo · Calendario · Comité
   6 Prensa ····· Gaceta · Trenter · Informes · Diario

MODALES (solo cuatro tipos, de uno en uno)
   Decisión con opciones · Informe de la semana · Tarjeta de hito · Inicio y fin de partida
GUÍA (?) ··· ayuda del panel abierto · archivo con buscador (5 grupos: Red, Dinero, Política, Capas, Interfaz)
MENÚ (≡) ··· guardar · exportar · sonido y voces · «Silenciar al tertuliano» · noticias por categoría · accesibilidad

* With a padlock until unlocked (Tarifas by the Finanzas director, Conseguidor by Hito 2). Never hidden.
```

Rules:
- Nothing sits deeper than section › tab.
- Every tab is two clicks from the map, or one key plus one click.
- The planners are the card widened, so the map stays in view, painting what the planner is about to change.
- «Diario» lists every decision, what the engine applied, and later what came of it. It is the coherence log the player can read.

### 3.5 Where today's pages go

| Today | In the unified mode |
|---|---|
| Rail › Finanzas | 3 Dinero |
| Rail › Obras | 1 Red › Obras; new works start from the corridor card |
| Rail › Flota | 2 Flota › Mis trenes |
| Rail › Pactos | 4 Política › Pactos (requests in › Peticiones) |
| Rail › Progreso (hitos, programa, etapas, graves y leves) | 5 Progreso › Etapa and › Hitos; the «Programa» becomes Mitin promises (#16) |
| Rail › Tecnología | 5 Progreso › Desarrollo; «Fontanería» → 4 Política › Conseguidor |
| Rail › Megaobras | 1 Red › Megaproyectos |
| Rail › Elecciones | 4 Política › Apoyo, plus the Mitin decision in weeks 200–207 |
| Rail › Cloacas | 4 Política › Conseguidor |
| Rail › Gaceta | 6 Prensa › Gaceta; the ticker stays |
| Rail › Ayuda | ? Guía, plus the first-open cards |
| Dock › 8 layer pills | Capas ▾ in the map corner |
| Top bar › ★ | ◆ in the hito badge; ★ becomes the category on Apoyo |
| Toast «Semana N · ±X» | the weekly report, plus Avisos |
| Classic › Trenes › Trenespop and Mis compras | 2 Flota › Trenespop and › Pedidos |
| Classic › Despacho (encargos, city requests) | 4 Política › Peticiones |
| Classic › Dirección (staff, policies, research, competition) | 5 Progreso › Comité; 4 Política › Medidas; 5 › Desarrollo; the rival's share is a column in 1 Red › Corredores |

### 3.6 What opens when you click the map

| You click | Opens | Shows | Actions |
|---|---|---|---|
| Corridor | its card, on the right | type and km; ancho · tensión · velocidad útil chips; puntualidad · vía · viajeros · neto; route strip; one row per problem (cause, effect, fix) | Obra › · Servicio › · Comprar ›; tabs Resumen · Trenes · Cuentas · Historia |
| Section (zoomed in) | a popover | ancho, tensión, vmax, vía %, planned or running works | «Planear obra aquí» |
| Station or city | the city card | the mayor's label on the ladder, the convenio (0–100), open requests | Convenio · Peticiones · Sobre (only with the Conseguidor) |
| Territory halo | the territory card | the 3 steps (licencia → vía ≥40 % → tren diario), each ✓ or ✗ | the next step |
| Train | the corridor card, Trenes tab, with that unit selected | estado, edad, fiabilidad, profit dot | Revisión · Reasignar |
| Map marker | the object's card, scrolled to that row | cause and fix | the fix |
| Works site or plan ghost | the running work or the plan | phase, weeks, paid / total | Acelerar · Cancelar / Encargar |
| Portrait, anywhere | the person's popover | relation, what they remember you did, their pacts and requests | Ver pactos |

### 3.7 Where alerts go, and what may interrupt

| Kind | Examples | Where | Goes away | Interrupts? |
|---|---|---|---|---|
| Decision | incident with a deadline, Consejo de Ministros, maker preview, Mitin, scandal | a centred modal, one at a time; several in the same week merge into one screen | when answered | yes; the only kind that blocks closing the week |
| Critical (max 3) | payment in ≤2 weeks without cash; essential corridor below its stage target with ≤3 weeks left; ultimatum or decision due in ≤2 weeks; judicial phase ≥ imputación | the Misión column, plus a red marker on the object | when the cause is gone | stops «Avanzar»; one chime |
| Aviso | track below 45 %; trains in the workshop; occupancy above 95 %; a renegotiation window; a new request | the Avisos inbox (counter in the top bar), plus a marker | by itself, once solved | no |
| News | headline, Trenter post | the ticker, archived in Prensa | to the archive | no |
| Weekly report | the result of the week or weeks just closed | a one-screen report after closing, only if something crossed a threshold; otherwise a link in the ticker | — | no |

«Avanzar» keeps today's `stopReasons`, plus the critical alerts. In week 208 the stage result, the next stage's intro, the election and Lowgo's entry arrive as four modals in a row. They become a single «Noche electoral» screen.

### 3.8 Keyboard

| Key | Does |
|---|---|
| Enter | Cerrar semana (when no field has focus; inside a table, opens the row) |
| Shift+Enter | Avanzar hasta la próxima decisión |
| 1–6 | Red · Flota · Dinero · Política · Progreso · Prensa |
| Tab | reopen the last tab |
| Esc | back one level: tool → card → drawer |
| M | Monitor de corredores |
| T | Trenespop, filtered by the selected corridor |
| O / S | Obra / Servicio on the selected corridor |
| C / Shift+C | next / previous layer |
| A | Avisos |
| N | go to «Siguiente» |
| ? or F1 | help for the open panel; press again for the Guía |
| Shift+click | «Solo presupuesto» on any purchase or works button |
| ↑ ↓ | move through table rows |

Every tooltip names its key. On phones, a long-press does what hover does on desktop.

### 3.9 Visual grammar
- **One container per panel.** Inside it: rows, aligned columns, whitespace and hairlines. No card inside a card, no tile that holds a list.
- **Numbers large, labels small, words only for causes and consequences.** No sentence on a panel is longer than about 12 words. Explanations live in the «¿Por qué?» popover and the Guía.
- **Colours mean the same everywhere:** green fine · amber needs attention · red a problem with an action · blue selected or information · orange renegotiable · grey locked or no data.
- **Units are always shown:** %, M€, k€/sem, k viajeros/sem, semanas.
- **Before → after on every action**, using the existing quote functions, plus the group chips (+/−).
- **Icons:** one per section and one per resource. They always carry a label in the bottom bar. The top bar may show just icon and number, because hover or long-press names them.
- **One visual language.** Today a dark glass HUD sits over a light parchment map (rescue.md §C). Pick one.

### 3.10 Phone, 390 px wide
- **Top bar:** Caja · Apoyo · ●●○. Tap it for the rest.
- **Misión** collapses into one line under the top bar, «Siguiente: … Ir»; tap to expand.
- **Bottom:** 6 labelled tabs, with «Cerrar semana» as a floating button above them. The ticker is hidden; a badge on Prensa replaces it.
- **The card** is a bottom sheet, half height then full. **The drawer** is full-screen with a back arrow.
- **Long-press = hover:** «¿Por qué?», help and key names.
- **Map labels:** only for the selected, critical or zoomed-in objects. Today they overlap at 390 px.

### 3.11 Wireframes
Notes for all five:
- The lines mark zones, not drawn borders.
- The numbers are examples and the real UI uses icons where these show words.
- They follow §3.9: one container per panel, rows inside it.

**A. The main screen (desktop).**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ≡  € 11,6 M −0,37  Apoyo 52 %  Punt. 81 %  Cuadr. 1/3  Trenes 0/9       Avisos 4   S34 · elecc. 174   ●●○  ? │
├─────────────────────────────────┬─────────────────────────────────────────────────┬──────────────────────────┤
│ ETAPA 2/5 · Salir del rescate   │ Capas: Puntualidad ▾                            │ NORTE                  × │
│ quedan 18 semanas               │ ■ ≥85   ■ 70–84   ■ <70   □ cerrado             │ Esencial · 421 km        │
│                                 │                                                 │ IB · 3 kV · vmax 160     │
│ Norte     78/80  ▰▰▰▰▰▰▰▰▱      │                                                 │                          │
│ Levante   83/80  ✓              │                                                 │ 78 %   44 %   8,1 k      │
│ Sur       71/80  ▰▰▰▰▰▰▰▱▱      │                  M A P A                        │ punt.  vía    viaj/sem   │
│ Caja ≥3 M€ en sem 52  ✓ hoy     │                                                 │                          │
│                                 │       (marcador ! sobre el Sur:                 │ ! Vía Ávila–Medina 38 %  │
│ ! Pago 1,2 M€ en la sem 36      │        «vía 41 %», clic = ficha)                │   −28 punt.  Renovar ›   │
│   caja prevista 0,9 · Crédito › │                                                 │                          │
│ ! Sur 71 % · faltan 3 sem       │                                                 │ Obra ›   Servicio ›      │
│                                 │                                                 │ Comprar ›                │
│ SIGUIENTE                       │                                                 │                          │
│ Renovar vía Sur · 2,1 M€   Ir › │                                                 │ Resumen Trenes Cuentas   │
├─────────────────────────────────┴─────────────────────────────────────────────────┴──────────────────────────┤
│ ◔ Hito 4 · Operador Solvente  ◆3      1 Red   2 Flota   3 Dinero   4 Política·2   5 Progreso   6 Prensa      │
│ Gaceta · «El Norte llega tarde. Otra vez.»   Trenter · #SurTarde 6,2 k       » Avanzar    Cerrar semana 34 ▶ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**B. Buying a train: Flota › Trenespop, opened from the Extremadura corridor.** This is the drawer's one allowed 70 % exception. The map keeps painting where each hovered model can run.

```
┌────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────┐
│ Flota   Mis trenes · [Trenespop] · Pedidos                               × │ MAPA (sigue visible)            │
│ Trenes para EXTREMADURA · IB · 3 kV 120 km + sin catenaria 214 km          │ (cifras de ejemplo)             │
│                                                                            │ Extremadura resaltada.          │
│ Tracción  Todas  Eléctrico  Diésel  Bimodo     Ancho  Todos  IB  VAR  UIC  │ Al pasar por una fila:          │
│ Marca  Todas  KAFKA  Tardo  Malstom  BCBB  Dörfler       Orden  €/plaza ▾  │ verde = puede circular          │
│ ────────────────────────────────────────────────────────────────────────── │ ámbar = con cambiador           │
│                                        plazas vmax  M€/ud  llega   fiab.   │ gris  = no puede                │
│ ✓ PUEDEN CIRCULAR · 2                                                      │                                 │
│   S-730 Alvia bimodo  Tardo  VAR BIMODO  265  250   24,0  30 sem  ▰▰▰▰▱    │ Leyenda de la capa              │
│   S-599 regional      KAFKA  IB  DSL     180  160    9,5  20 sem  ▰▰▰▰▰    │ Catenaria (auto):               │
│ ◐ CON CAMBIADOR · 0                                                        │ ■ 3 kV  ■ 25 kV  ■ sin          │
│ ✗ NO PUEDEN · 4                                          [ ] mostrarlos    │                                 │
│   S-120  KAFKA  VAR 3/25 kV  Necesita catenaria en 214 km · Ver obra ›     │                                 │
│   S-112  Tardo  UIC 25 kV    Ancho UIC: la vía es ibérica · Ver VAR ›      │                                 │
│ ────────────────────────────────────────────────────────────────────────── │                                 │
│ S-730 Alvia bimodo                                           Tardo · nuevo │                                 │
│ 24,0 M€ · 1,1 M€/año · 265 plazas · vida 30 años · fiabilidad máx. 86 %    │                                 │
│ Ancho IB/UIC (variable) · 3 kV, 25 kV y diésel · vmax 250 (diésel 160)     │                                 │
│                                                                            │                                 │
│ Ruta  Madrid ━━━━━━━━━━━━━━━━ Talavera ━━━━━━━━━━━━━━━━━━━━━━━━━━ Badajoz  │                                 │
│                3 kV ✓ 120 km          diésel ✓ 214 km sin catenaria        │                                 │
│ Velocidad útil 160 km/h · limita Navalmoral–Monfragüe (160)                │                                 │
│ Uno más: +1.900 viajeros/sem · +14 k€/sem · ocupación 97 → 82 %            │                                 │
│                                                                            │                                 │
│ Cantidad  − 2 +       Solo presupuesto     [ Comprar · 48,0 M€ · 1 orden ] │                                 │
└────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────┘
```

**C. The corridor card (Resumen), and the same card switched to Servicio.** The card is at most 30 % wide, and the map stays in view. The Servicio side is CS2's line panel: trains limited by free units, frequency as one number with its interval (NIMBY Rails), only compatible models, the fare's effect on demand, and before → after.

```
┌────────────────────────────────────────────────────┐   ┌────────────────────────────────────────────────────┐
│ NORTE                                            × │   │ ‹ NORTE · SERVICIO                               × │
│ Esencial · Madrid–León · 421 km                    │   │                                                    │
│ IB · 3 kV · vmax útil 160 (limita Ávila–Medina)    │   │ Trenes      − ▰▰▰▰▱▱ +     4 · quedan 2 libres     │
│                                                    │   │ Frecuencia  8 al día · cada 2 h 10                 │
│  78 %      44 %      8,1 k      −62 k€             │   │ Modelo      S-120 KAFKA ▾   (solo compatibles)     │
│  punt.     vía       viaj/sem   neto/sem           │   │ Billete     − 38 € +        demanda −6 %           │
│  obj. 80   taller 2/4   ● neto 13 sem < 0          │   │ Exprés      ○   ✓ Hito 2 · ✗ falta 1 tren          │
│                                                    │   │ Horario     día · noche · [ambos]                  │
│ Mad ━━━━ Ávila ━━━━ Medina ━━ Vall ━━ Pal ━━━━ León│   │                                                    │
│      72        38 !        61      70      55      │   │                ahora        con el cambio          │
│                                                    │   │ Ocupación      97 %         81 %                   │
│ ! Vía Ávila–Medina 38 % · −28            Renovar › │   │ Puntualidad    78 %         77 %                   │
│ ! 2 de 4 trenes en taller · −6          Revisión › │   │ Viajeros       8,1 k        8,9 k                  │
│ · Ocupación 97 % · 600 sin plaza         +1 tren › │   │ Neto/sem       −62 k€       −41 k€                 │
│                                                    │   │ Grupos         Viajeros +2 · Economía +1           │
│ Obra ›          Servicio ›          Comprar ›      │   │                                                    │
│ Resumen · Trenes · Cuentas · Historia              │   │ Solo presupuesto               Aplicar · 1 orden › │
└────────────────────────────────────────────────────┘   └────────────────────────────────────────────────────┘
```

**D. The works planner.** The card widens to about 60 %. The map on the left switches to the vía layer by itself and paints each section red or blue. A dashed line marks a saved plan.

```
┌────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
│ MAPA · capa Estado de la vía (sola)    │ ‹ NORTE · OBRA                                           Planos 2 › │
│                                        │ [Renovar vía] · Electrificar · Ancho · Señalización · Velocidad     │
│   Madrid                               │                                                                     │
│     ┃  azul   (ya está bien)           │   Tramo                  km    vía     M€   sem                     │
│   Ávila                                │ ■ Madrid–Ávila          117   72 %      —     —   azul              │
│     ┃  ROJO   seleccionado             │ ■ Ávila–Medina           92   38 %   2,35    10   rojo  ✓           │
│   Medina                               │ ■ Medina–Valladolid      42   61 %   1,05     5   rojo  ○           │
│     ┆  rojo   plano B (fantasma)       │ ■ Valladolid–Palencia    47   70 %      —     —   azul              │
│   Valladolid                           │ ■ Palencia–León         123   55 %   3,10    12   rojo  ○           │
│     ┃  azul                            │                        seleccionado: 92 km · 2,35 M€                │
│   Palencia                             │                                                                     │
│     ┃  rojo                            │ Durante la obra      semanas   viajeros   extra                     │
│   León                                 │ ● Por fases              10      −12 %      —                       │
│                                        │ ○ Autobuses               7      −30 %      +0,4 M€                 │
│ Leyenda                                │ ○ Cortar la vía           5     −100 %      —                       │
│ ■ rojo  vía < 65 %: necesita obra      │                                                                     │
│ ■ azul  ya la tiene                    │ 2 cuadrillas · en servicio sem 45 · pagos máx. 0,3 M€/sem           │
│ ┆ trazo discontinuo = plano            │ Caja prevista mínima 1,1 M€ (sem 41)  ✓                             │
│ Esc cancelar · Enter encargar          │                                                                     │
│                                        │                hoy     después                                      │
│                                        │ Puntualidad    78 %    86 %     ✓ 80 % en la sem 52                 │
│                                        │ Vía del tramo  38 %    95 %                                         │
│                                        │ vmax útil      160     160                                          │
│                                        │                                                                     │
│                                        │ Añadir al plano     Comparar A · B             Encargar · 1 orden › │
└────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘
```

**E. Factions and elections: Política › Apoyo**, at 50 % with the map still clickable.

```
┌─────────────────────────────────────────────────────────┬────────────────────────────────────────────────────┐
│ POLÍTICA                                              × │ MAPA (sigue visible y se puede pulsar)             │
│ [Apoyo] · Peticiones · Pactos · Medidas · Conseguidor   │                                                    │
│                                                         │ Capa Territorios (se enciende sola):               │
│ Voto previsto 52,4 %  ━━━━━━━━━━━━━━━━━━━━━┃━━━━  50 %  │ ○ Soria     sin tren                               │
│ Elecciones en 174 sem · cuenta la media de 26 sem       │ ○ Teruel    sin tren                               │
│ Mitin: semanas 200–207                                  │ ● Cáceres   convenio 64/100                        │
│                                                         │                                                    │
│              peso  sem media  gest Europa  conf  26 sem │ Clic en un territorio: su ficha se abre            │
│ Viajeros      34%   58    54    +9     −6    −2  ▂▃▄▅▅  │ a la derecha sin cerrar este panel.                │
│ Territorios   20%   41    45    −2      ·    −2  ▅▄▃▃▃ !│                                                    │
│ Trabajadores  20%   63    60    +8      ·    −2  ▃▄▅▅▆  │                                                    │
│ Economía      26%   49    50    +3     −4    −2  ▄▄▄▄▄  │                                                    │
│                                                         │                                                    │
│ Peor causa: 2 territorios sin tren · −10          Ver › │                                                    │
│                                                         │                                                    │
│ Confianza −2 · «yate» −4, se borra en 61 sem            │                                                    │
│ Seguridad AESF 68 · no vota · <40 4 sem = expediente    │                                                    │
│ Categoría ★★★☆☆ · ofertas hasta ★★★★                    │                                                    │
│ Media europea 69 (+1,8 al año) · tu puntualidad 81      │                                                    │
│                                                         │                                                    │
│ ! ULTIMÁTUM Territorios · Tren a Soria · 9 sem    Ver › │                                                    │
│   si fallas: OSP −1 por trimestre, 52 sem               │                                                    │
│ · Trabajadores piden «Paga extra» · +5            Ver › │                                                    │
└─────────────────────────────────────────────────────────┴────────────────────────────────────────────────────┘
```

---

## 4. Anti-patterns these games avoid and our UI falls into

Evidence comes from `rescue.md` (section given) and the screenshots `cur-02-ancho.png` and `cur-04-decision.png`.

| # | What our game does now | What the games do instead | Fix |
|---|---|---|---|
| 1 | **An unlabelled rail.** 11 icons with the label only on hover, and none at all on phones (§C.2; css 264). | Tropico: 12 labelled buttons in a fixed order. CS: one bottom bar grouped by separators. OpenTTD: right-click any button to learn what it does. | A labelled bottom bar with 6 sections; long-press help (#23, §3.3) |
| 2 | **Too many doors.** 11 pages, 8 layer pills, and top-bar chips that each open a page (§C.2, §C.5). | ACEO: one panel, two levels of tabs. Tropico's critics: "a million different menus". | 6 sections with at most 5 tabs each (§3.4) |
| 3 | **Pages cover the map.** Sheets up to 1080 px wide (§C.7). | ACEO: a drawer of at most 50 %. TF2's players complain that windows cover the screen. | Drawer, with the map clickable beside it (#23) |
| 4 | **Boxes inside boxes.** Tiles that hold rows and columns; pact offers with 4 columns of text under a quote; the tutorial bubble inside the modal (§E.3). | ACEO: icons with short descriptions instead of long strings, one panel. CS2: list › detail › explanation. | One container per panel, rows inside it, text only for causes (§3.9) |
| 5 | **Two numbers for one thing.** The header shows −45 k€ (or −93 k€) while the toast shows −370 k€ (§C.1, `cur-04`). | CS2: the monthly balance is the sum of the same ledger lines it lists. ACEO: income and cost bars carry their totals. | One ledger, plus «¿Por qué?» (#1) |
| 6 | **Feedback hidden.** The weekly report is never shown; breakdowns, failed tests and stopped works only reach `report.events` (§E.2). | ACEO's DB 152: many "bugs" were problems the player could not see. TF2 has a warning window; CS puts icons on the object. | A weekly report screen, plus alert triage (#6) |
| 7 | **Dice without causes.** An event roll at 20 % a week; breakdowns that ignore the fleet's condition; gifts (viral video, funds) (§E.2). | Tropico 4: a timeline of events. Tropico 6: disasters announced beforehand. OpenTTD: events tied to eras. Mini Metro: chosen rewards. | Calendar, causes and cards (#14, #15, #18) |
| 8 | **Words that differ from the engine.** 37 documented mismatches (§E.1). | CS2: chirps tied to events, and a radio that stays silent when nothing is wrong. ACEO is the counter-example: «A, sin multa» next to a 1,36 M$ fine. | Every text built from an event record (rule 0.1, #10) |
| 9 | **Layers that lie or explain nothing.** Catenaria, Ancho and Velocidad are cosmetic and wrong for Norte, Sur and Asturias. The card says «electrificado», a single yes/no, while the Ancho layer paints Palencia–León differently. No legend (`cur-02`, §0.7, §F). | ACEO: a context legend. CS: a legend with checkboxes. TF2: numbers in boxes on the track. | Section tags plus a legend (#3, #20) |
| 10 | **Goals shown but not counted, and counted but not shown.** Stage 2's cash is checked only in week 52; stage 3 shows Encuestas and Programa that don't count; in stage 4 a closed Mediterráneo counts as 100 % Lowgo (§E.1 #23–25). | Tropico: an «Era Outline» button. RE2: a task list with dates. Tropico players: "zero feedback about what I'm supposed to do". | Stage checks displayed exactly as the engine runs them (#24) |
| 11 | **Hidden requirements and silent no-ops.** Paco's apeadero takes the works slot without a word; `workRequirements` is decorative; the classic relation card has no link to Trenespop (§E.1 #22, #33). | ACEO: requirements written under each service. CS2: padlocks that state their requirement. | Rule #2 |
| 12 | **Offers by dice.** Pacts are offered at 9 % a week (§E.2). | Tropico: demands driven by standing. ACEO: offers driven by satisfaction. | Peticiones and agendas with triggers (#21, §2.3) |
| 13 | **The wrong voice.** «Sin rebaja» is always Íñigo; Raquel still speaks as minister after week 209 (§E.1 #11, #26). | Tropico: two-voice dual demands; powers that remember what you did. | Every line keyed to the speaker in the game state (#19) |
| 14 | **A pile of modals.** Four in a row in week 208 (§E.4). | ACEO: "attention is a very scarce resource". Tropico: a task list instead of popups. | Only decisions with choices are modal; one «Noche electoral» screen (§3.7) |
| 15 | **Unearned and farmable rewards.** +3 ★ per work with «Inauguraciones»; ★ from viral videos and funds (§B.9, §E.2). | CS2's lesson: a milestone farm by building and bulldozing. | ◆ only for lasting results (#12) |
| 16 | **A tutorial pointing at the wrong thing.** «Ese que parpadea en rojo» while the whole map pulses (§E.1 #29). | CS2: an outline on the exact control. ACEO: a checklist driven by the game state. | #9 |
| 17 | **Phones as an afterthought.** The rail fills the row, the layers are dots without names, map labels overlap (§E.3). | TF2: a radial menu on controllers. OpenTTD: right-click explains a button. CS: a labelled bottom bar. | Labelled tab bar, card as a bottom sheet, label culling (§3.10) |
| 18 | **Unlocks not listed.** m1 opens three corridors silently; m5 promises a plaque that doesn't exist (§B.9, §E.1 #27). | CS2: the milestone popup lists the unlocks from data. | A reward card generated from data (#12) |

What the four games get wrong, and we must not import:
- **Airport CEO:**
  - daily report emails that can't be turned off;
  - switches hidden in panels;
  - partner tiers where the top tier always wins;
  - a negotiation you win by reloading;
  - a passive tutorial;
  - a three-level build menu;
  - information spread over five channels.
- **Tropico:**
  - requests for things you already have;
  - punishments not scaled to the group's size;
  - one voice line per option;
  - hidden systems ("raids fell down the back of the interface's sofa");
  - no money breakdown by cause;
  - powers that forget what you did.
- **Cities: Skylines:**
  - a noisy social feed;
  - XP you can farm;
  - too few policies to build an identity;
  - a budget panel that doesn't show the service's state while you adjust it;
  - a pedestrian path hidden under Landscaping.
- **Rail games:**
  - windows that cover the map, and losing the overview late in the game (TF2);
  - invisible electrification gaps (TF2, OpenTTD);
  - no deadline reminders, and alerts without a fix (RE2);
  - a business layer that overshadows the trains (SMR).

---

## 5. Open questions for the design judges

1. **Splitting ★ and ◆.** ★ becomes the reputation tier (1–5, derived) and ◆ the spendable points. This needs a save migration (constraints.md §4) and new wording wherever texts mention ★. The alternative: keep ★ as the currency and show the tier as «Nivel A–E».
2. **How often the Consejo de Ministros meets.** Every 4 weeks gives 104 draws per game; every 8 weeks gives 52. Prototype with 4.
3. **Tropico's factions that unlock by stage** (Ecologistas ↔ Constructoras, Bruselas ↔ Proteccionistas). Recommended: not in v1, because they change the vote weights and the recorded lines. Revisit after playtests.
4. **Pactos and Peticiones.** Two tabs that share one card layout, as proposed here, or one «Compromisos» tab.
5. **The classic recordings** (412 takes, 315 encounters). They come back as Peticiones, incidents and Gaceta voices, chosen by topic and mood from the game state. Which recordings fit which system is a job for the design step.
6. **The classic «jornada» (day view).** Out of scope here. If it stays, it must either feed the weekly results or become a view with no penalties.
