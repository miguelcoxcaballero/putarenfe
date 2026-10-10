
import * as J from './conexiones.js';
let E,face;
export function bind(engine,faceURL){E=engine;face=faceURL;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:1})+' M€';
const number=x=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:0});
const picture=(image,alt='')=>'<img class="game-photo" src="assets/rescate/'+image+'.webp" alt="'+esc(alt)+'" loading="lazy" width="640" height="360">';
const button=(label,action,id,disabled=false,extra='')=>'<button class="btn small" data-action="'+action+'" data-id="'+esc(id||'')+'" '+(disabled?'disabled':'')+' '+extra+'>'+esc(label)+'</button>';
export function eventHTML(s){
 const event=J.EVENTS.find(x=>x.id===s.tenfe.game.event?.id);if(!event)return '';
 return '<article class="game-event" aria-labelledby="event-title">'+picture(event.image,event.title)+'<div><span class="kicker">Suceso del turno '+J.turn(s)+'</span><h2 id="event-title">'+esc(event.title)+'</h2><p>'+esc(event.body)+'</p><div class="game-event-options">'+event.choices.map((x,i)=>'<button class="choice" data-action="game-event" data-id="'+event.id+'" data-choice="'+i+'" '+(s.cash<x.cost||s.ended?'disabled':'')+'><strong>'+esc(x.label)+' · '+money(x.cost)+'</strong><span>'+esc(x.detail)+'</span></button>').join('')+'</div></div></article>';
}
export function missionHTML(s){
 const g=s.tenfe.game,won=g.challenges.length,mandates=s.tenfe.elections.filter(x=>x.won).length;
 return '<span class="kicker">Conexiones · turno '+J.turn(s)+'</span><h2>'+(g.won?'Una red que merece continuar':'Un país por conectar')+'</h2><p class="small">'+won+'/5 retos · '+mandates+'/2 mandatos</p><ul>'+J.CHALLENGES.map(d=>'<li class="'+(g.challenges.includes(d.id)?'done':'')+'"><i></i><span>'+esc(d.name)+'</span><span>'+ (g.challenges.includes(d.id)?'✓':'○')+'</span></li>').join('')+'</ul><p class="small muted">Tu red, tus tarifas y tus decisiones cuentan desde el primer turno.</p>';
}
export function campaignHTML(s){
 const g=s.tenfe.game;
 return '<div class="tenfe-title"><span class="kicker">Tu mandato · Conexiones</span><h2>Cinco retos, una compañía</h2><p>Resuelve un suceso por turno, amplía una red fiable y gana dos elecciones. El mapa, el consejo, el laboratorio y Trenes Pop están disponibles desde el principio.</p></div>'+
 (g.won?'<article class="game-result">'+picture('fin-victoria')+'<h2>Tu red ya es un legado.</h2><p>Has ganado. Puedes seguir dirigiendo y ampliando sin límite de fecha.</p></article>':s.ended?'<article class="game-result">'+picture('fin-derrota')+'<h2>El consejo cambia de dirección.</h2><p>Revisa tu red y los informes antes de probar una estrategia nueva.</p></article>':'')+
 '<div class="game-challenges">'+J.CHALLENGES.map(d=>'<article>'+picture('etapa-'+d.id)+'<div><span class="kicker">'+(g.challenges.includes(d.id)?'✓ Cumplido':'Objetivo abierto')+'</span><h3>'+esc(d.name)+'</h3><p>'+esc(d.text)+'</p><strong>'+money(d.reward)+' al cumplir</strong></div></article>').join('')+'</div>'+
 '<section class="callout"><strong>Cómo se juega</strong><p>Un turno liquida la operación de tu red y avanza pedidos, obras y formación. Puedes observar una jornada con trenes e incidencias o delegar el turno. Hay tres cuadrillas para obras y fases, dos pactos activos y una investigación por laboratorio. Las elecciones llegan cada 12 turnos; se usa la media de apoyo de los últimos tres cierres. Los cinco retos y dos victorias electorales completan la partida.</p></section>';
}
export function researchHTML(s){
 const g=s.tenfe.game;
 return '<section class="game-lab"><span class="kicker">Laboratorio de la red · '+number(g.stars)+' puntos de innovación</span><h2>Ideas que cambian tu servicio</h2><p class="small">Cada cierre aporta 3 puntos; con ≥85 % de puntualidad, 2 más. Los hitos y sucesos aportan innovación adicional.</p>'+
 (g.research?'<p class="callout">Investigando '+esc(J.RESEARCH.find(x=>x.id===g.research.id).name)+' · faltan '+(g.research.due-s.month)+' turnos.</p>':'')+
 '<div class="game-research">'+J.RESEARCH.map(d=>{const q=J.researchQuote(s,d.id),owned=g.tech.includes(d.id);return '<article class="'+(owned?'done':'')+'">'+picture('tech-'+d.id)+'<div><small>'+esc(d.branch)+' · nivel '+d.tier+'</small><h3>'+esc(d.name)+'</h3><p>'+esc(d.effect)+'</p><small>'+d.stars+' innovación · '+money(d.cost)+' · '+d.turns+' turnos</small>'+button(owned?'✓ Terminada':'Investigar','game-research',d.id,!!q.reason)+(q.reason&&!owned?'<p class="small muted">'+esc(q.reason)+'</p>':'')+'</div></article>';}).join('')+'</div></section>';
}
export function megaHTML(s){
 return '<h2>Grandes obras, efectos desde cada fase</h2><p class="small">Tres cuadrillas compartidas entre obras de vía y fases de megaproyectos. Hasta tres fases simultáneas; cada proyecto avanza de una en una.</p><div class="tenfe-megas game-megas">'+J.PROJECTS.map(d=>{
 const p=s.tenfe.megas.find(x=>x.id===d.id),q=J.megaQuote(s,d.id),reason=q.reason||(s.cash<q.cost?'Falta caja':s.ended?'Mandato terminado':'');
 return '<article>'+picture(d.image)+'<div><h3>'+esc(d.name)+'</h3><p>'+esc(d.effect)+'</p><div class="tenfe-phase">'+d.stages.map((x,i)=>'<span class="'+(i<(p?.stage||0)?'done':i===(p?.stage||0)?'now':'')+'">'+esc(x.name)+'</span>').join('')+'</div><p class="small">'+(p?.due?'Faltan '+(p.due-s.month)+' turnos':q.stage===4?'En servicio':esc(q.phase)+' · '+money(q.cost)+' · '+q.months+' turnos')+'</p>'+button(q.stage===4?'✓ Terminado':'Encargar fase','tenfe-mega',d.id,!!reason)+(reason?'<small class="action-reason">'+esc(reason)+'</small>':'')+'</div></article>';
 }).join('')+'</div>';
}
export function supportHTML(s){
 const g=s.tenfe.game,rows=[['riders','Viajeros',34],['territory','Territorios',20],['staff','Plantilla',20],['treasury','Economía',26]];
 return picture('elecciones')+'<h2>Una red que se gana el apoyo</h2><dl class="figures"><div><dt>Encuesta de 3 cierres</dt><dd>'+J.forecast(s).toFixed(1)+' %</dd></div><div><dt>Próximas urnas</dt><dd>'+Math.max(1,J.electionMonth(s)-s.month)+' turnos</dd></div></dl><p class="small">Se renueva con 50 % de apoyo. Viajeros y plantilla valoran el servicio; los territorios, la cobertura; la economía, tus cuentas.</p>'+
 '<div class="tenfe-group-list">'+rows.map(([k,name,weight])=>'<div><span><strong>'+name+'</strong><small>'+weight+' % del voto</small></span><div class="meter"><span style="width:'+s.tycoon.groups[k]+'%"></span></div><b>'+Math.round(s.tycoon.groups[k])+' %</b></div>').join('')+'</div>'+
 '<h3>Mandatos</h3>'+(s.tenfe.elections.map(x=>'<p>'+ (x.won?'✓':'×')+' Cierre '+(x.month-g.origin)+' · '+x.support.toFixed(1)+' %</p>').join('')||'<p>Primera elección al cerrar el turno 12.</p>');
}
export function pactsHTML(s){
 return '<h2>Dos pactos, compromisos reales</h2><p class="small">Están disponibles desde el primer turno. Una promesa cumplida vale más que una inauguración.</p><div class="tenfe-pacts">'+J.PACTS.map(d=>{
 const p=s.tenfe.pacts.find(x=>x.id===d.id),reason=s.tenfe.pacts.filter(x=>x.status==='active').length>=2?'Ya hay dos pactos activos':s.cash<d.cost?'Falta caja':s.ended?'Mandato terminado':'';
 return '<article><img src="'+face(d.person,'happy')+'" width="56" height="72" alt=""><div><h3>'+esc(d.name)+'</h3><p>'+esc(d.requirement)+'</p><small>'+(d.advance?'Anticipo '+money(d.advance):'Coste '+money(d.cost))+' · premio '+money(d.reward)+' · '+d.months+' turnos</small>'+(p?'<p>'+ (p.status==='active'?p.kept+'/3 cierres · '+Math.max(0,p.until-s.month)+' turnos restantes':p.status==='won'?'✓ Cumplido':'× Incumplido')+'</p>':'')+'</div><div>'+(p?'':button('Firmar pacto','tenfe-pact',d.id,!!reason))+'</div></article>';
 }).join('')+'</div>';
}
export function newsHTML(s){
 return '<h2>Tu red, en imágenes</h2><p>Los sucesos, objetivos, investigaciones y obras conservan sus ilustraciones y sus consecuencias.</p>'+eventHTML(s)+'<div class="game-news">'+s.tenfe.game.news.map(x=>'<article>'+picture(x.image)+'<div><span class="kicker">Turno '+x.turn+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p></div></article>').join('')+'</div>';
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
 const u=s.tenfe,c=u.scandal,amount=u.game.tech.includes('contabilidad')?60:45;
 return picture('cloacas')+'<h2>El dinero fácil deja huella</h2><p>El atajo entrega '+amount+' M€ de financiación irregular. La inspección llega tras 6 turnos y la restitución de lo recibido más 15 M€ de multa, tras 12. Revisar el expediente aplaza ambos plazos.</p>'+
 (c?'<dl class="figures"><div><dt>Fondos recibidos</dt><dd>'+money(c.amount)+'</dd></div><div><dt>Expediente</dt><dd>'+ (c.exposed?'Público':'En revisión')+'</dd></div></dl><div class="toolbar">'+button('Restituir fondos','tenfe-restitute','',s.cash<Math.max(0,c.amount-(u.game.tech.includes('destructora')?10:0))||s.ended)+button('Revisión · 8 M€','tenfe-lawyer','',!!c.delay||s.cash<8||s.ended)+'</div>':
 button('Revisar el atajo','tenfe-shortcut','',s.ended||s.month<u.cooldown))+
 '<p class="small">Sospecha: '+Math.round(u.game.risk)+' / 100. La investigación, la prensa y la devolución de fondos tienen consecuencias en tu apoyo.</p>';
}
