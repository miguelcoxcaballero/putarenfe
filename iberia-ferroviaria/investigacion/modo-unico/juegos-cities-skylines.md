# Cities: Skylines (CS1, 2015) and Cities: Skylines II (CS2, 2023): progression, feedback, replayability and UI structure

Research for **«Rescate de Tenfe» / Iberia Ferroviaria**, the unified single mode.
Both games are by Colossal Order and published by Paradox. Development of CS2 moved to Iceflake in 2025–26.
Method: primary sources first. These are the CS1 PDF user manual, official Steam dev diaries and patch notes (pulled through Steam's news API), the official dev-diary screenshots (which I opened and read), the Steam achievement pages with live completion rates, and 1,200 of the most helpful Steam reviews (600 per game, pulled through Steam's review API). Community wiki pages and press guides fill gaps and are flagged when numbers come only from them.
cs2.paradoxwikis.com and skylines.paradoxwikis.com sit behind a bot challenge from this environment, so CS2 wiki figures are quoted through search-result summaries and marked as such.

---

## 0. TL;DR: the 15 things that matter for us

1. **Progression is a visible ladder of named ranks**, each with a rewards card. CS1 has 14 milestones from Start to Megalopolis, gated by population: 500, 1,000, 1,300 … 80,000. CS2 has 20 milestones gated by XP: 750, 2,500, 4,800, 8,300, 13,600, 21,300 … 46,700 (M8) … 89,700 (M10). Every milestone pays **money + development points + expansion permits + a raised loan cap**, and unlocks named things.
2. **CS2 turned "what unlocks next" into a choice.** Milestones hand out Development Points (232 in total; 228 buy everything). You spend them in **one tree per service**, in any order. Reviewers call this the main source of "every city is different". CS1's fixed unlock order "resulted in similarly built cities" (CO's own words).
3. **XP must not be farmable.** The most-upvoted negative CS2 review (6,324 votes) reached milestone 20 with about 50 inhabitants by repeatedly placing and bulldozing a building. Lesson: reward lasting results, not clicks.
4. **Every problem has three layers**: an icon over the thing on the map, a line in the selected-object panel that states **cause and fix**, and an info-view layer that shows where it happens across the city. CS2's "High rent" panel line reads: *"The building occupants have trouble paying the rent. A higher zone density or different zoning might be needed."*
5. **Info views open themselves.** In CS2, opening the Electricity build menu turns on the electricity info view, and starting to zone turns on that zone's suitability view. The map greys out and only the relevant layer is coloured, with a legend of checkboxes.
6. **Chirper is the satirical feedback channel, and it is only credible when it is tied to real state.** CS2 chirps "relate to actual events", and **likes show how important an issue is**. Players still find it noisy. GameStar told readers to turn the pop-ups off and **listen to the radio instead, whose presenters cover "actually important topics … if there is nothing to report, nothing is said"** (my translation). That is our coherence rule.
7. **Demand bars are the main "what do I do next" signal**: CS1's green/blue/yellow RCI bars and CS2's four RCIO bars at the bottom left. The CS1 wiki warns that the bars do not mean what players think. **Label honestly.**
8. **Hovering the happiness indicator lists its pros and cons.** The same hover-for-breakdown pattern appears on districts, households and companies.
9. **Lines are managed in a table plus a per-line panel.** The table (Transportation Overview) has columns for name, length, stops, vehicles, passengers and usage %. The panel has a ticket-price slider, an **assigned-vehicles slider** (e.g. 4/14) tied to the depot's fleet, a day/night/both schedule, a vehicle model dropdown and a schematic of the line. Usage near 100% means "add vehicles".
10. **Money panels use one three-column pattern**: chart or list, then detail, then a plain-language explanation pane. The service budget slider runs **50–150%**, and the fee slider shows the **predicted effect before you commit** (in one example: water use −11%, company efficiency −11%, happiness −2).
11. **Policies are toggles, sometimes with a slider.** Each states its effect and its drawback or cost per unit (CS1: "₡5/week/building"). There are city-wide policies and district policies. CS2 shipped only 7 district and 5 city policies, and players asked for more.
12. **Replayability comes from**:
    - map choice, with resources, connections and buildable % shown up front;
    - the order of development-tree choices;
    - CS1 scenarios with explicit win/lose conditions;
    - built-in "mods": Unlimited Money, Unlock All, Hard Mode (+25% construction, +25% upkeep, reduced demand), Unlimited Oil & Ore and Unlimited Soil, all of which disable achievements;
    - 135 achievements in CS1 (44 in CS2), many of them goals or satirical (e.g. "Unpopular Mayor": reach 15% happiness);
    - huge modding: 372,593 Steam Workshop items for CS1 today.
13. **Progressive disclosure**:
    - all build categories are visible from the start **with padlocks**;
    - newly unlocked features get a **green dot**;
    - the first time you open a panel, its tutorial plays;
    - **tabs inside panels unlock by milestone** (CS2 Economy: Taxes and Services at M1, Production at M2);
    - an Advisor ("?" at the top right) archives every tutorial in 5 groups;
    - since 2026, an Encyclopedia with search.
14. **Fixed screen zones.** Both games keep the same screen geography:
    - top-left: overlays/info views;
    - top-right: help and options;
    - right edge: feeds (Chirper, followed people, event journal, radio);
    - bottom: one toolbar — progress and demand on the left, build categories in the middle, management panels and the core numbers (money, population, happiness, time) on the right or in a second row.
    Players "always know where things are" because each zone has one job.
15. **Weak spots to avoid**:
    - "opaque UI feedback" and "the UI needs more obvious indicators of what's going on with underlying systems" (CS2 review, 4,404 votes);
    - the economy was "too easy, 100M in the bank" until Economy 2.0 removed subsidies;
    - one review describes "an animated picture of a city while a spreadsheet crunches numbers that have nothing to do with it". That is the coherence failure we must not repeat.

---

## 1. Sources (primary first)

**CS1 (app 255710)**
- Official user manual (PDF, 2015): https://shared.steamstatic.com/store_item_assets/steam/apps/255710/manuals/CitiesSkylines-UserManual_EN.pdf (also http://cdn.akamai.steamstatic.com/steam/apps/255710/manuals/CitiesSkylines-UserManual_EN.pdf). I read the full text and the annotated UI figure on p.9.
- Skylines fandom wiki, fetched as raw wikitext through its API:
  - Milestone https://skylines.fandom.com/wiki/Milestone
  - Policy https://skylines.fandom.com/wiki/Policy
  - District https://skylines.fandom.com/wiki/District
  - Economy https://skylines.fandom.com/wiki/Economy
  - Chirper https://skylines.fandom.com/wiki/Chirper
  - Zoning (RCI) https://skylines.fandom.com/wiki/Zoning
  - Iconology https://skylines.fandom.com/wiki/Iconology
  - Abandonment https://skylines.fandom.com/wiki/Abandonment
  - Public transport https://skylines.fandom.com/wiki/Public_transport
  - Scenarios https://skylines.fandom.com/wiki/Scenarios
  - Mod https://skylines.fandom.com/wiki/Mod
  - Achievement https://skylines.fandom.com/wiki/Achievement
  - Patch 1.2.0, 1.3.0, 1.6.1-f2 https://skylines.fandom.com/wiki/Patch_1.6.1-f2
- Steam patch notes:
  - Snowfall 1.3.0: https://store.steampowered.com/news/app/255710/view/295353933866368645
  - Campus 1.12.0: https://store.steampowered.com/news/app/255710/view/2905297189262460725
  - Sunset Harbor: https://store.steampowered.com/news/app/255710/view/2984138620240566297
- Steam global achievements: https://steamcommunity.com/stats/255710/achievements/
- Steam Workshop totals: https://steamcommunity.com/workshop/browse/?appid=255710
- Built-in cheats list (press): https://www.ggrecon.com/guides/cities-skylines-cheats-full-list-and-developer-ui/

