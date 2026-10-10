import {INDUCTION_STAGES} from './induction.js';
import {dialogueHtml} from './dialogue-presentation.js';
import {freshInduction, note, stageChecks, readyInduction, inductionBriefing, inductionFeedbackLine, canInductionAnswer, restoreInductionHandoff} from './induction-runtime.js';
import {menuHTML} from './main-menu.js';
import {STARTS, newGameHTML, normalizeSeed, seedFromCode, randomSeedCode, seedCodeOf, overwrittenBy} from './nueva-partida.js';
import * as U from './tenfe.js';
import * as TenfeUI from './tenfe-ui.js';
import {legacySave, summary as rescueSaveSummary, convertLegacy} from './partidas-anteriores.js';
import {focusedTaskHTML} from './induction-task-ui.js';
import * as T from './tycoon.js';
import {tycoonPage,directionCount} from './tycoon-ui.js';
// Iberia Ferroviaria 2.0 — interfaz. Mapa a pantalla completa, jornada por turnos, red de anchos y catenaria.
import {CITIES, CITY, MODELS, MODEL, PROJECTS, HISTORICAL_ORDERS, GAUGES, POWERS} from './data.js';
import {CHAPTERS, CHARACTERS} from './story.js';
import * as E from './engine.js';
import * as V from './verdad.js';
import * as Marketplace from './marketplace.js';
import * as O from './operations.js';
import * as S from './schedule.js';
import * as I from './infra.js';
import {RailMap, FAMILY_COLOR, GAUGE_COLOR, ELEC_COLOR, SPEED_BANDS, INFRA_LAYERS} from './map-v3.js';
import {trainArt, artKey} from './train-art.js';
import {citySkyline} from './city-art.js';
import {trainThumb, mountViewers} from './train3d.js';
import {Voices, sentences, CAST} from './voice.js';
import {Soundtrack, SONGS, STYLE_LABEL, FAMILY_LABEL} from './music.js';
import {Sfx, ACTIONS} from './sfx.js';
import {faceURL} from './faces.js';

const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const n = (x, d = 0) => Number(x || 0).toLocaleString('es-ES', {maximumFractionDigits: d, minimumFractionDigits: d});
const money = x => n(x, Math.abs(x) < 10 ? 2 : 1) + ' M€', signed = x => (x >= 0 ? '+' : '') + money(x);
const clock = O.clockText;
const KEY = 'iberia-ferroviaria-v2';
const SPEEDS = [[2, '1×'], [6, '3×'], [20, '10×'], [60, '30×']];
const LAYERS = ['network', 'real', 'gauge', 'power', 'speed', 'works'];
const ICONS = {
  progress:'<path d="M4 20V4h16M8 16l4-5 4 2 4-7"/>',
  press:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ops: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  network: '<path d="M4 18c4-1 4-11 8-12s4 9 8 8"/><circle cx="4" cy="18" r="1.6"/><circle cx="20" cy="14" r="1.6"/><circle cx="12" cy="6" r="1.6"/>',
  timetables: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9h16M9 9v11M13 13h4M13 16.5h4"/>',
  fleet: '<path d="M5 15V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM5 11h14M8 20l1.5-3M16 20l-1.5-3"/><circle cx="8.5" cy="14" r=".8"/><circle cx="15.5" cy="14" r=".8"/>',
  market: '<path d="M4 7h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5zM9 7V5.5a3 3 0 0 1 6 0V7"/>',
  works: '<path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5"/><path d="M15 4l4 2"/>',
  finance: '<path d="M4 19h16M7 16V10M12 16V6M17 16v-4"/>',
  story: '<rect x="3.5" y="8" width="17" height="11.5" rx="2"/><path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2M3.5 13h17M11 13v2h2v-2"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  stopsq: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
  alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.3v.2"/>',
  bolt: '<path d="M13 3.5 6 13.5h5l-1 7 7-10h-5z"/>',
  cone: '<path d="M10.2 4.5h3.6l4.2 14H6zM8.3 11h7.4M7.4 14.6h9.2M4.5 18.5h15"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>',
  signal: '<rect x="8" y="3.5" width="8" height="12" rx="3"/><circle cx="12" cy="7.3" r="1.4"/><circle cx="12" cy="11.6" r="1.4"/><path d="M12 15.5v5M8.5 20.5h7"/>',
  hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5a1.5 1.5 0 0 1 3 0v5M14 10V6.5a1.5 1.5 0 0 1 3 0v6.5a6.5 6.5 0 0 1-6.5 6.5A5.5 5.5 0 0 1 5 14.5l-1-2.5a1.4 1.4 0 0 1 2.5-1.2L8 13"/>',
  cloud: '<path d="M7 17.5h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.3A3.4 3.4 0 0 0 7 17.5z"/><path d="M9 20l1-1.5M13 20l1-1.5"/>',
  swap: '<path d="M5 8.5h13l-3.5-3.5M19 15.5H6l3.5 3.5"/>',
  archive: '<rect x="4" y="5" width="16" height="4" rx="1"/><path d="M5.5 9v10h13V9M10 12.5h4"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  save: '<path d="M5 5h11l3 3v11H5zM8 5v5h7V5M8 19v-5h8v5"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 16.6v.4"/>',
};
const PAGES = {network: 'Red', fleet: 'Flota', finance: 'Dinero', story: 'Despacho', progress: 'Progreso', press: 'Prensa'};
// Secciones antiguas que ahora son pestañas de una de las cinco páginas.
const ALIASES = {ops:['network','netView','ops'],works:['network','netView','works'],timetables: ['network', 'netView', 'timetables'], market: ['fleet', 'fleetTab', 'market'], archive: ['press', 'pressTab', 'journal']};

let linePicking=null,savedError='',menuOpen=true,np=null; // np: pantalla «Nueva partida» abierta (arranque, maqueta, semilla, confirmación)
let state = E.initialState(), saved = null, screen = null, inspect = null, playing = false, speedIndex = 1, layer = 'network';
let lastTick = 0, lastPanel = 0, lastTimeline = 0, observerMinute = 480, seenIncidents = new Set(), alertTimer = null, toastTimer = null;
let ui = {routeTab: 'all', routeStatus: 'all', routeQuery: '', netView: 'routes', ttType: null, ttStation: '', ttLine: '', ttHour: 6, fleetTab: 'fleet', worksTab: 'conv', officeTab: 'tycoon', autoPause: true};
const freshMarketFilters = () => ({query: '', state: 'all', delivery: 'all', maker: 'all', family: 'all', sort: 'recommended', favorites: false, route: ''});
ui.market = freshMarketFilters();
ui.progressTab='campaign';ui.pressTab='paper';
O.ensureOps(state);U.begin(state);
try { const raw = localStorage.getItem(KEY); if (raw) saved = E.validateSave(JSON.parse(raw)); } catch(error) { saved = null; savedError=error.message; }

// ------------------------------------------------------------ vista para el mapa
let realCache = {type: null, trips: null};
function realTrips(type) {
  if (realCache.type === type) return realCache.trips;
  realCache = {type, trips: S.dayTrips(type).map(t => ({id: t.key, trip: t, dep: t.start, arrival: t.end, delay: 0, line: t.line, bus: t.bus, route: t.route,
    label: (t.bus ? 'Bus ' : '') + S.lineCode(t.line) + (t.number ? ' ' + t.number : ''), name: S.STATIONS[t.stations[0]].name + ' → ' + S.STATIONS[t.stations.at(-1)].name}))};
  return realCache.trips;
}
const dayType = () => O.dayKind(state);
function plan() { return O.servicePlan(state); }
function currentMinute() {
  const op = state.ops;
  if (layer === 'real') return observerMinute;
  if (op.phase === 'running') return op.minute;
  const b = O.dayBounds(plan());
  return op.phase === 'review' ? (op.last?.last ?? b.last) : b.first;
}
function viewTrips() {
  if (layer === 'real') return realTrips(dayType());
  return state.ops.phase === 'running' ? plan() : [];
}
function networkKey() { return state.routes.filter(r => r.active).map(r => r.id + r.frequency + r.fleet).join('|') + '#' + layer + '#' + state.infra.ver + '#' + state.projects.filter(p => !p.done).length; }
let netKey = networkKey();
let lastBackgroundMapFrame=0;
const map = new RailMap($('map'), {
  isVisible: () => {
    if($('modal').open || screen && innerWidth<=760)return false;
    if(screen){const now=performance.now();if(now-lastBackgroundMapFrame<125)return false;lastBackgroundMapFrame=now;}
    return true;
  },
  getState: () => state,
  getView: () => ({mode: layer === 'real' ? 'real' : 'campaign', trips: viewTrips(), minute: currentMinute(), date: O.dayDate(state), dayType: dayType(), networkKey: netKey}),
  onPick: hit => pick(hit),
  getCities: () => mapCities(),
  getPopups: () => popups,
});

// ------------------------------------------------------------ banda sonora
function musicMood() {
  if (!state.started || state.ops.phase !== 'running') return 'estacion';
  return O.daylight(state, state.ops.minute).night > .55 ? 'night' : state.ops.minute >= 17 * 60 + 30 ? 'dusk' : 'day';
}
const music = new Soundtrack(musicMood);
const voices = new Voices(music);
const sfx = new Sfx(music);
// ------------------------------------------------------------ voces de los personajes
/** Texto con cada frase en su propio span, para el subtítulo resaltado mientras se lee. */
function sayHtml(text, person) { return dialogueHtml(text, person); }
function sayLabel(where) { return voices.speaking?.where === where ? 'Detener voz' : 'Escuchar diálogo'; }
function sayButton(person, where) { const active = voices.speaking?.where === where, label = sayLabel(where); return `<button class="say-btn" data-action="say" data-person="${person}" data-where="${where}" aria-label="${label}" title="${label}" aria-pressed="${active}">${active ? glyph('stopsq') : glyph('speaker')}</button>`; }
function syncSayButtons() {
  document.querySelectorAll('.say-btn').forEach(button => {
    const active = voices.speaking?.where === button.dataset.where, label = sayLabel(button.dataset.where);
    button.title = label; button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', String(active));
    if (button.dataset.sayText !== undefined) button.textContent = label;
    else button.innerHTML = glyph(active ? 'stopsq' : 'speaker');
    const caption = button.closest('.speaker')?.querySelector('.say-caption');
    if (caption) caption.textContent = label;
  });
}
voices.on(syncSayButtons);
/** Lee el párrafo [data-say] dentro de root con la voz del personaje y resalta cada frase. */
function speakIn(root, person, where) {
  const el = root?.querySelector('[data-say]'); if (!el) return;
  const spans = [...el.querySelectorAll('.say-s')], face = root.querySelector('.portrait');
  const clear = () => { spans.forEach(x => x.classList.remove('on')); face?.classList.remove('talking'); syncSayButtons(); };
  const ok = voices.speak(person, el.dataset.say, {mood:root.querySelector('[data-mood]')?.dataset.mood||'happy',onSentence: i => { spans.forEach((x, j) => x.classList.toggle('on', j === i)); }, onend: clear,onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }});
  if (!ok) return;
  if (voices.speaking) voices.speaking.where = where;
  face?.classList.add('talking'); syncSayButtons();
}
function renderMusicButton() {
  const b = $('musicBtn'); if (!b) return;
  b.innerHTML = `${icon('music')}<span>${music.enabled ? 'Música' : 'Silencio'}</span>`;
  b.title = music.current ? `Sonando: ${music.current.song.title}` : music.enabled ? 'Banda sonora' : 'Música apagada';
  b.classList.toggle('on', !!music.current);
  if ($('modal').open && $('modal').querySelector('.tracks')) musicDialog(true);
}
music.on(renderMusicButton);
document.addEventListener('pointerdown', () => { if (music.enabled && !music.current) music.start(); }, {once: true});
['pointerdown', 'keydown', 'click'].forEach(type => document.addEventListener(type, () => sfx.arm(), {once: true, capture: true}));
let lastMood = null;
function checkMusicMood() {
  if (!music.current || music.mode !== 'auto') return;
  const mood = musicMood(), fam = mood === 'estacion' ? 'estacion' : 'red';
  if (music.current.song.family !== fam) music.next();
  else if (fam === 'red' && music.current.song.mood !== mood && music.position > 25) music.next();
  lastMood = mood;
}
function musicDialog(refresh = false) {
  const cur = music.current?.song.id;
  const list = fam => SONGS.filter(x => x.family === fam).map(x => `<button class="track ${x.id === cur ? 'on' : ''}" data-action="music-play" data-id="${x.id}"><span class="no">${String(SONGS.indexOf(x) + 1).padStart(2, '0')}</span><span><b>${esc(x.title)}</b><em>${STYLE_LABEL[x.style]} · ${x.bpm} ppm${x.mood === 'night' ? ' · noche' : ''}</em></span><span class="eq">${x.id === cur ? '<i></i><i></i><i></i>' : '▶'}</span></button>`).join('');
  const html = `<div class="content"><div class="kicker">Banda sonora</div><h1>Música de Iberia Ferroviaria</h1>
  <div class="tracks"><h3>${FAMILY_LABEL.estacion}</h3>${list('estacion')}<h3>${FAMILY_LABEL.red}</h3>${list('red')}</div>
  <div class="toolbar"><button class="btn ${music.enabled ? '' : 'primary'}" data-action="music-toggle">${music.enabled ? 'Apagar música' : 'Encender música'}</button><button class="btn" data-action="music-next" ${music.enabled ? '' : 'disabled'}>Siguiente pieza</button>
  <label style="margin:0">Modo</label><select id="musicMode"><option value="auto" ${music.mode === 'auto' ? 'selected' : ''}>Automático según el momento</option><option value="list" ${music.mode === 'list' ? 'selected' : ''}>Toda la lista</option><option value="repeat" ${music.mode === 'repeat' ? 'selected' : ''}>Repetir pieza</option></select></div>
  <label for="musicVolume">Volumen</label><input id="musicVolume" type="range" min="0" max="1" step="0.05" value="${music.volume}">
  <h3 class="sub">Voces de los personajes</h3>
  <div class="toolbar"><button class="btn ${voices.enabled ? '' : 'primary'}" data-action="voice-toggle">${voices.enabled ? 'Silenciar personajes' : 'Activar voces'}</button></div>
  <h3 class="sub">Efectos de sonido</h3>
  <div class="toolbar"><button class="btn ${sfx.enabled ? '' : 'primary'}" data-action="sfx-toggle">${sfx.enabled ? 'Silenciar efectos' : 'Activar efectos'}</button></div>
  <label for="sfxVolume">Volumen de los efectos</label><input id="sfxVolume" type="range" min="0" max="1" step="0.05" value="${sfx.volume}">
  <div class="actions"><button class="btn primary" data-action="close-modal">Cerrar</button></div></div>`;
  if (refresh) { const sc = $('modal').querySelector('.content')?.scrollTop || 0; $('modal').innerHTML = `<div class="modal single">${html}</div>`; $('modal').querySelector('.content').scrollTop = sc; }
  else showModal(html, 'single');
}

// ------------------------------------------------------------ utilidades de UI
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4200); }
function autosave(announce = false) {
  try { state.savedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); saved = state; if (announce) toast('Partida guardada en este navegador.'); return true; }
  catch { if (announce) toast('El navegador no permite guardar aquí. Exporta la partida.'); return false; }
}
function act(fn, message) {
  try { fn(); if (message) toast(message); netKey = networkKey(); map.dirty = true; afterCityAction(); autosave(); render(); sfx.result(true); return true; }
  catch (error) { toast(error.message); sfx.result(false); return false; }
}
/** Efecto de sonido de cada botón (ver ACTIONS en sfx.js): al pulsar, al salir bien la acción o según el estado. */
const hashOf = x => [...String(x)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function clickSound(a, b) {
  const spec = ACTIONS[a], id = b.dataset.id;
  sfx.intent = null;
  if (!spec || spec[0] === '@') return;
  if (spec[0] === '=') {
    const r = (a === 'freq-up' || a === 'freq-down') && routeById(id);
    return sfx.expect(spec.slice(1), r ? () => ({level: r.frequency / Math.max(1, E.maxFrequency(r))}) : {});
  }
  if (spec === '!play') return sfx.play(a === 'play' && playing ? 'pause' : state.started && state.ops.phase === 'planning' && layer !== 'real' ? 'departure' : 'resume');
  if (spec === '!toggle') {
    const on = a === 'music-toggle' ? !music.enabled : a === 'voice-toggle' ? !voices.enabled : a === 'sfx-toggle' ? !sfx.enabled : !map.follow;
    return a === 'sfx-toggle' && on ? null : sfx.play(on ? 'toggleOn' : 'toggleOff'); // al activar los efectos, el clic suena después
  }
  const siblings = [...(b.parentElement?.querySelectorAll(`[data-action="${a}"]`) || [])];
  const opts = {nav: {i: Object.keys(PAGES).indexOf(b.dataset.screen)}, tab: {i: Math.max(0, siblings.indexOf(b))}, pickCity: {i: hashOf(id)}, lever: {i: LAYERS.indexOf(id)},
    speed: {i: +id}, tutorialNext: {i: (tut?.step ?? 0) + 1}}[spec] || {};
  sfx.play(spec, opts);
}
function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`; }
function glyph(name) { return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`; }
const INCIDENT_ICON = {breakdown: 'gear', signal: 'signal', trespass: 'hand', weather: 'cloud', changer: 'swap'};
const incidentGlyph = x => glyph(INCIDENT_ICON[x.type] || 'alert');
/** Retrato del personaje con la cara que toca (happy, angry, worried). */
const faceStyle = (person, mood = 'happy') => `background-image:url('${faceURL(person, mood)}')`;
function chip(text, color) { return `<span class="chip" style="background:${esc(color)}">${esc(text)}</span>`; }
/** Producto de la relación: el de su tren o, si está cerrada, el mejor que permite la red. */
function familyOf(r) { return E.product(state, r) || E.bestProduct(state, r); }
function routeColor(r) { return FAMILY_COLOR[familyOf(r)] || '#8a7c69'; }
function routeChip(r) { const f = familyOf(r); return chip(f || 'Sin vía', FAMILY_COLOR[f] || '#8a7c69'); }
function routeName(r) { return r.name || E.routeName(r); }
function statusOf(r) {
  if (r.active) return ['on', 'En servicio'];
  if (r.cut) return ['works', 'Cortada por obras'];
  if (!E.isUnlocked(state, r)) return ['blocked', 'Sin vía posible'];
  return ['off', 'Por abrir'];
}
const workOn = r => O.workOn(state, r);
/** Lo que falta para que circule un AVE (o un Alvia, si ni eso). */
function missingFor(r) {
  const o = E.routeOptions(state, r);
  if (o.ave.ok) return null;
  const alt = o.alvia.ok ? o.alvia : o.hybrid.ok ? o.hybrid : null;
  return {ave: o.ave.faults, alvia: alt ? null : o.alvia.faults, hybrid: alt ? null : o.hybrid.faults, alt};
}
function faultList(faults, max = 3) {
  return faults.slice(0, max).map(f => `<li>${f.tramo ? `<button class="linkish" data-action="tramo" data-id="${esc(f.tramo)}">${esc(I.faultText(state, f))}</button>` : f.node ? `<button class="linkish" data-action="node" data-id="${esc(f.node)}">${esc(I.faultText(state, f))}</button>` : esc(I.faultText(state, f))}</li>`).join('') + (faults.length > max ? `<li class="muted">y ${faults.length - max} más</li>` : '');
}

/** Serie ilustrada para una circulación: material asignado o producto. */
function tripArtKey(t, r) {
  if (t.bus) return 'bus';
  if (r?.fleet) { const f = state.fleet.find(f => f.id === r.fleet); if (f) return artKey(MODEL[f.model]?.photo||f.model); }
  const code = t.line !== undefined && t.line !== null ? S.lineCode(t.line) : t.family || '';
  return code === 'Alvia' ? '130' : '112';
}


// ------------------------------------------------------------ ciudades: datos para el mapa
let cityCache = {key: null, list: []};
function mapCities() {
  const op = state.ops;
  const key = netKey + '#' + JSON.stringify(state.requests || []) + JSON.stringify(state.stations || {}) + state.month + '#' + JSON.stringify(op.surges || []) + Math.floor((op.minute || 0) / 15) + op.phase;
  if (cityCache.key === key) return cityCache.list;
  const ids = new Set(CITIES.map(c => c.id));
  for (const r of state.routes) for (const c of r.ends) ids.add(c);
  const list = [];
  for (const id of ids) {
    const c = CITY[id];
    if (!c) continue;
    const routes = E.cityRoutes(state, id), active = routes.filter(r => r.active).length;
    if (!routes.length && !E.cityPopulation(id)) continue;
    const crowd = routes.some(r => r.active && E.metrics(state, r).occupancy > .93);
    const request = (state.requests || []).some(q => q.city === id) || liveSurges().some(x => x.city === id);
    list.push({id, name: c.name, lon: c.lon, lat: c.lat, pop: E.cityPopulation(id), total: routes.length, active,
      status: !routes.length || !active ? 'off' : active === routes.length ? 'on' : 'some', crowd, request, station: state.stations?.[id] || 0});
  }
  list.sort((a, b) => (a.pop || 0) - (b.pop || 0));
  return (cityCache = {key, list}).list;
}
function liveSurges() { const op = state.ops; return op.phase === 'running' ? (op.surges || []).filter(x => !x.done && !x.failed && op.minute >= x.at - 30) : []; }
function otherEnd(r, id) { const o = r.ends.find(c => c !== id) || r.ends[0]; return CITY[o]?.name || o; }
function nearCity(st, c) { return Math.hypot((st.lon - c.lon) * 85, (st.lat - c.lat) * 111) < 18; }

