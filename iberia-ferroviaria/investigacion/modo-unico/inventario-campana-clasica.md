# Inventory of the classic campaign (and free mode)

Iberia Ferroviaria 4.0.0. I read the code in `/home/user/putarenfe/iberia-ferroviaria/proyecto/dist/` without editing it. Every `file:line` below is relative to that folder, except the tests, which are in `proyecto/`. Money is in M€ and times are in months unless a line says otherwise.

I checked the behaviour by running the code in Node with small scripts kept in `scratchpad/unify/sim/`:
- `passive.mjs`, `passive2.mjs`, `trace.mjs`: a run with no player input;
- `days.mjs`, `days2.mjs`: playing the days against delegating the month;
- `exploit.mjs`: the request exploit;
- `probe2.mjs`, `volt.mjs`, `voices.mjs`: one-off probes.

I also ran `campaign-test.mjs --trace`.

---

## 0. Ten-line verdict

1. **The core of the game is solid and realistic.** It is a monthly tycoon economy (`engine.step`) built on a real rail graph: 125 tramos, each with gauge, electrification, speed and whether it is built. A Dijkstra planner decides what each train can run and explains what is missing (`infra.plan` and `faultText`). On top of that sits the real Renfe GTFS timetable, which puts trains on the map.
2. **The day layer is an optional tax.** You can play each day of the month in real time (incidents and demand peaks) or delegate the month. Delegating is strictly better. In 2 months the scores were:

   | Strategy | Satisfaction | Cash |
   |---|---|---|
   | Delegate the month | 55.4 | 623.7 |
   | Play every day and wait | 28.4 | 622.8 |
   | Play every day and react perfectly to every peak | 53.1 | 615.9 |

   Over 6 months, playing and waiting dropped satisfaction to **7.9**. What happens during a day never feeds back into monthly reliability or revenue.
3. **Chapters and contracts tie the dialogue to the game state.** The objectives are computed from real state, and the contract requirements are inspected live (`tycoon.contractDetails`). This is the part that already does "si un diálogo dice que pasa una cosa, que pase".
4. **Dated decisions, random events and encounters mostly do not.** There are 15 dated decisions, 22 random events and 315 encounters. Most choices only move cash, reputation or satisfaction, or a trust group, by fixed amounts. Several promise something concrete that never happens: electrify Extremadura, launch Alvia to Asturias, cut the service, provide minimum services during a strike, cut fares.
5. **The 315 encounters are a deterministic shuffle**, `(n*137+seed%315)%315` every 3 months (`tycoon.js:158`). The character's mood and the topic are unrelated to the state.
6. **Money comes mostly from handouts in the early game.** At month 0 the network nets +1.76 M€ a month, while the first decision alone gives +120/160 M€ and chapters give 1,390 M€ in total. Late in the game operations matter: the bot's network nets 30 to 45 M€ a month.
7. **There are exploits.** Opening a route requested by a city and closing it the same turn pays +42 M€ and +2 reputation at month 0. The first contract is won automatically after one month.
8. **Satisfaction does not affect demand.** It feeds the score, chapter objectives and government trust, and through that the dismissal rule. Trust-group bonuses at 80 or more are negligible: demand ×1.005 and ×1.002, and −0.1 M€ a month of costs.
9. **Voltage is ignored:** 3 kV and 25 kV behave the same. The rolling stock is only AVE and Alvia. As a result, the S112 and S103 run through Sagunt–Castelló on mixed gauge at 3 kV, which the research data rules out (both are 25 kV only).
10. **Nearly all the logic is pure ES modules that import in Node.** `app.js` (1,460 lines) is the only heavy DOM file. Its document-wide `[data-action]` handler is a known hazard when sharing the page with other modes.

---

## 1. Files, sizes and roles

| File | Lines / bytes | Role | Pure? |
|---|---|---|---|
| `app.js` | 1460 / 154 KB | All the UI: map, HUD, drawer pages, inspectors, modals, tutorial runtime, day clock, global click/input/change handlers | DOM, global mutable `state`/`ui` |
| `engine.js` | 298 / 39 KB | State, demand and revenue model, balance, monthly `step`, services, purchases, works, decisions, requests, stations, score, save validation | pure |
| `operations.js` | 288 / 19 KB | The "jornada" (day): service plan from the real timetable, incidents, responses, demand peaks, end of day, sun position, construction stage | pure (module-level `planCache`) |
| `tycoon.js` | 198 / 30 KB | Trust groups, policies, research, drivers, rivals, contracts (encargos), arcs, achievements, newspaper | pure |
| `tycoon-ui.js` | 96 / 22 KB | HTML for Despacho › Dirección (agenda, competition, staff, research, Gaceta) | string builder |
| `schedule.js` | 192 / 9.5 KB | GTFS timetable runtime: stations, edges, day trips, `thin`, `position`, `routeStats` | pure (caches) |
| `network.js` | 66 / 3.6 KB | Builds the 91 playable relations (`ALL_ROUTES`) from `ROUTES` and the timetable | pure; side effect: adds `st*` stations to `CITY` (`network.js:7`) |
| `story.js` | 63 / 24 KB | 9 characters, 5 chapters, 15 dated decisions, 22 events | data |
| `encounters.js` | 32 / 10 KB | 315 encounter scenes generated from 9 people × 7 moods × 5 topics | data |
| `induction.js` | 167 / 23 KB | 9 tutorial stages (36 lines, 14 feedbacks) | data |
| `induction-runtime.js` | 94 / 7 KB | Tutorial state, checks, validation | pure |
| `induction-task-ui.js` | 142 / 16 KB | Tutorial task panels | string builder |
| `data.js` | 90 / 12 KB | 77 cities, 44 corridors, 9 models, historical orders, 9 high-speed projects, population, labels | data |
| `infra.js` | 277 / 14 KB | Tramo state, historic works, router, works catalogue (see `rules.md`) | pure |
| `marketplace.js` | 125 / 16 KB | Trenespop (see `market.md`) | logic pure + HTML |
| `city-art.js` | 82 / 13 KB | `citySkyline()`: SVG skyline per city (sky by hour, landmark, sea, station by level) | pure string |
| `faces.js` | 217 / 28 KB | Portraits: `faceURL(person, mood)` uses `assets/portraits.js` (7.7 MB), with a vector fallback | pure string |
| `dialogue-presentation.js` | 40 / 2 KB | Splits a recorded body into "opener" and "main" for display only | pure string |

Tests:
- **`campaign-test.mjs`** plays a scripted bot from 2022 to 2050 using only legal actions.
- **`tycoon-test.mjs`** covers 315 encounters, staffing, rivals, policies, research, contract, dismissal, free mode, renewal and saving.
- **`tycoon-contract-test.mjs`** covers corridor contracts, their streak, bonus and stages.
- **`induction-test.mjs`** checks every tutorial step and its save.
- **`operations-calendar-test.mjs`** checks free-mode dates after 2050 and leap years.
- **`gameplay-ui-test.mjs`** is a Playwright test of the Despacho flows.

---

## 2. (a) Core loop

### 2.1 Time scale

- **The unit of account is the month.** `s.month` runs from 0 (January 2022) to 348 (January 2051 marks the end). `effectiveMonth` caps the campaign at 347 (`engine.js:10`). Free mode is uncapped up to a validation limit of 12,000 (`engine.js:270`).
- **Each month has 28 to 31 "jornadas" (days)** (`operations.opDays`, `operations.js:10`). `state.ops` = `{day, minute, phase:'planning'|'running'|'review', incidents, resolved, choices, surges, priority:'balanced'|'punctual', completed, last}` (`operations.js:15-19`). The campaign starts on 3 January 2022 (`app.js:1165`, `state.ops.day=3`).
- **A day:**
  1. `planning`: you set the priority.
  2. `startDay` (`operations.js:143`) seeds the incidents and peaks and sets the clock to the first departure.
  3. `running`: the clock advances in real time from first departure to last arrival. Speeds are 1×, 3×, 10× or 30×, which is 2, 6, 20 or 60 game minutes per real second (`app.js:32`, `frame` at `app.js:546-569`).
  4. `endDay` (`operations.js:204`) produces the day report.
  5. `nextDay` (`operations.js:228`): on the last day it calls `E.step` and closes the month.
- **"Delegar mes"** (`operations.skipMonth`, `operations.js:237`) calls `E.step` straight away and resets the month to day 1. It skips every remaining day, with no incidents, peaks or penalties.
- **"Hasta el último tren"** (`app.js:1301`) jumps the clock to the last arrival and closes the day. It never calls `checkSurges`, so missed peaks are not penalised.

