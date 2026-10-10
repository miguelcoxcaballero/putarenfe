import {DECISIONS} from './story.js';
import * as E from './engine.js';
import * as I from './infra.js';
import * as U from './tenfe.js';
import {MODEL} from './data.js';
export const LEGACY_KEY='tenfe-rescate-v1';
  const GROUP_MAP={viajeros:'riders',territorios:'territory',trabajadores:'staff',economia:'treasury'};
  const CORRIDORS={norte:'regional-norte',levante:'regional-levante',sur:'regional-sur',mediterraneo:'valencia-barcelona',ebro:'regional-ebro',galicia:'regional-atlantico',
    asturias:'regional-asturias',extremadura:'madrid-badajoz',teruel:'valencia-zaragoza',soria:'madrid-soria',cantabria:'regional-cantabria'};
  const OFFER_MODEL={kafka:'r465',dorfler:'rdorf',bcbb:'rbcbb',used:'r592'};
  export function validateLegacy(x) {
    if(!x||x.v!==1||!Number.isInteger(x.week)||x.week<1||x.week>417||!Number.isFinite(x.cash)||!Number.isFinite(x.debt)||x.debt<0)return false;
    if(!Array.isArray(x.fleet)||x.fleet.length>3000||x.fleet.some(t=>!OFFER_MODEL[t.offer]||!Number.isFinite(t.condition)||t.condition<0||t.condition>100))return false;
    if(!x.corridors||Object.keys(CORRIDORS).some(id=>!x.corridors[id]||!Number.isFinite(x.corridors[id].track)||!Number.isFinite(x.corridors[id].fare)))return false;
    return !!x.groups&&Object.keys(GROUP_MAP).every(k=>Number.isFinite(x.groups[k])&&x.groups[k]>=0&&x.groups[k]<=100);
  }
  export function legacySave(storage=globalThis.localStorage) {
    try{const x=JSON.parse(storage.getItem(LEGACY_KEY));return validateLegacy(x)?x:null;}catch{return null;}
  }
  export function summary(storage=globalThis.localStorage) {
    const x=legacySave(storage);return x?{v:1,week:x.week,seed:x.seed,seedCode:x.seedCode,savedAt:x.savedAt||0}:null;
  }
  export function convertLegacy(x) {
    if(!validateLegacy(x))throw Error('El archivo del rescate anterior no es válido.');
    const seed=Number.isFinite(x.seed)?x.seed:72022,s=E.initialState(seed);
    s.month=Math.min(156,60+Math.floor((x.week-1)*96/416));
    const wins=Array.isArray(x.elections)?x.elections:[];
    if(wins.length)s.month=Math.max(s.month,Math.min(156,108+(wins.length-1)*48));
    s.cash=x.cash*30;s.debt=Math.min(1500,x.debt*30);s.started=true;
    s.seedCode=String(x.seedCode||seed);s.tutorial={done:true};s.event=null;s.requests=[];s.orders=[];s.projects=[];s.refits=[];s.fleet=[];
    s.tycoon.contracts=[];s.tycoon.resolved=[];s.tycoon.programme=null;
    I.applyHistoric(s,new Date(Date.UTC(2022+Math.floor(s.month/12),s.month%12,1)).toISOString().slice(0,10));
    for(const r of s.routes){r.active=false;r.fleet=null;r.units=0;}
    for(const t of x.fleet) {
      s.fleet.push({id:'f'+s.nextId++,model:OFFER_MODEL[t.offer],qty:1,condition:t.condition,born:2027-(t.offer==='used'?30:5),
        origin:'Rescate anterior · '+String(t.name||t.id),legacyCorridor:t.corridor});
    }
    const notes=[];
    for(const [id,rid] of Object.entries(CORRIDORS)) {
      const c=x.corridors[id],r=s.routes.find(r=>r.id===rid);
      if(!r || !c.open)continue;
      r.level=Math.min(3,Math.max(0,Math.floor(c.track/33)));
      const fleet=s.fleet.filter(f=>f.legacyCorridor===id).find(f=>E.canRun(s,r,MODEL[f.model])&&E.available(s,f)>0);
      if(fleet) {
        const frequency=1,required=E.requiredUnits(s,r,MODEL[fleet.model],frequency);
        if(required<=E.available(s,fleet)){r.active=true;r.fleet=fleet.id;r.frequency=frequency;r.units=required;r.fare=Math.max(1.5,Math.min(150,c.fare));}
        else notes.push(id+': falta material para el horario de la red real.');
      }else notes.push(id+': asigna un tren compatible con la red real.');
    }
    for(const [old,current] of Object.entries(GROUP_MAP))s.tycoon.groups[current]=x.groups[old];
    s.tycoon.groups.government=(x.groups.viajeros+x.groups.territorios)/2;
    const techMap={app:'online',abono:'loyalty',ertms:'ertms',predictivo:'predictive',bimodo:'hydrogen'};
    s.tycoon.tech=[...new Set((Array.isArray(x.techs)?x.techs:[]).map(id=>techMap[id]).filter(Boolean))];
    const u=U.begin(s);u.rescueStarted=true;u.ruralBase=0;
    u.elections=wins.slice(0,2).map((v,i)=>({month:108+i*48,support:Math.max(0,Math.min(100,Number(v.support??v.vote??v.apoyo)||50)),won:!!(v.won??v.win??v.ganada)}));
    u.polls=[{month:s.month,value:U.support(s)}];
    u.milestones=(Array.isArray(x.milestones)?x.milestones:[]).filter(id=>id!=='m0').slice(0,4).map((_,i)=>U.MILESTONES[i].id);
    u.bailouts=(Array.isArray(x.rescues)?x.rescues:[]).filter(r=>Number.isFinite(r.week)&&Number.isFinite(r.amount)).map(r=>({month:60+Math.floor((r.week-1)*96/416),amount:r.amount*30}));
    u.legacy={source:LEGACY_KEY,week:x.week,raw:JSON.parse(JSON.stringify(x)),notes:[
      'Caja y deuda se convierten ×30 a la economía de la red nacional.',
      'Corredores y material pasan a vías reales. El horario empieza con una salida diaria.',
      'Obras, pactos y expedientes anteriores quedan en la copia original para consultar y exportar.',
      ...notes]};
    s.decided=DECISIONS.filter(d=>d.at<s.month).map(d=>d.id);
    E.log(s,'Partida recuperada','Rescate anterior · semana '+x.week+'. Se conserva una copia íntegra del original.');
    return E.validateSave(s);
  }
