
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './dist/engine.js';
import * as U from './dist/tenfe.js';
import * as J from './dist/conexiones.js';
import * as Tracks from './dist/track-preview.js';
import * as I from './dist/infra.js';
import {MODEL} from './dist/data.js';
const fresh=seed=>{const s=E.initialState(seed);U.begin(s,{rules:'conexiones',difficulty:'relajada'});s.started=true;s.tutorial={done:true};return s;};
const clear=s=>{if(s.tenfe.game.event){const d=J.EVENTS.find(x=>x.id===s.tenfe.game.event.id);J.decide(s,d.id,d.choices.findIndex(x=>x.cost<=s.cash));}let n=0,d;while((d=E.pendingDecision(s))){if(++n>100)throw Error('Consejo en bucle');E.decide(s,d.id,d.choices.findIndex(x=>!x.disabled&&(x.cost||0)<=s.cash));}};
const close=s=>{clear(s);assert(E.step(s));return s;};
const s=fresh(42),again=fresh(42);
assert.deepEqual(s,again,'la red inicial y el mazo son reproducibles');
assert.equal(s.routes.length,19);assert(s.routes.some(r=>r.active&&E.product(s,r)==='Regional'));
assert(s.routes.some(r=>r.active&&E.product(s,r)==='AVE'));assert(s.routes.some(r=>r.active&&E.product(s,r)==='Alvia'));
assert.equal(s.cash,320);assert.equal(s.debt,60);assert.equal(s.tenfe.game.origin,0);
assert.equal(J.PACTS.length,4);assert.equal(J.PROJECTS.length,6);assert.equal(J.RESEARCH.length,18);
assert.equal(J.mission(s).rows.length,6);assert(J.mission(s).rows.every(x=>x.target));
J.signPact(s,'investigacion');J.signPact(s,'taller');assert.throws(()=>J.signPact(s,'viajeros'));
J.research(s,'cadenciados');assert.throws(()=>J.research(s,'ultrasonidos'));
close(s);assert(s.tenfe.game.tech.includes('cadenciados'));assert(s.tenfe.pacts.find(x=>x.id==='investigacion').status==='won');
assert(s.tenfe.game.event);const frozen=JSON.stringify(s);assert.equal(E.step(s),false);assert.equal(JSON.stringify(s),frozen,'un suceso pendiente no liquida caja ni avanza tiempo');
const reload=E.validateSave(JSON.parse(frozen));assert.equal(reload.tenfe.game.event.id,s.tenfe.game.event.id);assert.deepEqual(reload.tenfe.game.deck,s.tenfe.game.deck);
const event=s.tenfe.game.event.id;J.decide(s,event,0);assert.throws(()=>J.decide(s,event,0),'la misma decisión no paga dos veces');assert(E.validateSave(s));
const photoNames=fs.readdirSync('./dist/assets/rescate').filter(x=>x.endsWith('.webp')).map(x=>x.slice(0,-5)).sort();
assert.equal(photoNames.length,63);assert.deepEqual(Object.keys(J.PHOTO_ROLES).sort(),photoNames,'las 63 fotos tienen función jugable, sin retirar eventos');
const toured=fresh(8);const seen=new Set();toured.cash=10000;
for(let i=0;i<J.EVENTS.length;i++){close(toured);assert(!seen.has(toured.tenfe.game.event.id));seen.add(toured.tenfe.game.event.id);assert(E.validateSave(toured));}
assert.equal(seen.size,J.EVENTS.length);assert.equal(toured.tenfe.elections.length,2);assert(toured.tenfe.elections.every(x=>x.month%12===0));
assert.equal(Tracks.configurations.length,27);assert.equal(new Set(Tracks.configurations.map(x=>Tracks.label(x))).size,27);
for(const x of Tracks.configurations){assert(Tracks.photo(x).includes('data-lanes="'+x.lanes+'"'));assert(Tracks.photo(x).includes('data-gauge="'+x.g+'"'));}
const railway=fresh(7);railway.cash=10000;const tramo=I.TRAMOS.find(d=>railway.infra.t[d.id].b&&railway.infra.t[d.id].g==='ib'&&d.km>30);
const before=JSON.stringify(railway),old=Tracks.normalized(railway.infra.t[tramo.id]),desired={...old,g:'mixto',e:'25kv',lanes:3};
const q=Tracks.quote(railway,tramo.id,desired);assert(q.cost>0&&q.months>0);assert.equal(JSON.stringify(railway),before,'la preview y el presupuesto no alteran la partida');
Tracks.start(railway,E,tramo.id,desired);const job=railway.projects.at(-1);job.delayChecked=true;assert(E.validateSave(railway));
assert.equal(railway.cash,10000-q.cost);assert.equal(railway.infra.t[tramo.id].g,old.g,'la mejora no se aplica antes de acabar');
for(let i=0;i<q.months;i++)close(railway);
assert.deepEqual(Tracks.normalized(railway.infra.t[tramo.id]),desired);assert(job.done);assert(E.validateSave(railway));
assert.throws(()=>Tracks.quote(railway,tramo.id,{...desired,lanes:1}));assert.throws(()=>Tracks.quote(railway,tramo.id,{...desired,e:'no'}));
const busy=fresh(9);busy.cash=10000;busy.tenfe.milestones=['andenes'];
for(const id of ['control','taller','teruel'])J.startMega(busy,id);assert.throws(()=>J.startMega(busy,'monumento'));assert(E.validateSave(busy));
for(const corrupt of [false,true]){const x=fresh(33);x.cash=10000;if(corrupt)x.tenfe.game.tech=['contabilidad'];const cash=x.cash;J.shortcut(x);assert.equal(x.cash-cash,corrupt?60:45);J.legalDefence(x);assert.throws(()=>J.legalDefence(x));for(let i=0;i<15;i++)close(x);assert.equal(x.tenfe.scandal,null);assert(x.tenfe.game.news.some(n=>n.image==='juzgado'));assert(E.validateSave(x));}
const invalid=JSON.parse(frozen);invalid.tenfe.game.deck=['evento-falso'];assert.throws(()=>E.validateSave(invalid));
console.log('✓ Conexiones: red y reglas desde turno 1, 63 ilustraciones activas, mazo guardado sin repeticiones, elecciones, laboratorio, pactos, cuadrillas, consecuencias y 27 configuraciones de vía.');
