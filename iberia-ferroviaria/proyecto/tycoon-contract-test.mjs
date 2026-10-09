import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as T from './dist/tycoon.js';
import {MODEL} from './dist/data.js';
import {tycoonPage} from './dist/tycoon-ui.js';
const fresh=()=>{const s=E.initialState(72022);s.started=true;s.decided=['mandate'];return s;};
function advance(s){for(let d;(d=E.pendingDecision(s));){const i=d.choices.findIndex(c=>!c.disabled&&s.cash>=-(c.effects?.cash||0));E.decide(s,d.id,i<0?d.choices.length-1:i);}assert(E.step(s));}
function project(s,arc=0){s.tycoon.contracts=[];s.tycoon.serial=Math.max(1,s.tycoon.serial);s.tycoon.arc=arc;T.offer(s);const q=s.tycoon.contracts[0];assert.equal(q.goal,'project');return q;}
function configure(s,id,frequency,fare){const r=s.routes.find(r=>r.id===id),f=s.fleet.find(f=>f.qty&&f.condition>=30&&E.canRun(s,r,MODEL[f.model])&&E.available(s,f,r.id)>=E.requiredUnits(s,r,MODEL[f.model],frequency));assert(f,'There is a legal compatible fleet for the offered opening.');E.configureRoute(s,id,f.id,frequency,fare);}
function prepare(s,q,branch,bonus=false){const d=T.contractDetails(s,q,branch,r=>E.metrics(s,r));for(const req of [...d.requirements,...(bonus?d.bonus.requirements:[])]){const r=s.routes.find(r=>r.id===req.id);if(req.kind==='active'&&!r.active)configure(s,r.id,Math.min(2,E.maxFrequency(r)),r.fare);if(req.kind==='frequency'&&r.frequency<req.target)configure(s,r.id,req.target,r.fare);if(req.kind==='fare'&&r.fare>req.target)configure(s,r.id,r.frequency,req.target);if(req.kind==='station')while((s.stations[req.id]||0)<req.target)E.upgradeStation(s,req.id);if(req.kind==='level'&&r.level<req.target&&!s.projects.some(p=>p.route===r.id&&!p.done))E.upgradeRoute(s,r.id);}return T.contractDetails(s,q,branch,r=>E.metrics(s,r));}
{
 const s=fresh(),q=project(s);T.accept(s,q.id,'public');const before=s.cash;assert.equal(q.target,3);assert.equal(q.until,s.month+24);s.stats.passengers=1e10;advance(s);assert.equal(q.project.streak,0,'Accumulated passengers cannot complete a corridor project.');assert.equal(q.status,'active');const investmentCash=s.cash,d=prepare(s,q,'public',true);assert(d.requirements.every(x=>x.done));assert(s.cash<investmentCash,'Opening and optional station investment have real costs.');advance(s);assert.equal(q.project.streak,1);const saved=E.validateSave(structuredClone(s));assert.equal(saved.tycoon.contracts[0].project.streak,1);
 // Cancelling one required departure interrupts continuity, even with the route still open.
 const freq=q.project.branches.public.requirements.find(x=>x.kind==='frequency'),r=s.routes.find(r=>r.id===freq.id);if(freq.target>1)configure(s,r.id,freq.target-1,r.fare);advance(s);assert.equal(q.project.streak,0);prepare(s,q,'public',true);advance(s);advance(s);assert.equal(q.status,'active');const money=s.cash;advance(s);assert.equal(q.status,'won');assert(q.project.bonusWon);assert.equal(s.tycoon.programme.stage,2);assert.equal(s.tycoon.resolved.at(-1).reward,q.reward+q.project.branches.public.bonus.reward,'The optional bonus is recorded with the reward.');const settled=s.cash;T.tick(s);assert.equal(s.cash,settled,'Closing twice cannot pay a contract reward twice.');assert(s.tycoon.paper.filter(p=>p.title.includes('etapa 1/3 cumplida')).length===1);
 T.offer(s);const second=s.tycoon.contracts[0];assert.equal(second.project.route,q.project.route);assert.equal(second.project.stage,2);T.accept(s,second.id,'public');prepare(s,second,'public',true);for(let i=0;i<7&&second.status==='active';i++)advance(s);assert.equal(second.status,'won');T.offer(s);const third=s.tycoon.contracts[0];assert.equal(third.project.stage,3);T.accept(s,third.id,'public');prepare(s,third,'public');for(let i=0;i<7&&third.status==='active';i++)advance(s);assert.equal(third.status,'won');assert.equal(s.tycoon.programme,null);assert(s.tycoon.achievements.includes('Un corredor de principio a fin'));assert(E.validateSave(s));
}
{
 const s=fresh(),q=project(s);const publicPlan=T.contractDetails(s,q,'public',r=>E.metrics(s,r)),commercialPlan=T.contractDetails(s,q,'commercial',r=>E.metrics(s,r));assert(publicPlan.requirements.some(x=>x.kind==='fare'));assert(!publicPlan.requirements.some(x=>x.kind==='margin'));assert(commercialPlan.requirements.some(x=>x.kind==='margin'));assert(!commercialPlan.requirements.some(x=>x.kind==='fare'));assert(commercialPlan.reward>publicPlan.reward);
 T.accept(s,q.id,'commercial');prepare(s,q,'commercial');const r=s.routes.find(r=>r.id===q.project.route);configure(s,r.id,r.frequency,1.5);const audit=T.assessContracts(s,x=>E.metrics(s,x))[q.id];assert.equal(audit.done,false,'An affordable but unprofitable route is not a commercial success.');advance(s);assert.equal(q.project.streak,0);const money=s.cash;s.month=q.until;T.tick(s);assert.equal(q.status,'lost');assert.equal(s.cash,money-q.penalty);const money2=s.cash;T.tick(s);assert.equal(s.cash,money2,'A missed promise is penalized once.');
}
{
 const s=fresh(),q=project(s);T.accept(s,q.id,'commercial');prepare(s,q,'commercial');assert(T.contractDetails(s,q,'commercial',r=>E.metrics(s,r)).requirements.every(x=>x.done),'A legal commercial service can cover the offered costs and occupancy.');for(let i=0;i<3;i++)advance(s);assert.equal(q.status,'won');assert.equal(s.tycoon.resolved.at(-1).branch,'commercial');assert(s.tycoon.resolved.at(-1).reward>=q.reward);assert.equal(s.tycoon.contracts[0].project.stage,2,'The next investment stage is available without an empty six-month wait.');assert(E.validateSave(s));
}
{
 const s=fresh();s.stations=Object.fromEntries(Object.keys((await import('./dist/data.js')).CITY).map(id=>[id,3]));s.tycoon.tech=Object.keys(T.TECHS);for(const r of s.routes)r.level=3;const q=project(s,3);assert.notEqual(q.goal,'stations','A saturated world never receives an impossible station increment.');assert(T.contractDetails(s,q,'public').requirements.every(x=>x.kind!=='station'||x.target<=3));
 const good=E.validateSave(s);for(const mutate of [b=>b.tycoon.contracts[0].project.route='unknown',b=>b.tycoon.contracts[0].project.streak=4,b=>b.tycoon.contracts[0].project.branches.public.requirements[0].target=NaN,b=>b.tycoon.contracts[0].project.branches.commercial.requirements[0].id='missing',b=>b.tycoon.markets={'missing':{month:6,lowgo:'hold',rossa:'hold'}}]){const b=structuredClone(good);mutate(b);assert.throws(()=>E.validateSave(b));}
 // Legacy v4 contracts, without any new strategic fields, remain portable.
 const old=fresh();delete old.tycoon.programme;delete old.tycoon.markets;assert(E.validateSave(old));
}
{
 const s=fresh(),r=s.routes.find(r=>r.id==='madrid-barcelona');s.month=72;const entrants=T.competition(s,r).length;r.fare=1.5;assert.equal(T.competition(s,r).length,entrants,'Lowering our price cannot make rivals disappear.');const before=T.competition(s,r);T.tick(s);const after=T.competition(s,r);assert(after.some(x=>x.strategy==='capacity'));assert(after[0].frequency>before[0].frequency);const pricing=after[0].fare;r.fare=150;assert.equal(T.competition(s,r)[0].fare,pricing,'Rivals do not change their six-month plan in response to a live fare preview.');assert(after.every(x=>x.nextReview===78));assert(E.validateSave(s));
}
{
 const s=fresh(),hybrid=s.fleet.find(f=>f.model==='s730');for(const r of s.routes.filter(r=>r.active&&r.fleet===hybrid.id))E.closeRoute(s,r.id);E.sell(s,hybrid.id,hybrid.qty);const q=project(s,3),d=T.contractDetails(s,q,null,r=>E.metrics(s,r));assert(Object.values(d.branches).some(b=>b.prerequisites.every(p=>p.ready)),'An operable corridor is offered before one requiring unavailable hybrid material.');assert.notEqual(q.project.route,'madrid-ferrol');assert(E.validateSave(s));
 const current=s.routes.find(r=>r.id===q.project.route);for(const f of s.fleet)f.condition=20;const blocked=T.supplyOptions(s,current,Math.max(2,current.frequency),true);assert.equal(blocked.ready,false);assert.equal(blocked.reassignable,false,'Material below the engine reopening threshold is not promised as usable.');
}
{
 const s=fresh();assert.notEqual(project(s,1).arc,1,'The spoken Pajares opening is not announced before November 2023.');s.tycoon.contracts=[];s.month=23;E.advanceInfra(s);assert.equal(project(s,1).arc,1);
}
{
 const s=fresh(),r=s.routes.find(r=>r.id==='madrid-avila');configure(s,r.id,2,r.fare);s.stations.avi=1;s.tycoon.contracts=[];s.tycoon.programme={arc:3,route:r.id,stage:3};T.offer(s);const q=s.tycoon.contracts[0],d=T.contractDetails(s,q,'public',x=>E.metrics(s,x));assert.equal(q.project.link,null);assert.equal(d.title,'Consolidar el corredor');assert(d.requirements.some(x=>x.kind==='station'&&x.id==='mad'&&!x.done),'The final stage without a new connection still requires a different real investment.');T.accept(s,q.id,'public');advance(s);assert.equal(q.project.streak,0);prepare(s,q,'public');for(let i=0;i<3;i++)advance(s);assert.equal(q.status,'won');
 const max=fresh(),full=max.routes.find(r=>r.id==='madrid-avila');configure(max,full.id,E.maxFrequency(full),full.fare);full.level=3;for(const city of full.ends)max.stations[city]=3;max.fleet.find(f=>f.id===full.fleet).condition=100;max.tycoon.contracts=[];max.tycoon.programme={arc:3,route:full.id,stage:3};T.offer(max);const stable=max.tycoon.contracts[0],details=T.contractDetails(max,stable,'public',x=>E.metrics(max,x));assert.equal(details.stability,true);assert.equal(details.stageTotal,1);assert.equal(details.reward,4);assert.equal(details.bonus.reward,0);T.accept(max,stable.id,'public');for(let i=0;i<3;i++)advance(max);assert.equal(stable.status,'won');assert.equal(max.tycoon.programme,null,'A completed corridor cannot start another large expansion prize chain without new investment.');assert(E.validateSave(max));
}
{
 const free=E.initialState();T.freeGame(free,5000,false);free.started=true;free.month=347;free.ops={day:1,minute:0,phase:'planning',incidents:[],resolved:[],last:null,priority:'balanced',completed:0};advance(free);assert.equal(free.month,348);assert.equal(free.ended,false);assert.equal(E.yearOf(free),2051);assert.equal(E.gameDate(free),'2051-01-01');advance(free);assert.equal(free.ended,false);assert(E.validateSave(free));assert(free.tycoon.achievements.includes('Más allá de 2050'));free.month=361;free.ops.day=29;assert(E.validateSave(free),'2052 is leap year; the correct calendar is used.');free.month=373;free.ops.day=29;assert.throws(()=>E.validateSave(free),'2053 February has only 28 days.');free.ops.day=28;assert(E.validateSave(free));free.month=12001;assert.throws(()=>E.validateSave(free));
 const campaign=fresh();campaign.month=347;campaign.tycoon.groups.government=80;advance(campaign);assert.equal(campaign.ended,true);assert.equal(campaign.ending,'2050');assert(E.validateSave(campaign));campaign.month=349;assert.throws(()=>E.validateSave(campaign));
}
console.log('✓ Contratos: tres etapas reales, continuidad, inversión opcional, ramas distintas, penalización única, referencias de guardado, rivalidad sin exploit y modo libre después de 2050.');

