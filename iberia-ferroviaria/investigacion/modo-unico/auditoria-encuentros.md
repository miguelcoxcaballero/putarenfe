# Audit: the 315 classic encounters in the unified mode

Machine-readable version: `audit-encounters.json` (same folder). It holds every opener, topic line, retired combo and the selection rules, plus a 315-row `bodies` table. Generator: `enc/gen.mjs` (reads `proyecto/dist/encounters.js` and checks that every rebuilt body equals the shipped one). This audit is read-only: nothing in the repo was changed.

## 1. Verdict

- **Today every encounter is "pulsar random".**
  - Person, mood and topic all come from one index, `ENCOUNTERS[(encounterCount*137 + seed%315) % 315]`, every 3 months (`tycoon.js:158`). Nothing reads the game state.
  - The choices only move abstract numbers (`encounters.js:24-30`).
  - The two flags do almost nothing the lines promise. `hype` is AVE demand ×1.1 (`engine.js:53`); no fare is cut and no pilot runs. `fleetcare` adds +8 condition to every lot at once (`engine.js:167`); no train is targeted.
- **Classification of the 315 bodies in the current game:** 0 coherent, 126 partial, 140 not implemented, 49 contradicting, 0 flavour, 0 obsolete.
  - Contradicting: topic 0 for 7 speakers. Its premise was false in 113 of 113 sampled showings.
  - Not implemented: topics 3 and 4, plus topic 0 for Benito and Fermín.
  - Partial: topics 1 and 2.
- **Unified mode:** keep all 315 rows (catalogue, SHA and listening room are frozen). Select a body only when its opener (63 predicates) **and** its topic line (45 predicates) are true, and give every choice a real, visible, timed effect. Retire 5 bodies that can never be true. 17 groups depend on mechanics the unified engine must keep or add (§7.2). 9 combos are only true in narrow windows that the selector must respect (§7.3).

## 2. How encounters work today (classic campaign and free mode)

### 2.1 Trigger and display

- tycoon.tick() runs at the end of engine.step() after s.month++ (engine.js:216, 234). If no scene is pending and s.month%3===0 it sets t.encounter = ENCOUNTERS[(t.encounterCount*137 + (s.seed%315))%315] (tycoon.js:158). First scene: month 3.
- CORRECTION to classic.md §3.11: s.seed is the live LCG state advanced by every random() call (engine.js:28), so the index is pseudo-random, not a fixed permutation. Simulated passive campaigns (5 seeds, scratchpad/unify/enc/sim2.mjs) showed repeats: 73-85 scenes per game, 65-75 unique, max 3 plays of one body; seed 72022 (sim.mjs) plays scene-adif-disappointed-2 at months 27 and 60 and scene-rival-surprised-3 at months 63 and 75.
- pendingDecision (engine.js:155): campaign = dated DECISIONS first, then the random event, then the encounter; free mode = event, then encounter. A pending scene blocks step() (engine.js:209) and startDay() (operations.js:145: "Resuelve primero el consejo de dirección").
- Shown by showDecision (app.js:1171-1176) with the mood portrait, kicker "Consejo de dirección", title TOPICS[k]; a choice is disabled when cash < its cost.
- decide (engine.js:175-178): applyEffects (engine.js:163-173) then s.tycoon.encounter=null and groups[c.group] += c.trust clamped 0-100; logs title + label.

- **Structure:** 9 people × 7 moods × 5 topics; body = MOOD[person][moodIndex] + " " + LINES[person][topic] (encounters.js:3-23, 31); 315 unique bodies, ids scene-<person>-<mood>-<k> (encounters.js:31).
- **Options:** Choices depend on the topic only (OPTIONS[k], encounters.js:24-30); the same two buttons for all 9 speakers. detail text is generated from the abstract effects (encounters.js:31).

### 2.2 Mood versus state

Person, mood and topic are all chosen by the index; nothing reads state. Simulation (sim.mjs, seed 72022, always choosing option A): month 30 treasury angry «¡No sale, pedazo de manirroto!» with cash 452.6 M€ and the month closing +0.93 M€; month 102 treasury proud «He cuadrado tus cuentas» with last net −3.6 M€/month and cash fallen from 404.8 (month 39) to 62.1 M€; month 105 rival disappointed with no bus campaign running; minister (Raquel Sanz) and successor (Óscar del Puente) alternate as Transport minister (minister at months 33 and 117, successor at 84-93). Over 620 sampled scenes (sim3.mjs, 8 seeds) 20 had Charo happy/proud/surprised while the month closed negative.

### 2.3 Are the topic premises true?

Sampled 620 scenes over 8 passive campaigns (sim3.mjs): topic-0 premise (drivers short) true 0/113 times shown — staffing stays 1 because the game starts with 180 drivers vs need 29 = ceil(Σ daily trains × 0.55) (tycoon.js:11-13); it only drops below 1 if the network grows past ≈327 daily trains without hiring; topic-2 premise (a lot below 45 %) true 0/138; OuiOui present 620/620 (Barcelona routes from month 0, tycoon.js:20-24); YaIré in war phase 376/620; Autocares Meseta bus price war 204/620 (33 %) — so rival «He puesto una oferta obscena» is false ⅔ of the time; topic 3 has no station/staff model at all; topic 4 never touches research.

### 2.4 Flags

- **hype:** Set by topic 1 A (3 months) and topic 4 A (2 months) as s.flags.hype = s.month + months (engine.js:167); read only by metrics(): AVE-family demand ×1.1 while flags.hype > month (engine.js:53). No effect on Alvia routes, never shown in the UI, and it overwrites a longer running hype (e.g. the 6-month influencer event, story.js:53) with a shorter one. Neither a discount nor a pilot actually happens.
- **fleetcare:** +8 condition to every fleet lot immediately (engine.js:167), clamped to 100, never stored. For 2 M€ it restores all ~80 units (6 initial lots, engine.js:24) while a refit costs 12 % of the unit price per unit (engine.js:112) — an exploit; it does not target the train the line talks about.

Other effects: Topic 0 does not hire or cover drivers (hire() tycoon.js:16 and the trip cut in operations.js:131-132 are unrelated); topic 3 changes no station; topic 4 does not start or discount research (research() tycoon.js:17); trust changes decay at 4 %/month toward targets (tycoon.js:162-163); satisfaction regresses 16 %/month (engine.js:213). Rival topic 1 ignores the rivals switch of free mode (tycoon.js:19).

### 2.5 Count per body (current game)

| Category | Bodies | Which |
|---|---:|---|
| coherent | 0 | none: every opener is random |
| partial | 126 | topic 1 (63) and topic 2 (63) |
| notImplemented | 140 | topic 3 (63), topic 4 (63), adif and workshop topic 0 (14) |
| contradicts | 49 | topic 0 for president, minister, successor, treasury, riders, mayor, rival |
| flavor / obsolete | 0 / 0 | — |

## 3. Ground rules for the unified mode

- **Voice:** Each body has one complete recording keyed by clipId(person, speechText(body)); bodies, persons, moods, ids and ENCOUNTERS order are frozen (catalogue SHA, constraints.md §0). Retiring = never selecting; the 315 stay in the catalogue and the listening room.
- **Timeline:** the rescue calendar: 416 weekly turns from 4 January 2027, elections at weeks 208 and 416 (`rescate-data.js:8`).
  - Raquel Sanz (minister) holds Transport up to week 208. Óscar del Puente (successor) holds it from week 209. The rescue pact windows already do this (`rescate.js:686`).
- **Openers:** every mood opener has a predicate on facts the engine computes anyway (§4). Openers that make a factual claim are true only when that fact happened. Attitude openers still need a matching mood.
- **Topic lines:** every topic line has a predicate and an instance: the concrete train, station, corridor, tech or rival it talks about (§5). Both choices change the game in a way that makes the line and the choice label true, for a stated number of weeks, and the player can see it afterwards.
- **Selector:** at most one scene per eligible week. It plays only when opener, topic and feasibility are all true, and it re-validates before display (§6).
- **No filler:** if nothing qualifies, nothing plays.

## 4. The 63 mood openers

Claim type: **factual** = asserts something that happened or is the case («He cuadrado tus cuentas», «Ha venido gente al pueblo», «La cuadrilla ha terminado»). **mixed** = attitude anchored to a fact. **attitude** = pure stance, which still needs a state that justifies the mood.
Tier and window: **event** = fired by something this week or within *window* weeks; **recent** = something in the last *window* weeks; **state** = a standing condition.

Totals: 48 factual, 11 mixed, 4 attitude.

### Pedro Sancho (Presidente)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Hoy hasta los sondeos sonríen. No lo jodas.» | factual | state | Election forecast ≥52 % and up ≥1 point in 4 weeks.<br>`F.poll >= 52 && F.pollDelta4 >= 1` | rescate.js:1029-1038 |
| angry | «Director, he vendido los retrasos como una redistribución del tiempo libre. No me obligues a defender otra gilipollez.» | factual | state | Network punctuality (4-week mean) below 75 and government trust below 45.<br>`F.punctNet4 < 75 && F.trust.gobierno < 45` | rescate.js:1150-1155; tycoon.js:162 |
| worried | «Como esto reviente, no pienso salir yo en la foto.» | mixed | state | A real, visible risk: projected cash negative, open court case, stage objective off-track with ≤6 weeks, or election ≤26 weeks away with poll <52.<br>`F.cashMin13 < 0 \|\| F.cloacas.stage >= 1 \|\| (F.stageGoalOffTrack && F.weeksLeftStage <= 6) \|\| (F.weeksToElection <= 26 && F.poll < 52)` | rescate.js:135-147; rescate.js:862-885; rescate.js:1058-1077 |
| proud | «He vuelto a demostrar que soy imprescindible. De nada.» | mixed | recent · 4 sem | Stage passed, milestone, election won, EU aid cashed or his pact fulfilled in the last 4 weeks, with government trust ≥50.<br>`(F.stagePassed(4) \|\| F.milestone(4) \|\| F.electionWon(4) \|\| F.aidPaid(4) \|\| F.pactFulfilled(4,'president')) && F.trust.gobierno >= 50` | rescate.js:1112-1127; rescate.js:1261-1263 |
| surprised | «¿Eso lo habéis conseguido sin una comisión? Me dejas tieso.» | factual | event · 2 sem | A work or mega stage finished ≤2 weeks ago without kickback. Prefer it when the player has taken kickbacks before (it is the joke).<br>`F.workFinished(2).some(w => !w.kickback)` | rescate.js:349 (kickback field); rescate.js:1218 |
| disappointed | «Confié en ti. Tampoco era mi primera mala decisión.» | mixed | recent · 4 sem | A stage failed, a government pact broke or government trust fell ≥10 in 8 weeks.<br>`F.stageFailed(4) \|\| F.pactBroken(4,['president','minister','successor']) \|\| F.contractLost(4) \|\| F.trustDelta8.gobierno <= -10` | rescate.js:1112-1127; rescate.js:621-638 |
| determined | «Vamos a sacarlo adelante aunque tenga que arrastrar a medio gabinete.» | attitude | attitude | A goal is still achievable but tight (stage 4-13 weeks left, mega active or election within a year) and he still backs you.<br>`((F.stageGoalOpen && F.weeksLeftStage >= 4 && F.weeksLeftStage <= 13) \|\| F.megaActive \|\| F.weeksToElection <= 52) && F.trust.gobierno >= 40` | rescate-data.js:252-273 |

### Raquel Sanz (Ministra, semanas 1-208)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Mira qué bien: una mañana sin ruedas de prensa de mierda.» | factual | state | No report events for 2 weeks (rescue incidentFree), no event/scandal decision and network punctuality ≥80.<br>`F.incidentFreeWeeks >= 2 && !F.eventDecision(2) && F.punctNet >= 80` | rescate.js:1274 |
| angry | «¡Estoy hasta el moño de inaugurar tus excusas!» | factual | recent · 13 sem | ≥2 of: failed tests, work delay, delivery delay, work stalled for cash, work cancelled, missed inauguration deadline — in 13 weeks; government trust <45.<br>`F.excuses13 >= 2 && F.trust.gobierno < 45` | rescate.js:1210, 1215, 403-419 |
| worried | «Me están llamando de Moncloa. Coge tú, valiente.» | factual | state | Government trust <40, poll <50, the President was last heard angry/disappointed/worried ≤8 weeks ago, or a strike/scandal/insolvency decision is pending.<br>`F.trust.gobierno < 40 \|\| F.poll < 50 \|\| (['angry','disappointed','worried'].includes(F.lastMood.president) && F.week - F.lastMoodWeek.president <= 8) \|\| F.crisisPending` | rescate.js:1029-1038 |
| proud | «Esto lo he peleado yo mientras tú calentabas la silla.» | factual | event · 2 sem | EU aid paid, Brussels funds, OSP bonus, her pact fulfilled or a stage passed in the last 2 weeks.<br>`F.aidPaid(2) \|\| F.eventHappened('fondos',2) \|\| F.ospBonus(2) \|\| F.pactFulfilled(2,'minister') \|\| F.stagePassed(2)` | rescate.js:1261-1263; rescate.js:957 |
| surprised | «No me jodas, ¿ha salido a la primera?» | factual | event · 2 sem | A work commissioned ≤2 weeks ago without failed tests/delay/pause, or a corridor opened ≤2 weeks ago already ≥80 %.<br>`F.workFirstTry(2) \|\| F.corridorOpened(2).some(c => F.punct[c] >= 80)` | rescate.js:1215, 1218 |
| disappointed | «Tanto plan estratégico para acabar haciendo el canelo.» | mixed | recent · 4 sem | Stage failed, pact broken, work cancelled or mega stage stalled for cash in 4 weeks.<br>`F.stageFailed(4) \|\| F.pactBroken(4) \|\| F.workCancelled(4) \|\| F.megaStalled(4)` | rescate.js:408-420, 1226 |
| determined | «Se acabó marear expedientes. Hoy se firma y se trabaja.» | mixed | attitude | In the last 13 weeks an offer expired unanswered or "Pedir otra evaluación" was chosen; the scene itself is the thing to sign.<br>`F.dithered13 && F.trust.gobierno >= 35` | rescate.js:681-688 |

