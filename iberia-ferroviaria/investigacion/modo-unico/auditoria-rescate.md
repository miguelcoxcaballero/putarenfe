# Rescate de Tenfe: what the dialogues say vs what the engine does

Full data: `audit-rescue.json`, an object `{legend, counts, bySource, mechanicsNeeded, entries[]}` with 166 records.
Every record carries the exact text, the speaker, whether it has a recording, the claim, the trigger (file:line), the effect of each choice (file:line), the verdict, the evidence and the fix for the unified game.

**Scope:**
- the 70 `LINES`;
- 6 decision objects with their own text;
- the 9 pact cards (benefit, obligation, consequence, cheaper version) and the 7 bribes;
- the 21 `HEADLINES` plus the event-specific Gaceta texts;
- the 26 stage texts (goal, dilemma, obstacles), the 6 programme items and the 5 milestone notices;
- 15 other on-screen claims the dialogues depend on (techs, works, train compatibility, corridor km, the weekly report).

**Legend:** R = `proyecto/dist/rescate.js`, D = `rescate-data.js`, UI = `rescate-ui.js`, MAP = `rescate-map.js`.

**Method:** I read the four files in full and checked every number with Node simulations of the real engine. The scripts are `unify/audit-rescue-tools/a1…a8.mjs` and their outputs `a*.out.txt`. The repository was not touched.

## Verdicts

| source | coherent | partial | notImplemented | contradicts | flavor | obsolete | total |
|---|---|---|---|---|---|---|---|
| LINES | 29 | 31 | 0 | 9 | 0 | 1 | 70 |
| decision | 3 | 2 | 0 | 1 | 0 | 0 | 6 |
| PACTS | 1 | 8 | 0 | 0 | 0 | 0 | 9 |
| BRIBES | 2 | 4 | 0 | 1 | 0 | 0 | 7 |
| HEADLINES | 2 | 7 | 0 | 1 | 8 | 3 | 21 |
| GACETA | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| STAGES | 0 | 0 | 0 | 0 | 0 | 26 | 26 |
| PROGRAM | 6 | 0 | 0 | 0 | 0 | 0 | 6 |
| MILESTONES | 3 | 1 | 1 | 0 | 0 | 0 | 5 |
| other | 0 | 9 | 3 | 2 | 0 | 1 | 15 |
| **total** | **47** | **62** | **4** | **14** | **8** | **31** | **166** |


- **Lines:** 29 of 70 hold. 31 are partial, 9 contradict the engine and 1 is never played.
- **Hidden texts:** all 26 stage texts are obsolete because the UI never shows them.
  - The goal is pushed as `d.text`, which `nextDecision` drops for `stage-intro` (UI:386).
  - `dilemma` and `obstacles` are referenced nowhere.
- **Voices:** only 3 of 70 rescue lines are recorded: `t-1`, `t-2` and `paco-estacion`. Changing any of the other 67 costs only a new take (about 50 s each).

## Numbers checked against the engine

| Claim (where) | Engine | OK? |
|---|---|---|
| «siete semanas y una cuadrilla» (t-3) | Norte renovation in bus mode: phases [1,5,1] = 7 weeks, 1 crew. Other modes: por fases 10 weeks, cortar 6 weeks (sim a1). | yes, for the default mode |
| Renovation cost 2,35 M€ (work modal) | max(0,9; 345 km × 0,0068) = 2,346. The real Norte is 421 km, which would give 2,86 M€. | yes, but the km are wrong |
| 1,2 M€ of EU funds paid at certification (t-4) | AIDS feder-norte 1,2, paid in the close where the work reaches commissioning (R:1261) | yes |
| «Un tren nuevo tarda cuatro semanas» (t-5, s1 dilemma) | KAFKA 4 weeks, shown as «Llega sem. W+4». Dörfler 6, BCBB 3, used 1. | yes |
| A train breaks down in week 2 | Forced event at the close of week 2 (R:924) on La Abuela (Serie 592, 48 %, Norte) | yes |
| Breakdown: «vuelve la semana que viene» / «tres semanas» | Overtime loses 0 operated weeks; workshop loses 2 (sim a2) | no |
| Strike «Aguantar: dos semanas con el 40 % de ingresos» | 2 closes at ×0,4 (tickets 0,17 vs 0,43) | yes |
| Strike «Negociar: +2 % de nómina» | Costs 0,79706 → 0,79706: never charged, and gives a permanent +3 support row | no |
| Convenio «huelga de dos semanas» | strike = week+2 is set after operation, so only 1 operated week | no |
| Cable «el Sur pierde 10 puntos dos semanas» | The target drops 10; the visible loss peaks at −5,2 and lasts about 4 weeks | partial |
| Snow «el Norte pierde 15 puntos esta semana» | The visible loss is −5,7, still −2,2 three weeks later | partial |
| Contrato-programa «devuelves lo cobrado… con intereses» | Repays exactly Σbonus (2,4 M€ in sim a4), no interest; the audit is only a random chance | partial |
| Adif crew: 12 weeks, 0,6 M€, permits +50 % for a year | Exact | yes |
| Paco's station: 1,4 M€, 1 crew, 5 weeks | Exact, plus 2 hidden costs: it blocks the Norte work slot and takes −9 punctuality for 3 weeks | partial |
| Alcalde bribe «la preparación dura la mitad» | Math.round(1 × 0,5) = 1, so the 1-week preps (renovar, apartaderos) do not change | partial |
| Diputados +0,9 M€ next quarter / periodista halves the next scandal | OSP 4,22 → 5,12 / viajeros hit −7 → −3,5 | yes |
| Juez «si sale mal, es el final» | stage = min(3, stage + 2): oral trial, and the game goes on | no |
| Extortion prices 400 / 250 / 300 k€, Christmas dinner 90 k€ | Exact | yes |
| Rescue «no cuenta para ganar» | Only rescues in the last 104 weeks block the win | partial |
| Tech «App: −15 % de costes» | staffMult = 1 − (−0,15) = 1,15: staff costs go UP 15 % | no |
| Dates | Elections: week 208 = 23 Dec 2030, week 416 = 18 Dec 2034. Heat: weeks 26–35 (28 Jun–30 Aug). Snow: weeks 1–8 and 49–52. Seafood dinner: week 50 (13 Dec). | yes |

