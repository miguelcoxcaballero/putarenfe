# Unified single mode: hard constraints (build, release, voices, tests, saves)

Scope: `/home/user/putarenfe/iberia-ferroviaria` at HEAD `59ee47e` (read-only inspection). Every code claim cites `file:line`. Paths are relative to `iberia-ferroviaria/` unless they are absolute.

What I checked by running things (repo left untouched, `git status` clean):
- `node tools/build-web.mjs --source <scratch>/web-source --out <scratch>/out --project proyecto` succeeds. The output is in `scratchpad/unify/build-sim/`, with status `complete-catalogue`, 412 recordings and 47 Paco takes. Its release now registers `rescue.photos: 63`, but the committed `release.json` says `photos: 0` (see §2.6).
- Node unit tests on the checkout: `test.mjs` FAILS at §11 (`test.mjs:178`, "grabación completa incrustada obligatoria…") because `proyecto/dist/assets/voice-dialogues.js` is `export const DIALOGUES = {};`. So `npm test` (`package.json`: `rescate-test && test && campaign-test`) is red today. The following all pass: `rescate-test` (6 seeds, 417 weeks), `campaign-test`, `tycoon-test`, `tycoon-contract-test`, `marketplace-test`, `induction-test`, `music-test`, `operations-calendar-test`, `observer-runtime-test`, `voice-runtime-test`, `dialogue-presentation-test`, `current-voice-pack-test` and `voice-text-test`.
- Playwright against the scratch web build:
  - `rescate-ui-test` (scratch copy) PASSES, with 3 rescue MP3 at HTTP 200.
  - `gameplay-ui-test` PASSES.
  - `contract-progression-ui-test` PASSES.
  - `onboarding-ui-test` FAILS at the stale title assertion `onboarding-ui-test.mjs:323` (`'Iberia Ferroviaria · Renfe 2022–2050'`). The page is now `Tenfe 2022–2050`.

---

## 0. Ten constraints in one screen

1. **The 412 classic bodies are frozen, and so is more than their text.**
   - The build regenerates the catalogue from the live modules and compares its SHA-256 with the pinned `6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f` (`tools/extract-game-source.mjs:20-24`).
   - The hash covers id, person, raw, text, mood, priority, kind, source, both SHAs and the array order (`proyecto/tools/voice_dialogues.mjs:12-30`).
   - Changing any of these breaks the build: one character of a body, a mood, a decision/event/stage/option id, the order of `DECISIONS`/`EVENTS`/`CHAPTERS`/`ARCS`/`ENCOUNTERS`/`INDUCTION_STAGES`, or which decision has `at:0`.
   - Adding one item to `EVENTS`, `DECISIONS`, `CHAPTERS`, `ARCS`, `INDUCTION_STAGES` (briefing/debrief/options) or the encounter matrices also breaks it. The count checks are at `voice_dialogues.mjs:31-34`.
2. **Everything else around a classic dialogue is free.** Titles, choices, effects, `at` values other than 0, `from`/`months`/`needsWorks`, and when or why it is shown can all change. These fields are not in the catalogue.
3. **Runtime audio is keyed by `clipId(person, speechText(text))`.** Mood is not part of the key. Reusing a recording needs the same speaker key and the same pronounceable text. There are no sentence clips (`CLIPS = {}`), so a fragment of a body can never be played.
4. **Re-recording a classic body is not a 50-second job here.**
   - The official pipeline requires the RAW `.wav` stage (`build_qwen_voices.py:328-340`), a closed 412-take manifest, and a re-bootstrap of the pinned catalogue SHA. The bootstrap path needs frozen standalone HTMLs (`tools/build-web.mjs:32-143`).
   - The production stage `/workspace/onboarding/spoken-brand-final-c6-stage` does not exist on this machine.
   - So treat the 412 texts as byte-frozen.
5. **The rescue lines are a second, separate voice catalogue.**
   - It holds 70 `LINES` in `proyecto/dist/rescate-data.js`. Each is keyed by line id, and its take is valid only if text, person and mood are unchanged (`proyecto/tools/build_rescate_voices.py:72-83`).
   - Only 3 of 70 are recorded: `t-1`, `t-2` and `paco-estacion`. The other 67 are still free to rewrite before recording.
6. **The build hard-codes the classic module set and file anchors.** Deleting `story.js`, `induction.js`, `encounters.js`, `tycoon.js`, `tycoon-ui.js`, `induction-task-ui.js`, `operations.js`, `main-menu.js` and others breaks it (`extract-game-source.mjs:27-31`). So does renaming the menu anchor `<h2 id="menu-departures-title">¿Adónde vamos?</h2>` (`:35-36`) or the `app.js` voice-error toast string (`:39-41`).
7. **Publication rules (AGENTS.md, verbatim in §5).**
   - One complete recording per dialogue, and the game and the listening room share the same files.
   - No sentence clips and no `speechSynthesis`.
   - A partial release states its real count.
   - Provenance is preserved, and startup never regenerates voices.
   - Release metadata is accurate.
8. **Saves.**
   - Classic: `localStorage['iberia-ferroviaria-v2']` with `version:4` (`proyecto/dist/app.js:31`, `engine.js:261`).
   - Rescue: `localStorage['tenfe-rescate-v1']` with `v:1` (`rescate.js:8`, `rescate-data.js:5`).
   - The unified mode needs a new key and an explicit, non-destructive migration story.
9. **Tests.** Most classic browser suites are already stale or depend on files outside Git (`../outputs/*.html`, production stages). Only `rescate-ui-test`, `gameplay-ui-test`, `contract-progression-ui-test` and the Node suites other than `test.mjs` run green on this checkout (the browser suites only when `GAME_URL` points at a web build). See the table in §3.
10. **`release.json` is out of date with HEAD.**
    - Commits `a3c4022` and `59ee47e` changed rescue source and added 63 published images.
    - `release.json` still says `rescue.photos: 0`, and the rebuilt game SHA differs: published `b84cda19…` versus scratch `764cdd8d…`.
    - The next publication must rebuild.

---

## 1. (a) How a recording is keyed and looked up at runtime

### 1.1 Classic catalogue (412 whole-dialogue takes)

ID formula (`proyecto/dist/voice.js:40-44`). This is FNV-1a over the person key, a `|`, and the speech text, in base 36:

```js
export function clipId(person, sentence) {
  let h = 0x811c9dc5;
  for (const ch of person + '|' + speechText(sentence)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
```

