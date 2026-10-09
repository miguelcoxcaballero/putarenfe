# Research: railway and transport management games. UI and mechanics to borrow for «Rescate de Tenfe»

Scope: Transport Fever 2, OpenTTD, Railway Empire 2, Mini Metro and Mini Motorways, Rail Route, NIMBY Rails and Sid Meier's Railroads!. The focus is on five things:
- how each game shows **compatibility** (gauge and electrification) when you buy trains or build routes;
- how it keeps a data-heavy UI **clear** (what sits where, how you find things, how it tells you what to do next);
- how it makes each game **different** (seeds, scenarios, modifiers, rivals, events);
- its **short-term reward loops** (weekly choices, subsidies, contracts, auctions);
- what players **praise and complain about**.

Each game section ends with **«Para Tenfe»**, a concrete adaptation for our weekly game. Our game has 3 orders a week, 416 weeks, elections in weeks 208 and 416, a mission panel, a corridor card, 8 map layers and a quote shown before each approval (see `scratchpad/unify/rescue.md`).

**Method.**
- **Official wikis and source code:**
  - Transport Fever 2: the official manual at `wiki.transportfever2.com` (DokuWiki, developer-run).
  - OpenTTD: the official wiki at `wiki.openttd.org`, plus the **source code** on GitHub (`build_vehicle_gui.cpp`, `vehicle_gui.cpp`, `lang/english.txt`, `town_type.h`, `town_cmd.cpp`, `vehicle_type.h`, `news_type.h`). The source gives the exact UI strings, filters and thresholds.
  - Mini Metro and Mini Motorways: the Fandom wikis, read through the MediaWiki API.
- **Store pages and official news:** Steam store pages (descriptions and review scores as of 9 Oct 2026) and Kalypso's official patch notes.
- **Developer writing:** the NIMBY Rails developer devblog.
- **Third-party coverage:** reviews (Games Asylum, Macworld, Pocket Gamer, TheSixthAxis via search), Steam discussions and guides.
- **Access problems:** several sites would not resolve through the fetch tool (Wikipedia for most pages, moddb, gamingmindsstudios.com). For those I used curl, or I quote the search-result summary and say so.
- **Unverified claims** are marked "(unverified)".

---

## 0. TL;DR: the twelve most transferable ideas

