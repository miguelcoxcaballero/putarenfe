import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './dist/engine.js';
import * as U from './dist/tenfe.js';
import * as O from './dist/operations.js';
import * as T from './dist/tycoon.js';
import * as M from './dist/marketplace.js';
import * as N from './dist/nueva-partida.js';
import * as R from './dist/rescate.js';
import * as Legacy from './dist/partidas-anteriores.js';
import {MODEL} from './dist/data.js';
(function(){
  const fresh=()=>{const s=E.initialState(42);U.begin(s,{difficulty:'relajada'});s.started=true;s.tutorial={done:true};s.cash=10000;return s;};
  const clear=s=>{let guard=0;for(let d;(d=E.pendingDecision(s));){if(++guard>500)throw Error('Bucle de decisiones');const i=d.choices.findIndex(c=>!c.disabled&&(c.cost||0)<=s.cash);E.decide(s,d.id,Math.max(0,i));}};
  const month=s=>{clear(s);assert(O.skipMonth(s));return s;};
  const valid=s=>E.validateSave(JSON.parse(JSON.stringify(s)));
  const checks=[];
  {
    const s=fresh();assert.equal(s.routes.filter(r=>r.active).length,8);assert(s.fleet.some(f=>f.model==='r465'));
    const r=s.routes.find(r=>r.id==='madrid-soria');
    assert(E.canRun(s,r,MODEL.r599),'diésel regional llega a Soria');
    assert(!E.canRun(s,r,MODEL.r465),'Civia necesita catenaria');
    assert(!E.canRun(s,s.routes.find(r=>r.id==='madrid-barcelona'),MODEL.r465),'ancho ibérico no entra en una LAV');
    const north=s.routes.find(r=>r.id==='regional-norte');assert(E.canRun(s,north,MODEL.r465),'regional ibérico puede usar el Norte convencional');
    const f=s.fleet.find(f=>f.model==='r599');E.configureRoute(s,r.id,f.id,1,12);
    assert.equal(E.product(s,r),'Regional');assert(O.servicePlan(s).some(t=>t.route===r.id),'el regional circula en la misma jornada');
    assert(valid(s));
    checks.push('AVE, Alvia y regionales comparten red, flota, horarios y guardado; ancho y catenaria se respetan.');
  }
  {
    const s=fresh(),items=M.listings(s).filter(x=>MODEL[x.model].family==='Regional');
    assert(items.some(x=>x.maker==='BCBB'));assert(items.some(x=>x.maker==='Dörfler'));
    const item=items.find(x=>x.state==='new'&&x.model==='r599'),q=E.purchaseQuote(s,item.model,2,item.id);
    assert.equal(q.lead,5);assert.equal(q.depositRate,.3);
    const cash=s.cash;E.buy(s,item.model,2,item.id);assert(Math.abs(cash-s.cash-q.deposit)<1e-9);
    const html=M.catalogueHTML(s,{query:'',state:'all',delivery:'all',maker:'all',family:'Regional',sort:'price',favorites:false,route:''},(model,qty,id)=>E.purchaseQuote(s,model,qty,id),id=>'<span>'+id+'</span>');
    assert(html.includes('Trenespop'));assert(html.includes('BCBB'));assert(valid(s));
    checks.push('Trenespop vende regionales de las dos marcas y conserva depósitos, plazos y stock.');
  }
  {
    const s=fresh();s.tenfe.baseline=100000;
    month(s);assert(s.tenfe.milestones.length>=1);
    const cash=s.cash;U.tick(s,s.last);assert.equal(s.cash,cash,'mismo cierre no paga dos veces');assert(valid(s));
    U.signPact(s,'investigacion');const techBase=s.tycoon.tech.length;
    T.research(s,'online');for(let i=0;i<4;i++)month(s);
    assert.equal(s.tycoon.tech.length,techBase+1);assert.equal(s.tenfe.pacts.find(p=>p.id==='investigacion').status,'won');
    assert(valid(s));checks.push('Hitos y pactos se cobran una sola vez y se comprueban al terminar la investigación real.');
  }
  {
    const s=fresh();s.tenfe.milestones=['andenes','regional'];
    U.startMega(s,'control');assert.throws(()=>U.startMega(s,'taller'),/ocupada/);
    for(let i=0;i<2;i++)month(s);assert.equal(s.tenfe.megas[0].stage,1);
    U.startMega(s,'control');for(let i=0;i<3;i++)month(s);
    U.startMega(s,'control');for(let i=0;i<4;i++)month(s);
    assert.equal(U.effects(s).quality,3);assert.equal(s.tenfe.megas[0].paid,86);assert(valid(s));
    const clone=JSON.parse(JSON.stringify(s));clone.tenfe.megas[0].stage=9;assert.throws(()=>valid(clone),/unificada/);
    checks.push('Megaproyectos: permisos, obra y pruebas; recursos exclusivos, fechas, efecto real y validación del guardado.');
  }
  {
    const s=fresh(),cash=s.cash;U.shortcut(s);assert.equal(s.cash,cash+45);
    U.selfReport(s);assert.equal(s.cash,cash);assert.equal(s.tenfe.scandal,null);assert.throws(()=>U.shortcut(s),/revisión/);
    s.tenfe.cooldown=0;U.shortcut(s);for(let i=0;i<6;i++)month(s);assert(s.tenfe.scandal.exposed);
    assert(s.tenfe.notices.some(x=>x.kind==='escandalo'));assert(valid(s));
    checks.push('Cloacas causales: dinero recibido, restitución, enfriamiento y una inspección con consecuencias.');
  }
  {
    const s=fresh();s.month=107;s.tenfe.lastMonth=107;
    for(const key of Object.keys(s.tycoon.groups))s.tycoon.groups[key]=80;
    s.tenfe.polls=Array.from({length:5},(_,i)=>({month:103+i,value:80}));
    month(s);assert.equal(s.month,108);assert.equal(s.tenfe.elections.length,1);assert(s.tenfe.elections[0].won);
    const json=JSON.stringify(valid(s));const replay=E.validateSave(JSON.parse(json));U.tick(replay,replay.last);
    assert.equal(replay.tenfe.elections.length,1,'recargar no cambia ni repite la elección');
    const lose=fresh();lose.month=107;lose.tenfe.lastMonth=107;lose.tenfe.difficulty='normal';
    lose.tenfe.polls=Array.from({length:5},(_,i)=>({month:103+i,value:10}));
    for(const key of Object.keys(lose.tycoon.groups))lose.tycoon.groups[key]=10;
    month(lose);assert.equal(lose.ending,'election');assert(lose.ended);
    checks.push('Votos de seis meses, victoria y derrota; la elección no se vuelve a tirar al cargar.');
  }
  {
    const old=R.newGame(42),converted=Legacy.convertLegacy(old);
    assert.equal(converted.cash,old.cash*30);assert.equal(converted.fleet.length,old.fleet.length);
    assert(converted.tenfe.legacy.raw.corridors.norte);assert.deepEqual(converted.tenfe.legacy.raw,old);
    assert.equal(converted.routes.filter(r=>r.active).length,3);assert(valid(converted));
    const win=R.newGame(42);win.week=417;win.elections=[{week:208,vote:62,won:true},{week:416,vote:61,won:true}];
    const result=Legacy.convertLegacy(win);assert.equal(result.month,156);assert.equal(result.tenfe.elections.length,2);assert(valid(result));
    checks.push('Rescate anterior se convierte al motor común con caja, deuda, material, servicios, votos y copia íntegra exportable.');
  }
  {
    const s=fresh();s.month=59;s.tenfe.lastMonth=59;month(s);
    assert(s.tenfe.rescueStarted);assert.equal(s.month,60);assert(s.tenfe.notices.some(x=>x.kind==='rescate'));assert(valid(s));
    assert.equal(N.STARTS.length,1);assert(!N.newGameHTML().includes('np-pick'));assert(!N.newGameHTML().includes('Maqueta'));
    assert(U.nextAction(s).action);assert(!fs.readFileSync('./dist/app.js','utf8').includes('mountRescue'));
    const builder=fs.readFileSync('../tools/extract-game-source.mjs','utf8');assert(!builder.includes("'rescate-ui.js'"));
    checks.push('Una sola nueva partida y continuidad en 2027; el motor y la interfaz antiguos quedan fuera de la publicación.');
  }
  console.log(JSON.stringify({status:'passed',checks},null,2));
})();