The same algorithm exists in Python as `stable_clip_id` (`proyecto/tools/build_qwen_dialogues.py:55-64`).

`speechText()` normalisation (`voice.js:19-37`). It does the following:
- Strips HTML tags.
- Removes thousands dots: `18.000` becomes `18000`, while `0.018` is kept.
- `N M€` becomes `N millones de euros`, and `N €` becomes `N euros`.
- `N ×` becomes `N por`.
- `S106` becomes `ese 106`.
- `Ouigo` becomes `Uigo`, `iryo` becomes `íryo`, `AVE` becomes `Ave`, `ERTMS` becomes `e erre te eme ese`, and a bare `M€` becomes `millones de euros`.
- A letter–letter en-dash becomes `, `.
- Removes `«»"“”` and emoji.
- Collapses whitespace and trims.

I verified with Node how the ID reacts to changes:

| Variation of `event:cable` (adif) | ID |
|---|---|
| Original | `1cpta0f` |
| Same text, person `workshop` | `1uftec8`, a different ID with no audio |
| Extra spaces or a trailing newline | `1cpta0f`, same |
| Wrapped in «» | `1cpta0f`, same |
| Wrapped in `<b>` | `1cpta0f`, same |
| One comma removed | `1i1aj3f`, a different ID with no audio |
| `\n\n` turned into a space | same |

53 of the 412 rows have `raw !== text` (ERTMS, M€, thousands and so on), and their IDs are built from the spoken form.

The lookup path in the game:
1. The modal renders `<p data-say="${esc(raw)}">…` (`app.js:500`, `:964`, `:1174`; `tycoon-ui.js:36`).
2. `speakIn(root, person, where)` (`app.js:133-140`) calls `voices.speak(person, el.dataset.say, {mood,…})`.
3. `Voices.speak` (`voice.js:167-229`) computes `dialogueId = clipId(person, text)` and sets `whole = !!DIALOGUES[dialogueId]` (`:171-172`).
4. If there is no whole take, it falls back to sentence `CLIPS`, which are always `{}`. That raises the error `MISSING_RECORDING` (`:175-177`). The published bundle shows the toast "Esta voz aún está en producción…" once (`extract-game-source.mjs:39-41`).
5. `buffer(id,'D')` decodes the entry (`voice.js:139-160`). The published bundle patches this to `fetch(entry.url)` (`extract-game-source.mjs:45-48`).
6. `DIALOGUES` is injected by `build-web.mjs:273` as `{id:{url:'assets/voces/<id>-<sha12>.mp3'}}` (`build-web.mjs:185-186`).
7. Playback uses a single source at rate 1 and detune 0 (`voice.js:197-198`). Subtitles move by approximate word weighting (`:212-218`), the music is ducked to 0.28 (`:103`), and an optional character sting plays first (`:225-226`).

The source map `proyecto/dist/assets/voice-dialogues.js` is `{}` in Git, so voices only work in the built web (or in an `outputs/` standalone with embedded audio).

**Does reuse require identical text and person?**
- **Person:** yes, the key must be identical (`minister`, `adif` and so on). The displayed name does not matter.
- **Text:** the *speech-normalised* text must be identical. Whitespace, HTML tags, «» quotes and emoji are tolerated. Any word or punctuation change is not.
- **Mood:** not part of the key. But the take was performed with the catalogue mood (`manifest-source.json` takes carry `mood`), so the portrait and context should match it.
- A body cannot be split, joined or prefixed: there are no sentence takes.

### 1.2 Rescue lines (second catalogue, 70 lines)

- **Runtime.** `rescate-ui.js:107-115` does `RESCUE_VOICES[line]` and then `new Audio(v.url)` at volume .95. There is no ducking, no sting and no error toast. It honours the classic `voices.enabled` through `voiceEnabled` (`app.js:1153`). The key is the line id: `t-1`, `paco-estacion` and so on (`rescate-ui.js:118-122`).
- **Map.** The map is the generated `proyecto/dist/assets/rescate-voices.js`, currently `3/70 diálogos grabados`. Files are `assets/rescate-voces/<id>-<sha12>.mp3`, and provenance is in `assets/rescate-voces/manifest.json`. That manifest holds the model `Qwen/Qwen3-TTS-12Hz-0.6B-Base@5d83992436eae1d760afd27aff78a71d676296fc`, precision `mixed-bf16-talker`, seed 424242 and the same mastering as the 412 takes.
- **Validity of a take.** `input_fingerprint = hash({text, effective_text, person, mood, model, seed, precision})` (`build_rescate_voices.py:72-77`), plus `validated`, `eos_found` and the MP3 SHA (`:80-83`).
- **Packaging.** `--package` deletes all MP3s and keeps only takes that are valid for the *current* `LINES` (`:145-172`). So editing a line's text, person **or mood** silently drops its audio at the next package.
- **Inputs read.** `LINES` is read from `dist/rescate-data.js` (`:49-53`) and mastering from `web-source/manifest-source.json` (`:56-58`). The script never touches the 412 catalogue.
- **Recorded lines and what they claim:**
  - `t-1` (minister, determined): "Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda."
  - `t-2` (riders, angry): "Pincha en el corredor Norte del mapa. Ese que parpadea en rojo."
  - `paco-estacion` (mayor, happy): "Ministro, mi pueblo necesita una estación…". It addresses the player as *Ministro*, which is inconsistent with the classic "director/presidente de Tenfe".

### 1.3 The two players should become one

Recommendation: use one runtime lookup for both catalogues in the unified UI.
- Classic: `clipId(person, raw)` into `DIALOGUES`.
- Rescue: line id into `RESCUE_VOICES`.
- Alternatively, index the rescue map by `clipId(person, LINES[id].text)` at runtime, with no build change. Then every dialogue goes through `Voices.speak`, which gives one duck, one stop, one error path, subtitles and the `MISSING_RECORDING` subtitle-only fallback.

---

## 2. (b) What the build asserts, and what breaks

### 2.1 `tools/extract-game-source.mjs`, called first by `build-web.mjs:147`