// ------------------------------------------------------------ viajeros e ingresos de la jornada
let popups = [], today = {pax: 0, money: 0, trains: 0}, perTrip = {}, seenSurges = new Set();
function resetToday() { today = {pax: 0, money: 0, trains: 0}; perTrip = {}; popups = []; seenSurges = new Set(); }
function tripYield(t) {
  const r = state.routes.find(r => r.id === t.route);
  if (!r) return {pax: 0, money: 0};
  if (!perTrip[r.id]) { const m = E.metrics(state, r), k = Math.max(1, r.frequency * (r.circular ? 1 : 2) * 30); perTrip[r.id] = {pax: m.passengers / k, money: m.revenue * 1e6 / k}; }
  const y = perTrip[r.id], f = .7 + ((t.dep * 37 + t.id.length * 11) % 60) / 100;
  return {pax: Math.max(1, Math.round(y.pax * f)), money: y.money * f};
}
function spawnArrivals(from, to) {
  const now = performance.now();
  for (const t of plan()) {
    if (!(t.arrival > from && t.arrival <= to)) continue;
    const y = tripYield(t);
    today.pax += y.pax; today.money += y.money; today.trains++;
    let ll = null;
    if (t.trip) { const st = S.STATIONS[t.trip.stations.at(-1)]; ll = [st.lon, st.lat]; } else if (t.coords?.length) ll = t.coords.at(-1);
    if (ll && popups.length < 50) popups.push({lon: ll[0], lat: ll[1], text: '+' + n(y.pax) + ' viajeros', sub: '+' + n(y.money / 1000, 1) + ' mil €', color: '#2f7d48', born: now});
  }
  popups = popups.filter(p => now - p.born < 2700);
}
function celebrate(city, text, sub) {
  const c = CITY[city];
  if (c) popups.push({lon: c.lon, lat: c.lat, text, sub, color: '#b07a12', born: performance.now()});
}
function checkSurgeEvents() {
  for (const x of state.ops.surges || []) {
    if (!seenSurges.has(x.id) && state.ops.minute >= x.at - 30 && !x.done && !x.failed) {
      seenSurges.add(x.id);
      const r = state.routes.find(r => r.id === x.route);
      showAlert({type: 'surge', reason: x.reason + ' en ' + (CITY[x.city]?.name || ''), route: x.route, place: `refuerza hasta ${x.need} salidas antes de las ${clock(x.until)} · +${n(x.bonus * 1000)} mil €`, city: x.city}, r);
    }
  }
  for (const x of O.checkSurges(state)) { celebrate(x.city, '¡Refuerzo a tiempo!', '+' + n(x.bonus * 1000) + ' mil €'); toast('Momento del día cumplido: ' + x.reason + ' · +' + n(x.bonus * 1000) + ' mil €'); cityCache.key = null; }
}

// ------------------------------------------------------------ acciones rápidas sobre conexiones
/** Lote de trenes para una relación: el suyo si cabe; si no, AVE antes que Alvia y eléctrico antes que híbrido. */
function fleetFor(r, freq) {
  const rank = f => (MODEL[f.model].family === 'AVE' ? 0 : MODEL[f.model].power === 'electric' ? 1 : 2);
  const lots = state.fleet.filter(f => f.qty && f.condition >= 30 && E.canRun(state, r, MODEL[f.model]));
  const fits = f => E.available(state, f, r.id) >= E.requiredUnits(state, r, MODEL[f.model], freq);
  return lots.find(f => f.id === r.fleet && fits(f)) || lots.filter(fits).sort((a, b) => rank(a) - rank(b) || E.available(state, b, r.id) - E.available(state, a, r.id))[0] || null;
}
function setService(r, freq, fare = r.fare) {
  const max = E.maxFrequency(r);
  freq = Math.max(1, Math.min(max, freq));
  let f = fleetFor(r, freq), want = freq;
  while (!f && freq > 1) { freq--; f = fleetFor(r, freq); }
  if (!f) {
    if (!E.isUnlocked(state, r)) { const o = E.routeOptions(state, r); throw Error('Por ahí no pasa ni un AVE ni un Alvia: ' + I.faultText(state, o.hybrid.faults[0] || o.ave.faults[0]).toLowerCase() + '.'); }
    throw Error('No te quedan trenes libres que puedan ir por esa vía. Compra, reforma o quítaselos a otra línea.');
  }
  E.configureRoute(state, r.id, f.id, freq, fare);
  if (freq < want) toast(`Solo hay trenes para ${freq} salidas por sentido.`);
}
function afterCityAction() {
  const r = E.checkRequests(state);
  if (r.started.length) {
    const q = r.started[0];
    toast(`Petición en marcha: ${CITY[q.city]?.name || q.city}. Cobras ${q.reward} M€ si la mantienes ${E.REQUEST_CLOSES} cierres de mes.`);
    celebrate(q.city, 'Petición en marcha', `${E.REQUEST_CLOSES} cierres para cobrar`);
  } else if (r.broken.length) toast(`Petición incumplida: ${CITY[r.broken[0].city]?.name || r.broken[0].city}. Se pierde el premio.`);
  if (state.ops.phase === 'running') checkSurgeEvents();
  perTrip = {}; cityCache.key = null;
}
function reqStatus(q) { return q.serving ? `Cumpliendo · ${q.kept || 0}/${E.REQUEST_CLOSES} cierres` : `Plazo: ${E.dateOf(q.until)}`; }
function reqText(q) {
  const r = state.routes.find(r => r.id === q.route), dest = r ? otherEnd(r, q.city) : '';
  return {open: `Quiere tren con ${dest}, y lo quiere ya`, more: `Exige ${q.target} salidas por sentido con ${dest}`, fare: `Pide bajar a ${q.target} € el billete a ${dest}`,
    station: `Quiere una estación decente: ${E.STATION_LEVELS[q.target]}`, ave: `¡Quiere AVE! Nada de Alvia hasta ${dest}`}[q.type];
}
function doRequest(q) {
  const r = state.routes.find(r => r.id === q.route);
  if (q.type === 'station') E.upgradeStation(state, q.city);
  else if (q.type === 'open') setService(r, Math.max(1, Math.round(E.maxFrequency(r) * .4)));
  else if (q.type === 'more') setService(r, q.target);
  else if (q.type === 'fare') setService(r, r.frequency, q.target);
  else if (q.type === 'ave') { const f = state.fleet.find(f => f.qty && MODEL[f.model].family === 'AVE' && E.canRun(state, r, MODEL[f.model]) && E.available(state, f, r.id) >= E.requiredUnits(state, r, MODEL[f.model], r.frequency));
    if (!f) throw Error(E.routeOptions(state, r).ave.ok ? 'No hay AVE libres para esa línea.' : 'La vía no deja pasar un AVE: ' + I.faultText(state, E.routeOptions(state, r).ave.faults[0]).toLowerCase() + '.');
    E.configureRoute(state, r.id, f.id, r.frequency, r.fare); }
}

// ------------------------------------------------------------ menú visual de la ciudad
function stationIcon(level, active) {
  const h = 10 + level * 5, w = 16 + level * 6;
  return `<svg viewBox="0 0 44 34" class="st-icon ${active ? 'on' : ''}"><path d="M${22 - w / 2} 30 V${30 - h} L22 ${24 - h} L${22 + w / 2} ${30 - h} V30 Z"/>${level >= 2 ? `<path d="M${22 + w / 2} 30 V${32 - h} Q${30 + w / 2} ${26 - h} ${40} ${32 - h} V30" fill="none"/>` : ''}<rect x="${22 - 3}" y="${24}" width="6" height="6"/></svg>`;
}
function cityInspector() {
  const id = inspect.id, c = CITY[id];
  if (!c) return null;
  map.selectedCity = id;
  const routes = E.cityRoutes(state, id).sort((a, b) => (b.active - a.active) || ((S.routeStats(b.id, 'L')?.trips || 0) - (S.routeStats(a.id, 'L')?.trips || 0)));
  const pop = E.cityPopulation(id), level = state.stations?.[id] || 0, m = currentMinute(), light = O.daylight(state, m, c.lon, c.lat).light;
  const reqs = (state.requests || []).filter(q => q.city === id), surges = liveSurges().filter(x => x.city === id);
  const incidents = state.ops.incidents.filter(x => routes.some(r => r.id === x.route) && m >= x.at && !state.ops.resolved.includes(x.trip));
  const active = routes.filter(r => r.active);
  const monthly = active.reduce((v, r) => v + E.metrics(state, r).net, 0), pax = active.reduce((v, r) => v + E.metrics(state, r).passengers, 0);
  const deps = plan().filter(t => t.dep >= m - 1 && routes.some(r => r.id === t.route) && (t.trip ? nearCity(S.STATIONS[t.trip.stations[0]], c) : t.ends?.[0] === id || (t.coords && Math.hypot(t.coords[0][0] - c.lon, t.coords[0][1] - c.lat) < .2))).slice(0, 6);
  const cards = routes.map(r => {
    const max = E.maxFrequency(r), unlocked = E.isUnlocked(state, r), mt = r.active ? E.metrics(state, r) : null, official = r.real ? S.routeStats(r.id, 'L')?.trips || 0 : 0;
    const pct = r.active ? r.frequency / max * 100 : 0;
    const surge = surges.find(x => x.route === r.id), req = reqs.find(q => q.route === r.id);
    return `<div class="conn ${r.active ? 'on' : unlocked ? 'off' : 'locked'} ${surge || req ? 'hot' : ''}">
      <div class="conn-top">${routeChip(r)}<strong>${esc(otherEnd(r, id))}</strong>${surge ? `<span class="flag">Necesita ${surge.need}</span>` : req ? `<span class="flag">Petición</span>${mt ? `<span>Ocupación ${n(mt.occupancy * 100)} %</span>` : ''}` : ''}</div>
      <div class="conn-bar"><span style="width:${pct}%;background:${routeColor(r)}"></span></div>
      <div class="conn-meta">${r.active ? `<b>${r.frequency}</b>/${max} salidas por sentido · <span class="${mt.net >= 0 ? 'pos' : 'neg'}">${signed(mt.net)}/mes</span>${mt.occupancy > .93 ? ' · <span class="neg">trenes llenos</span>' : ''}` : r.cut ? 'Cortada por obras de cambio de ancho' : unlocked ? (r.real ? `${n(official)} trenes en el horario real` : 'Sin horario: lo pones tú') : glyph('cone') + ' ' + esc(I.faultText(state, E.routeOptions(state, r).hybrid.faults[0] || {type: 'nopath'}))}</div>
      <div class="conn-actions">${r.active ? `<button class="round" data-action="freq-down" data-id="${r.id}" aria-label="Menos trenes" ${r.frequency <= 1 ? 'disabled' : ''}>−</button><button class="round plus" data-action="freq-up" data-id="${r.id}" aria-label="Más trenes" ${r.frequency >= max ? 'disabled' : ''}>+</button>` : unlocked && !r.cut ? `<button class="btn small primary" data-action="open-route" data-id="${r.id}" ${state.ended ? 'disabled' : ''}>Abrir · 4 M€</button>` : ''}<button class="btn small ghost" data-action="route" data-id="${r.id}">Detalles</button></div></div>`;
  }).join('');
  const body = `<div class="city-hero">${citySkyline(id, c.name, pop || 30, level, light, m)}<div class="city-title"><span>${pop ? (pop >= 1000 ? n(pop / 1000, 1) + ' millones de habitantes' : n(pop) + ' mil habitantes') : 'Localidad'}</span><h2>${esc(c.name)}</h2></div></div>
  <div class="city-stats"><div><b>${active.length}/${routes.length}</b><span>conexiones</span></div><div><b>${n(pax / 30)}</b><span>viajeros/día</span></div><div><b class="${monthly >= 0 ? 'pos' : 'neg'}">${signed(monthly)}</b><span>al mes</span></div></div>
  ${incidents.map(x => `<div class="req red"><b>${incidentGlyph(x)} ${esc(x.reason)}</b><span>${esc(routeName(state.routes.find(r => r.id === x.route)))} · demora ${x.delay} min</span><div class="actions">${Object.entries(O.RESPONSES).map(([k, v]) => `<button class="btn small ${k === 'team' ? 'primary' : ''}" data-action="respond" data-id="${x.trip}" data-option="${k}">${esc(v.label)}</button>`).join('')}</div></div>`).join('')}
  ${surges.map(x => `<div class="req gold"><b>${glyph('bolt')} ${esc(x.reason)}</b><span>Refuerza la conexión con ${esc(otherEnd(state.routes.find(r => r.id === x.route), id))} hasta ${x.need} salidas antes de las ${clock(x.until)}.</span><em>+${n(x.bonus * 1000)} mil €</em></div>`).join('')}
  ${reqs.map(q => `<div class="req"><b>${glyph('alert')} ${esc(reqText(q))}</b><span>${reqStatus(q)} · recompensa</span><em>+${q.reward} M€</em>${q.serving ? '' : `<div class="actions"><button class="btn small primary" data-action="request" data-id="${q.id}">${q.type === 'station' ? 'Mejorar estación' : q.type === 'open' ? 'Abrir conexión' : q.type === 'fare' ? 'Bajar tarifa' : q.type === 'ave' ? 'Poner un AVE' : 'Poner más trenes'}</button>${q.type === 'ave' ? `<button class="btn small ghost" data-action="route" data-id="${q.route}">Ver qué falta</button>` : ''}</div>`}</div>`).join('')}
  <h3 class="sub">Conexiones</h3><div class="conns">${cards || '<p class="muted">Sin conexiones ferroviarias en el juego.</p>'}</div>
  <h3 class="sub">Estación · ${E.STATION_LEVELS[level]}</h3>
  <div class="stations">${[0, 1, 2, 3].map(l => `<div class="${l <= level ? 'have' : ''}">${stationIcon(l, l === level)}<span>${E.STATION_LEVELS[l]}</span></div>`).join('')}</div>
  ${level < 3 ? `<button class="btn primary" data-action="station-up" data-id="${id}" ${state.ended ? 'disabled' : ''}>Mejorar a «${E.STATION_LEVELS[level + 1]}» · ${E.stationCost(state, id)} M€</button><p class="small muted">+6 % de demanda y más fiabilidad en todas sus conexiones.</p>` : '<p class="small">Estación al máximo nivel.</p>'}
  ${deps.length ? `<h3 class="sub">Próximas salidas</h3><div class="board">${boardRows(deps, m)}</div>` : ''}`;
  return {kicker: 'Ciudad', title: esc(c.name), body, cls: 'city'};
}

// ------------------------------------------------------------ tutorial guiado
const routeById = id => state.routes.find(r => r.id === id);
let tut = null, inductionModalKey = '', adviceLine = null, tutorialDraft = null;
function clearCoach() { $('coach')?.remove(); $('spot')?.remove(); }
function tutorialChrome() {
 document.body.classList.toggle('guided-turn',!!tut);
 if(tut){$('inspector').classList.add('hidden');$('inspector').innerHTML='';$('drawer').classList.add('hidden');$('drawer').innerHTML='';document.querySelector('.alert-pill')?.remove();}
}
function rememberTutorialDraft(){
 if(tut&&INDUCTION_STAGES[tut.step]?.id==='offer'&&$('routeForm'))tutorialDraft={fleet:$('routeFleet').value,frequency:$('frequency').value,fare:$('fare').value};
}
function restoreTutorialDraft(){
 if(!tutorialDraft||!$('routeForm'))return;
 $('routeFleet').value=tutorialDraft.fleet;$('frequency').value=tutorialDraft.frequency;$('fare').value=tutorialDraft.fare;updatePreview();
}

function startTutorial(resume = true) {
 if(resume&&state.tutorial?.version!==1&&(state.month>0||routeById('madrid-valencia')?.frequency>=E.maxFrequency(routeById('madrid-valencia')))){menuGuide();return;}
 menuOpen=false;pause(); closeModal(); clearCoach(); inductionModalKey='';
 const old=state.tutorial;
 tut=resume&&old?.version===1&&!old.done ? old : freshInduction(state);
 tut.suspended=false;state.tutorial=tut;restoreInductionHandoff(state,tut);adviceLine=null;tutorialDraft=null;tutorialChrome();focusTutorial();autosave();renderCoach();
}
function suspendTutorial() {
 if(!tut)return;
 voices.stop();adviceLine=null;tutorialDraft=null; tut.suspended=true; state.tutorial=tut; autosave();tut=null;clearCoach();inductionModalKey='';closeModal();
 tutorialChrome();inspect=null;screen=null;render();toast('Guía en pausa. Retómala desde Ayuda.');
}
function endTutorial() {
 voices.stop();adviceLine=null;tutorialDraft=null;const result=state.tutorial;result.done=true;result.suspended=false;tut=null;clearCoach();inductionModalKey='';tutorialChrome();autosave();render();
 showModal(`<div class="content induction-finish"><div class="kicker">Primer turno completado</div><h1>Ahora la red es responsabilidad tuya.</h1><p>Has cambiado un servicio, abierto Salamanca, comparado presupuesto y plantilla, atendido una avería y asumido un encargo. Las consecuencias se quedan en tu partida.</p><dl class="figures"><div><dt>Caja disponible</dt><dd>${money(state.cash)}</dd></div><div><dt>Servicios activos</dt><dd>${state.routes.filter(r=>r.active).length}</dd></div><div><dt>Viajeros del turno</dt><dd>${n(state.ops.last?.passengers)}</dd></div></dl><p class="callout">Tu siguiente reto: cumple el encargo del Despacho sin vaciar la caja. Revisa la demanda antes de abrir más servicios; trenes y maquinistas tardan en llegar.</p><button class="btn primary" data-action="tutorial-finish">Seguir dirigiendo</button></div>`,'single');
}
function tutorialNext() {
 if(!tut)return;
 const stage=INDUCTION_STAGES[tut.step];
 if(tut.feedback){
  restoreInductionHandoff(state,tut);
  const option=stage.choice?.options.find(x=>x.id===tut.pendingAnswer);
  if(option&&option.correct!==false)tut.answers[stage.id]=option.id;
  tut.feedback=null;delete tut.pendingAnswer;closeModal();autosave();inductionModalKey='';renderCoach();return;
 }
 if(tut.phase==='task') {
  if(!readyInduction(state,tut))return;
  pause();tut.phase='debrief';tut.line=0;clearCoach();
 }else{
  const lines=tut.phase==='briefing'?stage.briefing:stage.debrief;
  if(tut.phase==='debrief'&&tut.line+1<lines.length)tut.line++;
  else if(tut.phase==='briefing'){tut.phase='task';tut.line=0;closeModal();focusTutorial();}
  else {if(tut.step===INDUCTION_STAGES.length-1)return endTutorial();tut.step++;tut.phase='briefing';tut.line=0;tutorialDraft=null;closeModal();focusTutorial();}
 }
 voices.stop();inductionModalKey='';autosave();renderCoach();
}
function tutorialAnswer(id) {
 if(!tut||tut.phase!=='task')return;
 const stage=INDUCTION_STAGES[tut.step],option=stage.choice?.options.find(x=>x.id===id);
 if(!option||!canInductionAnswer(state,tut,id))return;
 tut.pendingAnswer=id;tut.feedback=option.feedback;pause();inductionModalKey='';autosave();renderCoach();
}
function tutorialMark(key){if(tut){const size=tut.marks.length;note(tut,key);if(tut.marks.length!==size)autosave();}}
function officeTutorial(tab){closeModal();inspect=null;screen='story';ui.officeTab='tycoon';ui.tycoonTab=tab;render();tutorialMark(tab);}
function focusTutorial() {
 if(!tut)return;
 const id=INDUCTION_STAGES[tut.step].id;screen=null;inspect=id==='offer'?{type:'route',id:'madrid-valencia'}:null;
 layer=id==='diagnosis'?'gauge':'network';
 map.focus(id==='offer'?'madrid-valencia':id==='diagnosis'||id==='infrastructure'?'madrid-salamanca':'madrid-valencia',true);
 tutorialChrome();map.dirty=true;if(id==='incident'&&tut.phase==='task')tutorialIncident();
}
function tutorialView(id){
 if(!tut)return;
 if(['gauge','power'].includes(id)){layer=id;tutorialMark(id);map.dirty=true;}
 else if(id==='research'){tutorialMark('people');tutorialMark('research');}
 else if(['people','market','salamanca','report'].includes(id))tutorialMark(id);
 renderCoach();
}
function tutorialAdvice(index){
 if(!tut||tut.phase!=='task')return;
 const stage=INDUCTION_STAGES[tut.step],line=inductionBriefing(state,stage)[+index];if(!line||+index===0)return;
 rememberTutorialDraft();adviceLine={...line,index:+index};inductionModalKey='';renderCoach();
}
function tutorialIncident() {
 if(!tut||INDUCTION_STAGES[tut.step].id!=='incident'||state.ops.phase!=='running'||tut.marks.includes('incident-resolved'))return;
 const op=state.ops;
 if(tut.answers.incident&&op.resolved.includes(tut.answers.incident)){tutorialMark('incident-resolved');return;}
 if(tut.answers.incident&&op.incidents.some(x=>x.trip===tut.answers.incident))return;
 delete tut.answers.incident;let x=op.incidents.find(x=>x.id==='inc-tut');
 if(!x){
  const p=plan().find(t=>!t.bus&&t.arrival>op.minute+40);if(p)op.minute=Math.max(op.minute,p.dep);
  x=O.injectIncident(state,op.minute);
 }
 if(x){tut.answers.incident=x.trip;op.minute=Math.max(op.minute,x.at);seenIncidents.add(x.trip);pause();render();autosave();}
}
function renderCoach() {
 if(!tut)return;
 tutorialChrome();
 const stage=INDUCTION_STAGES[tut.step];if(!stage)return suspendTutorial();
 if(tut.phase!=='task'||tut.feedback||adviceLine){
  rememberTutorialDraft();clearCoach();
  const lines=tut.phase==='debrief'?stage.debrief:inductionBriefing(state,stage);
  const line=adviceLine|| (tut.feedback?inductionFeedbackLine(state,tut):lines[Math.min(tut.line,lines.length-1)]);
  const kind=adviceLine?'advice':tut.feedback?'feedback':tut.phase;
  const key=[tut.step,kind,tut.line,tut.feedback,adviceLine?.index].join('|');
  if(inductionModalKey===key&&$('modal').open&&$('modal').querySelector('.induction-dialog'))return;
  inductionModalKey=key;const person=CHARACTERS[line.who];
  showModal(`<div class="art portrait" data-mood="${line.mood}" style="${faceStyle(line.who,line.mood)}" role="img" aria-label="${esc(person.name)}"><span class="plate"><b>${esc(person.name)}</b>${esc(person.role)}</span></div><div class="content induction-dialog" data-step-id="${stage.id}" data-kind="${kind}" data-character="${line.who}"><div class="kicker">Primer turno · ${tut.step+1} / ${INDUCTION_STAGES.length}${kind==='debrief'?' · Resultado':kind==='advice'?' · Consejo':''}</div><h1>${esc(stage.title)}</h1><p data-say="${esc(line.text)}">${sayHtml(line.text,line.who)}</p><div class="actions"><button class="btn primary" data-action="${adviceLine?'tutorial-advice-close':'tutorial-next'}">${adviceLine?'Volver a la tarea':tut.feedback?'Entendido':tut.phase==='debrief'?'Continuar':'Vamos a hacerlo'}</button>${sayButton(line.who,'modal')}<button class="btn ghost" data-action="tutorial-skip">Pausar guía</button></div></div>`,'induction-shell');
  $('modal').scrollTop=0;speakIn($('modal'),line.who,'modal');return;
 }
 // Un único espacio: la tarea incluye sus controles, y los consejos se abren a petición.
 if($('modal').open)return;
 const checks=stageChecks(state,tut),ready=readyInduction(state,tut),next=checks.find(x=>!x.done);
 const taskTitle={mandate:'Elige tu prioridad',diagnosis:'Comprueba la vía',offer:'Ajusta Madrid — València',people:'Planifica la plantilla',competition:'Decide tu inversión',infrastructure:'Abre una conexión',incident:'Atiende la avería',review:'Cierra la jornada',handoff:'Asume un encargo'}[stage.id];
 if(stage.id==='review'&&state.ops.phase==='review')tutorialMark('report');
 let coach=$('coach');if(!coach){coach=document.createElement('section');coach.id='coach';coach.className='coach induction-coach';coach.setAttribute('aria-label','Mesa de trabajo del primer turno');document.body.appendChild(coach);}
 const key=JSON.stringify([tut.step,tut.marks.filter(m=>stage.id!=='offer'||m!=='preview'),tut.answers,stage.id==='offer'?checks.slice(0,2):checks,state.cash,state.routes.map(r=>[r.id,r.active,r.frequency,r.fare]),state.tycoon.policies,state.tycoon.research,state.tycoon.training,state.tycoon.contracts,state.ops.phase,state.ops.day,state.ops.resolved]);
 if(coach.dataset.key===key)return;
 const focusId=document.activeElement?.id,scroll=coach.querySelector('.lesson-body')?.scrollTop||0;
 rememberTutorialDraft();coach.dataset.key=key;coach.dataset.step=String(tut.step);coach.dataset.stepId=stage.id;coach.dataset.kind='task';
 coach.innerHTML=`<header class="lesson-header"><span class="kicker">Primer turno · ${tut.step+1} / ${INDUCTION_STAGES.length}</span><span class="lesson-cash">${money(state.cash)}</span><button class="linkish" data-action="tutorial-skip">Pausar guía</button></header><div class="lesson-body"><h1>${esc(taskTitle)}</h1><p class="lesson-next">${ready?'Encargo resuelto. Revisa el resultado.':esc(next?.label||stage.objective)}</p><div class="lesson-controls">${focusedTaskHTML(state,tut)}</div></div><footer class="lesson-footer"><details class="lesson-advice"><summary>Consultar consejo</summary><div>${inductionBriefing(state,stage).slice(1).map((line,i)=>`<button class="btn small ghost" data-action="tutorial-advice" data-id="${i+1}"><img src="${faceURL(line.who,line.mood)}" alt="">${esc(CHARACTERS[line.who].name)}</button>`).join('')}<details class="induction-hint"><summary>Pista</summary><p>${esc(stage.hint)}</p></details></div></details>${ready?'<button class="btn primary" data-action="tutorial-next">Revisar resultado →</button>':'<span class="lesson-progress" aria-label="Progreso de la tarea">'+checks.filter(x=>x.done).length+' / '+checks.length+'</span>'}</footer>`;
 if(stage.id==='offer'){restoreTutorialDraft();updatePreview();}
 coach.querySelector('.lesson-body').scrollTop=scroll;if(focusId&&coach.querySelector('#'+focusId))$(focusId).focus({preventScroll:true});
}

