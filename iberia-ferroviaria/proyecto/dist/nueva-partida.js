import {effectiveMonth, dateOf} from './engine.js';
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  export const STARTS=[{id:'tenfe',year:'Turno 1',title:'Conexiones',line:'Una red, cinco retos y tus decisiones.'}];
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
    const games=[];if(classic)games.push({game:'classic',start:'tenfe',title:'Tenfe',where:classic.tenfe?.game?'Turno '+(classic.month-classic.tenfe.game.origin+1):dateOf(Math.max(0,effectiveMonth(classic))),date:true,savedAt:Number(classic.savedAt)||0});
    if(rescue)games.push({game:'rescue',start:'legacy',title:'Rescate anterior',where:'semana '+rescue.week,date:false,savedAt:Number(rescue.savedAt)||0});
    return games;
  }
  export function overwrittenBy(start,classic=null){return classic?'Tenfe':null;}
  export function newGameHTML({seed='',confirm=null,difficulty='normal',guide=true}={}){
    return `<main class="main-menu np-screen" aria-labelledby="np-title">
      <div class="main-menu-art" aria-hidden="true"></div>
      <div class="np-body">
        <header class="np-head"><button class="menu-back np-back" data-action="np-back"><span aria-hidden="true">‹</span> Volver</button><h1 id="np-title">Nueva partida</h1><p>Conexiones · campaña ferroviaria</p></header>
        <div class="np-configuration">
        <fieldset class="np-field"><legend>Ritmo de partida</legend><div class="np-seg">
          <button data-action="np-difficulty" data-id="normal" class="${difficulty==='normal'?'on':''}" aria-pressed="${difficulty==='normal'}">Con desafío</button>
          <button data-action="np-difficulty" data-id="relajada" class="${difficulty==='relajada'?'on':''}" aria-pressed="${difficulty==='relajada'}">A tu ritmo</button></div>
          <p class="np-rule-detail">${difficulty==='normal'?'Perder las elecciones termina la partida. Cumple los cinco retos y gana dos mandatos.':'Puedes seguir jugando aunque pierdas las elecciones. Los cinco retos se mantienen.'}</p></fieldset>
          <label class="tenfe-guide"><input id="npGuide" type="checkbox" ${guide?'checked':''}> Primer turno guiado</label>
          <label class="np-seed" for="npSeed"><span>Código de partida</span><input id="npSeed" type="text" maxlength="24" placeholder="Al azar" value="${escapeHTML(seed)}" autocomplete="off" autocapitalize="characters"><small>Usa el mismo código para repetir las condiciones iniciales.</small></label>
        ${confirm?`<div class="np-foot np-confirm" role="alert"><p>Ya tienes una partida guardada. Empezar otra sustituirá el guardado automático.</p><button class="np-no" data-action="np-no">Cancelar</button><button class="np-go" data-action="np-yes">Empezar otra</button></div>`:
          '<div class="np-foot"><button class="np-go" data-action="np-begin">Empezar partida</button></div>'}
        </div>
      </div></main>`;
  }
