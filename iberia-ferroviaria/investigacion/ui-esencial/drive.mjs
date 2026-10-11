// Full-session visual audit driver. Usage: node drive.mjs 1440x900 [url]
import fs from 'node:fs';
import path from 'node:path';
import {launch, check, summarize} from './checker.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const [W, H] = (process.argv[2] || '1440x900').split('x').map(Number);
const URL0 = process.argv[3] || 'http://127.0.0.1:8150/';
const out = path.join(here, 'shots', W + 'x' + H);
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
const reports = [], errors = [], log = [];
let n = 0;
const say = s => { log.push(s); console.log(s); };

const browser = await launch();
const ctx = await browser.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 1, isMobile: W < 600, hasTouch: W < 600});
// Shared CPU-only machine: repaint the map only when its visible state changes (same guard as the repo's onboarding test).
await ctx.addInitScript(() => {
  const timer = setInterval(() => {
    const g = window.railwayGame, m = g?.map; if (!m) return; clearInterval(timer);
    const original = m.opts.isVisible; let previous;
    m.opts.isVisible = () => {
      if (original?.() === false) return false;
      const s = g.state(), op = s.ops;
      const key = [m.layer, m.selected, m.selectedCity, m.selectedTramo, m.zoom, m.pan.x, m.pan.y, m.w, m.h, s.month, s.infra.ver, op.phase, op.day, Math.floor(op.minute / 10), op.incidents.length, op.resolved.length, s.projects.filter(p => !p.done).length, s.routes.map(r => [r.id, r.active, r.frequency, r.fleet, r.level].join(':')).join('|')].join('#');
      if (key === previous) return false; previous = key; return true;
    };
  }, 100);
});
let page = await ctx.newPage();
page.setDefaultTimeout(30000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

async function snap(name, focus = [], opts = {}) {
  const label = String(++n).padStart(3, '0') + '-' + name;
  try {
    const t0 = Date.now();
    const rep = await check(page, label, {outDir: out, focus, ...opts});
    rep.ms = Date.now() - t0;
    reports.push(rep);
    say(summarize(rep) + `\n  (${rep.ms} ms)`);
    return rep;
  } catch (e) { errors.push(label + ': check failed ' + e.message); say('!! ' + label + ' ' + e.message); }
}
async function act(name, fn) {
  try { await fn(); return true; }
  catch (e) {
    errors.push(name + ': ' + e.message.split('\n')[0]);
    say('!! ' + name + ': ' + e.message.split('\n')[0]);
    await page.screenshot({path: path.join(out, 'ERR-' + String(n).padStart(3, '0') + '-' + name + '.png')}).catch(() => {});
    return false;
  }
}
const click = async (sel, opts = {}) => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded({timeout: 8000}).catch(() => {}); await l.click({timeout: 10000, ...opts}); };
const exists = async sel => (await page.locator(sel).count()) > 0;
const visible = async sel => (await page.locator(sel).count()) > 0 && await page.locator(sel).first().isVisible();
const wait = ms => page.waitForTimeout(ms);
const ev = (fn, arg) => page.evaluate(fn, arg);
const modalOpen = () => ev(() => document.getElementById('modal').open);
const closeModal = async () => { if (await modalOpen()) { if (await visible('#modal [data-action="close-modal"]')) await click('#modal [data-action="close-modal"]'); else await page.keyboard.press('Escape'); await wait(300); } };
const nav = async screen => {
  await click(`#navigation [data-screen="${screen}"]`);
  await wait(250);
  if (await ev(() => document.getElementById('drawer').classList.contains('hidden'))) { await click(`#navigation [data-screen="${screen}"]`); await wait(250); }
};
const closeDrawer = async () => { if (await visible('#drawer [data-action="close-drawer"]')) await click('#drawer [data-action="close-drawer"]'); await wait(200); };
const closeInspector = async () => { if (await visible('#inspector [data-action="close-inspector"]')) await click('#inspector [data-action="close-inspector"]'); await wait(200); };
const coachNext = '#coach [data-action="tutorial-next"]';
const next = async () => { await page.waitForSelector(coachNext + ':not([disabled])', {timeout: 15000}); await click(coachNext); await wait(1300); };
async function councilAll() {
  for (let i = 0; i < 15; i++) {
    const b = page.locator('.desk-decision [data-action="decision"]:not([disabled]), #modal [data-action="decision"]:not([disabled])');
    if (!(await b.count())) return;
    await b.first().click(); await wait(350);
  }
}