// La agenda debe enseñar la rama firmada, incluida su condición de rentabilidad.
{
 const s=fresh(),q=project(s);T.accept(s,q.id,'commercial');prepare(s,q,'public');
 const r=s.routes.find(r=>r.id===q.project.route);configure(s,r.id,r.frequency,1.5);
 const d=T.contractDetails(s,q,q.branch,x=>E.metrics(s,x)),html=tycoonPage(s);
 assert(d.requirements.some(x=>x.kind==='margin'&&!x.done),'el servicio barato no cumple el plan comercial');
 assert(html.includes('Margen del servicio')&&html.includes('Ocupación de plazas'),'la agenda muestra los requisitos comerciales');
 assert(!html.includes('Tarifa máxima'),'la rama pública no sustituye al compromiso firmado');
 assert(!html.includes('Servicio preparado.'),'cumplir la rama pública no habilita un progreso comercial aparente');
 assert(html.includes(`Objetivo opcional · +${d.bonus.reward} M€`),'la bonificación mostrada también corresponde a la rama firmada');
}
{
 const s=fresh();s.tycoon.resolved=[{arc:0,branch:'public',result:'won'}];
 assert(E.validateSave(s),'el historial v4 anterior no requiere fechas nuevas');
 const html=tycoonPage(s);assert(html.includes('Historial del mandato'));
 assert(!html.includes('Invalid Date'),'el historial anterior omite una fecha desconocida');
 s.tycoon.resolved[0].month=12;assert(tycoonPage(s).includes(E.dateOf(12)),'las fechas nuevas siguen visibles');
}
console.log('✓ Agenda: requisitos y bonus de la rama firmada, sin fechas inválidas en historiales anteriores.');
