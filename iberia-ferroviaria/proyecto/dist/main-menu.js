import {CHARACTERS} from './story.js';
import {faceURL} from './faces.js';
import {brandLogo} from './brands.js';
import {savedGames} from './nueva-partida.js';

// La portada vive dentro del diálogo principal. Todas las acciones las resuelve app.js.
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => {
  const paths = {
    train:'<rect x="6" y="3" width="12" height="15" rx="4"/><path d="M7 10h10M10 18l-3 3m7-3 3 3M9 6h6"/><path d="M9 14h.01M15 14h.01"/>',
    resume:'<path d="M9 5l11 7-11 7z"/><path d="M4 5v14"/>',
    book:'<path d="M3 4h6a3 3 0 013 3v14a4 4 0 00-4-2H3zM21 4h-6a3 3 0 00-3 3v14a4 4 0 014-2h5z"/>',
    settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.train}</svg>`;
};

/** «La herencia · marzo de 2023» o «El rescate · semana 12». */
const where = game => `${escapeHTML(game.title)} · ${game.date ? `<time>${escapeHTML(game.where)}</time>` : escapeHTML(game.where)}`;

/** Portada: un solo «Nueva partida» y, si hay algo guardado, «Continuar» con la partida más reciente. */
export function menuHTML(saved = null, savedError = '', rescue = null) {
  const [latest, other] = savedGames(saved, rescue);
  const cast = Object.entries(CHARACTERS).map(([id, person]) => `<li title="${escapeHTML(person.name)} · ${escapeHTML(person.role)}"><img src="${faceURL(id, id === 'rival' ? 'proud' : 'happy')}" alt="${escapeHTML(person.name)}" width="52" height="66"><span>${escapeHTML(person.name.split(' ')[0])}</span></li>`).join('');
  return `<main class="main-menu" aria-labelledby="menu-title">
    <div class="main-menu-art" role="img" aria-label="Un tren de alta velocidad entra en una estación española al amanecer, entre viaductos y colinas."></div>
    <div class="main-menu-grain" aria-hidden="true"></div>
    <header class="menu-masthead"><span style="display:inline-flex;align-items:center;flex:none;width:84px;height:28px;">${brandLogo('Tenfe',{variant:'white'})}</span><span>Gestión ferroviaria <i>·</i> España, 2022–2050</span><span class="menu-edition">AVE · ALVIA · POLÍTICA</span></header>
    <div class="menu-body">
      <section class="menu-world">
        <div class="menu-eyebrow"><span aria-hidden="true"></span>Tu próximo gran marrón</div>
        <h1 id="menu-title">Iberia<br><em>Ferroviaria</em></h1>
        <p class="menu-tagline">Todo un país. <br>Nueve egos. Tus vías.</p>
        <p class="menu-premise">Dirige Tenfe, levanta una red que funcione y pelea cada viajero. Los ministros quieren fotos. Los viajeros, llegar. Charo quiere la factura.</p>
        <div class="menu-journey" aria-label="Lo que harás en el juego"><span>Programa trenes</span><b aria-hidden="true">→</b><span>Construye tu red</span><b aria-hidden="true">→</b><span>Sobrevive al despacho</span></div>
      </section>
      <section class="menu-departures" aria-labelledby="menu-departures-title">
        <div class="menu-panel-kicker">Estación de salida <span aria-hidden="true">01</span></div>
        <h2 id="menu-departures-title">¿Adónde vamos?</h2>
        ${savedError ? `<p class="menu-save-error" role="status">${escapeHTML(savedError)}</p>` : ''}
        <button class="menu-destination menu-campaign menu-new" data-action="new-game" autofocus>${icon('train')}<span><strong>Nueva partida</strong><small>2022 · 2027 · Maqueta</small></span><b aria-hidden="true">→</b></button>
        ${latest ? `<button class="menu-destination menu-continue" data-action="continue" data-game="${latest.game}">${icon('resume')}<span><strong>Continuar</strong><small>${where(latest)}</small></span><b aria-hidden="true">→</b></button>` : ''}
        ${other ? `<button class="menu-other" data-action="continue-other" data-game="${other.game}">${icon('resume')}<span>También guardada: ${where(other)}</span><b aria-hidden="true">→</b></button>` : ''}
        <div class="menu-secondary"><button data-action="menu-guide">${icon('book')}<span>Guía del director</span></button><button data-action="menu-settings">${icon('settings')}<span>Sonido y ajustes</span></button></div>
        <button class="menu-observe" data-action="observe">${icon('eye')}<span>Solo mirar los trenes</span><b aria-hidden="true">→</b></button>
        <p class="menu-save-note">Tu partida se guarda automáticamente en este navegador. · Versión 4.0.0</p>
      </section>
    </div>
    <footer class="menu-council"><div class="menu-council-label"><strong>El consejo te espera.</strong><span>Y cada cual quiere algo distinto.</span></div><ul aria-label="Los nueve personajes de tu consejo de dirección">${cast}</ul><span class="menu-footer-note">Un billete al poder.<br>Sin derecho a devolución.</span></footer>
  </main>`;
}