// ------------------------------------------------------------ selección en el mapa
function pick(hit) {
  if(tut)return;
  if(linePicking&&hit?.type==='city'){
    if(!linePicking.length){linePicking.push(hit.id);toast('Origen elegido. Pulsa la ciudad de destino.');return;}
    if(linePicking[0]===hit.id){toast('Elige otra ciudad para el destino.');return;}
    const origin=linePicking[0];linePicking=null;newLineDialog();$('lineA').value=origin;$('lineB').value=hit.id;updateLineQuote();return;
  }
  sfx.play(!hit ? (inspect ? 'deselect' : 'tick') : {route: 'pickRoute', city: 'pickCity', train: 'pickTrain', station: 'pickStation', work: 'pickWork', tramo: 'pickRoute', node: 'pickStation'}[hit.type] || 'tap', {i: hashOf(hit?.id ?? '')});
  if (!hit) { if (inspect) { inspect = null; map.selected = null; map.selectedTrain = null; map.selectedCity = null; map.selectedTramo = null; map.follow = false; renderInspector(); } return; }
  if (hit.type === 'route') return selectRoute(hit.id, false);
  map.selectedCity = null; map.selectedTramo = null;
  if (hit.type === 'tramo') { inspect = {type: 'tramo', id: hit.id}; map.selectedTramo = hit.id; map.selected = null; map.selectedTrain = null; }
  if (hit.type === 'node') { inspect = {type: 'node', id: hit.id}; map.selected = null; map.selectedTrain = null; }
  if (hit.type === 'city') { inspect = {type: 'city', id: hit.id}; map.selected = null; map.selectedTrain = null; map.selectedCity = hit.id; }
  if (hit.type === 'train') { inspect = {type: 'train', id: hit.id}; map.selectedTrain = hit.id; map.selected = null; }
  if (hit.type === 'station') { inspect = {type: 'station', id: hit.id}; map.selectedTrain = null; }
  if (hit.type === 'work') { inspect = {type: 'work', id: hit.id}; }
  screen = null; renderNav(); $('drawer').classList.add('hidden');
  renderInspector();
}
function selectRoute(id, zoom = true) {
  if(id==='madrid-salamanca')tutorialMark('salamanca');
  inspect = {type: 'route', id}; map.selectedTrain = null; map.follow = false; screen = null;
  map.focus(id, zoom); renderNav(); $('drawer').classList.add('hidden'); renderInspector();
}

// ------------------------------------------------------------ reloj de la jornada
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(250, t - (lastTick || t)); lastTick = t;
  const op = state.ops;
  if (playing) {
    const rate = SPEEDS[speedIndex][0] * dt / 1000;
    if (layer === 'real') {
      observerMinute = Math.min(1560, observerMinute + rate);
      if (observerMinute >= 1560) pause();
    } else if (op.phase === 'running') {
      const before = op.minute, ended = O.moveClock(state, rate);
      spawnArrivals(before, op.minute);
      checkIncidents();
      checkSurgeEvents();
      if (ended) { pause(); finishDay(); }
    } else pause();
  }
  if (t - lastTimeline > 120) { lastTimeline = t; renderClock(); drawTimeline(); renderCoach(); checkMusicMood(); }
  if (t - lastPanel > 1000) {
    lastPanel = t;
    if (playing && screen === 'ops') renderDrawer();
    if (playing && inspect && ['train', 'station', 'city'].includes(inspect.type)) renderInspector();
    if (playing) { renderHud(); renderMission(); }
  }
}
function play() {
  if (layer === 'real') { playing = true; renderDaybar(); return; }
  if (!state.started) return intro();
  if (state.ended) return toast('Tu mandato ha terminado.');
  E.revalidateScene(state);
  if (E.pendingDecision(state)) return showDecision();
  if ($('modal').open) return;
  const op = state.ops;
  if (op.phase === 'review') return dayReport();
  if (op.phase === 'planning' && layer !== 'real') { try { O.startDay(state); seenIncidents = new Set(); resetToday(); netKey = networkKey(); } catch (e) { sfx.play('error'); return toast(e.message); } }
  playing = true; renderDaybar();
}
function pause() { playing = false; renderDaybar(); }
function checkIncidents() {
  const op = state.ops;
  for (const x of op.incidents) {
    if (op.minute >= x.at && !seenIncidents.has(x.trip)) {
      seenIncidents.add(x.trip);
      if (ui.autoPause) pause();
      showAlert(x);
      if (screen === 'ops') renderDrawer();
    }
  }
}
function showAlert(x, rr) {
  const r = rr || state.routes.find(r => r.id === x.route);
  if(screen){
    document.querySelector('.alert-pill')?.remove();renderNav();
    toast(x.type==='surge'?`${x.reason}: ${x.place}. Revisa la ciudad en el mapa.`:`Incidencia: ${x.reason}. Revisa Jornada para decidir.`);
    return;
  }
  if (x.type === 'surge') {
    document.querySelector('.alert-pill')?.remove();
    const el = document.createElement('div'); el.className = 'alert-pill gold';
    el.innerHTML = `<span>${glyph('bolt')}</span><span><b>${esc(x.reason)}</b> · ${esc(x.place)}</span><button class="btn small gold" data-action="city" data-id="${x.city}">Ver ciudad</button>`;
    $('game').appendChild(el); clearTimeout(alertTimer); alertTimer = setTimeout(() => el.remove(), 12000); return;
  }
  document.querySelector('.alert-pill')?.remove();
  const el = document.createElement('div');
  el.className = 'alert-pill';
  el.innerHTML = `<span>${incidentGlyph(x)}</span><span><b>${esc(x.reason)}</b> · ${esc(routeName(r))}${x.place ? ' · ' + esc(x.place) : ''}</span><button class="btn small gold" data-action="open-incidents">Decidir</button>`;
  $('game').appendChild(el);
  clearTimeout(alertTimer); alertTimer = setTimeout(() => el.remove(), 12000);
}
function finishDay() {
  try { O.endDay(state); } catch (e) { return toast(e.message); }
  autosave(); render(); dayReport();
}

// ------------------------------------------------------------ render general
function render() {
  O.ensureOps(state);
  netKey = networkKey();
  renderHud(); renderNav(); renderMission(); renderLegend(); renderDaybar();
  if (screen) renderDrawer(); else $('drawer').classList.add('hidden');
  renderInspector();renderCoach();
}
function renderHud(){
  const b=E.balance(state),kind=dayType();
  const long=O.dayDate(state).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  $('date').textContent=state.ended&&state.ending==='2050'?'31 dic 2050':long[0].toUpperCase()+long.slice(1);
  $('dateShort').textContent=O.dayLabel(state);
  $('dayKind').textContent=state.tenfe?`Elecciones: ${E.dateOf(U.electionMonth(state)-1)}`:`Jornada ${state.ops.completed+1} · ${S.DAY_TYPES[kind]}`;
  const free=state.fleet.reduce((sum,f)=>sum+E.available(state,f),0);
  $('resources').innerHTML=[
    ['Caja',money(state.cash)],['Resultado / mes',`<span class="${b.net>=0?'pos':'neg'}">${signed(b.net)}</span>`],
    ['Apoyo',state.tenfe?`${n(U.forecast(state),1)}<small>%</small>`:`${n(state.satisfaction)}<small>%</small>`],
    ['Puntualidad',`${n(b.punctuality,1)}<small>%</small>`],['Trenes libres',n(free)]
  ].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  renderClock();
}

function renderClock() {
  const m = currentMinute(), d = O.daylight(state, m);
  $('clock').textContent = clock(m);
  const night = d.night > .55;
  if ((document.body.dataset.sky === 'night') !== night) document.body.dataset.sky = night ? 'night' : 'day';
}
function renderNav() {
  const pending = state.ops.incidents.filter(x => state.ops.minute >= x.at && !state.ops.resolved.includes(x.trip)).length;
  const direction = state.started && !state.ended ? directionCount(state) : 0;
  $('navigation').innerHTML = Object.entries(PAGES).map(([k, name]) => `<button class="${screen === k ? 'active' : ''}" data-action="navigate" data-screen="${k}" aria-label="${name}" ${screen === k ? 'aria-current="page"' : ''}>${icon(k)}<span>${name}</span>${k === 'network' && pending ? `<span class="badge">${pending}</span>` : ''}</button>`).join('') +
    `<div class="spacer"></div><button id="musicBtn" class="music-btn" data-action="music" aria-label="Banda sonora"></button><button data-action="save-dialog" aria-label="Guardar partida">${icon('save')}<span>Guardar</span></button><button data-action="help" aria-label="Cómo jugar">${icon('help')}<span>Ayuda</span></button><button data-action="menu-home" aria-label="Menú principal">${icon('archive')}<span>Menú</span></button>`;
  renderMusicButton();
  if(direction){const office=$('navigation').querySelector('[data-screen="story"]');office.insertAdjacentHTML('beforeend',`<span class="badge" aria-label="${direction} asuntos pendientes">${direction}</span>`);}
}
function renderMission(){
  const el=$('mission');
  el.classList.toggle('hidden',!!screen||(!!inspect&&innerWidth<1200)||!state.started);
  const rescue=state.tenfe?TenfeUI.missionHTML(state):'';
  const c=CHAPTERS[state.chapter];
  const objectives=c?`<div class="kicker">Tu mandato · ${c.years}</div><h2>${esc(c.title)}</h2><ul>${c.objectives.slice(0,4).map(([k,target,title])=>{
    const v=E.objectiveValue(state,k);return `<li class="${v>=target?'done':''}"><i></i><span>${esc(title)}<div class="meter"><span style="width:${Math.min(100,v/target*100)}%"></span></div></span><span>${k==='solvent'?(v?'✓':'—'):n(Math.min(v,target))+'/'+n(target)}</span></li>`;
  }).join('')}</ul>`:'';
  const q=state.tycoon.contracts.find(q=>q.status==='active');
  const active=q?`<div class="tenfe-live-promise"><span class="kicker">En marcha</span><strong>${esc(q.project?q.project.title:T.ARCS[q.arc][0])}</strong><small>${n(T.missionValue(state,q))}/${q.target} · ${Math.max(0,q.until-state.month)} meses</small></div>`:'';
  const next=state.tenfe?TenfeUI.nextHTML(state):'<button class="btn small" data-action="tycoon-tab" data-id="agenda">Abrir agenda</button>';
  const upcoming=state.requests?.slice(0,2).map(q=>`<button class="tenfe-city-request" data-action="city" data-id="${q.city}"><span>${esc(CITY[q.city]?.name)}</span><small>${q.serving?`${q.kept||0}/3 cierres`:`+${q.reward} M€`}</small></button>`).join('')||'';
  el.innerHTML=(rescue||objectives)+active+next+upcoming;
}

function ongoingHTML() {
  const list = V.ongoing(state).slice(0, 5);
  if (!list.length) return '';
  return `<div class="requests"><div class="kicker">En curso</div>${list.map(x => {
    const target = x.route ? `data-action="route" data-id="${x.route}"` : x.city ? `data-action="city" data-id="${x.city}"` : 'data-action="navigate" data-screen="network"';
    return `<button ${target}><b>${esc(x.label)}</b><span>${x.promise ? 'Plazo' : 'Hasta'}: ${E.dateOf(Math.max(state.month, x.until - 1))}</span></button>`;
  }).join('')}</div>`;
}
function renderLegend() {
  const items = {
    works: [['#d18a2a', 'Obra en marcha'], ['#5a4630', 'Tramo terminado'], ['#a06a1c', 'Gran obra por financiar', true]],
    gauge: [[GAUGE_COLOR.std, 'Ancho estándar'], [GAUGE_COLOR.ib, 'Ancho ibérico'], [GAUGE_COLOR.mixto, 'Ancho mixto'], ['#8a7c69', 'Proyectada', true]],
    power: [[ELEC_COLOR['25kv'], '25 kV alterna'], [ELEC_COLOR['3kv'], '3 kV continua'], [ELEC_COLOR.no, 'Sin catenaria', true], ['#8a7c69', 'Proyectada', true]],
    speed: [...SPEED_BANDS.map(([, c, t]) => [c, t]), ['#8a7c69', 'Proyectada', true]],
  }[layer] || [[FAMILY_COLOR.AVE, 'AVE'], [FAMILY_COLOR.Alvia, 'Alvia'], ['#8a7c69', layer === 'real' ? 'Trazado aproximado' : 'Por abrir', true]];
  const extra = layer === 'gauge' ? '<span><i class="rombo"></i>Cambiador de ancho</span><span class="muted">Pulsa un tramo o un cambiador</span>' : layer === 'power' ? '<span class="muted">Pulsa un tramo para electrificarlo</span>' : layer === 'speed' ? '<span class="muted">Pulsa un tramo para renovarlo</span>' : layer === 'works' ? '' :
    '<span><i class="dot" style="border-color:#3f9d5a"></i>Ciudad conectada</span><span><i class="dot" style="border-color:#f0b544"></i>Parcial</span><span><i class="dot" style="border-color:#9c8b74"></i>Sin tren</span><span><i class="pin">!</i>Petición</span><span><i class="crowd">▮▮▮</i>Trenes llenos</span>' + `<span class="muted">${layer === 'real' ? 'AVE y Alvia publicados · ' + S.DAY_TYPES[dayType()] : 'Pulsa una ciudad'}</span>`;
  $('legend').innerHTML = items.map(([c, t, d]) => `<span><i class="${d ? 'dash' : ''}" style="background:${c};color:${c.startsWith('linear') ? GAUGE_COLOR.std : c}"></i>${t}</span>`).join('') + extra;
}
function renderDaybar() {
  const op = state.ops, trips = plan(), b = O.dayBounds(trips);
  const observer = layer === 'real';
  const delegationHint=state.ended?'El mandato ha terminado.':E.pendingDecision(state)?'Hay una decisión pendiente. Resuélvela antes de delegar el mes.':'Liquida el resto del mes y avanza obras, formación y encargos con cuentas reales.';
  const primary = op.phase === 'planning' ? ['day-start', 'Comienza la jornada'] : op.phase === 'running' ? ['day-end', 'Hasta el último tren'] : ['day-review', 'Ver parte del día'];
  $('daybar').innerHTML = `<div class="turn"><small>${observer ? 'Observación del horario real' : op.phase === 'planning' ? 'Preparación' : op.phase === 'running' ? 'Jornada en curso' : 'Jornada cerrada'}</small><strong>${observer ? S.DAY_TYPES[dayType()] : clock(b.first) + ' → ' + clock(b.last)}</strong><span>${observer ? n(realTrips(dayType()).length) + ' circulaciones publicadas' : n(trips.length) + ' circulaciones · ' + n(trips.filter(t => t.bus).length) + ' en autobús'}</span></div>
  <div class="timeline" id="timeline" title="${observer ? 'Pulsa para cambiar la hora de observación' : 'Ritmo del día: trenes en circulación'}"><canvas id="timelineCanvas"></canvas></div>
  <div class="controls"><div class="speed" role="group" aria-label="Velocidad">${SPEEDS.map(([, label], i) => `<button class="${i === speedIndex ? 'active' : ''}" data-action="speed" data-id="${i}">${label}</button>`).join('')}</div>
  <button class="play" data-action="play" aria-label="${playing ? 'Pausar' : 'Reproducir'}">${playing ? '❚❚' : '▶'}</button>
  ${observer ? '' : `<button class="btn primary" data-action="${primary[0]}">${primary[1]}</button>`}
  ${op.phase !== 'running' && !observer ? `<button class="btn" data-action="skip-month" title="${delegationHint}" ${state.ended?'disabled':''}>Cerrar el mes</button>` : ''}</div>`;
  drawTimeline();
}
function drawTimeline() {
  const cv = $('timelineCanvas');
  if (!cv) return;
  const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (!w) return;
  if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const observer = layer === 'real';
  const trips = observer ? realTrips(dayType()) : plan();
  const b = observer ? {first: 240, last: 1560} : O.dayBounds(trips), span = Math.max(60, b.last - b.first);
  const x = m => (m - b.first) / span * w, night = document.body.dataset.sky === 'night';
  // cielo: día y noche según la altura del sol en Madrid
  for (let px = 0; px < w; px += 3) {
    const m = b.first + px / w * span, l = O.daylight(state, m).light;
    c.fillStyle = `rgba(${Math.round(mix(28, 250, l))},${Math.round(mix(36, 214, l))},${Math.round(mix(70, 150, l))},${night ? .35 : .28})`;
    c.fillRect(px, 0, 3, h - 14);
  }
  // trenes en circulación cada 10 minutos
  const bins = Math.ceil(span / 10), counts = new Array(bins).fill(0);
  for (const t of trips) { const a = Math.max(0, Math.floor((t.dep - b.first) / 10)), z = Math.min(bins - 1, Math.floor((t.arrival - b.first) / 10)); for (let i = a; i <= z; i++) counts[i]++; }
  const max = Math.max(1, ...counts);
  c.beginPath(); c.moveTo(0, h - 14);
  counts.forEach((v, i) => c.lineTo(i / bins * w, h - 14 - v / max * (h - 22)));
  c.lineTo(w, h - 14); c.closePath();
  c.fillStyle = night ? 'rgba(255,210,130,.45)' : 'rgba(138,42,70,.32)'; c.fill();
  c.strokeStyle = night ? 'rgba(255,220,150,.9)' : 'rgba(138,42,70,.85)'; c.lineWidth = 1.2; c.stroke();
  // horas
  c.font = '500 10px "IBM Plex Mono", monospace'; c.fillStyle = night ? 'rgba(240,230,210,.75)' : 'rgba(60,45,30,.7)';
  for (let m = Math.ceil(b.first / 120) * 120; m <= b.last; m += 120) { c.fillRect(x(m), h - 14, 1, 4); c.fillText(clock(m).slice(0, 5), Math.min(w - 32, Math.max(0, x(m) - 14)), h - 2); }
  // incidencias
  for (const inc of observer ? [] : state.ops.incidents) { const px = x(inc.at); c.fillStyle = state.ops.resolved.includes(inc.trip) ? '#3f7d4e' : '#c23b2f'; c.beginPath(); c.moveTo(px, 2); c.lineTo(px + 5, 10); c.lineTo(px - 5, 10); c.closePath(); c.fill(); }
  // ahora
  const now = currentMinute(), px = x(now);
  c.fillStyle = night ? '#ffe2a0' : '#2a1f1c'; c.fillRect(px - 1, 0, 2, h - 14);
  c.beginPath(); c.arc(px, h - 14, 4, 0, Math.PI * 2); c.fill();
  cv.dataset.first = b.first; cv.dataset.span = span;
}
function mix(a, b, t) { return a + (b - a) * t; }

// ------------------------------------------------------------ cajón de páginas
function navigate(to) {
  if (ALIASES[to]) { const [page, key, value] = ALIASES[to]; ui[key] = value; to = page; if (screen === to) { renderDrawer(true); return; } }
  if (screen === to || !PAGES[to]) { screen = null; $('drawer').classList.add('hidden'); renderNav(); renderMission(); return; }
  screen = to; inspect = null; map.selected = null; map.selectedTrain = null;
  renderNav(); renderMission(); renderInspector(); renderDrawer(true);
}
function header(kicker, title, text = '') {
  return `<header><div><div class="kicker">${kicker}</div><h1>${title}</h1>${text ? `<p>${text}</p>` : ''}</div><button class="close" data-action="close-drawer" aria-label="Cerrar">×</button></header>`;
}
function renderDrawer(resetScroll = false) {
  const el = $('drawer');
  if(tut){el.classList.add('hidden');el.innerHTML='';return;}
  if (!screen) { el.classList.add('hidden'); return; }
  const pages = {network: redPage, fleet: trainsPage, finance: moneyPage, story: officePage, progress: progressPage, press: pressPage};
  const scroll = resetScroll ? 0 : el.querySelector('.body')?.scrollTop || 0, focusId = document.activeElement?.id, pos = document.activeElement?.selectionStart;
  const [head, body] = pages[screen]();
  el.classList.toggle('trenespop-drawer', screen === 'fleet' && ui.fleetTab === 'market');
  el.innerHTML = head + `<div class="body">${body}</div>`;
  el.querySelectorAll('table').forEach(table=>{
    if(table.querySelectorAll('thead th').length<4)return;
    const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Tabla desplazable; usa las flechas para ver todas las columnas');table.before(wrap);wrap.appendChild(table);
  });
  el.classList.remove('hidden');
  el.querySelector('.body').scrollTop = scroll;
  if (focusId && $(focusId)) { $(focusId).focus(); try { $(focusId).setSelectionRange(pos, pos); } catch {} }
  if (screen === 'finance') drawChart();
  syncSayButtons();
}