### Óscar del Puente (Ministro, semanas 209-416)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Hoy el tren corre más que mis respuestas en redes.» | factual | state | Network punctuality ≥88 and no incident this week.<br>`F.punctNet >= 88 && F.incidents(0) === 0` | rescate.js:1150-1155; rescate.js:1274 |
| angry | «¡El siguiente que diga incidencia puntual se va andando!» | factual | recent · 4 sem | ≥3 incidents in 4 weeks, or ≥2 on the same corridor.<br>`F.incidents(4) >= 3 \|\| F.maxIncidentsOneCorridor(4) >= 2` | rescate.js:1203-1215 |
| worried | «Como esto se filtre, mañana desayuno titulares.» | factual | state | An unexposed corruption secret, tests skipped by bribe, a train in service below 25 % or a half-built cancelled work.<br>`F.secretsHidden > 0 \|\| F.skipTestsUsed8 \|\| F.minServiceCond < 25 \|\| F.halfWork` | rescate.js:799-816, 1214, 417 |
| proud | «Me guardo esta victoria para restregársela al de enfrente.» | factual | event · 2 sem | Stage/milestone/election won, a corridor reaches 85 % for the first time, or OuiOui share falls below 40 % after being above 50 %, in 2 weeks.<br>`F.stagePassed(2) \|\| F.milestone(2) \|\| F.electionWon(2) \|\| F.firstTime85(2) \|\| F.lowgoBeaten(2)` | rescate.js:1112-1127 |
| surprised | «¿Cómo que funciona? Mira otra vez, que me estás asustando.» | factual | recent · 4 sem | A chronically bad corridor recovered (see problemSolved4) or a work commissioned first time.<br>`F.problemSolved4 \|\| F.workFirstTry(2)` | rescate.js:1195 |
| disappointed | «No has gestionado una red: has aparcado problemas.» | factual | state | ≥3 obstacles alive for ≥8 weeks with no order addressing them.<br>`F.obstaclesAged(8) >= 3` | rescate.js:1079-1101 |
| determined | «Vamos a poner orden. Y al que estorbe, que se aparte.» | attitude | attitude | First 26 weeks in office, or ≥2 severity-3 obstacles.<br>`(F.week - 208 <= 26 \|\| F.seriousObstacles >= 2) && F.trust.gobierno >= 35` | rescate.js:686 |

### Charo Tijera (Hacienda)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Soy Charo. Hoy no he traído la tijera grande. Aprovecha.» | mixed | state | Projected cash never below 3 M€ in 13 weeks (the s2 floor), non-negative ordinary result, Hacienda trust ≥50.<br>`F.cashMin13 >= 3 && F.ord8 >= 0 && F.trust.hacienda >= 50` | rescate.js:135-147; rescate-data.js:380 |
| angry | «¡No sale, pedazo de manirroto! Sumar no es una ideología.» | factual | state | The 13-week projection goes negative (the red top-bar warning) and ≥0.5 M€ of discretionary spend in 4 weeks.<br>`F.cashMin13 < 0 && F.spend4 >= 0.5` | rescate.js:135-147; rescate-ui.js:279-289 (Finanzas minimum flag, 13 weeks) |
| worried | «He visto la caja y se me ha cortado hasta el café.» | factual | state | Exactly the rescue "cash" obstacle (non-work payments in 4 weeks > 60 % of cash and > 0.5 M€), or cash <1.5 M€.<br>`(F.due(4) > 0.6 * F.cash && F.due(4) > 0.5) \|\| F.cash < 1.5` | rescate.js:1094-1096 |
| proud | «He cuadrado tus cuentas. Un milagro y dos úlceras.» | factual | event · 1 sem | At a quarter close: the quarter’s ordinary result is ≥0 after a negative one, or the contrato-programa quarter was met.<br>`(F.isQuarterClose && F.ordQ >= 0 && F.ordQprev < 0) \|\| F.pactQuarterMet('contrato-programa')` | rescate.js:35, 1245-1249; rescate-data.js:302-307 |
| surprised | «¿Dinero sin gastar? ¿Estás enfermo o se te ha roto el boli?» | factual | state | Cash ≥6 M€, ≥4 M€ free after 13 weeks of payments, no work or mega running and nothing spent in 4 weeks.<br>`F.cash >= 6 && F.cash - F.due(13) >= 4 && F.worksActive === 0 && !F.megaActive && F.spend4 === 0` | rescate.js:122-133 |
| disappointed | «Te di un presupuesto, no una licencia para hacer el gilipollas.» | factual | recent · 4 sem | Cancelled work with penalty, acceleration surcharge, vanity stage, bribe from caja A or loan with negative result, in 4 weeks.<br>`F.misuse4 && F.trust.hacienda < 55` | rescate.js:380-419, 550, 769-793 |
| determined | «Aquí se paga lo que toca. El confeti te lo compras tú.» | mixed | attitude | A scheduled payment falls in ≤2 weeks and a discretionary item is active/offered (discount, pilot, inauguration pact, monument).<br>`F.due(2) > 0 && F.discretionaryOnTable` | rescate.js:42-47 (scheduled payments) |

### Benito Balasto (Adif, obras)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «La cuadrilla ha terminado y nadie ha soltado una estupidez. Récord.» | factual | event · 0 sem | A work entered commissioning THIS week; no scandal, no acceleration and no impossible deadline in 4 weeks.<br>`F.workFinished(0).length > 0 && !F.scandal(4) && !F.accelerated(4) && !F.infeasiblePromise` | rescate.js:1218-1219 |
| angry | «¡Baja al tajo a decir esa gilipollez sin zapatos de charol!» | factual | recent · 2 sem | Work accelerated ≤2 weeks ago or a pact/contract deadline earlier than the work can finish.<br>`F.accelerated(2) \|\| F.infeasiblePromise` | rescate.js:380-391; rescate-data.js:320-337 |
| worried | «He visto el terreno. El terreno no ha leído tu calendario.» | factual | event · 0 sem | A delay was applied to an active work this week (tests failed, or the NEW terrain/winter rule: mountain segments in woy 48-8).<br>`F.workDelayedNow` | rescate.js:1215 |
| proud | «Esto está bien hecho. Puedes sacar la cinta sin hacer el ridículo.» | factual | event · 2 sem | A work commissioned ≤2 weeks ago whose tests were not skipped by the inspector bribe (track ≥85 if it was a renewal).<br>`F.workFinished(2).some(w => !w.testsSkipped && (w.type !== "renovar" \|\| F.track[w.corridor] >= 85))` | rescate.js:1214-1218 |
| surprised | «¿El plano coincide con la obra? Hoy viene algo gordo.» | factual | event · 0 sem | This week an electrification, signalling or ≥2-crew mega stage enters its test phase on or ahead of schedule, or a mega final stage starts.<br>`F.bigWorkMilestone` | rescate.js:1216-1217, 731-753 |
| disappointed | «Otra promesa encima del barro. Me cago en el folleto.» | factual | recent · 2 sem | A pact/contract/campaign signed ≤2 weeks ago while a work is behind schedule, and it is at least the second one in 26 weeks; or a work was abandoned half-built ≤8 weeks ago.<br>`(F.promisesOnMud(2) >= 1 && F.promisesOnMud(26) >= 2) \|\| F.halfWorkRecent(8)` | rescate.js:417 |
| determined | «Las vías no se ponen con discursos. Dame medios y aparta.» | factual | state | No free crew and an open corridor with track <50 and no work.<br>`F.crewsFree === 0 && F.trackNeed` | rescate.js:1093 |

### Fermín Bogie (talleres)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Hoy los trenes suenan a tren, no a cubo de tornillos.» | factual | state | Average condition ≥75, no breakdown in 4 weeks and no service train below 45.<br>`F.fleetAvg >= 75 && F.breakdowns(4) === 0 && F.low45 === 0` | rescate.js:1089, 1201-1205 |
| angry | «¡Ese cacharro no sale del taller, aunque te pongas como un energúmeno!» | factual | state | A train in revision/breakdown with ≥1 week left whose corridor is left without trains or overcrowded.<br>`F.inShop.some(t => t.weeks >= 1 && (F.trainsOn(t.back) === 0 \|\| F.load[t.back] > 1.05))` | rescate.js:1172-1177 |
| worried | «Ese ruido no me gusta un pelo. Y mira los que me quedan.» | factual | state | A service train below 45 % and at most one spare unit.<br>`F.low45 >= 1 && F.spare <= 1` | rescate.js:1089, 120 |
| proud | «Lo hemos dejado fino. Ya puedes colgarte tú la medalla.» | factual | event · 2 sem | A train returned from revision (95 %) or refit in the last 2 weeks.<br>`F.returned2.length >= 1` | rescate.js:1174-1176 |
| surprised | «¿Repuestos antes de la avería? ¿Quién eres y qué has hecho con el director?» | factual | recent · 4 sem | Preventive revision of a train ≥45 % or fleet slider >1 in 4 weeks, after at least one breakdown in 26 weeks. Owning the predictivo tech alone does not count: the line praises a decision of the director.<br>`F.preventive4 && F.breakdowns(26) >= 1` | rescate.js:470-480 |
| disappointed | «Te avisé. Pero claro, qué sabrá el del mono de grasa.» | factual | event · 0 sem | A breakdown this week of a train he warned about ≤13 weeks ago.<br>`F.breakdowns(0).some(t => F.warned[t] && F.week - F.warned[t] <= 13)` | rescate.js:1203-1204 |
| determined | «Se acabaron las chapuzas. O se arregla bien o no se mueve.» | mixed | recent · 4 sem | A train broke twice in 13 weeks or a quick fix failed again within 8 weeks.<br>`F.repeatBreakdown13 \|\| F.fixFastRepeat` | rescate.js:941, 1175 |

### Marisa Andén (viajeros, Norte)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Hoy he llegado a mi hora. Casi me da un pasmo.» | factual | event · 1 sem | Norte ≥85 this week after an 8-week mean <80. Marisa rides the Norte (rescue line t-2).<br>`F.punct.norte >= 85 && mean(F.punctHist.norte, 8) < 80` | rescate-data.js:372; rescate.js:1195 |
| angry | «¡Vete tú a esperar tres horas de pie, caradura!» | factual | event · 2 sem | A major disruption in 2 weeks on a corridor that is full, on strike or without trains.<br>`F.majorDisruption2 && (F.load[F.disruptedCorridor] >= 1 \|\| F.strike \|\| F.trainsOn(F.disruptedCorridor) === 0)` | rescate.js:944-954 |
| worried | «No me prometas nada que luego tengo que explicárselo a mi jefe.» | mixed | state | Norte below 75 % (4-week mean) while a promise to riders is open.<br>`mean(F.punctHist.norte,4) < 75 && (F.pactActive('carta-viajeros') \|\| F.workOn('norte') \|\| F.announcement(4))` | rescate-data.js:314-319 |
| proud | «Os hemos hecho escuchar. A base de protestar, porque por educación ni caso.» | factual | recent · 4 sem | Riders trust was <40 within 8 weeks and a concession happened in 4 weeks.<br>`min(F.trustHist.viajeros, 8) < 40 && F.riderConcession4` | rescate.js:1000-1027 |
| surprised | «¿Una solución de verdad? Espera, que le hago una foto.» | factual | recent · 4 sem | A chronic problem was solved (see problemSolved4).<br>`F.problemSolved4` | rescate.js:1195 |
| disappointed | «Otra vez nos tomáis por gilipollas con billete.» | factual | recent · 4 sem | An affront in 4 weeks and at least the second in 26 weeks.<br>`F.riderAffront4 && F.riderAffronts26 >= 2` |  |
| determined | «No nos movemos de aquí hasta tener una respuesta decente.» | mixed | attitude | Riders trust <35 and the same problem (corridor <70, overcrowding ≥10 % or high fares) for ≥4 weeks.<br>`F.trust.viajeros < 35 && F.riderProblemAge >= 4` |  |

