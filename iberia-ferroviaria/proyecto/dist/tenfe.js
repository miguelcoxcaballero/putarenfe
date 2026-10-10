import * as T from './tycoon.js';
import {MODEL, CITY} from './data.js';
// One calendar, railway network, fleet and cash ledger. No second simulation.
  let E = null;
  export function bind(engine) { E = engine; }
  const clamp = v => Math.max(0, Math.min(100, v));
  const rural = ['sor', 'ter', 'bad', 'san', 'lug', 'jae'];
  export const MILESTONES = [
    {id:'andenes', name:'Andenes con gente', factor:1.25, reward:20, unlock:'Pactos con el consejo'},
    {id:'regional', name:'Red regional', factor:1.7, reward:30, unlock:'Megaproyectos por etapas'},
    {id:'operador', name:'Operador serio', factor:2.4, reward:45, unlock:'Financiación de grandes obras'},
    {id:'vertebral', name:'Columna vertebral', factor:3.2, reward:65, unlock:'Una red que deja legado'}
  ];
  export const PACTS = [
    {id:'taller', name:'Convenio del taller', person:'workshop', cost:8, reward:18, months:6, group:'staff', requirement:'Mantén la flota en servicio al 75 % durante tres meses.'},
    {id:'territorio', name:'El tren que falta', person:'mayor', cost:0, advance:15, reward:20, months:12, group:'territory', requirement:'Abre una conexión rural adicional y mantenla tres meses.'},
    {id:'viajeros', name:'Llegar a su hora', person:'riders', cost:6, reward:18, months:9, group:'riders', requirement:'Mantén el 87 % de puntualidad durante tres meses.'},
    {id:'investigacion', name:'Del plano a la vía', person:'adif', cost:0, advance:10, reward:20, months:18, group:'government', requirement:'Termina una investigación nueva.'}
  ];
  export const MEGAS = [
    {id:'control', name:'Centro de control', image:'mega-ctc', costs:[18,28,40], durations:[2,3,4], effect:'+3 puntos de puntualidad en toda la red.'},
    {id:'taller', name:'Gran taller', image:'mega-taller', costs:[20,35,45], durations:[2,4,4], effect:'Coste operativo −4 % y desgaste −20 %.'},
    {id:'territorio', name:'Plan regional', image:'mega-teruel', costs:[15,25,35], durations:[2,3,4], effect:'+12 % de demanda en conexiones rurales.'}
  ];
  const phaseNames = ['Permisos', 'Construcción', 'Pruebas'];
  function fresh(s, options = {}) {
    return {version:1, difficulty:options.difficulty === 'relajada' ? 'relajada' : 'normal', since:s.month,
      baseline:Math.max(100000, E.balance(s).passengers), ruralBase:ruralRoutes(s).length, milestones:[], pacts:[], megas:[],
      elections:[], polls:[], reports:[], notices:[], bailouts:[], electionOffset:0,
      lastMonth:s.month, nextId:1, scandal:null, cooldown:0, rescueStarted:false, rescueWon:false, legacy:null};
  }
  export function begin(s, options = {}) {
    if (!s.tenfe) {
      s.tenfe = fresh(s, options);
      if(s.month===0 && !s.started) {
        s.fleet.push({id:'f'+s.nextId++,model:'r465',qty:6,condition:74,born:2010,origin:'Parque regional heredado'},
          {id:'f'+s.nextId++,model:'r599',qty:6,condition:70,born:2009,origin:'Parque regional heredado'});
      }
    }
    return s.tenfe;
  }
  export function support(s) {
    const g=s.tycoon.groups;
    return clamp(g.riders*.34+g.territory*.2+g.staff*.2+g.treasury*.26);
  }
  export function electionMonth(s) {
    const offset=s.tenfe?.electionOffset||0;
    let due=108+offset;
    while(due<s.month || s.tenfe?.elections.some(x=>x.month===due)) due+=48;
    return due;
  }
  export function forecast(s) {
    const polls=s.tenfe?.polls||[];
    return polls.length ? polls.reduce((sum,p)=>sum+p.value,0)/polls.length : support(s);
  }
  export function isRural(r) { return r.via.some(id=>rural.includes(id)); }
  export function ruralRoutes(s) { return s.routes.filter(r=>r.active && isRural(r)); }
  export function activeCondition(s) {
    const used=s.fleet.filter(f=>s.routes.some(r=>r.active&&r.fleet===f.id));
    return used.length ? Math.min(...used.map(f=>f.condition)) : 0;
  }
  export function effects(s, r = null) {
    const complete=id=>s.tenfe?.megas.some(p=>p.id===id&&p.stage===3);
    return {quality:complete('control')?3:0, cost:complete('taller')?.96:1, wear:complete('taller')?.8:1,
      demand:r&&isRural(r)&&complete('territorio')?1.12:1};
  }
  function notify(s, kind, title, body) {
    const u=s.tenfe;
    u.notices.push({id:'notice-'+u.nextId++,month:s.month,kind,title,body});
    u.notices=u.notices.slice(-20);
    E.log(s,title,body);
  }
  export function dismiss(s, id) {
    if(!s.tenfe)return;
    s.tenfe.notices=s.tenfe.notices.filter(x=>x.id!==id);
  }
  export function pactProgress(s, pact) {
    switch(pact.id) {
      case 'taller': return activeCondition(s)>=75;
      case 'territorio': return ruralRoutes(s).length>pact.base;
      case 'viajeros': return E.balance(s).punctuality>=87 && s.routes.some(r=>r.active);
      case 'investigacion': return s.tycoon.tech.length>pact.base;
      default: return false;
    }
  }
  export function signPact(s, id) {
    E.ensurePlaying(s);
    const u=begin(s),d=PACTS.find(p=>p.id===id);
    if(!d)throw Error('Pacto desconocido.');
    if(!u.milestones.length)throw Error('Los pactos se abren con el primer hito de viajeros.');
    if(u.pacts.filter(p=>p.status==='active').length>=2)throw Error('Ya hay dos pactos activos. Cumple uno antes de firmar otro.');
    if(u.pacts.some(p=>p.id===id))throw Error('Este pacto ya está firmado.');
    E.spend(s,d.cost);
    s.cash+=d.advance||0;
    const base=id==='territorio'?ruralRoutes(s).length:id==='investigacion'?s.tycoon.tech.length:0;
    u.pacts.push({id,base,from:s.month,until:s.month+d.months,kept:0,status:'active'});
    E.log(s,'Pacto firmado',d.name+' · '+d.requirement);
  }
  export function megaQuote(s, id) {
    const d=MEGAS.find(p=>p.id===id);
    if(!d)throw Error('Proyecto desconocido.');
    const p=s.tenfe?.megas.find(p=>p.id===id),stage=p?.stage||0;
    const reason=!s.tenfe?.milestones.includes('regional')?'Completa el hito Red regional.':p?.due?'La fase actual sigue en marcha.':stage===3?'Proyecto terminado.':null;
    return {definition:d,stage,cost:d.costs[stage]||0,months:d.durations[stage]||0,reason,phase:phaseNames[stage]||'En servicio'};
  }
  export function startMega(s, id) {
    E.ensurePlaying(s);
    const u=begin(s),q=megaQuote(s,id);
    if(q.reason)throw Error(q.reason);
    if(u.megas.some(p=>p.due))throw Error('La dirección de obra está ocupada. Termina la fase en marcha.');
    E.spend(s,q.cost);
    let p=u.megas.find(p=>p.id===id);
    if(!p){p={id,stage:0,due:0,paid:0};u.megas.push(p);}
    p.due=s.month+q.months;p.paid+=q.cost;
    E.log(s,'Fase adjudicada',q.definition.name+' · '+q.phase+' · '+q.cost+' M€.');
  }
  export function shortcut(s) {
    E.ensurePlaying(s);const u=begin(s);
    if(u.scandal || s.month<u.cooldown)throw Error('Las cuentas de la adjudicación anterior siguen bajo revisión.');
    s.cash+=45;u.scandal={from:s.month,amount:45,delay:0,exposed:false,stage:0};
    E.log(s,'Adjudicación amañada','45 M€ en caja. La inspección revisará el expediente en seis meses.');
  }
  export function selfReport(s) {
    E.ensurePlaying(s);const u=begin(s),c=u.scandal;
    if(!c)throw Error('No hay una adjudicación irregular que devolver.');
    E.spend(s,c.amount);
    s.tycoon.groups.treasury=clamp(s.tycoon.groups.treasury-4);
    u.cooldown=s.month+24;u.scandal=null;
    E.log(s,'Fondos restituidos','45 M€ devueltos. Hacienda mantiene el expediente, sin sanción electoral.');
  }
  export function legalDefence(s) {
    E.ensurePlaying(s);const c=s.tenfe?.scandal;
    if(!c || c.delay)throw Error('Solo puedes pedir una revisión jurídica por expediente.');
    E.spend(s,8);c.delay=3;
    E.log(s,'Revisión jurídica','8 M€. La inspección se aplaza tres meses; las pruebas permanecen.');
  }
  export function tick(s, accounts) {
    const u=s.tenfe;
    if(!u || u.lastMonth>=s.month)return;
    u.lastMonth=s.month;
    if(s.month>=60 && !u.rescueStarted && s.tycoon.mode!=='free') {
      u.rescueStarted=true;
      notify(s,'rescate','El rescate empieza aquí','Tu red sigue en tus manos. Hasta 2034: dos elecciones, dos conexiones rurales y una compañía que se pague sola.');
    }
    for(const m of MILESTONES) {
      if(accounts.passengers>=u.baseline*m.factor && !u.milestones.includes(m.id)) {
        u.milestones.push(m.id);s.cash+=m.reward;
        notify(s,'hito',m.name,m.reward+' M€ de financiación. '+m.unlock+'.');
      }
    }
    for(const p of u.pacts.filter(p=>p.status==='active')) {
      const d=PACTS.find(x=>x.id===p.id),ok=pactProgress(s,p);
      p.kept=ok?Math.min(3,p.kept+1):0;
      if((p.id==='investigacion' && ok) || p.kept>=3) {
        p.status='won';s.cash+=d.reward;s.tycoon.groups[d.group]=clamp(s.tycoon.groups[d.group]+8);
        notify(s,'pacto','Pacto cumplido',d.name+' · +'+d.reward+' M€ · '+T.GROUPS[d.group][0]+' +8.');
      }else if(s.month>=p.until) {
        p.status='lost';s.cash-=d.advance||0;s.tycoon.groups[d.group]=clamp(s.tycoon.groups[d.group]-10);
        notify(s,'pacto','Pacto incumplido',d.name+' · '+(d.advance?'devuelves '+d.advance+' M€ · ':'')+T.GROUPS[d.group][0]+' −10.');
      }
    }
    for(const p of u.megas.filter(p=>p.due && p.due<=s.month)) {
      p.stage++;p.due=0;
      const d=MEGAS.find(x=>x.id===p.id);
      notify(s,'obra',p.stage===3?'Proyecto en servicio':'Fase terminada',d.name+' · '+(p.stage===3?d.effect:'Puedes encargar '+phaseNames[p.stage].toLowerCase()+'.'));
    }
    const c=u.scandal;
    if(c && s.month>=c.from+6+c.delay && !c.exposed) {
      c.exposed=true;c.stage=1;
      s.tycoon.groups.treasury=clamp(s.tycoon.groups.treasury-20);
      s.tycoon.groups.riders=clamp(s.tycoon.groups.riders-15);
      s.tycoon.groups.government=clamp(s.tycoon.groups.government-15);
      notify(s,'escandalo','El expediente sale a la luz','La inspección ha encontrado los 45 M€ de la adjudicación amañada. Hacienda −20; Viajeros y Gobierno −15.');
    }
    if(c && c.exposed && s.month>=c.from+12+c.delay && c.stage===1) {
      c.stage=2;s.cash-=60;
      notify(s,'escandalo','Sentencia y restitución','La compañía paga 60 M€ entre devolución y multa. La reputación pierde 12 puntos.');
      s.reputation=clamp(s.reputation-12);u.scandal=null;u.cooldown=s.month+24;
    }
    u.polls.push({month:s.month,value:support(s)});u.polls=u.polls.slice(-6);
    if(s.tycoon.mode!=='free' && s.month>=108+u.electionOffset && (s.month-(108+u.electionOffset))%48===0) {
      const vote=forecast(s),won=vote>=50;
      u.elections.push({month:s.month,support:vote,won});
      if(won) {
        s.cash+=30;s.tycoon.groups.government=clamp(s.tycoon.groups.government+8);
        notify(s,'eleccion','Mandato renovado',vote.toFixed(1)+' % de apoyo. +30 M€ para el siguiente mandato.');
      }else {
        notify(s,'eleccion','Las urnas deciden',vote.toFixed(1)+' % de apoyo. '+(u.difficulty==='relajada'?'Gobierno −15; sigues al mando.':'El consejo releva a la dirección.'));
        if(u.difficulty==='normal'){s.ended=true;s.ending='election';}
        else s.tycoon.groups.government=clamp(s.tycoon.groups.government-15);
      }
    }
    if(s.month>=156 && !u.rescueWon && u.elections.filter(x=>x.won).length>=2 && ruralRoutes(s).length>=u.ruralBase+2 && accounts.net>=0 && !u.bailouts.some(x=>x.month>s.month-24) && !s.ended) {
      u.rescueWon=true;
      notify(s,'rescate','Tenfe sale del rescate','Dos mandatos ganados y una red que se paga sola. Continúa construyendo tu legado hasta 2050.');
    }
    u.reports.unshift({month:s.month-1,net:accounts.net,cash:s.cash,passengers:accounts.passengers,punctuality:accounts.punctuality,
      support:support(s),active:s.routes.filter(r=>r.active).length,orders:s.orders.filter(o=>o.delivered<o.qty).length,
      news:s.log.filter(x=>x.month>=s.month-1).slice(0,5).map(x=>({title:x.title,body:x.body}))});
    u.reports=u.reports.slice(0,12);
  }
  export function mission(s) {
    if(s.tycoon.mode==='free')return {title:'Tu red, tus reglas',rows:[],rescue:false};
    if(s.month<60 || (s.month>=156 && s.tenfe.rescueWon)) return null;
    const b=E.balance(s);
    return {title:s.month<108?'Salvar Tenfe':'Ganar el segundo mandato',rescue:true,rows:[
      {label:'Conexiones rurales',value:Math.max(0,ruralRoutes(s).length-s.tenfe.ruralBase),target:2,ok:ruralRoutes(s).length>=s.tenfe.ruralBase+2},
      {label:'Resultado / mes',value:b.net,target:0,ok:b.net>=0,money:true},
      {label:'Apoyo electoral',value:forecast(s),target:50,ok:forecast(s)>=50,percent:true},
      {label:'Elecciones ganadas',value:s.tenfe.elections.filter(x=>x.won).length,target:2,ok:s.tenfe.elections.filter(x=>x.won).length>=2},
      {label:'Créditos puente (24 meses)',value:s.tenfe.bailouts.filter(x=>x.month>s.month-24).length,target:0,ok:!s.tenfe.bailouts.some(x=>x.month>s.month-24)}
    ]};
  }
  export function nextAction(s) {
    if(s.ended)return {label:'Ver tu legado',action:'navigate',screen:'progress'};
    if(E.pendingDecision(s))return {label:'Decidir con el consejo',action:'tenfe-decision'};
    if(E.chapterReady(s))return {label:'Cobrar la financiación',action:'claim'};
    const offer=s.tycoon.contracts.find(q=>q.status==='offered');
    if(offer)return {label:'Elegir tu próximo encargo',action:'tycoon-tab',id:'agenda'};
    const p=s.tenfe?.pacts.find(p=>p.status==='active'&&!pactProgress(s,p));
    if(p?.id==='taller')return {label:'Revisar el taller',action:'navigate',screen:'fleet'};
    if(p?.id==='investigacion')return {label:'Iniciar investigación',action:'tycoon-tab',id:'research'};
    const busy=s.tenfe?.megas.find(p=>p.stage<3&&!p.due);
    if(busy)return {label:'Continuar '+MEGAS.find(x=>x.id===busy.id).name.toLowerCase(),action:'tenfe-tab',id:'proyectos'};
    const b=E.balance(s);
    if(b.net<0)return {label:'Recuperar el margen',action:'navigate',screen:'network'};
    if(activeCondition(s)<65)return {label:'Renovar el material',action:'navigate',screen:'fleet'};
    if(s.month>=60&&s.month<156&&ruralRoutes(s).length<s.tenfe.ruralBase+2) {
      const r=s.routes.find(r=>!r.active&&isRural(r));
      if(r)return {label:'Llevar trenes a '+(CITY[r.ends.at(-1)]?.name||'otra comarca'),action:'route',id:r.id};
    }
    const r=s.routes.filter(r=>r.active).sort((a,b)=>E.metrics(s,b).occupancy-E.metrics(s,a).occupancy)[0];
    if(r && E.metrics(s,r).occupancy>.8)return {label:'Reforzar '+E.routeName(r),action:'route',id:r.id};
    return {label:'Preparar la jornada',action:'navigate',screen:'ops'};
  }
  export function validation(u,s) {
    if(u===undefined)return true;
    if(!u || u.version!==1 || !['normal','relajada'].includes(u.difficulty))return false;
    const finite = k=>Number.isFinite(u[k]) && u[k]>=0;
    if(!['since','baseline','ruralBase','lastMonth','nextId','cooldown','electionOffset'].every(finite) || u.baseline<1 || u.lastMonth>s.month || !Number.isInteger(u.nextId))return false;
    if(!Array.isArray(u.milestones)||u.milestones.length>4||new Set(u.milestones).size!==u.milestones.length||u.milestones.some(id=>!MILESTONES.some(m=>m.id===id)))return false;
    if(!Array.isArray(u.pacts)||u.pacts.length>4||new Set(u.pacts.map(p=>p.id)).size!==u.pacts.length||u.pacts.some(p=>!PACTS.some(d=>d.id===p.id)||!['active','won','lost'].includes(p.status)||!Number.isInteger(p.kept)||p.kept<0||p.kept>3||!['base','from','until'].every(k=>Number.isFinite(p[k])&&p[k]>=0)))return false;
    if(!Array.isArray(u.megas)||u.megas.length>3||new Set(u.megas.map(p=>p.id)).size!==u.megas.length||u.megas.some(p=>!MEGAS.some(d=>d.id===p.id)||!Number.isInteger(p.stage)||p.stage<0||p.stage>3||!Number.isInteger(p.due)||p.due<0||!Number.isFinite(p.paid)||p.paid<0))return false;
    if(!Array.isArray(u.elections)||u.elections.length>300||u.elections.some(p=>!Number.isInteger(p.month)||p.month<0||p.month>s.month||!Number.isFinite(p.support)||p.support<0||p.support>100||typeof p.won!=='boolean'))return false;
    if(!Array.isArray(u.polls)||u.polls.length>6||u.polls.some(p=>!Number.isInteger(p.month)||p.month>s.month||!Number.isFinite(p.value)||p.value<0||p.value>100))return false;
    if(!Array.isArray(u.notices)||u.notices.length>20||u.notices.some(n=>typeof n.id!=='string'||typeof n.title!=='string'||typeof n.body!=='string'||n.body.length>2000))return false;
    if(!Array.isArray(u.reports)||u.reports.length>12||u.reports.some(r=>!['month','net','cash','passengers','punctuality','support','active','orders'].every(k=>Number.isFinite(r[k]))||!Array.isArray(r.news)))return false;
    if(!Array.isArray(u.bailouts)||u.bailouts.length>1200||u.bailouts.some(x=>!Number.isInteger(x.month)||!Number.isFinite(x.amount)||x.amount<0))return false;
    if(u.scandal && (!['from','amount','delay','stage'].every(k=>Number.isFinite(u.scandal[k])&&u.scandal[k]>=0)||typeof u.scandal.exposed!=='boolean'))return false;
    return typeof u.rescueStarted==='boolean' && typeof u.rescueWon==='boolean' && (!u.legacy || u.legacy.source==='tenfe-rescate-v1');
  }
