import {MESSAGES,STATIC_MESSAGES} from './narration-data.js';
import {CHARACTERS} from './story.js';
import {clipId,sentences} from './voice.js';
import {faceURL} from './faces.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exact=new Map(Object.entries(STATIC_MESSAGES).map(([key,m])=>[m.text,key]));
export function keyForText(text){return exact.get(text);}
export function message(key){const m=MESSAGES[key];if(!m)throw Error('Mensaje sin personaje: '+key);return m;}
export function speechHTML(key){return sentences(message(key).text).map(text=>'<span class="narration-s">'+esc(text)+'</span>').join(' ');}
export function controls(key){const m=message(key);return '<button class="say-btn narration-control" type="button" data-action="narration-replay" data-narration-key="'+esc(key)+'" aria-label="Escuchar a '+esc(CHARACTERS[m.person].name)+'" aria-pressed="false"><span aria-hidden="true">▷</span><span class="narration-button-label">Escuchar</span></button>';}
export function header(key){const m=message(key),person=CHARACTERS[m.person];return '<header class="narration-speaker"><img class="portrait" data-mood="'+m.mood+'" src="'+faceURL(m.person,m.mood)+'" alt="" width="40" height="48"><div><strong>'+esc(person.name)+'</strong><small>'+esc(person.role)+'</small></div>'+controls(key)+'</header>';}
export function card(key,{details='',title='',className=''}={}){
 const m=message(key);return '<section class="narration-card '+className+'" data-narration-key="'+esc(key)+'" data-person="'+m.person+'">'+header(key)+(title?'<h3>'+esc(title)+'</h3>':'')+'<p data-say="'+esc(m.text)+'">'+speechHTML(key)+'</p>'+(details&&details!==m.text?'<div class="narration-details"><span>Detalle</span><p>'+esc(details)+'</p></div>':'')+'</section>';
}
export function toastKey(text,{error=false,action=''}={}){
 const raw=String(text);if(exact.has(raw))return exact.get(raw);
 if(error||/^(No se pudo importar|Error|No se puede|No hay|Falta|Necesitas|Elige|Cantidad|Unidades|Sin |Saldo|El archivo)/i.test(raw)){
  if(/partida|JSON|archivo|importar|guardado/i.test(raw))return 'error-save';
  if(/caja|dinero|saldo|fondos|presupuesto|financiación/i.test(raw))return 'error-money';
  if(/tren|unidad|material|lote|flota|disponible/i.test(raw))return 'error-fleet';
  if(/vía|ancho|catenaria|tramo|recorrido|ciudad|ruta|línea/i.test(raw))return 'error-network';
  return 'error-invalid';
 }
 if(/^Turno cerrado/.test(raw))return 'turn-closed';
 if(/^Mes cerrado/.test(raw))return 'month-closed';
 if(/^Petición en marcha/.test(raw))return 'request-started';
 if(/^Petición incumplida/.test(raw))return 'request-lost';
 if(/^Momento del día cumplido/.test(raw))return 'surge-success';
 if(/^Horario real/.test(raw))return 'real-timetable';
 if(/maquinistas.*formación/i.test(raw))return 'training-result';
 if(/política (activada|desactivada)/i.test(raw))return 'policy-result';
 if(/financiada.*Final previsto/.test(raw))return 'research-result';
 if(/^Solo hay trenes|^Conexión abierta/.test(raw))return 'service-result';
 if(/Incidencia:/.test(raw))return 'incident-alert';
 if(/Revisa la ciudad en el mapa/.test(raw))return 'surge-alert';
 if(['market-favorite','buy','market-buy','buy-new'].includes(action))return 'purchase-info';
 if(['hire','tycoon-train'].includes(action))return 'training-result';
 if(action==='route-trips')return 'service-result';
 if(/confianza|M€|cobrad[ao]|premio|financiación/i.test(raw)||['borrow','repay','tycoon-lobby'].includes(action))return 'finance-result';
 return 'message-info';
}
export function newsKey(row){
 const title=String(row.title||''),image=row.image||'';
 if(image.startsWith('tech-'))return 'research-finished';
 if(title==='Megaproyecto en servicio'||title==='Proyecto en servicio')return 'project-finished';
 if(title==='Fase terminada')return 'phase-finished';
 if(title==='Pacto cumplido')return 'pact-won';
 if(title==='Pacto incumplido')return 'pact-lost';
 if(image.startsWith('etapa-'))return 'challenge-won';
 if(image==='fin-victoria')return 'victory';
 if(image==='fin-derrota')return 'defeat';
 if(image==='elecciones'||row.kind==='eleccion')return /renueva|renovado/.test(title)?'election-won':'election-lost';
 if(title==='El expediente sale a la luz')return 'scandal-open';
 if(title==='Sentencia y restitución')return 'scandal-sentence';
 if(title==='El precio del atajo')return 'shortcut-info';
 if(image==='hito'||row.kind==='hito')return 'milestone';
 if(MESSAGES['event-'+image])return 'event-applied';
 return 'message-info';
}
export class Narrator{
 constructor(voices,{getState=()=>null}={}){
  this.voices=voices;this.getState=getState;this.queue=[];this.current=null;this.seen=new Set();this.log=[];this.sequence=0;this.session='';this.modalEpisode=0;this.pumpTimer=null;
  voices.on(()=>{this.sync();if(!voices.enabled)this.clear(false);else this.schedule();});
 }
 reset(){
  this.clear(true);this.seen.clear();this.session='';this.log=[];globalThis.document?.querySelectorAll('.narration-toast').forEach(n=>n.remove());const tray=globalThis.document?.getElementById('toast');tray?.classList.remove('show');
 }
 clear(stop=true){
  this.queue.splice(0).forEach(q=>q.onend?.({reason:'cancelled'}));if(stop&&this.current){const current=this.current;current.cancelled=true;this.voices.stop();}clearTimeout(this.pumpTimer);this.pumpTimer=null;
 }
 cancel(where){
  this.queue=this.queue.filter(q=>{if(q.where!==where)return true;q.cancelled=true;q.onend?.({reason:'cancelled'});return false;});
  if(this.current?.where===where){this.current.cancelled=true;this.voices.stop();}
 }
 schedule(){if(this.pumpTimer!==null)return;this.pumpTimer=setTimeout(()=>{this.pumpTimer=null;this.pump();},0);}
 record(entry){this.log.push({...entry,at:Date.now()});if(this.log.length>250)this.log.shift();}
 enqueue(key,{where='message',once='',root=null,visible=()=>true,priority=0,interrupt=false,onend=null}={}){
  const m=message(key);if(once&&this.seen.has(once))return false;if(once)this.seen.add(once);
  if(!this.voices.enabled)return false;
  if(interrupt)this.cancel(where);
  const request={key,m,where,once,root,visible,priority,onend,sequence:++this.sequence,cancelled:false};
  this.queue.push(request);this.queue.sort((a,b)=>b.priority-a.priority||a.sequence-b.sequence);
  this.record({phase:'queued',key,person:m.person,where,text:m.text});this.schedule();return true;
 }
 pump(){
  if(!this.voices.enabled||this.voices.speaking||this.current)return;
  let q;while((q=this.queue.shift())){if(!q.cancelled&&q.visible())break;q.onend?.({reason:'cancelled'});q=null;}
  if(!q)return;this.current=q;
  const root=()=>typeof q.root==='function'?q.root():q.root;
  const finish=result=>{
   if(this.current!==q)return;
   this.record({phase:result.reason,key:q.key,person:q.m.person,where:q.where});
   const node=root();if(node){node.dataset.narrationState=result.reason;node.classList.remove('talking');node.querySelectorAll('.narration-s.on').forEach(n=>n.classList.remove('on'));}
   this.current=null;q.onend?.(result);this.sync();this.schedule();
  };
  this.record({phase:'started',key:q.key,person:q.m.person,where:q.where,text:q.m.text,id:clipId(q.m.person,q.m.text)});
  const ok=this.voices.speak(q.m.person,q.m.text,{sting:false,mood:q.m.mood,
   onSentence:i=>{const node=root();if(node){node.dataset.narrationState='speaking';node.classList.add('talking');node.querySelectorAll('.narration-s').forEach((n,j)=>n.classList.toggle('on',j===i));}},
   onerror:error=>{const node=root();if(node){node.dataset.narrationState='error';node.setAttribute('aria-label','No se pudo reproducir. Puedes volver a escuchar el mensaje.');}this.record({phase:'error',key:q.key,code:error.code});},
   onend:finish});
  if(ok&&this.voices.speaking)this.voices.speaking.where='narration-'+q.where;
  this.sync();
 }
 sync(){
  const doc=globalThis.document;if(!doc)return;const active=this.voices.speaking;
  for(const button of doc.querySelectorAll('[data-action="narration-replay"]')){
   const key=button.dataset.narrationKey,m=MESSAGES[key];if(!m)continue;
   const on=active?.dialogueId===clipId(m.person,m.text);
   button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',(on?'Detener a ':'Escuchar a ')+CHARACTERS[m.person].name);
   const label=button.querySelector('.narration-button-label');if(label)label.textContent=on?'Detener':'Escuchar';
  }
 }
 replay(button){
  const key=button.dataset.narrationKey,m=message(key);
  if(this.voices.speaking?.dialogueId===clipId(m.person,m.text)){this.voices.stop();return;}
  if(!this.voices.enabled)this.voices.toggle();
  const root=button.closest('.narration-card,.game-event,#coach,#entry-welcome'),where=root?.dataset.narrationWhere||'replay';
  this.voices.stop();this.enqueue(key,{where,root,visible:()=>!!root?.isConnected,priority:100});
 }
 dismiss(button){
  const root=button.closest('.narration-toast');if(!root)return;
  const instance=root.dataset.narrationInstance;this.queue=this.queue.filter(q=>q.toastInstance!==instance);
  if(this.current?.toastInstance===instance)this.voices.stop();root.remove();this.updateTray();
 }
 releaseModalToasts(root=globalThis.document?.getElementById('modal')){
  const tray=globalThis.document?.getElementById('toast');if(!tray||!root)return;
  for(const node of root.querySelectorAll('.narration-toast')){node.dataset.narrationWhere='toast';tray.appendChild(node);tray.classList.add('show');}
  for(const q of this.queue)if(q.where==='modal-toast')q.where='toast';
  if(this.current?.where==='modal-toast'){this.current.where='toast';if(this.voices.speaking)this.voices.speaking.where='narration-toast';}
 }
 updateTray(){const tray=globalThis.document?.getElementById('toast');if(tray&&!tray.querySelector('.narration-toast'))tray.classList.remove('show');}
 toast(text,options={}){
  const key=options.key||toastKey(text,options),doc=globalThis.document;if(!doc)return this.enqueue(key,{where:'toast'});
  const modal=doc.getElementById('modal'),inModal=modal?.open;
  const tray=inModal?(modal.querySelector('.content')||modal.querySelector('.modal')):doc.getElementById('toast');
  if(!tray)return this.enqueue(key,{where:'toast'});
  const node=doc.createElement('article'),instance=String(++this.sequence);
  node.className='narration-toast';node.dataset.narrationInstance=instance;node.dataset.narrationWhere=inModal?'modal-toast':'toast';
  node.innerHTML=card(key,{details:String(text)})+'<button class="narration-dismiss" data-action="narration-dismiss" aria-label="Cerrar mensaje">×</button>';
  tray.appendChild(node);if(!inModal)tray.classList.add('show');
  const expires=()=>setTimeout(()=>{node.remove();this.updateTray();},4200);
  const started=this.enqueue(key,{where:node.dataset.narrationWhere,root:()=>node.querySelector('.narration-card'),visible:()=>node.isConnected,priority:options.error?50:20,onend:expires});
  const req=this.queue.find(q=>q.sequence===this.sequence);if(req)req.toastInstance=instance;
  if(!started)expires();return node;
 }
 guide(key,root,once){
  root.dataset.narrationKey=key;root.dataset.narrationWhere='guide';
  this.enqueue(key,{where:'guide',root:()=>globalThis.document?.getElementById('coach'),visible:()=>!!globalThis.document?.getElementById('coach'),once,priority:90,interrupt:true});this.sync();
 }
 welcome(key,root){
  root.dataset.narrationKey=key;root.dataset.narrationWhere='welcome';
  this.enqueue(key,{where:'welcome',root,visible:()=>root.isConnected,priority:80});this.sync();
 }
 modal(root,{fresh=true}={}){
  if(root.querySelector('.main-menu-shell')&&!root.querySelector('.method'))return;
  if(root.querySelector('[data-action="say"],.say-s')){this.cancel('modal');this.cancel('modal-toast');return;}
  const content=root.querySelector('.content')||root.querySelector('.modal');if(!content)return;
  const title=content.querySelector('h1')?.textContent||'';
  let key=root.querySelector('.tenfe-news-modal')?newsKey({title}):root.querySelector('.tenfe-month-report')?'turn-report':
   root.querySelector('.report-head')?'day-report':root.querySelector('.refit-modal')?'refit-info':
   root.querySelector('.track-modal')?'track-info':root.querySelector('.trenespop-modal,#buyQty')?'purchase-info':
   root.querySelector('#lineA')?'line-info':root.querySelector('#svcA')?'service-info':
   root.querySelector('[data-action="tenfe-shortcut-confirm"]')?'shortcut-info':
   root.querySelector('#importSave')?'save-info':root.querySelector('.method')||/Haz que el país|Cómo jugar/.test(title)?'help-info':null;
  if(!key&&content.querySelector('p'))key='message-info';
  if(!key)return;
  if(fresh||this.modalKey!==key){this.modalEpisode++;this.cancel('modal');this.cancel('modal-toast');}
  this.modalKey=key;
  const box=globalThis.document.createElement('div');box.innerHTML=card(key);const node=box.firstElementChild;
  node.dataset.narrationWhere='modal';(content.querySelector('h1')||content.firstElementChild)?.after(node);
  this.enqueue(key,{where:'modal',root:()=>root.querySelector('[data-narration-where="modal"]'),visible:()=>root.open&&!!root.querySelector('[data-narration-where="modal"]'),once:'modal:'+this.modalEpisode+':'+key,priority:60});this.sync();
 }
 events(root,scope){
  for(const node of root.querySelectorAll('.game-event[data-narration-key]')){
   const key=node.dataset.narrationKey,unique='event:'+scope+':'+key;
   this.enqueue(key,{where:'event',root:()=>root.querySelector('.game-event[data-narration-key="'+key+'"]'),visible:()=>!root.classList.contains('hidden')&&!!root.querySelector('.game-event[data-narration-key="'+key+'"]'),once:unique,priority:40});
  }this.sync();
 }
 updates(state,{skip=false}={}){
  const news=state.tenfe?.game?.news;if(!news)return;
  const session=String(state.seedCode||state.seed);
  if(this.session!==session){this.session=session;for(const row of news)this.seen.add('news:'+session+':'+row.turn+':'+row.title+':'+row.body);return;}
  if(skip)return;
  for(const row of [...news].reverse()){
   const once='news:'+session+':'+row.turn+':'+row.title+':'+row.body;if(this.seen.has(once))continue;this.seen.add(once);
   this.toast(row.body,{key:newsKey(row)});
  }
 }
}