### Paco Terruño (alcalde de Villanueva del Andén)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Ha venido gente al pueblo y no era para cerrar algo.» | factual | event · 8 sem | Villanueva apeadero commissioned ≤8 weeks ago, a territory corridor opened ≤4 weeks ago, or a crew started work there ≤2 weeks ago.<br>`F.villanuevaOpened(8) \|\| F.territoryOpened(4) \|\| F.workStartedInTerritory(2) \|\| F.stationTaskStarted(2)` | rescate.js:1272; rescate.js:611-620 |
| angry | «¡Al pueblo no lo borras del mapa, listillo de despacho!» | factual | recent · 4 sem | Service cut in a territory (or at Villanueva) in 4 weeks, or the insolvency "cut" option would hit one.<br>`F.territoryCut4 \|\| F.insolvencyCutPendingOnTerritory` | rescate.js:977-981 |
| worried | «Como pierda este tren, el pueblo se me queda sin la poca vida que tiene.» | factual | state | A served territory corridor (or the Norte stop) with a single train below 45 %, punctuality <55 (not counted as served), or negative margin while cashMin13<0.<br>`F.territoryAtRisk` | rescate.js:1006 |
| proud | «Nos llamaban cuatro gatos. Pues los gatos ya tienen estación.» | factual | event · 8 sem | Paco’s apeadero commissioned ≤8 weeks ago (one-shot per station).<br>`F.villanuevaOpened(8) \|\| F.territoryStationBuilt(8)` | rescate.js:1272 |
| surprised | «¿Vienes sin fotógrafo? Entonces igual hasta trabajas.» | mixed | recent · 2 sem | A work started in his territory ≤2 weeks ago with no ribbon-cutting tech and no ministerial visit.<br>`F.workStartedInTerritory(2) && !F.hasTech('inauguraciones') && !F.eventHappened('visita',4)` | rescate-data.js:154 |
| disappointed | «Nos prometiste futuro. Nos has dejado una marquesina y dos goteras.» | factual | recent · 13 sem | He got the prefab halt (cheap pact) and territory trust stays <45 after 13 weeks, his pact broke, or a licence sits unused for 13 weeks.<br>`(F.pacoPactCheap && F.week - F.villanuevaOpenedWeek >= 13 && F.trust.territorio < 45) \|\| F.pactBroken(8,'mayor') \|\| F.licenseIdle13` | rescate-data.js:289-295 |
| determined | «Yo de aquí no me voy. Trae una silla, que vas a necesitarla.» | attitude | attitude | Territory trust <35 with an unserved territory or unstaffed halt; or the successor-topic-3 "B" chain.<br>`F.trust.territorio < 35 && (F.territoryUnserved >= 1 \|\| F.pacoStationUnstaffed) \|\| F.chain.pacoPlanted` |  |

### Íñigo Asfalto (Autocares Meseta)

| Mood | Opener (voiced) | Claim | Tier · window | True when | Sources |
|---|---|---|---|---|---|
| happy | «Qué gusto da ver cómo trabajas para mi cuenta de resultados.» | factual | state | You are paying replacement buses (works mode alternativa), there is a strike, or bus share rose ≥3 points in 8 weeks.<br>`F.busesHired >= 1 \|\| F.strike \|\| F.busShareDelta8 >= 3` | rescate-data.js:107-111 |
| angry | «¡Eso es competencia desleal! Lo mío era espíritu emprendedor.» | factual | recent · 4 sem | Fare cut ≥10 % or a territory opened in 4 weeks, his share fell ≥2 points — not as an answer to his current price war.<br>`(F.fareCut4OnBusCorridor >= 0.10 \|\| F.territoryOpened(4)) && F.busShareDelta4 <= -2 && !F.playerAnsweredBusWar` | engine.js:56-66 |
| worried | «Me has hecho mirar las cuentas dos veces. Cabronazo, casi te respeto.» | factual | state | Bus share down ≥5 points in 8 weeks.<br>`F.busShareDelta8 <= -5` | engine.js:56-66 |
| proud | «He vendido hasta el asiento del conductor. Aprende, figura.» | factual | state | During his campaign bus share rose ≥3 points, a corridor turns away ≥10 % of demand, or strike.<br>`(F.busWar && F.busShareSinceWarStart >= 3) \|\| F.lostShareMax >= 0.10 \|\| F.strike` | engine.js:57, 230 |
| surprised | «¿Has aprendido a competir? Vaya putada para mis previsiones.» | factual | recent · 4 sem | You answered his price war and recovered ≥2 points, or rail share +5 in 8 weeks.<br>`(F.playerAnsweredBusWar && F.trainShareSinceWarStart >= 2) \|\| F.trainShareDelta8 >= 5` |  |
| disappointed | «Esperaba más de ti. Bueno, tampoco muchísimo.» | attitude | attitude | His campaign has run ≥4 weeks unanswered, or you failed a stage.<br>`(F.busWar && F.busWarAge >= 4 && !F.playerAnsweredBusWar) \|\| F.stageFailed(4)` |  |
| determined | «Voy a por tus viajeros. Tú sigue redactando memorias.» | factual | event · 0 sem | The scheduled Autocares Meseta campaign starts this week (the engine starts it first), or the no-aggression pact just ended.<br>`F.busWarStartsNow \|\| F.pactEnded(1,'no-agresion')` | engine.js:230; rescate-data.js:338-343 |

## 5. The 45 topic lines: situation, predicate and real effects

Each choice keeps its label (it is not voiced). «Today» is what the classic code does; «Unified» is the effect that makes the line and the label true.

Shared effect blocks used below:

- **Overtime (topic 0, A):** coverage forced to 1 for 4 weeks at 0.015 M€ per uncovered train-week (half of `TRAIN_RUN.crew` 0.03, `rescate.js:12`); it does not hire.
- **Cancel (topic 0, B):** uncovered trains cancelled for 4 weeks or until drivers ≥ need: first departures first, largest corridors first, never an essential corridor to 0. −2 punctuality from stretched shifts.
- **Discount (topic 1, A):** fares ×0.85 for 13 weeks with automatic restore, 0.05 M€ of advertising, demand from the existing elasticities (`rescate.js:198`, `:215`).
- **Revision (topic 2, A):** one named train to revision. Cost `revisionCost` 0.18 M€ (`rescate.js:482`), 2 weeks (1 with «contrato», `:483`), back at 95 % (`:1175`). It replaces classic `fleetcare`.
- **No revision (topic 2, B):** that train's breakdown probability ×1.5 for 8 weeks, and the warning is remembered.
- **Staff (topic 3, A):** a named station staffed for 26 weeks at 0.006 M€/week, demand ×1.03.
- **Centralised (topic 3, B):** demand ×0.98 for 26 weeks.
- **Pilot (topic 4, A):** 0.3 × tech cost, 8 weeks on one corridor, measured result, and the payment counts toward buying the tech within 13 weeks.
- **Evaluation (topic 4, B):** no cost; that tech cannot be piloted for 13 weeks.

### Pedro Sancho (Presidente)

#### 0 · El turno imposible — «Quiero más salidas en hora punta. Y maquinistas, no asesores fingiendo conducir.»

- **Situation:** Peak overcrowding on a corridor where a spare train exists but there are not enough drivers to run it.
- **True when:** `(exists c: F.load[c] >= 1.0 && F.lostShare[c] >= 0.05 && F.spareCompatible(c) >= 1 && F.drivers - F.driverNeed < 3.5) && !F.overtimeActive`
- **Instance named in the modal:** corridor c (peak) + spare unit
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: +1 train on c from the spare pool for 4 weeks, crewed by overtime (0.015 M€/week) plus normal running costs (TRAIN_RUN crew .03, energy .022, upkeep .012 per week) lost pax on c fall per serviceForecast trabajadores +4
  - Visible in: corridor sheet: "+1 tren con horas extra · 3 sem"; Finanzas row Horas extra; weekly report pax on c
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: move 1 train from the open corridor with the lowest load (≥2 trains) to c for 4 weeks −2 punctuality on both corridors for 4 weeks (fatigue) trabajadores −3
  - Visible in: both corridor sheets show the loan and the −2; weekly report
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «OuiOui se está llevando la foto. Elige si peleamos el precio o protegemos la caja.»

- **Situation:** OuiOui (Lowgo) is operating on the player’s corridors and taking the spotlight.
- **True when:** `max(F.lowgoShare) >= 0.15`
- **Instance named in the modal:** corridors with OuiOui
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after.
  - Visible in: corridor sheet countdown; OuiOui share chip; Gaceta
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet OuiOui share
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «No puedo inaugurar un tren que se queda tirado antes del primer canapé.»

- **Situation:** An opening/inauguration is due within 4 weeks and the unit that will serve it is worn or unreliable.
- **True when:** `F.upcomingOpening(4) && F.openingTrain && (F.openingTrain.condition < 50 || F.reliability(F.openingTrain) <= 0.78)`
- **Instance named in the modal:** opening (corridor/work) + its train
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€). if no spare exists, the opening is postponed by revisionWeeks (shown before choosing)
  - Visible in: train card "En revisión · vuelve en N sem"; opening date
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (2 weeks)
  - Unified: opening on time; breakdown probability of that train ×2 during its first 2 weeks; if it breaks: ★ −3 and Gaceta "El tren de la inauguración se queda tirado antes del canapé" warned[t]=week
  - Visible in: Gaceta; weekly report
  - Today: satisfaction −1, riders −2 (encounters.js:27)
- **Realism:** Reliability per maker from TRAIN_OFFERS (rescate-data.js:75-84): BCBB 0.78, used 0.7, KAFKA 0.9, Dörfler 0.97.

#### 3 · El andén olvidado — «En esa comarca también hay urnas. Pon servicios antes de que vayan a votar en autobús.»

- **Situation:** A territory (comarca) has weak or no service and there is an election within a year.
- **True when:** `F.weeksToElection <= 52 && exists territory c: (F.territoryOpenable(c) || (F.territoryServed[c] && F.trainsOn(c) <= 1)) && F.spareCompatible(c) >= 1`
- **Instance named in the modal:** territory corridor c
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: open c (territory openCost 0.2 M€, rescate-data.js:48-57; needs the licence 0.4-0.5 M€, rescate-data.js:63-72, and track ≥40, rescate.js:446-456) or add +1 compatible spare train to it, and staff its main station 26 weeks (0.006 M€/week) territorios +5
  - Visible in: map: corridor opens / +1 train; territory chip
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1. no train added
  - Visible in: territory chip
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Necesito una mejora que funcione antes de ponerle mi nombre.»

- **Situation:** A pilotable improvement exists and he wants it proven before the election.
- **True when:** `F.weeksToElection <= 52 && F.pilotables.length >= 1`
- **Instance named in the modal:** tech T (prefer visible effects: cadenciados, abono, regulacion) + corridor c with most pax
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive.
  - Visible in: tech card "Piloto en X · N sem"; end-of-pilot notice with measured result
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2.
  - Visible in: tech card "En evaluación"
  - Today: no effect, government −2 (encounters.js:29)

### Raquel Sanz (Ministra, semanas 1-208)

#### 0 · El turno imposible — «La nueva oferta necesita turnos. No pienso explicar que vendimos asientos sin conductor.»

- **Situation:** The player has just added service and drivers do not cover it (now or from next week).
- **True when:** `(F.serviceIncrease4 && (F.driverCoverage < 1 || F.driverCoverageNextWeek < 1)) && !F.overtimeActive`
- **Instance named in the modal:** the added service
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: Finanzas Horas extra; obstacle Faltan maquinistas
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: No overtime: the u uncovered trains are cancelled for 4 weeks or until drivers ≥ need (first departures first, largest corridors first, never an essential to 0); stretched shifts give −2 punctuality on the other corridors for 4 weeks; trabajadores −3; ★ −1. sold seats on cancelled trains are refunded: Σ cancelled pax × fare × 0.5 / 1000 M€ (same factor as rescue refunds, rescate.js:249)
  - Visible in: weekly report "Supresiones: N trenes, X k€ devueltos"
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «Bajar precios queda estupendo hasta que Charo te tira la calculadora a la cabeza.»

- **Situation:** There is price pressure (OuiOui/YaIré/bus campaign) while the accounts are tight.
- **True when:** `(F.lowgoWar || F.yairePromo || F.busWar) && (F.ord8 < 0.05 || F.trust.hacienda < 50)`
- **Instance named in the modal:** corridors under the active campaign
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after. hacienda −4 instead of −2 (Charo "throws the calculator")
  - Visible in: corridor sheet; Hacienda chip
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «El taller pide una revisión extra. El tren no se arregla por real decreto.»

- **Situation:** The workshop flags a worn train for extra revision.
- **True when:** `F.low45 >= 1`
- **Instance named in the modal:** worst service train t
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€).
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2.
  - Visible in: train card "Aviso del taller: semana W"
  - Today: satisfaction −1, riders −2 (encounters.js:27)

#### 3 · El andén olvidado — «Podemos reforzar la atención de esa estación o mandar otro cartel. Adivina cuál molesta menos.»

- **Situation:** A busy station has no staff.
- **True when:** `F.unstaffedBusy.length >= 1`
- **Instance named in the modal:** station x (busiest unstaffed)
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left.
  - Visible in: map station marker
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1.
  - Visible in: map station marker
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Los técnicos tienen un piloto listo. Esta vez no es un primo con una presentación.»

- **Situation:** A pilot is technically ready and affordable.
- **True when:** `F.pilotables.length >= 1`
- **Instance named in the modal:** cheapest pilotable tech T + corridor with most pax
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive.
  - Visible in: tech card
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2.
  - Visible in: tech card
  - Today: no effect, government −2 (encounters.js:29)

### Óscar del Puente (Ministro, semanas 209-416)

#### 0 · El turno imposible — «El horario está inflado. O pagamos refuerzos o dejamos de vender humo en ventanilla.»

- **Situation:** The timetable sells more departures than drivers can run.
- **True when:** `(F.driverCoverage < 0.95) && !F.overtimeActive`
- **Instance named in the modal:** driver gap
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: Finanzas
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (permanent / one-off)
  - Unified: "dejar de vender humo": u trains are withdrawn permanently from the corridors with the lowest net per train (to the spare pool) so coverage = 1; no cancellations and no fatigue penalty; viajeros −2; trabajadores −1
  - Visible in: corridor sheets show fewer trains
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «YaIré ha anunciado promoción. Como respondas con una nota de prensa, te la comes.»

- **Situation:** YaIré (Rossa) has launched a promotion on a player corridor.
- **True when:** `F.yairePromoStarted(4)`
- **Instance named in the modal:** corridors with YaIré
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after.
  - Visible in: corridor sheet YaIré share
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «Otro vídeo del aire acondicionado muerto y nos conocen hasta en Saturno.»

