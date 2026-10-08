import assert from 'node:assert/strict';
import * as E from './dist/engine.js';
import * as T from './dist/tycoon.js';
import * as I from './dist/infra.js';
import {ENCOUNTERS,EMOTIONS} from './dist/encounters.js';
import {CHARACTERS} from './dist/story.js';
const fresh=()=>{const s=E.initialState();s.started=true;return s;};
const advance=s=>{for(let d;(d=E.pendingDecision(s));)E.decide(s,d.id,d.choices.findIndex(c=>s.cash>=-(c.effects?.cash||0)));assert(E.step(s));};
assert.equal(ENCOUNTERS.length,315);assert.equal(new Set(ENCOUNTERS.map(x=>x.body)).size,315);
for(const person of Object.keys(CHARACTERS))for(const mood of EMOTIONS){const scenes=ENCOUNTERS.filter(x=>x.person===person&&x.mood===mood);assert.equal(scenes.length,5);assert.equal(new Set(scenes.map(x=>x.topic)).size,5);for(const scene of scenes){const s=fresh();s.decided=['mandate'];s.tycoon.encounter=scene.id;for(let d;(d=E.pendingDecision(s))&&!d.tycoon;)E.decide(s,d.id,0);assert.equal(E.pendingDecision(s).id,scene.id);const before=s.cash;E.decide(s,scene.id,0);assert(s.cash<before);assert.equal(s.tycoon.encounter,null);}}
{
 const s=fresh(),r=s.routes.find(r=>r.active),before=E.metrics(s,r);s.tycoon.drivers=0;assert.equal(E.metrics(s,r).passengers,0);T.hire(s,20);assert.equal(s.tycoon.drivers,0);advance(s);advance(s);assert.equal(s.tycoon.drivers,0);advance(s);assert.equal(s.tycoon.drivers,20);assert(E.metrics(s,r).passengers<before.passengers);assert.throws(()=>T.hire(s,NaN));
}
{
 const s=fresh();const r=s.routes.find(r=>r.id==='madrid-barcelona');assert.equal(T.competition(s,r).length,1);s.month=14;assert.equal(T.competition(s,r).length,2);s.tycoon.rivals=false;assert.equal(T.competition(s,r).length,0);
 const base=E.metrics(s,r).share;s.tycoon.rivals=true;assert(E.metrics(s,r).share<base);const original=r.fare;r.fare=original/2;assert(E.metrics(s,r).share>base*.7);
}
{
 const s=fresh(),r=s.routes.find(r=>r.active),base=E.metrics(s,r);T.setPolicy(s,'wifi');assert(E.metrics(s,r).punctuality>base.punctuality);assert(T.monthlyCost(s)>0);T.setPolicy(s,'wifi');assert.equal(E.metrics(s,r).punctuality,base.punctuality);assert.throws(()=>T.setPolicy(s,'fake'));
 assert.throws(()=>T.research(s,'loyalty'));T.research(s,'online');assert.throws(()=>T.research(s,'online'));for(let i=0;i<4;i++)advance(s);assert(s.tycoon.tech.includes('online'));assert.equal(s.tycoon.research,null);T.research(s,'loyalty');
}
{
 const s=fresh(),q=s.tycoon.contracts[0];T.accept(s,q.id,'commercial');assert.equal(q.reward,26);s.stats.passengers=q.base+q.target;T.tick(s);assert.equal(q.status,'won');const cash=s.cash;T.tick(s);assert.equal(s.cash,cash,'premio una sola vez');assert(s.tycoon.achievements.includes('Primer encargo'));
 const b=fresh(),bad=b.tycoon.contracts[0];T.accept(b,bad.id,'public');b.month=bad.until;const c=b.cash;T.tick(b);assert.equal(bad.status,'lost');assert.equal(b.cash,c-bad.penalty);
}
{
 const s=fresh();s.tycoon.groups.staff=10;assert(T.effects(s,s.routes[0]).staff<1);s.tycoon.groups.territory=0;s.projects.push({id:'test',due:10,done:false});s.month=6;T.tick(s);assert.equal(s.projects[0].due,11);
 s.tycoon.groups.government=0;s.satisfaction=0;s.last.net=-1;for(let i=0;i<6;i++)T.tick(s);assert.equal(s.ending,'dismissed');
 const free=E.initialState();T.freeGame(free,5000,false);free.started=true;assert.equal(E.chapterReady(free),false);assert.equal(E.pendingDecision(free),null);assert.equal(free.cash,5000);assert.throws(()=>T.freeGame(free,500,false));
}
{
 const s=fresh();assert(E.validateSave(s));const old=structuredClone(s);old.version=3;assert.throws(()=>E.validateSave(old),/anterior/);for(const bad of [NaN,-1,1e9]){const copy=structuredClone(s);copy.tycoon.drivers=bad;assert.throws(()=>E.validateSave(copy));}const copy=structuredClone(s);copy.tycoon.policies=['fake'];assert.throws(()=>E.validateSave(copy));
 const d=I.allTramos(s).find(d=>I.tramoWorks(s,d.id).some(x=>x.work==='renew'));assert(d);const speed=s.infra.t[d.id].v;const q=E.workQuote(s,'renew',d.id);E.startWork(s,'renew',d.id);const job=s.projects.at(-1);job.delayChecked=true;for(let i=0;i<q.months;i++)advance(s);assert(s.infra.t[d.id].v>speed);
}
console.log('✓ Gestión: 315 escenas, siete emociones, competencia, plantilla, políticas, investigación, misiones, presiones, modo libre, renovación y guardado.');
// La escasez cancela circulaciones reales, incluida la caché del plan.
{
 const O=await import('./dist/operations.js');const s=fresh();const full=O.servicePlan(s).length;assert(full>0);s.tycoon.drivers=0;assert.equal(O.servicePlan(s).length,0);s.tycoon.drivers=1000;assert.equal(O.servicePlan(s).length,full);
 const {DELIVERY}=await import('./dist/voice.js');assert.deepEqual(Object.keys(DELIVERY),EMOTIONS);
}

await import('./tycoon-contract-test.mjs');