function boardRows(trips, minute, opts = {}) {
  return trips.map(t => {
    const r = state.routes.find(r => r.id === t.route);
    const color = t.line !== undefined && t.line !== null ? S.LINES[t.line]?.color : r ? routeColor(r) : '#8a2a46';
    const code = t.line !== undefined && t.line !== null ? S.lineCode(t.line) : r?.code || 'R';
    const dep = opts.at !== undefined ? opts.at(t) : t.dep;
    const status = minute < dep ? (t.delay > 5 ? `<span class="late">+${t.delay} min</span>` : '<span class="ok">En hora</span>') : minute < t.arrival ? `<span class="run">En marcha${t.delay > 5 ? ' · +' + t.delay : ''}</span>` : '<span>Llegado</span>';
    return `<div class="row"><span>${clock(dep)}</span><span>${chip(t.bus ? 'BUS' : code, t.bus ? '#c98a1c' : color)}</span><button class="dest" data-action="train" data-id="${esc(t.id)}">${esc(opts.dest ? opts.dest(t) : t.name)}${t.number ? ` <span class="muted">${esc(t.number)}</span>` : ''}</button><span>${status}</span></div>`;
  }).join('');
}

function opsPage() {
  const op = state.ops, trips = plan(), b = O.dayBounds(trips), m = currentMinute();
  const moving = trips.filter(t => m >= t.dep && m < t.arrival).length, done = trips.filter(t => t.arrival <= m), late = done.filter(t => t.delay > 5).length;
  const reached = op.incidents.filter(x => m >= x.at || op.phase === 'review');
  const next = trips.filter(t => t.dep >= m - 1).slice(0, 40);
  const kind = dayType();
  const head = header('Centro de control · ' + S.DAY_TYPES[kind], op.phase === 'planning' ? 'Prepara la jornada.' : op.phase === 'running' ? 'El día está en marcha.' : 'La jornada ha terminado.', esc(O.dayLabel(state)) + '.');
  const body = `${T.staffing(state)<1?'<div class="callout red"><p>Faltan maquinistas: se cancelan salidas. La formación tarda tres meses.</p><button class="btn small" data-action="tycoon-tab" data-id="people">Preparar plantilla</button></div>':''}<dl class="figures"><div><dt>Reloj</dt><dd class="mono">${clock(m)}</dd></div><div><dt>En circulación</dt><dd>${n(moving)}</dd></div><div><dt>Programadas</dt><dd>${n(trips.length)}</dd></div><div><dt>Puntualidad</dt><dd>${done.length ? n((1 - late / done.length) * 100) + ' %' : '—'}</dd></div><div><dt>Primera / última</dt><dd class="mono" style="font-size:19px">${clock(b.first)} · ${clock(b.last)}</dd></div></dl>
  ${op.phase==='planning'?'<p class="callout">Una jornada permite atender incidencias. Para avanzar obras y formación, <b>Delegar mes</b> liquida las cuentas y comprueba los compromisos sin jugar todos sus días.</p>':''}
  ${reached.length ? `<h2 class="section">Incidencias</h2>${reached.map(x => {
    const r = state.routes.find(r => r.id === x.route), choice = op.choices?.[x.trip], solved = op.resolved.includes(x.trip);
    return `<div class="incident"><div class="split"><strong>${incidentGlyph(x)} ${esc(x.reason)}</strong><span class="status ${solved ? 'on' : 'late'}">${solved ? esc(O.RESPONSES[choice || 'team'].label) : 'Pendiente'}</span></div>
    <p>${esc(routeName(r))} · ${esc(x.label || '')}${x.place ? ' · cerca de ' + esc(x.place) : ''} · ${clock(x.at)} · demora estimada ${x.delay} min${x.type === 'weather' ? ' durante ' + Math.round(x.span / 60) + ' h' : ''}</p>
    ${solved || op.phase !== 'running' ? '' : `<div class="actions">${Object.entries(O.RESPONSES).map(([k, v]) => `<button class="btn small ${k === 'team' ? 'primary' : ''}" data-action="respond" data-id="${x.trip}" data-option="${k}" title="${esc(v.note)}">${esc(v.label)}${v.cost ? ' · ' + n(v.cost * 1000) + ' mil €' : ''}</button>`).join('')}</div>`}</div>`;
  }).join('')}` : ''}
  <div class="toolbar"><label style="margin:0">Prioridad de explotación</label><select id="dayPriority" ${op.phase !== 'planning' ? 'disabled' : ''}><option value="balanced" ${op.priority === 'balanced' ? 'selected' : ''}>Equilibrio entre coste y puntualidad</option><option value="punctual" ${op.priority === 'punctual' ? 'selected' : ''}>Refuerzo de puntualidad · 9.000 €/día</option></select>
  <label style="margin:0 0 0 auto"><input type="checkbox" id="autoPause" ${ui.autoPause ? 'checked' : ''}> Pausar ante incidencias</label></div>
  <h2 class="section">Próximas salidas</h2>
  <div class="board"><div class="row head"><span>Hora</span><span>Línea</span><span>Recorrido</span><span>Estado</span></div>${boardRows(next, m) || '<div class="row"><span></span><span></span><span>No quedan salidas programadas.</span></div>'}</div>
  ${!trips.length ? '<div class="empty">No hay servicios abiertos.<p><button class="btn primary" data-action="navigate" data-screen="network">Elegir un servicio en Red</button></p></div>' : ''}
`;
  return [head, body];
}

function networkPage() {
  const q = ui.routeQuery.toLowerCase();
  const tabs = [['all', 'Todas'], ['AVE', 'AVE'], ['Alvia', 'Alvia'], ['new', 'Sin tren todavía']];
  const statuses = [['all', 'Cualquier estado'], ['active', 'En servicio'], ['closed', 'Por abrir'], ['blocked', 'Sin vía posible'], ['works', 'Con obras']];
  const list = state.routes.filter(r => {
    const fam = familyOf(r), [cls] = statusOf(r);
    if (ui.routeTab === 'AVE' && fam !== 'AVE') return false;
    if (ui.routeTab === 'Alvia' && fam !== 'Alvia') return false;
    if (ui.routeTab === 'new' && r.real) return false;
    if (ui.routeStatus === 'active' && !r.active) return false;
    if (ui.routeStatus === 'closed' && cls !== 'off') return false;
    if (ui.routeStatus === 'blocked' && cls !== 'blocked') return false;
    if (ui.routeStatus === 'works' && !workOn(r) && !r.cut) return false;
    return !q || (routeName(r) + ' ' + (fam || '')).toLowerCase().includes(q);
  }).sort((a, b) => b.active - a.active || b.real - a.real || (S.routeStats(b.id, 'L')?.trips || 0) - (S.routeStats(a.id, 'L')?.trips || 0));
  const row = r => {
    const [cls, label] = statusOf(r), m = r.active ? E.metrics(state, r) : null, trips = r.real ? (S.routeStats(r.id, 'L')?.trips || 0) : null, o = E.routeOptions(state, r);
    const can = [['ave', 'AVE'], ['alvia', 'Alvia'], ['hybrid', 'Híbrido']].map(([k, t]) => `<i class="can ${o[k].ok ? 'ok' : ''}">${t}</i>`).join('');
    return `<tr class="clickable" data-action="route" data-id="${r.id}"><td>${routeChip(r)}</td><td><button class="linkish route-link" data-action="route" data-id="${r.id}">${esc(routeName(r))}</button><small>${n(r.km)} km ${can}</small></td>
    <td class="num">${trips !== null ? n(trips) : '<span class="muted">—</span>'}</td><td><span class="status ${workOn(r) ? 'works' : cls}">${workOn(r) ? 'Con obras' : label}</span>${r.active ? `<small>${r.frequency}/${E.maxFrequency(r)} por sentido</small>` : ''}</td>
    <td class="num">${m ? n(m.passengers) : '—'}</td><td class="num ${m ? (m.net >= 0 ? 'pos' : 'neg') : ''}">${m ? signed(m.net) : '—'}</td></tr>`;
  };
  let body = `<div class="tabs">${tabs.map(([k, t]) => `<button class="${ui.routeTab === k ? 'active' : ''}" data-action="route-tab" data-id="${k}">${t}</button>`).join('')}</div>
  <div class="toolbar"><input type="search" id="routeSearch" placeholder="Busca una ciudad" value="${esc(ui.routeQuery)}" aria-label="Buscar relación"><select id="routeStatus" aria-label="Estado">${statuses.map(([k, t]) => `<option value="${k}" ${ui.routeStatus === k ? 'selected' : ''}>${t}</option>`).join('')}</select><button class="btn" data-action="new-service" ${state.ended ? 'disabled' : ''}>Relación nueva</button></div>`;
  body += `<p class="small muted">${list.length} relaciones · pulsa un nombre para comparar material, tarifas y frecuencias. Los resultados son previsiones mensuales.</p><table><thead><tr><th></th><th>Relación</th><th class="num">Trenes / día</th><th>Estado</th><th class="num">Viajeros / mes</th><th class="num">Resultado</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table><p class="small muted table-hint">Desplaza la tabla para consultar todas las columnas.</p>`;
  if (!list.length) body += '<div class="empty">No hay relaciones con estos filtros.<p><button class="btn small" data-action="route-tab" data-id="all" data-clear="true">Mostrar toda la red</button></p></div>';
  return [header('Red y servicios', 'AVE donde se pueda; Alvia donde no.', 'Lo que puede circular depende del ancho y la catenaria de cada tramo. Abrir un servicio cuesta 4 M€.'), body];
}

/** Red y horarios comparten página: un selector arriba cambia de vista. */
function withView([head, body]) {
  const views = [['routes', 'Relaciones'], ['timetables', 'Horarios']];
  return [head, `<div class="segmented">${views.map(([k, t]) => `<button class="${ui.netView === k ? 'active' : ''}" data-action="net-view" data-id="${k}">${t}</button>`).join('')}</div>` + body];
}
function trainsPage() {
  const tabs = [['fleet', 'Parque y taller'], ['market', 'Trenespop'], ['orders', 'Pedidos']];
  const [, body] = ['market', 'orders'].includes(ui.fleetTab) ? marketPage(ui.fleetTab === 'market' ? 'catalogue' : 'orders') : fleetPage();
  if (ui.fleetTab === 'market') return [`<header class="tp-game-strip"><button data-action="fleet-tab" data-id="fleet">‹ Mi parque</button><span>Compra material para tu red</span><button class="close" data-action="close-drawer" aria-label="Cerrar Trenespop">×</button></header>`, body];
  return [header('Trenes', 'Los que tienes y los que vienen.', 'Los AVE solo van por ancho estándar. Los Alvia, por donde les echen.'), `<div class="tabs">${tabs.map(([k, t]) => `<button class="${ui.fleetTab === k ? 'active' : ''}" data-action="fleet-tab" data-id="${k}">${t}</button>`).join('')}</div>` + body];
}
function officePage(){
  const tab=['agenda','apoyo','pactos','people','cloacas'].includes(ui.tycoonTab)?ui.tycoonTab:'agenda';
  const tabs=[['agenda','Agenda'],['apoyo','Apoyo'],['pactos','Pactos'],['people','Políticas'],['cloacas','Cloacas']];
  const existing=id=>tycoonPage(state,id).replace(/<nav class="tycoon-tabs"[\s\S]*?<\/nav>/,'');
  const body=tab==='apoyo'?TenfeUI.supportHTML(state):tab==='pactos'?TenfeUI.pactsHTML(state):tab==='cloacas'?TenfeUI.scandalHTML(state):existing(tab);
  return [header('Decisiones y compromisos','Despacho'),`<div class="tabs">${tabs.map(([id,label])=>`<button data-action="tycoon-tab" data-id="${id}" class="${id===tab?'active':''}">${label}</button>`).join('')}</div>`+body];
}

function timetablesPage() {
  const type = ui.ttType || dayType(), all = realTrips(type);
  const q = ui.ttStation.trim().toLowerCase();
  const fold = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), tokens = fold(q).split(/[^a-z0-9ñ]+/).filter(Boolean);
  const stations = q.length >= 2 ? S.STATIONS.filter(s => s.traffic && tokens.every(t => fold(s.name).includes(t))).sort((a, b) => b.traffic - a.traffic).slice(0, 12) : [];
  const station = stations.find(s => s.name.toLowerCase() === q) || (stations.length === 1 ? stations[0] : null) || (ui.ttStationId !== undefined ? S.STATIONS[ui.ttStationId] : null);
  let body = `<div class="tabs">${Object.entries(S.DAY_TYPES).map(([k, t]) => `<button class="${type === k ? 'active' : ''}" data-action="tt-type" data-id="${k}">${t} <span class="muted">${n(S.dayTrips(k).length)}</span></button>`).join('')}</div>
  <dl class="figures"><div><dt>Circulaciones</dt><dd>${n(all.length)}</dd></div><div><dt>AVE</dt><dd>${n(all.filter(t => S.lineCode(t.line) === 'AVE').length)}</dd></div><div><dt>Alvia</dt><dd>${n(all.filter(t => S.lineCode(t.line) === 'Alvia').length)}</dd></div><div><dt>Estaciones</dt><dd>${n(S.STATIONS.filter(s => s.traffic).length)}</dd></div></dl>
  <div class="toolbar"><input type="search" id="ttStation" placeholder="Busca una estación: Atocha, Sants, Zaragoza…" value="${esc(ui.ttStation)}" aria-label="Buscar estación"><label style="margin:0">Desde</label><select id="ttHour">${Array.from({length: 22}, (_, i) => i + 4).map(h => `<option value="${h}" ${ui.ttHour === h ? 'selected' : ''}>${String(h % 24).padStart(2, '0')}:00</option>`).join('')}</select></div>`;
  if (stations.length > 1 && !station) body += `<div class="rows">${stations.map(s => `<div><span class="chip" style="background:#2a1f1c">${n(s.traffic)}</span><div><h3>${esc(s.name)}</h3><p>${n(s.traffic)} circulaciones en laborable</p></div><button class="btn small" data-action="tt-station" data-id="${s.i}">Ver salidas</button></div>`).join('')}</div>`;
  if (station) {
    const from = ui.ttHour * 60;
    const deps = [];
    for (const t of all) { const j = t.trip.stations.indexOf(station.i); if (j < 0 || j === t.trip.stations.length - 1) continue; const dep = t.trip.times[j * 2 + 1]; if (dep >= from) deps.push({t, dep}); }
    deps.sort((a, b) => a.dep - b.dep);
    body += `<div class="group-title"><h2>${esc(station.name)}</h2><span>${n(deps.length)} salidas desde las ${String(ui.ttHour).padStart(2, '0')}:00</span><button class="btn small" data-action="station-map" data-id="${station.i}">Ver en el mapa</button></div>
    <div class="board"><div class="row head"><span>Salida</span><span>Tren</span><span>Destino</span><span>Número</span></div>${deps.slice(0, 80).map(({t, dep}) => `<div class="row"><span>${clock(dep)}</span><span>${chip(S.lineCode(t.line), S.LINES[t.line].color)}</span><button class="dest" data-action="real-trip" data-id="${t.id}">${esc(S.STATIONS[t.trip.stations.at(-1)].name)}</button><span>${esc(t.trip.number || '—')}</span></div>`).join('')}</div>${deps.length > 80 ? '<p class="note">Se muestran 80 salidas. Cambia la hora para ver más.</p>' : ''}`;
  }
  if (!station && stations.length === 0) {
    const busiest = S.STATIONS.filter(s => s.traffic).sort((a, b) => b.traffic - a.traffic).slice(0, 12);
    body += `<h2 class="section">Las estaciones con más trenes</h2><div class="rows">${busiest.map(s => `<div><span class="chip" style="background:#2a1f1c">${n(s.traffic)}</span><div><h3>${esc(s.name)}</h3><p>circulaciones en laborable</p></div><button class="btn small" data-action="tt-station" data-id="${s.i}">Ver salidas</button></div>`).join('')}</div>`;
  }
  return [header('Horarios', 'Todos los AVE y Alvia, a su hora.', 'Busca una estación para ver su panel de salidas o sigue cualquier tren en el mapa.'), body];
}

function fleetPage() {
  let body = '';
  if (ui.fleetTab === 'fleet') {
    const total = state.fleet.reduce((v, f) => v + f.qty, 0), free = state.fleet.reduce((v, f) => v + E.available(state, f), 0);
    const count = fam => state.fleet.filter(f => MODEL[f.model].family === fam).reduce((v, f) => v + f.qty, 0);
    body += `<dl class="figures"><div><dt>Unidades</dt><dd>${n(total)}</dd></div><div><dt>AVE</dt><dd>${n(count('AVE'))}</dd></div><div><dt>Alvia + regionales</dt><dd>${n(count('Alvia')+count('Regional'))}</dd></div><div><dt>Libres</dt><dd>${n(free)}</dd></div></dl>
    <table><thead><tr><th style="width:150px"></th><th>Material</th><th class="num">Parque</th><th class="num">Libres</th><th>Estado</th></tr></thead><tbody>${state.fleet.filter(f => f.qty > 0).map(f => {
      const m = MODEL[f.model];
      return `<tr class="clickable" data-action="fleet-detail" data-id="${f.id}"><td>${trainThumb(f.model)}</td><td><button class="linkish fleet-link" data-action="fleet-detail" data-id="${f.id}">${esc(m.name)}</button><small>${esc(f.origin)}${f.maker ? ' · ' + esc(f.maker) : ''} · desde ${f.born} · ${GAUGES[m.gauge]} · ${POWERS[m.power]}</small></td><td class="num">${f.qty}</td><td class="num">${E.available(state, f)}</td><td style="min-width:120px"><div class="bar ${f.condition < 50 ? '' : 'green'}"><span style="width:${f.condition}%"></span></div><small>${n(f.condition)} %</small></td></tr>`;
    }).join('')}</tbody></table><p class="note">Solo se venden o reforman trenes libres: quítalos antes de alguna línea.</p>`;
    body += `<h2 class="section">Taller</h2>` + (state.refits.length ? `<div class="rows">${state.refits.map(r => `<div><span class="status ${r.done ? 'on' : 'works'}"></span><div><h3>${esc(MODEL[r.model].name)} · ${r.qty} unidades</h3><p>${r.done ? 'Reforma terminada' : 'Salen del taller en ' + E.dateOf(r.due)}</p></div><span></span></div>`).join('')}</div>` : '<div class="empty">El taller está vacío. Los mecánicos, encantados.</div>');
    body += '<p class="note">Una reforma cuesta el 12 % del precio y dura cinco meses. El tren vuelve casi nuevo.</p>';
  }
  return [header('Flota y talleres', 'Los trenes que tienes, no los que te prometieron.'), body];
}

function marketPage(view) {
  let body = '';
  if (view === 'catalogue') {
    body = Marketplace.catalogueHTML(state, ui.market, (model, qty, listing) => E.purchaseQuote(state, model, qty, listing), trainThumb);
  } else {
    const orders = state.orders.filter(o => !o.historical);
    body += orders.length ? `<div class="rows">${orders.map(o => `<div><span class="status ${o.delivered === o.qty ? 'on' : 'works'}"></span><div><h3>${esc(MODEL[o.model].name)} · ${o.qty} unidades</h3><p>${o.marketplace ? esc(o.marketplace.maker) + ' · ' + (o.marketplace.state === 'used' ? 'ocasión, ' + o.marketplace.condition + ' %' : 'nuevo') + ' · ' : ''}${o.delivered === o.qty ? 'Pedido completo' : 'Próximo lote: ' + E.dateOf(o.next)}${o.delay ? ' · ' + o.delay + ' meses de retraso' : ''} · ${money(o.remaining)} pendiente</p><div class="bar gold"><span style="width:${o.delivered / o.qty * 100}%"></span></div></div><span class="num">${o.delivered}/${o.qty}</span></div>`).join('')}</div>` : '<div class="empty">No has encargado ni un tren. Así no se crece.</div>';
    body += `<h2 class="section">Contratos heredados</h2><table><thead><tr><th>Contrato</th><th class="num">Unidades</th><th>Estado</th></tr></thead><tbody>${HISTORICAL_ORDERS.map(h => {
      const o = state.orders.find(x => x.id === h.id);
      return `<tr><td><strong>${esc(h.name)}</strong></td><td class="num">${h.qty}</td><td>${h.signed > state.month ? 'Desde ' + (2022 + Math.floor(h.signed / 12)) : h.tender ? 'Licitación' : `${o?.delivered || 0}/${h.qty} recibidos`}</td></tr>`;
    }).join('')}</tbody></table><p class="note">Contratos firmados antes de tu llegada: no los pagas tú, pero sus trenes sí son tuyos.</p>`;
  }
  return [header('Compras de material', 'Un buen pedido se hace con tiempo.', 'Plazos de unos dos años, si el fabricante no se retrasa. Que se retrasará.'), body];
}