- **Situation:** Summer (or the 2 weeks before the calor window), worn air-conditioning, and an AC failure already went public in the last 52 weeks (the calor event, rescate-data.js:405 «el aire acondicionado del tren en huelga»). The rescue viral event is a positive video (rescate-data.js:408) and does not count.
- **True when:** `F.woy >= 23 && F.woy <= 34 && exists service train cond < 55 && F.eventHappened('calor',52)`
- **Instance named in the modal:** up to 3 service trains <55 %
- **A · «Revisión extraordinaria»** (3 weeks)
  - Unified: climate overhaul: each train out 1 week, 0.08 M€ each (max 3); the calor event this summer does not hit their corridors
  - Visible in: train cards; event outcome
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (12 weeks)
  - Unified: if a calor event happens before woy 35: viajeros −4 (rescue heat-wait, rescate.js:946) and Gaceta "Otro vídeo del aire acondicionado muerto"
  - Visible in: Gaceta
  - Today: satisfaction −1, riders −2 (encounters.js:27)
- **Realism:** Heat window = rescue calor event weeks (rescate.js:891).

#### 3 · El andén olvidado — «El alcalde amenaza con plantarse en el ministerio. Y ese no se va con una pegatina.»

- **Situation:** Paco (the mayor) threatens to plant himself at the ministry.
- **True when:** `F.pacoGrudge || F.trust.territorio < 35 || (['angry','determined'].includes(F.lastMood.mayor) && F.week - F.lastMoodWeek.mayor <= 8)`
- **Instance named in the modal:** Paco's station (Villanueva if built, else the main station of his territory corridor)
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left. removes the mayor grudge
  - Visible in: map station marker; territory chip
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1. Paco plants himself: territorios −6; sets F.chain.pacoPlanted (makes mayor.determined eligible 2 weeks later)
  - Visible in: Gaceta "El alcalde de Villanueva acampa en el ministerio"
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Quiero datos de verdad. La hoja de cálculo de tu cuñado cuenta como arma, no como herramienta.»

- **Situation:** A data-producing technology can be piloted.
- **True when:** `F.pilotables.some(T => ['regulacion','ertms','predictivo','app','dinamico'].includes(T))`
- **Instance named in the modal:** data tech T + corridor
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. the pilot corridor sheet gets a data panel (punctuality by hour, breakdown risk) during the pilot
  - Visible in: tech card; data panel
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2.
  - Visible in: tech card
  - Today: no effect, government −2 (encounters.js:29)

### Charo Tijera (Hacienda)

#### 0 · El turno imposible — «Las horas extra no se pagan con entusiasmo. Saca la cartera o ajusta la oferta.»

- **Situation:** Drivers are short: overtime or fewer trains.
- **True when:** `(F.driverCoverage < 1) && !F.overtimeActive`
- **Instance named in the modal:** driver gap
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: Finanzas
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (permanent / one-off)
  - Unified: "ajusta la oferta": withdraw u trains to the spare pool (as successor line) so coverage = 1; hacienda +2; viajeros −2
  - Visible in: corridor sheets
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «Cada descuento tiene que salir de algún sitio. A ser posible, no de mi paciencia.»

- **Situation:** A discount is being asked for (rival/bus campaign or riders/territory complaining about fares).
- **True when:** `(F.lowgoWar || F.yairePromo || F.busWar || F.fareIndexHigh)`
- **Instance named in the modal:** corridors under pressure
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after. hacienda −3 (her patience)
  - Visible in: corridor sheet; Hacienda chip
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «La revisión cuesta menos que el rescate, lumbreras. Pero hay que pagarla hoy.»

- **Situation:** A train is close to failing; the revision (0.18 M€) is cheaper than the rescue (fix-fast 0.25 M€ + lost revenue).
- **True when:** `exists service train cond < 40 && F.cash >= F.revisionCost`
- **Instance named in the modal:** worst train t
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€). detail shows the comparison: revision 0.18 vs breakdown 0.25 + 2 weeks without the train
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2.
  - Visible in: train card
  - Today: satisfaction −1, riders −2 (encounters.js:27)
- **Realism:** The numbers make the line true: revision 0.18 M€ (rescate.js:482) < fix-fast 0.25 M€ (rescate.js:904, 941) plus two weeks without the train.

#### 3 · El andén olvidado — «Ese pueblo necesita atención, no otra escultura delante del apeadero.»

- **Situation:** A vanity item exists while a territory halt has no staff.
- **True when:** `F.vanity && exists territory station x: !F.stationStaffed[x]`
- **Instance named in the modal:** unstaffed territory station x
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left.
  - Visible in: map station marker
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1.
  - Visible in: map
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «El piloto tiene presupuesto. Si lo conviertes en un agujero, te meto dentro.»

- **Situation:** There is an earmarked pilot budget and a pilotable tech.
- **True when:** `F.pilotables.length >= 1 && F.pilotEarmark >= F.pilotCost(T)`
- **Instance named in the modal:** tech T paid from the earmark
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. paid from pilotEarmark first; if the measured effect is negative, hacienda −5 ("te meto dentro")
  - Visible in: Finanzas earmark row; tech card
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2. the earmark stays until 31 Dec, then lapses
  - Visible in: Finanzas earmark row
  - Today: no effect, government −2 (encounters.js:29)

### Benito Balasto (Adif, obras)

#### 0 · El turno imposible — «Sin cuadrilla de guardia, la incidencia de las seis la arregla el Espíritu Santo.»

- **Situation:** No crew is free for on-call duty and the track/incident record calls for one.
- **True when:** `F.crewsFree === 0 && (F.minTrackOpen < 60 || F.incidents(4) >= 1)`
- **Instance named in the modal:** network
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: on-call subcontracted crew for 4 weeks: CREW.sub 0.09 M€/week = 0.36 M€ (rescate-data.js:87); it never works on projects; incident penalties (c.incident) ×0.5 on all open corridors for 4 weeks; first incident: report "La cuadrilla de guardia lo resuelve en una hora"
  - Visible in: crews panel "1 de guardia"; weekly report
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: no on-call crew: incident penalties ×1.5 for 4 weeks on corridors with track <60; the first one is reported as "Incidencia de las 6:00 en X sin cuadrilla de guardia"
  - Visible in: weekly report
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «Si llenas el tren de ofertas y no refuerzas el andén, el atasco te lo comes tú.»

- **Situation:** A discount would push a near-full corridor beyond its platform capacity.
- **True when:** `(F.lowgoWar || F.yairePromo || F.busWar) && exists target c: F.load[c] >= 0.9`
- **Instance named in the modal:** target corridor c (single-track sections count double: segments.json "unica")
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after. the forecast shows the congestion penalty −min(10,(load−1)×25) already in punctTarget (rescate.js:177); on corridors with single-track sections the penalty ×1.5
  - Visible in: corridor sheet "Atasco −N"
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)
- **Realism:** Single-track sections (segments.json track "unica": levante enc–xat, sur lin–cor, ebro mir–cst, teruel, soria trb–sor, cantabria pal–san, extremadura tal–pla) make platform/crossing congestion worse.

#### 2 · Tornillos o titulares — «Puedo inspeccionar la vía ahora o escuchar después que nadie lo había previsto.»

- **Situation:** Worn track with no work and a free crew: inspect now or face an unplanned speed restriction.
- **True when:** `exists open c: F.track[c] < 55 && !F.workOn(c) && F.crewsFree >= 1`
- **Instance named in the modal:** corridor c (worst track)
- **A · «Revisión extraordinaria»** (13 weeks)
  - Unified: track inspection: 1 crew 1 week, cost max(0.1, km×0.0003) M€ (Norte 421 km → 0.13); track +4 (cap 98); no track-fault incident on c for 13 weeks
  - Visible in: corridor sheet "Inspeccionada semana W"
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (13 weeks)
  - Unified: when c.track first drops below 45 in the next 13 weeks, a limitación temporal de velocidad (LTV) hits: −10 punctuality for 2 weeks on c and Gaceta "Nadie lo había previsto"
  - Visible in: Gaceta; map LTV marker
  - Today: satisfaction −1, riders −2 (encounters.js:27)
- **Realism:** Use the real per-segment vmax from segments.json: an LTV sets the worst segment to 60 km/h for its duration (travel time + and punctuality −).

#### 3 · El andén olvidado — «La estación necesita acceso y personal. Las palomas no informan de las salidas.»

- **Situation:** A busy halt has neither access nor staff.
- **True when:** `exists station x: x.level === 0 && !F.stationStaffed[x] && !x.accessible && F.stationPax[x] >= 1.5`
- **Instance named in the modal:** station x
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left. plus access mini-work by an outside contractor (does NOT use an Adif crew, so it stays feasible when crewsFree = 0): 0.25 M€, 2 weeks → x.accessible (+2 % demand on c, permanent)
  - Visible in: map station marker with access icon
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1.
  - Visible in: map
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Tenemos sensores para detectar fallos. Detectar gilipolleces aún se hace a mano.»

- **Situation:** Rail-flaw sensors (ultrasonic auscultation) can be piloted.
- **True when:** `F.pilotable('ultrasonidos')`
- **Instance named in the modal:** ultrasonidos on the open corridor with the lowest track
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. ultrasonidos pilot = 0.12 M€; track decay −30 % on c for 8 weeks
  - Visible in: tech card; corridor track trend
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2.
  - Visible in: tech card
  - Today: no effect, government −2 (encounters.js:29)

### Fermín Bogie (talleres)

#### 0 · El turno imposible — «Necesito manos en el turno de noche. Los trenes no se revisan con besos.»

- **Situation:** The workshop is saturated: night-shift mechanics needed.
- **True when:** `F.shopQueue >= 1 || (F.countServiceBelow(50) >= 2 && F.inShop.length >= F.shopSlots)`
- **Instance named in the modal:** workshop
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: night shift 4 weeks: 0.02 M€/week; revisions entering in these 4 weeks take 1 week less (min 1); train wear ×0.8 for 4 weeks; trabajadores +4
  - Visible in: Flota panel "Turno de noche · N sem"
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: queue: revisions entering in 4 weeks take +1 week; breakdown probability ×1.25 for trains <50 for 4 weeks; trabajadores −3
  - Visible in: Flota panel queue
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «Los billetes baratos llenan los coches y vacían el almacén de repuestos. Haz números.»

- **Situation:** A discount would overload worn trains (more wear, more spare parts).
- **True when:** `(F.lowgoWar || F.yairePromo || F.busWar) && exists target c: mean(cond of trainsOn(c)) < 60`
- **Instance named in the modal:** target corridor c
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after. wear of trains on c ×1.15 during the discount
  - Visible in: train cards wear trend
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (13 weeks)
  - Unified: Fares unchanged; the competitor campaign runs its course and its share follows the formula; hacienda +2; viajeros −1. Corridor sheet shows "<rival> X % ↑".
  - Visible in: corridor sheet
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «O cambiamos la pieza ahora o la pieza decide dónde termina el viaje.»

- **Situation:** A train needs a part now.
- **True when:** `exists service train cond < 40`
- **Instance named in the modal:** worst train t
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€).
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2.
  - Visible in: train card
  - Today: satisfaction −1, riders −2 (encounters.js:27)

#### 3 · El andén olvidado — «El material de reserva también llega a provincias. No todo va a ser mimar al AVE de la foto.»

- **Situation:** Reserve units/workshop priority all go to the flagship AVE while a territory corridor has none.
- **True when:** `F.hasAVEservice && exists served territory c: (F.inShopFrom(c) >= 1 || F.spareFor(c) === 0) && exists idle unit compatible with c (gauge ib/mixto, traction: diesel or bimodal if c has unelectrified segments, 3 kV-capable otherwise — segments.json/trains.json)`
- **Instance named in the modal:** territory corridor c + compatible idle unit
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: move the compatible idle unit to c as its reserve (1 week transfer, no cost); c trains get workshop priority (−1 revision week) for 26 weeks; territorios +5
  - Visible in: train card "Reserva de provincias"; corridor sheet
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: reserve stays with the flagship; territorios −4
  - Visible in: corridor sheet
  - Today: reputation −1, territory −4 (encounters.js:28)
- **Realism:** Reserve compatibility uses the real catalogue: 3 kV-only EMUs (s465/s463/s449/s470) cannot cover unelectrified Teruel/Soria/Extremadura segments; diesel (s592/s594/s599) or bimodal (s730, Dörfler BMU) can; std-gauge AVE units (s103/s112/BCBB HS) cannot run on any of the 11 Iberian/mixed corridors.

#### 4 · El invento del mes — «La diagnosis nueva ve la avería antes que tu contable. Déjala probar.»

- **Situation:** Predictive diagnosis can be piloted.
- **True when:** `F.pilotable('predictivo')`
- **Instance named in the modal:** predictivo on the corridor with most breakdowns in 26 weeks
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. predictivo pilot = 0.3 M€; breakdown probability ×0.6 for trains on c for 8 weeks; notice "N averías frente a M esperadas"
  - Visible in: tech card; end notice
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2.
  - Visible in: tech card
  - Today: no effect, government −2 (encounters.js:29)

### Marisa Andén (viajeros, Norte)

#### 0 · El turno imposible — «El primer tren nos deja tirados si no hay relevo. No somos figurantes de tu horario.»

- **Situation:** Driver shortage cancelled first departures on an essential corridor.
- **True when:** `(F.driverCoverage < 1 && F.cancellations(2).some(x => x.first && F.essential(x.corridor))) && !F.overtimeActive`
- **Instance named in the modal:** essential corridor with cancellations
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: corridor sheet; weekly report
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: No overtime: the u uncovered trains are cancelled for 4 weeks or until drivers ≥ need (first departures first, largest corridors first, never an essential to 0); stretched shifts give −2 punctuality on the other corridors for 4 weeks; trabajadores −3; ★ −1. the first departure of that corridor stays cancelled: its pax −8 % (commuters) for 4 weeks; viajeros −3
  - Visible in: weekly report
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «El precio de ayer no se parece al de hoy. ¿Vendéis billetes o apuestas?»

