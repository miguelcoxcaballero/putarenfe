import {savedGames} from './nueva-partida.js';

// Navigation stays in app.js; these screens share the same photographic backdrop.
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const menuPhotoCredit=()=>`<span class="menu-photo-credit">Paracuellos de la Ribera · <a href="https://commons.wikimedia.org/wiki/File:RENFE_Class_103_Paracuellos_de_la_Ribera.jpg" target="_blank" rel="noopener">David Gubler</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a></span>`;
const backdrop=()=>'<div class="main-menu-art" role="img" aria-label="Fotografía de un AVE serie 103 cruzando el viaducto de Paracuellos de la Ribera."></div>';
const where=game=>escapeHTML(game.where);
export function menuHTML(saved=null,savedError='',rescue=null){
 const [latest]=savedGames(saved);
 return `<main class="main-menu menu-home" aria-labelledby="menu-title">
 ${backdrop()}
 <div class="menu-home-body">
 <header class="menu-brand"><h1 id="menu-title"><span class="menu-wordmark">Tenfe</span><span class="menu-subtitle">Conexiones</span></h1><p>Gestión ferroviaria</p></header>
 <nav class="menu-navigation" aria-label="Menú principal">
 <button class="menu-item menu-continue ${latest?'menu-primary':''}" data-action="continue" data-game="classic" ${latest?'autofocus':'disabled aria-describedby="menu-no-save"'}><span>Continuar</span>${latest?`<small>${where(latest)}</small>`:''}</button>
 <button class="menu-item ${latest?'':'menu-primary'}" data-action="new-game" ${latest?'':'autofocus'}>Nueva partida</button>
 <button class="menu-item" data-action="menu-load">Cargar partida</button>
 <button class="menu-item" data-action="menu-settings">Opciones</button>
 <button class="menu-item" data-action="menu-guide">Cómo jugar</button>
 <button class="menu-item menu-observe" data-action="observe">Ver los trenes</button>
 </nav>
 ${savedError?`<p class="menu-save-error" role="status">${escapeHTML(savedError)}</p>`:''}
 ${!latest?'<p class="menu-save-note" id="menu-no-save">Sin partida guardada en este navegador.</p>':''}
 ${rescue?`<button class="menu-legacy" data-action="legacy-preview">Recuperar Rescate anterior · semana ${Number(rescue.week)||1}</button>`:''}
 </div>
 <footer class="menu-council"><span class="menu-version">Versión 6.3.0</span><a href="dialogos.html" target="_blank" rel="noopener">Auditorio</a>${menuPhotoCredit()}</footer>
 </main>`;
}
export function menuScreenHTML(content){
 return `<main class="main-menu menu-subscreen">${backdrop()}<div class="menu-sub-body"><button class="menu-back" data-action="menu-home"><span aria-hidden="true">‹</span> Menú principal</button>${content}</div><footer class="menu-screen-footer">${menuPhotoCredit()}</footer></main>`;
}
export function menuLoadHTML(saved=null){
 const [latest]=savedGames(saved);
 return menuScreenHTML(`<div class="content menu-load-content"><div class="kicker">Partidas</div><h1>Cargar partida</h1>
 ${latest?`<section class="menu-local-save"><span>Guardado automático</span><strong>Tenfe · ${where(latest)}</strong><button class="btn primary" data-action="continue" data-game="classic">Continuar partida</button></section>`:'<p>No hay una partida guardada en este navegador.</p>'}
 <label class="menu-import" for="importSave">Importar una partida<input id="importSave" type="file" accept="application/json,.json"></label><p class="small">Selecciona tu copia .json para continuar en este equipo.</p><p id="menu-import-error" role="alert" hidden></p></div>`);
}