### 2.2 What the player does

The main surfaces are the map and the city inspector, plus the drawer pages (Jornada, Red, Trenes, Obras, Despacho, `app.js:58`):

- **Services:**
  - Pick a train lot, a frequency of 1 to `maxFrequency` and a fare of 1.5 to 150 € (`engine.configureRoute`, `engine.js:77-90`).
  - Opening costs 4 M€.
  - Closing costs −1 reputation (`engine.js:91`).
  - The city panel has quick +/− buttons that step 10 % of the maximum (`app.js:1309`) and auto-pick a lot (`fleetFor`/`setService`, `app.js:312-329`).
- **Upgrades:**
  - Route level up to 3, costing 12 + 12×level and taking 4 months (`engine.js:92`).
  - Station level up to 3, costing `round((4+√pop·0.35)·(lv+1))` (`engine.js:240-241`).
- **City requests:** one-click fulfilment buttons (`doRequest`, `app.js:347-357`).
- **Rolling stock:**
  - Buy from the factory or from Trenespop (`engine.buy`, `engine.js:101`).
  - Refurbish (`engine.js:112`) and sell (`engine.js:113`).
- **Works:**
  - Electrify, add a third rail (mixed gauge), convert to standard gauge, renew, build a changer (`engine.startWork`, `engine.js:126`).
  - Fund a high-speed project (`startProject`, `engine.js:115`).
  - Lay a custom high-speed line (`buildLine`, `engine.js:135`).
  - Create a new relation (`createService`, `engine.js:145`).
- **Despacho:**
  - Accept contracts (`T.accept`, `tycoon.js:148`).
  - Toggle policies (`tycoon.js:15`).
  - Research (`tycoon.js:17`).
  - Hire 20 drivers (`tycoon.js:16`).
  - Lobby a group (`tycoon.js:18`).
  - Borrow or repay 100 M€ (`engine.js:152`).
  - Move the maintenance slider from 0.6 to 1.5 (`app.js:1422`).
  - Claim the chapter reward (`engine.js:185`).
- **Modals:** dated decisions, random events and encounters. `pendingDecision` (`engine.js:155`) blocks `step` and `startDay`.
- **During a day:**
  - Respond to incidents: team, bus or wait (`operations.resolveIncident`, `operations.js:194`).
  - Raise frequency in time to catch a demand peak (`checkSurges`, `operations.js:23-32`).
  - Choose the day priority ("punctual" costs 9,000 € a day).

### 2.3 What runs on its own: `engine.step` (`engine.js:208-237`), in order

1. It returns false if the game has ended, has not started, or has a pending decision.
2. `assessContracts`: a snapshot of contract requirements before the close (`tycoon.js:140`).
3. `balance()`: `cash += net`; `s.last` is set; `stats.passengers` grows.
4. Satisfaction, as an exponential moving average: `sat = 0.84·sat + 0.16·target`, where `target = clamp(24 + min(1, routes/40)·28 + min(1, dailyTrains/700)·14 + rep·0.3 + (punct−85)·0.6, 15, 96)` (`engine.js:213`).
5. Fleet wear per month:
   - The base loss is `0.29` in use or `0.08` idle.
   - That loss is multiplied by 0.8 with predictive maintenance and by 1.2 with outsourced maintenance.
   - Then `(maintenance−1)·0.35` is added.
   - The result is clamped to 15–100 (`engine.js:214`).
6. History, then `month++`.
7. Historical orders are delivered (`historic`, `engine.js:194`) and historic works are applied by date (`advanceInfra`, `engine.js:198`).
8. Player orders are delivered:
   - At the first delivery there is a 28 % chance of a 2 to 6 month delay.
   - Then 2 units a month, each paying `unit·(1−depositRate)`.
   - If there is not enough cash, the delivery is withheld (`engine.js:218-223`).
9. Refurbished trains come back at 98 % condition (`engine.js:224`).
10. Works finish. Works other than upgrades and changers have a 22 % chance of a 3 to 9 month delay, checked once (`engine.js:225-228`).
11. `rollEvent` (`engine.js:157`).
12. Every 18 months an automatic bus price war lasts 6 months (`engine.js:230`).
13. Each January, if satisfaction is at least 70, reputation +1 (`engine.js:231`).
14. If cash is below 0, an automatic bridge loan of up to 100 M€ is taken and costs −5 reputation. If debt is already at 1,500 and cash is below −100, the game ends with `insolvency` (`engine.js:232`).
15. `checkRequests` and `generateRequest` (`engine.js:233`).
16. `T.tick` (`tycoon.js:156-188`): encounter, training, research, trust drift, territory delays, dismissal counter, rival reviews, contracts, offers, newspaper, achievements.
17. In the campaign, at month 348 the game ends with `2050` (`engine.js:235`).

`nextDay` also calls `advanceInfra` every day, so the real opening dates land on the right day (`operations.js:233`).

---

## 3. (b) Systems: state, rules and numbers

### 3.1 State at the start (`engine.initialState`, `engine.js:22-27`)

`{version:4, tycoon, stations:{}, requests:[], month:0, seed:72022, cash:500, debt:0, reputation:50, satisfaction:58, policy:'public', chapter:0, claimed:[], decided:[], flags:{}, history, log, orders, projects, refits, routes:copy(ALL_ROUTES), fleet, infra:initialInfra(), nextId:20, stats:{requests, refurbished, purchased, delivered, upgrades, built, passengers}, last, seen:[], event:null, events:[]}`, plus `ops`, `tutorial` and `marketplace` added later.

- **Fleet** (`engine.js:24`):

  | Model | Units | Condition | Built |
  |---|---|---|---|
  | s100 | 12 | 56 | 1992 |
  | s112 | 22 | 78 | 2010 |
  | s103 | 16 | 82 | 2007 |
  | s130 | 14 | 72 | 2008 |
  | s730 | 8 | 74 | 2012 |
  | s120 | 8 | 64 | 2006 |

  That is 80 units.
- **Services already open** (`START_SERVICE`, `engine.js:18`): Madrid to Barcelona (s112), Valencia (s103), Sevilla (s100), Málaga (s112), Alicante (s103), Santander (s130), Pamplona (s130) and Badajoz (s730). Each runs at 25 to 50 % of the published frequency. In practice that gives 7/26, 4/12, 2/8, 5/16, 3/12, 1/2, 2/4 and 2/6 departures per direction.
- **Measured at month 0** (`sim/passive.mjs`):
  - Monthly balance: revenue 24.9, cost 27.1, subsidy 3.9, **net +1.76 M€**.
  - 525,786 passengers a month.
  - Average punctuality 88.2.
  - All five AVE routes sit at 98 % occupancy because they are capacity-bound.
- **Network:** 91 relations. Of those, 76 have a real timetable and 15 are "Sin tren" corridors. 87 can already run some train, and 34 can run an AVE.
- **Infrastructure:** 125 tramos, 90 nodes, 11 changers (gra, sev, cor, ant, alb, tar, zar, med, vll, leo, our).

### 3.2 Relations (`network.js`, `data.js:11-55`)

- `ROUTES` has 44 corridors: `[id, ends, via, kind av|alvia|new]`. `network.js:57-63` adds 47 more real relations from the timetable (`x-…`), some of which end at timetable stations rather than cities (`st81110` Alfaro, `st87089` Marseille).
- A relation holds `{id, name, ends, via, km, kind, demand, fare, active, level 0..3, frequency, fleet, units, real, baseFrequency, peak, minutes, products, cut?, custom?}`.
- **Real relations** (`realFields`, `network.js:35-41`):
  - `demand = trips·(AVE 290 | Alvia 210)·30·1.25`.
  - `baseFrequency = ceil(trips / directions)` gives the maximum frequency.
  - `peak` is the most trains running at once, which sets how many units are needed.
  - `minutes` is the median trip time.
- **Other relations:** `demand = 110·√(popA·popB)` (`network.js:32`), maximum frequency 12 (`engine.js:19`).
- **Default fare:** `max(8, round(km·(av 0.095 | other 0.082)))` (`network.js:33`).
- **Units needed** (`tycoon.requiredUnits`, `tycoon.js:42-47`):
  - Real: `ceil(peak·min(1, f/baseFreq)·1.12·slow)`, where `slow = clamp(planMinutes/realMinutes, 0.8, 1.35)`.
  - Otherwise: `max(2, ceil(cycle/interval))`, with `cycle = (min/60+0.6)·2` hours and `interval = 15/(f−1)` hours.

### 3.3 Demand, revenue and cost model (`engine.metrics`, `engine.js:44-68`)

**Trip time**

