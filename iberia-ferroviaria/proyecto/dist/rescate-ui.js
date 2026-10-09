// Rescate de Tenfe: interfaz. HUD de juego sobre el mapa: qué debes conseguir (misión), qué te lo impide
// (obstáculos) y qué puedes hacer ahora (ficha del corredor y botón de cerrar la semana). El mínimo texto.
import * as R from './rescate.js';
import {GROUPS, CORRIDORS, CORRIDOR, TERRITORIES, TRAIN_OFFERS, OFFER, RENT, CREW, WORKS, SERVICE_MODES, PHASES, MILESTONES, TECHS, TECH, TECH_BRANCHES,
  ACHIEVEMENTS, MEGAPROJECTS, STAGES, PROGRAM, PACT, BRIBES, JUDICIAL, LINES, WEEKS, imageURL} from './rescate-data.js';
import {RescueMap, LAYERS, punctColor, trackColor} from './rescate-map.js';
import {RESCUE_VOICES} from './assets/rescate-voices.js';
import {faceURL} from './faces.js';
import {brandLogo} from './brands.js';
import {trainThumb} from './train3d.js';
import {CHARACTERS} from './story.js';
import {NODES} from './infra.js';
import {seedCodeOf} from './nueva-partida.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = R.fmt;
const pct = v => Math.round(v) + ' %';
const signed = m => (m >= 0 ? '+' : '') + fmt(m);
const mil = v => (Math.round(v * 10) / 10).toLocaleString('es-ES', {maximumFractionDigits: 1}) + ' mil';
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
const nameOf = p => CHARACTERS[p]?.name || R.personName(p);
const roleOf = p => CHARACTERS[p]?.role || '';
const NODE = id => NODES[id];
/** Imagen con nombre fijo: si todavía no existe, desaparece sin dejar hueco. */
const img = (key, cls = '') => `<img class="${cls}" src="${imageURL(key)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`;
const P = {
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5a3 3 0 100 5M8.5 11h5M8.5 13h5"/>', train: '<rect x="6" y="3" width="12" height="14" rx="4"/><path d="M6 10h12M9 21l2-4m4 4-2-4M9 13.5h.01M15 13.5h.01"/>',
  helmet: '<path d="M4 16a8 8 0 0116 0z"/><path d="M3 16h18M12 8v4"/>', people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A5 5 0 0121 19"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  finanzas: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', obras: '<path d="M4 20h16M6 20l3-9h6l3 9M9 11l1-5h4l1 5"/>', flota: '<rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 10h14M8 21l2-4m6 4-2-4"/>',
  pactos: '<path d="M8 12l3 3 5-6"/><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0"/>', progreso: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  tecnologia: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', mega: '<path d="M3 21h18M6 21V9l6-5 6 5v12M10 21v-5h4v5"/>',
  elecciones: '<path d="M4 9h16v11H4z"/><path d="M8 9V4h8v5M10 14h4"/>', cloacas: '<path d="M3 13a9 9 0 0118 0"/><path d="M2 13h20M7 17h10M10 21h4"/>',
  gaceta: '<path d="M4 4h13v16H6a2 2 0 01-2-2zM17 8h3v10a2 2 0 01-2 2"/><path d="M7 8h7M7 12h7M7 16h4"/>', ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  renovar: '<path d="M4 7h16M4 17h16M7 4v16M12 4v16M17 4v16"/>', senalizacion: '<rect x="8" y="2" width="8" height="14" rx="3"/><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="11" r="1.4"/><path d="M12 16v6"/>',
  apartaderos: '<path d="M3 18h18M3 6h8l5 6h5"/>', electrificar: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', servicio: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>',
  comprar: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>', abrir: '<path d="M12 5v14M5 12h14"/>', skip: '<path d="M4 6l7 6-7 6zM13 6l7 6-7 6z"/>', play: '<path d="M7 5l12 7-12 7z"/>',
  licencia: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
const PAGES = [['finanzas', 'Finanzas'], ['obras', 'Obras'], ['flota', 'Flota'], ['pactos', 'Pactos'], ['progreso', 'Progreso'], ['tecnologia', 'Tecnología'], ['mega', 'Megaobras'], ['elecciones', 'Elecciones'], ['cloacas', 'Cloacas'], ['gaceta', 'Gaceta'], ['ayuda', 'Ayuda']];
const STAGE_TITLE = {s1: 'Recupera el Norte', s2: 'Tres corredores fiables', s3: 'Cuentas y reelección', s4: 'La España vaciada', s5: 'Cinco corredores al 85 %'};
const LAYER_COLOR = {puntualidad: '#74cc93', via: '#f2b84b', demanda: '#a98be0', catenaria: '#7cb6e8', ancho: '#d08a1c', velocidad: '#74cc93', obras: '#f2b84b', apoyo: '#c4466d'};
const WORK_SHORT = {renovar: 'Renovar vía', senalizacion: 'Señalización', apartaderos: 'Apartaderos', electrificar: 'Electrificar', apeadero: 'Apeadero'};
const NEED_SHORT = {norte80: 'Norte 80 %', fiables3: '3 fiables', fiables5: '5 al 85 %', flota6: '6 trenes', flota9: '9 trenes', caja5: 'Caja 5 M€', pax48: 'Red regional', pax66: 'Operador serio', pax86: 'Columna vertebral', trab55: 'Plantilla 55 %', eco55: 'Economía 55 %', terr50: 'Territorios 50 %', viaj60: 'Viajeros 60 %', tech_predictivo: 'Predictivo', tech_regulacion: 'Regulación', tech_ertms: 'ERTMS', med_open: 'Mediterráneo abierto', med85: 'Mediterráneo 85 %', teruel_open: 'Tren a Teruel', sinIncidencias: '12 sem tranquilas', resultado: 'Resultado +', pacto_ministra: 'Pacto ministra', pacto_cualquiera: 'Un pacto cumplido', limpio: 'Sin juez'};

// ------------------------------------------------------------------ guardado
export function rescueSave() {
  try { const t = localStorage.getItem(R.SAVE_KEY); return t ? R.load(t) : null; } catch { return null; }
}
export function rescueSaveSummary(s = rescueSave()) {
  if (!s || s.ended) return null;
  return {week: s.week, date: R.dateLabel(s.week, {month: 'long', year: 'numeric'}), stage: STAGES[s.stageIdx]?.name, cash: s.cash, support: R.support(s), savedAt: s.savedAt || 0};
}

// ------------------------------------------------------------------ tutorial: una persona habla cada vez
const TUTORIAL = [
  {line: 't-1', focus: '.rs-mission', next: 'Vamos'},
  {line: 't-2', focus: '.rs-map', task: 'Pulsa el Norte', done: ui => ui.selected === 'norte'},
  {line: 't-3', focus: '[data-a="plan-work"][data-type="renovar"]', task: 'Renovar vía', done: ui => ui.modal === 'work'},
  {line: 't-4', focus: '.rs-kpis', task: 'Aprueba la obra', inModal: true, done: (ui, s) => s.works.length > 0},
  {line: 't-5', focus: '[data-page="flota"]', task: 'Abre Flota', done: ui => ui.page === 'flota'},
  {line: 't-6', focus: '.rs-go', task: 'Cierra la semana', done: (ui, s) => s.week > 1},
  {line: 't-7', next: 'A gobernar', final: true},
];

export function mountRescue({music, sfx, onExit, voiceEnabled = () => true, fresh = false, seed, seedCode} = {}) {
  let s = (!fresh && rescueSave()) || R.newGame(seed ?? Math.floor(Math.random() * 1e9));
  if (fresh && seedCode) s.seedCode = seedCode;
  const ui = {selected: null, layer: 'puntualidad', page: null, modal: null, plan: null, tutorial: s.week === 1 && !s.tutorial.done ? s.tutorial.step : -1, popups: [], closing: false, spoken: -1};
  const root = document.createElement('div');
  root.className = 'rs'; root.id = 'rescate';
  root.innerHTML = `<canvas class="rs-map" aria-label="Mapa del rescate" role="img"></canvas>
    <header class="rs-top rs-glass"></header><nav class="rs-rail rs-glass" aria-label="Páginas"></nav>
    <aside class="rs-mission rs-glass" aria-live="polite"></aside><aside class="rs-side rs-glass" hidden></aside>
    <footer class="rs-dock rs-glass"></footer>
    <dialog class="rs-sheet"></dialog><dialog class="rs-modal"></dialog><div class="rs-toast" role="status"></div>`;
  document.body.appendChild(root);
  const $ = sel => root.querySelector(sel);
  const sheet = $('.rs-sheet'), modal = $('.rs-modal');
  const play = name => { try { sfx?.play?.(name); } catch {} };
  try { music?.start?.(); } catch {}

  const map = new RescueMap($('.rs-map'), {
    getState: () => s, getDate: () => R.dateOf(Math.min(s.week, WEEKS)), getKey: () => ui.layer + '|' + s.week + '|' + s.ordersUsed + '|' + s.works.length + '|' + CORRIDORS.map(d => s.corridors[d.id].open ? 1 : 0).join(''),
    isVisible: () => !root.hidden, getPopups: () => ui.popups, getCities: () => [], onPick: hit => pick(hit),
  });
  function homeView() { map.reset(); const wide = window.innerWidth > 1060; map.zoom = wide ? 1.05 : .95; map.pan = {x: wide ? 60 : 0, y: window.innerWidth <= 760 ? 150 : 10}; if (window.innerWidth <= 760) map.zoom = .8; map.dirty = true; }
  setTimeout(homeView, 60);

  // ---------------------------------------------------------------- utilidades
  function save() { try { s.savedAt = Date.now(); localStorage.setItem(R.SAVE_KEY, R.serialize(s)); } catch {} }
  let toastTimer;
  function toast(text) { const t = $('.rs-toast'); t.textContent = text; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3000); }
  function attempt(fn, ok, sound = 'confirm') {
    try { const out = fn(); if (ok) toast(typeof ok === 'function' ? ok(out) : ok); play(sound); save(); map.dirty = true; render(); return out ?? true; }
    catch (e) { play('error'); toast(e.message); return false; }
  }
  function openSheet(html) { sheet.innerHTML = `<div class="inner">${html}</div>`; if (!sheet.open) sheet.showModal(); coach(); }
  function openModal(html, kind) { ui.modal = kind; modal.innerHTML = `<div class="inner">${html}</div>`; if (!modal.open) modal.showModal(); coach(); }
  function closeModal() { stopVoice(); if (modal.open) modal.close(); ui.modal = null; ui.plan = null; render(); }
  modal.addEventListener('close', () => { stopVoice(); ui.modal = null; setTimeout(nextDecision, 0); });
  sheet.addEventListener('close', () => { ui.page = null; render(); });
  const X = '<button class="rs-x" data-a="close" aria-label="Cerrar">✕</button>';

  // ---------------------------------------------------------------- voz
  let audio = null;
  function stopVoice() { if (audio) { audio.pause(); audio = null; } root.querySelectorAll('.say.speaking').forEach(x => x.classList.remove('speaking')); }
  function speak(line, el) {
    stopVoice();
    const v = RESCUE_VOICES[line];
    if (!v || !voiceEnabled()) return false;
    audio = new Audio(v.url); audio.volume = .95;
    el?.classList.add('speaking');
    audio.addEventListener('ended', () => el?.classList.remove('speaking'));
    audio.play().catch(() => el?.classList.remove('speaking'));
    return true;
  }
  function talk(line) {
    const L = LINES[line]; if (!L) return '';
    return `<div class="rs-talk"><img class="face" src="${faceURL(L.person, L.mood)}" alt="${esc(nameOf(L.person))}"><div><div class="who"><b>${esc(nameOf(L.person))}</b>${esc(roleOf(L.person))}</div>
      <p class="say" data-line="${line}">«${esc(L.text)}»</p>${RESCUE_VOICES[line] ? `<button class="rs-replay" data-a="replay" data-line="${line}">${icon('play')} Escuchar</button>` : ''}</div></div>`;
  }
  function autoSpeak(container) { const el = container.querySelector('.say[data-line]'); if (el) speak(el.dataset.line, el); }

  // ---------------------------------------------------------------- HUD
  function render() { renderTop(); renderRail(); renderMission(); renderSide(); renderDock(); coach(); }
  function renderTop() {
    const acc = R.weeklyAccounts(s), proj = R.cashProjection(s, 8), crew = R.crewInfo(s), sup = R.support(s);
    const service = s.fleet.filter(t => t.status === 'service').length, total = s.fleet.filter(t => t.status !== 'arriving').length;
    const res = (page, ic, value, extra, cls, tip) => `<button data-page="${page}" class="${cls}" title="${esc(tip)}">${icon(ic)}<b>${value}</b>${extra ? `<small>${extra}</small>` : ''}</button>`;
    const w = Math.min(s.week, WEEKS);
    $('.rs-top').innerHTML = `<div class="rs-brand"><span class="logo">${brandLogo('Tenfe', {variant: 'white'})}</span><div class="rs-week"><b>Semana ${w}</b><span>${esc(R.dateLabel(w, {month: 'short', year: 'numeric'}))}</span></div></div>
      <div class="rs-res">
        ${res('finanzas', 'coin', fmt(s.cash), `<span class="${acc.ordinary >= 0 ? 'pos' : 'neg'}">${signed(acc.ordinary)}</span>`, s.cash < 0 ? 'bad' : proj.min < 0 ? 'warn' : '', 'Caja · resultado por semana')}
        ${res('flota', 'train', service, '/' + total, service < total ? 'warn' : '', 'Trenes disponibles')}
        ${res('obras', 'helmet', crew.free, '/' + crew.total, crew.free ? '' : 'warn', 'Cuadrillas libres')}
        ${res('elecciones', 'people', pct(sup), '', sup < 45 ? 'warn' : '', 'Apoyo ciudadano')}
        ${res('tecnologia', 'star', s.stars, '', '', 'Popularidad')}
        <span class="rs-orders" title="Órdenes de la semana">${[0, 1, 2].map(i => `<i class="${i < s.ordersUsed ? 'used' : ''}"></i>`).join('')}</span>
      </div>
      <button class="rs-iconbtn" data-a="game-menu" aria-label="Menú">${icon('menu')}</button>`;
  }
  function renderRail() {
    const badge = {pactos: s.offers.length, cloacas: s.cloacas.stage, tecnologia: TECHS.some(t => R.techState(s, t.id).ok), mega: MEGAPROJECTS.some(m => R.megaState(s, m.id).ok)};
    $('.rs-rail').innerHTML = PAGES.map(([id, label]) => `<button data-page="${id}" data-tip="${label}" aria-label="${label}" class="${ui.page === id ? 'on' : ''}">${icon(id)}${badge[id] ? '<i class="badge"></i>' : ''}</button>`).join('');
  }
  function renderMission() {
    const p = R.stageProgress(s), st = p?.stage;
    if (!st) { $('.rs-mission').innerHTML = `<div class="rs-kick">Fin del mandato</div><h2>${esc(s.ended?.text || '')}</h2>`; return; }
    const obs = R.obstacles(s), decisions = s.decisions.filter(d => d.choices).length;
    $('.rs-mission').innerHTML = `<div class="rs-kick"><span>${s.stageIdx + 1}/5 · ${esc(st.name)}</span><span class="rs-pill ${p.weeksLeft <= 3 ? 'hot' : ''}">${p.weeksLeft > 0 ? p.weeksLeft + ' sem' : 'última'}</span></div>
      <h2>${esc(STAGE_TITLE[st.id])}</h2>
      <div class="rs-goal">${p.rows.map(r => `<div class="row ${r.ok ? 'ok' : ''}"><span>${esc(r.label)}</span><b>${esc(r.value)} <small>/ ${esc(r.target)}</small></b><div class="bar"><i style="width:${Math.round(r.pct * 100)}%"></i></div></div>`).join('')}</div>
      ${decisions ? `<button class="rs-cta" data-a="decisions">${plural(decisions, 'decisión pendiente', 'decisiones pendientes')}</button>` : ''}
      ${obs.length ? `<ul class="rs-list">${obs.map((o, i) => `<li><button data-a="obstacle" data-i="${i}"><span class="rs-dot s${o.severity}"></span><span>${esc(o.label)}</span><span class="go">›</span></button></li>`).join('')}</ul>` : ''}
      ${s.offers.length ? `<div class="rs-sep"></div>${s.offers.map(o => { const d = PACT[o.id]; return `<button class="rs-offer" data-a="offer" data-id="${o.id}"><img src="${faceURL(d.person, d.mood)}" alt=""><div><b>${esc(d.title)}</b><span>${esc(nameOf(d.person))} · hasta sem. ${o.expires}</span></div></button>`; }).join('')}` : ''}`;
  }
  function renderSide() {
    const side = $('.rs-side');
    side.hidden = !ui.selected;
    if (ui.selected) side.innerHTML = corridorHTML(ui.selected);
  }
  function renderDock() {
    const next = s.decisions.filter(d => d.choices).length, g = s.gaceta[0];
    $('.rs-dock').innerHTML = `<div class="rs-layers" role="group" aria-label="Capas">${Object.entries(LAYERS).map(([id, l]) => `<button data-a="layer" data-id="${id}" class="${ui.layer === id ? 'on' : ''}" title="${esc(l.name)}"><i style="background:${LAYER_COLOR[id]}"></i><span>${esc(l.name)}</span></button>`).join('')}</div>
      ${g ? `<div class="rs-ticker" data-page="gaceta"><b>GACETA</b><span>${esc(g.text)}</span></div>` : '<div class="rs-ticker"></div>'}
      <div class="rs-go"><button class="rs-skip" data-a="advance" ${s.ended || next ? 'disabled' : ''} title="Avanzar hasta la próxima decisión" aria-label="Avanzar hasta la próxima decisión">${icon('skip')}</button>
        <button class="rs-next ${next ? 'alert' : ''}" data-a="close-week" ${s.ended ? 'disabled' : ''}>${next ? 'Decidir' : `<span class="long">Cerrar semana</span> ${Math.min(s.week, WEEKS)}`} ${icon('play')}</button></div>`;
  }

  // ---------------------------------------------------------------- ficha de corredor
  function corridorHTML(id) {
    const d = CORRIDOR[id], c = s.corridors[id], kind = d.essential ? 'Esencial' : d.territory ? 'Territorio desatendido' : d.business ? 'Negocio' : 'Regional';
    const head = `${X}<div class="rs-kick">${kind}</div><h2>${esc(d.name)}</h2><div class="sub">${d.km} km · ${d.elec ? 'electrificado' : 'sin catenaria'}</div>`;
    if (!c.open) {
      const q = R.openQuote(s, id), terr = d.territory && !s.territories[d.territory], block = q.reasons.filter(r => !r.startsWith('Rompería'));
      return `${head}<div class="rs-stats"><div class="rs-stat"><b style="color:${trackColor(c.track)}">${pct(c.track)}</b><span>Vía</span></div><div class="rs-stat"><b>${d.pot}</b><span>mil viajeros</span></div><div class="rs-stat"><b>—</b><span>Sin servicio</span></div></div>
        ${block.length ? `<div class="rs-flag bad">${esc(block[0])}</div>` : ''}
        <div class="rs-acts" style="margin-top:10px">${terr ? `<button class="rs-act main" data-a="territory" data-id="${d.territory}">${icon('licencia')}Licencia<span class="p">${fmt(TERRITORIES[d.territory].license)}</span></button>` : `<button class="rs-act main" data-a="plan-open" data-id="${id}" ${block.length ? 'disabled' : ''}>${icon('abrir')}Abrir<span class="p">${fmt(q.cost)}</span></button>`}
        ${!terr && c.track < 40 ? `<button class="rs-act" data-a="plan-work" data-id="${id}" data-type="renovar">${icon('renovar')}Renovar vía<span class="p">${fmt(safeQuote(id, 'renovar')?.cost || 0)}</span></button>` : ''}</div>`;
    }
    const pt = R.punctTarget(s, id), net = c.revenue - c.cost, work = s.works.find(w => w.corridor === id && (w.status === 'active' || w.status === 'commissioning'));
    const tags = pt.causes.filter(x => Math.abs(x.value) >= 1).sort((a, b) => a.value - b.value).slice(0, 3).map(x => `<span class="rs-tag ${x.value > 0 ? 'up' : ''}">${esc(shortCause(x.label))} <b>${x.value > 0 ? '+' : '−'}${Math.abs(Math.round(x.value))}</b></span>`).join('');
    const acts = Object.entries(WORKS).filter(([, w]) => !w.hidden).map(([k]) => { const q = safeQuote(id, k); const off = !q || q.reasons.some(r => !r.startsWith('Necesita')); if (off && k !== 'renovar') return ''; return `<button class="rs-act ${k === 'renovar' && c.track < 70 && !work ? 'main' : ''}" data-a="plan-work" data-id="${id}" data-type="${k}" ${off ? 'disabled' : ''}>${icon(k)}${WORK_SHORT[k]}<span class="p">${q ? fmt(q.cost) : ''}</span></button>`; }).join('');
    return `${head}<div class="rs-stats"><div class="rs-stat"><b style="color:${punctColor(c.punct)}">${pct(c.punct)}</b><span>Puntualidad</span></div><div class="rs-stat"><b style="color:${trackColor(c.track)}">${pct(c.track)}</b><span>Vía</span></div><div class="rs-stat"><b>${(Math.round(c.pax * 10) / 10).toLocaleString('es-ES')}</b><span>mil viajeros</span></div></div>
      <div class="rs-meta"><span>${icon('train')} <b>${c.trains}</b>${c.express ? ` · ${c.express} exprés` : ''}</span><span>Neto <b class="${net >= 0 ? 'pos' : 'neg'}">${signed(net)}</b>/sem</span>${c.lost > .2 ? `<span class="neg">${mil(c.lost)} sin plaza</span>` : ''}${c.rivalShare > .02 ? `<span class="neg">Lowgo ${pct(c.rivalShare * 100)}</span>` : ''}</div>
      ${tags ? `<div class="rs-tags">${tags}</div>` : ''}
      ${work ? workBlock(work) : ''}
      <div class="rs-acts">${acts}<button class="rs-act" data-a="plan-service" data-id="${id}">${icon('servicio')}Servicio y precio<span class="p">›</span></button><button class="rs-act" data-a="plan-buy" data-id="${id}">${icon('comprar')}Comprar trenes<span class="p">›</span></button></div>`;
  }
  const shortCause = l => l.replace(/ \(.*\)/, '').replace('Estado de la vía', 'Vía').replace('Trenes desgastados', 'Trenes').replace('Atascos: más trenes que vías de cruce', 'Atascos').replace('Trenes llenos: subidas y bajadas lentas', 'Llenos').replace('Señalización y control', 'Señales').replace('Incidencia de esta semana', 'Incidencia').replace('Parada nueva en Villanueva', 'Apeadero');
  function safeQuote(id, type) { try { return R.workQuote(s, id, type); } catch { return null; } }
  function workBlock(w) {
    if (w.status === 'commissioning') return `<div class="rs-flag ok">✓ ${esc(WORK_SHORT[w.type])} terminada · en servicio al cerrar la semana</div>`;
    const st = R.workStatus(s, w);
    return `<div class="rs-h" style="margin-top:4px">${esc(WORK_SHORT[w.type])} · ${esc(st.phase.name)}</div>
      <div class="rs-progress">${Array.from({length: st.total}, (_, i) => `<i class="${i < st.done ? 'done' : i === st.done ? 'on' : ''}"></i>`).join('')}</div>
      <div class="rs-workline"><span>${plural(st.left, 'semana', 'semanas')}</span><span>${fmt(w.paid)} / ${fmt(w.cost)}</span></div>
      <div style="display:flex;gap:6px;margin-bottom:12px"><button class="rs-btn" data-a="accelerate" data-id="${w.id}" ${w.accelerated || w.phase > 1 ? 'disabled' : ''}>Acelerar</button><button class="rs-btn danger" data-a="cancel-work" data-id="${w.id}">Cancelar</button></div>`;
  }

  // ---------------------------------------------------------------- obra
  function planWork(id, type) { ui.plan = {kind: 'work', id, type, mode: s.corridors[id].open ? 'alternativa' : 'cerrar', accelerate: false, kickback: false}; drawWorkPlan(); }
  function drawWorkPlan() {
    const p = ui.plan, d = CORRIDOR[p.id], c = s.corridors[p.id];
    let q; try { q = R.workQuote(s, p.id, p.type, p.mode, p.accelerate, p.kickback); } catch (e) { toast(e.message); return; }
    const st = STAGES[s.stageIdx];
    const goal = (st.id === 's1' && p.id === 'norte') || (st.id === 's2' && ['norte', 'levante', 'sur'].includes(p.id)) ? 80 : null;
    const at = goal ? R.punctProjection(s, p.id, q, st.to) : null;
    const modes = c.open ? `<div class="rs-modes">${Object.entries(SERVICE_MODES).map(([k, m]) => { const qq = R.workQuote(s, p.id, p.type, k, p.accelerate, p.kickback); return `<button class="rs-mode ${p.mode === k ? 'on' : ''}" data-a="plan-mode" data-id="${k}"><b>${esc({fases: 'Por fases', alternativa: 'Autobuses', cerrar: 'Cortar vía'}[k])}</b><span>${qq.weeks} sem · ${m.demand ? Math.round(m.demand * 100) + ' % viajeros' : 'sin viajeros'}${qq.extra ? ' · +' + fmt(qq.extra) : ''}</span></button>`; }).join('')}</div>` : '';
    const max = Math.max(...q.schedule.map(x => x.amount));
    openModal(`${X}<div class="body"><div class="rs-kick">${esc(d.name)}</div><h1>${esc(WORK_SHORT[p.type])}</h1>
      <div class="rs-tabs">${Object.entries(WORKS).filter(([, w]) => !w.hidden).map(([k]) => `<button class="${p.type === k ? 'on' : ''}" data-a="plan-type" data-id="${k}">${WORK_SHORT[k]}</button>`).join('')}</div>
      <div class="rs-phasebar">${PHASES.map((ph, i) => `<div class="${i === 1 ? 'build' : ''}" style="flex:${q.phases[i]}" title="${esc(ph.name)}">${q.phases[i]} sem</div>`).join('')}</div>
      <div class="rs-note">Permisos · construcción · pruebas</div>
      ${modes}
      <div class="rs-kpis"><div class="rs-kpi"><b>${fmt(q.cost)}</b><span>coste</span></div><div class="rs-kpi"><b>${q.crews}</b><span>cuadrilla${q.crews > 1 ? 's' : ''}</span></div><div class="rs-kpi"><b>Sem. ${q.serviceWeek}</b><span>en servicio</span></div><div class="rs-kpi"><b>${pct(q.punctNow)} → ${pct(q.punctAfter)}</b><span>puntualidad</span></div></div>
      <div class="rs-spark" title="Pagos semanales">${q.schedule.map(x => `<i style="height:${Math.round(x.amount / max * 100)}%" title="Semana ${x.week}: ${fmt(x.amount)}"></i>`).join('')}</div>
      <div>${q.aid ? `<span class="rs-flag info">+${fmt(q.aid.amount)} al terminar</span>` : ''}${q.revenueGain > .005 ? `<span class="rs-flag ok">${signed(q.revenueGain)}/sem</span>` : ''}${goal ? `<span class="rs-flag ${at >= goal ? 'ok' : 'bad'}">${at >= goal ? '✓' : '✗'} ${pct(at)} en la semana ${st.to}</span>` : ''}${q.reasons.map(r => `<span class="rs-flag bad">${esc(r)}</span>`).join('')}</div>
      <label class="rs-switch"><input type="checkbox" data-a="plan-accel" ${p.accelerate ? 'checked' : ''}> Acelerar (+25 %, una cuadrilla más)</label>
      <label class="rs-switch dark"><input type="checkbox" data-a="plan-kick" ${p.kickback ? 'checked' : ''}> Aceptar la «atención» del contratista</label>
      <div class="rs-foot"><span class="note">1 orden</span><button class="rs-btn primary" data-a="confirm-work" ${q.ok ? '' : 'disabled'}>Aprobar</button></div></div>`, 'work');
  }

  // ---------------------------------------------------------------- servicio
  function planService(id) { const c = s.corridors[id]; ui.plan = {kind: 'service', id, trains: c.trains, express: c.express, fare: c.fare, fareX: c.fareX}; drawServicePlan(); }
  function drawServicePlan() {
    const p = ui.plan, d = CORRIDOR[p.id], c = s.corridors[p.id], max = R.trainsIdle(s).length + c.trains, q = R.serviceQuote(s, p.id, p), xOK = s.milestones.includes('m2');
    const k = (label, a, b, f) => `<div class="rs-kpi"><b>${f(b)}</b><span>${label} · antes ${f(a)}</span></div>`;
    openModal(`${X}<div class="body"><div class="rs-kick">${esc(d.name)}</div><h1>Servicio y precio</h1>
      <div class="rs-field"><label>Trenes <b>${p.trains}</b></label><input type="range" min="0" max="${max}" value="${p.trains}" data-a="svc" data-k="trains"></div>
      ${xOK ? `<div class="rs-field"><label>Exprés <b>${p.express}</b></label><input type="range" min="0" max="${p.trains}" value="${p.express}" data-a="svc" data-k="express"></div>` : ''}
      <div class="rs-field"><label>Billete <b>${p.fare} €</b></label><input type="range" min="${Math.round(d.fare * .6)}" max="${Math.round(d.fare * 1.5)}" value="${p.fare}" data-a="svc" data-k="fare"></div>
      ${p.express ? `<div class="rs-field"><label>Billete exprés <b>${p.fareX} €</b></label><input type="range" min="${d.fare}" max="${Math.round(d.fare * 2.4)}" value="${p.fareX}" data-a="svc" data-k="fareX"></div>` : ''}
      <div class="rs-kpis">${k('viajeros', q.now.pax, q.later.pax, mil)}${k('ingresos', q.now.revenue, q.later.revenue, fmt)}${k('costes', q.costNow, q.costLater, fmt)}${k('neto', q.netNow, q.netLater, signed)}</div>
      <div>${p.express && q.later.cannibal > .1 ? `<span class="rs-flag info">El exprés quita ${mil(q.later.cannibal)} al regional</span>` : ''}${q.later.lost > .2 ? `<span class="rs-flag bad">${mil(q.later.lost)} sin plaza</span>` : ''}${p.trains > c.trains && c.track < 60 ? `<span class="rs-flag bad">Con la vía al ${pct(c.track)} apenas sube</span>` : ''}${q.reasons.map(r => `<span class="rs-flag bad">${esc(r)}</span>`).join('')}</div>
      <div class="rs-foot"><span class="note">1 orden</span><button class="rs-btn primary" data-a="confirm-service" ${q.ok ? '' : 'disabled'}>Aplicar</button></div></div>`, 'service');
  }

  // ---------------------------------------------------------------- compras
  function planBuy(corr = ui.selected) { ui.plan = {kind: 'buy', corr, kick: false}; drawBuy(); }
  function drawBuy() {
    const p = ui.plan, corr = p.corr && s.corridors[p.corr]?.open ? p.corr : null;
    let gain = '';
    if (corr) { const c = s.corridors[corr], a = R.serviceForecast(s, corr), b = R.serviceForecast(s, corr, {trains: c.trains + 1}); gain = `<span class="rs-flag ${b.pax - a.pax < 1 ? 'bad' : 'ok'}">Uno más en el ${esc(CORRIDOR[corr].short)}: ${b.pax - a.pax >= 0 ? '+' : ''}${mil(b.pax - a.pax)} · ${signed(b.revenue - a.revenue)}/sem</span>`; }
    openModal(`${X}<div class="body"><div class="rs-kick">Material</div><h1>Comprar trenes</h1>${gain}
      <div class="rs-grid" style="margin-top:14px">${TRAIN_OFFERS.map(o => { const q = R.trainQuote(s, o.id, p.kick); return `<div class="rs-tile">${trainThumb(o.photo)}<h3>${esc(o.model)}</h3><div class="k">${esc(o.maker)} · ${o.seats} plazas · ${'★'.repeat(Math.round(o.reliability * 5))}</div>
        <div class="rs-rows"><div class="r"><span>Precio</span><b>${fmt(q.price)}</b></div><div class="r"><span>Llega</span><b>sem. ${q.arrives}</b></div></div>
        <button class="rs-btn primary" data-a="confirm-buy" data-id="${o.id}" ${q.reasons.length || !R.ordersLeft(s) ? 'disabled' : ''}>Comprar</button></div>`; }).join('')}
        <div class="rs-tile"><div style="aspect-ratio:3/2;border-radius:10px;background:var(--g2);display:grid;place-items:center">${icon('train')}</div><h3>Alquiler</h3><div class="k">12 semanas · ya</div><div class="rs-rows"><div class="r"><span>Semana</span><b>${fmt(RENT.weekly)}</b></div></div><button class="rs-btn" data-a="rent" ${R.ordersLeft(s) ? '' : 'disabled'}>Alquilar</button></div></div>
      <label class="rs-switch dark"><input type="checkbox" data-a="buy-kick" ${p.kick ? 'checked' : ''}> Aceptar la comisión del fabricante (+10 % precio, 7 % a caja B)</label>
      <div class="rs-foot"><span class="note">1 orden por compra · 40 % al firmar</span></div></div>`, 'buy');
  }

  // ---------------------------------------------------------------- abrir y territorios
  function planOpen(id) {
    const q = R.openQuote(s, id), d = CORRIDOR[id], n = Math.min(2, R.trainsIdle(s).length), block = q.reasons.filter(r => !r.startsWith('Rompería'));
    openModal(`${X}${d.territory ? img('territorio-' + d.territory, 'rs-banner') : ''}<div class="body"><div class="rs-kick">Abrir corredor</div><h1>${esc(d.name)}</h1>
      <div class="rs-kpis"><div class="rs-kpi"><b>${fmt(q.cost)}</b><span>apertura</span></div><div class="rs-kpi"><b>${n}</b><span>trenes</span></div><div class="rs-kpi"><b>${mil(q.forecast.pax)}</b><span>viajeros/sem</span></div><div class="rs-kpi"><b>${signed(q.forecast.revenue - q.costWeekly)}</b><span>neto/sem</span></div></div>
      <div>${d.territory ? `<span class="rs-flag info">+${fmt(R.TERRITORY_OSP)} por trimestre</span>` : ''}${q.reasons.map(r => `<span class="rs-flag bad">${esc(r)}</span>`).join('')}</div>
      <div class="rs-foot"><span class="note">1 orden</span><button class="rs-btn primary" data-a="confirm-open" data-id="${id}" data-n="${n}" ${block.length || !R.ordersLeft(s) ? 'disabled' : ''}>Abrir</button></div></div>`, 'open');
  }
  function territoryModal(id) {
    const t = TERRITORIES[id], c = s.corridors[t.corridor], lic = s.territories[id];
    const steps = [['Licencia', !!lic], ['Vía al 40 %', c.track >= 40], ['Tren diario', c.open && c.trains > 0]];
    openModal(`${X}${img('territorio-' + id, 'rs-banner')}<div class="body"><div class="rs-kick">Territorio desatendido · ${esc(t.people)}</div><h1>${esc(t.name)}</h1><p class="rs-lead">${esc(t.pitch)}</p>
      <div>${steps.map(([l, ok]) => `<span class="rs-flag ${ok ? 'ok' : 'info'}">${ok ? '✓' : '○'} ${l}</span>`).join('')}</div>
      <div class="rs-foot"><button class="rs-btn" data-a="select" data-id="${t.corridor}">Ver corredor</button>${lic ? '' : `<button class="rs-btn primary" data-a="confirm-license" data-id="${id}" ${!R.ordersLeft(s) ? 'disabled' : ''}>Licencia · ${fmt(t.license)}</button>`}</div></div>`, 'territory');
  }

  // ---------------------------------------------------------------- páginas
  function page(id) {
    ui.page = id; play('tab');
    const pages = {finanzas: financePage, obras: worksPage, flota: fleetPage, pactos: pactsPage, progreso: progressPage, tecnologia: techPage, mega: megaPage, elecciones: electionPage, cloacas: cloacasPage, gaceta: gacetaPage, ayuda: helpPage};
    openSheet(X + pages[id]());
    renderRail();
  }
  const head = (kick, title) => `<div class="rs-kick">${kick}</div><h1>${title}</h1>`;
  function financePage() {
    const a = R.weeklyAccounts(s), proj = R.cashProjection(s, 13), up = R.upcoming(s, 13).filter(p => p.amount > 0), aid = R.plannedAid(s);
    const max = Math.max(.5, ...proj.rows.map(r => Math.abs(r.cash))), hist = s.hist.slice(-26), hmax = Math.max(.05, ...hist.map(h => Math.abs(h.ordinary)));
    const NAMES = {personal: 'Personal', energia: 'Energía', mantenimiento: 'Mantenimiento', infraestructura: 'Infraestructura', intereses: 'Intereses', indemnizaciones: 'Indemnizaciones'};
    return `${head('Finanzas', fmt(s.cash))}
      <div class="rs-grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px">
      <div><div class="rs-h">Esta semana</div><div class="rs-rows"><div class="r"><span>Billetes</span><b class="pos">${fmt(a.tickets)}</b></div><div class="r"><span>Subvención</span><b class="pos">${fmt(a.osp)}</b></div>
        ${Object.entries(a.rows).map(([k, v]) => `<div class="r"><span>${NAMES[k]}</span><b class="neg">−${fmt(v)}</b></div>`).join('')}
        <div class="r total"><span>Resultado</span><b class="${a.ordinary >= 0 ? 'pos' : 'neg'}">${signed(a.ordinary)}</b></div></div>
        <div class="rs-h">26 semanas</div><div class="rs-spark">${hist.map(h => `<i class="${h.ordinary < 0 ? 'n' : ''}" style="height:${Math.round(Math.abs(h.ordinary) / hmax * 100)}%" title="Semana ${h.week}: ${fmt(h.ordinary)}"></i>`).join('')}</div></div>
      <div><div class="rs-h">Caja prevista · 13 semanas</div><div class="rs-spark" style="height:64px">${proj.rows.map(r => `<i class="${r.cash < 0 ? 'n' : ''}" style="height:${Math.round(Math.abs(r.cash) / max * 100)}%" title="Semana ${r.week}: ${fmt(r.cash)}"></i>`).join('')}</div>
        <span class="rs-flag ${proj.min < 0 ? 'bad' : 'ok'}">Mínimo ${fmt(proj.min)} · sem. ${proj.minWeek}</span>
        <div class="rs-h">Pagos próximos</div><div class="rs-rows">${up.slice(0, 8).map(p => `<div class="r"><span>Sem. ${p.week} · ${esc(p.label)}</span><b>${fmt(p.amount)}</b></div>`).join('') || '<div class="r"><span>Nada</span></div>'}</div>
        ${aid.length ? `<div class="rs-h">Financiación prevista</div><div class="rs-rows">${aid.map(x => `<div class="r"><span>${esc(x.name)}</span><b class="pos">${fmt(x.amount)}</b></div>`).join('')}</div>` : ''}</div></div>
      <div class="rs-h">Préstamos</div><div class="rs-grid">${R.LOANS.map(l => { const q = R.loanQuote(s, l.amount); return `<div class="rs-tile ${q.reasons.length ? 'off' : ''}"><div class="big">${fmt(l.amount)}</div><div class="k">${q.installments} cuotas de ${fmt(q.per)}</div><button class="rs-btn" data-a="loan" data-id="${l.amount}" ${q.reasons.length || !R.ordersLeft(s) ? 'disabled' : ''} title="${esc(q.reasons[0] || '')}">Firmar</button></div>`; }).join('')}</div>
      <div class="rs-h">Presupuesto de mantenimiento</div>
      ${[['track', 'Vía'], ['fleet', 'Trenes'], ['service', 'Estructura']].map(([k, l]) => `<div class="rs-field"><label>${l} <b>${Math.round(s.sliders[k] * 100)} %</b></label><input type="range" min="50" max="150" step="10" value="${Math.round(s.sliders[k] * 100)}" data-a="slider" data-k="${k}"></div>`).join('')}`;
  }
  function worksPage() {
    const active = s.works.filter(w => w.status === 'active' || w.status === 'commissioning'), crew = R.crewInfo(s), paused = s.works.filter(w => w.status === 'paused');
    return `${head('Obras', `${crew.free} de ${crew.total} cuadrillas libres`)}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="rs-btn primary" data-a="hire" data-id="own" ${R.ordersLeft(s) ? '' : 'disabled'}>Contratar · ${fmt(CREW.weekly)}/sem</button><button class="rs-btn" data-a="hire" data-id="sub" ${R.ordersLeft(s) && s.milestones.includes('m1') ? '' : 'disabled'}>Subcontratar 12 sem</button><button class="rs-btn danger" data-a="fire" ${R.ordersLeft(s) ? '' : 'disabled'}>Despedir</button>
      ${s.flags.stationTask && !s.flags.stationTask.started ? `<button class="rs-btn primary" data-a="station">Apeadero de Paco</button>` : ''}</div>
      <div class="rs-h">En marcha</div><div class="rs-grid">${active.map(w => `<div class="rs-tile"><h3>${esc(WORK_SHORT[w.type])} · ${esc(CORRIDOR[w.corridor].short)}</h3>${workBlock(w)}</div>`).join('') || '<span class="rs-note">Ninguna. Pulsa un corredor del mapa.</span>'}</div>
      ${paused.length ? `<div class="rs-h">Aplazadas</div><div class="rs-grid">${paused.map(w => `<div class="rs-tile"><h3>${esc(WORK_SHORT[w.type])} · ${esc(CORRIDOR[w.corridor].short)}</h3><button class="rs-btn" data-a="resume-work" data-id="${w.id}" ${R.ordersLeft(s) ? '' : 'disabled'}>Reanudar (+10 %)</button></div>`).join('')}</div>` : ''}
      <div class="rs-h">Terminadas</div><span class="rs-note">${s.works.filter(w => w.status === 'done').map(w => esc(WORK_SHORT[w.type] + ' · ' + CORRIDOR[w.corridor].short)).join(' · ') || '—'}</span>`;
  }
  function fleetPage() {
    const status = {service: 'En servicio', revision: 'Revisión', broken: 'Averiado', arriving: 'En fábrica'};
    return `${head('Flota', plural(s.fleet.length, 'tren', 'trenes'))}
      <div style="margin-top:12px"><button class="rs-btn primary" data-a="plan-buy">${icon('comprar')} Comprar o alquilar</button></div>
      <div class="rs-h">Trenes</div><div class="rs-rows">${s.fleet.map(t => `<div class="r"><span><b style="font-family:var(--sans);color:var(--t)">${esc(t.name)}</b> · ${esc(OFFER[t.offer].model)} · ${status[t.status] || t.status}${t.weeks && t.status !== 'service' ? ' ' + t.weeks + ' sem' : ''}${t.corridor ? ' · ' + esc(CORRIDOR[t.corridor].short) : ''}</span>
        <span style="display:flex;gap:10px;align-items:center"><b style="color:${t.condition < 45 ? 'var(--bad)' : t.condition < 65 ? 'var(--gold)' : 'var(--good)'}">${Math.round(t.condition)} %</b>${t.status === 'service' ? `<button class="rs-btn" style="height:30px" data-a="revision" data-id="${t.id}" ${R.ordersLeft(s) ? '' : 'disabled'}>Revisión</button>` : ''}</span></div>`).join('')}</div>
      <p class="rs-note">Revisión: ${fmt(R.revisionCost(s))} · ${plural(R.revisionWeeks(s), 'semana', 'semanas')} sin circular.</p>`;
  }
  function pactTerms(d, p) {
    return `<div class="rs-terms"><div class="a"><b>Ganas</b>${esc(d.benefit)}</div><div class="b"><b>Te obliga</b>${esc(d.obligation)}</div><div class="c"><b>Plazo</b>${p ? 'Semana ' + p.deadline : plural(d.weeks, 'semana', 'semanas')}</div><div class="d"><b>Si fallas</b>${esc(d.consequence)}</div></div>`;
  }
  function pactsPage() {
    const active = R.activePacts(s);
    const card = (d, extra, p) => `<div class="rs-tile"><div class="rs-bribe"><img src="${faceURL(d.person, d.mood)}" alt=""><div><h3>${esc(d.title)}</h3><span class="rs-note">${esc(nameOf(d.person))}</span></div></div>${pactTerms(d, p)}${extra}</div>`;
    return `${head('Pactos', `${active.length} de 2 activos`)}
      <div class="rs-h">Activos</div><div class="rs-grid" style="grid-template-columns:1fr">${active.map(p => card(R.pactTerms(p), '', p)).join('') || '<span class="rs-note">Ninguno.</span>'}</div>
      <div class="rs-h">Sobre la mesa</div><div class="rs-grid" style="grid-template-columns:1fr">${s.offers.map(o => card(PACT[o.id], `<div style="display:flex;gap:6px;margin-top:8px"><button class="rs-btn primary" data-a="pact" data-id="${o.id}" data-r="accept">Aceptar</button><button class="rs-btn" data-a="pact" data-id="${o.id}" data-r="negotiate" ${o.negotiated ? 'disabled' : ''}>Negociar</button><button class="rs-btn" data-a="pact" data-id="${o.id}" data-r="reject">Rechazar</button></div>`)).join('') || '<span class="rs-note">Nadie propone nada.</span>'}</div>`;
  }
  function progressPage() {
    const next = R.nextMilestone(s), pax = R.totalPax(s);
    return `${head('Progreso', mil(pax) + ' viajeros/sem')}
      <div class="rs-h">Hitos</div><div class="rs-track">${MILESTONES.slice(1).map(m => { const got = s.milestones.includes(m.id); return `<div class="rs-tile ${got ? 'on' : m === next ? '' : 'off'}"><div class="big">${m.pax}k</div><h3>${esc(m.name)}</h3><div class="k">${esc(m.unlocks.slice(0, 2).join(' · '))}</div>${m === next ? `<div class="rs-pips"><i class="on" style="flex:none;width:${Math.min(100, pax / m.pax * 100)}%"></i></div>` : ''}</div>`; }).join('')}</div>
      <div class="rs-h">Programa ferroviario</div><div class="rs-rows">${PROGRAM.map(x => `<div class="r"><span>${s.program[x.id] ? '✓' : '○'} ${esc(x.label)}</span><b>${s.program[x.id] ? 'sem. ' + s.program[x.id] : ''}</b></div>`).join('')}</div>
      <div class="rs-h">Etapas</div><div class="rs-track">${STAGES.map((st, i) => `<div class="rs-tile ${s.stageResults[st.id] === 'pass' ? 'on' : i > s.stageIdx ? 'off' : ''}"><div class="k">${st.from}–${st.to}</div><h3>${esc(STAGE_TITLE[st.id])}</h3><div class="k">${s.stageResults[st.id] === 'pass' ? '✓ cumplida' : s.stageResults[st.id] === 'fail' ? '✗ incumplida' : i === s.stageIdx ? 'en curso' : ''}</div></div>`).join('')}</div>
      <p class="rs-note">Incumplimientos graves ${s.breaches.grave}/3 · leves ${s.breaches.leve}/3</p>`;
  }
  function techPage() {
    return `${head('Tecnología', s.stars + ' ★')}
      <div class="rs-tree" style="margin-top:16px">${Object.entries(TECH_BRANCHES).map(([b, name]) => `<div class="rs-branch"><h3>${esc(name)}</h3>${TECHS.filter(t => t.branch === b).map(t => { const st = R.techState(s, t.id), cls = st.owned ? 'owned' : st.ok ? 'ready' : 'locked'; return `<button class="rs-tech ${cls}" data-a="tech" data-id="${t.id}" title="${esc(t.effect + (st.reasons?.[0] ? ' — ' + st.reasons[0] : ''))}"><span class="ico">${icon('tecnologia')}</span>${img('tech-' + t.id)}<span class="lvl">${t.tier}</span><div class="txt"><b>${esc(t.name)}</b><div class="price">${st.owned ? '✓' : `<span>${t.stars} ★</span><span>${fmt(t.cost)}</span>`}</div></div></button>`; }).join('')}</div>`).join('')}</div>`;
  }
  function techModal(id) {
    const t = TECH[id], st = R.techState(s, id);
    openModal(`${X}${img('tech-' + id, 'rs-banner')}<div class="body"><div class="rs-kick">${esc(TECH_BRANCHES[t.branch])} · nivel ${t.tier}</div><h1>${esc(t.name)}</h1><p class="rs-lead">${esc(t.effect)}</p>
      <div>${(st.reasons || []).map(r => `<span class="rs-flag bad">${esc(r)}</span>`).join('')}</div>
      <div class="rs-foot"><button class="rs-btn primary" data-a="research" data-id="${id}" ${st.ok ? '' : 'disabled'}>${st.owned ? 'Desbloqueada' : `Desbloquear · ${t.stars} ★ · ${fmt(t.cost)}`}</button></div></div>`, 'tech');
  }
  function megaPage() {
    return `${head('Megaobras', 'Grandes obras por etapas')}<div class="rs-megas" style="margin-top:16px">${MEGAPROJECTS.map(m => { const st = R.megaState(s, m.id), cur = s.megas[m.id]?.stage || 0, active = s.megas[m.id]?.active, open = s.milestones.includes(m.tier), next = m.stages[cur];
      return `<div class="rs-mega"><div class="pic">${icon('mega')}${img('mega-' + m.id)}</div><div><div class="rs-kick">${cur}/4 · ${esc(next ? next.name : 'terminado')}</div><h3 style="font:700 20px/1.15 var(--serif);margin:6px 0 2px">${esc(m.name)}</h3>
        <div class="rs-pips">${m.stages.map((x, i) => `<i class="${i < cur ? 'done' : i === cur && active ? 'on' : ''}" title="${esc(x.name + ': ' + x.bonus)}"></i>`).join('')}</div>
        ${!open ? `<span class="rs-flag info">🔒 ${esc(MILESTONES.find(x => x.id === m.tier).name)}</span>` : st.done ? '<span class="rs-flag ok">✓ Terminado</span>' : active ? `<span class="rs-flag info">${plural(active.left, 'semana', 'semanas')}</span>` : `<div class="rs-needs">${next.needs.map(n => { const a = R.achievement(s, n); return `<span class="rs-need ${a.ok ? 'ok' : ''}" title="${esc(ACHIEVEMENTS[n].label)}">${a.ok ? '✓' : '○'} ${esc(NEED_SHORT[n] || ACHIEVEMENTS[n].label)}</span>`; }).join('')}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="rs-btn primary" data-a="mega" data-id="${m.id}" ${st.ok && R.ordersLeft(s) ? '' : 'disabled'}>Etapa ${cur + 1} · ${fmt(next.cost)}</button><span class="rs-note">${next.weeks} sem${next.crews ? ' · ' + plural(next.crews, 'cuadrilla', 'cuadrillas') : ''} · ${esc(next.bonus)}</span></div>`}
        </div></div>`; }).join('')}</div>`;
  }
  function electionPage() {
    const f = R.electionForecast(s);
    return `${head(f.next ? `Elecciones · ${R.dateLabel(f.next, {month: 'long', year: 'numeric'})}` : 'Elecciones', 'Encuesta')}
      <div class="rs-gauge"><div class="big ${f.vote >= 50 ? 'pos' : 'neg'}">${pct(f.vote)}</div><div class="rs-vote"><i style="width:${Math.min(100, f.vote)}%"></i></div></div>
      <div class="rs-groups">${f.rows.map(r => `<div class="rs-tile"><div class="k">${esc(GROUPS[r.id].short)} · ${Math.round(r.weight * 100)} %</div><div class="big">${pct(r.avg)}</div>
        <ul>${r.causes.filter(c => c.label !== 'Base').sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3).map(c => `<li><span>${esc(c.label.replace(/:.*$/, '').replace(/ \d+ %$/, ''))}</span><b class="${c.value >= 0 ? 'pos' : 'neg'}">${c.value >= 0 ? '+' : '−'}${Math.abs(Math.round(c.value))}</b></li>`).join('')}</ul></div>`).join('')}</div>
      ${s.elections.length ? `<div class="rs-h">Resultados</div>${s.elections.map(e => `<span class="rs-flag ${e.won ? 'ok' : 'bad'}">Sem. ${e.week}: ${pct(e.vote)}</span>`).join('')}` : ''}`;
  }
  function cloacasPage() {
    const k = s.cloacas;
    return `<div class="rs-dark">${head('Cloacas', fmt(k.cajaB) + ' en caja B')}
      <div class="rs-grid" style="grid-template-columns:1fr 1fr"><div><span class="rs-note">Sospecha ${Math.round(k.suspicion)}</span><div class="rs-meter"><i style="width:${Math.min(100, k.suspicion)}%"></i></div></div><div><span class="rs-note">Pruebas ${Math.round(k.evidence)}</span><div class="rs-meter"><i style="width:${Math.min(100, k.evidence)}%"></i></div></div></div>
      <div class="rs-steps">${JUDICIAL.map((j, i) => `<span class="${i === k.stage ? 'on' : ''}">${esc(j)}</span>`).join('')}</div>
      <div class="rs-h">Sobres</div><div class="rs-grid">${BRIBES.map(b => { const st = R.bribeState(s, b.id); return `<div class="rs-tile"><div class="rs-bribe">${b.person ? `<img src="${faceURL(b.person, 'surprised')}" alt="">` : ''}<div><h3>${esc(b.target)}</h3><span class="rs-note">${fmt(b.cost)} · sospecha +${b.suspicion}</span></div></div><span class="rs-note">${esc(b.effect)}</span><button class="rs-btn" data-a="bribe" data-id="${b.id}" ${st.ok ? '' : 'disabled'}>Pasar el sobre</button></div>`; }).join('')}</div></div>`;
  }
  function gacetaPage() {
    return `${head('Prensa', 'La Gaceta del Raíl')}<div class="rs-rows" style="margin-top:12px">${s.gaceta.map(g => `<div class="r"><span style="font:600 15px/1.35 var(--serif);color:var(--t)">${esc(g.text)}</span><b class="rs-note">sem. ${g.week}</b></div>`).join('')}</div>`;
  }
  function helpPage() {
    return `${head('Cómo se juega', 'Rescate de Tenfe')}
      <div class="rs-grid" style="margin-top:14px">${[['Misión', 'Objetivo, plazo y obstáculos. Pulsa un obstáculo.'], ['3 órdenes', 'Obra, servicio, contratar, comprar o pactar. Mirar es gratis.'], ['Cerrar semana', 'Trenes, billetes, costes y obras. ⏩ avanza hasta la próxima decisión.'], ['Ganar', 'Programa cumplido, dos elecciones y cuentas sin rescates.']].map(([t, d]) => `<div class="rs-tile"><h3>${t}</h3><span class="rs-note">${d}</span></div>`).join('')}</div>
      <div class="rs-foot"><button class="rs-btn" data-a="tutorial-restart">Repetir tutorial</button></div>`;
  }

  // ---------------------------------------------------------------- decisiones
  function decisionImage(d) {
    if (d.kind === 'event') return 'evento-' + d.id;
    if (d.kind === 'scandal' || d.kind === 'corruption') return 'escandalo-' + d.id;
    if (d.kind === 'stage-intro') return 'etapa-' + (STAGES.find(x => x.name === d.title)?.id || 's1');
    return {extortion: 'extorsion', insolvency: 'impago', milestone: 'hito', election: 'elecciones', review: 'elecciones'}[d.kind] || (/jud-/.test(d.line || '') ? 'juzgado' : null);
  }
  function nextDecision() {
    if (!root.isConnected || modal.open || sheet.open || ui.closing) return;
    if (s.ended) return showEnd();
    const d = s.decisions[0];
    if (!d) { render(); return; }
    const line = d.line && LINES[d.line] ? d.line : null, pic = decisionImage(d);
    const extra = d.text && d.kind !== 'stage-intro' && (!line || d.text !== LINES[line].text) ? `<p class="rs-lead" style="margin-top:12px">${esc(d.text)}</p>` : '';
    const choices = (d.choices || [{label: d.kind === 'stage-intro' ? 'A trabajar' : 'Seguir', fx: 'none'}]).map((c, i) => `<button class="rs-choice ${!d.choices ? 'main' : ''}" data-a="choose" data-i="${i}"><b>${esc(c.label)}</b>${c.note ? `<span>${esc(c.note)}</span>` : ''}</button>`).join('');
    const kicker = {event: 'Imprevisto', scandal: 'Escándalo', corruption: 'Propuesta discreta', extortion: 'Extorsión', insolvency: 'Impago', 'stage-intro': 'Nueva etapa', stage: 'Fin de etapa', milestone: 'Hito', election: 'Elecciones', review: 'Revisión política', mega: 'Megaobra'}[d.kind] || 'Aviso';
    const title = d.kind === 'stage-intro' ? STAGE_TITLE[STAGES.find(x => x.name === d.title)?.id] || d.title : d.title;
    openModal(`${pic ? img(pic, 'rs-banner') : ''}<div class="body"><div class="rs-kick">${kicker}</div><h1>${esc(title)}</h1>${line ? talk(line) : ''}${extra}<div class="rs-choices">${choices}</div></div>`, 'decision');
    play(d.kind === 'milestone' || d.kind === 'election' ? 'celebrate' : d.kind === 'scandal' || d.kind === 'insolvency' ? 'error' : 'open');
    autoSpeak(modal);
  }
  function choose(i) {
    const d = s.decisions[0], note = R.answer(s, 0, i);
    play('decision'); save(); stopVoice(); modal.close(); ui.modal = null;
    if (note) toast(note);
    map.dirty = true; render();
    if (d?.kind === 'review') page('elecciones');
  }
  function showOffer(id) {
    const d = PACT[id], o = s.offers.find(x => x.id === id);
    openModal(`<div class="body"><div class="rs-kick">Propuesta · hasta sem. ${o?.expires}</div><h1>${esc(d.title)}</h1>${talk(d.line)}${pactTerms(d)}
      <div class="rs-choices"><button class="rs-choice main" data-a="pact" data-id="${id}" data-r="accept"><b>Aceptar</b><span>1 orden</span></button>
      <button class="rs-choice" data-a="pact" data-id="${id}" data-r="negotiate" ${o?.negotiated ? 'disabled' : ''}><b>Negociar más barato</b><span>1 orden · puede salir mal</span></button>
      <button class="rs-choice" data-a="pact" data-id="${id}" data-r="reject"><b>Rechazar</b><span>gratis</span></button></div></div>`, 'offer');
    autoSpeak(modal);
  }
  function respondPact(id, r) {
    const out = attempt(() => R.respondPact(s, id, r), null, r === 'reject' ? 'dismiss' : 'contract');
    if (!out) return;
    if (modal.open) { stopVoice(); modal.close(); }
    const L = out.result === 'cheaper' ? 'negotiate-ok' : out.result === 'refused' ? 'negotiate-no' : null;
    toast({accepted: 'Pacto firmado', cheaper: 'Versión rebajada firmada', refused: 'Sin rebaja', rejected: 'Rechazado'}[out.result]);
    if (L) setTimeout(() => { openModal(`<div class="body"><h1>${out.result === 'cheaper' ? 'Trato hecho' : 'Sin rebaja'}</h1>${talk(L)}<div class="rs-choices"><button class="rs-choice main" data-a="close"><b>Seguir</b></button></div></div>`, 'negotiation'); autoSpeak(modal); }, 50);
    if (ui.page === 'pactos') page('pactos');
  }

  // ---------------------------------------------------------------- cerrar semana
  function closeWeek(multi = false) {
    if (s.ended) return showEnd();
    if (s.decisions.some(d => d.choices)) { nextDecision(); return; }
    ui.closing = true; play('dayEnd');
    const before = Object.fromEntries(CORRIDORS.map(d => [d.id, s.corridors[d.id].pax]));
    let reports;
    try { reports = multi ? R.advance(s) : [R.closeWeek(s)]; }
    catch (e) { ui.closing = false; toast(e.message); play('error'); return; }
    save();
    const now = performance.now();
    ui.popups = CORRIDORS.filter(d => s.corridors[d.id].open).map(d => { const c = s.corridors[d.id], n = NODE(d.way[Math.floor(d.way.length / 2)]); return {lon: n.lon, lat: n.lat, born: now, text: mil(c.pax), sub: signed(c.revenue - c.cost), color: c.pax >= before[d.id] ? '#3f7d4e' : '#c23b2f'}; });
    map.dirty = true; ui.closing = false; render();
    const last = reports[reports.length - 1];
    toast(multi ? `${plural(reports.length, 'semana', 'semanas')} · ${signed(reports.reduce((n, r) => n + r.cashDelta, 0))}` : `Semana ${last.week} · ${signed(last.cashDelta)}`);
    nextDecision();
  }
  function showEnd() {
    if (!s.ended) return;
    const v = R.finalVerdict(s), e = s.ended;
    const line = e.kind === 'win' ? 'end-win' : e.reason === 'condena' ? 'jud-end' : e.reason === 'quiebra' ? 'fin-quiebra' : e.reason === 'retirada' ? 'fin-retirada' : e.reason === 'elecciones' ? 'el-lose' : 'end-partial';
    openModal(`${img(e.kind === 'win' ? 'fin-victoria' : 'fin-derrota', 'rs-banner')}<div class="body"><div class="rs-kick">${e.kind === 'win' ? 'Victoria' : e.kind === 'partial' ? 'Fin del mandato' : 'Derrota'} · semana ${e.week}</div><h1>${esc(e.text)}</h1>${talk(line)}
      <div class="rs-kpis"><div class="rs-kpi"><b>${PROGRAM.filter(x => s.program[x.id]).length}/${PROGRAM.length}</b><span>programa</span></div><div class="rs-kpi"><b>${s.elections.map(x => (x.won ? '✓ ' : '✗ ') + pct(x.vote)).join(' ') || '—'}</b><span>elecciones</span></div><div class="rs-kpi"><b>${signed(v.ordinary)}</b><span>resultado/sem</span></div><div class="rs-kpi"><b>${mil(R.totalPax(s))}</b><span>viajeros</span></div></div>
      <div class="rs-foot"><button class="rs-btn" data-a="exit">Menú</button><button class="rs-btn primary" data-a="new-game">Nueva partida</button></div></div>`, 'end');
    autoSpeak(modal);
  }

  // ---------------------------------------------------------------- tutorial
  function coach() {
    root.querySelectorAll('.rs-focus').forEach(x => x.classList.remove('rs-focus'));
    root.querySelectorAll('.rs-coach').forEach(x => x.remove());
    if (ui.tutorial < 0 || ui.tutorial >= TUTORIAL.length) return;
    const step = TUTORIAL[ui.tutorial];
    if (step.done && step.done(ui, s)) { advanceTutorial(); return; }
    if ((modal.open && !step.inModal) || (!modal.open && step.inModal) || sheet.open) return;
    const L = LINES[step.line];
    const html = `<div class="rs-coach rs-glass" data-step="${ui.tutorial}"><img src="${faceURL(L.person, L.mood)}" alt=""><div style="min-width:0;flex:1"><div class="who"><b>${esc(nameOf(L.person))}</b> · ${ui.tutorial + 1}/${TUTORIAL.length}</div><p class="say" data-line="${step.line}">${esc(L.text)}</p>
      <div class="row">${step.task ? `<span class="task">→ ${esc(step.task)}</span>` : ''}${step.next ? `<button class="rs-btn primary" data-a="tutorial-next">${esc(step.next)}</button>` : ''}<button class="skip" data-a="tutorial-skip">Saltar</button></div></div></div>`;
    const host = modal.open ? modal.querySelector('.inner') : root;
    host.insertAdjacentHTML(host === root ? 'beforeend' : 'afterbegin', html);
    const target = (modal.open ? modal : root).querySelector(step.focus) || root.querySelector(step.focus);
    target?.classList.add('rs-focus');
    if (ui.spoken !== ui.tutorial) { ui.spoken = ui.tutorial; speak(step.line, host.querySelector('.rs-coach .say')); }
  }
  function advanceTutorial() {
    ui.tutorial++; s.tutorial.step = ui.tutorial;
    if (ui.tutorial >= TUTORIAL.length) { ui.tutorial = -1; s.tutorial.done = true; play('celebrate'); } else play('tutorialNext');
    save(); setTimeout(coach, 30);
  }

  // ---------------------------------------------------------------- mapa
  function pick(hit) {
    if (!hit) { if (ui.selected) { ui.selected = null; map.selected = null; play('deselect'); render(); } return; }
    if (hit.type === 'territory') { play('pickCity'); territoryModal(hit.id); return; }
    ui.selected = hit.id; map.selected = hit.id; play('pickRoute'); render();
  }
  function select(id) { ui.selected = id; map.selected = id; map.fit(CORRIDOR[id].way.map(n => [NODE(n).lon, NODE(n).lat]), 6); render(); }

  // ---------------------------------------------------------------- acciones
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-a],[data-page]');
    if (!b || b.disabled) return;
    if (b.dataset.page && !b.dataset.a) { page(b.dataset.page); return; }
    const a = b.dataset.a, id = b.dataset.id;
    switch (a) {
      case 'close': if (b.closest('.rs-sheet')) sheet.close(); else if (b.closest('.rs-modal')) closeModal(); else { ui.selected = null; map.selected = null; play('dismiss'); render(); } break;
      case 'layer': ui.layer = id; map.setLayer(id); play('lever'); render(); break;
      case 'select': if (modal.open) closeModal(); if (sheet.open) sheet.close(); select(id); break;
      case 'obstacle': { const o = R.obstacles(s)[+b.dataset.i]; if (!o) break;
        if (o.corridor) select(o.corridor);
        if (o.action === 'work:renovar') planWork(o.corridor, 'renovar');
        else if (o.action === 'service') planService(o.corridor);
        else if (o.action === 'fleet') page('flota');
        else if (o.action === 'crews' || o.action === 'works') page('obras');
        else if (o.action === 'finance') page('finanzas');
        else if (o.action === 'cloacas') page('cloacas');
        else if (o.action === 'license') territoryModal(CORRIDOR[o.corridor].territory);
        else if (o.action === 'open') planOpen(o.corridor);
        break; }
      case 'offer': showOffer(id); break;
      case 'decisions': nextDecision(); break;
      case 'plan-work': planWork(id, b.dataset.type); break;
      case 'plan-type': ui.plan.type = id; drawWorkPlan(); play('tab'); break;
      case 'plan-mode': ui.plan.mode = id; drawWorkPlan(); play('tick'); break;
      case 'confirm-work': if (attempt(() => R.startWork(s, ui.plan.id, ui.plan.type, ui.plan.mode, ui.plan.accelerate, ui.plan.kickback), 'Obra aprobada', 'infra')) closeModal(); break;
      case 'plan-service': planService(id); break;
      case 'confirm-service': if (attempt(() => R.reorganize(s, ui.plan.id, ui.plan), 'Servicio cambiado', 'openRoute')) closeModal(); break;
      case 'plan-buy': if (sheet.open) sheet.close(); planBuy(id || ui.selected); break;
      case 'confirm-buy': if (attempt(() => R.buyTrain(s, id, ui.plan.kick), q => `Llega en la semana ${q.arrives}`, 'contract')) drawBuy(); break;
      case 'rent': if (attempt(() => R.rentTrain(s), 'Tren alquilado', 'contract')) drawBuy(); break;
      case 'plan-open': planOpen(id); break;
      case 'confirm-open': if (attempt(() => R.openCorridor(s, id, +b.dataset.n || 1, true), 'Corredor abierto', 'openRoute')) { closeModal(); select(id); } break;
      case 'territory': territoryModal(id); break;
      case 'confirm-license': if (attempt(() => R.licenseTerritory(s, id), 'Licencia concedida', 'contract')) territoryModal(id); break;
      case 'accelerate': attempt(() => R.accelerateWork(s, id), r => `−${plural(r.cut, 'semana', 'semanas')} · +${fmt(r.extra)}`, 'infra'); if (ui.page) page(ui.page); break;
      case 'cancel-work': { const q = R.cancelQuote(s, id); if (confirm(`¿Cancelar? Ahorras ${fmt(q.saved)}${q.penalty ? `, penalización ${fmt(q.penalty)}` : ''}${q.incomplete ? ', queda a medias' : ''}.`)) attempt(() => R.cancelWork(s, id), 'Obra cancelada', 'dismiss'); if (ui.page) page(ui.page); break; }
      case 'resume-work': if (attempt(() => R.resumeWork(s, id), r => `Reanudada · +${fmt(r.extra)}`, 'infra')) page('obras'); break;
      case 'choose': choose(+b.dataset.i); break;
      case 'pact': respondPact(id, b.dataset.r); break;
      case 'loan': if (attempt(() => R.takeLoan(s, +id), q => `${q.installments} cuotas de ${fmt(q.per)}`, 'borrow')) page('finanzas'); break;
      case 'hire': if (attempt(() => R.hireCrew(s, id), id === 'own' ? 'Llega en 2 semanas' : 'Subcontratada 12 semanas', 'contract')) page('obras'); break;
      case 'fire': if (confirm('¿Despedir una cuadrilla?') && attempt(() => R.fireCrew(s), 'Cuadrilla despedida', 'sell')) page('obras'); break;
      case 'station': if (attempt(() => R.buildStation(s), 'Empieza el apeadero', 'infra')) page('obras'); break;
      case 'revision': if (attempt(() => R.sendRevision(s, id), r => `Al taller ${plural(r.weeks, 'semana', 'semanas')}`, 'refurbish')) page('flota'); break;
      case 'tech': techModal(id); break;
      case 'research': if (attempt(() => R.research(s, id), 'Desbloqueada', 'celebrate')) { closeModal(); page('tecnologia'); } break;
      case 'mega': if (attempt(() => R.startMegaStage(s, id), 'Etapa en marcha', 'infra')) page('mega'); break;
      case 'bribe': { const r = attempt(() => R.bribe(s, id), x => x.text, 'punch'); if (r) { page('cloacas'); if (s.decisions.length) { sheet.close(); nextDecision(); } else if (id === 'alcalde' && r.ok) { sheet.close(); openModal(`<div class="body"><div class="rs-kick">Sobre entregado</div><h1>Aquí no ha pasado nada</h1>${talk('paco-sobre')}<div class="rs-choices"><button class="rs-choice main" data-a="close"><b>Seguir</b></button></div></div>`, 'bribe'); autoSpeak(modal); } } break; }
      case 'close-week': closeWeek(false); break;
      case 'advance': closeWeek(true); break;
      case 'replay': speak(b.dataset.line, b.parentElement.querySelector('.say')); break;
      case 'tutorial-next': if (TUTORIAL[ui.tutorial]?.final) stopVoice(); advanceTutorial(); break;
      case 'tutorial-skip': ui.tutorial = -1; s.tutorial.done = true; stopVoice(); save(); coach(); play('dismiss'); break;
      case 'tutorial-restart': ui.tutorial = 0; ui.spoken = -1; s.tutorial = {step: 0, done: false}; sheet.close(); coach(); break;
      case 'game-menu': openModal(`<div class="body">${X}<h1>Partida</h1><div class="rs-choices"><button class="rs-choice main" data-a="close"><b>Seguir jugando</b></button><button class="rs-choice" data-a="export"><b>Exportar</b><span>.json</span></button><button class="rs-choice" data-a="import"><b>Importar</b></button><button class="rs-choice" data-a="exit"><b>Menú principal</b><span>se guarda sola</span></button><button class="rs-choice" data-a="new-game"><b>Nueva partida</b></button></div>${seedCodeOf(s) ? `<p class="rs-seed">Semilla <b>${esc(seedCodeOf(s))}</b></p>` : ''}</div>`, 'menu'); break;
      case 'export': { const blob = new Blob([R.serialize(s)], {type: 'application/json'}); const el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = `rescate-tenfe-semana-${s.week}.json`; el.click(); setTimeout(() => URL.revokeObjectURL(el.href), 4000); play('export'); break; }
      case 'import': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json'; inp.onchange = async () => { try { s = R.load(await inp.files[0].text()); save(); closeModal(); map.dirty = true; render(); toast('Partida cargada'); } catch (err) { toast(err.message); } }; inp.click(); break; }
      case 'new-game': stopVoice(); if (modal.open) modal.close(); destroy(); onExit?.({newGame: true}); break; // la pantalla «Nueva partida» de la portada
      case 'exit': stopVoice(); if (modal.open) modal.close(); destroy(); onExit?.(); break;
    }
  });
  root.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.a === 'svc') { ui.plan[t.dataset.k] = +t.value; if (t.dataset.k === 'trains') ui.plan.express = Math.min(ui.plan.express, ui.plan.trains); drawServicePlan(); try { sfx?.slide?.(t); } catch {} }
    if (t.dataset.a === 'slider') { s.sliders[t.dataset.k] = +t.value / 100; save(); renderTop(); t.previousElementSibling.querySelector('b').textContent = t.value + ' %'; }
  });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.a === 'plan-accel') { ui.plan.accelerate = t.checked; drawWorkPlan(); }
    if (t.dataset.a === 'plan-kick') { ui.plan.kickback = t.checked; drawWorkPlan(); }
    if (t.dataset.a === 'buy-kick') { ui.plan.kick = t.checked; drawBuy(); }
  });
  function onKey(e) {
    if (root.hidden || modal.open || sheet.open || /INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY/.test(document.activeElement?.tagName)) return;
    if (e.key === 'Enter') { e.preventDefault(); closeWeek(e.shiftKey); }
    if (e.key === 'Escape' && ui.selected) { ui.selected = null; map.selected = null; render(); }
  }
  document.addEventListener('keydown', onKey);
  function destroy() { document.removeEventListener('keydown', onKey); stopVoice(); root.hidden = true; root.remove(); }

  render();
  if (s.ended) setTimeout(showEnd, 100);
  else if (s.week === 1 && !s.decisions.length && !s.flags.introShown) { s.flags.introShown = true; s.decisions.push({kind: 'stage-intro', line: 'stage-s1', title: STAGES[0].name, text: STAGES[0].goal}); save(); setTimeout(nextDecision, 120); }
  else setTimeout(nextDecision, 120);
  const api = {state: () => s, ui: () => ui, pick, select, closeWeek, page, map, destroy, nextDecision};
  window.tenfeRescue = api;
  return api;
}
