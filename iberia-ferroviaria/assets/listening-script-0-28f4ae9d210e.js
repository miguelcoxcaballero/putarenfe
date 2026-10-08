
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
 if(selected?.available){$('download').href=data.audio[selected.id];$('download').download=selected.name.replace(/\s+/g,'-')+'-'+selected.id+'.mp3';}
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
 player.src=data.audio[id];player.defaultPlaybackRate=1;player.playbackRate=1;
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
