// Recorrido de interfaz con Chromium (Playwright) sobre el HTML autónomo. Uso: node ui-test.mjs [ruta-a-playwright]
// Tutorial en pausa (recorrido completo en onboarding-ui-test.mjs), mapas de anchos y electrificación, fichas de tramo, cambiador y relación, obras, páginas,
// relación nueva, jornada con parte, imprevisto con retrato y vista de móvil. Guarda capturas en investigacion/verificacion-3.0.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
// Cobertura obligatoria antes de abrir Chromium: un respaldo del navegador no
// convierte un paquete incompleto en una versión final de las voces.
const voiceLines = JSON.parse(fs.readFileSync(path.join(root, '../investigacion/voces/frases.json'), 'utf8'));
const {CLIPS} = await import('./dist/assets/voices.js');
const {CAST, clipId, speechText} = await import('./dist/voice.js');
const voiceIds = voiceLines.map(line => line.id).sort();
const voiceCast = Object.keys(CAST).sort();
assert.equal(voiceLines.length, 522, 'catálogo definitivo de 522 frases actuales');
assert.equal(new Set(voiceIds).size, 522, 'IDs canónicos únicos');
assert.equal(voiceCast.length, 9, 'reparto definitivo de nueve personajes');
assert.deepEqual([...new Set(voiceLines.map(line => line.person))].sort(), voiceCast, 'catálogo del reparto completo');
for (const line of voiceLines) {
  assert.equal(line.id, clipId(line.person, line.raw), 'ID vigente del diálogo de ' + line.person);
  assert.equal(line.text, speechText(line.raw), 'texto pronunciable vigente de ' + line.person);
  assert(typeof CLIPS[line.id] === 'string' && Buffer.from(CLIPS[line.id], 'base64').length > 0,
    'voz grabada obligatoria de ' + line.person + ': ' + line.raw);
}
assert.deepEqual(Object.keys(CLIPS).sort(), voiceIds, 'paquete de voces exactamente completo, sin faltantes, obsoletos ni respaldo del navegador');
const pwPath = process.argv[2] || process.env.PLAYWRIGHT_MODULE || 'playwright';
const {chromium} = await import(pwPath.startsWith('/') ? pathToFileURL(pwPath).href : pwPath);
const html = process.env.GAME_URL || pathToFileURL(path.join(root, '../outputs/Iberia-Ferroviaria.html')).href;
const out = path.resolve(process.env.UI_TEST_OUT || path.join(root, '../investigacion/verificacion-3.2-general'));
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
try {
const errors = [], done = [];
done.push('Las 522 frases canónicas de los nueve personajes tienen audio incrustado; no se acepta respaldo del navegador.');
const page = await browser.newPage({viewport: {width: 1440, height: 900}});
page.setDefaultTimeout(Number(process.env.UI_TEST_TIMEOUT || 60000));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const shot = name => page.screenshot({path: path.join(out, name + '.png'), animations: 'disabled', timeout: Number(process.env.UI_TEST_TIMEOUT || 60000)});
const game = (fn, arg) => page.evaluate(fn, arg);
const wait = ms => page.waitForTimeout(ms);

await page.goto(html); await wait(1500);
assert.equal(await page.title(), 'Iberia Ferroviaria · Tenfe 2022–2050');
assert.equal(await page.locator('a[href^="http"]').count(), 0, 'sin enlaces a webs externas');
await shot('01-portada');
// Decisión inaugural con retrato propio de la ministra.
await page.click('.main-menu [data-action=new-game]'); await page.fill('#npSeed', '72022'); await page.click('.np-screen [data-action=np-begin]'); await wait(400);
const portrait = await page.locator('#modal .art.portrait').getAttribute('style');
assert(/data:image\/jpeg/.test(portrait), 'la decisión lleva el retrato fotográfico');
assert.equal(await page.locator('#modal .plate b').textContent(), 'Raquel Sanz');
await shot('02-decision');
await page.click('.choice >> nth=0'); await page.waitForSelector('.induction-dialog');
done.push('Portada y decisión inaugural con retrato de la ministra.');

// El tutorial nuevo tiene su propio recorrido completo y conserva el progreso al pausarlo.
await page.click('#modal [data-action=tutorial-skip]');
assert.equal(await game(() => window.railwayGame.state().tutorial.done), false);
assert.equal(await game(() => window.railwayGame.state().tutorial.suspended), true);
done.push('Primer turno en pausa conserva el progreso; recorrido completo en onboarding-ui-test.mjs.');

// Mapas de anchos y electrificación, fichas de tramo y de cambiador.
await page.click('[data-action=close-drawer]').catch(() => {});
await game(() => window.railwayGame.setLayer('gauge')); await wait(500);
assert(/Ancho estándar/.test(await page.locator('#legend').textContent()), 'leyenda de anchos');
await game(() => window.railwayGame.pick({type: 'tramo', id: 'trb-sor'})); await wait(300);
assert.equal(await page.locator('#inspector [data-action=work]').count(), 4, 'cuatro obras posibles en Torralba — Soria');
await shot('05-tramo');
await game(() => window.railwayGame.setLayer('power')); await wait(500);
assert(/25 kV/.test(await page.locator('#legend').textContent()), 'leyenda de electrificación');
await page.click('#inspector [data-action=work][data-work=electrify]'); await wait(300);
assert(/Electrificar/i.test(await page.locator('#modal .kicker').textContent()));
await page.click('[data-action=confirm-work]'); await wait(300);
assert(await game(() => window.railwayGame.state().projects.some(p => p.work === 'electrify' && p.target === 'trb-sor')), 'obra adjudicada');
await game(() => window.railwayGame.pick({type: 'node', id: 'vlc'})); await wait(300);
assert.equal(await page.locator('#inspector [data-work=changer]').count(), 1, 'se puede construir un cambiador en València');
await shot('06-cambiador');
await game(() => window.railwayGame.selectRoute('madrid-gijon')); await wait(300);
assert.equal(await page.locator('#inspector .option.no').count() >= 1 && await page.locator('#inspector .option.ok').count() >= 1, true, 'qué puede circular hacia Gijón');
done.push('Mapas de anchos y electrificación; obra de catenaria adjudicada; cambiador y relación con lo que falta.');

// Páginas: Red, Trenes, Obras y Despacho, con sus pestañas.
for (const [screen, tabAction, n] of [['network', 'net-view', 2], ['fleet', 'fleet-tab', 3], ['works', 'works-tab', 4], ['story', 'office-tab', 4]]) {
  await game(s => window.railwayGame.navigate(s), screen); await wait(300);
  if (await game(() => document.getElementById('drawer').classList.contains('hidden'))) { await game(s => window.railwayGame.navigate(s), screen); await wait(300); }
  const tabs = page.locator(`#drawer [data-action=${tabAction}]`);
  assert.equal(await tabs.count(), n, 'pestañas de ' + screen);
  for (let i = 0; i < n; i++) { await tabs.nth(i).click(); await wait(200); }
  await shot('07-' + screen);
}
done.push('Cuatro páginas con pocas pestañas: Red (2), Trenes (3), Obras (4) y Despacho (4).');

// Relación nueva entre dos ciudades.
await game(() => window.railwayGame.navigate('network')); await wait(200);
if (await game(() => document.getElementById('drawer').classList.contains('hidden'))) await game(() => window.railwayGame.navigate('network'));
await page.click('[data-action=net-view][data-id=routes]'); await page.click('[data-action=new-service]'); await wait(300);
await page.selectOption('#svcA', 'tol'); await page.selectOption('#svcB', 'bcn'); await wait(300);
assert(await page.locator('#svcPreview .option').count() === 3, 'vista previa de AVE, Alvia e híbrido');
const before = await game(() => window.railwayGame.state().routes.length);
await page.click('[data-action=confirm-service]'); await wait(300);
assert.equal(await game(() => window.railwayGame.state().routes.length), before + 1, 'relación Toledo — Barcelona creada');
done.push('Relación nueva Toledo — Barcelona con vista previa por producto.');

// Jornada completa e imprevisto con retrato.
await page.keyboard.press('Escape'); await game(() => window.railwayGame.navigate('ops')); await wait(200);
await page.click('[data-action=day-start]'); await game(() => window.railwayGame.setMinute(600)); await wait(400);
await shot('08-jornada');
await page.click('[data-action=day-end]'); await wait(500);
await game(() => { window.railwayGame.state().event = 'cows'; });
await page.click('#modal [data-action=day-next]'); await wait(500);
assert(/Imprevisto/.test(await page.locator('#modal .kicker').textContent()), 'imprevisto con su ventana');
assert(/data:image\/jpeg/.test(await page.locator('#modal .art.portrait').getAttribute('style')), 'el imprevisto lleva retrato');
await shot('09-imprevisto');
await page.click('.choice >> nth=0'); await wait(300);
assert.equal(await game(() => window.railwayGame.state().event), null);
done.push('Jornada con parte del día e imprevisto con retrato del personaje.');

// Móvil.
const phone = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: Number(process.env.UI_TEST_DPR || 2), isMobile: true, hasTouch: true});
phone.setDefaultTimeout(Number(process.env.UI_TEST_TIMEOUT || 60000));
phone.on('pageerror', e => errors.push('móvil: ' + e.message));
await phone.goto(html); await phone.waitForTimeout(1200);
await phone.click('.main-menu [data-action=new-game]'); await phone.fill('#npSeed', '72022'); await phone.click('.np-screen [data-action=np-begin]'); await phone.waitForTimeout(300); await phone.click('.choice >> nth=0'); await phone.waitForTimeout(300);
await phone.click('[data-action=tutorial-skip]').catch(() => {});
await phone.evaluate(() => window.railwayGame.pick({type: 'city', id: 'bcn'})); await phone.waitForTimeout(400);
assert(await phone.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), 'sin desplazamiento horizontal en móvil');
await phone.screenshot({path: path.join(out, '10-movil.png'), animations: 'disabled', timeout: Number(process.env.UI_TEST_TIMEOUT || 60000)});
done.push('Vista de móvil sin desplazamiento horizontal.');

