import {ENCOUNTERS,ENCOUNTER} from './encounters.js';
import {CITY,POP,MODEL} from './data.js';
import * as I from './infra.js';
import {brandName} from './brands.js';
// Gestión estratégica: todos los importes en M€, plazos en meses.
export const GROUPS={government:['Gobierno','president'],treasury:['Hacienda','treasury'],staff:['Plantilla','workshop'],riders:['Viajeros','riders'],territory:['Territorio','mayor']};
export const POLICIES={youth:{name:'Abono joven',cost:.22,note:'+8 % de demanda; billetes un 4 % más baratos.'},dynamic:{name:'Tarifas dinámicas',cost:.08,note:'+4 % de ingresos; los viajeros pierden confianza.'},wifi:{name:'Wifi gratis',cost:.15,note:'+3 puntos de calidad y +3 % de demanda.'},refund:{name:'Devoluciones por retraso',cost:.12,note:'Mejora la confianza; devuelve hasta el 5 % de ingresos.'},outsource:{name:'Externalizar mantenimiento',cost:0,note:'Ahorra un 2 % de operación; desgaste y malestar laboral.'},lowcost:{name:'Marca propia: AVArato',cost:.3,note:'Entra en la guerra de precios: tarifa efectiva −12 %, demanda +18 %.'}};
export const TECHS={online:{name:'Venta online',cost:10,months:4,requires:[],note:'+3 % de demanda.'},loyalty:{name:'Programa de fidelización',cost:18,months:6,requires:['online'],note:'+5 % de demanda.'},ertms:{name:'ERTMS',cost:35,months:12,requires:[],note:'Tiempos de viaje −5 % y +2 de puntualidad.'},changer:{name:'Cambiador rápido',cost:25,months:8,requires:['ertms'],note:'Recupera 3 minutos por cambio de ancho.'},predictive:{name:'Mantenimiento predictivo',cost:28,months:10,requires:['online'],note:'Desgaste −20 % y coste operativo −2 %.'},hydrogen:{name:'Hidrógeno para el Alvia híbrido',cost:65,months:18,requires:['predictive','ertms'],note:'Operación del Alvia híbrido −8 %.'}};
export const ARCS=[['Guerra de precios','rival','Que Lowgo venda billetes a precio de pipas no te obliga a regalar el tren. Elige cómo plantarles cara.'],['Pajares sin excusas','adif','El túnel está. Ahora faltan trenes, viajeros y alguien que deje de cortar cintas.'],['Corredor Mediterráneo','minister','Vamos con el Mediterráneo: el trazado lleva peor tus promesas que yo.\n\nDeja de unir capitales en los discursos. Une estaciones en el mapa.'],['La España que espera','mayor','Aquí también pagamos impuestos. El autobús de las seis ya nos conoce demasiado.'],['Urnas y vías','president','Se acercan las elecciones. Necesito resultados, no otra maqueta con luces.']];
const bound=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function initialTycoon(){return {encounter:null,encounterCount:0,mode:'campaign',rivals:true,groups:Object.fromEntries(Object.keys(GROUPS).map(k=>[k,60])),policies:[],tech:[],research:null,drivers:180,training:[],contracts:[],resolved:[],arc:0,serial:0,paper:[],achievements:[],dismissal:0,completed:0,failed:0,programme:null,markets:{}};}
export const driverNeed=s=>Math.ceil(s.routes.filter(r=>r.active).reduce((n,r)=>n+r.frequency*2,0)*.55);
export const staffing=s=>Math.min(1,s.tycoon.drivers/Math.max(1,driverNeed(s)));
function pay(s,n){if(s.ended)throw Error('El mandato ha terminado.');if(!Number.isFinite(n)||n<0||s.cash<n)throw Error('Hacienda dice que no. Revisa la caja.');s.cash-=n;}
export function setPolicy(s,id){if(!Object.hasOwn(POLICIES,id))throw Error('Política desconocida.');pay(s,0);const t=s.tycoon;if(t.policies.includes(id))t.policies=t.policies.filter(x=>x!==id);else t.policies.push(id);}
export function hire(s,count=20){if(!Number.isInteger(count)||count<1||count>200)throw Error('Contrata entre 1 y 200 maquinistas.');pay(s,count*.015);s.tycoon.training.push({count,due:s.month+3});}
export function research(s,id){const t=s.tycoon,q=Object.hasOwn(TECHS,id)?TECHS[id]:null;if(!q||t.research||t.tech.includes(id)||!q.requires.every(x=>t.tech.includes(x)))throw Error('Completa primero los requisitos y la investigación en curso.');pay(s,q.cost);t.research={id,due:s.month+q.months};}
export function lobby(s,id){if(!Object.hasOwn(GROUPS,id))throw Error('Grupo desconocido.');if(s.tycoon.groups[id]>=95)throw Error('Ya están encantados. Guarda la cartera.');pay(s,8);s.tycoon.groups[id]=bound(s.tycoon.groups[id]+12);}
export function freeGame(s,cash,rivals){if(![500,1500,5000].includes(cash)||typeof rivals!=='boolean')throw Error('Configuración del modo libre inválida.');if(s.started||s.month!==0)throw Error('El modo libre se elige al empezar.');s.cash=cash;s.tycoon.mode='free';s.tycoon.rivals=rivals;}
function marketEntry(s,r){
 if(!s.tycoon.rivals||r.demand<15000)return null;
 const from=/barcelona/.test(r.id)?0:/valencia|alicante/.test(r.id)?12:/sevilla|malaga|granada/.test(r.id)?30:72;
 return s.month>=from&&(/madrid/.test(r.id)||s.month>=72)?from:null;
}
export function competition(s,r){
 const from=marketEntry(s,r);if(from===null)return [];
 const review=s.tycoon.markets?.[r.id],cycle=Math.floor((s.month-from)/6),war=cycle%3===1;
 return ['lowgo','rossa'].filter((_,i)=>s.month>=from+i*10).map((id,i)=>{
  const strategy=(i?review?.rossa:review?.lowgo)||'hold',base=4+Math.min(6,Math.floor((s.month-from)/24));
  return {id,name:brandName(i?'Rossa':'Lowgo'),color:i?'#c92b3f':'#ed4aa5',fare:Math.max(9,r.km*(i?.09:.065))*(war?.78:1)*(strategy==='price'?.94:1),frequency:base+(strategy==='capacity'?1:0),quality:(i?87:76)+(strategy==='quality'?3:0),war,strategy,nextReview:(Math.floor(s.month/6)+1)*6};
 });
}
export function effects(s,r){const t=s.tycoon,on=k=>t.policies.includes(k),tech=k=>t.tech.includes(k);return {demand:(t.groups.riders>=80?1.005:1)*(t.groups.territory>=80?1.002:1)*(on('youth')?1.08:1)*(on('wifi')?1.03:1)*(on('lowcost')?1.18:1)*(tech('online')?1.03:1)*(tech('loyalty')?1.05:1),fare:(on('lowcost')?.88:1)*(on('youth')?.96:1)*(on('dynamic')?1.04:1),quality:(t.groups.staff>=80?1:0)+(on('wifi')?3:0)+(tech('ertms')?2:0)-(t.groups.staff<25?8:0),speed:tech('ertms')?.95:1,changer:tech('changer')?3:0,cost:(on('outsource')?.98:1)*(tech('predictive')?.98:1),refund:on('refund'),staff:staffing(s)*(t.groups.staff<25?.9:1)};}
export function monthlyCost(s){const t=s.tycoon;return t.policies.reduce((n,k)=>n+POLICIES[k].cost,0)+Math.max(0,t.drivers-180)*.0015+(t.groups.treasury<25?1:0)-(t.groups.treasury>=80?.1:0)-(t.groups.government>=80?.1:0);}
// Los contratos usan objetivos reales del motor; no inventan trenes ni descuentan obras por adelantado.
const routeLimit=r=>r.real?r.baseFrequency:12;
const routeLabel=r=>r.name||r.ends.map(id=>CITY[id]?.name||id).join(' — ');
const activeRoute=(s,id)=>s.routes.find(r=>r.id===id);
const requirement=(kind,id,target)=>({kind,id,target});
const readyRoute=(s,r)=>r&&!r.cut&&[I.PROFILES.ave,I.PROFILES.alvia,I.PROFILES.hybrid].some(p=>I.plan(s,r.via,p).ok);
/** Una sola fórmula para reservar material, tanto al firmar un contrato como al abrir el servicio. */
export function requiredUnits(s,r,m,frequency){
 const path=I.plan(s,r.via,I.profileOf(m));
 if(r.real){const slow=bound(path.ok&&r.minutes?path.minutes/r.minutes:1,.8,1.35);return Math.max(1,Math.ceil(r.peak*Math.min(1,frequency/r.baseFrequency)*1.12*slow));}
 const minutes=path.ok?path.minutes:r.km/1.5,interval=15/Math.max(1,frequency-1),cycle=(minutes/60+.6)*2;
 return Math.max(2,Math.ceil(cycle/Math.max(.1,interval)));
}
export function supplyOptions(s,r,frequency,needsConfiguration=true){
 const lots=s.fleet.filter(f=>f.qty>0).map(f=>{const model=MODEL[f.model],compatible=I.plan(s,r.via,I.profileOf(model)).ok,available=f.qty-s.routes.filter(x=>x.active&&x.fleet===f.id&&x.id!==r.id).reduce((n,x)=>n+x.units,0),required=requiredUnits(s,r,model,frequency);return {id:f.id,model:f.model,name:model.name,available,required,compatible,condition:f.condition,ready:compatible&&f.condition>=30&&available>=required,reassignable:compatible&&f.condition>=30&&f.qty>=required};});
 const existing=r.active&&r.frequency>=frequency&&lots.find(f=>f.id===r.fleet)?.compatible;
 return {route:r.id,name:routeLabel(r),frequency,openCost:r.active?0:4,ready:!r.cut&&((!needsConfiguration&&existing)||lots.some(f=>f.ready)),reassignable:!r.cut&&lots.some(f=>f.reassignable),lots};
}
const startingFrequencies=r=>({public:Math.min(routeLimit(r),Math.max(r.active?r.frequency:0,2)+Math.min(2,Math.max(1,Math.ceil(routeLimit(r)*.15)))),commercial:Math.min(routeLimit(r),Math.max(r.active?r.frequency:0,2)+1)});
const regions=[['bcn','vlc','ali','sev','mal'],['gij','ovi','san','leo','bil','pam','iru'],['vlc','bcn','cas','ali','mur','alm','car'],['sal','bad','sor','lug','fer','avi','jae','hue','alg'],[]];
function chooseRoute(s,arc){
 const pool=s.routes.filter(r=>routeLimit(r)>=2&&readyRoute(s,r));
 const local=pool.filter(r=>!regions[arc].length||r.ends.some(id=>regions[arc].includes(id)));
 const supplies=new Map(pool.map(r=>{const f=startingFrequencies(r);return [r.id,{public:supplyOptions(s,r,f.public),commercial:supplyOptions(s,r,f.commercial)}];})),feasible=r=>supplies.get(r.id).public.ready||supplies.get(r.id).commercial.ready;
 const unfinished=r=>!r.active||r.frequency<routeLimit(r)||r.level<3||r.ends.some(id=>(s.stations[id]||0)<3);
 const candidates=local.some(r=>feasible(r)&&unfinished(r))?local.filter(r=>feasible(r)&&unfinished(r)):pool.some(r=>feasible(r)&&unfinished(r))?pool.filter(r=>feasible(r)&&unfinished(r)):local.some(feasible)?local.filter(feasible):pool.some(feasible)?pool.filter(feasible):local.length?local:pool;
 const score=r=>(!r.active?12:0)+(routeLimit(r)-r.frequency)/Math.max(1,routeLimit(r))*5+(3-r.level)+(3-(s.stations[r.ends.at(-1)]||0))+(arc===0&&competition(s,r).length?5:0)+(arc===2&&!r.ends.includes('mad')?8:0)+(supplies.get(r.id).public.ready&&supplies.get(r.id).commercial.ready?10:0);
 return candidates.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
}
function connectingRoute(s,r){
 return s.routes.filter(x=>x.id!==r.id&&x.ends.some(id=>id!=='mad'&&r.ends.includes(id))&&routeLimit(x)>=2&&readyRoute(s,x)&&supplyOptions(s,x,Math.min(routeLimit(x),Math.max(2,x.active?x.frequency+1:2)),!x.active||x.frequency<routeLimit(x)).ready)
  .sort((a,b)=>(Number(b.active===false)-Number(a.active===false))||(b.demand-a.demand)||a.id.localeCompare(b.id))[0]||null;
}
function projectOffer(s){
 const t=s.tycoon,programme=t.programme;let arc=programme?.arc??t.arc%ARCS.length;
 // El diálogo existente de Pajares dice que el túnel ya está: se ofrece después de su apertura real.
 if(!programme&&arc===1&&!s.infra.h.includes('leo-pol@2023-11-29'))arc=0;
 const r=(programme&&activeRoute(s,programme.route))||chooseRoute(s,arc);if(!r)return null;
 let stage=programme?.stage||1;const city=r.ends.find(id=>id!=='mad')||r.ends.at(-1),second=stage===3?connectingRoute(s,r):null;
 const stationLevel=s.stations[city]||0,limit=routeLimit(r),frequency=Math.min(limit,Math.max(r.active?r.frequency:0,2)+(stage===1?Math.min(2,Math.max(1,Math.ceil(limit*.15))):0));
 const common=[requirement('active',r.id,1),requirement('staff','people',.98)];
 const publicReq=[...common,requirement('frequency',r.id,frequency),requirement('fare',r.id,Math.max(1.5,Math.round(r.fare*(stage===1?.95:1)*10)/10))];
 const commercialReq=[...common,requirement('frequency',r.id,Math.min(limit,Math.max(r.active?r.frequency:0,2)+(stage===1?1:0))),requirement('margin',r.id,stage===3?.12:.08),requirement('occupancy',r.id,.35)];
 if(stage===2){
  const otherStation=r.ends.find(id=>(s.stations[id]||0)<3);
  if(stationLevel<3)publicReq.push(requirement('station',city,stationLevel+1));
  else if(r.level<3)publicReq.push(requirement('level',r.id,r.level+1));
  else if(otherStation)publicReq.push(requirement('station',otherStation,(s.stations[otherStation]||0)+1));
  else publicReq.push(requirement('punctuality',r.id,90));
  if(r.level<3)commercialReq.push(requirement('level',r.id,r.level+1));
  else if(stationLevel<3)commercialReq.push(requirement('station',city,stationLevel+1));
  else if(otherStation)commercialReq.push(requirement('station',otherStation,(s.stations[otherStation]||0)+1));
  else commercialReq.push(requirement('punctuality',r.id,90));
 }
 let expands=false;
 if(stage===3&&second){
  const secondFrequency=Math.min(routeLimit(second),Math.max(2,second.active?Math.min(routeLimit(second),second.frequency+1):2));
  expands=!second.active||second.frequency<secondFrequency;
  for(const req of [publicReq,commercialReq])req.push(requirement('active',second.id,1),requirement('frequency',second.id,secondFrequency));
  commercialReq.push(requirement('networkMargin',r.id,.05));
 }
 if(stage===3&&!expands){
  const station=[...r.ends.filter(id=>id!==city),city,...(second?.ends||[])].find(id=>(s.stations[id]||0)<3),upgrade=[r,second].find(x=>x&&x.level<3);
  const publicInvestment=station?requirement('station',station,(s.stations[station]||0)+1):upgrade?requirement('level',upgrade.id,upgrade.level+1):null;
  const commercialInvestment=upgrade?requirement('level',upgrade.id,upgrade.level+1):publicInvestment;
  if(publicInvestment)publicReq.push(publicInvestment);if(commercialInvestment)commercialReq.push(commercialInvestment);
 }
 const capitalAvailable=[r,second].filter(Boolean).some(x=>x.level<3||x.ends.some(id=>(s.stations[id]||0)<3)),stability=!capitalAvailable&&!expands&&(stage>1||r.frequency>=limit);
 if(stability){stage=1;for(const req of [publicReq,commercialReq]){const price=req.find(x=>x.kind==='fare');if(price)price.target=r.fare;req.push(requirement('punctuality',r.id,90));}}
 const publicBonus=stationLevel<(stage===2?2:3)?[requirement('station',city,stationLevel+(stage===2?2:1))]:[requirement('punctuality',r.id,92)];
 const commercialBonus=[requirement('punctuality',r.id,90),requirement('margin',r.id,.18)];
 const branches={public:{reward:stability?4:[24,34,44][stage-1],penalty:stability?2:5,requirements:publicReq,bonus:{reward:stability?0:6+stage*2,requirements:publicBonus}},commercial:{reward:stability?6:[34,46,60][stage-1],penalty:stability?3:8,requirements:commercialReq,bonus:{reward:stability?0:8+stage*2,requirements:commercialBonus}}};
 return {id:'mission-'+t.serial++,arc,goal:'project',base:0,target:3,until:s.month+12,reward:branches.public.reward,penalty:branches.public.penalty,status:'offered',branch:null,project:{route:r.id,link:second?.id||null,title:stability?'Mantener un servicio fiable':stage===3&&!expands?'Consolidar el corredor':['Poner el corredor en marcha','Invertir en un servicio que se note','Conectar el corredor con su entorno'][stage-1],stage,stability,branches,streak:0,observedMonth:s.month,bonusWon:false}};
}
function inspectRequirement(s,q,x,metricFn){
 const r=activeRoute(s,x.id),m=r&&metricFn?.(r);let current=0,label='',action='route',id=x.id,cost=null,note='';
 switch(x.kind){
  case 'active':current=Number(!!r?.active&&readyRoute(s,r));label='Servicio abierto';cost=r?.active?0:4;note='Requiere tren compatible y unidades libres.';break;
  case 'frequency':current=r?.active?r.frequency:0;label='Salidas por sentido';note='Revisa unidades libres y plantilla antes de ampliar.';break;
  case 'fare':current=r?.fare||0;label='Tarifa máxima';break;
  case 'station':current=s.stations[x.id]||0;label='Nivel de estación';action='city';cost=0;for(let level=current;level<x.target;level++)cost+=Math.round((4+Math.sqrt(POP[x.id]||60)*.35)*(level+1));break;
  case 'level':current=r?.level||0;label='Nivel de servicio';cost=current<x.target?12+12*current:0;note='Mejora del servicio: cuatro meses.';break;
  case 'staff':current=staffing(s);label='Salidas con maquinista';action='tycoon-tab';id='people';note='La formación tarda tres meses.';break;
  case 'margin':current=m&&m.revenue>0?m.net/m.revenue:0;label='Margen del servicio';note='Beneficio después de costes directos, incluidos ingresos por servicio público.';break;
  case 'networkMargin':{const link=activeRoute(s,q.project.link),other=link&&metricFn?.(link),revenue=(m?.revenue||0)+(other?.revenue||0);current=m&&other&&revenue>0?(m.net+other.net)/revenue:0;label='Margen de las dos conexiones';note='Las dos relaciones deben cubrir juntas sus costes directos.';break;}
  case 'occupancy':current=m?.occupancy??0;label='Ocupación de plazas';break;
  case 'punctuality':current=m?.punctuality??0;label='Puntualidad';break;
 }
 const done=x.kind==='fare'?current>0&&current<=x.target+.00001:current>=x.target-.00001;
 return {...x,label,current,done,action,id,cost,note,route:r?routeLabel(r):CITY[x.id]?.name||null,unit:['margin','networkMargin','occupancy','staff'].includes(x.kind)?'percent':x.kind==='fare'?'euro':x.kind==='punctuality'?'points':'number'};
}
/** API de presentación: los requisitos son los mismos que liquida el motor, sin duplicarlos en la UI. */
export function contractDetails(s,q,branch=q.branch,metricFn=null){
 if(q.goal!=='project')return null;
 const p=q.project,r=activeRoute(s,p.route),cache=new Map(),readMetrics=metricFn?(r=>{if(!cache.has(r.id))cache.set(r.id,metricFn(r));return cache.get(r.id);}):null;
 const plan=id=>{
  const b=p.branches[id],prerequisites=[...new Set(b.requirements.filter(x=>x.kind==='active').map(x=>x.id))].map(route=>{const r=activeRoute(s,route),frequency=b.requirements.find(x=>x.kind==='frequency'&&x.id===route)?.target||r.frequency,needsConfiguration=!r.active||r.frequency<frequency||b.requirements.some(x=>x.kind==='fare'&&x.id===route&&r.fare>x.target);return supplyOptions(s,r,frequency,needsConfiguration);});
  const requirements=b.requirements.map(x=>inspectRequirement(s,q,x,readMetrics));
  for(const req of requirements)if(['active','frequency','fare'].includes(req.kind)){const supply=prerequisites.find(p=>p.route===req.id);if(supply&&!supply.ready)req.note=supply.reassignable?'No quedan unidades libres: libera trenes de otra relación antes de ampliar.':'Necesitas material compatible operativo; revisa taller y entregas antes de firmar.';}
  return {...b,prerequisites,requirements,bonus:{...b.bonus,requirements:b.bonus.requirements.map(x=>inspectRequirement(s,q,x,readMetrics))}};
 };
 const branches={public:plan('public'),commercial:plan('commercial')},selected=branches[branch||'public'];
 return {...selected,title:p.title,route:p.route,routeName:r?routeLabel(r):p.route,link:p.link,stage:p.stage,stageTotal:p.stability?1:3,stability:!!p.stability,progress:p.streak,target:q.target,months:q.status==='offered'?24:Math.max(0,q.until-s.month),offeredMonths:Math.max(0,q.until-s.month),bonusWon:p.bonusWon,branches};
}
/** Captura antes del cierre: las entregas/obras del mes siguiente no cuentan como servicio ya prestado. */
export function assessContracts(s,metricFn){return Object.fromEntries(s.tycoon.contracts.filter(q=>q.status==='active'&&q.goal==='project').map(q=>{const d=contractDetails(s,q,q.branch,metricFn);return [q.id,{done:d.requirements.every(x=>x.done),bonus:d.bonus.requirements.every(x=>x.done)}];}));}
export function missionValue(s,q){switch(q.goal){case 'passengers':return Math.max(0,s.stats.passengers-q.base);case 'stations':return Math.max(0,Object.values(s.stations).reduce((a,b)=>a+b,0)-q.base);case 'services':return Math.max(0,s.routes.filter(r=>r.active).length-q.base);case 'research':return Math.max(0,s.tycoon.tech.length-q.base);case 'satisfaction':return s.satisfaction;case 'project':return q.project.streak;default:return 0;}}
export function offer(s){
 const t=s.tycoon;if(t.contracts.some(q=>q.status==='offered'||q.status==='active'))return;
 // El primer encargo mantiene el contrato explicado durante el turno de inducción y en partidas anteriores.
 if(t.serial>0){const q=projectOffer(s);if(q){t.contracts=[q];return;}}
 const q={id:'mission-'+t.serial++,arc:t.mode==='free'?t.arc%ARCS.length:s.chapter,goal:'passengers',base:s.stats.passengers,target:Math.max(250000,s.last.passengers*5),until:s.month+18,reward:18,penalty:5,status:'offered',branch:null};t.contracts=[q];
}
export function accept(s,id,branch){
 pay(s,0);const q=s.tycoon.contracts.find(q=>q.id===id);if(!q||q.status!=='offered'||!['public','commercial'].includes(branch)||s.month>=q.until)throw Error('Encargo no disponible.');
 q.status='active';q.branch=branch;
 if(q.goal==='project'){const b=q.project.branches[branch];q.reward=b.reward;q.penalty=b.penalty;q.until=s.month+24;q.project.observedMonth=s.month;q.project.streak=0;return;}
 // El trabajo previo a firmar no resuelve automáticamente una promesa nueva.
 q.base=q.goal==='passengers'?s.stats.passengers:q.goal==='services'?s.routes.filter(r=>r.active).length:q.goal==='stations'?Object.values(s.stations).reduce((a,b)=>a+b,0):q.goal==='research'?s.tycoon.tech.length:q.base;
 if(branch==='commercial'){q.target*=1.25;q.reward=26;q.penalty=8;}else q.reward=18;
}
export function tick(s,observations=null){
 const t=s.tycoon,news=[];let completedNow=false;
 if(!t.encounter&&s.month%3===0){t.encounter=ENCOUNTERS[(t.encounterCount*137+(s.seed%315))%315].id;t.encounterCount++;}
 for(const x of t.training.filter(x=>x.due<=s.month)){t.drivers+=x.count;news.push(`${x.count} maquinistas terminan la formación: ya pueden cubrir salidas.`);}t.training=t.training.filter(x=>x.due>s.month);
 if(t.research&&t.research.due<=s.month){t.tech.push(t.research.id);news.push(TECHS[t.research.id].name+': esta vez el PowerPoint funciona.');t.research=null;}
 const active=s.routes.filter(r=>r.active),on=k=>t.policies.includes(k),ratio=staffing(s);
 const targets={government:s.satisfaction*.8+(s.last.net>0?15:-20),treasury:s.last.net>0?75:s.cash<100?15:35,staff:60+(s.maintenance-1)*35-(on('outsource')?24:0)-(ratio<1?25:0),riders:s.satisfaction+(on('refund')?8:0)-(on('dynamic')?8:0),territory:Math.min(90,45+active.length*.8)};
 for(const k of Object.keys(GROUPS))t.groups[k]=bound(t.groups[k]*.96+targets[k]*.04);
 if(t.groups.territory<25&&s.month%6===0)for(const p of s.projects)if(!p.done)p.due++;
 t.dismissal=t.groups.government<15?t.dismissal+1:0;if(t.mode==='campaign'&&t.dismissal>=6){s.ended=true;s.ending='dismissed';}
 if(s.month%6===0){
  t.markets={};for(const r of active)if(marketEntry(s,r)!==null){const cheap=Math.max(9,r.km*.065),challenged=r.fare<=cheap*1.05; t.markets[r.id]={month:s.month,lowgo:challenged?'capacity':r.fare>cheap*1.45?'price':'hold',rossa:challenged?'quality':r.frequency>6?'capacity':'hold'};}
 }
 for(const q of t.contracts){
  let bonus=false;
  if(q.status==='active'&&q.goal==='project'&&q.project.observedMonth<s.month){
   const d=observations?.[q.id]??(()=>{const detail=contractDetails(s,q);return {done:detail.requirements.every(x=>x.done),bonus:detail.bonus.requirements.every(x=>x.done)};})();
   q.project.streak=d.done?Math.min(q.target,q.project.streak+1):0;q.project.observedMonth=s.month;bonus=d.bonus;
  }
  if(q.status==='active'&&missionValue(s,q)>=q.target){
   q.status='won';completedNow=true;let extra=0;if(q.goal==='project'){q.project.bonusWon=bonus;extra=bonus?q.project.branches[q.branch].bonus.reward:0;t.programme=!q.project.stability&&q.project.stage<3?{arc:q.arc,route:q.project.route,stage:q.project.stage+1}:null;if(!t.programme)t.arc++;news.push(`${routeLabel(activeRoute(s,q.project.route))}: ${q.project.stability?'acuerdo de operación cumplido':`etapa ${q.project.stage}/3 cumplida`}. ${q.reward+extra} M€${extra?' con bonificación':''}.`);}else{t.arc++;news.push('Promesa cumplida: se investiga cómo ha podido ocurrir.');}
   s.cash+=q.reward+extra;t.completed++;t.groups[q.branch==='public'?'territory':'treasury']=bound(t.groups[q.branch==='public'?'territory':'treasury']+6);
   t.resolved.push({arc:q.arc,branch:q.branch,result:'won',month:s.month,reward:q.reward+extra,...(q.goal==='project'?{route:q.project.route,stage:q.project.stage}: {})});
  }else if(['active','offered'].includes(q.status)&&s.month>=q.until){
   q.status=q.status==='offered'?'declined':'lost';if(q.status==='lost'){s.cash-=q.penalty;t.failed++;t.groups.government=bound(t.groups.government-8);news.push(`Encargo incumplido: ${q.penalty} M€ de penalización. El Gobierno toma nota.`);}t.arc++;t.programme=null;t.resolved.push({arc:q.arc,branch:q.branch,result:q.status,month:s.month,...(q.goal==='project'?{route:q.project.route,stage:q.project.stage}: {})});
  }
 }
 if(completedNow||s.month%6===0)offer(s);
 const rivals=active.flatMap(r=>competition(s,r));
 const head=ratio<1?'Hay trenes, faltan maquinistas: el horario se ha venido arriba.':t.groups.staff<25?'El comité pide sillas. Dirección ofrece otra reunión.':s.last.net<0?'Hacienda busca el beneficio debajo de la alfombra.':rivals.some(x=>x.war)?'OuiOui rebaja billetes. El margen solicita asilo.':s.month%6===0&&rivals.some(x=>x.strategy!=='hold')?'Los rivales revisan la oferta: toca competir con horarios, precios y calidad.':`${active.length} conexiones, ${Math.round(s.last.passengers).toLocaleString('es-ES')} viajeros: el próximo corredor sigue esperando.`;
 t.paper.unshift(...(news.length?news.map(title=>({month:s.month,title})):[{month:s.month,title:head}]));t.paper=t.paper.slice(0,24);t.resolved=t.resolved.slice(-60);
 for(const [id,condition] of [['Primer encargo',t.completed>=1],['Cinco promesas cumplidas',t.completed>=5],['Un corredor de principio a fin',t.resolved.some(q=>q.result==='won'&&q.stage===3)],['Cinco corredores con futuro',t.resolved.filter(q=>q.result==='won'&&q.stage===3).length>=5],['Laboratorio sobre raíles',t.tech.length===6],['Ni un tren sin maquinista',ratio===1&&driverNeed(s)>250],['Conectar el país',active.length>=40],['Constructor de líneas',s.stats.built>0],['Más allá de 2050',t.mode==='free'&&s.month>=348]])if(condition&&!t.achievements.includes(id))t.achievements.push(id);
}
const requirementKinds=['active','frequency','fare','station','level','staff','margin','networkMargin','occupancy','punctuality'];
const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(v);
function validRequirement(x){if(!x||!requirementKinds.includes(x.kind)||!safeId(x.id)||!Number.isFinite(x.target)||x.target<0)return false;switch(x.kind){case 'active':return x.target===1;case 'frequency':return Number.isInteger(x.target)&&x.target<=100;case 'fare':return x.target>=1.5&&x.target<=150;case 'station':case 'level':return Number.isInteger(x.target)&&x.target<=3;case 'staff':case 'margin':case 'networkMargin':case 'occupancy':return x.target<=1;case 'punctuality':return x.target<=100;default:return false;}}
function validProject(p){return !!p&&safeId(p.route)&&(p.link===null||safeId(p.link))&&typeof p.title==='string'&&p.title.length<=160&&Number.isInteger(p.stage)&&p.stage>=1&&p.stage<=3&&(p.stability===undefined||typeof p.stability==='boolean')&&Number.isInteger(p.streak)&&p.streak>=0&&p.streak<=3&&Number.isInteger(p.observedMonth)&&p.observedMonth>=0&&typeof p.bonusWon==='boolean'&&['public','commercial'].every(id=>{const b=p.branches?.[id];return b&&Number.isFinite(b.reward)&&b.reward>=0&&b.reward<=100&&Number.isFinite(b.penalty)&&b.penalty>=0&&b.penalty<=20&&Array.isArray(b.requirements)&&b.requirements.length>=1&&b.requirements.length<=12&&b.requirements.every(validRequirement)&&b.bonus&&Number.isFinite(b.bonus.reward)&&b.bonus.reward>=0&&b.bonus.reward<=30&&Array.isArray(b.bonus.requirements)&&b.bonus.requirements.length<=5&&b.bonus.requirements.every(validRequirement);});}
export function valid(t){return !!t&&Number.isInteger(t.encounterCount)&&t.encounterCount>=0&&(t.encounter===null||Object.hasOwn(ENCOUNTER,t.encounter))&&['campaign','free'].includes(t.mode)&&typeof t.rivals==='boolean'&&Object.keys(GROUPS).every(k=>Number.isFinite(t.groups?.[k])&&t.groups[k]>=0&&t.groups[k]<=100)&&Number.isInteger(t.drivers)&&t.drivers>=0&&t.drivers<=100000&&Array.isArray(t.training)&&t.training.length<=1000&&t.training.every(x=>Number.isInteger(x.count)&&x.count>0&&Number.isInteger(x.due))&&Array.isArray(t.policies)&&new Set(t.policies).size===t.policies.length&&t.policies.every(x=>Object.hasOwn(POLICIES,x))&&Array.isArray(t.tech)&&new Set(t.tech).size===t.tech.length&&t.tech.every(x=>Object.hasOwn(TECHS,x))&&(!t.research||(Object.hasOwn(TECHS,t.research.id)&&Number.isInteger(t.research.due)))&&['arc','serial','dismissal','completed','failed'].every(k=>Number.isInteger(t[k])&&t[k]>=0)&&(!t.programme||(safeId(t.programme.route)&&Number.isInteger(t.programme.arc)&&t.programme.arc>=0&&t.programme.arc<5&&[2,3].includes(t.programme.stage)))&&(!t.markets||(typeof t.markets==='object'&&!Array.isArray(t.markets)&&Object.keys(t.markets).length<=400&&Object.entries(t.markets).every(([id,m])=>safeId(id)&&!!m&&Number.isInteger(m.month)&&m.month>=0&&['hold','price','capacity'].includes(m.lowgo)&&['hold','quality','capacity'].includes(m.rossa))))&&Array.isArray(t.contracts)&&t.contracts.length<=10&&t.contracts.every(q=>!!q&&/^mission-\d+$/.test(q.id)&&Number.isInteger(q.arc)&&q.arc>=0&&q.arc<5&&['offered','active','won','lost','declined'].includes(q.status)&&['passengers','stations','services','research','satisfaction','project'].includes(q.goal)&&['base','target','until','reward','penalty'].every(k=>Number.isFinite(q[k])&&q[k]>=0)&&[null,'public','commercial'].includes(q.branch)&&(q.goal!=='project'||(q.target===3&&validProject(q.project)))&&(!['active','won','lost'].includes(q.status)||['public','commercial'].includes(q.branch)))&&Array.isArray(t.resolved)&&t.resolved.length<=60&&t.resolved.every(q=>q&&Number.isInteger(q.arc)&&q.arc>=0&&q.arc<5&&[null,'public','commercial'].includes(q.branch)&&['won','lost','declined'].includes(q.result)&&(q.month===undefined||(Number.isInteger(q.month)&&q.month>=0))&&(q.reward===undefined||(Number.isFinite(q.reward)&&q.reward>=0&&q.reward<=130))&&(q.route===undefined||safeId(q.route))&&(q.stage===undefined||[1,2,3].includes(q.stage)))&&Array.isArray(t.paper)&&t.paper.length<=24&&t.paper.every(p=>Number.isInteger(p.month)&&typeof p.title==='string')&&Array.isArray(t.achievements)&&t.achievements.every(x=>typeof x==='string');}
/** Las referencias guardadas deben pertenecer a la red de esta partida, también en líneas creadas por el jugador. */
export function validReferences(s){
 const routes=new Map(s.routes.map(r=>[r.id,r])),t=s.tycoon;
 return (!t.programme||routes.has(t.programme.route))&&Object.entries(t.markets||{}).every(([id,m])=>routes.has(id)&&m.month<=s.month)&&t.resolved.every(q=>!q.route||routes.has(q.route))&&t.contracts.every(q=>q.goal!=='project'||(routes.has(q.project.route)&&(!q.project.link||routes.has(q.project.link))&&q.project.observedMonth<=s.month&&Object.values(q.project.branches).every(b=>[...b.requirements,...b.bonus.requirements].every(x=>x.kind==='staff'?x.id==='people':x.kind==='station'?!!CITY[x.id]:routes.has(x.id)&&(x.kind!=='frequency'||x.target<=routeLimit(routes.get(x.id)))))));
}