function worksPage() {
  const tabs = [['conv', 'Vías y catenaria'], ['changers', 'Cambiadores'], ['projects', 'Alta velocidad nueva'], ['running', 'En marcha']];
  const running = state.projects.filter(p => !p.done);
  let body = `<div class="toolbar"><button class="btn" data-action="layer" data-id="gauge">Mapa de anchos</button><button class="btn" data-action="layer" data-id="power">Mapa de electrificación</button><button class="btn" data-action="layer" data-id="works">Obras en el mapa</button></div>
  <div class="tabs">${tabs.map(([k, t]) => `<button class="${ui.worksTab === k ? 'active' : ''}" data-action="works-tab" data-id="${k}">${t}${k === 'running' && running.length ? ` <span class="muted">${running.length}</span>` : ''}</button>`).join('')}</div>`;
  if (ui.worksTab === 'running') {
    body += running.length ? `<div class="rows">${running.map(p => {
      const st = O.constructionStatus(state, p), name = p.type === 'upgrade' ? 'Mejora de servicio · ' + routeName(routeById(p.route)) : map.workName(p);
      return `<div><span class="status works"></span><div><h3>${esc(name)}</h3><p>${p.type === 'tramo' ? esc(I.WORKS[p.work].label) + ' · ' : ''}${st.stage} · fin previsto ${E.dateOf(p.due)}${p.delay ? ' · +' + p.delay + ' meses' : ''}</p><div class="bar gold" style="margin-top:8px"><span style="width:${st.progress * 100}%"></span></div></div><button class="btn small" data-action="visit-work" data-id="${p.id}">Ver</button></div>`;
    }).join('')}</div>` : '<div class="empty">No hay ni una máquina trabajando. Adif lo agradece.</div>';
  } else if (ui.worksTab === 'projects') {
    body += `<div class="rows">${PROJECTS.map(p => {
      const job = state.projects.find(j => j.id === p.id), st = job ? O.constructionStatus(state, job) : null, km = I.TRAMOS.filter(t => t.plan === p.id).reduce((v, t) => v + t.km, 0);
      return `<div><span class="status ${job ? (job.done ? 'on' : 'works') : 'off'}"></span><div><h3>${esc(p.name)}</h3><p>${esc(p.region)} · ${n(km)} km · ${esc(p.desc)}</p>${job ? `<div class="bar gold" style="margin-top:8px"><span style="width:${st.progress * 100}%"></span></div><p class="small">${job.done ? 'En servicio' : st.stage + ' · ' + n(st.progress * 100) + ' % · fin previsto ' + E.dateOf(job.due)}</p>` : `<p class="small muted">${p.duration} meses de obra, nunca antes de ${p.earliest}.</p>`}</div>
      <div style="text-align:right;white-space:nowrap">${job ? `<button class="btn small" data-action="visit-work" data-id="${p.id}">Ver</button>` : `<strong>${money(p.cost)}</strong><br><button class="btn small primary" data-action="project" data-id="${p.id}" ${state.ended ? 'disabled' : ''}>Financiar</button>`}</div></div>`;
    }).join('')}</div><div class="toolbar"><button class="btn primary" data-action="new-line" ${state.ended ? 'disabled' : ''}>Trazar una línea propia</button></div>`;
  } else if (ui.worksTab === 'changers') {
    const nodes = Object.values(I.NODES).filter(nd => state.infra.c.includes(nd.id) || I.changerPossible(state, nd.id) || state.projects.some(p => !p.done && p.type === 'changer' && p.target === nd.id));
    body += `<p class="small">Un Alvia solo cambia de ancho donde hay cambiador. Sin él, se queda mirando la vía de enfrente.</p><div class="rows">${nodes.sort((a, b) => a.name.localeCompare(b.name)).map(nd => {
      const has = state.infra.c.includes(nd.id), job = state.projects.find(p => !p.done && p.type === 'changer' && p.target === nd.id);
      return `<div><span class="status ${has ? 'on' : job ? 'works' : 'off'}"></span><div><h3>${esc(nd.name)}</h3><p>${has ? 'En servicio' + (nd.changer && nd.changer !== nd.name ? ' · ' + esc(nd.changer) : '') : job ? 'En obras · listo en ' + E.dateOf(job.due) : 'Se cruzan los dos anchos y no hay forma de pasar'}</p></div>
      <div style="text-align:right">${has ? `<button class="btn small" data-action="node" data-id="${nd.id}">Ver</button>` : job ? '' : `<strong>${money(I.CHANGER_WORK.cost)}</strong><br><button class="btn small primary" data-action="work" data-work="changer" data-id="${nd.id}" ${state.ended ? 'disabled' : ''}>Construir</button>`}</div></div>`;
    }).join('')}</div>`;
  } else {
    const list = I.allTramos(state).filter(d => state.infra.t[d.id]?.b && (I.tramoWorks(state, d.id).length || state.projects.some(p => !p.done && p.type === 'tramo' && p.target === d.id)));
    body += `<p class="small">Tramos que admiten obra: catenaria donde no hay, tercer carril para que pasen los dos anchos o ancho estándar para siempre (más barato, pero corta la línea mientras dura).</p>
    <table><thead><tr><th>Tramo</th><th>Ancho</th><th>Catenaria</th><th>Obras</th></tr></thead><tbody>${list.sort((a, b) => a.name.localeCompare(b.name)).map(d => {
      const st = state.infra.t[d.id], job = state.projects.find(p => !p.done && p.type === 'tramo' && p.target === d.id);
      return `<tr><td><button class="linkish" data-action="tramo" data-id="${d.id}"><strong>${esc(d.name)}</strong></button><small>${n(d.km)} km · ${st.v} km/h</small></td><td>${chip(I.GAUGE_LABEL[st.g], GAUGE_COLOR[st.g])}</td><td>${chip(I.ELEC_LABEL[st.e], ELEC_COLOR[st.e])}</td>
      <td>${job ? `<span class="status works">${esc(I.WORKS[job.work].label)} · ${E.dateOf(job.due)}</span>` : I.tramoWorks(state, d.id).map(w => `<button class="btn small" data-action="work" data-work="${w.work}" data-id="${d.id}" ${state.ended ? 'disabled' : ''}>${esc(w.verb)} · ${money(w.cost)}</button>`).join(' ')}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  return [header('Obras', 'Las vías del próximo capítulo.', 'Ancho, catenaria, cambiadores y líneas nuevas. Pulsa un tramo en los mapas de anchos o de electrificación para verlo de cerca.'), body];
}

function financePage() {
  const b = E.balance(state), commit = state.orders.filter(o => !o.historical).reduce((v, o) => v + o.remaining, 0), works = state.projects.filter(p => !p.done).length;
  const body = `<dl class="figures"><div><dt>Tesorería</dt><dd>${money(state.cash)}</dd></div><div><dt>Resultado mensual</dt><dd class="${b.net >= 0 ? 'pos' : 'neg'}">${signed(b.net)}</dd></div><div><dt>Deuda</dt><dd>${money(state.debt)}</dd></div><div><dt>Pedidos pendientes</dt><dd>${money(commit)}</dd></div></dl>
  <h2 class="section">Cuenta del mes</h2><table><tbody>${[['Billetes', b.revenue], ['Ayudas a los Alvia y apoyo público', b.subsidy], ['Operación, canon, mantenimiento y sede', -b.cost], ['Resultado', b.net]].map(([t, v], i) => `<tr><td>${i === 3 ? '<strong>' + t + '</strong>' : t}</td><td class="num ${v >= 0 ? 'pos' : 'neg'}">${i === 3 ? '<strong>' + signed(v) + '</strong>' : signed(v)}</td></tr>`).join('')}</tbody></table>
  <h2 class="section">Tesorería</h2>${state.history.length >= 2 ? '<canvas id="cashChart" class="chart" role="img" aria-label="Gráfico de tesorería mensual"></canvas>' : '<p class="small muted">La gráfica sale cuando cierres el primer mes. Hacienda tampoco tiene prisa.</p>'}
  <h2 class="section">Financiación y mantenimiento</h2><div class="toolbar"><button class="btn" data-action="borrow" ${state.debt >= 1500 || state.ended ? 'disabled' : ''}>Pedir 100 M€</button><button class="btn" data-action="repay" ${state.debt < 100 || state.cash < 100 || state.ended ? 'disabled' : ''}>Devolver 100 M€</button></div>
  <label for="maintenance">Esfuerzo de mantenimiento: <strong>${n(state.maintenance * 100)} %</strong></label><input id="maintenance" type="range" min="0.6" max="1.5" step="0.1" value="${state.maintenance}" ${state.ended ? 'disabled' : ''}>
  ${works ? `<p class="note">${works} obra${works === 1 ? '' : 's'} en marcha: ya están pagadas.</p>` : ''}`;
  return [header('Finanzas', 'Que las cuentas también lleguen.'), body];
}
function drawChart() {
  const el = $('cashChart'); if (!el) return;
  const w = el.clientWidth || 700, h = 190, dpr = 2; el.width = w * dpr; el.height = h * dpr;
  const c = el.getContext('2d'); c.scale(dpr, dpr);
  const data = state.history.map(x => x.cash);
  c.font = '11px Figtree'; c.fillStyle = '#8a7c69';
  if (data.length < 2) { c.fillText('La gráfica aparece al cerrar el primer mes.', 8, 30); return; }
  const min = Math.min(0, ...data), max = Math.max(100, ...data), y = v => h - 22 - (v - min) / (max - min || 1) * (h - 40);
  c.strokeStyle = 'rgba(74,56,36,.15)';
  for (let i = 0; i <= 3; i++) { const v = min + (max - min) / 3 * i; c.beginPath(); c.moveTo(48, y(v)); c.lineTo(w, y(v)); c.stroke(); c.fillText(n(v), 0, y(v) + 4); }
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(138,42,70,.3)'); g.addColorStop(1, 'rgba(138,42,70,0)');
  c.beginPath(); data.forEach((v, i) => { const x = 50 + i / (data.length - 1) * (w - 55); i ? c.lineTo(x, y(v)) : c.moveTo(x, y(v)); });
  c.strokeStyle = '#8a2a46'; c.lineWidth = 2; c.stroke(); c.lineTo(w - 5, h - 22); c.lineTo(50, h - 22); c.fillStyle = g; c.fill();
}

function storyPage() {
  if(state.tycoon.mode==='free')return ['', '<h2>Maqueta</h2><p>Sin capítulos obligatorios. Construye, compite y gestiona a tu ritmo.</p><button class="btn" data-action="new-game">Nueva partida</button>'];
  const c = CHAPTERS[state.chapter], person = CHARACTERS[c.speaker], score = E.finalScore(state);
  const body = `${state.ended ? `<div class="callout"><strong>${state.ending === '2050' ? '31 de diciembre de 2050' : 'Intervención de la compañía'}</strong><br>Tu legado: <b>${score}/100</b>. ${state.routes.filter(r => r.active).length} servicios, ${n(E.dailyTrains(state))} circulaciones diarias, ${E.aveCities(state).size} ciudades con AVE y ${n(state.stats.passengers / 1e6, 1)} millones de viajes.</div>` : ''}
  <div class="chapters">${CHAPTERS.map((ch, i) => `<div class="${state.claimed.includes(ch.id) ? 'done' : i === state.chapter ? 'now' : ''}"><strong>${esc(ch.title)}</strong>${ch.years}</div>`).join('')}</div>
  <div class="story"><div class="portrait" data-mood="${c.mood||'happy'}" style="${faceStyle(c.speaker, c.mood)}" role="img" aria-label="${esc(person.name)}"></div><div><div class="kicker" style="color:var(--wine);font-weight:700;font-size:11.5px;letter-spacing:1.4px;text-transform:uppercase">${esc(person.name)} · ${esc(person.role)}</div><h2 class="section" style="margin-top:4px">${esc(c.title)} ${sayButton(c.speaker, 'story')}</h2><p data-say="${esc(c.text)}">${sayHtml(c.text,c.speaker)}</p>
  <ul class="objectives">${c.objectives.map(([k, target, title]) => { const v = E.objectiveValue(state, k); return `<li class="${v >= target ? 'done' : ''}"><i></i><span>${esc(title)}</span><span class="num">${k === 'solvent' ? (v ? '✓' : '—') : n(Math.min(v, target)) + ' / ' + n(target)}</span></li>`; }).join('')}</ul>
  <div class="toolbar"><button class="btn primary" data-action="claim" ${!E.chapterReady(state) || state.ended ? 'disabled' : ''}>${state.claimed.includes(c.id) ? 'Capítulo completado' : 'Reclamar ' + c.reward + ' M€'}</button><button class="btn" data-action="navigate" data-screen="network">Gestionar la red</button></div>
  ${E.yearOf(state) < c.year ? `<p class="callout">Esta etapa empieza en ${c.year}. Ve adelantando trabajo.</p>` : ''}</div></div>
  <div class="toolbar" style="margin-top:30px"><button class="btn" data-action="save-dialog">Guardar o exportar</button><button class="btn danger" data-action="new-game">Nueva partida</button></div>`;
  return [header('Campaña 2022–2050', 'Tu mandato, tu historia.', 'Cada capítulo trae dinero para el siguiente.'), body];
}

function archivePage() {
  const body = state.log.length ? state.log.map(l => `<div class="news"><time>${E.dateOf(l.month)}</time><div><h3>${esc(l.title)}</h3><p>${esc(l.body)}</p></div></div>`).join('') : '<div class="empty">Todavía no ha pasado nada digno de mención.</div>';
  return [header('Diario', 'Lo que ha pasado en tu mandato.'), body];
}

// ------------------------------------------------------------ inspector
function renderInspector() {
  const el = $('inspector');
  if(tut){el.classList.add('hidden');el.innerHTML='';return;}
  renderMission();
  if (!inspect) { el.classList.add('hidden'); map.selected = null; map.selectedCity = null; return; }
  if (inspect.type !== 'city') map.selectedCity = null;
  if (inspect.type !== 'tramo') map.selectedTramo = null;
  const fn = {route: routeInspector, train: trainInspector, station: stationInspector, work: workInspector, city: cityInspector, tramo: tramoInspector, node: nodeInspector}[inspect.type];
  const out = fn?.();
  if (!out) { inspect = null; el.classList.add('hidden'); return; }
  const scroll = el.querySelector('.body')?.scrollTop || 0;
  el.classList.toggle('wide', out.cls === 'city');
  el.innerHTML = out.cls === 'city' ? `<button class="close floating" data-action="close-inspector" aria-label="Cerrar">×</button><div class="body city-body">${out.body}</div>` : `<header><div><div class="kicker">${out.kicker}</div><h2>${out.title}</h2></div><button class="close" data-action="close-inspector" aria-label="Cerrar">×</button></header><div class="body">${out.body}</div>`;
  el.classList.remove('hidden');
  el.querySelector('.body').scrollTop = scroll;
  if (inspect.type === 'route') updatePreview();
  if (inspect.type === 'train') mountViewers(el);
}
function hourHistogram(trips, minute) {
  const hours = new Array(24).fill(0);
  for (const t of trips) hours[Math.floor(t.dep / 60) % 24]++;
  const order = [...Array(24).keys()].map(i => (i + 4) % 24), max = Math.max(1, ...hours), now = Math.floor(minute / 60) % 24;
  return `<div class="hist">${order.map(h => `<i class="${h === now ? 'now' : ''}" style="height:${hours[h] / max * 100}%" title="${String(h).padStart(2, '0')}:00 · ${hours[h]}"></i>`).join('')}</div><div class="axis"><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>00</span><span>03</span></div>`;
}
function optionRow(label, p) {
  return `<div class="option ${p.ok ? 'ok' : 'no'}"><b>${label}</b>${p.ok ? `<span>${clock(p.minutes).replace(/^0/, '')} h · ${n(p.km)} km${p.changes.length ? ' · cambia de ancho en ' + esc(p.changes.map(x => I.NODES[x]?.name || x).join(', ')) : ''}</span>` : `<ul>${faultList(p.faults)}</ul>`}</div>`;
}
function routeInspector() {
  const r = state.routes.find(r => r.id === inspect.id);
  if (!r) return null;
  map.selected = r.id;
  const unlocked = E.isUnlocked(state, r), [cls, label] = statusOf(r), work = workOn(r), stats = r.real ? S.routeStats(r.id, dayType()) || S.routeStats(r.id, 'L') : null, o = E.routeOptions(state, r);
  const lots = state.fleet.filter(f => f.qty > 0), compatible = lots.filter(f => E.canRun(state, r, MODEL[f.model]));
  const maxF = E.maxFrequency(r), freq = r.active ? r.frequency : Math.max(1, Math.round(maxF * (r.real ? .5 : .25)));
  const todays = r.real ? S.thin(S.routeTrips(dayType(), r.id), r.active ? Math.min(1, r.frequency / r.baseFrequency) : 1) : [];
  const m = E.metrics(state, r), bitension = o.ave.ok && !I.plan(state, r.via, I.PROFILES.ave25).ok;
  let body = `<p><span class="status ${work ? 'works' : cls}">${work ? 'Con obras · ' + O.constructionStatus(state, work).stage : label}</span></p>
  <dl class="figures"><div><dt>Horario oficial</dt><dd>${r.real ? n(stats?.trips || 0) : '—'}</dd><em>${r.real ? 'circulaciones · ' + S.DAY_TYPES[dayType()].toLowerCase() : 'sin horario: lo pones tú'}</em></div><div><dt>Longitud</dt><dd>${n(r.km)} km</dd></div>${r.real ? `<div><dt>Trayecto</dt><dd>${clock(r.minutes).replace(/^0/, '')} h</dd></div><div><dt>Pico</dt><dd>${r.peak}</dd><em>trenes a la vez</em></div>` : ''}</dl>
  <h2 class="section">Qué puede circular</h2><div class="options">${optionRow(bitension ? 'AVE bitensión' : 'AVE', o.ave)}${optionRow('Alvia', o.alvia)}${optionRow('Alvia híbrido', o.hybrid)}</div>
  ${r.real ? `<h3>Salidas a lo largo del día ${r.active ? '(tu oferta)' : '(horario oficial)'}</h3>${hourHistogram(todays.map(t => ({dep: t.start})), currentMinute())}` : ''}`;
  if (r.cut) body += `<p class="callout red">Cortada mientras duren las obras de cambio de ancho.</p>`;
  if (!unlocked) body += `<p class="callout">Hoy no puede circular ningún tren por esta relación. Arregla lo que falta en <b>Obras</b>.</p><button class="btn" data-action="navigate" data-screen="works">Ir a Obras</button>`;
  else if (!r.cut) body += `<h2 class="section">Plan de servicio</h2><form id="routeForm">
    <label for="routeFleet">Material</label><select id="routeFleet" required style="width:100%">${lots.map(f => { const ok = E.canRun(state, r, MODEL[f.model]); return `<option value="${f.id}" ${r.fleet === f.id ? 'selected' : ''} ${ok ? '' : 'disabled'}>${esc(MODEL[f.model].name)} · ${ok ? E.available(state, f, r.id) + ' libres · ' + n(f.condition) + ' %' : esc(fitText(r, f.model))}</option>`; }).join('')}</select>
    <label for="frequency">Salidas por sentido: <strong id="freqOut">${freq}</strong> de ${maxF}${r.real ? ' del horario oficial' : ''}</label><input id="frequency" type="range" min="1" max="${maxF}" step="1" value="${freq}">
    <label for="fare">Tarifa media (€)</label><input id="fare" type="number" min="1.5" max="150" step="0.1" value="${r.fare}" style="width:120px">
    <p id="routePreview" class="callout"></p>
    <div class="toolbar"><button class="btn primary" type="submit" ${!compatible.length || state.ended ? 'disabled' : ''}>${r.active ? 'Aplicar plan' : 'Abrir servicio · 4 M€'}</button>${r.active ? `<button class="btn danger" type="button" data-action="close-service" data-id="${r.id}">Suspender</button>` : ''}</div></form>
    <div class="toolbar"><button class="btn small" data-action="upgrade" data-id="${r.id}" ${r.level >= 3 || state.ended ? 'disabled' : ''}>Mejorar servicio · ${12 + 12 * r.level} M€</button><span class="small muted">Nivel ${r.level}/3</span></div>`;
  if (r.active) body += `<h2 class="section">Frente a la carretera</h2><div class="shares"><span style="width:${m.share * 100}%;background:var(--wine)"></span><span style="width:${m.busShare * 100}%;background:var(--gold-2)"></span><span style="width:${m.otherShare * 100}%;background:var(--paper-3)"></span></div>
  <div class="shares-legend"><span><i style="background:var(--wine)"></i>Tren ${n(m.share * 100)} %</span><span><i style="background:var(--gold-2)"></i>Autobús ${n(m.busShare * 100)} %</span><span><i style="background:var(--paper-3)"></i>Coche y otros ${n(m.otherShare * 100)} %</span></div>
  <dl class="figures"><div><dt>Viajeros / mes</dt><dd>${n(m.passengers)}</dd></div><div><dt>Ocupación</dt><dd>${n(m.occupancy * 100)} %</dd></div><div><dt>Resultado</dt><dd class="${m.net >= 0 ? 'pos' : 'neg'}">${signed(m.net)}</dd></div></dl>`;
  const effects = V.routeEffects(state, r.id);
  if (effects.length) body += `<p class="callout">${effects.map(x => `${esc(x.label)} · hasta ${E.dateOf(Math.max(state.month, x.until - 1))}`).join('<br>')}</p>`;
  if (work && work.type !== 'upgrade') body += `<h2 class="section">Obra en la línea</h2><div class="bar gold"><span style="width:${O.constructionStatus(state, work).progress * 100}%"></span></div><p class="small">${esc(map.workName(work))} · fin previsto ${E.dateOf(work.due)}</p><button class="btn small" data-action="visit-work" data-id="${work.id}">Ver la obra</button>`;
  body += `<div class="toolbar">${r.real ? `<button class="btn small" data-action="route-trips" data-id="${r.id}">Ver sus trenes</button>` : ''}<button class="btn small" data-action="route-zoom" data-id="${r.id}">Encuadrar</button></div>`;
  return {kicker: r.active ? 'Relación en servicio' : r.cut ? 'Relación cortada por obras' : 'Relación por abrir', title: `${routeChip(r)} ${esc(routeName(r))}`, body};
}
/** Por qué un modelo no puede ir por una relación, en corto: la falta principal (tramo y lo que tiene). */
function fitText(r, model) { const p = E.routeCheck(state, r, MODEL[model]), f = p.ok ? null : I.keyFault(state, p.faults); return p.ok ? 'Circula' : f ? I.faultText(state, f, true) : 'no puede ir por esta vía'; }
function updatePreview() {
  const r = state.routes.find(r => r.id === inspect?.id), f = state.fleet.find(f => f.id === $('routeFleet')?.value), out = $('routePreview');
  if (!r || !out) return;
  const freq = +$('frequency').value, fare = +$('fare').value, submit=$('routeForm').querySelector('[type="submit"]');
  $('freqOut').textContent = freq;
  if (!f || !E.canRun(state, r, MODEL[f.model])) { out.innerHTML = `Ningún tren tuyo puede ir por esta vía. <button type="button" class="linkish" data-action="market-route" data-screen="fleet" data-id="${esc(r.id)}">Compra uno que sí</button>, o arregla la vía.`;submit.disabled=true;return; }
  if(!Number.isFinite(fare)||fare<1.5||fare>150){out.textContent='Introduce una tarifa entre 1,5 y 150 € para comparar el plan.';submit.disabled=true;return;}
  const m = MODEL[f.model], units = E.requiredUnits(state, r, m, freq), free = E.available(state, f, r.id), b = E.metrics(state, r, {active: true, fleet: f.id, frequency: freq, fare, units}), previous = E.metrics(state,r);
  const reason=state.ended?'El mandato ha terminado.':f.condition<30?'Este material necesita una reforma antes de salir.':units>free?`Faltan ${units-free} trenes libres de este lote. Baja la frecuencia o cambia de material.`:!r.active&&state.cash<4?'Necesitas 4 M€ de caja para abrir el servicio.':'';
  submit.disabled=!!reason;
  out.classList.toggle('red',!!reason);
  out.innerHTML = `<strong>Previsión del plan</strong><br>${m.family} · ${units} tren${units === 1 ? '' : 'es'} necesario${units === 1 ? '' : 's'} · ${free} disponibles<br>${n(freq * 2)} circulaciones al día · ${n(b.passengers)} viajeros/mes · ocupación ${n(b.occupancy*100)} %<br><strong class="${b.net >= 0 ? 'pos' : 'neg'}">${signed(b.net)}/mes</strong>${r.active?` · variación ${signed(b.net-previous.net)}`:' · apertura 4 M€'}${reason?`<p class="preview-warning">${esc(reason)}</p>`:''}`;
}
function findTrip(id) {
  return plan().find(t => t.id === id) || realTrips(dayType()).find(t => t.id === id) || (String(id).match(/^[LSD]\d+$/) ? realTrips(id[0]).find(t => t.id === id) : null);
}
function trainInspector() {
  const t = findTrip(inspect.id);
  if (!t) return null;
  const minute = currentMinute(), r = state.routes.find(r => r.id === t.route), line = t.line !== undefined && t.line !== null ? S.LINES[t.line] : null;
  const color = FAMILY_COLOR[t.family] || line?.color || (r ? routeColor(r) : '#8a2a46');
  let stops = '';
  if (t.trip) {
    const list = S.tripStops(t.trip, t.delay || 0);
    let here = -1;
    list.forEach((s, j) => { if (minute >= s.arr) here = j; });
    stops = `<ul class="stops" style="--line-color:${color}">${list.map((s, j) => `<li class="${j < here ? 'past' : j === here ? 'here' : ''}"><time>${clock(j ? s.arr : s.dep)}</time><button class="dest" style="all:unset;cursor:pointer" data-action="station" data-id="${s.station.i}">${esc(s.station.name)}</button></li>`).join('')}</ul>`;
  }
  const pos = t.trip ? S.position(t.trip, minute, t.delay || 0) : null;
  const where = !pos ? (minute < t.dep ? 'Sale a las ' + clock(t.dep + (t.delay || 0)) : 'Ha llegado a destino') : pos.stopped ? 'Detenido en ' + S.STATIONS[t.trip.stations[pos.at]].name : 'Hacia ' + S.STATIONS[t.trip.stations[pos.next]].name;
  const body = `<div class="train3d" data-train3d="${tripArtKey(t, r)}"></div>
  <dl class="figures"><div><dt>Estado</dt><dd style="font-size:17px">${esc(where)}</dd></div><div><dt>Retraso</dt><dd class="${t.delay > 5 ? 'neg' : 'pos'}">${t.delay ? '+' + t.delay + ' min' : 'En hora'}</dd></div></dl>
  <p class="small">${esc(t.model || (S.lineCode(t.line) === 'Alvia' ? 'Alvia' : 'AVE'))}${r ? ' · ' + esc(routeName(r)) : ''}${t.changes?.length ? ' · cambia de ancho en ' + esc(t.changes.map(x => I.NODES[x]?.name || x).join(', ')) : ''}</p>
  <div class="toolbar"><button class="btn small ${map.follow ? 'primary' : ''}" data-action="follow">${map.follow ? 'Siguiendo al tren' : 'Seguir en el mapa'}</button>${r ? `<button class="btn small" data-action="route" data-id="${r.id}">Gestionar la línea</button>` : ''}</div>
  ${stops}`;
  const code = t.family || (t.line !== undefined && t.line !== null ? S.lineCode(t.line) : 'AVE');
  return {kicker: 'Tren ' + esc(t.number || t.label?.split(' ').at(-1) || ''), title: `${chip(code, FAMILY_COLOR[code] || color)} ${esc(t.name)}`, body};
}
function stationInspector() {
  const st = S.STATIONS[inspect.id];
  if (!st) return null;
  const minute = currentMinute(), trips = layer === 'real' || state.ops.phase !== 'running' ? realTrips(dayType()) : plan();
  const deps = [];
  for (const t of trips) {
    if (!t.trip) continue;
    const j = t.trip.stations.indexOf(st.i);
    if (j < 0 || j === t.trip.stations.length - 1) continue;
    const dep = t.trip.times[j * 2 + 1] + (t.delay || 0);
    if (dep >= minute - 1) deps.push({t, dep});
  }
  deps.sort((a, b) => a.dep - b.dep);
  const lines = new Map();
  for (const t of realTrips(dayType())) if (t.trip.stations.includes(st.i)) lines.set(t.line, (lines.get(t.line) || 0) + 1);
  const body = `<dl class="figures"><div><dt>Circulaciones</dt><dd>${n(st.traffic)}</dd><em>en laborable</em></div><div><dt>Código</dt><dd class="mono" style="font-size:18px">${esc(st.id)}</dd></div></dl>
  <p>${[...lines.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => chip(S.lineCode(l), S.LINES[l].color)).join(' ')}</p>
  <h3>Próximas salidas ${layer === 'real' || state.ops.phase !== 'running' ? '(horario oficial)' : '(tu jornada)'}</h3>
  <div class="board">${deps.slice(0, 14).map(({t, dep}) => `<div class="row" style="grid-template-columns:50px 64px 1fr"><span>${clock(dep)}</span><span>${chip(t.bus ? 'BUS' : S.lineCode(t.line), t.bus ? '#c98a1c' : S.LINES[t.line].color)}</span><button class="dest" data-action="train" data-id="${esc(t.id)}">${esc(S.STATIONS[t.trip.stations.at(-1)].name)}${t.delay > 5 ? ` <span class="late">+${t.delay}</span>` : ''}</button></div>`).join('') || '<div class="row"><span></span><span></span><span>Sin más salidas hoy</span></div>'}</div>
  <div class="toolbar"><button class="btn small" data-action="station-map" data-id="${st.i}">Acercar</button><button class="btn small" data-action="station-timetable" data-id="${st.i}">Panel completo</button></div>`;
  return {kicker: 'Estación', title: esc(st.name), body};
}
function workInspector() {
  const def = PROJECTS.find(p => p.id === inspect.id), job = state.projects.find(p => p.id === inspect.id);
  if (!def && !job) return null;
  const st = job ? O.constructionStatus(state, job) : null, name = def?.name || map.workName(job);
  const km = def ? I.TRAMOS.filter(t => t.plan === def.id).reduce((v, t) => v + t.km, 0) : job.type === 'tramo' || job.type === 'custom' ? I.tramoDef(state, job.target)?.km || 0 : 0;
  const body = `<p>${esc(def?.desc || (job.type === 'tramo' ? I.WORKS[job.work].label : job.type === 'changer' ? 'Cambiador de ancho para los Alvia.' : job.type === 'custom' ? 'Línea nueva de alta velocidad: ancho estándar y 25 kV.' : ''))}</p>
  ${job ? `<dl class="figures"><div><dt>Avance</dt><dd>${n(st.progress * 100)} %</dd></div><div><dt>Fin previsto</dt><dd style="font-size:17px">${E.dateOf(job.due)}</dd></div>${km ? `<div><dt>Longitud</dt><dd>${n(km)} km</dd></div>` : ''}</dl><div class="bar gold"><span style="width:${st.progress * 100}%"></span></div>
  <ul class="objectives">${O.STAGES.map((nm, i) => `<li class="${i < st.stageIndex ? 'done' : ''}"><i style="${i === st.stageIndex ? 'box-shadow:inset 0 0 0 2px var(--gold);background:rgba(240,181,68,.35)' : ''}"></i><span>${nm}</span><span class="small muted">${i < st.stageIndex ? 'Hecho' : i === st.stageIndex ? 'Ahora' : ''}</span></li>`).join('')}</ul>${job.delay ? `<p class="callout red">Va ${job.delay} meses tarde. Lo normal.</p>` : ''}`
    : `<dl class="figures"><div><dt>Coste</dt><dd>${money(def.cost)}</dd></div><div><dt>Obra</dt><dd>${def.duration} meses</dd></div><div><dt>Longitud</dt><dd>${n(km)} km</dd></div></dl><button class="btn primary" data-action="project" data-id="${def.id}" ${state.ended ? 'disabled' : ''}>Financiar</button>`}
  <div class="toolbar"><button class="btn small" data-action="visit-work" data-id="${inspect.id}">Acercar</button></div>`;
  return {kicker: 'Obra' + (def ? ' · ' + esc(def.region) : ''), title: esc(name), body};
}
/** Relaciones que dependen de un tramo: las que lo usan y las que esperan su arreglo. */
function routesOnTramo(id) {
  const using = [], waiting = [];
  for (const r of state.routes) {
    if (r.active && E.routeUses(state, r, id)) { using.push(r); continue; }
    const o = E.routeOptions(state, r);
    if (!o.ave.ok && o.ave.faults.some(f => f.tramo === id) || (!o.alvia.ok && !o.hybrid.ok && o.hybrid.faults.some(f => f.tramo === id))) waiting.push(r);
  }
  return {using, waiting};
}
function tramoInspector() {
  const d = I.tramoDef(state, inspect.id), st = state.infra.t[inspect.id];
  if (!d || !st) return null;
  map.selectedTramo = d.id;
  const job = state.projects.find(p => !p.done && (p.target === d.id || (p.type === 'infrastructure' && d.plan === p.id)));
  const plan = d.plan && PROJECTS.find(p => p.id === d.plan), {using, waiting} = routesOnTramo(d.id), works = I.tramoWorks(state, d.id);
  let body = `<dl class="figures"><div><dt>Longitud</dt><dd>${n(d.km)} km</dd></div><div><dt>Velocidad</dt><dd>${st.v}</dd><em>km/h</em></div></dl>
  <div class="infra-tags">${st.b ? `${chip(I.GAUGE_LONG[st.g], GAUGE_COLOR[st.g])} ${chip(I.ELEC_LONG[st.e], ELEC_COLOR[st.e])}` : chip('Proyectada', '#8a7c69')} ${chip(d.kind === 'lav' ? 'Alta velocidad' : 'Convencional', '#4a3e30')}</div>
  <p class="small">${!st.b ? (I.opensOn(d) ? 'Abre el ' + I.opensOn(d) + '.' : 'Todavía no existe.') : st.g === 'std' ? 'Ancho estándar: AVE sí; los Alvia, también.' : st.g === 'mixto' ? 'Tercer carril: pasan los dos anchos sin cambiar.' : 'Ancho ibérico: solo Alvia. Los AVE, que den la vuelta.'} ${st.b && st.e === 'no' ? 'Sin catenaria: solo el Alvia híbrido.' : ''}${st.b && st.e === '3kv' && st.g !== 'ib' ? '3 kV: solo los AVE bitensión.' : ''}</p>`;
  if (job) { const s2 = O.constructionStatus(state, job); body += `<h2 class="section">Obra en marcha</h2><p>${esc(map.workName(job))}${job.type === 'tramo' ? ' · ' + esc(I.WORKS[job.work].label) : ''}</p><div class="bar gold"><span style="width:${s2.progress * 100}%"></span></div><p class="small">${s2.stage} · fin previsto ${E.dateOf(job.due)}</p>`; }
  else if (plan) body += `<h2 class="section">Se construye con</h2><p>${esc(plan.name)} · ${money(plan.cost)}</p><button class="btn primary" data-action="project" data-id="${plan.id}" ${state.ended ? 'disabled' : ''}>Ver el proyecto</button>`;
  else if (works.length) body += `<h2 class="section">Obras posibles</h2><div class="works-list">${works.map(w => `<button class="choice" data-action="work" data-work="${w.work}" data-id="${d.id}" ${state.ended || w.busy ? 'disabled' : ''}><strong>${esc(w.label)} · ${money(w.cost)}</strong><span>${w.duration} meses${w.closes ? ' · corta la línea mientras dura' : ''}${w.work === 'mixed' ? ' · pasan AVE y Alvia sin cambiar' : w.work === 'standard' ? ' · solo ancho estándar para siempre' : w.work === 'renew' ? '' : ' · ya pueden pasar los Alvia eléctricos'}</span></button>`).join('')}</div>`;
  else if (st.b) body += '<p class="small muted">Este tramo ya está como debe. Que no es poco.</p>';
  if (using.length) body += `<h2 class="section">La usan</h2><p>${using.map(r => `<button class="linkish" data-action="route" data-id="${r.id}">${esc(routeName(r))}</button>`).join(' · ')}</p>`;
  if (waiting.length) body += `<h2 class="section">La están esperando</h2><p>${waiting.slice(0, 12).map(r => `<button class="linkish" data-action="route" data-id="${r.id}">${esc(routeName(r))}</button>`).join(' · ')}</p>`;
  body += `<div class="toolbar"><button class="btn small" data-action="tramo-zoom" data-id="${d.id}">Acercar</button>${d.a && I.NODES[d.a] ? `<button class="btn small" data-action="node" data-id="${d.a}">${esc(I.NODES[d.a].name)}</button>` : ''}${d.b && I.NODES[d.b] ? `<button class="btn small" data-action="node" data-id="${d.b}">${esc(I.NODES[d.b].name)}</button>` : ''}</div>`;
  return {kicker: d.kind === 'lav' ? 'Línea de alta velocidad' : 'Línea convencional', title: esc(d.name), body};
}
function nodeInspector() {
  const nd = I.NODES[inspect.id];
  if (!nd) return null;
  const has = state.infra.c.includes(nd.id), job = state.projects.find(p => !p.done && p.type === 'changer' && p.target === nd.id), possible = I.changerPossible(state, nd.id);
  const lines = I.allTramos(state).filter(d => d.a === nd.id || d.b === nd.id);
  let body = `<p>${has ? `Tiene cambiador de ancho${nd.changer && nd.changer !== nd.name ? ' en ' + esc(nd.changer) : ''}: los Alvia cambian de ancho aquí en un par de minutos, sin que nadie se baje.` : job ? 'Cambiador en obras. Las máquinas, a su ritmo; los Alvia, esperando.' : possible ? 'Aquí se juntan los dos anchos y no se dirigen la palabra. Sin cambiador, el Alvia llega, mira y se vuelve.' : 'Sin cambiador ni falta que hace: aquí todo es del mismo ancho.'}</p>`;
  if (job) { const s2 = O.constructionStatus(state, job); body += `<div class="bar gold"><span style="width:${s2.progress * 100}%"></span></div><p class="small">${s2.stage} · fin previsto ${E.dateOf(job.due)}</p>`; }
  else if (!has && possible) body += `<button class="choice" data-action="work" data-work="changer" data-id="${nd.id}" ${state.ended ? 'disabled' : ''}><strong>Construir un cambiador · ${money(I.CHANGER_WORK.cost)}</strong><span>${I.CHANGER_WORK.months} meses</span></button>`;
  body += `<h2 class="section">Líneas</h2><div class="rows">${lines.map(d => { const st = state.infra.t[d.id]; return `<div><span class="status ${st.b ? 'on' : 'off'}"></span><div><h3><button class="linkish" data-action="tramo" data-id="${d.id}">${esc(d.name)}</button></h3><p>${st.b ? I.GAUGE_LABEL[st.g] + ' · ' + I.ELEC_LABEL[st.e] : 'Proyectada'}</p></div><span></span></div>`; }).join('')}</div>`;
  return {kicker: has ? 'Cambiador de ancho' : nd.kind === 'junction' ? 'Bifurcación' : 'Estación', title: esc(nd.name), body};
}

// ------------------------------------------------------------ ventanas modales
function showModal(html, cls = '') { pause(); const was = $('modal').open; $('modal').innerHTML = `<div class="modal ${cls}">${html}</div>`; if (!was) $('modal').showModal(); mountViewers($('modal')); syncSayButtons(); sfx.play(was ? 'page' : 'open'); }
function closeModal() { if ($('modal').open) $('modal').close(); }
/** Rescate de Tenfe: modo propio con su mapa, su interfaz y su guardado; al salir vuelve a esta portada. */

$('modal').addEventListener('cancel',event=>{if($('modal').querySelector('.np-screen')){event.preventDefault();sfx.play('drawerClose');npBack();}else if($('modal').querySelector('.main-menu-shell'))event.preventDefault();else if($('modal').querySelector('.induction-dialog')){event.preventDefault();suspendTutorial();}});
$('modal').addEventListener('keydown',event=>{
  if(!np)return;
  if(event.key==='Enter'&&event.target.id==='npSeed'){event.preventDefault();sfx.expect('begin');npBegin(false);return;} // Intro en la semilla = «Empezar»
  const step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key]; // flechas entre los tres arranques, como un grupo de radio
  if(!step||!event.target.classList?.contains('np-start'))return;
  event.preventDefault();const ids=STARTS.map(start=>start.id),id=ids[(ids.indexOf(np.pick)+step+ids.length)%ids.length];
  sfx.play('tab');np.pick=id;np.confirm=null;drawNewGame(`[data-action="np-pick"][data-id="${id}"]`);
});
$('modal').addEventListener('close', () => { if (!$('modal').open && voices.speaking?.where === 'modal') voices.stop(); sfx.play('close'); });
// Chromium cierra el diálogo con un segundo Esc seguido aunque el primero se haya cancelado: la portada no desaparece.
$('modal').addEventListener('close', () => { if ($('modal').open) return; if (menuOpen) intro(); else if (np) { np = null; render(); } });
function menuChrome() { if(tut){tut.suspended=true;state.tutorial=tut;autosave();tut=null;} tutorialChrome();adviceLine=null;tutorialDraft=null;menuOpen=true;pause();voices.stop();clearCoach();inductionModalKey=''; }
function redPage(){
  const tabs=[['routes','Servicios'],['ops','Jornada'],['works','Obras'],['timetables','Horarios'],['rivals','Competencia']];
  const page=ui.netView==='ops'?opsPage():ui.netView==='works'?worksPage():ui.netView==='timetables'?timetablesPage():ui.netView==='rivals'?['',tycoonPage(state,'market').replace(/<nav class="tycoon-tabs"[\s\S]*?<\/nav>/,'')]:networkPage();
  return [header('Servicios, vías y horarios','Red'),`<div class="tabs">${tabs.map(([id,label])=>`<button data-action="net-view" data-id="${id}" class="${ui.netView===id?'active':''}">${label}</button>`).join('')}</div>`+page[1]];
}
function moneyPage(){
  const [,body]=financePage();
  return [header('Caja, compromisos y previsión','Dinero'),body+TenfeUI.forecastHTML(state)];
}
function progressPage(){
  const tabs=[['campaign','Mandato'],['hitos','Hitos'],['research','Investigación'],['proyectos','Megaproyectos']];
  let body=ui.progressTab==='hitos'?TenfeUI.milestonesHTML(state):ui.progressTab==='research'?tycoonPage(state,'research').replace(/<nav class="tycoon-tabs"[\s\S]*?<\/nav>/,''):ui.progressTab==='proyectos'?TenfeUI.megaHTML(state):storyPage()[1];
  if(ui.progressTab==='campaign'&&state.tenfe?.rescueStarted)body=`<div class="tenfe-rescue-summary">${state.tenfe.rescueWon?'<h2>Tenfe sale del rescate</h2><p>Tu compañía conserva su red y sigue construyendo su legado.</p>':TenfeUI.missionHTML(state)||'<h2>Tu legado sigue en marcha</h2>'}</div>`+body;
  if(state.ending==='election')body=`<p class="callout"><strong>Fin del mandato.</strong> Las urnas han elegido otra dirección. Puedes revisar tu red o comenzar una nueva partida.</p>`+body;
  return [header('De la herencia al legado','Progreso'),`<div class="tabs">${tabs.map(([id,label])=>`<button data-action="progress-tab" data-id="${id}" class="${ui.progressTab===id?'active':''}">${label}</button>`).join('')}</div>`+body];
}
function pressPage(){
  const tabs=[['paper','Gaceta'],['journal','Diario'],['reports','Informes']];
  const body=ui.pressTab==='journal'?archivePage()[1]:ui.pressTab==='reports'?(state.tenfe.reports.map(r=>`<section class="tenfe-report">${TenfeUI.reportHTML(state,r)}</section>`).join('')||TenfeUI.reportHTML(state)):tycoonPage(state,'paper').replace(/<nav class="tycoon-tabs"[\s\S]*?<\/nav>/,'');
  return [header('Lo que ocurrió en tu red','Prensa'),`<div class="tabs">${tabs.map(([id,label])=>`<button data-action="press-tab" data-id="${id}" class="${ui.pressTab===id?'active':''}">${label}</button>`).join('')}</div>`+body];
}
function showTenfeUpdate(report=false){
  if(menuOpen||np||tut||!state.tenfe||$('modal').open)return;
  const notice=state.tenfe.notices[0];
  if(notice){pause();showModal(`<div class="content tenfe-news-modal"><span class="kicker">${esc(E.dateOf(notice.month))} · ${esc(notice.kind)}</span><h1>${esc(notice.title)}</h1><p>${esc(notice.body)}</p><div class="actions"><button class="btn primary" data-action="tenfe-notice" data-id="${notice.id}">Continuar</button></div></div>`,'single');return;}
  if(report&&state.tenfe.reports.length)showModal(`<div class="content tenfe-month-report">${TenfeUI.reportHTML(state)}${TenfeUI.nextHTML(state)}<div class="actions"><button class="btn primary" data-action="close-modal">Volver a la red</button><button class="btn" data-action="month-report">Ver informes</button></div></div>`,'single');
  else if(state.ended){ui.progressTab='campaign';screen='progress';render();}
}
function showLegacy(){
  pause();voices.stop();
  const old=legacySave();if(!old){toast('No hay un rescate anterior válido guardado.');return;}
  let preview;try{preview=convertLegacy(old);}catch(error){toast(error.message);return;}
  showModal(`<div class="content"><span class="kicker">Partida anterior · semana ${old.week}</span><h1>Recuperar tu compañía</h1><p>Tu rescate pasa a la misma red y motor del juego actual. El original queda guardado y puedes exportarlo.</p><dl class="figures"><div><dt>Caja convertida</dt><dd>${money(preview.cash)}</dd></div><div><dt>Deuda convertida</dt><dd>${money(preview.debt)}</dd></div><div><dt>Fecha</dt><dd>${E.dateOf(preview.month)}</dd></div></dl><ul>${preview.tenfe.legacy.notes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul>${saved?'<p class="callout">Recuperar sustituye tu partida activa de Tenfe. Exporta esa partida antes si quieres conservar ambas.</p>':''}<div class="actions"><button class="btn primary" data-action="legacy-convert">Recuperar y jugar</button><button class="btn" data-action="legacy-export">Exportar original</button><button class="btn" data-action="menu-home">Volver</button></div></div>`,'single');
}
function intro() { menuChrome();np=null;showModal(menuHTML(saved,savedError,rescueSaveSummary()),'main-menu-shell');$('modal').querySelector('[autofocus]')?.focus(); }
function resetSessionView(){
 tutorialChrome();adviceLine=null;tutorialDraft=null;clearCoach();inductionModalKey='';screen=null;inspect=null;playing=false;linePicking=null;seenIncidents=new Set();document.querySelector('.alert-pill')?.remove();clearTimeout(alertTimer);
 ui.market=freshMarketFilters();
 map.selected=null;map.selectedCity=null;map.selectedTrain=null;map.selectedTramo=null;map.follow=false;map.reset();setLayer('network');resetToday();
 if(['running','review'].includes(state.ops.phase)){spawnArrivals(-1,state.ops.minute);popups=[];}
}
// ------------------------------------------------------------ nueva partida: un solo botón, tres arranques
/** Segundo paso de la portada. Desde una partida en marcha (clásica o rescate) viene elegido su arranque y «Volver» regresa a ella. */
function newGameScreen(from='menu'){
  if(from==='game'&&(tut||!state.started))from='menu';
  if(from==='game'){pause();voices.stop();}else menuChrome();
  np={pick:'tenfe',difficulty:'normal',guide:true,cash:500,rivals:true,seed:'',confirm:null,from};
  showModal(newGameHTML(np),'main-menu-shell');
  $('modal').querySelector('[data-action="np-begin"]')?.focus();
}

