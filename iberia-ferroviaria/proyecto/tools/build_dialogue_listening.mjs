// Standalone listening room. Freeze the current registered complete takes without
// invoking synthesis, publishing production assets or modifying the game HTML.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {DIALOGUE_CATALOGUE} from './voice_dialogues.mjs';
import {CHARACTERS, CHAPTERS, DECISIONS, EVENTS} from '../dist/story.js';
import {INDUCTION_STAGES} from '../dist/induction.js';
import {ENCOUNTERS} from '../dist/encounters.js';
import {ARCS} from '../dist/tycoon.js';
import {dialoguePresentation} from '../dist/dialogue-presentation.js';
import {loadCurrentVoicePack, currentPacoNote} from './current_voice_pack.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.resolve(process.env.DIALOGUE_LISTENING_STAGE || path.join(project, '../investigacion/voces/generadas-qwen-dialogos-3.6.3-torrente'));
const output = path.resolve(project, '../outputs/Iberia-Ferroviaria-dialogos-nuevos.html');
const main = path.resolve(project, '../outputs/Iberia-Ferroviaria.html');
const asset = path.join(project, 'dist/assets/voice-dialogues.js');
const favicon = fs.readFileSync(path.join(project,'dist/index.html'),'utf8').match(/<link\b[^>]*rel="icon"[^>]*>/)?.[0];
assert(favicon && /href="data:image\//.test(favicon), 'the game favicon is embedded');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const mainBefore = fs.existsSync(main) ? sha(fs.readFileSync(main)) : null;
const assetBefore = sha(fs.readFileSync(asset));
const manifestBytes = fs.readFileSync(path.join(stage, 'manifest.json'));
const manifest = JSON.parse(manifestBytes), manifestSHA256 = sha(manifestBytes);
const referencePack = loadCurrentVoicePack(project, manifest, DIALOGUE_CATALOGUE);
assert.equal(DIALOGUE_CATALOGUE.length, 412);
const known = new Set(DIALOGUE_CATALOGUE.map(row => row.id));
for (const id of Object.keys(manifest.takes || {})) assert(known.has(id), 'no obsolete dialogue in the frozen registry');
const createdAt = new Date().toISOString();
const snapshot = path.resolve(project, '../investigacion/voces/auditorio-dialogos-3.6.3', createdAt.replace(/[:.]/g, '-')+'-'+manifestSHA256.slice(0,8));
fs.mkdirSync(snapshot, {recursive:true});
fs.writeFileSync(path.join(snapshot,'manifest-source.json'),manifestBytes,{flag:'wx',mode:0o444});
fs.writeFileSync(path.join(snapshot,'reference-pack-source.json'),referencePack.bytes,{flag:'wx',mode:0o444});
const kinds = {induction:'Primer turno',feedback:'Respuesta de la guía',chapter:'Capítulo',arc:'Encargo',decision:'Consejo de dirección',event:'Imprevisto',encounter:'Situación'};
const emotions = {happy:'Contento',angry:'Enfadado',worried:'Preocupado',proud:'Orgulloso',surprised:'Sorprendido',disappointed:'Decepcionado',determined:'Decidido'};
const nameFor = row => {
  const [, id] = row.source.split(':');
  if(row.kind==='induction'||row.kind==='feedback')return INDUCTION_STAGES.find(stage=>stage.id===id)?.title||kinds[row.kind];
  if(row.kind==='chapter')return CHAPTERS.find(chapter=>chapter.id===id)?.title||kinds[row.kind];
  if(row.kind==='decision')return DECISIONS.find(decision=>decision.id===id)?.title||kinds[row.kind];
  if(row.kind==='event')return EVENTS.find(event=>event.id===id)?.title||kinds[row.kind];
  if(row.kind==='encounter')return ENCOUNTERS.find(scene=>scene.id===id)?.title||kinds[row.kind];
  if(row.kind==='arc')return ARCS[Number(id)]?.[0]||kinds[row.kind];
  return kinds[row.kind];
};
const recordings = [], audio = {};
const rows = DIALOGUE_CATALOGUE.map(row=>{
  const take=manifest.takes?.[row.id];
  if(take){
    assert.equal(take.id,row.id);assert.equal(take.person,row.person);assert.equal(take.text,row.text);
    assert.equal(take.validated,true);assert.equal(take.raw_validated,true);assert.equal(take.finite,true);
    assert.equal(take.eos_observation?.eos_found,true);assert.match(take.sha256,/^[a-f0-9]{64}$/);
    assert(Number.isFinite(take.duration)&&take.duration>0);assert.equal(take.mp3,row.id+'.mp3');
    const source=path.join(stage,take.mp3);
    assert(!fs.lstatSync(source).isSymbolicLink());
    const bytes=fs.readFileSync(source);assert.equal(sha(bytes),take.sha256,'registered MP3 is unchanged');
    audio[row.id]=bytes.toString('base64');
    recordings.push({id:row.id,person:row.person,kind:row.kind,source:row.source,raw:row.raw,
      sourcePath:source,bytes:bytes.length,sha256:take.sha256,duration:take.duration,
      referenceSHA256:take.reference_sha256,modelFingerprint:take.model_fingerprint});
  }
  const presentation=dialoguePresentation(row.raw,row.person);
  return {id:row.id,person:row.person,name:CHARACTERS[row.person].name,mood:row.mood,
    emotion:emotions[row.mood],kind:kinds[row.kind],title:nameFor(row),text:row.raw,
    opener:presentation.opener,main:presentation.main,presentation:presentation.source,
    available:!!take,duration:take?.duration||null,sha256:take?.sha256||null};
});
const available=recordings.length;assert(available>0,'at least one complete recording exists');
const pacoNote=currentPacoNote(referencePack,recordings).replace(referencePack.json.prompts.mayor.provenance.speaker,'Torrente (Santiago Segura, Torrente 5)');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const label=`${available}/412 diálogos grabados · ${available===412?'catálogo completo':'el resto está en producción'}`;
const data={rows,audio,characters:Object.entries(CHARACTERS).map(([id,person])=>({id,name:person.name})),emotions,label,createdAt};
const safeJSON=JSON.stringify(data).replaceAll('<','\\u003c');
const client=String.raw`
'use strict';
const data=JSON.parse(document.getElementById('dialogue-data').textContent);
const $=id=>document.getElementById(id), player=$('player');
let selected=null, playToken=0, filtered=[], ready=[], explicitlyStopped=false;
const normalize=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const duration=seconds=>Math.floor(seconds/60)+':'+String(Math.round(seconds%60)).padStart(2,'0');
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const presented=row=>row.opener?'<span class="dialogue-opener">'+esc(row.opener)+'</span> <span class="dialogue-main">'+esc(row.main)+'</span>':esc(row.text);
for(const person of data.characters)$('person').add(new Option(person.name,person.id));
for(const [id,label]of Object.entries(data.emotions))$('emotion').add(new Option(label,id));
function status(text){$('play-status').textContent=text;}
function controls(){
 const index=ready.findIndex(row=>row.id===selected?.id);
 $('previous').disabled=!selected||index<=0;
 $('next').disabled=!ready.length||index>=ready.length-1;
 $('repeat').disabled=!selected?.available;
 $('stop').disabled=!selected?.available;
 $('download').hidden=!selected?.available;
 if(selected?.available){$('download').href='data:audio/mpeg;base64,'+data.audio[selected.id];$('download').download=selected.name.replace(/\s+/g,'-')+'-'+selected.id+'.mp3';}
}
function filter(){
 const query=normalize($('search').value),person=$('person').value,mood=$('emotion').value,all=$('show-pending').checked;
 filtered=data.rows.filter(row=>(all||row.available)&&(!person||row.person===person)&&(!mood||row.mood===mood)&&(!query||normalize(row.name+' '+row.title+' '+row.text).includes(query)));
 ready=filtered.filter(row=>row.available);
 $('match-count').textContent=filtered.length+' diálogos'+(all?' · '+ready.length+' grabados':' disponibles');
 $('empty').hidden=filtered.length>0;
 $('list').innerHTML=filtered.map(row=>'<li class="take '+(row.available?'':'pending')+(selected?.id===row.id?' selected':'')+'" data-id="'+row.id+'"><div class="take-meta"><span>'+esc(row.name)+'</span><span>'+esc(row.emotion)+'</span></div><h2>'+esc(row.title)+'</h2><p class="take-kind">'+esc(row.kind)+'</p><p class="take-text">'+presented(row)+'</p><div class="take-footer"><span>'+(row.available?duration(row.duration):'En producción')+'</span><button type="button" data-play="'+row.id+'" '+(row.available?'':'disabled')+' aria-label="Escuchar el diálogo completo de '+esc(row.name)+'">'+(row.available?'Escuchar':'Pendiente')+'</button></div></li>').join('');
 controls();
}
function select(id){
 const row=data.rows.find(row=>row.id===id);if(!row?.available)return;
 const token=++playToken;player.pause();selected=row;explicitlyStopped=false;
 player.src='data:audio/mpeg;base64,'+data.audio[id];player.defaultPlaybackRate=1;player.playbackRate=1;
 $('current-person').textContent=row.name+' · '+row.emotion;
 $('current-title').textContent=row.title;$('current-text').innerHTML=presented(row);
 $('current-empty').hidden=true;$('current').hidden=false;status('Preparando el diálogo completo…');
 filter();
 player.play().catch(error=>{if(token!==playToken)return;status(error.name==='NotAllowedError'?'Pulsa ▶ en el reproductor para escucharlo.':'No se ha podido reproducir esta toma. Puedes repetir o elegir otra.');});
}
function next(){const index=ready.findIndex(row=>row.id===selected?.id),row=ready[index+1];if(row)select(row.id);}
$('list').addEventListener('click',event=>{const button=event.target.closest('[data-play]');if(button&&!button.disabled)select(button.dataset.play);});
$('previous').addEventListener('click',()=>{const index=ready.findIndex(row=>row.id===selected?.id);if(index>0)select(ready[index-1].id);});
$('next').addEventListener('click',next);$('repeat').addEventListener('click',()=>{if(selected)select(selected.id);});
$('stop').addEventListener('click',()=>{
 ++playToken;explicitlyStopped=true;$('continuous').checked=false;player.pause();
 try{player.currentTime=0;}catch{}
 status('Detenido. Puedes repetir este diálogo o elegir otro.');controls();
});
for(const id of ['person','emotion','show-pending'])$(id).addEventListener('change',filter);
$('search').addEventListener('input',filter);
player.addEventListener('playing',()=>{if(player.paused)return;explicitlyStopped=false;status('Escuchando · '+selected.name);});
player.addEventListener('pause',()=>{if(selected&&!player.ended&&!explicitlyStopped)status('En pausa. Puedes continuar desde el reproductor.');});
player.addEventListener('ended',()=>{if(explicitlyStopped||!player.ended)return;if($('continuous').checked&&ready.findIndex(row=>row.id===selected?.id)<ready.length-1)next();else status('Diálogo terminado. Puedes repetir o pasar al siguiente.');});
player.addEventListener('error',()=>status('No se ha podido abrir esta toma. Prueba a repetir o elige otra.'));
filter();
`;
new Function(client);
const html=`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">${favicon}<title>Iberia Ferroviaria · Diálogos nuevos</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f2ec;color:#292725;font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select,a{font:inherit}button,select,input{min-height:44px}button{cursor:pointer;border:1px solid #754c3b;background:#754c3b;color:#fff;border-radius:9px;padding:9px 15px;font-weight:650}button:disabled{cursor:default;background:#e5e0d9;color:#756d65;border-color:#d3ccc2}button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #ba8651;outline-offset:3px}main{width:min(1150px,100%);margin:auto;padding:24px}header{padding:8px 0 18px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#8b5b40;font-size:12px;font-weight:750}h1{font-size:clamp(27px,5vw,39px);line-height:1.2;margin:8px 0}header p{margin:7px 0}.progress{display:inline-block;background:#eadac6;border-radius:8px;padding:7px 11px;font-weight:650}.note{color:#746b63;font-size:13px}.filters{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:12px;background:#fff;border:1px solid #e3dcd0;border-radius:13px;padding:16px}label{font-size:13px;font-weight:650}select,input[type=search]{display:block;width:100%;margin-top:5px;border:1px solid #cfc6ba;background:#fff;border-radius:8px;padding:9px 10px;color:#292725;min-width:0}.pending-toggle{grid-column:1/-1;display:flex;align-items:center;gap:8px;min-height:44px;font-weight:500}input[type=checkbox]{width:20px;height:20px;min-height:20px;accent-color:#754c3b}.layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:20px;margin-top:18px}.library{min-width:0}#match-count{font-size:13px;color:#746b63;margin:0 0 10px}ul{list-style:none;padding:0;margin:0}.take{background:#fff;border:1px solid #e3dcd0;border-radius:13px;margin-bottom:13px;padding:17px}.take.selected{border-color:#9b6546;box-shadow:0 0 0 1px #9b6546}.take.pending{background:#eeeae4}.take-meta{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:#7e5941;font-weight:700}h2{font-size:18px;line-height:1.35;margin:7px 0}.take-kind{font-size:12px;color:#746b63;margin:0 0 9px}.take-text{margin:0;font-size:14px;white-space:pre-line;overflow-wrap:anywhere}.take-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:15px;font-size:12px;color:#746b63}.player-panel{position:sticky;top:18px;align-self:start;min-width:0;background:#fff;border:1px solid #e3dcd0;border-radius:13px;padding:19px}.player-label{text-transform:uppercase;letter-spacing:.1em;color:#8b5b40;font-size:11px;font-weight:750}#current-person{color:#7e5941;font-size:13px;font-weight:700}#current-title{font-size:21px;margin:7px 0 12px}#current-text{white-space:pre-line;overflow-wrap:anywhere;margin:0 0 17px}audio{display:block;width:100%;max-width:100%;height:54px;margin:12px 0}.transport{display:flex;flex-wrap:wrap;gap:8px}.transport button{flex:1;padding:8px 10px}.sequence{display:flex;align-items:center;gap:8px;min-height:48px;font-weight:500}.download{display:inline-block;margin-top:7px;color:#754c3b;font-size:13px;min-height:44px;padding:10px 0}#play-status{color:#746b63;font-size:13px;min-height:22px;margin:9px 0 0}[hidden]{display:none!important}@media(max-width:700px){main{padding:16px}.filters{grid-template-columns:1fr 1fr;padding:13px}.search-label{grid-column:1/-1}.layout{display:flex;flex-direction:column-reverse;gap:18px}.player-panel{position:static;padding:16px}.take{padding:15px}.transport button{min-width:72px}.progress{font-size:13px}header .note{font-size:12px}}@media(max-width:360px){main{padding:12px}.filters{gap:9px}.take-meta{gap:5px 9px}.transport{gap:6px}.transport button{padding:9px 6px}}
.transport{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.transport button{min-width:0}
@media(max-width:420px){.filters{grid-template-columns:minmax(0,1fr)}.search-label,.pending-toggle{grid-column:1}}
.dialogue-opener{display:block;margin:0 0 .6em;font-weight:650;color:#754c3b}.dialogue-main{display:block}
</style></head><body><main>
<header><div class="eyebrow">Iberia Ferroviaria · Sala de escucha</div><h1>Todos los diálogos nuevos.</h1><p class="progress">${label}</p><p class="note">Tomas completas, sin el juego. Puedes escuchar sin conexión y filtrar por personaje, emoción o texto.</p><p class="note">${escapeHTML(pacoNote)}</p></header>
<section class="filters" aria-label="Filtrar diálogos"><label>Personaje<select id="person"><option value="">Todos los personajes</option></select></label><label>Emoción<select id="emotion"><option value="">Todas las emociones</option></select></label><label class="search-label">Buscar en los diálogos<input id="search" type="search" placeholder="Por ejemplo: catenaria, dinero…"></label><label class="pending-toggle"><input id="show-pending" type="checkbox">Mostrar también los diálogos pendientes (${412-available})</label></section>
<div class="layout"><section class="library" aria-label="Diálogos"><p id="match-count" role="status"></p><p id="empty" hidden>No hay diálogos que coincidan con estos filtros.</p><ul id="list"></ul></section>
<section class="player-panel" aria-label="Reproductor único"><div class="player-label">Ahora suena</div><p id="current-empty">Elige «Escuchar» en un diálogo. Aquí aparecerá su texto completo.</p><div id="current" hidden><p id="current-person"></p><h2 id="current-title"></h2><p id="current-text"></p></div><audio id="player" controls preload="none" aria-label="Audio del diálogo completo"></audio><div class="transport"><button id="previous" type="button" disabled>Anterior</button><button id="next" type="button">Siguiente</button><button id="repeat" type="button" disabled>Repetir</button><button id="stop" type="button" disabled>Detener</button></div><label class="sequence"><input id="continuous" type="checkbox">Escuchar en secuencia</label><p id="play-status" role="status" aria-live="polite">No hay audio en reproducción.</p><a class="download" id="download" hidden>Descargar esta toma</a></section></div>
</main><script type="application/json" id="dialogue-data">${safeJSON}</script><script>${client.replaceAll('</script','<\\/script')}</script></body></html>`;
assert.equal((html.match(/<audio\b/g)||[]).length,1,'only one native player');
assert(!/<script[^>]+\bsrc=|<img[^>]+\bsrc="https?:/.test(html),'no external script or image assets');
const links=html.match(/<link\b[^>]*>/g)||[];assert.deepEqual(links,[favicon],'only the embedded favicon link');
assert(!/speechSynthesis|SpeechSynthesisUtterance|assets\/voices\.js/.test(html),'no previous/system voice path');
assert.equal(Object.keys(audio).length,available);
fs.mkdirSync(path.dirname(output),{recursive:true});
const temporary=output+'.tmp';fs.writeFileSync(temporary,html);fs.renameSync(temporary,output);
assert.equal(fs.existsSync(main)?sha(fs.readFileSync(main)):null,mainBefore,'main game HTML unchanged');
assert.equal(sha(fs.readFileSync(asset)),assetBefore,'official production voice asset unchanged');
const report={schema:1,createdAt,status:available===412?'full-listening-catalogue-built':'partial-listening-catalogue-built',
  output,outputBytes:Buffer.byteLength(html),outputSHA256:sha(html),availableWholeDialogues:available,expectedWholeDialogues:412,
  pendingWholeDialogues:rows.filter(row=>!row.available).map(row=>row.id),allTextsIncluded:true,
  presentation:'existing contextual opener displayed before the main body; one complete unchanged recording',
  oneNativeAudioElement:true,oldSentenceRecordings:0,systemVoiceFallback:false,defaultView:'recorded dialogues only',
  nativeControls:['play/pause','seek','volume','previous','next','repeat','stop','continuous queue','download'],
  stopBehavior:'pause, return to start, invalidate pending play callback, disable continuous queue; keep selected text',
  sourceManifest:path.join(stage,'manifest.json'),sourceManifestStatus:manifest.status,sourceManifestSHA256:manifestSHA256,
  frozenManifest:path.join(snapshot,'manifest-source.json'),snapshot,
  sourceReferencePack:referencePack.source,sourceReferencePackSHA256:referencePack.sha256,
  frozenReferencePack:path.join(snapshot,'reference-pack-source.json'),references:referencePack.references,pacoNote,
  audioSnapshot:'exact registered MP3 bytes embedded in the frozen HTML; original physical files retained in stage',
  mainUnchanged:true,mainSHA256:mainBefore,officialVoiceAssetUnchanged:true,officialVoiceAssetSHA256:assetBefore,
  validation:{registeredHashes:true,completeBodies:true,eosObserved:true,sourceSignalValidated:true,
    currentReferencePack:true,currentTakeReferenceHashes:true,currentCatalogue:true,
    inlineClientSyntax:true,onePlayer:true,offlineAssets:true,embeddedFavicon:true,browserTested:false,humanListening:false},recordings};
fs.writeFileSync(path.join(snapshot,'listening-provenance.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o444});
fs.writeFileSync(path.resolve(project,'../investigacion/voces/auditorio-dialogos-3.6.3/latest.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,bytes:report.outputBytes,sha256:report.outputSHA256,voices:available,total:412,snapshot,
  mainUnchanged:true,officialVoiceAssetUnchanged:true,browserTested:false},null,2));