- `pathMin` is the planner's minutes, or `km/1.5` (90 km/h) if the planner finds no route.
- Real relations average the published time with the planned one.
- `trainTime = max(0.2, (avgMin/60 + 0.1)·tx.speed − changes·tx.changer/60)` hours.
- `tx.speed` is 0.95 with ERTMS. `tx.changer` is 3 minutes with the fast-changer technology.
- Bus time = `km/73 + 0.5` hours.

**Demand**

`demand = r.demand · recovery · growth · season · stationBoost · tx.demand · (AVE ×1.15) · (passes & Alvia ×1.15) · (hype & AVE ×1.1) · (tourism ×1.1)`, where:
- `recovery = min(1.25, 0.72 + month·0.009)`;
- `growth = 1 + min(0.55, (year−2022)·0.012)`;
- `season = 1 + 0.10·sin(2π·month/12)`;
- `stationBoost = 1 + 0.06·(lvA + lvB)`.

**Reliability**

`reliability = clamp(67 + tx.quality + condition·0.29 + (maint−1)·7 + level·2 + (stationBoost−1)·12 − changes·1.5 − strike 10 − heat 5, 50, 99)`. It is displayed as "puntualidad".

**Mode choice (logit)**

- `trainW = exp(clamp(1.6 − trainTime·0.2 − fare·txFare/35 + min(f,40)·0.045 + (rel−80)·0.018 + (rep−50)·0.012 + level·0.12, −3, 4))`.
- `busW = exp(clamp(1.1 − busTime·0.2 − busFare/35, −3, 4))`, with `busFare = max(4, km·0.066)·(buswar ×0.78)`.
- `otherW = 0.33 + Σ rivals` (rivals use the same formula as trains with their own fare, frequency and quality, then ×0.16).
- `share = trainW / (trainW + busW + otherW)`.

**Passengers and revenue**

- `capacity = seats·f·2·30·tx.staff`.
- `passengers = min(0.98·capacity, demand·share)`.
- `revenue = pax·fare·txFare·(refund ? 1−(100−rel)·0.0005 : 1)/1e6`.

**Cost**

- `trainKm = f·2·30·km`.
- `operating = trainKm·(m.energy·2.8·(energy flag 1.22) + (AVE 17 | 12))·costIndex/1e6`.
- `cost = operating·tx.cost·(hybrid & hydrogen 0.92) + units·0.03·maint + 0.06 + level·0.025`.
- `costIndex = 1 + 0.0205·(min(2050, year) − 2022)` (`engine.js:21`). Fares never rise on their own, so margins erode over time: the bot's net falls from +47 M€ a month in 2037 to −31 M€ a month in 2050.

**Subsidy**

Only for routes that are not AVE: `trainKm·(public 2.2 | commercial 1.6)/1e6 + 0.04` (`engine.js:66`).

### 3.4 Balance and finance (`engine.balance`, `engine.js:69-76`)

- `overhead = (9 + units·0.035)·costIndex + debt·0.004`. Debt therefore costs 0.4 % a month.
- `subsidy = Σ route subsidies + (public 3.5 | commercial 2) + (rural flag 6)`.
- `cost = Σ route costs + overhead + T.monthlyCost`.
- Loans move in steps of ±100, up to 1,500 of debt (`engine.js:152`). The automatic bridge loan works the same way (`engine.js:232`).
- `policy` is set **only** by the dated decision `inaugural` and can never be changed afterwards. Free mode keeps `public`.

### 3.5 Satisfaction and reputation

| | Satisfaction (0–100, starts at 58) | Reputation (5–100, starts at 50) |
|---|---|---|
| **Monthly drift** | Moving average towards the target in 2.3 (`engine.js:213`) | None |
| **Sources** | Decision, event and encounter effects; request done +1 (`engine.js:244`); peak caught +0.3; day report −late/trips·0.5 − unattended·0.15 + bus·0.05 (`operations.js:212`); peak missed −0.3 (`operations.js:29`) | Decisions and events; request done +2 (AVE +5), expired −2 (AVE −4) (`engine.js:244`); chapter claimed +5; station +1; route closed −1; closing works −1−n (`engine.js:131`); January bonus +1 if satisfaction ≥ 70; bridge loan −5 |
| **Read by** | Satisfaction target (through reputation), government and riders trust targets (`tycoon.js:162`), chapter objectives, `finalScore`, menu summary. **Not read by demand.** | `trainW` (±0.012 per point), satisfaction target (·0.3) |

### 3.6 Trust groups (`tycoon.js:6, 33-34, 161-165`)

- There are five groups: government, treasury, staff, riders and territory. Each starts at 60.
- Each month: `g = 0.96·g + 0.04·target`.

| Group | Target | Effect when low | Effect at 80 or more |
|---|---|---|---|
| government | `sat·0.8 + (lastNet>0 ? 15 : −20)` | **Below 15 for 6 months in a row: dismissed (`ending:'dismissed'`)**, campaign only | −0.1 M€ a month |
| treasury | `lastNet>0 ? 75 : cash<100 ? 15 : 35` | Below 25: +1 M€ a month of cost | −0.1 M€ a month |
| staff | `60 + (maint−1)·35 − outsource 24 − (staff short 25)` | Below 25: quality −8, capacity and trips ×0.9 | quality +1 |
| riders | `sat + refund 8 − dynamic 8` | — | demand ×1.005 |
| territory | `min(90, 45 + activeRoutes·0.8)` | Below 25: every 6 months all open works slip +1 month | demand ×1.002 |

- **Lobbying** costs 8 M€ for +12, and is refused at 95 or more (`tycoon.js:18`).
- **Contracts:** winning gives +6 to territory (public branch) or treasury (commercial branch); losing gives government −8.
- **Encounter choices** move one group by between −4 and +5.
- **Measured dismissal:** a passive run that always takes the cheapest option is dismissed in month 50 (2026) while holding 604 M€ (`sim/passive2.mjs last`). Without services, satisfaction slides, government drifts below 15, and the game ends. This is one of the few losses that follows from the player's own play.

### 3.7 Contracts ("encargos", `tycoon.js:35-188`)

There is one offered or active contract at a time (`offer`, `tycoon.js:142`). A new offer comes when one is completed, or every 6 months if the slot is empty.

- **The first contract, `mission-0`** (`tycoon.js:146`):
  - Goal: passengers, target `max(250000, last.passengers·5)` = 250,000, deadline 18 months.
  - Public branch: reward 18, penalty 5.
  - Commercial branch: target ×1.25, reward 26, penalty 8 (`tycoon.js:154`).
  - **It is trivial:** the network carries about 525,000 passengers a month, so it is won at the first close (`sim/exploit.mjs`: target 312,500, won after one month).
- **Later contracts are corridor programmes** (`projectOffer`, `tycoon.js:68-108`):
  - The arc cycles through the 5 `ARCS` (`tycoon.js:9`), each with its own speaker and line.
  - Arc 1 (Pajares) is only offered once `leo-pol@2023-11-29` has opened (`tycoon.js:71`). This is a good example of dialogue gated by state.
  - Arc regions (`tycoon.js:54`):
    - arc 0: bcn vlc ali sev mal;
    - arc 1: gij ovi san leo bil pam iru;
    - arc 2: Mediterranean;
    - arc 3: small cities;
    - arc 4: any city.
  - The route is chosen by a feasibility and opportunity score (`tycoon.js:55-63`).
  - There are 3 stages:
    1. "Poner el corredor en marcha";
    2. "Invertir…" (station, level or punctuality 90);
    3. "Conectar…" (a connecting route plus a combined network margin of 5 %).

    A "stability" variant pays 4 or 6.
  - **Requirements:**
    - Both branches: `active`, `staff ≥ 0.98`, `frequency`.
    - Public: `fare ≤` 95 % of the current fare in stage 1.
    - Commercial: `margin ≥ 0.08` (0.12 in stage 3) and `occupancy ≥ 0.35`.

    `inspectRequirement` (`tycoon.js:109-125`) reads them from the real engine.
  - **Rewards:**
    - Public: 24, 34 or 44 by stage, plus a bonus of 6 + 2·stage.
    - Commercial: 34, 46 or 60, plus a bonus of 8 + 2·stage.
    - Penalties: 5 (public) or 8 (commercial).

    The offer is open for 12 months. Once accepted, there are 24 months to reach **3 consecutive monthly closes** with every requirement met. Missing one resets the streak (`tycoon.js:173`).
  - The UI shows each requirement with its current value, its target and a link to the action that fixes it. `prerequisitesHTML` checks that compatible rolling stock and units exist before you sign (`tycoon-ui.js:21-30`). This is the clearest system in the game.
