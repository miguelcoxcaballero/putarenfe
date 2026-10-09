# Classic story dialogues: what they say vs what the game does

Full data: `audit-story.json`, 97 records with exact text, claim, trigger (file:line), choice effects, verdict, evidence and unified fix.
Scope: the 97 non-encounter classic bodies (15 decisions, 22 events, 5 chapters, 5 arcs, 36 induction lines, 14 induction feedbacks).
Method: I read `story.js`, `induction.js`, `tycoon.js`, `engine.js`, `operations.js`, `induction-runtime.js`, `induction-task-ui.js`, `tycoon-ui.js` and `app.js`, and checked the numbers with Node simulations (scripts in `unify/simstory/`).

## Verdicts

| kind | coherent | partial | notImplemented | contradicts | flavor | obsolete |
|---|---|---|---|---|---|---|
| decision | 5 | 8 | 0 | 2 | 0 | 0 |
| event | 3 | 16 | 3 | 0 | 0 | 0 |
| chapter | 2 | 3 | 0 | 0 | 0 | 0 |
| arc | 0 | 3 | 1 | 1 | 0 | 0 |
| induction | 29 | 5 | 0 | 0 | 2 | 0 |
| feedback | 13 | 1 | 0 | 0 | 0 | 0 |
| **total** | 52 | 36 | 4 | 3 | 2 | 0 |

- **The induction is solid.** 29 of 36 lines and 13 of 14 feedbacks hold. Their numbers match the code exactly: 4 M€ to open a service, 20 drivers for 0,3 M€ with 3 months of training, online sales 10 M€ / 4 months, ERTMS 35 M€ / 12 months, the incident team 18.000 € with delay ×0,3, the bus 9.000 €. Torralba–Soria quotes 44 M€ / 21 months, and Madrid–Salamanca needs an electric Alvia through the changer at Medina.
- **Decisions, events and arcs are where the game lies.** 33 of 47 are partial, not implemented or contradictory.

## Cross-cutting problems (fix once, fixes many)

1. **The milestone decisions play before the infrastructure they announce.** The decisions use `s.month>=at` (engine.js:155), but the history uses real days (infra.js:15-21, 79-95).
   - Burgos (decision 1 July, works 21 July), Murcia (1 December, works 20 December), Pajares (1 November, works 29 November) and Extremadura (1 December, works 14 December) are untrue when they play if the player delegates the month.
   - With daily play they are true only because of a **rollover bug**. `nextDay` calls `step()` while `s.ops.day` still holds the previous month's last day (operations.js:232). `gameDate` (engine.js:15) then makes `advanceInfra` (engine.js:217) apply the **whole new month's** history on day 1.
2. **Promises are never tracked.** These choices only move money or reputation: «Plan Extremadura», «Lanzar los Alvia a Asturias», «Prometer catenaria» (Teruel), «Prometerle un estudio» (the chained mayor), «Una red para todos», «Inaugurar lo que haya», the rural contract (paid with no obligation), and the EU tender.
3. **Choices whose label is an action that never happens:**
   - «Reducir la oferta» (climate) cuts no service and worsens punctuality for 12 months.
   - «Bajar tarifas» (busprice) changes no fare.
   - «Reforzar los Alvia» and «Refuerzo de verano» add no trains.
   - «Servicios mínimos» (strike) removes no trips.
   - «Limitar velocidades» (heatwave) does not change trip times.
   - «Vallar» (cows) does not reduce incidents.
4. **Exogenous shocks exist only if you pay.** The discount-pass and festival demand surges, the bus price war and the factory queue all happen only for the choice that pays or accepts them.
5. **Network-wide blunt flags instead of local state.** Cable theft and snow reduce reliability on *every* route (`strike`/`heat` flags, engine.js:54). Roman remains and the «obra adelantada» event shift *all* works (engine.js:170).
6. **Gambles ignore the state and can be gamed.**
   - The audit (55 %) and the state visit (50 %) do not depend on accounts or punctuality.
   - With cash < 20 the audit's bad branch throws after the random draw (engine.js:164, 172), and `act()` keeps the new seed (app.js:184-187). The player can re-roll until winning: 300/300 wins with cash 10, versus 160/300 with cash 100.