**CS2 (app 949230): official dev diaries on Steam**
- Game Progression: https://store.steampowered.com/news/app/949230/view/5127964289187608871
- Economy & Production: https://store.steampowered.com/news/app/949230/view/5839532486225503053
- Public & Cargo Transportation: https://store.steampowered.com/news/app/949230/view/5124582150145476163
- City Services Part 1: https://store.steampowered.com/news/app/949230/view/6079346804886311944
- City Services Part 2 (coverage, fees, districts, policies): https://store.steampowered.com/news/app/949230/view/6079346804886314407
- Zones & Signature Buildings: https://store.steampowered.com/news/app/949230/view/5124582150170985485
- Maps & Themes: https://store.steampowered.com/news/app/949230/view/5124584686260772906
- Citizen Simulation & Lifepath (Chirper): https://store.steampowered.com/news/app/949230/view/5141475722341804099
- Behind the Scenes #3 Game Balancing: https://store.steampowered.com/news/app/949230/view/5218041989043074845
- Behind the Scenes #6 Tutorials & Advisor: https://store.steampowered.com/news/app/949230/view/5218041989054007750
- Economy 2.0 Part 1: https://store.steampowered.com/news/app/949230/view/5742731639344621075
- Tile Upkeep Explained: https://store.steampowered.com/news/app/949230/view/5842939267313162544
- Patches: 1.0.14 https://store.steampowered.com/news/app/949230/view/6560117310264427275 · 1.0.15 …/5395937983664680990 · 1.0.19 …/5582843074937166614 · 1.1.0 …/5686430301733123169 · 1.1.5 …/5759622039989983313 · 1.2.5 …/1794102528230870 · 1.5.7 …/1831432155564333 · 1.6.0 …/1835871199312784 · 1.6.2 …/1843481262705048
- City Corner #1 (2026 UI overhaul and Encyclopedia): https://store.steampowered.com/news/app/949230/view/1823191198602576
- City Corner #2 (legacy toggles): …/1824459501607071
- "The Way Forward": …/5762994032390839323
- Official dev-diary screenshots I opened (all from https://clan.akamai.steamstatic.com/images/43753943/…):
  - Progression/Milestones panel `c4646098464f2d1aa03232e7a393f23ec925ac77.png`
  - Milestone popup `4541985f1b3fa6a413b49b588ea5425de9ee11e9.png`
  - Development tree `95f61267ee4e3a91518a65f7fdc634cad49131a4.png`
  - Tutorial balloon `ae9cf872e996388c37b1c76b705638881d020777.png`
  - Task list `aba805d6c1e9720d5d758c0e1855c8eafffa506a.png`
  - Advisor `4f4f1b47ad0834499ec94ae24cbdd1dfb0b6e8d8.png`
  - Transport info view `b839821eeb99e4736a60d62bb91c012b1548f6a0.png`
  - Transportation Overview `c3a7b8ba8c769536826ef69413ad4b02c28b49b6.png`
  - Line panel `8eef141c18bca67677cd96d5cdb8cfcbc1a07309.png`
  - Line tool `6746995f04fe279c9b357414915bcc141f32ef87.png`, `8e15fb9d65f6cf5e4277ddeb3f36f53cda92af8f.png`
  - Building panel "High rent" `8c5ec7111a99bb9a9d03629a700725a29f5b218d.png`
  - Economy Budget tab `c5105ccc546eff907a684d930bac69b15b055a3c.png`
  - Economy Services tab `1992a4e582a05487f179d86a4860ede53447db01.png`
  - District panel `9b661866405b25be13ed995951e9b170f5eff0b1.png`
  - City Information > City Policies `424efa52e5e30e5c55b2a72cb9eebfbe2928c737.png`
  - 2026 UI `3c5e6c3a50979f4296211d616675228d3fc4dbef.png`
- Steam global achievements: https://steamcommunity.com/stats/949230/achievements/

**Press and guides (secondary, used for gaps)**
- GameStar Sonderheft CS2 (PDF): https://download.gamestar.de/public/117700/117787/12_2023_040.pdf (first milestone 750 XP; layout; Chirper vs radio).
- TechRadar review: https://www.techradar.com/gaming/consoles-pc/cities-skylines-2-review-road-to-success
- Gamerant DP table: https://gamerant.com/cities-skylines-2-every-development-tree-and-what-to-buy-first/
- Dexerto milestone unlock list: https://www.dexerto.com/gaming/cities-skylines-2-milestones-explained-all-rewards-2348210/
- GINX policy list: https://www.ginx.tv/en/all-district-policies-listed-explained
- Shacknews keybindings: https://www.shacknews.com/article/137454/pc-buttons-controls-cities-skylines-2
- LadiesGamers CS2 guide: https://ladiesgamers.com/cities-skylines-ii-guide/
- PC Gamer via Yahoo on Chirper/Lifepath: https://tech.yahoo.com/general/articles/chirper-might-actually-useful-keeping-165645592.html
- Netzwelt ("likes" came from a bug): https://www.netzwelt.de/news/221707-cities-skylines-2-entwickler-integrieren-bug-neues-feature.html
- XP thresholds via search summaries of: NamuWiki CS2 Milestone page https://en.namu.wiki/w/%EC%8B%9C%ED%8B%B0%EC%A6%88:%20%EC%8A%A4%EC%B9%B4%EC%9D%B4%EB%9D%BC%EC%9D%B8%20II/%EB%A7%88%EC%9D%BC%EC%8A%A4%ED%86%A4 · TrueAchievements "Calling the Shots" comments https://www.trueachievements.com/a410378/calling-the-shots-achievement · Info views https://cs2.paradoxwikis.com/Info_views

**Player voice**: Steam review API (English, "all", most helpful first). Summary at fetch time:
- **CS1**: *Very Positive*, 119,041 up vs 9,413 down (≈92.7%).
- **CS2**: *Mixed*, 26,037 up vs 19,994 down (≈56.6%).

Individual reviews are quoted below with permalinks.

---

## 2. Progression

### 2.1 CS1 milestones (population-gated)
Source: fandom Milestone page and manual p.19. The page itself warns: "The population requirement is not analogous between each map … may be the result of the buildable area within a map."

| # | Name | Population | Selected unlocks |
|---|---|---|---|
| 0 | Start | 0 | Budget; Electricity, Water; 2/4/6-lane roads; low-density R/C, Industry; wind turbine, coal plant, pumping station |
| 1 | Little Hamlet | 500 | **Taxes, first loan**; Education, Garbage, Healthcare (landfill, elementary school, clinic) |
| 2 | Worthy Village | 1,000 | **+1 map area**; **second loan; Districts; Policies**; district specialization (forestry, agriculture); Fire, Police; level-1 unique buildings; policies Power Usage, Water Usage, Smoke Detectors |
| 3 | Tiny Town | 1,300 | Parks; policies Pet Ban, Smoking Ban, Parks & Recreation, School's Out; high school |
| 4 | Boom Town | 2,400 | **+1 area**; **Public transport** (bus, taxi, tram); highway; ore specialization; policies Recycling, Recreational Use… |
| 5 | Busy Town | 4,600 | **City planning policies**; oil and tourism specializations; Free Public Transport, Heavy Traffic Ban, Old Town, NIMBY; hospital |
| 6 | Big Town | 7,000 | **+1 area**; **taxation policies** (±2% per zone); **high-density zones and offices**; metro, university, incinerator |
| 7 | Small City | 10,000 | Train station, cargo terminal, hydro plant; Highrise Ban, Small Business Enthusiast … |
| 8 | Big City | 16,000 | **+1 area**; crematorium, water treatment |
| 9 | Grand City | 19,000 | **Third loan**; solar plant |
| 10 | Capital City | 32,000 | **+1 area**; harbors (ship) |
| 11 | Colossal City | 40,000 | **+1 area**; nuclear plant, cargo hub |
| 12 | Metropolis | 55,000 | **+1 area**; airport |
| 13 | Megalopolis | 80,000 | **+1 area**; **Monuments**; international airport |

Mechanics and UI:
- The playable map is 5×5 areas (1.92 km each). You own **at most 9** (manual: "a total of nine areas … by the end of the game").
- Manual, Milestones panel: "you can see the requirements and unlocks for the upcoming milestone. Fulfilled milestones can be browsed backwards by pressing the arrow icons … The button will **fill clockwise with green colour** as you get closer to the next milestone's requirements."
- Manual: service panels show "the requirements by clicking or hovering over a menu item". Locked things are visible and explain themselves.
- A player review describes how unlocks also **raise expectations**: "the first milestone will unlock elementary schools and garbage dump **along with the citizen expectations** that kids must have access to early education and that garbage disposal is available. The following milestone will unlock police and firefighter stations, and your citizens will expect you to supply them" ([review, 143 votes](https://steamcommunity.com/profiles/76561198030788488/recommended/255710/)). Each unlock introduces a new need, so the problem set grows with the toolset.
- Criticism from CO itself (Game Progression diary): CS1's single path "Build more residential areas", and transport options always unlocking at the same time, "**resulted in similarly built cities**".

### 2.2 CS2 milestones (XP-gated)
Official diary ("Game Progression"):
- **XP sources.** Passive XP is "awarded **16 times throughout an in-game day** as a result of increases in both Population and Happiness". Active XP is "granted immediately … placing or upgrading a service building, constructing a signature building, or expanding the city's road network".
- **20 milestones**, "from Tiny Village all the way to Megapolis". Each grants "a mix of Monetary rewards, Development Points, and Expansion Permits, as well as access to new City Services, Policies, and Management Options … increased Loan limits, Taxation, and Service Fees". The rewards grow with each milestone.
- Balancing diary: "**XP requirements for milestones increase exponentially** and set the pace of the game". In the early game XP is "balanced to allow you to experiment with all the newly unlocked features before reaching the next milestone … learned and absorbed in good-sized chunks". The designers admit that road building "rewards XP for each segment" and that some buildings "give more XP per Construction Cost", and that they "deliberately allowed that".
- Names: Tiny Village, Small Village, Large Village, **Grand Village**, Tiny Town, Boom Town, Busy Town, **Big Town**, Great Town, Small City, Big City, **Large City**, Huge City, Grand City, Metropolis, **Thriving Metropolis**, Flourishing Metropolis, Expansive Metropolis, Massive Metropolis, **Megalopolis**. Five of them are shown bold as "major" ranks in the panel.

Known XP thresholds and rewards. The sources differ in reliability, and some values may have been rebalanced after launch:

| Milestone | XP needed | Rewards known | Source |
|---|---|---|---|
| 1 Tiny Village | **750** | ₡25,000, +1 DP, +3 permits, loan limit +100k | GameStar PDF ("Für den ersten Meilenstein braucht ihr 750 EP"); reward figures from the NamuWiki summary |
| 2 Small Village | 2,500 | ₡50,000, +2 DP, +4 permits, loan +150k | NamuWiki summary |
| 3 Large Village | 4,800 | +3 DP | NamuWiki summary, Gamerant |
| 4 Grand Village | 8,300 | +4 DP | TrueAchievements comment, Gamerant |
| 5 Tiny Town | 13,600 | +5 DP | TA comment, Gamerant |
| 6 Boom Town | 21,300 | +6 DP | TA comment, Gamerant |
| 8 Big Town | **46,700** | **₡1,900,000, +8 DP, +10 permits; unlocks Loan limit +₡700,000, EU/NA high-density housing, Oil drilling** | **Official dev-diary screenshot** (pre-release build) |
| 10 Small City | 89,700 | +10 DP; unlocks 5th city policy | TA comment, Gamerant |

- **Development points per milestone** (Gamerant): 1, 2, 3 … 15, then 17, 19, 21, 25, 30. Total **232**; buying every node costs **228**.
- **Start money**: ₡500,000 (tutorial screenshot at "Founding").
- **Panel unlocks by milestone** (patch 1.1.5): "Taxes and Services tabs in the Economy panel now unlock at milestone 1 and the Production tab unlocks at milestone 2."
- **Milestone-unlocked features** (Dexerto list):
  - Tiny Village: Map Tiles, City Budget, City Statistics, medium-density row housing, Healthcare/Deathcare and Garbage trees.
  - Small Village: Taxation, Education.
  - Large Village: Service Budgets, Fire, Police.
  - Grand Village: **District tool, Production panel, Policies, natural disasters, Transportation Overview**, bus and taxi.
  - Tiny Town: Communications, Recycling, Speed Bumps…
  - Big Town: high-density housing.
  - Small City: high-density offices, High-Speed Highways, City Promotion.
  - Big City to Megalopolis: loan-limit increases.

**On-screen presentation (official screenshots):**
- **HUD**: the milestone badge sits at the bottom left with the milestone number and name ("7 · Busy Town"). A small orange badge shows **unspent development points** (e.g. "3"). Next to it, the **Map Tiles** button carries a green badge with **available expansion permits** (e.g. "8", "129").
- **Milestone reached**: a centred modal reads "MILESTONE 8 UNLOCKED · BIG TOWN · Congratulations! The city is coming along nicely!". It shows **REWARDS** as three chips (₡1,900,000 / ⬢+8 / ⬢+10) and two buttons: **[PROGRESSION PANEL] [CLOSE]**. This is a one-click route from reward to spending it.
- **Progression panel**: three tabs, **DEVELOPMENT / MILESTONES / ACHIEVEMENTS**.
  - Milestones tab, three columns. Left: a vertical list of all 20 milestones, with completed ones in gold and the 5 major ones in bold. Centre: the selected milestone's **XP bar "34,418 / 46,700 XP"**, reward chips, and the **list of what it unlocks**. Right: an **explanation pane** for the selected unlock (for "Loan limit": what loans are, that the limit grows each milestone, and that interest grows as you approach the limit) plus its status "LOCKED".
  - Development tab: a vertical icon list of 11 service trees on the left. In the centre, the tree is a left-to-right graph of nodes connected by lines, with locked nodes greyed and showing their cost (Transportation: Basic → Train → Tram → Subway; Basic → Water; Basic → **Air (4)** → **International Airport (8)**, **Space Center (8)**). On the right, the selected node's description, an **[UNLOCK 8⬢]** button, the rule "you must first unlock all the previous connected nodes", and an "AVAILABLE DEVELOPMENT POINTS: 3" counter.

### 2.3 Development trees (CS2)
- "When you unlock a new service through a Milestone, you only unlock its basic buildings and features along with its corresponding Development Tree … Each Development Tree is divided into different Tiers … The first Tier … is automatically unlocked."
- "Some services, such as Public Transportation, have multiple Branches … you do not need to purchase everything in a Tier to move on. For example, you can gain access to the International Airport without needing to unlock Water, Tram, or Subway."
- Transport rationale: "In Cities: Skylines each transportation option was unlocked by reaching different population milestones. This resulted in similarly built cities … In Cities: Skylines II … each transportation type is unlocked using Development Points … You can select which types of transportation your city needs."
- Player reaction:
  - Positive: "Development points is a win … you can now select particular buildings or service in the order you want to, **it makes for different playthroughs and options each time**" ([review](https://steamcommunity.com/profiles/76561198031695044/recommended/949230/)). "The game certainly has better progression than CS1, and allows you to choose what service you want to upgrade … **no two games are ever quite the same**" ([review, 172 votes](https://steamcommunity.com/profiles/76561199236822946/recommended/949230/)).
  - UX complaint: "when you go to build a recycling centre it's there in the menu, just locked, **without even a button there to open the UI to unlock it**" ([review](https://steamcommunity.com/profiles/76561198067186572/recommended/949230/)). Locked items need a direct link to where you unlock them.
  - Exploit complaint (most-helpful CS2 review, 6,324 votes): "The progression system is broken, just place a tourist trap and bulldoze it, repeat over and over. Level 20 without doing anything … **you can have a 'Flourishing Metropolis' with 50 people**" ([review](https://steamcommunity.com/profiles/76561197998739866/recommended/949230/)).
- Completion signal (Steam global stats): **"Royal Flush" (reach enough milestones to unlock all city services): 43.7%**. **"The Last Mile Marker" (reach milestone 20): 2.9%**. The middle of the ladder is where players stop.

### 2.4 Unique, signature and monument buildings: goals beyond the ladder
- **CS1 unique buildings** are unlocked by achievements that "range from positive to negative … like from producing a certain amount of Goods to reaching a **Crime Rate of 90%** or more" (manual). The Cathedral needs "**2,000 abandoned buildings** … maintained for four weeks" (fandom Abandonment). You can have one of each, and they boost tourism and land value. **Monuments** need specific unique buildings built **and all 9 areas**. If you bulldoze a required unique building, the monument "becomes unavailable again". Monuments then cover a whole service city-wide (Fusion Power Plant = "free infinite energy").
- **CS2 signature buildings**: "unique, ploppable zoned buildings … Sculptor Mansion having **3 requirements**: reaching a certain Progression Milestone, attaining a specific citizen Happiness level, and having a number of cells zoned with low density residential … **entirely free to build** … one or more positive effects … neighbourhood to city-wide."

---

## 3. Economy: budget, taxes, loans

### 3.1 CS1 ("Economy" button in the bottom bar, manual p.20; fandom Economy)
- **Taxes** per zone type, **default 9%, range 1–29%**. Lower taxes raise happiness and the chance of buildings levelling up. High taxes "can reduce the efficiency of high-tax zones or force the citizens to move out". Each zone's tax slider appears only when that zone unlocks.
- **Service budgets**, one slider per service, default 100%. "Trains with 50% budget will only have 1 train functioning." From After Dark on, there are **separate day and night sliders**.
- **Loans**: three fixed bank offers, unlocked at M1, M2 and M9:

  | Bank | Amount | Term | Interest | Weekly | Total repaid |
  |---|---|---|---|---|---|
  | Silver Sunset Bank | ₡20,000 | 52 wk | 5% | ₡403.85 | ₡21,000 |
  | Global Credit Inc. | ₡60,000 | 260 wk | 10% | ₡253.85 | ₡66,000 |
  | Pyramid Capital | ₡200,000 | 520 wk | 15% | ₡442.31 | ₡230,000 |

  "Loans can be repaid instantly without additional costs."
- **Bankruptcy**: "the city may take a **bailout of ₡50,000** … **Achievements are disabled after a bailout**." The rescue is available but has a permanent cost.
- **Bank-balance widget**: "shows your available funds and the **weekly income and expense balance**". The HUD shows "₡40,565 +₡4,807".
- Time: "one in-game week per one minute of gameplay" at ×1. Speeds ×1, ×2, ×4; Space pauses.

### 3.2 CS2 Economy panel (diary and official screenshots)
- Five tabs: **Budget · Loans · Taxation · Services · Production**. Taxation and Services unlock at M1, Production at M2.
- **Budget tab**: a stacked bar chart (revenues in green vs expenses in red) on the left, line items in the middle, and an explanation pane on the right.
  - Revenues: Taxes, Service Fees, Service Trade, Government Subsidies.
  - Expenses: Subsidies, Service Upkeeps, Service Trade, Loan Interest.
  - At the bottom: **MONTHLY BALANCE**.
  - Selecting a line shows a plain-language explanation. Service Upkeeps, for example: "buildings only provide the amount of each service required … To save on operating costs, it is possible to lower the quality of a service on the Services tab … waiting times for ambulances will be longer…"
- **Loans**: "there is now **only one loan available, but the loan is adjustable** … moving the slider right and left … finalized by using the Accept button … The loan size has a **limit that increases on each milestone**. The **interest rate is based on the size of the loan** … automatically paid back in monthly payments … can be reduced by building the **City Hall and the Central Bank**."
- **Taxation**: one slider per zone type, expandable to "taxes per Education level" for residential and "per product type" for C/I/O. "Each tax can be set **between −10% and 30%**. Setting **negative taxes** is a great way to guide the production." Negative taxes are a subsidy lever.
- **Services tab** (screenshot): a list of 12 services with monthly cost. The selected service shows a **Budget slider (50–150%)**, a **Service Fee slider** (water at 130%) on a red–green gradient, and a **RESET** button. Below are Revenues (Fees, Export) and Expenses (Maintenance & Resources, Import). The right pane explains the fee and lists **live predicted impacts: "Water Consumption −11%, Company Efficiency −11%, Citizen Happiness −2"**.
- **Production tab**: every material and good with **Surplus or Deficit**. Hovering shows "where the resource can be gained from and where it can be either sold or used".
- **Economy 2.0 (June 2024)** responded to "the game didn't challenge many of you":
  - **Government Subsidies removed** ("they also removed agency and consequences").
  - **Importing city services gets a toggle and a fee** that scales with population, through the new city policy "Import City Services" (off by default).
  - **Service upkeep raised significantly**.
  - Demand recalculated.
  - The diary asks "Is your city's economy strong enough to afford a University or will you have to increase taxes?"
- **Tile upkeep** (June 2024): "The first 9 tiles … do not have a cost … upkeep … increases on a curve **from 5% to 25%** [of purchase price] as more map tiles are bought … affecting all purchased tiles". It was added to punish expanding faster than the economy can support. The tile UI shows both purchase cost and upkeep.
- Player verdict before 2.0: "**The game is WAY too easy.** After you earn your first million it is very hard to lose … you end up with **100M+ in the bank** just by doing nothing" ([review](https://steamcommunity.com/profiles/76561198038825073/recommended/949230/)). After 2.0: "They have reworked the economy which is a welcome change and **actually makes the game a challenge and fun to play**" ([review](https://steamcommunity.com/profiles/76561197992881053/recommended/949230/)). A design complaint: "**budget panel doesn't show you the status of that service as you adjust its budget** … you've gotta flip back and forth" ([review](https://steamcommunity.com/profiles/76561198094219820/recommended/949230/)).

---

## 4. Policies and districts

### 4.1 CS1 policies (fandom Policy table; manual p.21)
- The manual says: "Policies have both positive and negative effects. For example, a smoking ban will make citizens healthier, but it can make them unhappy. Policies can be set for different districts … to make them look, play, and feel different. **Set policies for a district by clicking it when the policies panel is open**."
- The panel has tabs **Services / Taxation / City Planning**. Specialised areas (Park, Industry, Campus, Festival, Stadium, Varsity) have **their own policies inside that area's panel**, not in the global panel.
- Every row lists **Policy · Unlocked at · DLC · Effect · Upkeep/Drawback**. Examples with numbers:

| Policy | Unlock | Effect | Drawback / cost |
|---|---|---|---|
| Power Usage | Worthy Village | electricity −11% | ₡5/week/building |
| Water Usage | Worthy Village | water −15% | ₡5/week/building |
| Smoke Detector Distribution | Worthy Village | significantly reduced fire risk | ₡5/week/building |
| Free Public Transport | Busy Town | more public-transport use | no income from bus, tram, metro, monorail and local trains (intercity and cargo still pay) |
| High Ticket Prices | Boom Town | ticket prices +25% | fewer passengers |
| Recreational Use | Boom Town | slightly more tax and tourism, slightly less crime | Police budget +15% |
| Education Boost | Big Town | young adults prioritise study | Education budget +25% |
| For-Profit Education | Big Town | education upkeep −50% | lower happiness |
| Tax Raise/Relief (per zone) | Big Town | ±2% tax in the area | — |
| Heavy Traffic Ban | Busy Town | trucks banned (not on highways) | "can block deliveries" |
| Highrise Ban | Small City | no tall buildings | buildings can't reach top level |
| Industry 4.0 | Big Town | industrial output +50%, jobs only for the well educated | workplaces −30% |
| Old Town | Tiny Town | only residents and businesses may drive | other vehicles banned |
| NIMBY | Tiny Town | leisure districts close at night, less noise | less night income |

### 4.2 CS1 districts
- Painted with a brush in 3 sizes that snaps to roads; right-click erases. Districts are auto-named and renamable.
- The district panel shows happiness, specialization, population/households/workers/tourists, average building level and active policies.
- **Specializations** turn a district into an economic identity (manual table):

| Resource | Renewable | Tax vs generic | Pollution | Extra |
|---|---|---|---|---|
| Oil | No | **+35%** | +30% | +15% electricity |
| Ore | No | +20% | +20% | +10% electricity |
| Forest | Yes | +10% | +7% | +7% electricity |
| Fertile land | Yes | +10% | no ground pollution | +25% water |

  Tourism (Busy Town) and Leisure (Big Town, open 24/7) are commercial specializations.
- Later DLC added **area mini-games with their own levels**: Park areas up to max level, **Industry Areas up to Level 5**, Campus reputation up to "Prestigious", Airport areas up to level 3. Each area has its own panel, policies and budget. These became achievement goals.
- Achievements that teach the tools: "City Planner: use the district tool to draw 3 districts" (33.4%), "**Lawmaker: apply a policy to a district you created" (20.4%)**, "Distroy: >10 districts with unique policies" (1.1%).

### 4.3 CS2 districts and policies
- Districts are drawn by **placing corner nodes** and closing the shape, then adjusted by dragging nodes. They are auto-named and renamable.
- The **district panel** (screenshot): name; a happiness smiley whose hover shows "all the benefits and drawbacks of the area"; a collapsible **POLICIES** checklist (Roadside Parking Fee has an inline **₡ slider**); then Households 9,579/9,673, Residents, Average Wealth, Employees, and **Local Services** (assigned services with "View Details" links).
- **Services can be assigned to districts**: "Services that have not been assigned to any districts will service the entire city … passive service coverage effect still applies only to its neighborhood. Only its simulated service effects i.e. its vehicles travel to all of the assigned districts."
- **City policies** live in the **City Information panel** (button next to the demand bars), tab "CITY POLICIES". Each is a checkbox list with a description pane, and some have a slider ("Taxi Minimum Fare ₡10").
- Launch content: "**7 different district policies and 5 city policies**". Unlock milestones (GINX):
  - District:
    - M5: Energy Consumption Awareness (electricity −5%), Recycling (fewer used resources, less free time), Roadside Parking Fee (₡1–₡50), Speed Bumps;
    - M6: Heavy Traffic Ban;
    - M7: Gated Community (only people living or working there; higher well-being, lower crime);
    - M10: Combustion Engine Ban.
  - City:
    - M4: Taxi Minimum Fare;
    - M5: Pre-Release Programs;
    - M6: Advanced Pollution Management (filters cut air and ground pollution but produce more garbage);
    - M10: City Promotion (more attractiveness and tourists, more crime near attractions) and High-Speed Highways (faster, noisier, slightly more accidents).
  - Building policy: Parking Fee on parking lots (₡1–₡50).
  - Added later: **Import City Services** toggle (Economy 2.0); "Urban Cycling Initiative" (bicycle use 20% → 50%, patch 1.5.7).
- Achievements: "Executive Decision: assign a policy to a city district" (26.2%), "Happy to Be of Service: create a district and assign a service" (26.0%), "**Calling the Shots: 5 city policies simultaneously" (7.0%)**, "Wide Variety: 10 districts each with unique policies" (2.1%).
- Player view: "The city and district policies need more options, but the ones available atm are a good start" ([review, 521 votes](https://steamcommunity.com/profiles/76561198262198841/recommended/949230/)). Seven policies is too few to create identity; CS1's long table was a big part of its flavour.

---

## 5. Info views (overlays) and how problems are communicated

### 5.1 CS1
- Manual: "Info views offer insight into different city services, resources, and issues, such as fire safety, land value, and the amount of pollution. **The map view changes with the active info view** highlighting the coverage of the selected item. Some info views have **tabs** (Education: elementary, high school, university) … practical … to **predict possible problems or growing needs**."
- Placement: the **Info Views button is at the top-left** (manual figure, item 12). Opening it shows a grid of overlay icons.
- **Coverage preview while placing**: "When a City Service building is selected, you can see its coverage on the map from the **colour of the roads before placing it. Green roads** indicate that the service is available … **red roads** indicate that the service cannot reach."
- **Problem icons over buildings** (fandom "Iconology"): no electricity, no water, garbage piling up, dead person waiting, not enough goods / customers / workers / educated workers / raw materials / buyers, too few services, sewage backing up, fire, flooding, high crime, plus Abandoned, Burned down and Collapsed. On roads: "No road connection", "Snow has piled up". On transport: a depot "needs to be connected to lines". "**Prolonged problems will be displayed in a red icon and become abandoned** if the issue is not solved." The escalation is grey → red → abandonment, and "If the abandoned buildings are not bulldozed, they will be inhabited again after a minimum of 4 weeks" (manual).
- Building info panel: name and type, **status icons with hover explanations**, level and "**tips for upgrading the building**", residents/workers by education, and for services "Upkeep cost/week, capacity/efficiency, vehicles in service".
- Teaching through achievement: "**Well Informed: have a look at all the different info-view panels" (14.3% of players)**.
- Player voice: "The interface is very, very well thought out, along with each of the overlays" ([review, 633 votes](https://steamcommunity.com/profiles/76561197985853116/recommended/255710/)). But: "some of the mechanics of the simulation (e.g. freight train depots, **RCI) are not well surfaced** so it can be a challenge to know how to answer certain problems" ([review](https://steamcommunity.com/profiles/76561198040401422/recommended/255710/)). "Ambiguities … traffic, services, and **lack of UI information**. But once I started to figure these systems out, the challenge … was hugely rewarding" ([review, 340 votes](https://steamcommunity.com/profiles/76561197982970265/recommended/255710/)).

### 5.2 CS2
- **33 info views** in groups: Roads, Traffic, Electricity, Water & Sewage, Healthcare & Deathcare, Garbage, Fire & Rescue, Disaster Control, Police, Administration, Education, Transportation, zone views, Land Value… (cs2.paradoxwikis.com/Info_views, via search summary). "**Associated info views will also be automatically opened when a relevant construction menu is opened**."
- **Zone suitability**: "Each zone type has a Zone Suitability infoview which **activates when you start zoning** … zoning commercial areas shows where the potential customers are located … zoning a residential area highlights ground pollution." Information appears exactly when the decision is being made.
- **Visual grammar** (screenshot, Transportation info view):
  - the 3D city goes **grey/white**, and only the layer's objects are coloured;
  - the left panel shows statistics (per mode: lines, tourists/month, citizens/month; cargo routes in tonnes/month);
  - below that is a **MAP LEGEND** where every object type (stations, depots, taxi stands, bus/train/tram/subway stops, ship piers, airport terminals, vehicles) has a colour swatch and **a checkbox to show or hide it**.
- **Selected Info Panel (SIP)** (screenshot of a house): the header address; status rows with icons ("High rent", "Happy"); Level 4/5 as a 5-segment bar; residents; household wealth. Hovering the problem row gives **cause plus suggested fix**: "The building occupants have trouble paying the rent. A higher zone density or different zoning might be needed." A matching **notification icon floats above the building** on the map.
- Hover-for-breakdown everywhere: "Citizens' needs can be inspected from their household's SIP by **hovering over the family's Happiness icon**. Similarly, companies' needs … hovering over their Efficiency value." Happiness is a five-face scale at the bottom right of the HUD.
- Patches show iterative tuning of *when* to warn:
  - "Increased the time it takes for Ambulance and Hearse notifications to appear";
  - "Tweaked 'High Rent' notifications to be based on the household's income";
  - "'Rent Too High' warning notifications are now **highlighted when Land Value Info View is active**";
  - "Added Land Value tooltip to a cursor which shows the monetary value" (1.1.0);
  - "Homelessness added to Population Info View" (1.2.5).
- Achievement: "**The Inspector: have a look at each individual info view panel" (8.9%)**.
- Player and press voice:
  - "Feedback to the user was not adequate to completely understand what was going on, and **many players assumed things were bugs when they were not** … the game's UI needs **more obvious indicators of what's going on with underlying systems**" ([review, 4,404 votes](https://steamcommunity.com/profiles/76561198114404278/recommended/949230/)).
  - GameStar: "there are also many mechanisms **that the game does not communicate, or only superficially**. This often leads to absurd situations: you think everything is going to plan, and on closer inspection fundamental problems appear in almost every area."
  - "The UI … is still bright, garish and **incredibly hard to parse at a glance**" ([review](https://steamcommunity.com/profiles/76561198031567112/recommended/949230/)).
  - "There just seems to be … **no easy way to diagnose problems**" ([review](https://steamcommunity.com/profiles/76561198018590977/recommended/949230/)).
  - Iceflake in 2026: "We know that the UI can sometimes be a bit confusing when it comes to communicating things … changed some icons to be more expressive … the **demand bars have more focus**" (City Corner #1).

---

## 6. Chirper and other feedback channels

### 6.1 CS1 Chirper
- Manual: "in-game social media … Chirps can be about various events and current happenings … but they might also **reflect your citizens' moods and opinions about various things, such as policies or city services**. Keep an eye on the Chirper; it might give you some **valuable clues** about your citizens' well-being." Placement: the **top centre** of the screen (manual figure, item 13), a bird icon that drops speech bubbles. There is an option to "Auto-open Chirper messages".
- Chirps are generated by **triggers** (fandom table):
  - High Commercial Demand → "Three got laid off because no one was buying our factory's products. Having more local retailers would help…"
  - High Residential Demand → "Apartment rents are rising … @mayor is starting negotiations with local housing developments."
  - High tax → "It sure is expensive to live in this area. I hope the @mayor balances the living costs with good #services. #notimpressed"
  - Poor deathcare → "There's a #weird #smell coming from the apartment next door…"
  - Many abandoned buildings → "These #abandoned #houses ruin the neighborhood. Who's job is it to demolish or renovate them?"
  - Policy enabled → "I think this #smokingban is excellent!"
  - First power plant, first bus line and so on produce congratulatory chirps.
  - "Rare" flavour chirps exist with no trigger ("I love sleep #mypillowismyonlytruelove").
- Most chirps carry **a diagnosis inside the joke** ("having more local retailers would help").
- Player criticism: "Some of the random 'tweets' get **repetitive**" ([review](https://steamcommunity.com/profiles/76561198114203030/recommended/255710/)); "lack of content variety (chirps, buildings, billboards)". Sunset Harbor fixed "Players do not get Chirps randomly from enabled policies". Chirps were added in every DLC patch ("More Chirps").

### 6.2 CS2 Chirper, Lifepath and Radio
- Diary: "Chirper … functionality has been expanded and integrated more into the core gameplay … **The chirps relate to actual events and looking at the 'likes', you can see just how important the subject matter is** to the chirp sender and other citizens. Citizens can inform you about the lack of city services and congratulate you when their various service and leisure needs have been met … Both citizens and **city services** use Chirper." The like counter began as a bug that the team kept (Netzwelt).
- **Followed Citizens and Lifepath Journal**: "selecting the citizen and clicking the Follow button, adding them to the list of Followed Citizens found on the **right side of the screen right below Chirper** … The journal entry lists their name, home address, current occupation, Happiness … as well as **their Chirper feed**." Achievement "You Little Stalker: follow a citizen's lifepath from childhood to old age".
- Right-edge stack (screenshots): Chirper (blue bird) → Followed Citizens → Event Journal → Radio. Each has a rebindable hotkey (Shacknews).
- GameStar's practical verdict: on Chirper you also find "**lots of trivial messages that disturb more than they help** — just like the real thing." On the radio, by contrast, "the sometimes quirky presenters comment on **actually important topics such as missing public buildings or a housing shortage. If there is nothing to report, nothing is said; music plays**." Their tip: turn Chirper pop-ups off and listen to the radio.
- **Lesson**: a satirical feed earns trust only if (a) every post maps to a real variable, (b) importance is visible (likes or counts), and (c) silence means "all good". Noise hides signal.

---

## 7. The "needs" bars: RCI(O) demand

- **CS1** (manual): "Zoning demand bars indicate which zones are needed … The fuller the zoning demand bar is, the higher the need … GREEN = Residential, BLUE = Commercial, YELLOW = Industrial and office." They sit in the bottom bar, left of centre (figure item 6).
- What they actually measure (fandom Zoning): "The RCI meter is **NOT a demand meter** for more of each zone type. It is a common misconception." Each runs from −50 to +50; a balanced city sits at 0 (half full).
  - **R** reflects demand for workers.
  - **C** is mainly the ratio of commercial workers to citizens, ideally **1 to 8** (80,000 people → 10,000 commercial workers).
  - **I** follows **unemployment**, with 50% fill at **5% unemployment**.
- **CS2**: **four bars (R, C, I, O)** at the bottom left beside a City Information button. The City Information panel has a **Demand** tab with "additional details about demand" (the factors) and the **City Policies** tab.
  - Economy 2.0 made residential demand depend on household wealth (rich households want low density, students want high density) and tied commercial demand "to what households need".
  - Patch 1.5.7: "Fixed **demand bars not being able to visually fill up**" and "Commercial demand is now based on how well-stocked your shops are on average".
  - Player complaint: "relentless demand for low density housing … forces you to create a sprawling American hellscape" ([review](https://steamcommunity.com/profiles/76561198094219820/recommended/949230/)).
- **Lesson**: demand bars are the best "what next?" prompt in the genre. They must be **honestly labelled**, must **explain themselves on hover** (factor breakdown), and must **visibly respond** to the player's action.

---

## 8. Service coverage

- **CS1**: radius along roads, previewed in green or red when placing. The budget slider changes efficiency and vehicle count. The manual's "Budget": "Higher budgets will provide more resources … increased service capacity or production output, less pollution, more ambulances, patrol cars, fire trucks."
- **CS2**: two layers.
  - **Passive coverage**, which spreads along roads, defined by **range** (metres along roads), **capacity** (roughly how many people it reaches; denser areas use it up faster) and **magnitude** (maximum effect, which "fades out quickly at the edge … where … your citizens will only have a few bars on their cellphones").
  - **Simulated effect**: vehicles and visits that can reach city-wide.
  - "The road to the perfect city … lies in **understanding the needs of the citizens** … you can, of course, place the various services throughout the city but doing so is costly and provides only minor additional benefits."
- **Efficiency** is the single health number for every service and company. Lacking water or electricity is a large penalty, lacking both makes the building inoperative, and staff happiness, health and education all count. What efficiency changes per service: roads → maintenance vehicles; electricity → output; transportation → **number of available vehicles**.
- **Upgrades** come in three types: Operational (invisible stat change, e.g. exhaust filter), Extensions (visible attached wings that add capacity or vehicles) and Sub-buildings (separate structures on the lot). Upgrades "add to the building's upkeep cost. It may not always be beneficial to build all upgrades."
- **Service trade**: services can be imported or exported through outside connections (electricity, water, sewage, ambulances, hearses, police, fire, students). Imports have slow response and "lack the passive service coverage effects". Since Economy 2.0 they carry a fee behind a policy toggle.

---

## 9. Transport lines: line tool, line panel, vehicles per line

### 9.1 CS1
- Manual: "The line drawing tool is used to place stops for buses as well as mark the stations where the metros and trains will stop. Additional bus stops can also be placed just as easily by **clicking anywhere in the middle of the line**. A public transport line **needs to form a circular route**."
- Vehicles are driven by **line length and the transport budget slider** ("trains with 50% budget will only have 1 train functioning").
- Snowfall free patch 1.3.0 added a "**Public transport lines panel (sorting of lines by name, vehicle count, passenger count or number of stops, colour and renaming and day/night/daynight lines settings)** available from the public transport info view" and "Line detail / visibility icons".
- Later patches added a per-line **vehicle-model selector**: "Bus line customization" in Campus 1.12.0, then "Line customization tool expanded to all types of transportation" in Sunset Harbor. The Airports DLC added an "Airport Express Train, which can be selected from the Line Info Panel".
- Policies: Free Public Transport, High Ticket Prices (+25%).
- Achievements as a target ladder: "City in Motion: 20 transport lines" (7.0%), "City in Motion 2: 50 lines" (1.8%).
- CS1 player complaint: "Screw you, bus line creator" ([review](https://steamcommunity.com/profiles/76561198031136956/recommended/255710/)). The line tool's usability matters a lot.

### 9.2 CS2 (diary and screenshots)
- **Loop**: "**Depot → Stops and stations → Tracks and roads → Lines**". "Each depot can support a **predetermined number of vehicles** and this can be extended with suitable building upgrades."
- **Line tool**:
  - stops are highlighted when the tool is active;
  - hovering a stop shows "**Click to create a new route starting here**" plus the stop name;
  - hovering a line shows "**Insert a new waypoint here**" (waypoints steer buses away from congested roads);
  - air lines are drawn from the airport to an outside-connection icon.
- **Transportation Overview** (bottom-bar management button, hotkey X; screenshot):
  - a centred modal with tabs **PUBLIC TRANSPORT / CARGO** and a vertical mode selector (bus, tram, train, subway, ship, plane);
  - a table "BUS LINES" with columns **Name ▾ · Length · Stops · Buses · Passengers · Usage %**;
  - per row: a **colour swatch**, an **on/off toggle**, a **day/night schedule icon**, an **eye (show on map)**, a **magnifier (Line Details)** and a **bin**.
  - Patch 1.0.14 added "a button to toggle visibility for whole list of lines at once".
  - Example data: "Bus line 3 · 2.3 km · 11 stops · 2 buses · 119 passengers · **74%**" vs "Bus line 7 · 1 bus · 0 passengers · **0%**". The table makes bad lines obvious at a glance.
- **Line panel** (screenshot "Tram Line 2"):
  - a **left column with a schematic of the line** (a rounded loop with stop dots);
  - **SELECT VEHICLE MODEL** dropdown ("CO Tram");
  - PUBLIC TRANSPORT LINE block: **Length 8.7 km, Stops 13, Passengers 506, Line Usage 53%**;
  - **TICKET PRICE** slider (₡8);
  - **ASSIGNED VEHICLES** slider "**4 / 14**" (assigned / maximum currently available; the diary ties this to "the depot's fleet"), with **Active Vehicles 4** below;
  - **SCHEDULE** segmented control (day / night / day+night);
  - **COLOR** swatch;
  - icons for locate, delete and active toggle.
- Design intent: "Ticket price affects citizens' pathfinding calculations. Citizens weigh **time, travelling comfort, and money** … If a line becomes extremely popular i.e. its **usage percentage close to 100%**, increasing the number of vehicles can alleviate the pressure and shorten passenger wait times … makes sure that the **depot's fleet is used optimally**."
- **Transportation info view**: totals per mode (lines, tourists/month, citizens/month), cargo routes and tonnes/month, and the map legend with toggles. The tutorial gives **task cards only "for more complex builds like public transportation"**, so transport keeps guided help after the basic tutorial ends.
- Achievements: "Go Anywhere: 20 active lines" (11.7%), "Spiderwebbing: 50" (2.8%).
- Player complaints: "Only UI improvements were made in public transportation … **Are we the mayor or the line manager in this game?**" ([review](https://steamcommunity.com/profiles/76561198057571383/recommended/949230/)); "The metro UI looks cleaner, but it is **less readable** and less useful. Transit line tools are painful to use" ([review](https://steamcommunity.com/profiles/76561199495520765/recommended/949230/)); "the UI is pretty awful, everything from **setting bus lines** to the size of menu screens" ([review](https://steamcommunity.com/profiles/76561198031695044/recommended/949230/)).

---

## 10. Replayability: maps, scenarios, sandbox toggles, difficulty, achievements, mods

### 10.1 Map choice up front
- **CS1 New Game panel** (manual figure p.8): a map list on the left and a preview image on the right, then **natural resource bars** (forest, fertile, ore, oil), **water**, **outside connection icons** (highway, train, ship, plane) and "**Suitable area for building: N%**", plus a left-hand traffic toggle, the city name and [Start].
- **CS2**: "you will see the most important details of the selected map, such as the default Theme … Climate … Latitude … Buildable area … Natural Resources, and … Outside Connections". You can set name, theme (EU/NA) and "various gameplay options", and choose whether "you want the tutorial to guide you". There were **10 launch maps**, each with a distinct challenge (Archipelago Haven, Barrier Island, Great Highlands, Lakeland, Mountain Village, River Delta, Sweeping Plains, Twin Mountain *without an existing train track*, Waterway Pass, Windy Fjords), plus free region packs.
- **CS2 land**: "A brand new city starts with **9 map tiles** … you are able to unlock almost all tiles … a whopping total of **441 map tiles** … 159 km² … **Map Tiles do not have to be connected** … small isolated pocket towns." Selecting a tile shows buildable area, resources and cost; you can multi-select and see the combined cost.

### 10.2 Scenarios (CS1, from the Natural Disasters DLC, 2016)
- "Scenarios … require the player to complete certain tasks to win. If the player meets one of the losing conditions, they will fail … Some scenarios have a pre-built city while some are completely new … Winning scenarios will unlock unique buildings." Patch 1.6.1 "**Added scenario losing and winning conditions in New Game → Choose Scenario panel**".

| Scenario | Win | Lose |
|---|---|---|
| By the Dam (pre-built, meteors) | population > 65,000 | 300 game weeks pass; population < 1 |
| Floodland | survive 240 weeks | own ≥ 5 tiles; money < 0; population < 1 after 15 weeks |
| Island Hopping | population > 250,000 and average health > 20% | money < 0; population < 1 after 15 weeks |
| Tornado Country (pre-built) | population > 260,000, 20,000 full lifespans, money > ₡1,000,000 | money < −₡30,000 |
| Alpine Villages | 500,000 transported by public transport | 350 weeks; population < 1; money < 0 |

- Further scenarios: Mass Transit (Ferry Empire, Fix the Traffic, Trains!) and Green Cities (City of Gardens, Clean Up Crew, Green Power!).
- There is a **Scenario Editor** with triggers and conditions.
- Achievements: Creator (10 scenarios), We Have A Winner! (win 10), The Underdog (lose 10), Totally In Motion (win all 3 Mass Transit scenarios). Each sits around 0.4–0.5%, so scenarios were niche but valued.
- Players asked for them: "I would like to see some scenarios … Milestones are great, and sandbox opens so many possibilities… yet still, I would like to have the option of being **guided or limited to specific objectives**. It would help me understand some parts of the game better" ([review, 239 votes](https://steamcommunity.com/profiles/76561198119208048/recommended/255710/)).
- **CS2 has no scenarios.**

### 10.3 Sandbox toggles and difficulty
- **CS1** ships these as built-in "mods" in the Content Manager:
  - **Unlimited Money**;
  - **Unlock All** ("does not unlock Unique Buildings or Monuments");
  - **Hard Mode**: "**Construction costs +25%, Reduced zone demand, upkeep costs +25%**";
  - later, **Unlimited Oil and Ore** (resources never run out) and **Unlimited Soil** (free terraforming).
  - Any of them, any mod, or a bailout **disables achievements**.
  - Player view: "The developers included mods to enable Sandbox mode and Hard Mode, so you can choose how you wish to play. Want to play without money first, then turn money back on? Sure" ([review](https://steamcommunity.com/profiles/76561197995006749/recommended/255710/)).
- **CS2** has New Game / Map Options toggles: **Natural Disasters, Left-hand Traffic, Unlimited Money, Unlock All**, and later **Unlock Map Tiles** ("does disable achievements, it also disables the Tile Upkeep … great if you enjoy building small towns or villages and don't want to skip the Milestone progression"). Tutorials can be on or off. Patch 1.1.0 "Added achievement disable warning to the load game detail panel". There is no difficulty slider.
- 2026: **"Legacy Toggles"**, letting players keep old behaviour for reworked features, starting with the old UI look (City Corner #2).
- **The challenge problem.** Even CS1's top reviews say "Lack of challenge makes you fail to see the point of anything after a couple hours … aimed at creative players" ([review, 314 votes](https://steamcommunity.com/profiles/76561197984047355/recommended/255710/)). Others: "Replay value: 9/10 – **If you're creative**, you could play this game for a very long time" ([review, 297 votes](https://steamcommunity.com/profiles/76561198816867375/recommended/255710/)); "eventually all your cities will look the same. **The mods is where the game truly becomes a masterpiece**" ([review, 4,369 h](https://steamcommunity.com/profiles/76561197995006749/recommended/255710/)).

### 10.4 Achievements as a goal catalogue
- **CS1: 135 Steam achievements; CS2: 44.** Completion rates are live from Steam. They work as an optional goal list and a stealth tutorial.
  - Tutorial-like (teach a tool):
    - CS1: Well Informed (all info views, 14.3%), City Planner (33.4%), Lawmaker (20.4%), Reporting! (check a citizen's route, 7.5%), Nomen Est Omen (name a road, 10.5%).
    - CS2: Executive Decision (26.2%), The Inspector (8.9%), Happy to Be of Service (26.0%), Snapshot! (photo mode, 8.0%).
  - Ladders:
    - CS1: City in Motion 20 → 50 lines; Metropolis 100,000 population (5.3%).
    - CS2: The Explorer 50 tiles (33.8%) → Everything the Light Touches 150 tiles (15.4%); Making a Mark 5 → The Architect 10 signature buildings; Go Anywhere → Spiderwebbing.
  - **Negative or satirical** (play badly on purpose), which adds replay value:
    - CS1: **Unpopular Mayor: have 15% happiness (42.0% — more players got this than most positive ones)**; Tough City (crime > 40% for 2 years); Professional Dumper (fill 5 landfills); Make Them Pay / Power to the People (tax gaps); Frenetic Player (click a police building 100 times).
    - CS2: **This Is Not My Happy Place (≥1,000 citizens, 25% happiness), 0.7%**; The Deep End (loan ≥ 200,000, 23.0%); Squasher-Downer (bulldoze 1,000 buildings, 11.0%). CS1 later added more of these, e.g. "Garbage Collection Issues: have 5 garbage service points reach their capacity limit" (0.2%).
  - Style or constraint runs: Green Energy (no raw materials, 50.4%), Greenest City (no polluting industry), Earthloving City (no pollution > 10,000 residents), Zero Emission (CS2, 500 MW renewables).

### 10.5 Modding scale
- CS1 Steam Workshop today: **372,593 ready-to-use items**, including **55,761 maps**.
- CS2 moved to Paradox Mods, a major point of anger ("Bring back steam workshop", [review, 736 votes](https://steamcommunity.com/profiles/76561198341382098/recommended/949230/)). In 2026 Iceflake added asset colouring (inspired by the "Recolor" mod) and a universal mod button in the UI.

---

## 11. UI structure: where things are and how players find them

### 11.1 CS1 HUD (manual figure, numbered as in the manual)
```
┌────────────────────────────────────────────────────────────────────────────┐
│(12) Info Views                (13) Chirper bird                (14) Pause⚙ │
│                                                                            │
│                         [ 3D city / map ]                                  │
│                (5) Advisor "?" floats above the bar                        │
├────────────────────────────────────────────────────────────────────────────┤
│(1)Areas (2)Milestone◔ (3)▶ date ▸▸ (4)City name  (6)RCI ▮▮▮ │(8) SERVICE    │
│      big round   fills clockwise                         │ PANELS: Roads │
│                                                          │ Zoning Distr. │
│                                                          │ | Elec Water  │
│                                                          │ Garbage | Hea-│
│                                                          │ lth Fire Pol. │
│                                                          │ Edu Transport │
│                                                          │ | Deco Unique │
│                                                          │ Monuments |   │
│                                                          │ Economy Polic.│
│ (7) ₡40,565  +₡4,807/wk   (9) 👤 4,064 +95  ☺           (10)Bulldoze (11)Cam│
└────────────────────────────────────────────────────────────────────────────┘
```
- One bottom bar holds **everything that builds or manages**, and a separator groups the icons: build (roads, zoning, districts) | utilities | services | decoration and special | **management (Economy, Policies) at the end of the same row**. The top corners hold overlays (left) and the system menu (right). Chirper sits top centre.
- The Advisor is a toggleable "?" panel that "shows information and tips **about the active tool or feature**". It is context-sensitive, not a separate tutorial.
- Reviews praise it: "The UI is simple but intuitive" ([review, 483 votes](https://steamcommunity.com/profiles/76561198039690260/recommended/255710/)); "INTERFACE: 9/10 … just a little cluttered" ([review, 431 votes](https://steamcommunity.com/profiles/76561198083487179/recommended/255710/)); "The interface is straight from SimCity so those with experience knows how to jump into the game".
- Onboarding was weak: "the game does a poor job onboarding new players … the tutorial feels either too barebones or poorly paced … I found myself having to rely on external guides" ([review](https://steamcommunity.com/profiles/76561198062506049/recommended/255710/)). Sunset Harbor later added a "Tutorial Message Log".

### 11.2 CS2 HUD (launch UI, from official screenshots)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ (i) Info Views                                            (?) Advisor  ⚙   │
│  └ opens: icon grid + info-view panel (stats + legend ☑)                   │
│                                                                            │
│ [Selected Info Panel opens top-left: name, status rows,                    │
│  level bar, residents… with hover explanations]           Right edge:      │
│                                                           🐦 Chirper       │
│                                                           👤 Followed      │
│            [ centred modal panels: Progression,           📓 Event journal │
│              Economy, Transport Overview, City Info ]     📻 Radio         │
│                                                                        📷  │
├────────────────────────────────────────────────────────────────────────────┤
│[MapTiles⁽¹²⁹⁾][🏆7⁽³⁾ Busy Town][City info ▮▮▮▮ RCIO]  Zoning Areas Signat. │
│   permits badge  milestone + unspent DP                 | Roads ⚡ 💧 ✚ ♻ 🎓 │
│                                                         🔥 🛡 🚌 🌲 💬 ⛏ | 🚜 │
│                                                 | Economy · TransportOv ·  │
│                                                   Statistics · …           │
│ ▶ 16:25 Sept 2023 ▸▸▸ │ ☀10° Fall │ City name │ 👤 9,067 +300/h │ ₡1,847,342 −1,044/h │ ☹☹😐☺☺ │
└────────────────────────────────────────────────────────────────────────────┘
```
- Icon labels for the three categories left of Roads (Zoning, Areas, Signature buildings) are my reading of the icons, not captions in the screenshot.
- **Two-row bottom bar.** The upper row holds progress, demand, **15 build categories** and the bulldozer, then **management panels** on the right. The lower row is a **status strip**: time, speed, weather and season, city name, **population with hourly delta**, **money with hourly delta**, and a **5-face happiness scale**.
- **Top-left: Info Views. Top-right: Advisor (?) and Options (⚙). Right edge: feeds.** Photo mode sits at the bottom right.
- **Management panels open as centred modals** with tabs (Progression: Development/Milestones/Achievements; Economy: Budget/Loans/Taxation/Services/Production; City Information: Demand/City Policies; Transportation Overview: Public Transport/Cargo). They share a **three-column layout: navigation list | content | explanation pane**.
- **Object panels** (buildings, districts, lines) **open at the top left** as narrow cards. Hover gives breakdowns, and footer icons handle locate, relocate, delete and toggle.
- **Hotkeys** (Shacknews): Map Tiles M, Progression P, City Economy Z, City Information C, City Statistics V, Transportation Overview X, Bulldozer B, speeds 1–3, Space pause, F5/F9 quicksave/load, ` hide UI, . photo mode. Chirper, Followed Citizens, Event Journal, Radio and Advisor are bindable.
- 2026 overhaul (Iceflake): rounder shapes, "**demand bars have more focus**", more expressive icons, UI transparency and toolbar scaling settings (1.5.7), and a planned **in-game Encyclopedia with categories and search** (tooltips added to it in 1.5.7). The **legacy UI can be toggled back**.
- Player view is split:
  - Positive: "Unlike the OG interface, I can actually easily navigate it and build things **while barely conscious** … at 2 in the morning" ([review](https://steamcommunity.com/profiles/76561199209971323/recommended/949230/)). TechRadar: "the sequel is intuitive and easy to pick up … largely thanks to its fantastic UI, which helps explain every inch of city-building … **some brilliant charts can relay a large amount of information quickly**". "Great interface for its purpose (not perfect…)" ([review](https://steamcommunity.com/profiles/76561198061579523/recommended/949230/)).
  - Negative: "The UI is a major step down and doesn't show you info you need in most cases … **the icons are vague**" ([review](https://steamcommunity.com/profiles/76561198094219820/recommended/949230/)). GameStar: "After many hours of play we discovered the pedestrian path — **it was hidden under Landscaping**." Things must live where players expect them.

### 11.3 How a new player knows where things are (CS2 tutorial system, BTS #6)
1. **Everything visible, most of it padlocked.** At "Founding" every bottom-bar category is shown with a **lock icon**. Only roads, electricity, water and zoning are live, with ₡500,000 in the bank. The player sees the shape of the whole game from minute one.
2. **Task list ("HOW TO BUILD A CITY")** at the **top right**: Road Basics → Zoning Residential → Zoning Commercial → Zoning Industrial → Electricity → Water → Sewage. Each task has a ▶ play button and a checkbox. Later tasks are **grey and locked until the previous one is done**. Steps cannot be skipped during the list, and become skippable afterwards.
3. **First-step balloon**: points at the relevant toolbar icon with an **animated green outline** ("encourage you to click the icon"). If you close the panel early, "the green outline will appear around appropriate icons and tabs to **show you where to go**".
4. **Balloon steps**: point at tools inside the open menu, with a "1/12" step counter and free back/forward.
5. **Task cards**: "how and where to build", with an image, keys and a check mark if already done. Minimisable while building.
6. **Center cards**: for things with no icon to point at (info views, "a new type of problem in the city").
7. **Hints**: short balloons "between the task list tutorials" that "point out tools that are particularly useful at the moment". Once shown, they are stored in the task list and Advisor.
8. **After the task list**: "tutorials will show up **when a new service or panel is opened for the first time**. New features have a **green indicator at the top right corner of its icon**."
9. **Text highlight**: "Reading **just the bolded text** will give the short answer … the rest of the text adds more detail."
10. **Advisor** ("?" at the top right): an archive of every tutorial in **5 groups: Services, City, Info Views & Notifications, Citizens, Interface & Tools**, with collapsible subgroups. "Only the tutorials for the services and features that have been unlocked will be visible." Tutorials can be restarted at any time.
11. **Tooltips vs tutorials**: "tooltips … provide more in-depth information about **what** the feature is, while tutorials focus more on **how and where** to build".
12. GameStar tip: "After every level-up, click through the build menu and look at the new options." Players still had to discover unlocks themselves. A "what's new" list would help.

Results: "The game has built-in tutorial stuff that is enough to help me along, I haven't had to google much" ([review](https://steamcommunity.com/profiles/76561197969243445/recommended/949230/)). Against that: "Tutorial could be made better … doesn't cover basics well enough" ([review, 288 votes](https://steamcommunity.com/profiles/76561198030576533/recommended/949230/)).

---

## 12. Coherence warnings from the reviews (relevant to "dialogues only claim what really happens")
- "It feels you are looking at a animated picture of a city while there is a complicated excel spreadsheet on the other monitor crunching random numbers and they hope you are dumb enough not to notice that they have **nothing to do with each other**" ([review, 2,954 votes](https://steamcommunity.com/profiles/76561198198726359/recommended/949230/)).
- "There is virtually no challenge; you can have **garbage overflowing in the streets, high crime, low healthcare, bad traffic, and you will STILL make money** and see a city that is clean, happy, and flourishing" ([review](https://steamcommunity.com/profiles/76561198161595651/recommended/949230/)).
- "Many players **assumed things were bugs when they were not**" ([review, 4,404 votes](https://steamcommunity.com/profiles/76561198114404278/recommended/949230/)).
- CO's own Economy 2.0 rationale: "certain systems … **weren't transparent enough** and didn't allow you enough control … fewer safeguards and automated systems that work invisibly under the surface."
- **Rule for our game**: every newspaper headline, character line, chirp-style post and warning must be generated from a game variable. Show that variable, with its value, on hover ("Tenfe pierde 12 M€: ver Finanzas"). When nothing is wrong, the channel stays quiet.

---

## 13. Mapping to «Rescate de Tenfe»: concrete recommendations

### 13.1 Proposed screen geography (one mode, fixed zones)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Capas ◧] (map layers)      «Hito 4 · Operador Solvente» ◔ 62%    [? Guía][⚙]│
│  └ grid of layers; auto-on with the matching tool                        │
│                                                                          │
│ [Ficha (object card) top-left:          ]              Right-edge feeds: │
│  corridor / train / character,                          📰 Periódico (1) │
│  ⚠ rows with cause + fix + button       ]              🐦 «Trenter» (3) │
│                                                          👤 Viajero seguido│
│            [ centred modals with tabs: Finanzas,         📓 Diario de     │
│              Red, Flota, Pactos, Progreso ]                 decisiones    │
├──────────────────────────────────────────────────────────────────────────┤
│[Permisos⁽²⁾][Hito◔⁽³ ptos⁾][Demanda ▮▮▮] │ BUILD: Obras · Flota(Trenespop)│
│                                            · Servicios · Directrices | 🔨 │
│                                          │ MANAGE: Finanzas · Red · Pactos │
│ ▶ Sem 23 · 2027 ▸▸ │ Elecciones en 9 sem │ 🚆 41.2k viaj/día +3% │ € −182 M  −4 M/sem │ ☹😐☺ │
└──────────────────────────────────────────────────────────────────────────┘
```
- **One zone, one job**:
  - top-left: map layers (ancho, electrificación, velocidad, vía única/doble, ocupación, puntualidad, presión política);
  - top-right: guide and options;
  - right edge: the *voices* (newspaper, social feed, followed traveller, decision journal);
  - bottom bar: progress and demand (left), build verbs (centre), management modals (right);
  - bottom status strip: time, election countdown, ridership, money with weekly delta, satisfaction.
- **All modals share one template**: tabs on top, then list | detail | "¿Qué significa esto?" explanation pane, matching CS2's Progression, Economy and City Information panels.
- **Object cards** (corridor, train, station, character) open top-left, show **problems as rows with cause + fix + action button**, and hover-breakdowns.

### 13.2 Progression for a weekly turn game
- Use **12–15 named hitos** instead of 20, given weekly turns. Grow XP thresholds roughly ×1.6–1.8 per hito (CS2 grows from 750 to 2,500 to 4,800 to 8,300 to 13,600 to 21,300 to 46,700 to 89,700).
- **Passive XP every week** comes from ridership growth × satisfaction (16 ticks per day in CS2 becomes one tick per turn here).
- **Active XP is paid only when a work is completed and still operating after N weeks.** Demolishing or cancelling it reverses the XP. This closes the CS2 bulldoze exploit.
- Each hito pays **money (Tesoro transfer), development points, permits (new concessions or corridors) and a higher credit limit**, and unlocks named items. Show them on the reward card with **[Ir a Progreso]**.
- **Development trees per area** (Infraestructura: renovar vía → electrificar 3 kV → 25 kV → ancho estándar → alta velocidad; Flota/Trenespop: unlock makers KAFKA / Tardo / Malstom / BCBB / Dörfler; Política: pactos, cloacas; Comercial: tarifas, bonos). Points are always scarcer than nodes early on, so the order of purchase becomes the identity of each run.
- **Locked items are visible, show their requirement on hover, and carry a "Desbloquear en Progreso →" link** (fixing the CS2 complaint).

### 13.3 Replayability package
- **Start-situation picker** like CS1/CS2 map info: each start shows debt, fleet age, % electrified, % ancho estándar, popularity and the election date, plus a **random seed**.
- **Encargos** (scenarios) with explicit win/lose conditions shown before starting, e.g. "Rescate exprés: EBITDA > 0 antes de la semana 52 · pierdes si deuda > 4.000 M€ o popularidad < 20%".
- **Modifiers** (CS1 built-in mods): Presupuesto ilimitado (maqueta), Todo desbloqueado, **Modo Austeridad (obras +25%, mantenimiento +25%, demanda −15%)** and Prensa hostil. All of them disable medals, with a warning on load (CS2 1.1.0).
- **Medallas**: ladders (20/50 servicios), tool-teaching ones ("Mira todas las capas"), and **satirical negative ones** ("Alcalde impopular" becomes "Ministro dimitido": popularity < 15%; "Puerta giratoria"). Some unlock **emblematic stations or megaproyectos**, as CS1 unique buildings and monuments did through crime 90% or 2,000 abandoned buildings.

---

*End of report. The structured "steal" list is returned separately.*
