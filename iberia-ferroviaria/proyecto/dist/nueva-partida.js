import {effectiveMonth, dateOf} from './engine.js';

// Una sola partida: los tres arranques (2022, 2027 y Maqueta), la semilla que hace repetible cada partida, las
// partidas guardadas que se pueden continuar y la pantalla «Nueva partida». app.js decide qué arranca cada botón.
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const STARTS = [
  {id: 'herencia', year: '2022', title: 'La herencia', line: 'Alta velocidad hasta 2050, con turno guiado.', photo: 'assets/rescate/etapa-s2.webp', recommended: true},
  {id: 'rescate', year: '2027', title: 'El rescate', line: 'Tenfe, al borde de la quiebra.', photo: 'assets/rescate/portada-rescate.webp'},
  {id: 'maqueta', year: '', title: 'Maqueta', line: 'Sin guion: tu red, tus reglas.', photo: 'assets/rescate/mega-ctc.webp'},
];
export const START = Object.fromEntries(STARTS.map(start => [start.id, start]));
export const MAQUETA_CASH = [500, 1500, 5000];
const SEED_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Código de semilla tal como se muestra y se compara: sin espacios sobrantes, en mayúsculas y corto. */
export function normalizeSeed(text) { return String(text ?? '').trim().replace(/\s+/g, ' ').toUpperCase().slice(0, 24); }
/** Semilla entera de un código: los números de hasta nueve cifras valen tal cual (72022 es la campaña de siempre);
 *  cualquier otro texto se resume con FNV-1a de 32 bits. Mismo código, misma partida. */
export function seedFromCode(code) {
  const text = normalizeSeed(code);
  if (/^\d{1,9}$/.test(text)) return Number(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash >>> 0;
}
/** Código nuevo cuando el campo de la semilla se deja vacío. */
export function randomSeedCode(rand = Math.random) {
  let code = '';
  for (let i = 0; i < 6; i++) code += SEED_LETTERS[Math.floor(rand() * SEED_LETTERS.length)];
  return code;
}
/** Código para volver a jugar una partida guardada; las del rescate anteriores a la semilla escrita guardan su número. */
export function seedCodeOf(save) {
  if (typeof save?.seedCode === 'string' && save.seedCode) return normalizeSeed(save.seedCode);
  return Number.isInteger(save?.seed) && save.seed >= 0 && save.seed < 1e9 && save.v !== undefined ? String(save.seed) : '';
}

/** Partidas que se pueden continuar, la más reciente primero (las guardadas antes de existir savedAt cuentan como 0). */
export function savedGames(classic = null, rescue = null) {
  const games = [];
  if (classic) {
    const start = classic.tycoon?.mode === 'free' ? 'maqueta' : 'herencia';
    games.push({game: 'classic', start, title: START[start].title, where: dateOf(Math.max(0, effectiveMonth(classic))), date: true, savedAt: Number(classic.savedAt) || 0});
  }
  if (rescue) games.push({game: 'rescue', start: 'rescate', title: START.rescate.title, where: 'semana ' + rescue.week, date: false, savedAt: Number(rescue.savedAt) || 0});
  // Empate (guardados antiguos): el rescate, que era el modo principal de la 4.0.
  return games.sort((a, b) => b.savedAt - a.savedAt || (a.game === 'rescue' ? -1 : 1));
}
/** Título de la partida que se sustituiría al empezar ese arranque, o null si no hay nada que perder. */
export function overwrittenBy(start, classic = null, rescue = null) {
  const game = savedGames(classic, rescue).find(row => (start === 'rescate') === (row.game === 'rescue'));
  return game ? game.title : null;
}

const money = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' M€'; // 1.500 M€ (es-ES no agrupa los miles de cuatro cifras)
const segment = (action, id, label, on) => `<button type="button" class="${on ? 'on' : ''}" data-action="${action}" data-id="${id}" aria-pressed="${on}">${label}</button>`;
const back = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

/** Segundo paso de la portada: tres arranques con foto, reglas de la maqueta, semilla y «Empezar». */
export function newGameHTML({pick = 'herencia', cash = 500, rivals = true, seed = '', confirm = null} = {}) {
  const cards = STARTS.map(start => `<button type="button" class="np-start${start.id === pick ? ' on' : ''}" role="radio" aria-checked="${start.id === pick}" tabindex="${start.id === pick ? 0 : -1}" data-action="np-pick" data-id="${start.id}"><span class="np-photo"><img src="${start.photo}" alt="" width="640" height="360" decoding="async" onerror="this.remove()"></span>${start.recommended ? '<em class="np-tag">Recomendada</em>' : ''}<strong>${start.year ? `<span>${start.year} ·</span> ` : ''}${escapeHTML(start.title)}</strong><small>${escapeHTML(start.line)}</small></button>`).join('');
  const rules = `<div class="np-rules"${pick === 'maqueta' ? '' : ' hidden'}><div class="np-rule"><span class="np-label" id="np-cash-label">Presupuesto</span><div class="np-seg" role="group" aria-labelledby="np-cash-label">${MAQUETA_CASH.map(value => segment('np-cash', value, money(value), value === cash)).join('')}</div></div><div class="np-rule"><span class="np-label" id="np-rivals-label">Rivales</span><div class="np-seg" role="group" aria-labelledby="np-rivals-label">${segment('np-rivals', 'on', 'Sí', rivals)}${segment('np-rivals', 'off', 'No', !rivals)}</div></div></div>`;
  const foot = confirm
    ? `<div class="np-foot np-confirm" role="alert"><p>Hay una partida guardada de ${escapeHTML(confirm)}. ¿Empezar otra?</p><button type="button" class="np-no" data-action="np-no">No</button><button type="button" class="np-go" data-action="np-yes">Sí</button></div>`
    : `<div class="np-foot"><label class="np-seed" for="npSeed"><span>Semilla</span><input id="npSeed" type="text" maxlength="24" placeholder="Al azar" value="${escapeHTML(seed)}" autocomplete="off" autocapitalize="characters" spellcheck="false"></label><button type="button" class="np-go" data-action="np-begin">Empezar</button></div>`;
  return `<main class="main-menu np-screen" aria-labelledby="np-title">
    <div class="main-menu-art" aria-hidden="true"></div><div class="main-menu-grain" aria-hidden="true"></div>
    <div class="np-body">
      <header class="np-head"><button type="button" class="np-back" data-action="np-back" aria-label="Volver" title="Volver (Esc)">${back}</button><h1 id="np-title">Nueva partida</h1></header>
      <div class="np-starts" role="radiogroup" aria-label="Cómo empezar">${cards}</div>
      ${rules}
      ${foot}
    </div>
  </main>`;
}