7. **Softlock.** «Hacienda congela fondos» has two paid choices (−30 / −12). With cash < 12 both are disabled (app.js:1174), Esc is blocked (app.js:1451) and `step()` will not run (engine.js:209).
8. **No elections.** «Elecciones anticipadas», arc 4 «Urnas y vías», the president's «ya sabes dónde está la puerta» and «el presidente toma nota» have no mechanic in the classic. Rescate already has one: ELECTIONS [208,416] (rescate-data.js:8) and `election()` (rescate.js:1128-1136; forecast rescate.js:1029).
9. **The first contract is fake tension.** Mission-0 asks for 250.000 (commercial 312.500) new passengers in 18 months, but the starting network carries **525.786 a month**, so both branches are won at the first month close. That breaks 3 induction lines and 1 feedback (tycoon.js:146, 154).
10. **The arc lines don't match the route chosen.** Arc 0 «Guerra de precios» was given Valencia–Alicante, with no OuiOui, in simulation. Mission-0 also carries the arc 0 line. Arc 1 Pajares can be skipped because its fallback still advances the counter (tycoon.js:69-71, 176, 180).

## Worst offenders

- **decision:energy (contradicts).** The hedge costs 24 M€; refusing costs about 3,9 M€ a year (energy term 1,48 M€/month × 22 %). «La segunda, más» is false, and the `hedge` flag is never read.
- **decision:climate (contradicts).** A 45 °C summer crisis fires in October 2030 (month 105). «Reducir la oferta» reduces nothing and gives −5 reliability for a year.
- **arc:0 (contradicts).** It talks about OuiOui's prices on contracts that have no OuiOui.
- **event:election and arc:4 (notImplemented).** There are no elections.
- **event:teruel (notImplemented).** The promise has no state, and the event can fire after Teruel is electrified.
- **event:cows (notImplemented).** The fence changes nothing.
- **The Burgos, Murcia, Pajares and Extremadura decisions (partial).** Bad timing, and actions that do nothing.

## Timeline note for the unified mode

These lines are date-locked to 2022–2026:
- inaugural context; induction «Enero de 2022», «hoy alcalde consultado» and «En 2022 no han entrado todos»;
- the burgos, discounts, Rossa, murcia, gauge, pajares, extremadura, s106 and futuretender decisions.

If the unified game starts in 2027 (Rescate), there are two options. The first keeps them as a playable 2022–2026 prologue: the history state already exists in infra.js. The second re-records or drops them. The rest (events, chapters 3–5, arcs and the induction mechanics) is date-free.

## Mechanics the unified engine needs

See `mechanicsNeeded` in the report: commitments, infrastructure-triggered milestones, real works from choices, energy index, rival state, local incidents, workshop capacity, elections, calibrated contracts, deterministic gambles, voltage-aware electrification, and Trenespop flash listings and tenders.

## Per-dialogue verdicts

