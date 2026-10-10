import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './dist/engine.js';
import * as U from './dist/tenfe.js';
import * as J from './dist/conexiones.js';
import * as R from './dist/train-refit.js';
import {MODELS,MODEL} from './dist/data.js';
R.bind(E);
const fresh=()=>{const s=E.initialState(44);U.begin(s,{rules:'conexiones',difficulty:'relajada'});s.started=true;s.tutorial={done:true};return s;};
const clear=s=>{if(s.tenfe.game.event){const d=J.EVENTS.find(x=>x.id===s.tenfe.game.event.id);J.decide(s,d.id,d.choices.findIndex(x=>x.cost<=s.cash));}let d,n=0;while((d=E.pendingDecision(s))){assert(++n<100);E.decide(s,d.id,d.choices.findIndex(x=>!x.disabled&&(x.cost||0)<=s.cash));}};
const close=s=>{clear(s);assert(E.step(s));};
assert.deepEqual(Object.keys(R.INTERIORS).sort(),MODELS.map(m=>m.id).sort());
const urls=[];
for(const m of MODELS){const d=R.INTERIORS[m.id];assert(d.references.length);assert([0,1].includes(d.row));assert(fs.existsSync('./dist/assets/interiores/'+d.atlas));urls.push(d.before,d.after);assert(R.previewHTML(m.id).includes(m.name));}
assert.equal(new Set(urls).size,28);assert.equal(Object.values(R.INTERIORS).filter(x=>x.concept).length,3);
assert(R.INTERIORS.s106f.layout.includes('3+2'));assert(R.INTERIORS.s106v.layout.includes('3+2'));
let s=fresh();const f=s.fleet.find(f=>E.available(s,f)>=2);assert(f);const id=f.id,free=E.available(s,f),before=JSON.stringify(s);
const q=E.refurbishQuote(s,id,2);assert.equal(q.perUnit,MODEL[f.model].price*.12);assert.equal(q.total,q.perUnit*2);assert.equal(q.duration,5);assert.equal(q.due,s.month+5);
assert.equal(JSON.stringify(s),before,'la cotización es solo lectura');
for(const qty of [0,-1,.5,free+1,Infinity,NaN]){assert.throws(()=>E.refurbish(s,id,qty));assert.equal(JSON.stringify(s),before,'rechazo sin cobrar ni retirar unidades');}
s.tenfe.game.tech.push('contrato');const discounted=E.refurbishQuote(s,id,2);assert.equal(discounted.total,q.total*.75);assert.equal(discounted.discount,.25);
s.cash=0;const poor=JSON.stringify(s);assert.throws(()=>E.refurbish(s,id,1));assert.equal(JSON.stringify(s),poor,'no se envía material sin dinero');assert(R.quoteHTML(s,id,1).disabled);
s.cash=10000;const cash=s.cash,qty=f.qty,born=f.born,maker=f.maker||MODEL[f.model].maker,routes=JSON.stringify(s.routes),month=s.month;
E.refurbish(s,id,2);assert.equal(f.qty,qty-2);assert.equal(s.cash,cash-discounted.total);assert.equal(JSON.stringify(s.routes),routes,'no se cambian asignaciones');
assert.equal(s.refits.length,1);assert.equal(s.refits[0].started,month);assert.equal(s.refits[0].cost,discounted.total);assert.equal(s.refits[0].interiorAfter,true);
s=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(s.refits[0].cost,discounted.total);
const count=s.stats.refurbished;
for(let i=0;i<4;i++){close(s);assert(!s.refits[0].done,'no vuelve antes de cinco turnos');assert(!s.fleet.some(x=>x.origin==='Reforma '+s.refits[0].id));}
close(s);assert(s.refits[0].done);const returned=s.fleet.find(x=>x.origin==='Reforma '+s.refits[0].id);assert(returned);assert.equal(returned.qty,2);assert.equal(returned.condition,98);assert.equal(returned.born,born);assert.equal(returned.maker,maker);assert.equal(returned.interiorRefitted,true);assert(R.isRefitted(returned));assert.equal(s.stats.refurbished,count+2);
s=E.validateSave(JSON.parse(JSON.stringify(s)));assert(R.isRefitted(s.fleet.find(x=>x.id===returned.id)));
close(s);assert.equal(s.fleet.filter(x=>x.origin==='Reforma '+s.refits[0].id).length,1,'sin duplicar unidades al terminar');
const legacy=fresh(),lf=legacy.fleet.find(f=>E.available(legacy,f)>=1);E.refurbish(legacy,lf.id,1);
for(const k of ['started','originalDue','cost','maker','fromCondition','interiorBefore','interiorAfter','done'])delete legacy.refits[0][k];
assert(E.validateSave(JSON.parse(JSON.stringify(legacy))),'compatibilidad con reformas guardadas anteriormente');
for(const key of ['interiorBefore','interiorAfter','done']){const bad=JSON.parse(JSON.stringify(legacy));bad.refits[0][key]='true';assert.throws(()=>E.validateSave(bad));}
const bad=JSON.parse(JSON.stringify(s));bad.fleet[0].interiorRefitted='true';assert.throws(()=>E.validateSave(bad));
const ended=fresh(),ef=ended.fleet.find(f=>E.available(ended,f)>0);ended.ended=true;const frozen=JSON.stringify(ended);assert.throws(()=>E.refurbish(ended,ef.id,1));assert.equal(JSON.stringify(ended),frozen);
console.log('✓ Reforma: 14 modelos, 28 imágenes, cotización, unidades libres, descuento, guardado y devolución exacta a cinco turnos.');