// ------------------------------------------------------------------ portada → nueva partida
await page.goto(URL0, {waitUntil: 'load'});
await page.waitForFunction(() => !!window.railwayGame);
await wait(1200);
say('voices.enabled=' + await ev(() => window.railwayGame.voices.enabled));
await snap('portada');
await act('nueva-partida', async () => { await click('.main-menu [data-action=new-game]'); await page.waitForSelector('#modal[open] .np-screen'); });
await wait(600);
await snap('nueva-partida');
await act('begin-guided', async () => {
  await page.fill('#npSeed', 'AUDITORIA');
  await click('[data-action="np-begin"]');
  if (await exists('.np-confirm')) await click('[data-action="np-yes"]');
  await page.waitForSelector('#coach', {timeout: 20000});
});
await wait(900);

// ------------------------------------------------------------------ guided tutorial (9 steps)
await snap('guia-1-welcome', [coachNext, '#mission']);
await wait(2500);
await snap('guia-1-welcome-t3s', [coachNext]);
await act('g1-next', next);
await snap('guia-2-network', ['#drawer [data-action="route"][data-id="madrid-valencia"]', coachNext]);
await act('g2-pick', async () => { await click('#drawer [data-action="route"][data-id="madrid-valencia"]'); await wait(700); });
await snap('guia-2-network-elegida', [coachNext, '#inspector']);
await act('g2-next', next);
await snap('guia-3-offer', ['#frequency', '#fare', '#routeForm [type="submit"]', coachNext]);
await act('g3-form', async () => {
  const max = await page.locator('#frequency').getAttribute('max');
  const cur = await page.locator('#frequency').inputValue();
  await page.locator('#frequency').fill(String(Math.min(+max, +cur + 1)));
  await page.locator('#frequency').dispatchEvent('input');
  await page.locator('#fare').fill('25'); await page.locator('#fare').dispatchEvent('input');
  await wait(300);
});
await snap('guia-3-offer-plan', ['#routePreview', '#routeForm [type="submit"]']);
await act('g3-submit', async () => { await click('#routeForm [type="submit"]'); await wait(800); });
await snap('guia-3-offer-aplicado', [coachNext]);
await act('g3-next', next);
await snap('guia-4-decisions', ['.desk-decision [data-action="decision"]', coachNext]);
await act('g4-council', async () => { await councilAll(); await wait(500); });
await snap('guia-4-decisions-resueltas', [coachNext]);
await act('g4-next', next);
await snap('guia-5-people', [coachNext]);
await act('g5-next', next);
await snap('guia-6-research', [coachNext]);
await act('g6-next', next);
await snap('guia-7-infrastructure', ['#routeFleet', '#frequency', '#routeForm [type="submit"]', coachNext]);
await act('g7-form', async () => {
  const opts = await page.locator('#routeFleet option:not([disabled])').evaluateAll(o => o.map(x => x.value));
  if (opts.includes('f2')) await page.selectOption('#routeFleet', 'f2'); else if (opts.length) await page.selectOption('#routeFleet', opts[0]);
  await page.locator('#frequency').fill('1'); await page.locator('#frequency').dispatchEvent('input'); await wait(300);
});
await snap('guia-7-infrastructure-plan', ['#routeForm [type="submit"]']);
await act('g7-submit', async () => { await click('#routeForm [type="submit"]'); await wait(800); });
await snap('guia-7-infrastructure-abierta', [coachNext]);
await act('g7-next', next);
await snap('guia-8-day', ['#daybar [data-action="day-start"]', coachNext]);
await act('g8-start', async () => { await click('#daybar [data-action="day-start"]'); await page.waitForSelector('#drawer [data-action="respond"]', {timeout: 30000}); await wait(600); });
await snap('guia-8-day-incidencia', ['#drawer [data-action="respond"]', coachNext]);
await act('g8-respond', async () => { await click('#drawer [data-action="respond"]:not([disabled])'); await wait(600); });
await snap('guia-8-day-respondida', ['#daybar [data-action="day-end"]', coachNext]);
await act('g8-end', async () => { await click('#daybar [data-action="day-end"]'); await page.waitForFunction(() => document.getElementById('modal').open, null, {timeout: 30000}); await wait(800); });
await snap('guia-8-day-parte', ['#modal [data-action="day-next"]', coachNext], {skipUnderModal: true});
await act('g8-daynext', async () => { await click('#modal [data-action="day-next"]'); await wait(700); });
await snap('guia-8-day-siguiente', [coachNext]);
await act('g8-next', next);
await snap('guia-9-handoff', ['[data-action="tycoon-public"]', coachNext]);
await act('g9-accept', async () => { await click('[data-action="tycoon-public"]'); await wait(700); });
await snap('guia-9-handoff-aceptado', [coachNext]);
await act('g9-next', next);
await wait(400);
await snap('tras-guia');
await wait(4500);
await snap('pantalla-principal-reposo');

