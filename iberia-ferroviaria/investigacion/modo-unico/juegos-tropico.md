# Research: Tropico 6 (with Tropico 4/5 where useful): what to borrow for «Rescate de Tenfe»

Scope: political systems (factions, demands, edicts, constitution, elections, Swiss bank and Broker, superpowers), eras, random events and tasks, sandbox settings that make each game different, the advisor and news layer, humour, and the UI structure (what sits where, how the player learns what to do next, overlays). Each section ends with **«Para Tenfe»**, a concrete adaptation for our weekly rail game.

Method: the Tropico Fandom wiki was behind a Cloudflare challenge, so I read its pages as raw wikitext through the MediaWiki API (`tropico.fandom.com/api.php`). I also used the GamePressure guide chapters, top-rated Steam guides, Steam discussion threads, reviews (Eurogamer, PC Gamer, RPS, IGN, Shacknews, Windows Central, GameRevolution, PlayStation LifeStyle, Selectbutton, TheSixthAxis), the Vaporlens summary of Steam reviews and a producer interview. Every claim carries its URL. Where sources disagree, or only a forum post supports a claim, I say so.

Context for the reader: our game already has 4 voter groups (viajeros, territorios, trabajadores, economía), elections in weeks 208 and 416 (lost below 50), pacts with characters, a «cloacas» system (caja B, scandals, court phases), 5 stages and 3 orders a week (see `scratchpad/unify/rescue.md`). Most Tropico systems map onto these directly.

---

## 0. TL;DR: the ten most transferable ideas