1. **Buy from a context, and filter by compatibility.** OpenTTD's purchase window, opened from a depot, lists only engines that "have power on" that depot's rail type. The caption changes ("New Electric Rail Vehicles"), and each engine's info block prints a line `Rail types: …` ([source `build_vehicle_gui.cpp` L1470, L596](https://github.com/OpenTTD/OpenTTD/blob/master/src/build_vehicle_gui.cpp), [english.txt L4221-4263](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)). In Tenfe, Trenespop opened from a corridor shows first what can run there, then greys out the rest with the reason.
2. **Show the gap, not just the verdict.** TF2 has a warning "No electric path found. Check if some sections miss catenary". Its catenary tool paints the sections that still lack the upgrade **red** and the ones that have it **blue**. OpenTTD's wiki admits small unelectrified gaps are "very difficult to spot" and that electric trains "stop and reverse" on them. **The most common electric-train complaint is an invisible gap** ([TF2 UI](https://wiki.transportfever2.com/doku.php?id=gamemanual:userinterface), [TF2 tracks](https://wiki.transportfever2.com/doku.php?id=gamemanual:streetstracks), [OpenTTD electrified rail](https://wiki.openttd.org/en/Manual/Base%20Set/Electrified%20railways), [Steam thread](https://steamcommunity.com/app/1066780/discussions/0/2639605881178624707)).
3. **Weekly "1 fixed + choose 1 of 2".** Every Mini Metro week ends with one locomotive plus a choice of two from a pool: line, carriage, 2 tunnels or bridges, interchange. Each map bends the odds: Osaka offers a Shinkansen, Hong Kong gives 2 locomotives, Berlin gives 1 tunnel at a time ([Budget Increase](https://mini-metro.fandom.com/wiki/Budget_Increase)). Mini Motorways repeats the loop every Sunday ([Upgrades](https://mini-motorways.fandom.com/wiki/Upgrades)). This is the cleanest weekly reward in the genre.
4. **Modifiers as replay seeds.** Mini Motorways' daily and weekly challenges combine about 47 named rule tweaks: "Rush Hour", "Less is More", "Mini Mysteries" (the weekly choices are hidden), "Bridge to Bankruptcy" ([Modifiers](https://mini-motorways.fandom.com/wiki/Modifiers)). A handful of these per game gives Tropico-style variety for almost no code.
5. **Subsidy race.** In OpenTTD a town offers "First X from A to B will attract a subsidy". The first company to deliver earns ×1.5 to ×4 for a year, and the offer expires ([Subsidy](https://wiki.openttd.org/en/Manual/Subsidy), [english.txt L961-968](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)). This makes a perfect "Subvención de Bruselas" with a deadline.
6. **Manufacturer preview offer.** OpenTTD: "We have just designed a new X – would you be interested in a year's exclusive use of this vehicle…?" ([english.txt L4436-4438](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)). This is ready-made satire for Malstom, KAFKA and Tardo.
7. **Town-rating ladder with priced actions.** OpenTTD's local authority rating runs from −1000 to 1000 and starts at 500. It has 8 labels from Appalling to Outstanding. The action menu offers advertising, funding roads, a statue, exclusive rights and a bribe. A bribe adds +200 up to 800, but carries a **1 in 14** chance of being "discovered by a regional investigator": the rating drops to −50, all station ratings go to 0 and you are banned for 6 months ([`town_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_type.h), [`town_cmd.cpp` TownActionBribe](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_cmd.cpp)). This is a direct template for mayors and cloacas.
8. **Profit traffic-light per vehicle.** OpenTTD's vehicle list shows a dot for each vehicle:
   - grey if younger than 2 years;
   - red if last year's profit was below 0;
   - yellow if it was below 10,000;
   - green otherwise.
   
   Each row also reads "Profit this year: X (last year: Y)" ([`vehicle_gui.cpp` L580-595](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_gui.cpp), [`vehicle_type.h` L37-38](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_type.h)). One icon answers "is this working?"
9. **Fixed screen zones and one warning inbox.** TF2 fixes its zones:
   - top-left: data layers;
   - top-center: a warning icon that "shines in red", and clicking a name inside a warning jumps to the place;
   - bottom-left: bank balance (opens finances) plus 3 key values;
   - bottom-center: the tools;
   - bottom-right: statistics tables.
   
   ([TF2 UI](https://wiki.transportfever2.com/doku.php?id=gamemanual:userinterface)).
10. **Two-pane list and detail, hover highlights on the map.** TF2's line manager has the list on the left and the stops on the right. Hovering a line makes it blink in the world; hovering a stop blinks only its segments. Broken legs turn the line graph red, with a yellow or red arrow that explains the problem and an "auto-fix" button ([Lines and Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:linesvehicles)).
11. **Tasks with dates and time-based score**, plus optional random tasks in free play. In Railway Empire 2, each task has a deadline, and finishing faster earns more points. Custom games can switch the task list off or generate random optional tasks ([guide](https://www.magicgameworld.com/railway-empire-2-guide-to-personnel-and-tasks/)). TF2 missions each have **3 bonus tasks** that award medals ([Campaign](https://wiki.transportfever2.com/doku.php?id=gamemanual:campaign)).
12. **Setup screen = variety.** Typical options:
    - TF2: seed text box, climate, size, towns, industries, start year in 10-year steps, 4 difficulties, and cost and loan multipliers ([Free Game](https://wiki.transportfever2.com/doku.php?id=gamemanual:freegame)).
    - OpenTTD: terrain, rivers, sea level, "variety distribution", AI competitors, recessions and disasters ([english.txt mapgen](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)).
    - Railway Empire 2: 6 leaders with traits, a "disable mergers" toggle, random tasks on or off ([Kalypso](https://www.kalypsomedia.com/eu/railway-empire-2)).

---

## 1. Transport Fever 2 (Urban Games, 2019)

Steam: **Very Positive**. 89 % of 10,862 reviews are positive, and 85 % in the last 30 days ([Steam](https://store.steampowered.com/app/1066780/)).

### 1.1 Screen layout: where things are
From the official manual ([User Interface](https://wiki.transportfever2.com/doku.php?id=gamemanual:userinterface)). The PC layout has 9 numbered zones:

| # | Position | Element | Opens / does |
|---|---|---|---|
| 1 | top-left | Data-layer dropdown + HUD icon filter | Overlays (speed limits, destinations, cargo, emissions…). The filter shows or hides map icons in 3 groups: vehicles, buildings, misc |
| 2 | top-center | **Warning window** icon | "Whenever there is a disruption… the icon shines in red". Clicking a name in a warning moves the camera there |
| 3 | top-right | Pause menu | Save, load, settings, quit |
| 4 | bottom-left | **Bank balance** | Opens the company and finances window |
| 5 | toolbar | Context help (F1) | Help for whatever is open |
| 6 | bottom-center | Line manager, vehicle manager, construction, landscaping, bulldozer | The main verbs |
| 7 | bottom-right | Statistics: lines, vehicles, stations, towns, industries | Sortable tables |
| 8 | bottom-left | 3 key values | Earnings over the last 12 months, total passengers, total cargo |
| 9 | bottom-right | Speed, camera, music, date | — |

On a controller, all of this collapses into a **radial menu** with 7 entries ([same page](https://wiki.transportfever2.com/doku.php?id=gamemanual:userinterface)).

**Warnings window.** The list is explicit, and each warning is a cause the player can fix:
- interrupted street connection;
- line with fewer than 2 stations;
- a station twice in a row;
- could not connect stations;
- wrong station type;
- no path found;
- **"No electric path found. Check if some sections miss catenary when using electric locomotives"**;
- trains mutually blocked (deadlock).

**Help layers** ([In-game help](https://wiki.transportfever2.com/doku.php?id=gamemanual:ingamehelp)):
- the campaign doubles as the tutorial;
- F1 opens context help;
- a "guide system" that **highlights features in yellow** the first time you use them or "when the player is stuck a bit";
- tooltips after 1 second that show the hotkey.

### 1.2 Track types, electrification, high speed, bridges
From [Streets and Tracks](https://wiki.transportfever2.com/doku.php?id=gamemanual:streetstracks) and [Free Game](https://wiki.transportfever2.com/doku.php?id=gamemanual:freegame):

| Track | Max speed | From | Cost per m |
|---|---|---|---|
| Standard | 120 km/h | 1850 | 75 |
| High-speed | 300 km/h | 1925 | 150 |

- **Catenary is an upgrade on top of the track type**, available from 1910. Tram tracks cost 20 % of the street cost; electrified tram tracks cost 40 %.
- **Track tools tab: "add or remove catenary or up- or downgrade the track type".** The tool works on everything between two switches (or several hundred metres); hold Shift to work segment by segment. "Sections that do not have the selected tool applied yet are displayed in **red**, all others are **blue**."
- **While you lay track**, "small numbers indicate what the final speed restrictions in that area will be", because curve radius caps speed.
- **Bridges have their own speed cap and replacing one shows its price**:

| Bridge | Max speed | From |
|---|---|---|
| Stone | 90 km/h | 1850 |
| Iron | 180 km/h | 1910 |
| Suspension | 180 km/h | 1940 |
| Cement | 320 km/h | 1970 |
| Cable-stayed | 320 km/h | 2000 |

  A bridge or tunnel can be swapped in place with a "REPLACE FOR $X" button.
- **Vehicle-medium compatibility table** ([Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:vehicles)):
  - steam or diesel trains run on railroad tracks;
  - electric trains need **electrified** railroad tracks;
  - horse or steam trams need tram tracks; electric trams need electrified tram tracks;
  - large planes need a large airport, and large ships need large docks.
  
  The rule is printed once, as a table.
- **"Track speed limits" data layer**: "All tracks are highlighted in a color between red and blue… The actual speed limit is shown by numbers in small black boxes along the tracks" ([Statistics and Data Layers](https://wiki.transportfever2.com/doku.php?id=gamemanual:statisticsdatalayers)).
- The company "Tracks" chart plots 5 curves: total, **electric**, **high-speed**, bridge and tunnel length. It is a progress chart for upgrades ([Company and Finances](https://wiki.transportfever2.com/doku.php?id=gamemanual:companyandfinances)).

### 1.3 Vehicle purchase window
From [Lines and Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:linesvehicles):
- Opened from a **depot**: "select a depot from the list or somewhere on the map. Then BUY VEHICLE". Only vehicles purchasable in *that* depot appear.
- **Left column: category filters for train depots**:
  - ALL;
  - LOCOMOTIVES, split into Steam, Electric and Diesel;
  - WAGONS, split into Passenger and Cargo;
  - MULTIPLE UNITS, split into Electric and Diesel. Steam multiple units also exist.
  
  The current filter is shown at the top of the window.
- **Search field. Sort** by various criteria, with the current criterion and direction shown at the top. **Cargo filter** ("only show vehicles that can load a certain type of cargo").
- **Right column: technical data.** Fields shared by all vehicles ([Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:vehicles)): build date (availability window), top speed, capacity, weight, running costs, **lifespan** and emissions. Locomotives add power and tractive effort.
- **Composition strip at the bottom.** Add, reorder or remove cars. "The numbers below the composition are the calculated technical aspects of the whole train": **top speed = the lowest of any car**, plus power and length. The text warns that the train "should fit the smallest platform on the route". A too-short platform later shows "Loading speed: 0.50x" in the vehicle window.
- Pick the quantity, then "BUY FOR $X" (bottom-right) and CANCEL (bottom-left). After purchase the vehicle appears bottom-left. A setting controls whether the vehicle window opens after buying: never, first only, or all.
- **Eras**: "When vehicles get outdated, they will no longer be available for purchase. Therefore, only a portion of all vehicles in the game is available at any time."

### 1.4 Line manager, vehicle manager, statistics
- **Line manager** = a two-pane window: list of lines on the left, stops on the right.
  - Filter icons by mode, plus "**visible in the current viewport**", combinable with the others. Text search.
  - "While hovering a line in the list… that line will start to blink in the 3D world." "If a stop… is hovered, only the line segments that arrive or depart from this stop will blink."
  - Per stop: terminal choice, alternative terminals, waypoints, and a departure rule. The rules are "Load if available / Full load (any) / Full load (all)", with min and max wait sliders (default timeout 3 minutes real time).
  - **Errors**: unreachable terminals get a **yellow arrow** with hover text; several problems turn the arrows **red**, "the line graph… turns red in the problematic sections", and the red error message carries an **auto-reassign button**.
- **Vehicle manager** = lines and depots on the left, vehicles on the right, with checkboxes for bulk actions:
  - assign to line;
  - sell;
  - send to depot;
  - clone;
  - edit composition;
  - **replace** with another model;
  - **maintenance level** (higher cost, fewer emissions, and condition stops falling);
  - colour.
- **Statistics tables** ([Statistics](https://wiki.transportfever2.com/doku.php?id=gamemanual:statisticsdatalayers)), all sortable:
  - **Line statistics**: Line (colour + name) | Vehicles (compressed "x3" notation, "+X" bubble if more) | Cargo (load/capacity) | **Frequency** | **Rate** (per year) | **Balance** (annual).
  - **Vehicle statistics**: Name | Composition | Line | Cargo | Maintenance | **Condition** | Emission | **Age** | **Balance**.
  - **Station statistics**: Name (camera button) | Town | Type | Cargo waiting | **Overload** | Maintenance.
  - **Town statistics**: Size | public and private reach | cargo | station rating | traffic | emissions | growth.
  - **Detail windows have tabs**: OVERVIEW / VEHICLES / FINANCES (income vs maintenance chart with a time-range slider) / CHARTS. Windows can be **pinned**.

### 1.5 Company, finances, score
From [Company and Finances](https://wiki.transportfever2.com/doku.php?id=gamemanual:companyandfinances):
- **Six tabs**: Finances table, Finances chart, Balance, Tracks, Towns, Headquarters.
- **The finance table** groups income and costs by mode (Road / Railroad / Water / Air): tickets, vehicle maintenance, track maintenance and infrastructure maintenance. Below that come Investments (vehicles, roads, tracks, infrastructure), Loan interest and Total. Columns show the current year and **the three previous years**. Borrow and repay in $500,000 steps.
- **Company score** ("Headquarters" tab). One point for each:
  - started $1 bn of company value;
  - 10 trains;
  - 100 km of rail network;
  - **100 km of electrified rail network**;
  - 10 km of bridges;
  - 10 km of tunnels;
  - 100 km/h of the fastest vehicle;
  - $10 M of annual profit;
  - 100,000 passengers;
  - …and so on.
  
  **The HQ building grows with the score**: a visible trophy for long-term progress.

### 1.6 What makes each game different
- **Free game setup in 3 steps** ([Free Game](https://wiki.transportfever2.com/doku.php?id=gamemanual:freegame)):
  1. Map: climate (temperate, dry, tropical; looks only), size, ratio, number of towns and industries, per-generator sliders, and a **seed** text box ("With the same seed and the same settings, a map will be created identical each time"). A live map preview sits on the right.
  2. Settings: vehicle set (Europe, America, Asia), **start year in 10-year steps from 1850 to 2000**, difficulty (easy, medium, hard, very hard; "They differ in the financial aspects"), towns' cargo needs, industry closure frequency, industry density target.
  3. Advanced:
     - finance multipliers: max loan, interest, vehicle and infrastructure investment, vehicle and infrastructure maintenance;
     - six town-growth factor sliders: public transport, private transport, cargo, overcrowding, congestion, emissions;
     - cheats: sandbox, no cost, vehicles never expire. Cheats disable achievements.
- **Campaign**: 3 chapters of about 10 hours each. Every mission has a goal plus **3 bonus tasks → medals** ("the dark placeholders switch to gold"). "Tasks include decisions and players can therefore fulfill the goals in several ways" ([Campaign](https://wiki.transportfever2.com/doku.php?id=gamemanual:campaign)).
- Free play has **over 50 achievements** ([Steam](https://store.steampowered.com/app/1066780/)).

### 1.7 Praise and complaints
- **Windows "cover the most of the screen unnecessarily"**, with the vehicle preview window as the main example. The poster asked for compact panels in the style of Transport Tycoon Deluxe ([Steam discussion](https://steamcommunity.com/app/1066780/discussions/0/3963662301883409496)).
- **The late game is hard to read.** TheSixthAxis: TF2 feels less cluttered than TF1, but "it can still be difficult to get a good overview of your different lines and routes as you head later into the game" ([TheSixthAxis review](https://www.thesixthaxis.com/2020/01/13/transport-fever-2-review/), via search).
- **Electric trains that won't leave the depot.** Typical causes are a depot that is not electrified or a missed link. The fix suggested in the thread: use the upgrade tool, where "electrified track shows up in blue" ([Steam thread](https://steamcommunity.com/app/1066780/discussions/0/2639605881178624707)).

### «Para Tenfe»
- **Copy the zones.** Our top bar already carries caja, trenes, cuadrillas, apoyo and ★. Add one **Avisos** icon top-center that turns red. Each aviso is a sentence with the object's name as a link ("Madrid–Badajoz: **82 km sin catenaria de 3 kV** para el S-121"). Clicking the link centres the map and opens the corridor card.
- **"Mejorar tramo" works like TF2's upgrade tool.** When you choose *Electrificar 25 kV*, *Cambio a ancho estándar* or *Renovar vía*, the map paints the target corridor's sections **rojo = necesita la obra, azul = ya la tiene**, with km and price per section, before the order is spent. This is the visual twin of our existing `workQuote`.
- **One "Corredores" table** (our version of Line statistics), sortable:

  Corredor | Trenes (icons ×n) | Ocupación % | Frecuencia | Puntualidad | Balance/sem | Vía % | Compatibilidad (chips)
- **Train speed = min(train vmax, section vmax).** Show the bottleneck the way TF2 shows curve numbers: in the corridor card, "Velocidad útil 160 km/h: limita *Puertollano–Brazatortas (160)*".
- **HQ that grows**: a "Sede de Tenfe" pictogram on the mission panel that grows with points for km electrified, km of standard gauge, fastest train and passengers. It is cheap, and it makes the score visible.

---

## 2. OpenTTD (open source, ongoing)

The official manual is the [OpenTTD wiki](https://wiki.openttd.org/en/Manual/). Exact strings and numbers below come from the C++ source on GitHub.

### 2.1 Screen layout
From [Game interface](https://wiki.openttd.org/en/Manual/Game%20interface):
- **Top menu bar in fixed groups, left to right:**

  | Group | Buttons |
  |---|---|
  | Game controls | Pause, Fast-forward, Options, Save/Load |
  | Map information | Minimap, Towns directory, **Subsidies**, Station list |
  | Company and industry | Finances, Company info (shares), Graphs, **League table**, Industries |
  | Vehicle information | Train, road, ship and aircraft lists |
  | Zoom | Zoom in, zoom out |
  | Construction | Rail (**click and hold opens the rail-type dropdown**), road, tram, docks, airports, landscaping |
  | Other | Jukebox, **News**, Other |

  "You can see what any button does by **right-clicking** on it."
- **Status bar** (bottom):
  - date on the left;
  - news in the middle: "News messages pop up out of the status bar… If you have changed the Message settings to 'Summary' mode, messages will scroll by here… 'Off' mode… notified by a red dot";
  - money on the right.

### 2.2 Rail types and compatibility (the reference model)
From [Types of railway](https://wiki.openttd.org/en/Manual/Base%20Set/Types%20of%20railway), [Electrified railways](https://wiki.openttd.org/en/Manual/Base%20Set/Electrified%20railways) and [Convert rail](https://wiki.openttd.org/en/Manual/Convert%20rail):
- **Four base rail types:**
  - **Normal rail**, from the start: steam and diesel only.
  - **Electrified**, from 1965: electric trains **only** run here, and steam and diesel "can still run on this railway".
  - **Monorail**, from 1999: monorail trains only.
  - **Maglev**, from 2022: maglev trains only.
  - **Wagons and carriages run on rail or electrified rail alike.**
- **Converting:**
  - normal → electrified works "without impacting trains" (no need to empty the line);
  - to monorail or maglev, "ensure that the line has no trains on it";
  - you can mix types inside one station.
  - **Convert your depots too**, "otherwise you will be unable to purchase new electrified engines".
- **The gap pitfall**: "it is very difficult to spot small pieces of non-electrified rail that you may have missed… Any electric train will stop and reverse on meeting one of these sections". The vehicle status line then reads **{RED}"No power"** ([english.txt L4579](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)).
- **Purchase window filtering** (source: [`build_vehicle_gui.cpp`](https://github.com/OpenTTD/OpenTTD/blob/master/src/build_vehicle_gui.cpp)):
  - Opened from a depot, `filter.railtype = GetRailType(depot tile)`. Each engine passes only if `HasPowerOnRail(rvi->railtypes, filter.railtype)` (L1314-1323, L1470).
  - Opened from the toolbar list, the filter is "all rail types" (`INVALID_RAILTYPE`).
  - **The caption tells you which context you are in**: "New Rail Vehicles", "New Electric Rail Vehicles", "New Monorail Vehicles", "New Maglev Vehicles" (english.txt L4221-4231).
- **Engine info block** (english.txt L4236-4263), in this order:

  ```
  Cost: £X  Weight: Y t
  Speed: X km/h  Power: Y hp
  Max. Tractive Effort: X kN
  Running Cost: £X/year
  Capacity: N passengers (refittable)
  Designed: 1965  Life: 25 years
  Max. Reliability: 87%
  Rail types: Railway, Electrified Railway
  ```
- **Sort options for trains** (L422-435): EngineID, Cost, Max speed, Power, Tractive effort, Intro date, Name, Running cost, **Power vs running cost**, Reliability, Cargo capacity.
- **Other controls**: Hide/Display any model (Ctrl+Click) plus a "Show hidden" toggle. "Buy and Refit". **"Also press Shift to show cost estimate only."** Badge filters for NewGRF vehicles (L6066-6073).

### 2.3 Vehicle lists, finance window, league
- **Vehicle list rows**: "Profit this year: £X (last year: £Y)" (L4166), plus a **coloured dot** ([`vehicle_gui.cpp` L580-595](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_gui.cpp), [`vehicle_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_type.h)):

  | Dot | Condition |
  |---|---|
  | grey | age ≤ 2 years (`VEHICLE_PROFIT_MIN_AGE`) |
  | red | last year's profit < 0 |
  | yellow | last year's profit < 10,000 × vehicles (`VEHICLE_PROFIT_THRESHOLD`) |
  | green | otherwise |

  The "Manage list" dropdown applies Replace / Send for servicing / Send to depot to every vehicle in the list. **Groups** have an "Ungrouped trains" bucket.
- **Vehicle status line, colour-coded** (L4572-4593):
  - light blue = normal ("Heading for X", "Loading / Unloading");
  - orange = attention ("Waiting for free path", "Heading for depot");
  - red = broken ("Broken down", "Stopped", "No power", "Crashed!").
  
  Advice news: "X is getting old", "X is lost", "X's profit last year was £Y" (L940-946).
- **Finance window** (L3994-4036):
  - **3 year-columns**, with rows grouped as Revenue / Operating Expenses / Capital Expenses (Construction, New Vehicles, Trains, Infrastructure, Loan Interest, Other) and a Total;
  - below that: Bank balance, Own funds, Loan, Interest rate, Maximum loan;
  - "Borrow £X / Repay £X"; **Ctrl+Click borrows or repays as much as possible**.
- **Company league titles** by performance (L676-684): Engineer → Traffic Manager → Transport Coordinator → Route Supervisor → Director → Chief Executive → Chairperson → President → **Tycoon**.
- **Performance detail rows**, each with a tooltip saying exactly what is measured: Vehicles, Stations, Min. profit, Min. income, Max. income, Delivered, Cargo, Money, Loan, Total. Examples:
  - "only vehicles older than two years are considered";
  - "the quarter with the highest profit of the last 12 quarters".

### 2.4 Newspaper and messages
- **16 news types** ([`news_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/news_type.h)): arrival (company and other), accident (company and other), company info, industry open and close, economy, industry changes (company, other, nobody), advice, new vehicles, acceptance, subsidies, general. **Each type is set separately to Full / Summary / Off** (english.txt L1933-1976).
- **Headline style** (L870-974), short and in big type:
  - "Citizens celebrate . . . First train arrives at {STATION}!"
  - "Transport company in trouble! … will be sold off or declared bankrupt unless performance increases soon!"
  - "World Recession! Financial experts fear worst as economy slumps!"
  - "Traffic chaos in {TOWN}! Road rebuilding programme funded by X brings 6 months of misery to motorists!"
  - "Transport monopoly! Local authority of {TOWN} signs contract with X for 12 months of exclusive transport rights!"
- News items are clickable and centre the view. The News button also offers "last message" and a history.

### 2.5 Short-term reward and pressure loops
- **Subsidies** ([Subsidy](https://wiki.openttd.org/en/Manual/Subsidy)):
  - the offer is announced in the newspaper: "Service subsidy offered: First {cargo} from A to B will attract a {N} year subsidy";
  - the **first company** to deliver before expiry gets **×1.5, ×2, ×3 or ×4** (set by the subsidy multiplier) for a year;
  - unclaimed offers expire ("Offer of subsidy expired").
- **Engine preview**: "Message from vehicle manufacturer: We have just designed a new {X} – would you be interested in a year's exclusive use of this vehicle, so we can see how it performs before making it universally available?" (L4436-4438).
- **Local authority** ([Towns](https://wiki.openttd.org/en/Manual/Towns), [`town_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_type.h), [`town_cmd.cpp`](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_cmd.cpp)):
  - **Rating** from −1000 to +1000, starting at 500. Labels and thresholds: Appalling −400, Very Poor −200, Poor 0, Mediocre 200, Good 400, Very Good 600, Excellent 800, Outstanding 1000.
  - **What moves it:**
    - town growth gives +5 to every company (up to Mediocre);
    - each well-served station gives **+12** and each badly served one **−15** per growth step;
    - cutting trees costs −35 per tree (planting gives +7, up to 220);
    - removing a town bridge costs −250.
  - **Actions** (L3815-3834): small, medium or large advertising campaign; fund road reconstruction (6 months of road chaos); statue ("permanent boost to station rating"); fund new buildings; buy exclusive rights (12 months); **bribe**.
  - **Bribe** (`TownActionBribe` L3671-3705):
    - success: +200, up to a cap of 800, and it cancels a rival's exclusivity;
    - **1 in 14 chance** of "Your attempted bribe has been discovered by a regional investigator" → the rating drops to −50, every one of your station ratings in that town goes to 0, and you are "unwanted" for **6 months**.
  - Error text when you are refused: "{TOWN} local authority refuses to allow this".
- **Goals and Story Book windows** for scripted scenarios: "Click on goal to centre main view on industry/town/tile"; goal progress turns green when complete (L3837-3902).

### 2.6 What makes each game different
- **World generation** (english.txt L3423-3514):
  - map size, number of towns, town-name language (23 sets, including Catalan and "Silly"), date, number of industries;
  - maximum height, average height, sea level, rivers, smoothness, **variety distribution**, map edges (water or freeform, per side), snow and desert coverage;
  - Generate, NewGRF, **AI** and **Game Script** settings.
- **AI competitors** ([AI settings](https://wiki.openttd.org/en/Manual/AI%20settings)): community "NoAI" scripts, one per company slot, each with author-defined parameters. They "start automatically after a given amount of days, with some minor random variation".
- **Economy** ([Economy](https://wiki.openttd.org/en/Manual/Economy)):
  - **recessions** "2-3 times per century", each 9 to 12 months: industry and town production halved, no new industries;
  - inflation (optional, 1920 to 2090);
  - the interest rate is fixed by difficulty;
  - shares can be bought 25 % at a time; 100 % means a takeover with all assets and **debt**.
- **Disasters by era** ([Disasters](https://wiki.openttd.org/en/Manual/Disasters)), e.g. "Zeppelin crash 1930-1955: blocks an airport for half a year", "Small UFO 1940-1970". **Events are tied to periods, not uniform random.**
- **Difficulty settings**: interest rate, breakdowns, subsidy multiplier, construction costs, recessions, disasters, town council tolerance (L1325-1371).

### «Para Tenfe»
- **Chips for compatibility.** Every Trenespop model carries `Ancho: Ibérico · Estándar · Variable` and `Tracción: 3 kV · 25 kV · Bitensión · Diésel · Bimodo`, exactly like OpenTTD's "Rail types:" line. Opened from a corridor, the window's title says so: «Trenes para Madrid–Badajoz (ibérico · sin electrificar)». The models that can run come first. The rest are greyed out with the **first blocking reason**: «Necesita catenaria en 214 km», «Ancho estándar: no entra en Mérida».
- **"No power" = «Sin tensión».** If an obra leaves a gap, the affected trains show a red status line «Sin tensión en Monfragüe (12 km)», never a silent failure.
- **Profit dots** in Flota and Corredores:
  - grey for the first 4 weeks;
  - red if the 13-week balance is below 0;
  - yellow if it is below a threshold;
  - green otherwise.
- **Mayors use the OpenTTD ladder.** Rating −1000..1000, initial 500, 8 Spanish labels (Pésima, Muy mala, Mala, Regular, Buena, Muy buena, Excelente, Inmejorable). Actions with a price:
  - Campaña (S/M/L);
  - Financiar obra municipal (with a cost: weeks of street chaos);
  - Placa conmemorativa (permanent bonus);
  - Exclusividad de 52 semanas against Lowgo;
  - **Sobre** (cloacas): +200 up to 800, with a 1/14 chance that «un inspector de la UCO lo descubre» → −50, the station drops to 0 and 26 weeks of «vetado».
  
  The numbers are proven to work, and they are legible.
- **Subvención con carrera.** Example: «Bruselas financia: primer Vigo–Oporto directo antes de la semana 60 → ingresos ×2 durante 52 semanas». If a rival (Lowgo) gets there first, the newspaper says so.
- **Preview offer from the parody makers.** «Mensaje de Malstom: hemos diseñado el nuevo *Avril 3* — ¿quiere un año de uso exclusivo para que veamos cómo se porta?» Accepting brings low price and low reliability, plus a newspaper story either way.
- **News settings** per category (Full / Resumen / Off), with summaries scrolling in the bottom ticker. Most players will keep "Resumen" for routine items.
- **Eras for events.** Events belong to a stage (s1 to s5), not uniform random. This also helps "lo que dice el diálogo, pasa".

---

## 3. Railway Empire 2 (Gaming Minds / Kalypso, 2023)

Steam: **Mostly Positive**, 72 % of 1,980 reviews. Recent reviews: 82 % of 17 positive ([Steam](https://store.steampowered.com/app/1644320/)). Critic reception (via search summary): GameStar 85/100, GodisaGeek 8.5/10.

### 3.1 Modes and variety
- **Modes**: a 5-chapter campaign (Europe and the US), **14 scenarios**, a customisable free play, a construction mode (sandbox with "unlimited money, no competitors and no tasks", per a Steam description quoted via search), and co-op for up to 4 players. There are **6 characters** to lead the company, "each with their own strengths and weaknesses" ([Kalypso](https://www.kalypsomedia.com/eu/railway-empire-2), [Steam](https://store.steampowered.com/app/1644320/)).
- **Tasks**: "In the scenarios and campaigns mode, all tasks are displayed in the Task List. Each task has a date, and if you miss it, the game ends. The faster you complete a task → the more points you earn". "In the custom game mode, there's an option to disable the task list… If you choose not to disable it, the game will generate **optional random tasks**" ([guide](https://www.magicgameworld.com/railway-empire-2-guide-to-personnel-and-tasks/)).
- **Rivals**:
  - **Sabotage**: hire a saboteur. It takes at least 50 days, and spending more makes it faster and better. Targets: tracks, trains or stations (delays); businesses or factories (production halt); a rival's HQ (steal research) ([Sabotage](https://www.magicgameworld.com/railway-empire-2-sabotage/)).
  - **Shares**: traded in 1 % increments (a share = 1 % of company value); you cannot buy your own. **100 % of a rival = takeover**, and you then choose to run it, dissolve its lines or integrate it. **If a rival reaches 100 % of yours, the game ends.** Mergers can be disabled before starting.
  - **Stock market**: four branches (raw materials, construction, industrial production, transport).
  - **Bonds**: at most 3, total ≤ 10 % of company value, interest paid quarterly ([Banking](https://www.magicgameworld.com/railway-empire-2-banking-and-share-market/)).
- **Concessions** (regional build rights): shaded white on the map = buyable, at a minimum of 150,000. Red = you can buy businesses there but not build. Rivals can trigger **auctions** in areas you don't hold ([Concession](https://www.magicgameworld.com/railway-empire-2-how-to-buy-a-concession/)).
- **Research by era**: innovation points come in at **60 per month in the first 10 years of an era, 30 per month after** (player report). Rich players can buy techs at **auction**. One player had everything researched by 1836-37 when starting in 1830 ([Steam discussion](https://steamcommunity.com/app/1644320/discussions/1/3807278624251800587)). The patch notes confirm that research bonuses apply "only to engines of the same decade" ([Update 1.3](https://www.kalypsomedia.com/post/railway-empire-2-update-1-3)).

### 3.2 Operating mechanics (numbers)
- **Revenue** ([guide](https://www.magicgameworld.com/railway-empire-2-transportation-costs-and-revenues/)):
  - freight earns **2,000 per wagon**, independent of distance and speed;
  - a passenger car holds 40, and the fare depends on straight-line distance (paid per leg when changing trains);
  - a mail car holds 40 bags.
- **Special wagons** each give +20 % to their goods: dining car (passengers), refrigerator car (food), mail car (mail). They take wagon slots; the maximum is 8 wagons ([guide via search](https://www.magicgameworld.com/?p=128165)).
- **Loading**: Automatic (default, driven by demand), Express, Freight or Manual. A **minimum load** slider per line; the guide's example is 8 units of sugar ([guide](https://www.magicgameworld.com/railway-empire-2-choosing-freight-and-setting-minimum-loads/)).
- **Maintenance and supplies**:
  - service at about 60 % condition;
  - maintenance depots are station extensions;
  - supply towers for water (daily), sand (gradients) and oil (distance);
  - maintenance posts cost daily upkeep ([guide](https://www.magicgameworld.com/railway-empire-2-how-to-repair-and-maintain-trains/)).
- **Personnel as budgets, not individuals** ([guide](https://www.magicgameworld.com/railway-empire-2-guide-to-personnel-and-tasks/)):
  - Quality of Work comes from working-time and training spend;
  - Filled Jobs comes from salaries, welfare and recruitment spend;
  - each train needs 3 engineers (maintenance), 3 heaters (top speed), 4 conductors (popularity, so ticket price; passenger trains) and 5 security guards (freight and mail revenue);
  - **every 100 days** you can pay a bonus of about a month's salary for **+10 % welfare**.

### 3.3 UI: what is where
From [Update 1.3 notes](https://www.kalypsomedia.com/post/railway-empire-2-update-1-3) and the [Games Asylum review](https://www.gamesasylum.com/2023/05/25/railway-empire-2-review/):
- **A left "information interface" panel** shows one of: the **list of all rail lines**, the **list of cities** (with citizen counts), **flow of goods** (now including paths through warehouses), or **additional overlays**. Each has a hotkey.
- **An "i" icon top-left** opens the overlay menu. New overlays include "**Track utilization**": tracks coloured "from white (low usage) to dark red (high usage)".
- **Track construction mode** paints special parts: gridirons orange and white dashes, tunnels purple and white, bridges blue and white.
- **While creating or editing a line**, arrows point between consecutive stops.
- **The rail-line window shows warnings with reasons on hover**, e.g. "Unable to load prioritized good. Unable to load [resource] in [station]: No demand for this good".
- **Company menu** with metrics such as "Connected citizens". A "**Transfer to all**" button copies one depot's settings to every depot.
- **Consoles**: a radial wheel "to intuitively cycle through options".
- **Route setup flow**: "Set Up Rail Line" → click start station → click destination → choose locomotive → confirm. If you only pick two stations, the default is platform 1, and players learn to assign platforms in "Edit Station" ([guide via search](https://www.magicgameworld.com/railway-empire-2-route-guide-how-to-set-up-rail-lines-without-bottlenecks/)).

### 3.4 Praise and complaints
From the [Games Asylum review](https://www.gamesasylum.com/2023/05/25/railway-empire-2-review/):
- **Learning curve**: "it's highly recommended to play the hour-long tutorial first… fully voice-acted… It isn't a step-by-step guide, however, leading to head-scratching at times." After the tutorial "you aren't ushered towards a single mode".
- **Scenarios**: "The scenarios and campaign chapters are oddly hard to differentiate… **there are no reminders of looming deadlines**, it's up to you to manage and keep track of time."
- **Alerts**: "If something is wrong with your planning, an alert will appear – although **a resolution isn't always obvious**."
- **Praise**: simplified track placement ("signals taken care of automatically and parallel tracks placed effortlessly"), and the "re-examine or scrap" loop: a line can be scrapped "and all costs are refunded".

### «Para Tenfe»
- **Leaders with traits.** Pick 1 of 6 presidentes de Tenfe at the start, each with 1 strength and 1 weakness: «Tecnócrata: obras −10 %, apoyo sindical −10»; «Ex-alcalde: alcaldes +100 de inicio, Hacienda desconfía». This adds variety for almost no cost.
- **Tasks with date and speed points.** Each stage objective already has a deadline. Add a visible countdown chip («quedan 3 semanas», red at ≤3; we already do this). Score more for finishing early. Add **optional random tasks** («Encargo del Ministerio: 90 % de puntualidad en el Sur 8 semanas seguidas → +2 ★») so free-play weeks always have a short goal.
- **Personnel as budget sliders.** Our cuadrillas already work this way. The RE2 trick worth copying is the **periodic welfare bonus** («Paga extra: cada 13 semanas, 1 mes de nómina → +10 ánimo sindical»), a natural «Pacto» with the unions.
- **Warnings with the reason on hover**, always with a verb: «No hay demanda Madrid–Soria a este precio → bajar billete».
- **Rival takeover tension** in a softened form: rival private operators (Lowgo, Iryo-parody) buy **cuota por corredor**, not shares. If they pass 50 % of a corridor, the Ministry asks you to cede it. This is optional, toggled like RE2's "disable mergers".

---

## 4. Mini Metro (2015) and Mini Motorways (2019), Dinosaur Polo Club

Steam: Mini Metro **Overwhelmingly Positive**, 95 % of 7,105 ([Steam](https://store.steampowered.com/app/287980/)). Mini Motorways **Overwhelmingly Positive**, 96 % of 16,084 ([Steam](https://store.steampowered.com/app/1127500/)).

### 4.1 Minimal UI
- **There are almost no panels**:
  - the week clock sits **top-right**, and a week ends when it rolls to Monday ([Gigazine](https://gigazine.net/gsc_news/en/20140306-mini-metro));
  - owned items (lines, locomotives, carriages, tunnels, interchanges) sit as **icons on the left edge**, "the number of icons indicates the maximum number of installed items" ([Tuni Playlab review](https://blogs.tuni.fi/playlab/game-reviews/mini-metro-bite-sized-puzzle-strategy-game-wrapped-in-a-minimalistic-atmosphere-of-transit-craze/), via search);
  - an unconnected new station **flashes "!"**;
  - an overcrowded station fills a **circular timer** around itself.
- Passengers are drawn as the shape of their destination. Lines use the real city's colours. The map follows Harry Beck's schematic style ([Station](https://mini-metro.fandom.com/wiki/Station), [Line](https://mini-metro.fandom.com/wiki/Line), [Steam](https://store.steampowered.com/app/287980/)).
- Wikipedia: "praise for its intuitive interface, simple gameplay, and minimalist approach". The development constraints were deliberate: minimal production art, no hand-built levels, procedural generation ([Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))).
- IGN, quoted on Steam: "Mini Metro's clean, stylish interface encourages me over and over again to make the trains run on time".

### 4.2 Core numbers
From [Station](https://mini-metro.fandom.com/wiki/Station), [Normal](https://mini-metro.fandom.com/wiki/Normal), [Locomotive](https://mini-metro.fandom.com/wiki/Locomotive), [Carriage](https://mini-metro.fandom.com/wiki/Carriage), [Line](https://mini-metro.fandom.com/wiki/Line) and [Interchange](https://mini-metro.fandom.com/wiki/Interchange):
- **Stations**: a station holds 6 (5 to 8 depending on the map) before its timer starts. The circle drains back at the same rate once relieved, and "the circle will not increase whenever a train is at the station". **Circle stations can turn into other shapes**, "forcing the player to re-evaluate their network".
- **Trains**: a locomotive carries 6 (4 on Cairo and Mumbai), and each carriage adds 6. At most 4 locomotives per line and at most 7 lines (fewer on some maps).
- **Interchange**: 18 capacity and much faster transfers. It cannot be moved or removed.

### 4.3 The weekly reward (the key loop)
From [Budget Increase](https://mini-metro.fandom.com/wiki/Budget_Increase):
- "Each upgrade grants an extra **locomotive**, as well as one additional random choice of **two** out of the possible upgrades: an additional line (up to the map max), a carriage, two more tunnels or bridges, an interchange."
- **Map twists on the same loop**:
  - New York has a lower chance of tunnels;
  - Berlin grants only 1 tunnel at a time;
  - Hong Kong gives 2 locomotives;
  - **Osaka offers "two regular locomotives *or* one high-speed Shinkansen"**;
  - Mumbai gives 2 carriages but only 1 bridge.
- In **Endless** mode the budget increase is earned by filling an efficiency circle (deliveries fill it, queues drain it) instead of by time ([Endless](https://mini-metro.fandom.com/wiki/Endless)).
- Modes ([Extreme](https://mini-metro.fandom.com/wiki/Extreme), [Creative](https://mini-metro.fandom.com/wiki/Creative)):
  - **Normal**;
  - **Extreme**: assets cannot be moved once placed. It is unlocked per map by the harder achievement;
  - **Endless**;
  - **Creative** (2018).
  
  **New maps unlock by achievements on unlocked maps.**

### 4.4 Mini Motorways: the same loop, plus modifiers
- **The weekly loop**: every Sunday you choose between **two sets of upgrades plus road tiles**. Each upgrade arrives with tiles: bridge or tunnel +20, roundabout +20, traffic light +20, motorway +10 tiles, and at most 9 motorways ([Upgrades](https://mini-motorways.fandom.com/wiki/Upgrades), [Mini Motorways](https://mini-motorways.fandom.com/wiki/Mini_Motorways)).
- **Map challenges**: each map offers 1 to 3 challenges after **1,000 trips**, built from modifiers ([Maps](https://mini-motorways.fandom.com/wiki/Maps)).
- **Daily and Weekly Challenges** with rule modifiers ([Modifiers](https://mini-motorways.fandom.com/wiki/Modifiers)). Selected examples:
  - "Rush Hour – all destinations are much busier";
  - "Buy One Get One Free – all weekly choice upgrades are doubled";
  - "**Mini Mysteries – weekly choices are now a mystery**";
  - "Less is More – half the road tiles each week";
  - "All Up Front – start with 150 road tiles, no further offered";
  - "Only One Of Everything";
  - "Bridge to Bankruptcy – bridges cost double tiles";
  - "Wood You Kindly – more trees and they can't be destroyed";
  - "Extra for Experts".
- Expert mode: "permanent roads and limited upgrades" ([Steam](https://store.steampowered.com/app/1127500/)).

### «Para Tenfe»
- **«Consejo del lunes»**, the weekly reward. Every Monday (or every 4 weeks, to avoid fatigue in a 416-week game) the player gets **1 fixed item** (e.g. «+1 turno de maquinistas») and **chooses 1 of 2 cards** drawn from a pool. Examples:
  - «Licitación exprés: −30 % en la próxima obra de catenaria»;
  - «Préstamo de 2 trenes de Cercanías 8 semanas»;
  - «Rueda de prensa: +5 apoyo viajeros»;
  - «Partida europea: +20 % a obras de ancho estándar»;
  - «Cuadrilla del ADIF: +1 cuadrilla 13 semanas».
  
  Show both cards side by side with an exact effect line that the engine applies. **This is the single biggest "fun per line of code" import.**
- **Map twists by region or seed.** The deck odds depend on the game's setup, like Osaka and Mumbai: «Ministro tacaño: nunca salen cartas de dinero, salen 2 cartas de cuadrilla».
- **Modifiers as the setup "salt".** At game start draw 1 to 3 named modifiers, or pick them in a «Partida personalizada». Examples:
  - «Ministerio en funciones: no hay pactos con el Ministro las primeras 26 semanas»;
  - «Verano tórrido: −10 vía por semana en julio y agosto en el Sur»;
  - «Bruselas generosa: subvenciones ×1,5»;
  - «Misterio de Moncloa: las cartas del lunes salen boca abajo».
  
  Give **daily or weekly challenge seeds** a fixed seed plus modifiers so friends can compare scores.
- **Minimal HUD rule**: time top-right, owned assets as countable icons on one edge, and problems drawn **on the map object itself** (a timer ring around a station = a corridor in trouble).

---

## 5. Rail Route (bitrich, 2021)

Steam: **Very Positive**, 84 % of 1,135. Recent: 70 % of 30 positive ([Steam](https://store.steampowered.com/app/1124180/)).

- **Modes** ([Steam](https://store.steampowered.com/app/1124180/)):
  - **Endless**: build from scratch;
  - **Timetable**: "puzzle-like challenges with pre-set maps and schedules";
  - **Rush Hour**: "wave after wave of intense dispatching".
  
  2,000+ community maps and a level editor.
- **Top bar**: "money, score, green tokens and red tokens". **Clicking a token opens its upgrade page** ([Steam guide](https://steamah.com/rail-route-red-tokens-guide-from-beginner-to-automated/)).
- **Upgrade system (Update 16)**: "gone are the days of the tree-like structure! Upgrades are now split into two categories: green and red". Green covers Commuter and InterCity trains; red covers Regional, Urban and one-off freights. "Each category now boasts three tiers". **Tiers unlock by throughput**: "handle enough traffic within an in-game hour… dispatch 10 green trains on time to unlock tier 2". Endless maps award **stars** for throughput (patch notes quoted via search).
- **Contracts**: contracts appear as offers you accept or dismiss (right-click). Recurring hourly contracts pay tokens; e.g. a regional round trip pays 2 red points. One-off Freight and InterCity contracts "block platforms for a long time" or need "fast and on-time" running ([devlog 0.10](https://bitrich.itch.io/railroute/devlog/188792/a-train-dispatcher-simulator-update-010)).
  - The first 3 red tokens come from running enough green trains per hour, then "you can only pick one [Regional or Freight] for the first 3-5 red trains, so pick wisely" ([guide](https://steamah.com/rail-route-red-tokens-guide-from-beginner-to-automated/)).
  - Offices generate contracts and can be sold for a 100 % refund. One minute before a departure, the platform shows "unassigned train due to depart" ([same guide](https://steamah.com/rail-route-red-tokens-guide-from-beginner-to-automated/)).
- **Track speeds**: "You can now build all kind of tracks with speeds you have researched. **Slow tracks are cheaper** so you should be able to expand faster" ([devlog 0.10](https://bitrich.itch.io/railroute/devlog/188792/a-train-dispatcher-simulator-update-010)).
- **Complaint**: changing a layout forces you to wait for new contracts, "waiting an hour or more real-time for these 40 contracts is a real pain" (Steam discussion via search).

### «Para Tenfe»
- **Two-colour progression tokens**, cheap and clear:
  - «★ Servicio» (puntualidad, viajeros), earned by **on-time weeks** on each corridor;
  - «★ Red» (obras terminadas, km electrificados).
  
  Each colour unlocks 3 tiers of tech. The rule that unlocks them is printed on the button: «Tier 2: 4 corredores ≥85 % puntualidad la misma semana».
- **Clickable top-bar resources** that open their page (we already do this; keep it).
- **Contract offers with accept or dismiss** in one click, for Ayuntamientos' petitions: «Cáceres pide 2 frecuencias más 26 semanas → +100 alcalde, +ingresos».

---

## 6. NIMBY Rails (Weird and Wry, 2021)

Steam: **Very Positive**, 88 % of 1,274 ([Steam](https://store.steampowered.com/app/1134710/)).

- **Real-world map**. Tracks must respect real streets ("Too many crossings may make your designs not viable"). Track kinds: viaduct, ground, tram and tunnel, "with a variety of trade-offs on the environment, train speed, and your company wallet" ([Steam](https://store.steampowered.com/app/1134710/), [retrospective](https://carloscarrasco.com/nimby-rails-retrospective/)).
- **"Only as complex as you want it"**: stations come with **automatic double track and automatic entrance and exit signalling**, and stations link "in a couple clicks with automatic double tracks". Disable the aids to control every signal ([Steam](https://store.steampowered.com/app/1134710/)).
- **Demand**: simulated per passenger, by time of day and day of week, with time zones. "Passengers will continuously rate their experience based on the trip time and the fares you impose on them, with effects on the demand of the stations they visit" ([Steam](https://store.steampowered.com/app/1134710/)).
- **Timetables (1.5 design)** ([devblog 2022-08](https://carloscarrasco.com/page/36/)):
  - each line stop has a leg speed and a minimum stop time, which together give relative timings;
  - trains run "runs" (a start time plus a line) that must cover 100 % of the week;
  - **three order modes**:
    - manual orders (start time + line, with copy, paste and bulk time shift);
    - **auto-copy** another train's orders with a time shift;
    - **"auto run lines"**: "In two clicks… your trains running an interval line… The game will auto adapt the interval when you buy or sell trains for the line".
  
  The design lesson the author draws: players should never edit hundreds of runs by hand, so the game asks for a few inputs and generates the rest.
- **Compatibility** via generic **tags** that can go on any object. Balises can match train tags with an "any tag matches" check ([devblog 2021-10](https://carloscarrasco.com/page/46/), via search).
- **Reception**: Rock Paper Shotgun ("NIMBY Rails has made me a train person", 20 Jul 2021) praised the free real-world premise and simple gameplay but noted "deficiencies in the game's controls and text interface" (Wikipedia summary via search).

### «Para Tenfe»
- **Frequency as one number with auto-spacing.** In the Servicio planner, the player sets «trenes/día» and the game derives «cada 2 h 10 min». Show it the way NIMBY's auto run lines does (interval recalculated when a train is added). Never ask for a timetable.
- **Fare and trip time drive demand in a visible way.** In the corridor card, show «Tiempo de viaje 3 h 40 · Precio 38 € → valoración del viajero 6,1/10 → demanda −8 %». It is a single formula, exposed.
- **Tags as the compatibility engine.** Model gauge and traction as tags on sections and trains (`ib`, `std`, `var`, `3kV`, `25kV`, `diesel`). A train can enter a section if every required tag group matches. It is simple to code and simple to explain.

---

## 7. Sid Meier's Railroads! (Firaxis, 2006)

Steam: **Mostly Positive**, 71 % of 1,829 ([Steam](https://store.steampowered.com/app/7600/)).

- **Streamlined building**: "as easy as clicking and dragging, and bridges, tunnels, railroad stations and switches sprout up automatically where they're needed" (summary via search). Signalling and routing are automatic once track is laid (TechEnclave via search).
- **Business layer** ([Macworld review](https://www.macworld.com/article/219781/review-sid-meiers-railroads-is-a-fun-and-challenging-look-at-a-fascinating-industry.html), [Pocket Gamer](https://www.pocketgamer.com/sid-meiers-railroads/review), [App Store](https://apps.apple.com/app/id1449719281)):
  - you invest in **industries along your lines** ("Buy the power plant that needs oil from the nearby refinery… make money both transporting raw materials and using them");
  - you bid at **auctions for patents** that cut costs ("a special device that reduces the cost of tunnels") and for **industries**;
  - **stock**: issue it, buy rivals' stock, and **buy out the competition**;
  - rivals are named robber barons (e.g. "Diamond" Jim Fisk), **0 to 3 AI**, with customisable difficulty;
  - **15 or 16 scenarios**, "each with a distinctive map and unique objectives", including a Santa's workshop scenario;
  - a "**train table mode**" just for laying track.
  
  A ten-year exclusive patent licence is reported in one summary (unverified).
- **Complaints**:
  - "the business layer is too prominent and saps some of the joy out of running your railroad" (App Store user review);
  - launch-era routing complaints (AnandTech forum via search);
  - "a refreshing lack of micromanagement" versus "simplistic economics" (GamesRadar verdict via search).

### «Para Tenfe»
- **Patent auctions against rivals.** Every ~26 weeks one **patente** goes to auction: «Cambiador de ancho automático Tardo: −40 % coste de cambiadores», «Pantógrafo bitensión KAFKA». Lowgo and Iryo-parody bid too. Winning gives an exclusive window, and losing gives the rival a real, visible effect on its corridor share.
- **Keep the business layer secondary.** The core verbs stay rail verbs (obras, trenes, servicio). Money games (acciones, sobres) live in Cloacas and Pactos and never block the core loop.

---

## 8. Cross-cutting analysis

### 8.1 Showing compatibility: the patterns that work

| Pattern | Who | Strength | Weakness |
|---|---|---|---|
| Context filter: buy from a depot or line, list only what can run there | OpenTTD, TF2 (depot) | No wrong purchases; the title states the context | Hides options; players don't learn *why* |
| Info line "Rail types: …" on each model | OpenTTD | Explicit and compact | Text only |
| Category filters by traction (Steam/Electric/Diesel × loco/MU) | TF2 | Fast scanning | No link to your actual network |
| Red/blue section preview when upgrading | TF2 (catenary, track type) | Shows exactly what is missing and where | Only while the tool is active |
| Warning inbox entry "No electric path found" | TF2 | Catches it after the fact | Late; doesn't say where the gap is |
| Status "No power" on the stuck train | OpenTTD | Pinpoints the victim | Not the cause |
| Track speed layer, red→blue with numbers in boxes | TF2 | Bottlenecks at a glance | Separate layer |
| Construction highlights (bridges blue, tunnels purple, gridirons orange) | RE2 | Lets you read special parts while building | Construction-only |
| Generic tags with "any tag matches" | NIMBY | Flexible engine | Opaque for players if not visualised |

**Recommended for Tenfe (combine four):**
1. **Chips** on every train and every section, using the same vocabulary: `IB` · `UIC` · `VAR` (ancho) and `3 kV` · `25 kV` · `2T` (bitensión) · `DSL` · `BIMODO` (tracción), plus `vmax`.
2. **Three states** in Trenespop when opened from a corridor:
   - ✓ *Puede circular*: shows the time and the speed bottleneck;
   - ◐ *Puede con cambio*: needs a gauge changer, which exists at X (+12 min);
   - ✗ *No puede*: the first blocking reason plus a link «Ver obra que lo arregla (coste, semanas)».
3. **Route strip** in the corridor card: a horizontal bar of the corridor's sections coloured by the selected train's compatibility (green, amber at a changer, red at a gap). The bar is labelled with km and section names. TF2's red/blue logic is shown *before* buying, not after.
4. **Upgrade preview on the map** during the obra planner (red = needs it, blue = already has it), with total km and cost. This uses the same `workQuote` numbers.

### 8.2 Keeping data-heavy UIs clear
- **Fixed zones by verb.** TF2 puts layers top-left, alerts top-center, money and finances bottom-left, verbs bottom-center and statistics bottom-right. OpenTTD groups its toolbar the same way. Players praise neither game for beauty, but both are learnable because **nothing moves**.
- **One alert inbox, with each alert naming the object and linking to it.** TF2: "possible to select the names on them to get to the places where the problems occured". RE2 adds the **reason on hover**. Games Asylum's complaint ("a resolution isn't always obvious") says: always add the fix verb.
- **List and detail in two panes, with highlight on the map** (TF2 line manager, RE2 left panel). The list is filterable by type and by "**only what's on screen**" (TF2 viewport filter).
- **Sortable tables of 6 to 9 columns** for lines, vehicles, stations and towns (TF2), plus one **traffic-light icon** per row (OpenTTD profit dot). Detail windows use the same 3 to 4 tabs everywhere (Overview / Vehicles / Finances / Charts) and can be pinned.
- **Three-year columns in the finance window** (OpenTTD; TF2 uses 4 periods) with Revenue / Operating / Capital blocks. That is simpler than our current 11-page structure.
- **Layers as one selector** (TF2 dropdown, RE2 "i" menu). Each layer uses one colour ramp with numbers on the map (TF2 speed boxes, RE2 white→dark red utilisation).
- **Help in 3 layers** (TF2): a context help key for the open window, first-use yellow highlights, and tooltips with the hotkey. OpenTTD lets you right-click any button to learn what it does.
- **Minimal HUD as an ideal** (Mini Metro): time in one corner, owned assets as countable icons on one edge, problems drawn on the object itself.
- **What players hate:**
  - windows that cover the map (TF2);
  - late-game overview loss (TF2);
  - invisible electrification gaps (TF2, OpenTTD);
  - no deadline reminders (RE2);
  - alerts without a fix (RE2);
  - "text interface" deficiencies (NIMBY);
  - a business layer that overwhelms the trains (SMR).

### 8.3 What makes each game different (variety generators, from cheap to expensive)

| Generator | Example | Cost for us |
|---|---|---|
| Seed text box + live preview | TF2 map seed, OpenTTD world gen | Very low: our engine already keeps the RNG seed in state |
| Difficulty presets + multiplier sliders | TF2 (loan, interest, investment, maintenance ×), OpenTTD (interest, breakdowns, subsidy multiplier, recessions, disasters) | Low |
| Named rule modifiers | Mini Motorways (~47), Mini Metro map twists | Low; each is a small `if` |
| Leader with traits | RE2 (6 characters) | Low |
| Optional random tasks | RE2 custom game | Medium |
| Rivals with real effects | OpenTTD AIs, RE2 (sabotage, shares), SMR (auctions, buyouts) | Medium to high |
| Era-bound events | OpenTTD disasters by decade, recessions 2-3 per century of 9-12 months | Low |
| Hand-made scenarios with distinct objectives | RE2 (14), SMR (15-16), TF2 campaign (3 bonus tasks each) | High per scenario |
| Community maps | Rail Route (2,000+), Mini Metro workshop | Not applicable |

### 8.4 Short-term reward loops

| Loop | Who | Period | Tenfe version |
|---|---|---|---|
| 1 fixed + choose 1 of 2 | Mini Metro, Mini Motorways | 1 game-week | «Consejo del lunes» (weekly or every 4 weeks) |
| Subsidy race with expiry | OpenTTD | months; reward for 1 year | «Subvención de Bruselas / del Ministerio» with deadline and multiplier |
| Exclusive preview of a new model | OpenTTD | per new vehicle | Malstom, KAFKA and Tardo previews |
| Tasks with deadline and speed score | RE2 | 2-3 game-years | Stage objectives + optional encargos |
| 3 bonus tasks → medals | TF2 campaign | per mission | 3 «retos» per game, from the seed |
| Throughput tiers | Rail Route | per in-game hour | «★ Servicio / ★ Red» tiers |
| Auctions vs rivals | SMR, RE2 | periodic | Patentes and licencias |
| Periodic morale bonus | RE2 (every 100 days, +10 %) | 100 days | «Paga extra» every 13 weeks |
| Growing trophy | TF2 HQ, OpenTTD league titles | continuous | «Sede de Tenfe» + title ladder (Becario → … → Presidente) |

---

## 9. A concrete blueprint for the unified mode (built from the above)

### 9.1 Screen (desktop; it stacks on phones)
- **Top-left: Capas.** One dropdown (Puntualidad, Vía, Viajeros, Catenaria, Ancho, Velocidad, Obras, Territorios). Each layer uses a single colour ramp, plus numbers on sections at high zoom (TF2).
- **Top-center: Avisos.** An icon that turns red, with a count. Each aviso is one line with a linked object and a fix verb (TF2 + RE2).
- **Top-right: week clock and the 3 order dots** (Mini Metro corner), plus the menu.
- **Top bar resources** (left to right): Caja (opens Finanzas) · Trenes · Cuadrillas · Apoyo · ★ Servicio · ★ Red (opens Progreso). Each opens its page (Rail Route).
- **Left edge: Misión.** Stage, objectives with deadline chips, and today's card choice if pending.
- **Right panel: the selected object's card** (corridor, station or town), with tabs Resumen / Trenes / Cuentas / Historia (TF2 detail tabs).
- **Bottom-center: verbs.** Obra · Servicio · Comprar (Trenespop) · Pactos · Cloacas. These are 5, not 11; secondary pages go into a «Más» menu.
- **Bottom ticker: Gaceta headlines**, in OpenTTD headline style, set per category to Full / Resumen / Off.

### 9.2 Trenespop window (opened from a corridor or from Flota)
- **Header**: «Trenes para *Madrid–Badajoz* · IB · sin electrificar · vmax 160» (OpenTTD context caption).
- **Left: filters**:
  - Todos;
  - Tracción (Eléctrico 3 kV / 25 kV / bitensión · Diésel · Bimodo);
  - Ancho (Ibérico · Estándar · Variable);
  - Uso (Cercanías-like · Media distancia · Larga distancia · Alta velocidad);
  - Fabricante (KAFKA, Tardo, Malstom, BCBB, Dörfler);
  - a toggle «Mostrar los que no pueden circular».
- **Center: rows** with photo, name, chips, plazas, vmax, price, delivery, a reliability stars bar and a compatibility state (✓ ◐ ✗). Sort by price, vmax, plazas, fiabilidad, **€/plaza**, or entry year (OpenTTD sorts).
- **Right: detail.**
  - The OpenTTD info block in Spanish: Precio · Peso · vmax · Potencia · Coste anual · Plazas · Año de diseño · Vida útil · Fiabilidad máx. · Anchos · Tensiones.
  - The **route strip** for the chosen corridor.
  - The projected result «Uno más en el Sur: +1.900 viajeros/sem · +14 k€/sem» (we already have this).
- **Footer**: quantity, «Comprar por X €» (1 orden), and a «Solo presupuesto» button that works like OpenTTD's Shift.

### 9.3 Weekly flow
1. **Monday**: Consejo card (1 fixed + choose 1 of 2), if it is due.
2. **Plan 3 orders.** Every planner shows the before → after numbers (already built).
3. **Close the week.** Then show a **one-screen report** with the profit dots per corridor, the avisos and 1 to 3 Gaceta headlines. Our inventory notes that today the weekly report "no se enseña".

### 9.4 Setup screen («Partida nueva»)
- **Semilla**: a text box with a «Aleatoria» button.
- **Presidente**: 1 of 6, each with traits.
- **Dificultad**: Fácil / Normal / Difícil / Infernal. It scales loan, interest, works cost, maintenance and event pressure, as in TF2's sliders.
- **Modificadores**: 0 to 3, drawn or picked (Mini Motorways list style).
- **Rivales**: off / 1 / 2 (Lowgo, Iryo-parody), and «Absorciones» on or off (RE2 "disable mergers").
- **Retos**: 3 bonus tasks drawn from the seed and shown as dark medals that turn gold (TF2).
- **«Reto semanal»**: a fixed seed and fixed modifiers for everyone that week (Mini Motorways).

---

## 10. Sources (all accessed 9 Oct 2026)

**Transport Fever 2**
- Official manual:
  - [User Interface](https://wiki.transportfever2.com/doku.php?id=gamemanual:userinterface)
  - [Streets and Tracks](https://wiki.transportfever2.com/doku.php?id=gamemanual:streetstracks)
  - [Lines and Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:linesvehicles)
  - [Statistics and Data Layers](https://wiki.transportfever2.com/doku.php?id=gamemanual:statisticsdatalayers)
  - [Company and Finances](https://wiki.transportfever2.com/doku.php?id=gamemanual:companyandfinances)
  - [Free Game](https://wiki.transportfever2.com/doku.php?id=gamemanual:freegame)
  - [Settings](https://wiki.transportfever2.com/doku.php?id=gamemanual:settings)
  - [Vehicles](https://wiki.transportfever2.com/doku.php?id=gamemanual:vehicles)
  - [Ingame Help](https://wiki.transportfever2.com/doku.php?id=gamemanual:ingamehelp)
  - [Campaign](https://wiki.transportfever2.com/doku.php?id=gamemanual:campaign)
  - [Tips and Tricks](https://wiki.transportfever2.com/doku.php?id=gamemanual:tipstricks)
- [Steam store](https://store.steampowered.com/app/1066780/)
- Steam discussions: [electric trains](https://steamcommunity.com/app/1066780/discussions/0/2639605881178624707) and [window size](https://steamcommunity.com/app/1066780/discussions/0/3963662301883409496)
- [TheSixthAxis review](https://www.thesixthaxis.com/2020/01/13/transport-fever-2-review/)

**OpenTTD**
- Wiki:
  - [Types of railway](https://wiki.openttd.org/en/Manual/Base%20Set/Types%20of%20railway)
  - [Electrified railways](https://wiki.openttd.org/en/Manual/Base%20Set/Electrified%20railways)
  - [Buying trains](https://wiki.openttd.org/en/Manual/Buying%20trains)
  - [Convert rail](https://wiki.openttd.org/en/Manual/Convert%20rail)
  - [Game interface](https://wiki.openttd.org/en/Manual/Game%20interface)
  - [Subsidy](https://wiki.openttd.org/en/Manual/Subsidy)
  - [Towns](https://wiki.openttd.org/en/Manual/Towns)
  - [Economy](https://wiki.openttd.org/en/Manual/Economy)
  - [AI settings](https://wiki.openttd.org/en/Manual/AI%20settings)
  - [Disasters](https://wiki.openttd.org/en/Manual/Disasters)
- Source on GitHub (master):
  - [`src/build_vehicle_gui.cpp`](https://github.com/OpenTTD/OpenTTD/blob/master/src/build_vehicle_gui.cpp)
  - [`src/vehicle_gui.cpp`](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_gui.cpp)
  - [`src/lang/english.txt`](https://github.com/OpenTTD/OpenTTD/blob/master/src/lang/english.txt)
  - [`src/town_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_type.h)
  - [`src/town_cmd.cpp`](https://github.com/OpenTTD/OpenTTD/blob/master/src/town_cmd.cpp)
  - [`src/vehicle_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/vehicle_type.h)
  - [`src/news_type.h`](https://github.com/OpenTTD/OpenTTD/blob/master/src/news_type.h)

**Railway Empire 2**
- [Steam store](https://store.steampowered.com/app/1644320/)
- Kalypso: [product page](https://www.kalypsomedia.com/eu/railway-empire-2) and [Update 1.3](https://www.kalypsomedia.com/post/railway-empire-2-update-1-3)
- [Games Asylum review](https://www.gamesasylum.com/2023/05/25/railway-empire-2-review/)
- Magic Game World guides:
  - [personnel and tasks](https://www.magicgameworld.com/railway-empire-2-guide-to-personnel-and-tasks/)
  - [banking and shares](https://www.magicgameworld.com/railway-empire-2-banking-and-share-market/)
  - [concessions](https://www.magicgameworld.com/railway-empire-2-how-to-buy-a-concession/)
  - [costs and revenues](https://www.magicgameworld.com/railway-empire-2-transportation-costs-and-revenues/)
  - [maintenance](https://www.magicgameworld.com/railway-empire-2-how-to-repair-and-maintain-trains/)
  - [freight and minimum loads](https://www.magicgameworld.com/railway-empire-2-choosing-freight-and-setting-minimum-loads/)
  - [sabotage](https://www.magicgameworld.com/railway-empire-2-sabotage/)
  - [tips](https://www.magicgameworld.com/railway-empire-2-18-essential-tips-and-tricks-for-beginners/)
- [Steam discussion: innovation points](https://steamcommunity.com/app/1644320/discussions/1/3807278624251800587)

**Mini Metro and Mini Motorways**
- Mini Metro wiki:
  - [Budget Increase](https://mini-metro.fandom.com/wiki/Budget_Increase)
  - [Normal](https://mini-metro.fandom.com/wiki/Normal)
  - [Endless](https://mini-metro.fandom.com/wiki/Endless)
  - [Extreme](https://mini-metro.fandom.com/wiki/Extreme)
  - [Creative](https://mini-metro.fandom.com/wiki/Creative)
  - [Station](https://mini-metro.fandom.com/wiki/Station)
  - [Line](https://mini-metro.fandom.com/wiki/Line)
  - [Locomotive](https://mini-metro.fandom.com/wiki/Locomotive)
  - [Carriage](https://mini-metro.fandom.com/wiki/Carriage)
  - [Interchange](https://mini-metro.fandom.com/wiki/Interchange)
- [Mini Metro on Wikipedia](https://en.wikipedia.org/wiki/Mini_Metro_(video_game))
- Steam stores: [Mini Metro](https://store.steampowered.com/app/287980/) and [Mini Motorways](https://store.steampowered.com/app/1127500/)
- Mini Motorways wiki:
  - [Modifiers](https://mini-motorways.fandom.com/wiki/Modifiers)
  - [Maps](https://mini-motorways.fandom.com/wiki/Maps)
  - [Upgrades](https://mini-motorways.fandom.com/wiki/Upgrades)
  - [Mini Motorways](https://mini-motorways.fandom.com/wiki/Mini_Motorways)
- Mini Metro HUD notes: [Gigazine](https://gigazine.net/gsc_news/en/20140306-mini-metro) and [Tuni Playlab](https://blogs.tuni.fi/playlab/game-reviews/mini-metro-bite-sized-puzzle-strategy-game-wrapped-in-a-minimalistic-atmosphere-of-transit-craze/)

**Rail Route**
- [Steam store](https://store.steampowered.com/app/1124180/)
- [itch devlog 0.10](https://bitrich.itch.io/railroute/devlog/188792/a-train-dispatcher-simulator-update-010)
- [Steam guide: red tokens](https://steamah.com/rail-route-red-tokens-guide-from-beginner-to-automated/)
- Update 16 patch notes, quoted via search

**NIMBY Rails**
- [Steam store](https://store.steampowered.com/app/1134710/)
- Devblog: [2022-08](https://carloscarrasco.com/page/36/) and [2021-10](https://carloscarrasco.com/page/46/)
- [Development retrospective](https://carloscarrasco.com/nimby-rails-retrospective/)
- Rock Paper Shotgun review, via the Wikipedia summary

**Sid Meier's Railroads!**
- [Steam store](https://store.steampowered.com/app/7600/)
- [Macworld review](https://www.macworld.com/article/219781/review-sid-meiers-railroads-is-a-fun-and-challenging-look-at-a-fascinating-industry.html)
- [Pocket Gamer review](https://www.pocketgamer.com/sid-meiers-railroads/review)
- [App Store listing and user reviews](https://apps.apple.com/app/id1449719281)
