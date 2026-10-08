import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from './dist/engine.js';
import * as T from './dist/tycoon.js';
import * as O from './dist/operations.js';
import {focusedTaskHTML} from './dist/induction-task-ui.js';
import {menuHTML} from './dist/main-menu.js';
import {INDUCTION_STAGES,inductionLines} from './dist/induction.js';
import {freshInduction,note,readyInduction,stageChecks,handoffAccepted,handoffBranch,inductionBriefing,inductionFeedback,inductionFeedbackLine,canInductionAnswer,restoreInductionHandoff} from './dist/induction-runtime.js';
import {CHARACTERS} from './dist/story.js';
const lines=inductionLines();
const unchangedDialogueCatalog=JSON.stringify(lines);
for(const person of Object.keys(CHARACTERS))assert(lines.filter(l=>l.who===person).length>=3,`${person} debe intervenir varias veces`);
const mandatory=INDUCTION_STAGES.flatMap(s=>[s.briefing[0],...s.debrief]);
for(const person of Object.keys(CHARACTERS))assert(mandatory.filter(l=>l.who===person).length>=2,`${person} aparece antes y después de tareas útiles`);
assert(INDUCTION_STAGES.every(s=>s.briefing.length&&s.debrief.length&&s.objective&&s.hint));
const s=E.initialState();s.started=true;s.ops={day:3,phase:'planning',completed:0};
s.tutorial=freshInduction(s);const t=s.tutorial;
const at=id=>{t.step=INDUCTION_STAGES.findIndex(x=>x.id===id);t.phase='task';};
at('offer');assert(!readyInduction(s,t),'no basta visitar una ficha');
const r=s.routes.find(r=>r.id==='madrid-valencia'),f=r.frequency;
note(t,'preview');r.frequency--;r.fare+=1;assert(!readyInduction(s,t),'reducir frecuencia no cumple el refuerzo');r.frequency=f+1;assert(readyInduction(s,t),'aplicar frecuencia y tarifa sí cumple');r.frequency=f;
at('people');note(t,'people');assert(!readyInduction(s,t));t.answers.people='pipeline';assert(readyInduction(s,t),'la reserva inicial no exige contratar sin necesidad');
at('competition');note(t,'market');note(t,'research');assert(!readyInduction(s,t));const cash=s.cash;note(t,'hold-investment');assert(readyInduction(s,t),'conservar caja es una decisión válida');assert.equal(s.cash,cash);
at('infrastructure');s.routes.find(r=>r.id==='madrid-salamanca').active=true;note(t,'soria-quote');assert(!readyInduction(s,t),'abrir y mirar presupuesto no sustituye entender la vía');t.answers.infrastructure='power';assert(readyInduction(s,t));
at('incident');t.answers.incident='inc-tut-0-3';s.ops.resolved=[];assert(!readyInduction(s,t));s.ops.resolved.push(t.answers.incident);assert(readyInduction(s,t),'la incidencia requiere respuesta real');note(t,'incident-resolved');s.ops.resolved=[];assert(readyInduction(s,t),'el resultado del aprendizaje sobrevive al siguiente día');
at('handoff');t.answers.handoff='public';assert(!readyInduction(s,t));T.accept(s,s.tycoon.contracts[0].id,'public');assert(readyInduction(s,t));
const stable=E.initialState();stable.tutorial=freshInduction(stable);stable.tutorial.step=4;stable.tutorial.suspended=true;stable.tutorial.line=2;
assert.deepEqual(E.validateSave(JSON.parse(JSON.stringify(stable))).tutorial,stable.tutorial,'guardado conserva etapa, diálogo y pausa');
for(const [step,stage] of INDUCTION_STAGES.entries())for(const option of stage.choice?.options||[]){
 const old=E.initialState();old.tutorial=freshInduction(old);
 Object.assign(old.tutorial,{step,phase:'task',feedback:'Un diálogo de una versión anterior.',pendingAnswer:option.id});
 const restored=E.validateSave(old);
 assert.equal(inductionFeedback(restored.tutorial),option.feedback,'una respuesta guardada recupera el diálogo actual de su opción');
 assert.equal(restored.tutorial.pendingAnswer,option.id,'recuperar la voz conserva la decisión pendiente');
}
for(const [key,value] of [['step',-1],['phase','inventada'],['line',100],['marks',[{}]],['baseline',{}],['answers',{diagnosis:'fixed'}],['answers',{incident:'stale-reference'}],['baseline',{...stable.tutorial.baseline,frequency:1000}]]){const bad=structuredClone(stable);bad.tutorial[key]=value;assert.throws(()=>E.validateSave(bad),/turno guiado/);}
console.log('✓ Primer turno: reparto completo, objetivos reales, decisiones de presupuesto y recuperación del progreso.');

