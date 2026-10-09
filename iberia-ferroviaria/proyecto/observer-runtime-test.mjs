// Ejecuta las funciones publicadas de app.js con el motor real y una superficie
// de dibujo mínima. Comprueba que observar nunca consume la jornada guardada.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from './dist/engine.js';
import * as O from './dist/operations.js';
import * as S from './dist/schedule.js';

const source=fs.readFileSync(new URL('./dist/app.js',import.meta.url),'utf8');
const section=(start,end)=>{
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert(a>=0&&b>a,`función publicada: ${start}`);return source.slice(a,b);
};
const functions=[
 section('function currentMinute() {','function viewTrips() {'),
 section('function frame(t) {','function checkIncidents() {'),
 section('function renderDaybar() {','function navigate(to) {'),
].join('\n');
const timelineAnchor=source.indexOf("const cv = event.target.closest?.('#timelineCanvas')");
assert(timelineAnchor>0);
const seek=source.slice(source.lastIndexOf("document.addEventListener('pointerdown'",timelineAnchor),source.indexOf('// campos de formulario',timelineAnchor));
const publicSeek=source.match(/setMinute: m => \{[^\n]+?; render\(\); \}/)?.[0];assert(publicSeek);
const publicMinute=`var setMinute = ${publicSeek.slice('setMinute: '.length)};`;

for(const phase of ['planning','running','review']){
 const state=E.initialState();state.started=true;
 for(let d;(d=E.pendingDecision(state));)E.decide(state,d.id,d.choices.findIndex(c=>!c.disabled&&state.cash>=-(c.effects?.cash||0)));
 O.ensureOps(state);O.startDay(state);state.ops.minute+=20;
 if(phase==='planning')state.ops.phase='planning';
 if(phase==='review'){state.ops.minute=O.dayBounds(O.servicePlan(state)).last;O.endDay(state);}
 const before=JSON.stringify(state),campaignMinute=state.ops.minute;
 let simulationEvents=0,finishEvents=0,seekListener;
 const ctx=new Proxy({}, {get:(target,key)=>key in target?target[key]:()=>{}});
 const canvas={clientWidth:320,clientHeight:38,width:0,height:0,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:10,width:320})};
 const bar={innerHTML:''};
 const context=vm.createContext({state,O,E,S,
  layer:'real',playing:false,speedIndex:1,SPEEDS:[[2,'1×'],[6,'3×']],lastTick:1000,lastTimeline:1000,lastPanel:1000,observerMinute:480,
  requestAnimationFrame(){},dayType:()=>O.dayKind(state),plan:()=>O.servicePlan(state),
  realTrips:()=>[{dep:480,arrival:600,bus:false},{dep:900,arrival:1020,bus:false}],clock:O.clockText,n:x=>String(x),devicePixelRatio:1,
  $:id=>id==='daybar'?bar:id==='timelineCanvas'?canvas:{open:false},
  document:{body:{dataset:{sky:'day'}},addEventListener:(_type,listener)=>{seekListener=listener;}},
  spawnArrivals(){simulationEvents++;},checkIncidents(){simulationEvents++;},checkSurgeEvents(){simulationEvents++;},finishDay(){finishEvents++;},
  renderClock(){},renderCoach(){},checkMusicMood(){},renderDrawer(){},renderInspector(){},renderHud(){},renderMission(){},render(){},
  toast(){},intro(){},showDecision(){},dayReport(){},resetToday(){},networkKey(){},seenIncidents:new Set(),screen:null,inspect:null,sfx:{play(){}},
 });
 vm.runInContext(functions+'\n'+seek+'\n'+publicMinute+'\nplay(); frame(1100);',context);
 assert(context.playing);assert.equal(context.observerMinute,480.6);assert.equal(context.currentMinute(),480.6);
 assert.equal(JSON.stringify(state),before,`observar con jornada ${phase} conserva toda la partida`);
 assert.equal(simulationEvents,0);assert.equal(finishEvents,0);
 assert(bar.innerHTML.includes('Observación del horario real'));
 assert(!bar.innerHTML.includes('data-action="day-start"')&&!bar.innerHTML.includes('data-action="day-end"')&&!bar.innerHTML.includes('data-action="day-review"')&&!bar.innerHTML.includes('data-action="skip-month"'));
 assert.equal(canvas.dataset.first,240);assert.equal(canvas.dataset.span,1320,'la escala muestra el horario real aunque haya una jornada en curso');
 seekListener({target:{closest:()=>canvas},clientX:170});
 assert.equal(context.observerMinute,900);assert.equal(context.currentMinute(),900);assert.equal(state.ops.minute,campaignMinute,'buscar en el horario no adelanta la campaña');
 context.setMinute(1010);assert.equal(context.currentMinute(),1010);assert.equal(state.ops.minute,campaignMinute,'la API de tiempo respeta la capa observada');
 context.pause();assert(!context.playing);assert.equal(JSON.stringify(state),before,'pausar no guarda ni liquida una jornada');
 context.observerMinute=1559.9;context.play();context.frame(1200);
 assert.equal(context.observerMinute,1560);assert(!context.playing);assert.equal(finishEvents,0,'llegar al último tren observado no cierra la jornada de campaña');
 assert.equal(JSON.stringify(state),before);
 if(phase==='running'){
  context.layer='network';assert.equal(context.currentMinute(),campaignMinute,'volver a la red recupera su minuto intacto');
  context.play();context.frame(1300);
  assert.equal(state.ops.minute,campaignMinute+.6,'reanudar la campaña continúa desde el mismo minuto');
  assert(simulationEvents>0,'el reloj de campaña sigue operativo después de observar');
 }
}
console.log('✓ Observación: reloj, controles, línea temporal y búsqueda independientes; ninguna jornada guardada cambia y la campaña se reanuda desde el mismo minuto.');