| Line | Assertion or requirement | Consequence for the unified mode |
|---|---|---|
| 20-24 | Imports `proyecto/tools/voice_dialogues.mjs`, serialises `DIALOGUE_CATALOGUE` with `JSON.stringify(…,null,1)+'\n'`, and requires its SHA to equal `source-release.json.sourceCatalogueSHA256` (`6348984c…`) and the length to be 412. Message: "dialogue text changed: regenerate and validate its whole recordings before publishing". | Any change to the catalogue-derived fields or order fails the build. Removing any source module also fails, because the import fails. |
| 27-28 | `baselineOrder`, 32 files that must exist and are read with `readFileSync`, which throws if missing: `assets/geography.js, assets/railways.js, assets/timetable.js, assets/infra.js, data.js, story.js, schedule.js, infra.js, network.js, induction.js, induction-runtime.js, encounters.js, tycoon.js, engine.js, operations.js, map-v3.js, train-art.js, train3d.js, city-art.js, assets/samples-index.js, music.js, assets/voices.js*, assets/voice-dialogues.js*, voice.js, dialogue-presentation.js, sfx.js, assets/portraits.js, faces.js, tycoon-ui.js, main-menu.js, induction-task-ui.js, app.js`. (*These two are replaced by literals.) | Retiring a classic module means editing this list, which is publication tooling. |
| 29-31 | `optionalBefore`: `brands.js` before `data.js`; `marketplace.js` before `tycoon.js`; `assets/train-photos.js` before `train3d.js`; `assets/rescate-art.js, assets/rescate-voices.js, rescate-data.js, rescate.js, rescate-map.js, rescate-ui.js` before `app.js`. | New unified modules must be inserted here, in dependency order. |
| 32-58 | Order-based mini-bundler. Each module becomes an IIFE. `import * as X from '…'` and `import {a, b as c} from '…'` (single line, at line start) are rewritten to `__m[...]` lookups, evaluated **in list order**. Supported exports: `export {…}` and `export function/const/let/class/async function`. Anything else throws "Unsupported module syntax" (`:56`). | No `export default`, no `export * from`, no multi-line imports, no `import()`, no `export var`. A module evaluated before its dependency gets `undefined`. |
| 34-37 | `main-menu.js` must contain `<h2 id="menu-departures-title">¿Adónde vamos?</h2>` **exactly once**. The build injects `__WEB_PREVIEW_LABEL__ <a href="dialogos.html">Escuchar los diálogos</a>` after it. | This is the in-game release-count label and the link to the listening room. Keep the anchor, or update the tool. |
| 38-42 | `app.js` must contain, exactly once: `onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }` | A refactored `speakIn` breaks the build. |
| 43-49 | `voice.js` must contain `const decoded = Promise.resolve().then(() => {` and `const entry = (kind === 'D' ? DIALOGUES : CLIPS)[id], data = typeof entry === 'string' ? entry : entry?.src;` exactly once. No `speechSynthesis`. | Do not reformat `Voices.buffer`. |
| 62-63 | Bundle contains `const CLIPS = {};` and exactly one `__WEB_DIALOGUES__`. | |
| 64-73 | CSS = `style-v3.css` + `main-menu.css` + `induction.css` (required) + `marketplace.css` + `rescate.css` (optional). `url('assets/…')` is inlined as base64 (png, jpg, jpeg, webp, svg, woff2 only). Any other `url()` must be `data:`, `blob:` or `#`. | A new stylesheet must be added here. CSS cannot reference `assets/rescate/*.webp` by URL; use `<img>` from JS. |
| 74-98 | `dist/index.html` must contain, once each: `<link rel="stylesheet" href="main-menu.css">`, `…induction.css`, `…style-v3.css`, `<script>globalThis.IBERIA_SAMPLE_BASE = 'assets/';</script>`, `<script type="module" src="app.js"></script>` and `</body>`. The `marketplace.css`, `rescate.css` and `three.min.js` tags are optional. | |

### 2.2 `tools/build-web.mjs`, default rebuild with no `--game`

| Line | Assertion |
|---|---|
| 151-152 | Without `--manifest`, `web-source/manifest-source.json` must hash to `currentManifestSHA256` or `manifestSourceSHA256` (`c88ba4b4…`). |
| 158-164 | `canonical-catalogue.json` SHA = pinned catalogue; `manifest.catalogue_sha256` = pinned; reference pack `46ba5d81…`; model fingerprint `3db3533e…`; **`catalogue.rows.length === 412` and 412 unique ids**. |
| 169-190 | For every manifest take: the row exists ("no obsolete recording ID"); person matches; `take.text === canonical.text`; `row.text === canonical.raw`; the reference SHA is the current person reference; validated, raw_validated, finite and `eos_found`; duration > 0; the MP3 is read from `--audio-stage` or from the previous `release.json` URL (`:180-182`) and must match its SHA. URL `assets/voces/<id>-<sha12>.mp3`. |
| 192-196 | `available ≤ 412`. `partial = available !== 412`. Game label is `Avance en pruebas · ${available}/412 voces completas · resto con subtítulos` when partial, else `412/412 diálogos grabados`. Listening label is `${available}/412 diálogos grabados · …`. |
| 198 | `pacoWholeDialogues` counts classic `person==='mayor'` takes only (47). |
| 200-225 | Rescue: copies `proyecto/dist/assets/rescate/` (names must match `^[a-z0-9-]+\.(webp\|jpg\|png)$`) and `rescate-voces/` (each MP3 name must contain its `sha12`). Every manifest take must be published with that SHA. Takes are appended to the listening catalogue as rows `id:'rescate-'+take.id, kind:'Rescate de Tenfe', title:take.id`, and the label gets ` · Rescate de Tenfe: ${n}/${expected}`. |
| 226-247 | Train photos: the module after the marker `// ---- assets/train-photos.js\n` (exactly one) has its data URIs externalised to `assets/fotos/train-<sha12>.<ext>`. |
| 248-268 | Brand logos: `// ---- brands.js\n` marker, webp data URIs go to `assets/logos/logo-<sha12>.webp`, and **exactly 6 distinct logos** (`:266`). |
| 269-282 | The game script must contain one `__WEB_DIALOGUES__` and one `__WEB_PREVIEW_LABEL__`. Every JS file is syntax-checked with `vm.Script`. Asset names carry `sha12`. |
| 289-296 | No unexpanded `__WEB_*__` token, no `<base>`, exactly one `<audio>` in `dialogos.html`. |
| 298-308 | `release.json`: `version:'4.0.0'` is hard-coded; status `partial-preview` or `complete-catalogue`; `expectedWholeDialogues:412`; `sentenceRecordings:0`; `systemVoiceFallback:false`; `rescue:{photos,recordedDialogues,expectedDialogues}`. |
| 311-337 | Retention: previous assets and recordings are re-hashed and kept as `retainedAssets`. **Every other file under `assets/` that is not produced by this build is deleted** (`cleanAssets`). |
| 338 | Every asset must be under 100 MiB. Today the largest is `game-script-4` at about 22 MB. |
| 341-346 | `--manifest` is accepted as the default only after a successful publication. |

