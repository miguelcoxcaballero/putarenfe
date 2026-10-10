
import {TECHS as IDEAS, MEGAPROJECTS as GREAT_WORKS} from './rescate-data.js';
import {MODEL, CITY} from './data.js';
import * as I from './infra.js';
let E;
export const bind = engine => { E=engine; };
export const isNew = s => !!s.tenfe?.game;
const bounded = n => Math.max(0,Math.min(100,n));
export const HUBS = [
 ['aco',9,16],['gij',28,9],['leo',27,28],['san',44,12],['bil',59,13],['zar',70,33],['bcn',89,36],
 ['sal',20,49],['mad',44,50],['sor',57,33],['ter',69,53],['vlc',82,69],['ali',75,83],['bad',17,70],
 ['sev',34,86],['mal',48,92]
].map(([id,x,y])=>({id,x,y,name:CITY[id]?.name||id}));
export const NETWORK = ['madrid-barcelona','madrid-valencia','madrid-sevilla','madrid-malaga','madrid-alicante','madrid-santander','madrid-bilbao','madrid-salamanca','madrid-badajoz','madrid-soria','madrid-gijon','madrid-coruna','regional-norte','regional-ebro','regional-asturias','regional-cantabria','valencia-zaragoza','valencia-barcelona','valencia-alicante'];
export const CHALLENGES = [
 {id:'s1',name:'El primer tren que llega',text:'Recupera una red fiable. No sirve ampliar si los viajeros no llegan.',test:s=>E.balance(s).punctuality>=85,reward:25},
 {id:'s2',name:'El país también existe entre capitales',text:'Abre dos conexiones rurales adicionales.',test:s=>rural(s).length>=s.tenfe.ruralBase+2,reward:40},
 {id:'s3',name:'Una red que se sostiene',text:'Consigue margen positivo durante tres turnos consecutivos.',test:s=>s.tenfe.game.profit>=3,reward:40},
 {id:'s4',name:'Prometer, cumplir, repetir',text:'Cumple dos acuerdos: pactos del consejo o encargos de tu agenda.',test:s=>s.tenfe.pacts.filter(p=>p.status==='won').length+s.tycoon.completed>=2,reward:35},
 {id:'s5',name:'Algo que queda',text:'Pon en servicio un megaproyecto que mejore la operación de tu red.',test:s=>s.tenfe.megas.some(p=>p.stage===4&&p.id!=='monumento'),reward:50}
];
const countryside=['sor','ter','bad','san','sal','gij','leo'];
export const rural = s => s.routes.filter(r=>r.active&&r.via.some(n=>countryside.includes(n)));
export const PROJECTS = GREAT_WORKS.map(d=>({...d,id:d.id==='ctc'?'control':d.id,
 costs:d.stages.map(x=>Math.round(x.cost*10)),durations:d.stages.map(x=>Math.max(1,Math.ceil(x.weeks/4))),
 effect:d.id==='taller'?'Revisiones más baratas, menos desgaste y más fiabilidad.':d.id==='ctc'?'+5 de puntualidad y menos desgaste.':d.id==='mediterraneo'?'+35 % de demanda entre València y Barcelona.':d.id==='teruel'?'Vía rápida y electrificada por Teruel; impulsa la demanda rural.':d.id==='estacion'?'+16 % de demanda en las conexiones de Madrid.':'Prestigio, innovación y apoyo territorial; no lleva viajeros.'}));
export const RESEARCH = IDEAS.map(d=>({...d,cost:Math.round(d.cost*10),stars:d.stars,turns:d.tier,
 effect:({
 ultrasonidos:'Desgaste de flota −10 %.',predictivo:'Desgaste −20 % y puntualidad +2.',bateadora:'Plazo de obras −20 %.',
 cadenciados:'Demanda +6 %.',regulacion:'Puntualidad +3.',ertms:'Puntualidad +4.',contrato:'Reformas de material −25 %.',
 segunda:'Trenes usados −25 %.',bimodo:'Coste del material híbrido −8 %.',abono:'Demanda +4 % y apoyo de viajeros +8 al terminar.',
 dinamico:'Ingreso por billete +8 %.',app:'Coste operativo −3 % y demanda +5 %.',prensa:'Pérdida de apoyo por escándalos −30 %.',
 inauguraciones:'Cada fase de megaproyecto terminada aporta 3 puntos de innovación.',
 influencers:'Innovación +1 por turno con puntualidad ≥85 %.',
 contabilidad:'El atajo entrega 60 M€, pero mantiene sus consecuencias.',abogados:'El expediente judicial se retrasa 3 turnos adicionales.',
 destructora:'La restitución voluntaria del atajo cuesta 10 M€ menos.'
 })[d.id]}));
