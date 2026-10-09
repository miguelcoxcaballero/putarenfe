// Complementary browser QA: corridor stages 2/3, commercial investment,
// sustained monthly progress, exact save/load, mobile controls. Fixtures are
// legacy started campaigns produced with legal engine actions, never TTS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as E from './dist/engine.js';
import * as T from './dist/tycoon.js';
import * as O from './dist/operations.js';
import {MODEL} from './dist/data.js';
import {freshInduction,inductionBriefing} from './dist/induction-runtime.js';
import {INDUCTION_STAGES} from './dist/induction.js';
import {focusedTaskHTML} from './dist/induction-task-ui.js';
import {tycoonPage} from './dist/tycoon-ui.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const modulePath=process.env.PLAYWRIGHT_MODULE||'playwright';
const url=process.env.GAME_URL||pathToFileURL(path.join(root,'../outputs/Iberia-Ferroviaria.html')).href;
const folder=process.env.GAMEPLAY_SCREENSHOTS||path.join(root,'../investigacion/verificacion-3.6.2-contratos');
const SAVE_KEY='iberia-ferroviaria-v2';
fs.mkdirSync(folder,{recursive:true});
const action=(s,fn)=>{try{fn();return true;}catch{return false;}};
function decisions(s){for(let d;(d=E.pendingDecision(s));){const i=d.choices.findIndex(c=>!c.disabled&&s.cash>=-(c.effects?.cash||0));assert(i>=0);E.decide(s,d.id,i);}}
function configure(s,id,frequency,fare){const r=s.routes.find(x=>x.id===id),f=s.fleet.find(f=>f.condition>=30&&E.canRun(s,r,MODEL[f.model])&&E.available(s,f,r.id)>=E.requiredUnits(s,r,MODEL[f.model],frequency));assert(f,'compatible free fleet in legal fixture');E.configureRoute(s,r.id,f.id,frequency,fare);}
function prepare(s,q,branch){
 const d=T.contractDetails(s,q,branch,r=>E.metrics(s,r));
 for(const x of d.requirements){const r=s.routes.find(r=>r.id===x.id);if(x.kind==='active'&&!x.done)configure(s,r.id,2,r.fare);if(x.kind==='frequency'&&!x.done)configure(s,r.id,x.target,r.fare);if(x.kind==='fare'&&!x.done)configure(s,r.id,r.frequency,x.target);if(x.kind==='station'&&!x.done)E.upgradeStation(s,x.id);if(x.kind==='level'&&!x.done&&!s.projects.some(p=>p.route===r.id&&!p.done))E.upgradeRoute(s,r.id);}
 if(branch==='commercial'){const r=s.routes.find(r=>r.id===q.project.route);if(r.active){const candidates=[15,20,25,30,40,50,65,80,100].map(fare=>({fare,m:E.metrics(s,r,{fare})})).filter(x=>d.requirements.filter(x=>['margin','occupancy','punctuality'].includes(x.kind)).every(req=>req.kind==='margin'?x.m.revenue>0&&x.m.net/x.m.revenue>=req.target:req.kind==='occupancy'?x.m.occupancy>=req.target:x.m.punctuality>=req.target)).sort((a,b)=>b.m.net-a.m.net);if(candidates[0])configure(s,r.id,r.frequency,candidates[0].fare);}}
}
function fixture(branch,stage){
 const s=E.initialState();s.started=true;O.ensureOps(s);decisions(s);T.accept(s,s.tycoon.contracts.find(q=>q.status==='offered').id,branch);
 for(let n=0;n<80;n++){
  decisions(s);const offered=s.tycoon.contracts.find(q=>q.status==='offered');
  if(offered?.goal==='project'&&offered.project.stage===stage)return E.validateSave(s);
  if(offered)T.accept(s,offered.id,branch);
  const active=s.tycoon.contracts.find(q=>q.status==='active');if(active?.goal==='project')prepare(s,active,branch);
  assert(O.skipMonth(s));
 }
 throw Error('Could not construct the requested legal corridor fixture.');
}
function pausedHandoffFixture(){
 const s=E.initialState();s.started=true;O.ensureOps(s);decisions(s);
 s.tutorial={...freshInduction(s),step:8,phase:'task',suspended:true};
 for(let month=0;month<18;month++){decisions(s);assert(O.skipMonth(s));}
 decisions(s);assert.equal(s.month,18);
 assert(s.tycoon.resolved.some(q=>q.result==='declined'&&q.month===18),'unaccepted first offer actually expired');
 const q=s.tycoon.contracts.find(q=>q.status==='offered');assert.equal(q.goal,'project');
 return E.validateSave(s);
}
const fixtures={'public-2':fixture('public',2),'public-3':fixture('public',3),'commercial-2':fixture('commercial',2),'paused-handoff':pausedHandoffFixture()};
// Pure rendering regressions run without Playwright/Chromium or neural imports.
const paused=fixtures['paused-handoff'],future=paused.tycoon.contracts.find(q=>q.status==='offered');
const handoffHTML=focusedTaskHTML(paused,paused.tutorial);
assert.deepEqual(inductionBriefing(paused,INDUCTION_STAGES[8]),[INDUCTION_STAGES[8].briefing[2]],'future induction uses its existing generic recording');
assert.equal((handoffHTML.match(/data-branch=/g)||[]).length,2,'future induction displays two actual plans');
assert(!/undefined|NaN/.test(handoffHTML),'expired induction never renders undefined values');
for(const branch of ['public','commercial']){
 const d=T.contractDetails(paused,future,branch,r=>E.metrics(paused,r));
 assert.equal(d.months,24);assert(handoffHTML.includes(`${d.months} meses desde la firma`));
 assert(handoffHTML.includes(`Premio: ${d.reward} M€`),'future reward comes from actual branch');
 for(const req of d.requirements)assert(handoffHTML.includes(req.label),'future branch requirements are visible');
}
const activeCommercial=structuredClone(fixtures['commercial-2']);
const commercialOffer=activeCommercial.tycoon.contracts.find(q=>q.status==='offered');T.accept(activeCommercial,commercialOffer.id,'commercial');
const activeHTML=tycoonPage(activeCommercial,'agenda');
assert.match(activeHTML,/Margen del servicio/);assert.match(activeHTML,/Ocupación de plazas/);assert.match(activeHTML,/Nivel de servicio/);
assert(!activeHTML.includes('Tarifa máxima'),'active commercial does not fall back to the public fare plan');
assert(!activeHTML.includes('Servicio preparado.'),'unfinished service work is not advertised as prepared');
const signedFuture=structuredClone(paused);T.accept(signedFuture,future.id,'commercial');
assert(!/18 M€|26 M€|25\s*%|18 meses/.test(focusedTaskHTML(signedFuture,signedFuture.tutorial)),'future strategy does not advertise initial contract figures');
if(process.env.CONTRACT_FIXTURES_ONLY){
 console.log('PASS legal corridor fixtures, commercial branch rendering and paused induction after18months: actual two plans/24month deadlines/rewards/no undefined.');
}else{
const {chromium}=await import(modulePath.startsWith('/')?pathToFileURL(modulePath).href:modulePath);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const errors=[],results=[];
const snapshot=page=>page.evaluate(()=>window.railwayGame.snapshot());
const shot=(page,name)=>page.screenshot({path:path.join(folder,name),animations:'disabled',timeout:60000});
async function staticMap(page){
 if(!process.env.QA_STATIC_MAP)return;
 await page.addInitScript(()=>{
  const timer=setInterval(()=>{
   const g=window.railwayGame,m=g?.map;if(!m)return;clearInterval(timer);
   const original=m.opts.isVisible;let previous;
   m.opts.isVisible=()=>{
    if(original?.()===false)return false;
    const s=g.state(),op=s.ops;
    const key=[m.layer,m.selected,m.selectedCity,m.selectedTramo,m.zoom,m.pan.x,m.pan.y,m.w,m.h,s.month,s.infra.ver,op.phase,op.day,op.incidents.length,op.resolved.length,s.projects.filter(p=>!p.done).length,s.routes.map(r=>[r.id,r.active,r.frequency,r.fleet,r.level].join(':')).join('|')].join('#');
    if(key===previous)return false;previous=key;return true;
   };
  },100);
 });
}
async function reachable(page,selector){const button=page.locator(selector).first();assert(await button.isVisible(),selector+' visible');assert(await button.isEnabled(),selector+' enabled');await button.scrollIntoViewIfNeeded();assert(await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit);}),selector+' unobstructed');await button.click();}
async function resolveDecisions(page){for(let n=0;n<8;n++){const s=await snapshot(page),d=E.pendingDecision(s);if(!d)return;const index=d.choices.findIndex(c=>!c.disabled&&s.cash>=-(c.effects?.cash||0));assert(index>=0);await reachable(page,`#modal [data-action=decision][data-id="${d.id}"][data-choice="${index}"]`);}throw Error('Decision queue did not terminate');}
async function agenda(page){const visible=await page.evaluate(()=>document.querySelector('#navigation [data-screen=story]')?.getAttribute('aria-current')==='page'&&!document.getElementById('drawer').classList.contains('hidden'));if(!visible)await reachable(page,'#navigation [data-action=navigate][data-screen=story]');if(await page.locator('#drawer [data-action=office-tab][data-id=tycoon]').count())await reachable(page,'#drawer [data-action=office-tab][data-id=tycoon]');await reachable(page,'#drawer [data-action=tycoon-tab][data-id=agenda]');}
async function openFixture(context,id){const page=await context.newPage();await staticMap(page);page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);page.on('pageerror',e=>errors.push(id+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(id+': '+m.text());});await context.route('**/favicon.ico',r=>r.fulfill({status:204}));await page.addInitScript(({key,state,marker})=>{if(!sessionStorage.getItem(marker)){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem(marker,'1');}},{key:SAVE_KEY,state:fixtures[id],marker:'qa-contract-fixture-'+id});await page.goto(url);await page.waitForFunction(()=>Boolean(window.railwayGame));await page.evaluate(()=>{window.railwayGame.voices.enabled=false;});await reachable(page,'[data-action=continue]');await resolveDecisions(page);await agenda(page);return page;}
async function accept(page,branch){const before=await snapshot(page),q=before.tycoon.contracts.find(q=>q.status==='offered');await reachable(page,`#drawer [data-action=tycoon-${branch}][data-id="${q.id}"]`);const after=await snapshot(page),accepted=after.tycoon.contracts.find(x=>x.id===q.id);assert.equal(after.cash,before.cash,'signing does not pay the reward');assert.equal(accepted.branch,branch);assert.equal(accepted.until,after.month+24);return accepted;}
async function delegationSelector(page){
 for(const selector of ['#drawer .contract-next [data-action=skip-month]','#drawer .calendar-plan [data-action=skip-month]','#daybar [data-action=skip-month]']){
  if(await page.locator(selector).count()&&await page.locator(selector).first().isVisible())return selector;
 }
 throw Error('No visible way to delegate the real month');
}
async function preparedState(page,q){
 const s=await snapshot(page),actual=s.tycoon.contracts.find(x=>x.id===q.id),details=T.contractDetails(s,actual,actual.branch,r=>E.metrics(s,r));
 assert.equal(await page.locator('#drawer .contract-next [data-action=skip-month]').count(),details.requirements.every(x=>x.done)?1:0,'prepared control follows actual fulfilled requirements');
 const selector=await delegationSelector(page),button=page.locator(selector).first();assert(await button.isEnabled(),'a real month can still advance while investments finish');
 await button.scrollIntoViewIfNeeded();assert(await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===hit||el.contains(hit);}),'real month delegation unobstructed');
}
async function commercialPlan(page,q,withLevel=true){
 const list=page.locator('#drawer .tycoon-contract.live .contract-content > .contract-requirements');assert.equal(await list.count(),1);
 const text=await list.textContent();assert.match(text,/Margen del servicio/);assert.match(text,/Ocupación de plazas/);if(withLevel)assert.match(text,/Nivel de servicio/);
 assert(!text.includes('Tarifa máxima'),'commercial acceptance keeps commercial requirements');
 await preparedState(page,q);
}
async function buyServiceWork(page,q){
 const before=await snapshot(page),r=before.routes.find(x=>x.id===q.project.route);
 await page.evaluate(id=>window.railwayGame.selectRoute(id),r.id);await reachable(page,`[data-action=upgrade][data-id="${r.id}"]`);
 const after=await snapshot(page);assert.equal(after.cash,before.cash-(12+12*r.level));assert.equal(after.routes.find(x=>x.id===r.id).level,r.level,'paying does not finish a delayed service upgrade');
 assert(after.projects.some(p=>p.route===r.id&&!p.done),'actual service work is queued');await agenda(page);await preparedState(page,q);return after;
}
async function resumedFutureHandoff(page){
 const before=await snapshot(page),q=before.tycoon.contracts.find(x=>x.status==='offered');assert(before.tutorial.suspended);assert.equal(q.goal,'project');
 await reachable(page,'[data-action=help]');await reachable(page,'#modal [data-action=tutorial-start]');
 await page.waitForSelector('#coach[data-step-id=handoff]');assert.equal((await snapshot(page)).tutorial.suspended,false);
 await reachable(page,'#coach [data-action=tutorial-skip]');
 const suspended=await snapshot(page);assert(suspended.tutorial.suspended);assert.equal(suspended.tutorial.step,8);assert.equal(suspended.tutorial.phase,'task');
 await reload(page);assert((await snapshot(page)).tutorial.suspended,'Continue preserves an explicitly paused guide after reload');
 assert.equal(await page.locator('#coach').count(),0);assert.equal(await page.locator('#modal[open] .induction-dialog').count(),0);
 await reachable(page,'[data-action=help]');await reachable(page,'#modal [data-action=tutorial-start]');
 await page.waitForSelector('#coach[data-step-id=handoff]');assert.equal((await snapshot(page)).tutorial.suspended,false,'Help resumes at the saved task');
 assert.equal(await page.locator('#coach [data-action=tutorial-advice]').count(),0,'numeric initial-contract advice is unavailable for a later project');
 const cards=page.locator('#coach .lesson-contracts [data-branch]');assert.equal(await cards.count(),2);assert(!/undefined|NaN/.test(await cards.allTextContents().then(x=>x.join(' '))));
 for(const branch of ['public','commercial']){
  const d=T.contractDetails(before,q,branch,r=>E.metrics(before,r)),card=page.locator(`#coach [data-branch=${branch}]`);
  assert.match(await card.textContent(),/24 meses desde la firma/);assert((await card.textContent()).includes(`Premio: ${d.reward} M€`));
 }
 await reachable(page,`#coach [data-action=tycoon-commercial][data-id="${q.id}"]`);
 const after=await snapshot(page),accepted=after.tycoon.contracts.find(x=>x.id===q.id);assert.equal(after.cash,before.cash);assert.equal(accepted.branch,'commercial');assert.equal(accepted.reward,q.project.branches.commercial.reward);assert.equal(accepted.until,after.month+24);
 const strategy=await page.locator('#coach .induction-question').textContent();assert.match(strategy,/plan comercial firmado/);assert(!/18 M€|26 M€|25\s*%|18 meses/.test(strategy),'actual resumed strategy omits initial rewards and percentages');
 assert.equal(await page.locator('#coach [data-action=tutorial-advice]').count(),0);
 await reachable(page,'#coach [data-action=tutorial-skip]');await agenda(page);await commercialPlan(page,accepted,false);return accepted;
}
async function delegate(page){const before=await snapshot(page);await agenda(page);await reachable(page,await delegationSelector(page));await page.waitForFunction(m=>window.railwayGame.snapshot().month===m+1,before.month);await resolveDecisions(page);return snapshot(page);}
async function reload(page){const expected=await snapshot(page);await page.reload();await page.waitForFunction(()=>Boolean(window.railwayGame));await page.evaluate(()=>{window.railwayGame.voices.enabled=false;});await reachable(page,'[data-action=continue]');assert.deepEqual(await snapshot(page),expected,'reload preserves the actual complete save');await agenda(page);}
async function routePlan(page,id,frequency,fare){let state=await snapshot(page),r=state.routes.find(r=>r.id===id),f=state.fleet.find(f=>f.condition>=30&&E.canRun(state,r,MODEL[f.model])&&E.available(state,f,r.id)>=E.requiredUnits(state,r,MODEL[f.model],frequency));assert(f,'legal available train in UI');await page.evaluate(id=>window.railwayGame.selectRoute(id),id);await page.selectOption('#routeFleet',f.id);await page.locator('#frequency').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},frequency);await page.fill('#fare',String(fare));const quote=await page.locator('#routePreview').textContent();assert(/Previsión|previsión/.test(quote));await page.waitForTimeout(350);assert.equal(await page.locator('#fare').inputValue(),String(fare),'input draft stable across render frame');await reachable(page,'#routeForm [type=submit]');state=await snapshot(page);r=state.routes.find(r=>r.id===id);assert(r.active);assert.equal(r.frequency,frequency);assert.equal(r.fare,fare);await agenda(page);}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 // A paid station investment, one actual close, reload at streak1, then finish.
 const page=await openFixture(context,'public-2');let q=await accept(page,'public');let state=await snapshot(page);const station=q.project.branches.public.requirements.find(x=>x.kind==='station');assert(station,'stage2 has a real station investment');const before=state.cash,cost=E.stationCost(state,station.id);await reachable(page,`#drawer .contract-requirements [data-action=city][data-id="${station.id}"]`);await reachable(page,`[data-action=station-up][data-id="${station.id}"]`);state=await snapshot(page);assert.equal(state.cash,before-cost);assert.equal(state.stations[station.id],station.target);await agenda(page);await shot(page,'01-publica-etapa-2-inversion.png');state=await delegate(page);assert.equal(state.tycoon.contracts.find(x=>x.id===q.id).project.streak,1);await reload(page);await delegate(page);state=await delegate(page);assert(state.tycoon.resolved.some(x=>x.stage===2&&x.result==='won'));assert(state.tycoon.contracts.some(x=>x.status==='offered'&&x.project?.stage===3));results.push('Public stage2: real station cost, three closes, streak1 reload, next stage immediately offered.');await page.close();
 // Stage3 requires another real connection; break one departure to reset streak.
 const third=await openFixture(context,'public-3');q=await accept(third,'public');const reqs=q.project.branches.public.requirements;const link=q.project.link;assert(link);state=await snapshot(third);const linked=state.routes.find(r=>r.id===link),frequency=reqs.find(x=>x.kind==='frequency'&&x.id===link).target,beforeOpen=state.cash;await routePlan(third,link,frequency,linked.fare);state=await snapshot(third);if(!linked.active)assert.equal(state.cash,beforeOpen-4);state=await delegate(third);assert.equal(state.tycoon.contracts.find(x=>x.id===q.id).project.streak,1);await reload(third);await routePlan(third,link,frequency-1,linked.fare);state=await delegate(third);assert.equal(state.tycoon.contracts.find(x=>x.id===q.id).project.streak,0);await routePlan(third,link,frequency,linked.fare);await delegate(third);await delegate(third);state=await delegate(third);assert(state.tycoon.resolved.some(x=>x.stage===3&&x.result==='won'));await shot(third,'02-corredor-completo.png');results.push('Public stage3: real second route, frequency interruption resets continuity, save/reload and completion.');await third.close();
 // Commercial stage2 requires a delayed service upgrade, not the station branch.
 const commercial=await openFixture(context,'commercial-2');q=await accept(commercial,'commercial');await commercialPlan(commercial,q);state=await buyServiceWork(commercial,q);for(let i=0;i<2;i++){state=await delegate(commercial);assert.equal(state.tycoon.contracts.find(x=>x.id===q.id).project.streak,0);}await reload(commercial);for(let i=0;i<10&&!state.tycoon.resolved.some(x=>x.stage===2&&x.branch==='commercial');i++)state=await delegate(commercial);assert(state.tycoon.resolved.some(x=>x.stage===2&&x.branch==='commercial'&&x.result==='won'));results.push('Commercial stage2: correct margin/occupancy/level branch, real upgrade cost, delayed work does not count early, reload and sustained profitable service.');await shot(commercial,'03-comercial-inversion-y-plazo.png');await commercial.close();
 const futurePage=await openFixture(context,'paused-handoff');await resumedFutureHandoff(futurePage);await shot(futurePage,'04-guia-retomada-encargo-posterior.png');results.push('Paused induction: real pause/reload/Continue stays suspended; Help resumes, expired first offer shows actual future rewards/24months, strategy omits initial figures and numeric advice is hidden.');await futurePage.close();await context.close();
 for(const width of [390,320]){const mobile=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});for(const id of ['public-2','public-3','commercial-2','paused-handoff']){
  const phone=await openFixture(mobile,id);assert(await phone.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),id+' no horizontal overflow at'+width);
  if(id==='paused-handoff')await resumedFutureHandoff(phone);
  else{const branch=id.startsWith('commercial')?'commercial':'public',q=await accept(phone,branch);if(branch==='commercial'){await commercialPlan(phone,q);await buyServiceWork(phone,q);}await preparedState(phone,q);}
  await shot(phone,`${id}-${width}.png`);await phone.close();
 }await mobile.close();}
 assert.deepEqual(errors,[]);console.log('PASS corridor browser progression: '+results.join(' '));fs.writeFileSync(path.join(folder,'resultado.json'),JSON.stringify({passed:true,results,mobileWidths:[390,320],errors,humanListening:false},null,2));
}finally{await browser.close();}
}