**412 is hard-coded in all of these places:**
- `build-web.mjs`: 50, 52-54, 96, 124, 163-164, 192-196, 299
- `extract-game-source.mjs`: 24
- `voice_dialogues.mjs`: 31-34, with per-kind counts `induction:36, feedback:14, chapter:5, arc:5, decision:15, event:22, encounter:315`
- `current_voice_pack.mjs`: 43
- `build_dialogue_listening.mjs`: 29 and 74
- `build_qwen_dialogues.py`: 28-29 and 82-83
- `test.mjs`: 171-172
- `dialogue-presentation-test.mjs`: 23
- `voice-game-ui-test.mjs`: 27-28 and 218
- `voice-listening-ui-test.mjs`: 25, 27, 132 and 175
- `voice-conversation-ui-test.mjs`: 18
- `web-source/listening.template.html` (pending count)

### 2.3 If classic campaign and free mode disappear from the menu

- **Build:** nothing checks for `data-action=begin`, `free-setup` or `rescue-new`. The build keeps passing as long as:
  1. All modules in `baselineOrder` still exist.
  2. The menu anchor (2.1, `:35`) and the `app.js` toast anchor (`:39`) remain.
  3. `test.mjs` §11's rule holds: every `data-action="…"` and every `case '…':` in `app.js` has an entry in `sfx.js` `ACTIONS` (`test.mjs:155-167`, `sfx.js:232-249`). New actions in `app.js` need sfx entries.
- **Tests that click those buttons break:**
  - `rescate-ui-test.mjs:34` asserts `[data-action=begin]` count is 1, with the message "la campaña clásica sigue disponible".
  - `onboarding-ui-test.mjs:338-345, 524-563`
  - `ui-test.mjs:49, 124`
  - `gameplay-ui-test.mjs:26`
  - `voice-game-ui-test.mjs:228-230`
  - `voice-conversation-ui-test.mjs:322`
  - `voice-playable-advance-ui-test.mjs:60`
  - `induction-test.mjs:127-130` (menu shows free-mode and campaign dates)
- **Saves:** players with `iberia-ferroviaria-v2` lose the "Continuar partida" path (`main-menu.js:51`, `app.js:1294`). See §4.
- **Docs and metadata:** README, `docs/PUBLICACION.md` and `release.json` must stop claiming "cinco capítulos 2022–2050" and "modo libre". Accurate release metadata is an AGENTS rule.

### 2.4 If the classic dialogue texts stop being used by the game

- **Build:** still passes, because the catalogue derives from module *exports*, not from usage.
- **Rules:** the 412 recordings would then exist only in `dialogos.html`. This contradicts AGENTS "The game and listening room must share the same current recordings" and the README promise "Juego y auditorio utilizan las mismas tomas enteras".
- **Deleting the modules** breaks:
  - the build (`voice_dialogues.mjs:4-7` imports)
  - `build_dialogue_listening.mjs:8-13`
  - `test.mjs`
  - `dialogue-presentation-test.mjs`
  - `voice-text-test.mjs`
  - `current-voice-pack-test.mjs`
  - the Python production checks (`build_qwen_dialogues.py:71-79` runs `voice_dialogues.mjs`)
- **Dropping only some rows** (for example the 315 encounters) is not possible without a new release bootstrap. The per-kind counts and the 412 checks throw, the pinned SHA changes, and the bootstrap requires frozen standalone HTMLs plus a closed manifest whose `catalogue_sha256` equals the new catalogue (`build-web.mjs:32-74`, `138-142`).

### 2.5 If a classic text is changed (even one word)

1. `extract-game-source.mjs:22-23` throws.
2. To publish you would need a new catalogue, a new full Qwen stage, a re-bootstrap of `source-release.json`, and new frozen HTMLs.
   - The stage needs RAW WAVs and a matching plan (`build_qwen_dialogues.py:300-322`; `build_qwen_voices.py:328-340`).
   - `migrate_qwen_dialogues.py` can copy compatible takes, but needs the original stage (RAW and manifest). That stage (`/workspace/onboarding/spoken-brand-final-c6-stage`) is **not on this machine**.
3. Cost estimate:
   - At the stated ~50 s per dialogue, all 412 is about 5.7 h of CPU.
   - The production manifest records about 181.7 s average `batch_inference_seconds`.
   - The Qwen weights exist outside Git at `/tmp/claude-0/-home-user-Inhouse-Photos/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/qwen-model/`.
   - `python3 -c "import qwen_tts"` fails in the system Python, so a venv with `proyecto/tools/requirements-qwen-voices.txt` is needed.

**Conclusion: keep the 412 bodies byte-identical in their current modules.**

### 2.6 State of the current release (must be fixed by the next publish)

- Commit `59ee47e` added 63 images under `assets/rescate/` and `proyecto/dist/assets/rescate/`. Commit `a3c4022` changed `rescate.js`, `rescate-map.js` and `rescate-ui.js`. Neither rebuilt `index.html` or `release.json`.
- The committed `release.json` has `rescue.photos: 0` and 43 assets. My scratch rebuild gives 63 photos, 106 assets and 44 retained.
- `tools/verify-pages.mjs:20` checks only `release.json` rows, so those 63 images are not verified today.

---

## 3. (c) Test-by-test table under a single unified mode

Legend:
- **K** = keep as is.
- **A** = adapt.
- **R** = retire from the gate. Keep the file because docs proofs cite it: "Preserve … provenance".
- "Assumes" shows which mode the test needs: C = classic campaign, F = free, Rq = rescue, — = mode-independent.