// ------------------------------------------------------------------ map layers
await act('cerrar-paneles', async () => { await closeDrawer(); await closeInspector(); await wait(400); });
await snap('pantalla-principal-sin-paneles');
await act('capas-open', async () => { await click('.map-layers > summary'); await wait(300); });
await snap('capas-desplegable');
for (const l of ['real', 'gauge', 'power', 'speed', 'works', 'network']) {
  await act('capa-' + l, async () => { if (!(await visible(`.layer-switch [data-layer="${l}"]`))) await click('.map-layers > summary'); await click(`.layer-switch [data-layer="${l}"]`); await wait(500); });
  await snap('capa-' + l);
}
await act('capas-close', async () => { if (await ev(() => document.querySelector('.map-layers')?.open)) await click('.map-layers > summary'); });

// ------------------------------------------------------------------ city & route inspectors via API pick
await act('ciudad', async () => { await ev(() => window.railwayGame.pick({type: 'city', id: 'mad'})); await wait(600); });
await snap('ficha-ciudad-madrid');
await act('cerrar-ciudad', closeInspector);
await act('ruta', async () => { await ev(() => window.railwayGame.selectRoute('madrid-barcelona')); await wait(700); });
await snap('ficha-relacion');
await act('ruta-scroll', async () => { await page.locator('#inspector .body').evaluate(el => el.scrollTo(0, el.scrollHeight)); await wait(300); });
await snap('ficha-relacion-abajo');
await act('cerrar-ruta', closeInspector);

// ------------------------------------------------------------------ every bottom-nav section and tab
const sections = {
  network: {tabAction: 'net-view', tabs: ['routes', 'ops', 'works', 'timetables', 'rivals']},
  fleet: {tabAction: 'fleet-tab', tabs: ['fleet', 'refits', 'market', 'orders']},
  finance: {tabs: []},
  story: {tabAction: 'tycoon-tab', tabs: ['agenda', 'apoyo', 'pactos', 'people', 'cloacas']},
  progress: {tabAction: 'progress-tab', tabs: ['campaign', 'hitos', 'research', 'proyectos']},
  press: {tabAction: 'press-tab', tabs: ['paper', 'journal', 'reports']},
};
for (const [screen, cfg] of Object.entries(sections)) {
  await act('nav-' + screen, () => nav(screen));
  if (!cfg.tabs.length) { await snap('menu-' + screen); await act('scroll-' + screen, async () => { await page.locator('#drawer .body').evaluate(el => el.scrollTo(0, el.scrollHeight)); await wait(300); }); await snap('menu-' + screen + '-abajo'); }
  for (const t of cfg.tabs) {
    await act(`tab-${screen}-${t}`, async () => {
      if (screen === 'fleet' && t !== 'market' && await exists('.tp-game-strip')) { await click('.tp-game-strip [data-action="fleet-tab"]'); await wait(300); }
      if (!(await exists(`#drawer [data-action="${cfg.tabAction}"][data-id="${t}"]`))) await nav(screen);
      await page.locator('#drawer .body').evaluate(el => el.scrollTo(0, 0)).catch(() => {}); await wait(150);
      await click(`#drawer [data-action="${cfg.tabAction}"][data-id="${t}"]`); await wait(500);
    });
    await snap(`menu-${screen}-${t}`);
    if (screen === 'network' && t === 'works') for (const wt of ['conv', 'changers', 'projects', 'running']) { await act('works-' + wt, async () => { await page.locator('#drawer .body').evaluate(el => el.scrollTo(0, 0)); await click(`#drawer [data-action="works-tab"][data-id="${wt}"]`); await wait(400); }); await snap(`menu-network-works-${wt}`); }
    if (screen === 'network' && t === 'timetables') { await act('tt-station', async () => { const b = page.locator('#drawer [data-action="tt-station"]'); if (await b.count()) { await b.first().click(); await wait(500); } }); await snap('menu-network-timetables-estacion'); }
    if (['routes', 'agenda', 'research', 'proyectos', 'campaign', 'paper'].includes(t)) { await act('scroll-' + t, async () => { await page.locator('#drawer .body').evaluate(el => el.scrollTo(0, el.scrollHeight / 2)); await wait(300); }); await snap(`menu-${screen}-${t}-medio`); }
  }
  await act('close-' + screen, closeDrawer);
}

