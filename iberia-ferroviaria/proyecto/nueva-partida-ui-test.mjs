// Una sola partida: portada con un único «Nueva partida», los tres arranques (2022, 2027 y Maqueta), semilla
// repetible, confirmación antes de sustituir un guardado, «Continuar» con la partida más reciente y móvil de 390 px.
// Uso: node nueva-partida-ui-test.mjs [URL] [ruta-a-playwright]   (sirve proyecto/dist, p. ej. en el puerto 8101)
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {seedFromCode, normalizeSeed} from './dist/nueva-partida.js';

const url = process.argv[2] || process.env.GAME_URL || 'http://127.0.0.1:8101/index.html';
const pwPath = process.argv[3] || process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const {chromium} = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
const out = path.resolve(process.env.NP_SCREENSHOTS || path.join(os.tmpdir(), 'nueva-partida-ui'));
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
const errors = [], done = [];
const CLASSIC = 'iberia-ferroviaria-v2', RESCUE = 'tenfe-rescate-v1';

function watch(page, label) {
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => errors.push(label + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(label + ': ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(label + ': HTTP ' + r.status() + ' ' + r.url()); });
}
const strip = s => { const copy = JSON.parse(JSON.stringify(s)); delete copy.savedAt; return copy; };
const classic = page => page.evaluate(() => window.railwayGame.snapshot());
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), key);
const noScroll = async (page, what) => assert(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('#modal *')].every(el => el.getBoundingClientRect().right <= innerWidth + 1 || el.closest('.menu-council ul'))), what + ' sin desplazamiento horizontal');
async function home(page) {
  await page.waitForSelector('#modal[open] .main-menu:not(.np-screen)');
}
/** Cierra la misión inicial y las escenas del rescate, y salta su tutorial, para llegar a su menú «Partida». */
async function rescueMenu(page) {
  for (let n = 0; n < 8 && await page.evaluate(() => !!document.querySelector('.rs-modal[open] .rs-choice')); n++) { await page.click('.rs-modal[open] .rs-choice'); await page.waitForTimeout(250); }
  await page.evaluate(() => document.querySelector('.rs [data-a=tutorial-skip]')?.click()); // el globo del tutorial se redibuja: clic directo
  await page.click('.rs [data-a=game-menu]');
  await page.waitForSelector('.rs-modal[open] .rs-seed');
}
/** «Menú» de la barra lateral; también con una decisión del consejo pendiente encima. */
async function toMenu(page) {
  await page.evaluate(() => document.querySelector('#navigation [data-action=menu-home]').click());
  await home(page);
}
async function openNew(page) {
  await page.click('.main-menu [data-action=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
}
/** Elige un arranque, sus reglas y la semilla, y pulsa «Empezar» (con la respuesta a la confirmación si la hay). */
async function start(page, {pick, cash, rivals, seed = '', confirm = null}) {
  await page.click(`.np-screen [data-action=np-pick][data-id=${pick}]`);
  if (cash) await page.click(`.np-screen [data-action=np-cash][data-id="${cash}"]`);
  if (rivals !== undefined) await page.click(`.np-screen [data-action=np-rivals][data-id=${rivals ? 'on' : 'off'}]`);
  await page.fill('#npSeed', seed);
  await page.click('.np-screen [data-action=np-begin]');
  if (confirm) {
    await page.waitForSelector('.np-screen .np-confirm');
    assert.equal((await page.locator('.np-confirm p').textContent()).trim(), `Hay una partida guardada de ${confirm}. ¿Empezar otra?`);
    await page.click('.np-screen [data-action=np-yes]');
  }
  if (pick === 'rescate') { await page.waitForSelector('#rescate'); await page.waitForTimeout(900); }
  else await page.waitForFunction(() => !document.querySelector('#modal[open] .np-screen'));
}

try {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  watch(page, 'escritorio');
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await home(page);
  await page.evaluate(() => { const g = window.railwayGame; g.voices.enabled = false; g.music.enabled = false; });

  // 1. Portada: un único botón principal con el foco y sin las entradas antiguas.
  assert.equal(await page.locator('#menu-departures-title').evaluate(el => el.outerHTML), '<h2 id="menu-departures-title">¿Adónde vamos?</h2>', 'ancla del publicador intacta');
  assert.equal(await page.locator('.main-menu [data-action=new-game]').count(), 1, 'un solo «Nueva partida»');
  assert.equal(await page.locator('.main-menu .menu-destination.menu-campaign').count(), 1, 'un único botón principal');
  for (const old of ['begin', 'free-setup', 'rescue-new', 'rescue-continue', 'continue']) assert.equal(await page.locator(`.main-menu [data-action=${old}]`).count(), 0, 'sin entrada separada: ' + old);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.action), 'new-game', '«Nueva partida» tiene el foco');
  await page.screenshot({path: path.join(out, '01-portada.png')});
  done.push('Portada: un solo «Nueva partida» con el foco, el ancla «¿Adónde vamos?» y sin campaña, libre ni rescate por separado.');

  // 2. Pantalla «Nueva partida»: tres arranques con foto; Esc y ← vuelven.
  await openNew(page);
  assert.equal(await page.locator('.np-start').count(), 3, 'tres arranques');
  assert.deepEqual(await page.locator('.np-start strong').allTextContents(), ['2022 · La herencia', '2027 · El rescate', 'Maqueta']);
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'herencia', 'La herencia viene elegida');
  assert.match(await page.locator('.np-start[data-id=herencia] .np-tag').textContent(), /Recomendada/);
  await page.waitForFunction(() => [...document.querySelectorAll('.np-start img')].every(img => img.complete && img.naturalWidth > 0));
  assert(await page.locator('.np-rules').isHidden(), 'las reglas de la maqueta solo aparecen con la Maqueta');
  assert.equal(await page.locator('#npSeed').getAttribute('placeholder'), 'Al azar');
  await page.screenshot({path: path.join(out, '02-nueva-partida.png')});
  assert.deepEqual(await page.locator('.np-start').evaluateAll(cards => cards.map(card => card.tabIndex)), [0, -1, -1], 'un solo arranque en el orden de tabulación');
  await page.focus('.np-start[data-id=herencia]');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'rescate', 'las flechas cambian de arranque');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.id), 'rescate', 'y llevan el foco');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'maqueta', 'en círculo');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await home(page);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); // Chromium cierra el diálogo con un segundo Esc seguido: la portada vuelve
  await home(page);
  assert(await page.evaluate(() => document.getElementById('modal').open), 'un segundo Esc no deja la pantalla sin portada');
  await openNew(page);
  await page.click('.np-screen [data-action=np-back]');
  await home(page);
  assert.equal(await page.evaluate(k => localStorage.getItem(k), CLASSIC), null, 'mirar los arranques no crea partida');
  done.push('Nueva partida: tres tarjetas con foto (La herencia recomendada) que se recorren con las flechas, sin reglas fuera de la Maqueta; Esc (también dos seguidos) y ← vuelven sin guardar nada.');

  // 3. Maqueta: presupuesto y rivales aplicados; semilla visible en Guardar.
  await openNew(page);
  await page.click('.np-screen [data-action=np-pick][data-id=maqueta]');
  assert(await page.locator('.np-rules').isVisible(), 'reglas de la maqueta en línea');
  assert.deepEqual(await page.locator('.np-rules [data-action=np-cash]').allTextContents(), ['500 M€', '1.500 M€', '5.000 M€']);
  assert.deepEqual(await page.locator('.np-rules [data-action=np-rivals]').allTextContents(), ['Sí', 'No']);
  await page.screenshot({path: path.join(out, '03-maqueta.png')});
  await start(page, {pick: 'maqueta', cash: 5000, rivals: false, seed: 'maqueta 1'});
  const maqueta = await classic(page);
  assert.equal(maqueta.tycoon.mode, 'free'); assert.equal(maqueta.cash, 5000); assert.equal(maqueta.tycoon.rivals, false);
  assert.equal(maqueta.seedCode, 'MAQUETA 1'); assert.equal(maqueta.tutorial.done, true);
  assert(Number.isFinite(maqueta.savedAt) && Math.abs(maqueta.savedAt - Date.now()) < 120000, 'el guardado lleva su fecha');
  assert.equal((await stored(page, CLASSIC)).savedAt, maqueta.savedAt);
  assert.match(await page.locator('#mission .kicker').first().textContent(), /^Maqueta$/, 'el modo libre se llama Maqueta');
  await page.click('#navigation [data-action=save-dialog]');
  assert.match(await page.locator('#modal .seed-code').textContent(), /Semilla\s*MAQUETA 1/);
  await page.click('#modal [data-action=save-now]');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('modal').open);
  // Con 1.500 M€ y rivales: otra configuración, otro estado.
  await page.click('#navigation [data-action=menu-home]');
  await home(page);
  assert.match(await page.locator('.main-menu [data-action=continue]').textContent(), /Continuar\s*Maqueta · enero de 2022/);
  await openNew(page);
  await start(page, {pick: 'maqueta', cash: 1500, rivals: true, seed: 'otra', confirm: 'Maqueta'});
  const second = await classic(page);
  assert.equal(second.cash, 1500); assert.equal(second.tycoon.rivals, true);
  done.push('Maqueta: 5.000 M€ sin rivales y 1.500 M€ con rivales llegan al estado; se guarda con savedAt y muestra «Semilla MAQUETA 1» en Guardar.');

  // 4. Misma semilla, mismo estado inicial (y otra semilla, otro azar); el botón «Nueva partida» de la partida abre la elección.
  await page.evaluate(() => window.railwayGame.navigate('story'));
  await page.click('#drawer [data-action=office-tab][data-id=campaign]');
  await page.click('#drawer [data-action=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'maqueta', 'desde una maqueta viene elegida la Maqueta');
  await page.click('.np-screen [data-action=np-pick][data-id=maqueta]');
  await page.fill('#npSeed', 'Repetible');
  await page.click('.np-screen [data-action=np-begin]');
  await page.waitForSelector('.np-confirm');
  await page.click('.np-screen [data-action=np-no]');
  assert.equal(await page.inputValue('#npSeed'), 'Repetible', 'No conserva lo escrito');
  assert.equal((await stored(page, CLASSIC)).cash, 1500, 'No conserva el guardado');
  await page.click('.np-screen [data-action=np-back]');
  await page.waitForFunction(() => !document.getElementById('modal').open);
  assert.equal((await classic(page)).cash, 1500, '← desde la partida vuelve a ella');
  for (const run of [1, 2]) {
    await toMenu(page); await openNew(page);
    await start(page, {pick: 'herencia', seed: 'repetible', confirm: run === 1 ? 'Maqueta' : 'La herencia'});
    await page.waitForSelector('#modal[open] [data-action=decision]');
    const s = await classic(page);
    assert.equal(s.seedCode, 'REPETIBLE'); assert.equal(s.tycoon.mode, 'campaign');
    if (run === 1) globalThis.firstRun = strip(s); else assert.deepEqual(strip(s), globalThis.firstRun, 'misma semilla, mismo estado inicial');
  }
  await toMenu(page); await openNew(page);
  await start(page, {pick: 'herencia', seed: '', confirm: 'La herencia'});
  const random = await classic(page);
  assert.match(random.seedCode, /^[A-Z2-9]{6}$/, 'semilla vacía: código al azar y repetible');
  assert.equal(seedFromCode(random.seedCode), seedFromCode(normalizeSeed(random.seedCode)));
  assert.notEqual(random.seedCode, 'REPETIBLE'); assert.notEqual(random.seed, globalThis.firstRun.seed, 'otra semilla, otro azar');
  assert.equal(seedFromCode('72022'), 72022, 'los números valen tal cual: 72022 es la campaña de siempre');
  done.push('Semilla: «repetible» dos veces da el mismo estado de La herencia; vacía genera un código de seis signos; «Nueva partida» de la partida abre la elección y ← vuelve a ella; No conserva guardado y semilla.');

  // 5. 2027 · El rescate: con su semilla, sin tocar la partida clásica; su «Nueva partida» abre la elección.
  await toMenu(page);
  const classicBefore = await page.evaluate(k => localStorage.getItem(k), CLASSIC);
  await openNew(page);
  await start(page, {pick: 'rescate', seed: '12345'});
  let rescue = await page.evaluate(() => window.tenfeRescue.state());
  assert.equal(rescue.seed, 12345); assert.equal(rescue.seedCode, '12345'); assert.equal(rescue.week, 1);
  assert(Number.isFinite((await stored(page, RESCUE)).savedAt), 'el rescate guarda su fecha');
  assert.equal(await page.evaluate(k => localStorage.getItem(k), CLASSIC), classicBefore, 'empezar el rescate no borra la partida clásica');
  await rescueMenu(page);
  assert.match(await page.locator('.rs-modal .rs-seed').textContent(), /Semilla\s*12345/);
  await page.screenshot({path: path.join(out, '04-rescate-semilla.png')});
  await page.click('.rs-modal [data-a=exit]');
  await home(page);
  assert.match(await page.locator('.main-menu [data-action=continue]').textContent(), /Continuar\s*El rescate · semana 1/, 'Continuar: la más reciente');
  assert.match(await page.locator('.main-menu [data-action=continue-other]').textContent(), /La herencia · enero de 2022/, 'la otra partida sigue a mano');
  await page.screenshot({path: path.join(out, '05-portada-dos-partidas.png')});
  await page.click('.main-menu [data-action=continue]');
  await page.waitForSelector('#rescate'); await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.tenfeRescue.state().seed), 12345, 'Continuar reanuda el rescate');
  await rescueMenu(page);
  await page.click('.rs-modal [data-a=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  assert.equal(await page.locator('#rescate').count(), 0, '«Nueva partida» del rescate abre la elección');
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'rescate', 'con el rescate ya elegido');
  await page.click('.np-screen [data-action=np-back]');
  await page.waitForSelector('#rescate'); await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.tenfeRescue.state().seed), 12345, '← desde el rescate vuelve a él');
  await rescueMenu(page);
  await page.click('.rs-modal [data-a=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  const rescueStates = [];
  for (const run of [1, 2]) {
    if (run === 2) { await rescueMenu(page); await page.click('.rs-modal [data-a=new-game]'); await page.waitForSelector('#modal[open] .np-screen'); }
    await start(page, {pick: 'rescate', seed: 'Norte', confirm: 'El rescate'});
    rescueStates.push(strip(await page.evaluate(() => window.tenfeRescue.state())));
  }
  assert.deepEqual(rescueStates[1], rescueStates[0], 'misma semilla, mismo rescate');
  assert.equal(rescueStates[0].seed, seedFromCode('NORTE'));
  // Un rescate terminado: «Nueva partida» lo deja elegido, sin partida a la que volver ni que continuar.
  await rescueMenu(page);
  const rescueSave = await page.evaluate(k => localStorage.getItem(k), RESCUE);
  await page.evaluate(k => { const r = JSON.parse(localStorage.getItem(k)); r.ended = {kind: 'partial', week: r.week}; localStorage.setItem(k, JSON.stringify(r)); }, RESCUE);
  await page.click('.rs-modal [data-a=new-game]');
  await page.waitForSelector('#modal[open] .np-screen');
  assert.equal(await page.locator('.np-start[aria-checked=true]').getAttribute('data-id'), 'rescate', 'tras un rescate terminado también viene elegido');
  await page.click('.np-screen [data-action=np-back]');
  await home(page);
  assert.equal(await page.locator('.main-menu [data-game=rescue]').count(), 0, 'un rescate terminado no se ofrece para continuar');
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [RESCUE, rescueSave]);
  done.push('2027 · El rescate: semilla 12345 y «Norte» repetibles, «Semilla 12345» en su menú, la partida clásica intacta y su «Nueva partida» abre la elección con el rescate elegido (← vuelve a él).');

  // 6. Continuar elige por savedAt; los guardados sin fecha siguen funcionando.
  await page.evaluate(([c, r]) => { const a = JSON.parse(localStorage.getItem(c)), b = JSON.parse(localStorage.getItem(r)); a.savedAt = Date.now() + 5000; localStorage.setItem(c, JSON.stringify(a)); b.savedAt = Date.now() - 5000; localStorage.setItem(r, JSON.stringify(b)); }, [CLASSIC, RESCUE]);
  await page.reload(); await home(page);
  assert.match(await page.locator('.main-menu [data-action=continue]').textContent(), /La herencia/, 'la clásica es ahora la más reciente');
  await page.click('.main-menu [data-action=continue]');
  await page.waitForFunction(() => !document.getElementById('modal').open || !!document.querySelector('#modal [data-action=decision]'));
  assert.equal(await page.locator('#rescate').count(), 0); assert.equal((await classic(page)).seedCode, random.seedCode, 'Continuar reanuda la clásica');
  await page.evaluate(([c, r]) => { for (const k of [c, r]) { const a = JSON.parse(localStorage.getItem(k)); delete a.savedAt; localStorage.setItem(k, JSON.stringify(a)); } }, [CLASSIC, RESCUE]);
  await page.reload(); await home(page);
  assert.equal(await page.locator('.main-menu [data-action=continue]').getAttribute('data-game'), 'rescue', 'sin fechas: el rescate, como en la 4.0');
  await page.click('.main-menu [data-action=continue-other]');
  await page.waitForFunction(() => !document.querySelector('#modal[open] .main-menu'));
  assert.equal((await classic(page)).seedCode, random.seedCode, 'un guardado antiguo sin savedAt se reanuda');
  done.push('Continuar: la partida con savedAt más reciente; sin fechas (guardados anteriores) ambas siguen jugables.');
  const classicSave = await page.evaluate(k => localStorage.getItem(k), CLASSIC);
  await context.close();

  // 7. Móvil de 390 px.
  const phoneContext = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const phone = await phoneContext.newPage();
  watch(phone, 'móvil');
  await phone.goto(url); await phone.evaluate(([k, v]) => localStorage.setItem(k, v), [CLASSIC, classicSave]); await phone.reload(); await home(phone);
  await noScroll(phone, 'Portada en móvil');
  await phone.screenshot({path: path.join(out, '06-movil-portada.png')});
  await phone.click('.main-menu [data-action=new-game]'); await phone.waitForSelector('#modal[open] .np-screen');
  await phone.click('.np-screen [data-action=np-pick][data-id=maqueta]');
  await noScroll(phone, 'Nueva partida en móvil');
  for (const selector of ['.np-start[data-id=herencia]', '.np-start[data-id=rescate]', '.np-start[data-id=maqueta]', '[data-action=np-cash][data-id="5000"]', '[data-action=np-rivals][data-id=off]', '#npSeed', '[data-action=np-begin]']) {
    const box = await phone.locator('.np-screen ' + selector).boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 391 && box.height >= 32, 'cabe y se puede pulsar en móvil: ' + selector);
  }
  await phone.screenshot({path: path.join(out, '07-movil-nueva-partida.png'), fullPage: true});
  await phone.click('.np-screen [data-action=np-begin]');
  await phone.waitForSelector('.np-confirm');
  assert.match(await phone.locator('.np-confirm p').textContent(), /Hay una partida guardada de La herencia/);
  await noScroll(phone, 'Confirmación en móvil');
  await phone.screenshot({path: path.join(out, '08-movil-confirmacion.png')});
  done.push('Móvil (390 px): portada, tres arranques, reglas y confirmación sin desplazamiento horizontal.');
  await phoneContext.close();

  assert.deepEqual(errors, [], 'sin errores de consola');
  console.log(done.map(x => '✓ ' + x).join('\n'));
  console.log('Capturas: ' + out);
} finally {
  await browser.close();
}