## Root causes (fix these once and most entries become true)

1. **Generic speakers for specific situations.**
   - Íñigo says every negotiation refusal; Charo says every acceptance.
   - Raquel voices `pact-done`, `stage-pass`, `fin-retirada` and `end-win` even after she is replaced (week 209).
   - `stage-pass` is reused for an archived court case.
   - `sc-yate` is used for any commission; `sc-sobres` for the Autocares pact leak and for a derailment.
   - Benito keeps speaking after being fired.
   - Paco calls the Tenfe president «Ministro».
2. **Secrets without provenance.** `cloacas.secrets` is a bag of strings, and extortions and leaks take «the first unexposed one».
   - Paco threatens to tell «lo del sobre» when the secret is a manufacturer commission.
   - Íñigo has «fotos» of a seafood dinner.
   - Benito asks only if «traviesas» happens to be first in the array.
3. **Events without a place.**
   - Breakdown, heat, cable, snow and rockfall hit a whole corridor, nothing at all, or a corridor drawn after the choice (rockfall).
   - The viral video happens «en el Teruel» with no train running there: 120 of 120 cases in sim a6.
   - The rockfall «wait» choice can crash the engine.
4. **Constraints that are announced and never enforced.**
   - «El BCBB no circula en Cantabria».
   - The minister and Adif grudges («ministra mosqueada», «Benito no olvida»).
   - Borja's «obras más lentas».
   - Charo's audit.
   - «Dejarlo también tiene precio».
5. **Displayed number ≠ realised number.**
   - Choice notes quote target deltas (−10, −15) that the player sees at about half.
   - «Tres semanas» is 2; «+2 % de nómina» is 0; «huelga de dos semanas» is 1.
   - Cheaper pact cards show the full benefit (5 of 9 pacts).
   - The App tech raises costs instead of lowering them.
6. **Hidden information.**
   - The weekly report is never shown: about 3,1 silent breakdowns a year, failed tests, works stopped for lack of cash, minor breaches, the OSP amount.
   - Stage goals, dilemmas and obstacles are never shown either.
7. **Realism the dialogues rely on but the engine lacks.**
   - None of these is a segment property: «entre Ávila y Medina», «gálibo», copper cable on 3 kV, «Pajares», «rampa», «catenaria vieja».
   - Trains have no gauge, voltage or traction check: a Civia 3 kV EMU runs on diesel and 25 kV lines, and a standard-gauge 25 kV BCBB «Fuxing» runs on Iberian 3 kV.
   - The map layers show the LAV (standard gauge, 25 kV) for Norte pal–leo, Sur cor–sev and Asturias leo–pol.
8. **Exploits and edge bugs.**
   - Cohesion pays 3 M€ at once if a territory is already open.
   - A loan earlier the same week breaks the contrato-programa, while a cut in the signing week does not break the convenio.
   - The rockfall crew is created from nothing when none is free.
   - Insolvency choices can do nothing.
   - The inspector's accident risk never decays.

## Worst offenders

| id | Says | Engine |
|---|---|---|
| ev-tuneles | «el BCBB no circula en Cantabria» | Only territorios −5. A BCBB can still be assigned there, and the event fires even if none ever went. |
| ev-huelga (deal) | «+2 % de nómina» | Free, plus a permanent +3 support |
| cor-enchufe | «tus obras irán algo más lentas» | Same phases; −3 track on every finished work, on any corridor |
| ev-desprendimiento | «la vía está cortada» | With the crew nothing is cut; waiting cuts a random corridor; possible crash |
| ev-viral | «una revisora… en el Teruel» | Fires with Teruel closed (120/120) |
| ext-paco | «lo del sobre» / «mi estación sale adelante» | Any secret; paying does not build the station |
| sc-yate for commissions | «tú en un yate con el fabricante chino» | Any commission, from any maker |
| stage-pass / causa archivada | «Objetivo cumplido… idea mía» | Spoken when a court case against you is archived |
| negotiate-no | Íñigo: «dejarlo también tiene precio» | Íñigo for every counterpart; rejecting costs nothing in 8 of 9 pacts |
| BRIBE juez | «si sale mal, es el final» | You go to oral trial; the game continues |
| other:tech-app | −15 % commercial costs | +15 % |
| t-1 (recorded) | «las primeras trece semanas deciden si llegas a la segunda» | Failing s1 = 1 of 3 grave breaches |

## Voice plan

**The 3 recorded lines:**
- `t-2`: fixed in the UI only, by pulsing the Norte stroke.
- `t-1`: fixed mechanically. Failing s1 puts Tenfe under Treasury supervision: 2 orders a week during s2.
- `paco-estacion`: re-record «Ministro» → «Presidente», or keep Paco's habit consistent in `paco-inaugura`. Its hidden costs are fixed mechanically.

**New lines to record:**
- `jud-archivo`, `sc-comision`, `sc-accidente`, `sc-pacto-meseta`.
- The successor's versions of `stage-pass`, `pact-done`, `fin-retirada` and `end-win`.
- One refusal line per counterpart, or a neutral narrator.
- A generic viral variant, for when the line is not on the Teruel.