function drawNewGame(focus) {
  const box = $('modal').querySelector('.modal.main-menu-shell');
  if (!np || !box) return;
  const field = $('npSeed'); if (field) np.seed = field.value;
  box.innerHTML = newGameHTML(np);
  box.querySelector(focus)?.focus();
}
function npBack() {
  if (!np) return;
  if (np.confirm) { np.confirm = null; drawNewGame('[data-action="np-begin"]'); return; }
  if (np.from === 'game') { np = null; closeModal(); render(); return; }
  intro();
}
/** «Empezar»: pregunta antes de sustituir una partida guardada del mismo tipo; las demás no se tocan. */
function npBegin(force){
  if(!np)return;
  const field=$('npSeed');if(field)np.seed=field.value;
  if(saved&&!force){sfx.intent=null;sfx.play('page');np.confirm='Tenfe';drawNewGame('[data-action="np-no"]');return;}
  const code=normalizeSeed(np.seed)||randomSeedCode(),seed=seedFromCode(code),options={difficulty:np.difficulty,guide:np.guide};
  sfx.result(true);startClassic(null,seed,code,options);
}

function startClassic(maqueta,seed,code,options={}){
  menuOpen=false;np=null;voices.stop();clearCoach();inductionModalKey='';tut=null;savedError='';
  state=E.initialState(seed);state.seedCode=code;
  if(maqueta)T.freeGame(state,maqueta.cash,maqueta.rivals);
  U.begin(state,options);
  O.ensureOps(state);state.ops.day=3;state.started=true;
  if(maqueta||options.guide===false)state.tutorial={done:true};
  resetSessionView();closeModal();netKey=networkKey();map.dirty=true;render();autosave();
  if(!maqueta)showDecision();
}