| # | File | What it asserts (one line) | Assumes | Status today | Verdict |
|---|---|---|---|---|---|
| 1 | `test.mjs` | §1-10: only AVE/Alvia models and schedule (`:18-29`), initial state, gauge/catenary compatibility, works, historical works, ≥12 events in 120 months, 9×7 portraits, no "ficción"/external links/"Cercanías\|Rodalies\|Media Distancia\|Regional Exprés\|Avant" in `story.js` (`:121-127`), day simulation, save rejection. §11 (`:153-183`): every `app.js` action has an sfx recipe; catalogue = `investigacion/voces/dialogos-3.6.3.json`; 412 ids; **embedded base64 for every id**. Then chains 9 other suites. | C | **FAILS** at `:178` (`DIALOGUES={}` in Git), so the chained suites never run through it | **A**: keep portraits, sfx mapping (extend to the unified UI's action attribute), catalogue equality and id formula. Replace the embedded-base64 check with "every catalogue id has a take in `web-source/manifest-source.json` and a `release.json` recording". Drop the classic-engine sections if that engine goes. Note that `:20-22` "solo AVE y Alvia" and `:125` "Media Distancia" conflict with the realism and train-type requirements. |
| 2 | `campaign-test.mjs` | Legal-action bot plays 2022–2050, 5 chapters, gauge/catenary works, changers, ends solvent in 2050 | C | passes (15 s) | **R** (or **A** into a unified full-playthrough bot together with #14) |
| 3 | `tycoon-test.mjs` | 315 scenes × 7 emotions, competition, staff, policies, research, missions, pressures, free mode, renewal, save | C+F | passes (37 s) | **A**: keep the ENCOUNTERS integrity checks (ids/persons/moods); drop free mode |
| 4 | `tycoon-contract-test.mjs` | Contracts: 3 stages, branches, optional investment, single penalty, save references, no rival exploit, free mode after 2050 | C+F | passes | **R** unless ARCS contracts survive |
| 5 | `marketplace-test.mjs` | Trenespop: listings new/used, used keep age/condition, 30 % deposit / 70 % on arrival, stock, favourites ≤200, atomic failed purchase, save validation | C (`E.initialState`, classic `MODEL`) | passes | **A**: keep the commerce rules, rebased on the unified state and the new catalogue (see `market.md` §9: byte-identical classic HTML is no longer needed if classic goes) |
| 6 | `induction-test.mjs` | 9-stage first turn: cast, real objectives, budget choices, progress recovery, handoff with 2 plans and real rewards; `menuHTML` shows the free-mode and campaign dates (`:127-130`) | C+F | passes | **A** if the 50 guide takes stay playable (their claims must stay true, §6.3); else **R** |
| 7 | `music-test.mjs` | 14 scores, 2285 notes preserved, samples, contexts `estacion/day/dusk/night` give the right openers | — | passes | **K**. The unified app's `musicMood` must still produce these 4 contexts. Today rescue is always `estacion` because `app.js:109-112` reads classic `state.ops`. |
| 8 | `operations-calendar-test.mjs` | Free-mode calendar after 2050, year change, leap years | F | passes | **R** / **A** to the unified calendar |
| 9 | `observer-runtime-test.mjs` | Extracts `currentMinute`, `frame`, `renderDaybar`, the timeline seek and `setMinute` from `app.js` by string anchors (`:10-23`); "observe" never consumes the saved day | C | passes | **R** if the classic day view goes (string anchors are brittle) |
| 10 | `voice-runtime-test.mjs` | `Voices`: whole take, missing second sentence without synthesis, visible error, stop/replay, LRU of 64 buffers, release | — | passes | **K** (extend if rescue lines go through `Voices`) |
| 11 | `dialogue-presentation-test.mjs` | 412 bodies intact, 31 `\n\n` intros, 315 mood prefixes, same subtitle indices, HTML escaping | — | passes | **K** (guards the frozen catalogue) |
| 12 | `current-voice-pack-test.mjs` | Pack `46ba5d81…`, Torrente `26667538…`, PCM16 24 kHz mono 7–12 s references, manifest validation, Paco note | — | passes | **K** |
| 13 | `voice-text-test.mjs` | `speechText` numbers, M€, ERTMS; the incident-stage spoken costs equal `RESPONSES.team.cost=.018` and `RESPONSES.bus.cost=.009` (18.000 € / 9.000 €; `operations.js:49-53`) | C (induction data) | passes | **K/A**. This is the template for "a dialogue says X, so the mechanic does X". Generalise it to every numeric claim in reused bodies (§6.3). |
| 14 | `rescate-test.mjs` | `newGame(7)`: cash 12, 4 trains, 2 crews, Norte 62 %; `workQuote('norte','renovar')` cost 2.35, 7 weeks, 1 crew, aid 1.2; `trainQuote('kafka')` price 3, arrives week 5; 3 orders/week; ≤2 pacts; cloacas; every stage/pact has a line; 6-seed bot over 417 weeks | Rq | passes | **A**: becomes the unified engine's core test. Its numbers must stay in sync with spoken lines (`t-3` "siete semanas", `t-5` "cuatro semanas", `stage-s1` "del sesenta y dos al ochenta… trece semanas"). |
| 15 | `rescate-ui-test.mjs` | Cover has `rescue-new` **and** `begin` (`:33-34`); 7-step tutorial; "2,35 M€", "+1,2 M€ al terminar", "Sem. 8"; 3 phases; plan modes; BCBB/Dörfler photos; close week; Paco offer /votantes, los suficientes/; 9 pages; 5 layers; save `tenfe-rescate-v1`; 390 px with no horizontal scroll; no JS errors. Writes PNGs to `../investigacion/verificacion-4.0` (tracked in Git). | Rq (+C button) | **passes** on the scratch build | **A**: the unified UI gate. Drop the `begin` assertion; change the save key. |
| 16 | `ui-test.mjs` | Precondition: 522 sentence clips embedded (`:11-27`, impossible by policy); title "Renfe 2022–2050" (`:45`); classic layers, tramo cards, works, new relation, day, event, mobile, free mode | C+F | **stale, fails** | **R**. Re-express the gauge/electrification and works coverage in #15. |
| 17 | `gameplay-ui-test.mjs` | Free mode Dirección: contracts, hire 20 = 0.3 M€, wifi policy, research online/ERTMS dates, competition, delegation, 390/320 px with no overflow | F | **passes** on the scratch build | **R** (with free mode); reuse its overflow checks |
| 18 | `contract-progression-ui-test.mjs` | Classic contracts stages 2/3, commercial investment, save/load, mobile; key `iberia-ferroviaria-v2` | C | **passes** on the scratch build (about 20 min) | **R** |
| 19 | `onboarding-ui-test.mjs` | Classic 9-task tutorial with 9 characters, menu, free-mode cancel, observe, reload, 390/320 px; key `iberia-ferroviaria-v2` | C+F | **fails** at `:323` (stale title) | **A** if the guide takes stay; else **R** |
| 20 | `voice-game-ui-test.mjs` | Standalone HTML with embedded `DIALOGUES` plus the production stage manifest (outside Git); free mode; 9 characters' whole takes play natively | F | cannot run (inputs missing) | **A** to the web build (URL fetch) and the unified flow |
| 21 | `voice-conversation-ui-test.mjs` | Walks campaign plus 9 tasks, listening to each message until `ended`; expects 412 | C | cannot run | **A** (unified conversations) / **R** |
| 22 | `voice-listening-ui-test.mjs` | Standalone listening HTML plus `latest.json` provenance; 412 rows, 9 characters, one `<audio>`, controls, `N/412` label | — | cannot run | **A** to web `dialogos.html` and to 412+N rows |
| 23 | `voice-playable-advance-ui-test.mjs` | Pinned HTML SHA `d476a9a0…` of the 3.6.3 72/412 preview | historical | cannot run | **R** (provenance only) |
| 24 | `voice-audition-ui-test.mjs` | 3.6.2 nine-voice audition page | historical | cannot run | **R** |
| 25 | `voice-continuity-preview-ui-test.mjs` | 3.6.3 four-alternative continuity preview | historical | cannot run | **R** |

The Python production tests in `proyecto/tools/test_*.py` call `voice_dialogues.mjs` and `SOURCE_COUNTS`. They keep passing only while the classic modules are unchanged.

New tests the unified mode needs:
1. **Reachability:** every catalogue `source` the engine can emit maps to an existing row, and no displayed `(person, text)` pair lacks a take unless it is labelled pending.
2. **Truthfulness:** each reused body's numeric or date claim equals the engine value at trigger time (generalise #13).
3. **sfx coverage** for the unified UI's action attribute.
4. **Save migration** from `iberia-ferroviaria-v2` and `tenfe-rescate-v1` to the new key.

---

## 4. (d) Save keys and migration concerns

| Key | Writer | Shape and validation | Notes |
|---|---|---|---|
| `iberia-ferroviaria-v2` | `app.js:31`, `:69` (load), `:181` (save) | `E.validateSave` (`engine.js:269-297`); `migrate` throws for `version!==4` (`engine.js:259-261`); `month ≤ 348` campaign / `≤ 12000` free (`:270`); `tycoon.mode ∈ {'campaign','free'}` (`tycoon.js:193`); infra `g∈{ib,std,mixto}`, `e∈{25kv,3kv,no}`, `20≤v≤400` (`engine.js:280`); marketplace `{version:1, sold, favorites≤200}` (`marketplace.js:18`, `:63`) | Includes the tutorial (induction) state, orders, refits, Trenespop stock. Export/import JSON is limited to 6 MB (`app.js:1384`, `:1424`). |
| `tenfe-rescate-v1` | `rescate.js:8`; `rescate-ui.js:48` (load), `:90` (save) | `validate` (`rescate.js:1349-1357`): `v === RESCUE_VERSION (1)`, `1 ≤ week ≤ WEEKS+1`, cash/stars, every corridor `track`/`punct`, every group, `cloacas.suspicion`, every fleet item's `OFFER[t.offer]` | "Nuevo rescate" overwrites the save without asking (`rescate-ui.js:67`). Export only, as `rescate-tenfe-semana-N.json` (`rescate-ui.js:534`). |
| `iberia-voz` | `voice.js:69`, `:74` | `{enabled, volume}` | Keep. Rescue reads `voices.enabled` too. Used by `voice-game-ui-test.mjs:151`. |
| `iberia-musica` | `music.js:1092`, `:1096` | `{volume, enabled, mode}` | Keep |
| `iberia-efectos` | `sfx.js:257`, `:264` | `{volume, enabled}` | Keep |

Migration rules:
- Use a new key, for example `iberia-ferroviaria-v5`, with `version:5`. Do not reuse `-v2` or `tenfe-rescate-v1`, because old validators would throw (classic) or return null (rescue). The cover would then show error text from `savedError` (`app.js:69`).
- A classic monthly 2022–2050 save cannot be converted faithfully into a weekly state with different corridors. Offer "Exportar partida anterior" plus a one-line notice. Never delete the old keys automatically, because progress lives only in that browser (README).
- A rescue save (weekly, 2027 start, same corridors) can be converted by a pure function, if the unified engine keeps corridor ids, groups and `cloacas`.
- If the unified state stores the ids of classic events and encounters (`s.event`, `tycoon.encounter`), keep their ids. `validateSave` checks membership (`engine.js:275`, `tycoon.js:193`).
- Tests that write fixtures under these keys need updating: `onboarding-ui-test.mjs:16`, `contract-progression-ui-test.mjs:20`, `rescate-ui-test.mjs:31, 113`.

---

## 5. (e) AGENTS.md rules, verbatim

`iberia-ferroviaria/AGENTS.md` is the only one. There is no AGENTS.md in `/home/user/putarenfe` or `/home/user`; `/home/user/Inhouse-Photos/AGENTS.md` is a sibling project and does not apply.

> The user requested that this project and every playable update live in `miguelcoxcaballero/putarenfe`, under `iberia-ferroviaria/`, with commits and GitHub Pages publication. Preserve the Renfe viewer in the repository root.

> GitHub Pages serves `main:/`. Publish the game as `index.html` and the listening room as `dialogos.html` in this directory. Verify the public HTTPS pages and their current assets after pushing a ready update. Commit the editable source, builder, published assets and accurate release metadata together.

> Audio files contain one complete recording per dialogue. The game and listening room must share the same current recordings. Keep old sentence clips and browser speech synthesis out of published builds. Mark partial releases with their actual recorded count; a complete release requires all 412 current dialogue bodies.

> Keep model weights, RAW generation caches, full reference videos, credentials and temporary downloads outside Git. Preserve voice and dialogue provenance. Startup must not regenerate voices or download models automatically.

> Editable game source is in `proyecto/`. Publication tooling and web templates are separate from active neural production; do not modify a running producer's catalogue, reference pack, source or stage. Follow the actual current production records when rebuilding voices rather than copying historical process IDs.

Procedure rules from `docs/PUBLICACION.md`:
- Order of work: "grabar con `build_rescate_voices.py --model … --stage …` (fuera de Git), publicar las tomas validadas con `--package`, subir las imágenes …, reconstruir con `node tools/build-web.mjs`, probar con `proyecto/rescate-ui-test.mjs`, hacer commit en `main` y verificar con `node tools/verify-pages.mjs URL docs/pages-400-https-proof.json`."
- "Conserva el contenido de la raíz y no fuerces el historial."
- "nunca reescribas una prueba fallida como si hubiera pasado en el primer intento."
- Links use a `?v=` cache-busting query (currently `?v=v363-412`).

How these apply to the unified mode:
- **Partial labelling.** The game label today ignores rescue lines. `release.status` is `complete-catalogue` while rescue is 3/70 (`build-web.mjs:194-196`, `:306`). If the new lines become core dialogue, show the real combined count in both pages, for example `412/412 + 3/70`. Unrecorded lines stay as subtitles only, never `speechSynthesis`.
- **Shared recordings.** The 412 classic takes and the rescue takes must be reachable from the game and listed in `dialogos.html` with the same URLs, as `build-web.mjs:222` already does for rescue.
- **Provenance.** Keep `web-source/manifest-source.json`, `reference-pack-source.json`, `canonical-catalogue.json`, `proyecto/dist/assets/rescate-voces/manifest.json`, `investigacion/voces/*`, and the historical test files and proofs in `docs/`.
- **Outside Git.** The Qwen stage, model weights and RAW WAVs for new rescue takes stay outside Git, for example in the scratchpad.
- **Accurate metadata.** Bump the hard-coded `version:'4.0.0'` (`build-web.mjs:298`), "Versión 4.0.0" (`main-menu.js:56`) and `package.json` together. Update README and `docs/PUBLICACION.md` claims.

---

## 6. (f) Keeping the 412 recordings valid and playable in one mode

### 6.1 Rules

1. **Do not touch** these catalogue-sourced structures, or only touch fields outside the catalogue:
   - `story.js` `CHAPTERS`, `DECISIONS`, `EVENTS`
   - `induction.js` `INDUCTION_STAGES`
   - `tycoon.js` `ARCS` (`tycoon.js:9`)
   - `encounters.js` `MOOD`/`LINES`/`TOPICS`/`EMOTIONS`/`ENCOUNTERS`
   
   The frozen per row are `id`, `person`/`who`/`speaker`, `body`/`text`/`feedback`, `mood`, array order, and `at===0` only for `inaugural`.
2. **Add every new spoken line elsewhere**, for example in `rescate-data.js` `LINES` or a new `lines` module with its own recorder. Adding to `EVENTS` or `DECISIONS` breaks the build (`voice_dialogues.mjs:31-34`).
3. **Trigger classic bodies from the new engine by their catalogue `source`** (`decision:burgos`, `event:cable`, `encounter:scene-adif-angry-2`, `induction:incident:briefing:1`, …).
   - A thin "dialogue bank" API can look up `DIALOGUE_CATALOGUE` rows (or the original arrays) and return `{person, mood, raw}`.
   - The UI renders `<p data-say="${esc(raw)}">` and calls `Voices.speak(person, raw, {mood})`.
   - Do not copy texts into new modules. Copies escape the catalogue SHA guard and drift silently.
4. **Shown only when true.** Each reused body gets a precondition derived from the claim it makes, and the mechanic it promises is applied by the engine. The classic engine already does this for `eufunds`: the text promises 40 % cheaper catenary and gauge works for two years, and `engine.js:118` applies `worksDiscount = s.flags.eufunds > s.month ? .6 : 1` with `months:24`.
5. **Dynamic numbers never go into a voiced body.** Use the rescue pattern: voiced static line, then an unvoiced `extra` paragraph for computed text (`rescate-ui.js:385-386`).
6. **Keep the speaker and mood portrait exactly as in the catalogue.** The audio was performed with that mood.

### 6.2 Making the 315 encounters deterministic instead of random

- **Today.** Encounters come from `ENCOUNTERS[(t.encounterCount*137+(s.seed%315))%315]` every 3 months (`tycoon.js:158`). Events have a 32 % monthly roll (`engine.js:157-161`). That is the "pulsar random" the user complains about.
- **Structure.** Each encounter body is `MOOD[person][m] + ' ' + LINES[person][k]` (`encounters.js:31`): one mood opener and one of 5 topic lines.
- **Topics** (`encounters.js:13`), with their choice effects (`:24-30`):

| Topic | Choice A | Choice B |
|---|---|---|
| 0 «El turno imposible» (staff and shifts) | pay reinforcements (cash −1.2, satisfaction +2) | adjust shifts without reinforcement (reputation −1) |
| 1 «Billetes de saldo» (fares and discounts) | discount campaign (cash −1.5, satisfaction +3, 3 months hype) | protect the margin (cash +0.3, satisfaction −1) |
| 2 «Tornillos o titulares» (maintenance) | extra overhaul (cash −2, reputation +1, fleetcare) | keep to the plan (satisfaction −1) |
| 3 «El andén olvidado» (station and territory) | local service reinforcement (cash −1, satisfaction +2) | centralised service (reputation −1) |
| 4 «El invento del mes» (tech pilot) | fund the pilot (cash −1.8, reputation +2) | ask for another evaluation (no effects) |

- **Proposal:**
  - The topic is chosen from the actual worst problem: crew shortage → 0; price war with Lowgo/OuiOui/bus → 1; fleet reliability or breakdowns → 2; neglected territory or station → 3; available tech → 4.
  - The person is the stakeholder of that problem.
  - The mood comes from that person's group or trust trend: high gives happy/proud, a surprising improvement gives surprised, a decline gives worried, failure gives angry/disappointed, and a plan gives determined.
  - The same 315 recordings then tell the player something true about the state.

### 6.3 Claims in recorded classic bodies that the unified engine must honour, or else not trigger the body

The full list of 97 non-encounter bodies is extracted to `scratchpad/unify/classic-97-bodies.json`.

- **Dated (historical) decisions.** Months are counted from January 2022 (`story.js:22-38`):
  - inaugural@0 (2022-01), energy@2, burgos@6 ("Julio de dos mil veintidós … Venta de Baños a Burgos … cambiador"), discounts@8, Rossa@10 ("En noviembre llega YaIré"), murcia@11 ("Veinte de diciembre de dos mil veintidós"), gauge@13, pajares@22 ("Veintinueve de noviembre de dos mil veintitrés … ancho mixto, con cambiador en Pola de Lena"), extremadura@23, s106@28 ("Mayo de dos mil veinticuatro: el S106 … Treinta trenes").
  - futuretender@50 (2026-03), climate@105 (2030-10), rural@164 (2035-09), industry@228 (2041-01, "dieciocho meses de cola"), legacyvote@300 (2047-01, "Quedan cuatro años").
  - A 2027–2034 timeline cannot honestly play the 2022–2024 ones as current news. Either the timeline starts in 2022, or they become past context (for example a backstory or newsreel) and are not shown as live decisions.
- **Chapters.** `story.js:15-19`, year starts 2022/2024/2028/2035/2042, with explicit asks:
  - recovery: "media flota parada … encarga material sin vaciar la caja"
  - competition: "construye algún cambiador de ancho"
  - mediterranean: "AVE de València a Barcelona y la alta velocidad en Almería. Pon tercer carril"
  - territory: "Electrifica lo que siga con gasóleo, lleva el AVE a más ciudades y termina alguna línea nueva"
  - legacy: "AVE hasta en el último rincón … cuentas que no den vergüenza"
  
  They work as act intros only if the act's objectives are exactly those.
- **The 50 guide takes** (36 induction + 14 feedback) encode exact classic mechanics:
  - "Enero de 2022"
  - "Contratar veinte cuesta 0,3 M€"; training "tres meses"
  - "Venta online cuesta diez millones y tarda cuatro meses; ERTMS, treinta y cinco y doce meses"
  - "abrir cuesta cuatro millones" / "abrir cuesta 4 M€"
  - incident team "18.000 euros", reduces delay "al treinta por ciento"; bus "9.000" (= `RESPONSES` in `operations.js:49-53`)
  - "Cada jornada avanza un día. Al cerrar el mes…"
  - handoff "dieciocho meses", "dieciocho millones" public / "veintiséis" commercial, "+25 %"
  - Madrid–València offer, Madrid–Salamanca Alvia through the existing changer, Soria branch without catenary, S130 electric, S730 hybrid
  
  Keep that first-turn loop, with its values, as the unified tutorial. Otherwise these 50 takes stay listening-room-only, which weakens the AGENTS shared-recordings rule.
- **Events** (`story.js:40-63`), with conditions `from`/`months`/`needsWorks` (`engine.js:160`):
  - eufunds: "Durante dos años … cuarenta por ciento más baratas" (implemented)
  - busprice: "billetes a cinco euros"
  - cable: "tres kilómetros de cable de señalización … pagar el doble"
  - snow: "la catenaria se ha congelado en tres puertos", so it needs electrified mountain corridors
  - heatwave: "limitar velocidades"
  - adifdelay and adifboost: need works in progress
  - teruel: "tren decente, con catenaria y sin gasóleo"
  - wifi and influencer: viral video
  - luggage: refit coaches
- **Arcs** (`tycoon.js:9`): price war with OuiOui; Pajares; Mediterranean; rural ("El autobús de las seis"); elections ("Se acercan las elecciones"). These suit the unified 2-legislature election loop.
- **Rescue duplicates you can drop in favour of recorded classic bodies.** This saves recording time, but the trigger must match the classic wording and speaker:

| Rescue line (unrecorded) | Recorded classic body |
|---|---|
| `ev-cable` (adif) | `event:cable` (adif; "tres kilómetros… señalización", not "cuatro kilómetros… cobre… el Sur") |
| `ev-nevada` (adif) | `event:snow` (adif) |
| `ev-huelga` (workshop) | `event:strike` (workshop) |
| `ev-auditoria` (treasury) | `event:audit` (treasury) |
| `ev-viral` (riders) | `event:influencer` (riders) |
| `ev-calor` (riders) | `event:heatwave` (adif) / `decision:climate` (president) |
| `ev-tuneles` (riders) | `decision:gauge` (minister; "trenes … de vía estrecha no caben por los túneles del norte. No son nuestros") |
| `ev-fondos` (president) | `event:eufunds` (treasury) |
| `ev-visita` (minister) | `event:royal` (president) |
| `ev-lowgo` (rival) | `decision:Rossa` / `event:busprice` / `arc:0` |
| `stage-s3` "gánanos las elecciones" / `el-forecast` | `arc:4` and `event:election` |

### 6.4 Listening room (`dialogos.html`) implications

- **Where the rows come from.**
  - Rows are the frozen `web-source/dialogue-catalogue.json`: 412 rows with `kind` labels (Primer turno / Respuesta de la guía / Capítulo / Encargo / Consejo de dirección / Imprevisto / Situación) and 3.6.3 titles.
  - `build-web.mjs` adds availability and URLs, and appends rescue rows as `kind:'Rescate de Tenfe', title:<line id>` (`:220-222`). The title is the raw line id (`t-1`), which is poor UX.
- **Labels in the template.**
  - `412` and `diálogos pendientes (__WEB_PENDING__)` are computed only from classic rows (`build-web.mjs:291`).
  - "Paco: N" counts classic only (`:198`).
  - The page title is "Todos los diálogos nuevos."
- **What can change safely.** Titles and kind labels are metadata. The build only checks `row.text === canonical.raw`, `take.person === row.person` and ids (`build-web.mjs:170-173`). They can be re-labelled to the unified context, so the listening room describes where each line plays, without touching the producer.
- **If new lines are added,** generalise the counts to `available/expected` across both catalogues, and give rescue rows real titles and the `name` of the person (already done) instead of ids.
- **Same files.** The game and the listening room must keep serving the identical files (`assets/voces/*`, `assets/rescate-voces/*`).
- **Stale tests.** `voice-listening-ui-test.mjs` expects exactly 412 rows (`:25`, `:175`) and must be adapted.

### 6.5 Minimal publication checklist for the unified release

1. Keep the 412 bodies frozen. Confirm `node tools/extract-game-source.mjs --source <scratch>` still matches SHA `6348984c…`.
2. Record new lines with `build_rescate_voices.py --model <outside Git> --stage <outside Git>`, then `--package`.
3. Run `node tools/build-web.mjs` (default manifest; previous `release.json` provides the 412 MP3s).
4. Run the gates: Node suites (fixed `test.mjs`), the unified UI test (adapted #15) and the reachability/truthfulness tests.
5. Commit source, builder, assets and `release.json` together on `main` (AGENTS).
6. Run `node tools/verify-pages.mjs <URL> docs/pages-<ver>-https-proof.json`, keeping first-attempt failures.
7. Bump `?v=`, the version strings and the docs.