- **Weak spot:** the arc's line `ARCS[arc][2]` is static. Arc 1's "El túnel está. Ahora faltan trenes" is used for any northern corridor, Madrid–Pamplona included.

### 3.8 Chapters (`story.js:14-20`, `engine.js:183-185`)

A chapter can be claimed when `yearOf ≥ chapter.year` and every objective is met (`chapterReady`). Claiming pays the reward, gives reputation +5 and moves to the next chapter (0..4).

| # | id (year) | Objectives | Reward |
|---|---|---|---|
| 1 | recovery (2022) | 12 active services, 2 requests met, 2 trains refurbished, 2 trains bought | 100 |
| 2 | competition (2024) | 20 active, 260 trains a day, 1 changer built, satisfaction 62, 4 trains delivered | 180 |
| 3 | mediterranean (2028) | AVE possible València–Barcelona + LAV Almería built, 250 km converted to standard or mixed gauge, 26 active | 260 |
| 4 | territory (2035) | 300 km electrified, AVE in 30 cities, 3 high-speed projects finished | 350 |
| 5 | legacy (2042) | 420 trains a day, AVE in 40 cities, satisfaction 72, more cash than debt | 500 |

- The chapter texts match their objectives, which is good.
- Only works done by the player count towards electrified, converted and changers (`infra.done`). Historic openings do not count.
- **The chapters are gated by date, not by skill.** The bot clears chapters 3 to 5 in the very month they open (2028-10, 2035-01, 2042-01) and chapter 2 in 2024-11.
- **Nothing fails if you miss a chapter.** You just do not get the money.

### 3.9 Dated decisions (`story.js:22-38`; shown by `pendingDecision`, `engine.js:155`)

Each decision applies once, at `s.month ≥ at`. Its effects run through `applyEffects` (`engine.js:163-174`). "Coherent?" asks whether the choice actually does what its text says.

| id | Month (date) | Choices → effects | Coherent? |
|---|---|---|---|
| inaugural | 0 (January 2022) | Public: +120, rep +5, policy public. Commercial: +160, rep −3, policy commercial | Yes (sets the policy) |
| energy | 2 (March 2022) | −24, flag `hedge` (read by **no one**). Or flag `energy` for 12 months (energy ×1.22) | Yes (`hedge` is just a no-op) |
| burgos | 6 (July 2022) | −10, rep +4. Or rep −1 | The text says the high-speed line opens. It opens on 2022-07-21 (`infra.js:17`), so it is true for most of the month. The launch campaign has no effect on demand. |
| discounts | 8 (September 2022) | "Reforzar los Alvia": +65, rep +4, flag `passes` for 18 months (Alvia demand ×1.15). Or +25, rep −2 | **No:** no Alvia service is reinforced, and the money comes free |
| Rossa | 10 (November 2022) | −18, rep +7. Or nothing | YaIré really enters at month 10 (`tycoon.js:28`), which fits. But "Competir en servicio" does not change competition. |
| murcia | 11 (December 2022) | −8, rep +5. Or nothing | The line opens on 2022-12-20, which is true |
| gauge | 13 (February 2023) | −16, rep +5, `fleetcare` (+8 condition for the whole fleet). Or rep −2 | Partly |
| pajares | 22 (November 2023) | "Lanzar los Alvia a Asturias": −12, rep +5. Or nothing | **No:** no service is opened. The tramo itself does open on 2023-11-29. |
| extremadura | 23 (December 2023) | "Plan Extremadura": −20, rep +6. Or rep −3 | **No:** nothing is electrified (Talavera–Plasencia stays without catenary) |
| s106 | 28 (May 2024) | −15, rep +6. Or −6 plus `fleetcare` | Yes: the S106 orders really deliver from month 28 (`data.js:70-71`) |
| futuretender | 50 (March 2026) | +45. Or rep +8 | Loose: av2030 is on sale from 2026, but there is no link |
| climate | 105 (October 2030) | −35, rep +6. Or "Reducir la oferta": rep −4 and flag `heat` for 12 months (reliability −5) | **No:** the service is not cut, it only gets worse |
| rural | 164 (September 2035) | Flag `rural` for 60 months (+6 M€ a month), rep +3. Or +25 | **Partly:** the counties pay "si no nos dejan sin tren", but nothing obliges you to keep any rural service |
| industry | 228 (January 2041) | −45 and flag `factory` for 36 months (lead time −6). Or flag `backlog` for 18 months (lead time +8) | Yes (read by `purchaseQuote`, `engine.js:97`) |
| legacyvote | 300 (January 2047) | −50, rep +10. Or +50, rep −3 | Abstract |

### 3.10 Random events (`story.js:40-63`, `rollEvent` at `engine.js:157-162`)

- There is a 32 % chance each month (`random > 0.32` means no event), from month 3 on and not after month 346 in the campaign.
- An event cannot repeat within 30 months. Events may also be restricted to months of the year (`months`), require an earliest month (`from`), or need works in progress (`needsWorks`).
- A passive run saw 79 events in 230 months.

| id | Effects | Coherent? |
|---|---|---|
| cable | −9, rep +1. Or flag `strike` for 2 months (reliability −10) | Approximate: no signalling incidents actually appear in the days |
| strike | −20, rep +3. Or rep −4 and `strike` for 1 month | **No:** "servicios mínimos un mes" cancels no trips (`servicePlan` ignores it) |
| wifi | −14, satisfaction +5. Or rep −3 | **No:** duplicates the `wifi` policy (`tycoon.js:7`) without switching it on |
| eufunds | Flag `eufunds` for 24 months (works ×0.6). Or +30 | Yes |
| freeze (from month 12) | −30. Or −12, rep −3 | Abstract |
| mayorchain | −3, rep +2. Or rep −3 | No city is involved |
| busprice | "Bajar tarifas un tiempo": −10, rep +2. Or `buswar` for 6 months | **No:** fares stay the same. The text says "billetes a cinco euros", but the model's bus fare is `max(4, km·0.066)·0.78` |
| heatwave (months 5–7) | −8. Or `heat` for 2 months | Yes |
| snow (months 0, 1, 11) | −10, rep +2. Or `heat` for 1 month, rep −1 | Yes, approximately |
| cows | −6, rep +1. Or rep −1 | Abstract |
| secondhand (from month 6) | −60 for 4 × s112 at 80 % condition. Or nothing | Yes (the lot really appears) |
| workshopfire | −18. Or `fleetDamage` 6 | Yes |
| influencer | −5 and `hype` for 6 months (AVE demand ×1.1). Or rep +2 | Yes |
| festival (months 5–6) | −8 and `tourism` for 3 months (demand ×1.1). Or nothing | Yes |
| audit (from month 18) | −7, rep +2. Or a **55 % gamble**: rep +3, or −20 and rep −4 | Random |
| adifdelay (needs works) | −12. Or every open work +4 months | Yes |
| adifboost (needs works) | −15 for every open work −3 months. Or nothing | Yes |
| royal (from month 4) | −6, rep +4. Or a **50 % gamble**: rep ±5 | Random |
| election (from month 20) | −10, rep +4. Or rep −3 | "Inaugurar lo que haya" inaugurates nothing |
| tweet (from month 22) | −8, satisfaction +3. Or rep −2 | Abstract |
| teruel | "Prometer catenaria": −4, rep +3. Or rep −2 | **No:** no work is started or queued |
| luggage | −10, satisfaction +3. Or satisfaction −2 | Abstract |

Edge case: the gamble's bad branch calls `spend` (`engine.js:164`). If cash is below 20, it throws after the random draw and the event stays pending, so the player can roll again.

### 3.11 Encounters (`encounters.js`, `tycoon.js:158`)

- **How a scene is built:** `body = MOOD[person][moodIndex] + ' ' + LINES[person][topic]`. There are 9 people × 7 moods × 5 topics = **315 unique recorded bodies**.
- **When:** every third month (`s.month % 3 === 0` after the increment), if none is pending. The index is `(encounterCount·137 + seed%315) % 315`. Since 137 and 315 are coprime, the scenes are a fixed permutation that is not driven by state.
- **Topics and their effects** (`encounters.js:24-30`):
  0. "El turno imposible": −1.2 and satisfaction +2, staff +4. Or rep −1, staff −3.
  1. "Billetes de saldo": −1.5 and satisfaction +3, `hype` for 3 months, riders +3. Or +0.3 and satisfaction −1, treasury +2.
  2. "Tornillos o titulares": −2, rep +1, **`fleetcare`** (+8 condition on all ~80 units), staff +3. Or satisfaction −1, riders −2.
  3. "El andén olvidado": −1 and satisfaction +2, territory +5. Or rep −1, territory −4.
  4. "El invento del mes": −1.8, rep +2, `hype` for 2 months, government +3. Or government −2.