**Unused line:** `cor-comision` should be spoken when the Trenespop or works commission is offered, by the maker's rep.

## What the unified engine must implement

1. Per-segment infrastructure for every corridor, loaded from segments.json (km, gauge ib/std/mixto, electrification none/3kV/25kV, vmax, single/double/mixed track, condition %, loading-gauge class, terrain tags ramp/mountain/trench/tunnel/hot). Corridor punctuality, speed and costs derive from its segments. Works target one segment (e.g. «renovar Ávila–Medina, 86 km»). Fixes t-3, s1 obstacle 2, ev-cable, ev-nevada, ev-desprendimiento, ev-tuneles, Extremadura electrification and the map layers.
2. Real corridor lengths for every km-based cost (Norte 421, Levante 487, Sur 571 km instead of 345/390/470). The map layers come from the same segments, not from the LAV paths that baseSegments picks today (pal–leo, cor–sev, leo–pol).
3. Train profiles from trains.json (traction diesel/electric/bimodo, voltages[], gauge ib/std/variable, vmax, seats, gálibo, reliability, A/C reliability, age/condition). Assigning a train to a corridor validates every segment: gauge, voltage or diesel, gálibo. Energy cost follows the train's traction, not a corridor boolean.
4. Trenespop inside the unified game: new orders with an exact delivery week (shown and honoured: «Llega sem. N»), used listings with condition, per-corridor compatibility. The maker's 7 % commission is an explicit offer spoken by that maker's rep (cor-comision), bound to that contract and recorded in the secrets ledger.
5. One visible breakdown system: probability from reliability × condition × segment stress (ramps, heat), located on a train and a segment. Repair options state the exact operated weeks lost (overtime = 1, workshop = 3), counted in operated weeks. Tech/megaproject breakdown modifiers apply to it. The week-2 tutorial breakdown is La Abuela (Serie 592) on mad–avi.
6. Located incidents with durations: copper theft on a 3 kV segment (speed limit), snow on mountain segments in winter weeks, rockfall on a trench segment (closure from the moment it is announced), heat on hot corridors, A/C failure of a named train. Choice notes show the REALISED punctuality change computed with punctProjection, not the target delta.
7. A weekly report shown after every close: silent breakdowns, failed tests, works stopped for lack of cash or crews, OSP amount and minor breaches, aid paid, arrivals, strikes. The «Semana N · ±X» toast alone is not enough.
8. Payroll multiplier = 1 + pact upkeep + strike deals (payrollExtra), charged in weeklyAccounts. A strike is an interval {from: next operated week, weeks: N} with tickets ×0,4. The convenio breach and «Aguantar» both use it. The sindicato bribe also blocks new strikes for 13 weeks.
9. Character roster by date and state: Raquel minister up to week 208, Óscar from week 209; a dismissed Benito is replaced by a new Adif boss. Generic lines (stage-pass, pact-done, fin-retirada, end-win, negotiate-ok/no) resolve their speaker by role and date, or by pact counterpart. The player is addressed as «presidente de Tenfe».
10. Grudges and trust per character with real effects: minister (−0,5 M€ next OSP, no visits or inauguration offers for 26 weeks), adif/Benito (+1 week of permits), mayor (−5 territorios target and extortion), workshop (strike risk), riders (viajeros −).
11. Secrets ledger: each secret has a type, amount, contract/corridor, participants and witnesses. Extortion is possible only for a witness of that secret, with a line naming it. Leaks and scandals use the secret's own line and text (sc-comision with the maker, sc-pacto-meseta, sc-accidente, sc-sobres listing the actual recipients). A secret cannot be exposed twice.
12. One judicial-stage function: every stage change, including the jumps caused by the judge or Charo, emits its notice (jud-1/2/3) and its support hits. A failed judge bribe either ends the game («es el final») or the text is changed. Archiving the case has its own line.
13. Pacts: the shown terms equal the applied terms (the cheaper version has its own benefit text). A baseline is stored at signing, so a condition must be achieved after signing (cohesion). Rule checks treat same-week actions the same way (≥). Rejecting has a per-counterpart cost. «Antes de las elecciones» caps the deadline at week 207. The corrupt pact adds secret «pacto-meseta».
14. Contrato-programa breach: repayment with interest and a certain Treasury audit 2 weeks later. The audit inspects the secrets ledger and exposes secrets whose evidence ≥ threshold, raising the judicial stage.
15. Stage objectives evaluated exactly as worded: s2 tracks the minimum cash over weeks 14-52; s3 needs accounts + programme items + the week-208 election; s4 Lowgo share is pax-weighted over operated corridors only; s5 grants the «placa». Failing s1 has the consequence t-1 promises (Treasury supervision: 2 orders/week in s2).
16. Lowgo as a real operator: fare 9 €, seat capacity, paths only on LAV/standard-gauge relations parallel to the player's corridors (Madrid–València, Madrid–Sevilla, València–Barcelona), demand split by fare and time, its own spokesperson. Autocares Meseta (Íñigo) stays a separate coach rival with the feeder pact.
17. Corridor-specific events require their subject to exist: viral needs Teruel open with a staffed train; the visit needs the Norte open and runs on a real train; tunnels need a BCBB ordered or assigned for Cantabria; snow on «Pajares» needs Asturias open.
18. Loading gauge (gálibo): pal–san (Cantabria) reduced; BCBB units wide. Assignment is refused, and a tunnel-clearance work exists as an alternative.
19. Exact bribe effects: permits measured in days (−50 % works on 1-week preps); inspector risk bound to the works certified under the bribe, decaying over 26 weeks, with the accident on that segment; the alcalde envelope recorded with Paco as witness.
20. Works deliver what their text says: electrification sets 3 kV or 25 kV per segment and makes EMUs assignable; electric traction lowers breakdowns; the CTC «incident» modifier is read; Borja's crew builds ×1,33 slower (instead of −3 track); certifying phantom sleepers raises the work cost.
21. The Paco station is a node work that does not occupy the corridor work slot, or the pact discloses the slot block and the −9 phased penalty.
22. Crews bound to works: a work pauses when its crews leave (loan or subcontract expiry). Event crew dispatch requires a free crew. Random events never crash when no target exists.
23. Insolvency choices are disabled when they would do nothing and show the cash each one recovers. Rescues count over the whole mandate (or the texts say «dos últimos años»).
24. Tech modifiers with the right sign and the full stated effect: App −15 % staff costs; bimodo becomes a train type; prensa halves scandal AND breakdown support losses, which requires breakdowns to cost support.
25. Milestone unlocks that exist: tier-4 technologies, or remove «Nivel 4»; a cosmetic «Placa conmemorativa» at Atocha; «Abrir corredores nuevos» listed at m1.
26. Headlines conditioned on their subject: Norte headlines only when the Norte is late or punctual; «récord» headlines only on tracked records; «por primera vez» only once; bus-replacement headlines only while a bus-mode work is active; «semana tranquila» only when the report is empty. The unused corruption headlines are used or dropped.
27. Tutorial map highlight of the named corridor (Norte stroke pulsing) instead of the whole canvas.
28. Recurring obligations: fleet insurance every 52 weeks, scaled with fleet size.
29. Daily frequency for «tren diario» from timetable data (at least 1 round trip per day), not just trains > 0.
30. The Benito extortion as a recurring payroll cost («subir el sueldo»), selected by witness rather than secrets-array order.

