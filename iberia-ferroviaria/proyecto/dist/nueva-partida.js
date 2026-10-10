import {effectiveMonth, dateOf} from './engine.js';
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  export const STARTS=[{id:'tenfe',year:'2022',title:'Tenfe',line:'Una red, una historia, tus decisiones.'}];
  export const START=Object.fromEntries(STARTS.map(start=>[start.id,start]));
  export const MAQUETA_CASH=[500,1500,5000];
  const SEED_LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  export function normalizeSeed(text){return String(text??'').trim().replace(/\s+/g,' ').toUpperCase().slice(0,24);}
  export function seedFromCode(code){
    const text=normalizeSeed(code);if(/^\d{1,9}$/.test(text))return Number(text);
    let hash=0x811c9dc5;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),0x01000193)>>>0;return hash>>>0;
  }
  export function randomSeedCode(rand=Math.random){let code='';for(let i=0;i<6;i++)code+=SEED_LETTERS[Math.floor(rand()*SEED_LETTERS.length)];return code;}
  export function seedCodeOf(save){if(typeof save?.seedCode==='string'&&save.seedCode)return normalizeSeed(save.seedCode);return Number.isInteger(save?.seed)&&save.seed>=0&&save.seed<1e9?String(save.seed):'';}
  export function savedGames(classic=null,rescue=null){
    const games=[];if(classic)games.push({game:'classic',start:'tenfe',title:'Tenfe',where:dateOf(Math.max(0,effectiveMonth(classic))),date:true,savedAt:Number(classic.savedAt)||0});
    if(rescue)games.push({game:'rescue',start:'legacy',title:'Rescate anterior',where:'semana '+rescue.week,date:false,savedAt:Number(rescue.savedAt)||0});
    return games;
  }
  export function overwrittenBy(start,classic=null){return classic?'Tenfe':null;}
  export function newGameHTML({seed='',confirm=null,difficulty='normal',guide=true}={}){
    return `<main class="main-menu np-screen tenfe-new" aria-labelledby="np-title">
      <div class="main-menu-art" aria-hidden="true"></div><div class="main-menu-grain" aria-hidden="true"></div>
      <div class="np-body">
        <header class="np-head"><button type="button" class="np-back" data-action="np-back" aria-label="Volver">‹</button><div><span class="kicker">Una sola campaña · 2022–2050</span><h1 id="np-title">Al mando de Tenfe</h1></div></header>
        <p class="np-promise">Conecta un país. Gana viajeros. Sobrevive al despacho.</p>
        <ol class="tenfe-journey"><li><b>01</b><span><strong>Hereda la red</strong><small>Horarios, vías reales y trenes que ya llevan demasiados kilómetros.</small></span></li>
          <li><b>02</b><span><strong>Rescata Tenfe</strong><small>Desde 2027: pactos, territorios y dos elecciones con tu misma compañía.</small></span></li>
          <li><b>03</b><span><strong>Deja tu legado</strong><small>Hitos, investigación y grandes proyectos hasta 2050.</small></span></li></ol>
        <div class="tenfe-rules"><span id="difficulty-label">Ritmo de partida</span><div class="np-seg" role="group" aria-labelledby="difficulty-label">
          <button data-action="np-difficulty" data-id="normal" class="${difficulty==='normal'?'on':''}" aria-pressed="${difficulty==='normal'}">Con desafío</button>
          <button data-action="np-difficulty" data-id="relajada" class="${difficulty==='relajada'?'on':''}" aria-pressed="${difficulty==='relajada'}">A tu ritmo</button></div>
          <p>${difficulty==='normal'?'Perder unas elecciones termina el mandato. Cada decisión cuenta.':'Las derrotas electorales bajan el apoyo; puedes seguir jugando.'}</p>
          <label class="tenfe-guide"><input id="npGuide" type="checkbox" ${guide?'checked':''}> Aprender con el primer turno guiado</label></div>
        ${confirm?`<div class="np-foot np-confirm" role="alert"><p>Hay una partida de Tenfe guardada. ¿Empezar otra?</p><button class="np-no" data-action="np-no">Volver</button><button class="np-go" data-action="np-yes">Empezar otra</button></div>`:
          `<div class="np-foot"><label class="np-seed" for="npSeed"><span>Código de partida</span><input id="npSeed" type="text" maxlength="24" placeholder="Al azar" value="${escapeHTML(seed)}" autocomplete="off" autocapitalize="characters"></label><button class="np-go" data-action="np-begin">Asumir el mando →</button></div>`}
      </div></main>`;
  }