- **Disconnects:**
  - Topic 0 says drivers are short when the game starts with 180 drivers against 29 needed.
  - Topic 1 talks about OuiOui on any route, even with rivals switched off.
  - Topic 2 restores the whole fleet for 2 M€, compared with 12 % of the price per unit to refurbish. That is an exploit.
  - Topic 3 names no city.
  - Topic 4 "Financiar el piloto" does not advance research; it raises AVE demand instead.
  - The mood in the opener is random. Charo can be "happy" while the company is bankrupt.
- The game shows the mood opener separately from the main line (`dialogue-presentation.js`), but the recording is the full body.

### 3.12 Flags: who sets them and who reads them

| Flag | Set by | Read by | Effect |
|---|---|---|---|
| hedge | energy decision | **nobody** | none |
| energy | energy decision | `metrics` (`engine.js:64`) | energy ×1.22 |
| passes | discounts decision | `metrics` (`engine.js:53`) | Alvia demand ×1.15 |
| hype | influencer event, encounter topics 1 and 4 | `metrics` (`engine.js:53`) | AVE demand ×1.1 |
| tourism | festival event | `metrics` (`engine.js:53`) | demand ×1.1 |
| strike | strike and cable events | `metrics` (`engine.js:54`) | reliability −10 |
| heat | climate decision, heatwave and snow events | `metrics` (`engine.js:54`) | reliability −5 |
| buswar | busprice event and automatic every 18 months | `metrics` (`engine.js:57`) | bus fare ×0.78 |
| rural | rural decision | `balance` (`engine.js:73`) | +6 subsidy a month |
| eufunds | eufunds event | `workQuote` (`engine.js:118`) | works ×0.6 |
| factory / backlog | industry decision | `purchaseQuote` (`engine.js:97`) | lead time −6 / +8 |
| fleetcare | gauge and s106 decisions, encounter topic 2 | applied at once (`engine.js:167`), never stored | +8 condition on every lot |

- Default durations when a choice does not give `months`: passes 18, rural 60, factory 36, backlog 18, anything else 12 (`engine.js:167`).
- The flag names are reused oddly: cable theft uses `strike`, snow uses `heat`.

### 3.13 Rivals OuiOui (`lowgo`) and YaIré (`rossa`) (`tycoon.js:20-32, 166-168`)

- **Entry** (`marketEntry`): rivals must be on and the route's demand must be at least 15,000. Entry month:
  - routes with "barcelona" in the id: 0;
  - Valencia and Alicante: 12;
  - Sevilla, Málaga and Granada: 30;
  - any other route: 72.

  Routes that do not touch Madrid also need month ≥ 72. YaIré arrives 10 months after OuiOui. At month 0 only Madrid–Barcelona has a rival; by month 72, 79 of 91 relations do.
- **Offer:**
  - Fare: `max(9, km·(0.065 | 0.09))`, ×0.78 during a price war, ×0.94 under the `price` strategy.
  - Frequency: `4 + min(6, floor((m−from)/24))`, +1 under `capacity`.
  - Quality: 76 or 87, +3 under `quality`.
- **Price war:** for 6 months out of every 18 (`cycle % 3 === 1`).
- **Strategy review every 6 months**, based on the player's fare against `cheap = max(9, km·0.065)`:
  - If the player's fare is at most `cheap·1.05`: OuiOui moves to `capacity` and YaIré to `quality`.
  - Otherwise, OuiOui moves to `price` if the player's fare is above `cheap·1.45`, else `hold`.
  - YaIré moves to `capacity` if the player runs more than 6 departures, else `hold`.
- This system is deterministic, readable and reactive. It is good material to keep.

### 3.14 City requests and stations (`engine.js:239-256`)

- **Generation** (each month while month < 346 in the campaign): if there are fewer than 4 open requests, there is a 70 % chance of a new one.
  - 22 % of the time, an Alvia route with a non-capital end produces **"¡Queremos AVE!"**, with a 36-month deadline and a reward of 30 to 55.
  - Otherwise a random unlocked route produces one of:
    - `open` if it is closed;
    - `more` (+max(1, ceil(15 % of the maximum)));
    - `station` (next level);
    - `fare` (85 % of the current fare).

    These have a 4-month deadline and a reward of `round(6 + rand·10 + √km·0.6)`.
- **Done:** +reward, reputation +2 (AVE +5), satisfaction +1. **Expired:** reputation −2 (AVE −4).
- The requesting city is random. It is not chosen by crowding or by any shortfall.
- **Station levels:** "Apeadero", "Estación renovada", "Intercambiador", "Gran estación". Each level gives +6 % demand and +0.72 reliability to every route from that city, and +1 reputation.
- **Exploit:** open a requested route at frequency 1 for 4 M€, let `checkRequests` (called by `afterCityAction`, `app.js:330`) pay out, then close it for −1 reputation. At month 0 this nets **+42 M€ and +2 reputation** (`sim/exploit.mjs`). A `fare` request is satisfied the same way, and the fare can go back up immediately.
- **Displayed falsehood:** a city card with a request always says "▮▮▮ Trenes llenos", whatever the occupancy (`app.js:379`). Some requests are attributed to Madrid wanting a train to a timetable station, such as Alfaro.

### 3.15 Rolling stock and Trenespop (`data.js:57-73`, `engine.js:93-113, 186-196, 218-224`, `marketplace.js`)

| Model | Family | Gauge | Power | Speed | Seats | Price | Lead | On sale from |
|---|---|---|---|---|---|---|---|---|
| s100 | AVE | uic | electric | 300 | 329 | 16 | 30 | not sold new |
| s112 | AVE | uic | electric | 330 | 365 | 25 | 30 | 2022 |
| s103 | AVE | uic | electric | 350 | 404 | 33 | 34 | 2022 |
| s106f | AVE | uic | electric | 330 | 521 | 29 | 36 | 2024 |
| av2030 | AVE | uic | electric | 350 | 540 | 36 | 42 | 2026 |
| s120 | Alvia | variable | electric | 250 | 238 | 18 | 26 | 2022 |
| s130 | Alvia | variable | electric | 250 | 299 | 21 | 28 | 2022 |
| s730 | Alvia | variable | hybrid | 250 | 265 | 24 | 30 | 2022 |
| s106v | Alvia | variable | electric | 330 | 507 | 31 | 38 | 2024 |

- **New-order quote** (`engine.js:93-100`):
  - Price: `price·(1 + (year−2022)·0.018)`.
  - Lead time: `max(16, lead + floor(backlog/10)·2 + backlog flag 8 − factory flag 6)`.
  - 30 % deposit; deliveries of 2 a month; 28 % chance of a 2 to 6 month delay at the first delivery.
- **Trenespop:**
  - Factory listings: Dörfler s120 at ×1.04 with lead −4, and BCBB s103 at ×0.76 with lead −8.
  - Used lots: a new set every 6 months, condition `59 + (i·7 + period·5)%29`, price factor `0.30 + cond·0.0035`, lead 0, 1, 3 or 6 months. Lead 0 means 100 % payment and immediate delivery.
- **Historical orders:**
  - h106f and h106v: 15 units each, delivered between months 28 and 45, free.
  - The tender h2030 is never delivered.
- **Refurbish:** 12 % of the price, 5 months, returns as a new lot at 98 % condition.
- **Sell:** `price·0.23·cond/100`.
- A lot below 30 % condition cannot run.
- There is **no voltage field**. "Doble tensión" exists only in the S130's description. There is no fixed-ibérico or pure diesel train, and no regional or media-distancia stock (see `trains.json` and `rules.md`).

### 3.16 Works and projects

The rules are in `rules.md`; the numbers here are checked against the code.