// Dirección: decisiones reales de la interfaz y persistencia de la nueva gestión.
await game(()=>{window.railwayGame.voices.enabled=false;window.railwayGame.state().cash=5000;window.railwayGame.navigate('story');});
if(await page.locator('#drawer').evaluate(el=>el.classList.contains('hidden')))await game(()=>window.railwayGame.navigate('story'));
await page.click('[data-action=office-tab][data-id=tycoon]');
assert.equal(await page.locator('.pressure-card').count(),5);
await page.click('[data-action=tycoon-public]');
assert.equal(await game(()=>window.railwayGame.state().tycoon.contracts[0].status),'active');
await shot('11-direccion');
await page.click('[data-action=tycoon-tab][data-id=people]');
await page.click('[data-action=tycoon-hire]');
assert.equal(await game(()=>window.railwayGame.state().tycoon.training.at(-1).count),20);
await page.click('[data-action=tycoon-policy][data-id=wifi]');
assert(await game(()=>window.railwayGame.state().tycoon.policies.includes('wifi')));
await shot('12-personal');
await page.click('[data-action=tycoon-tab][data-id=research]');
await page.click('[data-action=tycoon-research][data-id=online]');
assert.equal(await game(()=>window.railwayGame.state().tycoon.research.id),'online');
await shot('13-investigacion');
await page.click('[data-action=tycoon-tab][data-id=market]');
assert(await page.locator('.competitor').count()>0);
await shot('14-competencia');
await page.click('[data-action=tycoon-tab][data-id=paper]');
await shot('15-periodico');
done.push('Dirección: cinco grupos, aceptar misión, contratar, activar wifi, investigar y consultar competencia y periódico.');
// Una cara de cada emoción aparece en decisiones jugables, incluida Charo.
for(const mood of ['happy','angry','worried','proud','surprised','disappointed','determined']){
 // Un encuentro solo se juega si es verdad: se prepara la situación de cada ánimo de Charo con una guerra de precios del autobús.
 assert(await game(m=>{const g=window.railwayGame,s=g.state();s.event=null;s.flags.buswar=s.month+6;s.verdad.busWarFrom=s.month;s.verdad.spent=[];s.verdad.dues=[];s.tycoon.groups.treasury=50;s.last.net=0;s.cash=600;
  if(m==='happy'){s.last.net=1;s.tycoon.groups.treasury=60;}
  if(m==='angry'){s.cash=5;s.last.net=-10;s.verdad.spent=[{m:s.month,x:1}];}
  if(m==='worried')s.cash=20;
  if(m==='proud'){s.month=6;s.decided=[...new Set([...s.decided,'inaugural','energy'])];s.history=[0,1,2,3,4,5].map(i=>({month:i,net:i<3?-1:1}));}
  if(m==='surprised')s.projects=[];
  if(m==='disappointed')s.verdad.news.push({k:'misuse',m:s.month});
  if(m==='determined'){s.orders.push({id:'o990',model:'s103',qty:2,delivered:0,start:s.month,first:s.month+1,next:s.month+1,total:60,remaining:42,unit:30,delay:0,historical:false});s.verdad.mods.push({kind:'fare',value:.85,routes:[s.routes.find(r=>r.active).id],from:s.month,until:s.month+3,label:'Campaña de descuentos'});}
  const staged=g.engine.stageScene(s,`scene-treasury-${m}-1`);g.navigate('ops');g.render();return staged;},mood),'situación verdadera para Charo '+mood);
 if(await page.locator('#drawer').evaluate(el=>el.classList.contains('hidden')))await game(()=>window.railwayGame.navigate('ops'));
 await page.click('[data-action=day-start]');
 await page.waitForSelector('#modal .choice');
 assert.equal(await page.locator('#modal .plate b').textContent(),'Charo Tijera');
 assert.equal(await page.locator('#modal [data-mood]').getAttribute('data-mood'),mood);
 await page.click('#modal .choice >> nth=0');
 assert.equal(await game(()=>window.railwayGame.state().tycoon.encounter),null);
}
done.push('Siete emociones fotográficas de Charo en decisiones con consecuencias.');
// Maqueta configurable y trazado por dos clics del mapa.
await page.reload();await page.click('.main-menu [data-action=new-game]');await page.click('.np-screen [data-action=np-pick][data-id=maqueta]');await page.click('.np-screen [data-action=np-cash][data-id="5000"]');await page.click('.np-screen [data-action=np-rivals][data-id=off]');await page.click('.np-screen [data-action=np-begin]');await page.click('.np-screen [data-action=np-yes]');
assert.equal(await game(()=>window.railwayGame.state().cash),5000);
assert.equal(await game(()=>window.railwayGame.state().tycoon.rivals),false);
assert.equal(await game(()=>window.railwayGame.state().tycoon.mode),'free');
await game(()=>window.railwayGame.navigate('works'));await page.click('[data-action=works-tab][data-id=projects]');
await page.click('[data-action=new-line]');await page.click('[data-action=line-map]');
await game(()=>window.railwayGame.pick({type:'city',id:'tol'}));await game(()=>window.railwayGame.pick({type:'city',id:'sor'}));
assert.equal(await page.inputValue('#lineA'),'tol');assert.equal(await page.inputValue('#lineB'),'sor');
await shot('16-linea-propia');await page.click('[data-action=confirm-line]');
assert(await game(()=>window.railwayGame.state().projects.some(x=>x.type==='custom')));
done.push('Maqueta de 5.000 M€ sin rivales y construcción de línea seleccionando dos ciudades del mapa.');
await phone.evaluate(()=>window.railwayGame.navigate('story'));await phone.click('[data-action=office-tab][data-id=tycoon]');
assert(await phone.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'Dirección sin desbordar en móvil');
await phone.screenshot({path:path.join(out,'17-direccion-movil.png'), animations: 'disabled', timeout: Number(process.env.UI_TEST_TIMEOUT || 60000)});

assert.deepEqual(errors, [], 'sin errores de JavaScript');
console.log(done.map(x => '✓ ' + x).join('\n'));
} finally {
 await browser.close();
}