- **Situation:** Prices change from day to day (dynamic pricing or repeated fare changes).
- **True when:** `F.dynamicPricing || F.fareChanges8.norte >= 2`
- **Instance named in the modal:** Norte (Marisa) or the corridor with most fare changes
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: fixed fare: dynamic yield suspended on c and fare ×0.85 for 13 weeks; viajeros +3; hacienda −2
  - Visible in: corridor sheet "Precio fijo · N sem"
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (permanent / one-off)
  - Unified: keep dynamic pricing; viajeros −3
  - Visible in: riders chip
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «Un baño averiado no es una experiencia de viaje. Es una puta vergüenza.»

- **Situation:** Worn trains with broken amenities (toilets) on a busy corridor.
- **True when:** `exists service train cond < 50 on a corridor with pax >= 3`
- **Instance named in the modal:** worst such train
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€).
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2.
  - Visible in: train card
  - Today: satisfaction −1, riders −2 (encounters.js:27)

#### 3 · El andén olvidado — «La estación está vacía de personal. Para hablar con una pared me quedo en casa.»

- **Situation:** A busy station is unstaffed.
- **True when:** `F.unstaffedBusy.length >= 1`
- **Instance named in the modal:** station x
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left.
  - Visible in: map
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1.
  - Visible in: map
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Si la aplicación vuelve a perder el billete, os llevo la impresora al despacho.»

- **Situation:** The old app lost tickets (peak-week failure) and "App que funciona" can be piloted.
- **True when:** `!F.hasTech('app') && F.appGlitch(26) && F.pilotable('app')`
- **Instance named in the modal:** tech 'app' on Norte
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. app pilot = 0.36 M€; no glitch on c during the pilot
  - Visible in: tech card
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2. next peak-week glitch: viajeros −3
  - Visible in: Gaceta
  - Today: no effect, government −2 (encounters.js:29)

### Paco Terruño (alcalde de Villanueva del Andén)

#### 0 · El turno imposible — «El tren de primera hora es el que lleva a la gente al trabajo, no el de tu visita oficial.»

- **Situation:** Driver shortage threatens the early train of a territory corridor.
- **True when:** `(F.driverCoverage < 1 && F.cancellations(2).some(x => x.first && F.isTerritory(x.corridor))) && !F.overtimeActive`
- **Instance named in the modal:** territory corridor with the cancelled early train
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: corridor sheet
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: No overtime: the u uncovered trains are cancelled for 4 weeks or until drivers ≥ need (first departures first, largest corridors first, never an essential to 0); stretched shifts give −2 punctuality on the other corridors for 4 weeks; trabajadores −3; ★ −1. the territory early train stays cancelled: its pax −15 % for 4 weeks; territorios −4
  - Visible in: weekly report
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «Un billete de ida cuesta una compra semanal. Luego te extraña que no suba nadie.»

- **Situation:** A territory fare is too high for local income: empty trains.
- **True when:** `exists open territory c: F.occupancy(c) < 0.4 && F.fare(c) >= F.fareRef(c)`
- **Instance named in the modal:** territory corridor c
- **A · «Campaña de descuentos»** (26 weeks)
  - Unified: rural fare: c fare ×0.80 for 26 weeks; territorios +4; viajeros +1
  - Visible in: corridor sheet
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (permanent / one-off)
  - Unified: fare unchanged; territorios −4
  - Visible in: territory chip
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «Aquí también se estropean trenes. Manda mantenimiento, no un ramo de disculpas.»

- **Situation:** A territory train broke down or is badly worn.
- **True when:** `exists served territory c: F.minCondOn(c) < 45 || F.breakdowns(4).some(t => t.back === c)`
- **Instance named in the modal:** that train
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€).
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2. territorios −3
  - Visible in: train card
  - Today: satisfaction −1, riders −2 (encounters.js:27)

#### 3 · El andén olvidado — «Quiero atención en la estación. Y no, el bar de mi cuñado no es un punto de información.»

- **Situation:** Paco's halt exists and has nobody to inform passengers.
- **True when:** `F.villanuevaStation && !F.stationStaffed['villanueva']`
- **Instance named in the modal:** Villanueva del Andén
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left.
  - Visible in: map station marker
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1.
  - Visible in: map
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Si el sistema funciona aquí, funciona en cualquier sitio. No tenemos cobertura ni para discutir.»

