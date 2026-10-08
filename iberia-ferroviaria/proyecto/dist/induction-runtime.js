import {INDUCTION_STAGES} from './induction.js';
// El turno de iniciación guarda lo leído y lo hecho; salir no equivale a completarlo.
export const INDUCTION_VERSION = 1;
export function freshInduction(s) {
 const r=s.routes.find(r=>r.id==='madrid-valencia');
 return {version:1,done:false,suspended:false,step:0,phase:'briefing',line:0,marks:[],answers:{},feedback:null,baseline:{frequency:r?.frequency||1,fare:r?.fare||0,day:s.ops?.day||1,completed:s.ops?.completed||0,training:s.tycoon.training.reduce((n,x)=>n+x.count,0)}};
}
export function handoffAccepted(s){
 return s.tycoon.completed>0||s.tycoon.contracts.some(q=>['active','won'].includes(q.status))||s.tycoon.resolved.some(q=>q.result==='won');
}
// A completed counter proves a signature, but cannot reconstruct its branch.
export function handoffBranch(s){
 const signed=s.tycoon.contracts.find(q=>q.status==='active')||s.tycoon.contracts.find(q=>q.status==='won')||[...s.tycoon.resolved].reverse().find(q=>q.result==='won');
 return ['public','commercial'].includes(signed?.branch)?signed.branch:null;
}
export function canInductionAnswer(s,t,id){
 const stage=INDUCTION_STAGES[t?.step];
 if(t?.phase!=='task'||!stage?.choice?.options.some(o=>o.id===id)||t.answers[stage.id])return false;
 const branch=stage.id==='handoff'?handoffBranch(s):null;
 return stage.id!=='handoff'||handoffAccepted(s)&&(!branch||id===branch);
}
// Older saves could record the opposite branch even after the contract was signed.
// Repair display/confirmation state without changing the contract or its effects.
export function restoreInductionHandoff(s,t){
 const stage=INDUCTION_STAGES[t?.step];if(stage?.id!=='handoff')return;
 const branch=handoffBranch(s);if(!branch)return;
 if(t.answers?.handoff)t.answers.handoff=branch;
 if(t.feedback&&stage.choice.options.some(o=>o.id===t.pendingAnswer)){
  t.pendingAnswer=branch;t.feedback=stage.choice.options.find(o=>o.id===branch).feedback;
 }
}
// Reuse a recorded, generic line after the initial contract context changes.
// The normal first turn and its original dialogue catalog remain untouched.
export function inductionBriefing(s,stage){
 if(stage.id!=='handoff')return stage.briefing;
 const initial=s.month===0&&s.tycoon.contracts.some(q=>q.id==='mission-0'&&q.goal==='passengers'&&['offered','active','won'].includes(q.status));
 return initial?stage.briefing:[stage.briefing[2]];
}
// Saved feedback is display state; the chosen option owns the current dialogue.
export function inductionFeedback(t){
 return INDUCTION_STAGES[t.step]?.choice?.options.find(o=>o.id===t.pendingAnswer)?.feedback||null;
}
export function inductionFeedbackLine(s,t){
 const stage=INDUCTION_STAGES[t.step];if(!stage?.choice)return null;
 if(stage.id==='handoff'){
  const branch=handoffBranch(s);
  if(!branch){
   // This neutral, already-recorded feedback does not invent a historical branch.
   const neutral=INDUCTION_STAGES[0];
   return {who:neutral.briefing[0].who,mood:'determined',text:neutral.choice.options.find(o=>o.id==='balanced').feedback};
  }
  return {who:stage.briefing[0].who,mood:'determined',text:stage.choice.options.find(o=>o.id===branch).feedback};
 }
 return {who:stage.briefing[0].who,mood:'determined',text:inductionFeedback(t)};
}
export function validInduction(t,s){
 if(t===undefined||t===null)return true;
 if(typeof t!=='object'||typeof t.done!=='boolean')return false;
 if(t.version===undefined)return true;
 if(t.version!==1||typeof t.suspended!=='boolean'||!Number.isInteger(t.step)||t.step<0||t.step>=INDUCTION_STAGES.length||!['briefing','task','debrief'].includes(t.phase))return false;
 const stage=INDUCTION_STAGES[t.step],lines=t.phase==='debrief'?stage.debrief:stage.briefing;
 if(!Number.isInteger(t.line)||t.line<0||t.line>=(t.phase==='task'?1:lines.length))return false;
 const marks=['gauge','power','salamanca','preview','people','market','research','agenda','paper','soria-quote','hold-investment','incident-resolved','report'];
 if(!Array.isArray(t.marks)||t.marks.length>marks.length||new Set(t.marks).size!==t.marks.length||t.marks.some(x=>!marks.includes(x)))return false;
 if(!t.answers||typeof t.answers!=='object'||Array.isArray(t.answers))return false;
 for(const [id,value] of Object.entries(t.answers)){
  if(id==='incident'){if(typeof value!=='string'||!/^inc-tut-\d{1,3}-\d{1,2}$/.test(value))return false;continue;}
  const q=INDUCTION_STAGES.find(x=>x.id===id)?.choice;
  if(!q?.options.some(o=>o.id===value&&o.correct!==false))return false;
 }
 const base=t.baseline,route=s?.routes?.find(r=>r.id==='madrid-valencia');
 if(!base||!Number.isInteger(base.frequency)||base.frequency<1||base.frequency>(route?.real?route.baseFrequency:12)||!Number.isFinite(base.fare)||base.fare<1.5||base.fare>150||!Number.isInteger(base.day)||base.day<1||base.day>31||!Number.isInteger(base.completed)||base.completed<0||!Number.isInteger(base.training)||base.training<0)return false;
 if(t.feedback&&(typeof t.feedback!=='string'||t.feedback.length>1500||!stage.choice?.options.some(o=>o.id===t.pendingAnswer)))return false;
 return true;
}
export function note(t,key){if(t&&!t.done&&!t.marks.includes(key))t.marks.push(key);}
export function stageChecks(s,t){
 if(!t||t.done)return [];
 const id=INDUCTION_STAGES[t.step]?.id,seen=k=>t.marks.includes(k),answer=!!t.answers[id],r=s.routes.find(r=>r.id==='madrid-valencia');
 const check=(label,done)=>({label,done:!!done});
 switch(id){
 case 'mandate':return [check('Elegir una prioridad y leer su coste',answer)];
 case 'diagnosis':return [check('Consultar los anchos y la electrificación',seen('gauge')&&seen('power')),check('Comparar AVE y Alvia en Madrid — Salamanca',seen('salamanca')),check('Resolver el diagnóstico de la vía',answer)];
 case 'offer':return [check('Cambiar y aplicar las salidas de Madrid — València',r?.frequency>t.baseline.frequency),check('Cambiar y aplicar la tarifa de esa relación',r?.fare!==t.baseline.fare),check('Consultar la previsión antes de aplicar',seen('preview'))];
 case 'people':return [check('Comparar maquinistas disponibles y necesarios',seen('people')),check('Decidir con tres meses de antelación',answer)];
 case 'competition':return [check('Consultar las tarifas y frecuencias de OuiOui',seen('market')),check('Comparar políticas y proyectos de investigación',seen('people')&&seen('research')),check('Elegir una inversión o conservar la caja',!!s.tycoon.research||s.tycoon.tech.length>0||s.tycoon.policies.length>0||seen('hold-investment'))];
 case 'infrastructure':return [check('Abrir Madrid — Salamanca con material compatible',s.routes.find(r=>r.id==='madrid-salamanca')?.active),check('Consultar el presupuesto de catenaria de Torralba — Soria',seen('soria-quote')),check('Explicar qué resuelve la obra',answer)];
 case 'incident':return [check('Iniciar la jornada y atender la avería de iniciación',seen('incident-resolved')||(!!t.answers.incident&&s.ops.resolved.includes(t.answers.incident)))];
 case 'review':return [check('Cerrar la jornada y consultar el parte',s.ops.completed>t.baseline.completed&&seen('report')),check('Pasar a la siguiente jornada',s.ops.completed>t.baseline.completed&&s.ops.phase==='planning')];
 case 'handoff':return [check('Aceptar un encargo público o comercial',handoffAccepted(s)),check('Elegir cómo cumplirlo',answer)];
 default:return [];
 }
}
export const readyInduction=(s,t)=>{const c=stageChecks(s,t);return c.length>0&&c.every(x=>x.done);};