function continueClassic(){
  if(!saved)return;
  menuOpen=false;np=null;tut=null;voices.stop();state=E.validateSave(saved);U.begin(state);O.ensureOps(state);state.started=true;resetSessionView();closeModal();netKey=networkKey();map.dirty=true;render();
  if(E.pendingDecision(state))showDecision();else if(state.tutorial&&!state.tutorial.done&&!state.tutorial.suspended)startTutorial();else showTenfeUpdate(false);
}
function menuGuide(){showModal(`<div class="content"><div class="kicker">Antes de asumir el mando</div><h1>No basta con comprar trenes.</h1><ol class="method"><li><b>La red decide.</b> El AVE necesita ancho estándar y catenaria. El Alvia cambia de ancho; el híbrido también pasa por vías sin electrificar.</li><li><b>La oferta se paga.</b> Compara viajeros, tarifa, margen y trenes necesarios antes de subir frecuencias.</li><li><b>El tiempo importa.</b> Los maquinistas se forman en tres meses; las obras y los pedidos tardan más. Cada jornada afecta a tu partida.</li><li><b>Todos piden algo.</b> El Gobierno, Hacienda, la plantilla, las ciudades y los viajeros tienen intereses distintos.</li></ol><p>La campaña incluye un primer turno guiado con nueve personajes, decisiones y objetivos reales. Puedes pausarlo y retomarlo.</p><div class="actions"><button class="btn primary" data-action="new-game">Nueva partida</button><button class="btn" data-action="menu-home">Volver al menú</button></div></div>`,'single');}
function showDecision() {
  // Un encuentro solo se enseña si su arranque y su conflicto siguen siendo verdad ahora.
  E.revalidateScene(state);
  const d = E.pendingDecision(state); if (!d) { render(); return; }
  const person = CHARACTERS[d.person];
  showModal(`<div class="art portrait" data-mood="${d.mood||'happy'}" style="${faceStyle(d.person, d.mood)}" role="img" aria-label="${esc(person.name)}"><span class="plate"><b>${esc(person.name)}</b>${esc(person.role)}</span></div><div class="content"><div class="kicker">${esc(E.dateOf(state.month))} · ${d.event ? 'Imprevisto' : 'Consejo de dirección'}</div><h1>${esc(d.title)}</h1><p data-say="${esc(d.body)}">${sayHtml(d.body,d.person)}</p>${d.instance ? `<p class="small decision-instance"><b>${esc(d.instance)}</b></p>` : ''}<p class="small speaker">${sayButton(d.person, 'modal')} <span class="say-caption" aria-hidden="true">${sayLabel('modal')}</span></p>${d.choices.map((c, i) => `<button class="choice" data-action="decision" data-id="${d.id}" data-choice="${i}" ${c.disabled || (!c.deferred && c.cost > 0 && state.cash < c.cost) ? 'disabled' : ''}><strong>${esc(c.label)}</strong><span>${esc(c.disabled && c.reason ? c.reason : c.detail)}</span></button>`).join('')}</div>`);
  speakIn($('modal'), d.person, 'modal');
}
function dayReport() {
  if(tut){tutorialMark('report');renderCoach();return;}
  tutorialMark('report');
  const l = state.ops.last; if (!l) return;
  const r = state.routes.find(r => r.id === l.busiest);
  showModal(`<div class="content"><div class="kicker">Parte de la jornada · ${esc(l.date)}</div><h1>El último tren ha llegado.</h1>
  <div class="report-head"><div class="ring" style="--p:${l.punctuality}"><div><strong>${l.punctuality}%</strong><small>puntualidad</small></div></div>
  <dl class="figures" style="margin:0"><div><dt>Circulaciones</dt><dd>${n(l.trains)}</dd></div><div><dt>Tren-km</dt><dd>${n(l.km)}</dd></div><div><dt>Viajeros</dt><dd>${n(l.passengers)}</dd></div><div><dt>Resultado del día</dt><dd class="${l.net >= 0 ? 'pos' : 'neg'}">${signed(l.net)}</dd></div></dl></div>
  <table><tbody><tr><td>Primera salida · última llegada</td><td class="num mono">${clock(l.first)} · ${clock(l.last)}</td></tr><tr><td>Con más de 5 minutos de retraso</td><td class="num">${n(l.late)}</td></tr><tr><td>Incidencias atendidas</td><td class="num">${l.attended} / ${l.incidents}</td></tr>${l.buses ? `<tr><td>Servicios por carretera (obras)</td><td class="num">${n(l.buses)}</td></tr>` : ''}${r ? `<tr><td>Línea con más trenes</td><td class="num">${routeChip(r)} ${esc(routeName(r))} · ${n(l.busiestTrains)}</td></tr>` : ''}${l.worst?.delay ? `<tr><td>Mayor retraso</td><td class="num">${esc(l.worst.label)} · +${l.worst.delay} min</td></tr>` : ''}</tbody></table>
  <p class="callout"><strong>La caja se actualiza al cerrar el mes.</strong> Este parte reparte la previsión mensual entre sus días. Puedes jugar la siguiente jornada o delegar el resto del mes para avanzar obras, formación y encargos.</p>
  <div class="actions"><button class="btn primary" data-action="day-next">Siguiente jornada</button><button class="btn" data-action="close-modal">Volver al mapa</button></div></div>`, 'single');
}
function fleetDetail(id) {
  const f = state.fleet.find(f => f.id === id), m = MODEL[f.model], free = E.available(state, f);
  const used = state.routes.filter(r => r.active && r.fleet === f.id);
  showModal(`<div class="content"><div class="kicker">Lote de material</div><h1>${esc(m.name)}</h1><div class="train3d" data-train3d="${f.model}"></div><dl class="figures"><div><dt>Unidades</dt><dd>${f.qty}</dd></div><div><dt>Libres</dt><dd>${free}</dd></div><div><dt>Estado</dt><dd>${n(f.condition)} %</dd></div></dl>
  <p class="small">${used.length ? 'Asignado a: ' + used.map(r => esc(routeName(r)) + ' (' + r.units + ')').join(', ') : 'Sin asignar.'}</p>
  <label for="fleetQty">Unidades libres a gestionar</label><input id="fleetQty" type="number" min="1" max="${free}" value="${Math.min(2, free)}">
  <p class="callout">Reforma: ${money(m.price * .12)} por unidad · 5 meses. Venta: unos ${money(m.price * .23 * f.condition / 100)} por unidad.</p>
  <div class="actions"><button class="btn primary" data-action="refurbish" data-id="${id}" ${!free || state.ended ? 'disabled' : ''}>Enviar a reforma</button><button class="btn danger" data-action="sell" data-id="${id}" ${!free || state.ended ? 'disabled' : ''}>Vender</button><button class="btn" data-action="close-modal">Cerrar</button></div></div>`, 'single');
}
function purchaseDialog(id) {
  const m = MODEL[id];
  showModal(`<div class="content"><div class="kicker">Nuevo pedido</div><h1>${esc(m.name)}</h1><div class="train3d" data-train3d="${id}"></div><p>${esc(m.desc)}</p><label for="buyQty">Unidades (1–30)</label><input id="buyQty" type="number" min="1" max="30" value="4" data-model="${id}"><div id="purchaseQuote"></div><div class="actions"><button class="btn primary" data-action="confirm-buy" data-id="${id}">Firmar pedido</button><button class="btn" data-action="close-modal">Cancelar</button></div><p class="note">Entregas de hasta 2 unidades por mes; puede haber un retraso de 2 a 6 meses.</p></div>`, 'single');
  updateQuote();
}
function marketListingDialog(id) {
  try { showModal(Marketplace.detailHTML(state, Marketplace.listing(state, id), trainThumb, ui.market.route || null), 'single trenespop-modal'); updateQuote(); }
  catch (error) { toast(error.message); renderDrawer(); }
}
function updateQuote() {
  const button=$('modal').querySelector('[data-action="confirm-buy"]');
  try { const q = E.purchaseQuote(state, $('buyQty').dataset.model, +$('buyQty').value, $('buyQty').dataset.listing); $('purchaseQuote').innerHTML = `<dl class="figures"><div><dt>Total</dt><dd>${money(q.total)}</dd></div><div><dt>${q.lead === 0 ? 'A pagar ahora' : 'Anticipo (30 %)'}</dt><dd>${money(q.deposit)}</dd></div><div><dt>${q.lead === 0 ? 'Entrega' : 'Primer lote'}</dt><dd style="font-size:18px">${q.lead === 0 ? 'Ahora mismo' : E.dateOf(state.month + q.lead)}</dd></div></dl>${q.item && q.last > q.lead ? `<p class="tp-detail-note">Último lote previsto: ${E.dateOf(state.month + q.last)}.</p>` : ''}${state.cash < q.deposit ? '<p class="callout red">No hay caja suficiente para el pago inicial.</p>' : ''}`; if(button)button.disabled=state.ended||state.cash<q.deposit; }
  catch (e) { $('purchaseQuote').innerHTML = `<p class="callout red">${esc(e.message)}</p>`;if(button)button.disabled=true; }
}
function placeOptions(id, selected, withJunctions = true) {
  const list = [...CITIES.map(c => ({id: c.id, name: c.name})), ...(withJunctions ? Object.values(I.NODES).filter(nd => nd.kind === 'junction').map(nd => ({id: nd.id, name: nd.name + ' (bifurcación)'})) : [])].filter(x => I.NODES[x.id] || !withJunctions).sort((a, b) => a.name.localeCompare(b.name));
  return `<select id="${id}">${list.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
}
function newLineDialog() {
  showModal(`<div class="content"><div class="kicker">Alta velocidad nueva</div><h1>Traza tu propia línea.</h1><p>Vía nueva de ancho estándar con catenaria de 25 kV entre dos puntos de la red. Cara, lenta y gloriosa.</p><div class="toolbar">${placeOptions('lineA', 'mur')}<span>→</span>${placeOptions('lineB', 'alm')}</div><p id="lineQuote" class="callout"></p><div class="actions"><button class="btn" data-action="line-map">Elegir dos ciudades en el mapa</button><button class="btn primary" data-action="confirm-line">Adjudicar la obra</button><button class="btn" data-action="close-modal">Cancelar</button></div></div>`, 'single');
  updateLineQuote();
}
function updateLineQuote() { try { const q = E.newLineQuote($('lineA').value, $('lineB').value); $('lineQuote').textContent = `${q.km} km · ${money(q.cost)} · ${q.duration} meses de obra, si no se tuerce nada.`; } catch (e) { $('lineQuote').textContent = e.message; } }
function serviceDialog() {
  showModal(`<div class="content"><div class="kicker">Relación nueva</div><h1>Une dos ciudades.</h1><p>Elige origen y destino: la red decide por dónde puede ir cada tren.</p><div class="toolbar">${placeOptions('svcA', 'vlc', false)}<span>→</span>${placeOptions('svcB', 'sev', false)}</div><div id="svcPreview" class="options"></div><div class="actions"><button class="btn primary" data-action="confirm-service">Crear la relación</button><button class="btn" data-action="close-modal">Cancelar</button></div></div>`, 'single');
  updateServicePreview();
}
function updateServicePreview() {
  const a = $('svcA')?.value, b = $('svcB')?.value, el = $('svcPreview');
  if (!el) return;
  if (!a || !b || a === b) { el.innerHTML = '<p class="small muted">Elige dos ciudades distintas.</p>'; return; }
  const way = [a, b], P = I.PROFILES;
  el.innerHTML = optionRow('AVE', I.plan(state, way, P.ave)) + optionRow('Alvia', I.plan(state, way, P.alvia)) + optionRow('Alvia híbrido', I.plan(state, way, P.hybrid));
}
function saveDialog() {
  showModal(`<div class="content"><div class="kicker">Guardar</div><h1>Tu partida, a salvo.</h1><p>Se guarda sola en este navegador. Exporta una copia para llevártela a otro equipo.</p><div class="actions"><button class="btn primary" data-action="save-now">Guardar ahora</button><button class="btn" data-action="export">Exportar (.json)</button></div><label for="importSave">Importar una partida</label><input id="importSave" type="file" accept="application/json,.json">${seedCodeOf(state) ? `<p class="small muted seed-code">Semilla <b class="mono">${esc(seedCodeOf(state))}</b></p>` : ''}</div>`, 'single');
}
function help() {
  showModal(`<div class="content"><div class="kicker">Cómo jugar</div><h1>Un día, un turno.</h1><ol class="method">
  <li><b>Pulsa una ciudad.</b> Abre sus conexiones, pon más o menos trenes con + y −, mejora su estación y atiende sus peticiones.</li>
  <li><b>AVE o Alvia.</b> El AVE solo circula por ancho estándar o mixto y con catenaria. El Alvia cambia de ancho en los cambiadores; el Alvia híbrido, además, va sin catenaria.</li>
  <li><b>Arregla la vía.</b> En los mapas de <b>Anchos</b> y <b>Electrificación</b>, pulsa un tramo: electrifica, pon tercer carril o pásalo a ancho estándar. Pulsa un rombo o una bifurcación para construir cambiadores.</li>
  <li><b>Juega la jornada.</b> El reloj va del primer tren al último. Atiende las incidencias y los momentos de mucha demanda.</li>
  <li><b>Crece.</b> Compra trenes, financia líneas nuevas y cumple los capítulos para recibir dinero.</li></ol>
  <p class="small">Atajos: <kbd>Espacio</kbd> pausa · <kbd>1</kbd>–<kbd>4</kbd> velocidad · <kbd>+</kbd>/<kbd>−</kbd> zoom · <kbd>Esc</kbd> cerrar.</p><div class="actions"><button class="btn primary" data-action="close-modal">Entendido</button><button class="btn" data-action="tutorial-start">${state.tutorial?.done?'Consultar la guía':state.tutorial?.version===1?'Retomar primer turno':'Hacer el turno guiado'}</button></div>
  <p class="credits">Horarios de Renfe Data (CC BY 4.0). Vías © colaboradores de OpenStreetMap (ODbL). Contornos de Natural Earth.</p></div>`, 'single');
}
function realTripModal(id) { inspect = {type: 'train', id}; map.selectedTrain = id; screen = null; if (layer !== 'real' && !plan().some(t => t.id === id)) setLayer('real'); render(); }

// ------------------------------------------------------------ capas y acciones
function setLayer(l) {
  if(['gauge','power'].includes(l))tutorialMark(l);
  layer = LAYERS.includes(l) ? l : 'network'; map.layer = ['works', ...INFRA_LAYERS].includes(layer) ? layer : 'network';
  document.querySelectorAll('[data-layer]').forEach(b => b.classList.toggle('active', b.dataset.layer === layer));
  netKey = networkKey(); map.dirty = true; renderLegend(); renderDaybar();
  if (layer === 'real') toast('Horario real: todos los AVE y Alvia publicados para un día ' + S.DAY_TYPES[dayType()].toLowerCase() + '. Mirar no cuesta dinero.');
}
/** Confirma una obra de vía o un cambiador con su presupuesto y lo que corta. */
function workDialog(kind, target) {
  if(kind==='electrify'&&/Torralba.*Soria/i.test(I.tramoDef(state,target)?.name||''))tutorialMark('soria-quote');
  let q;
  try { q = E.workQuote(state, kind, target); } catch (e) { sfx.play('error'); return toast(e.message); }
  const place = kind === 'changer' ? I.NODES[target].name : I.tramoDef(state, target).name;
  showModal(`<div class="content"><div class="kicker">${esc(q.label)}</div><h1>${esc(place)}</h1>
  <dl class="figures"><div><dt>Coste</dt><dd>${money(q.cost)}</dd></div><div><dt>Obra</dt><dd>${q.months} meses</dd></div><div><dt>Termina</dt><dd style="font-size:18px">${E.dateOf(state.month + q.months)}</dd></div></dl>
  ${q.closes ? `<p class="callout red">La línea se corta mientras dure la obra.${q.affected.length ? ' Se suspenden: ' + q.affected.map(r => esc(routeName(r))).join(', ') + '.' : ''}</p>` : ''}
  <p class="small">${kind === 'renew' ? 'Renovación de vía para elevar el límite a 220 km/h; el tren respeta su velocidad máxima y los demás tramos.' : kind === 'electrify' ? 'Catenaria de 25 kV: permite material eléctrico compatible con el ancho. La obra no cambia el ancho de la vía.' : kind === 'mixed' ? 'Un tercer carril: pasan los dos anchos y no se corta el tráfico.' : kind === 'standard' ? 'Fuera el ancho ibérico: el AVE entra hasta la cocina, pero solo por ancho estándar.' : 'Los Alvia podrán cambiar de ancho aquí.'}${['mixed', 'standard'].includes(kind) && state.infra.t[target]?.e === '3kv' ? ' Sigue a 3 kV: solo AVE bitensión.' : ''}</p>
  <div class="actions"><button class="btn primary" data-action="confirm-work" data-work="${kind}" data-id="${esc(target)}">Adjudicar · ${money(q.cost)}</button><button class="btn" data-action="close-modal">Cancelar</button></div></div>`, 'single');
}

document.addEventListener('click', event => {
  const b = event.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const a = b.dataset.action, id = b.dataset.id;
  clickSound(a, b);
  if(tut&&a==='skip-month'){toast('Termina el primer turno o páusalo antes de delegar el mes.');return;}
  if(tut&&a==='day-end'&&INDUCTION_STAGES[tut.step].id==='incident'&&!readyInduction(state,tut)){toast('Atiende la avería antes de cerrar esta jornada de iniciación.');return;}
  switch (a) {
    case 'tycoon-tab': ui.tycoonTab=id;if(!tut){if(id==='research'){screen='progress';ui.progressTab='research';}else if(id==='paper'){screen='press';ui.pressTab='paper';}else if(id==='market'){screen='network';ui.netView='rivals';}else screen='story';ui.officeTab='tycoon';inspect=null;renderNav();renderMission();renderInspector();}renderDrawer(true);tutorialMark(id);break;
    case 'tycoon-policy': {const active=state.tycoon.policies.includes(id);act(()=>T.setPolicy(state,id),`${T.POLICIES[id].name}: política ${active?'desactivada':'activada'}.`);break;}
    case 'tycoon-hire': act(()=>T.hire(state,20),`20 maquinistas en formación. Se incorporan en ${E.dateOf(state.month+3)}.`);break;
    case 'tycoon-research': act(()=>T.research(state,id),`${T.TECHS[id].name} financiada. Final previsto: ${E.dateOf(state.month+T.TECHS[id].months)}.`);break;
    case 'tycoon-lobby': act(()=>T.lobby(state,id),`${T.GROUPS[id][0]}: +12 de confianza. Negociación: 8 M€.`);break;
    case 'tycoon-public': case 'tycoon-commercial': act(()=>T.accept(state,id,a==='tycoon-public'?'public':'commercial'),'Compromiso aceptado. Revisa los requisitos y su fecha límite en la agenda.');break;
    case 'navigate': if($('modal').open)closeModal();navigate(b.dataset.screen); break;
    case 'close-drawer': screen = null; render(); break;
    case 'close-inspector': inspect = null; map.selected = null; map.selectedTrain = null; map.follow = false; renderInspector(); break;
    case 'close-modal': closeModal();if(menuOpen||!state.started)intro();break;
    case 'np-difficulty': np.difficulty=id;drawNewGame('[data-action="np-difficulty"][data-id="'+id+'"]');break;
    case 'tenfe-next': {if($('modal').open)closeModal();const next=U.nextAction(state);if(next.action==='tenfe-decision')showDecision();else if(next.action==='claim')act(()=>E.claimChapter(state),'Financiación recibida.');else if(next.action==='route')selectRoute(next.id);else if(next.action==='tycoon-tab'){ui.tycoonTab=next.id;ui.progressTab=next.id;screen=next.id==='research'?'progress':'story';render();}else if(next.action==='tenfe-tab'){ui.progressTab=next.id;screen='progress';render();}else navigate(next.screen);break;}
    case 'tenfe-decision': showDecision();break;
    case 'tenfe-pact': act(()=>U.signPact(state,id),'Pacto firmado. Cumple los requisitos antes del plazo.');break;
    case 'tenfe-mega': act(()=>U.startMega(state,id),'Fase encargada. Puedes gestionar tu red mientras avanza.');break;
    case 'tenfe-shortcut': showModal('<div class="content"><div class="kicker">Decisión con consecuencias</div><h1>45 M€ ahora</h1><p>La inspección encontrará el expediente en seis meses. Hacienda −20; Viajeros y Gobierno −15. A los doce meses: 60 M€ de devolución y multa, reputación −12.</p><div class="actions"><button class="btn danger" data-action="tenfe-shortcut-confirm">Aceptar el atajo</button><button class="btn" data-action="close-modal">Seguir por la vía legal</button></div></div>','single');break;
    case 'tenfe-shortcut-confirm': if(act(()=>U.shortcut(state),'Adjudicación firmada. La inspección revisará el expediente.'))closeModal();break;
    case 'tenfe-restitute': act(()=>U.selfReport(state),'Fondos restituidos.');break;
    case 'tenfe-lawyer': act(()=>U.legalDefence(state),'Revisión jurídica encargada.');break;
    case 'tenfe-tab': ui.progressTab=id;screen='progress';render();break;
    case 'progress-tab': ui.progressTab=id;renderDrawer(true);break;
    case 'press-tab': ui.pressTab=id;renderDrawer(true);break;
    case 'tenfe-notice': U.dismiss(state,id);autosave();closeModal();showTenfeUpdate(true);break;
    case 'month-report': closeModal();ui.pressTab='reports';if(screen==='press')screen=null;navigate('press');break;
    case 'legacy-preview': showLegacy();break;
    case 'legacy-convert': {const old=legacySave();if(!old)break;try{const converted=convertLegacy(old);state=converted;O.ensureOps(state);saved=state;menuOpen=false;np=null;tut=null;voices.stop();resetSessionView();closeModal();netKey=networkKey();map.dirty=true;autosave();render();toast('Partida recuperada. El original sigue guardado.');}catch(e){toast(e.message);}break;}
    case 'legacy-export': {const raw=state.tenfe?.legacy?.raw||legacySave();if(!raw)break;const url=URL.createObjectURL(new Blob([JSON.stringify(raw,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Tenfe-Rescate-original.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
    case 'np-pick': np.pick = id; np.confirm = null; drawNewGame(`[data-action="np-pick"][data-id="${id}"]`); break;
    case 'np-cash': np.cash = +id; drawNewGame(`[data-action="np-cash"][data-id="${id}"]`); break;
    case 'np-rivals': np.rivals = id === 'on'; drawNewGame(`[data-action="np-rivals"][data-id="${id}"]`); break;
    case 'np-begin': npBegin(false); break;
    case 'np-yes': npBegin(true); break;
    case 'np-no': case 'np-back': npBack(); break;
    case 'menu-home': if(tut){tut.suspended=true;state.tutorial=tut;autosave();tut=null;}intro();break;
    case 'menu-guide': menuGuide();break;
    case 'menu-settings': musicDialog();break;
    case 'continue': case 'continue-other': if (b.dataset.game === 'rescue') showLegacy(); else continueClassic(); break;
    case 'observe': menuOpen=false;closeModal(); setLayer('real'); observerMinute = 480; play(); break;
    case 'decision': if (act(() => E.decide(state, id, +b.dataset.choice))) { closeModal(); if (E.pendingDecision(state)) showDecision(); else if (!state.tutorial?.done && !state.tutorial?.suspended && !tut && (state.month === 0||state.tutorial?.version===1)) startTutorial(); } break;
    case 'claim': act(() => E.claimChapter(state), 'Financiación recibida. Tu siguiente etapa está preparada.'); setTimeout(() => { const st = document.querySelector('.story'); if (st && !state.ended) speakIn(st, CHAPTERS[state.chapter].speaker, 'story'); }, 60); break;
    case 'play': playing ? pause() : play(); break;
    case 'speed': speedIndex = +id; renderDaybar(); break;
    case 'day-start': if (layer === 'real') setLayer('network'); play(); break;
    case 'day-end': pause(); if (state.ops.phase === 'running') { state.ops.minute = O.dayBounds(plan()).last; finishDay(); } break;
    case 'day-review': dayReport(); break;
    case 'day-next': try { const monthBefore=state.month; O.nextDay(state); sfx.result(true); closeModal(); seenIncidents = new Set(); autosave(); render(); if (E.pendingDecision(state)) showDecision(); else showTenfeUpdate(state.month!==monthBefore); } catch (e) { sfx.result(false); toast(e.message); } break;
    case 'skip-month': pause();E.revalidateScene(state);if(E.pendingDecision(state)){showDecision();break;}try { const paidBefore = state.stats.requests || 0; if (O.skipMonth(state)) { sfx.result(true); autosave(); render(); const paid = (state.stats.requests || 0) - paidBefore; toast('Mes cerrado. Cuentas liquidadas.' + (paid ? ` ${paid} petición${paid > 1 ? 'es' : ''} cobrada${paid > 1 ? 's' : ''}.` : '')); if (E.pendingDecision(state)) showDecision();else showTenfeUpdate(true); } else sfx.intent = null; } catch (e) { sfx.result(false); toast(e.message); } break;
    case 'open-incidents': document.querySelector('.alert-pill')?.remove(); navigate('ops'); if (screen !== 'ops') navigate('ops'); break;
    case 'respond': if(act(() => O.resolveIncident(state, id, b.dataset.option), O.RESPONSES[b.dataset.option].note)&&tut?.answers.incident===id)tutorialMark('incident-resolved'); break;
    case 'route': selectRoute(id); break;
    case 'city': { const c = CITY[id]; document.querySelector('.alert-pill')?.remove(); inspect = {type: 'city', id}; screen = null; map.selectedCity = id; if (c && map.zoom < 1.4) map.focusAt(c.lon, c.lat, 1.6); render(); break; }
    case 'freq-up': case 'freq-down': { const r = routeById(id), step = Math.max(1, Math.round(E.maxFrequency(r) * .1)); act(() => setService(r, r.frequency + (a === 'freq-up' ? step : -step))); break; }
    case 'open-route': { const r = routeById(id); act(() => setService(r, Math.max(1, Math.round(E.maxFrequency(r) * .4))), 'Conexión abierta: ' + routeName(r) + '.'); break; }
    case 'request': { const q = (state.requests || []).find(q => q.id === id); if (q) act(() => doRequest(q)); break; }
    case 'station-up': act(() => E.upgradeStation(state, id), 'Estación mejorada.'); celebrate(id, 'Estación mejorada', E.STATION_LEVELS[state.stations?.[id] || 0]); break;
    case 'music': musicDialog(); break;
    case 'music-play': { const song = SONGS.find(x => x.id === id); if (song) { if (music.mode === 'auto') music.setMode('list'); music.play(song); } break; }
    case 'music-toggle': music.toggle(); break;
    case 'voice-toggle': voices.toggle(); musicDialog(true); break;
    case 'sfx-toggle': if (sfx.toggle()) sfx.play('toggleOn'); musicDialog(true); break;
    case 'say': {
      const where = b.dataset.where, root = where === 'coach' ? $('coach') : where === 'modal' ? $('modal') : b.closest('.story');
      if (voices.speaking?.where === where) voices.stop();
      else { if (!voices.enabled) voices.toggle(); speakIn(root, b.dataset.person, where); }
      break;
    }
    case 'music-next': music.next(); break;
    case 'tutorial-next': tutorialNext(); break;
    case 'tutorial-skip': suspendTutorial(); break;
    case 'tutorial-collapse': if(tut){tut.compact=!tut.compact;autosave();renderCoach();}break;
    case 'tutorial-advice': tutorialAdvice(id);break;
    case 'tutorial-advice-close': adviceLine=null;voices.stop();closeModal();inductionModalKey='';renderCoach();break;
    case 'tutorial-view': tutorialView(id);break;
    case 'tutorial-recover-day': pause();if(state.ops.phase==='running'){state.ops.minute=O.dayBounds(plan()).last;finishDay();}break;
    case 'tutorial-quote': tutorialMark('soria-quote');renderCoach();break;
    case 'tutorial-answer': tutorialAnswer(b.dataset.choice);break;
    case 'tutorial-focus': focusTutorial();renderCoach();break;
    case 'tutorial-hold': tutorialMark('hold-investment');toast('Caja conservada. Podrás financiar proyectos cuando hayas comprobado el margen.');renderCoach();break;
    case 'tutorial-finish': closeModal();officeTutorial('agenda');break;
    case 'tutorial-start': if(state.tutorial?.done)menuGuide();else {closeModal();startTutorial();} break;
    case 'route-zoom': map.focus(id, true); break;
    case 'route-trips': { const r = state.routes.find(r => r.id === id); ui.ttStation = ''; ui.ttStationId = undefined; screen = 'network'; ui.netView = 'timetables'; inspect = null; const first = S.routeTrips(dayType(), id)[0]; if (first) { ui.ttStationId = first.stations[0]; ui.ttStation = S.STATIONS[first.stations[0]].name.toLowerCase(); } render(); if (r) toast('Salidas desde ' + S.STATIONS[first?.stations[0]]?.name); break; }
    case 'route-tab': ui.routeTab = id;if(b.dataset.clear){ui.routeQuery='';ui.routeStatus='all';}renderDrawer(true); break;
    case 'net-view': ui.netView = id; renderDrawer(true); break;
    case 'office-tab': ui.officeTab = id; renderDrawer(true); break;
    case 'train': inspect = {type: 'train', id}; map.selectedTrain = id; screen = null; render(); break;
    case 'station': inspect = {type: 'station', id: +id}; render(); break;
    case 'station-map': { const st = S.STATIONS[+id]; screen = null; inspect = {type: 'station', id: +id}; map.focusAt(st.lon, st.lat, 60); render(); break; }
    case 'station-timetable': { const st = S.STATIONS[+id]; ui.ttStationId = +id; ui.ttStation = st.name.toLowerCase(); ui.ttHour = Math.max(4, Math.min(25, Math.floor(currentMinute() / 60))); inspect = null; screen = 'network'; ui.netView = 'timetables'; render(); break; }
    case 'tt-type': ui.ttType = id; renderDrawer(); break;
    case 'tt-station': ui.ttStationId = +id; ui.ttStation = S.STATIONS[+id].name.toLowerCase(); renderDrawer(); break;
    case 'real-trip': realTripModal(id); break;
    case 'follow': map.follow = !map.follow; renderInspector(); break;
    case 'layer': setLayer(id); screen = null; render(); break;
    case 'visit-work': { const job = state.projects.find(p => p.id === id) || {id}; const pts = map.workGeometry(job).flatMap(g => g.pts); setLayer('works'); if (pts.length) map.fit(pts, 45); inspect = {type: 'work', id}; screen = null; render(); break; }
    case 'tramo': { const d = I.tramoDef(state, id); if (!d) break; if (!INFRA_LAYERS.includes(layer)) setLayer('gauge'); inspect = {type: 'tramo', id}; map.selectedTramo = id; screen = null; closeModal(); render(); break; }
    case 'tramo-zoom': { const d = I.tramoDef(state, id); if (d) map.fit(I.tramoGeom(d).pts, 40); break; }
    case 'node': { const nd = I.NODES[id]; if (!nd) break; if (!INFRA_LAYERS.includes(layer)) setLayer('gauge'); inspect = {type: 'node', id}; screen = null; closeModal(); if (map.zoom < 2) map.focusAt(nd.lon, nd.lat, 3); render(); break; }
    case 'work': workDialog(b.dataset.work, id); break;
    case 'confirm-work': if (act(() => E.startWork(state, b.dataset.work, id), 'Obra adjudicada. Ya hay máquinas en la vía.')) closeModal(); break;
    case 'works-tab': ui.worksTab = id; renderDrawer(true); break;
    case 'new-service': serviceDialog(); break;
    case 'confirm-service': { let rid = null; if (act(() => { rid = E.createService(state, $('svcA').value, $('svcB').value); }, 'Relación creada. Ahora ponle trenes.')) { closeModal(); selectRoute(rid); } break; }
    case 'close-service': act(() => E.closeRoute(state, id), 'Servicio suspendido. El material queda libre.'); break;
    case 'upgrade': act(() => E.upgradeRoute(state, id), 'Mejora contratada. Termina en cuatro meses.'); break;
    case 'fleet-tab': ui.fleetTab = id; renderDrawer(true); break;
    case 'fleet-detail': fleetDetail(id); break;
    case 'refurbish': if (act(() => E.refurbish(state, id, +$('fleetQty').value), 'Material enviado a reforma.')) closeModal(); break;
    case 'sell': if (act(() => E.sell(state, id, +$('fleetQty').value), 'Venta completada.')) closeModal(); break;
    case 'purchase': purchaseDialog(id); break;
    case 'market-listing': marketListingDialog(id); break;
    case 'market-reset': event.preventDefault();ui.market=freshMarketFilters();renderDrawer(true);break;
    case 'market-family': ui.market.family=id;renderDrawer(true);break;
    case 'market-route': ui.market={...freshMarketFilters(),route:id||''};inspect=null;map.selected=null;if($('modal').open)closeModal();navigate('market');renderInspector();break;
    case 'market-favorites': ui.market.favorites=!ui.market.favorites;renderDrawer(true);break;
    case 'market-favorite': try {const liked=E.marketplaceFavorite(state,id);autosave();renderDrawer();if($('modal').open&&$('buyQty')?.dataset.listing===id){b.classList.toggle('liked',liked);b.setAttribute('aria-pressed',String(liked));b.setAttribute('aria-label',liked?'Quitar de favoritos':'Guardar anuncio');}toast(liked?'Anuncio guardado en favoritos.':'Anuncio retirado de favoritos.');}catch(error){toast(error.message);}break;
    case 'confirm-buy': {const listing=b.dataset.listing,immediate=b.dataset.immediate==='true';if (act(() => E.buy(state, id, +$('buyQty').value, listing), immediate?'Compra completada. Los trenes ya están en tu parque.':'Pedido firmado. Revisa el envío en Mis compras.')) closeModal();break;}
    case 'project': { const p = PROJECTS.find(p => p.id === id); const km = I.TRAMOS.filter(t => t.plan === id).reduce((v, t) => v + t.km, 0); showModal(`<div class="content"><div class="kicker">Alta velocidad nueva · ${esc(p.region)}</div><h1>${esc(p.name)}</h1><p>${esc(p.desc)}</p><dl class="figures"><div><dt>Coste</dt><dd>${money(p.cost)}</dd></div><div><dt>Longitud</dt><dd>${n(km)} km</dd></div><div><dt>Obra</dt><dd>${p.duration} meses</dd></div></dl><p class="small">No estará lista antes de ${p.earliest}. Ancho estándar y 25 kV.</p><div class="actions"><button class="btn primary" data-action="confirm-project" data-id="${id}">Financiar · ${money(p.cost)}</button><button class="btn" data-action="close-modal">Cancelar</button></div></div>`, 'single'); break; }
    case 'confirm-project': if (act(() => E.startProject(state, id), 'Obra adjudicada. Ahora a esperar.')) closeModal(); break;
    case 'line-map': linePicking=[];closeModal();screen=null;render();toast('Pulsa dos ciudades del mapa para trazar la línea. Escape cancela.');break;
    case 'new-line': newLineDialog(); break;
    case 'confirm-line': if (act(() => E.buildLine(state, $('lineA').value, $('lineB').value), 'Línea adjudicada. Nos vemos en la inauguración.')) closeModal(); break;
    case 'borrow': act(() => E.loan(state, 100), 'Financiación de 100 M€ recibida.'); break;
    case 'repay': act(() => E.loan(state, -100), '100 M€ amortizados.'); break;
    case 'save-dialog': saveDialog(); break;
    case 'help': help(); break;
    case 'save-now': autosave(true); break;
    case 'export': { const exported=menuOpen&&saved?saved:state;const blob = new Blob([JSON.stringify(exported, null, 2)], {type: 'application/json'}), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'Iberia-Ferroviaria-' + E.yearOf(exported) + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Partida exportada.'); break; }
    case 'new-game': newGameScreen(menuOpen ? 'menu' : 'game'); break;
  }
  if(tut){if(a==='day-start'||a==='play')tutorialIncident();if(a==='work'&&b.dataset.work==='electrify'&&/Torralba.*Soria/i.test(I.tramoDef(state,id)?.name||''))tutorialMark('soria-quote');renderCoach();} // el tutorial avanza en cuanto se cumple el paso, sin esperar al siguiente fotograma
});
document.addEventListener('submit', event => {
  if(event.target.id==='marketSearchForm'){event.preventDefault();ui.market.query=$('marketSearch').value;renderDrawer(true);return;}
  if (event.target.id !== 'routeForm') return;
  event.preventDefault();
  sfx.expect('plan');
  tutorialDraft=null;
  act(() => E.configureRoute(state, inspect.id, $('routeFleet').value, +$('frequency').value, +$('fare').value), 'Plan de servicio actualizado.');
});
document.addEventListener('input', event => {
  const t = event.target;
  if (t.type === 'range' || t.type === 'number') sfx.slide(t);
  if (t.id === 'sfxVolume') sfx.setVolume(+t.value);
  if (['routeFleet', 'frequency', 'fare'].includes(t.id)) {tutorialMark('preview');updatePreview();rememberTutorialDraft();if(tut&&$('coach')?.querySelector('.lesson-progress')){const c=stageChecks(state,tut);$('coach').querySelector('.lesson-progress').textContent=c.filter(x=>x.done).length+' / '+c.length;}}
  if (t.id === 'musicVolume') music.setVolume(+t.value);
  if (t.id === 'routeSearch') { ui.routeQuery = t.value; renderDrawer(); }
  if (t.id === 'marketSearch') { ui.market.query = t.value; renderDrawer(); }
  if (t.id === 'ttStation') { ui.ttStation = t.value; ui.ttStationId = undefined; renderDrawer(); }
  if (t.id === 'npSeed' && np) np.seed = t.value;
  if (t.id === 'npGuide' && np) np.guide=t.checked;
  if (t.id === 'buyQty') updateQuote();
  if (['lineA', 'lineB'].includes(t.id)) updateLineQuote();
  if (['svcA', 'svcB'].includes(t.id)) updateServicePreview();
});
document.addEventListener('change', async event => {
  const t = event.target;
  if (t.tagName === 'SELECT' || t.type === 'date') sfx.play('select');
  if (t.type === 'checkbox') sfx.play(t.checked ? 'toggleOn' : 'toggleOff');
  if (t.type === 'file' && t.files[0]) sfx.play('page');
  if (t.id === 'maintenance') sfx.intent = null;
  if (t.id === 'routeStatus') { ui.routeStatus = t.value; renderDrawer(); }
  if (['marketState','marketDelivery','marketMaker','marketSort','marketRoute'].includes(t.id)) {const field={marketState:'state',marketDelivery:'delivery',marketMaker:'maker',marketSort:'sort',marketRoute:'route'}[t.id];ui.market[field]=t.value;renderDrawer(true);}
  if (t.id === 'ttHour') { ui.ttHour = +t.value; renderDrawer(); }
  if (t.id === 'dayPriority' && state.ops.phase === 'planning') { state.ops.priority = t.value; autosave(); render(); }
  if (t.id === 'autoPause') ui.autoPause = t.checked;
  if (t.id === 'musicMode') music.setMode(t.value);
  if (t.id === 'maintenance') act(() => { E.ensurePlaying(state); state.maintenance = E.clamp(+t.value, .6, 1.5); });
  if (t.id === 'importSave' && t.files[0]) {
    try { if (t.files[0].size > 6e6) throw Error('El archivo es demasiado grande.'); const imported=JSON.parse(await t.files[0].text());state=imported?.v===1?convertLegacy(imported):E.validateSave(imported);U.begin(state);O.ensureOps(state); state.started = true; autosave(); sfx.play('confirm'); closeModal(); inspect = null; screen = null; netKey = networkKey(); map.dirty = true; render(); toast('Partida importada.');menuOpen=false;tut=null;voices.stop();resetSessionView();render();if (E.pendingDecision(state)) showDecision();else if(state.tutorial&&!state.tutorial.done&&!state.tutorial.suspended)startTutorial(); }
    catch (e) { sfx.play('error'); toast('No se pudo importar: ' + e.message); }
  }
});
document.addEventListener('pointerdown', event => {
  const cv = event.target.closest?.('#timelineCanvas');
  if (!cv || layer !== 'real') return;
  const r = cv.getBoundingClientRect();
  observerMinute = +cv.dataset.first + (event.clientX - r.left) / r.width * +cv.dataset.span;
  drawTimeline(); renderClock(); sfx.play('scrub');
});
// campos de formulario (al pulsarlos) y enlaces a las fuentes
document.addEventListener('pointerdown', event => { if (event.target.closest?.('input, select, textarea, label[for], .train3d')) sfx.play('tick'); });
document.querySelectorAll('[data-layer]').forEach(b => b.onclick = () => { sfx.play('lever', {i: LAYERS.indexOf(b.dataset.layer)}); setLayer(b.dataset.layer); renderCoach();b.closest('details')?.removeAttribute('open'); });
$('zoomIn').onclick = () => { sfx.play('zoomIn'); map.zoomAt(map.zoom * 1.5); };
$('zoomOut').onclick = () => { sfx.play('zoomOut'); map.zoomAt(map.zoom / 1.5); };
$('resetMap').onclick = () => { sfx.play('resetMap'); map.reset(); };
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('modal').open && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) document.activeElement.blur();
  else if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) || $('modal').open) return;
  if(tut){if(tut.phase==='task'&&event.key==='Escape')suspendTutorial();return;}
  if (event.code === 'Space') { event.preventDefault(); sfx.play(playing ? 'pause' : state.started && state.ops.phase === 'planning' && layer !== 'real' ? 'departure' : 'resume'); playing ? pause() : play();if(tut)tutorialIncident(); }
  if (['1','2','3','4','5','6'].includes(event.key)) { event.preventDefault();navigate(Object.keys(PAGES)[+event.key-1]); }
  if(event.key.toLowerCase()==='t'){ui.fleetTab='market';navigate('fleet');}
  if (event.key === '+' || event.key === '=') { sfx.play('zoomIn'); map.zoomAt(map.zoom * 1.4); }
  if (event.key === '-') { sfx.play('zoomOut'); map.zoomAt(map.zoom / 1.4); }
  if (event.key === 'Escape') { if (screen || inspect) sfx.play('dismiss'); screen = null; inspect = null; map.selected = null; map.selectedTrain = null; map.follow = false; render(); }
});
$('modal').addEventListener('cancel', event => { if (E.pendingDecision(state) || !state.started) event.preventDefault(); });

// API de lectura para verificación automatizada y accesibilidad.
window.railwayGame = {music, voices, sfx, snapshot: () => JSON.parse(JSON.stringify(state)), engine: E, unified: U, operations: O, schedule: S, map, navigate, setLayer, selectRoute,
  plan: () => plan().map(t => ({id: t.id, route: t.route, dep: t.dep, arrival: t.arrival, delay: t.delay, real: t.real})), minute: currentMinute, play, pause, finishDay,
  state: () => state, render, pick, setMinute: m => { if (layer === 'real') observerMinute = m; else if (state.ops.phase === 'running') state.ops.minute = m; else observerMinute = m; render(); }};

render(); renderMusicButton(); intro(); requestAnimationFrame(frame);

document.addEventListener('keydown',event=>{if(event.key==='Escape')linePicking=null;});
