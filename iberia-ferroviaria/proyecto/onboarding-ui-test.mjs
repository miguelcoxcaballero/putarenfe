// Primera apertura y tutorial con Chromium sobre el HTML autónomo.
// Uso: GAME_URL=http://127.0.0.1:8002/Iberia-Ferroviaria.html node onboarding-ui-test.mjs [módulo de Playwright]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {INDUCTION_STAGES} from './dist/induction.js';
import {CHARACTERS} from './dist/story.js';
import * as O from './dist/operations.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const pwPath = process.argv[2] || process.env.PLAYWRIGHT_MODULE || 'playwright';
const {chromium} = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
const html = process.env.GAME_URL || pathToFileURL(path.join(root, '../outputs/Iberia-Ferroviaria.html')).href;
const out = process.env.ONBOARDING_SCREENSHOTS || path.join(root, '../investigacion/verificacion-3.6.2-tutorial');
const SAVE_KEY = 'iberia-ferroviaria-v2';
fs.mkdirSync(out, {recursive: true});

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const errors = [], done = [], passages = new Map();
const taskFixtures = new Map();
const fixturePath = '/tmp/iberia-first-turn-test-fixtures.json';

function cacheTaskFixture(id, fixture) {
  taskFixtures.set(id, fixture);
  fs.writeFileSync(fixturePath, JSON.stringify(Object.fromEntries(taskFixtures)));
}

async function openPage(context, label) {
  const page = await context.newPage();
  // Optional resource guard for shared CPU-only QA. Each visible map state
  // still paints once; this suite does not assess animation performance.
  if(process.env.QA_STATIC_MAP)await page.addInitScript(()=>{
    const timer=setInterval(()=>{
      const g=window.railwayGame,m=g?.map;if(!m)return;clearInterval(timer);
      const original=m.opts.isVisible;let previous;
      m.opts.isVisible=()=>{
        if(original?.()===false)return false;
        const s=g.state(),op=s.ops;
        const key=[m.layer,m.selected,m.selectedCity,m.selectedTramo,m.zoom,m.pan.x,m.pan.y,m.w,m.h,s.month,s.infra.ver,op.phase,op.day,op.incidents.length,op.resolved.length,s.projects.filter(p=>!p.done).length,s.routes.map(r=>[r.id,r.active,r.frequency,r.fleet,r.level].join(':')).join('|')].join('#');
        if(key===previous)return false;previous=key;return true;
      };
    },100);
  });
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  page.on('pageerror', error => errors.push(label + ': ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(label + ': ' + message.text()); });
  await page.goto(html, {waitUntil: 'load'});
  await page.waitForFunction(() => Boolean(window.railwayGame));
  await page.evaluate(() => { window.railwayGame.voices.enabled = false; });
  return page;
}

const shot = (page, name) => page.screenshot({path: path.join(out, name + '.png'), animations:'disabled', timeout:60000});
const snapshot = page => page.evaluate(() => window.railwayGame.snapshot());
const savedText = page => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);

async function click(page, selector) {
  if (process.env.TRACE_UI) console.log('→ ' + selector);
  const button = page.locator(selector);
  assert.equal(await button.count(), 1, 'control inequívoco: ' + selector);
  assert(await button.isVisible(), 'control visible: ' + selector);
  assert(await button.isEnabled(), 'control disponible: ' + selector);
  await button.scrollIntoViewIfNeeded();
  await button.click();
}

/** Portada → Nueva partida → 2022 · La herencia con la semilla de siempre (72022), para un turno guiado reproducible. */
async function startHerencia(page) {
  await click(page, '.main-menu [data-action=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  await click(page, '.np-screen [data-action=np-pick][data-id=herencia]');
  await page.fill('#npSeed', '72022');
  await click(page, '.np-screen [data-action=np-begin]');
  if (await page.locator('.np-screen .np-confirm').count()) await click(page, '.np-screen [data-action=np-yes]');
}
/** Nueva partida → (Maqueta con sus reglas) → «Empezar» hasta la confirmación, sin aceptarla; o ← sin empezar. */
async function newGameAndBack(page, {maqueta = false, cash, rivals, confirm = false} = {}) {
  await click(page, '.main-menu [data-action=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  if (maqueta) await click(page, '.np-screen [data-action=np-pick][data-id=maqueta]');
  if (cash) await click(page, `.np-screen [data-action=np-cash][data-id="${cash}"]`);
  if (rivals !== undefined) await click(page, `.np-screen [data-action=np-rivals][data-id=${rivals ? 'on' : 'off'}]`);
  if (confirm) {
    await click(page, '.np-screen [data-action=np-begin]');
    await page.waitForSelector('.np-screen .np-confirm');
    await click(page, '.np-screen [data-action=np-no]');
  }
  await click(page, '.np-screen [data-action=np-back]');
  await page.waitForSelector('#modal[open] .main-menu:not(.np-screen)');
}

async function noHorizontalOverflow(page, label) {
  assert(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), label + ' sin desplazamiento horizontal');
}

async function reachable(page, selector, label) {
  const element = page.locator(selector);
  assert(await element.isVisible(), label + ' visible');
  await element.scrollIntoViewIfNeeded();
  const bounds = await element.boundingBox(), viewport = page.viewportSize();
  assert(bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, label + ' dentro de la pantalla');
}

async function singleTutorialWorkspace(page, label) {
  assert(await page.locator('#coach').isVisible(), label + ': espacio de trabajo visible');
  for (const selector of ['.hud', '#mission', '#drawer', '#inspector']) {
    assert.equal(await page.locator(selector).isVisible(), false, label + ': ' + selector + ' no compite con el tutorial');
  }
  await noHorizontalOverflow(page, label);
}

async function unobstructed(page, selector, label) {
  const control = page.locator(selector);
  await reachable(page, selector, label);
  assert(await control.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return hit === element || element.contains(hit);
  }), label + ': ningún panel tapa el control');
}