- **Situation:** A pilot could be located on a rural line without coverage.
- **True when:** `exists served territory c && F.pilotables.some(T => ['ertms','regulacion','predictivo','ultrasonidos'].includes(T) || (T === 'bimodo' && F.hasUnelectrified(c)))`
- **Instance named in the modal:** tech T on territory corridor c
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive. bimodo pilot on unelectrified c: diesel energy −30 % on c (realism: Teruel/Soria/Extremadura have non-electrified segments, segments.json)
  - Visible in: tech card; corridor sheet
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (13 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2. territorios −2
  - Visible in: tech card
  - Today: no effect, government −2 (encounters.js:29)
- **Realism:** ERTMS L2 depends on GSM-R radio coverage; 'bimodo' pilots only make sense where segments.json elec = 'no'.

### Íñigo Asfalto (Autocares Meseta)

#### 0 · El turno imposible — «Refuerza turnos, hombre. Así mis conductores dejan de recoger a tus viajeros abandonados.»

- **Situation:** Driver-shortage cancellations send stranded passengers to his buses.
- **True when:** `(F.driverCoverage < 1 && F.cancellations(2).length >= 1 && F.busCompetes(F.cancellations(2)[0].corridor)) && !F.overtimeActive`
- **Instance named in the modal:** corridor with cancellations
- **A · «Pagar refuerzos este mes»** (4 weeks)
  - Unified: Overtime: coverage forced to 1 for 4 weeks; cost 0.015 M€ per uncovered train per week (=½ TRAIN_RUN.crew 0.03, rescate.js:9-15), charged weekly as "Horas extra de maquinistas"; trabajadores +4; viajeros +2 if cancellations were happening. Does NOT hire: the obstacle "Faltan N maquinistas" stays with "cubierto hasta la semana W" and its action "Formar maquinistas (13 semanas, 0,015 M€ c/u)".
  - Visible in: corridor sheet
  - Today: cash −1.2 M€, satisfaction +2, staff trust +4 (encounters.js:25)
- **B · «Ajustar turnos sin refuerzo»** (4 weeks)
  - Unified: No overtime: the u uncovered trains are cancelled for 4 weeks or until drivers ≥ need (first departures first, largest corridors first, never an essential to 0); stretched shifts give −2 punctuality on the other corridors for 4 weeks; trabajadores −3; ★ −1. lost pax of the cancelled trains are added to the Autocares Meseta share on that corridor (shown "A Autocares Meseta: N mil")
  - Visible in: weekly report; bus share chip
  - Today: reputation −1, staff trust −3 (encounters.js:25)

#### 1 · Billetes de saldo — «He puesto una oferta obscena. Responde o sigue regalándome clientes, fenómeno.»

- **Situation:** Autocares Meseta has just launched a price campaign that the player has not answered.
- **True when:** `F.busWar && F.week - F.busWarStartedWeek <= 4 && !F.playerAnsweredBusWar`
- **Instance named in the modal:** corridors where buses compete
- **A · «Campaña de descuentos»** (13 weeks)
  - Unified: Fares ×0.85 on the target corridors for 13 weeks (auto-restore, countdown on the corridor sheet), 0.05 M€ advertising; demand and share recomputed with the existing elasticities (uR=(fareRef/fare)^1.1, rescate.js:198; Lowgo mine ∝ (fareRef/fare)^1.2, rescate.js:215); viajeros +3; hacienda −2. Forecast shown before choosing: −k€/week in tickets, +k pax/week, rival share before→after. sets playerAnsweredBusWar
  - Visible in: bus share chip
  - Today: cash −1.5 M€, satisfaction +3, flag 'hype' 3 months = AVE demand ×1.1 (engine.js:53), riders +3 (encounters.js:26)
- **B · «Proteger el margen»** (26 weeks)
  - Unified: bus campaign (bus fare ×0.78) runs its 26 weeks; bus share grows per the logit
  - Visible in: bus share chip
  - Today: cash +0.3 M€, satisfaction −1, treasury +2 (encounters.js:26)

#### 2 · Tornillos o titulares — «Cada avería tuya me paga una rueda. ¿Seguro que quieres ahorrar en esa pieza?»

- **Situation:** Recent breakdowns and a worn train whose failure would feed his buses.
- **True when:** `F.breakdowns(4) >= 1 && F.low45 >= 1`
- **Instance named in the modal:** worst train t
- **A · «Revisión extraordinaria»** (2 weeks)
  - Unified: Train t goes to revision: revisionCost 0.18×(1+mod) M€ (rescate.js:482), revisionWeeks 2 (1 with "contrato") (483), returns at 95 % (1175). If its corridor would drop to 0 trains and a spare exists, the spare is assigned automatically. trabajadores +3; ★ +1. Replaces classic fleetcare (+8 to every lot for 2 M€).
  - Visible in: train card
  - Today: cash −2 M€, reputation +1, 'fleetcare' = +8 condition to every lot at once (engine.js:167), staff +3 (encounters.js:27)
- **B · «Seguir con el plan previsto»** (8 weeks)
  - Unified: Train t stays; its breakdown probability ×1.5 for 8 weeks on top of rescate.js:1203; warned[t]=week (enables W5 "Te avisé" and rival I0); viajeros −2. if t breaks, its corridor’s lost pax go to the bus share
  - Visible in: bus share chip
  - Today: satisfaction −1, riders −2 (encounters.js:27)

#### 3 · El andén olvidado — «Donde tú ves cuatro vecinos, yo veo cuatro billetes. Por eso me llaman empresario.»

- **Situation:** A territory where buses dominate and rail is weak or unstaffed.
- **True when:** `exists territory c: F.busShare[c] >= 0.5 && (!F.territoryServed[c] || F.unstaffedMainStation(c))`
- **Instance named in the modal:** territory corridor c
- **A · «Refuerzo de atención local»** (26 weeks)
  - Unified: Station x staffed for 26 weeks (renewable): 0.006 M€/week as "Personal de estación"; corridor demand ×1.03 while staffed; territorios +5; viajeros +1. Map marker shows the staffed station; corridor sheet shows weeks left. local sales point: bus share on c −5 points
  - Visible in: bus share chip
  - Today: cash −1 M€, satisfaction +2, territory +5 (encounters.js:28)
- **B · «Atención centralizada»** (26 weeks)
  - Unified: Station x stays unstaffed with remote information: demand ×0.98 on its corridor for 26 weeks; territorios −4; ★ −1. bus share on c +5 points
  - Visible in: bus share chip
  - Today: reputation −1, territory −4 (encounters.js:28)

#### 4 · El invento del mes — «Si tú no pruebas esa mejora, la pruebo yo. Y luego te cobro por explicártela.»

- **Situation:** An improvement a bus company could copy can be piloted while he competes.
- **True when:** `F.pilotables.some(T => ['cadenciados','abono','app','dinamico'].includes(T)) && (F.busWar || max(F.busShare) >= 0.3)`
- **Instance named in the modal:** commercial/operation tech T
- **A · «Financiar el piloto»** (8 weeks)
  - Unified: Pilot of tech T on corridor c for 8 weeks: pay 0.3×T.cost M€ now (no ★); T.mods apply to c only (demand→c.pot, punct→c target, breakdown→trains on c, trackDecay→c, dieselEnergy→c if unelectrified, yield→c revenue); at the end a notice reports the measured effect vs the same corridor’s previous 8 weeks; if T is bought within 13 weeks its money cost is reduced by the pilot payment; gobierno +3; ★ +1 only if the measured effect is positive.
  - Visible in: tech card
  - Today: cash −1.8 M€, reputation +2, flag 'hype' 2 months = AVE demand ×1.1, government +3 (encounters.js:29)
- **B · «Pedir otra evaluación»** (26 weeks)
  - Unified: No cost; T cannot be piloted again for 13 weeks; gobierno −2. Autocares Meseta adopts it: bus utility +5 % for 26 weeks (Gaceta "Autocares Meseta estrena …")
  - Visible in: Gaceta; bus share chip
  - Today: no effect, government −2 (encounters.js:29)

## 6. Selection algorithm

**Principle.** A scene is shown only when its opener predicate AND its topic predicate are true on the state at the moment it is displayed, both choices are executable, and the combo is not retired. If nothing qualifies, no scene is shown (silence is allowed; there is no filler).

**When.** Once per week, at the end of closeWeek(), after operation, breakdowns, works, accounts, groups, pacts, events and record() (rescate.js:1164-1310), and before stopReasons() (rescate.js:1320). The engine never generates an event to fit a dialogue: even rival.determined only becomes true in the week the bus campaign that the engine had already scheduled starts.

**Gates**

- Never in weeks 1-5 (rescue tutorial t-1..t-7 and the first stage briefing).
- Never if any decision with choices is pending (events, scandals, extortions, insolvency, stage/election notices have priority — rescate.js:1166-1167).
- At most one scene every 4 weeks (s.enc.lastWeek); target ≈1 every 6 weeks → ≈65-75 scenes per 416-week game (classic: 1 every 3 months, tycoon.js:158).
- Person available: minister only while F.office.transport==="minister", successor only while "successor".

**Cooldowns (weeks)**

| Scope | Value |
|---|---|
| sameBody | once per game (315 bodies vs ≈70 slots) |
| samePersonMood | 26 |
| samePersonTopic | 26 |
| sameTopicAnyPerson | 8 |
| samePerson | 8 |
| sameInstance | 13 |

weeks; sameInstance = same train, station, corridor or tech target

**Mood choice.** For each available person, collect moods whose opener predicate is true and whose person|mood cooldown has elapsed. Rank by tier: event (fired this week or within its windowWeeks) > recent > state > attitude; tie → least recently used → EMOTIONS order. Guard: happy/proud need trust(group of person) ≥ 40; angry/disappointed need it ≤ 60 (group map: president/minister/successor→gobierno, treasury→hacienda, workshop→plantilla, riders→viajeros, mayor→territorio; adif and rival have no guard). Rescue names: hacienda = economia (rescue already maps treasury→economia, rescate.js:594), plantilla = trabajadores, territorio = territorios, viajeros = viajeros; gobierno is new (classic government group, tycoon.js:6 and target tycoon.js:162, or derived from electionForecast rescate.js:1029-1038).

**Topic choice.** For each person with ≥1 true mood, evaluate the 5 topic predicates; each true one returns an instance with severity 0..1 (driver gap/need, rival share, 1−condition/100, unstaffed pax/5, tech effect size, …). Discard topics on cooldown, retired combos (combosNeverTrue + conditional groups switched off), instances on cooldown and scenes whose option A is unaffordable (cash − due(2) < cost) or infeasible.

**Scoring.** score = 0.55·severity + 0.25·stakeholder(person,topic) + 0.20·tierWeight(event 1, recent .8, state .6, attitude .4). Stakeholder: topic0 → workshop/adif/riders/treasury 1, others .5; topic1 → rival/treasury/riders/mayor 1, president/successor/minister .7, adif/workshop .5; topic2 → workshop/adif 1, riders/mayor/treasury .7, others .5; topic3 → mayor/riders/adif 1, others .6; topic4 → minister/successor/adif/workshop 1, others .6. Pick the max; tie → lower index in ENCOUNTERS. If the best score < 0.45 and fewer than 8 weeks have passed since the last scene, show nothing.

**Validation.** Immediately before display (and again when loading a save with a pending scene) re-evaluate opener and topic predicates; if either is false, drop the scene silently and clear it from the ledger.

**Ledger.** s.enc = {lastWeek, lastByPerson, lastByPersonMood, lastByPersonTopic, lastByTopic, usedBodies[], instanceCooldown{}, active:[{id, week, person, mood, topic, instance, choice, effects:[{kind, target, until}]}], warned{trainId: week}, chain:{pacoPlanted: week}}. Keep scene ids (scene-person-mood-k) so the classic validator logic (tycoon.js:193) and the catalogue source ids stay valid.

**Presentation.** Modal = portrait with the catalogue mood (faceStyle(person,mood), app.js:1174) + title TOPICS[k] + the voiced body (one complete take; opener styled by dialogue-presentation.js:5-16) + an unvoiced paragraph naming the instance ("Pucela · 38 %", "Estación de Villanueva", "Mantenimiento predictivo en el Norte") + two choices whose detail lines are computed from the real effect (cost, weeks, pax/punctuality delta). Never put dynamic numbers in the voiced text.

**Aftermath.** Every active effect shows a countdown where the player looks for it (corridor sheet, train card, station marker, tech card, Finanzas row) and its end is reported in the weekly report; consequences of option B are reported with the scene that caused them ("Pucela averiado — Fermín te avisó en la semana 34").

```js
function pickEncounter(s){
  if (s.week < 6 || s.decisions.some(d => d.choices) || s.week - (s.enc.lastWeek ?? -99) < 4) return null;
  const F = facts(s); const out = [];
  for (const person of PEOPLE) {
    if (!available(person, F) || s.week - (s.enc.lastByPerson[person] ?? -99) < 8) continue;
    const moods = EMOTIONS.filter(m => OPENER[person][m].when(F) && guard(person, m, F) && s.week - (s.enc.lastByPersonMood[person+"|"+m] ?? -99) >= 26)
                          .sort(byTierThenLRU);
    for (let k = 0; k < 5; k++) {
      if (s.week - (s.enc.lastByTopic[k] ?? -99) < 8 || s.week - (s.enc.lastByPersonTopic[person+"|"+k] ?? -99) < 26) continue;
      const inst = LINE[person][k].instance(F); if (!inst || onCooldown(inst) || !feasible(person, k, inst, F)) continue;
      const mood = moods.find(m => !RETIRED.has(`scene-${person}-${m}-${k}`) && !s.enc.usedBodies.includes(`scene-${person}-${m}-${k}`));
      if (!mood) continue;
      out.push({id: `scene-${person}-${mood}-${k}`, person, mood, topic: k, inst, score: .55*inst.severity + .25*STAKE[k][person] + .2*TIER_W[OPENER[person][mood].tier]});
    }
  }
  out.sort((a, b) => b.score - a.score || ENCOUNTER_INDEX[a.id] - ENCOUNTER_INDEX[b.id]);
  const best = out[0]; if (!best || (best.score < .45 && s.week - (s.enc.lastWeek ?? -99) < 8)) return null;
  return best; // pushed to s.decisions as {kind:"encounter", ...}; validated again before display
}
```

**Expected coverage.** With the gates above a 416-week game shows ≈65-75 scenes; every one of the 310 non-retired bodies is reachable when its facts occur (some only in the narrow windows of combosNarrow), so replays hear different bodies driven by different situations.

## 7. Combinations

### 7.1 Never true: retire (5)

Retire means never select. The rows stay in `ENCOUNTERS`, in the catalogue and in the listening room.

| Id | Body | Why it can never be true |
|---|---|---|
| `scene-adif-happy-0` | «La cuadrilla ha terminado y nadie ha soltado una estupidez. Récord. Sin cuadrilla de guardia, la incidencia de las seis la arregla el Espíritu Santo.» | «La cuadrilla ha terminado» fires only in the week a work is commissioned; crewsBusy counts only status "active" works (rescate.js:114-116), so the finishing crew is free at week close and crewsFree ≥ 1, while topic 0 («Sin cuadrilla de guardia») requires crewsFree === 0. |
| `scene-adif-determined-2` | «Las vías no se ponen con discursos. Dame medios y aparta. Puedo inspeccionar la vía ahora o escuchar después que nadie lo había previsto.» | «Dame medios y aparta» requires crewsFree === 0; «Puedo inspeccionar la vía ahora» requires a free crew to inspect now. |
| `scene-workshop-happy-2` | «Hoy los trenes suenan a tren, no a cubo de tornillos. O cambiamos la pieza ahora o la pieza decide dónde termina el viaje.» | «Hoy los trenes suenan a tren» requires no service train below 45 %; «O cambiamos la pieza ahora…» requires a service train below 40 %. |
| `scene-rival-surprised-1` | «¿Has aprendido a competir? Vaya putada para mis previsiones. He puesto una oferta obscena. Responde o sigue regalándome clientes, fenómeno.» | «¿Has aprendido a competir?» requires the player to have answered his campaign and recovered share (or rail share +5 in 8 weeks); «Responde o sigue regalándome clientes» requires that the campaign is unanswered and that rail is still losing passengers to him. Either branch contradicts «sigue regalándome clientes». |
| `scene-successor-happy-0` | «Hoy el tren corre más que mis respuestas en redes. El horario está inflado. O pagamos refuerzos o dejamos de vender humo en ventanilla.» | «Hoy el tren corre más que mis respuestas en redes» requires no incident this week; «El horario está inflado … dejamos de vender humo en ventanilla» requires driverCoverage < 0.95 with no overtime running, which cancels the uncovered trains this week, and driver-shortage cancellations are incidents (fact incidents(n)). |

### 7.2 Conditional on mechanics (17 groups)

Each group is never true if the unified engine lacks the named mechanic. In that case add the group to the retired set at build time.

| Group | Bodies | Never true if | Keep if |
|---|---:|---|---|
| All topic-0 driver lines (`scene-{president,minister,successor,treasury,riders,mayor,rival}-*-0`) | 49 | the unified engine has no driver pool with a coverage gap (classic starts with 180 drivers vs need 29 — tycoon.js:11-13 — so staffing was 1 in 620/620 sampled encounters; rescue has no drivers at all). | drivers/driverNeed/coverage + 13-week training + retirements are implemented (facts drivers/…). |
| adif topic 0 (on-call crew) (`scene-adif-*-0`) | 6 | no track-crew pool (rescue crews) in the unified game. | rescue crews kept (rescate.js:486-501). adif.happy-0 is retired anyway. |
| workshop topic 0 (night shift) (`scene-workshop-*-0`) | 7 | no workshop capacity/queue model. | shopSlots/shopQueue implemented. |
| successor topic 1 (YaIré promo) (`scene-successor-*-1`) | 7 | YaIré (Rossa) is not a competitor in the unified game (rescue only has Lowgo, rescate.js:1278). | classic rossa with promotions (tycoon.js:25-32) is ported. |
| president topic 1 (OuiOui) (`scene-president-*-1`) | 7 | OuiOui/Lowgo absent; with the rescue calendar only true from week 209. | Lowgo kept. |
| rival scenes (Autocares Meseta) (`scene-rival-*-* (all 35 bodies depend on bus share/bus campaign facts; I0/I3 can also fire on strikes or replacement buses)`) | 35 | no bus competitor model (busShare, 26-week campaigns every 78 weeks). | classic bus logit (engine.js:56-66) and buswar cadence (engine.js:230) are ported to weeks. |
| treasury topic 3 («otra escultura delante del apeadero») (`scene-treasury-*-3`) | 7 | no vanity item (Monumento al Ministro, rescate-data.js:240) in the unified game. | monumento (or another vanity spend) is kept. |
| treasury angry/worried + topic 4 («El piloto tiene presupuesto») (`scene-treasury-angry-4, scene-treasury-worried-4`) | 2 | pilots are paid from general cash: "No sale"/"se me ha cortado el café" contradicts "el piloto tiene presupuesto". | the ring-fenced pilotEarmark exists (then general cash can be bad while the pilot line is funded). |
| riders topic 4 («Si la aplicación vuelve a perder el billete») (`scene-riders-*-4`) | 7 | no app-glitch fact and no 'app' tech. | deterministic peak-week glitch until 'App que funciona' (rescate-data.js:152) is owned. |
| workshop topic 3 («el AVE de la foto») (`scene-workshop-*-3`) | 7 | the unified network has no AVE service (the 11 rescue corridors are Iberian/mixed gauge, segments.json). | classic AVE routes (S100/S103/S112…) coexist with the regional corridors. |
| mayor proud + topic 3 (Villanueva halt) (`scene-mayor-proud-*, scene-mayor-*-3`) | 11 | no buildable halt for Paco (estacion-paco pact, rescate-data.js:289-295) and no territory station building. | the pact/halt is kept (it is one of the 3 recorded rescue lines: paco-estacion). |
| minister (35) / successor (35) (`scene-minister-*-*, scene-successor-*-*`) | 70 | that person is not in office during the unified timeline. | political calendar keeps the hand-over (rescue: week 208/209, rescate.js:686). |
| All topic-3 station lines («El andén olvidado») (`scene-*-*-3`) | 63 | there is no per-station staffing model (staffed flag, 26-week staffing at 0.006 M€/week, stationPax). Classic stations only have cosmetic levels 0-3 (engine.js:241, boost engine.js:52); rescue has only Paco’s halt (rescate.js:612-620). | stations facts implemented (stationStaffed/stationPax/unstaffedBusy, accessible flag). |
| All topic-4 pilot lines («El invento del mes») (`scene-*-*-4`) | 63 | there is no pilot mechanic (0.3×cost, 8 weeks on one corridor, measured result, credit toward the purchase). Buying a tech outright (rescue research(), rescate.js:701) is not «un piloto». | pilotable(T) and the pilot ledger are implemented on the rescue TECHS (rescate-data.js:140-159). |
| All topic-1 «Campaña de descuentos» lines (`scene-*-*-1`) | 63 | option A cannot produce a real, time-limited fare cut with auto-restore (the classic hype flag is not a discount). | the 13-week fare ×0.85 campaign (26-week ×0.80 rural variant) is implemented on the existing corridor fares (rescate.js:434-445). |
| minister topic 1 (Charo and the calculator) (`scene-minister-*-1`) | 7 | only Lowgo exists as competitor: on the rescue calendar Lowgo arrives at week 209 (rescate.js:1278-1279), after the minister leaves (week 208), so her line needs a YaIré promotion or the Autocares Meseta campaign. | YaIré promotions or the bus campaign are ported. |
| successor worried (leak) (`scene-successor-worried-*`) | 5 | no cloacas and no hidden-problem facts. | cloacas (secrets/skipTests) or the hidden-problem alternatives are implemented. |

### 7.3 Narrow windows (9)

These can be true, but only under an extra rule that the selector must check.

| Ids | Rule |
|---|---|
| `scene-minister-happy-0` | Only when coverage is 1 this week and drops below 1 from next week (a train returning from the workshop to its corridor, a retirement, or service added for next week). If coverage is already <1, trains are being cancelled now, which are incidents and break «una mañana sin ruedas de prensa». |
| `scene-riders-happy-0` | The cancelled first departure must be on Levante or Sur, not on the Norte: Marisa rides the Norte and says she arrived on time today. |
| `scene-rival-disappointed-1` | Through the campaign branch only in its 4th week (opener needs ≥4 weeks unanswered, topic needs ≤4 weeks since it started); otherwise only through stageFailed(4). |
| `scene-workshop-happy-0` | Opener forbids any service train <45 %, so the topic can only be true through shopQueue ≥ 1 (preventive revisions waiting) or through ≥2 trains between 45 and 49 % with the shop full. |
| `scene-workshop-worried-3` | Opener allows at most one spare; the topic needs one compatible idle unit. True only with exactly one spare, which is the one the player can send to provinces. |
| `scene-adif-determined-3` | Feasible only because option A uses an outside contractor for the access mini-work; if the implementation makes it use an Adif crew, retire it (opener requires crewsFree = 0). |
| `scene-adif-happy-2` | The inspected corridor must be a different one from the corridor whose work just finished (that track is new). |
| `scene-treasury-angry-4, scene-treasury-worried-4` | Only with the ring-fenced pilotEarmark (see combosConditional); without it, retire both. |
| `scene-mayor-happy-3, scene-mayor-proud-3, scene-mayor-disappointed-3` | Need Villanueva del Andén built (stationNorte) and unstaffed; mayor.happy only through its villanuevaOpened(8) branch. |

## 8. Mechanics the unified engine needs so these dialogues are true

- Political calendar fact office.transport (minister ≤ week 208, successor ≥ 209) and a gobierno trust value (classic government group or poll-derived).
- Driver pool: drivers, driverNeed = Σ trains in service × 3.5, coverage, deterministic cancellation of uncovered trains (first departures, largest corridors first, never an essential to 0), 13-week training at 0.015 M€/driver, retirements (−1 driver every 8 weeks), overtime option 0.015 M€ per uncovered train-week.
- Workshop capacity: 2 slots (+1 with Gran Taller stage 1), queue, night-shift option (0.02 M€/week, −1 revision week, wear ×0.8).
- Per-unit train memory: warned[t], breakdown history, fix-fast repeat, returned-from-revision tag in the weekly report.
- Station model on corridor nodes: staffed/accessible flags, staffing cost 0.006 M€/week for 26 weeks, demand ×1.03 when staffed / ×0.98 when centralised, stationPax from POP weights; Villanueva del Andén as Paco’s halt.
- Competitors: OuiOui (Lowgo) with war phases, YaIré (Rossa) with promotions, Autocares Meseta bus logit share per corridor and 26-week bus campaigns every 78 weeks; playerAnsweredBusWar flag.
- Real discount campaigns: fare ×0.85 for 13 weeks with auto-restore and countdown (rural variant ×0.80 for 26 weeks); replaces the hype flag.
- Targeted revisions (one train, revisionCost/revisionWeeks) replacing fleetcare; breakdown multiplier ×1.5 for 8 weeks when declined; LTV track-fault rule for declined inspections.
- Tech pilots: pilotable(T), 0.3×cost, 8 weeks on one corridor, measured-result notice, 13-week credit toward buying T, 13-week cooldown after "Pedir otra evaluación"; ring-fenced pilotEarmark (0.4 M€/year).
- App-glitch fact (peak weeks woy 30 and 51 while "App que funciona" is not owned).
- Work facts: acceleratedWeek, firstTry (no retest/pause/delay), cause-based terrain/winter delay rule for mountain segments, big-work milestone detection, infeasiblePromise and promisesOnMud counters.
- Obstacle ageing (weeks alive without an addressing order) for "has aparcado problemas".
- Rider concession/affront ledger and fare-change history per corridor.
- Encounter ledger s.enc with cooldowns, used bodies, active effects with end weeks and chain flags; re-validation before display and on load.
- Event log s.eventLog [{id, week, choice}] so eventHappened(id, n) works (rescue only pushes decisions, rescate.js:1277), plus week stamps on one-shot flags (stationNorte, halfwork-*, aid-*) and weekly histories of bus/rail share and network punctuality for the delta facts.
- Rolling-stock compatibility per corridor from segments.json and trains.json (gauge ib/mixto/std; 3 kV, 25 kV or none; diesel or bimodal) for spareCompatible, the reserve move of workshop topic 3 and the bimodo pilot; a flagship AVE service on std-gauge 25 kV lines if workshop topic 3 is kept.
- Driver overtime state overtimeActive (4 weeks), separate from the raw driver pool, so topic-0 lines are not re-offered while it runs.
- UI hooks: corridor-sheet chips with countdowns, train-card status lines, station markers, tech-card pilot status, Finanzas rows (Horas extra, Personal de estación, Partida de pilotos), weekly-report consequence lines naming the scene that caused them.

## 9. Facts vocabulary

| Fact | Definition | Classic source | Rescue source | New |
|---|---|---|---|---|
| `week` | Unified weekly turn (1..416, 4 Jan 2027 → 2034). | month (engine.js:216) ×≈4.33 | s.week (rescate.js:41) |  |
| `woy` | Week of year = (week-1)%52. | - | used by calor/nevada windows (rescate.js:891-892) |  |
| `office.transport` | Who holds Transport: 'minister' (Raquel Sanz) until week 208, 'successor' (Óscar del Puente) from week 209. Parameter of the political calendar, not hard-coded per scene. | both exist (story.js:5-6) | pact windows: successor only ≥209, minister only ≤208 (rescate.js:686) |  |
| `weeksToElection` | Weeks to the next of ELECTIONS [208, 416]. | - | rescate-data.js:8 |  |
| `poll / pollDelta4` | electionForecast(s): Σ 26-week group averages × weights; delta vs 4 weeks ago. | - | rescate.js:1029-1038, weights rescate-data.js:13-18 |  |
| `trust.{gobierno,hacienda,plantilla,viajeros,territorio}` | Group support 0-100. Rescue has viajeros/territorios/trabajadores/economia; classic adds government. Unified needs a gobierno value (classic target tycoon.js:162 or derived from poll). | tycoon.js:6, 162-163 | rescate.js:1000-1027 (7 %/week drift :1042) | yes |
| `trustDelta8.g` | Change of trust.g over the last 8 weeks (needs groupHist). | - | s.groupHist (rescate.js:51) |  |
| `lastMood[person], lastMoodWeek[person]` | Mood and week of the last voiced line of that person (encounter ledger + pacts/events/stage lines, which all carry person+mood). | - | LINES person/mood (rescate-data.js:369-446) | yes |
| `cash` | Cash in M€. | s.cash | s.cash |  |
| `cashMin13` | Minimum of the 13-week cash projection (same rule the UI shows as the red top-bar warning). | - | cashProjection rescate.js:135-147 |  |
| `due(n)` | Scheduled non-work payments in the next n weeks (debt, insurance, loans, penalties). | - | upcoming rescate.js:122-133; obstacle filter rescate.js:1093-1095 |  |
| `ord8` | Mean ordinary weekly result of the last 8 weeks. | s.last.net (monthly) | s.hist[].ordinary (rescate.js:1150-1155) |  |
| `isQuarterClose / ordQ / ordQprev` | Week%13===0 and the summed ordinary result of the quarter just closed and the previous one. | - | quarter rule rescate.js:35; OSP at close rescate.js:1245-1249 |  |
| `spend4` | Discretionary money spent by orders in the last 4 weeks (buy, work, mega, campaign, pilot). | - | s.orderLog (rescate.js:287) + amounts (new field) | yes |
| `misuse4` | Any in last 4 weeks: cancelled work with penalty, accelerated work (+30 %), vanity mega stage paid, bribe paid from caja A, loan taken while ord8<0. | - | cancelWork rescate.js:403-419, accelerateWork 380-391, monumento rescate-data.js:240, bribe 769-793, takeLoan 550 | yes |
| `pilotEarmark` | NEW: ring-fenced pilot budget (Hacienda earmarks 0.4 M€ each January; unspent lapses on 31 Dec). Only "Financiar el piloto" can spend it. | - | - | yes |
| `punctNet / punctNet4` | Mean punctuality of open corridors with trains this week, exactly as record() stores it in s.hist[].punct / mean of the last 4 weeks. | balance().punctuality (engine.js:75) | record() rescate.js:1150-1155; per corridor c.punct and c.hist (30 weeks, rescate.js:1195) |  |
| `incidents(n)` | Operational incidents in last n weeks: breakdowns, test failures, stalled works, cable, snow, landslide, strike weeks, track faults (LTV), driver-shortage cancellations. n=0 means this week. | ops incidents (operations.js:150-169) | report.events (rescate.js:1203-1215); incidentFree resets on any event (rescate.js:1274) |  |
| `majorDisruption2` | In last 2 weeks: corridor closed (c.closed), strike (s.strike>week), snow-wait (incidentNow≥15), a corridor left with 0 trains by a breakdown, or any incident ≥10 punctuality points. | - | rescate.js:944-954, 1189-1193 |  |
| `load[c] / lostShare[c]` | c.capacityLoad and c.lost/(c.pax+c.lost). | capacity*.98 (engine.js:62) | capacityLoad set in operate() rescate.js:245; congestion rule −min(10,(load−1)×25) if load>1.05 (punctTarget rescate.js:177) |  |
| `problemSolved4` | A corridor whose punctuality was <70 in ≥8 of weeks [-12,-4] and is ≥80 now, or whose lostShare went from ≥0.10 to <0.02 in the last 4 weeks. | - | c.hist (30 weeks kept) |  |
| `fleet: fleetAvg, minServiceCond, low45, spare, inShop` | Per-unit fleet facts. low45 = service trains with condition<45 (the rescue "trenes gastados" obstacle); spare = serviceable trains without corridor. | lots with qty (engine.js:24) — no units | obstacles rescate.js:1089-1092; trainsIdle rescate.js:120 |  |
| `returned2` | Trains that came back from revision (set to 95 %) or refit in the last 2 weeks. | refits back at 98 (engine.js:224) | revision → 95 % at rescate.js:1175 (needs a report tag) | yes |
| `breakdowns(n), breakdownsOf(t,n)` | Random breakdowns per rescue formula p=(1−reliability)×0.05×(1+(100−cond)/50)×(1+mod breakdown). | - | rescate.js:1201-1205 |  |
| `warned[t]` | NEW memory: week in which the workshop warned about train t (topic-2 encounter answered "Seguir con el plan previsto", or W2 opener about t). | - | - | yes |
| `preventive4` | NEW: in last 4 weeks the player sent a train with condition ≥45 to revision before any breakdown, or set sliders.fleet>1. | s.maintenance>1 (engine.js:214) | sendRevision rescate.js:470-480; sliders (rescate.js:48) | yes |
| `repeatBreakdown13 / fixFastRepeat` | Same train broke twice in 13 weeks, or a train repaired with fix-fast (horas extra, back at ≥60 %) broke again within 8 weeks. | - | fix-fast rescate.js:941; back at ≥60 rescate.js:1175 | yes |
| `shopSlots / shopQueue` | NEW: workshop capacity (2 simultaneous revisions/breakdowns, +1 with Gran Taller stage 1) and trains waiting for a slot. | - | MEGAPROJECTS taller rescate-data.js:200 | yes |
| `hasAVEservice` | A high-speed flagship is in service on a standard-gauge 25 kV line somewhere in the unified network: classic AVE family (S100/S112/S103/S106/AV2030, data.js:58-62; trains.json s103, s112, bcbb_hs are std-gauge 25 kV only, s106 is variable-gauge 3 kV+25 kV). | MODEL.family (data.js:58-62) | none: the 11 rescue corridors are Iberian or mixed gauge (segments.json) | yes |
| `works: workFinished(n), workFirstTry(n), workDelayedNow, accelerated(n), kickback, bigWorkMilestone` | Work lifecycle facts. firstTry = finished with !retested && !resumed && !delayed. DelayedNow = tests failed this week (12 %) or the NEW terrain/winter rule fired. | projects delay 22 % +3..9 months (engine.js:225-226) | w fields rescate.js:349; retest 1215; doneWeek 1218; accelerate 380-391 | yes |
| `crewsFree / trackNeed` | Free track crews; trackNeed = an open corridor with track<50 and no work. | - | crewsFree rescate.js:117; obstacle "Sin cuadrillas libres" rescate.js:1093 |  |
| `workPausedCash` | "Obra parada por falta de caja" fired this week. | - | rescate.js:1210 |  |
| `halfWork` | A work was cancelled with ≥50 % built (flags["halfwork-"+c]). | - | cancelQuote rescate.js:403-407, flag set rescate.js:417 |  |
| `promisesOnMud(n)` | NEW: number of pacts/contracts/campaigns signed in last n weeks while a work was active and behind schedule (retested, paused or delayed). | - | - | yes |
| `infeasiblePromise` | NEW: an active pact/contract deadline earlier than the earliest completion week of the work it needs. | contracts (tycoon.js:35-120) | pacts inauguracion/tuits (rescate-data.js:320-337) | yes |
| `lowgoShare[c] / lowgoWar` | OuiOui (Lowgo) share on c; war = discount phase (classic: cycle%3===1 → fare ×0.78). | competition tycoon.js:25-32 | rivalShare rescate.js:214-218 (strength 0.2 → 0.4, +0.0006/week, rescate.js:1278-1280); no war phases in rescue |  |
| `yairePromo / yairePromoStarted(n)` | NEW in rescue: YaIré (Rossa) present with a promotion (classic war phase). | rossa in competition() tycoon.js:27-30 | absent | yes |
| `busWar / busWarStartedWeek / playerAnsweredBusWar` | Autocares Meseta price campaign: 26 weeks every 78 (classic 6 months every 18, bus fare ×0.78). playerAnsweredBusWar = topic-1 option A taken (or fare cut ≥10 % on bus corridors) since it started. | engine.js:57, 230 | absent (only gaceta flavour rescate-data.js:456) | yes |
| `busShare[c] / busShareDelta8 / trainShareDelta8` | Bus share of the corridor market (classic logit busWeight) and its 8-week change. | metrics busShare (engine.js:56-66) | absent | yes |
| `busesHired` | Corridors whose works use SERVICE_MODES.alternativa (replacement buses = paid to Autocares Meseta). | ops bus choice (operations.js:209) | SERVICE_MODES rescate-data.js:107-111; c.works rescate.js:1213; bus cost row rescate.js:230 |  |
| `drivers / driverNeed / driverCoverage / cancellations(n)` | NEW in rescue: driver pool. need = Σ trains in service × 3.5; coverage = min(1, drivers/need); uncovered trains u = ceil(gap/3.5) are cancelled (first departures first, largest corridors first, never an essential to 0). Hiring: 0.015 M€/driver, 13 weeks training; retirements 1 driver every 8 weeks. | driverNeed/staffing tycoon.js:12-13, hire tycoon.js:16; trips cut operations.js:131-132 | absent (staff is a cost only: STAFF_BASE, TRAIN_RUN.crew rescate.js:9-15) | yes |
| `overtimeActive` | NEW: a driver-overtime period bought with a topic-0 option A is running (4 weeks). driverCoverage stays the raw pool ratio, but no train is cancelled while it runs, so no topic-0 driver line can be offered again until it ends. | - | - | yes |
| `serviceIncrease4` | Trains added, corridor opened or express added in last 4 weeks. | - | orderLog servicio (rescate.js:287, 434-469) |  |
| `strike` | s.strike > week. | flags.strike (engine.js:54) | rescate.js:950 |  |
| `villanuevaStation / villanuevaOpened(n)` | Paco's apeadero on the Norte exists (and was commissioned ≤n weeks ago). | - | flags.stationNorte (rescate.js:1272; effects 184, 195) |  |
| `stations: stationStaffed[x], stationPax[x], unstaffedBusy` | NEW: per-node station staffing. stationPax = corridor pax × POP weight of the node; unstaffedBusy = unstaffed stations with ≥1.5 k pax/week. | stations[city] levels 0-3 (upgradeStation engine.js:241; demand boost +6 %/level engine.js:52) | absent | yes |
| `territoryServed[c] / territoryUnserved` | Territory corridor open, with trains and punct>55. | - | rescate.js:1006 |  |
| `territoryCut4` | NEW: in last 4 weeks trains removed from a territory corridor (or from the Norte while Villanueva exists), corridor closed, insolvency "cut", or topic-3 "Atención centralizada" at a territory station. | - | insolvency cut (rescate.js:980) | yes |
| `pacoGrudge / pacoPactCheap / licenseIdle13` | cloacas.grudges has mayor; estacion-paco signed in its cheap version (prefab, 0.9 M€); a territory licence bought ≥13 weeks ago with the corridor still closed. | - | rescate.js:1016; rescate-data.js:289-295; licence 561-570 |  |
| `vanity` | A vanity item paid in last 26 weeks (Monumento al Ministro stage ≥1). | - | rescate-data.js:240 |  |
| `pilotable(T) / pilotables` | NEW: tech T not owned, its needs owned, its tier milestone reached (TIER_MILESTONE), no pilot of T in last 13 weeks, pilotCost=0.3×T.cost ≤ cash−due(4) (or ≤ pilotEarmark). Only techs with a measurable effect on one corridor are pilotable: ultrasonidos, predictivo, cadenciados, regulacion, ertms, contrato, bimodo, abono, dinamico, app. Never pilotable: bateadora (speeds works, no corridor effect), segunda (a purchase discount), and the comunicacion and fontaneria branches (prensa, inauguraciones, influencers, contabilidad, abogados, destructora). | TECHS tycoon.js:8, research tycoon.js:17 | TECHS rescate-data.js:140-159; TIER_MILESTONE 162; techState rescate.js:692-700 | yes |
| `ownsApp / appGlitch(n)` | NEW: until 'app' (App que funciona) is owned, the old app fails deterministically in the two peak weeks (woy 30 and 51) once pax ≥30 k/week; appGlitch(n) = such a failure in last n weeks. | 'online' tech (tycoon.js:8) | 'app' rescate-data.js:152 | yes |
| `dynamicPricing / fareChanges8[c]` | 'dinamico' owned (or classic policy dynamic), or fare of c changed ≥2 times in 8 weeks. | POLICIES.dynamic tycoon.js:7 | 'dinamico' rescate-data.js:151; reorganize fare rescate.js:442 | yes |
| `secretsHidden / skipTestsUsed8 / suspicion` | Unexposed corruption secrets, inspector bribe used in last 8 weeks, suspicion. | - | cloacas (state rescate.js:54; exposeSecret 799-816; skipTests 1214) |  |
| `results: stagePassed/stageFailed(n), milestone(n), electionWon(n), pactFulfilled/pactBroken(n,person), aidPaid(n), contractLost(n)` | Outcome events of the last n weeks. | contracts won/lost tycoon.js:172-182 | evaluateStage rescate.js:1112-1127; pacts 621-647; aid 1261-1263 |  |
| `obstaclesAged(8)` | NEW: obstacles() entries that have existed ≥8 consecutive weeks with no order addressing them. | - | obstacles rescate.js:1079-1101 | yes |
| `dithered13` | In last 13 weeks an offer (pact/contract) expired unanswered or "Pedir otra evaluación" was chosen. | contracts declined (tycoon.js:180) | offers expire (rescate.js:681-688) | yes |
| `riderConcession4 / riderAffront4 / riderAffronts26` | NEW: concession = fare cut ≥5 %, train added to a corridor with load>1.05, carta-viajeros signed, or option A of a riders-group scene. Affront = fare rise on a corridor with punct<80, trains removed, dynamic pricing bought, or option B of a riders-group scene. | - | carta-viajeros rescate-data.js:314-319 | yes |

### 9.1 Helper predicates used in the expressions

| Helper | Definition |
|---|---|
| `announcement(n)` | A public promise in the last n weeks: pact signed (signPact rescate.js:595-605: carta-viajeros, inauguracion, tuits) or an encounter option A with a deadline. |
| `busCompetes(c)` | Autocares Meseta bus share on c ≥ 0.05 (classic busWeight logit, engine.js:59-61). |
| `busShareDelta4` | Network bus share now minus 4 weeks ago, in points. |
| `busShareSinceWarStart / trainShareSinceWarStart` | Bus (rail) share now minus the share in busWarStartedWeek, in points. |
| `busWarAge` | week − busWarStartedWeek. |
| `busWarStartsNow` | The scheduled 26-week campaign (every 78 weeks; classic 6 months every 18, engine.js:230) starts this week. |
| `chain` | Chain flags in the encounter ledger s.enc.chain (e.g. pacoPlanted = week of successor-topic-3 option B). |
| `cloacas` | s.cloacas (rescate.js:54); stage ≥ 1 = open court case (judicialWeek rescate.js:862-885). |
| `corridorOpened(n)` | Corridors opened in the last n weeks (openCorridor rescate.js:457-469). |
| `countServiceBelow(x)` | Number of service trains with condition < x. |
| `crisisPending` | A strike, scandal, extortion or insolvency decision is pending (s.decisions; rescate.js:1166-1167, 986-994). |
| `discretionaryOnTable` | An optional spend is active or offered: discount campaign, pilot, inauguracion pact offer, Monumento stage available. |
| `disruptedCorridor` | Corridor of the majorDisruption2 event. |
| `driverCoverageNextWeek` | Coverage with next week’s trains: returns from the workshop to t.back (rescate.js:1176), scheduled retirements, service already ordered for next week. |
| `essential(c)` | CORRIDOR.essential (Norte, Levante, Sur; rescate-data.js:27-33). |
| `eventDecision(n)` | An event/scandal/extortion decision was shown in the last n weeks (rescate.js:1276-1277). |
| `eventHappened(id, n)` | Random event id shown in the last n weeks (needs an event log; rescue only pushes to s.decisions, rescate.js:1277). |
| `excuses13` | Count in 13 weeks of: failed tests (rescate.js:1215), work delay (NEW terrain/winter rule), work stalled for cash (1210), work cancelled (408-420), missed inauguration deadline (pact broken, 621-638). |
| `fare(c) / fareRef(c)` | c.fare and the reference fare CORRIDOR.fare used by the elasticity (rescate.js:198). |
| `fareCut4OnBusCorridor` | Largest fare cut (fraction) in 4 weeks on a corridor where busCompetes. |
| `fareIndexHigh` | Some open corridor has fare ≥ 1.15 × fareRef, or a territory corridor has fare ≥ fareRef with occupancy < 0.4. |
| `firstTime85(n)` | A corridor reached punctuality ≥ 85 for the first time in the game in the last n weeks (c.streak rescate.js:1196 gives the week). |
| `halfWorkRecent(n)` | halfWork flag set in the last n weeks (flag rescate.js:417 needs a week stamp). |
| `hasTech(id)` | rescate.js:105. |
| `hasUnelectrified(c)` | c.elec is false and segments.json has an elec "no" segment on c (Extremadura Madrid–Talavera–Plasencia, Teruel Zaragoza–Teruel–Sagunto, Soria Torralba–Soria). |
| `inShopFrom(c)` | Trains in revision/broken whose t.back = c. |
| `incidentFreeWeeks` | s.incidentFree (rescate.js:1274). |
| `insolvencyCutPendingOnTerritory` | An insolvency decision is pending and its «Recortar servicios» choice would hit a territory corridor (cut takes the open corridor with >1 train and worst margin, rescate.js:980). |
| `isTerritory(c)` | CORRIDOR.territory set (rescate-data.js:48-57). |
| `lostShareMax` | Max over open corridors of c.lost/(c.pax+c.lost). |
| `lowgoBeaten(n)` | On a Lowgo corridor rivalShare fell below 0.40 after having been above 0.50, in the last n weeks. |
| `maxIncidentsOneCorridor(n)` | Most incidents on a single corridor in n weeks. |
| `megaActive / megaStalled(n)` | Any s.megas[id].active (rescate.js:1224) / «etapa parada por falta de caja» in n weeks (rescate.js:1226). |
| `minCondOn(c) / minTrackOpen` | Lowest condition of service trains on c / lowest c.track among open corridors. |
| `occupancy(c)` | c.pax / (seats on c × SEAT_TURNS) (rescate.js:14, 202-206). |
| `openingTrain` | The unit that will serve the upcoming opening: the idle unit openCorridor would assign (best condition, rescate.js:463) or the corridor’s own trains for a work. |
| `ospBonus(n)` | ospBonus raised (contrato-programa) or an OSP quarter paid with comp.bad = 0 after a bad one, in n weeks (rescate.js:1245-1249). |
| `pacoStationUnstaffed` | villanuevaStation && !stationStaffed.villanueva. |
| `pactActive(id) / pactEnded(n, id) / pactQuarterMet(id)` | rescate.js:574 / the pact ended (fulfilled, broken or expired) in n weeks / contrato-programa quarter obligation met at quarter close (rescate-data.js:302-307). |
| `pilotCost(T)` | 0.3 × TECH[T].cost (rescate-data.js:140-158): ultrasonidos 0.12, cadenciados 0.09, abono 0.09, contrato 0.15, predictivo 0.30, regulacion 0.36, dinamico 0.24, app 0.36, bimodo 0.48, ertms 0.78 M€. |
| `punct[c] / punctHist[c]` | c.punct and c.hist (30 weeks, rescate.js:1195). |
| `reliability(t)` | OFFER[t.offer].reliability (rescate-data.js:75-84): KAFKA 0.9, Dörfler 0.97, BCBB 0.78, used 0.7. |
| `revisionCost` | rescate.js:482: 0.18 × (1 + mod revisionCost) M€ (0.135 with «contrato»). |
| `riderProblemAge` | Consecutive weeks the same rider problem persisted: a corridor < 70 punctuality, overcrowding (load > 1.10) or fare ≥ 1.15 × fareRef. |
| `scandal(n)` | Scandal decision in n weeks (SCANDALS rescate.js:794-798). |
| `seriousObstacles` | obstacles() entries with severity 3 (rescate.js:1079-1101). |
| `spareCompatible(c) / spareFor(c)` | Idle service trains (trainsIdle rescate.js:120) that can run every segment of c: gauge ib or mixto (all 11 corridors; std-gauge-only s103/s112/bcbb_hs cannot), traction diesel or bimodal where c has elec "no" segments, 25 kV capability for the Galicia and Plasencia–Badajoz 25 kV segments, 3 kV elsewhere (segments.json, trains.json). |
| `stageGoalOpen / stageGoalOffTrack / weeksLeftStage` | stageProgress (rescate.js:1058-1077) against the STAGES windows (rescate-data.js:252-273). |
| `stationTaskStarted(n)` | flags.stationTask.started within n weeks (buildStation rescate.js:612-620). |
| `territoryAtRisk` | See mayor.worried. |
| `territoryOpenable(c)` | Licence held (s.territories, licenseTerritory rescate.js:561-570), track ≥ 40 and a compatible idle train (openQuote rescate.js:446-456). |
| `territoryOpened(n) / territoryStationBuilt(n)` | Territory corridor opened / a station commissioned on a territory corridor (today only Villanueva on the Norte) in n weeks. |
| `track[c]` | c.track. |
| `trainsOn(c)` | Service trains on c (rescate.js:165). |
| `trustHist` | s.groupHist (rescate.js:51). |
| `unstaffedMainStation(c)` | The main intermediate station of c is not staffed. |
| `upcomingOpening(n)` | An active work whose workSchedule (rescate.js:356-363) ends within n weeks and opens or reopens service, or an inauguracion pact deadline within n weeks. |
| `villanuevaOpenedWeek` | Week flags.stationNorte became true (rescate.js:1272; needs a stamp). |
| `workCancelled(n) / workOn(c) / workStartedInTerritory(n) / worksActive` | Work cancelled in n weeks / an active work on c / a work started on a territory corridor in n weeks / count of active works. |
