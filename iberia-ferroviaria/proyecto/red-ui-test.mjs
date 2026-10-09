// Chromium: capa «Velocidad» del mapa clásico, «Compra uno que sí» abre Trenespop filtrado por la relación y el filtro
// «Circula en» marca cada anuncio con ✓ o ✗ y su primer motivo. GAME_URL apunta a dist/index.html servido por HTTP.
// Uso: GAME_URL=http://127.0.0.1:8112/index.html node red-ui-test.mjs /opt/node-tools/node_modules/playwright/index.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const module = process.argv[2] || process.env.PLAYWRIGHT_MODULE || 'playwright';
const {chromium} = await import(module.startsWith('/') ? pathToFileURL(module).href : module);
const out = path.resolve(process.env.UI_TEST_OUT || path.join(root, '../investigacion/verificacion-red')); fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
const errors = [], checks = [];
const page = await browser.newPage({viewport: {width: 1440, height: 900}}); page.on('pageerror', e => errors.push(e.message));
page.setDefaultTimeout(Number(process.env.UI_TEST_TIMEOUT || 60000));
const game = (fn, arg) => page.evaluate(fn, arg);
const shot = name => page.screenshot({path: path.join(out, name + '.png'), animations: 'disabled', timeout: 60000});
const settle = () => page.waitForTimeout(400);
try {
  await page.goto(process.env.GAME_URL || pathToFileURL(path.join(root, 'dist/index.html')).href);
  await page.click('.main-menu [data-action=new-game]'); await page.click('.np-screen [data-action=np-pick][data-id=maqueta]');
  await page.click('.np-screen [data-action=np-cash][data-id="5000"]'); await page.click('.np-screen [data-action=np-begin]');
  await game(() => { const g = window.railwayGame; g.voices.enabled = false; g.music.enabled = false; g.sfx.enabled = false; });
  await page.waitForFunction(() => window.railwayGame.map.lastFrame > 0);

  // 1. Capa de velocidad junto a anchos y electrificación, con su leyenda.
  const labels = await page.locator('.layer-switch [data-layer]').allTextContents();
  assert.equal(labels[labels.indexOf('Electrificación') + 1], 'Velocidad', 'el botón va junto a Electrificación');
  await page.click('[data-layer=speed]');
  assert.equal(await game(() => window.railwayGame.map.layer), 'speed');
  assert(/Más de 200 km\/h/.test(await page.locator('#legend').textContent()) && /Hasta 120 km\/h/.test(await page.locator('#legend').textContent()));
  await game(() => window.railwayGame.map.focusAt(-5.45, 42.75, 5)); await settle(); await shot('01-velocidad-leon-asturias');
  await page.click('[data-layer=power]'); assert(/3 kV continua/.test(await page.locator('#legend').textContent()));
  await shot('02-tension-leon-asturias');
  await page.click('[data-layer=gauge]'); await game(() => window.railwayGame.map.focusAt(-5.35, 37.65, 6)); await settle(); await shot('03-ancho-cordoba-sevilla');
  await page.click('[data-layer=speed]'); await game(() => window.railwayGame.map.focusAt(-1.6, 39.75, 4.5)); await settle(); await shot('04-velocidad-levante-motilla');
  // un tramo se puede pulsar en la capa de velocidad y su ficha dice su velocidad
  await game(() => window.railwayGame.pick({type: 'tramo', id: 'ter-sag'})); await page.waitForSelector('#inspector:not(.hidden)');
  assert.equal(await game(() => window.railwayGame.map.layer), 'speed', 'la ficha de tramo no saca de la capa de velocidad');
  assert(/90/.test(await page.locator('#inspector .figures').textContent()), 'Teruel — Sagunt a 90 km/h');
  checks.push('Capa «Velocidad» junto a Electrificación, leyenda por bandas, 3 kV/25 kV distinguidos y tramos pulsables.');

  // 2. «Compra uno que sí»: sin trenes compatibles, la relación abre Trenespop filtrado por ella.
  await game(() => {
    const g = window.railwayGame, s = g.state(), keep = new Set(s.fleet.filter(f => ['s112', 's103'].includes(f.model)).map(f => f.id));
    for (const r of s.routes) if (r.active && !keep.has(r.fleet)) { r.active = false; r.fleet = null; r.units = 0; }
    s.fleet = s.fleet.filter(f => keep.has(f.id)); g.setLayer('network'); g.selectRoute('madrid-castellon'); g.render();
  });
  await page.waitForSelector('#routePreview [data-action=market-route]');
  assert(/AVE bitensión/.test(await page.locator('#inspector .options').textContent()), 'la vía admite AVE, pero bitensión');
  const options = await page.locator('#routeFleet option').allTextContents();
  assert(options.length && options.every(o => /Sagunt — València: 3 kV/.test(o)), 'cada lote dice por qué no: ' + options.join(' | '));
  await page.click('#routePreview [data-action=market-route]');
  await page.waitForSelector('#drawer.trenespop-drawer #marketRoute');
  assert.equal(await page.locator('#marketRoute').inputValue(), 'madrid-castellon');
  assert.equal(await game(() => document.querySelector('#inspector').classList.contains('hidden') || !document.querySelector('#inspector').textContent.trim()), true, 'la ficha de la relación se cierra');
  const fits = await page.locator('.tp-card .tp-fit').allTextContents();
  assert(fits.length > 4 && fits[0].startsWith('✓') && fits.some(x => x === '✗ Sagunt — València: 3 kV'), 'marcas ✓/✗: ' + fits.join(' | '));
  assert.equal(fits.findIndex(x => x.startsWith('✗')), fits.filter(x => x.startsWith('✓')).length, 'los que circulan, primero');
  assert(/circulan por Madrid — Castelló/.test(await page.locator('.tp-results p').textContent()));
  await shot('05-trenespop-circula-en');
  checks.push('«Compra uno que sí» abre Trenespop con «Circula en» Madrid — Castelló: compatibles primero y ✗ con el motivo (3 kV).');

  // 3. Elegir otra relación en el filtro y abrir una ficha.
  await page.selectOption('#marketRoute', 'madrid-soria');
  await page.waitForFunction(() => /Torralba — Soria/.test(document.querySelector('.tp-grid').textContent));
  assert(await page.locator('.tp-fit.ok').count() > 0, 'el S730 sí llega a Soria');
  await page.locator('.tp-card .tp-title').first().click();
  await page.waitForSelector('#modal[open] #marketReach');
  assert(/Circula en \d+ de \d+ relaciones/.test(await page.locator('#marketReach').textContent()));
  assert(/Madrid — Soria/.test(await page.locator('#modal .tp-fit').textContent()));
  await shot('06-trenespop-ficha');
  await page.click('#modal [data-action=close-modal] >> nth=0');
  await page.click('[data-action=market-reset] >> nth=0');
  assert.equal(await page.locator('#marketRoute').inputValue(), '', 'Limpiar filtros quita la relación');
  assert.equal(await page.locator('#drawer .tp-fit').count(), 0);
  checks.push('El filtro cambia de relación, la ficha dice en cuántas relaciones circula y «Limpiar filtros» lo quita.');

  // 4. Móvil: las capas caben.
  await page.setViewportSize({width: 390, height: 844}); await page.click('#drawer [data-action=close-drawer]'); await settle();
  assert(await page.locator('#drawer').evaluate(el => el.classList.contains('hidden')), 'Trenespop cerrado');
  for (const width of [390, 320]) {
    await page.setViewportSize({width, height: 844}); await settle();
    const box = await page.locator('.layer-switch').evaluate(el => { const r = el.getBoundingClientRect(); return {left: r.left, right: r.right}; });
    assert(box.left >= -1 && box.right <= width + 1, `el selector de capas cabe en ${width} px: ` + JSON.stringify(box));
    await page.locator('[data-layer=speed]').click(); assert.equal(await game(() => window.railwayGame.map.layer), 'speed');
    await shot('07-movil-' + width);
  }
  checks.push('Selector de capas dentro de la pantalla a 390 y 320 px; «Velocidad» se alcanza.');
  assert.deepEqual(errors, []);
  const result = {passed: true, checks, errors}; fs.writeFileSync(path.join(out, 'red-ui-result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