async function task(page, id) {
  await page.waitForSelector(`#coach[data-step-id="${id}"][data-kind="task"]`);
  assert.equal((await snapshot(page)).tutorial.phase, 'task', 'fase de acción en ' + id);
  await singleTutorialWorkspace(page, 'Mesa de ' + id);
}

async function briefing(page, stage) {
  await page.waitForSelector(`.induction-dialog[data-step-id="${stage.id}"][data-kind="briefing"]`);
  assert.equal((await snapshot(page)).tutorial.line, 0, 'una introducción automática por encargo');
  await recordPassage(page);
  await click(page, '#modal [data-action=tutorial-next]');
  await task(page, stage.id);
  cacheTaskFixture(stage.id, await snapshot(page));
}

async function recordPassage(page) {
  const dialog = page.locator('.induction-dialog');
  const who = await dialog.getAttribute('data-character'), kind = await dialog.getAttribute('data-kind');
  if (!['briefing', 'debrief'].includes(kind)) return;
  const cursor = (await snapshot(page)).tutorial;
  const key = cursor.step + ':' + kind + ':' + cursor.line;
  if (!passages.has(who)) passages.set(who, new Set());
  passages.get(who).add(key);
  assert(CHARACTERS[who], 'voz de un personaje del reparto');
  assert.equal(await page.locator('#modal .plate b').textContent(), CHARACTERS[who].name, 'retrato y voz corresponden al personaje');
  assert.match(await page.locator('#modal .art.portrait').getAttribute('style'), /data:image\/jpeg/, 'retrato fotográfico al hablar');
}

async function rejectUnchecked(page, id) {
  const before = (await snapshot(page)).tutorial;
  assert.equal(await page.locator('#coach [data-action=tutorial-next]').count(), 0, id + ' muestra la siguiente acción pendiente, sin botón de omitir');
  // El controlador también debe comprobar los objetivos aunque se dispare un clic artificial.
  await page.evaluate(() => { const button=document.createElement('button');button.dataset.action='tutorial-next';document.body.appendChild(button);button.click();button.remove(); });
  const after = (await snapshot(page)).tutorial;
  assert.equal(after.step, before.step, id + ' no se puede omitir');
  assert.equal(after.phase, 'task', id + ' conserva la tarea pendiente');
}

async function answer(page, stage, choice, accepted) {
  const before = await snapshot(page);
  await click(page, `#coach [data-action=tutorial-answer][data-choice="${choice}"]`);
  await page.waitForSelector(`.induction-dialog[data-step-id="${stage}"][data-kind="feedback"]`);
  const feedback = await page.locator('.induction-dialog [data-say]').getAttribute('data-say');
  assert(feedback.length > 100, 'la respuesta explica el motivo y la consecuencia');
  assert.equal((await snapshot(page)).tutorial.answers[stage], before.tutorial.answers[stage], 'la respuesta se confirma después de leer la explicación');
  await click(page, '#modal [data-action=tutorial-next]');
  await task(page, stage);
  const after = await snapshot(page);
  assert.equal(after.cash, before.cash, 'el ensayo no regala ni quita dinero');
  assert.equal(after.reputation, before.reputation, 'el ensayo no modifica la reputación');
  assert.equal(after.tutorial.answers[stage], accepted ? choice : undefined, accepted ? 'respuesta razonada guardada' : 'la respuesta incorrecta permite volver a intentarlo');
}

