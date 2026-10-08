import {CHARACTERS, CHAPTERS} from './story.js';
import {faceURL} from './faces.js';
import {effectiveMonth} from './engine.js';

// La portada vive dentro del diálogo principal. Todas las acciones las resuelve app.js.
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value || 0).toLocaleString('es-ES', {maximumFractionDigits:0});
const icon = name => {
  const paths = {
    train:'<rect x="6" y="3" width="12" height="15" rx="4"/><path d="M7 10h10M10 18l-3 3m7-3 3 3M9 6h6"/><path d="M9 14h.01M15 14h.01"/>',
    resume:'<path d="M9 5l11 7-11 7z"/><path d="M4 5v14"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="M16 8l-3 5-5 3 3-5z"/>',
    book:'<path d="M3 4h6a3 3 0 013 3v14a4 4 0 00-4-2H3zM21 4h-6a3 3 0 00-3 3v14a4 4 0 014-2h5z"/>',
    settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.train}</svg>`;
};

function savedSummary(saved) {
  const month = Math.max(0, effectiveMonth(saved));
  const date = new Date(Date.UTC(2022 + Math.floor(month / 12), month % 12, 1)).toLocaleDateString('es-ES', {month:'long', year:'numeric', timeZone:'UTC'});
  const mode = saved.tycoon?.mode === 'free' ? 'Modo libre' : CHAPTERS[saved.chapter]?.title || 'Campaña';
  const routes = Array.isArray(saved.routes) ? saved.routes.filter(route => route.active).length : 0;
  return `<div class="menu-save" aria-label="Resumen de tu partida guardada"><div class="menu-save-heading"><span class="menu-save-dot" aria-hidden="true"></span><span>Tu dirección sigue abierta</span><time>${escapeHTML(date)}</time></div><strong>${escapeHTML(mode)}</strong><dl><div><dt>Caja</dt><dd>${number(saved.cash)} <small>M€</small></dd></div><div><dt>Servicios</dt><dd>${number(routes)}</dd></div><div><dt>Viajeros satisfechos</dt><dd>${number(saved.satisfaction)}<small> %</small></dd></div></dl></div>`;
}

export function menuHTML(saved = null, savedError = '') {
  const cast = Object.entries(CHARACTERS).map(([id, person]) => `<li title="${escapeHTML(person.name)} · ${escapeHTML(person.role)}"><img src="${faceURL(id, id === 'rival' ? 'proud' : 'happy')}" alt="${escapeHTML(person.name)}" width="52" height="66"><span>${escapeHTML(person.name.split(' ')[0])}</span></li>`).join('');
  return `<main class="main-menu" aria-labelledby="menu-title">
    <div class="main-menu-art" role="img" aria-label="Un tren de alta velocidad entra en una estación española al amanecer, entre viaductos y colinas."></div>
    <div class="main-menu-grain" aria-hidden="true"></div>
    <header class="menu-masthead"><span class="menu-railmark" aria-hidden="true">${icon('train')}</span><span>Gestión ferroviaria <i>·</i> España, 2022–2050</span><span class="menu-edition">AVE · ALVIA · POLÍTICA</span></header>
    <div class="menu-body">
      <section class="menu-world">
        <div class="menu-eyebrow"><span aria-hidden="true"></span>Tu próximo gran marrón</div>
        <h1 id="menu-title">Iberia<br><em>Ferroviaria</em></h1>
        <p class="menu-tagline">Todo un país. <br>Nueve egos. Tus vías.</p>
        <p class="menu-premise">Dirige Renfe, levanta una red que funcione y pelea cada viajero. Los ministros quieren fotos. Los viajeros, llegar. Charo quiere la factura.</p>
        <div class="menu-journey" aria-label="Lo que harás en el juego"><span>Programa trenes</span><b aria-hidden="true">→</b><span>Construye tu red</span><b aria-hidden="true">→</b><span>Sobrevive al despacho</span></div>
      </section>
      <section class="menu-departures" aria-labelledby="menu-departures-title">
        <div class="menu-panel-kicker">Estación de salida <span aria-hidden="true">01</span></div>
        <h2 id="menu-departures-title">¿Adónde vamos?</h2>
        ${savedError ? `<p class="menu-save-error" role="status">${escapeHTML(savedError)}</p>` : ''}
        ${saved ? `${savedSummary(saved)}<button class="menu-destination menu-continue" data-action="continue" autofocus>${icon('resume')}<span><strong>Continuar partida</strong><small>La red no se arregla sola.</small></span><b aria-hidden="true">→</b></button>` : ''}
        <button class="menu-destination menu-campaign ${saved ? 'has-save' : ''}" data-action="begin" ${saved ? '' : 'autofocus'}>${icon('train')}<span><strong>${saved ? 'Nueva campaña' : 'Asumir la dirección'}</strong><small>Empieza en 2022 con una primera misión guiada.</small></span><b aria-hidden="true">→</b></button>
        <p class="menu-tutorial-note">Aprende tomando decisiones reales: trenes, dinero, obras y un consejo de dirección con demasiadas opiniones.</p>
        <button class="menu-destination menu-free" data-action="free-setup">${icon('compass')}<span><strong>Modo libre</strong><small>Elige tu presupuesto y construye a tu ritmo.</small></span><b aria-hidden="true">→</b></button>
        <div class="menu-secondary"><button data-action="menu-guide">${icon('book')}<span>Guía del director</span></button><button data-action="menu-settings">${icon('settings')}<span>Sonido y ajustes</span></button></div>
        <button class="menu-observe" data-action="observe">${icon('eye')}<span>Solo mirar los trenes</span><b aria-hidden="true">→</b></button>
        <p class="menu-save-note">${saved ? 'Una campaña nueva sustituye el guardado automático.' : 'Tu partida se guarda automáticamente en este navegador.'} · Versión 3.6.3</p>
      </section>
    </div>
    <footer class="menu-council"><div class="menu-council-label"><strong>El consejo te espera.</strong><span>Y cada cual quiere algo distinto.</span></div><ul aria-label="Los nueve personajes de tu consejo de dirección">${cast}</ul><span class="menu-footer-note">Un billete al poder.<br>Sin derecho a devolución.</span></footer>
  </main>`;
}
