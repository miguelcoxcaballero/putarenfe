
import {card,newsKey,message} from './narration-runtime.js';
import * as J from './conexiones.js';
let E,face;
export function bind(engine,faceURL){E=engine;face=faceURL;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:1})+' M€';
const number=x=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:0});
const picture=(image,alt='')=>'<img class="game-photo" src="assets/rescate/'+image+'.webp" alt="'+esc(alt)+'" loading="lazy" width="640" height="360">';
const chip=(icon,text,cls='')=>'<span class="vchip '+cls+'"><i>'+icon+'</i>'+esc(text)+'</span>';
const vcard=(image,title,{badge='',done=false,cls=''}={},body='')=>'<article class="vcard '+(done?'done ':'')+cls+'"><div class="vcard-media">'+picture(image,title)+(badge?'<span class="vbadge">'+badge+'</span>':'')+'<h3>'+esc(title)+'</h3></div><div class="vcard-body">'+body+'</div></article>';
const button=(label,action,id,disabled=false,extra='')=>'<button class="btn small" data-action="'+action+'" data-id="'+esc(id||'')+'" '+(disabled?'disabled':'')+' '+extra+'>'+esc(label)+'</button>';
export function eventHTML(s){
 const event=J.EVENTS.find(x=>x.id===s.tenfe.game.event?.id);if(!event)return '';
 return '<article class="game-event" data-narration-key="event-'+event.id+'" data-person="'+message('event-'+event.id).person+'" aria-labelledby="event-title">'+picture(event.image,event.title)+'<div><span class="kicker">Suceso del turno '+J.turn(s)+'</span><h2 id="event-title">'+esc(event.title)+'</h2>'+card('event-'+event.id)+'<div class="game-event-options">'+event.choices.map((x,i)=>'<button class="choice" data-action="game-event" data-id="'+event.id+'" data-choice="'+i+'" '+(s.cash<x.cost||s.ended?'disabled':'')+'><strong>'+esc(x.label)+' · '+money(x.cost)+'</strong><span>'+esc(x.detail)+'</span></button>').join('')+'</div></div></article>';
}
export function missionHTML(s){
 const g=s.tenfe.game,won=g.challenges.length,mandates=s.tenfe.elections.filter(x=>x.won).length;
 return '<span class="kicker">Conexiones · turno '+J.turn(s)+'</span><h2>'+(g.won?'Una red que merece continuar':'Un país por conectar')+'</h2><p class="small">'+won+'/5 retos · '+mandates+'/2 mandatos</p><ul>'+J.CHALLENGES.map(d=>'<li class="'+(g.challenges.includes(d.id)?'done':'')+'"><i></i><span>'+esc(d.name)+'</span><span>'+ (g.challenges.includes(d.id)?'✓':'○')+'</span></li>').join('')+'</ul><p class="small muted">Tu red, tus tarifas y tus decisiones cuentan desde el primer turno.</p>';
}
export function campaignHTML(s){
 const g=s.tenfe.game,won=s.tenfe.elections.filter(x=>x.won).length;
 const result=g.won?'<article class="game-result">'+picture('fin-victoria')+'<h2>Tu red ya es un legado.</h2>'+card('victory')+'</article>':s.ended?'<article class="game-result">'+picture('fin-derrota')+'<h2>El consejo cambia de dirección.</h2>'+card('defeat')+'</article>':'';
 const summary='<div class="vsummary"><div class="vring" style="--p:'+(g.challenges.length*20)+'%"><b>'+g.challenges.length+'/5</b><small>retos</small></div><div class="vring" style="--p:'+(won*50)+'%"><b>'+won+'/2</b><small>elecciones</small></div></div>';
 return result+summary+'<div class="vgrid game-challenges">'+J.CHALLENGES.map(d=>{const ok=g.challenges.includes(d.id);return vcard('etapa-'+d.id,d.name,{badge:ok?'✓':'+'+number(d.reward)+' M€',done:ok},'<p>'+esc(d.text)+'</p>');}).join('')+'</div>';
}
export function researchHTML(s){
 const g=s.tenfe.game,cur=g.research&&J.RESEARCH.find(x=>x.id===g.research.id);
 const head='<div class="vsummary">'+chip('★',number(g.stars)+' innovación','big')+(cur?'<div class="vprogress"><span>'+esc(cur.name)+'</span><div class="meter"><span style="width:'+Math.max(5,100-(g.research.due-s.month)/cur.turns*100)+'%"></span></div><small>'+(g.research.due-s.month)+' turnos</small></div>':'')+'</div>';
 return head+'<div class="vgrid game-research">'+J.RESEARCH.map(d=>{const q=J.researchQuote(s,d.id),owned=g.tech.includes(d.id);
  return vcard('tech-'+d.id,d.name,{badge:owned?'✓':'N'+d.tier,done:owned},'<p>'+esc(d.effect)+'</p><div class="vchips">'+chip('★',d.stars)+chip('€',money(d.cost))+chip('⏱',d.turns+' t')+'</div>'+(owned?'':button('Investigar','game-research',d.id,!!q.reason,q.reason?'title="'+esc(q.reason)+'"':'')));}).join('')+'</div>';
}
export function megaHTML(s){
 return '<div class="vgrid wide tenfe-megas game-megas">'+J.PROJECTS.map(d=>{
  const p=s.tenfe.megas.find(x=>x.id===d.id),q=J.megaQuote(s,d.id),reason=q.reason||(s.cash<q.cost?'Falta caja':s.ended?'Mandato terminado':''),stage=p?.stage||0;
  const steps='<div class="vsteps">'+d.stages.map((x,i)=>'<i class="'+(i<stage?'done':i===stage?'now':'')+'" title="'+esc(x.name)+'"></i>').join('')+'</div>';
  const status=p?.due?chip('⏱','Faltan '+(p.due-s.month)+' t'):q.stage===4?chip('✓','En servicio','ok'):'<div class="vchips">'+chip('€',money(q.cost))+chip('⏱',q.months+' t')+'</div>';
  return vcard(d.image,d.name,{badge:stage+'/4',done:q.stage===4},'<p>'+esc(d.effect)+'</p>'+steps+status+(q.stage===4||p?.due?'':button('Encargar fase','tenfe-mega',d.id,!!reason,reason?'title="'+esc(reason)+'"':'')));
 }).join('')+'</div>';
}
export function supportHTML(s){
 const g=s.tenfe.game,rows=[['riders','Viajeros',34,'👥'],['territory','Territorios',20,'🏘'],['staff','Plantilla',20,'🛠'],['treasury','Economía',26,'💶']],f=J.forecast(s);
 return '<div class="vbanner">'+picture('elecciones')+'<div><div class="vring '+(f>=50?'ok':'bad')+'" style="--p:'+Math.min(100,f)+'%"><b>'+f.toFixed(0)+'%</b><small>apoyo</small></div>'+chip('🗳','Urnas en '+Math.max(1,J.electionMonth(s)-s.month)+' turnos','big')+'</div></div>'+
 '<div class="vbars tenfe-group-list">'+rows.map(([k,name,weight,ic])=>{const v=Math.round(s.tycoon.groups[k]);return '<div class="vbar '+(v>=50?'ok':'bad')+'"><span>'+ic+' '+name+' <small>'+weight+'%</small></span><div class="meter"><span style="width:'+v+'%"></span></div><b>'+v+'</b></div>';}).join('')+'</div>'+
 (s.tenfe.elections.length?'<div class="vchips">'+s.tenfe.elections.map(x=>chip(x.won?'✓':'×',x.support.toFixed(0)+'%',x.won?'ok':'bad')).join('')+'</div>':'');
}
export function pactsHTML(s){
 const active=s.tenfe.pacts.filter(x=>x.status==='active').length;
 return '<div class="vsummary">'+chip('🤝',active+'/2 activos','big')+'</div><div class="vlist tenfe-pacts">'+J.PACTS.map(d=>{
  const p=s.tenfe.pacts.find(x=>x.id===d.id),reason=active>=2?'Ya hay dos pactos activos':s.cash<d.cost?'Falta caja':s.ended?'Mandato terminado':'';
  const state=p?(p.status==='active'?chip('⏳',p.kept+'/3 · '+Math.max(0,p.until-s.month)+' t'):p.status==='won'?chip('✓','Cumplido','ok'):chip('×','Incumplido','bad')):button('Firmar','tenfe-pact',d.id,!!reason,reason?'title="'+esc(reason)+'"':'');
  return '<article class="vrow"><img src="'+face(d.person,'happy')+'" width="52" height="64" alt=""><div><h3>'+esc(d.name)+'</h3><p>'+esc(d.requirement)+'</p><div class="vchips">'+chip('€',d.advance?'+'+money(d.advance):money(d.cost))+chip('🏆',money(d.reward))+chip('⏱',d.months+' t')+'</div></div><div class="vrow-end">'+state+'</div></article>';
 }).join('')+'</div>';
}
export function newsHTML(s){
 return eventHTML(s)+(s.tenfe.game.news.length?'<div class="vgrid game-news">'+s.tenfe.game.news.map(x=>vcard(x.image,x.title,{badge:'T'+x.turn},card(newsKey(x),{details:x.body}))).join('')+'</div>':'<div class="vempty">📰<p>Sin noticias todavía</p></div>');
}
export function boardHTML(s){
 const nodes=Object.fromEntries(J.HUBS.map(x=>[x.id,x])),routes=s.routes.filter(r=>J.NETWORK.includes(r.id)),colors={AVE:'#ffbd65',Alvia:'#85bbff',Regional:'#8ce0b6'};
 const edges=routes.map((r,i)=>{const a=nodes[r.ends[0]],b=nodes[r.ends[1]];if(!a||!b)return '';
 const mx=(a.x+b.x)/2+((i%3)-1)*4,my=(a.y+b.y)/2+((i%5)-2)*3,path='M '+a.x+' '+a.y+' Q '+mx+' '+my+' '+b.x+' '+b.y;
 const color=r.active?(colors[E.product(s,r)]||'#8ce0b6'):'#657c80';
 return '<path d="'+path+'" stroke="'+color+'" stroke-width="'+(r.active?'.65':'.4')+'" fill="none" '+(r.active?'':'stroke-dasharray="1 1.5"')+'/><path class="board-hit" d="'+path+'" stroke="transparent" stroke-width="3" fill="none" data-action="route" data-id="'+r.id+'"><title>'+esc(E.routeName(r))+'</title></path>'+(r.active&&s.ops?.phase==='running'?'<path class="board-train" d="'+path+'" stroke="#fff" stroke-width=".9" stroke-linecap="round" stroke-dasharray=".4 100" fill="none"/>':'');
 }).join('');
 return '<div class="board-heading"><span class="kicker">CONEXIONES · TU RED</span><h2>El próximo tren lo decides tú.</h2><p>'+s.routes.filter(r=>r.active).length+' servicios · '+number(E.balance(s).passengers)+' viajeros previstos · '+(3-s.projects.filter(p=>!p.done).length-s.tenfe.megas.filter(p=>p.due).length)+' cuadrillas libres</p></div>'+
 '<div class="board-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Conexiones ferroviarias">'+edges+'</svg>'+J.HUBS.map(x=>'<button class="board-hub '+(s.routes.some(r=>r.active&&r.ends.includes(x.id))?'connected':'')+'" style="left:'+x.x+'%;top:'+x.y+'%" data-action="city" data-id="'+x.id+'"><i></i><span>'+esc(x.name)+'</span></button>').join('')+'</div><div class="board-legend"><span><i style="background:#ffbd65"></i>AVE</span><span><i style="background:#85bbff"></i>Alvia</span><span><i style="background:#8ce0b6"></i>Regional</span><span>··· Conexión por abrir</span></div>';
}


export function scandalHTML(s){
 const u=s.tenfe,c=u.scandal,amount=u.game.tech.includes('contabilidad')?60:45,risk=Math.round(u.game.risk);
 return '<div class="vbanner">'+picture('cloacas')+'<div><div class="vring '+(risk<50?'ok':'bad')+'" style="--p:'+risk+'%"><b>'+risk+'</b><small>sospecha</small></div></div></div>'+
 (c?'<div class="vchips">'+chip('€',money(c.amount))+chip('⚖',c.exposed?'Público':'En revisión',c.exposed?'bad':'')+'</div><div class="toolbar">'+button('Restituir fondos','tenfe-restitute','',s.cash<Math.max(0,c.amount-(u.game.tech.includes('destructora')?10:0))||s.ended)+button('Revisión · 8 M€','tenfe-lawyer','',!!c.delay||s.cash<8||s.ended)+'</div>':
 '<div class="vchips">'+chip('€','+'+amount+' M€')+chip('🔎','Inspección en 6 t')+chip('⚖','Multa 15 M€','bad')+'</div>'+button('Revisar el atajo','tenfe-shortcut','',s.ended||s.month<u.cooldown));
}