const report=E.initialState();report.tutorial=freshInduction(report);Object.assign(report.tutorial,{step:7,phase:'task',marks:['report','incident-resolved'],answers:{incident:'inc-tut-0-3'}});
assert.deepEqual(E.validateSave(report).tutorial,report.tutorial,'leer el parte no invalida el guardado');
report.tutorial.step=8;report.tutorial.phase='debrief';report.tutorial.done=true;report.tutorial.marks.push('agenda');report.tutorial.answers.handoff='public';
assert.deepEqual(E.validateSave(report).tutorial,report.tutorial,'completar el turno permite continuar la partida');

// Pausar el último paso y seguir jugando puede sustituir el primer encargo por un proyecto.
{
 const resumed=E.initialState();resumed.started=true;O.ensureOps(resumed);resumed.tutorial=freshInduction(resumed);
 Object.assign(resumed.tutorial,{step:8,phase:'task',suspended:true});
 for(let month=0;month<18;month++){
  for(let d;(d=E.pendingDecision(resumed));){const i=d.choices.findIndex(c=>resumed.cash>=-(c.effects?.cash||0));assert(i>=0);E.decide(resumed,d.id,i);}
  assert(O.skipMonth(resumed));
 }
 assert(E.validateSave(resumed));const q=resumed.tycoon.contracts[0];assert.equal(q.goal,'project');
 const html=focusedTaskHTML(resumed,resumed.tutorial);
 assert(!html.includes('undefined'),'el encargo de corredor tiene un objetivo legible');
 assert.equal((html.match(/class="lesson-contracts"/g)||[]).length,1,'una única mesa para comparar los planes');
 assert.equal((html.match(/<article /g)||[]).length,2,'dos tarjetas, una por rama');
 assert(!html.includes('<dialog'),'el encargo no abre otro diálogo');
 assert(html.includes(`Decide en ${q.until-resumed.month} meses`),'el plazo de oferta queda separado de la ejecución');
 for(const branch of ['public','commercial']){
  const d=T.contractDetails(resumed,q,branch,r=>E.metrics(resumed,r)),card=html.match(new RegExp(`<article data-branch="${branch}">([\\s\\S]*?)</article>`))[1];
  assert(card.includes(`Premio: ${d.reward} M€`),'el premio procede de la rama real');
  assert(card.includes(`multa: ${d.penalty} M€`),'la penalización procede de la rama real');
  assert(card.includes(`${d.months} meses desde la firma`),'24 meses reales después de aceptar');
  assert(card.includes('tres cierres mensuales consecutivos'));
  for(const req of d.requirements)assert(card.includes(req.label),`requisito real: ${req.label}`);
  for(const prerequisite of d.prerequisites.filter(p=>p.openCost))assert(card.includes(`apertura ${prerequisite.openCost} M€`),'abrir cuesta dinero; firmar no');
 }
 const stage=INDUCTION_STAGES[8];
 assert.deepEqual(inductionBriefing(resumed,stage),[stage.briefing[2]],'el proyecto posterior usa el consejo genérico ya grabado de Óscar');
 const beforeSign=resumed.cash;T.accept(resumed,q.id,'commercial');
 assert.equal(resumed.cash,beforeSign);assert.equal(q.until,resumed.month+24);
 const strategy=focusedTaskHTML(resumed,resumed.tutorial);
 assert(strategy.includes('plan comercial firmado'),'la estrategia sigue el plan firmado');
 assert(!/18 M€|26 M€|25\s*%|18 meses/.test(strategy),'la pregunta no anuncia cifras del contrato inicial');
}
function legalClose(state){
 for(let d;(d=E.pendingDecision(state));){const i=d.choices.findIndex(c=>state.cash>=-(c.effects?.cash||0));assert(i>=0);E.decide(state,d.id,i);}
 assert(O.skipMonth(state));
}
{
 const state=E.initialState();state.started=true;O.ensureOps(state);state.tutorial=freshInduction(state);Object.assign(state.tutorial,{step:8,phase:'task',suspended:true});
 const stage=INDUCTION_STAGES[8];
 assert.equal(inductionBriefing(state,stage),stage.briefing,'el primer turno conserva su introducción y reparto originales');
 for(const other of INDUCTION_STAGES.slice(0,8))assert.equal(inductionBriefing(state,other),other.briefing);
 const later=structuredClone(state);later.month=17;
 assert.deepEqual(inductionBriefing(later,stage),[stage.briefing[2]],'una guía retomada tarde no vuelve a anunciar dieciocho meses');
 for(let d;(d=E.pendingDecision(state));){E.decide(state,d.id,d.choices.findIndex(c=>state.cash>=-(c.effects?.cash||0)));}
 T.accept(state,state.tycoon.contracts[0].id,'public');
 for(let month=0;month<18&&!state.tycoon.completed;month++)legalClose(state);
 assert(state.tycoon.resolved.some(q=>q.result==='won'),'la aceptación histórica procede de un encargo realmente ganado');
 const next=state.tycoon.contracts.find(q=>q.status==='offered');assert(next&&next.until%6!==0);
 while(state.month<next.until)legalClose(state);
 assert(!state.tycoon.contracts.some(q=>['active','offered','won'].includes(q.status)),'la siguiente oferta ha caducado durante el hueco de propuestas');
 assert(handoffAccepted(state),'ganar el encargo demuestra la firma aunque ya no sea la tarjeta actual');
 assert(stageChecks(state,state.tutorial)[0].done);
 const html=focusedTaskHTML(state,state.tutorial);
 assert(html.includes('induction-question'),'se elige estrategia sin exigir otra firma');
 assert(!html.includes('data-action="tycoon-public"')&&!html.includes('data-action="tycoon-commercial"'));
 const trimmed=structuredClone(state);trimmed.tycoon.resolved=trimmed.tycoon.resolved.filter(q=>q.result==='declined');
 assert.equal(trimmed.tycoon.completed,1,'la victoria real queda en el contador durable');
 assert(trimmed.tycoon.resolved.length&&trimmed.tycoon.resolved.every(q=>q.result==='declined'));
 assert(E.validateSave(trimmed),'un historial truncado sin la victoria original sigue siendo válido');
 assert(handoffAccepted(trimmed),'el contador conserva la prueba cuando el historial ya no muestra la victoria');
 assert(stageChecks(trimmed,trimmed.tutorial)[0].done);
 assert(focusedTaskHTML(trimmed,trimmed.tutorial).includes('induction-question'));
 trimmed.tutorial.answers.handoff='public';assert(readyInduction(trimmed,trimmed.tutorial));
 state.tutorial.answers.handoff='public';assert(readyInduction(state,state.tutorial));
 assert(E.validateSave(state),'la recuperación histórica conserva un guardado válido');
}
{
 const state=E.initialState();state.started=true;O.ensureOps(state);state.tutorial=freshInduction(state);Object.assign(state.tutorial,{step:8,phase:'task',suspended:true});
 for(let month=0;month<19;month++)legalClose(state);
 const q=state.tycoon.contracts.find(q=>q.status==='offered');assert(q&&q.goal==='project');T.accept(state,q.id,'public');
 while(state.month<q.until)legalClose(state);
 assert.equal(q.status,'lost');assert(!state.tycoon.resolved.some(q=>q.result==='won'));
 assert(!state.tycoon.contracts.some(q=>['active','offered','won'].includes(q.status)));
 assert(!handoffAccepted(state));assert(!readyInduction(state,state.tutorial));
 const html=focusedTaskHTML(state,state.tutorial);
 assert(html.includes('retoma esta guía desde Ayuda'),'sin oferta se explica cómo retomar el aprendizaje');
 assert(html.includes('data-action="tutorial-skip"')&&html.includes('Volver a dirigir'),'la mesa ofrece una salida real a la gestión');
 assert(E.validateSave(state));
}
assert.equal(JSON.stringify(inductionLines()),unchangedDialogueCatalog,'los diálogos del catálogo permanecen intactos');
{
 const free=E.initialState();T.freeGame(free,5000,false);free.month=360;
 assert(menuHTML(free).includes(`<time>${E.dateOf(free.month)}</time>`),'el resumen del modo libre muestra su año real');
 const campaign=E.initialState();campaign.month=348;
 assert(menuHTML(campaign).includes(`<time>${E.dateOf(347)}</time>`),'la campaña conserva su final de 2050');
}
console.log('✓ Reanudación del encargo: dos planes con requisitos, premios, costes y plazos reales; calendario libre en el menú.');