async function debrief(page, stage) {
  await task(page, stage.id);
  await page.waitForSelector('#coach [data-action=tutorial-next]');
  await click(page, '#coach [data-action=tutorial-next]');
  for (let line = 0; line < stage.debrief.length; line++) {
    await page.waitForSelector(`.induction-dialog[data-step-id="${stage.id}"][data-kind="debrief"]`);
    await recordPassage(page);
    await click(page, '#modal [data-action=tutorial-next]');
  }
}

async function advice(page, id, index) {
  const before = await snapshot(page);
  await click(page, '#coach .lesson-advice > summary');
  await unobstructed(page, `#coach [data-action=tutorial-advice][data-id="${index}"]`, 'Consultar consejo de ' + id);
  await click(page, `#coach [data-action=tutorial-advice][data-id="${index}"]`);
  await page.waitForSelector(`.induction-dialog[data-step-id="${id}"][data-kind=advice]`);
  assert.equal(await page.locator('.induction-dialog').getAttribute('data-character'), INDUCTION_STAGES.find(stage => stage.id === id).briefing[index].who);
  await click(page, '#modal [data-action=tutorial-advice-close]');
  await task(page, id);
  const after = await snapshot(page);
  assert.equal(after.cash, before.cash, 'consultar consejo no gasta');
  assert.equal(after.tutorial.step, before.tutorial.step, 'consultar consejo no avanza el encargo');
  assert.equal(after.tutorial.phase, 'task');
}

async function draftPlan(page) {
  const old = (await snapshot(page)).routes.find(route => route.id === 'madrid-valencia');
  await page.locator('#frequency').focus();
  await page.locator('#frequency').press('ArrowRight');
  await page.locator('#fare').fill(String(old.fare + 1));
  await page.waitForTimeout(500);
  assert.equal(Number(await page.inputValue('#frequency')), old.frequency + 1, 'el borrador de salidas sobrevive a varios fotogramas');
  assert.equal(Number(await page.inputValue('#fare')), old.fare + 1, 'el borrador de tarifa sobrevive a varios fotogramas');
  await advice(page, 'offer', 1);
  assert.equal(Number(await page.inputValue('#frequency')), old.frequency + 1, 'un consejo conserva el borrador de salidas');
  assert.equal(Number(await page.inputValue('#fare')), old.fare + 1, 'un consejo conserva el borrador de tarifa');
  const draft = (await snapshot(page)).routes.find(route => route.id === old.id);
  assert.equal(draft.frequency, old.frequency, 'el borrador aún no modifica el servicio');
  assert.equal(draft.fare, old.fare);
  assert.match(await page.locator('#routePreview').textContent(),/viajeros\/mes/,'el borrador conserva una previsión útil');
  await unobstructed(page, '#routeForm button[type=submit]', 'Aplicar plan');
  await click(page, '#routeForm button[type=submit]');
  const applied = (await snapshot(page)).routes.find(route => route.id === old.id);
  assert.equal(applied.frequency, old.frequency + 1);
  assert.equal(applied.fare, old.fare + 1);
}

