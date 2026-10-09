// Rescate de Tenfe: recorrido real de interfaz con Chromium sobre la web construida (o dist/).
// Uso: node rescate-ui-test.mjs URL [ruta-a-playwright]   ej. node rescate-ui-test.mjs http://127.0.0.1:8091/index.html
// Portada, intro, tutorial completo haciendo lo que pide cada persona, obra con fases y pagos, flota y compra con
// las fotos de BCBB y Dörfler, cierre de semana, decisiones, pacto de Paco, páginas, voces y móvil sin scroll horizontal.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://127.0.0.1:8091/index.html';
const pwPath = process.argv[3] || process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs';
const {chromium} = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
const out = path.join(root, '../investigacion/verificacion-4.0');
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
const errors = [], done = [];
const page = await browser.newPage({viewport: {width: 1440, height: 900}});
page.setDefaultTimeout(30000);
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
// Las imágenes de assets/rescate/ pueden no existir todavía (se ven en cuanto se suben); cualquier otro 404 es un error.
page.on('response', r => { if (r.status() >= 400 && !/\/assets\/rescate\/[a-z0-9-]+\.webp/.test(r.url())) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
const audio = [];
page.on('response', r => { if (/rescate-voces\/.*\.mp3/.test(r.url())) audio.push(r.status()); });
const shot = name => page.screenshot({path: path.join(out, name + '.png')});
const wait = ms => page.waitForTimeout(ms);
const game = (fn, arg) => page.evaluate(fn, arg);
const step = () => page.evaluate(() => document.querySelector('.rs-coach')?.dataset.step ?? 'none');
/** Portada → «Nueva partida» → 2027 · El rescate → «Empezar» (aceptando sustituir un rescate guardado si lo hay). */
async function newRescue(p) {
  await p.click('.main-menu [data-action=new-game]');
  await p.click('.np-screen [data-action=np-pick][data-id=rescate]');
  await p.click('.np-screen [data-action=np-begin]');
  if (await p.locator('.np-screen [data-action=np-yes]').count()) await p.click('.np-screen [data-action=np-yes]');
}

await page.goto(url); await wait(2500);
await game(() => localStorage.removeItem('tenfe-rescate-v1'));
await page.reload(); await wait(2500);
assert.equal(await page.locator('.main-menu [data-action=new-game]').count(), 1, 'la portada ofrece un único «Nueva partida»');
assert.equal(await page.locator('.main-menu [data-action=rescue-new], .main-menu [data-action=begin]').count(), 0, 'sin entradas separadas por modo');
await shot('01-portada');
await page.click('.main-menu [data-action=new-game]');
assert.deepEqual(await page.locator('.np-start').evaluateAll(cards => cards.map(card => card.dataset.id)), ['herencia', 'rescate', 'maqueta'], 'el rescate y la campaña clásica son dos de los tres arranques');
await page.click('.np-screen [data-action=np-back]');
await newRescue(page); await wait(1200);
assert(/Recupera el Norte/.test(await page.locator('.rs-modal h1').textContent()), 'arranca con la misión del primer trimestre');
assert.equal(await page.locator('.rs-modal .rs-talk img.face').count(), 1, 'habla un personaje con su retrato');
await shot('02-mision');
await page.click('.rs-modal .rs-choice'); await wait(500);
done.push('Portada con un único «Nueva partida»; el arranque 2027 abre el rescate con la misión inicial contada por la ministra.');

// Tutorial: una persona habla cada vez y cada paso avanza al hacer lo que pide.
assert.equal(await step(), '0');
await page.click('[data-a=tutorial-next]'); await wait(400);
assert.equal(await step(), '1');
await game(() => window.tenfeRescue.pick({type: 'corridor', id: 'norte'})); await wait(500);
assert.equal(await step(), '2', 'seleccionar el Norte avanza el tutorial');
await shot('03-norte');
const why = await page.locator('.rs-side .rs-tags').textContent();
assert(/Vía/.test(why), 'la ficha explica por qué el Norte llega tarde');
await page.click('[data-a=plan-work][data-type=renovar]'); await wait(700);
assert.equal(await step(), '3', 'abrir la obra avanza el tutorial');
const bill = await page.locator('.rs-modal .body').textContent();
assert(/2,35 M€/.test(bill) && /\+1,2 M€ al terminar/.test(bill) && /Sem\. 8/.test(bill), 'coste, ayuda prevista y fechas: ' + bill);
assert.equal(await page.locator('.rs-modal .rs-phasebar > div').count(), 3, 'tres fases: permisos, construcción y pruebas');
assert.equal(await page.locator('.rs-modal [data-a=plan-mode]').count(), 3, 'tres formas de mantener el servicio');
await page.click('.rs-modal [data-a=plan-mode][data-id=fases]'); await wait(400);
assert(/✗ \d+ % en la semana 13/.test(await page.locator('.rs-modal .body').textContent()), 'avisa de que por fases no llega a tiempo');
await page.click('.rs-modal [data-a=plan-mode][data-id=cerrar]'); await wait(400);
assert(/✓ \d+ % en la semana 13/.test(await page.locator('.rs-modal .body').textContent()), 'cerrando el tramo sí llega');
await page.click('.rs-modal [data-a=plan-mode][data-id=alternativa]'); await wait(400);
await shot('04-obra');
await page.click('[data-a=confirm-work]'); await wait(700);
assert.equal(await game(() => window.tenfeRescue.state().works.length), 1, 'obra aprobada');
assert.equal(await game(() => window.tenfeRescue.state().ordersUsed), 1, 'aprobar gasta una orden');
assert.equal(await step(), '4');
await page.click('.rs-rail [data-page=flota]'); await wait(700);
await shot('05-flota');
await page.click('.rs-sheet [data-a=plan-buy]'); await wait(800);
const photos = await page.locator('.rs-modal img.train-photo').evaluateAll(list => list.map(i => i.getAttribute('data-photo-series')));
assert(photos.includes('bcbb') && photos.includes('dorfler'), 'BCBB y Dörfler enseñan su propia foto: ' + photos);
await shot('06-compra');
await page.click('.rs-modal [data-a=close]'); await wait(400);
assert.equal(await step(), '5');
await page.click('[data-a=close-week]'); await wait(1500);
assert.equal(await game(() => window.tenfeRescue.state().week), 2, 'la semana se cierra');
while (await game(() => window.tenfeRescue.state().decisions.length)) { await page.click('.rs-modal[open] .rs-choice'); await wait(500); }
assert.equal(await step(), '6');
await page.click('[data-a=tutorial-next]'); await wait(400);
assert.equal(await step(), 'none');
assert.equal(await game(() => window.tenfeRescue.state().tutorial.done), true);
done.push('Tutorial de 7 pasos: Raquel, Marisa, Benito, Charo, Fermín y Raquel, cada uno pidiendo una acción real.');

// Semanas: avería temprana y propuesta de Paco.
for (let k = 0; k < 4; k++) {
  await page.click('[data-a=close-week]'); await wait(1200);
  for (let g = 0; g < 6 && await game(() => !!document.querySelector('.rs-modal[open] .rs-choice')); g++) { await page.click('.rs-modal[open] .rs-choice'); await wait(500); }
}
const s = await game(() => { const s = window.tenfeRescue.state(); return {week: s.week, offers: s.offers.map(o => o.id), log: s.pactLog.length, hist: s.hist.length}; });
assert(s.week >= 6, 'cinco semanas jugadas');
if (s.offers.includes('estacion-paco')) {
  await page.click('.rs-mission [data-a=offer][data-id=estacion-paco]'); await wait(700);
  assert(/votantes, los suficientes/.test(await page.locator('.rs-modal').textContent()), 'Paco pide su estación');
  assert.equal(await page.locator('.rs-modal .rs-terms > div').count(), 4, 'beneficio, obligación, plazo y consecuencia');
  await shot('07-paco');
  await page.click('.rs-modal [data-r=reject]'); await wait(500);
}
done.push('Cinco semanas cerradas con sus decisiones; pacto de Paco con beneficio, obligación, plazo y consecuencia.');

// Páginas.
for (const pg of ['finanzas', 'obras', 'pactos', 'progreso', 'tecnologia', 'mega', 'elecciones', 'cloacas', 'gaceta']) {
  await game(x => window.tenfeRescue.page(x), pg); await wait(500);
  assert(await page.locator('.rs-sheet[open] h1').count(), 'página ' + pg);
  await shot('08-' + pg);
  await game(() => document.querySelector('.rs-sheet').close()); await wait(200);
}
done.push('Nueve páginas: finanzas con caja prevista y pagos, obras, pactos, hitos, árbol tecnológico, megaproyectos, elecciones, cloacas y Gaceta.');
// Capas del mapa.
for (const l of ['via', 'demanda', 'obras', 'apoyo', 'puntualidad']) { await page.click(`[data-a=layer][data-id=${l}]`); await wait(250); }
await shot('09-capas');
// Guardado
const saved = await game(() => JSON.parse(localStorage.getItem('tenfe-rescate-v1')).week);
assert.equal(saved, s.week, 'la partida se guarda sola');
done.push('Capas del mapa y guardado automático.');

// Móvil.
const phone = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
phone.setDefaultTimeout(30000);
phone.on('pageerror', e => errors.push('móvil: ' + e.message));
await phone.goto(url); await phone.waitForTimeout(2500);
await newRescue(phone); await phone.waitForTimeout(1200);
for (let g = 0; g < 6 && await phone.evaluate(() => !!document.querySelector('.rs-modal[open] .rs-choice')); g++) { await phone.click('.rs-modal[open] .rs-choice'); await phone.waitForTimeout(400); }
await phone.click('[data-a=tutorial-skip]').catch(() => {}); await phone.waitForTimeout(300);
await phone.screenshot({path: path.join(out, '10-movil.png')});
await phone.evaluate(() => window.tenfeRescue.select('norte')); await phone.waitForTimeout(600);
await phone.screenshot({path: path.join(out, '11-movil-norte.png')});
assert(await phone.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal en móvil');
done.push('Móvil (390 px) sin desplazamiento horizontal.');

assert.deepEqual(errors, [], 'sin errores de JavaScript');
console.log(done.map(x => '✓ ' + x).join('\n'));
console.log(`Voces del rescate descargadas en la prueba: ${audio.length} (${audio.filter(x => x === 200).length} HTTP 200).`);
await browser.close();