// ------------------------------------------------------------------ Trenes Pop purchase dialog
await act('trenespop', async () => { await ev(() => { const s = window.railwayGame.state(); s.cash = Math.max(s.cash, 2000); window.railwayGame.render(); }); await nav('fleet'); await click('#drawer [data-action="fleet-tab"][data-id="market"]'); await wait(600); });
await snap('trenespop-catalogo');
await act('trenespop-ficha', async () => { const l = page.locator('[data-action="market-listing"]'); await l.first().click(); await page.waitForSelector('#modal[open]'); await wait(800); });
await snap('trenespop-ficha-compra', ['#modal [data-action="confirm-buy"]']);
await act('trenespop-cerrar', closeModal);
await act('trenespop-salir', async () => { if (await exists('.tp-game-strip [data-action="fleet-tab"]')) await click('.tp-game-strip [data-action="fleet-tab"]'); await wait(300); });

// ------------------------------------------------------------------ train refit
await act('flota-detalle', async () => { if (!(await exists('#drawer [data-action="fleet-detail"]'))) await nav('fleet'); await click('#drawer button[data-action="fleet-detail"]'); await page.waitForSelector('#modal[open]'); await wait(800); });
await snap('flota-ficha-lote', ['#modal [data-action="refit-detail"]']);
await act('reforma', async () => { await click('#modal [data-action="refit-detail"]'); await wait(900); });
await snap('reforma-tren', ['#modal [data-action="refit-confirm"]']);
await act('reforma-scroll', async () => { await page.locator('#modal').evaluate(el => { const c = el.querySelector('.modal') || el; c.scrollTo?.(0, c.scrollHeight); el.scrollTo?.(0, el.scrollHeight); }); await wait(300); });
await snap('reforma-tren-abajo');
await act('reforma-cerrar', closeModal);
await act('drawer-cerrar', closeDrawer);

// ------------------------------------------------------------------ taller de vías
await act('taller', async () => {
  await ev(() => { const api = window.railwayGame; api.setLayer('gauge'); const s = api.state(), id = Object.keys(s.infra.t).find(id => s.infra.t[id].b && s.infra.t[id].g === 'ib'); api.pick({type: 'tramo', id}); });
  await wait(700);
});
await snap('ficha-tramo', ['[data-action="track-designer"]']);
await act('taller-open', async () => { await click('[data-action="track-designer"]'); await page.waitForSelector('#modal[open] .track-options'); await wait(900); });
await snap('taller-vias', ['[data-action="track-confirm"]']);
await act('taller-select', async () => { await click('[data-action="track-select"][data-key="g"][data-value="mixto"]'); await click('[data-action="track-select"][data-key="e"][data-value="25kv"]'); await wait(700); });
await snap('taller-vias-propuesta', ['[data-action="track-confirm"]']);
await act('taller-scroll', async () => { await page.locator('#modal').evaluate(el => { el.scrollTo?.(0, el.scrollHeight); el.querySelector('.modal')?.scrollTo?.(0, 99999); }); await wait(300); });
await snap('taller-vias-abajo');
await act('taller-cerrar', closeModal);
await act('tramo-cerrar', async () => { await closeInspector(); await ev(() => window.railwayGame.setLayer('network')); });