| source | person | verdict | key evidence |
|---|---|---|---|
| decision:inaugural | minister | coherent | The choice persists and is read by balance() every month, and the +120/+160 M€ match the details. |
| decision:energy | treasury | contradicts | Insurance costs 24 M€ against about 3.9 M€ of extra energy cost, so «la segunda, más» is false by a factor of about 6. |
| decision:burgos | minister | partial | Simulation confirms the facts after 21 Jul 2022: madrid-burgos becomes AVE-feasible, and the madrid-bilbao/irun gauge change moves from vll to bur. |
| decision:discounts | minister | partial | The demand surge exists only if you pay for the reinforcement; refusing makes it vanish instead of leaving people standing. |
| decision:Rossa | president | coherent | The rival really enters on that date and takes share through rivalWeight (engine.js:56). |
| decision:murcia | minister | partial | Same timing problem as Burgos. |
| decision:gauge | minister | coherent | The body is news flavour: narrow gauge is not modelled, and the text says so («no son nuestros»). |
| decision:pajares | successor | partial | The infrastructure change exists: Madrid–Gijón Alvia time drops 227 → 178 min and the changer moves from leo to pol (sim). |
| decision:extremadura | successor | partial | The facts become true on 14 December: madrid-badajoz is then feasible only with the hybrid (sim). |
| decision:s106 | successor | coherent | The 30 units arrive gradually over 18 months, exactly as said, and the fleet review really raises condition and lowers incidents. |
| decision:futuretender | successor | partial | The catalogue opens with the calendar year, not this decision. |
| decision:climate | president | contradicts | A summer heat crisis fires in October. |
| decision:rural | mayor | partial | The payment exists and lasts 5 years, but the contract has no obligation: the player can close every rural service and still collect 6 M€ a month. |
| decision:industry | workshop | coherent | Both effects exist with the stated sizes and durations and apply to new factory orders, including Trenespop's. |
| decision:legacyvote | president | partial | «Quedan cuatro años» is true (the campaign ends at month 348), but nothing tracks the commitment: a player can promise a network for everyone and then close lines. |
| event:cable | adif | partial | No tramo is affected; the penalty reuses the strike flag across the whole network. |
| event:strike | workshop | partial | «servicios mínimos un mes» is not implemented: trips and seats are unchanged. |
| event:wifi | riders | partial | The fix is a one-off bump that fades within months and is unrelated to the existing wifi policy. |
| event:eufunds | treasury | coherent | Exactly as stated: catenary and gauge works (plus renewals and changers) are quoted at 60 % for 24 months. |
| event:freeze | treasury | partial | A withheld transfer is modelled as a lump sum, not as a reduced monthly transfer, and the event can softlock a company that is short of cash. |
| event:mayorchain | mayor | partial | No town is identified and no 'ave' request is created, although the request system already supports type 'ave' (engine.js:243-251). |
| event:busprice | rival | partial | The announced rival price cut happens only if you pick option 2, and it is −22 %, not 5 €. |
| event:heatwave | adif | partial | The season is right and the choice detail («peor puntualidad») is true, but speeds are never limited and patrols only avoid the flag. |
| event:snow | adif | partial | The season matches, but frozen catenary is not modelled: electric trains keep crossing the passes. |
| event:cows | adif | notImplemented | The only mechanical promise (fewer scares) changes no probability. |
| event:secondhand | workshop | coherent | You really get 4 AVE at 80 % for 60 M€. |
| event:workshopfire | workshop | partial | The consequence is an instant one-off condition drop, not «unos meses» of worse maintenance, and the game has no workshop capacity. |
| event:influencer | riders | partial | The effect is real, but the premise is never checked: the event can fire in a month with 50 % punctuality. |
| event:festival | mayor | partial | Extra travel happens only if you pay, and paying adds no trains, so wherever capacity binds the extra demand is lost anyway. |
| event:audit | treasury | partial | The outcome is a coin flip unrelated to the real accounts (losses, debt, corruption), and it is exploitable when cash is low. |
| event:adifdelay | adif | partial | The precondition is right, but the delay hits every work, not «una de sus obras». |
| event:adifboost | adif | partial | It accelerates every work, not one, and nothing checks that a work is really ahead. |
| event:royal | president | partial | The trip's outcome is a coin flip, independent of punctuality or fleet condition on the AVE lines. |
| event:election | president | notImplemented | There are no elections, nothing to inaugurate is checked, and the president's «note» has no effect. |
| event:tweet | successor | partial | «Necesito que esta semana todo funcione» is never measured, and the paid fix is a satisfaction bump that decays. |
| event:teruel | mayor | notImplemented | The promise has no state and is unrelated to the real works (Zaragoza–Teruel 86 M€ / 31 months, Teruel–Sagunt 64 M€ / 26 months). |
| event:luggage | riders | coherent | A small comfort decision with exactly the stated satisfaction effects; it promises nothing more. |
| chapter:recovery | minister | coherent | At the start 60 of 80 units are free (sim), the network has Iberian and standard tramos, requests are generated (engine.js:245-256), and every instruction maps to an objective. |
| chapter:competition | president | partial | The rivals and the bus exist and the objectives match the text, but there is no deadline or failure. |
| chapter:mediterranean | successor | partial | The AVE València–Barcelona objective counts route capability, not an AVE actually running. |
| chapter:territory | successor | partial | The electrification target is reachable (1,940 km still without catenary after the 2023 history, sim). |
| chapter:legacy | president | coherent | The objectives and the final score measure network size, AVE cities, satisfaction and solvency. |
| arc:0 | rival | contradicts | In simulation the arc-0 project was Valencia–Alicante, with zero rivals. |
| arc:1 | adif | partial | The arc is correctly gated on the Pajares opening. |
| arc:2 | minister | partial | It usually picks a Mediterranean, non-Madrid relation (sim: Granada–Almería), but it can fall back to anything, and no requirement involves corridor works. |
| arc:3 | mayor | partial | The rural preference works (sim: Madrid–Ávila), but the fallback can pick any route, and «el autobús de las seis» exists only through the generic bus share. |
| arc:4 | president | notImplemented | The classic engine has no elections; arc order is just a counter. |
| induction:mandate:briefing:0 | minister | partial | The date and the framing are true (month 0, and a real day follows), but «elige qué protegerás» leads to a quiz with no state, and it duplicates the inaugural policy decision. |
| induction:mandate:debrief:0 | rival | coherent | Cash really is unchanged (effect {}), and the next stage is the track diagnosis. |
| induction:mandate:briefing:1 | president | flavor | A general framing. |
| induction:mandate:briefing:2 | treasury | partial | The economics are true: cost per train-km (engine.js:64-65), monthly policy costs (tycoon.js:34), and a single cash pot that lets one line fund another. |
| induction:diagnosis:briefing:0 | adif | coherent | plan() checks gauge and power on every tramo (infra.js:124-135). |
| induction:diagnosis:debrief:0 | mayor | coherent | Simulation: alvia.ok=true with change at med, all 25 kV; s120 (8 free) and s130 (10 free) are available. |
| induction:diagnosis:briefing:1 | riders | coherent | supplyOptions separates missing units (tycoon.js:48-52) from infrastructure faults (faultText infra.js:222); staffing limits trips (operations.js:131-133). |
| induction:diagnosis:briefing:2 | workshop | coherent | MODELS (data.js:58-66) give AVE gauge uic and electric power, Alvia variable gauge, s130 electric, s730 hybrid. |
| induction:offer:briefing:0 | treasury | coherent | Frequency drives train-km cost and the units required (engine.js:64; tycoon.js:42-47), and the forecast is computed by metrics. |
| induction:offer:debrief:0 | minister | coherent | configureRoute recomputes units (engine.js:85), and metrics change accordingly. |
| induction:offer:briefing:1 | rival | coherent | The bus is in the choice model on every route (busWeight, engine.js:59). |
| induction:offer:briefing:2 | riders | coherent | Capacity caps passengers at 98 % of seats×departures (engine.js:61-62), so adding departures raises carried demand. |
| induction:people:briefing:0 | workshop | coherent | Simulation: driverNeed = 29 versus 180 drivers (tycoon.js:11-13); the costs and delays match. |
| induction:people:debrief:0 | treasury | coherent | monthlyCost adds max(0, drivers−180)×0.0015 M€ (tycoon.js:34); the induction UI quotes 30,000 €/month for 20 (induction-task-ui.js:52). |
| induction:people:briefing:1 | president | coherent | Training matures after 3 months (tycoon.js:16, 159). |
| induction:people:briefing:2 | mayor | coherent | Both constraints exist: units (configureRoute engine.js:85-86) and staffing (tycoon.js:13). |
| induction:competition:briefing:0 | successor | coherent | POLICIES have a monthly cost (tycoon.js:7, 34) and act immediately through effects() (tycoon.js:33). |
| induction:competition:debrief:0 | successor | coherent | Neither wifi nor ERTMS changes tramo gauge or power (tycoon.js:33; infra state only changes in finishWork engine.js:199-207). |
| induction:competition:briefing:1 | rival | coherent | competition() (tycoon.js:20-32): at month 0 only Madrid–Barcelona has OuiOui (40.6 €, 4 departures, sim); YaIré enters from month 10, and OuiOui sets fares at 0.065 €/km versus YaIré quality 87. |
| induction:competition:briefing:2 | minister | coherent | TECHS: online 10/4 (+3 % demand); ertms 35/12 (speed ×0.95, quality +2) (tycoon.js:8, 33). |
| induction:infrastructure:briefing:0 | mayor | coherent | Simulation: trb-sor (ib, no catenary, 90.8 km) → electrify 44 M€ / 21 months, no closure. |
| induction:infrastructure:debrief:0 | riders | coherent | finishWork's electrify branch only sets e='25kv' and adds km (engine.js:201); gauge is untouched. |
| induction:infrastructure:briefing:1 | adif | coherent | The two actions are separate and real (configureRoute versus workQuote). |
| induction:infrastructure:briefing:2 | workshop | coherent | The opening costs 4 M€ (engine.js:87-88), and the only non-electric model is s730 (data.js:65). |
| induction:incident:briefing:0 | workshop | coherent | Costs and effects match RESPONSES exactly. |
| induction:incident:debrief:0 | president | coherent | op.choices drives the delays in servicePlan (operations.js:107-121), and the report lists late trains and attended incidents (operations.js:219-222). |
| induction:incident:briefing:1 | adif | coherent | Team factor 0.3, bus 0.009 M€ plus satisfaction protection, wait factor 1 (operations.js:49-53, 108-121, 212). |
| induction:incident:briefing:2 | successor | coherent | The clock can be paused (pause() app.js:582), and the incident card shows reason, train and initial delay (induction-task-ui.js:90). |
| induction:review:briefing:0 | riders | partial | Punctuality comes from the day's trips, but report passengers = monthly balance ÷ days × day-type factor and net = monthly net ÷ days − penalties (operations.js:220). |
| induction:review:debrief:0 | adif | coherent | Works finish by due date (engine.js:225-228). |
| induction:review:briefing:1 | treasury | coherent | nextDay does op.day++ and, on the last day, step() (operations.js:228-235). |
| induction:review:briefing:2 | mayor | coherent | Surges (operations.js:172-181) require frequency ≥ need before `until` (at+180 min) for a 0.15–0.50 M€ bonus and ±0.3 satisfaction (operations.js:23-31). |
| induction:handoff:briefing:0 | president | partial | The numbers are literally right, but the starting network already carries 525,786 passengers a month (sim), so both branches are won at the first month close. |
| induction:handoff:debrief:0 | rival | flavor | Generic, and consistent with the contract and rival state. |
| induction:handoff:briefing:1 | minister | partial | Rewards, trust effects and payment on completion are true (tycoon.js:154, 176-177), but the target is met automatically in month 1 (sim), so the trade-off is fake. |
| induction:handoff:briefing:2 | successor | coherent | Rivals review strategy every 6 months and wage price wars in cycles (tycoon.js:27, 166-168); requests (engine.js:245-256), decisions and events keep arriving. |
| feedback:mandate:balanced | minister | coherent | Advice only; it claims no effect, and cross-subsidy through a shared cash pot is real. |
| feedback:mandate:coverage | minister | coherent | The opening costs 4 M€ (engine.js:87-88), and operating cost is charged monthly (engine.js:64-65, 211). |
| feedback:mandate:margin | minister | coherent | Expired requests cost reputation −2/−4 (engine.js:244). |
| feedback:diagnosis:fixed | adif | coherent | madrid-salamanca AVE fault = 'gauge' (sim; infra.js:131). |
| feedback:diagnosis:variable | adif | coherent | Alvia is feasible with the change at med (sim); units are checked at opening (engine.js:85-86). |
| feedback:diagnosis:diesel | adif | coherent | The hybrid profile is variable gauge; the route is fully electrified, so the S730 works for gauge reasons (sim: hybrid OK). |
| feedback:people:instant | workshop | coherent | Training takes 3 months (tycoon.js:16, 159), and lack of staff cancels trips (operations.js:131-133). |
| feedback:people:pipeline | workshop | coherent | Matches driverNeed, the training queue and monthlyCost (tycoon.js:12-16, 34). |
| feedback:people:all | workshop | coherent | Each driver above 180 costs 0.0015 M€/month (tycoon.js:34). |
| feedback:infrastructure:ave | mayor | coherent | Electrification sets only e (engine.js:201); the gauge rule is in traverse (infra.js:130-131). |
| feedback:infrastructure:power | mayor | coherent | As above. |
| feedback:infrastructure:speed | mayor | coherent | Tramo speed = min(v, train speed, 160 without catenary) (infra.js:132). |
| feedback:handoff:public | president | coherent | Public has the lower target and +6 Territorio on success (tycoon.js:154, 177). |
| feedback:handoff:commercial | president | partial | «El premio grande exige trabajo grande» is false at month 0: 312,500 new passengers are reached in the first month with no action (525,786 per month, sim). |
