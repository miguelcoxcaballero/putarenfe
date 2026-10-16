import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MESSAGES,STATIC_MESSAGES} from './dist/narration-data.js';
import {EVENTS} from './dist/conexiones.js';
import {CHARACTERS} from './dist/story.js';
import {Narrator,toastKey,newsKey,keyForText} from './dist/narration-runtime.js';
import {clipId,speechText} from './dist/voice.js';
const unique=new Map();
for(const [key,m]of Object.entries(MESSAGES)){
 assert(CHARACTERS[m.person],key+' has a cast member');assert(m.text.trim());
 const id=clipId(m.person,m.text);
 if(unique.has(id))assert.deepEqual([unique.get(id).person,unique.get(id).text],[m.person,m.text]);
 else unique.set(id,m);
}
for(const event of EVENTS){const m=MESSAGES['event-'+event.id];assert(m);assert.equal(m.text,event.body,'entire event body is spoken');}
assert.equal(Object.values(STATIC_MESSAGES).filter(m=>m.kind==='guía').length,12);
for(const [key,m]of Object.entries(STATIC_MESSAGES))assert.equal(keyForText(m.text),key);
assert.equal(toastKey('Material enviado al taller.'),'refit-started');
assert.equal(toastKey('No hay caja suficiente.',{error:true}),'error-money');
assert.equal(toastKey('Tren incompatible con el ancho.',{error:true}),'error-fleet');
assert.equal(toastKey('15 maquinistas en formación.'),'training-result');
assert.equal(toastKey('Financiación: 23,4 M€'),'finance-result');
assert.equal(newsKey({image:'tech-senalizacion',title:'Terminada'}),'research-finished');
class Player{
 constructor(){this.enabled=true;this.listeners=[];this.speaking=null;this.started=[];this.lastError=null;}
 on(fn){this.listeners.push(fn);}emit(){this.listeners.forEach(fn=>fn(this));}
 stop(){const current=this.speaking;this.speaking=null;this.emit();current?.onend?.({reason:'stopped'});}
 speak(person,text,options){this.stop();this.speaking={person,text,dialogueId:clipId(person,text),onend:options.onend};this.started.push(this.speaking);this.emit();return true;}
 end(){const current=this.speaking;this.speaking=null;this.emit();current?.onend?.({reason:'ended'});}
 toggle(){this.enabled=!this.enabled;if(!this.enabled)this.stop();this.emit();}
}
const tick=()=>new Promise(r=>setTimeout(r,10));
const player=new Player(),narrator=new Narrator(player);
player.speaking={person:'president',dialogueId:'canonical-412'};
narrator.enqueue('saved');narrator.enqueue('track-funded',{priority:40,once:'event-1'});
assert.equal(narrator.enqueue('track-funded',{once:'event-1'}),false);
await tick();assert.equal(player.started.length,0,'never overlaps or interrupts an existing conversation');
player.end();await tick();assert.equal(player.started.at(-1).person,'adif','urgent event precedes a save notification');
player.end();await tick();assert.equal(player.started.at(-1).person,'minister');
player.end();await tick();assert.equal(narrator.current,null);
narrator.enqueue('refit-started',{where:'modal'});await tick();assert.equal(player.speaking.person,'workshop');
narrator.cancel('modal');await tick();assert.equal(player.speaking,null,'closing the panel cancels its voice');
narrator.enqueue('saved',{visible:()=>false});narrator.enqueue('loan');await tick();assert.equal(player.speaking.person,'treasury','skips a message whose panel has disappeared');
player.toggle();await tick();assert.equal(narrator.current,null);assert.equal(narrator.queue.length,0);
const before=player.started.length;narrator.enqueue('research-funded');player.toggle();await tick();
assert.equal(player.started.length,before,'reactivation does not play notifications received while muted');
narrator.enqueue('saved',{once:'session-once'});await tick();narrator.reset();await tick();
assert.equal(narrator.enqueue('saved',{once:'session-once'}),true,'a new session receives its own welcome and notifications');
await tick();narrator.reset();
narrator.enqueue('guide-welcome',{where:'guide',once:'heard-guide'});await tick();player.end();await tick();
narrator.enqueue('guide-day-review',{where:'guide'});await tick();assert(player.speaking);
narrator.guide('guide-welcome',{dataset:{}},'heard-guide');await tick();
assert.equal(player.speaking,null,'returning to an already heard stage still cancels the previous explanation');
narrator.reset();
if(!process.env.NARRATION_PREPRODUCTION){
const dir='./dist/assets/narracion/',meta=JSON.parse(fs.readFileSync(dir+'manifest.json'));
assert.equal(meta.recorded,meta.takes.length);assert(meta.recorded<=unique.size);
// El paquete incluye también las cuatro voces de avería: no queda ningún mensaje sin grabar.
const recordedIds=new Set(meta.takes.map(t=>t.id)),pending=Object.entries(MESSAGES).filter(([,m])=>!recordedIds.has(clipId(m.person,m.text))).map(([k])=>k).sort();
assert.equal(meta.recorded,unique.size,'el paquete contiene las 130 narraciones completas');
assert.equal(meta.expected,unique.size);
assert.deepEqual(pending,[],'las voces de avería también están grabadas');
for(const take of meta.takes){
 const m=unique.get(take.id);assert(m);assert.equal(take.person,m.person);
 assert.equal(take.raw,m.text);assert.equal(take.text,speechText(m.text));assert.equal(take.eos_observation.eos_found,true);
 const hash=createHash('sha256').update(fs.readFileSync(dir+take.file)).digest('hex');assert.equal(hash,take.sha256);
}
assert.equal(new Set(meta.takes.map(t=>t.person)).size,9,'all nine cast voices retain their own references');
}
console.log('Narration: '+unique.size+' complete takes, '+EVENTS.length+' events, guide, priorities, mute and cancellation passed.');