export const PACTS = [
 {id:'taller',name:'Convenio del taller',person:'workshop',cost:8,reward:18,months:6,group:'staff',requirement:'Flota en servicio al 75 % durante tres cierres.'},
 {id:'territorio',name:'El tren que falta',person:'mayor',cost:0,advance:15,reward:20,months:8,group:'territory',requirement:'Una conexión rural adicional durante tres cierres.'},
 {id:'viajeros',name:'Llegar a su hora',person:'riders',cost:6,reward:18,months:6,group:'riders',requirement:'Puntualidad del 87 % durante tres cierres.'},
 {id:'investigacion',name:'Del plano a la vía',person:'adif',cost:0,advance:10,reward:20,months:8,group:'government',requirement:'Termina una investigación del laboratorio.'}
];
const choice=(label,cost,detail,effect)=>({label,cost,detail,effect});
const rows = [
 ['evento-auditoria','La auditoría abre los cajones','Hacienda quiere comprobar cómo gastas. Mejor ordenar las cuentas antes de que las ordene otro.',[choice('Auditar con transparencia',8,'Economía +8; expediente enfriado.',{treasury:8,risk:-12}),choice('Entregar las cuentas tal cual',0,'Economía −4; sospecha +8.',{treasury:-4,risk:8})]],
 ['evento-averia','El tren decide quedarse','Una avería amenaza el servicio. El viajero no quiere tu excusa: quiere llegar.',[choice('Rescate y reparación',10,'Plantilla +4; viajeros +6; mejor estado de flota.',{staff:4,riders:6,condition:3}),choice('Autobús de sustitución',3,'Viajeros −3; la compañía sigue operando.',{riders:-3})]],
 ['evento-cable','El cobre se va de excursión','Han robado cable de señalización. Los horarios se están convirtiendo en literatura fantástica.',[choice('Reponer y vigilar',9,'Puntualidad +2 durante tres turnos.',{quality:2}),choice('Circular con precaución',0,'Puntualidad −4 durante tres turnos.',{quality:-4})]],
 ['evento-calor','Las vías también sudan','Llega una ola de calor. Puedes anticiparte o confiar en el aire acondicionado de los noventa.',[choice('Refuerzo preventivo',6,'Viajeros +5; conserva el material.',{riders:5,condition:2}),choice('Reducir el esfuerzo',0,'Demanda −8 % durante tres turnos.',{demand:-.08})]],
 ['evento-desprendimiento','La montaña pide su turno','Un talud cede sobre la vía. Las cuadrillas tienen que elegir dónde trabajar primero.',[choice('Equipo de emergencia',12,'Territorios +8; obras sin retraso.',{territory:8}),choice('Reprogramar las obras',0,'Obras pendientes +1 turno; territorios −5.',{delay:1,territory:-5})]],
 ['evento-fondos','Europa no paga maquetas','Llega una convocatoria de fondos. La financiación exige entregar un proyecto, no una rueda de prensa.',[choice('Presentar el expediente',4,'20 M€ de ayuda; innovación +4.',{cash:20,stars:4}),choice('Reservar el esfuerzo',0,'Economía +2; no cobras fondos.',{treasury:2})]],
 ['evento-huelga','El comité trae pancartas','La plantilla quiere un convenio razonable. Los viajeros quieren trenes. Tú quieres sobrevivir al viernes.',[choice('Negociar el convenio',10,'Plantilla +10; viajeros +3.',{staff:10,riders:3}),choice('Apretar el presupuesto',0,'Plantilla −10; puntualidad −3 durante tres turnos.',{staff:-10,quality:-3})]],
 ['evento-lowgo','Lowgo vende billetes a precio de pipas','Tu rival ocupa los titulares. Elige si compites por precio o por un servicio que merezca la pena.',[choice('Una oferta mejor',8,'Demanda +10 % durante tres turnos.',{demand:.10}),choice('Proteger el margen',0,'Economía +4; viajeros −4.',{treasury:4,riders:-4})]],
 ['evento-nevada','Un país bajo la nieve','Las estaciones amanecen blancas. El cartel de puntualidad prefiere no hacer declaraciones.',[choice('Desplegar el plan invernal',7,'Puntualidad +2; viajeros +4.',{quality:2,riders:4}),choice('Suspender lo prescindible',0,'Demanda −6 %; territorios −4.',{demand:-.06,territory:-4})]],
 ['evento-tuneles','Algo debajo de la vía','Una obra encuentra restos que nadie había dibujado. El túnel tendrá que esperar al arqueólogo.',[choice('Estudiar y adaptar',8,'Innovación +5; economía +3.',{stars:5,treasury:3}),choice('Esperar el informe',0,'Obras pendientes +1 turno.',{delay:1})]],
 ['evento-viral','El regional tiene fans','Un vídeo del tren se hace viral. Por una vez, nadie sale gritando en el andén.',[choice('Campaña con los viajeros',4,'Demanda +12 % durante tres turnos.',{demand:.12}),choice('Que hablen los trenes',0,'Viajeros +4; innovación +2.',{riders:4,stars:2})]],
 ['evento-visita','La ministra quiere una foto','La visita se puede convertir en financiación o en un discurso demasiado largo.',[choice('Mostrar una obra de verdad',6,'Territorios +6; economía +4.',{territory:6,treasury:4}),choice('Una foto y a trabajar',0,'Gobierno +3.',{government:3})]],
 ['territorio-extremadura','Extremadura quiere llegar','El territorio pide servicio, no otra promesa de AVE.',[choice('Financiar el compromiso',8,'Territorios +10; 15 M€ para ampliar tu red.',{territory:10,cash:15}),choice('Priorizar los servicios actuales',0,'Economía +4; territorios −5.',{treasury:4,territory:-5})]],
 ['territorio-soria','Soria no es un hueco en el mapa','El alcalde llega con una lista de viajeros y mucho tiempo esperando.',[choice('Apostar por el regional',7,'Territorios +9; innovación +4.',{territory:9,stars:4}),choice('Esperar a tener más caja',0,'Economía +3; territorios −5.',{treasury:3,territory:-5})]],
 ['territorio-teruel','Teruel existe y guarda los recortes','La conexión transversal puede alimentar tus grandes líneas. El mapa tiene vida fuera de Madrid.',[choice('Preparar la conexión',8,'Territorios +10; demanda +5 % durante tres turnos.',{territory:10,demand:.05}),choice('Concentrar la inversión',0,'Economía +4; territorios −6.',{treasury:4,territory:-6})]],
 ['territorio-cantabria','El Norte pide continuidad','Los transbordos mal coordinados no convencen a quien tiene coche.',[choice('Coordinar los enlaces',6,'Demanda +8 % durante tres turnos; viajeros +4.',{demand:.08,riders:4}),choice('Conservar el horario',0,'Territorios −4.',{territory:-4})]],
 ['tren-bcbb','BCBB llama a la puerta','Un fabricante ofrece material que cabe en el presupuesto. La compra se hace en Trenes Pop.',[choice('Probar el material',5,'Innovación +5; economía +4.',{stars:5,treasury:4}),choice('Mantener la flota conocida',0,'Plantilla +4.',{staff:4})]],
 ['tren-dorfler','El tren suizo y sus exigencias','Dörfler quiere enseñar su tren. El taller pregunta primero por los repuestos.',[choice('Formar al taller',7,'Flota +3 de estado; innovación +4.',{condition:3,stars:4}),choice('Primero, repuestos comunes',0,'Plantilla +4; economía +2.',{staff:4,treasury:2})]],
 ['impago','El proveedor también paga nóminas','Una factura entra en discusión. Tu calendario financiero debe aguantar algo más que la previsión optimista.',[choice('Regularizar la factura',10,'Economía +6; plantilla +3.',{treasury:6,staff:3}),choice('Pedir un aplazamiento',0,'Economía −7; deuda +12 M€.',{treasury:-7,debt:12})]],
 ['cloacas','Una puerta que no aparece en el plano','El intermediario ofrece financiación opaca. La ventaja inmediata tiene consecuencias comprobables.',[choice('Cerrar la puerta',0,'Economía +5; sospecha −5.',{treasury:5,risk:-5}),choice('Pagar una consultoría sospechosa',0,'15 M€ ahora; sospecha +20; economía −8.',{cash:15,risk:20,treasury:-8})]],
 ['extorsion','El intermediario quiere cobrar otra vez','Alguien insinúa que puede hacer circular papeles incómodos. Puedes hacer pública la presión.',[choice('Denunciar la presión',4,'Viajeros +4; economía +6; sospecha −10.',{riders:4,treasury:6,risk:-10}),choice('Comprar silencio',8,'Sospecha +10; pierde apoyo económico.',{risk:10,treasury:-5})]],
 ['juzgado','Un expediente tiene número','El juzgado pide la documentación de la adjudicación. El dinero fácil vuelve a salir caro.',[choice('Colaborar y corregir',10,'Sospecha −20; economía +5.',{risk:-20,treasury:5}),choice('Litigar cada papel',5,'Sospecha +5; economía −5.',{risk:5,treasury:-5})]]
];
for(const [image,title] of [['charo','La asesora que nadie contrató'],['enchufe','El currículum tiene apellidos'],['juez','Una llamada demasiado oportuna'],['mariscada','La factura huele a marisco'],['sobres','Los sobres también viajan'],['traviesas','Traviesas a precio de oro'],['yate','El yate no figura en el inventario']])
 rows.push(['escandalo-'+image,title,'La prensa descubre una contratación irregular. Toca decidir qué haces con el expediente y asumir el coste.',[choice('Abrir la investigación',8,'Economía +6; sospecha −12.',{treasury:6,risk:-12}),choice('Restar importancia',0,'Viajeros −6; economía −8; sospecha +8.',{riders:-6,treasury:-8,risk:8})]]);