// ------------------------------------------------------------------ council conversation (Despacho → Agenda)
await act('agenda', async () => { await nav('story'); await click('#drawer [data-action="tycoon-tab"][data-id="agenda"]'); await wait(600); });
await snap('despacho-agenda', ['.desk-decision [data-action="decision"]']);
const hadDecision = await exists('.desk-decision');
say('decisión pendiente en agenda: ' + hadDecision);
await act('consejo', councilAll);
await snap('despacho-agenda-tras-consejo');
await act('agenda-cerrar', closeDrawer);

// ------------------------------------------------------------------ close a turn → decision modal? → suceso
await act('cerrar-turno', async () => {
  await click('#daybar [data-action="skip-month"]'); await wait(1200);
});
await snap('tras-cerrar-turno');
for (let i = 0; i < 4 && (await exists('#modal[open] [data-action="decision"]')); i++) {
  await snap('consejo-modal-' + i, ['#modal [data-action="decision"]'], {skipUnderModal: true});
  await act('consejo-modal-choice', async () => { await councilAll(); await wait(500); });
  if (!(await modalOpen())) { await act('cerrar-turno-2', async () => { await click('#daybar [data-action="skip-month"]'); await wait(1200); }); await snap('tras-cerrar-turno-' + (i + 2)); }
}
if (await modalOpen()) { await snap('modal-tras-turno'); await act('cerrar-modal-turno', closeModal); }
await act('suceso-wait', async () => { await page.waitForSelector('.game-event', {timeout: 8000}); await page.waitForFunction(() => { const el = document.querySelector('.game-event img'); return el?.complete && el.naturalWidth > 0; }); await wait(600); });
await snap('suceso-ilustrado', ['[data-action="game-event"]']);
await act('suceso-scroll', async () => { await page.locator('.game-event [data-action="game-event"]').first().scrollIntoViewIfNeeded(); await wait(300); });
await snap('suceso-opciones', ['[data-action="game-event"]']);
await act('suceso-elegir', async () => { await click('[data-action="game-event"]:not([disabled])'); await wait(900); });
await snap('suceso-resuelto');
await wait(3000);
await snap('suceso-resuelto-t3s');
await act('suceso-cerrar', async () => { await closeModal(); await closeDrawer(); });
await snap('reposo-turno-2');

// ------------------------------------------------------------------ jornada con incidencia
await act('jornada-start', async () => {
  for (let i = 0; i < 3 && (await exists('#modal[open] [data-action="decision"]')); i++) await councilAll();
  if (await exists('.game-event [data-action="game-event"]')) await click('[data-action="game-event"]:not([disabled])');
  await closeDrawer();
  await click('#daybar [data-action="day-start"]'); await wait(600);
  if (await modalOpen()) { await councilAll(); await closeModal(); await click('#daybar [data-action="day-start"]'); await wait(600); }
});
await snap('jornada-en-curso');
await act('jornada-incidencia', async () => {
  await ev(() => { const g = window.railwayGame, s = g.state(), op = s.ops; const p = g.plan().find(t => t.arrival > op.minute + 60); if (p) op.minute = Math.max(op.minute, p.dep); g.operations.injectIncident(s, op.minute); g.play(); });
  await page.waitForFunction(() => { const s = window.railwayGame.state(); return !!document.querySelector('.alert-pill') || s.ops.incidents.some(x => s.ops.minute >= x.at && !s.ops.resolved.includes(x.trip)); }, null, {timeout: 20000});
  await page.waitForSelector('.alert-pill', {timeout: 3000}).catch(() => {});
  await ev(() => window.railwayGame.pause()); await wait(500);
});
await snap('jornada-alerta-incidencia', ['.alert-pill [data-action="open-incidents"]']);
await act('jornada-decidir', async () => { if (await visible('.alert-pill [data-action="open-incidents"]')) await click('.alert-pill [data-action="open-incidents"]'); else await nav('network'), await click('#drawer [data-action="net-view"][data-id="ops"]'); await wait(600); });
await snap('jornada-centro-control', ['#drawer [data-action="respond"]']);
await act('jornada-responder', async () => { if (await exists('#drawer [data-action="respond"]:not([disabled])')) await click('#drawer [data-action="respond"]:not([disabled])'); await wait(500); });
await snap('jornada-respondida');
await act('jornada-velocidad', async () => { await closeDrawer(); await click('#daybar [data-action="speed"][data-id="3"]'); await click('#daybar [data-action="play"]'); await wait(2500); });
await snap('jornada-reproduciendo-30x');
await act('jornada-fin', async () => { await ev(() => window.railwayGame.pause()); await click('#daybar [data-action="day-end"]'); await page.waitForFunction(() => document.getElementById('modal').open, null, {timeout: 30000}); await wait(800); });
await snap('jornada-parte', ['#modal [data-action="day-next"]'], {skipUnderModal: true});
await act('jornada-siguiente', async () => { await click('#modal [data-action="day-next"]'); await wait(600); });
await snap('jornada-siguiente');