async function focusedFixtureChecks() {
  const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const selected = process.env.FIXTURE_STAGES?.split(',');
  const entries = Object.entries(fixtures).filter(([id]) => !selected || selected.includes(id));
  assert(entries.length,'hay encargos capturados para comprobar');
  for (const [label, viewport] of [['escritorio', {width:1440,height:900}], ['movil', {width:390,height:844}]]) {
    const context = await browser.newContext({viewport, ...(label==='movil'?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});
    const page = await openPage(context, label);
    for (const [id, fixture] of entries) {
      await page.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {key:SAVE_KEY,value:fixture});
      await page.reload();
      await click(page, '.main-menu [data-action=continue]');
      await task(page, id);
      await singleTutorialWorkspace(page, label+' '+id);
      const controls = page.locator('#coach .lesson-controls button:not([disabled]), #coach .lesson-controls input, #coach .lesson-controls select');
      for (let index=0;index<await controls.count();index++) {
        const control=controls.nth(index);
        if(!await control.isVisible())continue;
        await control.scrollIntoViewIfNeeded();
        assert(await control.evaluate(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===element||element.contains(hit);}),label+' '+id+': control sin solapamiento');
      }
      await shot(page, 'enfoque-'+label+'-'+id);
      if(id==='offer')await draftPlan(page);
      if(id==='mandate')await advice(page,id,1);
      if(id==='competition'){
        if(await page.locator('#coach [data-action=tutorial-view][data-id=market]').count())await click(page,'#coach [data-action=tutorial-view][data-id=market]');
        await click(page,'#coach [data-action=tutorial-view][data-id=research]');
        const before=await snapshot(page);
        if(label==='escritorio'){
          const forecast=await page.evaluate(()=>{const g=window.railwayGame,s=g.state(),r=s.routes.find(r=>r.id==='madrid-valencia');return {cost:g.engine.balance(s).cost,punctuality:g.engine.metrics(s,r).punctuality};});
          await click(page,'#coach [data-action=tycoon-policy][data-id=wifi]');
          assert((await snapshot(page)).tycoon.policies.includes('wifi'));
          const changed=await page.evaluate(()=>{const g=window.railwayGame,s=g.state(),r=s.routes.find(r=>r.id==='madrid-valencia');return {cost:g.engine.balance(s).cost,punctuality:g.engine.metrics(s,r).punctuality};});
          assert(changed.cost>forecast.cost&&changed.punctuality>forecast.punctuality,'wifi modifica costes y servicio real');
        }else{
          await click(page,'#coach [data-action=tutorial-hold]');
          const after=await snapshot(page);assert.equal(after.cash,before.cash);assert.equal(after.tycoon.research,null);assert.equal(after.tycoon.policies.length,before.tycoon.policies.length);
        }
        await page.waitForSelector('#coach [data-action=tutorial-next]');
      }
    }
    await context.close();
  }
  assert.deepEqual(errors,[],'sin errores JavaScript al restaurar los nueve encargos');
  console.log(`✓ ${entries.length} mesas en escritorio y móvil sin solapamientos; borradores, consejos y decisiones conservados.`);
}

async function recoveryChecks() {
  const fixtures=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
  const width=Number(process.env.ONBOARDING_RECOVERY_WIDTH||1440);
  const context=await browser.newContext({viewport:{width,height:width<600?844:900},...(width<600?{isMobile:true,hasTouch:true,deviceScaleFactor:2}:{})});
  const page=await openPage(context,'recuperación');
  const incident=()=>{
    const state=structuredClone(fixtures.incident);
    state.tutorial.marks=state.tutorial.marks.filter(mark=>mark!=='incident-resolved');
    delete state.tutorial.answers.incident;
    state.ops.incidents=state.ops.incidents.filter(item=>item.id!=='inc-tut');
    state.ops.resolved=state.ops.resolved.filter(id=>!id.startsWith('inc-tut-'));
    if(state.ops.phase==='review')O.nextDay(state);
    if(state.ops.phase==='planning')O.startDay(state);
    return state;
  };
  const running=incident();
  const review=incident();review.ops.minute=O.dayBounds(O.servicePlan(review)).last;O.endDay(review);
  const late=incident();late.ops.minute=O.dayBounds(O.servicePlan(late)).last;
  const report=structuredClone(fixtures.review);
  if(report.ops.phase==='planning')O.startDay(report);
  if(report.ops.phase==='running'){report.ops.minute=O.dayBounds(O.servicePlan(report)).last;O.endDay(report);}
  O.nextDay(report);report.tutorial.marks=report.tutorial.marks.filter(mark=>mark!=='report');
  for(const [label,state] of [['running',running],['review',review],['late',late],['unread-report',report]]){
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:SAVE_KEY,value:state});
    await page.reload();await click(page,'.main-menu [data-action=continue]');
    await task(page,label==='unread-report'?'review':'incident');
    if(label==='unread-report'){
      assert.equal(await page.locator('#coach [data-action=tutorial-next]').count(),0,'el parte restaurado sigue pendiente de lectura');
      assert.match(await page.locator('#coach .lesson-controls').textContent(),/Puntualidad/);
      await click(page,'#coach [data-action=tutorial-view][data-id=report]');
      assert((await snapshot(page)).tutorial.marks.includes('report'));
      await page.waitForSelector('#coach [data-action=tutorial-next]');
    }else{
      if(label==='late'){
        await click(page,'#coach [data-action=tutorial-recover-day]');
        assert.equal((await snapshot(page)).ops.completed,state.ops.completed+1,'recuperar un turno tardío cierra la jornada real');
      }
      if(label!=='running'){
        await click(page,'#coach [data-action=day-next]');
        assert.equal((await snapshot(page)).ops.phase,'planning');
        await click(page,'#coach [data-action=day-start]');
      }
      const before=await snapshot(page),actual=before.ops.incidents.find(item=>item.id==='inc-tut');
      assert(actual,'la reanudación ofrece una avería atendible: '+label);
      await unobstructed(page,`#coach [data-action=respond][data-id="${actual.trip}"][data-option=team]`,'Atender avería restaurada');
      await click(page,`#coach [data-action=respond][data-id="${actual.trip}"][data-option=team]`);
      const after=await snapshot(page);
      assert(after.ops.resolved.includes(actual.trip));
      assert(Math.abs(after.cash-(before.cash-.018))<1e-8,'la recuperación conserva el coste real de intervención');
      await page.waitForSelector('#coach [data-action=tutorial-next]');
    }
    await shot(page,'recuperacion-'+label);
  }
  await context.close();
  assert.deepEqual(errors,[],'sin errores al recuperar turnos parcialmente operados');
  console.log('✓ Reanudación de incidencia en circulación, parte y fin de jornada; lectura pendiente del último parte.');
}