- **Tramo works** (`infra.js:252-270`): electrify (6 + 0.42/km, 12 + km/10 months, to 25 kV); third rail for mixed gauge (8 + 0.5/km, 14 + km/9); standard gauge (5 + 0.3/km, 8 + km/14, **closes the line**: services are suspended and reputation drops by 1 + affected services); renew (8 + 0.18/km, ceil(4 + km/40), to 220 km/h).
- **Changer:** 18 M€ and 10 months (`infra.js:258`), only where built `std` and `ib` tramos meet. At month 0 it is possible at mad, bcn, vlc, ali, gua, vdb and pal.
- **Available at month 0:** 76 renewals, 71 mixed, 71 standard and 22 electrifications.
- **Example:** Torralba–Soria (90.8 km, ib, no catenary, 110 km/h) costs 44 M€ and takes 21 months to electrify. The tutorial uses this quote.
- **High-speed projects** (`data.js:75-85`):

  | Project | Cost | Months | Earliest year |
  |---|---|---|---|
  | almeria | 190 | 48 | 2027 |
  | basque | 230 | 60 | 2028 |
  | burgosvitoria | 150 | 54 | 2029 |
  | navarra | 200 | 60 | 2029 |
  | extremadura | 260 | 72 | 2030 |
  | cartagena | 90 | 42 | 2028 |
  | cantabria | 280 | 84 | 2032 |
  | huelva | 120 | 48 | 2030 |
  | cerdedo | 150 | 60 | 2031 |

  Completion = `max(month + duration, earliest)`. These projects build 14 planned tramos.
- **Custom high-speed lines:** length = great-circle distance ×1.2; cost km·1.1 + 25; 42 + km/10 months; at most 40.
- **Historic openings** (`infra.js:15-21`) happen on their real dates: Extremadura track 2022-07-19, Burgos 2022-07-21, Murcia 2022-12-20, Pajares 2023-11-29, Extremadura catenary 2023-12-14.
- **Delays and speed-ups:** 22 % chance of +3 to 9 months; the `adifdelay`/`adifboost` events; territory below 25 adds +1 month every half year.
- **Construction stages** for display (`operations.js:284-288`): "Estudio y permisos", then "Plataforma", "Montaje de vía", "Electrificación y señalización" and "Pruebas", by progress fraction.

### 3.17 Staff, policies and research (`tycoon.js:7-19`)

- **Drivers:**
  - `driverNeed = ceil(dailyTrains·0.55)`.
  - `staffing = min(1, drivers/need)`.
  - The game starts with **180 drivers against 29 needed**, so staffing does not matter for years.
  - Hiring 20 costs 0.3 M€ and takes 3 months. Each driver above 180 costs 0.0015 M€ a month.
  - A shortage cuts capacity and **cancels trips evenly** in the day plan (`operations.js:131-133`). This is a real, visible link.
- **Policies, per month:**
  - Youth pass: 0.22, demand +8 %, fare −4 %.
  - Dynamic fares: 0.08, revenue +4 %, riders −8.
  - Free wifi: 0.15, quality +3, demand +3 %.
  - Refunds for delays: 0.12, riders +8, refund `(100−rel)·0.05 %`.
  - Outsourced maintenance: 0, cost −2 %, wear ×1.2, staff −24.
  - AVArato (low-cost brand): 0.3, fare ×0.88, demand ×1.18.
- **Research**, one at a time:

  | Project | Cost | Months | Needs | Effect |
  |---|---|---|---|---|
  | online | 10 | 4 | — | +3 % demand |
  | loyalty | 18 | 6 | online | +5 % demand |
  | ertms | 35 | 12 | — | time ×0.95, quality +2 |
  | changer | 25 | 8 | ertms | 3 minutes saved per gauge change |
  | predictive | 28 | 10 | online | wear ×0.8, cost −2 % |
  | hydrogen | 65 | 18 | predictive + ertms | hybrid cost ×0.92 |

### 3.18 The day ("jornada", `operations.js`)

- **Service plan** (`servicePlan`, `operations.js:74-134`):
  - Relations with a timetable use the **real Renfe GTFS trips** for the day type: L (weekday), S (Saturday), D (Sunday and national holidays, `schedule.js:17-22`). They are thinned to `frequency/baseFrequency` with `S.thin`.
  - Other relations get evenly spread departures between 06:30 and 21:30, with an offset of 7 minutes for the return direction and +2 minutes per city stop.
  - Works in progress on the route add 3 minutes (real relations) or 6 minutes (others).
  - Trips are cut evenly when staffing is below 1.
- **Incidents** (`startDay`, `operations.js:143-170`):
  - Count: `min(4, floor(rand·2.2 + trips/300 + (80 − avgCondition)/40 + (maint<1 ? 0.6 : 0)))`. This is a real link to fleet condition and maintenance.
  - Type: breakdown 45 %, signal 30 %, trespass 15 %, weather 10 %. A trip that changes gauge has a 35 % chance of a **changer** incident instead, naming the real changer.
  - The weather reason follows the month: snow or wind in December to February, heat in June to September.
  - Delay: breakdown 15 to 54 minutes, weather 6 to 15, others 12 to 41.
  - Spread: a breakdown hits its own trip fully and later trips within 70 minutes at 30 %. Weather hits every trip in a 240-minute window. Others decay over 60 to 119 minutes, with a minimum of 4.
- **Responses** (`operations.js:49-53`):
  - Team: 0.018 M€, delay ×0.3.
  - Bus: 0.009 M€, delay ×0.85, satisfaction +0.05 at the end of the day.
  - Wait: free, full delay.
  - The "punctual" priority costs 0.009 M€ and takes 4 minutes off each delayed trip.
- **Demand peaks** (`operations.js:172-181`): up to 2 a day, each with an 85 % chance. One is placed on an open route below its maximum frequency.
  - Reasons: football, conference, long weekend, concert, fair, bus strike, exams, end of season.
  - Window: from `first + 90 + rand·420` minutes, lasting 180 minutes.
  - Target: frequency ≥ current + max(1, ceil(15 % of the maximum)).
  - Bonus: 0.15 to 0.50 M€ and satisfaction +0.3. Failure: satisfaction −0.3.
- **End of day** (`operations.js:204-226`):
  - Cash −Σdelay·0.0004.
  - Satisfaction `−late/trips·0.5 − unattended·0.15 + bus·0.05`.
  - The report's passengers and result are **the monthly forecast divided by the days**: weekday ×1.08, Saturday ×0.78, Sunday ×0.7. They are not computed from that day's trips.
  - The HUD's "Viajeros hoy" uses a different pseudo-random spread per trip (`app.js:276-282`), so the two numbers disagree.
- **Sun model** (`operations.js:246-281`): NOAA formulas with Spanish time zone and summer time. It drives day and night on the map, the city skylines and the timeline.

### 3.19 Achievements, the Gaceta and the log

- **Achievements** (`tycoon.js:187`, 9 in total): first contract; 5 contracts; a full corridor (stage 3); 5 full corridors; all 6 technologies; full staffing with more than 250 drivers needed; 40 active services; a custom line built; beyond 2050 (free mode).
- **La Gaceta del Andén:** templated monthly headlines (`tycoon.js:185`).
- **Diario:** the last 100 log entries.

### 3.20 Free mode (`tycoon.freeGame`, `tycoon.js:19`; `app.js:1283`)

Free mode differs from the campaign in these ways:
- Starting cash is 500, 1,500 or 5,000, and rivals can be switched on or off.
- There are no dated decisions, so `inaugural` never runs and the policy stays `public`.
- There are no chapters (`chapterReady` returns false) and no dismissal.
- Events, encounters, requests and the automatic bus price war continue forever.
- Time goes up to month 12,000. Inflation and prices are capped at 2050 (`economicYear`).
- Contract arcs cycle with `t.arc % 5`.
- The tutorial is marked done (`state.tutorial = {done:true}`).
- Historic works and historical orders still happen.

---

## 4. (c) Progression, goals, win and lose

- **Goals:** five dated chapters (§3.8) carry 1,390 M€ in total, alongside a stream of corridor contracts and city requests.
- **Ending (`ending`):**
  - `2050`: month 348 in the campaign.
  - `insolvency`: debt at 1,500 and cash below −100.
  - `dismissed`: government trust below 15 for 6 months in a row (campaign only).
- **Score** (`finalScore`, `engine.js:258`):

  `round(clamp(active/45·15 + dailyTrains/900·10 + aveCities/40·10, 0, 35) + sat·0.3 + clamp((cash−debt)/1000·15, 0, 15) + claimed·4)`, out of 100.
- **There is no explicit win.** Reaching 2050 with zero chapters is still a normal ending.
- **Difficulty, from simulation:**
  - The scripted bot clears all 5 chapters and ends 2050 with a score of 87. It has 115 services, 838 trains a day, AVE in 64 cities and satisfaction 98 to 100.
  - Passive play loses: it is dismissed in 2026 or 2041 depending on the choices, with reputation pinned at 5 and satisfaction around 30 to 40.

  So the campaign is neither trivial when idle nor demanding when engaged. The expansion curve, not the goals, is the challenge.