1. **Approval has three visible parts for each citizen**: faction standing, *relative* happiness (yours minus a rising Caribbean benchmark) and "personal experience" (punishment for cancelled or rigged elections). The Almanac breaks each one down. Players who never found this breakdown thought approval was "random" ([Steam guide «Guide to political support»](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [Steam thread](https://steamcommunity.com/app/492720/discussions/0/3570700856113482908/)).
2. **Factions come in opposed pairs on "issue axes" that unlock by era.** Each citizen sits on one side of each axis at one of three intensities (moderate, strong, die-hard). Propaganda shifts membership; die-hards cannot be shifted ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [Dual Demands](https://tropico.fandom.com/wiki/Dual_Demands_(Tropico_6))).
3. **Requests escalate in three tiers.** A *demand* (one per faction at a time, no time limit, about +5 standing). A *dual demand* (two rivals ask at once; you pick one; dismissing both angers both). An *ultimatum* (low standing, countdown, then a specific one-year punishment unique to that faction) ([Dual Demands](https://tropico.fandom.com/wiki/Dual_Demands_(Tropico_6)), faction pages, [Steam thread](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/)).
4. **Edicts have three tiers that improve the longer you keep them**: 0, 1 and 2 stars. They can be one-off or monthly, have cooldowns, and print their faction effects on the card ([Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6))).
5. **The election speech is a builder**: acknowledge a problem, praise a faction, blame a superpower, promise an improvement. **A promise becomes a task for the next term** ([Election Speech](https://tropico.fandom.com/wiki/Election_Speech_(Tropico_6)), [GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)).
6. **The Broker turns corruption into a spending menu**: rotating offers (4 to 8 slots a year; refresh S$2,500; lock S$500). "Convincing Talk" completes a demand, "Stage a Distraction" bypasses an ultimatum, "Image Campaign" (S$7,500) buys trust, and you can amend the constitution outside the normal window ([The Broker](https://tropico.fandom.com/wiki/The_Broker)).
7. **Era gates are explicit and sometimes give a choice of path.** Colonial era: a mandate timer that you extend by doing Crown tasks, and independence needs 60 % Revolutionaries (then you pay or fight). World Wars to Cold War: you must ally with a bloc. Cold War to Modern: **pick one of three paths** (diplomatic landmark, nuclear, tourism) ([GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003), [Twinfinite](https://twinfinite.net/guides/tropico-6-modern-times-how-get-to/)).
8. **Replayability comes from the setup screen.** A random map generator with a seed and a shareable code. Six difficulty sliders with four steps each (foreign aid, Caribbean happiness, political, opposition, disasters, pirates). Start era, start money or unlimited money, start population. Custom win conditions. One leader trait from 12 ([Steam: difficulty mapping](https://steamcommunity.com/app/492720/discussions/0/3273561484340889214/), [Steam: map codes](https://steamcommunity.com/app/492720/discussions/0/1815422173028263514), [Customization](https://tropico.fandom.com/wiki/Customization_(Tropico_6))). In Tropico 4, the setup difficulty was also a **final-score multiplier** ([Steam T4](https://steamcommunity.com/app/57690/discussions/0/1761356057427290929/)).
9. **The UI is a fixed bottom action bar** of 12 labelled entry points in a stable order, a task list always on screen, a status block with a recent-events feed, and one Almanac with 8 tabs that is the "why" screen for everything ([GamePressure: Interface](https://www.gamepressure.com/tropico-6/interface/zcc027), [Almanac](https://www.gamepressure.com/tropico-6/almanac/z8c04a)).
10. **What players complain about**: "a million different menus" ([Windows Central](https://www.windowscentral.com/tropico-6-pc-review-hilarious-city-building-simulator-surprising-amount-depth)), raids hidden "down the back of the interface's sofa" ([RPS](https://www.rockpapershotgun.com/tropico-6-review)), an economy that is hard to diagnose ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review), [GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review)), "zero feedback about what I'm supposed to do" ([Steam](https://steamcommunity.com/app/492720/discussions/0/4371376043391135554/)), a confusing order of goals in the Colonial era ([Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173027728283/)), request spam ([GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review)) and a single recorded line per speech topic ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).

---

## 1. Factions

### 1.1 Roster, eras, leaders, opponents and ultimatums (Tropico 6)

Ten factions. Only those relevant to the current era are active: Royalists and Revolutionaries in the Colonial era; 4 from World Wars on; +2 in the Cold War; +2 in Modern Times ([Politics (Tropico 6)](https://tropico.fandom.com/wiki/Politics_(Tropico_6)), [GamePressure: Factions](https://www.gamepressure.com/tropico-6/fractions/zdc028)).

| Faction | From era | Leader (voiced) | Opponent | Likes / dislikes (short) | Ultimatum if you fail (lasts 1 year) |
|---|---|---|---|---|---|
| Royalists | Colonial only | Lord Roger Wyndham | Revolutionaries | trade power and Crown control / rebellion, welfare | (no ultimatum listed; in the Colonial era an unhappy Crown shortens your mandate, per [Game Overs (Tropico 5)](https://tropico.fandom.com/wiki/Game_Overs_(Tropico_5))) |
| Revolutionaries | Colonial only | Sofia Ortega | Royalists | education, support for the people, military to defend ideals / Crown wealth | — |
| Capitalists | World Wars | Mason Belmonte | Communists | high-margin buildings, cost-cutting tools / welfare, investment without payoff | **Financial Crisis**: all money costs ×2, trade prices ×0.5, Broker conversion ×0.5 |
| Communists | World Wars | Marco Moreno | Capitalists | public housing, jobs, education, transport / tools for the rich, luxury buildings | **Strike**: workers strike for a year (fire stations and military excepted) |
| Religious | World Wars | Sister Francesca | Militarists | faith, food, health, shelter, peace / excess, alcohol, war, progressivism | **Anathema**: visits to churches cost approval; zealots may set buildings on fire |
| Militarists | World Wars | General Rodriguez | Religious | security, military strength / "unimportant" topics (education, welfare, environment) | **Coup**: dissatisfied soldiers and rebels assault the Palace; game over if they win |
| Environmentalists | Cold War | Sunny Flowers | Industrialists | renewables, parks, anti-pollution / extractive, polluting | **Eco-Protests** at industry, production and dirty power plants |
| Industrialists | Cold War | Harland Zander | Environmentalists | every industrial building / welfare and environment | **Maximum Exploitation**: production pollution ×2, job quality capped at 10, workers lose health |
| Conservatives | Modern | Hector Delgado | Intellectuals | tradition, security, "Tropico first" / progressive tools | **Recall Elections**: forced early election plus a smear campaign |
| Intellectuals | Modern | Elena Culpepper | Conservatives | science, education, liberty, globalism / religious and military tradition | **Hacking Attack**: lose all knowledge and Swiss money, tourist rating 0, no Broker for a year |

Sources: the individual faction pages, e.g. [Capitalists](https://tropico.fandom.com/wiki/Capitalists_(Tropico_6)), [Communists](https://tropico.fandom.com/wiki/Communists_(Tropico_6)), [Religious](https://tropico.fandom.com/wiki/Religious_(Tropico_6)), [Militarists](https://tropico.fandom.com/wiki/Militarists_(Tropico_6)), [Environmentalists](https://tropico.fandom.com/wiki/Environmentalists_(Tropico_6)), [Industrialists](https://tropico.fandom.com/wiki/Industrialists_(Tropico_6)), [Conservatives](https://tropico.fandom.com/wiki/Conservatives_(Tropico_6)), [Intellectuals](https://tropico.fandom.com/wiki/Intellectuals_(Tropico_6)), [Royalists](https://tropico.fandom.com/wiki/Royalists_(Tropico_6)), [Revolutionaries](https://tropico.fandom.com/wiki/Revolutionaries_(Tropico_6)).

Each faction page also lists its **constitutional stances** (which constitution option it likes or hates), **edict stances** and **building likes and dislikes** by category. The Capitalists, for example, like the Bank and the Off-shore Office and dislike the Metro and the Bus Garage. That makes faction reactions predictable once you know the lists.

Tropico 3/4 predecessors: 8 factions including **Nationalists** and **Loyalists** (a personality cult led by Penultimo). Each had a **faction disaster** when relations fell too low: Capitalists skim export income, Communists import foreign rebels, Intellectuals stage student walkouts (no graduations), Religious anathema, Militarists give a **2-year coup ultimatum**, Environmentalists blockade one factory (wages still paid, no output), Nationalists riot, Loyalists drift away ([Faction (Tropico 3 and 4)](https://tropico.fandom.com/wiki/Faction_(Tropico_3_and_4))).

### 1.2 How membership works: axes and intensity

- Factions sit on **4 axes**, each unlocked by an era: Capitalists–Communists, Religious–Militarists, Environmentalists–Industrialists, Conservatives–Intellectuals. A citizen can belong to several factions but **only one side of each axis**. A player describes it as answering one survey statement per issue, from "strongly agree" to "strongly disagree" ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/4632610189255705566/), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- Three intensities: **moderate, strong, die-hard**. Intensity multiplies how much the faction's standing moves that citizen's approval. Die-hards are rarely undecided and **sway undecided family members** on election day. Moderates and strong supporters can be flipped by propaganda; **die-hards cannot** ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- With no propaganda, membership follows roughly a normal distribution: two sides of similar size, a neutral middle, most members moderate ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- Propaganda tools, each with a **25 % chance to shift orientation**:
  - Newspaper work mode: residents nearby, each time they rest.
  - Radio: workers nearby, each time they work.
  - TV: electrified homes nearby.
  - Movie theatre: visitors.
  - In the Colonial era, the Newspaper's "The Independent" mode pushes citizens towards the Revolutionaries.
  - Sources: [Newspaper (Tropico 6)](https://tropico.fandom.com/wiki/Newspaper_(Tropico_6)), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108).
- Removing die-hards takes personal actions: Institutionalize (wipes political orientation), Kill, Arrange Accident. Or steal the Brandenburg Gate wonder, after which **nobody can be die-hard** ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [GamePressure: Raids](https://www.gamepressure.com/tropico-6/raids/zac007)).
- Ministers can also shift people. A Religious Minister of Education turns graduates Religious at the cost of 10 % school efficiency ([Religious](https://tropico.fandom.com/wiki/Religious_(Tropico_6)), [Ministry](https://tropico.fandom.com/wiki/Ministry_(Tropico_6))).

### 1.3 Requests: demand, dual demand, ultimatum, Audience

- **Demand**: a faction leader asks for something, usually a cheap building, an edict or a constitution change. Players report "**demands do not time out like ultimatums do and you will never have two demands from the same faction at the same time**". Completing one gives about **+5 standing** ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/), [Steam thread](https://steamcommunity.com/app/492720/discussions/0/4371376043391135554/), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- **Dual Demand**: two factions ask at the same moment, "**even if their request is the same**". You lose standing with the rejected one; **dismissing both angers both**; after you choose, it becomes a regular demand. The in-game hint: "Check the current standing and the number of supporters of both factions in the Almanac before committing." Each pairing has a short **two-voice banter** (for example Belmonte vs Moreno, or Zander vs Flowers) ([Dual Demands](https://tropico.fandom.com/wiki/Dual_Demands_(Tropico_6))).
- **Ultimatum**: triggered by low standing. It comes with a countdown (one player saw "2000 days"), and failing it applies the faction's specific one-year effect (table above). Example: an Environmentalist ultimatum asked for the "Zero Emissions" constitution clause right after the player entered the Cold War. Declining brought protests everywhere; caving cost "a big economic hit for a long period" ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/)). Players say the punishment should scale with the faction's size: "having your entire island crash and burn because 10 % of the population is upset isn't realistic" ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/3828662280423329868/)).
- **Audience edict**: $1,000, cooldown 12 months. It triggers one demand from each of the **three factions with the lowest standing** (skipping any faction that already has one). It is a tool to *pull* chances to recover instead of waiting ([Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6))).
- Crown and superpower tasks interact with factions. Doing Crown tasks lowers standing with the Revolutionaries ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/4632610189255705566/)).
- **Reward choice**: Revolutionary tasks let you **choose the reward**. Experienced players take "10 revolutionary immigrants" over money or a blueprint ([Twinfinite](https://twinfinite.net/guides/tropico-6-revolutionary-immigrants-revolutionaries-how-get-more/), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- In Tropico 4, quests were **exclamation-mark boxes over buildings** (Palace, churches, factories) that gave standing or cash in the sandbox. In the campaign they pointed to the next mission step ([DualShockers T4 review](https://www.dualshockers.com/review-tropico-4/)). Tropico 4 also had **tiered quests** ("raise food quality to 50 %, 70 % and finally 90 %, each for a bigger reward") and **mutually exclusive offers** (Religious statue vs Environmentalists) ([Missions (Tropico 4)](https://tropico.fandom.com/wiki/Missions_(Tropico_4))).

Complaints: requests "pop in" while you are focused on the main goal, "in certain scenarios the requests just have you building things you already own" ([GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review)). One player was "swarmed" by Environmentalist demands about once a month ([Steam](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/)).

### 1.4 Faction leaders and personal actions

- Faction leaders are real citizens. You find them under Almanac → People → special people and act on them: Bribe (**$3,000**: the citizen walks to the Palace to collect a suitcase "with your portrait on the money"), Arrest (**$25**, needs a prison), Institutionalize ($25, needs an asylum; a leader's moderates may turn indifferent), Kill ($150, firing squad; family and witnesses turn hostile and may become rebels), Arrange Accident (**$500**, needs a Ministry of Information; no backlash but slow) ([Special Action](https://tropico.fandom.com/wiki/Special_Action_(Tropico_6)), [GamePressure: approval](https://www.gamepressure.com/tropico-6/how-to-increase-the-approval-rating/z1c185)).
- The constitution changes these actions. "No Separation" makes them 90 % cheaper. "Official Separation" requires a courthouse and sends 20 % of the cost to your Swiss account. "True Separation" forbids them except bribes ([Constitution (Tropico 6)](https://tropico.fandom.com/wiki/Constitution_(Tropico_6))).
- **Ministers** (Ministry: blueprint $8,000, build $16,000, upkeep $10 + $60 per minister). Five departments: Education, Defense, Economy, Foreign Affairs, Interior. Each slot offers candidates from different factions, each with a different bonus, e.g. a Communist Economy minister gives −7 % residential cost and an Environmentalist Foreign Affairs minister gives +5 tourism. **A minister gives +2 standing with their faction; firing one costs $2,000. The Broker's crony instead pays S$75–100 a month into your Swiss account** ([Ministry (Tropico 6)](https://tropico.fandom.com/wiki/Ministry_(Tropico_6))). In Tropico 4, ministers had stats; low stats caused **gaffes** where you either fired them or ate the consequence, and many edicts required the relevant minister ([Ministry (Tropico 4)](https://tropico.fandom.com/wiki/Ministry_(Tropico_4)), [Edicts (Tropico 4)](https://tropico.fandom.com/wiki/Edicts_(Tropico_4))).
- Tropico 7 (due 28 January 2027) adds a **Council** where you "charm, manipulate or simply ignore" faction leaders face to face, and a political-alignment system that **unlocks different edicts depending on your style** ([TheSixthAxis](https://www.thesixthaxis.com/2026/09/01/el-prez-announces-that-tropico-7-will-release-january-28th/), [gaming.net](https://www.gaming.net/tropico-7-everything-we-know/)).

**Para Tenfe**
- Turn our 4 groups into **2 axes of opposed pairs**, plus 1–2 axes unlocked by stage:
  - Trabajadores (sindicatos) ↔ Economía (Hacienda, "los del Excel").
  - Territorios (España vaciada) ↔ Viajeros AVE (lobby de las capitales).
  - Later: Ecologistas ↔ Constructoras/fabricantes (KAFKA, Tardo, Malstom…).
  - Later: Liberalizadores (Bruselas) ↔ Proteccionistas («Tenfe es de todos»).
- Each pair has a leader with a portrait (we already have the characters). Every measure and every work shows **+X / −Y on the two sides** before you confirm it.
- Requests: 1 open demand per group with no deadline (+5 on completion). A dual demand when two rivals ask at once, with a two-voice dialogue. An ultimatum with a 13-week countdown and a 52-week punishment unique to each group:
  - Sindicatos: «huelga indefinida», a strike lasting several weeks.
  - Hacienda: «intervención», costs ×1.5.
  - Territorios: «moción en el Congreso», early elections.
  - Ecologistas: works paralysed by protests.
  - Constructoras: works slowed down.
- Scale the punishment with the group's weight, which answers the Steam complaint.
- An «Audiencia» measure (1 order; 52-week cooldown) that asks the 3 worst-treated groups for a demand.

---

## 2. Approval and voting: the actual model

Per citizen, Almanac → click a citizen ([Steam guide «Guide to political support»](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)):

1. **Faction influence**: the average over the up to 4 factions the citizen belongs to, weighted by intensity. Players find this "made up most of his approval" ([Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/)).
2. **Relative happiness**: the citizen's own happiness minus **Caribbean happiness**, a regional benchmark that **rises over the game** (it can reach 80 by Modern Times). Example from the guide: your 60 against the Caribbean's 80 means an average −20 for every citizen, and you become "unelectable". The Almanac Happiness tab graphs yours against the Caribbean's. A Commando raid, "Intimidate Neighbours" (2,000 raid points, about 18 months), lowers Caribbean happiness by 5 % ([Steam Happiness guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3317408271), [GamePressure: Raids](https://www.gamepressure.com/tropico-6/raids/zac007)). The "Caribbean Trade Pact" edict raises it quickly, which is a trap ([Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/)).
3. **Personal experience**: mostly punishment. Election fraud costs about −10, **cancelling elections about −20**, and these "usually take around 2 terms to decay". Broker "Image Campaign" (S$7,500) gives +10, Tax Cut a temporary boost ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)). Martial Law cuts every voter's personal experience by 15 ([Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6))).

- Happiness is the mean of 8 factors: food (variety), healthcare, fun (by wealth class), faith, housing, job quality, liberty and crime safety. Fire and healthcare matter from World Wars, crime and liberty from the Cold War, pollution later ([GamePressure: Happiness](https://www.gamepressure.com/tropico-6/happiness-and-approval/zbc04d), [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003)).
- Approval also "reflects the financial condition of the state. You can't get into debt" ([GamePressure: approval](https://www.gamepressure.com/tropico-6/how-to-increase-the-approval-rating/z1c185)).
- Unhappy citizens **protest**: you negotiate, comply or use force. They may become **rebels**, then **guerrillas**, who attack infrastructure; the Almanac Conflicts tab shows the rebel threat. "Pacifist State" cuts rebel build-up by 75 % ([GamePressure: Happiness](https://www.gamepressure.com/tropico-6/happiness-and-approval/zbc04d), [Steam: Rebel guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3376587532)). The Tropico 5 rebel threat table had 5 levels: none, low (14 rebels, 15 % uprising chance), medium (20, 1 leader, 30 %), high (26, 2 leaders, 45 %), very high (33, 4 leaders, 60 %, attacks the Palace). Threat goes up after kill orders, denied or cheated elections, Caribbean happiness above yours, or more than $100k in the treasury ([Rebel Mechanics (Tropico 5)](https://tropico.fandom.com/wiki/Rebel_Mechanics_(Tropico_5))).

**Para Tenfe**
- Our support formula already has groups and causes. Add two things.
- **A rising European benchmark** («media europea»): punctuality and satisfaction of a parody SNCF/DB/Trenitalia that climbs every year. Support depends on *your value minus the benchmark*. This keeps pressure on until the end of the game without random events.
- **A «confianza personal» track**: −20 for postponing elections, −10 for «pucherazo» or for a scandal proven in court, +10 for an image campaign. It decays over about 100 weeks.
- The Elections page shows the three parts as bars with their causes, so the player never feels support is "random".

---

## 3. Edicts

**Structure** ([Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6))):
- They are unlocked through research with knowledge points (yellow research icon), are gated by era, and can be bought half price from the Broker.
- **Three ranks that improve while you keep the edict active**: 0, 1 and 2 stars. Positive effects grow and negatives shrink.
- Cost models:
  - one-off cost;
  - monthly upkeep (Military Police $500/400/300; Free Wheels $1,000/900/750; Employee of the Month $350/250/225; Speedway $600/450/350);
  - per head (Tax Cut $5 per employed citizen; Compulsory Vaccination $3 per citizen per month; Assembly Ban $1 per citizen per month);
  - fixed duration plus cooldown (Urban Development: runs 5 years, cooldown 5);
  - single-use (Nuclear Testing, Light Bulb Ban).
- Every edict has a satirical **"Penultimo says"** paragraph explaining it in character.

| Edict (era) | Cost | Effect (abridged) | Factions |
|---|---|---|---|
| Food for the People (Col.) | $500 | 2 food units per meal; food quality +10/12/15 % | Cap −10, Com +5 |
| No Free Lunch (Col.) | $500 | citizens pay $1/2/3 per meal; broke citizens can't eat | Cap +10, Com −5, Rel −5 |
| Free Housing (Col.) | $500 | no rent | Cap −15/12/10, Com +10/12/15 |
| Urban Development (Col.) | $7,500 | residential construction −50 % for 5 years; cooldown 5 | — |
| Penal Colony (Col.) | free | immigration +50–60 %; criminal chance ×3; you are paid $100–300/month | — |
| Employee of the Month (Col.) | $350–225/month | mines and industry work double shifts | — |
| Audience (WW) | $1,000 | demands from the 3 lowest factions; cooldown 12 months | — |
| State Loans (WW) | $0 | +$50,000 now, repay $80,000 as $6,667/month for 10 years; cooldown 10 years | — |
| Building Permit (WW) | $1,500 | construction +20/18/15 %; 2/3/4 % of it goes to Swiss | Com −10 |
| Wealth Tax (WW) | $2,500 | +$5/6/7 per rich adult per month | Cap −20, Com +15 |
| Early Elections (WW) | $2,000 | election in 12 months, **no speech allowed** | — |
| Martial Law (WW) | $7,500 | cancels elections; liberty −35/30/25; rebel chance +15 %; tourism −30 % | Mil +30, **all others −15** |
| Right to Arms (WW) | $2,500 | liberty +15–20, crime safety −10…−5 | Mil −, Ind +, Cap + |
| The Tropico Papers (WW) | $5,000 | filthy-rich pay no rent; 15 % of it goes to your Swiss account; media modes punish it | — |
| Nuclear Testing (CW) | $0 | **+$100,000 once**; all factions −15 | all −15 |
| Tax Cut (CW) | $5 per worker | approval of everyone up; cooldown 5 years | — |
| Diplomatic Superparty (CW) | $20,000 | +20 with every superpower; cooldown 5 years | — |
| Experimental Ground Treatment (CW) | $5,000 | S$200 per industrial building; pollution +10 % | Env −10, Ind +10 |
| Alternative Food Source (CW) | $2,000 | nobody starves for 2 years; cooldown 4 | — |
| Happy Meat (CW) | $1,500 | ranch efficiency −15…−10 %, export price +10–15 % | Env +15–20, Ind −10 |
| Contraception Ban (Mod) | $1,000 | births +60–70 % | Int −20, Rel +25 |
| Policy of Detente (Mod) | $5,000 | 50 % of rebels quit; cooldown 5 years | Con −15 |
| Caribbean Trade Pact (Mod) | $15,000 | new export route per partner; **Caribbean happiness +15 %** | Cap +10 |
| Tax Haven (Mod) | $10,000 | offices +15–25 % revenue | every superpower −15…−10 |

Tropico 4 organised edicts **by ministry** (General, Education, Foreign Affairs, Economy and Tourism, Interior, Defense). Many required an appointed minister. It also had memorable satirical one-shots: **Print Money** (+$20,000 but permanent +30 % prices, at most 5 uses), **Book BBQ**, **Off to Florida!** (deport prisoners to the US, permanent US malus) and Tropico 3's **Kill Juanito** (silence the annoying radio DJ) ([Edicts (Tropico 4)](https://tropico.fandom.com/wiki/Edicts_(Tropico_4)), [Juanito](https://tropico.fandom.com/wiki/Juanito), [Superpowers](https://tropico.fandom.com/wiki/Superpowers)).

Criticism: some players find Tropico 6 edicts "minimal" or underwhelming ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/598519066984987061)). The ones that matter change approval or politics.

**Para Tenfe: «Medidas» (decrees)**
- Same card on every measure: cost (one-off / weekly / per traveller), effect, stars (0★, 1★, 2★ after 13 and 26 weeks active), cooldown, group effects, and a one-line quip by an advisor (voiced, several variants). Examples:
  - **Abono gratuito**: cost per weekly traveller; viajeros +, Hacienda −; ridership +10/15/20 %.
  - **Préstamo del Estado** (State Loans): +500 M€, repay 800 M€ over 104 weeks; cooldown 208 weeks.
  - **Servicios mínimos del 90 %**: sindicatos −, viajeros +.
  - **Devolución por retraso**: cost depends on punctuality.
  - **Comisión de investigación**: lowers a scandal but costs confianza personal.
  - **Elecciones anticipadas**: 12 weeks, no speech.
  - **Estado de alarma ferroviario** (Martial Law parody): cancels the election; liberty and trust collapse.
  - **Imprimir billetes** (Print Money parody): +cash, permanent +costs.

---

## 4. Constitution

([Constitution (Tropico 6)](https://tropico.fandom.com/wiki/Constitution_(Tropico_6)), [GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4))

- Available after independence. **4 paragraphs per era; 2 unlocked, 2 need research** (red research icon). Each paragraph has **3 options**, usually a "default" in the middle and two extremes. Laws "can be changed once a few years". The Broker sells "Amend Constitution" to change them outside the window ([The Broker](https://tropico.fandom.com/wiki/The_Broker)).
- Paragraphs:
  - Voting Rights: All / **Wealthy** (well-off and above; broke and poor more likely to rebel) / **Open Ballot** (government employees always vote for you; those under 45 % approval may turn rebel).
  - Armed Forces: Pacifist (military disabled; rebel build-up −75 %; superpowers +10) / Militia / Professional (+10 % damage; Militarists +10).
  - Religion and State: Theocracy / Freedom / Atheist (+50 % research efficiency).
  - Labor: A Life's Work / Happy Childhood / Early Retirement.
  - Ecology: Zero Emissions (industry pollution −75 %, efficiency −10 %) / Energy Efficiency / Economy First (+10 % efficiency, +50 % pollution).
  - Separation of Powers: No Separation / Official / True.
  - Emigration: Love it or Leave it / Free / Best Country on Earth.
  - Media: State-controlled (propaganda ×2) / Free / Sponsored (+100 % media revenue).
  - Personal Rights: Total Surveillance / Security / Privacy.
  - Healthcare: Paid (+20 % efficiency) / Single-payer / Hybrid.
  - Marriage: Open / Traditional / Forced.
  - Global Market: Protectionism (no trade routes, +5 % export price) / Free Trade / International Partnership.
- Every option has a mechanical effect **and** faction stances (see the faction pages). Some are elegant **opt-outs**. RPS liked that "you can turn all conflict off with in-game policy decisions … so it doesn't even feel like the cheat that flicking a 'no mean men' menu option would" ([RPS](https://www.rockpapershotgun.com/tropico-6-review)).
- Tropico 5 changed which factions approve of an option **by era** ("gender-based voting discrimination may be more acceptable … during the World Wars … much less in Modern Times") ([Faction (Tropico 5)](https://tropico.fandom.com/wiki/Faction_(Tropico_5))).

**Para Tenfe: «Estatuto de Tenfe»**
- 2 paragraphs per stage, 3 options each, changeable every 52 weeks (or at once through the «Conseguidor»). For example:
  - **Modelo laboral**: convenio blindado / convenio / subcontratas.
  - **Tarifas**: social / plana / dinámica.
  - **Prioridad en la red**: AVE primero / mercancías / regionales.
  - **Transparencia**: opacidad (cloacas cheaper, scandals worse) / auditoría / portal abierto (cloacas disabled, +confianza). This is a coherent opt-out of the corruption subsystem, like Pacifist State.
  - **Ancho**: ibérico / mixto / estándar europeo (Bruselas +, gauge works cheaper).
  - **Liberalización**: monopolio / licencias / competencia total (rivals arrive earlier, Bruselas +).

---

## 5. Elections, speeches and rigging

- **Cadence**: "Every 10 years the people will ask for elections." You can hold them or refuse. Refusing "directly affect[s] all your voters on a personal level" ([Election Speech (Tropico 6)](https://tropico.fandom.com/wiki/Election_Speech_(Tropico_6))). GamePressure: ignoring the call "is a path of no return … frequently making it impossible to fix the loss" and raises coup risk ([GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)). One player who skipped elections three times sat at about 17 % support ([Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173031233898/)).
- **Other entry points**: the Early Elections edict ($2,000; vote in 12 months, no speech), the Conservatives' "Recall Elections" ultimatum, and Martial Law, which cancels elections ([Edicts (Tropico 6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6)), [Conservatives](https://tropico.fandom.com/wiki/Conservatives_(Tropico_6))).
- **The speech is a five-part builder.** You pick one option in each slot and El Presidente delivers it with voice ([Election Speech (Tropico 6)](https://tropico.fandom.com/wiki/Election_Speech_(Tropico_6))):
  1. **Prologue** (flavour).
  2. **Acknowledge issue**: one of 8 happiness factors, e.g. "Roofs for all, and walls for many!" The Tropico 6 wiki says it "does not contribute"; in Tropico 4, citizens angry about the acknowledged problem **stopped counting it against you** ([Election](https://tropico.fandom.com/wiki/Election)).
  3. **Praise faction**: temporary standing boost; +10 in Tropico 4.
  4. **Blame superpower**: more voter approval, **worse relations** with that power.
  5. **Promise improvements**: undecided voters most unhappy about that factor vote for you. **If you win, the promise becomes a task for the next term** ([GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)). Breaking it makes voters "angry … and will likely vote against them" ([Election](https://tropico.fandom.com/wiki/Election)).
  6. **Epilogue**, plus situational lines (if you own a wonder, just entered a new era, or just crushed rebels).
  - The "Manipulative" trait makes praise +50 % ([Customization](https://tropico.fandom.com/wiki/Customization_(Tropico_6))).
- **Advice from the guides**: "Always praise large factions, avoid blaming superpowers and point current problems. However, avoid promising improvement of factors that you cannot improve" ([GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)). IGN promised "more fun" and then needed "a nightclub on every block" to meet the threshold ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).
- **Rigging**: you can "let the votes speak for themselves or … manipulate the vote after the fact" ([Game Informer preview](https://www.gameinformer.com/games/tropico_6/b/xboxone/archive/2017/06/15/el-presidentes-triumphant-return.aspx)). Fraud costs about −10 personal experience ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)) and raises the rebel threat (Tropico 5 table). In Tropico 3/4, "the electoral tribunal" offered rigging only when you were losing, at the cost of Intellectual relations and lower democratic expectations ([Election](https://tropico.fandom.com/wiki/Election)). Tropico 5 had no speech; instead you could **Discredit** the rival candidate, which can backfire ([Election](https://tropico.fandom.com/wiki/Election)).
- **Narrowing the electorate** is a strategy: "Wealthy citizens vote" or "Open ballot" ([Steam](https://steamcommunity.com/app/492720/discussions/0/1771511442698758441/)). One player went from 1 % to 90 % with constant "Intimidate Neighbours" raids plus wealthy-only voting ([Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173031233898/)).
- **Losing** means game over: Tropico 5 needed 51 %, and Penultimo tells you to leave the keys under the mat ([Game Overs (Tropico 5)](https://tropico.fandom.com/wiki/Game_Overs_(Tropico_5))).
- **Complaint**: only one recorded line per speech option ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).

**Para Tenfe: «Mitin» or «Comparecencia» before the vote (weeks 200–207)**
- Four slots, each showing its effect before you pick it:
  - **Reconocer un problema**: puntualidad, averías, precios or cierres. Removes that cause from the support calculation of the group that suffers it.
  - **Elogiar a un grupo**: +6 for 26 weeks.
  - **Culpar a un tercero**: Adif-parody, Bruselas, el tiempo or el gobierno anterior. +support, −relation with that third party.
  - **Prometer**: the promise becomes a pact-like task with a deadline at the next election. Breaking it costs −10 confianza.
- Postponing the election through «estado de alarma» costs −20 confianza, decaying over about 100 weeks. The «pucherazo» option appears only if you are losing; it costs −10 confianza, opens a cloaca and Bruselas reacts.
- Record 3–4 variants per option.

---

## 6. Swiss bank account and the Broker

([The Broker](https://tropico.fandom.com/wiki/The_Broker), [Swiss Bank Account](https://tropico.fandom.com/wiki/Swiss_Bank_Account), [GamePressure: Broker](https://www.gamepressure.com/tropico-6/the-broker/z9c006))

- Available from World Wars, in its own menu. The currency is **S$**. The Swiss balance **counts in the final score**: "an ex-presidente could potentially get a high score even if they were voted out or violently deposed". It is also a sandbox win condition.
- **Income sources**:
  - Broker requests: export X, run raid Y. One slot at first, up to 4 more for a price; **no penalty for rejecting**.
  - Broker cronies in the Ministry: S$75–100 a month.
  - Building Permit edict (2–4 % of construction); Experimental Ground Treatment (S$200 per industrial building); Customs Office "Special Tax"; bank slush funds; The Tropico Papers (15 % of filthy-rich rent).
  - Ancient Ruins "Unofficial Scavenging Site"; the "Sell the Data" upgrade of the Ministry of Information (S$25 per uncovered role).
  - Crime Lords' "Shady Deal" (S$100 a month each; "100 Crime Lords … can produce 10,000 S$/month").
  - Childhood Museum and Mausoleum donations; the Corrupt trait (+5 %).
  - Sources: the pages above, [Ministry of Information](https://tropico.fandom.com/wiki/Ministry_of_Information_(Tropico_6)), [Ancient Ruins](https://tropico.fandom.com/wiki/Ancient_Ruins_(Tropico_6)).
- **Offers**: up to 8 a year, starting with 4 slots and more for a rising price. **Refresh for S$2,500, lock one for S$500**.
  - Blueprint, edict or work mode at half price.
  - "Stimulate Trade": new trade route, S$500.
  - **"Inverse Lobby"**: +5–10 with one faction, S$5,000.
  - **"Not A Bribe"**: +5–10 with one superpower, S$5,000.
  - **"Image Campaign"**: approval of everyone up, S$7,500 (+10 personal experience per the Steam guide).
  - **"Convincing Talk"**: complete any demand without doing it, S$2,500; can be stockpiled.
  - **"Stage a Distraction"**: complete an ultimatum, S$2,500; can be stockpiled.
  - **"Amend Constitution"**.
- **Exchanges** at fixed rates (bigger amounts get better rates): cash, raid points, knowledge, or **college-educated immigrants** on the next ship.
- Player habits: "I buy every [Convincing Talk] as they pop up"; keep a Distraction "in my back pocket"; buy faction support only about **3 months before the vote** because "this support decays fairly quickly" ([Steam](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
- Design intent, from the producer: "The Swiss money is great for enhancements like completing faction demands immediately or triggering a campaign to boost El Presidente's image" ([Bleeding Cool interview](https://bleedingcool.com/games/interview-chatting-with-tropico-6-producer-martin-tosta/)). Eurogamer: "Here I've finally found a worthwhile incentive to manage my Swiss bank account" ([Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution)).
- **Lobbyistico DLC**: invite faction leaders into the "El Presidente Club" for perks. Lobby work raises **corruption**, which harms the economy and society if unchecked. A "Corruption Agency" fights it ("or … just try to cover everything up") ([GamingOnLinux](https://www.gamingonlinux.com/2020/07/tropico-6-gets-a-new-lobbyistico-adding-in-a-corruption-mechanic)).

**Para Tenfe**
- Merge the caja B into a **«cuenta en Andorra»** with its own currency (A€), scored at the end even if you lose.
- A character, «El Conseguidor», with a 4-slot offer board (+1 slot every 52 weeks; refresh 2.5 A€; lock 0.5 A€):
  - «Llamada al ministro»: completes a demand.
  - «Cortina de humo»: neutralises an ultimatum or a leak.
  - «Campaña de imagen»: +10 confianza.
  - «Lobby inverso»: +6 with a group.
  - «Real Decreto exprés»: changes the Estatuto outside its window.
  - Half-price measure or technology.
- **A visible risk meter** («sospecha»), like the Lobbyistico corruption, feeds our court phases.
- Rejecting the Conseguidor's own requests costs nothing.

---

## 7. Superpowers and foreign relations

- **Roster by era**: the Crown (Colonial); Axis and Allies (World Wars); Western Powers and Eastern Bloc (Cold War); USA, EU, China, Russia and the Middle East (Modern). Each has a voiced representative and an intro line ([Politics (Tropico 6)](https://tropico.fandom.com/wiki/Politics_(Tropico_6)), e.g. [The USA](https://tropico.fandom.com/wiki/The_USA_(Tropico_6))). Each has **building preferences near its embassy** (USA: luxury hotel, movie theatre, fast food; Eastern Bloc: cocktail bar, hotel, hospital, checkpoint), and "superpowers may request a building being built near their Embassy" ([Embassy](https://tropico.fandom.com/wiki/Embassy_(Tropico_6))).
- **Embassy actions** (inviting a power gives +5):
  - Praise: $5,000, +10, cooldown 24 months.
  - Send Delegation: $2,500, triggers one of their demands, cooldown 12.
  - **Ask for Financial Aid**: needs relation ≥71; $20,000 for −20 relation (none if allied), cooldown 36.
  - **Request Alliance**: needs ≥81. The alliance prevents conquest by another power; if relation drops below 81 the ally issues an ultimatum.
  - Expel: −10, only 60 months after inviting.
  - Source: [Embassy](https://tropico.fandom.com/wiki/Embassy_(Tropico_6)).
- **Escalation ladder**: "If your relations with a superpower drop to a very low value, you will receive a special task. Dismissing it will temporarily block your port. Then you will receive another special task. If you once again refuse … you will lose the game" ([GamePressure: Politics](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)). From World Wars on, a hostile power can invade, first hitting scattered buildings, then the Palace ([GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003)).
- **Other levers**:
  - Trade routes, priced as a % of market with a relation modifier shown when signing ([GamePressure: Finances](https://www.gamepressure.com/tropico-6/finances-and-trade/zbc008)).
  - The Diplomatic Superparty (+20 to all).
  - Tax Haven (−10…−15 to all).
  - **Off-shore Office**: host one company per power; that relation drops 2 a month up to 20, and each point lost earns $50 a month ([Off-shore Office](https://tropico.fandom.com/wiki/Off-shore_Office_(Tropico_6))).
  - Raids to sabotage a power, or steal its wonder, which brings a reputation hit ([GamePressure: Raids](https://www.gamepressure.com/tropico-6/raids/zac007), [PC Gamer](https://www.pcgamer.com/tropico-6-review/)).
- Tropico 3/4 **foreign aid** was automatic and capped by relation, and only paid while the treasury was under about $50,000. A difficulty % lowered the caps ([Foreign Aid (Tropico 3 and 4)](https://tropico.fandom.com/wiki/Foreign_Aid_(Tropico_3_and_4))).
- **Criticism**: superpowers are "little more than robotic points-trackers that can spit out a bunch of cash" with "no real sense that there's anyone real outside" the map ([RPS](https://www.rockpapershotgun.com/tropico-6-review)). Raids have "no major downside … goes entirely unremarked upon when said nation next gets in touch" ([PC Gamer](https://www.pcgamer.com/tropico-6-review/)). Coherence matters: a power should *remember* what you did.

**Para Tenfe: «Poderes externos» with a 0–100 relation**
- **Bruselas** (fondos, ERTMS, ancho estándar, liberalización).
- **Moncloa / Ministerio**: changes with the stage, and with the election.
- **Hacienda**.
- **Comunidades autónomas** as a bloc. Optional: a foreign operator as the "rival power".
- Actions: «Elogiar» (cost, +10, 104-week cooldown); «Delegación» (asks for one of their demands); «Pedir fondos» (≥71: +X M€, −20, cooldown 156); «Alianza» (≥81: protection, e.g. Bruselas blocks a hostile Hacienda intervention).
- The **escalation ladder** with readable steps: special task → refused → **funds frozen** or **sanction** → second task → refused → **intervention, game over**.
- Powers **remember**: dialogue references past betrayals («la última vez que te ayudamos…»), which keeps dialogue coherent.

---

## 8. Eras and research

| Transition | Requirement | What you choose | Sources |
|---|---|---|---|
| Colonial (start) | Governor with a **mandate timer**; it runs out = game over. **Crown tasks extend it** (players: "make sure you have at least 2 years left"; if a task is unwanted, "just cancel, another will appear"). | — | [Colonial Era](https://tropico.fandom.com/wiki/Colonial_Era_(Tropico_6)), [Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173027728283/) |
| → World Wars | Revolutionaries standing ≥50 % **and** ≥60 % of the population Revolutionary. Penultimo's "Just wondering…" task triggers it (after mission tasks, or at random in the sandbox; this comes from a search excerpt of an era guide). | **Buy independence ($15,000) or fight the Crown** (about 2 forts) | [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [AttackOfTheFanboy era guide (excerpt)](https://attackofthefanboy.com/?p=721536) |
| → Cold War | Ally with **Axis or Allies** (invite to embassy, raise relation, alliance task); then the other side attacks | which bloc | [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003) |
| → Modern Times | One of **three paths**: international landmark (diplomatic), nuclear (Nuclear Power Plant + Nuclear Program), or tourist paradise | which path | [Twinfinite](https://twinfinite.net/guides/tropico-6-modern-times-how-get-to/), [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003) |

- Each era **raises needs**: World Wars adds healthcare, fire, education, electricity and invasions; the Cold War adds tourism, crime and liberty, pollution and the Environmentalist–Industrialist axis; Modern adds the Conservative–Intellectual axis, renewables and luxury tourism. **Blueprints from earlier eras cost half** ([Era](https://tropico.fandom.com/wiki/Era), [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003)). Only the Colonial era has a time limit; "the other eras let you stay … as long as you want, and new mechanics are introduced gradually" ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).
- The **"Era Outline"** button opens a short description of the current era ([GamePressure: Interface](https://www.gamepressure.com/tropico-6/interface/zcc027)).
- **Research**: knowledge points come from Library workers (later the Research Lab) and **accumulate even if unspent**. Three research families with colour codes: constitution (red), edicts (yellow), building work-mode modifiers (green). Blueprints are **bought with money**, not researched; buildings that need one show a **blue icon** ([GamePressure: Research](https://www.gamepressure.com/tropico-6/technological-growth/zec029), [GamePressure: What's new](https://www.gamepressure.com/tropico-6/whats-new-in/z5c002)).
- Tropico 5 research had more than 40 technologies with prerequisites and a queue ([Research](https://tropico.fandom.com/wiki/Research)).
- **Complaint**: "I wish the game gave you the mission to claim independence before building teamster offices on the surrounding islands. It made this very confusing for the order" ([Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173027728283/)). One reviewer looped on an autosave in an unwinnable Crown export task ([Selectbutton](https://selectbutton.com/reviews/tropico-6-review)).

**Para Tenfe**
- Map our 5 stages onto Tropico eras:
  1. **Intervención** (rescate): a Hacienda/troika «mandato» countdown, extended by completing their tasks.
  2. **Salida del rescate**: requires ≥60 % support *and* paying off X, or a «plante» to Hacienda that triggers a confrontation event.
  3. **Liberalización**: rival operators enter; the Bruselas ↔ proteccionistas axis activates.
  4. **Modernización**: choose ally Bruselas or Moncloa.
  5. **Final stage, choose 1 of 3 paths**: Megaproyecto (e.g. Madrid–Lisboa or the Corredor Mediterráneo), Tren verde (everything electrified), or Salida a bolsa / privatización.
- An «Etapa» panel always states: what this stage adds, the exit conditions with progress bars, and the time left.

---

## 9. Random events, tasks and disasters

- **Task sources** (shown in the left task list): mission main goals; Crown, superpower and faction demands; Broker requests; Penultimo's optional tasks such as "Just wondering…" ([GamePressure: Interface](https://www.gamepressure.com/tropico-6/interface/zcc027), [AttackOfTheFanboy era guide (excerpt)](https://attackofthefanboy.com/?p=721536)). Eurogamer praises "the reliable hook that the game provides by giving you a set of new tasks just as you've gotten ahead of everything" ([Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution)).
- **Disasters**: drought, volcano, tornado, meteor shower, earthquake, thunderstorm. All of them cause fires. **You are warned just before, and some ask for a decision**: drought (give water to citizens or to industry), meteor (accept refugees from neighbouring islands), earthquake (damage depends on the solution you chose beforehand). **Relief money arrives afterwards** ([GamePressure: Disasters](https://www.gamepressure.com/tropico-6/natural-disasters/zcc04e)). Frequency is a sandbox slider; missions turn generic disasters off except scripted ones ([Missions (Tropico 6)](https://tropico.fandom.com/wiki/Missions_(Tropico_6))).
- **Economic events** (Llama of Wall Street DLC): random events with "positive, negative or mixed effects on global market situations, trade or production". Examples: "Greased with Arabian Oil" (tariff on goods traded with the Middle East and USA) and "The Brink of Chaos" (survival goods inflate). Penultimo's **Canal Uno Business News** comments when one ends ([Radio (feature)](https://tropico.fandom.com/wiki/Radio_(feature)), [GodIsAGeek review](https://www.godisageek.com/reviews/tropico-6-llama-of-wall-street-dlc-review/)).
- **People-driven events**: protests (negotiate, comply or force), crime lords offering "Shady Deals", uprisings and coups, guerrilla attacks on power plants and ministries ([GamePressure: Happiness](https://www.gamepressure.com/tropico-6/happiness-and-approval/zbc04d), [Swiss Bank Account](https://tropico.fandom.com/wiki/Swiss_Bank_Account), [Steam: Rebel guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3376587532)). Celebrities visit (Spitter DLC) ([EGM](https://egmnow.com/?p=8009)). The Ministry of Information's "Undercover Agents" upgrade **warns you about impending uprisings** ([Ministry of Information](https://tropico.fandom.com/wiki/Ministry_of_Information_(Tropico_6))).
- **Tropico 4 timeline events** (Modern Times expansion): historical events, **randomly generated per game but visible up to 10 years ahead** on a timeline, e.g. Oil Market Crash or Chernobyl. They are not "random" in the sense of the disaster toggle ([Timeline Event](https://tropico.fandom.com/wiki/Timeline_Event)).
- **Tropico 3 minor disasters** included Llama Flu (stops immigration for about 2 years) and World Economic Crisis (lower export prices for about 2 years) ([Disaster](https://tropico.fandom.com/wiki/Disaster)).

**Para Tenfe**
- Replace "a random breakdown 20 % of weeks" with:
  - (a) a **seeded calendar of known future events** visible 1–2 years ahead: «Huelga convocada para la semana 87», «Bruselas revisa el ERTMS en la 140», «Lowgo entra en el Sur en la 160», «Ola de calor prevista en julio».
  - (b) **warned disasters with a decision before they hit**. DANA: cortar preventivamente vs mantener servicio. Ola de calor: limitar velocidad vs riesgo. Robo de cobre: vigilancia vs seguro. Then «fondos de emergencia».
  - (c) **market events** (energy price, steel price for KAFKA/Tardo orders) announced by the Gaceta.
- Every event is caused by state the player can read, which keeps it coherent.

---

## 10. Replayability: setup, generation, goals, traits

### 10.1 Sandbox setup
- **Maps**: about 30 sandbox maps at launch per Eurogamer; "over 20 presets" per Selectbutton; later free updates added more ([Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution), [Selectbutton](https://selectbutton.com/reviews/tropico-6-review)).
- **Random map generator** fields: Size, Landmass, Plateaus, Islands, Main Island size, Climate, Climate Variation, Resources (up to "Filthy Rich"), **Seed**, and a short **share code** (e.g. `06J8SSF2S4V70`) that players post to compare maps ([Steam thread](https://steamcommunity.com/app/492720/discussions/0/1815422173028263514)). "The drier the less vegetation and the poorer the quality of the soil" ([GamePressure: Missions](https://www.gamepressure.com/tropico-6/general-information-about-missions/z2c186)).
- **Difficulty sliders** (4 steps each; mission easy, normal and hard map onto them) ([Steam](https://steamcommunity.com/app/492720/discussions/0/3273561484340889214/), [Missions (Tropico 6)](https://tropico.fandom.com/wiki/Missions_(Tropico_6))):

| Slider | Steps | Mission Easy / Normal / Hard |
|---|---|---|
| Foreign aid | plenty / fair / symbolic / none | plenty / fair / none |
| Caribbean happiness (the benchmark) | weak / moderate / average / strong | weak / average / strong |
| Political (faction demands) | forgiving / fair / demanding / aggressive | forgiving / fair / aggressive |
| Opposition (election rival) | friendly / reluctant / moderate / strong | friendly / reluctant / strong |
| Disasters | none / rare / occasional / frequent | none (scripted only) |
| Pirates | off / cabin boy / skipper / Captain Blackbeard | cabin boy / skipper / Blackbeard |

- **Starting conditions**: start era, starting money (including unlimited), starting population. Tropico 5 sandboxes also let you pick the win type: points, money, or a building ([AttackOfTheFanboy, via search excerpt](https://attackofthefanboy.com/guides/tropico-6-how-to-set-up-a-sandbox-game/), [Game Types (Tropico 5)](https://tropico.fandom.com/wiki/Game_Types_(Tropico_5))). Tropico 6 has a **max citizen cap** option ([Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/)).
- **Win conditions are customisable**, e.g. "win by attracting a large number of tourists while having an extremely large bank account" ([TheSixthAxis](https://www.thesixthaxis.com/?p=332973)); also reach an era, money, Swiss balance, or play endless.
- **Tropico 4**: each setup has a **difficulty percentage that multiplies the final score** ("maps the game considers more difficult give you a higher multiplier"); foreign-aid caps also drop with the % ([Steam T4](https://steamcommunity.com/app/57690/discussions/0/1761356057427290929/), [Foreign Aid](https://tropico.fandom.com/wiki/Foreign_Aid_(Tropico_3_and_4))). Players like being able to tune "from a weaker/stronger world economy, to a more or less fractious populace, to a de facto god mode" ([MatchstickEyes on T4](https://www.matchstickeyes.com/2012/02/06/tropico-4-the-ingredients-of-a-successful-caribbean-holiday/)).

### 10.2 El Presidente traits (choose one at creation)
([Customization (Tropico 6)](https://tropico.fandom.com/wiki/Customization_(Tropico_6)))
- **Apologetic**: −50 % standing penalty for rejecting demands.
- **Charismatic**: +2 with every faction and superpower.
- **Corrupt**: +5 % on Swiss payments; the Palace lowers crime safety by 30.
- **Manipulative**: speech praise +50 %; aid penalty −25 %.
- **Pyromaniac**: 5 % fire chance on visited buildings; fire stations +25 %.
- **Savant**: +1 knowledge and +1 raid point a day.
- **Soft-Hearted**: no deadly actions; rebels very likely to give up.
- **Spatial Sense Prodigy**: +5 % capacities.
- **Workaholic**: +1 % efficiency, −2 job happiness.
- Plus Seductive, Compulsive Hoarder and Kind of Normal (no effect). DLCs added Narcissist, Polarizing and All For The Folk.
- Eurogamer: traits are "helpful without making things overly easy" ([Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution)). Tropico 6 **dropped Tropico 5's Dynasty system** (up to 7 family members with levelled traits) because "players didn't understand how to use the system and it robbed them of the relation with El Presidente" ([Dynasty](https://tropico.fandom.com/wiki/Dynasty), [Bleeding Cool](https://bleedingcool.com/games/interview-chatting-with-tropico-6-producer-martin-tosta/)). Lesson: **one leader, one trait**, not a roster.

### 10.3 Missions as an anthology of rule twists
- 15 standalone missions (no linked campaign), narrated by Penultimo as past adventures, unlocked by completing a number of earlier ones. The selection panel shows the map, title, description, **era**, **custom rules** and difficulty ([Missions (Tropico 6)](https://tropico.fandom.com/wiki/Missions_(Tropico_6)), [GamePressure: Missions](https://www.gamepressure.com/tropico-6/general-information-about-missions/z2c186)).
- Examples: **Shackland** bans all housing except shacks; another mission has no arable land and you live off fish, oil and tourism; a pirate mission has no resources so you loot ([Bleeding Cool](https://bleedingcool.com/games/interview-chatting-with-tropico-6-producer-martin-tosta/), [IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review), [PC Gamer](https://www.pcgamer.com/tropico-6-review/)).
- PC Gamer: "often the Tropico series is at its best during the campaign missions, where specific requirements force you to adapt". RPS: "sandbox mode is where the real party's at". Players cite "randomized island layouts" and eras as reasons for "high replayability" ([Vaporlens](https://vaporlens.app/app/492720/tropico_6)).
- Tropico 7 promises 20+ sandbox maps, 10 scenarios and a random map generator ([TheSixthAxis](https://www.thesixthaxis.com/2026/09/01/el-prez-announces-that-tropico-7-will-release-january-28th/)).

**Para Tenfe: our map is fixed (real Spain), so variety must come from the starting state and the rules**
- **Seed plus share code**, shown on the new-game screen and the final screen.
- **Start state generator** (sliders like Tropico's):
  - which 3–5 corridors start degraded (vía, catenaria, speed limits);
  - initial fleet age and mix;
  - debt level;
  - which mayors and regions are hostile;
  - the year rivals enter;
  - which character holds which agenda.
- **Sliders**: Fondos europeos (abundantes / justos / simbólicos / ninguno), Exigencia de los grupos (indulgente / justa / exigente / agresiva), Oposición (amable / reacia / moderada / fuerte), Benchmark europeo (débil … fuerte), Imprevistos (ninguno / raros / ocasionales / frecuentes), Sindicatos (dóciles … combativos).
- **Win condition picker**: puntualidad ≥X, beneficio, viajeros, cuenta en Andorra, completar la etapa final, or sin fin.
- **Difficulty % that multiplies the final score.**
- **One trait for the Presidente de Tenfe** from 10–12:
  - «Carismático»: +2 with all groups and powers.
  - «Inaugurador compulsivo»: +support per finished work, works 10 % more expensive.
  - «Pide perdón»: −50 % penalty for rejecting demands.
  - «Comisionista»: +5 % A€, +sospecha.
  - «Tecnócrata»: research +, speeches −.
  - «Blando»: no dirty cloaca actions, sindicatos +.
  - «Workaholic»: +1 % efficiency, trabajadores −2.
  - «Manipulador»: speech praise +50 %.
- **Scenarios with special rules**: «Solo diésel», «Sin AVE», «Huelga perpetua», «Ancho ibérico obligatorio», «Bruselas te odia».

---

## 11. Advisor, notifications, news and humour

- **Penultimo** is the loyal, cowardly sidekick. He narrates missions "regaling El Presidente with tales of their many adventures". He voices the "Penultimo says" text of every edict, hosts the **Canal Uno** radio (from World Wars) and DJs the bulletins. Canal Uno "comment[s] on El Presidente's actions and events" and broadcasts era-appropriate propaganda ("support the War Effort"), plus Business News and Celebrity News in DLCs ([Penultimo](https://tropico.fandom.com/wiki/Penultimo), [Radio (feature)](https://tropico.fandom.com/wiki/Radio_(feature))). In Tropico 3, DJ Juanito could not be silenced, so players issued the **Kill Juanito** edict ([Juanito](https://tropico.fandom.com/wiki/Juanito)). Lesson: let players mute or skip the chatter.
- **Building tooltips carry radio-style quips**: "Tropico is proud to welcome its new privateers and stresses that it's categorically not a piracy when it's sanctioned by the state" ([Pirate Cove](https://tropico.fandom.com/wiki/Pirate_Cove_(Tropico_6))). Another: "The Palace denies the construction of a top-secret spy base. In other news, El Presidente's new personal art gallery has exceptionally high security!" ([Spy Academy](https://tropico.fandom.com/wiki/Spy_Academy_(Tropico_6))).
- **Character voices**: each faction leader and power representative has a strong one-line identity. General Rodriguez: "the very model of a modern armchair general, my lack of direct wartime experience gives me edge". Elena Culpepper: "I play a Science Paladin Half-Elf!" ([Militarists](https://tropico.fandom.com/wiki/Militarists_(Tropico_6)), [Dual Demands](https://tropico.fandom.com/wiki/Dual_Demands_(Tropico_6))).
- **The newsfeed** is part of onboarding. The producer: "we gently ease in new players with tutorials and special tasks to guide them and provide more information about what is going on in Tropico with a Newsfeed system, detailed information overlays, and an extensive Almanac" ([Bleeding Cool](https://bleedingcool.com/games/interview-chatting-with-tropico-6-producer-martin-tosta/)). The top-left status block lists **recent events** (fires, trade ships) ([GamePressure: Interface](https://www.gamepressure.com/tropico-6/interface/zcc027)). The Ministry of Information has Penultimo deliver "Impending Uprising" warnings in a spy outfit ([Ministry of Information](https://tropico.fandom.com/wiki/Ministry_of_Information_(Tropico_6))).
- **Tone**: players praise "witty humor, political satire, and memorable characters (e.g., advisors)" ([Vaporlens](https://vaporlens.app/app/492720/tropico_6)). Critics find it "almost too broad and bawdy to be considered satire" ([PC Gamer](https://www.pcgamer.com/tropico-6-review/)) and "the toothless comedy take on dictatorship remains as insipid as ever" ([RPS](https://www.rockpapershotgun.com/tropico-6-review)). Eurogamer: "the setup makes it seem like you have the power to be as evil as you want to be, but it's never a sustainable approach" ([Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution)). The best jokes **feed mechanics**: "the communists instruct me to dismantle religion, banks and mansions … the only thing that can placate [the Capitalists]? Building a golf course" ([PC Gamer](https://www.pcgamer.com/tropico-6-review/)).
- **Repetition complaints**: music loops ([Shacknews](https://www.shacknews.com/article/110971/tropico-6-review-supreme-leadership), [IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)) and one voice line per speech option ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).

**Para Tenfe**
- A Penultimo-like **«asesor» (jefe de gabinete)** who (1) adds a one-line quip on every measure, work and pact card, (2) narrates the stage brief, and (3) appears in the event log.
- **The Gaceta and the ticker comment on every player action**, and only on things that happened (coherence rule). A «silenciar al tertuliano» option is our Kill Juanito joke and accessibility switch in one.
- **Two-voice banter** for dual demands. **3+ voice variants** per recurring line.

---

## 12. UI structure: what is where in Tropico 6

### 12.1 Screen layout (GamePressure annotated screenshot)
([GamePressure: Interface](https://www.gamepressure.com/tropico-6/interface/zcc027))
1. **Status block**: treasury, population, approval ("level of public trust"), **plus a list of recent events** (fires, trading ships).
2. **Active task list**, always visible.
3. **Time controls cluster**: pause and speeds, plus the **archipelago overview** button and the **El Presidente panel**.
4. **Action bar**, the single home of every system, in a fixed order from the left:
   1. **Task Overview** (tasks you can start)
   2. **Construction** (build menu by category)
   3. **Almanac**
   4. **Overlays**
   5. **Edicts**
   6. **Research**
   7. **Raids**
   8. **Trade** (deals and active routes; also per-good export toggles, see [Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=1730290215))
   9. **Constitution**
   10. **Politics** (superpowers and ministers)
   11. **Broker** (Swiss account)
   12. **Era Outline** (what this era is about)

Selecting a building or citizen opens a context panel. For buildings it shows budget slider, work modes, upgrades, workers, stock and range circle. For citizens it shows wealth, needs, factions and special actions ([GamePressure: Starting tips](https://www.gamepressure.com/tropico-6/starting-tips/z7c004), [GamePressure: How to change work mode](https://www.gamepressure.com/tropico-6/how-to-change-the-operation-mode/z1c167)).

### 12.2 The Almanac, the "why" screen (8 tabs)
([GamePressure: Almanac](https://www.gamepressure.com/tropico-6/almanac/z8c04a))
1. **Overview**: a summary of every other tab. Employment, overall happiness **and the lowest individual happiness factor**, balance and Swiss account, faction relations, superpower relations, rebel threat.
2. **Happiness**: each factor with a value. Click one and the right side shows **a graph over time and the list of buildings that influence it**. The "Overall Happiness" graph is drawn against **Caribbean happiness** ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108)).
3. **People**: distributions by education, happiness, wealth and so on; growth; employment; a homeless list. **Special people** (faction leaders, identified rebels, criminals, crime lords), each clickable for actions.
4. **Economy**: yearly income, unemployment, tourism rating.
5. **Politics**: one button per active faction. Shows **number of members, the modifiers driving current standing** ("it actually tells you in the almanac what is affecting it"), and support among members ([GamePressure: Factions](https://www.gamepressure.com/tropico-6/fractions/zdc028), [Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/), [Steam](https://steamcommunity.com/app/492720/discussions/0/3570700856113482908/)).
6. **Foreign Relations**: an indicator per power.
7. **Building List**: grouped like the build menu.
8. **Conflicts**: risk of attack, enemy group membership, estimated guerrillas ([Steam: Rebel guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3376587532)).

### 12.3 Overlays
- Colour-coded map layers: fertility and soil per crop, ore deposits, crime (redder means worse), liberty, beauty, pollution, plus **coverage overlays** per service. "The overlays do a great job of showing you exactly what and where you need improvements" ([Selectbutton](https://selectbutton.com/reviews/tropico-6-review), [GamePressure: Eras](https://www.gamepressure.com/tropico-6/eras/z6c003)).
- **Coverage overlays mark buildings that are full with an icon**: "if your residential area has all your fun buildings highlighted with an icon that shows they are full, the solution is simple: build more" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [Steam Happiness guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3317408271)).
- Range circles when placing service buildings ([GamePressure: Starting tips](https://www.gamepressure.com/tropico-6/starting-tips/z7c004)).
- A later Switch update added a "Resource Overview" screen after players asked for it ([Kalypso Switch 1.0.5](https://www.kalypsomedia.com/post/tropico-6-nintendo-switch-update-1-0-5)).

### 12.4 How the player knows what to do next
- **Task list**: mission goals, faction, power and Crown requests, Broker requests, Penultimo's nudges. In the Colonial era, the Crown task chain plus the mandate timer *is* the tutorial of priorities.
- **Era Outline** for the era's goal; **mission sidebar** with goals and special rules.
- **Pop-up dialogues** with faction leaders (portrait plus voice).
- **The Almanac Overview's "lowest happiness value"**, which tells you what to fix first.
- **Newsfeed and radio** for what just happened. **Warnings** for disasters and uprisings, the latter with the Ministry of Information upgrade.

### 12.5 What works and what does not (players and critics)
**Praised**
- Overlays ([Selectbutton](https://selectbutton.com/reviews/tropico-6-review)).
- The Almanac's per-faction modifier breakdown ([Steam](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/)).
- "Crisp UI" and a well-designed build wheel ([Shacknews](https://www.shacknews.com/article/110971/tropico-6-review-supreme-leadership)).
- "Functional UI … praised for … clarity" ([Vaporlens](https://vaporlens.app/app/492720/tropico_6)).
- Tutorials ([PlayStation LifeStyle](https://www.playstationlifestyle.net/2019/10/01/tropico-6-review-a-slice-of-paradise-ps4/)).

**Criticised**
- "a million different menus that you can access at any given time … some smaller menus would go a long way" ([Windows Central](https://www.windowscentral.com/tropico-6-pc-review-hilarious-city-building-simulator-surprising-amount-depth)).
- "The main screen becomes fairly convoluted as games wear on … some menus don't have obvious options … a list of goods being actively produced … no such option exists" ([Shacknews](https://www.shacknews.com/article/110971/tropico-6-review-supreme-leadership)).
- Raids "fell down the back of the interface's sofa" ([RPS](https://www.rockpapershotgun.com/tropico-6-review)).
- "You'd hope that there'd be some sort of chart or screen that lays out the finances … What are the current big imports and exports? … you could pause the game, dig through menus" ([GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review)).
- "lack of aids for interpreting that information left me in a position where it was surprisingly hard to troubleshoot what was wrong … when my treasury took a dive" ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).
- "for every mechanic that is highlighted in this extensive walkthrough, it feels like there are two more levels of complexity that go unexplained" ([PlayStation LifeStyle](https://www.playstationlifestyle.net/2019/10/01/tropico-6-review-a-slice-of-paradise-ps4/)).
- "Steep and unintuitive learning curve … unclear progression" and requests for "clearer hints for construction, budget warnings, resource visibility, and logistics bottlenecks" ([Vaporlens](https://vaporlens.app/app/492720/tropico_6)).
- "this game gives me zero feedback about what I'm supposed to do" ([Steam](https://steamcommunity.com/app/492720/discussions/0/4371376043391135554/)).

### 12.6 UI blueprint for «Rescate de Tenfe» (Tropico structure minus its known faults)
- **Top bar (status)**: Caja · Deuda · Puntualidad media · Apoyo (with the 3 components on hover) · Cuenta en Andorra (only once unlocked) · Semana / etapa. Next to it, the **event log**: the last 5 events, each clickable to the place on the map or the page.
- **Left: task stack** (always visible, never more than 5 cards). Each card: portrait, group colour, objective with a progress bar, deadline in weeks, reward, and a «Ir» button that opens the exact panel or map spot. Ultimatums pinned on top in red. Main stage goals pinned with a different border.
- **Bottom: one action bar with labelled buttons in a fixed order**, 8 instead of 12, merging what Tropico spread out:
  1. Tareas
  2. Obras (works, megaproyectos)
  3. Flota (Trenespop)
  4. Medidas (edicts + Estatuto as a tab)
  5. Política (groups, pacts, poderes externos, elecciones)
  6. Almanaque
  7. Conseguidor (appears from the stage where it unlocks; red dot when there are offers)
  8. Etapa
  - Layers (capas) go in a small toggle group by the map, not as a page.
- **Almanaque** with 6 tabs, each one "value → graph → list of causes":
  - Resumen: worst indicator highlighted first.
  - Apoyo: the 3 components; group by group with member counts and modifiers.
  - Red: corridors with punctuality, saturation and state.
  - Economía: weekly income and costs **by line and by cause**, which answers IGN and GameRevolution.
  - Exterior.
  - Conflictos: strikes, judicial phases, threats.
- **Every action card shows its consequences before you confirm** (we already do this). Add group +/− chips and the advisor quip.
- **Layers** with saturation icons on corridors over capacity (like Tropico's "full" icon) and colour scales with a legend.

---

## 13. Pitfalls to avoid (seen in Tropico 6)

1. **Request spam that breaks focus** and asks for things you already have ([GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review)). Cap open requests and dedupe against the current state.
2. **Punishments not scaled to the angry group's size** ([Steam](https://steamcommunity.com/app/492720/discussions/0/3828662280423329868/)).
3. **Approval that feels random** because the benchmark is invisible ([Steam](https://steamcommunity.com/app/492720/discussions/0/3570700856113482908/)). Always show the benchmark line.
4. **Hidden systems** (raids) and too many top-level menus ([RPS](https://www.rockpapershotgun.com/tropico-6-review), [Windows Central](https://www.windowscentral.com/tropico-6-pc-review-hilarious-city-building-simulator-surprising-amount-depth)).
5. **No money breakdown by cause** ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)).
6. **Unclear order of goals** in the first stage ([Steam](https://steamcommunity.com/app/492720/discussions/0/1815422173027728283/)) and unwinnable autosaves ([Selectbutton](https://selectbutton.com/reviews/tropico-6-review)). The first stage needs one obvious next step at all times.
7. **Promises with unreachable thresholds** ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review)). Show the target and the current value when the player picks the promise.
8. **One voice line per option**, and unskippable chatter ([IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review), [Juanito](https://tropico.fandom.com/wiki/Juanito)).
9. **Powers that forget your actions** ([PC Gamer](https://www.pcgamer.com/tropico-6-review/), [RPS](https://www.rockpapershotgun.com/tropico-6-review)).
10. **A complex secondary roster** that players don't understand (Tropico 5 Dynasty, removed in Tropico 6) ([Dynasty](https://tropico.fandom.com/wiki/Dynasty)).

---

## 14. Source list

**Tropico Fandom wiki** (read through the MediaWiki API):
- Factions: [Capitalists](https://tropico.fandom.com/wiki/Capitalists_(Tropico_6)), [Communists](https://tropico.fandom.com/wiki/Communists_(Tropico_6)), [Conservatives](https://tropico.fandom.com/wiki/Conservatives_(Tropico_6)), [Environmentalists](https://tropico.fandom.com/wiki/Environmentalists_(Tropico_6)), [Industrialists](https://tropico.fandom.com/wiki/Industrialists_(Tropico_6)), [Intellectuals](https://tropico.fandom.com/wiki/Intellectuals_(Tropico_6)), [Militarists](https://tropico.fandom.com/wiki/Militarists_(Tropico_6)), [Religious](https://tropico.fandom.com/wiki/Religious_(Tropico_6)), [Royalists](https://tropico.fandom.com/wiki/Royalists_(Tropico_6)), [Revolutionaries](https://tropico.fandom.com/wiki/Revolutionaries_(Tropico_6)).
- Politics and requests: [Dual Demands](https://tropico.fandom.com/wiki/Dual_Demands_(Tropico_6)), [Politics](https://tropico.fandom.com/wiki/Politics_(Tropico_6)), [Edicts (6)](https://tropico.fandom.com/wiki/Edicts_(Tropico_6)), [Edicts (4)](https://tropico.fandom.com/wiki/Edicts_(Tropico_4)), [Constitution (6)](https://tropico.fandom.com/wiki/Constitution_(Tropico_6)), [Election Speech (6)](https://tropico.fandom.com/wiki/Election_Speech_(Tropico_6)), [Election](https://tropico.fandom.com/wiki/Election), [Ministry (6)](https://tropico.fandom.com/wiki/Ministry_(Tropico_6)), [Ministry (4)](https://tropico.fandom.com/wiki/Ministry_(Tropico_4)), [Embassy (6)](https://tropico.fandom.com/wiki/Embassy_(Tropico_6)), [Special Action (6)](https://tropico.fandom.com/wiki/Special_Action_(Tropico_6)).
- Money and corruption: [The Broker](https://tropico.fandom.com/wiki/The_Broker), [Swiss Bank Account](https://tropico.fandom.com/wiki/Swiss_Bank_Account), [Off-shore Office](https://tropico.fandom.com/wiki/Off-shore_Office_(Tropico_6)), [Ministry of Information](https://tropico.fandom.com/wiki/Ministry_of_Information_(Tropico_6)).
- Buildings and characters: [Newspaper (6)](https://tropico.fandom.com/wiki/Newspaper_(Tropico_6)), [Pirate Cove](https://tropico.fandom.com/wiki/Pirate_Cove_(Tropico_6)), [Spy Academy](https://tropico.fandom.com/wiki/Spy_Academy_(Tropico_6)), [Ancient Ruins](https://tropico.fandom.com/wiki/Ancient_Ruins_(Tropico_6)), [Palace](https://tropico.fandom.com/wiki/Palace_(Tropico_6)), [Customization](https://tropico.fandom.com/wiki/Customization_(Tropico_6)), [Penultimo](https://tropico.fandom.com/wiki/Penultimo), [Radio (feature)](https://tropico.fandom.com/wiki/Radio_(feature)), [Juanito](https://tropico.fandom.com/wiki/Juanito).
- Eras, missions and events: [Era](https://tropico.fandom.com/wiki/Era), [Colonial Era](https://tropico.fandom.com/wiki/Colonial_Era_(Tropico_6)), [Missions (6)](https://tropico.fandom.com/wiki/Missions_(Tropico_6)), [Missions (4)](https://tropico.fandom.com/wiki/Missions_(Tropico_4)), [Timeline Event](https://tropico.fandom.com/wiki/Timeline_Event), [Disaster](https://tropico.fandom.com/wiki/Disaster).
- Other games in the series: [Faction (3 and 4)](https://tropico.fandom.com/wiki/Faction_(Tropico_3_and_4)), [Faction (5)](https://tropico.fandom.com/wiki/Faction_(Tropico_5)), [Rebel Mechanics (5)](https://tropico.fandom.com/wiki/Rebel_Mechanics_(Tropico_5)), [Game Overs (5)](https://tropico.fandom.com/wiki/Game_Overs_(Tropico_5)), [Game Types (5)](https://tropico.fandom.com/wiki/Game_Types_(Tropico_5)), [Dynasty](https://tropico.fandom.com/wiki/Dynasty), [Research](https://tropico.fandom.com/wiki/Research), [Superpowers](https://tropico.fandom.com/wiki/Superpowers), [Foreign Aid (3 and 4)](https://tropico.fandom.com/wiki/Foreign_Aid_(Tropico_3_and_4)), [Tropico 7](https://tropico.fandom.com/wiki/Tropico_7).

**GamePressure guide**: [Interface](https://www.gamepressure.com/tropico-6/interface/zcc027), [Almanac](https://www.gamepressure.com/tropico-6/almanac/z8c04a), [Eras](https://www.gamepressure.com/tropico-6/eras/z6c003), [Factions](https://www.gamepressure.com/tropico-6/fractions/zdc028), [Politics and constitution](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4), [Broker](https://www.gamepressure.com/tropico-6/the-broker/z9c006), [Happiness](https://www.gamepressure.com/tropico-6/happiness-and-approval/zbc04d), [Approval](https://www.gamepressure.com/tropico-6/how-to-increase-the-approval-rating/z1c185), [Research](https://www.gamepressure.com/tropico-6/technological-growth/zec029), [What's new](https://www.gamepressure.com/tropico-6/whats-new-in/z5c002), [Missions/Sandbox](https://www.gamepressure.com/tropico-6/general-information-about-missions/z2c186), [Disasters](https://www.gamepressure.com/tropico-6/natural-disasters/zcc04e), [Raids](https://www.gamepressure.com/tropico-6/raids/zac007), [Finances](https://www.gamepressure.com/tropico-6/finances-and-trade/zbc008), [Starting tips](https://www.gamepressure.com/tropico-6/starting-tips/z7c004).

**Steam guides and threads**:
- Guides: [political support](https://steamcommunity.com/sharedfiles/filedetails/?id=1702878108), [happiness](https://steamcommunity.com/sharedfiles/filedetails/?id=3317408271), [rebels](https://steamcommunity.com/sharedfiles/filedetails/?id=3376587532), [basics](https://steamcommunity.com/sharedfiles/filedetails/?id=1705902776), [beginner mistakes](https://steamcommunity.com/sharedfiles/filedetails/?id=1730290215), [era cheat sheet](https://steamcommunity.com/sharedfiles/filedetails/?id=3556146493).
- Threads: [difficulty mapping](https://steamcommunity.com/app/492720/discussions/0/3273561484340889214/), [map codes](https://steamcommunity.com/app/492720/discussions/0/1815422173028263514), [ultimatum](https://steamcommunity.com/app/492720/discussions/0/1636418037470473208/), [support](https://steamcommunity.com/app/492720/discussions/0/1771511442698758441/), [purge](https://steamcommunity.com/app/492720/discussions/0/3828662280423329868/), [60 % revolutionaries](https://steamcommunity.com/app/492720/discussions/0/4632610189255705566/), [leaving the colonial era](https://steamcommunity.com/app/492720/discussions/0/1815422173027728283/), [approval](https://steamcommunity.com/app/492720/discussions/0/3570700856113482908/), [too hard](https://steamcommunity.com/app/492720/discussions/0/1644295067080451456/), [no feedback](https://steamcommunity.com/app/492720/discussions/0/4371376043391135554/), [Tropicoland](https://steamcommunity.com/app/492720/discussions/0/1815422173031233898/), [T4 difficulty %](https://steamcommunity.com/app/57690/discussions/0/1761356057427290929/).

**Reviews and interviews**: [Eurogamer](https://www.eurogamer.net/tropico-6-review-a-gentle-revolution), [PC Gamer](https://www.pcgamer.com/tropico-6-review/), [RPS](https://www.rockpapershotgun.com/tropico-6-review), [IGN](https://www.ign.com/articles/2019/04/04/tropico-6-review), [Shacknews](https://www.shacknews.com/article/110971/tropico-6-review-supreme-leadership), [Windows Central](https://www.windowscentral.com/tropico-6-pc-review-hilarious-city-building-simulator-surprising-amount-depth), [GameRevolution](https://www.gamerevolution.com/review/513419-tropico-6-review), [PlayStation LifeStyle](https://www.playstationlifestyle.net/2019/10/01/tropico-6-review-a-slice-of-paradise-ps4/), [Selectbutton](https://selectbutton.com/reviews/tropico-6-review), [TheSixthAxis](https://www.thesixthaxis.com/?p=332973), [Vaporlens](https://vaporlens.app/app/492720/tropico_6), [Bleeding Cool interview](https://bleedingcool.com/games/interview-chatting-with-tropico-6-producer-martin-tosta/), [Game Informer preview](https://www.gameinformer.com/games/tropico_6/b/xboxone/archive/2017/06/15/el-presidentes-triumphant-return.aspx), [DualShockers T4](https://www.dualshockers.com/review-tropico-4/), [MatchstickEyes T4](https://www.matchstickeyes.com/2012/02/06/tropico-4-the-ingredients-of-a-successful-caribbean-holiday/).

**DLC and Tropico 7**: [Lobbyistico (GamingOnLinux)](https://www.gamingonlinux.com/2020/07/tropico-6-gets-a-new-lobbyistico-adding-in-a-corruption-mechanic), [Spitter (EGM)](https://egmnow.com/?p=8009), [Llama of Wall Street (GodIsAGeek)](https://www.godisageek.com/reviews/tropico-6-llama-of-wall-street-dlc-review/), [Tropico 7 (TheSixthAxis)](https://www.thesixthaxis.com/2026/09/01/el-prez-announces-that-tropico-7-will-release-january-28th/), [Tropico 7 (gaming.net)](https://www.gaming.net/tropico-7-everything-we-know/).

**Seen only through search excerpts** (Cloudflare blocked direct reads; treat as secondary): [Twinfinite: Modern Times](https://twinfinite.net/guides/tropico-6-modern-times-how-get-to/), [Twinfinite: revolutionaries](https://twinfinite.net/guides/tropico-6-revolutionary-immigrants-revolutionaries-how-get-more/), [AttackOfTheFanboy: sandbox setup](https://attackofthefanboy.com/guides/tropico-6-how-to-set-up-a-sandbox-game/).
