import {INDUCTION_STAGES} from './induction.js';
import * as E from './engine.js';
import * as T from './tycoon.js';
import * as O from './operations.js';
import * as I from './infra.js';
import {MODEL} from './data.js';
import {handoffAccepted,handoffBranch} from './induction-runtime.js';
import {brandLogo} from './brands.js';

// El turno guiado usa las mismas acciones y precios que el despacho. Cada vista
// presenta una sola decisión; consultar un dato no compra ni adjudica nada.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=0)=>Number(x||0).toLocaleString('es-ES',{maximumFractionDigits:d});
const money=x=>num(x,Math.abs(x)<10?2:1)+' M€';
const button=(action,id,label,disabled=false,extra='')=>`<button class="btn ${action==='tutorial-view'?'primary':''}" data-action="${action}" data-id="${esc(id)}" ${disabled?'disabled':''} ${extra}>${label}</button>`;
const facts=rows=>`<dl class="figures lesson-facts">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const question=(stage,s=null)=>{
 const branch=stage.id==='handoff'&&s?handoffBranch(s):null;
 const historical=stage.id==='handoff'&&!branch;
 const options=branch?stage.choice.options.filter(o=>o.id===branch):stage.choice.options;
 return `${historical?'<p class="lesson-instruction">Ya completaste un encargo. Su rama no figura en el historial conservado; decide cómo orientar el siguiente.</p>':''}<fieldset class="induction-question"><legend>${esc(historical?'¿Qué priorizarás en tu siguiente encargo?':stage.choice.prompt)}</legend>${options.map(o=>{
 const text=stage.id==='handoff'?historical?(o.id==='public'?'Priorizar conexiones y apoyo territorial.':'Priorizar ingresos y sostener la caja.'):(o.id==='public'?'Cumplir el plan público firmado y cuidar el apoyo territorial.':'Cumplir el plan comercial firmado y sostener la caja.'):o.text;
 return `<button class="btn lesson-choice" data-action="tutorial-answer" data-choice="${esc(o.id)}"><b>${esc(o.title)}</b><span>${esc(text)}</span></button>`;
 }).join('')}</fieldset>`;
};
const completed=text=>`<p class="lesson-complete"><span aria-hidden="true">✓</span> ${esc(text)}</p>`;
const route=(s,id)=>s.routes.find(r=>r.id===id);

function routeGaugeFacts(s,r){
 const p=E.routeOptions(s,r).alvia;
 const gauges=[...new Set(p.tramos.map(tr=>s.infra.t[tr.id]?.g).filter(Boolean))];
 return facts([['Anchos del recorrido',gauges.map(g=>esc(I.GAUGE_LABEL[g])).join(' + ')],['Cambio de ancho',p.changes.length?'Cambiador disponible':'Sin cambio necesario']]);
}
function routePowerFacts(s,r){
 const p=E.routeOptions(s,r).alvia;
 const powers=[...new Set(p.tramos.map(tr=>s.infra.t[tr.id]?.e).filter(Boolean))];
 return facts([['Alimentación',powers.map(e=>esc(I.ELEC_LABEL[e])).join(' + ')],['Tren eléctrico',p.faults.some(f=>f.type==='elec')?'Falta catenaria':'Puede alimentarse en todo el trayecto']]);
}
function vehicleComparison(s,r){
 const options=E.routeOptions(s,r);
 return `<table class="lesson-table"><thead><tr><th>Material</th><th>Madrid — Salamanca</th></tr></thead><tbody>${[['ave','AVE'],['alvia','Alvia eléctrico'],['hybrid','Alvia híbrido']].map(([key,label])=>`<tr><th>${label}</th><td>${options[key].ok?'Compatible':esc(I.faultText(s,options[key].faults[0]))}</td></tr>`).join('')}</tbody></table>`;
}
function offer(s,t){
 const r=route(s,'madrid-valencia'),max=E.maxFrequency(r),lots=s.fleet.filter(f=>f.qty>0&&E.canRun(s,r,MODEL[f.model]));
 if(r.frequency>t.baseline.frequency&&r.fare!==t.baseline.fare&&t.marks.includes('preview'))return completed('Nueva oferta de València aplicada.');
 return `<form id="routeForm" class="lesson-route-form"><label for="routeFleet">Material</label><select id="routeFleet">${lots.map(f=>`<option value="${esc(f.id)}" ${f.id===r.fleet?'selected':''}>${esc(MODEL[f.model].name)} · ${E.available(s,f,r.id)} libres</option>`).join('')}</select><label for="frequency">Salidas por sentido: <strong id="freqOut">${r.frequency}</strong></label><input id="frequency" type="range" min="1" max="${max}" step="1" value="${r.frequency}"><label for="fare">Tarifa media (€)</label><input id="fare" type="number" min="1.5" max="150" step="0.1" value="${r.fare}"><div id="routePreview" class="callout lesson-preview" aria-live="polite"></div><button class="btn primary" type="submit" ${!lots.length||s.ended?'disabled':''}>Aplicar plan</button></form>`;
}
function people(s,t,stage){
 const training=s.tycoon.training.reduce((n,x)=>n+x.count,0);
 if(!t.marks.includes('people'))return `<h4>Personal para tus servicios</h4>${facts([['Disponibles',num(s.tycoon.drivers)],['Necesarios',num(T.driverNeed(s))],['En formación',num(training)]])}<p class="lesson-instruction">Formar nuevos maquinistas tarda tres meses.</p>${button('tutorial-view','people','He comparado la plantilla')}`;
 if(t.answers.people)return completed('Plan de personal decidido.');
 return `${question(stage)}<details class="lesson-optional"><summary>Probar formación (opcional)</summary><p>20 alumnos · tres meses · 0,3 M€. Después, 30.000 €/mes sobre la plantilla inicial.</p>${button('tycoon-hire','20','Formar 20 · 0,3 M€',s.ended||s.cash<.3)}${training?`<p>${num(training)} alumnos en formación.</p>`:''}</details>`;
}
function competition(s,t){
 if(!t.marks.includes('market')){
  const r=s.routes.find(r=>r.active&&T.competition(s,r).some(c=>c.id==='lowgo'))||s.routes.find(r=>r.active&&T.competition(s,r).length), rivals=r?T.competition(s,r):[];
  return `<h4>${r?esc(E.routeName(r)):'Competencia'}</h4>${r?`<table class="lesson-table"><thead><tr><th>Operador</th><th>Tarifa</th><th>Salidas/sentido</th></tr></thead><tbody><tr><th><span style="display:block;width:72px;">${brandLogo('Tenfe')}</span><span class="small">Tu servicio</span></th><td>${num(r.fare,1)} €</td><td>${r.frequency}</td></tr>${rivals.map(c=>`<tr><th><span style="display:block;width:72px;">${brandLogo(c.name)}</span><span class="small">${esc(c.name)}</span></th><td>${num(c.fare,1)} €</td><td>${c.frequency}</td></tr>`).join('')}</tbody></table>`:'<p>No hay rivales activos en esta red.</p>'}${button('tutorial-view','market','Comparar inversiones')}`;
 }
 const items=[...['youth','wifi','dynamic'].map(id=>({id,...T.POLICIES[id],type:'policy'})),...['online','ertms'].map(id=>({id,...T.TECHS[id],type:'research'}))];
 if(!t.marks.includes('research'))return `<h4>Ventajas y costes</h4><table class="lesson-table lesson-investments"><thead><tr><th>Medida</th><th>Coste y efecto</th></tr></thead><tbody>${items.map(p=>`<tr><th>${esc(p.name)}</th><td><b>${money(p.cost)}${p.type==='policy'?'/mes':' · '+p.months+' meses'}</b><span>${esc(p.note)}</span></td></tr>`).join('')}</tbody></table>${button('tutorial-view','research','Ya puedo elegir')}`;
 if(s.tycoon.research||s.tycoon.tech.length||s.tycoon.policies.length||t.marks.includes('hold-investment'))return completed(t.marks.includes('hold-investment')?'Conservas la caja para invertir más adelante.':'Inversión elegida; sus costes y plazos ya están en marcha.');
 return `<h4>Elige una ventaja o conserva la caja</h4><div class="lesson-investment-options">${items.map(p=>`<div class="lesson-investment"><div><b>${esc(p.name)}</b><span>${money(p.cost)}${p.type==='policy'?'/mes':' · '+p.months+' meses'}</span></div>${button('tycoon-'+p.type,p.id,p.type==='policy'?'Activar':'Financiar',s.ended||(p.type==='research'&&(s.cash<p.cost||!!s.tycoon.research)))}</div>`).join('')}</div>${button('tutorial-hold','','Conservar la caja')}`;
}
function infrastructure(s,t,stage){
 const r=route(s,'madrid-salamanca');
 if(!r.active){
  let freq=Math.max(1,Math.round(E.maxFrequency(r)*.4));
  const rank=f=>MODEL[f.model].family==='AVE'?0:MODEL[f.model].power==='electric'?1:2;
  const lots=s.fleet.filter(f=>f.qty>0&&f.condition>=30&&E.canRun(s,r,MODEL[f.model]));
  const fits=f=>E.available(s,f,r.id)>=E.requiredUnits(s,r,MODEL[f.model],freq);
  const chosen=()=>lots.find(f=>f.id===r.fleet&&fits(f))||lots.filter(fits).sort((a,b)=>rank(a)-rank(b)||E.available(s,b,r.id)-E.available(s,a,r.id))[0];
  let f=chosen();while(!f&&freq>1){freq--;f=chosen();}
  return `<h4>Pon Salamanca en servicio</h4>${facts([['Material compatible',f?esc(MODEL[f.model].name):'No hay unidades disponibles'],['Apertura','4 M€'],['Oferta prevista',num(freq)+' salidas/sentido']])}${button('open-route',r.id,'Abrir Madrid — Salamanca · 4 M€',s.ended||s.cash<4||!f)}`;
 }
 if(!t.marks.includes('soria-quote')){
  const tramo=I.allTramos(s).find(x=>/Torralba.*Soria/i.test(x.name));
  let q,error='';try{q=tramo&&E.workQuote(s,'electrify',tramo.id);}catch(e){error=e.message;}
  return `<h4>Catenaria de Torralba — Soria</h4>${q?facts([['Presupuesto',money(q.cost)],['Duración',q.months+' meses'],['Corte de tráfico',q.closes?'Sí':'No']]):`<p>${esc(error||'Presupuesto no disponible.')}</p>`}<p class="lesson-instruction">Electrificar aporta energía; no cambia el ancho.</p>${button('tutorial-quote',tramo?.id||'','Consultar presupuesto sin adjudicar')}`;
 }
 return t.answers.infrastructure?completed('Salamanca abierta y presupuesto de Soria consultado.'):question(stage);
}
function incident(s,t){
 const op=s.ops||{phase:'planning',resolved:[],incidents:[]};
 if(t.marks.includes('incident-resolved')||op.resolved.includes(t.answers.incident))return completed('Incidencia atendida. Su resultado quedará en el parte.');
 if(op.phase==='review')return `<h4>Retoma la atención en otro turno</h4><p class="lesson-instruction">Esta jornada ya ha terminado. Prepara la siguiente para atender la avería.</p>${button('day-next','','Preparar la siguiente jornada')}`;
 if(op.phase!=='running')return `<h4>Pon tu plan en circulación</h4><p class="lesson-instruction">Atenderás una avería real durante esta jornada.</p>${button('day-start','','Comenzar jornada')}`;
 const x=op.incidents.find(x=>x.trip===t.answers.incident&&!op.resolved.includes(x.trip));
 if(!x)return `<h4>Prepara otro turno</h4><p class="lesson-instruction">Los últimos trenes ya están llegando. Cierra esta jornada y atiende la avería en la siguiente.</p>${button('tutorial-recover-day','','Cerrar esta jornada')}`;
 if(op.minute<x.at)return `<h4>Jornada en circulación</h4>${button('day-start','','Avanzar hasta la incidencia')}`;
 return `<h4>${esc(x.reason)}</h4>${facts([['Circulación',esc(x.label)],['Demora inicial','+'+num(x.delay)+' min']])}<div class="lesson-responses">${Object.entries(O.RESPONSES).map(([id,p])=>`<button class="btn lesson-choice" data-action="respond" data-id="${esc(x.trip)}" data-option="${id}" ${s.ended||s.cash<p.cost?'disabled':''}><b>${esc(p.label)}</b><span>${num(p.cost*1e6)} € · ${id==='team'?num(Math.round(x.delay*p.factor))+' min de demora':id==='bus'?'protege la satisfacción; ~'+num(Math.round(x.delay*p.factor))+' min de demora':'conserva los '+num(x.delay)+' min de demora'}</span></button>`).join('')}</div>`;
}
function review(s,t){
 const op=s.ops||{phase:'planning',completed:0,day:1};
 if(op.completed>t.baseline.completed&&t.marks.includes('report')&&op.phase==='planning')return completed('Parte revisado. La siguiente jornada está preparada.');
 if(op.phase==='running')return `<h4>Comprueba el resultado</h4><p class="lesson-instruction">Avanza hasta la última llegada para cerrar el día.</p>${button('day-end','','Hasta el último tren')}`;
 if(['review','planning'].includes(op.phase)&&op.last&&op.completed>t.baseline.completed){
  const l=op.last;
  return `<h4>Parte de ${esc(l.date)}</h4>${facts([['Viajeros',num(l.passengers)],['Puntualidad',num(l.punctuality)+' %'],['Resultado del día',money(l.net)],['Incidencias atendidas',l.attended+' / '+l.incidents]])}<p class="lesson-instruction">El balance mensual se liquida al cerrar el mes.</p>${op.phase==='review'?button('day-next','','Siguiente jornada'):button('tutorial-view','report','Parte revisado')}`;
 }
 return `<h4>Completa una jornada</h4>${button('day-start','','Comenzar jornada')}`;
}
function handoff(s,t,stage){
 if(!handoffAccepted(s)){
  const q=s.tycoon.contracts.find(q=>q.status==='offered');
  if(!q)return `<p class="lesson-instruction">Ahora no hay propuestas. Sigue gestionando y retoma esta guía desde Ayuda cuando llegue una.</p>${button('tutorial-skip','','Volver a dirigir')}`;
  if(q.goal==='project'){
   const format=x=>['margin','networkMargin','occupancy','staff'].includes(x.kind)?num(x.target*100,1)+' %':x.kind==='fare'?num(x.target,1)+' €':x.kind==='punctuality'?num(x.target,1)+' %':num(x.target);
   const plans=['public','commercial'].map(branch=>{
    const d=T.contractDetails(s,q,branch,r=>E.metrics(s,r)),ready=d.prerequisites.every(p=>p.ready),reassignable=d.prerequisites.every(p=>p.ready||p.reassignable);
    const material=ready?'Material disponible':reassignable?'Reasigna trenes antes de ampliar':'Revisa el taller y las entregas antes de firmar';
    return `<article data-branch="${branch}"><h5>${branch==='public'?'Servicio público':'Apuesta comercial'}</h5><p>Premio: ${money(d.reward)} · multa: ${money(d.penalty)}</p><p>${d.months} meses desde la firma · tres cierres mensuales consecutivos.</p><p class="small">${material}.${d.prerequisites.filter(p=>p.openCost).map(p=>` ${esc(p.name)}: apertura ${money(p.openCost)}.`).join('')}</p><ul class="small">${d.requirements.map(x=>`<li>${esc(x.label)}${x.route?` · ${esc(x.route)}`:''}${x.kind==='active'?'':`: ${x.kind==='fare'?'≤':'≥'} ${format(x)}`}</li>`).join('')}</ul>${button('tycoon-'+branch,q.id,branch==='public'?'Aceptar servicio público':'Aceptar apuesta comercial',s.ended)}</article>`;
   }).join('');
   return `<h4>${esc(q.project.title)}</h4><p class="lesson-instruction">Decide en ${Math.max(0,q.until-s.month)} meses. El premio se cobra al cumplir.</p><div class="lesson-contracts">${plans}</div>`;
  }
  const labels={passengers:'viajes nuevos',stations:'niveles de estación',services:'servicios nuevos',research:'investigaciones terminadas',satisfaction:'puntos de satisfacción'};
  const target=value=>q.goal==='satisfaction'?num(value,2):num(Math.ceil(value));
  return `<h4>${esc(T.ARCS[q.arc][0])}</h4><p class="lesson-instruction">Plazo: ${Math.max(0,q.until-s.month)} meses. El premio se cobra al cumplir.</p><div class="lesson-contracts"><article><h5>Servicio público</h5><p>${target(q.target)} ${labels[q.goal]}</p><p>Premio: 18 M€ · multa: ${money(q.penalty)}</p>${button('tycoon-public',q.id,'Aceptar servicio público',s.ended)}</article><article><h5>Apuesta comercial</h5><p>${target(q.target*1.25)} ${labels[q.goal]}</p><p>Premio: 26 M€ · multa: 8 M€</p>${button('tycoon-commercial',q.id,'Aceptar apuesta comercial',s.ended)}</article></div>`;
 }
 return t.answers.handoff?completed('Encargo confirmado. Ya puedes dirigir tu siguiente turno.'):question(stage,s);
}

export function focusedTaskHTML(s,t){
 const stage=INDUCTION_STAGES[t.step],seen=k=>t.marks.includes(k);
 switch(stage.id){
 case 'mandate':return t.answers.mandate?completed('Prioridad elegida.'):question(stage);
 case 'diagnosis':{
  const r=route(s,'madrid-salamanca');
  if(!seen('gauge'))return `<h4>Madrid — Salamanca: anchos</h4>${routeGaugeFacts(s,r)}${button('tutorial-view','gauge','Comprobar electrificación')}`;
  if(!seen('power'))return `<h4>Madrid — Salamanca: electrificación</h4>${routePowerFacts(s,r)}${button('tutorial-view','power','Comparar los trenes')}`;
  if(!seen('salamanca'))return `<h4>Qué material puede recorrer la línea</h4>${vehicleComparison(s,r)}${button('tutorial-view','salamanca','Resolver el diagnóstico')}`;
  return t.answers.diagnosis?completed('Material compatible identificado.'):question(stage);
 }
 case 'offer':return offer(s,t);
 case 'people':return people(s,t,stage);
 case 'competition':return competition(s,t);
 case 'infrastructure':return infrastructure(s,t,stage);
 case 'incident':return incident(s,t);
 case 'review':return review(s,t);
 case 'handoff':return handoff(s,t,stage);
 default:return '';
 }
}