- **Money flow:** early on, nearly all the money is handouts (first decision 120 or 160, discounts 65, chapters 100 and 180, requests 6 to 55). Operations add about 2 M€ a month in 2022, and the bot reaches 30 to 47 M€ a month after expanding. Rising costs push the net negative after about 2044 unless fares go up.

---

## 5. (d) Tutorial ("induction"): 9 stages, `induction.js`

Each stage has a briefing (2 or 3 lines), a task with checks (`induction-runtime.stageChecks`, `induction-runtime.js:77-93`) and a debrief. The quizzes **never change money**, and only correct answers are recorded: a wrong one shows its feedback and must be answered again. The task runs in a single "coach" panel (`app.js:488-517`); the other characters' advice opens on demand.

| # | Stage | Teaches | Real actions checked |
|---|---|---|---|
| 1 | mandate | Choose what to protect: cash, coverage or both | Answer only. **All 3 options are correct and have no effect** (`effect:{}`), which duplicates the `inaugural` decision that really sets the policy. |
| 2 | diagnosis | The track decides which train fits. Madrid–Salamanca is std + ib with a changer at Medina and has catenary. | See the gauge layer, the power layer, and the AVE / Alvia / hybrid comparison computed live by `routeOptions` (`induction-task-ui.js:29-42`). Quiz: correct = "variable". |
| 3 | offer | More frequency costs money; read the forecast before applying | Madrid–València frequency raised above the baseline and fare changed, with the preview seen |
| 4 | people | Drivers needed against available; training takes 3 months | Staff panel seen. Quiz: correct = "pipeline". Hiring 20 for 0.3 M€ is optional. |
| 5 | competition | Policies act now and cost every month; research costs now and takes time | Competition seen, staff and research seen, then invest or "Conservar la caja" |
| 6 | infrastructure | Opening a train today is different from building track for tomorrow | Madrid–Salamanca opened with a compatible Alvia (4 M€); Torralba–Soria quote read (44 M€, 21 months, no closure). Quiz: correct = "power" (catenary ≠ gauge). |
| 7 | incident | Responses have different effects | Day started; an incident is injected (`inc-tut`, traction fault, 28 minutes, `operations.js:34-40`) and must be answered |
| 8 | review | The day report against the monthly close | Day closed, report read, next day prepared |
| 9 | handoff | Sign the first contract | A contract accepted. Quiz: must match the branch signed. |

- **Notes:**
  - The tutorial starts after the inaugural decision at month 0 (`app.js:1296`). It can be paused and resumed and is saved (`validInduction`).
  - `inductionBriefing` swaps in an already-recorded generic line once the first contract has changed (`induction-runtime.js:34-38`). This is a good pattern for reusing recordings.
  - **Weaknesses:**
    - Stage 9 talks about an 18-month deadline, but that contract completes after one month.
    - Óscar del Puente introduces himself as "alcalde consultado" while his name plate says "Ministro de Transportes".
- **Voice:** 36 lines + 14 feedbacks = 50 of the 412 recorded classic bodies. The full split is 315 encounters, 36 + 14 tutorial, 22 events, 15 decisions, 5 chapters and 5 arcs, checked with `sim/voices.mjs`. Recordings are keyed by `clipId(person, fullText)`, FNV-1a over `person|speechText(text)` (`voice.js:40-44`). A line can be reused anywhere **as long as both the speaker and the exact text stay the same**.

---

## 6. (e) What is genuinely fun or valuable and should survive

1. **The network compatibility model and its explanations** (`infra.plan`, `faultText`, the "Qué puede circular" block at `app.js:1006-1016`, the tramo and node inspectors, the gauge and power map layers). It is the game's identity, it is realistic, and it already explains in plain words why a train cannot run, linking to the tramo that blocks it. The next step is to extend it with voltage and fixed-ibérico or diesel trains, as `rules.md` proposes.
2. **The real Renfe timetable and trains moving on the map**, including the observer mode, day types and holidays, smooth acceleration, sunrise and sunset, and the station departure boards. It is a cheap source of immersion and of "the world is real".
3. **Real historic openings on their real dates**, plus the dialogue line that waits for the Pajares opening before it is offered (`tycoon.js:71`). This is "the dialogue says it, so it happened" done right.
4. **Corridor contracts:** requirements read from the live engine, 3 consecutive monthly closes, a choice between public and commercial branches, an optional bonus, and a material-readiness check before signing. This is the best "goal ↔ state" system in the game and the natural backbone for a single mode.
5. **Chapters whose text and objectives agree.** The minister asks for València–Barcelona high speed and Almería, and the objective measures exactly that.
6. **The demand logit with bus, car and rivals,** the capacity and occupancy figures, the fare lever and the inflation index. They create real trade-offs in fare, frequency and rolling stock.
7. **Deterministic, reactive rivals:** entry by region and year, a price war one half-year in three, and responses to your fare and frequency.
8. **Staff lead time:** 3 months of training, and trips cancelled when short.
9. **The incident model's links to state:** the count depends on fleet condition and maintenance, changer faults happen at real changers, and the weather depends on the month.
10. **Trenespop:** used lots with condition, immediate delivery and factory alternatives (see `market.md`).
11. **The city panel:** skyline art by hour, +/− buttons for each connection, and requests and peaks right where you act. It makes for fast, tactile interaction.
12. **The cast:** 9 characters, 7 moods, painted portraits and 412 recorded bodies. The chapter, decision and tutorial texts are the strongest writing.
13. **The tutorial's action-based design:** it checks real state rather than counting clicks, and its quizzes give pedagogical feedback.

---

## 7. (f) What is weak

### 7.1 Random or unearned outcomes

- **Gambles:** the audit (55 %) and the state visit (50 %).
- **Deliveries:** 28 % chance of a 2 to 6 month delay.
- **Works:** 22 % chance of a 3 to 9 month delay.
- **Events:** a 32 % roll each month, with the event drawn at random from the eligible pool.
- **Encounters:** a fixed permutation, unrelated to the state.
- **Requests:** a random city, a random type, and a reward of 6 + rand·10.
- **Demand peaks:** random route and window.
- **Incident counts:** partly random (`rand·2.2`).
- **None of these comes from player choices.** The delays come with "Qué sorpresa" text rather than a cause the player could have managed.

### 7.2 Abstract effects not tied to the network

- Most decision and event choices (§3.9, §3.10) and every encounter (§3.11) only change ±cash, ±reputation or ±satisfaction, or ±trust.
- **Choices whose text promises an action that never happens:**
  - "Lanzar los Alvia a Asturias";
  - "Plan Extremadura";
  - "Prometer catenaria" (Teruel);
  - "Reducir la oferta";
  - "servicios mínimos";
  - "Bajar tarifas un tiempo";
  - "Wifi nuevo" (does not switch the wifi policy on);
  - "Inaugurar lo que haya";
  - "Reforzar los Alvia" (no service is touched);
  - "Competir en servicio" (competition unchanged);
  - "Financiar el piloto" (no research);
  - rural counties paying with no service obligation.
- Satisfaction does not drive demand. Station and route levels are flat percentages.

### 7.3 Flags or values nobody reads, or with negligible effect

- `flags.hedge` is set and never read.
- The trust bonuses at 80 or more are tiny: demand ×1.005 and ×1.002, and −0.1 M€ a month.
- The `tutorial.mandate` answer has no effect.
- The `HISTORICAL_ORDERS.h2030` tender is never used.
- Encounter moods are cosmetic.
- `policy` can only be set once, by the first decision.

### 7.4 Decisions disconnected from state

- Encounters talk about driver shortages, OuiOui, an unnamed county or a pilot project no matter whether any of these exist.
- Decision prompts arrive by date whatever the network looks like. Burgos and Murcia arrive at the start of the month while their lines open on day 21 and day 20. A player with no Alvia still gets "Reforzar los Alvia".
- Arc lines are static across corridors.

### 7.5 Loop problems

- **Delegating dominates the day layer.** Measured with `sim/days2.mjs` (2 months) and `days.mjs` (6 months), starting from the same seed:

  | Strategy | Cash after 2 months | Satisfaction after 2 months | Satisfaction after 6 months |
  |---|---|---|---|
  | Delegate the month | 623.70 | 55.35 | 52.14 |
  | Play every day, wait at incidents | 622.76 | 28.43 | **7.88** |
  | Play every day, catch every peak | 615.91 | 53.09 | — |

  The incidents and peaks feed nothing back into monthly reliability or revenue. "Hasta el último tren" even avoids the peak penalty that watching the day in real time incurs.