try {
  if(process.env.ONBOARDING_RECOVERY_ONLY){
    await recoveryChecks();
  }else if(process.env.ONBOARDING_FIXTURES_ONLY){
    await focusedFixtureChecks();
  }else{
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await openPage(context, 'escritorio');
  if(process.env.ONBOARDING_COMPLETED_ONLY){
    for(const [id,value] of Object.entries(JSON.parse(fs.readFileSync(fixturePath,'utf8'))))taskFixtures.set(id,value);
    await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key:SAVE_KEY,value:fs.readFileSync('/tmp/iberia-first-turn-completed-save.json','utf8')});
    await page.reload();await click(page,'.main-menu [data-action=continue]');
    assert.equal((await snapshot(page)).tutorial.done,true,'el punto de control procede de los nueve encargos completados');
    done.push('Continuación desde el guardado real obtenido al completar los nueve encargos.');
  }else{
  assert.equal(await page.title(), 'Iberia Ferroviaria · Tenfe 2022–2050');
  await page.waitForSelector('.main-menu');
  assert.equal(await page.locator('.menu-council img').count(), 9, 'el menú presenta el reparto completo');
  assert(await page.locator('.menu-council img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'retratos del menú cargados');
  assert(await page.locator('.main-menu-art').evaluate(element => getComputedStyle(element).backgroundImage !== 'none'), 'portada ilustrada');
  assert.equal(await savedText(page), null, 'la primera apertura no crea una partida');
  await noHorizontalOverflow(page, 'Menú de escritorio');
  await shot(page, '01-menu-ilustrado');
  await click(page, '.main-menu [data-action=menu-guide]');
  assert.match(await page.locator('#modal').textContent(), /maquinistas.*tres meses/i);
  await click(page, '#modal [data-action=menu-home]');
  await click(page, '.main-menu [data-action=menu-settings]');
  assert.equal(await page.locator('#modal [data-action=voice-toggle]').count(), 1, 'ajuste de voces accesible desde la portada');
  await click(page, '#modal [data-action=close-modal]');
  await page.waitForSelector('.main-menu');
  await newGameAndBack(page, {maqueta: true, cash: 1500});
  assert.equal(await savedText(page), null, 'volver de la Maqueta conserva la primera apertura');
  done.push('Menú ilustrado, nueve retratos, guía, sonido y Maqueta cancelable antes de crear una partida.');

  await startHerencia(page);
  await page.waitForSelector('#modal [data-action=decision]');
  await shot(page, '02-primer-mandato');
  await click(page, '#modal [data-action=decision][data-choice="0"]');
  await page.waitForSelector('.induction-dialog[data-step-id=mandate]');
  await recordPassage(page);
  await click(page, '#modal [data-action=tutorial-next]');
  const resumeCursor = (await snapshot(page)).tutorial;
  assert.equal(resumeCursor.phase, 'task');
  assert.equal(resumeCursor.line, 0);
  await page.reload();
  await page.waitForSelector('.main-menu [data-action=continue]');
  await click(page, '.main-menu [data-action=continue]');
  const resumed = (await snapshot(page)).tutorial;
  assert.equal(resumed.step, resumeCursor.step);
  assert.equal(resumed.phase, resumeCursor.phase);
  assert.equal(resumed.line, resumeCursor.line, 'recargar conserva el punto del primer encargo');
  await shot(page, '03-tutorial-retomado');
  await task(page, 'mandate');
  cacheTaskFixture('mandate', await snapshot(page));
  await rejectUnchecked(page, 'mandate');
  await advice(page, 'mandate', 2);
  await answer(page, 'mandate', 'balanced', true);
  await debrief(page, INDUCTION_STAGES[0]);
  done.push('La partida y la intervención exacta del tutorial sobreviven a una recarga.');

  for (const stage of INDUCTION_STAGES.slice(1)) {
    await briefing(page, stage);
    await rejectUnchecked(page, stage.id);
    switch (stage.id) {
      case 'diagnosis': {
        assert.equal(await page.locator('#coach [data-action=tutorial-answer]').count(),0,'el diagnóstico muestra primero los datos necesarios');
        for(const view of ['gauge','power','salamanca']){
          await unobstructed(page,`#coach [data-action=tutorial-view][data-id=${view}]`,'Consultar '+view);
          await click(page,`#coach [data-action=tutorial-view][data-id=${view}]`);
          await singleTutorialWorkspace(page,'Diagnóstico '+view);
        }
        await answer(page, stage.id, 'fixed', false);
        await answer(page, stage.id, 'variable', true);
        await click(page, '#coach [data-action=tutorial-skip]');
        const paused = await snapshot(page);
        assert.equal(paused.tutorial.done, false, 'pausar no completa el tutorial');
        assert.equal(paused.tutorial.suspended, true);
        assert.equal(paused.tutorial.phase, 'task');
        assert.equal(await page.locator('#coach').count(), 0);
        assert(await page.locator('.hud').isVisible(),'pausar devuelve la interfaz de gestión');
        await page.evaluate(() => { window.railwayGame.state().tycoon.encounter = 'scene-treasury-happy-0'; });
        await click(page, '[data-action=day-start]');
        await page.waitForSelector('#modal [data-action=decision]');
        await click(page, '#modal [data-action=decision][data-choice="0"]');
        assert.equal((await snapshot(page)).tutorial.suspended, true, 'atender una decisión ordinaria no reactiva un turno pausado');
        assert.equal(await page.locator('#coach, .induction-dialog').count(), 0, 'la pausa mantiene libre la interfaz');
        await click(page, '[data-action=help]');
        await click(page, '#modal [data-action=tutorial-start]');
        await task(page, stage.id);
        assert.equal((await snapshot(page)).tutorial.answers.diagnosis, 'variable', 'retomar conserva el diagnóstico');
        assert.equal((await snapshot(page)).tutorial.suspended, false);
        await shot(page, '04-diagnostico-objetivos');
        break;
      }
      case 'offer': {
        await draftPlan(page);
        await shot(page,'05-oferta-aplicada');
        break;
      }
      case 'people': {
        await click(page,'#coach [data-action=tutorial-view][data-id=people]');
        await click(page,'#coach .lesson-optional > summary');
        const before = await snapshot(page);
        await click(page, '#coach [data-action=tycoon-hire]');
        const after = await snapshot(page), group = after.tycoon.training.at(-1);
        assert.equal(group.count, 20);
        assert.equal(group.due, before.month + 3, 'la formación tiene fecha, no conductores instantáneos');
        assert.equal(after.tycoon.drivers, before.tycoon.drivers);
        assert(Math.abs(after.cash - (before.cash - .3)) < 1e-8, 'la contratación paga su anticipo real');
        await answer(page, stage.id, 'instant', false);
        await answer(page, stage.id, 'pipeline', true);
        await shot(page, '06-plantilla-y-formacion');
        break;
      }
      case 'competition': {
        assert.match(await page.locator('#coach .lesson-controls').textContent(),/OuiOui/,'se compara competencia que existe ahora');
        await click(page,'#coach [data-action=tutorial-view][data-id=market]');
        await click(page,'#coach [data-action=tutorial-view][data-id=research]');
        const before = await snapshot(page);
        await click(page, '#coach [data-action=tycoon-research][data-id=online]');
        const after = await snapshot(page);
        assert.equal(after.tycoon.research.id, 'online');
        assert.equal(after.tycoon.research.due, before.month + 4);
        assert.equal(after.cash, before.cash - 10);
        assert(!after.tycoon.tech.includes('online'), 'la investigación no regala sus efectos antes de acabar');
        await shot(page, '07-investigacion-con-plazo');
        break;
      }
      case 'infrastructure': {
        const before = await snapshot(page);
        await click(page, '#coach [data-action=open-route][data-id=madrid-salamanca]');
        const opened = await snapshot(page);
        assert(opened.routes.find(route => route.id === 'madrid-salamanca').active, 'Salamanca deja de ser una promesa');
        assert.equal(opened.cash, before.cash - 4, 'reabrir paga el coste del juego');
        await page.waitForSelector('#coach [data-action=tutorial-quote]');
        assert.match(await page.locator('#coach .lesson-controls').textContent(),/Torralba — Soria/);
        await shot(page,'08-presupuesto-soria');
        await click(page,'#coach [data-action=tutorial-quote]');
        const quote = await snapshot(page);
        assert.equal(quote.cash, opened.cash, 'pedir presupuesto no adjudica una obra');
        assert.equal(quote.projects.length, opened.projects.length);
        await rejectUnchecked(page, stage.id);
        await answer(page, stage.id, 'ave', false);
        await answer(page, stage.id, 'power', true);
        break;
      }
      case 'incident': {
        await click(page, '#coach [data-action=day-start]');
        const started = await snapshot(page), incident = started.ops.incidents.find(item => item.id === 'inc-tut');
        assert.equal(started.ops.phase, 'running');
        assert(incident, 'la avería afecta a una circulación real');
        const before = await snapshot(page);
        await click(page, `#coach [data-action=respond][data-id="${incident.trip}"][data-option=team]`);
        const after = await snapshot(page);
        assert(after.ops.resolved.includes(incident.trip));
        assert.equal(after.ops.choices[incident.trip], 'team');
        assert(Math.abs(after.cash - (before.cash - .018)) < 1e-8, 'resolver moviliza y paga al equipo');
        const delay = await page.evaluate(id => window.railwayGame.plan().find(trip => trip.id === id)?.delay, incident.target);
        assert(delay < incident.delay, 'la decisión reduce la demora de un tren del plan');
        await shot(page, '09-incidencia-resuelta');
        break;
      }
      case 'review': {
        const before = await snapshot(page);
        await click(page, '#coach [data-action=day-end]');
        await page.waitForSelector('#coach [data-action=day-next]');
        const report = await snapshot(page);
        assert.equal(report.ops.phase, 'review');
        assert.equal(report.ops.completed, before.ops.completed + 1);
        assert(report.ops.last.trains > 0 && report.ops.last.passengers > 0, 'el parte contiene una jornada operada');
        await shot(page, '10-parte-del-turno');
        await click(page, '#coach [data-action=day-next]');
        const next = await snapshot(page);
        assert.equal(next.ops.day, before.ops.day + 1);
        assert.equal(next.month, before.month, 'un día no liquida tres meses');
        assert.equal(next.tycoon.drivers, before.tycoon.drivers);
        assert.equal(next.tycoon.training.at(-1).due, before.month + 3);
        assert.equal(next.tycoon.research.id, 'online');
        break;
      }
      case 'handoff': {
        const before = await snapshot(page);
        assert.equal(before.tycoon.contracts[0].status, 'offered');
        await click(page, '#coach [data-action=tycoon-public]');
        const after = await snapshot(page);
        assert.equal(after.tycoon.contracts[0].status, 'active');
        assert.equal(after.tycoon.contracts[0].reward, 18);
        assert.equal(after.cash, before.cash, 'el premio llega al cumplir, no al aceptar');
        await answer(page, stage.id, 'public', true);
        break;
      }
      default: assert.fail('Falta un recorrido real para ' + stage.id);
    }
    await debrief(page, stage);
  }
  await page.waitForSelector('.induction-finish');
  assert.equal((await snapshot(page)).tutorial.done, true);
  const expectedPassages = INDUCTION_STAGES.reduce((sum, stage) => sum + 1 + stage.debrief.length, 0);
  assert.equal([...passages.values()].reduce((sum, set) => sum + set.size, 0), expectedPassages, 'solo la voz principal y el balance son obligatorios');
  for (const who of Object.keys(CHARACTERS)) assert(passages.get(who)?.size >= 2, who + ' interviene varias veces sin consejos opcionales');
  await shot(page, '11-primer-turno-completado');
  await click(page, '#modal [data-action=tutorial-finish]');
  fs.writeFileSync('/tmp/iberia-first-turn-completed-save.json', await savedText(page));
  done.push('Nueve encargos reales: diagnóstico, oferta, personal, competencia, presupuesto, avería, parte y compromiso con fecha.');
  done.push('Los nueve personajes intervienen varias veces; tres respuestas erróneas se explican y no permiten omitir objetivos.');
  }

  const saveBeforeMenu = await savedText(page);
  await click(page, '[data-action=menu-home]');
  await page.waitForSelector('.main-menu');
  assert.equal(await savedText(page), saveBeforeMenu, 'abrir el menú conserva la partida');
  assert.match(await page.locator('.main-menu [data-action=continue]').textContent(), /Continuar\s*La herencia · /);
  await shot(page, '12-menu-con-partida');
  await newGameAndBack(page, {confirm: true});
  assert.equal(await savedText(page), saveBeforeMenu, 'la confirmación de La herencia no sustituye el guardado y «No» lo conserva');
  await newGameAndBack(page, {maqueta: true, cash: 5000, rivals: false});
  assert.equal(await savedText(page), saveBeforeMenu, 'volver de la Maqueta conserva el guardado');
  await newGameAndBack(page, {maqueta: true, confirm: true});
  assert.equal(await savedText(page), saveBeforeMenu, 'rechazar la sustitución por una Maqueta conserva el guardado');
  await click(page, '.main-menu [data-action=menu-settings]');
  await click(page, '#modal [data-action=close-modal]');
  await page.waitForSelector('.main-menu');
  assert.equal(await savedText(page), saveBeforeMenu, 'volver de ajustes conserva el guardado');
  await click(page, '.main-menu [data-action=observe]');
  await click(page, '[data-action=menu-home]');
  assert.equal(await savedText(page), saveBeforeMenu, 'el modo observador conserva el guardado');
  await click(page, '.main-menu [data-action=continue]');
  assert.equal((await snapshot(page)).tutorial.done, true, 'continuar no obliga a repetir la formación completada');
  await click(page, '[data-action=help]');
  await click(page, '#modal [data-action=tutorial-start]');
  assert.equal((await snapshot(page)).tutorial.done, true, 'consultar la formación completada no reinicia una partida modificada');
  done.push('Menú con guardado: confirmar antes de sustituirlo, rechazar La herencia o la Maqueta y observar sin perder la partida.');
  await context.close();

  for(const width of [390,320]){
  const mobileContext = await browser.newContext({viewport: {width, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const phone = await openPage(mobileContext, 'móvil '+width);
  await noHorizontalOverflow(phone, 'Menú móvil');
  await reachable(phone, '.main-menu [data-action=new-game]', 'Nueva partida en móvil');
  await shot(phone, '13-menu-movil-'+width);
  await click(phone, '.main-menu [data-action=new-game]');
  await noHorizontalOverflow(phone, 'Nueva partida móvil');
  for (const start of ['herencia', 'rescate', 'maqueta']) await reachable(phone, `.np-screen [data-action=np-pick][data-id=${start}]`, start + ' en móvil');
  await reachable(phone, '.np-screen [data-action=np-begin]', 'Empezar en móvil');
  await click(phone, '.np-screen [data-action=np-back]');
  await phone.waitForSelector('#modal[open] .main-menu:not(.np-screen)');
  await startHerencia(phone);
  await click(phone, '#modal [data-action=decision][data-choice="0"]');
  await phone.waitForSelector('.induction-dialog');
  await noHorizontalOverflow(phone, 'Intervención móvil');
  await reachable(phone, '#modal [data-action=tutorial-next]', 'Avanzar intervención en móvil');
  await shot(phone, '14-intervencion-movil-'+width);
  for (const [id, fixture] of taskFixtures) {
    await phone.evaluate(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {key: SAVE_KEY, value: fixture});
    await phone.reload();
    await phone.waitForSelector('.main-menu [data-action=continue]');
    await click(phone, '.main-menu [data-action=continue]');
    await task(phone, id);
    await singleTutorialWorkspace(phone,'Mesa móvil de '+id);
    const controls=phone.locator('#coach .lesson-controls button:not([disabled]), #coach .lesson-controls input, #coach .lesson-controls select');
    assert(await controls.count()>0,id+': hay controles para avanzar el encargo');
    for(let index=0;index<await controls.count();index++){
      const control=controls.nth(index);if(!await control.isVisible())continue;
      await control.scrollIntoViewIfNeeded();
      assert(await control.evaluate(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===element||element.contains(hit);}),id+': acción móvil sin paneles superpuestos a '+width);
    }
    if (id === 'diagnosis') await shot(phone, '15-diagnostico-movil-'+width);
    if (id === 'handoff') await shot(phone, '16-encargo-movil-'+width);
  }
  await mobileContext.close();
  }
  done.push('Móvil a 390 y 320 px: portada, intervenciones y los nueve encargos en una única mesa; controles accesibles y sin paneles superpuestos.');
  assert.deepEqual(errors, [], 'sin errores de JavaScript');
  console.log(done.map(line => '✓ ' + line).join('\n'));
  await recoveryChecks();
  }
} catch (error) {
  if (errors.length) console.error('Errores JavaScript observados:\n' + errors.join('\n'));
  for (const context of browser.contexts()) for (const page of context.pages()) {
    await shot(page, 'fallo-' + context.pages().indexOf(page)).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
}