// ------------------------------------------------------------------ save / help / music / settings
await act('guardar', async () => { await click('#navigation [data-action="save-dialog"]'); await page.waitForSelector('#modal[open]'); await wait(700); });
await snap('menu-guardar', [], {skipUnderModal: true});
await act('guardar-cerrar', closeModal);
await act('ayuda', async () => { await click('#navigation [data-action="help"]'); await page.waitForSelector('#modal[open]'); await wait(700); });
await snap('menu-ayuda', [], {skipUnderModal: true});
await act('ayuda-cerrar', closeModal);
await act('musica', async () => { await click('#navigation [data-action="music"]'); await page.waitForSelector('#modal[open]'); await wait(700); });
await snap('menu-musica', [], {skipUnderModal: true});
await act('musica-cerrar', closeModal);
await act('menu-home', async () => { await click('#navigation [data-action="menu-home"]'); await page.waitForSelector('#modal[open] .main-menu'); await wait(900); });
await snap('portada-en-partida', [], {skipUnderModal: true});
await act('opciones', async () => { await click('.main-menu [data-action="menu-settings"]'); await wait(800); });
await snap('portada-opciones', [], {skipUnderModal: true});
await act('opciones-volver', async () => { await click('#modal [data-action="menu-home"]'); await wait(600); });

// ------------------------------------------------------------------ fresh game without guide → welcome panel
await act('nueva-sin-guia', async () => {
  await click('.main-menu [data-action=new-game]'); await page.waitForSelector('#modal[open] .np-screen');
  await page.fill('#npSeed', 'AUDITORIA2'); await page.locator('#npGuide').uncheck();
  await click('[data-action="np-begin"]'); if (await exists('.np-confirm')) await click('[data-action="np-yes"]');
  await page.waitForSelector('#entry-welcome', {timeout: 15000}); await wait(900);
});
await snap('bienvenida-sin-guia', ['[data-action="welcome-close"]']);
await wait(3000);
await snap('bienvenida-sin-guia-t4s', ['[data-action="welcome-close"]']);
await act('bienvenida-cerrar', async () => { await click('[data-action="welcome-close"]'); await wait(700); });
await snap('reposo-sin-guia');
await act('continuar', async () => { await page.reload(); await page.waitForFunction(() => !!window.railwayGame); await wait(800); await click('[data-action="continue"]'); await page.waitForSelector('#entry-welcome', {timeout: 10000}); await wait(900); });
await snap('bienvenida-continuar', ['[data-action="welcome-close"]']);

fs.writeFileSync(path.join(out, 'reports.json'), JSON.stringify(reports, null, 1));
fs.writeFileSync(path.join(out, 'summary.txt'), log.join('\n') + '\n\nERRORS:\n' + errors.join('\n'));
say('ERRORS: ' + errors.length); errors.forEach(e => say('  ' + e));
await browser.close();