- **The real-time day is too long for a 29-year campaign.** One month takes 28 to 31 days of 1 to 9 minutes each, so the design pushes the player to delegate. That makes the showcase feature, real trains on the map, a spectator mode.
- **Exploits:**
  - The requests that pay on the spot (+42 M€ at month 0).
  - The first contract, which completes itself.
  - Encounter topic 2, a +8 % overhaul of the whole fleet for 2 M€.
  - The gamble retry when cash is below 20.
- **Chapters gated by date:** a competent player waits for the year rather than for skill.
- **Displayed falsehoods:**
  - "Trenes llenos" on every request card (`app.js:379`).
  - The day report's passengers are the monthly forecast spread over the days.
  - The HUD's daily figures do not match the report.
  - The "Autobús a cinco euros" event against a modelled bus fare of about 32 €.

### 7.6 Realism gaps (the user's earlier request)

- Voltage is ignored. Two mixed-gauge 3 kV tramos (`sag-vlc`, `sag-cas`) let 25 kV-only AVE trains run Madrid–Castellón and Castelló–València (`sim/volt.mjs`).
- There is no fixed-ibérico rolling stock, no pure diesel, no regional or media-distancia (MD) trains, and no single or double track. A 3 kV line cannot be converted to 25 kV, and mixed gauge cannot be converted to standard (`rules.md`).
- `trains.json` already covers 16 real series to fill these gaps: Civia 463/465, 449, 470, 480, 592, 594, 599, 730, the Dörfler bi-mode, 120, 130, 106, 103, 112 and the BCBB high-speed train.

### 7.7 UI weight

The UI has:
- 5 drawer pages, plus sub-tabs (Despacho has 4 tabs and Dirección has 5 sub-tabs);
- 7 inspector types;
- the mission card, HUD, day bar with timeline, coach and modals.

Contract cards nest a card, a requirements list, a `details` block and material options inside the agenda tab, inside the Despacho page: boxes inside boxes. Most panels carry paragraph-length explanations. This is the opposite of the "minimalist, real game" brief.

---

## 8. (g) Code reuse notes

- **All the listed modules import cleanly in Node** (`sim/imp.mjs`): data, network, schedule, infra, engine, operations, tycoon, story, encounters, induction, induction-runtime, marketplace, city-art, faces, voice, dialogue-presentation, train3d, tycoon-ui, induction-task-ui, brands and main-menu.

- **Pure and directly portable:**
  - **`infra.js`:** `plan`, `profileOf`, `PROFILES`, `WORKS`, `CHANGER_WORK`, `tramoWorks`, `changerPossible`, `applyHistoric`, `faultText`, `pathCoords` and `pathNodes`. It uses a non-enumerable cache `s.__graph` keyed by `infra.ver`, so any state with `infra` and `projects` works. Generalise `profileOf` to the voltage-aware profile proposed in `rules.md`.
  - **`schedule.js`:** GTFS runtime with module caches.
  - **`network.js`:** `makeRoute`, `wayKm`, `potentialDemand`, `defaultFare`. Note that importing it mutates `CITY`.
  - **`engine.js` building blocks:**
    - `metrics` and `balance`, the demand and cost model. They take `s` and read `s.tycoon`, `s.flags`, `s.stations`, `s.policy` and `s.maintenance`.
    - `configureRoute`, `requiredUnits`, `purchaseQuote`, `workQuote`, `startWork`, `finishWork`, `newLineQuote`, `buildLine`.
    - `objectiveValue`, `chapterReady`, `checkRequests`, `generateRequest`, `stationCost`, `finalScore`.
    - `random`, a seeded linear congruential generator stored in `s.seed`.
  - **`tycoon.js`:**
    - `competition`, `effects`, `monthlyCost`, `staffing`, `driverNeed`.
    - Contracts: `projectOffer` (private), `contractDetails`, `inspectRequirement` (private), `assessContracts`, `accept`, `tick`.
    - The contract engine can be lifted almost as-is. Its requirement kinds are `active`, `frequency`, `fare`, `station`, `level`, `staff`, `margin`, `networkMargin`, `occupancy` and `punctuality`, and it is a good generic "goal from real state" engine.
  - **`operations.js`:** `servicePlan` (module-level `planCache`; the key includes `s.infra.ver` and the open projects), `startDay`, `resolveIncident`, `endDay`, `checkSurges`, `sunAltitude`, `sunTimes`, `daylight`, `constructionStatus`.
  - **`marketplace.js`:** listing logic (state-bound to `s.marketplace`, `s.month` and `MODEL`). See `market.md` for the refactor into display pieces.
  - **Art:** `city-art.citySkyline(id, name, pop, level, light, minute)` and `faces.faceURL(person, mood)`. Both are pure SVG or data-URI generators that can be reused anywhere.
  - **Voice and dialogue:** `dialogue-presentation.dialogueHtml` (pure), and the `voice.js` helpers `clipId`, `sentences` and `speechText`. Those are pure; the `Voices` class needs `AudioContext`.
  - **Data:** `story.js`, `encounters.js` and `induction.js`. Their **text bodies are frozen by the recordings**: any reuse must keep the text and speaker unchanged, though effects, triggers and order can be rewritten freely.

- **HTML string builders** have no DOM access but rely on `app.js`'s `data-action` conventions and CSS:
  - `tycoon-ui.tycoonPage(s, tab)`, `directionCount`;
  - `induction-task-ui.focusedTaskHTML`;
  - `main-menu.menuHTML`;
  - `marketplace.catalogueHTML` and `detailHTML`.

  They can be reused if the new shell keeps those action names, or with an attribute prefix as `market.md` suggests.

- **DOM-coupled:**
  - `app.js`: a global `state` and `ui`, a document-wide `click`, `submit`, `input` and `change` handler on `[data-action]` and fixed ids such as `routeForm`, `frequency`, `fare`, `buyQty`, `marketSearch`. It also handles the frame loop, tutorial runtime, modals and drawer.
  - `map-v3.js` (canvas), `train3d.js` (three.js), `music.js` and `sfx.js`.

  `app.js` should be treated as reference behaviour, not a reusable library.

- **Things to resolve before porting:**
  1. **Time unit.** Every classic constant is per month: wear 0.29 a month, satisfaction average 0.16 a month, trust 0.04 a month, interest 0.004 a month, contract streak of 3 monthly closes, requests lasting 4 months, encounters every 3 months, work durations in months. Rescue runs in weeks, so scale each constant or keep the month as the close.
  2. **Save format.** `validateSave` is strict: `version:4`, MODEL ids, tramo ids, at most 400 relations. A merged state needs a new version and migration.
  3. **Cross-module calls.** `engine` imports `tycoon`, `marketplace`, `story`, `encounters` and `induction-runtime`, and `tycoon` imports `infra` and `data`. Extracting `metrics` therefore drags `T.effects`, `T.competition` and `T.requiredUnits` with it. That is acceptable, since all are pure.
  4. **Rolling stock.** `MODEL` and `MODELS` are assumed everywhere (`fleet.model`, the `s.fleet[].model` lookups). A new catalogue with voltage, gauge and traction needs a profile adaptor where `profileOf` and `metrics` read `m.energy`, `m.family` and `m.seats`.

---

## 9. Implications for the unified mode

This section is input for the design step. Nothing here has been decided.

- **Keep:** the network planner, the real timetable, historic openings by date, the contract engine, the chapter structure with objectives drawn from state, the rivals' logic, drivers and training, Trenespop, the city panel and the cast and recordings.
- **Make every recorded line conditional on state and give it a concrete effect** that matches its text. Examples:
  - "Plan Extremadura" queues or discounts the Talavera–Plasencia electrification.
  - "Lanzar los Alvia a Asturias" opens or reinforces a service through `leo-pol`.
  - The strike cancels a share of the trips in `servicePlan`.
  - The wifi event switches the wifi policy on.
  - Encounters only appear when their topic exists: a staff shortage, a rival present on a route, a forgotten station with a named city, a research project in progress.

  The 315 encounter bodies have no place names. Select by topic plus a mood that matches the situation, for example an angry speaker when a group's trust is low.
- **Replace the dice with causes:**
  - Delivery and works delays should depend on maker reliability, backlog and the territory group.
  - Gambles should depend on reputation or audit state.
- **Make the day pay or remove it.** Either day results feed the monthly reliability and revenue, or the day becomes an optional cinematic or observer view with no penalties. Delegating should not be strictly better.
- **Close the exploits:** pay requests only after N months of service; scale the first contract to the actual traffic; price the fleet overhaul per unit.
- **Have satisfaction drive demand,** or merge it with reputation.
- **Add voltage, traction and gauge per train** from `trains.json` and `segments.json`, and add the two missing works (3 kV to 25 kV, mixed to standard).