export const EVENTS = rows.map(([image,title,body,choices])=>({id:image,image,title,body,choices}));
export const PHOTO_ROLES = Object.fromEntries([
 ...EVENTS.map(d=>[d.image,'suceso']),...RESEARCH.map(d=>['tech-'+d.id,'investigación']),
 ...PROJECTS.map(d=>[d.image,'megaproyecto']),...CHALLENGES.map(d=>['etapa-'+d.id,'objetivo']),
 ['portada-rescate','bienvenida'],['elecciones','elecciones'],['hito','hitos'],['fin-victoria','victoria'],['fin-derrota','derrota']
]);
export function begin(s){
 const u=s.tenfe;if(u.game)return;
 u.game={version:1,origin:s.month,stars:12,tech:[],research:null,event:null,deck:[],seen:[],news:[],mods:[],risk:0,profit:0,challenges:[],won:false,lastPhase:0};
 u.since=s.month;u.lastMonth=s.month;u.elections=[];u.polls=[];u.megas=[];u.pacts=[];u.notices=[];u.rescueStarted=true;u.rescueWon=false;
 if(s.month===0){
  for(const d of I.TRAMOS)s.infra.t[d.id].lanes=d.kind==='lav'?2:1;
  s.cash=320;s.debt=60;s.orders=[];s.projects=[];s.requests=[];s.decided=[];s.event=null;
  s.routes=s.routes.filter(r=>NETWORK.includes(r.id));
  for(const r of s.routes){r.active=false;r.units=0;r.fleet=null;r.real=false;r.frequency=2;r.baseFrequency=12;r.demand=Math.max(r.demand,24000);}
  // The starter railway is a physical network, not a historical release schedule.
  s.fleet=[['s100',8,68],['s103',8,78],['s130',10,70],['s730',6,67],['r465',6,74],['r599',6,72]].map(([model,qty,condition],i)=>({id:'f'+i,model,qty,condition,born:2010,origin:'Red inicial'}));
  for(const [id,model,frequency] of [['madrid-barcelona','s103',3],['madrid-valencia','s103',2],['madrid-sevilla','s100',3],['regional-norte','r465',2],['madrid-badajoz','s730',2]]){
   const r=s.routes.find(r=>r.id===id),f=s.fleet.find(f=>f.model===model);
   if(r&&E.canRun(s,r,MODEL[model])){const units=E.requiredUnits(s,r,MODEL[model],frequency);if(E.available(s,f)>=units)Object.assign(r,{active:true,fleet:f.id,frequency,units});}
  }
  s.tycoon.contracts=[];s.tycoon.programme=null;
  s.tycoon.groups={government:58,treasury:55,staff:58,riders:54,territory:48};
  E.generateRequest(s,true);
 }
 u.ruralBase=rural(s).length;u.baseline=Math.max(100000,E.balance(s).passengers);
 u.game.deck=shuffle(s,EVENTS.map(x=>x.id));
}
function shuffle(s,items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(E.random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const turn=s=>s.month-s.tenfe.game.origin+1;
export const support=s=>bounded(s.tycoon.groups.riders*.34+s.tycoon.groups.territory*.2+s.tycoon.groups.staff*.2+s.tycoon.groups.treasury*.26);
export const electionMonth=s=>s.tenfe.game.origin+Math.ceil((turn(s))/12)*12;
export const forecast=s=>s.tenfe.polls.length?s.tenfe.polls.reduce((n,p)=>n+p.value,0)/s.tenfe.polls.length:support(s);
export function mods(s,key){const g=s.tenfe.game;let n=0;
 for(const id of g.tech)n+=RESEARCH.find(d=>d.id===id)?.mods?.[key]||0;
 for(const p of s.tenfe.megas){const d=PROJECTS.find(x=>x.id===p.id);for(let i=0;i<p.stage;i++)n+=d.stages[i].mods?.[key]||0;}
 return n;
}
export function effects(s,r){
 const g=s.tenfe.game,on=id=>g.tech.includes(id),phase=id=>s.tenfe.megas.find(p=>p.id===id)?.stage||0;
 const live=key=>g.mods.filter(x=>x.until>s.month).reduce((n,x)=>n+(x[key]||0),0);
 return {quality:mods(s,'punct')+(on('predictivo')?2:0)+(phase('taller')>=3?2:0)+live('quality'),
 cost:Math.max(.7,1-(on('app')?.03:0)-(on('bimodo')&&r&&MODEL[s.fleet.find(f=>f.id===r.fleet)?.model]?.power!=='electric'?.08:0)),
 wear:(on('ultrasonidos')?.9:1)*(on('predictivo')?.8:1)*(phase('taller')>=2?.8:1)*(phase('control')>=3?.9:1),
 demand:Math.max(.6,1+mods(s,'demand')+live('demand')+(r?.via.includes('mad')?mods(s,'madrid'):0)+(r?.id==='valencia-barcelona'&&phase('mediterraneo')>=3?.35:0)+(r?.via.includes('ter')&&phase('teruel')>=2?.12:0)),
 yield:1+mods(s,'yield')};
}
export function researchQuote(s,id){const d=RESEARCH.find(x=>x.id===id);if(!d)throw Error('Investigación desconocida.');
 const g=s.tenfe.game,reason=g.tech.includes(id)?'Terminada':g.research?'Laboratorio ocupado':!(d.needs||[]).every(x=>g.tech.includes(x))?'Completa la investigación anterior':g.stars<d.stars?'Falta innovación':s.cash<d.cost?'Falta caja':s.ended?'Mandato terminado':'';
 return {d,reason};}
export function research(s,id){E.ensurePlaying(s);const q=researchQuote(s,id);if(q.reason)throw Error(q.reason);E.spend(s,q.d.cost);s.tenfe.game.stars-=q.d.stars;s.tenfe.game.research={id,due:s.month+q.d.turns};}
export function megaQuote(s,id){const definition=PROJECTS.find(x=>x.id===id);if(!definition)throw Error('Proyecto desconocido.');
 const p=s.tenfe.megas.find(x=>x.id===id),stage=p?.stage||0;
 const crews=s.projects.filter(x=>!x.done).length+s.tenfe.megas.filter(x=>x.due).length;
 const reason=p?.due?'Fase en marcha':stage===4?'Proyecto terminado':crews>=3?'Las tres cuadrillas están ocupadas':stage>=2&&!s.tenfe.milestones.length?'Alcanza un hito de viajeros antes de esta fase':'';
 return {definition,stage,cost:definition.costs[stage]||0,months:definition.durations[stage]||0,reason,phase:definition.stages[stage]?.name||'En servicio'};
}
export function startMega(s,id){E.ensurePlaying(s);const q=megaQuote(s,id);if(q.reason)throw Error(q.reason);E.spend(s,q.cost);
 let p=s.tenfe.megas.find(x=>x.id===id);if(!p){p={id,stage:0,due:0,paid:0};s.tenfe.megas.push(p);}p.due=s.month+q.months;p.paid+=q.cost;
 E.log(s,'Fase adjudicada',q.definition.name+' · '+q.phase);
}
export function signPact(s,id){E.ensurePlaying(s);const d=PACTS.find(x=>x.id===id),u=s.tenfe;
 if(!d||u.pacts.some(p=>p.id===id)||u.pacts.filter(p=>p.status==='active').length>=2)throw Error('El consejo admite dos pactos activos, sin repetir acuerdos.');
 E.spend(s,d.cost);s.cash+=d.advance||0;u.pacts.push({id,base:id==='territorio'?rural(s).length:id==='investigacion'?s.tenfe.game.tech.length+s.tycoon.tech.length:0,from:s.month,until:s.month+d.months,kept:0,status:'active'});
}
export function pactProgress(s,p){return p.id==='territorio'?rural(s).length>p.base:p.id==='investigacion'?s.tenfe.game.tech.length+s.tycoon.tech.length>p.base:p.id==='viajeros'?E.balance(s).punctuality>=87:E.activeCondition?E.activeCondition(s)>=75:s.fleet.filter(f=>s.routes.some(r=>r.active&&r.fleet===f.id)).every(f=>f.condition>=75);}
function news(s,image,title,body){const g=s.tenfe.game;g.news.unshift({image,title,body,turn:turn(s)});g.news=g.news.slice(0,80);E.log(s,title,body);}
export function decide(s,id,index){E.ensurePlaying(s);const g=s.tenfe.game,d=EVENTS.find(x=>x.id===g.event?.id);
 if(!d||id!==d.id||!Number.isInteger(index)||!d.choices[index])throw Error('El suceso ya no está pendiente.');
 const c=d.choices[index];E.spend(s,c.cost);const x=c.effect;
 s.cash+=x.cash||0;s.debt=Math.min(1500,s.debt+(x.debt||0));g.stars+=x.stars||0;g.risk=bounded(g.risk+(x.risk||0));
 for(const k of Object.keys(s.tycoon.groups))s.tycoon.groups[k]=bounded(s.tycoon.groups[k]+(x[k]||0));
 if(x.condition)for(const f of s.fleet)f.condition=bounded(f.condition+x.condition);
 if(x.delay)for(const p of s.projects.filter(p=>!p.done))p.due+=x.delay;
 if(x.quality||x.demand)g.mods.push({quality:x.quality||0,demand:x.demand||0,until:s.month+3});
 news(s,d.image,d.title,c.label+' · '+c.detail);g.seen.push(d.id);g.seen=g.seen.slice(-100);g.event=null;
}
export function tick(s,b){
 const u=s.tenfe,g=u.game;if(u.lastMonth>=s.month)return;u.lastMonth=s.month;
 judicial(s);
 g.profit=b.net>=0?g.profit+1:0;g.stars+=3+(b.punctuality>=85?2:0)+(g.tech.includes('influencers')&&b.punctuality>=85?1:0);g.mods=g.mods.filter(x=>x.until>s.month);
 if(g.research&&g.research.due<=s.month){const d=RESEARCH.find(x=>x.id===g.research.id);g.tech.push(d.id);g.research=null;
 if(d.id==='abono')s.tycoon.groups.riders=bounded(s.tycoon.groups.riders+8);news(s,'tech-'+d.id,'Investigación terminada',d.name+' · '+d.effect);}
 for(const p of u.megas.filter(x=>x.due&&x.due<=s.month)){p.stage++;p.due=0;const d=PROJECTS.find(x=>x.id===p.id),phase=d.stages[p.stage-1];
 g.stars+=(phase.reward?.stars||0)+(g.tech.includes('inauguraciones')?3:0);
 const mapping={viajeros:'riders',territorios:'territory',trabajadores:'staff',economia:'treasury'};
 for(const [k,v] of Object.entries(phase.reward?.groups||{}))s.tycoon.groups[mapping[k]]=bounded(s.tycoon.groups[mapping[k]]+v);
 g.risk=bounded(g.risk+(phase.suspicion||0));
 if(p.id==='teruel'&&p.stage===3){for(const t of I.TRAMOS.filter(t=>['sag','ter','zar'].includes(t.a)&&['sag','ter','zar'].includes(t.b))){s.infra.t[t.id].e='25kv';s.infra.t[t.id].v=Math.max(180,s.infra.t[t.id].v);}s.infra.ver++;}
 if(p.id==='teruel'&&p.stage===2){for(const t of I.TRAMOS.filter(t=>['sag','ter','zar'].includes(t.a)&&['sag','ter','zar'].includes(t.b)))s.infra.t[t.id].v=Math.max(180,s.infra.t[t.id].v);s.infra.ver++;}
 news(s,d.image,p.stage===4?'Megaproyecto en servicio':'Fase terminada',d.name+' · '+phase.name);
 }
 for(const p of u.pacts.filter(x=>x.status==='active')){const d=PACTS.find(x=>x.id===p.id),ok=pactProgress(s,p);p.kept=ok?Math.min(3,p.kept+1):0;
 if(p.kept>=3||(p.id==='investigacion'&&ok)){p.status='won';s.cash+=d.reward;s.tycoon.groups[d.group]=bounded(s.tycoon.groups[d.group]+8);news(s,'hito','Pacto cumplido',d.name+' · +'+d.reward+' M€');}
 else if(s.month>=p.until){p.status='lost';s.cash-=d.advance||0;s.tycoon.groups[d.group]=bounded(s.tycoon.groups[d.group]-10);news(s,'hito','Pacto incumplido',d.name+' · apoyo −10.');}}
 const factors=[1.15,1.4,1.8,2.3],ids=['andenes','regional','operador','vertebral'];
 for(let i=0;i<ids.length;i++)if(!u.milestones.includes(ids[i])&&b.passengers>=u.baseline*factors[i]){u.milestones.push(ids[i]);s.cash+=20+i*10;g.stars+=8;news(s,'hito','Más viajeros, más posibilidades','Hito '+(i+1)+' · financiación e innovación para tu red.');}
 for(const d of CHALLENGES)if(!g.challenges.includes(d.id)&&d.test(s)){g.challenges.push(d.id);s.cash+=d.reward;news(s,'etapa-'+d.id,d.name,'Objetivo cumplido · +'+d.reward+' M€');}
 u.polls.push({month:s.month,value:support(s)});u.polls=u.polls.slice(-3);
 const elapsed=s.month-g.origin;
 if(elapsed>0&&elapsed%12===0&&!u.elections.some(x=>x.month===s.month)){const vote=forecast(s),won=vote>=50;u.elections.push({month:s.month,support:vote,won});if(won)s.cash+=30;else if(u.difficulty==='normal'){s.ended=true;s.ending='election';}else s.tycoon.groups.government=bounded(s.tycoon.groups.government-12);news(s,'elecciones',won?'El consejo renueva el mandato':'Las urnas piden cambios',vote.toFixed(1)+' % de apoyo · '+(won?'+30 M€':'revisa lo que necesita tu red'));}
 if(!g.won&&g.challenges.length===5&&u.elections.filter(x=>x.won).length>=2&&!s.ended){g.won=true;u.rescueWon=true;news(s,'fin-victoria','Una red que merece continuar','Has completado los cinco objetivos y ganado dos mandatos. Tu red sigue abierta: juega sin límite de fecha.');}
 if(s.ended)news(s,'fin-derrota','Otro consejo toma el mando','Tu red y tus informes siguen disponibles para revisarlos.');
 if(!g.event&&!s.ended){
  if(!g.deck.length)g.deck=shuffle(s,EVENTS.map(x=>x.id));
  // Each full deck exposes every illustrated event before repeats, with a fixed saved order.
  const id=g.deck.shift();g.event={id,turn:turn(s)};
 }
 u.reports.unshift({month:s.month-1,net:b.net,cash:s.cash,passengers:b.passengers,punctuality:b.punctuality,support:support(s),active:s.routes.filter(r=>r.active).length,orders:s.orders.filter(o=>o.delivered<o.qty).length,news:s.log.slice(0,5).map(x=>({title:x.title,body:x.body}))});u.reports=u.reports.slice(0,24);
}
export function valid(s){
 const u=s.tenfe,g=u?.game;if(!g||g.version!==1)return false;
 const ids=(list,defs)=>Array.isArray(list)&&new Set(list).size===list.length&&list.every(id=>defs.some(d=>d.id===id));
 const finite=(x,a=0,b=1e9)=>Number.isFinite(x)&&x>=a&&x<=b;
 if(!Number.isInteger(g.origin)||g.origin<0||g.origin>s.month||!finite(g.stars)||!finite(g.risk,0,100)||!Number.isInteger(g.profit)||g.profit<0||typeof g.won!=='boolean'||!ids(g.tech,RESEARCH)||!ids(g.challenges,CHALLENGES))return false;
 if(g.research&&(!RESEARCH.some(x=>x.id===g.research.id)||!Number.isInteger(g.research.due)||g.research.due<=s.month))return false;
 if(g.event&&(!EVENTS.some(x=>x.id===g.event.id)||!Number.isInteger(g.event.turn)||g.event.turn<1))return false;
 if(!ids(g.deck,EVENTS)||!Array.isArray(g.seen)||g.seen.length>100||g.seen.some(id=>!EVENTS.some(x=>x.id===id)))return false;
 if(!Array.isArray(g.news)||g.news.length>80||g.news.some(x=>!PHOTO_ROLES[x.image]||typeof x.title!=='string'||x.title.length>200||typeof x.body!=='string'||x.body.length>2000||!Number.isInteger(x.turn)||x.turn<1))return false;
 if(!Array.isArray(g.mods)||g.mods.length>30||g.mods.some(x=>!finite(x.until)||!finite(x.quality,-20,20)||!finite(x.demand,-.5,.5)))return false;
 if(!Array.isArray(u.megas)||u.megas.length>6||new Set(u.megas.map(p=>p.id)).size!==u.megas.length||u.megas.some(p=>!PROJECTS.some(x=>x.id===p.id)||!Number.isInteger(p.stage)||p.stage<0||p.stage>4||!Number.isInteger(p.due)||p.due<0||!finite(p.paid)))return false;
 if(!Array.isArray(u.pacts)||u.pacts.length>4||new Set(u.pacts.map(p=>p.id)).size!==u.pacts.length||u.pacts.some(p=>!PACTS.some(d=>d.id===p.id)||!['active','won','lost'].includes(p.status)||!Number.isInteger(p.kept)||p.kept<0||p.kept>3||!['base','from','until'].every(k=>finite(p[k]))))return false;
 if(!Array.isArray(u.elections)||u.elections.some(p=>!Number.isInteger(p.month)||p.month>s.month||!finite(p.support,0,100)||typeof p.won!=='boolean'))return false;
 if(!Array.isArray(u.polls)||u.polls.length>3||u.polls.some(p=>!finite(p.value,0,100)||!Number.isInteger(p.month)||p.month>s.month))return false;
 if(!Array.isArray(u.milestones)||u.milestones.some(id=>!['andenes','regional','operador','vertebral'].includes(id)))return false;
 return finite(u.baseline,1)&&finite(u.ruralBase)&&finite(u.lastMonth)&&u.lastMonth<=s.month&&['normal','relajada'].includes(u.difficulty)&&Array.isArray(u.reports)&&Array.isArray(u.bailouts)&&Array.isArray(u.notices);
}

export function mission(s){
 const g=s.tenfe.game;
 return {title:g.won?'Tu red sigue creciendo':'Cinco retos para cambiar el país',rescue:true,rows:[
 ...CHALLENGES.map(d=>({label:d.name,value:g.challenges.includes(d.id)?1:0,target:1,ok:g.challenges.includes(d.id)})),
 {label:'Mandatos ganados',value:s.tenfe.elections.filter(x=>x.won).length,target:2,ok:s.tenfe.elections.filter(x=>x.won).length>=2}
 ]};
}
export function nextAction(s){
 if(s.ended)return {label:'Ver mi red y mi legado',action:'navigate',screen:'progress'};
 if(s.tenfe.game.event)return {label:'Decidir el suceso del turno',action:'tycoon-tab',id:'agenda'};
 if(E.pendingDecision(s))return {label:'Escuchar al consejo',action:'tycoon-tab',id:'agenda'};
 const offer=s.tycoon.contracts.find(x=>x.status==='offered');
 if(offer)return {label:'Elegir un compromiso',action:'tycoon-tab',id:'agenda'};
 const p=s.tenfe.pacts.find(x=>x.status==='active'&&!pactProgress(s,x));
 if(p?.id==='investigacion')return {label:'Abrir el laboratorio',action:'tycoon-tab',id:'research'};
 if(rural(s).length<s.tenfe.ruralBase+2){const r=s.routes.find(r=>!r.active&&r.via.some(n=>countryside.includes(n)));if(r)return {label:'Abrir '+E.routeName(r),action:'route',id:r.id};}
 return {label:'Probar mi horario',action:'navigate',screen:'ops'};
}
export function shortcut(s){E.ensurePlaying(s);const u=s.tenfe;if(u.scandal||s.month<u.cooldown)throw Error('El expediente anterior sigue abierto.');
 const amount=s.tenfe.game.tech.includes('contabilidad')?60:45;s.cash+=amount;u.scandal={from:s.month,amount,delay:0,exposed:false,stage:0};s.tenfe.game.risk=bounded(s.tenfe.game.risk+35);
 news(s,'cloacas','El precio del atajo',amount+' M€ de financiación irregular. Inspección en 6 turnos; restitución y multa en 12.');
}
export function selfReport(s){E.ensurePlaying(s);const u=s.tenfe;if(!u.scandal)throw Error('No hay expediente.');
 E.spend(s,Math.max(0,u.scandal.amount-(u.game.tech.includes('destructora')?10:0)));u.scandal=null;u.cooldown=s.month+6;u.game.risk=bounded(u.game.risk-25);s.tycoon.groups.treasury=bounded(s.tycoon.groups.treasury-4);}
export function legalDefence(s){E.ensurePlaying(s);const c=s.tenfe.scandal;if(!c||c.delay)throw Error('Este expediente ya tiene revisión, o no existe.');
 E.spend(s,8);c.delay=3+(s.tenfe.game.tech.includes('abogados')?3:0);}
function judicial(s){
 const u=s.tenfe,c=u.scandal;if(!c)return;
 const factor=u.game.tech.includes('prensa')?.7:1;
 if(!c.exposed&&s.month>=c.from+6+c.delay){c.exposed=true;c.stage=1;for(const [k,n] of [['treasury',20],['riders',15],['government',15]])s.tycoon.groups[k]=bounded(s.tycoon.groups[k]-n*factor);news(s,'escandalo-sobres','El expediente sale a la luz','Los fondos irregulares cuestan apoyo. La sentencia se aproxima.');}
 if(c.exposed&&s.month>=c.from+12+c.delay){s.cash-=c.amount+15;s.reputation=bounded(s.reputation-12);news(s,'juzgado','Sentencia y restitución',(c.amount+15)+' M€ de restitución y multa.');u.scandal=null;u.cooldown=s.month+6;}
}