## Spoken lines (LINES)

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| t-1 | minister | yes | partial | "Tienes ocho años" holds (WEEKS=416, D:7). "No hay dinero / no hay trenes" is hyperbole (12 M€ in cash). "Las primeras trece semanas deciden si llegas a la segunda" is false: failing s1 only adds 1 grave breach (R:1120) and the… |
| t-2 | riders | yes | partial | Red holds: punctColor(62)="#c23b2f" (MAP:60, 86) while Levante 71 and Sur 68 are orange. The blink does not: .rs-focus (rescate.css:248, rs-pulse) is applied to the whole canvas (UI:58, 459-460); the Norte stroke itself does no… |
| t-3 | adif |  | partial | "Siete semanas y una cuadrilla" holds for the default mode. "Entre Ávila y Medina" is not modelled. The corridor has a single track value (44 %). Renovar adds +46 to it (R:1313) and is priced on the whole corridor at 345 km (re… |
| t-4 | treasury |  | coherent | The aid timing is exact: it is paid at certification. Payments start at the close (R:322, R:1209), and the first week amount is in the quote (R:328). Minor gap: the other mandatory payments (2,5 M€ to suppliers in week 5) are o… |
| t-5 | workshop |  | coherent | All three claims match the engine: KAFKA takes 4 weeks (Dörfler 6, BCBB 3, used 1), a revision removes the train, and an extra train on bad track loses money. |
| t-6 | minister |  | coherent | Matches. Bribes (R:769), research (R:701), answering decisions (R:933), rejecting pacts (R:580) and the sliders do not cost orders, and nothing says they do. |
| t-7 | minister |  | coherent | closeWeek runs operation, revenue, payroll and works (R:1164-1310). The minister comes back with ev-visita (weeks 7-199, R:898) and the inauguration pact (from week 40, D:320). Weak point: the closed week is only summarised as … |
| stage-s1 | minister |  | coherent | Numbers and conditions match: Norte starts at 62 (D:27), the target is 80, and the deadline is week 13 (D:253). A default sets the flag. The value is checked at the instant of week 13, which the line allows. |
| stage-s2 | treasury |  | partial | «No bajes de tres millones» implies a continuous floor. The engine checks the cash only once, at the close of week 52, so the player can sit at 0,5 M€ for months. |
| stage-s3 | president |  | partial | Only one of the three named conditions decides the stage. The mission panel even shows the other two as goal rows (UI:152). |
| stage-s4 | successor |  | partial | The territories row matches. The Lowgo row requires the Mediterráneo, which «todavía no es tuyo» (D:37): with it closed, the share is 1 − (l + s + 1)/3, so it passes only if Levante + Sur ≤ 0,2 (sim a5: 67 % with both at 0). Th… |
| stage-s5 | president |  | partial | The conditions match. The plaque reward is promised and never given. |
| stage-fail | treasury |  | coherent | Exact. The −5/−3 support hit is not mentioned, but nothing contradicts it. |
| stage-pass | minister |  | contradicts | Use (2) has the minister say «Objetivo cumplido… idea mía» when a court case against the player is archived. Use (1) at weeks 312 and 416 is voiced by Raquel, although stage-s4 announced a new minister (Óscar) from week 209. |
| paco-estacion | mayor | yes | partial | The vote claim holds (+10 territorios). But Paco addresses the player as «Ministro», while the player is president of Tenfe (stage-s3: «Querido presidente de Tenfe»). The obligation hides two s1-critical costs: the blocked Nort… |
| fermin-convenio | workshop |  | partial | 6 % and 26 weeks are exact. The stated consequence «huelga de dos semanas» gives one: breakPact runs in step 6 of the close, after operation (R:1269), so strike = week+2 covers a single operated week (sim a3: closes 15 active, … |
| charo-contrato | treasury |  | partial | «Me lo devuelves con intereses»: the repayment is exactly the bonus received, with no interest (R:631). «Con auditoría»: flags.audit only makes the random «auditoria» event eligible (R:896, weight 2 inside a 20 %/week roll), so… |
| benito-cuadrilla | adif |  | coherent | Three months ≈ 12 weeks, free payroll and a fee at the end all match. Side issue: when the crew leaves, works it was on keep going (no crew check at close, R:1207-1222). |
| marisa-carta | riders |  | coherent | Exact for the full version. The cheaper card shows +12 while it gives +7 (see PACTS:carta-viajeros). |
| raquel-inauguracion | minister |  | partial | «Una obra, un andén» holds: the station counts. «Antes de las elecciones»: an offer after week 194 has a deadline past week 208. «Una ministra muy enfadada» (D:323): the minister grudge is never read anywhere (only «mayor» is r… |
| pedro-cohesion | president |  | partial | If a territory is already served when signing, the pact pays 3 M€ at the next close for nothing (sim a4: done in its first week, +2,56 M€ including operations). «Tren diario» = trains > 0; the weekly model has no frequency. |
| oscar-tuits | successor |  | coherent | 26 weeks ≈ 6 months and 3 finishes match. |
| inigo-noagresion | rival |  | partial | The feeder effect and «un año» hold. «Nadie tiene por qué enterarse»: the pact's corrupt:true (D:341) is never read, so signing adds no secret or suspicion. On a breach Íñigo leaks another secret if one exists, not the pact. Th… |
| paco-inaugura | mayor |  | coherent | The demand and vote effects match. Paco again says «Ministro» (see paco-estacion). |
| paco-sobre | mayor |  | partial | «Le arreglo los permisos» has no effect on the 1-week preps, which include the most common work (renovar). «Usted me arregla la comarca» creates no obligation and no tracked debt. |
| pact-done | minister |  | partial | The mechanics are right, but the speaker is always Raquel (minister): after week 209 (Óscar's term), for pacts with other people (Paco, Fermín, Charo, Benito, Marisa), and even for the secret pact with Íñigo, which a minister s… |
| pact-broken | treasury |  | coherent | Generic narrator line; the penalties listed in the text are applied (with the caveats noted per pact). |
| negotiate-ok | treasury |  | partial | True, but the player never sees the cheaper benefit. The active-pact card shows the original benefit for 5 pacts (paco, convenio, carta, cohesion, tuits; sim a8). Charo narrates negotiations she is not part of. |
| negotiate-no | rival |  | contradicts | Always spoken by Íñigo (rival, D:401), even when negotiating with Fermín, Charo, Marisa or Benito. «Dejarlo también tiene precio» is false for 8 of the 9 pacts. |
| ev-averia | workshop |  | partial | «Tres semanas» = 2 lost weeks; «vuelve la semana que viene» = no loss at all. The broken train is the worst one on the network, not one «en plena rampa». Separately, about 3,1 silent breakdowns per year (R:1203-1204; sim a6) ne… |
| ev-cable | adif |  | partial | The note «El Sur pierde 10 puntos de puntualidad dos semanas» (R:905) is the target change; the visible loss is about half and lasts about 4 weeks. Restricting it to an electrified Sur is right (the real Sur conventional line i… |
| ev-calor | riders |  | partial | The season is right. There is no train, no corridor and no A/C state: the event is a flat support tax. |
| ev-nevada | adif |  | partial | «El Norte pierde 15 puntos esta semana» (R:907) is the target change; the realised loss is −5,7 and it lingers for weeks. Pajares belongs to Asturias (León–Pola de Lena), which is often closed when the event mentions it. |
| ev-huelga | workshop |  | contradicts | The «+2 % de nómina» deal costs nothing and gives permanent support. «Aguantar» is exact. |
| ev-viral | riders |  | contradicts | In 12 passive 8-year games, all 120 viral events fired while the Teruel line had no service (sim a6). There is no inspector on a line that does not run. |
| ev-desprendimiento | adif |  | contradicts | «La vía está cortada» never happens with the crew option. The affected corridor is unknown when choosing and is drawn afterwards. A crew is conjured when none is free. A crash is possible. |
| ev-auditoria | treasury |  | partial | «Van a encontrar cosas» finds nothing concrete: no secret is exposed and no judicial step happens. The audit promised by the contrato-programa is only this random event. |
| ev-lowgo | rival |  | partial | No fare exists: «billetes a nueve euros» is not modelled (strength is abstract). It competes on the Mediterráneo even if the player never opened it. It is voiced by Íñigo, owner of Autocares Meseta (a coach company), not by Lowgo. |
| ev-fondos | president |  | coherent | It does exactly what it says. It is an unearned random gift (≈1,2/year, sim a6). |
| ev-visita | minister |  | partial | The receive branch matches the line. «Ministra mosqueada» has no effect: the minister grudge is never read. |
| ev-tuneles | riders |  | contradicts | The restriction it announces is never applied. It fires even if no BCBB ever went to Cantabria. |
| cor-comision | rival |  | obsolete | The numbers it states are the implemented ones (7 %; «sube un poco» = +10 %), but the line is unused. |
| cor-traviesas | adif |  | partial | The fraud costs Tenfe nothing: the work cost and the aid are unchanged, so the money appears from nowhere. The refusal consequence is not implemented. |
| cor-yate | rival |  | coherent | It matches the note. «Una propuesta de contrato» does not produce one (flavor). |
| cor-enchufe | minister |  | contradicts | «Tus obras irán algo más lentas» is false: they are not slower, they leave worse track. The refusal grudge does nothing. |
| cor-mariscada | workshop |  | coherent | The amounts match (90 k€). Odd but harmless: a management dinner pleases the workforce. |
| ext-inigo | rival |  | partial | The price is exact. «Fotos» exist only for the yacht. The secret threatened is the first unexposed one of any type (sim a5: «mariscada»). |
| ext-paco | mayor |  | contradicts | «Lo del sobre» is false unless an alcalde bribe exists. «Mi estación sale adelante» is not an option. |
| ext-benito | adif |  | partial | «Llamado del juzgado» holds (stage ≥ 1). «Me subes el sueldo» is a one-off payment, not a raise. Benito only asks if «traviesas» is first in the secrets array, which depends on order, not logic. |
| sc-traviesas | riders |  | partial | The mechanics are coherent, but «pagaste» is not true in the engine: Tenfe never paid for the phantom km (see cor-traviesas). |
| sc-yate | riders |  | contradicts | For «comision» the line describes a yacht with the Chinese maker even when the commission came from KAFKA, Dörfler, Trenespop or a works contractor and no yacht trip existed (sim a5: secrets ["comision"] → line sc-yate). |
| sc-enchufe | riders |  | coherent | Consistent with Borja damaging works (−3 track per finished work). |
| sc-mariscada | riders |  | coherent | Same amount as cor-mariscada. |
| sc-sobres | riders |  | partial | It always lists mayors, inspectors and MPs, whatever was actually bribed (it may only have been the union delegate). It is reused for the Autocares pact and for a derailment notice. The same secret can be hit again by the accid… |
| sc-juez | treasury |  | coherent | The line itself is consistent. The silent stage jump and the bribe text «es el final» are separate problems (BRIBES:juez). |
| sc-charo | treasury |  | coherent | Prosecution → preliminary proceedings is consistent. The stage change is silent. |
| jud-1 | treasury |  | coherent | Matches. |
| jud-2 | treasury |  | coherent | The weekly erosion is implemented. «Diputados» maps to economía and the vote (flavor). |
| jud-3 | president |  | coherent | Matches (comic disowning). |
| jud-end | president |  | coherent | Matches. |
| fin-impago | treasury |  | partial | Choices can do nothing: «Aplazar» with no active work leaves cash unchanged (sim a8), and «Recortar» with no corridor above 1 train only applies the penalties. The decision is consumed anyway. The rescue note «no cuenta para ga… |
| fin-quiebra | treasury |  | coherent | Matches. |
| fin-retirada | minister |  | partial | The mechanics match, but it is voiced by Raquel even when it happens after week 209 (Óscar's term). |
| el-forecast | president |  | coherent | Timing and page match. |
| el-win | president |  | coherent | Matches. |
| el-lose | president |  | coherent | Matches. |
| end-win | minister |  | partial | «Sin rescates» only covers the last two years (a week-100 rescue still wins, sim a8). Voiced by Raquel, who left in week 209. |
| end-partial | treasury |  | coherent | Covers the missing conditions: programme, ordinary result and rescues. |
| milestone | riders |  | coherent | Matches. |
| mega-done | president |  | coherent | Matches. |

## Decision objects with their own text

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| decision:causa-archivada | minister |  | contradicts | The written text is right; the voiced line is a stage-objective celebration by the minister. |
| decision:accidente | riders |  | partial | With one bribe the chance is 0,89 %/week forever: the accident can come years later (sim a8: 195 weeks), when no work was «recién certificada». It plays the Caso Sobres line twice, and no derailment happens on the network. |
| decision:pact-done-text | minister |  | coherent | Exact amounts. «La confianza de …» is not a state, so it is flavor. |
| decision:election-notice | president |  | coherent | State persists. |
| decision:review-notice | president |  | coherent | 208−182 = 416−390 = 26. |
| decision:scandal-choices | — |  | partial | «Cesar a Benito» is offered for scandals that have nothing to do with him (yacht, seafood, Charo, judge, nephew) and can be chosen repeatedly. Benito keeps speaking as Adif boss afterwards (ev-cable, ev-nevada, ev-desprendimien… |

## Pact cards

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| PACT:estacion-paco | mayor |  | partial | Cost, crew and 5 weeks hold, and «se lo cuenta» = grudge → −5 target and extortion. Hidden: the Norte work slot and −9 punctuality. Cheaper benefit mis-shown. |
| PACT:convenio | workshop |  | partial | The strike lasts 1 operated week, not 2 (sim a3). The cheaper card shows +10 instead of +5. A cut in the signing week is ignored. |
| PACT:contrato-programa | treasury |  | partial | «Devuelves lo cobrado de más» is exact (Σbonus). «Hacienda te audita» is only a chance. A loan taken earlier in the signing week breaks it (sim a8). |
| PACT:cuadrilla-adif | adif |  | coherent | All terms implemented. |
| PACT:carta-viajeros | riders |  | partial | Only the cheaper display is wrong. |
| PACT:inauguracion | minister |  | partial | The «ministra muy enfadada» grudge has no effect, and «de tu lado» is not a state. |
| PACT:cohesion | president |  | partial | It is fulfilled instantly when a territory is already served, and the cheaper amount is mis-shown. |
| PACT:tuits | successor |  | partial | Only the cheaper display is wrong. |
| PACT:no-agresion | rival |  | partial | «Lo que sabe de ti» = the first unexposed secret, or «pacto» with the sobres line. corrupt:true is never read. |

## Bribes

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| BRIBE:alcalde | mayor |  | partial | Math.round(1 × 0,5) = 1, so renovar, apartaderos and apeadero (1-week prep) gain nothing; señalización 2→1; electrificar 3→2 (sim a3). |
| BRIBE:inspector | adif |  | partial | The first effect is exact. The risk is permanent until the accident happens, and the accident is not tied to the certified work (see decision:accidente). |
| BRIBE:periodista |  |  | coherent | Exact. |
| BRIBE:diputados | president |  | coherent | Exact. |
| BRIBE:sindicato | workshop |  | partial | «Desconvoca huelgas» (plural) covers only the running one; a huelga event can fire the following week. |
| BRIBE:juez |  |  | contradicts | «Es el final» is false: you land in oral trial (stage 3) and can still survive. |
| BRIBE:tijera | treasury |  | partial | The 75 % failure fits «incorruptible», but the effect text never says what success gives (+1,4 M€). |

## Headlines

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| HEADLINE:late-1 | La Gaceta del Raíl |  | partial | Shown when the network average punctuality < 70 (R:1299-1300), not the Norte's. |
| HEADLINE:late-2 | La Gaceta del Raíl |  | partial | Norte-specific and a «récord» claim; no delay-minutes or record is tracked. |
| HEADLINE:late-3 | La Gaceta del Raíl |  | flavor | Palencia diary joke. |
| HEADLINE:good-1 | La Gaceta del Raíl |  | partial | Shown when the network average > 82, whatever the Norte's punctuality. |
| HEADLINE:good-2 | La Gaceta del Raíl |  | partial | «Récord de viajeros» is not tracked; Valladolid is on the Norte. |
| HEADLINE:good-3 | La Gaceta del Raíl |  | partial | «Aprueba por primera vez desde 2009» can repeat every good week. |
| HEADLINE:broke-1 | La Gaceta del Raíl |  | coherent | Pushed when cash < 0 (R:1295). |
| HEADLINE:broke-2 | La Gaceta del Raíl |  | flavor | No auditor/interventor mechanic, but plausible. |
| HEADLINE:broke-3 | La Gaceta del Raíl |  | flavor | Joke. |
| HEADLINE:works-1 | La Gaceta del Raíl |  | contradicts | Says works are ongoing («cuando acaben») but is shown in a week when a work FINISHED (R:1300). |
| HEADLINE:works-2 | La Gaceta del Raíl |  | partial | Implies bus replacement, shown at completion and whatever the mode. |
| HEADLINE:works-3 | La Gaceta del Raíl |  | coherent | Shown when a work finished. |
| HEADLINE:corruption-1 | La Gaceta del Raíl |  | obsolete | Never shown: the only corruption push passes its own text (R:809). |
| HEADLINE:corruption-2 | La Gaceta del Raíl |  | obsolete | Never shown (R:809). |
| HEADLINE:corruption-3 | La Gaceta del Raíl |  | obsolete | Never shown (R:809). |
| HEADLINE:rival-1 | La Gaceta del Raíl |  | flavor | Shown with Lowgo active, 70 ≤ punctuality ≤ 82, 30 % (R:1300). |
| HEADLINE:rival-2 | La Gaceta del Raíl |  | flavor | Autocares Meseta is not s.rival (Lowgo); harmless. |
| HEADLINE:rival-3 | La Gaceta del Raíl |  | flavor | Joke. |
| HEADLINE:quiet-1 | La Gaceta del Raíl |  | partial | «Semana tranquila» is chosen by punctuality only, even in weeks with breakdowns or incidents. |
| HEADLINE:quiet-2 | La Gaceta del Raíl |  | flavor | Joke. |
| HEADLINE:quiet-3 | La Gaceta del Raíl |  | flavor | Joke. |

## Event-specific Gaceta texts

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| GACETA:custom | La Gaceta del Raíl |  | coherent | Each is pushed by the exact action it reports. |

## Stage texts (never displayed)

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| STAGE:s1-goal | — |  | obsolete (claim: yes) | Never displayed. Claim check: coherent claim; the voiced line stage-s1 says the same. |
| STAGE:s1-dilemma | — |  | obsolete (claim: yes) | Never displayed. Claim check: «Un tren nuevo tarda cuatro semanas»: KAFKA 4 weeks; an extra train on bad track barely helps (sim a1). |
| STAGE:s2-goal | — |  | obsolete (claim: partly) | Never displayed. Claim check: «conserva una reserva de caja de 3 M€» is only checked at week 52 (R:1114). |
| STAGE:s2-dilemma | — |  | obsolete (claim: yes) | Never displayed. Claim check: 2 own crews, renovar needs 1 each (D:95; R:49). |
| STAGE:s3-goal | — |  | obsolete (claim: partly) | Never displayed. Claim check: The election date matches (week 208 = 23 Dec 2030, sim a1), but the stage pass checks only the accounts (R:1116). |
| STAGE:s3-dilemma | — |  | obsolete (claim: yes) | Never displayed. Claim check: Territory corridors lose money but pay TERRITORY_OSP 0,6/quarter and +10 territorios each (R:274-276, 1016). |
| STAGE:s4-goal | — |  | obsolete (claim: partly) | Never displayed. Claim check: «60 % de los viajeros» is an unweighted mean of shares, and a closed Mediterráneo counts as 100 % lost (R:1071). |
| STAGE:s4-dilemma | — |  | obsolete (claim: yes) | Never displayed. Claim check: Coverage vs profitable services is a real trade-off in the model. |
| STAGE:s5-goal | — |  | obsolete (claim: yes) | Never displayed. Claim check: Five corridors ≥ 85 % over 12 weeks; rescues from week 313; election 18 Dec 2034 (sim a1). |
| STAGE:s5-dilemma | — |  | obsolete (claim: yes) | Never displayed. Claim check: Flavor-level trade-off: track decay and wear (R:1198, 1202) vs new works. |
| STAGE:s1-obstacle-1 | — |  | obsolete (claim: yes) | Not shown. Claim check: Norte track 44 % (D:27), maintenance slider 100 %. |
| STAGE:s1-obstacle-2 | — |  | obsolete (claim: no) | Not shown. Claim check: No segment model: the Norte has one track value (see t-3). |
| STAGE:s1-obstacle-3 | — |  | obsolete (claim: yes) | Not shown. Claim check: 4 trains: Norte 2, Levante 1, Sur 1 (R:64). |
| STAGE:s1-obstacle-4 | — |  | obsolete (claim: yes) | Not shown. Claim check: 2,5 M€ suppliers in week 5 and 2,0 M€ debt in week 13 (R:43-45). |
| STAGE:s2-obstacle-1 | — |  | obsolete (claim: yes) | Not shown. Claim check: crews.own = 2 (R:49). |
| STAGE:s2-obstacle-2 | — |  | obsolete (claim: partly) | Not shown. Claim check: Track 66/64 holds; «catenaria cansada» is not modelled (only a boolean elec). |
| STAGE:s2-obstacle-3 | — |  | obsolete (claim: partly) | Not shown. Claim check: The reserve is checked only at week 52. |
| STAGE:s3-obstacle-1 | — |  | obsolete (claim: yes) | Not shown. Claim check: Per-corridor net shown on the corridor sheet (UI:185). |
| STAGE:s3-obstacle-2 | — |  | obsolete (claim: yes) | Not shown. Claim check: Territorios group target rows (R:1016). |
| STAGE:s3-obstacle-3 | — |  | obsolete (claim: yes) | Not shown. Claim check: ELECTIONS [208, 416] (D:8). |
| STAGE:s4-obstacle-1 | — |  | obsolete (claim: partly) | Not shown. Claim check: Lowgo on levante, sur, mediterraneo (R:1278), whether or not the Mediterráneo is the player's. |
| STAGE:s4-obstacle-2 | — |  | obsolete (claim: yes) | Not shown. Claim check: Territory track 28-40 % (D:48-58) vs opening minimum 40 % (R:451). |
| STAGE:s4-obstacle-3 | — |  | obsolete (claim: yes) | Not shown. Claim check: Generic. |
| STAGE:s5-obstacle-1 | — |  | obsolete (claim: yes) | Not shown. Claim check: Track decay and train wear every week (R:1198, 1202). |
| STAGE:s5-obstacle-2 | — |  | obsolete (claim: partly) | Not shown. Claim check: Half-finished works: −6 track and −3/−3 support once (R:417); flags[«halfwork-»] is never read. |
| STAGE:s5-obstacle-3 | — |  | obsolete (claim: yes) | Not shown. Claim check: Rescues counted from week 313 (R:1073). |

## Programme

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| PROGRAM:p-norte | — |  | coherent | Set once when Norte punctuality ≥ 80 at any close; it stays done even if the Norte falls back. |
| PROGRAM:p-esenciales | — |  | coherent | All three ≥ 80 at a close. |
| PROGRAM:p-cuentas | — |  | coherent | 26-week average ordinary ≥ 0. |
| PROGRAM:p-territorios | — |  | coherent | ≥ 2 territories open with trains. |
| PROGRAM:p-cinco | — |  | coherent | ≥ 5 corridors with a 12-week average ≥ 85 and trains. |
| PROGRAM:p-mega | — |  | coherent | Any non-vanity megaproject completed. |

## Milestone notices

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| MILESTONE:m1 | riders |  | coherent | All four exist. |
| MILESTONE:m2 | riders |  | coherent | Essentially true. |
| MILESTONE:m3 | riders |  | coherent | All exist. |
| MILESTONE:m4 | riders |  | partial | Half of the unlock does not exist. |
| MILESTONE:m5 | riders |  | notImplemented | No plaque object, reward or display exists. |

## Other on-screen claims

| id | speaker | rec | verdict | why (short) |
|---|---|---|---|---|
| other:tech-app | — |  | contradicts | Sign error: the tech RAISES staff costs by 15 %. |
| other:tech-bimodo | — |  | partial | «Fallan menos» is not implemented. |
| other:tech-prensa | — |  | partial | Half of the claim has nothing to act on. |
| other:tech-predictivo | — |  | partial | The visible breakdown is unaffected. |
| other:work-electrificar | — |  | partial | Reliability is unchanged, and «adiós al gasóleo» happens without changing the fleet. |
| other:mega-ctc-3 | — |  | notImplemented | 2,2 M€ and 2 crews for nothing. |
| other:train-compat | — |  | notImplemented | This contradicts the user's realism requirement, and it is what makes ev-tuneles toothless. |
| other:corridor-km-and-layers | — |  | contradicts | The layers display gauges and voltages that the conventional corridors do not have. |
| other:extremadura-elec | — |  | partial | Real: Plasencia–Cáceres–Mérida–Badajoz is 25 kV (209 km) and Madrid–Talavera–Plasencia is diesel (268 km) (segments.json). «Electrificar Extremadura» is really «electrificar Madrid–Plasencia». |
| other:weekly-report | — |  | notImplemented | Things happen that the player never hears about, which is «pulsar random». |
| other:crews-bound | — |  | partial | The requirement is decoration (also noted in rescue.md E.1 #33). |
| other:accelerate | — |  | partial | Two different rules behind the same word. |
| other:insurance | — |  | partial | «Anual» but paid once. |
| other:hidden-texts | — |  | obsolete | Not shown. Several of them announce mechanics that do not exist: old catenary in the heat, tunnels that do not fit. |
| other:territory-cantabria | — |  | partial | The pitch promises a constraint that does not exist. |