// Confirmar el aprendizaje nunca cambia ni inventa la rama de un encargo firmado.
const appSource=fs.readFileSync(new URL('./dist/app.js',import.meta.url),'utf8');
const answerHandler=appSource.slice(appSource.indexOf('function tutorialAnswer(id) {'),appSource.indexOf('function tutorialMark(key)'));
const nextHandler=appSource.slice(appSource.indexOf('function tutorialNext() {'),appSource.indexOf('function tutorialAnswer(id) {'));
for(const branch of ['public','commercial']){
 const state=E.initialState();state.started=true;O.ensureOps(state);state.tutorial=freshInduction(state);
 Object.assign(state.tutorial,{step:8,phase:'task'});const t=state.tutorial,q=state.tycoon.contracts[0];
 T.accept(state,q.id,branch);const other=branch==='public'?'commercial':'public';
 assert.equal(handoffBranch(state),branch);
 const html=focusedTaskHTML(state,t);
 assert(html.includes(`data-choice="${branch}"`));assert(!html.includes(`data-choice="${other}"`),'la mesa sólo confirma la rama firmada');
 assert(canInductionAnswer(state,t,branch));assert(!canInductionAnswer(state,t,other),'un evento obsoleto no admite la rama opuesta');
 const events=[],handler=vm.createContext({state,tut:t,INDUCTION_STAGES,canInductionAnswer,restoreInductionHandoff,
  pause(){events.push('pause');},autosave(){events.push('save');},renderCoach(){events.push('render');},closeModal(){events.push('close');},inductionModalKey:''});
 vm.runInContext(answerHandler+'\n'+nextHandler,handler);
 handler.tutorialAnswer(other);assert.deepEqual(events,[]);assert.equal(t.feedback,null,'el handler publicado rechaza el clic opuesto sin voz, guardado ni cambios');
 handler.tutorialAnswer(branch);assert.equal(t.pendingAnswer,branch);assert(t.feedback);assert.deepEqual(events,['pause','save','render']);
 // La respuesta incorrecta que ya estuviera guardada también se corrige al confirmarla.
 t.pendingAnswer=other;t.feedback='Respuesta antigua.';handler.tutorialNext();
 assert.equal(t.answers.handoff,branch);assert.equal(t.feedback,null);
 delete t.answers.handoff;
 const before=JSON.stringify(state.tycoon);
 Object.assign(t,{feedback:'Una explicación antigua.',pendingAnswer:other});
 const restored=E.validateSave(state);
 const expected=INDUCTION_STAGES[8].choice.options.find(o=>o.id===branch).feedback;
 assert.equal(inductionFeedbackLine(restored,restored.tutorial).text,expected,'el feedback guardado se muestra según la firma real');
 restoreInductionHandoff(restored,restored.tutorial);
 assert.equal(restored.tutorial.pendingAnswer,branch);assert.equal(restored.tutorial.feedback,expected);
 assert.equal(JSON.stringify(restored.tycoon),before,'recuperar el tutorial no altera el contrato, premios ni confianza');
 restored.tutorial.answers.handoff=other;restoreInductionHandoff(restored,restored.tutorial);
 assert.equal(restored.tutorial.answers.handoff,branch,'una confirmación incorrecta de versiones anteriores conserva la firma real');
 assert(E.validateSave(restored));

 // Cuando ya no queda la tarjeta, el historial ganado conserva la rama.
 state.tycoon.contracts=[];state.tycoon.resolved=[{arc:0,result:'won',branch,month:1}];state.tycoon.completed=1;
 assert.equal(handoffBranch(state),branch);
 assert(!focusedTaskHTML(state,t).includes(`data-choice="${other}"`));
}
{
 const state=E.initialState();state.started=true;O.ensureOps(state);state.tutorial=freshInduction(state);
 Object.assign(state.tutorial,{step:8,phase:'task'});state.tycoon.contracts=[];state.tycoon.completed=1;
 // El historial está limitado; el contador durable no identifica qué rama se eligió.
 state.tycoon.resolved=[{arc:0,result:'declined',branch:null,month:1}];
 const t=state.tutorial,html=focusedTaskHTML(state,t);
 assert.equal(handoffBranch(state),null);assert(handoffAccepted(state));
 assert(html.includes('Su rama no figura en el historial conservado'));
 assert(!html.includes('plan público firmado')&&!html.includes('plan comercial firmado'));
 for(const branch of ['public','commercial']){
  assert(canInductionAnswer(state,t,branch));Object.assign(t,{pendingAnswer:branch,feedback:'Explicación anterior.'});
  const line=inductionFeedbackLine(state,t),neutral=INDUCTION_STAGES[0];
  assert.equal(line.who,neutral.briefing[0].who);assert.equal(line.text,neutral.choice.options.find(o=>o.id==='balanced').feedback,'se reutiliza un cuerpo canónico completo con su personaje original');
  assert(!line.text.includes('ha firmado'));
  restoreInductionHandoff(state,t);assert.equal(t.pendingAnswer,branch,'no se inventa una firma para completar un historial truncado');
 }
 assert(E.validateSave(state));
}
assert.equal(JSON.stringify(inductionLines()),unchangedDialogueCatalog,'corregir la confirmación no modifica ningún diálogo hablado');
console.log('✓ Confirmación del encargo: rama real, eventos obsoletos rechazados, guardados antiguos recuperados e historial truncado sin inventar firmas.');
